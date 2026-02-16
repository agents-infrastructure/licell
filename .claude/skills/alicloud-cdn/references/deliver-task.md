# Deliver & Report Tasks

Scheduled delivery tasks and subscription reports.

## createCdnDeliverTask

**Signature:** `createCdnDeliverTask(request: CreateCdnDeliverTaskRequest)`

> You can call this operation up to three times per second per account..

**Parameters:** (4 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deliver` | string | Yes | The method that is used to send operations reports. Operations reports are sent to you only by email Example: `{"email":{"subject":"the` |
| `domainName` | string | No | The domain names to be tracked. Separate multiple domain names with commas (,). You can specify up t Example: `www.example1.com,www.example2.com` |
| `name` | string | Yes | The name of the tracking task. Example: `Domain` |
| `reports` | string | Yes | The operations reports that are tracked by the task. The data must be escaped in JSON. Example: `[{\\\\"reportId\\\\":1,\\\\"conditions\\\\":[{\\\\"field\\\\":\\\\"prov\\\\",\\\\"op\\\\":\\\\"in\\\\",\\\\"value\\\\":[\\\\"Heilongjiang\\\\",\\\\"Beijing\\\\"]}]}]` |
| `schedule` | string | Yes | The parameters that specify the time interval at which the tracking task sends operations reports. T Example: `{\\\\"schedName\\\\":\\\\"The` |

## deleteCdnDeliverTask

**Signature:** `deleteCdnDeliverTask(request: DeleteCdnDeliverTaskRequest)`

> You can call this operation up to three times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deliverId` | number | Yes | The ID of the tracking task that you want to delete. You can call the [DescribeCdnDeliverList](https Example: `1` |

## describeCdnDeliverList

**Signature:** `describeCdnDeliverList(request: DescribeCdnDeliverListRequest)`

> You can call this operation up to 3 times per second per account..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deliverId` | number | No | The ID of the tracking task that you want to query. If you do not specify an ID, all tracking tasks  Example: `3` |

## updateCdnDeliverTask

**Signature:** `updateCdnDeliverTask(request: UpdateCdnDeliverTaskRequest)`

> You can call this operation up to three times per second per account..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deliver` | string | No | The method that is used to send operations reports. Operations reports are sent to you only by email Example: `{\\\\"email\\\\":{\\\\"subject\\\\":\\\\"The` |
| `deliverId` | number | Yes | The ID of the tracking task that you want to update. Example: `3` |
| `domainName` | string | No | The domain name that you want to track. You can specify up to 500 domain names in each request. Sepa Example: `www.example.com` |
| `name` | string | No | The name of the tracking task. Example: `Domain` |
| `reports` | string | No | The operations reports that are tracked by the task. The data must be escaped in JSON. Example: `[{\\\\"reportId\\\\":1,\\\\"conditions\\\\":[{\\\\"field\\\\":\\\\"prov\\\\",\\\\"op\\\\":\\\\"in\\\\",\\\\"value\\\\":[\\\\"Heilongjiang\\\\",\\\\"Beijing\\\\"]}]}]` |
| `schedule` | string | No | The parameters that specify the time interval at which the tracking task sends operations reports. T Example: `"{\\\\"schedName\\\\":\\\\"The` |

## createCdnSubTask

**Signature:** `createCdnSubTask(request: CreateCdnSubTaskRequest)`

This operation allows you to create a custom operations report for a specific domain name. You can view the statistics about the domain name in the report. *   You can call this operation up to three .

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain names to be tracked. Separate multiple domain names with commas (,). You can specify up t Example: `www.example1.com,www.example2.com` |
| `reportIds` | string | Yes | The IDs of the metrics that you want to include in the report. Separate multiple IDs with commas (,) Example: `1,3,5` |

## updateCdnSubTask

**Signature:** `updateCdnSubTask(request: UpdateCdnSubTaskRequest)`

> You can call this operation up to three times per second per account..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain name that you want to track. You can specify up to 500 domain names in each request. If y Example: `www.example.com` |
| `endTime` | string | No | The end time of the operations report. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format. The time Example: `2020-11-17T00:00:00Z` |
| `reportIds` | string | No | The IDs of operations reports that you want to update. Separate IDs with commas (,). Example: `1,2,3` |
| `startTime` | string | No | The start time of the operations report. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format. The ti Example: `2020-09-17T00:00:00Z` |

## describeCdnReport

**Signature:** `describeCdnReport(request: DescribeCdnReportRequest)`

> You can call this operation up to three times per second per account..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | The region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_detail/91077 Example: `shanghai` |
| `domainName` | string | No | The domain name that you want to query. Separate domain names with commas (,). Example: `www.example1.com,example2.com` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2020-09-17T01:00:00Z` |
| `httpCode` | string | No | The HTTP status code. Valid values: Example: `2xx` |
| `isOverseas` | string | No | Specifies whether the region is outside the Chinese mainland. Valid values: Example: `0` |
| `reportId` | number | Yes | The ID of the operations report that you want to query. You can specify only one ID in each request. Example: `1` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2020-09-17T00:00:00Z` |

## describeCdnReportList

**Signature:** `describeCdnReportList(request: DescribeCdnReportListRequest)`

This operation queries the metadata of all operations reports. The statistics in the reports are not returned. *   You can call this operation up to three times per second per account..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportId` | number | No | The ID of the operations report that you want to query. If you do not specify an ID, all operations  Example: `1` |

