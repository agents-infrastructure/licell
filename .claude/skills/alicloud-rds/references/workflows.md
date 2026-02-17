# Common Workflows

## Workflow 1: Create RDS Instance with Account and Database

```
Step 1: createDBInstance → create RDS instance
Step 2: Poll describeDBInstanceAttribute → wait for Running
Step 3: createAccount → create database account
Step 4: createDatabase → create database
Step 5: grantAccountPrivilege → grant privileges
Step 6: modifySecurityIps → configure IP whitelist
```

```typescript
import * as models from '@alicloud/rds20140815/dist/models';

// Create MySQL instance
const { body: inst } = await client.createDBInstance(new models.CreateDBInstanceRequest({
  regionId: 'cn-hangzhou',
  engine: 'MySQL',
  engineVersion: '8.0',
  DBInstanceClass: 'mysql.n2m.small.2c',
  DBInstanceStorage: 20,
  DBInstanceNetType: 'Intranet',
  payType: 'Postpaid',
  securityIPList: '10.0.0.0/8', // WARNING: never use 0.0.0.0/0 in production
  DBInstanceStorageType: 'cloud_essd',
}));
const dbInstanceId = inst.DBInstanceId!;

// Wait for Running
while (true) {
  const { body } = await client.describeDBInstanceAttribute(
    new models.DescribeDBInstanceAttributeRequest({ DBInstanceId: dbInstanceId })
  );
  if (body.items?.DBInstanceAttribute?.[0]?.DBInstanceStatus === 'Running') break;
  await new Promise(r => setTimeout(r, 10000));
}

// Create account
await client.createAccount(new models.CreateAccountRequest({
  DBInstanceId: dbInstanceId,
  accountName: 'admin',
  accountPassword: process.env.DB_PASSWORD!, // Never hardcode passwords
  accountType: 'Super',
}));

// Create database
await client.createDatabase(new models.CreateDatabaseRequest({
  DBInstanceId: dbInstanceId,
  DBName: 'mydb',
  characterSetName: 'utf8mb4',
}));
```

## Workflow 2: Set Up Read-Only Instance with Proxy

```
Step 1: createReadOnlyDBInstance → create read-only instance
Step 2: createDBProxy → enable database proxy
Step 3: allocateReadWriteSplittingConnection → enable read/write splitting
```

```typescript
// Create read-only instance
const { body: ro } = await client.createReadOnlyDBInstance(
  new models.CreateReadOnlyDBInstanceRequest({
    regionId: 'cn-hangzhou',
    DBInstanceId: dbInstanceId,
    engineVersion: '8.0',
    DBInstanceClass: 'mysql.n2m.small.2c',
    DBInstanceStorage: 20,
    DBInstanceStorageType: 'cloud_essd',
    payType: 'Postpaid',
    zoneId: 'cn-hangzhou-h',
  })
);

// Enable database proxy
await client.createDBProxy(new models.CreateDBProxyRequest({
  DBInstanceId: dbInstanceId,
  DBProxyInstanceType: 'DedicatedProxy',
  DBProxyInstanceNum: 2,
  regionId: 'cn-hangzhou',
}));
```

## Workflow 3: Backup and Point-in-Time Recovery

```
Step 1: modifyBackupPolicy → configure backup schedule
Step 2: createBackup → create manual backup
Step 3: describeBackups → list backups
Step 4: restoreTable → restore specific tables
```

```typescript
// Configure backup policy
await client.modifyBackupPolicy(new models.ModifyBackupPolicyRequest({
  DBInstanceId: dbInstanceId,
  preferredBackupTime: '02:00Z-03:00Z',
  preferredBackupPeriod: 'Monday,Wednesday,Friday',
  backupRetentionPeriod: 7,
}));

// Create manual backup
await client.createBackup(new models.CreateBackupRequest({
  DBInstanceId: dbInstanceId,
  backupMethod: 'Physical',
  backupType: 'FullBackup',
}));

// List backups
const { body: backups } = await client.describeBackups(new models.DescribeBackupsRequest({
  DBInstanceId: dbInstanceId,
  startTime: '2026-02-01T00:00Z',
  endTime: '2026-02-16T00:00Z',
}));
```

## Workflow 4: Cross-Region Backup for Disaster Recovery

```
Step 1: modifyInstanceCrossBackupPolicy → enable cross-region backup
Step 2: describeCrossRegionBackupDBInstance → check status
Step 3: createDdrInstance → create DR instance from backup
```

```typescript
// Enable cross-region backup
await client.modifyInstanceCrossBackupPolicy(
  new models.ModifyInstanceCrossBackupPolicyRequest({
    DBInstanceId: dbInstanceId,
    crossBackupRegion: 'cn-shanghai',
    backupEnabled: '1',
    logBackupEnabled: '1',
    retentType: 1,
    retention: 7,
  })
);
```

## Workflow 5: Security Hardening

```
Step 1: modifySecurityIps → configure IP whitelist
Step 2: modifyDBInstanceSSL → enable SSL
Step 3: modifyDBInstanceTDE → enable TDE encryption
Step 4: modifySQLCollectorPolicy → enable SQL audit
```

```typescript
// Set IP whitelist
await client.modifySecurityIps(new models.ModifySecurityIpsRequest({
  DBInstanceId: dbInstanceId,
  securityIps: '10.0.0.0/8,172.16.0.0/12',
  DBInstanceIPArrayName: 'production',
}));

// Enable SSL
await client.modifyDBInstanceSSL(new models.ModifyDBInstanceSSLRequest({
  DBInstanceId: dbInstanceId,
  connectionString: 'mydb.mysql.rds.aliyuncs.com',
}));

// Enable TDE
await client.modifyDBInstanceTDE(new models.ModifyDBInstanceTDERequest({
  DBInstanceId: dbInstanceId,
  TDEStatus: 'Enabled',
}));
```

## Workflow 6: Parameter Tuning

```
Step 1: describeParameterTemplates → list available parameters
Step 2: describeParameters → get current values
Step 3: modifyParameter → apply changes
Step 4: restartDBInstance → restart if required
```

```typescript
// Get current parameters
const { body: params } = await client.describeParameters(
  new models.DescribeParametersRequest({ DBInstanceId: dbInstanceId })
);

// Modify parameters
await client.modifyParameter(new models.ModifyParameterRequest({
  DBInstanceId: dbInstanceId,
  parameters: 'innodb_buffer_pool_size:1073741824;max_connections:500',
  forcerestart: false,
}));
```

## Workflow 7: Monitoring and Diagnostics

```
Step 1: describeDBInstancePerformance → get performance metrics
Step 2: describeSlowLogRecords → check slow queries
Step 3: createDiagnosticReport → generate diagnostic report
```

```typescript
// Get performance data
const { body: perf } = await client.describeDBInstancePerformance(
  new models.DescribeDBInstancePerformanceRequest({
    DBInstanceId: dbInstanceId,
    key: 'MySQL_Sessions,MySQL_QPSTPS',
    startTime: '2026-02-15T00:00Z',
    endTime: '2026-02-16T00:00Z',
  })
);

// Check slow queries
const { body: slow } = await client.describeSlowLogRecords(
  new models.DescribeSlowLogRecordsRequest({
    DBInstanceId: dbInstanceId,
    startTime: '2026-02-15T00:00Z',
    endTime: '2026-02-16T00:00Z',
    pageSize: 30,
  })
);
```

## Workflow 8: PostgreSQL Major Version Upgrade

```
Step 1: upgradeDBInstanceMajorVersionPrecheck → precheck
Step 2: describeUpgradeMajorVersionPrecheckTask → check result
Step 3: upgradeDBInstanceMajorVersion → perform upgrade
Step 4: describeUpgradeMajorVersionTasks → monitor progress
```

```typescript
// Precheck
await client.upgradeDBInstanceMajorVersionPrecheck(
  new models.UpgradeDBInstanceMajorVersionPrecheckRequest({
    DBInstanceId: dbInstanceId,
    targetMajorVersion: '16',
  })
);
```
