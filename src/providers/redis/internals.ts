import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { randomUUID } from 'crypto';
import { type AuthConfig } from '../../utils/config';
import { randomStrongPassword } from '../../utils/crypto';
import { formatErrorMessage, isConflictError, type Spinner } from '../../utils/errors';
import { sleep } from '../../utils/runtime';
import { callKvstoreRpc, createRedisClient } from './client';
import {
  getErrorCode,
  isIgnorableSecurityIpError,
  isMissingInstanceError,
  isTerminalErrorStatus,
  formatRedisUrl,
  parseRedisConnectionString,
  uniqNonEmpty
} from './helpers';
import {
  DEFAULT_TAIR_KVCACHE_CLASS,
  REDIS_MISSING_INSTANCE_GRACE_MS,
  REDIS_WAIT_INTERVAL_MS,
  REDIS_WAIT_TIMEOUT_MS,
  type InferCreateResult,
  type ProvisionRedisOptions,
  type ResolvedRedisEndpoint,
  type TairKVCacheInstanceSummary
} from './types';

export async function resolveRedisAccountName(
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

export async function ensureKvstoreServiceLinkedRole(redisClient: Kvstore, regionId: string, spinner: Spinner) {
  try {
    const existsRes = await redisClient.describeServiceLinkedRoleExists(new $Kvstore.DescribeServiceLinkedRoleExistsRequest({}));
    if (existsRes.body?.existsServiceLinkedRole) return;
    spinner.message('🔐 正在初始化 Kvstore 服务关联角色...');
    await redisClient.initializeKvstorePermission(new $Kvstore.InitializeKvstorePermissionRequest({ regionId }));
  } catch (err: unknown) {
    spinner.message(`⚠️ 服务关联角色检查失败 (${formatErrorMessage(err)})，将继续尝试创建缓存`);
  }
}

export async function tryCreateInferInstance(
  auth: AuthConfig,
  spinner: Spinner,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string },
  options: ProvisionRedisOptions,
  appName?: string
): Promise<InferCreateResult | null> {
  const instanceClass = options.instanceClass?.trim() || DEFAULT_TAIR_KVCACHE_CLASS;
  const instanceName = `${appName || 'licell-app'}-redis`;
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

export async function listTairKVCacheInstances(redisClient: Kvstore, regionId: string) {
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

export function selectVkName(
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

export async function getTairKVCacheInstanceAttr(redisClient: Kvstore, instanceId: string) {
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

export async function resolveTairKVCacheEndpoint(
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

export async function tryResetPasswordWithAccount(
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

export async function tryResetPasswordWithCustomApi(redisClient: Kvstore, candidateIds: Array<string | undefined>, password: string) {
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

export async function tryApplySecurityIps(redisClient: Kvstore, instanceId: string, securityIps: string, spinner: Spinner) {
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

export async function getClassicInstanceById(redisClient: Kvstore, auth: AuthConfig, instanceId: string) {
  const response = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
    regionId: auth.region,
    instanceIds: instanceId,
    pageNumber: 1,
    pageSize: 30
  }));
  const rows = response.body?.instances?.KVStoreInstance || [];
  return rows.find((item) => item.instanceId === instanceId) || null;
}

export async function getTairInstanceById(redisClient: Kvstore, instanceId: string) {
  return getTairKVCacheInstanceAttr(redisClient, instanceId);
}

export function formatInferCreateErrorWithCode(err: unknown) {
  const code = getErrorCode(err);
  const requestId = (() => {
    if (typeof err !== 'object' || err === null) return '';
    if ('data' in err && typeof (err as { data?: unknown }).data === 'object' && (err as { data?: unknown }).data !== null) {
      const requestId = ((err as { data?: Record<string, unknown> }).data?.RequestId);
      if (requestId) return String(requestId);
    }
    return '';
  })();
  const requestIdSuffix = requestId ? `, requestId=${requestId}` : '';
  return `⚠️ 直连 API 创建失败 [${code || 'Unknown'}] ${formatErrorMessage(err)}${requestIdSuffix}`;
}
