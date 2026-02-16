# Tag & Resource

Resource tagging and internet DNS logs.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

Adds and modifies a tag for a resource..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. The tag key can be up to 20 characters in length and cannot start with `acs:` or`aliyun Example: `abcd` |
| `value` | string | No | The tag value. The tag value can be up to 20 bytes in length. Example: `abcd` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `resourceId` | string[] | Yes | The ID of the resource. Example: `dns-example.com` |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `DOMAIN` |
| `tag` | TagResourcesRequestTag[] | Yes | The tags. |

## untagResources

**Signature:** `untagResources(request: UntagResourcesRequest)`

Removes tags from resources..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags. Default value: false. This parameter is valid only when TagKey Example: `false` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `resourceId` | string[] | Yes | The ID of the resource. Example: `The` |
| `resourceType` | string | Yes | The type of the resource. Valid value: Valid values: Example: `DOMAIN` |
| `tagKey` | string[] | No | The tags added to the resource. Example: `The` |

## describeTags

**Signature:** `describeTags(request: DescribeTagsRequest)`

Queries existing tags..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Default value: 200. Example: `200` |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `DOMAIN` |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

Set ResourceId.N or Tag.N that consists of Tag.N.Key and Tag.N.Value in the request to specify the object to be queried. *   Tag.N is a resource tag that consists of a key-value pair. If you set only .

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. Example: `abcd` |
| `value` | string | No | The key value. Example: `abcd` |
| `lang` | string | No | The language of the content within the request and response. Default value: **zh**. Valid values: Example: `en` |
| `nextToken` | string | No | The pagination token. It can be used in the next request to retrieve a new page of results. Example: `4698691` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `DOMAIN` |
| `tag` | ListTagResourcesRequestTag[] | No | - |

## describeInternetDnsLogs

**Signature:** `describeInternetDnsLogs(request: DescribeInternetDnsLogsRequest)`

查询解析日志.

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | number | No | The account ID displayed on the Recursive Resolution (Public DNS) page after you activate Alibaba Cl Example: `51**4` |
| `domainName` | string | No | The domain name. Example: `example.com` |
| `endTimestamp` | number | No | The end time of the query (timestamp, unit: milliseconds). >Warning: If the query time span is too l Example: `1709196299999` |
| `lang` | string | No | Return value language, options:  - zh: Chinese  - en: English Example: `en` |
| `module` | string | No | Module type  - AUTHORITY (default): Public Authoritative DNS  - RECURSION: Public Recursive DNS Example: `AUTHORITY` |
| `pageNumber` | number | No | Page number, default value is 1. Example: `1` |
| `pageSize` | number | No | Page size for query. Example: `10` |
| `queryCondition` | string | No | Query parameters  - sourceIp: Source IP address  - queryNameFuzzy: Domain name (fuzzy value)  - quer Example: `{"sourceIp":"59.82.XX.XX","queryType":"A"}` |
| `startTimestamp` | number | No | The start time of the query (timestamp, unit: milliseconds). Example: `1709192640000` |

## updateAppKeyState

**Signature:** `updateAppKeyState(request: UpdateAppKeyStateRequest)`

修改 AppKey 状态.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appKeyId` | string | No | - |

