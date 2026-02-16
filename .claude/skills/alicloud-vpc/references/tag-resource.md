# Tag, Region & Zone

Resource tagging, region and zone queries.

## tagResources

**Signature:** `tagResources(request: TagResourcesRequest)`

Tags are used to classify instances. Each tag consists of a key-value pair. Before you use tags, take note of the following limits: *   The keys of tags that are added to the same instance must be uni.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag that is added to the resource. You can specify at most 20 tag keys. Example: `FinanceDept` |
| `value` | string | No | The value of the tag that is added to the resource. You can specify at most 20 tag values. Example: `FinanceJoshua` |
| `regionId` | string | Yes | The region ID of the resource. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The resource ID. You can specify at most 20 IDs. Example: `vpc-bp16qjewdsunr41m1****` |
| `resourceType` | string | Yes | The resource type. Valid values: Example: `VPC` |
| `tag` | TagResourcesRequestTag[] | Yes | The tag information. Example: `TagResources` |

## unTagResources

**Signature:** `unTagResources(request: UnTagResourcesRequest)`

Removes tags from resources..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags from the specified resource. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the resource. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The resource ID. You can specify up to 20 resource IDs. Example: `vpc-bp16qjewdsunr41m1****` |
| `resourceType` | string | Yes | The resource type. Valid values: Example: `VPC` |
| `tagKey` | string[] | No | The key of the tag that you want to remove. You can specify at most 20 tag keys. It can be an empty  Example: `FinanceDept` |

## listTagResources

**Signature:** `listTagResources(request: ListTagResourcesRequest)`

## Usage notes *   You must specify **ResourceId.N** or **Tag.N** that consists of **Tag.N.Key** and **Tag.N.Value** in the request to specify the object that you want to query. *   **Tag.N** is a res.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag that is added to the resource. You can specify up to 20 tag keys. The tag key can Example: `FinanceDept` |
| `value` | string | No | The value of the tag that is added to the resource. You can specify up to 20 tag values. The tag val Example: `FinanceJoshua` |
| `maxResults` | number | No | The number of entries to return on each page. Valid values:**1** to **50**. Default value: **50**. Example: `50` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the resource. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | The resource ID. You can specify up to 20 resource IDs. Example: `vpc-bp16qjewdsunr41m1****` |
| `resourceType` | string | Yes | The resource type. Valid values: Example: `VPC` |
| `tag` | ListTagResourcesRequestTag[] | No | The tag value. You can specify up to 20 tag values. It can be an empty string. Example: `ListTagResources` |

## describeTagKeys

**Signature:** `describeTagKeys(request: DescribeTagKeysRequest)`

Queries tag keys..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The tag keys. Example: `keyword` |
| `maxResult` | number | No | The number of entries per page. Valid values: 1 to 50. Default value: 50. Example: `50` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the resource. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | No | The resource type. Valid values: Example: `VPC` |

## describeTags

**Signature:** `describeTags(request: DescribeTagsRequest)`

You must specify **ResourceId.N** or **Tag.N** that consists of **Tag.N.Key** and **Tag.N.Value** in the request to specify the object that you want to query. *   **Tag.N** is a resource tag that cons.

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag that is added to the resource. You can specify up to 20 tag keys. The tag key can Example: `FinanceDept` |
| `value` | string | No | The value of the tag that is added to the resource. You can specify up to 20 tag values. The tag val Example: `FinanceJoshua` |
| `maxResult` | number | No | The number of entries per page. Valid values: 1 to 50. Default value: 50. Example: `50` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The ID of the region to which the resource belongs. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | No | The resource type. Valid values: Example: `VPC` |
| `tag` | DescribeTagsRequestTag[] | No | - |

## describeRegions

**Signature:** `describeRegions(request: DescribeRegionsRequest)`

Queries the most recent region list..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |
| `productType` | string | No | The service type. Default value: **VPC**. Example: `VPC` |

## describeZones

**Signature:** `describeZones(request: DescribeZonesRequest)`

Queries zones in a region..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language used in the **LocalName** parameter. Valid values: Example: `zh-cn` |
| `regionId` | string | Yes | The region ID of the zone. You can call the [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |
| `zoneType` | string | No | The zone type. Default value: **AvailabilityZone**. Example: `AvailabilityZone` |

## listBusinessRegions

**Signature:** `listBusinessRegions(request: ListBusinessRegionsRequest)`

Query the list of regions available for an Express Connect circuit..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |


