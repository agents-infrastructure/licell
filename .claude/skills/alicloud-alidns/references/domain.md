# Domain Management

Domain CRUD, domain groups, DNS server configuration, DNSSEC, and domain statistics.

## addDomain

**Signature:** `addDomain(request: AddDomainRequest)`

For more information about how to check whether a domain name is valid, see [Domain name validity](https://www.alibabacloud.com/help/zh/doc-detail/67788.htm)..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. Example: `dns-example.top` |
| `groupId` | string | No | The ID of the group to which the domain name will belong. The default value is the ID of the default Example: `2223` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-resourcegroupid` |

## deleteDomain

**Signature:** `deleteDomain(request: DeleteDomainRequest)`

Deletes a domain name based on the specified parameters..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name that already exists in Alibaba Cloud DNS. You can call the [DescribeDomains](https:/ Example: `example.com` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |

## describeDomains

**Signature:** `describeDomains(request: DescribeDomainsRequest)`

You can specify the PageNumber and PageSize parameters to query domain names. *   You can specify the KeyWord parameter to query domain names that contain the specified keyword. *   By default, the do.

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupId` | string | No | The ID of the domain name group. If you do not specify this parameter, all domain names are queried  Example: `2223` |
| `keyWord` | string | No | The keyword for searches in "%KeyWord%" mode. The value is not case-sensitive. Example: `com` |
| `lang` | string | No | The language type. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **100**. Default value: **20**. Example: `20` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-resourcegroupid01` |
| `searchMode` | string | No | The search mode. Valid values: Example: `LIKE` |
| `starmark` | boolean | No | Specifies whether to query the starmark of the domain name. Example: `true` |

## describeDomainInfo

**Signature:** `describeDomainInfo(request: DescribeDomainInfoRequest)`

In this example, the domain name is bound to an instance of Alibaba Cloud DNS Enterprise Ultimate Edition. For more information about valid Domain Name System (DNS) request lines, see the return value.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. Example: `dns-example.com` |
| `lang` | string | No | The language type. Example: `en` |
| `needDetailAttributes` | boolean | No | Specifies whether detailed attributes are required. Default value: **false**, which indicates that d Example: `true` |

## describeDomainNs

**Signature:** `describeDomainNs(request: DescribeDomainNsRequest)`

>  You can call this operation to query the authoritative servers of a domain name registry to obtain the name servers for a domain name. If the domain name is in an invalid state, such as serverHold .

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `lang` | string | No | The language of the content in the request and response. Example: `en` |

## updateDomainRemark

**Signature:** `updateDomainRemark(request: UpdateDomainRemarkRequest)`

Modifies the description of a domain name based on the specified parameters..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name that already exists in Alibaba Cloud Domain Name System (DNS). You can call the [Des Example: `mydomain.com` |
| `lang` | string | No | The language of the response. Valid values: Example: `cn` |
| `remark` | string | No | The description of the domain name. |

## getMainDomainName

**Signature:** `getMainDomainName(request: GetMainDomainNameRequest)`

For more information about the difference between primary domain names and subdomain names, see [Subdomain levels](https://www.alibabacloud.com/help/zh/faq-detail/39803.htm). For example, if you enter.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inputString` | string | Yes | The string. The string can be up to 128 characters in length. Example: `www.example.com` |
| `lang` | string | No | The language. Example: `en` |

## modifyHichinaDomainDNS

**Signature:** `modifyHichinaDomainDNS(request: ModifyHichinaDomainDNSRequest)`

If the operation succeeds, the names of DNS servers change to those of Alibaba Cloud DNS servers (ending with hichina.com). >  **Before you call this operation, make sure that your domain name has bee.

**Parameters:** See `ModifyHichinaDomainDNSRequest` model.

## moveDomainResourceGroup

**Signature:** `moveDomainResourceGroup(request: MoveDomainResourceGroupRequest)`

Moves a domain name to another resource group..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `newResourceGroupId` | string | Yes | The ID of the new resource group. Example: `rg-aekzzk7hx3glaoq` |
| `resourceId` | string | Yes | The domain name. Example: `example.com` |

## addDomainGroup

**Signature:** `addDomainGroup(request: AddDomainGroupRequest)`

Creates a domain name group based on the specified parameters..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupName` | string | Yes | The name of the domain name group. Example: `MyGroup` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |

## deleteDomainGroup

**Signature:** `deleteDomainGroup(request: DeleteDomainGroupRequest)`

>  The default group cannot be deleted..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupId` | string | Yes | The ID of the domain name group. You can call the [DescribeDomainGroups](https://www.alibabacloud.co Example: `2223` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |

## describeDomainGroups

**Signature:** `describeDomainGroups(request: DescribeDomainGroupsRequest)`

Queries all domain name groups based on the specified parameters..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyWord` | string | No | The keyword of the domain name group for searches in %KeyWord% mode. The value is not case-sensitive Example: `Group` |
| `lang` | string | No | The language. Example: `en` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 100**. Default value: **20**. Example: `20` |

## updateDomainGroup

**Signature:** `updateDomainGroup(request: UpdateDomainGroupRequest)`

Modifies the name of an existing domain name group..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupId` | string | Yes | The ID of the domain name group whose name you want to modify. You can call the [DescribeDomainGroup Example: `2223` |
| `groupName` | string | Yes | The new name of the domain name group. Example: `NewName` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |

## changeDomainGroup

**Signature:** `changeDomainGroup(request: ChangeDomainGroupRequest)`

You can specify GroupId to move a domain name to a specific domain name group. You can move the domain name to the group that contains all domain names or the default group..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains ](https://www.alibabacloud.com/help/zh/dns/api-al Example: `example.com` |
| `groupId` | string | No | The ID of the target domain name group. Example: `2223` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |

## addDomainBackup

**Signature:** `addDomainBackup(request: AddDomainBackupRequest)`

Creates a backup task for a domain name..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. Example: `test.aliyun.com` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `periodType` | string | Yes | The backup cycle. Valid values: Example: `HOUR` |

## bindInstanceDomains

**Signature:** `bindInstanceDomains(request: BindInstanceDomainsRequest)`

A paid Alibaba Cloud DNS instance whose ID starts with dns is an instance of the new version. You can call this API operation to bind multiple domain names to the instance. If the upper limit is excee.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The domain names. Example: `example.com,example.net` |
| `instanceId` | string | Yes | The instance ID. Example: `sdfasdf` |
| `lang` | string | No | The language. Example: `en` |

## unbindInstanceDomains

**Signature:** `unbindInstanceDomains(request: UnbindInstanceDomainsRequest)`

A paid Alibaba Cloud DNS instance whose ID starts with dns is an instance of the new version. You can call an API operation to bind multiple domain names to the instance. If the upper limit is exceede.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The domain names. Example: `example.com,example.net` |
| `instanceId` | string | Yes | The instance ID. Example: `123` |
| `lang` | string | No | The language. Example: `en` |

## describeInstanceDomains

**Signature:** `describeInstanceDomains(request: DescribeInstanceDomainsRequest)`

Queries the domain names that are bound to an Alibaba Cloud DNS instance..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Alibaba Cloud Domain Name System (DNS) instance. You can call the [DescribeDomainInfo] Example: `weriwieru` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Default value: 20. Example: `2` |

## changeDomainOfDnsProduct

**Signature:** `changeDomainOfDnsProduct(request: ChangeDomainOfDnsProductRequest)`

**You can call this operation regardless of whether the Alibaba Cloud DNS instance is bound to a domain name. You can also call this operation to unbind the domain name from the Alibaba Cloud DNS inst.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `force` | boolean | No | Specifies whether to forcibly bind a domain name to the instance. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the Alibaba Cloud Domain Name System (DNS) instance. Example: `i-7sb` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |
| `newDomain` | string | No | The domain name that you want to bind to the instance. If you leave this parameter empty, the domain Example: `newdomain.com` |
| `userClientIp` | string | No | The IP address of the client. Example: `1.1.1.1` |

## describeDnsProductInstance

**Signature:** `describeDnsProductInstance(request: DescribeDnsProductInstanceRequest)`

Queries the details about a paid Alibaba Cloud DNS instance based on the instance ID..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the DNS instance. . You can call the [DescribeDomainInfo](https://www.alibabacloud.com/hel Example: `i-8fxxxx` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## describeDnsProductInstances

**Signature:** `describeDnsProductInstances(request: DescribeDnsProductInstancesRequest)`

>  If the response parameters of an Alibaba Cloud DNS instance do not contain domain names, no domain names are bound to the instance..

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | The order in which you want to sort returned entries. Valid values: Example: `DESC` |
| `domainType` | string | No | The type of the domain name. Valid values: Example: `PUBLIC` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `orderBy` | string | No | The method that is used to sort returned entries. Valid values: Example: `createDate` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **100**. Default value: **20**. Example: `20` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |
| `versionCode` | string | No | The version code of the Alibaba Cloud DNS instance. Example: `version1` |

## setDomainDnssecStatus

**Signature:** `setDomainDnssecStatus(request: SetDomainDnssecStatusRequest)`

Enables or disables the Domain Name System Security Extensions (DNSSEC) for a domain name. This feature is available only for the users of the paid editions of Alibaba Cloud DNS..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name for which you want to enable the DNSSEC. Only the users of the paid editions of Alib Example: `example.com` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `status` | string | Yes | The DNSSEC status. Valid values: Example: `ON` |

## describeDomainDnssecInfo

**Signature:** `describeDomainDnssecInfo(request: DescribeDomainDnssecInfoRequest)`

Queries the Domain Name System Security Extensions (DNSSEC) configurations of a domain name based on the specified parameters..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |

## describeDomainLogs

**Signature:** `describeDomainLogs(request: DescribeDomainLogsRequest)`

Queries the operation logs of domain names based on the specified parameters..

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupId` | string | No | The ID of the domain name group. Example: `2223` |
| `keyWord` | string | No | The keyword for the query in "%KeyWord%" mode. The keyword is not case-sensitive. Example: `test` |
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |
| `pageNumber` | number | No | The page number to return. The page number starts from **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Maximum value: **100**. Default value: **20**. Example: `20` |
| `startDate` | string | No | The start time for the query. Format: **YYYY-MM-DD** Example: `2019-07-04` |
| `type` | string | No | The type of object of which you want to query operation logs. Valid values: Example: `domain` |
| `endDate` | string | No | The end time for the query. Format: **YYYY-MM-DD** Example: `2019-07-04` |

## describeDomainStatistics

**Signature:** `describeDomainStatistics(request: DescribeDomainStatisticsRequest)`

Real-time data is collected per hour..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `domainType` | string | No | The type of the domain name. Valid values: Example: `PUBLIC` |
| `endDate` | string | No | The end date of the query. Specify the end date in the **YYYY-MM-DD** format. Example: `2019-07-04` |
| `lang` | string | No | The language of the content within the request and response. Example: `en` |
| `startDate` | string | Yes | The start date of the query. Specify the start date in the **YYYY-MM-DD** format. Example: `2019-07-04` |

## describeDomainStatisticsSummary

**Signature:** `describeDomainStatisticsSummary(request: DescribeDomainStatisticsSummaryRequest)`

Calls the DescribeDomainStatisticsSummary operation to obtain the query volume of all paid domain names under your account..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endDate` | string | No | The end of the time range to query. Specify the time in the **YYYY-MM-DD** format. Example: `2019-07-04` |
| `keyword` | string | No | The keyword for searches in %KeyWord% mode. The value is not case-sensitive. Example: `test` |
| `lang` | string | No | The language type. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 100**. Default value: **20**. Example: `20` |
| `searchMode` | string | No | The search mode of the keyword. Valid values: Example: `LIKE` |
| `startDate` | string | Yes | The beginning of the time range to query. Specify the time in the **YYYY-MM-DD** format. Example: `2019-07-04` |
| `threshold` | number | No | The threshold of query volume that can be obtained. You can also obtain data about a domain name wit Example: `12` |

## describeDomainResolveStatisticsSummary

**Signature:** `describeDomainResolveStatisticsSummary(request: DescribeDomainResolveStatisticsSummaryRequest)`

Queries the resolution requests of all paid domain names within your account..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | The order in which you want to sort the returned entries. Valid values: Example: `DESC` |
| `endDate` | string | No | The end time in the yyyy-MM-dd format, for example, 2023-03-13. Example: `2023-03-01` |
| `keyword` | string | No | The keyword. The Keyword parameter is used together with the SearchMode parameter. Example: `test` |
| `lang` | string | No | The language. Valid values: zh, en, and ja. Example: `zh` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: 1 to 1000. Example: `10` |
| `searchMode` | string | No | The search mode of the keyword. Valid values: Example: `EXACT` |
| `startDate` | string | Yes | The start time in the yyyy-MM-dd format, for example, 2023-03-01. Example: `2023-03-01` |
| `threshold` | number | No | The threshold for the number of Domain Name System (DNS) requests. You can query the domain names at Example: `-1` |

## transferDomain

**Signature:** `transferDomain(request: TransferDomainRequest)`

Transfers multiple domain names from the current account to another account at a time..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The domain names. Separate multiple domain names with commas (,). Only domain names registered with  Example: `test1.com,test2.com` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `remark` | string | No | The description of the domain name. Example: `test` |
| `targetUserId` | number | Yes | The destination user ID. The domain names and their Domain Name System (DNS) records are transferred Example: `12345678` |

## describeTransferDomains

**Signature:** `describeTransferDomains(request: DescribeTransferDomainsRequest)`

Queries the domain names that were transferred between the current account and another account based on the specified parameters..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | Specifies the domain name for which you want to view the transfer record. Example: `alidns.com` |
| `fromUserId` | number | No | The user ID from which the domain name was transferred to the current account. Example: `123456` |
| `lang` | string | No | The language. Example: `en` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Default value: 20. Example: `20` |
| `targetUserId` | number | No | The user ID to which the domain name was transferred from the current account. Example: `123456` |
| `transferType` | string | Yes | The transfer type. Valid values: Example: `IN` |

## retrieveDomain

**Signature:** `retrieveDomain(request: RetrieveDomainRequest)`

To retrieve a domain name, you must verify a text (TXT) record. Therefore, before you call this API operation to retrieve a domain name, call the [GetTxtRecordForVerify](https://www.alibabacloud.com/h.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. Example: `example.com` |
| `lang` | string | No | The language. Example: `en` |

## operateBatchDomain

**Signature:** `operateBatchDomain(request: OperateBatchDomainRequest)`

Scenario: You need to execute a large number of tasks related to DNS resolution and you do not have high requirements for efficiency..

**Parameters:** (7 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | The domain name. Example: `example.com` |
| `line` | string | No | The DNS request source. Default value: default. Example: `default` |
| `newRr` | string | No | The new hostname (used only for modification operations, not for external users). Example: `mail` |
| `newType` | string | No | The new type of the DNS record (used only for modification operations, not for external users). Example: `AAAA` |
| `newValue` | string | No | The new value of the DNS record (used only for modification operations, not for external users). Example: `114.92.XX.XX` |
| `priority` | number | Yes | The priority of the mail exchanger (MX) record. Example: `5` |
| `rr` | string | Yes | The hostname. Example: `zhaohui` |
| `ttl` | number | No | The time-to-live (TTL) value of the cached DNS record. Unit: seconds. Default value: ***600***. Example: `600` |
| `type` | string | Yes | The type of the DNS record. Valid values: A, AAAA, TXT, MX, and CNAME. Example: `MX` |
| `value` | string | Yes | The value of the DNS record. Example: `fd87da3c4528844d45af39200155a905` |
| `domainRecordInfo` | OperateBatchDomainRequestDomainRecordInfo[] | Yes | The DNS records. You can submit up to 1,000 DNS records. |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `type` | string | Yes | The type of the batch operation. Valid values: Example: `RR_ADD` |

## addRspDomainServerHoldStatusForGateway

**Signature:** `addRspDomainServerHoldStatusForGateway(request: AddRspDomainServerHoldStatusForGatewayRequest)`

## 请求说明 - 本接口专为注册局用户设计，允许他们更新指定顶级域名（TLD）的各种属性。 - 必须提供`RegistryId`和`Tld`参数以标识要修改的具体TLD。 - 可选参数包括但不限于宽限期设置、DNS解析缓存时间、价格设定等，这些都可根据需要进行调整。 - 环境(`Env`)参数指定了API调用的目标环境，默认值为“DAILY”表示日常测试环境；正式上线前，请确保已正确设置此参数。.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | Yes | This parameter is required. Example: `token123` |
| `domainName` | string | Yes | This parameter is required. Example: `dns-example.top` |
| `statusMsg` | string | Yes | - |

## addRspDomainServerHoldStatusForGatewayOte

**Signature:** `addRspDomainServerHoldStatusForGatewayOte(request: AddRspDomainServerHoldStatusForGatewayOteRequest)`

## 请求说明 - 本接口专为注册局用户设计，允许他们更新指定顶级域名（TLD）的各种属性。 - 必须提供`RegistryId`和`Tld`参数以标识要修改的具体TLD。 - 可选参数包括但不限于宽限期设置、DNS解析缓存时间、价格设定等，这些都可根据需要进行调整。 - 环境(`Env`)参数指定了API调用的目标环境，默认值为“DAILY”表示日常测试环境；正式上线前，请确保已正确设置此参数。.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | Yes | This parameter is required. Example: `qwoefasdf` |
| `domainName` | string | Yes | This parameter is required. Example: `dns-example.top` |
| `statusMsg` | string | Yes | - |

## removeRspDomainServerHoldStatusForGateway

**Signature:** `removeRspDomainServerHoldStatusForGateway(request: RemoveRspDomainServerHoldStatusForGatewayRequest)`

## 请求说明 - 本接口专为注册局用户设计，允许他们更新指定顶级域名（TLD）的各种属性。 - 必须提供`RegistryId`和`Tld`参数以标识要修改的具体TLD。 - 可选参数包括但不限于宽限期设置、DNS解析缓存时间、价格设定等，这些都可根据需要进行调整。 - 环境(`Env`)参数指定了API调用的目标环境，默认值为“DAILY”表示日常测试环境；正式上线前，请确保已正确设置此参数。.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | Yes | This parameter is required. Example: `asdf` |
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |

## removeRspDomainServerHoldStatusForGatewayOte

**Signature:** `removeRspDomainServerHoldStatusForGatewayOte(request: RemoveRspDomainServerHoldStatusForGatewayOteRequest)`

## 请求说明 - 本接口专为注册局用户设计，允许他们更新指定顶级域名（TLD）的各种属性。 - 必须提供`RegistryId`和`Tld`参数以标识要修改的具体TLD。 - 可选参数包括但不限于宽限期设置、DNS解析缓存时间、价格设定等，这些都可根据需要进行调整。 - 环境(`Env`)参数指定了API调用的目标环境，默认值为“DAILY”表示日常测试环境；正式上线前，请确保已正确设置此参数。.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | Yes | This parameter is required. Example: `qwoefasdf` |
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |

## updateRspDomainServerProhibitStatusForGateway

**Signature:** `updateRspDomainServerProhibitStatusForGateway(request: UpdateRspDomainServerProhibitStatusForGatewayRequest)`

## 请求说明 - 本接口专为注册局用户设计，允许他们更新指定顶级域名（TLD）的各种属性。 - 必须提供`RegistryId`和`Tld`参数以标识要修改的具体TLD。 - 可选参数包括但不限于宽限期设置、DNS解析缓存时间、价格设定等，这些都可根据需要进行调整。 - 环境(`Env`)参数指定了API调用的目标环境，默认值为“DAILY”表示日常测试环境；正式上线前，请确保已正确设置此参数。.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | - Example: `serverDeleteProhibited` |
| `status` | string | No | - Example: `serverDeleteProhibited` |
| `clientToken` | string | Yes | This parameter is required. Example: `asdf` |
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |

## updateRspDomainServerProhibitStatusForGatewayOte

**Signature:** `updateRspDomainServerProhibitStatusForGatewayOte(request: UpdateRspDomainServerProhibitStatusForGatewayOteRequest)`

## 请求说明 - 本接口专为注册局用户设计，允许他们更新指定顶级域名（TLD）的各种属性。 - 必须提供`RegistryId`和`Tld`参数以标识要修改的具体TLD。 - 可选参数包括但不限于宽限期设置、DNS解析缓存时间、价格设定等，这些都可根据需要进行调整。 - 环境(`Env`)参数指定了API调用的目标环境，默认值为“DAILY”表示日常测试环境；正式上线前，请确保已正确设置此参数。.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | - Example: `serverDeleteProhibited` |
| `status` | string | No | - Example: `serverDeleteProhibited` |
| `clientToken` | string | Yes | This parameter is required. Example: `qwoefasdf` |
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |


## describeBatchResultCount

**Signature:** `describeBatchResultCount(request: DescribeBatchResultCountRequest)`

Queries the execution result of a batch operation task based on the task ID. If you do not specify task ID, the execution result of the last batch operation task is returned..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `batchType` | string | No | The type of the batch operation. Valid values: Example: `DOMAIN_ADD` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `taskId` | number | No | The task ID. Example: `123456` |


## describeBatchResultDetail

**Signature:** `describeBatchResultDetail(request: DescribeBatchResultDetailRequest)`

Before you call this operation, make sure that the batch operation task is complete..

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `batchType` | string | No | The type of the batch operation. Valid values: Example: `DOMAIN_ADD` |
| `lang` | string | No | The language of the content within the request and response. Default: **zh**. Valid values: Example: `en` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `20` |
| `status` | string | No | The execution result. If you do not specify this parameter, all results are returned. Example: `SUCCESS` |
| `taskId` | number | No | The task ID. Example: `83618818` |

