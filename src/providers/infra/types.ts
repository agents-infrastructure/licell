export interface DatabaseInstanceSummary {
  instanceId: string;
  regionId?: string;
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

export interface DatabaseInstanceAttributes {
  instanceType?: string;
  instanceClassType?: string;
  cpu?: string;
  memoryMb?: number;
  storageGb?: number;
  storageType?: string;
  storageUsed?: string;
  maxConnections?: number;
  maxIops?: number;
  maxIoMbps?: number;
  creationTime?: string;
  expireTime?: string;
  maintainTime?: string;
  resourceGroupId?: string;
  deletionProtection?: boolean;
  lockMode?: string;
  lockReason?: string;
  serverless?: {
    autoPause?: boolean;
    scaleMin?: number;
    scaleMax?: number;
  };
}

export interface DatabaseNetworkInfo {
  regionId: string;
  zoneId?: string;
  slaveZoneIds: string[];
  vpcId?: string;
  vSwitchId?: string;
  networkType?: string;
  connectionMode?: string;
  masterInstanceId?: string;
  masterZone?: string;
}

export interface DatabaseWhitelistInfo {
  name?: string;
  attribute?: string;
  type?: string;
  ips: string[];
}

export interface DatabaseSecurityGroupInfo {
  id?: string;
  name?: string;
  networkType?: string;
  regionId?: string;
}

export interface DatabaseSecurityInfo {
  ipMode?: string;
  whitelists: DatabaseWhitelistInfo[];
  securityGroups: DatabaseSecurityGroupInfo[];
}

export interface DatabaseInspectionWarning {
  source: 'whitelists' | 'securityGroups';
  message: string;
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
  attributes: DatabaseInstanceAttributes;
  network: DatabaseNetworkInfo;
  security: DatabaseSecurityInfo;
  endpoints: DatabaseEndpointInfo[];
  databases: string[];
  accounts: string[];
  inspectionWarnings: DatabaseInspectionWarning[];
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
  publicHost?: string;
  publicPort?: number;
  publicConnectionString?: string;
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

export interface DatabaseClassStorageRange {
  minGb?: number;
  maxGb?: number;
  stepGb?: number;
}

export interface DatabaseClassEntry {
  instanceClass: string;
  storageRange?: DatabaseClassStorageRange;
  zoneIds: string[];
}

export interface DatabaseZoneClassEntry {
  zoneId: string;
  classCount: number;
  classes: string[];
}

export interface DatabaseClassCatalog {
  regionId: string;
  dbType: 'postgres' | 'mysql';
  engine: 'PostgreSQL' | 'MySQL';
  engineVersion: string;
  category: string;
  storageType: string;
  chargeType: 'PostPaid' | 'Serverless';
  zoneId?: string;
  zoneIds: string[];
  queriedAllZones: boolean;
  defaultClass: string;
  classes: DatabaseClassEntry[];
  zones: DatabaseZoneClassEntry[];
}
