# Backup & Recovery

Backup policies, backup tasks, data recovery, and data flash back.

## createBackup

**Signature:** `createBackup(request: CreateBackupRequest)`

You can also back up an instance in the Tair (Redis OSS-compatible) console. For more information, see [Backup and recovery](https://help.aliyun.com/document_detail/43886.html)..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupRetentionPeriod` | number | No | - |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## describeBackups

**Signature:** `describeBackups(request: DescribeBackupsRequest)`

Queries the backup files of the Tair (Redis OSS-compatible) instance..

**Parameters:** (3 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | number | No | The ID of the backup file. Example: `11611111` |
| `backupJobId` | number | No | The backup task ID, returned by CreateBackup. If CreateBackup returns multiple BackupJobIds, you nee Example: `10001` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the *yyyy-MM-dd*T*HH:mm*Z format. The time m Example: `2019-03-14T18:00Z` |
| `instanceId` | string | Yes | The ID of the instance whose backup files you want to query. Example: `r-bp1zxszhcgatnx****` |
| `needAof` | string | No | Specifies whether to enable append-only files (AOFs) persistence. Valid values: Example: `1` |
| `pageNumber` | number | No | The page number. The value must be an integer that is greater than **0**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The maximum number of entries per page. Valid values: 30, 50, 100, 200, and 300. Example: `30` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2019-03-11T10:00Z` |

## describeBackupPolicy

**Signature:** `describeBackupPolicy(request: DescribeBackupPolicyRequest)`

Queries the backup policy of a Tair (Redis OSS-compatible) instance, including the backup cycle and backup time..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## modifyBackupPolicy

**Signature:** `modifyBackupPolicy(request: ModifyBackupPolicyRequest)`

Modifies the automatic backup policy of a Tair (Redis OSS-compatible) instance..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupRetentionPeriod` | number | No | The number of days for which you want to retain data backup files. Valid values: 7 to 730. Default v Example: `7` |
| `enableBackupLog` | number | No | Specifies whether to enable the data flashback feature for the instance. Valid values: Example: `1` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `preferredBackupPeriod` | string | Yes | The days of the week to back up data. Valid values: Example: `Tuesday` |
| `preferredBackupTime` | string | Yes | The time range to back up data. Specify the time in the *HH:mm*Z-*HH:mm*Z format. The time is displa Example: `07:00Z-08:00Z` |

## modifyBackupExpireTime

**Signature:** `modifyBackupExpireTime(request: ModifyBackupExpireTimeRequest)`

Extends the expiration time of manual backup data..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the backup file. You can call the [DescribeBackups](https://help.aliyun.com/document_detai Example: `521****66` |
| `expectExpireTime` | string | Yes | The point in time to which you want to extend the expiration time. Specify the time in the yyyy-MM-d Example: `2025-07-06T07:25:57Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## describeBackupTasks

**Signature:** `describeBackupTasks(request: DescribeBackupTasksRequest)`

Queries the execution status of backup tasks for a Tair (Redis OSS-compatible) instance..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupJobId` | string | No | The ID of the backup task. Example: `1162****` |
| `instanceId` | string | Yes | The instance ID. You can call the [DescribeInstances](https://help.aliyun.com/document_detail/473778 Example: `r-bp1zxszhcgatnx****` |
| `jobMode` | string | No | The backup mode. Valid values: Example: `Manual` |

## restoreInstance

**Signature:** `restoreInstance(request: RestoreInstanceRequest)`

If your instance is a [DRAM-based instance](https://help.aliyun.com/document_detail/126164.html) or a [persistent memory-optimized instance](https://help.aliyun.com/document_detail/183956.html) and ha.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the backup file. You can call the [DescribeBackups](https://help.aliyun.com/document_detai Example: `78241****` |
| `filterKey` | string | No | The key that you want to restore. You can specify multiple keys. Separate multiple keys with commas  Example: `key:00000007198*` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `restoreTime` | string | No | The point in time to which you want to restore data. Specify the time in the ISO 8601 standard in th Example: `2021-07-06T07:25:57Z` |
| `restoreType` | string | No | The restoration mode. Valid values: Example: `1` |
| `timeShift` | string | No | When you restore a classic instance, regardless of whether you choose to restore all data or specifi Example: `2021-07-06T08:25:57Z` |

## createCacheAnalysisTask

**Signature:** `createCacheAnalysisTask(request: CreateCacheAnalysisTaskRequest)`

This operation is no longer available. Use the new operation. For more information, see [Real-time key statistics and offline key analysis](https://help.aliyun.com/document_detail/184226.html)..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |

## describeCacheAnalysisReport

**Signature:** `describeCacheAnalysisReport(request: DescribeCacheAnalysisReportRequest)`

> Tair (Redis OSS-compatible) has optimized the cache analytics feature to improve user experience. This API operation is phased out. You can use the new API operation for cache analytics. For more in.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `analysisType` | string | Yes | The type of analytics. Set the value to **BigKey**. Example: `BigKey` |
| `date` | string | Yes | The date to query. You can query the report for one day each time. Specify the date in the *yyyy-MM- Example: `2019-08-05Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the child node in the cluster instance. Example: `-bp1zxszhcgatnx****-db-0` |
| `pageNumbers` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Example: `30` |

## describeCacheAnalysisReportList

**Signature:** `describeCacheAnalysisReportList(request: DescribeCacheAnalysisReportListRequest)`

> Tair (Redis OSS-compatible) has optimized the cache analytics feature to improve user experience. This API operation is phased out. You can use the new API operation for cache analytics. For more in.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | number | No | The time range to query. Default value: 7. Unit: days. Example: `7` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the child node in the cluster instance. Example: `r-bp1zxszhcgatnx****-db-0` |
| `pageNumbers` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Example: `30` |


## deleteBackup

**Signature:** `deleteBackup(request: DeleteBackupRequest)`

Deletes a specified backup set. However, you can delete only backup sets that are manually backed up..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | Yes | This parameter is required. Example: `521****66` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |

