# Common Workflows

## Workflow 1: Create Redis Instance with Account

```
Step 1: createInstance → create Redis instance
Step 2: Poll describeInstanceAttribute → wait for Normal
Step 3: createAccount → create database account
Step 4: modifySecurityIps → configure IP whitelist
```

```typescript
import * as models from '@alicloud/r-kvstore20150101/dist/models';

// Create Redis instance
const { body: inst } = await client.createInstance(new models.CreateInstanceRequest({
  regionId: 'cn-hangzhou',
  instanceType: 'Redis',
  engineVersion: '7.0',
  instanceClass: 'redis.master.small.default',
  chargeType: 'PostPaid',
  password: 'MyP@ssw0rd!',
  instanceName: 'my-redis',
  vpcId: 'vpc-bp1xxxxxxxxxxxxx',
  vSwitchId: 'vsw-bp1xxxxxxxxxxxxx',
}));
const instanceId = inst.instanceId!;

// Wait for Normal
while (true) {
  const { body } = await client.describeInstanceAttribute(
    new models.DescribeInstanceAttributeRequest({ instanceId })
  );
  const status = body.instances?.DBInstanceAttribute?.[0]?.instanceStatus;
  if (status === 'Normal') break;
  await new Promise(r => setTimeout(r, 5000));
}

// Set IP whitelist
await client.modifySecurityIps(new models.ModifySecurityIpsRequest({
  instanceId,
  securityIps: '10.0.0.0/8,172.16.0.0/12',
}));
```

## Workflow 2: Create Tair (Enhanced Redis) Cluster

```
Step 1: createTairInstance → create Tair cluster instance
Step 2: Poll describeInstanceAttribute → wait for Normal
Step 3: describeClusterMemberInfo → verify cluster nodes
```

```typescript
const { body: tair } = await client.createTairInstance(new models.CreateTairInstanceRequest({
  regionId: 'cn-hangzhou',
  instanceType: 'tair_rdb',
  instanceClass: 'tair.rdb.2g',
  shardCount: 4,
  chargeType: 'PostPaid',
  password: 'MyP@ssw0rd!',
  instanceName: 'my-tair-cluster',
  vpcId: 'vpc-bp1xxxxxxxxxxxxx',
  vSwitchId: 'vsw-bp1xxxxxxxxxxxxx',
}));
```

## Workflow 3: Backup and Recovery

```
Step 1: modifyBackupPolicy → configure backup schedule
Step 2: createBackup → create manual backup
Step 3: describeBackups → list backups
Step 4: restoreInstance → restore from backup
```

```typescript
// Configure backup policy
await client.modifyBackupPolicy(new models.ModifyBackupPolicyRequest({
  instanceId,
  preferredBackupTime: '02:00Z-03:00Z',
  preferredBackupPeriod: 'Monday,Wednesday,Friday',
}));

// Create manual backup
await client.createBackup(new models.CreateBackupRequest({
  instanceId,
}));

// List backups
const { body: backups } = await client.describeBackups(new models.DescribeBackupsRequest({
  instanceId,
  startTime: '2026-02-01T00:00Z',
  endTime: '2026-02-16T00:00Z',
}));
```

## Workflow 4: Security Hardening (SSL + TDE)

```
Step 1: modifySecurityIps → configure IP whitelist
Step 2: modifyInstanceSSL → enable SSL encryption
Step 3: modifyInstanceTDE → enable TDE
Step 4: modifyAuditLogConfig → enable audit logs
```

```typescript
// Enable SSL
await client.modifyInstanceSSL(new models.ModifyInstanceSSLRequest({
  instanceId,
  SSLEnabled: '1',
}));

// Enable audit logs
await client.modifyAuditLogConfig(new models.ModifyAuditLogConfigRequest({
  instanceId,
  dbAudit: true,
}));
```

## Workflow 5: Cluster Scaling (Add/Remove Shards)

```
Step 1: describeClusterMemberInfo → check current shards
Step 2: addShardingNode → add shards
Step 3: deleteShardingNode → remove shards
```

```typescript
// Add 2 shards
await client.addShardingNode(new models.AddShardingNodeRequest({
  instanceId,
  shardCount: 2,
}));

// Remove specific shard
await client.deleteShardingNode(new models.DeleteShardingNodeRequest({
  instanceId,
  nodeId: 'r-bp1xxxxxxxxxxxxx-db-0',
}));
```

## Workflow 6: Enable Direct Connection Mode

```
Step 1: allocateDirectConnection → enable direct connection
Step 2: describeDBInstanceNetInfo → verify connection info
Step 3: releaseDirectConnection → disable when done
```

```typescript
// Enable direct connection
await client.allocateDirectConnection(new models.AllocateDirectConnectionRequest({
  instanceId,
  connectionString: 'r-bp1xxxxxxxxxxxxx-direct.redis.rds.aliyuncs.com',
  port: '6379',
}));

// Check connection info
const { body: netInfo } = await client.describeDBInstanceNetInfo(
  new models.DescribeDBInstanceNetInfoRequest({ instanceId })
);
```

## Workflow 7: Parameter Tuning with Templates

```
Step 1: describeParameterTemplates → list available parameters
Step 2: createParameterGroup → create parameter template
Step 3: modifyInstanceParameter → apply template to instance
```

```typescript
// Get parameter templates
const { body: templates } = await client.describeParameterTemplates(
  new models.DescribeParameterTemplatesRequest({
    instanceId,
    engineVersion: '7.0',
    characterType: 'standard',
  })
);

// Modify instance parameters
await client.modifyInstanceConfig(new models.ModifyInstanceConfigRequest({
  instanceId,
  config: '{"maxmemory-policy":"allkeys-lru","timeout":"300"}',
}));
```

## Workflow 8: Performance Monitoring

```
Step 1: describeMonitorItems → list available metrics
Step 2: describeHistoryMonitorValues → get metric data
Step 3: describeSlowLogRecords → check slow commands
Step 4: createCacheAnalysisTask → analyze key patterns
```

```typescript
// Get monitoring data
const { body: monitor } = await client.describeHistoryMonitorValues(
  new models.DescribeHistoryMonitorValuesRequest({
    instanceId,
    startTime: '2026-02-15T00:00:00Z',
    endTime: '2026-02-16T00:00:00Z',
    monitorKeys: 'memoryUsage,connectionUsage,cpuUsage',
  })
);

// Check slow logs
const { body: slow } = await client.describeSlowLogRecords(
  new models.DescribeSlowLogRecordsRequest({
    instanceId,
    startTime: '2026-02-15T00:00Z',
    endTime: '2026-02-16T00:00Z',
    pageSize: 50,
  })
);
```
