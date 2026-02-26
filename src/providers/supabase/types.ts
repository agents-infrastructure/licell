export const SUPABASE_WAIT_TIMEOUT_MS = 15 * 60 * 1000;
export const SUPABASE_WAIT_INTERVAL_MS = 8000;
export const DEFAULT_SUPABASE_CLASS = 'rdsai.supabase.basic';
export const DEFAULT_SUPABASE_APP_TYPE = 'supabase';

export interface SupabaseInstanceSummary {
  instanceName: string;
  appName?: string;
  appType?: string;
  status?: string;
  instanceClass?: string;
  regionId?: string;
  dbInstanceName?: string;
  vSwitchId?: string;
  publicConnectionString?: string;
  vpcConnectionString?: string;
}

export interface SupabaseInstanceDetail extends SupabaseInstanceSummary {
  instanceMinorVersion?: string;
  zoneId?: string;
  eipStatus?: string;
  natStatus?: string;
  natGatewayId?: string;
  natCreatedBy?: string;
  eipId?: string;
}

export interface SupabaseEndpointInfo {
  connectionString?: string;
  ipType?: string;
  ip?: string;
  port?: string;
}

export interface SupabaseDbEndpointInfo {
  connectionString?: string;
  ipType?: string;
  port?: string;
}

export interface SupabaseEndpoints {
  instanceEndpoints: SupabaseEndpointInfo[];
  dbInstanceEndpoints: SupabaseDbEndpointInfo[];
}

export interface SupabaseAuthInfo {
  jwtSecret?: string;
  anonKey?: string;
  serviceKey?: string;
  configList: SupabaseConfigItem[];
}

export interface SupabaseConfigItem {
  name: string;
  value: string;
}

export interface ProvisionSupabaseOptions {
  appName?: string;
  vSwitchId?: string;
  instanceClass?: string;
  dbInstanceName?: string;
  dbInstanceClass?: string;
  dbInstanceStorage?: number;
  dashboardUsername?: string;
  dashboardPassword?: string;
  databasePassword?: string;
  publicNetworkAccessEnabled?: boolean;
  publicEndpointEnabled?: boolean;
}
