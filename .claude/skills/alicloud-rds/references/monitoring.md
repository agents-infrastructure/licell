# Monitoring & Diagnostics

Performance monitoring, CloudDBA diagnostics, slow query logs, error logs, and SQL audit.

## describeDBInstancePerformance

**Signature:** `describeDBInstancePerformance(request: DescribeDBInstancePerformanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstancePerformanceRequest` model.

## describeDBInstanceMonitor

**Signature:** `describeDBInstanceMonitor(request: DescribeDBInstanceMonitorRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstanceMonitorRequest` model.

## modifyDBInstanceMonitor

**Signature:** `modifyDBInstanceMonitor(request: ModifyDBInstanceMonitorRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)Usage notes If you use the Every 5 Seconds monitoring frequency, you are charged additional fees. Before you call this operation, .

**Parameters:** See `ModifyDBInstanceMonitorRequest` model.

## describeDBInstanceMetrics

**Signature:** `describeDBInstanceMetrics(request: DescribeDBInstanceMetricsRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** See `DescribeDBInstanceMetricsRequest` model.

## modifyDBInstanceMetrics

**Signature:** `modifyDBInstanceMetrics(request: ModifyDBInstanceMetricsRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** See `ModifyDBInstanceMetricsRequest` model.

## describeSlowLogRecords

**Signature:** `describeSlowLogRecords(request: DescribeSlowLogRecordsRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### Precautions The response parameters returned by this operation are updated every minute..

**Parameters:** (3 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the instance. You can call the [DescribeDBInstances](https://help.aliyun.com/document_deta Example: `rm-uf6wjk5******` |
| `DBName` | string | No | The name of the database. Example: `RDS_MySQL` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-ddTHH: Example: `2020-06-18T16:00Z` |
| `nodeId` | string | No | The ID of the node. Example: `rn-p1fm78s90x5****` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid value: **30 to 200**. Default value: **30**. Example: `30` |
| `SQLHASH` | string | No | The unique ID of the SQL statement. The ID is used to obtain the slow query logs of the SQL statemen Example: `U2FsdGVk****` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2020-06-17T16:00Z` |

## describeSlowLogs

**Signature:** `describeSlowLogs(request: DescribeSlowLogsRequest)`

### [](#)Supported database engines *   MySQL ** **Note** This operation is not supported for RDS instances that run MySQL 5.7 on RDS Basic Edition. *   SQL Server ** **Note** This operation is suppor.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `DBName` | string | No | The name of the database. Example: `RDS_MySQL` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. The time span be Example: `2011-05-30Z` |
| `pageNumber` | number | No | The page number. Pages start from 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **30** to **100**. Default value: **30**. Example: `30` |
| `sortKey` | string | No | The dimension based on which the system sorts the entries to return. Valid values: Example: `TotalExecutionCounts` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2011-05-01Z` |

## describeErrorLogs

**Signature:** `describeErrorLogs(request: DescribeErrorLogsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. The time span be Example: `2011-05-30T20:10Z` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **30** to **100**. Default value: **30**. Example: `30` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2011-05-01T20:10Z` |

## describeSQLCollectorPolicy

**Signature:** `describeSQLCollectorPolicy(request: DescribeSQLCollectorPolicyRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server.

**Parameters:** See `DescribeSQLCollectorPolicyRequest` model.

## modifySQLCollectorPolicy

**Signature:** `modifySQLCollectorPolicy(request: ModifySQLCollectorPolicyRequest)`

This operation can still be called but is no longer maintained. We recommend that you call the [ModifySqlLogConfig](https://help.aliyun.com/document_detail/2778835.html) operation instead of this oper.

**Parameters:** See `ModifySQLCollectorPolicyRequest` model.

## describeSQLCollectorRetention

**Signature:** `describeSQLCollectorRetention(request: DescribeSQLCollectorRetentionRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server.

**Parameters:** See `DescribeSQLCollectorRetentionRequest` model.

## modifySQLCollectorRetention

**Signature:** `modifySQLCollectorRetention(request: ModifySQLCollectorRetentionRequest)`

### Supported database engines RDS MySQL ### Precautions After you shorten the log backup retention period, log backup files that are stored longer than the specified log backup retention period are i.

**Parameters:** See `ModifySQLCollectorRetentionRequest` model.

## describeSQLLogFiles

**Signature:** `describeSQLLogFiles(request: DescribeSQLLogFilesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ** **Note** If your instance runs SQL Server, only SQL Server 2008 R2 is supported. ### [](#)Precautions *   The DescribeSQL.

**Parameters:** See `DescribeSQLLogFilesRequest` model.

## describeSQLLogRecords

**Signature:** `describeSQLLogRecords(request: DescribeSQLLogRecordsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [Usage notes](#) *   You can call this operation up to 1,000 times per minute per account. The calls initiated by using .

**Parameters:** See `DescribeSQLLogRecordsRequest` model.


## describeSQLLogReportList

**Signature:** `describeSQLLogReportList(request: DescribeSQLLogReportListRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.


## describeHistoryEventsStat

**Signature:** `describeHistoryEventsStat(request: DescribeHistoryEventsStatRequest)`

Queries the statistics of historical events in the event center..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `archiveStatus` | string | No | The status of the asset instance. Valid values: **starting**, **running**, **stopping**, and **stopp Example: `starting` |
| `fromStartTime` | string | No | The beginning of the time range to query. Only tasks that have a start time later than or equal to t Example: `2022-01-02T11:31:03Z` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-beijing` |
| `toStartTime` | string | No | The end of the time range to query. Only tasks that have a start time earlier than or equal to the t Example: `2022-03-02T11:31:03Z` |


## describeHistoryTasksStat

**Signature:** `describeHistoryTasksStat(request: DescribeHistoryTasksStatRequest)`

Collects tasks in the task center..

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromExecTime` | number | No | The minimum execution duration of a task. This parameter is used to filter tasks whose execution dur Example: `0` |
| `fromStartTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the `yyyy-MM- Example: `2023-05-08T07:04:17Z` |
| `instanceId` | string | No | The instance ID. Example: `rm-2ze704f*****` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-beijing` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `status` | string | No | The status of the task. Valid values: Example: `Scheduled` |
| `taskId` | string | No | The task ID. Example: `12221` |
| `taskType` | string | No | The task type. Example: `all` |
| `toExecTime` | number | No | The maximum execution duration of a task. This parameter is used to filter tasks whose execution dur Example: `0` |
| `toStartTime` | string | Yes | The end of the time range to query. Only tasks that have a start time earlier than or equal to the t Example: `2023-02-24T10:01:37Z` |


## describeRCMetricList

**Signature:** `describeRCMetricList(request: DescribeRCMetricListRequest)`

Queries the monitoring data of a metric for an RDS Custom instance..


## cancelActiveOperationTasks

**Signature:** `cancelActiveOperationTasks(request: CancelActiveOperationTasksRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully un.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | Yes | The IDs of tasks that you want to cancel at a time. Separate multiple IDs with commas (,). We recomm Example: `188****,188****,188****` |


## describeActiveOperationTasks

**Signature:** `describeActiveOperationTasks(request: DescribeActiveOperationTasksRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (0 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allowCancel` | number | No | The filter condition that is used to return tasks based on the settings of task cancellation. Defaul Example: `-1` |
| `allowChange` | number | No | The filter condition that is used to return tasks based on the settings of the switching time. Defau Example: `-1` |
| `changeLevel` | string | No | The filter condition that is used to return tasks based on the task level. Default value: all. Valid Example: `all` |
| `dbType` | string | No | The type of the database. Default value: all. Valid values: mysql, pgsql, and mssql. Example: `all` |
| `insName` | string | No | The name of the instance. You can leave this parameter empty. If you configure this parameter, you c Example: `rm-bp191w771kd3****` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: 25. Maximum value: 100. Example: `25` |
| `productId` | string | No | The name of the service. Valid values: RDS, POLARDB, MongoDB, and Redis. For RDS instances, set the  Example: `RDS` |
| `region` | string | No | The region ID of the pending event. You can call the DescribeRegions operation to query the most rec Example: `cn-beijing` |
| `status` | number | No | The status of the task, which is used as a filter condition to return tasks. Example: `-1` |
| `taskType` | string | No | The type of the task. Valid values: Example: `rds_apsaradb_upgrade` |


## describeActiveOperationMaintainConf

**Signature:** `describeActiveOperationMaintainConf(request: DescribeActiveOperationMaintainConfRequest)`

查询主动操作维护配置.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |


## modifyActiveOperationTasks

**Signature:** `modifyActiveOperationTasks(request: ModifyActiveOperationTasksRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure th.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | Yes | The O\\&M task ID. Separate multiple IDs with commas (,). Example: `11111,22222` |
| `immediateStart` | number | No | Specifies whether to immediately start scheduling. Valid values: Example: `0` |
| `switchTime` | string | Yes | The scheduled switching time that you want to specify. Specify the time in the ISO 8601 standard in  Example: `2019-10-17T18:50:00Z` |


## describeTasks

**Signature:** `describeTasks(request: DescribeTasksRequest)`

### [](#)Supported database engine SQL Server >  You can call the [DescribeHistoryTasks](https://help.aliyun.com/document_detail/2627863.html) operation to query the tasks on an ApsaraDB RDS for MySQL.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `endTime` | string | No | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2020-11-20T02:00Z` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Valid values: **30 to 100**. Default value: **30**. Example: `30` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2020-11-20T01:00Z` |
| `status` | string | No | The status of the task. This parameter is invalid. Example: `2` |
| `taskAction` | string | No | The operation that is used by the task. Example: `CreateInstance` |


## modifyEventInfo

**Signature:** `modifyEventInfo(request: ModifyEventInfoRequest)`

Modifies information about the events in the event center..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionParams` | string | No | The action-related parameters. You can add action-related parameters based on your business requirem Example: `{\\"recoverTime\\":\\"2023-04-17T14:02:35Z\\",\\"recoverMode\\":\\"timePoint\\"}` |
| `eventAction` | string | Yes | The event handling action. Valid values: Example: `archive` |
| `eventId` | string | Yes | The event ID. You can call the DescribeEvents operation to obtain the IDs of the events. Separate mu Example: `5422964` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/610399.htm Example: `cn-hangzhou` |


## describeHADiagnoseConfig

**Signature:** `describeHADiagnoseConfig(request: DescribeHADiagnoseConfigRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References [What is availability detection?](https://help.aliyun.com/document_detail/207467.html).


## modifyHADiagnoseConfig

**Signature:** `modifyHADiagnoseConfig(request: ModifyHADiagnoseConfigRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, read the following documentation and make sure that you fu.


## describeHASwitchConfig

**Signature:** `describeHASwitchConfig(request: DescribeHASwitchConfigRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.


## modifyHASwitchConfig

**Signature:** `modifyHASwitchConfig(request: ModifyHASwitchConfigRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, read the following documentation and make sure that you fu.

