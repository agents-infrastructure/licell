# Parameter Management

Instance parameter configuration, parameter templates, and parameter groups.

## describeParameters

**Signature:** `describeParameters(request: DescribeParametersRequest)`

### Applicable engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## modifyParameter

**Signature:** `modifyParameter(request: ModifyParameterRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `forcerestart` | boolean | No | Specifies whether to restart the instance for a new parameter value to take effect. Valid values: Example: `false` |
| `parameterGroupId` | string | No | The parameter template ID. Example: `rpg-xxxxxxxxx` |
| `parameters` | string | No | The JSON strings of parameters and their values. All the parameter values are of the string type. Fo Example: `{"delayed_insert_timeout":"600","max_length_for_sort_data":"2048"}` |
| `switchTime` | string | No | The time at which the modification takes effect. Specify the time in the ISO 8601 standard in the *y Example: `2022-05-06T09:24:00Z` |
| `switchTimeMode` | string | No | The time at which the modification takes effect. Valid values: Example: `ScheduleTime` |

## describeParameterGroup

**Signature:** `describeParameterGroup(request: DescribeParameterGroupRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `parameterGroupId` | string | Yes | The parameter template ID. You can call the DescribeParameterGroups operation to query the parameter Example: `rpg-dp****` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |

## describeParameterGroups

**Signature:** `describeParameterGroups(request: DescribeParameterGroupsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enableDetail` | boolean | No | Specifies whether to return the parameter overview. Example: `false` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy****` |

## createParameterGroup

**Signature:** `createParameterGroup(request: CreateParameterGroupRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (5 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engine` | string | Yes | The database engine. Valid values: Example: `mysql` |
| `engineVersion` | string | Yes | The database engine version of the instance. Example: `5.7` |
| `parameterGroupDesc` | string | No | The description of the parameter template. The value can be up to 200 characters in length. Example: `test` |
| `parameterGroupName` | string | Yes | The name of the parameter template. Example: `test1234` |
| `parameters` | string | Yes | A JSON string that consists of parameters and their values in the parameter template. Format: {"Para Example: `{"back_log":"3000","wait_timeout":"86400"}` |
| `regionId` | string | Yes | The region ID of the parameter template. You can call the DescribeRegions operation to query the mos Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to obtain the resource Example: `rg-acfmy*****` |

## deleteParameterGroup

**Signature:** `deleteParameterGroup(request: DeleteParameterGroupRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `parameterGroupId` | string | Yes | The parameter template ID. You can call the DescribeParameterGroups operation to query the parameter Example: `rpg-gfs****` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute to obtain the resource group ID. Example: `rg-acfmy*****` |

## modifyParameterGroup

**Signature:** `modifyParameterGroup(request: ModifyParameterGroupRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modifyMode` | string | No | The modification mode of the parameter template. Valid values: Example: `Collectivity` |
| `parameterGroupDesc` | string | No | The new description of the parameter template. The description can be up to 200 characters in length Example: `test` |
| `parameterGroupId` | string | Yes | The parameter template ID. You can call the DescribeParameterGroups operation to query the parameter Example: `rpg-13ppdh****` |
| `parameterGroupName` | string | No | The parameter template name. Example: `testgroup1` |
| `parameters` | string | No | A JSON string that consists of parameters and their values in the parameter template. Format: {"Para Example: `{"back_log":"3000"}` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy****` |

## cloneParameterGroup

**Signature:** `cloneParameterGroup(request: CloneParameterGroupRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `parameterGroupDesc` | string | No | The description of the parameter template in the destination region. Example: `CloneGroup1` |
| `parameterGroupId` | string | Yes | The ID of the parameter template. You can call the DescribeParameterGroups operation to query the pa Example: `rpg-13ppdh****` |
| `parameterGroupName` | string | Yes | The name of the parameter template in the destination region. Example: `tartestgroup` |
| `regionId` | string | Yes | The ID of the source region to which the parameter template belongs. You can call the DescribeRegion Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. You can leave this parameter empty. Example: `rg-acfmy****` |
| `targetRegionId` | string | Yes | The ID of the destination region. You can call the DescribeRegions operation to query the most recen Example: `cn-qingdao` |

## describeParameterTemplates

**Signature:** `describeParameterTemplates(request: DescribeParameterTemplatesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The RDS edition of the instance. Valid values: Example: `Basic` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `DBInstanceId` | string | No | The instance ID. Example: `rm-bp1imnm**********` |
| `engine` | string | Yes | The database engine of the instance. Valid values: Example: `mysql` |
| `engineVersion` | string | Yes | The version of the database engine. Valid values: Example: `8.0` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |

## describeModifyParameterLog

**Signature:** `describeModifyParameterLog(request: DescribeModifyParameterLogRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxx` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T*H Example: `2020-03-01T10:00Z` |
| `pageNumber` | number | No | The page number. Pages start from 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2020-03-01T00:00Z` |

## describeHistoryEvents

**Signature:** `describeHistoryEvents(request: DescribeHistoryEventsRequest)`

Queries historical events in the event center..

**Parameters:** (2 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `archiveStatus` | string | No | The resource status. Valid values: **importing**, failed, checksuccess, and deleted. Example: `deleted` |
| `eventCategory` | string | No | The system event category. For more information, see [View the event history of an ApsaraDB RDS inst Example: `Exception` |
| `eventId` | string | No | The event ID. Example: `5345398` |
| `eventLevel` | string | No | The event level. Valid values: ***high***, **medium**, and **low**. Example: `high` |
| `eventStatus` | string | No | The status of the exception. Valid values: Example: `1` |
| `eventType` | string | No | The system event type. This parameter takes effect only when InstanceEventType.N is not specified. V Example: `SystemFailure.Reboot` |
| `fromStartTime` | string | Yes | The beginning of the time range to query. Only tasks that have a start time later than or equal to t Example: `2022-01-02T11:31:03Z` |
| `instanceId` | string | No | The instance ID. Example: `rm-uf62br2491p5l****` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: 30. Example: `10` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/610399.htm Example: `cn-beijing` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy****` |
| `resourceType` | string | No | The resource type. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `taskId` | string | No | The task ID. This value is used to query the data of a specific task. Example: `241535739` |
| `toStartTime` | string | Yes | The end of the time range to query. Only tasks that have a start time earlier than or equal to the t Example: `2023-01-12T07:06:19Z` |

## describeHistoryTasks

**Signature:** `describeHistoryTasks(request: DescribeHistoryTasksRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure that you fully.

**Parameters:** (2 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromExecTime` | number | No | The minimum execution duration of the task. This parameter is used to filter tasks whose execution d Example: `0` |
| `fromStartTime` | string | Yes | The beginning of the time range to query. Only tasks that have a start time later than or equal to t Example: `2022-01-02T11:31:03Z` |
| `instanceId` | string | No | The instance ID. Separate multiple instance IDs with commas (,). You can specify up to 30 instance I Example: `rm-uf62br2491p5l****` |
| `instanceType` | string | No | Only Instance is supported. Example: `Instance` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **10 to 100**. Default value: **10**. Example: `10` |
| `regionId` | string | No | The region ID of the pending event. You can call the DescribeRegions operation to query the most rec Example: `cn-beijing` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-aekzbvctytru7ua` |
| `status` | string | No | The task status. Valid values: Example: `Scheduled` |
| `taskId` | string | No | The task ID. You can call the DescribeTasks operation to query the task ID. If multiple task IDs exi Example: `t-83br18hloy3faf****` |
| `taskType` | string | No | The task type. Separate multiple task types with commas (,). You can specify up to 30 task types. Th Example: `autotest_dispatch_cases` |
| `toExecTime` | number | No | The maximum execution duration of a task. This parameter is used to filter tasks whose execution dur Example: `0` |
| `toStartTime` | string | Yes | The end of the time range to query. Only tasks that have a start time earlier than or equal to the t Example: `2022-03-02T11:31:03Z` |

## describeEvents

**Signature:** `describeEvents(request: DescribeEventsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, read the following documentation and make sure that you fu.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2019-06-12T15:00:00Z` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `startTime` | string | No | The start of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T Example: `2019-06-11T15:00:00Z` |

## describeActionEventPolicy

**Signature:** `describeActionEventPolicy(request: DescribeActionEventPolicyRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute to query the resource group ID. Example: `rg-acfmy*****` |

## modifyActionEventPolicy

**Signature:** `modifyActionEventPolicy(request: ModifyActionEventPolicyRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, read the following documentation and make sure that you fu.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enableEventLog` | string | Yes | Specifies whether to enable the event history feature. Valid values: Example: `True` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |

## modifyTaskInfo

**Signature:** `modifyTaskInfo(request: ModifyTaskInfoRequest)`

Modifies information about the historical tasks in the task center..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionParams` | string | No | The action-related parameters. You can add action-related parameters based on your business requirem Example: `{\\"recoverTime\\":\\"2023-04-12T18:30:00Z\\",\\"recoverMode\\":\\"timePoint\\"}` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |
| `stepName` | string | No | The name of the execution step. Example: `ha_switch` |
| `taskAction` | string | No | The task action. Set the value to modifySwitchTime. The value specifies that you want to change the  Example: `ImportImage` |
| `taskId` | string | Yes | The task ID. You can call the DescribeTasks operation to query task IDs. Example: `t-83br18hloum8u3948s` |


## describeParameterTimedScheduleTask

**Signature:** `describeParameterTimedScheduleTask(request: DescribeParameterTimedScheduleTaskRequest)`

RDS MySQL查询修改参数运行时间列表.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dbInstanceName` | string | Yes | This parameter is required. Example: `rm-2ze2za3is7baay****` |


## modifyParameterTimedScheduleTask

**Signature:** `modifyParameterTimedScheduleTask(request: ModifyParameterTimedScheduleTaskRequest)`

RDS MySQL修改参数定时任务.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | No | - Example: `pgm-bp102g323jd4****` |
| `switchTime` | string | No | - Example: `2022-05-06T09:24:00Z` |
| `taskId` | number | No | - Example: `440437220` |


## deleteParameterTimedScheduleTask

**Signature:** `deleteParameterTimedScheduleTask(request: DeleteParameterTimedScheduleTaskRequest)`

RDS MySQL删除修改参数运行任务.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | No | - Example: `rm-uf6wjk5****` |
| `taskId` | number | No | - Example: `41698` |

