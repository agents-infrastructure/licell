# Backup & Recovery

Backup policies, backup tasks, cross-region backup, point-in-time recovery, and disaster recovery.

## createBackup

**Signature:** `createBackup(request: CreateBackupRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)Feature description This operation uses the backup feature of ApsaraDB RDS to create a backup set. You .

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupMethod` | string | No | The backup type of the instance. Valid values: Example: `Physical` |
| `backupStrategy` | string | No | The backup policy. Valid values: Example: `db` |
| `backupType` | string | No | The backup method. Valid values: Example: `Auto` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5****` |
| `DBName` | string | No | The names of the databases whose data you want to back up. Separate the names of the databases with  Example: `rds_mysql` |

## deleteBackup

**Signature:** `deleteBackup(request: DeleteBackupRequest)`

### Supported database engines *   MySQL *   PostgreSQL > Only instances that run RDS High-availability Edition are supported. ### Description You can call this operation to delete backup sets of the .

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | Yes | The backup set ID. You can call the DescribeBackups operation to query the backup set ID. Separate m Example: `324******` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## describeBackups

**Signature:** `describeBackups(request: DescribeBackupsRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the backup set. Example: `327329803` |
| `backupMode` | string | No | The backup mode. Valid values: Example: `Automated` |
| `backupStatus` | string | No | The status of the backup set. Valid values: Example: `Success` |
| `backupType` | string | No | The backup type. Valid values: Example: `FullBackup` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `endTime` | string | No | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2011-06-15T16:00Z` |
| `pageNumber` | number | No | The number of the page to return. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2011-06-01T16:00Z` |

## describeBackupPolicy

**Signature:** `describeBackupPolicy(request: DescribeBackupPolicyRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupPolicyMode` | string | No | The backup type. Valid values: Example: `DataBackupPolicy` |
| `compressType` | string | No | The method that is used to compress backup data. Valid values: Example: `1` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `releasedKeepPolicy` | string | No | The policy that is used to retain archived backup files if the instance is released. Valid values: Example: `Lastest` |

## modifyBackupPolicy

**Signature:** `modifyBackupPolicy(request: ModifyBackupPolicyRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (1 required, 22 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `archiveBackupKeepCount` | number | No | The number of archived backup files that are retained. Default value: **1**. Valid values: Example: `1` |
| `archiveBackupKeepPolicy` | string | No | The retention period of archived backup files. The number of archived backup files that can be retai Example: `ByMonth` |
| `archiveBackupRetentionPeriod` | string | No | The number of days for which the archived backup is retained. The default value **0** specifies that Example: `365` |
| `backupInterval` | string | No | The frequency at which you want to perform a snapshot backup on the instance. Valid values: Example: `30` |
| `backupLog` | string | No | Specifies whether to enable the log backup feature. Valid values: Example: `Enable` |
| `backupMethod` | string | No | The backup method of the instance. Valid values: Example: `Physical` |
| `backupPolicyMode` | string | No | The type of the backup. Valid values: Example: `DataBackupPolicy` |
| `backupPriority` | number | No | Specifies whether the backup settings of a secondary instance are configured. Valid values: Example: `2` |
| `backupRetentionPeriod` | string | No | The number of days for which you want to retain data backup files. Valid values: **7 to 730**. Example: `7` |
| `category` | string | No | Specifies whether to enable the single-digit second backup feature. Valid values: Example: `Standard` |
| `compressType` | string | No | The format that is used to compress backup data. Valid values: Example: `4` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `enableBackupLog` | string | No | Specifies whether to enable the log backup feature. Valid values: Example: `1` |
| `enableIncrementDataBackup` | boolean | No | Specifies whether to enable incremental backup. Valid values: Example: `false` |
| `highSpaceUsageProtection` | string | No | Specifies whether to forcefully delete log backup files from the instance when the storage usage of  Example: `Enable` |
| `localLogRetentionHours` | string | No | The number of hours for which you want to retain log backup files on the instance. Valid values: **0 Example: `18` |
| `localLogRetentionSpace` | string | No | The maximum storage usage that is allowed for log backup files on the instance. If the storage usage Example: `30` |
| `logBackupFrequency` | string | No | The frequency at which you want to back up the logs of the instance. Valid values: Example: `LogInterval` |
| `logBackupLocalRetentionNumber` | number | No | The number of binary log files that you want to retain on the instance. Default value: **60**. Valid Example: `60` |
| `logBackupRetentionPeriod` | string | No | The number of days for which the log backup is retained. Valid values: **7 to 730**. The log backup  Example: `7` |
| `preferredBackupPeriod` | string | No | The backup cycle. Specify at least two days of the week and separate the days with commas (,). Valid Example: `Monday` |
| `preferredBackupTime` | string | No | The time at which you want to perform a backup. Specify the time in the ISO 8601 standard in the *HH Example: `00:00Z-01:00Z` |
| `releasedKeepPolicy` | string | No | The policy that is used to retain archived backup files if the instance is released. Valid values: Example: `None` |

## describeBackupTasks

**Signature:** `describeBackupTasks(request: DescribeBackupTasksRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupJobId` | number | No | The ID of the backup task. Example: `4762614` |
| `backupJobStatus` | string | No | The status of the backup task. Valid values: Example: `NoStart` |
| `backupMode` | string | No | The backup mode. Valid values: Example: `Automated` |
| `clientToken` | string | No | Specifies the client token that is used to ensure the idempotence of the request. You can use the cl Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `flag` | string | No | A reserved parameter. Example: `None` |

## describeBinlogFiles

**Signature:** `describeBinlogFiles(request: DescribeBinlogFilesRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   MariaDB ### Usage notes *   If the return value of the **DownloadLink** parameter is NULL, ApsaraDB RDS does not provide a download URL. *  .

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Example: `2011-06-20T15:00:00Z` |
| `pageNumber` | number | No | The page number. Pages start from 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `startTime` | string | Yes | The beginning of the time range to query. Example: `2011-06-01T15:00:00Z` |

## describeLogBackupFiles

**Signature:** `describeLogBackupFiles(request: DescribeLogBackupFilesRequest)`

### [](#)Supported database engines SQL Server >  You can call the DescribeBinlogFiles operation to query the log files of instances that run different database engines..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2018-10-31T08:40Z` |
| `pageNumber` | number | No | The page number. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30** to **1000**. Default value: **30* Example: `30` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2018-10-01T08:40Z` |

## createDdrInstance

**Signature:** `createDdrInstance(request: CreateDdrInstanceRequest)`

>  Before restoration, you can call the CheckCreateDdrDBInstance operation to check whether a cross-region backup set can be used for cross-region restoration. ### [](#)Supported database engines *   .

**Parameters:** (9 required, 20 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupSetId` | string | Yes | The backup set ID that you want to use for the restoration. You can call the DescribeCrossRegionBack Example: `14***` |
| `DBInstanceNetType` | string | Yes | The network connection type of the destination instance. Valid values: Example: `Intranet` |
| `engine` | string | Yes | The database engine of the destination instance. Valid values: Example: `MySQL` |
| `engineVersion` | string | Yes | The major engine version of the destination instance. The value of this parameter varies based on th Example: `5.6` |
| `payType` | string | Yes | The billing method of the instance. Valid values: Example: `Prepaid` |
| `regionId` | string | Yes | The region ID of the destination instance. You can call the DescribeRegions operation to query the m Example: `cn-hangzhou` |
| `restoreType` | string | Yes | The restoration method that you want to use. Valid values: Example: `BackupSet` |
| `securityIPList` | string | Yes | The IP address whitelist of the destination instance. If you want to add more than one entry to the  Example: `127.0.0.1` |
| `sourceDBInstanceName` | string | Yes | The source instance ID, which is used if you want to restore data to a point in time. Example: `rm-uf6wjk5xxxxxxx` |
| `backupSetRegion` | string | No | The region where the backup set is located. Example: `cn-beijing` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `connectionMode` | string | No | The connection mode of the destination instance. Valid values: Example: `Standard` |
| `DBInstanceClass` | string | No | The instance type of the destination instance. For more information, see [Primary ApsaraDB RDS insta Example: `rds.mysql.s1.small` |
| `DBInstanceDescription` | string | No | The instance name. The name must be 2 to 256 characters in length. The value can contain letters, di Example: `Test` |
| `DBInstanceStorage` | number | No | The storage capacity of the destination instance. Valid values: **5 to 2000**. Unit: GB. You can inc Example: `20` |
| `DBInstanceStorageType` | string | No | The storage type of the destination instance. Only the local SSD storage type is supported. Default  Example: `local_ssd` |
| `encryptionKey` | string | No | The ID of the customer master key (CMK) for cloud disk encryption. If this parameter is specified, c Example: `749c1df7-****-****-****-****` |
| `instanceNetworkType` | string | No | The network type of the instance. Valid values: Example: `Classic` |
| `period` | string | No | The unit that is used to measure the subscription duration of the destination instance. Valid values Example: `Year` |
| `privateIpAddress` | string | No | The private IP address of the destination instance. The private IP address must be within the CIDR b Example: `172.XXX.XXX.69` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmyxxxxxxxxxx` |
| `restoreTime` | string | No | The point in time to which you want to restore data. The point in time that you specify must be earl Example: `2019-05-30T03:29:10Z` |
| `roleARN` | string | No | The Alibaba Cloud Resource Name (ARN) that is provided by your Alibaba Cloud account for Resource Ac Example: `acs:ram::1406****:role/aliyunrdsinstanceencryptiondefaultrole` |
| `sourceRegion` | string | No | The region ID of the source instance if you want to restore data to a point in time. Example: `cn-hangzhou` |
| ... | ... | ... | *5 more optional parameters* |

## describeCrossRegionBackupDBInstance

**Signature:** `describeCrossRegionBackupDBInstance(request: DescribeCrossRegionBackupDBInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, read the following topics and make sure that you fully understand the .

**Parameters:** See `DescribeCrossRegionBackupDBInstanceRequest` model.

## describeCrossRegionBackups

**Signature:** `describeCrossRegionBackups(request: DescribeCrossRegionBackupsRequest)`

### [](#)Supported database engines *   ApsaraDB RDS for MySQL instances with local disks *   RDS PostgreSQL *   RDS SQL Server ### [](#)References >  Before you call this operation, carefully read th.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | number | No | The ID of the backup file. Example: `603524***` |
| `crossBackupId` | number | No | The ID of the cross-region data backup file. Example: `14562` |
| `crossBackupRegion` | string | No | The ID of the region in which the cross-region data backup file is stored. Example: `cn-shanghai` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T*H Example: `2019-06-15T12:10:00Z` |
| `pageNumber` | number | No | The page number. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2019-05-30T12:10:00Z` |

## describeCrossRegionLogBackupFiles

**Signature:** `describeCrossRegionLogBackupFiles(request: DescribeCrossRegionLogBackupFilesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully u.

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `crossBackupRegion` | string | No | The ID of the destination region within which the cross-region backup file is stored. You can call t Example: `cn-shanghai` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T*H Example: `2019-06-15T12:10:00Z` |
| `pageNumber` | number | No | The page number. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: Example: `30` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2019-05-30T12:10:00Z` |

## describeCrossBackupMetaList

**Signature:** `describeCrossBackupMetaList(request: DescribeCrossBackupMetaListRequest)`

ApsaraDB RDS for MySQL instances support cross-region backup and restoration. For more information, see [Back up an ApsaraDB RDS for MySQL instance across regions](https://help.aliyun.com/document_det.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupSetId` | string | Yes | The ID of the cross-region backup file that you want to use. You can call the [DescribeCrossRegionBa Example: `123456` |
| `getDbName` | string | No | The name of the database that you want to query. The system implements exact match based on the valu Example: `testdb1` |
| `pageIndex` | string | No | The number of the page to return. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | string | No | The number of entries to return per page. Default value: **1**. Example: `30` |
| `pattern` | string | No | The name of the database that you want to query. The system implements fuzzy match based on the valu Example: `test` |
| `region` | string | No | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |

## modifyInstanceCrossBackupPolicy

**Signature:** `modifyInstanceCrossBackupPolicy(request: ModifyInstanceCrossBackupPolicyRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understa.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupEnabled` | string | No | Specifies whether to enable the cross-region backup feature on the instance. This parameter specifie Example: `1` |
| `crossBackupRegion` | string | No | The ID of the region in which the cross-region backup files of the instance are stored. Example: `cn-shanghai` |
| `crossBackupType` | string | No | The policy that is used to save the cross-region backup files of the instance. Set the value to **1* Example: `1` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `logBackupEnabled` | string | No | Specifies whether to enable the cross-region log backup feature on the instance. Valid values: Example: `1` |
| `regionId` | string | Yes | The region ID of the source instance. You can call the DescribeRegions operation to query the most r Example: `cn-hangzhou` |
| `retentType` | number | No | The policy that is used to retain the cross-region backup files of the instance. Set the value to 1. Example: `1` |
| `retention` | number | No | The number of days for which the cross-region backup files of the instance are retained. Valid value Example: `7` |

## checkCreateDdrDBInstance

**Signature:** `checkCreateDdrDBInstance(request: CheckCreateDdrDBInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server >  If your ApsaraDB RDS for PostgreSQL instance uses the new architecture and is created after October 10, 2022, this featur.

**Parameters:** See `CheckCreateDdrDBInstanceRequest` model.

## restoreDdrTable

**Signature:** `restoreDdrTable(request: RestoreDdrTableRequest)`

>  Before restoration, you can call the CheckCreateDdrDBInstance operation to check whether a cross-region backup set can be used for cross-region restoration. ### [](#)Supported database engines MySQ.

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The cross-region backup set ID. You can call the DescribeCrossRegionBackups operation to query the I Example: `279563` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The source instance ID. Example: `rm-bpxxxxx` |
| `regionId` | string | No | The region ID of the destination instance. You can call the DescribeRegions operation to query the m Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `restoreTime` | string | No | The point in time to which you want to restore data. The point in time that you specify must be earl Example: `2020-04-25T16:00:00Z` |
| `restoreType` | string | Yes | The method that is used to restore data. Valid values: Example: `0` |
| `sourceDBInstanceName` | string | No | The ID of the source instance whose data you want to restore to a point in time. Example: `rm-bpxxxxx` |
| `sourceRegion` | string | No | The region ID of the source instance if you want to restore data to a point in time. Example: `cn-beijing` |
| `tableMeta` | string | Yes | The names of the databases and tables that you want to restore. The value is in the following format Example: `[{"type":"db","name":"testdb1","newname":"testdb1","tables":[{"type":"table","name":"test1","newname":"test1_backup"},{"type":"table","name":"test2","newname":"test2_backup"}]}]` |

## restoreTable

**Signature:** `restoreTable(request: RestoreTableRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites .

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The backup set ID. You can call the DescribeBackups operation to obtain the backup set ID. Example: `9026262` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `instantRecovery` | boolean | No | Specifies whether to enable the fast restoration feature for individual databases and tables. Valid  Example: `true` |
| `restoreTime` | string | No | The point in time to which you want to restore data. The point in time must fall within the specifie Example: `2011-06-11T16:00:00Z` |
| `tableMeta` | string | Yes | The names of the databases and tables that you want to restore for the source instance. Example: `[{"type":"db","name":"testdb1","newname":"testdb1_new","tables":[{"type":"table","name":"testdb1table1","newname":"testdb1table1_new"}]}]` |

## recoveryDBInstance

**Signature:** `recoveryDBInstance(request: RecoveryDBInstanceRequest)`

### [](#)Supported database engines SQL Server 2012 or later ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** See `RecoveryDBInstanceRequest` model.

## describeAvailableRecoveryTime

**Signature:** `describeAvailableRecoveryTime(request: DescribeAvailableRecoveryTimeRequest)`

>  To view the time range within which you can restore data from a standard backup set, see DescribeBackups. ### [](#)Supported database engines ApsaraDB RDS for MySQL instances with local disks ### [.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `crossBackupId` | number | Yes | The ID of the cross-region data backup file. You can call the DescribeCrossRegionBackups operation t Example: `14***` |
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5*****` |
| `regionId` | string | No | The region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |

## describeLocalAvailableRecoveryTime

**Signature:** `describeLocalAvailableRecoveryTime(request: DescribeLocalAvailableRecoveryTimeRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   MariaDB.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `region` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |

## describeDetachedBackups

**Signature:** `describeDetachedBackups(request: DescribeDetachedBackupsRequest)`

### Supported database engine MySQL > This operation is available only for instances that use local disks. ### References > Before you call this operation, read the following documentation and make su.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the backup set. Example: `327xxxxx3` |
| `backupMode` | string | No | The backup method. Valid values: Example: `Automated` |
| `backupStatus` | string | No | The status of the backup set. Valid values: Example: `Success` |
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `endTime` | string | No | The end of the time range to query. The end time must be later than the start time. Example: `2021-03-15T16:00Z` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `region` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2021-03-01T16:00Z` |

## deleteUserBackupFile

**Signature:** `deleteUserBackupFile(request: DeleteUserBackupFileRequest)`

### [](#)Supported database engine *   MySQL ### [](#)Usage notes *   A full backup file contains the data of a self-managed MySQL instance. You can restore the data of a self-managed MySQL instance f.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | Yes | The ID of the full backup file. You can call the ListUserBackupFiles operation to query the informat Example: `b-w1haya7e4i25********` |
| `regionId` | string | Yes | The region ID of the instance. You can call the DescribeRegions operation to query the most recent r Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy*****` |

## listUserBackupFiles

**Signature:** `listUserBackupFiles(request: ListUserBackupFilesRequest)`

### [](#)Supported database engines *   MySQL ### [](#)Feature description *   A full backup file contains the data of a self-managed MySQL database. You can restore the data of a self-managed MySQL d.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the full backup file. Example: `b-kwwvr7v8t7of********` |
| `comment` | string | No | The description of the full backup file. Example: `BackupTest` |
| `ossUrl` | string | No | The URL from which you can download the full backup file that is stored as an object in an Object St Example: `https://******.oss-ap-********.aliyuncs.com/backup_qp.xb` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to obtain the ID of th Example: `rg-acfmy*****` |
| `status` | string | No | The status of the full backup file. Valid values: Example: `CheckSuccess` |
| `tags` | string | No | The tag that is added to the full backup file. Example: `key1:value1` |

## updateUserBackupFile

**Signature:** `updateUserBackupFile(request: UpdateUserBackupFileRequest)`

### Supported database engines RDS MySQL ### References A full backup file contains the data of a self-managed MySQL database. You can restore the data of a self-managed MySQL database from a full bac.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | Yes | The backup ID. You can call the ListUserBackupFiles operation to query the backup ID. Example: `b-kwwvr7v8t7of********` |
| `comment` | string | No | The new description of the full backup file. Example: `CommentTest` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy*****` |
| `retention` | number | No | The new retention period of the full backup file. Unit: days. Valid values: any non-zero positive in Example: `30` |


## deleteBackupFile

**Signature:** `deleteBackupFile(request: DeleteBackupFileRequest)`

### [](#)Supported database engine SQL Server >  **This operation is not supported for new users. **Select other methods to [reduce or save backup costs](https://help.aliyun.com/document_detail/95718..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | You can specify only the ID of a backup file whose backup policy is Single-database Backup. You can  Example: `29304****` |
| `backupTime` | string | No | The time before which the backup files you want to delete are generated. Specify the time in the yyy Example: `2011-06-11T16:00:00Z` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bp6wjk5******` |
| `DBName` | string | No | The name of the database. Example: `testdb` |
| `regionId` | string | No | The region ID. You can call the DescribeDBInstanceAttribute operation to query the region ID. Example: `cn-hangzhou` |


## describeBackupDatabase

**Signature:** `describeBackupDatabase(request: DescribeBackupDatabaseRequest)`

> This operation is phased out..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the backup set. Example: `90262212` |
| `DBInstanceId` | string | Yes | The ID of the instance. Example: `rm-uf6wjk5xxxxxxx` |


## describeAvailableCrossRegion

**Signature:** `describeAvailableCrossRegion(request: DescribeAvailableCrossRegionRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully u.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent zone list. Example: `cn-hangzhou` |


## describeInstanceCrossBackupPolicy

**Signature:** `describeInstanceCrossBackupPolicy(request: DescribeInstanceCrossBackupPolicyRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully u.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |


## describeCrossBackupMetaList

**Signature:** `describeCrossBackupMetaList(request: DescribeCrossBackupMetaListRequest)`

ApsaraDB RDS for MySQL instances support cross-region backup and restoration. For more information, see [Back up an ApsaraDB RDS for MySQL instance across regions](https://help.aliyun.com/document_det.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupSetId` | string | Yes | The ID of the cross-region backup file that you want to use. You can call the [DescribeCrossRegionBa Example: `123456` |
| `getDbName` | string | No | The name of the database that you want to query. The system implements exact match based on the valu Example: `testdb1` |
| `pageIndex` | string | No | The number of the page to return. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | string | No | The number of entries to return per page. Default value: **1**. Example: `30` |
| `pattern` | string | No | The name of the database that you want to query. The system implements fuzzy match based on the valu Example: `test` |
| `region` | string | No | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |


## describeMetaList

**Signature:** `describeMetaList(request: DescribeMetaListRequest)`

### [](#)Supported database engines MySQL > This operation is available for RDS instances that run MySQL 8.0, MySQL 5.7, and MySQL 5.6 on RDS High-availability Edition with local disks. ### [](#)Descr.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupSetID` | number | Yes | The ID of the backup set from which you want to restore data. You can call the DescribeBackups opera Example: `14358` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `getDbName` | string | No | The name of the database to query. The system implements exact match based on the value of this para Example: `testdb1` |
| `pageIndex` | number | No | The number of the page to return. Valid values: any non-zero positive integer.**** Default value: ** Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Default value: **1**. Example: `1` |
| `pattern` | string | No | The name of the database to query. The system implements fuzzy match based on the value of this para Example: `test` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `restoreTime` | string | No | The point in time to which you want to restore data. The specified point in time must be earlier tha Example: `2019-05-30T03:29:10Z` |
| `restoreType` | string | No | The restoration method that you want to use. Valid values: Example: `BackupSetID` |


## modifyBackupSetExpireTime

**Signature:** `modifyBackupSetExpireTime(request: ModifyBackupSetExpireTimeRequest)`

### [](#)Supported database engines RDS SQL Server ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impact.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | number | Yes | The backup set ID. You can call the DescribeBackups operation to query the backup set ID. The backup Example: `b-n8tpg24c6i0v****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5****` |
| `expectExpireTime` | string | Yes | The point in time to which you want to extend the expiration time of the backup set. Specify the tim Example: `2025-06-17T12:10:23Z` |

