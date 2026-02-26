import * as $RdsAi from '@alicloud/rdsai20250507';
import { createRdsAiClient } from './client';
import type {
  SupabaseInstanceSummary,
  SupabaseInstanceDetail,
  SupabaseEndpoints,
  SupabaseAuthInfo,
  SupabaseConfigItem
} from './types';

function toSummary(item: Record<string, unknown>): SupabaseInstanceSummary {
  return {
    instanceName: String(item.InstanceName || item.instanceName || ''),
    appName: item.AppName as string | undefined ?? item.appName as string | undefined,
    appType: item.AppType as string | undefined ?? item.appType as string | undefined,
    status: item.Status as string | undefined ?? item.status as string | undefined,
    instanceClass: item.InstanceClass as string | undefined ?? item.instanceClass as string | undefined,
    regionId: item.RegionId as string | undefined ?? item.regionId as string | undefined,
    dbInstanceName: item.DBInstanceName as string | undefined ?? item.dBInstanceName as string | undefined,
    vSwitchId: item.VSwitchId as string | undefined ?? item.vSwitchId as string | undefined,
    publicConnectionString: item.PublicConnectionString as string | undefined ?? item.publicConnectionString as string | undefined,
    vpcConnectionString: item.VpcConnectionString as string | undefined ?? item.vpcConnectionString as string | undefined
  };
}

export async function listSupabaseInstances(limit = 50): Promise<SupabaseInstanceSummary[]> {
  const { auth, client } = createRdsAiClient();
  const results: SupabaseInstanceSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 200));
  const pageSize = Math.min(50, safeLimit);

  for (let pageNumber = 1; pageNumber <= 20 && results.length < safeLimit; pageNumber += 1) {
    const res = await client.describeAppInstances(new $RdsAi.DescribeAppInstancesRequest({
      regionId: auth.region,
      appType: 'supabase',
      pageSize,
      pageNumber
    }));
    const rows = (res.body?.instances || []) as Record<string, unknown>[];
    for (const row of rows) {
      const summary = toSummary(row);
      if (!summary.instanceName) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
    const total = Number(res.body?.totalCount || 0);
    if (rows.length === 0 || (Number.isFinite(total) && total > 0 && results.length >= total)) break;
  }
  return results;
}

export async function getSupabaseInstanceDetail(instanceName: string): Promise<SupabaseInstanceDetail> {
  const name = instanceName.trim();
  if (!name) throw new Error('instanceName 不能为空');
  const { auth, client } = createRdsAiClient();
  const res = await client.describeAppInstanceAttribute(new $RdsAi.DescribeAppInstanceAttributeRequest({
    regionId: auth.region,
    instanceName: name
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  return {
    instanceName: String(b.InstanceName || b.instanceName || name),
    appName: b.AppName as string | undefined ?? b.appName as string | undefined,
    appType: b.AppType as string | undefined ?? b.appType as string | undefined,
    status: b.Status as string | undefined ?? b.status as string | undefined,
    instanceClass: b.InstanceClass as string | undefined ?? b.instanceClass as string | undefined,
    regionId: b.RegionId as string | undefined ?? b.regionId as string | undefined,
    dbInstanceName: b.DBInstanceName as string | undefined ?? b.dBInstanceName as string | undefined,
    vSwitchId: b.VSwitchId as string | undefined ?? b.vSwitchId as string | undefined,
    publicConnectionString: b.PublicConnectionString as string | undefined ?? b.publicConnectionString as string | undefined,
    vpcConnectionString: b.VpcConnectionString as string | undefined ?? b.vpcConnectionString as string | undefined,
    instanceMinorVersion: b.InstanceMinorVersion as string | undefined ?? b.instanceMinorVersion as string | undefined,
    zoneId: b.ZoneId as string | undefined ?? b.zoneId as string | undefined,
    eipStatus: b.EipStatus as string | undefined,
    natStatus: b.NatStatus as string | undefined,
    natGatewayId: b.NatGatewayId as string | undefined,
    natCreatedBy: b.NatCreatedBy as string | undefined,
    eipId: b.EipId as string | undefined
  };
}

export async function getSupabaseEndpoints(instanceName: string): Promise<SupabaseEndpoints> {
  const { auth, client } = createRdsAiClient();
  const res = await client.describeInstanceEndpoints(new $RdsAi.DescribeInstanceEndpointsRequest({
    regionId: auth.region,
    instanceName
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  const instanceEndpoints = ((b.instanceEndpoints || b.InstanceEndpoints || []) as Record<string, unknown>[]).map(e => ({
    connectionString: e.ConnectionString as string | undefined ?? e.connectionString as string | undefined,
    ipType: e.IpType as string | undefined ?? e.ipType as string | undefined,
    ip: e.IP as string | undefined ?? e.ip as string | undefined,
    port: e.Port as string | undefined ?? e.port as string | undefined
  }));
  const dbInstanceEndpoints = ((b.dBInstanceEndpoints || b.DBInstanceEndpoints || []) as Record<string, unknown>[]).map(e => ({
    connectionString: e.ConnectionString as string | undefined ?? e.connectionString as string | undefined,
    ipType: e.IpType as string | undefined ?? e.ipType as string | undefined,
    port: e.Port as string | undefined ?? e.port as string | undefined
  }));
  return { instanceEndpoints, dbInstanceEndpoints };
}

export async function getSupabaseAuthInfo(instanceName: string): Promise<SupabaseAuthInfo> {
  const { auth, client } = createRdsAiClient();
  const res = await client.describeInstanceAuthInfo(new $RdsAi.DescribeInstanceAuthInfoRequest({
    regionId: auth.region,
    instanceName
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  const apiKeys = (b.apiKeys || b.ApiKeys || {}) as Record<string, unknown>;
  const configList = ((b.configList || b.ConfigList || []) as Record<string, unknown>[]).map(c => ({
    name: String(c.Name || c.name || ''),
    value: String(c.Value || c.value || '')
  }));
  return {
    jwtSecret: b.JwtSecret as string | undefined ?? b.jwtSecret as string | undefined,
    anonKey: apiKeys.AnonKey as string | undefined ?? apiKeys.anonKey as string | undefined,
    serviceKey: apiKeys.ServiceKey as string | undefined ?? apiKeys.serviceKey as string | undefined,
    configList
  };
}

export async function getSupabaseStorageConfig(instanceName: string): Promise<SupabaseConfigItem[]> {
  const { auth, client } = createRdsAiClient();
  const res = await client.describeInstanceStorageConfig(new $RdsAi.DescribeInstanceStorageConfigRequest({
    regionId: auth.region,
    instanceName
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  return ((b.configList || b.ConfigList || []) as Record<string, unknown>[]).map(c => ({
    name: String(c.Name || c.name || ''),
    value: String(c.Value || c.value || '')
  }));
}

export async function getSupabaseRAGConfig(instanceName: string): Promise<{ status: boolean; configList: SupabaseConfigItem[] }> {
  const { auth, client } = createRdsAiClient();
  const res = await client.describeInstanceRAGConfig(new $RdsAi.DescribeInstanceRAGConfigRequest({
    regionId: auth.region,
    instanceName
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  const configList = ((b.configList || b.ConfigList || []) as Record<string, unknown>[]).map(c => ({
    name: String(c.Name || c.name || ''),
    value: String(c.Value || c.value || '')
  }));
  return {
    status: b.Status === true || b.status === true || b.Status === 'true' || b.status === 'true',
    configList
  };
}

export async function getSupabaseIpWhitelist(instanceName: string): Promise<Array<{ groupName: string; ipWhitelist: string }>> {
  const { auth, client } = createRdsAiClient();
  const res = await client.describeInstanceIpWhitelist(new $RdsAi.DescribeInstanceIpWhitelistRequest({
    regionId: auth.region,
    instanceName
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  return ((b.ipWhiteListGroups || b.IpWhiteListGroups || []) as Record<string, unknown>[]).map(g => ({
    groupName: String(g.GroupName || g.groupName || 'default'),
    ipWhitelist: String(g.IpWhitelist || g.ipWhitelist || '')
  }));
}

export async function getSupabaseSSLConfig(instanceName: string) {
  const { auth, client } = createRdsAiClient();
  const res = await client.describeInstanceSSL(new $RdsAi.DescribeInstanceSSLRequest({
    regionId: auth.region,
    instanceName
  }));
  const b = (res.body || {}) as Record<string, unknown>;
  return {
    sslEnabled: String(b.SSLEnabled || b.sslEnabled || '0'),
    caType: b.CAType as string | undefined ?? b.caType as string | undefined,
    serverCert: b.ServerCert as string | undefined ?? b.serverCert as string | undefined
  };
}

export async function modifySupabaseAuthConfig(instanceName: string, configList: SupabaseConfigItem[]) {
  const { auth, client } = createRdsAiClient();
  await client.modifyInstanceAuthConfig(new $RdsAi.ModifyInstanceAuthConfigRequest({
    regionId: auth.region,
    instanceName,
    configList: configList.map(c => new $RdsAi.ModifyInstanceAuthConfigRequestConfigList({
      name: c.name,
      value: c.value
    }))
  }));
}

export async function modifySupabaseStorageConfig(instanceName: string, configList: SupabaseConfigItem[]) {
  const { auth, client } = createRdsAiClient();
  await client.modifyInstanceStorageConfig(new $RdsAi.ModifyInstanceStorageConfigRequest({
    regionId: auth.region,
    instanceName,
    configList: configList.map(c => new $RdsAi.ModifyInstanceStorageConfigRequestConfigList({
      name: c.name,
      value: c.value
    }))
  }));
}

export async function modifySupabaseRAGConfig(instanceName: string, status?: boolean, configList?: SupabaseConfigItem[]) {
  const { auth, client } = createRdsAiClient();
  await client.modifyInstanceRAGConfig(new $RdsAi.ModifyInstanceRAGConfigRequest({
    regionId: auth.region,
    instanceName,
    status,
    configList: configList?.map(c => new $RdsAi.ModifyInstanceRAGConfigRequestConfigList({
      name: c.name,
      value: c.value
    }))
  }));
}

export async function modifySupabaseIpWhitelist(instanceName: string, ipWhitelist: string, modifyMode?: string, groupName?: string) {
  const { auth, client } = createRdsAiClient();
  await client.modifyInstanceIpWhitelist(new $RdsAi.ModifyInstanceIpWhitelistRequest({
    regionId: auth.region,
    instanceName,
    ipWhitelist,
    modifyMode: modifyMode || 'Cover',
    groupName: groupName || 'default'
  }));
}

export async function modifySupabaseInstanceConfig(instanceName: string, configName: string, configValue: string) {
  const { auth, client } = createRdsAiClient();
  await client.modifyInstanceConfig(new $RdsAi.ModifyInstanceConfigRequest({
    regionId: auth.region,
    instanceName,
    configName,
    configValue
  }));
}

export async function resetSupabasePassword(instanceName: string, dashboardPassword?: string, databasePassword?: string) {
  const { auth, client } = createRdsAiClient();
  await client.resetInstancePassword(new $RdsAi.ResetInstancePasswordRequest({
    regionId: auth.region,
    instanceName,
    dashboardPassword,
    databasePassword
  }));
}

export async function restartSupabaseInstance(instanceName: string) {
  const { auth, client } = createRdsAiClient();
  await client.restartInstance(new $RdsAi.RestartInstanceRequest({
    regionId: auth.region,
    instanceName
  }));
}

export async function stopSupabaseInstance(instanceName: string) {
  const { auth, client } = createRdsAiClient();
  await client.stopInstance(new $RdsAi.StopInstanceRequest({
    regionId: auth.region,
    instanceName
  }));
}

export async function startSupabaseInstance(instanceName: string) {
  const { auth, client } = createRdsAiClient();
  await client.startInstance(new $RdsAi.StartInstanceRequest({
    regionId: auth.region,
    instanceName
  }));
}

export async function deleteSupabaseInstance(instanceName: string) {
  const { auth, client } = createRdsAiClient();
  await client.deleteAppInstance(new $RdsAi.DeleteAppInstanceRequest({
    regionId: auth.region,
    instanceName
  }));
}
