# PostgreSQL Extensions

PostgreSQL-specific features: extensions, major version upgrade, replication links, and DuckDB.

## describePostgresExtensions

**Signature:** `describePostgresExtensions(request: DescribePostgresExtensionsRequest)`

### Supported database engines RDS PostgreSQL ### References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and i.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp156o9ti493****` |
| `DBName` | string | Yes | The database name. You can call the DescribeDatabases operation to query the database name. Example: `test_db` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy****` |

## updatePostgresExtensions

**Signature:** `updatePostgresExtensions(request: UpdatePostgresExtensionsRequest)`

### Supported database engines RDS PostgreSQL ### References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and i.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-gc7f1****` |
| `DBNames` | string | Yes | The database name. You can call the DescribeDatabases operation to obtain the database name. Example: `test_db` |
| `extensions` | string | Yes | The name of the extension. Separate multiple extensions with commas (,). Example: `citext` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy****` |

## upgradeDBInstanceMajorVersion

**Signature:** `upgradeDBInstanceMajorVersion(request: UpgradeDBInstanceMajorVersionRequest)`

### Supported database engine PostgreSQL ### References Fees are generated if the call is successful. Before you call this operation, read the following documentation and make sure that you fully unde.

**Parameters:** See `UpgradeDBInstanceMajorVersionRequest` model.

## upgradeDBInstanceMajorVersionPrecheck

**Signature:** `upgradeDBInstanceMajorVersionPrecheck(request: UpgradeDBInstanceMajorVersionPrecheckRequest)`

### Supported database engine PostgreSQL ### References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and impacts .

**Parameters:** See `UpgradeDBInstanceMajorVersionPrecheckRequest` model.

## switchOverMajorVersionUpgrade

**Signature:** `switchOverMajorVersionUpgrade(request: SwitchOverMajorVersionUpgradeRequest)`

Supported database engine *   PostgreSQL.

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `DBInstanceName` | string | No | The instance name. Example: `pgm-m5e4gegx63fh92bn` |
| `regionId` | Buffer | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/610399.htm Example: `cn-hangzhou` |
| `switchoverTimeout` | number | No | The timeout period for the switchover operation. The operation is canceled after it has been perform Example: `10` |
| `type` | string | No | The type of the switchover operation. Valid values: Example: `switch` |

## upgradeDBInstanceEngineVersion

**Signature:** `upgradeDBInstanceEngineVersion(request: UpgradeDBInstanceEngineVersionRequest)`

### Supported database engine MySQL ### References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and impacts of this oper.

**Parameters:** See `UpgradeDBInstanceEngineVersionRequest` model.

## upgradeDBInstanceKernelVersion

**Signature:** `upgradeDBInstanceKernelVersion(request: UpgradeDBInstanceKernelVersionRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** See `UpgradeDBInstanceKernelVersionRequest` model.

## describeUpgradeMajorVersionPrecheckTask

**Signature:** `describeUpgradeMajorVersionPrecheckTask(request: DescribeUpgradeMajorVersionPrecheckTaskRequest)`

### [](#)Supported database engines MySQL PostgreSQL ### [](#)References > Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impac.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp1c808s731l****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `targetMajorVersion` | string | No | The new major engine version of the instance. The new major engine version must be later than the or Example: `12.0` |
| `taskId` | number | No | The ID of the upgrade check task. You can obtain the ID of the upgrade check task from the **TaskId* Example: `416980000` |

## describeUpgradeMajorVersionTasks

**Signature:** `describeUpgradeMajorVersionTasks(request: DescribeUpgradeMajorVersionTasksRequest)`

### [](#)Supported database engines PostgreSQL.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp1gm3yh0ht1****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `targetMajorVersion` | string | No | The major engine version of the new instance. Valid values: Example: `12.0` |
| `taskId` | number | No | A reserved parameter. You do not need to specify this parameter. Example: `417450000` |

## rebuildReplicationLink

**Signature:** `rebuildReplicationLink(request: RebuildReplicationLinkRequest)`

### [](#)Supported database engine *   PostgreSQL.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `pgm-bp1trqb4p1xd****` |

## switchReplicationLink

**Signature:** `switchReplicationLink(request: SwitchReplicationLinkRequest)`

### [](#)Supported database engine SQL Server.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the source or primary instance. Example: `rm-2zecuz9tolf******` |
| `targetInstanceName` | string | Yes | The name of the destination DR instance. Example: `rm-t4neh0q12v1******` |
| `targetInstanceRegionId` | string | Yes | The ID of the region in which the destination DR instance resides. Example: `ap-southeast-1` |

## precheckDuckDBDependency

**Signature:** `precheckDuckDBDependency(request: PrecheckDuckDBDependencyRequest)`

### [](#)Supported database engine RDS PostgreSQL ### [](#)References [DuckDB-based analytical instance](https://help.aliyun.com/document_detail/2977241.html).

**Parameters:** See `PrecheckDuckDBDependencyRequest` model.

## describeDBMiniEngineVersions

**Signature:** `describeDBMiniEngineVersions(request: DescribeDBMiniEngineVersionsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)Usage notes Before you purchase or upgrade an instance that runs MySQL or PostgreSQL, you can call the DescribeDBMiniEngineVersion.

**Parameters:** See `DescribeDBMiniEngineVersionsRequest` model.

## modifyDBInstanceConfig

**Signature:** `modifyDBInstanceConfig(request: ModifyDBInstanceConfigRequest)`

### [](#)Supported database engines *   PostgreSQL *   SQL Server >  The configuration items that are supported are pgbouncer and clear_errorlog. For more information, see [PgBouncer of ApsaraDB RDS f.

**Parameters:** See `ModifyDBInstanceConfigRequest` model.

## describeDBInstanceAttribute

**Signature:** `describeDBInstanceAttribute(request: DescribeDBInstanceAttributeRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** See `DescribeDBInstanceAttributeRequest` model.

## preCheckCreateOrderForDeleteDBNodes

**Signature:** `preCheckCreateOrderForDeleteDBNodes(request: PreCheckCreateOrderForDeleteDBNodesRequest)`

删除节点创建订单预检查.

**Parameters:** See `PreCheckCreateOrderForDeleteDBNodesRequest` model.


## createPostgresExtensions

**Signature:** `createPostgresExtensions(request: CreatePostgresExtensionsRequest)`

### [](#)Supported database engines PostgreSQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impacts of.

**Parameters:** (3 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The account of the user who owns the extension. Only privileged accounts are supported. Example: `test_user` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-gc7f1****` |
| `DBNames` | string | Yes | The database name. You can call the DescribeDatabases operation to query the database name. Example: `test_db` |
| `extensions` | string | No | The extension that you want to install. If you want to install multiple extensions, separate them wi Example: `citext,pg_profile` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy****` |
| `riskConfirmed` | boolean | No | The risk description that you need to confirm. If your instance runs an outdated minor engine versio Example: `true` |
| `sourceDatabase` | string | No | The source database from which you want to synchronize the extension to the destination database. If Example: `source_db` |


## deletePostgresExtensions

**Signature:** `deletePostgresExtensions(request: DeletePostgresExtensionsRequest)`

### Supported database engines RDS PostgreSQL ### References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and i.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp156o9ti493****` |
| `DBNames` | string | Yes | The database on which the extension is installed. If you want to specify multiple databases, separat Example: `test_db` |
| `extensions` | string | Yes | The name of the extension. If you want to specify multiple extensions, separate the extension names  Example: `citext` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy****` |


## describePGHbaConfig

**Signature:** `describePGHbaConfig(request: DescribePGHbaConfigRequest)`

### [](#)Supported database engines RDS PostgreSQL.


## modifyPGHbaConfig

**Signature:** `modifyPGHbaConfig(request: ModifyPGHbaConfigRequest)`

### [](#)Supported database engines RDS PostgreSQL ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequis.


## describeModifyPGHbaConfigLog

**Signature:** `describeModifyPGHbaConfigLog(request: DescribeModifyPGHbaConfigLogRequest)`

### [](#)Supported database engines RDS PostgreSQL.


## createReplicationLink

**Signature:** `createReplicationLink(request: CreateReplicationLinkRequest)`

### [](#)Supported database engines *   PostgreSQL *   SQL Server >  The parameters vary based on database engines..

**Parameters:** (2 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the DR instance. Example: `pgm-bp1trqb4p1xd****` |
| `dryRun` | boolean | Yes | Specifies whether to perform a dry run before the system creates the DR instance. Valid values: Example: `false` |
| `replicatorAccount` | string | No | The account of the database that is used for data synchronization. Example: `testdbuser` |
| `replicatorPassword` | string | No | The password of the account. Example: `testpassword` |
| `sourceAddress` | string | No | The endpoint of the source ApsaraDB RDS for PostgreSQL instance or the IP address of the source Apsa Example: `pgm-****.pg.rds.aliyuncs.com` |
| `sourceCategory` | string | No | The type of the source instance. Valid values: Example: `aliyunRDS` |
| `sourceInstanceName` | string | No | The name of the source instance. If you set **SourceCategory** to **aliyunRDS**, this parameter is r Example: `testInstance` |
| `sourceInstanceRegionId` | string | No | The region ID of the source instance. If you set **SourceCategory** to **aliyunRDS**, this parameter Example: `cn-hangzhou` |
| `sourcePort` | number | No | The port of the source instance. Example: `5432` |
| `targetAddress` | string | No | The IP address of the DR instance of the ApsaraDB RDS for SQL Server instance. Example: `192.XXX.XX.XXX` |
| `taskId` | number | No | The task ID of the successful dry run. Example: `439946016` |
| `taskName` | string | No | The task name of the dry run. You can specify a custom task name. If you do not specify this paramet Example: `test01` |


## deleteReplicationLink

**Signature:** `deleteReplicationLink(request: DeleteReplicationLinkRequest)`

### [](#)Supported database engines *   PostgreSQL *   SQL Server.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the DR instance. Example: `pgm-bp1trqb4p1xd****` |
| `promoteToMaster` | boolean | Yes | Specifies whether to delete the data synchronization link between the DR instance and the primary in Example: `true` |


## describeReplicationLinkLogs

**Signature:** `describeReplicationLinkLogs(request: DescribeReplicationLinkLogsRequest)`

### [](#)Supported database engine *   PostgreSQL.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the instance. Example: `pgm-bp1trqb4p1xd****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `taskId` | number | No | The task ID. You must set this parameter to the ID of the task that you create by calling the **Crea Example: `8413252` |
| `taskName` | string | No | The task name. You must set this parameter to the name of the task that you create by calling the ** Example: `test01` |
| `taskType` | string | Yes | The type of the task. Valid values: Example: `create` |


## deleteSlot

**Signature:** `deleteSlot(request: DeleteSlotRequest)`

### [](#)Supported database engine *   PostgreSQL ### [](#)Precautions You can delete a replication slot only when the status of the slot is **INACTIVE**. You can call the DescribeSlots operation to q.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `ETnLKlblzczshOTUbOC****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp102g323jd4****` |
| `resourceGroupId` | string | No | The ID of the resource group. You can leave this parameter empty. Example: `rg-acfmy*****` |
| `slotName` | string | Yes | The name of the replication slot. You can call the DescribeSlots operation to query the name of the  Example: `slot_test01` |
| `slotStatus` | string | Yes | The status of the replication slot. You can call the DescribeSlots operation to query the status of  Example: `INACTIVE` |


## describeSlots

**Signature:** `describeSlots(request: DescribeSlotsRequest)`

### [](#)Supported database engines *   PostgreSQL.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `ETnLKlblzczshOTUbOC****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp102g323jd4****` |
| `resourceGroupId` | string | No | The resource group ID. You can leave this parameter empty. Example: `rg-acfmy*****` |


## describeAnalyticdbByPrimaryDBInstance

**Signature:** `describeAnalyticdbByPrimaryDBInstance(request: DescribeAnalyticdbByPrimaryDBInstanceRequest)`

### [](#)Supported database engines MySQL ### [](#)References [Create and view an analytic instance](https://help.aliyun.com/document_detail/2950002.html).


## describeSQLServerUpgradeVersions

**Signature:** `describeSQLServerUpgradeVersions(request: DescribeSQLServerUpgradeVersionsRequest)`

查询SQLServer升级版本.


## describeDedicatedHostGroups

**Signature:** `describeDedicatedHostGroups(request: DescribeDedicatedHostGroupsRequest)`

Dedicated clusters allow you to manage a number of instances in a cluster at a time. You can create multiple dedicated clusters in a single region. Each dedicated cluster consists of multiple hosts. Y.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostGroupId` | string | No | The dedicated cluster ID. Example: `dhg-7a9xxxxxxxx` |
| `imageCategory` | string | No | The image based on which the hosts in the dedicated clusters are created. Valid values: Example: `WindowsWithMssqlStdLicense` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |


## describeDedicatedHosts

**Signature:** `describeDedicatedHosts(request: DescribeDedicatedHostsRequest)`

Dedicated clusters allow you to manage a number of instances at a time. You can create multiple dedicated clusters in a single region. Each dedicated cluster consists of multiple hosts. You can create.

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationStatus` | string | No | Specifies whether instances can be deployed on the host. Valid values: Example: `1` |
| `dedicatedHostGroupId` | string | No | The dedicated cluster ID. You can call the DescribeDedicatedHostGroups operation to query the dedica Example: `dhg-7a9xxxxxxxx` |
| `dedicatedHostId` | string | No | The ID of the host in the dedicated cluster. Example: `ch-t4nn100ddxxxxxxxx` |
| `hostStatus` | string | No | The status of the host. Valid values: Example: `1` |
| `hostType` | string | No | The storage type of the host. Valid values: Example: `dhg_cloud_ssd` |
| `orderId` | number | No | The order ID. Example: `102565235` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `zoneId` | string | No | The zone ID. Example: `cn-hangzhou-i` |


## describeHostGroupElasticStrategyParameters

**Signature:** `describeHostGroupElasticStrategyParameters(request: DescribeHostGroupElasticStrategyParametersRequest)`

查询主机组弹性策略参数.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostGroupName` | string | Yes | The name of the dedicated cluster. Example: `dhg-d0dwi82293b2w9t5` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy****` |


## describeHostWebShell

**Signature:** `describeHostWebShell(request: DescribeHostWebShellRequest)`

### [](#)Supported database engine *   SQL Server ### [](#)Prerequisite *   The instance meets the following requirements: *   The instance resides in a region other than the China (Zhangjiakou) regio.

**Parameters:** (5 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The username of the account that is used to log on to the host of the instance. Example: `testOsAccount1` |
| `accountPassword` | string | Yes | The password of the host account. Example: `***` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `hostName` | string | Yes | The instance hostname. You can call the DescribeDBInstanceIpHostname operation to query the hostname Example: `testHost1` |
| `regionID` | string | Yes | The region ID of the instance. You can call the DescribeDBInstanceAttribute operation to query the r Example: `cn-hangzhou` |

