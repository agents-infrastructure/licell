import type { ProvisionDatabaseOptions } from './types';

export const POSTPAID_PG_CLASS_FALLBACK = 'pg.n1e.1c.1m';
export const POSTPAID_PG_STORAGE_FALLBACK = 20;
export const POSTPAID_PG_ENGINE_VERSION = '18.0';
export const DEFAULT_DB_STORAGE_TYPE = 'cloud_essd';

export const SERVERLESS_DB_CLASS_FALLBACK = {
  postgres: 'pg.n2.serverless.1c',
  mysql: 'mysql.n2.serverless.1c'
} as const;

export const SERVERLESS_DB_STORAGE_FALLBACK = {
  postgres: 20,
  mysql: 20
} as const;

export const SERVERLESS_DB_CONFIG_FALLBACK = {
  postgres: { minCapacity: 0.5, maxCapacity: 8, autoPause: true },
  mysql: { minCapacity: 0.5, maxCapacity: 2, autoPause: true }
} as const;

export interface ResolvedDatabaseProvisionDefaults {
  engine: 'PostgreSQL' | 'MySQL';
  engineVersion: string;
  category: string;
  storageType: string;
  instanceChargeType: 'PostPaid' | 'Serverless';
  defaultClass: string;
  defaultStorageGb: number;
}

export function resolveDatabaseProvisionDefaults(
  dbType: 'postgres' | 'mysql',
  options: Pick<ProvisionDatabaseOptions, 'engineVersion' | 'category' | 'storageType'> = {}
): ResolvedDatabaseProvisionDefaults {
  const isPostPaidPg = dbType === 'postgres';
  return {
    engine: isPostPaidPg ? 'PostgreSQL' : 'MySQL',
    engineVersion: options.engineVersion?.trim() || (isPostPaidPg ? POSTPAID_PG_ENGINE_VERSION : '8.0'),
    category: isPostPaidPg
      ? (options.category?.trim() || 'Basic')
      : (options.category?.trim() || 'serverless_basic'),
    storageType: options.storageType?.trim() || DEFAULT_DB_STORAGE_TYPE,
    instanceChargeType: isPostPaidPg ? 'PostPaid' : 'Serverless',
    defaultClass: isPostPaidPg ? POSTPAID_PG_CLASS_FALLBACK : SERVERLESS_DB_CLASS_FALLBACK[dbType],
    defaultStorageGb: isPostPaidPg ? POSTPAID_PG_STORAGE_FALLBACK : SERVERLESS_DB_STORAGE_FALLBACK[dbType]
  };
}
