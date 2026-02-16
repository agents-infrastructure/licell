# Tag & Resource Group

Resource tagging, resource groups, and region/zone queries.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

## [](#)Usage notes Before you add tags to a resource, Alibaba Cloud checks the number of existing tags of the resource. If the maximum number of tags is reached, an error message is returned. For mor.

**Parameters:** (6 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | The tag key cannot be null or an empty string. The tag key can be up to 128 characters in length and Example: `TestKey` |
| `value` | string | Yes | The value of tag N. The tag value cannot be null and can be an empty string. The tag key can be up t Example: `TestValue` |
| `regionId` | string | Yes | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | Resource IDs. You can specify up to 50 resource IDs. Example: `i-bp67acfmxazb4ph****` |
| `resourceType` | string | Yes | The type of the resource to which the tags are added. Valid values: Example: `instance` |
| `tag` | TagResourcesRequestTag[] | Yes | The tags of the reserved instance. You can specify up to 20 tags. If you specify multiple tags, the  |

## untagResources

**Signature:** `untagResources(request: UntagResourcesRequest)`

Removes tags from Elastic Compute Service (ECS) resources. After a tag is removed from a resource, the tag is automatically deleted if it is not added to other resources..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags from the resource. This parameter takes effect only if you do n Example: `false` |
| `regionId` | string | Yes | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The resource IDs. Valid values of N: 1 to 50. Example: `i-bp67acfmxazb4ph****` |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `instance` |
| `tagKey` | string[] | No | The tag keys. Valid values of N: 1 to 20. Example: `TestKey` |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

## [](#)Usage notes Specify at least one of the following parameters or parameter pairs in a request to determine a query object: *   `ResourceId.N` *   `Tag.N` parameter pair (`Tag.N.Key` and `Tag.N..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N used for exact search of ECS resources. The tag key must be 1 to 128 characters in  Example: `TestKey` |
| `value` | string | No | The value of tag N used for exact search of ECS resources. The tag value must be 1 to 128 characters Example: `TestValue` |
| `tagKey` | string | No | The key of tag N used for fuzzy search of ECS resources. The tag key must be 1 to 128 characters in  Example: `env` |
| `tagValues` | string[] | No | The values of tag N used for fuzzy search of ECS resources. The tag values must be 1 to 128 characte Example: `TestTagFilter` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceId` | string[] | No | The resource IDs. Valid values of N: 1 to 50. Example: `i-bp1j6qtvdm8w0z1o****` |
| `resourceType` | string | Yes | The resource type. Valid values: Example: `instance` |
| `tag` | ListTagResourcesRequestTag[] | No | - |
| `tagFilter` | ListTagResourcesRequestTagFilter[] | No | - |

## addTags

**Signature:** `addTags(request: AddTagsRequest)`

addTags operation.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the resource. Valid values of N: 1 to 20. The tag key cannot be an empty string. Example: `TestKey` |
| `value` | string | No | The value of tag N of the resource. Valid values of N: 1 to 20. The tag value can be an empty string Example: `TestValue` |
| `regionId` | string | Yes | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The ID of the resource. When the resources are instances, this parameter can be interpreted as Insta Example: `i-bp1gtjxuuvwj17zr****` |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `instance` |
| `tag` | AddTagsRequestTag[] | Yes | The tags. |

## removeTags

**Signature:** `removeTags(request: RemoveTagsRequest)`

removeTags operation.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. The tag key cannot be an empty string. The tag key can Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. The tag value can be an empty string. The tag value  Example: `TestValue` |
| `regionId` | string | Yes | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-shenzhen` |
| `resourceId` | string | Yes | The ID of the resource. For example, if you set ResourceType to instance, you must set this paramete Example: `s-946ntx4****` |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `snapshot` |
| `tag` | RemoveTagsRequestTag[] | No | - |

## describeTags

**Signature:** `describeTags(request: DescribeTagsRequest)`

describeTags operation.

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the resource. Valid values of N: 1 to 20. The tag key cannot be an empty string. Example: `TestKey` |
| `value` | string | No | The value of tag N of the resource. Valid values of N: 1 to 20. The tag value can be an empty string Example: `TestValue` |
| `category` | string | No | > This parameter will be deprecated in the future. We recommend that you use other parameters to ens Example: `null` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `50` |
| `regionId` | string | Yes | The ID of the region. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/256 Example: `cn-hangzhou` |
| `resourceId` | string | No | The ID of the resource to which the tags are added. If the resource is an instance, the value of thi Example: `s-946ntx4wr****` |
| `resourceType` | string | No | The type of the resource to which the tags are added. Valid values: Example: `snapshot` |
| `tag` | DescribeTagsRequestTag[] | No | - |

## describeRegions

**Signature:** `describeRegions(request: DescribeRegionsRequest)`

Queries Alibaba Cloud regions. When you call this operation, you can specify parameters, such as InstanceChargeType and ResourceType, in the request..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The natural language that is used to filter responses. For more information, see [RFC 7231](https:// Example: `zh-CN` |
| `instanceChargeType` | string | No | The billing method of the instance.  For more information, see [Billing overview](https://help.aliyu Example: `PrePaid` |
| `resourceType` | string | No | The type of resource. Valid values: Example: `instance` |

## describeZones

**Signature:** `describeZones(request: DescribeZonesRequest)`

## [](#)Usage notes When you call this operation, only a list of zones and some resource information of each zone are returned. If you want to query instance types and disk categories that are availab.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The natural language that is used to filter responses. For more information, see [RFC 7231](https:// Example: `zh-CN` |
| `instanceChargeType` | string | No | The billing method of resources. For more information, see [Billing overview](https://help.aliyun.co Example: `PostPaid` |
| `regionId` | string | Yes | The ID of the region. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/256 Example: `cn-hangzhou` |
| `spotStrategy` | string | No | The bidding policy for the pay-as-you-go instance. You can specify this parameter when you set `Inst Example: `NoSpot` |
| `verbose` | boolean | No | Specifies whether to display detailed information. Example: `false` |

## describeResourceByTags

**Signature:** `describeResourceByTags(request: DescribeResourceByTagsRequest)`

describeResourceByTags operation.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the resource. Valid values of N: 1 to 20. The tag key cannot be an empty string. Example: `TestKey` |
| `value` | string | No | The value of tag N of the resource. Valid values of N: 1 to 20. The tag value can be an empty string Example: `TestValue` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `50` |
| `regionId` | string | Yes | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceType` | string | No | The type of the resource. Valid values: Example: `instance` |
| `tag` | DescribeResourceByTagsRequestTag[] | No | - |

## describeResourcesModification

**Signature:** `describeResourcesModification(request: DescribeResourcesModificationRequest)`

Examples of common scenarios in which this operation is used: ### [](#-1)Example 1: Query the instance types to which you can change the instance type of an instance. Query the instance types to which.

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conditions` | string[] | No | - |
| `cores` | number | No | The number of vCPUs of the instance type. For information about the valid values, see [Overview of i Example: `2` |
| `destinationResource` | string | Yes | The resource type that you want to change. Valid values: Example: `InstanceType` |
| `instanceType` | string | No | The instance type to which you want to change the instance type of the instance. For more informatio Example: `ecs.g5.large` |
| `memory` | number | No | The memory size of the instance type. Unit: GiB. For information about the valid values, see [Overvi Example: `8.0` |
| `migrateAcrossZone` | boolean | No | Specifies whether cross-cluster instance type upgrades are supported. Valid values: Example: `true` |
| `operationType` | string | No | The operation of changing resource configurations. Example: `Upgrade` |
| `regionId` | string | Yes | The region ID of the instance for which you want to change the instance type or system disk category Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The ID of the instance for which you want to change the instance type or system disk category. Example: `i-bp67acfmxazb4p****` |
| `zoneId` | string | No | The ID of the destination zone to which you want to migrate the instance. Example: `cn-hangzhou-e` |

## describeAccountAttributes

**Signature:** `describeAccountAttributes(request: DescribeAccountAttributesRequest)`

After you [create](https://account.alibabacloud.com/register/intl_register.htm) an Alibaba Cloud account, you can create a specific number of ECS instances in different regions within the account. For.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attributeName` | string[] | No | The type of resource quota N. Valid values of N: 1 to 8. Valid values: Example: `max-security-groups` |
| `regionId` | string | Yes | The ID of the region. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/256 Example: `cn-hangzhou` |
| `zoneId` | string | No | The ID of the zone in which the resource resides. Example: `cn-hangzhou-b` |

## describeTasks

**Signature:** `describeTasks(request: DescribeTasksRequest)`

## Debugging [OpenAPI Explorer automatically calculates the signature value. For your convenience, we recommend that you call this operation in OpenAPI Explorer. OpenAPI Explorer dynamically generates.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end of the time range to query. The time range refers to the period of time during which the tas Example: `2020-11-23T15:16:00Z` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceIds` | string[] | No | - |
| `startTime` | string | No | The beginning of the time range to query. The time range refers to the period of time during which t Example: `2020-11-23T15:10:00Z` |
| `taskAction` | string | No | The name of the operation that generates the task. Valid values: Example: `ImportImage` |
| `taskGroupId` | string | No | - |
| `taskIds` | string | No | The task IDs. You can specify up to 100 task IDs at a time. Separate the task IDs with commas (,). Example: `t-bp1hvgwromzv32iq****,t-bp179lofu2pv768w****` |
| `taskStatus` | string | No | The task status. Valid values: Example: `Finished` |

## describeTaskAttribute

**Signature:** `describeTaskAttribute(request: DescribeTaskAttributeRequest)`

Queries the details of an asynchronous task. The asynchronous tasks that you can query by calling this operation are the tasks generated by the ImportImage, ExportImage, and ModifyDiskSpec operations..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `155780923770` |
| `regionId` | string | Yes | The region ID of the task. You can call the [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `ECSforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `155780923770` |
| `taskId` | string | Yes | The ID of the task. You can call the [DescribeTasks](https://help.aliyun.com/document_detail/25622.h Example: `t-ce946ntx4wr****` |

## cancelTask

**Signature:** `cancelTask(request: CancelTaskRequest)`

Cancels a running task. You can cancel the running tasks generated by the ImportImage or ExportImage operation..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The ID of the task. You can call the [DescribeTasks](https://help.aliyun.com/document_detail/25622.h Example: `cn-hangzhou` |
| `taskId` | string | Yes | The ID of the request. Example: `t-bp198jigq7l0h5ac****` |

## describeUserData

**Signature:** `describeUserData(request: DescribeUserDataRequest)`

If no user data is configured for the ECS instance, an empty string is returned..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp14bnftyqhxg9ij****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## modifyUserBusinessBehavior

**Signature:** `modifyUserBusinessBehavior(request: ModifyUserBusinessBehaviorRequest)`

modifyUserBusinessBehavior operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `statusKey` | string | Yes | - |
| `statusValue` | string | Yes | - |

## describeUserBusinessBehavior

**Signature:** `describeUserBusinessBehavior(request: DescribeUserBusinessBehaviorRequest)`

describeUserBusinessBehavior operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `statusKey` | string | Yes | - |

## joinResourceGroup

**Signature:** `joinResourceGroup(request: JoinResourceGroupRequest)`

## [](#)Usage notes A resource is a cloud service entity that you create on Alibaba Cloud, such as an ECS instance, an elastic network interface (ENI), or an image. A resource group is a collection of.

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | No | The region ID of the resource. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which you want to add the instance. Example: `rg-bp67acfmxazb4p****` |
| `resourceId` | string | No | The ID of the resource. For example, if you set ResourceType to instance, set this parameter to the  Example: `sg-bp67acfmxazb4p****` |
| `resourceType` | string | No | The type of the ECS resource. Valid values: Example: `securitygroup` |

