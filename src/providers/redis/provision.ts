import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { randomUUID } from 'crypto';
import { type AuthConfig, Config, withProjectBindingRegion } from '../../utils/config';
import { randomStrongPassword } from '../../utils/crypto';
import { formatErrorMessage, type Spinner } from '../../utils/errors';
import { sleep } from '../../utils/runtime';
import { ensureDefaultNetwork, resolveProvidedNetwork } from '../vpc';
import { createRedisClient } from './client';
import {
  formatInferCreateErrorWithCode,
  ensureKvstoreServiceLinkedRole,
  listTairKVCacheInstances,
  resolveRedisAccountName,
  resolveTairKVCacheEndpoint,
  selectVkName,
  tryApplySecurityIps,
  tryCreateInferInstance,
  tryResetPasswordWithAccount,
  tryResetPasswordWithCustomApi
} from './internals';
import {
  formatRedisUrl,
  isClassicRedisInstance,
  isTairServerlessInstance,
  mergeProjectNetwork
} from './helpers';
import {
  type CacheProvisionMode,
  DEFAULT_TAIR_KVCACHE_CLASS,
  DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT,
  REDIS_BIND_WAIT_TIMEOUT_MS,
  type ProvisionRedisOptions,
  type ProvisionRedisResult
} from './types';
import { resolveCacheProvisionZoneIds } from './zones';

function inferModeFromInstanceId(instanceId: string | undefined): CacheProvisionMode | undefined {
  const value = instanceId?.trim() || '';
  if (!value) return undefined;
  if (isTairServerlessInstance(value)) return 'serverless';
  if (isClassicRedisInstance(value)) return 'classic';
  return undefined;
}

function resolveProvisionRedisMode(options: ProvisionRedisOptions): CacheProvisionMode {
  const explicitMode = options.mode;
  const inferredMode = inferModeFromInstanceId(options.instanceId);
  if (options.instanceId?.trim() && !inferredMode) {
    throw new Error('--instance 仅支持 tt-/tk-（Tair）或 r-（经典 Redis）开头的实例 ID');
  }
  if (explicitMode && inferredMode && explicitMode !== inferredMode) {
    throw new Error(`指定 --mode (${explicitMode}) 与 --instance 实例类型不一致`);
  }
  return explicitMode || inferredMode || 'classic';
}

function validateProvisionRedisModeOptions(mode: CacheProvisionMode, options: ProvisionRedisOptions) {
  if (mode === 'serverless') {
    if (options.engineVersion || options.nodeType || options.capacityMb) {
      throw new Error('serverless 模式不支持 --engine-version/--node-type/--capacity');
    }
    return;
  }

  if (options.vkName) {
    throw new Error('classic 模式不支持 --vk-name');
  }
  if (typeof options.computeUnitNum === 'number') {
    throw new Error('classic 模式不支持 --compute-unit');
  }
  if (options.engineVersion || options.nodeType || options.capacityMb) {
    throw new Error('classic 模式当前仅支持通过 --class 指定规格；--engine-version/--node-type/--capacity 暂未支持');
  }
}

async function bindExistingClassicRedisInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  auth: AuthConfig,
  project: ReturnType<typeof Config.getProject>,
  options: ProvisionRedisOptions,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string }
): Promise<ProvisionRedisResult> {
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
  project.network = mergeProjectNetwork(project.network, net, auth.region);
  project.cache = withProjectBindingRegion({
    type: 'redis',
    instanceId,
    host,
    port,
    accountName,
    mode: 'classic-redis'
  }, auth.region);
  Config.setProject(project);
  return {
    redisUrl,
    mode: 'classic-redis',
    instanceId
  };
}

async function bindExistingTairInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  auth: AuthConfig,
  project: ReturnType<typeof Config.getProject>,
  options: ProvisionRedisOptions,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string }
): Promise<ProvisionRedisResult> {
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
          '未能自动重置已存在实例密码。请使用 --password 传入控制台已设置密码，或先执行 `licell cache rotate-password --instance <id>` 再重试'
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
  project.network = mergeProjectNetwork(project.network, net, auth.region);
  project.cache = withProjectBindingRegion({
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host: endpoint.host,
    port: endpoint.port,
    accountName,
    vkName: options.vkName?.trim() || project.cache?.vkName || (endpoint.sourceInstanceId.startsWith('tk-') ? endpoint.sourceInstanceId : undefined),
    mode: 'tair-serverless-kv'
  }, auth.region);
  Config.setProject(project);
  return {
    redisUrl,
    mode: 'tair-serverless-kv',
    instanceId: endpoint.sourceInstanceId,
    instanceClass: undefined
  };
}

export async function provisionRedis(spinner: Spinner, options: ProvisionRedisOptions = {}): Promise<ProvisionRedisResult> {
  const auth = Config.requireAuth();
  const project = Config.getProject();
  const redisClient = createRedisClient(auth);
  const provisionMode = resolveProvisionRedisMode(options);

  validateProvisionRedisModeOptions(provisionMode, options);

  const manualZoneId = options.zoneId?.trim();
  const manualVpcId = options.vpcId?.trim();
  const manualVSwitchId = options.vSwitchId?.trim();
  let preferredZoneIds: string[] | undefined;
  if (!manualZoneId) {
    spinner.message('🔎 正在查询缓存可用区...');
    const zoneResolution = await resolveCacheProvisionZoneIds(redisClient, auth.region);
    preferredZoneIds = zoneResolution.preferredZoneIds.length > 0
      ? zoneResolution.preferredZoneIds
      : undefined;
  }
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
    : ensureDefaultNetwork({ preferredZoneIds: manualZoneId ? [manualZoneId] : preferredZoneIds }));
  await ensureKvstoreServiceLinkedRole(redisClient, auth.region, spinner);

  const existingInstanceId = options.instanceId?.trim();
  if (existingInstanceId) {
    if (provisionMode === 'serverless') {
      return bindExistingTairInstance(spinner, redisClient, auth, project, options, net);
    }
    return bindExistingClassicRedisInstance(spinner, redisClient, auth, project, options, net);
  }

  if (provisionMode === 'classic') {
    return createClassicRedisInstance(spinner, redisClient, auth, project, net, options);
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
      project.network = mergeProjectNetwork(project.network, net, auth.region);
      project.cache = withProjectBindingRegion({
        type: 'redis',
        instanceId: inferResult.instanceId,
        host: inferResult.host,
        port: inferResult.port,
        accountName: inferResult.accountName,
        mode: 'tair-serverless-kv'
      }, auth.region);
      Config.setProject(project);
      return {
        redisUrl: inferResult.redisUrl,
        mode: 'tair-serverless-kv',
        instanceId: inferResult.instanceId,
        instanceClass: options.instanceClass?.trim() || DEFAULT_TAIR_KVCACHE_CLASS
      };
    }
  } catch (err: unknown) {
    inferCreateError = err;
    spinner.message(formatInferCreateErrorWithCode(err));
  }

  spinner.message('🔎 正在查询可用的 Tair Serverless KV 虚拟集群...');
  const inferInstances = await listTairKVCacheInstances(redisClient, auth.region);
  const vkName = selectVkName(inferInstances, net, options.vkName);
  if (!vkName) {
    if (inferCreateError instanceof Error && inferCreateError.message) {
      throw new Error(`serverless 模式创建失败，且当前地域未发现可用 Tair Serverless 虚拟集群：${inferCreateError.message}`);
    }
    throw new Error('serverless 模式创建失败：当前地域未发现可用 Tair Serverless 虚拟集群，请稍后重试或改用 --mode classic');
  }

  const instanceClass = options.instanceClass?.trim() || DEFAULT_TAIR_KVCACHE_CLASS;
  const computeUnitNum = options.computeUnitNum || DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT;
  if (!Number.isInteger(computeUnitNum) || computeUnitNum <= 0) {
    throw new Error('--compute-unit 必须是正整数');
  }
  if (computeUnitNum !== 1) {
    throw new Error('当前阿里云 CreateTairKVCacheVNode 仅支持 --compute-unit 1');
  }

  const instanceName = `${project.appName || 'licell-app'}-redis`;
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
  project.network = mergeProjectNetwork(project.network, net, auth.region);
  project.cache = withProjectBindingRegion({
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host,
    port,
    accountName,
    vkName: returnedVkName,
    mode: 'tair-serverless-kv'
  }, auth.region);
  Config.setProject(project);
  return {
    redisUrl,
    mode: 'tair-serverless-kv',
    instanceId: endpoint.sourceInstanceId,
    instanceClass
  };
}

const CLASSIC_REDIS_WAIT_TIMEOUT_MS = 10 * 60 * 1000;
const CLASSIC_REDIS_WAIT_INTERVAL_MS = 5000;
const DEFAULT_CLASSIC_REDIS_CLASS = 'redis.master.small.default';

async function createClassicRedisInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  auth: AuthConfig,
  project: ReturnType<typeof Config.getProject>,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string },
  options: ProvisionRedisOptions
): Promise<ProvisionRedisResult> {
  const instanceName = `${project.appName || 'licell-app'}-redis`;
  const password = randomStrongPassword();
  const requestedClass = options.instanceClass?.trim() || '';
  const instanceClass = requestedClass || DEFAULT_CLASSIC_REDIS_CLASS;

  spinner.message(`📦 正在创建云原生 Redis 社区版 (${instanceClass}, 按量付费)...`);
  const createRes = await redisClient.createInstance(new $Kvstore.CreateInstanceRequest({
    regionId: auth.region,
    instanceType: 'Redis',
    engineVersion: '5.0',
    instanceClass,
    instanceName,
    chargeType: 'PostPaid',
    nodeType: 'double',
    networkType: 'VPC',
    vpcId: net.vpcId,
    vSwitchId: net.vswId,
    zoneId: net.zoneId,
    password,
    token: randomUUID()
  }));

  const instanceId = createRes.body?.instanceId;
  if (!instanceId) throw new Error('Redis 创建失败：未返回 instanceId');

  const host = createRes.body?.connectionDomain || '';
  const port = createRes.body?.port || 6379;

  const waitStart = Date.now();
  while (true) {
    if (Date.now() - waitStart > CLASSIC_REDIS_WAIT_TIMEOUT_MS) {
      throw new Error('Redis 实例创建超时');
    }
    await sleep(CLASSIC_REDIS_WAIT_INTERVAL_MS);
    const attrRes = await redisClient.describeInstanceAttribute(
      new $Kvstore.DescribeInstanceAttributeRequest({ instanceId })
    );
    const attr = attrRes.body?.instances?.DBInstanceAttribute?.[0];
    const status = attr?.instanceStatus || 'Creating';
    if (status === 'Normal') {
      const resolvedHost = attr?.connectionDomain || host;
      const resolvedPort = attr?.port || port;
      if (!resolvedHost) throw new Error('Redis 实例已就绪但未获取到连接地址');

      const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
      spinner.message('🔐 正在配置 Redis 内网白名单...');
      await tryApplySecurityIps(redisClient, instanceId, securityIps, spinner);

      const redisUrl = formatRedisUrl(undefined, password, resolvedHost, resolvedPort);
      project.envs = {
        ...project.envs,
        REDIS_URL: redisUrl,
        REDIS_HOST: resolvedHost,
        REDIS_PORT: String(resolvedPort),
        REDIS_PASSWORD: password,
        REDIS_USERNAME: ''
      };
      project.network = mergeProjectNetwork(project.network, net, auth.region);
      project.cache = withProjectBindingRegion({
        type: 'redis',
        instanceId,
        host: resolvedHost,
        port: resolvedPort,
        accountName: undefined,
        mode: 'classic-redis'
      }, auth.region);
      Config.setProject(project);
      return {
        redisUrl,
        mode: 'classic-redis',
        instanceId,
        instanceClass
      };
    }
    spinner.message(`☕ Redis 实例初始化中，请稍候... [${status}]`);
  }
}
