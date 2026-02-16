# System Events & Diagnostics

System events, simulated events, and diagnostic operations.

## acceptInquiredSystemEvent

**Signature:** `acceptInquiredSystemEvent(request: AcceptInquiredSystemEventRequest)`

dubbo.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `choice` | string | No | - Example: `hide` |
| `eventId` | string | Yes | This parameter is required. Example: `e-2zeielxl1qzq8slb****` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |

## cancelSimulatedSystemEvents

**Signature:** `cancelSimulatedSystemEvents(request: CancelSimulatedSystemEventsRequest)`

Cancels simulated system events that are in the Scheduled or Executing state. After you cancel a simulated system event, the simulated event enters the Canceled state..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | string[] | Yes | The IDs of simulated system events. You can specify up to 100 event IDs in a single request. Example: `e-xhskHun1256****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## createSimulatedSystemEvents

**Signature:** `createSimulatedSystemEvents(request: CreateSimulatedSystemEventsRequest)`

You can use the ECS console, call [ECS API](https://help.aliyun.com/document_detail/63962.html) operations, or use CloudMonitor to view the scheduled simulated system events. The following description.

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventType` | string | Yes | The type of the system event. Valid values: Example: `SystemMaintenance.Reboot` |
| `instanceId` | string[] | Yes | The IDs of the instances. You can specify up to 100 instance IDs. Example: `i-bp1gtjxuuvwj17zr****` |
| `notBefore` | string | Yes | The scheduled start time of the event. Specify the time in the [ISO 8601](https://help.aliyun.com/do Example: `2018-12-01T06:32:31Z` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## describeInstancesFullStatus

**Signature:** `describeInstancesFullStatus(request: DescribeInstancesFullStatusRequest)`

## [](#)Usage notes The response includes the instance status and the instance system events that are in the Scheduled state. You can specify a period of time to query events that occurred within the .

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `end` | string | No | The end of the time range during which system events are published. Specify the time in the [ISO 860 Example: `2017-12-07T00:00:00Z` |
| `start` | string | No | The beginning of the time range during which system events are published. Specify the time in the [I Example: `2017-11-30T00:00:00Z` |
| `end` | string | No | The end of the time range during which O\\&M tasks related to scheduled system events are executed.  Example: `2017-11-30T00:00:00Z` |
| `start` | string | No | The beginning of the time range during which O\\&M tasks related to scheduled system events are exec Example: `2017-12-07T00:00:00Z` |
| `eventId` | string[] | No | The IDs of the system events. You can specify up to 100 event IDs in a single request. Example: `e-bp1hygp5b04o56l0****` |
| `eventType` | string | No | The type of the system event. This parameter is valid only when InstanceEventType.N is not specified Example: `InstanceExpiration.Stop` |
| `healthStatus` | string | No | The health status of the instance. Valid values: Example: `Maintaining` |
| `instanceEventType` | string[] | No | The types of system events. You can specify up to 30 event types in a single request. Example: `InstanceExpiration.Stop` |
| `instanceId` | string[] | No | The IDs of the instances. You can specify up to 100 instance IDs in a single request. Example: `i-bp67acfmxazb4p****` |
| `pageNumber` | number | No | The page number. The value must be a positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `status` | string | No | The lifecycle status of the instance. Valid values: Example: `Running` |

## describeDiskMonitorData

**Signature:** `describeDiskMonitorData(request: DescribeDiskMonitorDataRequest)`

Take note of the following items: *   Monitoring data of only disks that are in the In Use (`In_use`) state can be queried. For more information, see [Disk states](https://help.aliyun.com/document_det.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diskId` | string | Yes | The ID of the cloud disk that you want to query. Example: `d-bp1bq5g3dxxo1x4o****` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com/docum Example: `2014-07-23T12:09:00Z` |
| `period` | number | No | The interval at which to retrieve the monitoring data. Unit: seconds. Valid values: Example: `60` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com Example: `2014-07-23T12:07:00Z` |

## redeployInstance

**Signature:** `redeployInstance(request: RedeployInstanceRequest)`

## Usage notes RedeployInstance is an asynchronous operation. The operation migrates the instance to a healthy physical server and then restarts the instance. After the instance is redeployed, it ente.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `forceStop` | boolean | No | Specifies whether to forcefully stop the instance that is in the Running state. Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp1azkttqpldxgted****` |

## createDiagnosticMetricSet

**Signature:** `createDiagnosticMetricSet(request: CreateDiagnosticMetricSetRequest)`

Creates a diagnostic metric set. You can group diagnostic metrics into diagnostic metric sets..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the diagnostic metric set. Example: `The` |
| `metricIds` | string[] | Yes | The IDs of diagnostic metrics. You can specify up to 100 diagnostic metric IDs. |
| `metricSetName` | string | No | The name of the diagnostic metric set. Example: `The` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceType` | string | Yes | The type of the resource. Example: `instance` |

## deleteDiagnosticMetricSets

**Signature:** `deleteDiagnosticMetricSets(request: DeleteDiagnosticMetricSetsRequest)`

Deletes diagnostic metric sets..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metricSetIds` | string[] | Yes | The IDs of diagnostic metric sets. You can specify up to 10 set IDs. |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## describeDiagnosticMetrics

**Signature:** `describeDiagnosticMetrics(request: DescribeDiagnosticMetricsRequest)`

Queries diagnostic metrics..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `metricIds` | string[] | No | - |
| `nextToken` | string | No | The pagination token that is used in the request to retrieve a new page of results. You do not need  Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID pf the diagnostic metric. You can call the [DescribeRegions](https://help.aliyun.com/d Example: `cn-hangzhou` |
| `resourceType` | string | No | The resource type supported by the diagnostic metric. Example: `instance` |

## describeDiagnosticMetricSets

**Signature:** `describeDiagnosticMetricSets(request: DescribeDiagnosticMetricSetsRequest)`

Queries diagnostic metric sets..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `metricSetIds` | string[] | No | - |
| `nextToken` | string | No | The pagination token that is used in the request to retrieve a new page of results. You do not need  Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the diagnostic metric set. You can call the [DescribeRegions](https://help.aliyun.c Example: `cn-hangzhou` |
| `resourceType` | string | No | The resource type supported by the diagnostic metric set. Example: `instance` |
| `type` | string | No | The type of the diagnostic metric set. Valid values: Example: `User` |

## createDiagnosticReport

**Signature:** `createDiagnosticReport(request: CreateDiagnosticReportRequest)`

Creates a diagnostic report for a resource. When you call this operation, you can configure the MetricSetId parameter to create a diagnostic report based on the specified diagnostic metric set. Then, .

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end time. This parameter takes effect only for diagnostic metrics that do not need to be assesse Example: `2022-07-11T14:00:00Z` |
| `metricSetId` | string | No | The ID of the diagnostic metric set. If this parameter is left empty, the dms-instancedefault set is Example: `dms-uf6i0tv2refv8wz*****` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The ID of resource N. Example: `i-uf6i0tv2refv8wz*****` |
| `startTime` | string | No | The start time. This parameter takes effect only for diagnostic metrics that do not need to be asses Example: `2022-07-11T12:00:00Z` |

## deleteDiagnosticReports

**Signature:** `deleteDiagnosticReports(request: DeleteDiagnosticReportsRequest)`

You can call this operation to delete the diagnostic reports that are no longer needed..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `reportIds` | string[] | Yes | The IDs of the diagnostic reports. You can specify up to 100 resource IDs. |

## describeDiagnosticReports

**Signature:** `describeDiagnosticReports(request: DescribeDiagnosticReportsRequest)`

Queries resource diagnostic reports..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the request to retrieve a new page of results. You do not need  Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `reportIds` | string[] | No | - |
| `resourceIds` | string[] | No | - |
| `severity` | string | No | The severity level of the diagnostic report. Valid values: Example: `Normal` |
| `status` | string | No | The status of the diagnostic report. Valid values: Example: `Finished` |

## describeDiagnosticReportAttributes

**Signature:** `describeDiagnosticReportAttributes(request: DescribeDiagnosticReportAttributesRequest)`

Queries the details of a diagnostic report..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID of the diagnostic report. You can call the [DescribeRegions](https://help.aliyun.com/d Example: `cn-hangzhou` |
| `reportId` | string | Yes | The ID of the diagnostic report. Example: `dr-i-uf6i0tv2refv8wz*****` |

## endTerminalSession

**Signature:** `endTerminalSession(request: EndTerminalSessionRequest)`

After you closes a session, the session is no longer available. *   The WebSocket URL that is associated with a closed session is invalid and no longer available..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the session. Example: `cn-hangzhou` |
| `sessionId` | string | Yes | The session ID. Example: `s-hz023od0x9****` |

## modifyDiagnosticMetricSet

**Signature:** `modifyDiagnosticMetricSet(request: ModifyDiagnosticMetricSetRequest)`

Modifies a diagnostic metric set..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the diagnostic metric set. Example: `connection` |
| `metricIds` | string[] | No | - |
| `metricSetId` | string | Yes | The IDs of the diagnostic metric sets. Example: `dms-uf6i0tv2refv8wz*****` |
| `metricSetName` | string | No | The name of the diagnostic metric set. Example: `remoteConnectError` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceType` | string | No | The resource type. Example: `instance` |

## createPlanMaintenanceWindow

**Signature:** `createPlanMaintenanceWindow(request: CreatePlanMaintenanceWindowRequest)`

创建运维窗口.

**Parameters:** (9 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `value` | string | No | - Example: `21.137.18.60` |
| `resourceGroupId` | string | No | - Example: `rg-aekzhm7pmnvcbty` |
| `scope` | string | Yes | This parameter is required. Example: `Tag` |
| `endTime` | string | No | - Example: `Tuesday,03:00` |
| `startTime` | string | No | - Example: `Monday,22:00` |
| `periodUnit` | string | Yes | This parameter is required. Example: `Weekly` |
| `rangeList` | CreatePlanMaintenanceWindowRequestTimePeriodRangeList[] | Yes | - |
| `enable` | boolean | Yes | This parameter is required. Example: `true` |
| `planWindowName` | string | Yes | - |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `supportMaintenanceAction` | string | Yes | This parameter is required. Example: `Reboot` |
| `targetResource` | CreatePlanMaintenanceWindowRequestTargetResource | Yes | - |
| `timePeriod` | CreatePlanMaintenanceWindowRequestTimePeriod | Yes | - |

## deletePlanMaintenanceWindow

**Signature:** `deletePlanMaintenanceWindow(request: DeletePlanMaintenanceWindowRequest)`

删除运维窗口.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `planWindowId` | string | Yes | This parameter is required. Example: `pw-bp12kkvnebe7hksqnx9w` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |

## describePlanMaintenanceWindows

**Signature:** `describePlanMaintenanceWindows(request: DescribePlanMaintenanceWindowsRequest)`

查询运维窗口.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `enable` | boolean | No | - Example: `true` |
| `maxResults` | number | No | - Example: `10` |
| `nextToken` | string | No | - Example: `AAAAAdDWBF2` |
| `planWindowId` | string | No | - Example: `pw-bp1jarob1aup7yvlrdt6` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `targetResourceGroupId` | string | No | - Example: `rg-d85g5yocioezmdrll` |

## modifyPlanMaintenanceWindow

**Signature:** `modifyPlanMaintenanceWindow(request: ModifyPlanMaintenanceWindowRequest)`

更新运维窗口.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `resourceGroupId` | string | No | - Example: `rg-acfmy4cc27vsvia` |
| `scope` | string | No | - Example: `Tag` |
| `endTime` | string | No | - Example: `Tuesday,03:00` |
| `startTime` | string | No | - Example: `Monday,22:00` |
| `periodUnit` | string | No | - Example: `Year` |
| `enable` | boolean | No | - Example: `false` |
| `planWindowId` | string | Yes | This parameter is required. Example: `pw-bp1au1w8v8a1yer65g5k` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `supportMaintenanceAction` | string | No | - Example: `Reboot` |

