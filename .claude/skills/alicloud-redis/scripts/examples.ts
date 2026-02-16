/**
 * Alibaba Cloud Redis (R-KVStore) - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/r-kvstore20150101';
import * as models from '@alicloud/r-kvstore20150101/dist/models';
import { Config } from '@alicloud/openapi-core';

function createClient(regionId: string = 'cn-hangzhou'): Client {
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    regionId,
    endpoint: 'r-kvstore.aliyuncs.com',
  }));
}

// --- Instance Management ---

async function listInstances(client: Client, regionId: string) {
  let pageNumber = 1;
  const all: any[] = [];
  while (true) {
    const { body } = await client.describeInstances(new models.DescribeInstancesRequest({
      regionId, pageSize: 50, pageNumber,
    }));
    all.push(...(body.instances?.KVStoreInstance || []));
    if (all.length >= (body.totalCount || 0)) break;
    pageNumber++;
  }
  return all;
}

async function createRedisInstance(client: Client, regionId: string, vpcId: string, vSwitchId: string) {
  const { body } = await client.createInstance(new models.CreateInstanceRequest({
    regionId,
    instanceType: 'Redis',
    engineVersion: '7.0',
    instanceClass: 'redis.master.small.default',
    chargeType: 'PostPaid',
    password: 'MyP@ssw0rd!',
    instanceName: 'my-redis',
    vpcId, vSwitchId,
  }));
  return body.instanceId!;
}

async function waitForNormal(client: Client, instanceId: string) {
  while (true) {
    const { body } = await client.describeInstanceAttribute(
      new models.DescribeInstanceAttributeRequest({ instanceId })
    );
    const status = body.instances?.DBInstanceAttribute?.[0]?.instanceStatus;
    if (status === 'Normal') return;
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function getInstanceDetail(client: Client, instanceId: string) {
  const { body } = await client.describeInstanceAttribute(
    new models.DescribeInstanceAttributeRequest({ instanceId })
  );
  return body.instances?.DBInstanceAttribute?.[0];
}

async function deleteInstance(client: Client, instanceId: string) {
  await client.deleteInstance(new models.DeleteInstanceRequest({ instanceId }));
}

async function restartInstance(client: Client, instanceId: string) {
  await client.restartInstance(new models.RestartInstanceRequest({ instanceId }));
}

// --- Account Management ---

async function createAccount(client: Client, instanceId: string, name: string, password: string) {
  await client.createAccount(new models.CreateAccountRequest({
    instanceId,
    accountName: name,
    accountPassword: password,
    accountPrivilege: 'RoleReadWrite',
  }));
}

async function listAccounts(client: Client, instanceId: string) {
  const { body } = await client.describeAccounts(new models.DescribeAccountsRequest({ instanceId }));
  return body.accounts?.account || [];
}

// --- Backup ---

async function createBackup(client: Client, instanceId: string) {
  await client.createBackup(new models.CreateBackupRequest({ instanceId }));
}

async function listBackups(client: Client, instanceId: string, startTime: string, endTime: string) {
  const { body } = await client.describeBackups(new models.DescribeBackupsRequest({
    instanceId, startTime, endTime,
  }));
  return body.backups?.backup || [];
}

// --- Security ---

async function setWhitelist(client: Client, instanceId: string, ips: string) {
  await client.modifySecurityIps(new models.ModifySecurityIpsRequest({
    instanceId, securityIps: ips,
  }));
}

async function enableSSL(client: Client, instanceId: string) {
  await client.modifyInstanceSSL(new models.ModifyInstanceSSLRequest({
    instanceId, SSLEnabled: '1',
  }));
}

async function enableAuditLog(client: Client, instanceId: string) {
  await client.modifyAuditLogConfig(new models.ModifyAuditLogConfigRequest({
    instanceId, dbAudit: true,
  }));
}

// --- Monitoring ---

async function getMonitorData(client: Client, instanceId: string, keys: string, startTime: string, endTime: string) {
  const { body } = await client.describeHistoryMonitorValues(
    new models.DescribeHistoryMonitorValuesRequest({
      instanceId, monitorKeys: keys, startTime, endTime,
    })
  );
  return body.monitorHistory;
}

async function getSlowLogs(client: Client, instanceId: string, startTime: string, endTime: string) {
  const { body } = await client.describeSlowLogRecords(new models.DescribeSlowLogRecordsRequest({
    instanceId, startTime, endTime, pageSize: 50,
  }));
  return body.items?.slowLogRecords || [];
}

// --- Parameters ---

async function getParameters(client: Client, instanceId: string) {
  const { body } = await client.describeParameters(new models.DescribeParametersRequest({ instanceId }));
  return body.runningParameters?.parameter || [];
}

async function modifyConfig(client: Client, instanceId: string, config: Record<string, string>) {
  await client.modifyInstanceConfig(new models.ModifyInstanceConfigRequest({
    instanceId, config: JSON.stringify(config),
  }));
}

// --- Tags ---

async function tagInstance(client: Client, regionId: string, instanceId: string, tags: Record<string, string>) {
  await client.tagResources(new models.TagResourcesRequest({
    regionId,
    resourceId: [instanceId],
    resourceType: 'INSTANCE',
    tag: Object.entries(tags).map(([key, value]) => ({ key, value })),
  }));
}

export {
  createClient, listInstances, createRedisInstance, waitForNormal,
  getInstanceDetail, deleteInstance, restartInstance,
  createAccount, listAccounts,
  createBackup, listBackups,
  setWhitelist, enableSSL, enableAuditLog,
  getMonitorData, getSlowLogs,
  getParameters, modifyConfig,
  tagInstance,
};
