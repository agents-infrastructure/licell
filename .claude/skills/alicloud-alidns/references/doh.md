# DNS over HTTPS (DoH)

DoH statistics and user information.

## describeDohAccountStatistics

**Signature:** `describeDohAccountStatistics(request: DescribeDohAccountStatisticsRequest)`

@param request - DescribeDohAccountStatisticsRequest.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | The end of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `lang` | string | No | The language type. Example: `en` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |

## describeDohUserInfo

**Signature:** `describeDohUserInfo(request: DescribeDohUserInfoRequest)`

Queries the numbers of accessed domains and subdomains by using DNS over HTTPS (DoH)..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | The end time for the query. Format: YYYY-MM-DD Example: `2019-07-04` |
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |
| `startDate` | string | No | The start time for the query. Format: YYYY-MM-DD Example: `2019-07-04` |

## describeDohDomainStatistics

**Signature:** `describeDohDomainStatistics(request: DescribeDohDomainStatisticsRequest)`

查询DOH域名请求量数据.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. Example: `example.com` |
| `endDate` | string | No | The end of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `lang` | string | No | The language type. Example: `en` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |

## describeDohDomainStatisticsSummary

**Signature:** `describeDohDomainStatisticsSummary(request: DescribeDohDomainStatisticsSummaryRequest)`

@param request - DescribeDohDomainStatisticsSummaryRequest.

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain name. Example: `example.com` |
| `endDate` | string | No | The end of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `lang` | string | No | The language type. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: 100. Default value: 20. Example: `20` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |

## describeDohSubDomainStatistics

**Signature:** `describeDohSubDomainStatistics(request: DescribeDohSubDomainStatisticsRequest)`

@param request - DescribeDohSubDomainStatisticsRequest.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | The end of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `lang` | string | No | The language type. Example: `en` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `subDomain` | string | Yes | The subdomain whose statistics you want to query. Example: `www.example.com` |

## describeDohSubDomainStatisticsSummary

**Signature:** `describeDohSubDomainStatisticsSummary(request: DescribeDohSubDomainStatisticsSummaryRequest)`

@param request - DescribeDohSubDomainStatisticsSummaryRequest.

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain name. Example: `example.com` |
| `endDate` | string | No | The end of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `lang` | string | No | The language type. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: 100. Default value: 20. Example: `20` |
| `startDate` | string | No | The beginning of the time range to query. Specify the time in the YYYY-MM-DD format. Example: `2019-07-04` |
| `subDomain` | string | No | The subdomain. Example: `www.example.com` |

