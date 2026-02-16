# Domain Management

CDN domain CRUD, batch operations, domain verification, ownership, and status management.

## addCdnDomain

**Signature:** `addCdnDomain(request: AddCdnDomainRequest)`

You must activate Alibaba Cloud CDN before you can add a domain name to it. For more information, see [Activate Alibaba Cloud CDN](https://help.aliyun.com/document_detail/27272.html). *   The domain n.

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag. Valid values of N: **1 to 20**. Example: `env` |
| `value` | string | No | The value of the tag. Valid values of N: **1 to 20**. Example: `value` |
| `cdnType` | string | Yes | The workload type of the accelerated domain name. Valid values: Example: `web` |
| `checkUrl` | string | No | The URL that is used to check the accessibility of the origin server. Example: `www.example.com/test.html` |
| `domainName` | string | Yes | The domain name that you want to add to Alibaba Cloud CDN. Example: `.example.com` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmyuji4b6r4**` |
| `scope` | string | No | The acceleration region. Default value: domestic. Valid values: Example: `domestic` |
| `sources` | string | Yes | The information about the addresses of origin servers. Example: `[` |
| `tag` | AddCdnDomainRequestTag[] | No | - |
| `topLevelDomain` | string | No | The top-level domain. Example: `example.com` |

## batchAddCdnDomain

**Signature:** `batchAddCdnDomain(request: BatchAddCdnDomainRequest)`

You must activate Alibaba Cloud CDN before you can add a domain name to it. For more information, see [Activate Alibaba Cloud CDN](https://help.aliyun.com/document_detail/27272.html). *   If the accel.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cdnType` | string | Yes | The workload type of the domain name to accelerate. Valid values: Example: `web` |
| `checkUrl` | string | No | The URL that is used for health checks. Example: `url` |
| `domainName` | string | Yes | The domain names that you want to add to Alibaba Cloud CDN. Separate domain names with commas (,). Example: `example.com,aliyundoc.com` |
| `resourceGroupId` | string | No | The ID of the resource group. If you do not specify a value for this parameter, the system uses the  Example: `rg-acfmyuji4b6r4**` |
| `scope` | string | No | The acceleration region. Default value: domestic. Valid values: Example: `domestic` |
| `sources` | string | Yes | The information about the addresses of origin servers. Example: `[` |
| `topLevelDomain` | string | No | The top-level domain. Example: `example.com` |

## deleteCdnDomain

**Signature:** `deleteCdnDomain(request: DeleteCdnDomainRequest)`

We recommend that you add an A record for the domain name in the system of your DNS service provider before you remove the domain name from Alibaba Cloud CDN. Otherwise, the domain name may become ina.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name that you want to remove. You can specify only one domain name in each ca Example: `example.com` |

## describeUserDomains

**Signature:** `describeUserDomains(request: DescribeUserDomainsRequest)`

You can call this operation up to 100 times per second per account. *   You can specify up to 50 domain names in each request. Separate multiple domain names with commas (,)..

**Parameters:** (0 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of a tag. Example: `key` |
| `value` | string | No | The value of the tag. Example: `value` |
| `cdnType` | string | No | The type of workload accelerated by Alibaba Cloud CDN. Separate types with commas (,). Valid values: Example: `download,web,video` |
| `changeEndTime` | string | No | The end of the time range to query. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format. The time mu Example: `2019-10-10T12:14:58Z` |
| `changeStartTime` | string | No | The beginning of the time range to query. Specify the time in the yyyy-MM-ddTHH:mm:ssZ format. The t Example: `2019-10-10T12:14:55Z` |
| `checkDomainShow` | boolean | No | Specifies whether to display domain names that are under review, failed the review, or failed to be  Example: `false` |
| `coverage` | string | No | The acceleration region. By default, all acceleration regions are queried. Valid values: Example: `domestic` |
| `domainName` | string | No | The accelerated domain. If you do not set this parameter, all domain names that match the conditions Example: `example.com` |
| `domainSearchType` | string | No | The search mode. Valid values: Example: `fuzzy_match` |
| `domainStatus` | string | No | The status of the domain name. Valid values: Example: `configure_failed` |
| `pageNumber` | number | No | The page number. Valid values: **1** to **100000**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **1 to 500**. Default value: **20**. Max Example: `5` |
| `resourceGroupId` | string | No | The ID of the resource group. By default, all IDs are queried. Example: `abcd1234abcd1234` |
| `source` | string | No | The information about the origin server. Example: `example.source.com` |
| `tag` | DescribeUserDomainsRequestTag[] | No | - |

## describeCdnDomainDetail

**Signature:** `describeCdnDomainDetail(request: DescribeCdnDomainDetailRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |

## modifyCdnDomain

**Signature:** `modifyCdnDomain(request: ModifyCdnDomainRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmyuji4b6r4**` |
| `sources` | string | No | The information about the addresses of origin servers. Example: `[{"content":"1.1.1.1","type":"ipaddr","priority":"20","port":80,"weight":"15"}]` |
| `topLevelDomain` | string | No | The root domain. To add a root domain name, you must be added to the whitelist specified by the CDN_ Example: `aliyundoc.com` |

## batchUpdateCdnDomain

**Signature:** `batchUpdateCdnDomain(request: BatchUpdateCdnDomainRequest)`

You can call this operation up to 30 times per second per account. *   You can specify up to 50 domain names in each request. Separate multiple domain names with commas (,)..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain names. You can specify one or more accelerated domain names. Separate domain  Example: `example.com,example.org` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmyuji4b6r4**` |
| `sources` | string | No | The information about the addresses of origin servers. Example: `[{"content":"10.10.10.10","type":"ipaddr","priority":"20","port":80,"weight":"15"}]` |
| `topLevelDomain` | string | No | The root domain. Example: `example.com` |

## startCdnDomain

**Signature:** `startCdnDomain(request: StartCdnDomainRequest)`

If the domain name is in an invalid state or you have an overdue payment in your account, the domain name cannot be enabled. *   You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |

## stopCdnDomain

**Signature:** `stopCdnDomain(request: StopCdnDomainRequest)`

After an accelerated domain is disabled, Alibaba Cloud CDN retains its information and routes all the requests that are destined for the accelerated domain to the origin server. *   You can call this .

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name that you want to disable. You can specify only one domain name in each r Example: `example.com` |

## batchStartCdnDomain

**Signature:** `batchStartCdnDomain(request: BatchStartCdnDomainRequest)`

If a domain name specified in the request is in an invalid state or your account has an overdue payment, the domain name cannot be enabled. *   You can call this operation up to 30 times per second pe.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The accelerated domain names. You can specify one or more domain names. Separate multiple domain nam Example: `example.com` |

## batchStopCdnDomain

**Signature:** `batchStopCdnDomain(request: BatchStopCdnDomainRequest)`

After an accelerated domain name is disabled, Alibaba Cloud CDN retains its information and reroutes all the requests that are destined for the accelerated domain name to the origin. *   If you need t.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The names of the accelerated domain names. You can specify one or more domain names in each request. Example: `example.com` |

## checkCdnDomainExist

**Signature:** `checkCdnDomainExist(request: CheckCdnDomainExistRequest)`

Checks whether a domain name exists..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Example: `example.com` |

## checkCdnDomainICP

**Signature:** `checkCdnDomainICP(request: CheckCdnDomainICPRequest)`

Checks whether an ICP filing is obtained for the domain name..

**Parameters:** See `CheckCdnDomainICPRequest` model.

## describeDomainVerifyData

**Signature:** `describeDomainVerifyData(request: DescribeDomainVerifyDataRequest)`

You can call this operation to query the verification content of an accelerated domain name based on whether the global resource plan is enabled..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `www.yourdomain.com` |
| `globalResourcePlan` | string | No | Specifies whether to enable the global resource plan. Example: `off` |

## describeVerifyContent

**Signature:** `describeVerifyContent(request: DescribeVerifyContentRequest)`

Queries the ownership verification content of an accelerated domain name..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name of which the ownership was verified. You can specify only one domain name. Example: `example.com` |

## verifyDomainOwner

**Signature:** `verifyDomainOwner(request: VerifyDomainOwnerRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name of which you want to verify the ownership. You can specify only one domain name. Example: `example.com` |
| `verifyType` | string | Yes | The verification method. Valid values: Example: `dnsCheck` |

## modifyCdnDomainOwner

**Signature:** `modifyCdnDomainOwner(request: ModifyCdnDomainOwnerRequest)`

This operation is used in the following scenario: *   You have multiple Alibaba Cloud accounts and want to transfer domain names from Account A to Account B. *   You are prompted that a domain name ha.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. Example: `example.com` |

## modifyCdnDomainSchdmByProperty

**Signature:** `modifyCdnDomainSchdmByProperty(request: ModifyCdnDomainSchdmByPropertyRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name for which you want to change the acceleration region. You can specify on Example: `example.com` |
| `property` | string | Yes | The information about the acceleration region. {"coverage":"overseas"} Example: `{"coverage":"overseas"}` |

## describeDomainsBySource

**Signature:** `describeDomainsBySource(request: DescribeDomainsBySourceRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `sources` | string | Yes | The origin servers. Separate multiple origin servers with commas (,). Fuzzy match is not supported. Example: `example.com` |

## describeUserCdnStatus

**Signature:** `describeUserCdnStatus(request: DescribeUserCdnStatusRequest)`

Queries the status of a user..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |

## describeBlockedRegions

**Signature:** `describeBlockedRegions(request: DescribeBlockedRegionsRequest)`

> You can call this operation up to 50 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | Yes | The language. Valid values: Example: `zh` |

## describeCdnDeletedDomains

**Signature:** `describeCdnDeletedDomains(request: DescribeCdnDeletedDomainsRequest)`

> You can call this operation up to 10 times per second per account..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageNumber` | number | No | The number of the page to return. Valid values: **1** to **100000**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of domain names to return per page. Valid values: an integer between **1** and **500**. D Example: `5` |

## describeCdnDomainByCertificate

**Signature:** `describeCdnDomainByCertificate(request: DescribeCdnDomainByCertificateRequest)`

>  You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `exact` | boolean | No | Specifies whether the domain name list to return match the SSL certificate. Example: `true` |
| `SSLPub` | string | Yes | The public key of the SSL certificate. You must encode the public key in Base64 and then call the en Example: `******` |
| `SSLStatus` | boolean | No | Specifies whether the domain name list to return contains only domain names with HTTPS enabled or di Example: `true` |

## describeCdnRegionAndIsp

**Signature:** `describeCdnRegionAndIsp(request: DescribeCdnRegionAndIspRequest)`

The lists of ISPs and regions that are supported by Alibaba Cloud CDN are updated and published on the Alibaba Cloud International site. *   You can call this operation up to 30 times per second per a.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |

## describeCdnSMCertificateDetail

**Signature:** `describeCdnSMCertificateDetail(request: DescribeCdnSMCertificateDetailRequest)`

> You can call this operation up to 20 times per second per account..

**Parameters:** See `DescribeCdnSMCertificateDetailRequest` model.

## describeCdnSMCertificateList

**Signature:** `describeCdnSMCertificateList(request: DescribeCdnSMCertificateListRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** See `DescribeCdnSMCertificateListRequest` model.

## describeCdnSSLCertificateList

**Signature:** `describeCdnSSLCertificateList(request: DescribeCdnSSLCertificateListRequest)`

Queries the certificate list by domain name..

**Parameters:** See `DescribeCdnSSLCertificateListRequest` model.


## describeCdnHttpsDomainList

**Signature:** `describeCdnHttpsDomainList(request: DescribeCdnHttpsDomainListRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The keyword that is used to search for certificates. Example: `com` |
| `pageNumber` | number | No | The number of the page to return. Valid values: **1** to **100000**. Example: `5` |
| `pageSize` | number | No | The number of entries to return on each page. Default value: **20**. Example: `20` |


## describeCdnTypes

**Signature:** `describeCdnTypes(request: DescribeCdnTypesRequest)`

Queries the types of domain names..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |


## describeCdnUserDomainsByFunc

**Signature:** `describeCdnUserDomainsByFunc(request: DescribeCdnUserDomainsByFuncRequest)`

>  The maximum number of times that each user can call this operation per second is 100..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `funcId` | number | Yes | The ID of the feature. Example: `7` |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `10` |
| `pageSize` | number | No | The number of domain names to return on each page. Default value: **20**. Example: `20` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-xxxxx` |


## describeDomainCname

**Signature:** `describeDomainCname(request: DescribeDomainCnameRequest)`

Detects the CNAME for an accelerated domain name. You can check the resolution result to determine whether the CNAME is configured..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name that you want to query. Separate multiple domain names with commas (,).  Example: `pay.slci6c.mbolsos.com,mch.b7r2v7.mbolsos.com,p.h99e.mbolsos.com,p.xmko.mbolsos.com,p.f2kd.mbolsos.com` |

