import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { randomUUID } from 'crypto';
import { AuthConfig, Config, ProjectNetworkConfig } from '../utils/config';
import { randomStrongPassword } from '../utils/crypto';
import { isConflictError, formatErrorMessage, type Spinner } from '../utils/errors';
import { sleep } from '../utils/runtime';
import { resolveSdkCtor } from '../utils/sdk';
import { ensureDefaultNetwork, resolveProvidedNetwork } from './vpc';

const REDIS_WAIT_TIMEOUT_MS = 20 * 60 * 1000;
const REDIS_WAIT_INTERVAL_MS = 5000;
const REDIS_MISSING_INSTANCE_GRACE_MS = 60 * 1000;
const REDIS_BIND_WAIT_TIMEOUT_MS = 3 * 60 * 1000;
const DEFAULT_TAIR_KVCACHE_CLASS = 'kvcache.cu.g4b.2';
const DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT = 1;
const RedisClientCtor = resolveSdkCtor<Kvstore>(Kvstore, '@alicloud/r-kvstore20150101');
const RpcClientCtor = resolveSdkCtor<$OpenApi.default>($OpenApi.default, '@alicloud/openapi-client');

interface TairKVCacheInstanceSummary {
  instanceId?: string;
  instanceType?: string;
  instanceStatus?: string;
  instanceName?: string;
  vpcId?: string;
  vSwitchId?: string;
  zoneId?: string;
}

interface ParsedRedisConnection {
  host: string;
  port: number;
  accountName?: string;
  password?: string;
  url: string;
}

interface ResolvedRedisEndpoint extends ParsedRedisConnection {
  sourceInstanceId: string;
}

export interface ProvisionRedisOptions {
  instanceId?: string;
  existingPassword?: string;
  accountName?: string;
  engineVersion?: string;
  instanceClass?: string;
  nodeType?: string;
  capacityMb?: number;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
  securityIpList?: string;
  vkName?: string;
  computeUnitNum?: number;
}

export interface CacheInstanceSummary {
  instanceId: string;
  mode: 'classic-redis' | 'tair-serverless-kv';
  instanceName?: string;
  status?: string;
  instanceClass?: string;
  engineVersion?: string;
  host?: string;
  port?: number;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
}

export interface CacheInstanceDetail {
  summary: CacheInstanceSummary;
  accountNames: string[];
}

export interface CacheConnectInfo {
  instanceId: string;
  host: string;
  port: number;
  username?: string;
  passwordKnown: boolean;
  connectionString: string;
  mode: 'classic-redis' | 'tair-serverless-kv';
}

function isTerminalErrorStatus(status: string) {
  return ['Error', 'Released', 'Inactive', 'Unavailable', 'Flushing'].includes(status);
}

function createRedisClient(auth: AuthConfig) {
  return new RedisClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region
  }));
}

function createKvstoreRpcClient(auth: AuthConfig) {
  return new RpcClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region,
    endpoint: 'r-kvstore.aliyuncs.com'
  }));
}

function toRpcQueryValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function toRpcQuery(query: Record<string, unknown>) {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const normalized = toRpcQueryValue(value);
    if (normalized === undefined) continue;
    output[key] = normalized;
  }
  return output;
}

async function callKvstoreRpc(
  auth: AuthConfig,
  action: string,
  query: Record<string, unknown>
) {
  const client = createKvstoreRpcClient(auth);
  const params = new $OpenApi.Params({
    action,
    version: '2015-01-01',
    protocol: 'HTTPS',
    pathname: '/',
    method: 'POST',
    authType: 'AK',
    style: 'RPC',
    reqBodyType: 'formData',
    bodyType: 'json'
  });
  const request = new $OpenApi.OpenApiRequest({
    query: toRpcQuery(query)
  });
  return client.callApi(
    params,
    request,
    new $Util.RuntimeOptions({ readTimeout: 20_000, connectTimeout: 8_000 })
  );
}

function formatRedisUrl(accountName: string | undefined, password: string, host: string, port: number) {
  if (!accountName) return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  return `redis://${encodeURIComponent(accountName)}:${encodeURIComponent(password)}@${host}:${port}`;
}

function formatRedisUrlWithMask(
  accountName: string | undefined,
  password: string,
  host: string,
  port: number,
  passwordKnown: boolean
) {
  const passwordSegment = passwordKnown ? encodeURIComponent(password) : '<password>';
  if (!accountName) return `redis://:${passwordSegment}@${host}:${port}`;
  const encodedUser = accountName === '<username>' ? accountName : encodeURIComponent(accountName);
  return `redis://${encodedUser}:${passwordSegment}@${host}:${port}`;
}

function getErrorCode(err: unknown) {
  if (typeof err !== 'object' || err === null) return '';
  const direct = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  if (direct) return direct;
  if ('data' in err && typeof (err as { data?: unknown }).data === 'object' && (err as { data?: unknown }).data !== null) {
    const dataCode = ((err as { data?: Record<string, unknown> }).data?.Code);
    if (dataCode) return String(dataCode);
  }
  return '';
}

function getErrorRequestId(err: unknown) {
  if (typeof err !== 'object' || err === null) return '';
  if ('data' in err && typeof (err as { data?: unknown }).data === 'object' && (err as { data?: unknown }).data !== null) {
    const requestId = ((err as { data?: Record<string, unknown> }).data?.RequestId);
    if (requestId) return String(requestId);
  }
  return '';
}

function isMissingInstanceError(err: unknown) {
  return /InvalidInstanceId\.NotFound/i.test(getErrorCode(err) || formatErrorMessage(err));
}

function isIgnorableSecurityIpError(err: unknown) {
  const text = `${getErrorCode(err)} ${formatErrorMessage(err)}`;
  return /NotSupport|Unsupported|InvalidInstanceId|InvalidParameter|OperationDenied|AccessDenied/i.test(text);
}

function uniqNonEmpty(values: Array<string | undefined>) {
  const dedup = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim();
    if (normalized) dedup.add(normalized);
  }
  return [...dedup];
}

function parseRedisConnectionString(connectionString?: string): ParsedRedisConnection | null {
  const raw = (connectionString || '').trim();
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  if (!first) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(first) ? first : `redis://${first}`;
  try {
    const parsed = new URL(withScheme);
    const host = parsed.hostname;
    if (!host) return null;
    const port = parsed.port ? Number(parsed.port) : 6379;
    if (!Number.isFinite(port) || port <= 0) return null;
    const accountName = parsed.username ? decodeURIComponent(parsed.username) : undefined;
    const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
    const url = parsed.toString();
    return { host, port, accountName, password, url };
  } catch {
    return null;
  }
}

async function resolveRedisAccountName(
  redisClient: Kvstore,
  instanceId: string,
  fallback?: string
) {
  const accountsRes = await redisClient.describeAccounts(new $Kvstore.DescribeAccountsRequest({ instanceId }));
  const accounts = accountsRes.body?.accounts?.account || [];
  const available = accounts.filter((account) => account.accountStatus !== 'Unavailable');
  const preferred =
    available.find((account) => account.accountType === 'Normal')
    || available[0]
    || accounts[0];
  return preferred?.accountName || fallback || '';
}

async function ensureKvstoreServiceLinkedRole(redisClient: Kvstore, regionId: string, spinner: Spinner) {
  try {
    const existsRes = await redisClient.describeServiceLinkedRoleExists(new $Kvstore.DescribeServiceLinkedRoleExistsRequest({}));
    if (existsRes.body?.existsServiceLinkedRole) return;
    spinner.message('🔐 正在初始化 Kvstore 服务关联角色...');
    await redisClient.initializeKvstorePermission(new $Kvstore.InitializeKvstorePermissionRequest({ regionId }));
  } catch (err: unknown) {
    spinner.message(`⚠️ 服务关联角色检查失败 (${formatErrorMessage(err)})，将继续尝试创建缓存`);
  }
}

interface InferCreateResult {
  instanceId: string;
  host: string;
  port: number;
  accountName?: string;
  password: string;
  redisUrl: string;
}

async function tryCreateInferInstance(
  auth: AuthConfig,
  spinner: Spinner,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string },
  options: ProvisionRedisOptions,
  appName?: string
): Promise<InferCreateResult | null> {
  const instanceClass = options.instanceClass?.trim() || DEFAULT_TAIR_KVCACHE_CLASS;
  const instanceName = `${appName || 'aero-app'}-redis`;
  const password = randomStrongPassword();
  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  const response = await callKvstoreRpc(auth, 'CreateTairKVCacheInferInstance', {
    RegionId: auth.region,
    InstanceName: instanceName,
    InstanceClass: instanceClass,
    ZoneId: net.zoneId,
    VpcId: net.vpcId,
    VSwitchId: net.vswId,
    ChargeType: 'PostPaid',
    AutoPay: true,
    Password: password,
    SecurityIPList: securityIps,
    ClientToken: randomUUID()
  });

  const body = (response as { body?: Record<string, unknown> }).body || {};
  const instanceId = typeof body.InstanceId === 'string'
    ? body.InstanceId
    : typeof body.instanceId === 'string'
      ? body.instanceId
      : '';
  if (!instanceId) return null;

  const connectionString = typeof body.ConnectionString === 'string'
    ? body.ConnectionString
    : typeof body.connectionString === 'string'
      ? body.connectionString
      : '';
  const parsed = parseRedisConnectionString(connectionString);
  let host = parsed?.host || '';
  let port = parsed?.port || 6379;
  let accountName = parsed?.accountName || '';

  const redisClient = createRedisClient(auth);
  if (!host) {
    const endpoint = await resolveTairKVCacheEndpoint(redisClient, spinner, [instanceId]);
    host = endpoint.host;
    port = endpoint.port;
    accountName = endpoint.accountName || accountName;
  }
  if (!host) throw new Error(`CreateTairKVCacheInferInstance 返回成功但未获取连接地址 (${instanceId})`);

  const redisUrl = formatRedisUrl(accountName || undefined, password, host, port);
  return { instanceId, host, port, accountName: accountName || undefined, password, redisUrl };
}

async function listTairKVCacheInstances(redisClient: Kvstore, regionId: string) {
  const instances: TairKVCacheInstanceSummary[] = [];
  const pageSize = 30;
  for (let pageNumber = 1; pageNumber <= 50; pageNumber += 1) {
    const response = await redisClient.describeTairKVCacheInferInstances(new $Kvstore.DescribeTairKVCacheInferInstancesRequest({
      regionId,
      pageNumber,
      pageSize
    }));
    const rows = response.body?.instances?.tairInferInstanceDTO || [];
    instances.push(...rows);
    const total = response.body?.totalCount || 0;
    if (rows.length === 0 || instances.length >= total) break;
  }
  return instances;
}

function selectVkName(
  instances: TairKVCacheInstanceSummary[],
  net: { vpcId: string; vswId: string; zoneId?: string },
  manualVkName?: string
) {
  const explicit = manualVkName?.trim();
  if (explicit) return explicit;

  const healthy = instances.filter((item) => {
    const id = item.instanceId || '';
    if (!id.startsWith('tk-')) return false;
    const status = item.instanceStatus || '';
    if (status && isTerminalErrorStatus(status)) return false;
    return true;
  });
  const matched = healthy.filter((item) => {
    if (item.vpcId && item.vpcId !== net.vpcId) return false;
    if (item.vSwitchId && item.vSwitchId !== net.vswId) return false;
    if (net.zoneId && item.zoneId && item.zoneId !== net.zoneId) return false;
    return true;
  });
  const candidates = matched.length > 0 ? matched : healthy;
  if (candidates.length === 1) return candidates[0].instanceId || '';
  if (candidates.length > 1) {
    const ids = candidates.map((item) => item.instanceId).filter(Boolean).join(', ');
    throw new Error(`发现多个可用 vkName (${ids})，请使用 --vk-name 显式指定`);
  }
  return '';
}

async function getTairKVCacheInstanceAttr(redisClient: Kvstore, instanceId: string) {
  try {
    const response = await redisClient.describeTairKVCacheInferInstanceAttribute(
      new $Kvstore.DescribeTairKVCacheInferInstanceAttributeRequest({ instanceId })
    );
    return response.body?.instances?.DBInstanceAttribute?.[0];
  } catch (err: unknown) {
    if (isMissingInstanceError(err)) return null;
    throw err;
  }
}

async function resolveTairKVCacheEndpoint(
  redisClient: Kvstore,
  spinner: Spinner,
  candidates: Array<string | undefined>,
  options: { waitTimeoutMs?: number } = {}
): Promise<ResolvedRedisEndpoint> {
  const ids = uniqNonEmpty(candidates);
  if (ids.length === 0) throw new Error('未找到可查询的 Tair KVCache 实例 ID');
  const waitTimeoutMs = options.waitTimeoutMs || REDIS_WAIT_TIMEOUT_MS;

  const waitStart = Date.now();
  let lastStatus = 'Creating';
  let allMissingSince = 0;
  while (true) {
    if (Date.now() - waitStart > waitTimeoutMs) {
      throw new Error(`Tair Serverless KV 初始化超时，最后状态: ${lastStatus}`);
    }

    let foundAnyInstance = false;
    for (const id of ids) {
      const attr = await getTairKVCacheInstanceAttr(redisClient, id);
      if (!attr) continue;
      foundAnyInstance = true;
      const status = attr.instanceStatus || 'Creating';
      lastStatus = `${id}:${status}`;
      if (isTerminalErrorStatus(status)) throw new Error(`Tair KVCache 创建失败，实例状态: ${status} (${id})`);
      const parsed = parseRedisConnectionString(attr.connectionString);
      if (status === 'Normal' && parsed?.host) {
        return {
          ...parsed,
          sourceInstanceId: id
        };
      }
    }

    if (!foundAnyInstance) {
      if (!allMissingSince) allMissingSince = Date.now();
      if (Date.now() - allMissingSince >= REDIS_MISSING_INSTANCE_GRACE_MS) {
        throw new Error(`未查询到可用实例信息，请检查实例 ID 是否正确: ${ids.join(', ')}`);
      }
    } else {
      allMissingSince = 0;
    }

    spinner.message(`☕ Tair Serverless KV 初始化中，请稍候... [${lastStatus}]`);
    await sleep(REDIS_WAIT_INTERVAL_MS);
  }
}

async function tryResetPasswordWithAccount(
  redisClient: Kvstore,
  candidateIds: Array<string | undefined>,
  password: string,
  fallbackAccountName?: string
) {
  const ids = uniqNonEmpty(candidateIds);
  for (const id of ids) {
    try {
      const accountName = await resolveRedisAccountName(redisClient, id, fallbackAccountName);
      if (!accountName) continue;
      await redisClient.resetAccountPassword(new $Kvstore.ResetAccountPasswordRequest({
        instanceId: id,
        accountName,
        accountPassword: password
      }));
      return { instanceId: id, accountName };
    } catch { /* this instance may not support account-based reset, try next candidate */
      continue;
    }
  }
  return null;
}

async function tryResetPasswordWithCustomApi(redisClient: Kvstore, candidateIds: Array<string | undefined>, password: string) {
  const ids = uniqNonEmpty(candidateIds);
  for (const id of ids) {
    try {
      await redisClient.resetTairKVCacheCustomInstancePassword(new $Kvstore.ResetTairKVCacheCustomInstancePasswordRequest({
        instanceId: id,
        password
      }));
      return { instanceId: id };
    } catch { /* custom API reset may not be available for this instance, try next candidate */
      continue;
    }
  }
  return null;
}

async function tryApplySecurityIps(redisClient: Kvstore, instanceId: string, securityIps: string, spinner: Spinner) {
  try {
    await redisClient.modifySecurityIps(new $Kvstore.ModifySecurityIpsRequest({
      instanceId,
      securityIpGroupName: 'default',
      modifyMode: 'Append',
      securityIps
    }));
  } catch (err: unknown) {
    if (isConflictError(err) || isIgnorableSecurityIpError(err)) {
      spinner.message(`⚠️ 当前实例未应用白名单配置 (${formatErrorMessage(err)})`);
      return;
    }
    throw err;
  }
}

function isClassicRedisInstance(instanceId: string) {
  return instanceId.startsWith('r-');
}

function isTairServerlessInstance(instanceId: string) {
  return instanceId.startsWith('tk-') || instanceId.startsWith('tt-');
}

function mergeProjectNetwork(
  current: ProjectNetworkConfig | undefined,
  next: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string; sgId?: string }
): ProjectNetworkConfig {
  return {
    vpcId: next.vpcId,
    vswId: next.vswId,
    sgId: next.sgId ?? current?.sgId,
    cidrBlock: next.cidrBlock ?? current?.cidrBlock
  };
}

async function bindExistingClassicRedisInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  auth: AuthConfig,
  project: ReturnType<typeof Config.getProject>,
  options: ProvisionRedisOptions,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string }
) {
  const instanceId = options.instanceId?.trim() || '';
  spinner.message(`🔗 正在绑定已有 Redis 实例 (${instanceId})...`);

  const instanceRes = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
    regionId: auth.region,
    instanceIds: instanceId,
    pageNumber: 1,
    pageSize: 30
  }));
  const instance = instanceRes.body?.instances?.KVStoreInstance?.find((item) => item.instanceId === instanceId);
  const host = instance?.connectionDomain || project.cache?.host;
  const port = instance?.port || project.cache?.port || 6379;
  if (!host) throw new Error(`未查询到 Redis 连接地址，请确认实例 ${instanceId} 可用`);

  let accountName = options.accountName?.trim() || project.cache?.accountName || '';
  if (!accountName) {
    accountName = await resolveRedisAccountName(redisClient, instanceId, project.cache?.accountName);
  }

  let redisPassword = options.existingPassword?.trim() || '';
  if (!redisPassword) {
    if (!accountName) {
      throw new Error('未查询到 Redis 账号，请使用 --username 指定实例账号，或使用 --password 直接绑定');
    }
    const newPassword = randomStrongPassword();
    await redisClient.resetAccountPassword(new $Kvstore.ResetAccountPasswordRequest({
      instanceId,
      accountName,
      accountPassword: newPassword
    }));
    redisPassword = newPassword;
  }

  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  spinner.message('🔐 正在配置 Redis 内网白名单...');
  await tryApplySecurityIps(redisClient, instanceId, securityIps, spinner);

  const redisUrl = formatRedisUrl(accountName || undefined, redisPassword, host, port);
  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: host,
    REDIS_PORT: String(port),
    REDIS_PASSWORD: redisPassword,
    REDIS_USERNAME: accountName
  };
  project.network = mergeProjectNetwork(project.network, net);
  project.cache = {
    type: 'redis',
    instanceId,
    host,
    port,
    accountName,
    mode: 'classic-redis'
  };
  Config.setProject(project);
  return redisUrl;
}

async function bindExistingTairInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  project: ReturnType<typeof Config.getProject>,
  options: ProvisionRedisOptions,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string }
) {
  const instanceId = options.instanceId?.trim() || '';
  spinner.message(`🔗 正在绑定已有 Tair Serverless KV 实例 (${instanceId})...`);
  let endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [instanceId, options.vkName, project.cache?.vkName],
    { waitTimeoutMs: REDIS_BIND_WAIT_TIMEOUT_MS }
  );
  if (!endpoint.host && project.cache?.host) {
    endpoint = {
      host: project.cache.host,
      port: project.cache.port || 6379,
      url: `redis://${project.cache.host}:${project.cache.port || 6379}`,
      sourceInstanceId: instanceId
    };
  }

  let accountName = options.accountName?.trim() || endpoint.accountName || project.cache?.accountName || '';
  let redisPassword = options.existingPassword?.trim() || endpoint.password || '';
  if (!redisPassword) {
    spinner.message('🔐 未传入 --password，正在自动轮换实例密码...');
    const desiredPassword = randomStrongPassword();
    const accountReset = await tryResetPasswordWithAccount(
      redisClient,
      [endpoint.sourceInstanceId, options.vkName, instanceId],
      desiredPassword,
      accountName
    );
    if (accountReset) {
      accountName = accountReset.accountName;
      redisPassword = desiredPassword;
    } else {
      const customReset = await tryResetPasswordWithCustomApi(
        redisClient,
        [endpoint.sourceInstanceId, instanceId, options.vkName],
        desiredPassword
      );
      if (!customReset) {
        throw new Error(
          '未能自动重置已存在实例密码。请使用 --password 传入控制台已设置密码，或先执行 `ali cache rotate-password --instance <id>` 再重试'
        );
      }
      redisPassword = desiredPassword;
    }
  }

  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  spinner.message('🔐 正在配置 Redis 内网白名单...');
  await tryApplySecurityIps(redisClient, endpoint.sourceInstanceId, securityIps, spinner);

  const redisUrl = formatRedisUrl(accountName || undefined, redisPassword, endpoint.host, endpoint.port);
  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: endpoint.host,
    REDIS_PORT: String(endpoint.port),
    REDIS_PASSWORD: redisPassword,
    REDIS_USERNAME: accountName
  };
  project.network = mergeProjectNetwork(project.network, net);
  project.cache = {
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host: endpoint.host,
    port: endpoint.port,
    accountName,
    vkName: options.vkName?.trim() || project.cache?.vkName || (endpoint.sourceInstanceId.startsWith('tk-') ? endpoint.sourceInstanceId : undefined),
    mode: 'tair-serverless-kv'
  };
  Config.setProject(project);
  return redisUrl;
}

export async function provisionRedis(spinner: Spinner, options: ProvisionRedisOptions = {}) {
  const auth = Config.requireAuth();
  const project = Config.getProject();

  if (options.engineVersion || options.nodeType || options.capacityMb) {
    throw new Error('Tair Serverless KV 不支持 --engine-version/--node-type/--capacity 参数');
  }

  const manualZoneId = options.zoneId?.trim();
  const manualVpcId = options.vpcId?.trim();
  const manualVSwitchId = options.vSwitchId?.trim();
  const net = await ((manualVpcId || manualVSwitchId)
    ? (() => {
        if (!manualVpcId || !manualVSwitchId) {
          throw new Error('自定义网络时需同时提供 --vpc 与 --vsw');
        }
        if (!manualZoneId) {
          throw new Error('自定义网络时需提供 --zone');
        }
        return resolveProvidedNetwork({
          vpcId: manualVpcId,
          vswId: manualVSwitchId,
          zoneId: manualZoneId
        });
      })()
    : ensureDefaultNetwork({ preferredZoneIds: manualZoneId ? [manualZoneId] : undefined }));

  const redisClient = createRedisClient(auth);
  await ensureKvstoreServiceLinkedRole(redisClient, auth.region, spinner);

  const existingInstanceId = options.instanceId?.trim();
  if (existingInstanceId) {
    if (isTairServerlessInstance(existingInstanceId)) {
      return bindExistingTairInstance(spinner, redisClient, project, options, net);
    }
    if (isClassicRedisInstance(existingInstanceId)) {
      return bindExistingClassicRedisInstance(spinner, redisClient, auth, project, options, net);
    }
    throw new Error('--instance 仅支持 tt-/tk-（Tair）或 r-（经典 Redis）开头的实例 ID');
  }

  let inferCreateError: unknown;
  try {
    spinner.message('⚡ 正在通过直连 API 创建 Tair Serverless KV...');
    const inferResult = await tryCreateInferInstance(auth, spinner, net, options, project.appName);
    if (inferResult) {
      const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
      spinner.message('🔐 正在配置 Redis 内网白名单...');
      await tryApplySecurityIps(redisClient, inferResult.instanceId, securityIps, spinner);

      project.envs = {
        ...project.envs,
        REDIS_URL: inferResult.redisUrl,
        REDIS_HOST: inferResult.host,
        REDIS_PORT: String(inferResult.port),
        REDIS_PASSWORD: inferResult.password,
        REDIS_USERNAME: inferResult.accountName || ''
      };
      project.network = mergeProjectNetwork(project.network, net);
      project.cache = {
        type: 'redis',
        instanceId: inferResult.instanceId,
        host: inferResult.host,
        port: inferResult.port,
        accountName: inferResult.accountName,
        mode: 'tair-serverless-kv'
      };
      Config.setProject(project);
      return inferResult.redisUrl;
    }
  } catch (err: unknown) {
    inferCreateError = err;
    const code = getErrorCode(err);
    const requestId = getErrorRequestId(err);
    const requestIdSuffix = requestId ? `, requestId=${requestId}` : '';
    spinner.message(`⚠️ 直连 API 创建失败 [${code || 'Unknown'}] ${formatErrorMessage(err)}${requestIdSuffix}`);
  }

  spinner.message('🔎 正在查询可用的 Tair Serverless KV 虚拟集群...');
  const inferInstances = await listTairKVCacheInstances(redisClient, auth.region);
  const vkName = selectVkName(inferInstances, net, options.vkName);
  if (!vkName) {
    if (inferCreateError) {
      throw new Error(
        `OpenAPI 直连创建失败（${formatErrorMessage(inferCreateError)}），且当前账号下未找到可用 vkName。` +
        '请先在控制台创建一个 Tair Serverless KV 实例后重试，或执行 `ali cache add --type redis --instance <tt-或tk-实例ID> --password <实例密码>` 直接绑定。'
      );
    }
    throw new Error('未找到可用 vkName。请先在阿里云控制台创建 Tair Serverless KV 实例，并通过 --instance <tt-或tk-实例ID> 直接绑定');
  }

  const instanceClass = options.instanceClass?.trim() || DEFAULT_TAIR_KVCACHE_CLASS;
  const computeUnitNum = options.computeUnitNum || DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT;
  if (!Number.isInteger(computeUnitNum) || computeUnitNum <= 0) {
    throw new Error('--compute-unit 必须是正整数');
  }
  if (computeUnitNum !== 1) {
    throw new Error('当前阿里云 CreateTairKVCacheVNode 仅支持 --compute-unit 1');
  }

  const instanceName = `${project.appName || 'aero-app'}-redis`;
  spinner.message(`⚡ 正在创建 Tair Serverless KV: class=${instanceClass}, cu=${computeUnitNum}, vk=${vkName}`);
  const createRes = await redisClient.createTairKVCacheVNode(new $Kvstore.CreateTairKVCacheVNodeRequest({
    regionId: auth.region,
    instanceName,
    instanceClass,
    computeUnitNum,
    zoneId: net.zoneId || manualZoneId,
    vSwitchId: net.vswId,
    vkName,
    clientToken: randomUUID()
  }));

  const vnodeInstanceId = createRes.body?.instanceId;
  const returnedVkName = createRes.body?.vkName || vkName;
  if (!vnodeInstanceId) throw new Error('Tair Serverless KV 创建失败：未返回 instanceId');

  const endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [returnedVkName, vnodeInstanceId]
  );

  const host = endpoint.host;
  const port = endpoint.port;
  let accountName = endpoint.accountName || project.cache?.accountName || '';
  let redisPassword = endpoint.password || '';
  let redisUrl = endpoint.url;

  if (!redisPassword) {
    spinner.message('🔐 正在设置 Redis 密码...');
    const desiredPassword = randomStrongPassword();
    const accountReset = await tryResetPasswordWithAccount(
      redisClient,
      [endpoint.sourceInstanceId, returnedVkName, vnodeInstanceId],
      desiredPassword,
      accountName
    );
    if (accountReset) {
      accountName = accountReset.accountName;
      redisPassword = desiredPassword;
      redisUrl = formatRedisUrl(accountName, redisPassword, host, port);
    } else {
      const customReset = await tryResetPasswordWithCustomApi(
        redisClient,
        [endpoint.sourceInstanceId, vnodeInstanceId, returnedVkName],
        desiredPassword
      );
      if (!customReset) {
        throw new Error('未能自动设置 Tair Serverless KV 密码，请在控制台手动设置后重试');
      }
      redisPassword = desiredPassword;
      redisUrl = formatRedisUrl(accountName || undefined, redisPassword, host, port);
    }
  }

  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  spinner.message('🔐 正在配置 Redis 内网白名单...');
  await tryApplySecurityIps(redisClient, endpoint.sourceInstanceId, securityIps, spinner);

  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: host,
    REDIS_PORT: String(port),
    REDIS_PASSWORD: redisPassword,
    REDIS_USERNAME: accountName
  };
  project.network = mergeProjectNetwork(project.network, net);
  project.cache = {
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host,
    port,
    accountName,
    vkName: returnedVkName,
    mode: 'tair-serverless-kv'
  };
  Config.setProject(project);
  return redisUrl;
}

export async function rotateRedisPassword(spinner: Spinner, explicitInstanceId?: string) {
  const auth = Config.requireAuth();
  const project = Config.getProject();
  const redisClient = createRedisClient(auth);

  const instanceId = explicitInstanceId || project.cache?.instanceId;
  if (!instanceId) throw new Error('未找到 Redis 实例 ID，请先执行 ali cache add');

  if (isClassicRedisInstance(instanceId)) {
    spinner.message('🔎 正在获取 Redis 账号...');
    const accountName = await resolveRedisAccountName(
      redisClient,
      instanceId,
      project.cache?.accountName
    );
    if (!accountName) throw new Error('未找到可用 Redis 账号，无法轮换密码');

    const newPassword = randomStrongPassword();
    spinner.message('🔐 正在轮换 Redis 密码...');
    await redisClient.resetAccountPassword(new $Kvstore.ResetAccountPasswordRequest({
      instanceId,
      accountName,
      accountPassword: newPassword
    }));

    const instanceRes = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
      regionId: auth.region,
      instanceIds: instanceId,
      pageNumber: 1,
      pageSize: 30
    }));
    const instance = instanceRes.body?.instances?.KVStoreInstance?.find((item) => item.instanceId === instanceId);
    const host = instance?.connectionDomain || project.cache?.host;
    const port = instance?.port || project.cache?.port || 6379;
    if (!host) throw new Error('未查询到 Redis 连接地址');

    const redisUrl = formatRedisUrl(accountName, newPassword, host, port);
    project.envs = {
      ...project.envs,
      REDIS_URL: redisUrl,
      REDIS_HOST: host,
      REDIS_PORT: String(port),
      REDIS_PASSWORD: newPassword,
      REDIS_USERNAME: accountName
    };
    project.cache = {
      ...(project.cache || { type: 'redis', instanceId }),
      type: 'redis',
      instanceId,
      host,
      port,
      accountName
    };
    Config.setProject(project);
    return redisUrl;
  }

  spinner.message('🔎 正在解析 Tair Serverless KV 连接地址...');
  let endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [instanceId, project.cache?.vkName]
  );
  if (!endpoint.host && project.cache?.host) {
    endpoint = {
      host: project.cache.host,
      port: project.cache.port || 6379,
      url: `redis://${project.cache.host}:${project.cache.port || 6379}`,
      sourceInstanceId: instanceId
    };
  }

  const newPassword = randomStrongPassword();
  spinner.message('🔐 正在轮换 Tair Serverless KV 密码...');
  const accountReset = await tryResetPasswordWithAccount(
    redisClient,
    [endpoint.sourceInstanceId, project.cache?.vkName, instanceId],
    newPassword,
    project.cache?.accountName
  );
  const accountName = accountReset?.accountName || project.cache?.accountName || '';
  if (!accountReset) {
    const customReset = await tryResetPasswordWithCustomApi(
      redisClient,
      [endpoint.sourceInstanceId, instanceId, project.cache?.vkName],
      newPassword
    );
    if (!customReset) throw new Error('轮换密码失败：当前实例不支持自动密码重置');
  }

  const redisUrl = formatRedisUrl(accountName || undefined, newPassword, endpoint.host, endpoint.port);
  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: endpoint.host,
    REDIS_PORT: String(endpoint.port),
    REDIS_PASSWORD: newPassword,
    REDIS_USERNAME: accountName
  };
  project.cache = {
    ...(project.cache || { type: 'redis', instanceId }),
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host: endpoint.host,
    port: endpoint.port,
    accountName,
    vkName: project.cache?.vkName,
    mode: 'tair-serverless-kv'
  };
  Config.setProject(project);
  return redisUrl;
}

function toClassicSummary(instance: {
  instanceId?: string;
  instanceName?: string;
  instanceStatus?: string;
  instanceClass?: string;
  engineVersion?: string;
  connectionDomain?: string;
  port?: number;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
}): CacheInstanceSummary {
  return {
    instanceId: instance.instanceId || '',
    mode: 'classic-redis',
    instanceName: instance.instanceName,
    status: instance.instanceStatus,
    instanceClass: instance.instanceClass,
    engineVersion: instance.engineVersion,
    host: instance.connectionDomain,
    port: instance.port,
    zoneId: instance.zoneId,
    vpcId: instance.vpcId,
    vSwitchId: instance.vSwitchId
  };
}

function toTairSummary(instance: TairKVCacheInstanceSummary): CacheInstanceSummary {
  return {
    instanceId: instance.instanceId || '',
    mode: 'tair-serverless-kv',
    instanceName: instance.instanceName,
    status: instance.instanceStatus,
    zoneId: instance.zoneId,
    vpcId: instance.vpcId,
    vSwitchId: instance.vSwitchId
  };
}

async function getClassicInstanceById(redisClient: Kvstore, auth: AuthConfig, instanceId: string) {
  const response = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
    regionId: auth.region,
    instanceIds: instanceId,
    pageNumber: 1,
    pageSize: 30
  }));
  const rows = response.body?.instances?.KVStoreInstance || [];
  return rows.find((item) => item.instanceId === instanceId) || null;
}

async function getTairInstanceById(redisClient: Kvstore, instanceId: string) {
  const attr = await getTairKVCacheInstanceAttr(redisClient, instanceId);
  return attr;
}

export async function listCacheInstances(limit = 200): Promise<CacheInstanceSummary[]> {
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);
  const results: CacheInstanceSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));

  for (let pageNumber = 1; pageNumber <= 20 && results.length < safeLimit; pageNumber += 1) {
    const response = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
      regionId: auth.region,
      pageNumber,
      pageSize: 50
    }));
    const rows = response.body?.instances?.KVStoreInstance || [];
    for (const row of rows) {
      const summary = toClassicSummary(row);
      if (!summary.instanceId) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
    const total = response.body?.totalCount || 0;
    if (rows.length === 0 || (total > 0 && results.length >= total)) break;
  }

  if (results.length < safeLimit) {
    const tairInstances = await listTairKVCacheInstances(redisClient, auth.region);
    for (const instance of tairInstances) {
      const summary = toTairSummary(instance);
      if (!summary.instanceId) continue;
      if (results.some((item) => item.instanceId === summary.instanceId)) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
  }

  return results.slice(0, safeLimit);
}

export async function getCacheInstanceDetail(instanceId: string): Promise<CacheInstanceDetail> {
  const resolvedId = instanceId.trim();
  if (!resolvedId) throw new Error('instanceId 不能为空');
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);

  if (isClassicRedisInstance(resolvedId)) {
    const instance = await getClassicInstanceById(redisClient, auth, resolvedId);
    if (!instance?.instanceId) throw new Error(`未找到 Redis 实例: ${resolvedId}`);
    const accountsRes = await redisClient.describeAccounts(new $Kvstore.DescribeAccountsRequest({ instanceId: resolvedId }));
    const accountNames = (accountsRes.body?.accounts?.account || [])
      .map((item) => item.accountName)
      .filter((item): item is string => typeof item === 'string' && item.length > 0);
    return {
      summary: toClassicSummary(instance),
      accountNames
    };
  }

  if (!isTairServerlessInstance(resolvedId)) {
    throw new Error('cache info 仅支持 tt-/tk-/r- 开头的实例 ID');
  }

  const attr = await getTairInstanceById(redisClient, resolvedId);
  if (!attr?.instanceId) throw new Error(`未找到 Tair 实例: ${resolvedId}`);
  const parsed = parseRedisConnectionString(attr.connectionString);
  const accountsRes = await redisClient.describeAccounts(new $Kvstore.DescribeAccountsRequest({ instanceId: resolvedId }));
  const accountNames = (accountsRes.body?.accounts?.account || [])
    .map((item) => item.accountName)
    .filter((item): item is string => typeof item === 'string' && item.length > 0);

  return {
    summary: {
      instanceId: attr.instanceId,
      mode: 'tair-serverless-kv',
      instanceName: attr.instanceName,
      status: attr.instanceStatus,
      instanceClass: attr.instanceClass,
      host: parsed?.host,
      port: parsed?.port,
      zoneId: attr.zoneId,
      vpcId: attr.vpcId,
      vSwitchId: attr.vSwitchId
    },
    accountNames
  };
}

export async function resolveCacheConnectInfo(explicitInstanceId?: string): Promise<CacheConnectInfo> {
  const auth = Config.requireAuth();
  const redisClient = createRedisClient(auth);
  const project = Config.getProject();
  const instanceId = explicitInstanceId?.trim() || project.cache?.instanceId || '';
  if (!instanceId) throw new Error('未指定缓存实例 ID，且当前项目未绑定缓存实例');
  const sameProjectInstance = project.cache?.instanceId === instanceId;
  const projectParsed = sameProjectInstance ? parseRedisConnectionString(project.envs?.REDIS_URL) : null;

  if (isClassicRedisInstance(instanceId)) {
    const instance = await getClassicInstanceById(redisClient, auth, instanceId);
    if (!instance?.instanceId) throw new Error(`未找到 Redis 实例: ${instanceId}`);
    const host = instance.connectionDomain || project.cache?.host || '';
    const port = instance.port || project.cache?.port || 6379;
    if (!host) throw new Error(`未获取到实例 ${instanceId} 的连接地址`);
    const username = projectParsed?.accountName || project.cache?.accountName || '<username>';
    const password = projectParsed?.password || '';
    const passwordKnown = password.length > 0;
    const connectionString = formatRedisUrlWithMask(
      username === '<username>' ? undefined : username,
      password,
      host,
      port,
      passwordKnown
    );
    return {
      instanceId,
      host,
      port,
      username: username === '<username>' ? undefined : username,
      passwordKnown,
      connectionString,
      mode: 'classic-redis'
    };
  }

  if (!isTairServerlessInstance(instanceId)) {
    throw new Error('cache connect 仅支持 tt-/tk-/r- 开头的实例 ID');
  }

  const attr = await getTairInstanceById(redisClient, instanceId);
  const parsed = parseRedisConnectionString(attr?.connectionString)
    || (project.cache?.host ? {
      host: project.cache.host,
      port: project.cache.port || 6379,
      url: `redis://${project.cache.host}:${project.cache.port || 6379}`,
      accountName: project.cache.accountName,
      password: undefined
    } : null);
  if (!parsed?.host) throw new Error(`未获取到实例 ${instanceId} 的连接地址`);
  const username = projectParsed?.accountName || parsed.accountName || project.cache?.accountName;
  const password = projectParsed?.password || '';
  const passwordKnown = password.length > 0;
  const connectionString = formatRedisUrlWithMask(username, password, parsed.host, parsed.port, passwordKnown);

  return {
    instanceId,
    host: parsed.host,
    port: parsed.port,
    username,
    passwordKnown,
    connectionString,
    mode: 'tair-serverless-kv'
  };
}
