export const REDIS_WAIT_TIMEOUT_MS = 20 * 60 * 1000;
export const REDIS_WAIT_INTERVAL_MS = 5000;
export const REDIS_MISSING_INSTANCE_GRACE_MS = 60 * 1000;
export const REDIS_BIND_WAIT_TIMEOUT_MS = 3 * 60 * 1000;
export const DEFAULT_TAIR_KVCACHE_CLASS = 'kvcache.cu.g4b.2';
export const DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT = 1;

export interface TairKVCacheInstanceSummary {
  instanceId?: string;
  instanceType?: string;
  instanceStatus?: string;
  instanceName?: string;
  vpcId?: string;
  vSwitchId?: string;
  zoneId?: string;
}

export interface ParsedRedisConnection {
  host: string;
  port: number;
  accountName?: string;
  password?: string;
  url: string;
}

export interface ResolvedRedisEndpoint extends ParsedRedisConnection {
  sourceInstanceId: string;
}

export interface InferCreateResult {
  instanceId: string;
  host: string;
  port: number;
  accountName?: string;
  password: string;
  redisUrl: string;
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
