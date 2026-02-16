# Migration & Import/Export

Database migration tasks, data import/export, and OSS integration.

## createMigrateTask

**Signature:** `createMigrateTask(request: CreateMigrateTaskRequest)`

### [](#)Supported database engine SQL Server ### [](#)Limits Data migration across Alibaba Cloud accounts is not supported. For example, backup files in an Object Storage Service (OSS) bucket within .

**Parameters:** (6 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupMode` | string | Yes | The type of the migration task. Valid values: Example: `FULL` |
| `checkDBMode` | string | No | The consistency check method for the database. Valid values: Example: `AsyncExecuteDBCheck` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk******` |
| `DBName` | string | Yes | The name of the destination database. Example: `testDB` |
| `isOnlineDB` | string | Yes | Specifies whether to make the restored database data available for user access. Valid values: Example: `True` |
| `migrateTaskId` | string | No | The migration task ID. Example: `None` |
| `OSSUrls` | string | Yes | The shared URL of the backup file in the OSS bucket. The URL must be encoded. Example: `check_cdn_oss.sh` |
| `ossObjectPositions` | string | Yes | The information about the backup file in the OSS bucket. The values consist of three parts that are  Example: `oss-ap-southeast-1.aliyuncs.com:rdsmssqlsingapore:autotest_2008R2_TestMigration_FULL.bak` |

## describeMigrateTasks

**Signature:** `describeMigrateTasks(request: DescribeMigrateTasksRequest)`

### [](#)Supported database engine *   SQL Server ### [](#)Usage notes This operation allows you to query the migration tasks that are created for the instance over the last week. ### [](#)Precautions.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2017-10-25T01:00Z` |
| `pageNumber` | number | No | The page number. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30** to **100**. Default value: **30** Example: `30` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2017-10-20T01:00Z` |

## describeMigrateTaskById

**Signature:** `describeMigrateTaskById(request: DescribeMigrateTaskByIdRequest)`

### [](#)Supported database engines *   SQL Server.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bp11e1tzgxxxx4ox` |
| `migrateTaskId` | string | Yes | The migration task ID. You can call the DescribeMigrateTasks operation to query the migration task I Example: `235943` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |

## terminateMigrateTask

**Signature:** `terminateMigrateTask(request: TerminateMigrateTaskRequest)`

### [](#)Supported database engines *   SQL Server.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bp159vfbu******` |
| `migrateTaskId` | string | Yes | The migration task ID. You can call the DescribeMigrateTasks operation to query the migration task I Example: `56254****` |

## createOnlineDatabaseTask

**Signature:** `createOnlineDatabaseTask(request: CreateOnlineDatabaseTaskRequest)`

### [](#)Supported database engines *   SQL Server ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequis.

**Parameters:** (4 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `checkDBMode` | string | Yes | The consistency check method after the database is open. Valid values: Example: `AsyncExecuteDBCheck` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `DBName` | string | Yes | The name of the database. Example: `testDB` |
| `migrateTaskId` | string | Yes | The ID of the migration task. Example: `5652255443` |

## describeOssDownloads

**Signature:** `describeOssDownloads(request: DescribeOssDownloadsRequest)`

### [](#)Supported database engines *   SQL Server ### [Usage notes](#) This operation is not supported for instances that run SQL Server 2017 EE or SQL Server 2019 EE..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `migrateTaskId` | string | Yes | The migration task ID. You can call the DescribeMigrateTasks operation to query the migration task I Example: `5625458541` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |

## importUserBackupFile

**Signature:** `importUserBackupFile(request: ImportUserBackupFileRequest)`

### [](#)Supported database engines *   MySQL ### [](#)Description A full backup file contains the data of a self-managed MySQL instance. You can restore the data of a self-managed MySQL instance from.

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupFile` | string | No | A JSON array that consists of the information about the full backup file stored as an object in an O Example: `{"Bucket":"test",` |
| `bucketRegion` | string | No | The region ID of the OSS bucket where the full backup file of the self-managed MySQL database is loc Example: `cn-hangzhou` |
| `comment` | string | No | The description of the full backup file. Example: `BackupTest` |
| `DBInstanceId` | string | No | The instance ID. Example: `rm-uf6wjk5****` |
| `engineVersion` | string | No | The version of the database engine that is run on the self-managed MySQL database and ApsaraDB RDS f Example: `5.7` |
| `mode` | string | No | - Example: `oss` |
| `regionId` | string | Yes | The region ID of the instance. You can call the DescribeRegions operation to query the most recent r Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy****` |
| `restoreSize` | number | No | The amount of storage that is required to restore the data of the full backup file. Unit: GB. Example: `20` |
| `retention` | number | No | The retention period of the full backup file. Unit: days. Valid values: any **non-zero** positive in Example: `30` |
| `zoneId` | string | No | The zone ID. You can call the DescribeRegions operation to query the zone ID. Example: `cn-hangzhou-b` |

## validateImportTask

**Signature:** `validateImportTask(request: ValidateImportTaskRequest)`

预检验数据导入任务参数.

**Parameters:** (7 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dbInstanceId` | string | Yes | This parameter is required. Example: `rm-sdfljk123****` |
| `estimatedSize` | number | No | - Example: `100` |
| `host` | string | Yes | This parameter is required. Example: `192.168.10.1` |
| `password` | string | Yes | This parameter is required. Example: `UGFzc3dvcmQxMjMK` |
| `port` | number | Yes | This parameter is required. Example: `3306` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `sourceInstanceId` | string | No | - Example: `i-wz9ff3acy500io5wdf5s` |
| `sourcePlatform` | string | No | - Example: `ECS` |
| `streamPort` | number | Yes | This parameter is required. Example: `9999` |
| `user` | string | Yes | This parameter is required. Example: `myadmin` |
| `xtrabackupPath` | string | No | - Example: `/usr/local/bin/xtrabackup` |


## createCloudMigrationPrecheckTask

**Signature:** `createCloudMigrationPrecheckTask(request: CreateCloudMigrationPrecheckTaskRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** (6 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp102g323jd4****` |
| `sourceAccount` | string | Yes | The username of the account that is used to connect to the self-managed PostgreSQL instance. Enter t Example: `migratetest` |
| `sourceCategory` | string | Yes | The environment in which the self-managed PostgreSQL instance runs. Example: `ecsOnVpc` |
| `sourceIpAddress` | string | Yes | The private IP address that is used to connect to the self-managed PostgreSQL instance. Example: `172.2.XX.XX` |
| `sourcePassword` | string | Yes | The password of the account that is used to connect to the self-managed PostgreSQL instance. Enter t Example: `123456` |
| `sourcePort` | number | Yes | The port that is used to connect to the self-managed PostgreSQL instance. You can run the `netstat - Example: `5432` |
| `taskName` | string | No | The name of the task. If you do not specify this parameter, ApsaraDB RDS automatically generates a n Example: `slf7w7wj3g` |


## createCloudMigrationTask

**Signature:** `createCloudMigrationTask(request: CreateCloudMigrationTaskRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequis.

**Parameters:** (6 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The ID of the destination instance. You can call the DescribeDBInstances operation to query the inst Example: `pgm-bp102g323jd4****` |
| `sourceAccount` | string | Yes | The username of the account that is used to connect to the self-managed PostgreSQL instance. Enter t Example: `migratetest` |
| `sourceCategory` | string | Yes | The environment in which the self-managed PostgreSQL instance runs. Example: `ecsOnVpc` |
| `sourceIpAddress` | string | Yes | The private or public IP address that is used to connect to the self-managed PostgreSQL instance. Example: `172.16.XX.XX` |
| `sourcePassword` | string | Yes | The password of the account that is used to connect to the self-managed PostgreSQL instance. Enter t Example: `123456` |
| `sourcePort` | number | Yes | The port number that is used to connect to the self-managed PostgreSQL instance. You can run the `ne Example: `5432` |
| `taskName` | string | No | The name of the task. If you do not specify this parameter, ApsaraDB RDS automatically generates a n Example: `362c6c7a-4d20-4eac-898c-1495ceab374c` |


## describeCloudMigrationPrecheckResult

**Signature:** `describeCloudMigrationPrecheckResult(request: DescribeCloudMigrationPrecheckResultRequest)`

### [](#)Supported database engines *   PostgreSQL.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp102g323jd4****` |
| `pageNumber` | number | Yes | The page number. Pages start from page 1. Default value: **1**. Example: `1` |
| `pageSize` | number | Yes | The number of entries per page. Valid values: **30** to **100**. Default value: 30. Example: `30` |
| `sourceIpAddress` | string | No | The private or public IP address that is used to connect to the self-managed PostgreSQL instance. Example: `172.2.XX.XX` |
| `sourcePort` | number | No | The port number that is used to connect to the self-managed PostgreSQL instance. You can run the net Example: `5432` |
| `taskId` | number | No | The task ID. You can obtain the task ID from the response that is returned after you call the Create Example: `439946016` |
| `taskName` | string | No | The task name. You can obtain the task name from the response that is returned after you call the Cr Example: `slf7w7wj3g` |


## describeCloudMigrationResult

**Signature:** `describeCloudMigrationResult(request: DescribeCloudMigrationResultRequest)`

### [](#)Supported database engines *   PostgreSQL.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp102g323jd4****` |
| `pageNumber` | number | Yes | The number of entries per page. Example: `10` |
| `pageSize` | number | Yes | The page number. Example: `1` |
| `sourceIpAddress` | string | No | The private IP address that is used to connect to the self-managed PostgreSQL instance. Example: `172.16.XX.XX` |
| `sourcePort` | number | No | The port number that is used to connect to the self-managed PostgreSQL instance. You can run the net Example: `5432` |
| `taskId` | number | No | The task ID. You can obtain the task ID from the response that is returned when you call the CreateC Example: `440437220` |
| `taskName` | string | No | The task name. You can obtain the task name from the response that is returned when you call the Cre Example: `362c6c7a-4d20-4eac-898c-1495ceab374c` |


## descibeImportsFromDatabase

**Signature:** `descibeImportsFromDatabase(request: DescibeImportsFromDatabaseRequest)`

### [](#)Supported database engines *   MySQL.

**Parameters:** (4 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the IDs of instances. Example: `rm-bpxxxxx` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T*H Example: `2011-06-11T16:00Z` |
| `engine` | string | Yes | The database engine of the instance. Set the value to **MySQL** Example: `MySQL` |
| `importId` | number | No | The ID of the migration task. Example: `123` |
| `pageNumber` | number | No | The page number. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: Example: `30` |
| `resourceGroupId` | string | No | The ID of the resource group. You can call the DescribeDBInstanceAttribute operation to obtain the I Example: `rg-acfmy*****` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2011-06-11T15:00Z` |


## createImportTask

**Signature:** `createImportTask(request: CreateImportTaskRequest)`

创建数据导入任务.

**Parameters:** (7 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dbInstanceId` | string | Yes | This parameter is required. Example: `rm-bp1u*****ggm7j9j` |
| `estimatedSize` | number | No | - Example: `1000` |
| `host` | string | Yes | This parameter is required. Example: `172.20.246.90` |
| `password` | string | Yes | This parameter is required. Example: `OEF5JjVOM2pzZXFKRw==` |
| `port` | number | Yes | This parameter is required. Example: `3306` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `sourceInstanceId` | string | No | - Example: `i-bp1fe296n52ub3chezpg` |
| `sourcePlatform` | string | No | - Example: `ECS` |
| `streamPort` | number | Yes | This parameter is required. Example: `9999` |
| `user` | string | Yes | This parameter is required. Example: `myadmin` |
| `xtrabackupPath` | string | No | - Example: `/usr/bin/xtrabackup` |


## describeImportTask

**Signature:** `describeImportTask(request: DescribeImportTaskRequest)`

查询原生复制上云任务详情.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | This parameter is required. Example: `rm-****` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `taskId` | string | Yes | This parameter is required. Example: `159****` |


## describeImportTaskValidation

**Signature:** `describeImportTaskValidation(request: DescribeImportTaskValidationRequest)`

查看数据导入预检查状态.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dbInstanceId` | string | Yes | This parameter is required. Example: `rm-xjkljj****` |
| `taskId` | number | Yes | This parameter is required. Example: `41698****` |


## modifyImportTask

**Signature:** `modifyImportTask(request: ModifyImportTaskRequest)`

修改上云任务.

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | This parameter is required. Example: `rm-2ze63v2p3o3k****` |
| `operation` | string | Yes | This parameter is required. Example: `CANCEL` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `taskId` | string | Yes | This parameter is required. Example: `1234567` |


## listImportTasks

**Signature:** `listImportTasks(request: ListImportTasksRequest)`

查询上云任务列表.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | This parameter is required. Example: `rm-uf6wjk5****` |
| `maxResults` | number | No | - Example: `30` |
| `nextToken` | string | No | - Example: `AAAAAdDWBF2` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-beijing` |


## validateImportTask

**Signature:** `validateImportTask(request: ValidateImportTaskRequest)`

预检验数据导入任务参数.

**Parameters:** (7 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dbInstanceId` | string | Yes | This parameter is required. Example: `rm-sdfljk123****` |
| `estimatedSize` | number | No | - Example: `100` |
| `host` | string | Yes | This parameter is required. Example: `192.168.10.1` |
| `password` | string | Yes | This parameter is required. Example: `UGFzc3dvcmQxMjMK` |
| `port` | number | Yes | This parameter is required. Example: `3306` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `sourceInstanceId` | string | No | - Example: `i-wz9ff3acy500io5wdf5s` |
| `sourcePlatform` | string | No | - Example: `ECS` |
| `streamPort` | number | Yes | This parameter is required. Example: `9999` |
| `user` | string | Yes | This parameter is required. Example: `myadmin` |
| `xtrabackupPath` | string | No | - Example: `/usr/local/bin/xtrabackup` |


## createGADInstance

**Signature:** `createGADInstance(request: CreateGADInstanceRequest)`

### [](#)Supported database engines *   MySQL.


## createGadInstanceMember

**Signature:** `createGadInstanceMember(request: CreateGadInstanceMemberRequest)`

### [](#)Supported database engines *   RDS MySQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisite.

**Parameters:** (12 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceDescription` | string | No | The name of the unit node that you want to create. The name must meet the following requirements: Example: `test` |
| `DBInstanceStorage` | number | No | The storage capacity of the unit node that you want to create. Unit: GB The storage capacity increas Example: `20` |
| `DBInstanceStorageType` | string | No | The storage type of the instance. Valid values: Example: `cloud_essd` |
| `dbInstanceClass` | string | No | The instance type of the unit node that you want to create. For more information, see [Primary Apsar Example: `rds.mysql.t1.small` |
| `dtsConflict` | string | Yes | The conflict resolution policy based on which Data Transmission Service (DTS) responds to primary ke Example: `overwrite` |
| `dtsInstanceClass` | string | Yes | The specifications of the data synchronization task for the unit node that you want to create. Valid Example: `medium` |
| `engine` | string | No | The database engine of the unit node that you want to create. Set the value to **MySQL**. Example: `MySQL` |
| `engineVersion` | string | No | The database engine version of the unit node that you want to create. Valid values: Example: `8.0` |
| `regionID` | string | Yes | The region ID of the unit node or secondary node that you want to create. You can call the DescribeR Example: `cn-hangzhou` |
| `securityIPList` | string | No | The [IP address whitelist](https://help.aliyun.com/document_detail/43185.html) of the unit node that Example: `10.10.XX.XX` |
| `vSwitchID` | string | Yes | The vSwitch ID of the unit node that you want to create. Example: `vsw-bp1tg609m5j85****` |
| `vpcID` | string | Yes | The virtual private cloud (VPC) ID of the unit node that you want to create. Example: `vpc-bp19ame5m1r3o****` |
| `zoneID` | string | No | The zone ID of the unit node that you want to create. You can call the DescribeRegions operation to  Example: `cn-hangzhou-h` |
| `zoneIDSlave1` | string | No | The zone ID of the secondary node of the unit node that you want to create. You can call the Describ Example: `cn-hangzhou-h` |
| `zoneIDSlave2` | string | No | The zone ID of the logger node of the unit node that you want to create. You can call the DescribeRe Example: `cn-hangzhou-h` |
| `centralDBInstanceId` | string | Yes | The ID of the central node . You can call the DescribeGadInstances operation to query the ID. Example: `gad-rm-bp1npi2j8****` |
| `centralRdsDtsAdminAccount` | string | Yes | The username of the privileged account of the central node. You can call the DescribeAccounts operat Example: `test` |
| `centralRdsDtsAdminPassword` | string | Yes | The password of the privileged account of the central node. Example: `Test12345` |
| `centralRegionId` | string | Yes | The region ID of the central node. You can call the DescribeRegions operation to query the most rece Example: `cn-hangzhou` |
| `DBList` | string | Yes | A JSON array that consists of the information about the databases on the central node. All database  Example: `{` |
| `gadInstanceId` | string | Yes | The ID of the global active database cluster. You can call the DescribeGadInstances operation to que Example: `gad-rm-bp1npi2j8****` |
| `unitNode` | CreateGadInstanceMemberRequestUnitNode[] | Yes | The information about the unit node. |


## describeGadInstances

**Signature:** `describeGadInstances(request: DescribeGadInstancesRequest)`

### [](#)Supported database engines *   MySQL.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gadInstanceName` | string | No | The ID of the global active database cluster. Example: `gad-rm-bp1npi2j8********` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |


## deleteGadInstance

**Signature:** `deleteGadInstance(request: DeleteGadInstanceRequest)`

### [](#)Supported database engines *   MySQL ### [Usage notes](#) *   A global active database cluster cannot be restored after it is deleted. Proceed with caution. *   If you delete a global active .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gadInstanceName` | string | Yes | The ID of the global active database cluster. You can call the GadInstanceName operation to query th Example: `gad-rm-bp1npi2j8********` |
| `regionId` | string | No | The region ID of the central node of the global active database cluster. The central node refers to  Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy*****` |


## detachGadInstanceMember

**Signature:** `detachGadInstanceMember(request: DetachGadInstanceMemberRequest)`

### [](#)Supported database engines *   MySQL ### [Usage notes](#) This operation can be used to remove only unit nodes..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gadInstanceName` | string | Yes | The ID of the global active database cluster. Example: `gad-rm-bp1npi2j8********` |
| `memberInstanceName` | string | Yes | The ID of the instance that serves as the unit node you want to remove. You can call the DescribeGad Example: `rm-bp1npi2j8********` |
| `regionId` | string | No | The region ID of the central node. You can call the DescribeGadInstances operation to query the regi Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy*****` |

