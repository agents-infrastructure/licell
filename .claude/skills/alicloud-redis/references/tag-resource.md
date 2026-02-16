# Tag & Resource

Resource tagging and resource group management.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

If you have a large number of instances, you can create multiple tags and add these tags to the instances. Then, you can filter instances by tag. *   A tag consists of a key and a value. Each key must.

**Parameters:** (6 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | The key of the tag associated with the instance. Example: `demokey` |
| `value` | string | Yes | The value of the tag associated with the instance. Example: `demovalue` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `resourceType` | string | Yes | The resource type. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `tag` | TagResourcesRequestTag[] | Yes | The tags of the instance. |

## untagResources

**Signature:** `untagResources(request: UntagResourcesRequest)`

You can remove up to 20 tags at a time. *   If a tag is removed from an instance and is not added to other instances, the tag is deleted. You can also remove tags from instances in the Tair (Redis OSS.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags from the instance. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The IDs of the instances. Example: `r-bp1zxszhcgatnx****` |
| `resourceType` | string | Yes | The resource type. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `tagKey` | string[] | No | The list of tag keys. Example: `demokey` |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

You can also query the relationships between instances and tags in the Tair (Redis OSS-compatible) console. For more information, see [Filter Tair (Redis OSS-compatible) instances by tag](https://help.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The keys of the tags associated with the instances you want to query. Example: `demokey` |
| `value` | string | No | The values of the tags associated with the instances you want to query. Example: `demovalue` |
| `nextToken` | string | No | The token used to start the next query to retrieve more results. Example: `212db86sca4384811e0b5e8707ec2****` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | The IDs of the instances. Example: `r-bp1zxszhcgatnx****` |
| `resourceType` | string | Yes | The resource type. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `tag` | ListTagResourcesRequestTag[] | No | - |

## modifyResourceGroup

**Signature:** `modifyResourceGroup(request: ModifyResourceGroupRequest)`

You can also perform this operation in the [Resource Management](https://resourcemanager.console.aliyun.com/resource-center) console. For more information, see [Transfer resources across resource grou.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | Yes | The ID of the resource group to which you want to move the instance. Example: `rg-acfmyiu4ekp****` |


## describeTags

**Signature:** `describeTags(request: DescribeTagsRequest)`

Queries all tags in a region..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `212db86sca4384811e0b5e8707ec2****` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `resourceType` | string | No | The resource type. Valid values: **INSTANCE** or **instance**. Example: `INSTANCE` |

