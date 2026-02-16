export interface DatabaseInstanceSummary {
  instanceId: string;
  description?: string;
  engine?: string;
  engineVersion?: string;
  status?: string;
  payType?: string;
  category?: string;
  instanceClass?: string;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
}

export interface DatabaseEndpointInfo {
  type?: string;
  ipType?: string;
  host?: string;
  port?: string;
  vpcId?: string;
  vSwitchId?: string;
}

export interface DatabaseInstanceDetail {
  summary: DatabaseInstanceSummary;
  endpoints: DatabaseEndpointInfo[];
  databases: string[];
  accounts: string[];
}

export interface DatabaseConnectInfo {
  instanceId: string;
  engine: 'postgresql' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  passwordKnown: boolean;
  connectionString: string;
}

export interface ProvisionDatabaseOptions {
  engineVersion?: string;
  category?: string;
  instanceClass?: string;
  storageGb?: number;
  storageType?: string;
  minCapacity?: number;
  maxCapacity?: number;
  autoPause?: boolean;
  zoneId?: string;
  zoneIdSlave1?: string;
  zoneIdSlave2?: string;
  vpcId?: string;
  vSwitchId?: string;
  securityIpList?: string;
  description?: string;
}
