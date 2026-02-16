# DNS Cache

DNS cache domain management.

## addDnsCacheDomain

**Signature:** `addDnsCacheDomain(request: AddDnsCacheDomainRequest)`

Adds a cache-accelerated domain name based on the specified parameters..

**Parameters:** (9 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | Yes | The domain name or IP address of the origin DNS server. Example: `192.0.0.0` |
| `port` | string | Yes | The port of the origin DNS server. Example: `53` |
| `cacheTtlMax` | number | Yes | The maximum TTL period of the cached data retrieved from the origin DNS server. Unit: seconds. Valid Example: `86400` |
| `cacheTtlMin` | number | Yes | The minimum time-to-live (TTL) period of the cached data retrieved from the origin Domain Name Syste Example: `30` |
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `dns.example.com` |
| `instanceId` | string | Yes | The instance ID of the cache-accelerated domain name. You can call the [ListCloudGtmInstances](https Example: `dns-cn-j6666` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |
| `remark` | string | No | The remarks. Example: `test` |
| `sourceDnsServer` | AddDnsCacheDomainRequestSourceDnsServer[] | Yes | The origin DNS servers. A maximum of 10 origin DNS servers are supported. |
| `sourceEdns` | string | Yes | Specifies whether the origin DNS server supports Extension Mechanisms for DNS (EDNS). Valid values:  Example: `SUPPORT` |
| `sourceProtocol` | string | Yes | The origin protocol policy. Valid values: TCP and UDP. Default value: UDP. Example: `UDP` |

## deleteDnsCacheDomain

**Signature:** `deleteDnsCacheDomain(request: DeleteDnsCacheDomainRequest)`

Deletes a specified cache-accelerated domain name..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `dns-example.top` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |

## describeDnsCacheDomains

**Signature:** `describeDnsCacheDomains(request: DescribeDnsCacheDomainsRequest)`

查询代理域名.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The keyword for searches in "%KeyWord%" mode. The value is not case-sensitive. Example: `a\\"\\"` |
| `lang` | string | No | The language. Example: `zh` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **100**. Default value: **20**. Example: `20` |

## updateDnsCacheDomain

**Signature:** `updateDnsCacheDomain(request: UpdateDnsCacheDomainRequest)`

Updates the cache-accelerated domain name based on the specified parameters..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `host` | string | No | The domain name or IP address of the origin DNS server. Example: `223.5.5.5` |
| `port` | string | No | The port of the origin DNS server. Example: `53` |
| `cacheTtlMax` | number | No | The maximum TTL period of the cached data retrieved from the origin DNS server. Unit: seconds. Valid Example: `86400` |
| `cacheTtlMin` | number | No | The minimum time-to-live (TTL) period of the cached data retrieved from the origin Domain Name Syste Example: `30` |
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `dns.example.com` |
| `instanceId` | string | No | The instance ID of the cache-accelerated domain name. You can call the [ListCloudGtmInstances](https Example: `dns-sg-l9u2ux1fw01` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |
| `sourceDnsServer` | UpdateDnsCacheDomainRequestSourceDnsServer[] | No | - |
| `sourceEdns` | string | No | Specifies whether the origin DNS server supports Extension Mechanisms for DNS (EDNS). Valid values:  Example: `SUPPORT` |
| `sourceProtocol` | string | No | The origin protocol policy. Valid values: TCP and UDP. Default value: UDP. Example: `UDP` |

## updateDnsCacheDomainRemark

**Signature:** `updateDnsCacheDomainRemark(request: UpdateDnsCacheDomainRemarkRequest)`

Updates the remarks for the cache-accelerated domain name of the destination domain name..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `dns-example.com` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |
| `remark` | string | No | The remarks. The remarks can be up to 50 characters in length and can contain only letters, digits,  Example: `test` |

