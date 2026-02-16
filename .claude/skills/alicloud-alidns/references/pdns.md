# Public DNS (PDNS)

Public DNS service management, app keys, UDP IP segments, threat analysis, and statistics.

## createPdnsAppKey

**Signature:** `createPdnsAppKey(request: CreatePdnsAppKeyRequest)`

创建公共DNS AppKey.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |

## createPdnsUdpIpSegment

**Signature:** `createPdnsUdpIpSegment(request: CreatePdnsUdpIpSegmentRequest)`

创建公共DNS Udp Ip地址段.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ip` | string | No | - |

## describePdnsAccountSummary

**Signature:** `describePdnsAccountSummary(request: DescribePdnsAccountSummaryRequest)`

获取公共DNS用户数据概览.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | - |

## describePdnsAppKey

**Signature:** `describePdnsAppKey(request: DescribePdnsAppKeyRequest)`

获取公共DNS AppKey 详情.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appKeyId` | string | No | - |

## describePdnsAppKeys

**Signature:** `describePdnsAppKeys(request: DescribePdnsAppKeysRequest)`

获取公共DNS AppKey 列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |

## describePdnsOperateLogs

**Signature:** `describePdnsOperateLogs(request: DescribePdnsOperateLogsRequest)`

获取公共DNS 操作日志列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | No | - |

## describePdnsRequestStatistic

**Signature:** `describePdnsRequestStatistic(request: DescribePdnsRequestStatisticRequest)`

Queries the statistics on requests for Alibaba Cloud Public DNS..

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The primary domain name whose statistics you want to query. Example: `example.com` |
| `endDate` | string | No | The end of the time range to query. Specify the time in the **YYYY-MM-DD** format. Example: `2024-7-1` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `zh` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the **YYYY-MM-DD** format. Example: `2024-06-14` |
| `subDomain` | string | No | The subdomain name whose statistics you want to query. Example: `www.example.com` |
| `type` | string | No | The type of the request statistics that you want to query. Valid values: Example: `ACCOUNT` |

## describePdnsRequestStatistics

**Signature:** `describePdnsRequestStatistics(request: DescribePdnsRequestStatisticsRequest)`

Queries a list of statistics on requests for Alibaba Cloud Public DNS..

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The primary domain name whose statistics you want to query. Example: `example.com` |
| `endDate` | string | No | The end of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2024-07-14` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `zh` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: 20. Valid values: 1 to 100. Example: `20` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2024-06-14` |
| `subDomain` | string | No | The subdomain name whose statistics you want to query. Example: `www.example.com` |
| `type` | string | No | The type of the request statistics that you want to query. Valid values: Example: `DOMAIN` |

## describePdnsThreatLogs

**Signature:** `describePdnsThreatLogs(request: DescribePdnsThreatLogsRequest)`

获取公共DNS 威胁日志列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | - |

## describePdnsThreatStatistic

**Signature:** `describePdnsThreatStatistic(request: DescribePdnsThreatStatisticRequest)`

获取公共DNS 威胁统计.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | - |

## describePdnsThreatStatistics

**Signature:** `describePdnsThreatStatistics(request: DescribePdnsThreatStatisticsRequest)`

获取公共DNS 威胁统计列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | - |

## describePdnsUdpIpSegments

**Signature:** `describePdnsUdpIpSegments(request: DescribePdnsUdpIpSegmentsRequest)`

获取公共DNS Udp IP段列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |

## describePdnsUserInfo

**Signature:** `describePdnsUserInfo(request: DescribePdnsUserInfoRequest)`

Queries the information about users in Alibaba Cloud Public DNS..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid value: Example: `en` |

## pausePdnsService

**Signature:** `pausePdnsService(request: PausePdnsServiceRequest)`

暂停公共DNS服务.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |

## removePdnsAppKey

**Signature:** `removePdnsAppKey(request: RemovePdnsAppKeyRequest)`

删除公共DNS AppKey.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appKeyId` | string | No | - |

## removePdnsUdpIpSegment

**Signature:** `removePdnsUdpIpSegment(request: RemovePdnsUdpIpSegmentRequest)`

删除公共DNS Udp Ip地址段.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ip` | string | No | - |

## resumePdnsService

**Signature:** `resumePdnsService(request: ResumePdnsServiceRequest)`

恢复公共DNS服务.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |

## validatePdnsUdpIpSegment

**Signature:** `validatePdnsUdpIpSegment(request: ValidatePdnsUdpIpSegmentRequest)`

验证公共DNS Udp Ip地址段.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ip` | string | No | - |

