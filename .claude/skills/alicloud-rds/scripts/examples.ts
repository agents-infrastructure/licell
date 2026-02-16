/**
 * Alibaba Cloud RDS - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/rds20140815';
import * as models from '@alicloud/rds20140815/dist/models';
import { Config } from '@alicloud/openapi-core';

function createClient(regionId: string = 'cn-hangzhou'): Client {
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    regionId,
    endpoint: 'rds.aliyuncs.com',
  }));
}

// --- Instance Management ---

async function listInstances(client: Client, regionId: string) {
  let pageNumber = 1;
  const all: any[] = [];
  while (true) {
    const { body } = await client.describeDBInstances(new models.DescribeDBInstancesRequest({
      regionId, pageSize: 100, pageNumber,
    }));
    all.push(...(body.items?.DBInstance || []));
    if (all.length >= (body.totalRecordCount || 0)) break;
    pageNumber++;
  }
  return all;
}

async function createMySQLInstance(client: Client, regionId: string, zoneId: string) {
  const { body } = await client.createDBInstance(new models.CreateDBInstanceRequest({
    regionId, zoneId,
    engine: 'MySQL', engineVersion: '8.0',
    DBInstanceClass: 'mysql.n2m.small.2c',
    DBInstanceStorage: 20,
    DBInstanceNetType: 'Intranet',
    payType: 'Postpaid',
    securityIPList: '0.0.0.0/0',
    DBInstanceStorageType: 'cloud_essd',
  }));
  return body.DBInstanceId!;
}

async function waitForRunning(client: Client, dbInstanceId: string) {
  while (true) {
    const { body } = await client.describeDBInstanceAttribute(
      new models.DescribeDBInstanceAttributeRequest({ DBInstanceId: dbInstanceId })
    );
    const status = body.items?.DBInstanceAttribute?.[0]?.DBInstanceStatus;
    if (status === 'Running') return;
    await new Promise(r => setTimeout(r, 10000));
  }
}

async function getInstanceDetail(client: Client, dbInstanceId: string) {
  const { body } = await client.describeDBInstanceAttribute(
    new models.DescribeDBInstanceAttributeRequest({ DBInstanceId: dbInstanceId })
  );
  return body.items?.DBInstanceAttribute?.[0];
}

async function deleteInstance(client: Client, dbInstanceId: string) {
  await client.deleteDBInstance(new models.DeleteDBInstanceRequest({
    DBInstanceId: dbInstanceId,
  }));
}

// --- Account Management ---

async function createAccount(client: Client, dbInstanceId: string, name: string, password: string) {
  await client.createAccount(new models.CreateAccountRequest({
    DBInstanceId: dbInstanceId,
    accountName: name,
    accountPassword: password,
    accountType: 'Super',
  }));
}

async function listAccounts(client: Client, dbInstanceId: string) {
  const { body } = await client.describeAccounts(new models.DescribeAccountsRequest({
    DBInstanceId: dbInstanceId,
  }));
  return body.accounts?.DBInstanceAccount || [];
}

// --- Database Management ---

async function createDatabase(client: Client, dbInstanceId: string, dbName: string) {
  await client.createDatabase(new models.CreateDatabaseRequest({
    DBInstanceId: dbInstanceId,
    DBName: dbName,
    characterSetName: 'utf8mb4',
  }));
}

async function listDatabases(client: Client, dbInstanceId: string) {
  const { body } = await client.describeDatabases(new models.DescribeDatabasesRequest({
    DBInstanceId: dbInstanceId,
  }));
  return body.databases?.database || [];
}

// --- Backup ---

async function createBackup(client: Client, dbInstanceId: string) {
  const { body } = await client.createBackup(new models.CreateBackupRequest({
    DBInstanceId: dbInstanceId,
    backupMethod: 'Physical',
    backupType: 'FullBackup',
  }));
  return body.backupJobId;
}

async function listBackups(client: Client, dbInstanceId: string, startTime: string, endTime: string) {
  const { body } = await client.describeBackups(new models.DescribeBackupsRequest({
    DBInstanceId: dbInstanceId,
    startTime, endTime,
  }));
  return body.items?.backup || [];
}

// --- Security ---

async function setWhitelist(client: Client, dbInstanceId: string, ips: string) {
  await client.modifySecurityIps(new models.ModifySecurityIpsRequest({
    DBInstanceId: dbInstanceId,
    securityIps: ips,
  }));
}

async function enableSSL(client: Client, dbInstanceId: string, connectionString: string) {
  await client.modifyDBInstanceSSL(new models.ModifyDBInstanceSSLRequest({
    DBInstanceId: dbInstanceId,
    connectionString,
  }));
}

// --- Monitoring ---

async function getPerformance(client: Client, dbInstanceId: string, key: string, startTime: string, endTime: string) {
  const { body } = await client.describeDBInstancePerformance(
    new models.DescribeDBInstancePerformanceRequest({
      DBInstanceId: dbInstanceId, key, startTime, endTime,
    })
  );
  return body.performanceKeys?.performanceKey || [];
}

async function getSlowLogs(client: Client, dbInstanceId: string, startTime: string, endTime: string) {
  const { body } = await client.describeSlowLogRecords(new models.DescribeSlowLogRecordsRequest({
    DBInstanceId: dbInstanceId, startTime, endTime, pageSize: 30,
  }));
  return body.items?.SQLSlowRecord || [];
}

// --- Parameters ---

async function getParameters(client: Client, dbInstanceId: string) {
  const { body } = await client.describeParameters(new models.DescribeParametersRequest({
    DBInstanceId: dbInstanceId,
  }));
  return body.runningParameters?.DBInstanceParameter || [];
}

async function modifyParameters(client: Client, dbInstanceId: string, params: string) {
  await client.modifyParameter(new models.ModifyParameterRequest({
    DBInstanceId: dbInstanceId,
    parameters: params,
    forcerestart: false,
  }));
}

// --- Tags ---

async function tagInstance(client: Client, dbInstanceId: string, tags: Record<string, string>) {
  await client.tagResources(new models.TagResourcesRequest({
    regionId: 'cn-hangzhou',
    resourceId: [dbInstanceId],
    resourceType: 'INSTANCE',
    tag: Object.entries(tags).map(([key, value]) => ({ key, value })),
  }));
}

export {
  createClient, listInstances, createMySQLInstance, waitForRunning,
  getInstanceDetail, deleteInstance,
  createAccount, listAccounts,
  createDatabase, listDatabases,
  createBackup, listBackups,
  setWhitelist, enableSSL,
  getPerformance, getSlowLogs,
  getParameters, modifyParameters,
  tagInstance,
};
