# Tag & Resource

Resource tagging and resource group management.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure th.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | The key of the tag. You can create N tag keys at a time. Valid values of N: **1** to **20**. The val Example: `testkey1` |
| `value` | string | No | The value of the tag. You can create N tag values at a time. Valid values of N: **1** to **20**. The Example: `testvalue1` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `resourceType` | string | Yes | The type of the resource. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `tag` | TagResourcesRequestTag[] | No | - |

## untagResources

**Signature:** `untagResources(request: UntagResourcesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)Usage notes *   You can remove up to 20 tags at a time. *   If a tag is removed from an instance and is.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to delete all tags of the instance. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The instance ID. You can remove tags from N instances at a time. Valid values of N: **1** to **50**. Example: `rm-uf6wjk5xxxxxxx` |
| `resourceType` | string | Yes | The type of the resource. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `tagKey` | string[] | No | The list of tag keys. You can delete N tag keys at a time. Valid values of N: **1** to **20**. The v Example: `testkey1` |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can query N tag keys at a time. Valid values of N: **1** to **20**. The value canno Example: `testkey1` |
| `value` | string | No | The tag value that is associated with the specified tag key. You can specify N tag values at a time. Example: `testvalue1` |
| `nextToken` | string | No | The token required to obtain more results. This parameter is not required in the first query. If a q Example: `212db86sca4384811e0b5e8707ec21345` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | The instance ID. You can specify a maximum of **50** instance IDs.**** Example: `rm-uf6wjk5xxxxxxx` |
| `resourceType` | string | Yes | The type of the resource. Set the value to **INSTANCE**. Example: `INSTANCE` |
| `tag` | ListTagResourcesRequestTag[] | No | - |

## addTagsToResource

**Signature:** `addTagsToResource(request: AddTagsToResourceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)Usage notes *   Each tag consists of a tag key and a tag value. The tag key is required, and the tag va.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key of the first tag that you want to add. Each tag consists of a tag key and a tag value. Y Example: `key1` |
| `value` | string | No | The tag value of the first tag that you want to add. Each tag consists of a tag key and a tag value. Example: `value1` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hagnzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `tags` | string | No | The tags that you want to add. Each tag consists of a tag key and a tag value. You can specify a max Example: `{“key1”:”value1”,“key2”:””}` |
| `proxyId` | string | No | The ID of the proxy mode. Example: `API` |

## removeTagsFromResource

**Signature:** `removeTagsFromResource(request: RemoveTagsFromResourceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)Usage notes *   A maximum of 10 tags can be removed in a single request. *   If a tag is removed from a.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The TagKey of the first tag that you want to unbind. Each tag consists of a TagKey and a TagValue. Y Example: `key1` |
| `value` | string | No | The TagValue of the first tag that you want to unbind. Each tag consists of a TagKey and a TagValue. Example: `value1` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the ListResourceGroups operation to query the resource group ID. Example: `rg-acfmy*****` |
| `tags` | string | No | A set of a TagKey and a TagValue that you use to unbind the tag. Format: {"key1":"value1"}. Example: `{"key1":"value1"}` |
| `proxyId` | string | No | The ID of the proxy mode. Example: `API` |

## describeDBInstanceByTags

**Signature:** `describeDBInstanceByTags(request: DescribeDBInstanceByTagsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstanceByTagsRequest` model.

## describeTags

**Signature:** `describeTags(request: DescribeTagsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [Usage notes](#) *   If an instance ID is specified, all tags that are added to this instance are queried, a.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOC****` |
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5****` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceType` | string | No | The type of resource. Set the value to INSTANCE. Example: `INSTANCE` |
| `tags` | string | No | The tag that you want to query. The value of the parameter consists of TagKey and TagValue. Format:  Example: `{“key1”:”value1”}` |
| `proxyId` | string | No | The ID of the proxy mode. Example: `API` |

## modifyResourceGroup

**Signature:** `modifyResourceGroup(request: ModifyResourceGroupRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bpxxxxx` |
| `resourceGroupId` | string | Yes | The resource group ID. You can call the ListResourceGroups operation to obtain the resource group ID Example: `rg-acxxxxx` |
| `resourceType` | string | No | The resource type. Example: `Instance` |

