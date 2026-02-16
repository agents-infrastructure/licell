# Read-Only & Proxy

Read-only instances, database proxy (DBProxy), and read/write splitting.

## createReadOnlyDBInstance

**Signature:** `createReadOnlyDBInstance(request: CreateReadOnlyDBInstanceRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** See `CreateReadOnlyDBInstanceRequest` model.

## describeReadDBInstanceDelay

**Signature:** `describeReadDBInstanceDelay(request: DescribeReadDBInstanceDelayRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL.

**Parameters:** See `DescribeReadDBInstanceDelayRequest` model.

## modifyReadonlyInstanceDelayReplicationTime

**Signature:** `modifyReadonlyInstanceDelayReplicationTime(request: ModifyReadonlyInstanceDelayReplicationTimeRequest)`

### Supported database engines RDS MySQL ### References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and impact.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the read-only instance. You can call the DescribeDBInstances operation to query the instan Example: `rr-bpxxxxx` |
| `readSQLReplicationTime` | string | Yes | The replication latency of the data replication. Unit: seconds. Example: `100` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute to query the resource group ID. Example: `rg-acfmy****` |

## createDBProxyEndpointAddress

**Signature:** `createDBProxyEndpointAddress(request: CreateDBProxyEndpointAddressRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** See `CreateDBProxyEndpointAddressRequest` model.

## modifyDBProxy

**Signature:** `modifyDBProxy(request: ModifyDBProxyRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL >  Starting October 17, 2023, ApsaraDB RDS for MySQL instances that run RDS Cluster Edition offer one free-of-charge dedicated database pro.

**Parameters:** See `ModifyDBProxyRequest` model.

## modifyDBProxyEndpoint

**Signature:** `modifyDBProxyEndpoint(request: ModifyDBProxyEndpointRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prereq.

**Parameters:** See `ModifyDBProxyEndpointRequest` model.

## modifyDBProxyEndpointAddress

**Signature:** `modifyDBProxyEndpointAddress(request: ModifyDBProxyEndpointAddressRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites .

**Parameters:** See `ModifyDBProxyEndpointAddressRequest` model.

## modifyDBProxyInstance

**Signature:** `modifyDBProxyInstance(request: ModifyDBProxyInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL >  Starting October 17, 2023, ApsaraDB RDS for MySQL instances that run RDS Cluster Edition offer one free-of-charge dedicated database pro.

**Parameters:** See `ModifyDBProxyInstanceRequest` model.

## describeDBProxy

**Signature:** `describeDBProxy(request: DescribeDBProxyRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL.

**Parameters:** See `DescribeDBProxyRequest` model.

## describeDBProxyEndpoint

**Signature:** `describeDBProxyEndpoint(request: DescribeDBProxyEndpointRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL.

**Parameters:** See `DescribeDBProxyEndpointRequest` model.

## describeDBProxyPerformance

**Signature:** `describeDBProxyPerformance(request: DescribeDBProxyPerformanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL >  Starting October 17, 2023, ApsaraDB RDS provides a dedicated proxy free of charge for each ApsaraDB RDS for MySQL instance on RDS Cluste.

**Parameters:** See `DescribeDBProxyPerformanceRequest` model.

## deleteDBProxyEndpointAddress

**Signature:** `deleteDBProxyEndpointAddress(request: DeleteDBProxyEndpointAddressRequest)`

### Supported database engines *   MySQL *   PostgreSQL ### References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** See `DeleteDBProxyEndpointAddressRequest` model.

## upgradeDBProxyInstanceKernelVersion

**Signature:** `upgradeDBProxyInstanceKernelVersion(request: UpgradeDBProxyInstanceKernelVersionRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References >  Before you call this operation, carefully read the following documentation. Make sure that you fully understand the .

**Parameters:** See `UpgradeDBProxyInstanceKernelVersionRequest` model.

## allocateReadWriteSplittingConnection

**Signature:** `allocateReadWriteSplittingConnection(request: AllocateReadWriteSplittingConnectionRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)Feature description If read-only instances are attached to a primary ApsaraDB RDS for SQL Server instance, you can call this opera.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionStringPrefix` | string | No | The prefix of the read-only routing endpoint. The prefix must be unique. It can be up to 30 characte Example: `rr-m5exxxxx-rw.mysql.rds.aliyuncs.com` |
| `DBInstanceId` | string | Yes | The primary instance ID. You can call the DescribeDBInstances operation to query the primary instanc Example: `rm-uf6wjk5xxxxxxx` |
| `distributionType` | string | No | The method that is used to assign read weights. Valid values: Example: `Standard` |
| `maxDelayTime` | string | No | The threshold of the latency that is allowed on the read-only instances. Valid values: 0 to 7200. De Example: `30` |
| `netType` | string | No | The network type of the read-only routing endpoint. Valid values: Example: `Intranet` |
| `port` | string | No | The port that is associated with the read-only routing endpoint. Valid values: 1000 to 5999. Default Example: `1433` |
| `weight` | string | No | The read weights of the primary instance and its read-only instances. The read weight is increased i Example: `{"rm-bp1**********":800,"master":400,"slave":400}` |

## calculateDBInstanceWeight

**Signature:** `calculateDBInstanceWeight(request: CalculateDBInstanceWeightRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)Feature description When the [read/write splitting](https://help.aliyun.com/document_detail/51073.html) feature is enabled, this o.

**Parameters:** See `CalculateDBInstanceWeightRequest` model.

## modifyReadWriteSplittingConnection

**Signature:** `modifyReadWriteSplittingConnection(request: ModifyReadWriteSplittingConnectionRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)Prerequisites Before you call this operation, make sure that the following requirements are met: *   The shared proxy feature is e.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionStringPrefix` | string | No | The prefix of the read/write splitting endpoint. The prefix must be unique. It can be up to 30 chara Example: `rm-m5xxxxxxxxrw.mysql.rds.aliyuncs.com` |
| `DBInstanceId` | string | Yes | The ID of the primary instance. You can call the DescribeDBInstances operation to query the instance Example: `rm-uf6wjk5xxxxxxx` |
| `distributionType` | string | No | The method that is used to assign read weights. Valid values: Example: `Standard` |
| `maxDelayTime` | string | No | The latency threshold that is allowed by the read/write splitting link. Unit: seconds. If the latenc Example: `12` |
| `port` | string | No | The port that is associated with the read/write splitting endpoint. Example: `3306` |
| `weight` | string | No | The read weights of the primary instance and its read-only instances. A read weight must be a multip Example: `{"rm-bp1**********":800,"master":400,"slave":400}` |

## releaseReadWriteSplittingConnection

**Signature:** `releaseReadWriteSplittingConnection(request: ReleaseReadWriteSplittingConnectionRequest)`

### Supported database engines *   MySQL *   SQL Server ### Prerequisites Before you call this operation, make sure that the following requirements are met: *   The shared proxy feature is enabled for.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the primary instance. You can call the DescribeDBInstances operation to query the instance Example: `rm-uf6wjk5xxxxxxx` |


## getDbProxyInstanceSsl

**Signature:** `getDbProxyInstanceSsl(request: GetDbProxyInstanceSslRequest)`

### [](#)Supported database engines RDS MySQL.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBProxyEngineType` | string | No | A reserved parameter. You do not need to specify this parameter. Example: `normal` |
| `dbInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-t4n3axxxxx` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |


## modifyDbProxyInstanceSsl

**Signature:** `modifyDbProxyInstanceSsl(request: ModifyDbProxyInstanceSslRequest)`

### [](#)Supported database engines RDS MySQL ### [](#)References > : Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and imp.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBProxyEngineType` | string | No | A reserved parameter. You do not need to specify this parameter. Example: `normal` |
| `dbInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-t4n3axxxxx` |
| `dbProxyConnectString` | string | Yes | The dedicated proxy endpoint of the instance. Example: `test123456.rwlb.rds.aliyuncs.com` |
| `dbProxyEndpointId` | string | Yes | The ID of the proxy endpoint. You can call the DescribeDBProxyEndpoint operation to query the ID of  Example: `ta9um4xxxxx` |
| `dbProxySslEnabled` | string | Yes | The SSL configuration setting that you want to apply on the instance. Valid values: Example: `1` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |

