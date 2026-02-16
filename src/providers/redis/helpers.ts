import { type ProjectNetworkConfig } from '../../utils/config';
import { formatErrorMessage } from '../../utils/errors';
import type { CacheInstanceSummary, ParsedRedisConnection, TairKVCacheInstanceSummary } from './types';

export function isTerminalErrorStatus(status: string) {
  return ['Error', 'Released', 'Inactive', 'Unavailable', 'Flushing'].includes(status);
}

export function formatRedisUrl(accountName: string | undefined, password: string, host: string, port: number) {
  if (!accountName) return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  return `redis://${encodeURIComponent(accountName)}:${encodeURIComponent(password)}@${host}:${port}`;
}

export function formatRedisUrlWithMask(
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

export function getErrorCode(err: unknown) {
  if (typeof err !== 'object' || err === null) return '';
  const direct = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  if (direct) return direct;
  if ('data' in err && typeof (err as { data?: unknown }).data === 'object' && (err as { data?: unknown }).data !== null) {
    const dataCode = ((err as { data?: Record<string, unknown> }).data?.Code);
    if (dataCode) return String(dataCode);
  }
  return '';
}

export function getErrorRequestId(err: unknown) {
  if (typeof err !== 'object' || err === null) return '';
  if ('data' in err && typeof (err as { data?: unknown }).data === 'object' && (err as { data?: unknown }).data !== null) {
    const requestId = ((err as { data?: Record<string, unknown> }).data?.RequestId);
    if (requestId) return String(requestId);
  }
  return '';
}

export function isMissingInstanceError(err: unknown) {
  return /InvalidInstanceId\.NotFound/i.test(getErrorCode(err) || formatErrorMessage(err));
}

export function isIgnorableSecurityIpError(err: unknown) {
  const text = `${getErrorCode(err)} ${formatErrorMessage(err)}`;
  return /NotSupport|Unsupported|InvalidInstanceId|InvalidParameter|OperationDenied|AccessDenied/i.test(text);
}

export function uniqNonEmpty(values: Array<string | undefined>) {
  const dedup = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim();
    if (normalized) dedup.add(normalized);
  }
  return [...dedup];
}

export function parseRedisConnectionString(connectionString?: string): ParsedRedisConnection | null {
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

export function isClassicRedisInstance(instanceId: string) {
  return instanceId.startsWith('r-');
}

export function isTairServerlessInstance(instanceId: string) {
  return instanceId.startsWith('tk-') || instanceId.startsWith('tt-');
}

export function mergeProjectNetwork(
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

export function toClassicSummary(instance: {
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

export function toTairSummary(instance: TairKVCacheInstanceSummary): CacheInstanceSummary {
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
