# Tag & Resource

Resource tagging for CDN domains.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (4 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | The key of a tag. Example: `env` |
| `value` | string | No | The value of a tag. Example: `value` |
| `resourceId` | string[] | Yes | The list of resource IDs. Maximum number of list elements: 50. Example: `1` |
| `resourceType` | string | Yes | The type of the resource. Set this value to **DOMAIN**. Example: `DOMAIN` |
| `tag` | TagResourcesRequestTag[] | Yes | The tags. Maximum number of list elements: 20. |

## untagResources

**Signature:** `untagResources(request: UntagResourcesRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags. Valid values: Example: `false` |
| `resourceId` | string[] | Yes | The list of resource IDs. You can specify up to 50 resource IDs in the list. Example: `example.com` |
| `resourceType` | string | Yes | The type of the resources from which you want to remove tags. Set this parameter to **DOMAIN**. Example: `DOMAIN` |
| `tagKey` | string[] | No | The list of tag keys. You can specify up to 20 tag keys in the list. Example: `env` |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

Queries the tags that are attached to a resource..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag. Example: `testKey` |
| `value` | string | No | The value of the tag. Example: `testValue` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `QpgBAAAAAABsb2dzL2RzLw==` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | Yes | The type of the resource. Set the value to **DOMAIN**. Example: `DOMAIN` |
| `tag` | ListTagResourcesRequestTag[] | No | - |
| `tagOwnerBid` | string | No | The business ID of the tag owner. Example: `26842` |
| `tagOwnerUid` | string | No | The ID of the Alibaba Cloud account to which the tag belongs. Example: `123xxxx` |

## describeTagResources

**Signature:** `describeTagResources(request: DescribeTagResourcesRequest)`

>  The maximum number of times that each user can call this operation per second is 10..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag. Valid values of N: **1** to **20**. Example: `key` |
| `value` | string | No | The value of the tag. Valid values of N: **1** to **20**. Example: `value` |
| `resourceId` | string[] | Yes | The IDs of the resources. You can specify up to 50 IDs in each request. Example: `1` |
| `resourceType` | string | Yes | The resource type. Set the value to **DOMAIN**. Example: `DOMAIN` |
| `tag` | DescribeTagResourcesRequestTag[] | No | - |

