# Monitoring & Performance

Performance monitoring, running logs, slow logs, and bandwidth utilization.

## describeMonitorItems

**Signature:** `describeMonitorItems(request: DescribeMonitorItemsRequest)`

>  To improve user experience, Tair has upgraded the monitoring metrics. The DescribeMonitorItems operation is phased out. For more information, see [The DescribeMonitorItems operation of Tair (Redis .

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |

## describeHistoryMonitorValues

**Signature:** `describeHistoryMonitorValues(request: DescribeHistoryMonitorValuesRequest)`

You can also query the performance monitoring data of an instance in the Tair console. For more information, see [Metrics](https://help.aliyun.com/document_detail/43887.html)..

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2022-11-06T00:30:00Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `intervalForHistory` | string | Yes | This parameter is deprecated. Set the value to `01m`. Example: `01m` |
| `monitorKeys` | string | No | The monitoring metrics. Separate the metrics with commas (,). Take CpuUsage as an example: Example: `memoryUsage` |
| `nodeId` | string | No | The ID of the node in the instance. You can set this parameter to query the data of a specified node Example: `r-bp1zxszhcgatnx****-db-0#1679****` |
| `nodeRole` | string | No | If you want to query the metrics of the read replicas in a cloud-native read/write splitting instanc Example: `READONLY` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the *yyyy-MM-dd*T*HH:mm:ss*Z format. T Example: `2022-11-06T00:00:00Z` |

## describeDBInstanceMonitor

**Signature:** `describeDBInstanceMonitor(request: DescribeDBInstanceMonitorRequest)`

Queries the collection frequency of monitoring data for a Tair (Redis OSS-compatible) instance..

**Parameters:** See `DescribeDBInstanceMonitorRequest` model.

## modifyDBInstanceMonitor

**Signature:** `modifyDBInstanceMonitor(request: ModifyDBInstanceMonitorRequest)`

Modifies the monitoring granularity of a Tair (Redis OSS-compatible) instance..

**Parameters:** See `ModifyDBInstanceMonitorRequest` model.

## describeRunningLogRecords

**Signature:** `describeRunningLogRecords(request: DescribeRunningLogRecordsRequest)`

For more information about how to view the operational logs of an instance in the Tair (Redis OSS-compatible) console, see [View active logs](https://help.aliyun.com/document_detail/101713.html). This.

**Parameters:** (3 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `characterType` | string | No | The shard type of the cluster instance. Valid values: Example: `proxy` |
| `DBName` | string | No | The name of the database. Example: `0` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. The time range c Example: `2018-12-03T08:01Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the node in the instance. You can set this parameter to query the operational logs of a sp Example: `r-bp1zxszhcgatnx****-db-0` |
| `orderType` | string | No | The method that is used to sort the returned log entries. Valid values: Example: `asc` |
| `pageNumber` | number | No | The number of the page to return. The value must be an integer that is greater than **0** and less t Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Default val Example: `30` |
| `queryKeyword` | string | No | The keyword that is used to query operational logs. Example: `aof` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmyiu4ekp****` |
| `roleType` | string | No | The role of the data shard. Default value: master. Valid values: Example: `master` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the *yyyy-MM-dd*T*HH:mm*Z format. The  Example: `2018-12-03T07:01Z` |

## describeSlowLogRecords

**Signature:** `describeSlowLogRecords(request: DescribeSlowLogRecordsRequest)`

You can also query slow logs in the Tair (Redis OSS-compatible) console. For more information, see [Query slow logs of an instance](https://help.aliyun.com/document_detail/95874.html). This operation .

**Parameters:** (3 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBName` | string | No | The name of the database. Example: `0` |
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. The time range c Example: `2019-03-22T14:11Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the node in the instance. You can set this parameter to query the slow query logs of a spe Example: `r-bp1zxszhcgatnx****-db-0` |
| `orderBy` | string | No | The dimension by which to sort the results. Default value: execution_time. Valid values: Example: `execution_time` |
| `orderType` | string | No | The sorting order of the results to return. Default value: DESC. Valid values: Example: `ASC` |
| `pageNumber` | number | No | The number of the page to return. The value must be an integer that is greater than **0**. Default v Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Default val Example: `30` |
| `queryKeyword` | string | No | The keyword based on which slow logs are queried. You can set this parameter to a value of the strin Example: `keyword1` |
| `slowLogRecordType` | string | No | The type of the slow logs. Default value: db. Valid values: Example: `proxy` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2019-03-10T14:11Z` |

## describeEngineVersion

**Signature:** `describeEngineVersion(request: DescribeEngineVersionRequest)`

## Debugging [OpenAPI Explorer automatically calculates the signature value. For your convenience, we recommend that you call this operation in OpenAPI Explorer. OpenAPI Explorer dynamically generates.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. You can call the [DescribeInstances](https://help.aliyun.com/document_detail/473778 Example: `r-bp1zxszhcgatnx****` |

## describeInstanceConfig

**Signature:** `describeInstanceConfig(request: DescribeInstanceConfigRequest)`

This operation is available only for instances that use cloud disks. > You can call the [DescribeParameters](https://help.aliyun.com/document_detail/473847.html) operation to query the parameter setti.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. You can call the [DescribeInstances](https://help.aliyun.com/document_detail/473778 Example: `r-bp1zxszhcgatnx****` |

