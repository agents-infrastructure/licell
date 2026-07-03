import type Ecs from '@alicloud/ecs20140526';

export type EcsClient = Ecs;

export interface EcsClientContext {
  regionId: string;
  client: EcsClient;
}

export interface EcsInstanceTagFilter {
  key: string;
  value?: string;
}

export interface EcsInstanceFilters {
  regionId?: string;
  instanceIds?: string[];
  name?: string;
  namePrefix?: string;
  status?: string;
  zoneId?: string;
  vpcId?: string;
  vSwitchId?: string;
  instanceType?: string;
  chargeType?: string;
  privateIpAddress?: string;
  publicIpAddress?: string;
  eipAddress?: string;
  tags?: EcsInstanceTagFilter[];
}

export interface EcsListInstancesOptions extends EcsInstanceFilters {
  limit?: number;
}

export interface EcsInstanceSummary {
  instanceId: string;
  instanceName?: string;
  status?: string;
  regionId: string;
  zoneId?: string;
  instanceType?: string;
  osName?: string;
  chargeType?: string;
  vpcId?: string;
  vSwitchId?: string;
  privateIpAddresses: string[];
  publicIpAddresses: string[];
  eipAddress?: string;
  securityGroupIds: string[];
  tags: Array<{ key: string; value?: string }>;
  createdAt?: string;
  expiredAt?: string;
}

export interface EcsListInstancesResult {
  regionId: string;
  filters: EcsInstanceFilters;
  totalCount?: number;
  count: number;
  limit: number;
  truncated: boolean;
  instances: EcsInstanceSummary[];
}

export interface EcsInstanceDetail {
  summary: EcsInstanceSummary;
}
