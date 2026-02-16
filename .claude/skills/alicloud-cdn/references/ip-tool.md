# IP & Network Tools

IP verification, VIP queries, and IP blocking.

## describeIpInfo

**Signature:** `describeIpInfo(request: DescribeIpInfoRequest)`

Checks whether a specified IP address is the IP address of a CDN point of presence (POP)..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `IP` | string | Yes | The IP address. You can specify only one IP address. Example: `192.168.0.1` |

## describeIpStatus

**Signature:** `describeIpStatus(request: DescribeIpStatusRequest)`

> You can call this operation up to 50 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ips` | string | Yes | The IP addresses that you want to query. Separate IP addresses with underscores (_), such as Ips=ip1 Example: `ip1_ip2` |

## batchDescribeCdnIpInfo

**Signature:** `batchDescribeCdnIpInfo(request: BatchDescribeCdnIpInfoRequest)`

>The maximum number of times that each user can call this operation per second is 20..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ipAddrList` | string | Yes | The list of IP addresses to query. Separate IP addresses with commas (,). You can specify up to 20 I Example: `111.XXX.XXX.230,47.XXX.XXX.243` |
| `language` | string | No | The language of the query results. Valid values: Example: `en` |

## describeL2VipsByDomain

**Signature:** `describeL2VipsByDomain(request: DescribeL2VipsByDomainRequest)`

This operation is available only to users whose daily peak bandwidth value is higher than 1 Gbit/s. If you meet this requirement, you can [submit a ticket](https://workorder-intl.console.aliyun.com/?s.

**Parameters:** See `DescribeL2VipsByDomainRequest` model.

## describeUserVipsByDomain

**Signature:** `describeUserVipsByDomain(request: DescribeUserVipsByDomainRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `available` | string | No | Specifies whether to query the virtual IP addresses of only healthy CDN POPs. Valid values: Example: `on` |
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |

## setCdnFullDomainsBlockIP

**Signature:** `setCdnFullDomainsBlockIP(request: SetCdnFullDomainsBlockIPRequest)`

>  *   To use this operation, [submit a ticket](https://workorder-intl.console.aliyun.com/?spm=5176.2020520001.aliyun_topbar.18.dbd44bd3e4f845#/ticket/createIndex). *   This operation is suitable for .

**Parameters:** See `SetCdnFullDomainsBlockIPRequest` model.

## describeCdnFullDomainsBlockIPConfig

**Signature:** `describeCdnFullDomainsBlockIPConfig(request: DescribeCdnFullDomainsBlockIPConfigRequest)`

>  *   To use this operation,[submit a ticket](https://workorder-intl.console.aliyun.com/?spm=5176.2020520001.aliyun_topbar.18.dbd44bd3e4f845#/ticket/createIndex). *   If you specify IP addresses or C.

**Parameters:** See `DescribeCdnFullDomainsBlockIPConfigRequest` model.

## describeCdnFullDomainsBlockIPHistory

**Signature:** `describeCdnFullDomainsBlockIPHistory(request: DescribeCdnFullDomainsBlockIPHistoryRequest)`

>  *   To use this operation, [submit a ticket](https://workorder-intl.console.aliyun.com/?spm=5176.2020520001.aliyun_topbar.18.dbd44bd3e4f845#/ticket/createIndex). *   For a specified IP addresses an.

**Parameters:** See `DescribeCdnFullDomainsBlockIPHistoryRequest` model.


## describeCdnWafDomain

**Signature:** `describeCdnWafDomain(request: DescribeCdnWafDomainRequest)`

> You can call this operation up to 150 times per second per account..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain name that you want to query. Example: `example.com` |
| `regionId` | string | Yes | The region where WAF is enabled. Valid values: Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `1234` |


## describeDomainCcActivityLog

**Signature:** `describeDomainCcActivityLog(request: DescribeDomainCcActivityLogRequest)`

If you do not set the StartTime or EndTime parameter, the request returns the data collected in the last 24 hours. If you set both the StartTime and EndTime parameters, the request returns the data co.

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify multiple domain names and separate them with commas (,) Example: `example.com` |
| `endTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2018-12-10T21:00:00Z` |
| `pageNumber` | number | No | The page number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Default value: **30**. Example: `30` |
| `ruleName` | string | No | A custom rule name. Valid values: Example: `test2` |
| `startTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2018-12-10T20:00:00Z` |
| `triggerObject` | string | No | The trigger of rate limiting by which you want to query data. Example: `IP` |
| `value` | string | No | The value of the trigger. Example: `1.2.3.4` |

