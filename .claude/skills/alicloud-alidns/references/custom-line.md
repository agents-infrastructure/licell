# Custom Line & ISP Lines

Custom resolution lines and ISP line management.

## addCustomLine

**Signature:** `addCustomLine(request: AddCustomLineRequest)`

In each CIDR block, the end IP address must be greater than or equal to the start IP address.\\ The CIDR blocks that are specified for all custom lines of a domain name cannot be overlapped..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endIp` | string | No | The end IP address of the CIDR block. Example: `192.0.2.254` |
| `startIp` | string | No | The start IP address of the CIDR block. Example: `192.0.2.0` |
| `domainName` | string | Yes | The domain name. You can call the [DescribeDomains](https://www.alibabacloud.com/help/zh/dns/api-ali Example: `example.com` |
| `ipSegment` | AddCustomLineRequestIpSegment[] | Yes | The CIDR blocks. |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `lineName` | string | Yes | The name of the custom line. |

## deleteCustomLines

**Signature:** `deleteCustomLines(request: DeleteCustomLinesRequest)`

Deletes custom lines at a time by using the unique IDs..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `lineIds` | string | Yes | The unique IDs of the custom lines that you want to delete. Separate the unique IDs with commas (,). Example: `1234,1235` |

## describeCustomLine

**Signature:** `describeCustomLine(request: DescribeCustomLineRequest)`

Queries the details of a custom line by its unique ID..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `lineId` | number | No | The unique ID of the custom line. You can call [DescribeCustomLines](https://www.alibabacloud.com/he Example: `597` |

## describeCustomLines

**Signature:** `describeCustomLines(request: DescribeCustomLinesRequest)`

Queries custom lines by domain name..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The domain name that already exists in Alibaba Cloud Domain Name System (DNS). You can call the [Des Example: `example.com` |
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |

## updateCustomLine

**Signature:** `updateCustomLine(request: UpdateCustomLineRequest)`

In each CIDR block, the end IP address must be greater than or equal to the start IP address.\\ The CIDR blocks that are specified for all custom lines of a domain name cannot be overlapped..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endIp` | string | No | The end IP address of the CIDR block. Example: `2.2.2.2` |
| `startIp` | string | No | The start IP address of the CIDR block. Example: `1.1.1.1` |
| `ipSegment` | UpdateCustomLineRequestIpSegment[] | No | - |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `lineId` | number | Yes | The unique ID of the custom line. You can call the [DescribeCustomLines](https://www.alibabacloud.co Example: `1234` |
| `lineName` | string | No | - |

## describeSupportLines

**Signature:** `describeSupportLines(request: DescribeSupportLinesRequest)`

查询支持的所有线路.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | - Example: `example.com` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `userClientIp` | string | No | - Example: `1.1.*.*` |

