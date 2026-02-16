# Usage & Billing

Usage data queries, billing, export tasks, and service management.

## describeCdnUserBillHistory

**Signature:** `describeCdnUserBillHistory(request: DescribeCdnUserBillHistoryRequest)`

You can query billing history up to the last one month. *   You can call this operation up to 100 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2018-10-31T16:00:00Z` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2018-09-30T16:00:00Z` |

## describeCdnUserBillPrediction

**Signature:** `describeCdnUserBillPrediction(request: DescribeCdnUserBillPredictionRequest)`

You can call this operation to estimate resource usage of the current month based on the metering method that is specified on the first day of the current month. You can call this operation to estimat.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | The billable region. Valid values: Example: `CN,OverSeas` |
| `dimension` | string | No | The billable item. A value of flow specifies bandwidth. Example: `flow` |
| `endTime` | string | No | The end time of the estimation. The default value is the current time. Specify the time in the ISO 8 Example: `2018-10-25T10:00:00Z` |
| `startTime` | string | No | The start time of the estimation. The default value is 00:00 on the first day of the current month.  Example: `2018-09-30T16:00:00Z` |

## describeCdnUserBillType

**Signature:** `describeCdnUserBillType(request: DescribeCdnUserBillTypeRequest)`

You can call this operation up to 100 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2018-10-31T16:00:00Z` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2018-09-30T16:00:00Z` |

## describeCdnUserQuota

**Signature:** `describeCdnUserQuota(request: DescribeCdnUserQuotaRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |

## describeCdnUserResourcePackage

**Signature:** `describeCdnUserResourcePackage(request: DescribeCdnUserResourcePackageRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `status` | string | No | The status of the resource plan that you want to query. Valid values: Example: `valid` |

## describeUserUsageDataExportTask

**Signature:** `describeUserUsageDataExportTask(request: DescribeUserUsageDataExportTaskRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageNumber` | string | No | The number of the page to return. Valid values: **1** to **100000**. Example: `1` |
| `pageSize` | string | No | The number of entries to return on each page. Default value: **20**. Maximum value: **50**. Example: `20` |

## describeUserUsageDetailDataExportTask

**Signature:** `describeUserUsageDetailDataExportTask(request: DescribeUserUsageDetailDataExportTaskRequest)`

This operation has been available since July 20, 2018. You can query information about resource usage collected within the last three months. *   You can call this operation up to 100 times per second.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageNumber` | string | No | The number of the page to return. Valid values: **1** to **100000**. Example: `1` |
| `pageSize` | string | No | The number of entries to return on each page. Default value: **20**. Maximum value: **50**. Example: `10` |

## createUsageDetailDataExportTask

**Signature:** `createUsageDetailDataExportTask(request: CreateUsageDetailDataExportTaskRequest)`

You can create a task to query data in the last year. The maximum time range that can be queried is one month. *   You can call this operation up to 100 times per second per account..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | No | The domain names. If you do not specify the Group parameter, resource usage details of these domain  Example: `example.com` |
| `endTime` | string | Yes | The end of the time range to query. Example: `2019-12-10T21:00:00Z` |
| `group` | string | No | The domain name group. If you specify this parameter, the **DomainNames** parameter is ignored. Example: `xxx` |
| `language` | string | No | The language in which you want to export the file. Valid values: Example: `en-us` |
| `startTime` | string | Yes | The beginning of the time range to query. Example: `2019-12-10T20:00:00Z` |
| `taskName` | string | No | The name of the task. Example: `Refresh` |
| `type` | string | Yes | The type of resource usage data to query. Valid values: Example: `flow` |

## createUserUsageDataExportTask

**Signature:** `createUserUsageDataExportTask(request: CreateUserUsageDataExportTaskRequest)`

You can create a task to query data in the last year. The maximum time range that can be queried is one month. *   You can call this operation up to 100 times per second per account..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Example: `2015-12-10T21:00:00Z` |
| `language` | string | No | The language in which you want to export the file. Default value: zh-cn. Valid values: Example: `zh-cn` |
| `startTime` | string | Yes | The start of the time range to query. The data is collected every 5 minutes. Example: `2015-12-10T20:00:00Z` |
| `taskName` | string | No | The name of the task. Example: `Refresh` |

## deleteUsageDetailDataExportTask

**Signature:** `deleteUsageDetailDataExportTask(request: DeleteUsageDetailDataExportTaskRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The ID of the task. You can call the [DescribeUserUsageDataExportTask](https://help.aliyun.com/docum Example: `10` |

## deleteUserUsageDataExportTask

**Signature:** `deleteUserUsageDataExportTask(request: DeleteUserUsageDataExportTaskRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The ID of the task to delete. Example: `10` |

## openCdnService

**Signature:** `openCdnService(request: OpenCdnServiceRequest)`

Alibaba Cloud CDN can be activated only once per Alibaba Cloud account. The Alibaba Cloud account must complete real-name verification to activate Alibaba Cloud CDN. *   You can call this operation up.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `internetChargeType` | string | Yes | The metering method of Alibaba Cloud CDN. A value of **PayByTraffic** indicates that the metering me Example: `PayByTraffic` |

## modifyCdnService

**Signature:** `modifyCdnService(request: ModifyCdnServiceRequest)`

Changes the metering method of Alibaba Cloud CDN..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `internetChargeType` | string | Yes | The new metering method for Alibaba Cloud CDN. Valid values: Example: `PayByTraffic` |

## describeCdnService

**Signature:** `describeCdnService(request: DescribeCdnServiceRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |

## describeCdnOrderCommodityCode

**Signature:** `describeCdnOrderCommodityCode(request: DescribeCdnOrderCommodityCodeRequest)`

Queries the code of a commodity by account UID..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commodityCode` | string | Yes | The original commodity code. Example: `xxx` |

