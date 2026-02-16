# Log Management

CDN access log download, real-time log delivery, and log configuration.

## describeCdnDomainLogs

**Signature:** `describeCdnDomainLogs(request: DescribeCdnDomainLogsRequest)`

If you do not set **StartTime** or **EndTime**, the request returns the data collected in the last 24 hours. If you set both **StartTime** and **EndTime**, the request returns the data collected withi.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can specify only one domain name. Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2017-12-22T08:00:00Z` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Example: `2` |
| `pageSize` | number | No | The number of entries to return on each page. Default value: **300**. Maximum value: **1000**. Valid Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2017-12-21T08:00:00Z` |

## describeCustomLogConfig

**Signature:** `describeCustomLogConfig(request: DescribeCustomLogConfigRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configId` | string | Yes | The ID of the custom configuration. Example: `123` |

## listDomainsByLogConfigId

**Signature:** `listDomainsByLogConfigId(request: ListDomainsByLogConfigIdRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configId` | string | Yes | The ID of the custom configuration. Example: `123` |

## createRealTimeLogDelivery

**Signature:** `createRealTimeLogDelivery(request: CreateRealTimeLogDeliveryRequest)`

>  You can call this API operation up to 100 times per second per account..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The accelerated domain name for which you want to configure real-time log delivery. Example: `example.com` |
| `logstore` | string | Yes | The name of the Logstore where log entries are stored. Example: `LogstoreName` |
| `project` | string | Yes | The name of the Log Service project that is used for real-time log delivery. Example: `ProjectName` |
| `region` | string | Yes | The ID of the region where the Log Service project is deployed. For more information, see [Regions t Example: `cn-shanghai` |

## deleteRealtimeLogDelivery

**Signature:** `deleteRealtimeLogDelivery(request: DeleteRealtimeLogDeliveryRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The acceleration domain name for which you want to disable real-time log delivery. You can specify m Example: `example.com` |
| `logstore` | string | Yes | The name of the Logstore where log entries are stored. Example: `LogstoreName` |
| `project` | string | Yes | The name of the Log Service project that is used for real-time log delivery. Example: `ProjectName` |
| `region` | string | Yes | The ID of the region where the Log Service project is deployed. For more information, see [Regions t Example: `cn-shanghai` |

## disableRealtimeLogDelivery

**Signature:** `disableRealtimeLogDelivery(request: DisableRealtimeLogDeliveryRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The accelerated domain name for which you want to disable real-time log delivery. You can specify mu Example: `example.com` |
| `logstore` | string | No | The name of the Logstore where log entries are stored. Example: `LogstoreName` |
| `project` | string | No | The name of the Log Service project that is used for real-time log delivery. Example: `ProjectName` |
| `region` | string | No | The ID of the region where the Log Service project is deployed. Example: `cn-shanghai` |

## enableRealtimeLogDelivery

**Signature:** `enableRealtimeLogDelivery(request: EnableRealtimeLogDeliveryRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The accelerated domain name for which you want to enable real-time log delivery. You can specify mul Example: `example.com` |
| `logstore` | string | No | The name of the Logstore where log entries are stored. Example: `LogstoreName` |
| `project` | string | No | The name of the Log Service project that is used for real-time log delivery. Example: `ProjectName` |
| `region` | string | No | The ID of the region where the Log Service project is deployed. Example: `cn-shanghai` |

## modifyRealtimeLogDelivery

**Signature:** `modifyRealtimeLogDelivery(request: ModifyRealtimeLogDeliveryRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The accelerated domain name for which you want to modify the configurations of real-time log deliver Example: `example.com` |
| `logstore` | string | Yes | The name of the Logstore where log entries are stored. Example: `TestLog` |
| `project` | string | Yes | The name of the Log Service project that is used for real-time log delivery. Example: `testProject` |
| `region` | string | Yes | The ID of the region where the Log Service project is deployed. For more information, see [Regions t Example: `ch-shanghai` |

## describeRealtimeDeliveryAcc

**Signature:** `describeRealtimeDeliveryAcc(request: DescribeRealtimeDeliveryAccRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2016-10-20T05:00:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. The value varies based on the values of the Example: `300` |
| `logStore` | string | No | The name of the Logstore that stores log data. If you do leave this parameter empty, real-time log d Example: `LogStore` |
| `project` | string | No | The name of the Log Service project that is used for real-time log delivery. If you do leave this pa Example: `Project` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2016-10-20T04:00:00Z` |

## listRealtimeLogDeliveryDomains

**Signature:** `listRealtimeLogDeliveryDomains(request: ListRealtimeLogDeliveryDomainsRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `logstore` | string | Yes | The name of the Logstore that collects log data from Alibaba Cloud CDN in real time. You can specify Example: `LogstoreName` |
| `project` | string | Yes | The name of the Log Service project that is used for real-time log delivery. You can specify multipl Example: `ProjectName` |
| `region` | string | Yes | The ID of the region where the Log Service project is deployed. You can specify multiple region IDs  Example: `ch-shanghai` |


## describeCdnDomainAtoaLogs

**Signature:** `describeCdnDomainAtoaLogs(request: DescribeCdnDomainAtoaLogsRequest)`

天翼定制化小时日志下载接口.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | - |


## describeCdnDomainLogsExTtl

**Signature:** `describeCdnDomainLogsExTtl(request: DescribeCdnDomainLogsExTtlRequest)`

查询离线日志下载地址.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |
| `endTime` | string | No | - Example: `2019-12-22T12:00:00Z` |
| `pageNumber` | number | No | - Example: `2` |
| `pageSize` | number | No | - Example: `300` |
| `startTime` | string | No | - Example: `2019-12-21T12:00:00Z` |


## describeDomainCustomLogConfig

**Signature:** `describeDomainCustomLogConfig(request: DescribeDomainCustomLogConfigRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can specify only one domain name. Example: `example.com` |


## describeDomainRealtimeLogDelivery

**Signature:** `describeDomainRealtimeLogDelivery(request: DescribeDomainRealtimeLogDeliveryRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The accelerated domain name for which real-time log delivery is enabled. You can specify only one do Example: `example.com` |


## deleteRealTimeLogLogstore

**Signature:** `deleteRealTimeLogLogstore(request: DeleteRealTimeLogLogstoreRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `logstore` | string | Yes | The name of the Logstore to which log entries are delivered. Example: `LogstoreName` |
| `project` | string | Yes | The name of the Log Service project that is used for real-time log delivery. Example: `ProjectName` |
| `region` | string | Yes | The ID of the region where the Log Service project is deployed. For more information, see [Regions t Example: `cn-shanghai` |

