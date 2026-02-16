# DNS Record Management

DNS record CRUD, sub-domain records, record status, logs, and statistics.

## addDomainRecord

**Signature:** `addDomainRecord(request: AddDomainRecordRequest)`

Adds a Domain Name System (DNS) record based on the specified parameters..

**Parameters:** (5 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `lang` | string | No | The language of the content within the request and response. Valid values: Example: `en` |
| `line` | string | No | The resolution line. Default value: **default**. For more information, see Example: `default` |
| `priority` | number | Yes | The priority of the mail exchanger (MX) record. Valid values: `1 to 50`. Example: `1` |
| `RR` | string | Yes | The hostname. Example: `www` |
| `TTL` | number | No | The time to live (TTL) period of the Alibaba Cloud DNS (DNS) record. Default value: 600. Unit: secon Example: `600` |
| `type` | string | Yes | The type of the DNS record. For more information, see Example: `A` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |
| `value` | string | Yes | The value of the DNS record. Example: `192.0.2.254` |

## deleteDomainRecord

**Signature:** `deleteDomainRecord(request: DeleteDomainRecordRequest)`

Deletes an Alibaba Cloud DNS (DNS) record based on the specified parameters..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `recordId` | string | Yes | The ID of the DNS record. You can call the [DescribeDomainRecords](https://www.alibabacloud.com/help Example: `9999985` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## updateDomainRecord

**Signature:** `updateDomainRecord(request: UpdateDomainRecordRequest)`

Modifies a Domain Name System (DNS) record based on the specified parameters..

**Parameters:** (5 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `line` | string | No | The resolution line. Default value: **default**. Example: `default` |
| `priority` | number | Yes | The priority of the mail exchanger (MX) record. Valid values: `1 to 50`. Example: `1` |
| `RR` | string | Yes | The hostname. Example: `www` |
| `recordId` | string | Yes | The ID of the Domain Name System (DNS) record. Example: `9999985` |
| `TTL` | number | No | The time to live (TTL) period of the Alibaba Cloud DNS (DNS) record. Default value: 600. Unit: secon Example: `600` |
| `type` | string | Yes | The type of the DNS record. For more information, see Example: `A` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |
| `value` | string | Yes | The value of the DNS record. Example: `192.0.2.254` |

## describeDomainRecords

**Signature:** `describeDomainRecords(request: DescribeDomainRecordsRequest)`

You can specify DomainName, PageNumber, and PageSize to query the DNS records of the specified domain names. *   You can also specify RRKeyWord, TypeKeyWord, or ValueKeyWord to query the DNS records t.

**Parameters:** (1 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | The order in which you want to sort the returned DNS records. Valid values: DESC and ASC. Default va Example: `DESC` |
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `groupId` | number | No | The ID of the domain name group. Example: `2223` |
| `keyWord` | string | No | The keyword. Example: `test` |
| `lang` | string | No | The language. Example: `en` |
| `line` | string | No | The resolution line. Default value: **default**. Example: `cn_mobile_anhui` |
| `orderBy` | string | No | The method that is used to sort the returned DNS records. By default, the DNS records are sorted in  Example: `default` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 500**. Default value: **20**. Example: `20` |
| `RRKeyWord` | string | No | The hostname keyword based on which the system queries DNS records. The system queries DNS records b Example: `www` |
| `searchMode` | string | No | The search mode. Valid values: **LIKE, EXACT, and ADVANCED**. Example: `LIKE` |
| `status` | string | No | The status of the DNS records to query. Valid values: **Enable and Disable**. Example: `Enable` |
| `type` | string | No | The type of the DNS records to query. For more information, see Example: `A` |
| `typeKeyWord` | string | No | The type keyword based on which the system queries DNS records. The system queries DNS records based Example: `MX` |
| `valueKeyWord` | string | No | The record value keyword based on which the system queries DNS records. The system queries DNS recor Example: `com` |

## describeDomainRecordInfo

**Signature:** `describeDomainRecordInfo(request: DescribeDomainRecordInfoRequest)`

## Debugging [OpenAPI Explorer automatically calculates the signature value. For your convenience, we recommend that you call this operation in OpenAPI Explorer. OpenAPI Explorer dynamically generates.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `recordId` | string | Yes | The ID of the DNS record. You can call the [DescribeDomainRecords](https://www.alibabacloud.com/help Example: `9999985` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## updateDomainRecordRemark

**Signature:** `updateDomainRecordRemark(request: UpdateDomainRecordRemarkRequest)`

Modifies the description of a Domain Name System (DNS) record based on the specified parameters..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `cn` |
| `recordId` | string | Yes | The ID of the DNS record. You can call the [DescribeDomainRecords](https://www.alibabacloud.com/help Example: `12345678` |
| `remark` | string | No | - |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## setDomainRecordStatus

**Signature:** `setDomainRecordStatus(request: SetDomainRecordStatusRequest)`

Specifies the status of an Alibaba Cloud DNS (DNS) record based on the specified parameters..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `recordId` | string | Yes | The ID of the DNS record. You can call the [DescribeDomainRecords](https://www.alibabacloud.com/help Example: `9999985` |
| `status` | string | Yes | The state of the DNS record. Valid values: Example: `Disable` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## deleteSubDomainRecords

**Signature:** `deleteSubDomainRecords(request: DeleteSubDomainRecordsRequest)`

If the DNS records to be deleted contain locked DNS records, the locked DNS records will not be deleted..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `RR` | string | Yes | The hostname field in the DNS record. Example: `www` |
| `type` | string | No | The type of DNS records. If you do not specify this parameter, all types of DNS records correspondin Example: `A` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## describeSubDomainRecords

**Signature:** `describeSubDomainRecords(request: DescribeSubDomainRecordsRequest)`

Queries all Domain Name System (DNS) records of a subdomain name based on the specified parameters..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The domain name. Example: `example.com` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `line` | string | No | The DNS resolution line. Example: `default` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 100**. Default value: **20**. Example: `20` |
| `subDomain` | string | Yes | If you set SubDomain to `a.www.example.com` and leave Example: `a.www.example.com` |
| `type` | string | No | The type of DNS records. If you do not specify this parameter, all types of DNS records for the subd Example: `MX` |
| `userClientIp` | string | No | The IP address of the client. Example: `192.0.2.0` |

## describeRecordLogs

**Signature:** `describeRecordLogs(request: DescribeRecordLogsRequest)`

Queries the operation logs of a domain name based on the specified parameters..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `keyWord` | string | No | The keyword for searches in "%KeyWord%" mode. The value is not case-sensitive. Example: `test` |
| `lang` | string | No | The language. Example: `en` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 100**. Default value: **20**. Example: `20` |
| `startDate` | string | No | The start date of the query. Specify the start date in the **YYYY-MM-DD** format. Example: `2015-12-12` |
| `userClientIp` | string | No | The IP address of the client. Example: `1.1.1.1` |
| `endDate` | string | No | The end date of the query. Specify the end date in the **YYYY-MM-DD** format. Example: `2015-12-12` |

## describeRecordStatistics

**Signature:** `describeRecordStatistics(request: DescribeRecordStatisticsRequest)`

Real-time data is collected per hour..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The primary domain name. Example: `dns-example.com` |
| `domainType` | string | No | The type of the domain name. The parameter value is not case-sensitive. Valid values: Example: `PUBLIC` |
| `endDate` | string | No | The end date of the query. Specify the end date in the **YYYY-MM-DD** format. Example: `2019-07-04` |
| `lang` | string | No | The language. Example: `en` |
| `rr` | string | Yes | The hostname. If you want to resolve www.dns-exmaple.top, set Rr to www. Example: `www` |
| `startDate` | string | Yes | The start date of the query. Specify the start date in the **YYYY-MM-DD** format. Example: `2019-07-04` |

## describeRecordStatisticsSummary

**Signature:** `describeRecordStatisticsSummary(request: DescribeRecordStatisticsSummaryRequest)`

Queries the number of Domain Name System (DNS) requests for all subdomain names of a specified domain name..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name. Example: `dns-example.com` |
| `domainType` | string | No | The type of the domain name. The parameter value is not case-sensitive. Valid values: Example: `PUBLIC` |
| `endDate` | string | No | The end date of the query. Specify the start date in the **YYYY-MM-DD** format. Example: `2019-07-04` |
| `keyword` | string | No | The keyword for searches in %KeyWord% mode. The value is not case-sensitive. Example: `test` |
| `lang` | string | No | The language. Example: `en` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 100**. Default value: **20**. Example: `20` |
| `searchMode` | string | No | The search mode of the keyword. Valid values: Example: `EXACT` |
| `startDate` | string | Yes | The start date of the query. Specify the start date in the **YYYY-MM-DD** format. Example: `2019-07-04` |
| `threshold` | number | No | The maximum number of DNS requests that you can obtain. You can obtain data about a domain name with Example: `12` |

## describeRecordResolveStatisticsSummary

**Signature:** `describeRecordResolveStatisticsSummary(request: DescribeRecordResolveStatisticsSummaryRequest)`

Queries the number of resolution requests for all subdomain names of a specified domain name..

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | The order in which the returned entries are sorted. Valid values: Example: `DESC` |
| `domainName` | string | Yes | The domain name. Example: `example.com` |
| `domainType` | string | No | The type of the domain name. The parameter value is not case-sensitive. Valid values: Example: `PUBLIC` |
| `endDate` | string | No | The end date of the time range to be queried. Specify the time in the yyyy-MM-dd format, such as 202 Example: `2023-03-29` |
| `keyword` | string | No | The keyword. Keyword is used together with SearchMode. Example: `test` |
| `lang` | string | No | The language. Valid values: zh, en, and ja. Example: `zh` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: 1 to 1000. Example: `10` |
| `searchMode` | string | No | The search mode of the keyword. Valid values: Example: `LIKE` |
| `startDate` | string | Yes | The start date of the time range to be queried. Specify the time in the yyyy-MM-dd format, such as 2 Example: `2023-03-29` |
| `threshold` | number | No | The threshold for the number of Domain Name System (DNS) requests. You can query the subdomain names Example: `-1` |

## getTxtRecordForVerify

**Signature:** `getTxtRecordForVerify(request: GetTxtRecordForVerifyRequest)`

Generates a text (TXT) record. TXT records are used to retrieve domain names and subdomain names, enable the subdomain name verification feature, and perform batch retrievals..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The ID of the Domain Name System (DNS) record. You can call the [DescribeDomainRecords](https://www. Example: `example.com` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `type` | string | Yes | The feature verified by using the TXT record. Valid values: Example: `ADD_SUB_DOMAIN` |

