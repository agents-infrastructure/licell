# Monitoring & Statistics

Real-time monitoring data, bandwidth, QPS, hit rate, HTTP status codes, and traffic statistics.

## describeDomainRealTimeBpsData

**Signature:** `describeDomainRealTimeBpsData(request: DescribeDomainRealTimeBpsDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both the.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-11-30T05:40:00Z` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). Example: `telecom` |
| `locationNameEn` | string | No | The name of the region. Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-11-30T05:33:00Z` |

## describeDomainRealTimeByteHitRateData

**Signature:** `describeDomainRealTimeByteHitRateData(request: DescribeDomainRealTimeByteHitRateDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both the .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 100 domain names in each call. Separate multiple  Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2020-05-15T09:15:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2020-05-15T09:13:00Z` |

## describeDomainRealTimeDetailData

**Signature:** `describeDomainRealTimeDetailData(request: DescribeDomainRealTimeDetailDataRequest)`

You can query data in the last seven days. Data is collected every minute. *   You can call this operation up to 10 times per second per account..

**Parameters:** (4 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name that you want to query. Example: `example.com` |
| `endTime` | string | Yes | The end of the time range to query. Example: `2019-11-30T05:40:00Z` |
| `field` | string | Yes | The type of data that you want to query. You can specify multiple data types and separate them with  Example: `qps` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). You can call the [DescribeCdnRegionAndIsp](https:// Example: `telecom` |
| `locationNameEn` | string | No | The name of the region. If you do not specify a region, data in all regions is queried. You can call Example: `Guangdong` |
| `merge` | string | No | Specifies whether to return a summary value based on ISPs and regions. Valid values: Example: `false` |
| `mergeLocIsp` | string | No | Specifies whether to return a summary value based on ISPs and regions. Valid values: Example: `false` |
| `startTime` | string | Yes | The beginning of the time range to query. Example: `2019-11-30T05:33:00Z` |

## describeDomainRealTimeHttpCodeData

**Signature:** `describeDomainRealTimeHttpCodeData(request: DescribeDomainRealTimeHttpCodeDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both thes.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify multiple accelerated domain names and separate them wit Example: `example.com,example.org` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-11-30T05:40:00Z` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). You can call the [DescribeCdnRegionAndIsp](https:// Example: `unicom` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-11-30T05:39:00Z` |

## describeDomainRealTimeQpsData

**Signature:** `describeDomainRealTimeQpsData(request: DescribeDomainRealTimeQpsDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both thes.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-02T11:26:00Z` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). Example: `telecom` |
| `locationNameEn` | string | No | The name of the region. Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-02T11:25:00Z` |

## describeDomainRealTimeReqHitRateData

**Signature:** `describeDomainRealTimeReqHitRateData(request: DescribeDomainRealTimeReqHitRateDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both the .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 100 domain names in each call. Separate multiple  Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2018-01-02T11:26:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2018-01-02T11:23:00Z` |

## describeDomainRealTimeSrcBpsData

**Signature:** `describeDomainRealTimeSrcBpsData(request: DescribeDomainRealTimeSrcBpsDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both thes.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 100 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-12-10T20:01:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-10T20:00:00Z` |

## describeDomainRealTimeSrcHttpCodeData

**Signature:** `describeDomainRealTimeSrcHttpCodeData(request: DescribeDomainRealTimeSrcHttpCodeDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you set both the .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 100 domain names in each call. Separate multiple  Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-11-30T05:40:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-11-30T04:40:00Z` |

## describeDomainRealTimeSrcTrafficData

**Signature:** `describeDomainRealTimeSrcTrafficData(request: DescribeDomainRealTimeSrcTrafficDataRequest)`

You can call this operation up to 10 times per second per account. * If you do not specify the StartTime or EndTime parameter, the request returns the data collected in the last hour by default. If yo.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 100 domain names in each call. Separate multiple  Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-10T20:01:00Z` |
| `startTime` | string | No | The start of the time range to query. Example: `2019-12-10T20:00:00Z` |

## describeDomainRealTimeTrafficData

**Signature:** `describeDomainRealTimeTrafficData(request: DescribeDomainRealTimeTrafficDataRequest)`

You can call this operation up to 50 times per second per account. * If you do not specify the StartTime or EndTime parameter, the request returns the data collected in the last hour. If you specify b.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 100 domain names in each call. Separate multiple  Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-10T20:01:00Z` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). Example: `telecom` |
| `locationNameEn` | string | No | The name of the region. Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-10T20:00:00Z` |

## describeDomainBpsData

**Signature:** `describeDomainBpsData(request: DescribeDomainBpsDataRequest)`

You can call this operation up to 150 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2020-05-14T10:00:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). You can call the [DescribeCdnRegionAndIsp](https:// Example: `telecom` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2020-05-14T09:50:00Z` |

## describeDomainBpsDataByLayer

**Signature:** `describeDomainBpsDataByLayer(request: DescribeDomainBpsDataByLayerRequest)`

You can call this operation up to 20 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both .

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2020-05-06T07:20:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). You can call the [DescribeCdnRegionAndIsp](~~Descri Example: `unicom` |
| `layer` | string | No | The layer at which you want to query the bandwidth data. Valid values: Example: `IPv4` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](~~DescribeCdnRegionAndIsp~~) oper Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2020-05-06T07:10:00Z` |

## describeDomainBpsDataByTimeStamp

**Signature:** `describeDomainBpsDataByTimeStamp(request: DescribeDomainBpsDataByTimeStampRequest)`

The bandwidth is measured in bit/s. *   You can specify only one accelerated domain name in each request. *   The data is collected every 5 minutes. *   You can call this operation up to 20 times per .

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |
| `ispNames` | string | Yes | The names of the Internet service providers (ISPs). Separate multiple ISPs with commas (,). Example: `uni***,tele***` |
| `locationNames` | string | Yes | The regions. Separate multiple regions with commas (,). Example: `liaoning,guangxi` |
| `timePoint` | string | Yes | The point in time to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:mm:ssZ fo Example: `2019-11-30T05:40:00Z` |

## describeDomainHitRateData

**Signature:** `describeDomainHitRateData(request: DescribeDomainHitRateDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-30T08:10:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-30T08:00:00Z` |

## describeDomainHttpCodeData

**Signature:** `describeDomainHttpCodeData(request: DescribeDomainHttpCodeDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2021-06-29T05:45:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the region. You can call the DescribeCdnRegionAndIsp operation to query regions. If you  Example: `unicom` |
| `locationNameEn` | string | No | The name of the Internet service provider (ISP). You can call the DescribeCdnRegionAndIsp operation  Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2021-06-29T05:30:00Z` |

## describeDomainHttpCodeDataByLayer

**Signature:** `describeDomainHttpCodeDataByLayer(request: DescribeDomainHttpCodeDataByLayerRequest)`

You can call this operation up to 20 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both .

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2020-07-06T22:00:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). You can call the [DescribeCdnRegionAndIsp](https:// Example: `telecom` |
| `layer` | string | No | The protocol by which you want to query HTTP status codes. The network layer supports **IPv4** and * Example: `all` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `hangzhou` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2020-07-05T22:00:00Z` |

## describeDomainISPData

**Signature:** `describeDomainISPData(request: DescribeDomainISPDataRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** See `DescribeDomainISPDataRequest` model.

## describeDomainMax95BpsData

**Signature:** `describeDomainMax95BpsData(request: DescribeDomainMax95BpsDataRequest)`

*You can use one of the following methods to query data:** *   If you specify the StartTime and EndTime parameters and the time range that is specified by these parameters is less than or equal to 24 .

**Parameters:** See `DescribeDomainMax95BpsDataRequest` model.

## describeDomainMultiUsageData

**Signature:** `describeDomainMultiUsageData(request: DescribeDomainMultiUsageDataRequest)`

If you do not set StartTime or EndTime, data collected within the last 10 minutes is queried. *   The maximum interval between StartTime and EndTime is 1 hour. *   You can query data within the last 9.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2017-12-10T21:00:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2017-12-10T20:00:00Z` |

## describeDomainPathData

**Signature:** `describeDomainPathData(request: DescribeDomainPathDataRequest)`

This operation is available only to users that are on the whitelist. If the daily peak bandwidth value of your workloads reaches 10 Gbit/s, you can [submit a ticket](https://workorder-intl.console.ali.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2016-10-21T04:00:00Z` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: integers from **1** to **1000**. Example: `20` |
| `path` | string | No | The paths that you want to query. Separate paths with forward slashes (/). If you do not set this pa Example: `/path/` |
| `startTime` | string | No | Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:mm:ssZ format. The time must be in UT Example: `2016-10-20T04:00:00Z` |

## describeDomainPvData

**Signature:** `describeDomainPvData(request: DescribeDomainPvDataRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2015-11-29T00:00:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2015-11-28T00:00:00Z` |

## describeDomainQpsData

**Signature:** `describeDomainQpsData(request: DescribeDomainQpsDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-11-30T05:40:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP) for your Alibaba Cloud CDN service. You can call the Example: `unicom` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-11-30T05:33:00Z` |

## describeDomainQpsDataByLayer

**Signature:** `describeDomainQpsDataByLayer(request: DescribeDomainQpsDataByLayerRequest)`

You can call this operation up to 20 times per second per user. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both the.

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify a maximum of 500 domain names in a request. Separate mu Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format in the ISO 8 Example: `2019-11-30T05:40:00Z` |
| `interval` | string | No | The time interval between the data entries to return. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP) for your Alibaba Cloud CDN service. You can call the Example: `unicom` |
| `layer` | string | No | The layers at which you want to query the number of queries per second. Valid values: Example: `all` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format in the Example: `2019-11-30T05:33:00Z` |

## describeDomainRegionData

**Signature:** `describeDomainRegionData(request: DescribeDomainRegionDataRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you not use thi.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2015-12-07T12:00:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2015-12-05T12:00:00Z` |

## describeDomainReqHitRateData

**Signature:** `describeDomainReqHitRateData(request: DescribeDomainReqHitRateDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2017-12-22T08:00:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2017-12-21T08:00:00Z` |

## describeDomainSrcBpsData

**Signature:** `describeDomainSrcBpsData(request: DescribeDomainSrcBpsDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not specify the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you spec.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each call. Separate multiple  Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-10T20:30:00Z` |
| `interval` | string | No | The time interval between the data entries. Unit: seconds. Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-10T20:00:00Z` |

## describeDomainSrcHttpCodeData

**Signature:** `describeDomainSrcHttpCodeData(request: DescribeDomainSrcHttpCodeDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify a maximum of 500 domain names in a request. Separate mu Example: `example.com,example.org` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format in the ISO 8 Example: `2019-11-30T05:40:00Z` |
| `interval` | string | No | The time interval between the data entries to return. Unit: seconds. Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-11-30T05:33:00Z` |

## describeDomainSrcQpsData

**Signature:** `describeDomainSrcQpsData(request: DescribeDomainSrcQpsDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify multiple domain names in each request. Separate multipl Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-11-30T05:40:00Z` |
| `interval` | string | No | The time interval between the data entries. Unit: seconds. Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-11-30T05:33:00Z` |

## describeDomainSrcTopUrlVisit

**Signature:** `describeDomainSrcTopUrlVisit(request: DescribeDomainSrcTopUrlVisitRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2018-10-03T20:00:00Z` |
| `sortBy` | string | No | The method that is used to sort the returned URLs. Default value: **pv**. Valid values: Example: `pv` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2018-10-03T16:00:00Z` |

## describeDomainSrcTrafficData

**Signature:** `describeDomainSrcTrafficData(request: DescribeDomainSrcTrafficDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2015-12-10T21:00:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2015-12-10T20:00:00Z` |

## describeDomainTopClientIpVisit

**Signature:** `describeDomainTopClientIpVisit(request: DescribeDomainTopClientIpVisitRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-10-01T16:00:00Z` |
| `limit` | string | No | The maximum number of entries to return. Maximum value: 100. Example: `20` |
| `locationNameEn` | string | No | The name of the region. Separate multiple region names with commas (,). Example: `beijing` |
| `sortBy` | string | No | The criterion by which you want to sort client IP addresses. Valid values: Example: `traf` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-09-30T16:00:00Z` |

## describeDomainTopReferVisit

**Signature:** `describeDomainTopReferVisit(request: DescribeDomainTopReferVisitRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-22T12:00:00Z` |
| `sortBy` | string | No | The order in which you want to sort the queried information. Valid values: Example: `pv` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-21T12:00:00Z` |

## describeDomainTopUrlVisit

**Signature:** `describeDomainTopUrlVisit(request: DescribeDomainTopUrlVisitRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name that you want to query. Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-10-04T16:00:00Z` |
| `sortBy` | string | No | The method that is used to sort the returned URLs. Default value: **pv**. Valid values: Example: `pv` |
| `startTime` | string | No | The start of the time range to query. Example: `2019-10-04T00:00:00Z` |

## describeDomainTrafficData

**Signature:** `describeDomainTrafficData(request: DescribeDomainTrafficDataRequest)`

You can call this operation up to 100 times per second per account. * If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both.

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify up to 500 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2015-12-10T21:00:00Z` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP). You can call the [DescribeCdnRegionAndIsp](~~Descri Example: `unicom` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](~~DescribeCdnRegionAndIsp~~) oper Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2015-12-10T20:00:00Z` |

## describeDomainUsageData

**Signature:** `describeDomainUsageData(request: DescribeDomainUsageDataRequest)`

You can call this operation up to 10 times per second per account. * The time granularity supported by the Interval parameter, the maximum time period within which historical data is available, and th.

**Parameters:** (3 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | The billable region. Valid values: Example: `CN` |
| `dataProtocol` | string | No | The protocol of the data that you want to query. Valid values: Example: `all` |
| `domainName` | string | No | The accelerated domain name. You can specify up to 100 domain names in each request. Separate multip Example: `example.com` |
| `endTime` | string | Yes | The end of the time range to query. Example: `2015-12-10T22:00:00Z` |
| `field` | string | Yes | The type of the data that you want to query. Valid values: Example: `bps` |
| `interval` | string | No | The time granularity of the data entries. Unit: seconds. Valid values: **300** (5 minutes), **3600** Example: `300` |
| `startTime` | string | Yes | The beginning of the time range to query. Example: `2015-12-10T20:00:00Z` |
| `type` | string | No | The type of content that you want to query. Valid values: Example: `static` |

## describeDomainsUsageByDay

**Signature:** `describeDomainsUsageByDay(request: DescribeDomainsUsageByDayRequest)`

You can call this operation up to 10 times per second per account. *   If you do not set StartTime or EndTime, data within the last 24 hours is queried. If you set both StartTime and EndTime, data wit.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify only one domain name. Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Example: `2019-12-23T09:00:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Example: `2019-12-22T08:00:00Z` |

## describeRangeDataByLocateAndIspService

**Signature:** `describeRangeDataByLocateAndIspService(request: DescribeRangeDataByLocateAndIspServiceRequest)`

The data is collected every 5 minutes. *   You can call this operation up to 20 times per second per account..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The accelerated domain name. Example: `example.com` |
| `endTime` | string | Yes | The end of the time range to query. Example: `2019-11-30T05:40:00Z` |
| `ispNames` | string | No | The name of the ISP. You can specify only one ISP name in each call. Example: `unicom` |
| `locationNames` | string | No | The names of the regions. Separate multiple region names with commas (,). Example: `liaoning,guangxi` |
| `startTime` | string | Yes | The beginning of the time range to query. Example: `2019-11-30T05:33:00Z` |

## describeTopDomainsByFlow

**Signature:** `describeTopDomainsByFlow(request: DescribeTopDomainsByFlowRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-12-23T08:00:00Z` |
| `limit` | number | No | The maximum number of domain names to query. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-12-22T08:00:00Z` |

## describeEsExceptionData

**Signature:** `describeEsExceptionData(request: DescribeEsExceptionDataRequest)`

You can call this operation up to 30 times per second per account..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. Example: `2021-02-18T20:00:00Z` |
| `ruleId` | string | Yes | The script ID. You can call the [DescribeCdnDomainConfigs](https://help.aliyun.com/document_detail/9 Example: `212896**` |
| `startTime` | string | Yes | The beginning of the time range to query. Example: `2021-02-17T20:00:00Z` |

## describeEsExecuteData

**Signature:** `describeEsExecuteData(request: DescribeEsExecuteDataRequest)`

You can call this operation up to 30 times per second per account..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2021-02-18T20:00:00Z` |
| `ruleId` | string | Yes | The ID of the rule. You can call the [DescribeCdnDomainConfigs](https://help.aliyun.com/document_det Example: `212896**` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2021-02-17T20:00:00Z` |


## describeDomainAverageResponseTime

**Signature:** `describeDomainAverageResponseTime(request: DescribeDomainAverageResponseTimeRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |
| `domainType` | string | No | The type of the query condition. When you set the value to dynamic, this operation queries the avera Example: `domaintype` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-11-30T05:40:00Z` |
| `interval` | string | No | The time interval between the data entries. Unit: seconds. The value varies based on the values of t Example: `300` |
| `ispNameEn` | string | No | The name of the Internet service provider (ISP) for your Alibaba Cloud CDN service. You can call the Example: `unicom` |
| `locationNameEn` | string | No | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `beijing` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-11-30T05:33:00Z` |
| `timeMerge` | string | No | Specifies whether to automatically set the interval. If you set the value to 1, the value of the Int Example: `1` |


## describeDomainDetailDataByLayer

**Signature:** `describeDomainDetailDataByLayer(request: DescribeDomainDetailDataByLayerRequest)`

You can call this operation up to 20 times per second per account..

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The name of the Internet service provider (ISP) for your Alibaba Cloud CDN service. You can call the Example: `example.com` |
| `endTime` | string | Yes | The protocol by which you want to query data. Valid values: **http**, **https**, **quic**, and **all Example: `2020-07-05T22:05:00Z` |
| `field` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `bps,ipv6_traf,traf,http_code,qps` |
| `ispNameEn` | string | No | The ID of the request. Example: `telecom` |
| `layer` | string | No | The amount of network traffic. Unit: bytes. Example: `all` |
| `locationNameEn` | string | No | The detailed data of the accelerated domain names. Example: `hangzhou` |
| `startTime` | string | Yes | The name of the region. You can call the [DescribeCdnRegionAndIsp](https://help.aliyun.com/document_ Example: `2020-07-05T22:00:00Z` |


## describeDomainUvData

**Signature:** `describeDomainUvData(request: DescribeDomainUvDataRequest)`

The statistical analysis feature of Alibaba Cloud CDN is no longer available. The API operations related to the statistical analysis feature are no longer maintained. We recommend that you do not use .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2019-11-29T04:00:00Z` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2019-11-29T00:00:00Z` |


## describeCdnConditionIPBInfo

**Signature:** `describeCdnConditionIPBInfo(request: DescribeCdnConditionIPBInfoRequest)`

Queries the Internet service provider (ISP), region, and country that are required for advanced conditions..

