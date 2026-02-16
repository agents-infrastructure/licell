# Tag & Resource

Resource tagging, resource group, and region management.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

Tags are used to identify resources. Tags allow you to categorize, search for, and aggregate resources that have the same characteristics from different dimensions. This facilitates resource management. For more information, see [Tag overview](https://help.aliyun.com/document_detail/156983.html)..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body.resourceId` | string[] | Yes | - |
| `body.resourceType` | string | No | - Example: `FUNCTION` |
| `body.tag` | Tag[] | Yes | - |

## untagResources

**Signature:** `untagResources(request: UntagResourcesRequest)`

Removes tags from a resource..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to delete all tags. Example: `true` |
| `resourceId` | string[] | Yes | The resource identifiers. |
| `resourceType` | string | Yes | The resource type. Example: `function` |
| `tagKey` | string[] | No | - |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

Lists all tagged resources..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. Example: `k1` |
| `value` | string | No | The tag value. Example: `v1` |
| `limit` | number | No | The number of resources to return. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `MTIzNCNhYmM=` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | Yes | The type of the resource. Example: `ALIYUN::FC:FUNCTION` |
| `tag` | ListTagResourcesRequestTag[] | No | The tags. |

## changeResourceGroup

**Signature:** `changeResourceGroup(request: ChangeResourceGroupRequest)`

To update the resource group of a Function Compute resource, you must grant the user the ChangeResourceGroup permission on both the current resource group and the target resource group..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body.newResourceGroupId` | string | No | - |

## describeRegions

**Signature:** `describeRegions(request: DescribeRegionsRequest)`

Queries the regions where Function Compute 3.0 is available..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language in which the list of regions is returned. For more information, see RFC 7231. Valid val Example: `zh-CN` |

