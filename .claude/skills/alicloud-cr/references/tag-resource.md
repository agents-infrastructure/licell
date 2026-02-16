# Tag & Resource

Resource tagging and storage domain routing.

## tagResources

Adds tags to resources. Instance resources are supported.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key of the resource. You can specify up to 20 tag keys. The tag key cannot be an empty strin Example: `test-key` |
| `value` | string | No | The tag value of the resource. You can specify up to 20 tag values. The tag value can be an empty st Example: `test-val` |
| `regionId` | string | Yes | The region ID of the resources. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The resource IDs. You can specify a maximum of 20 resource IDs. |
| `resourceType` | string | Yes | The type of the resource. Instance resources are supported. Example: `Instance` |
| `tag` | TagResourcesRequestTag[] | Yes | The tag list. |

## untagResources

Removes tags from resources. Instance resources are supported.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags from the resource. Valid values: Example: `true` |
| `regionId` | string | Yes | The ID of the region in which the resources are deployed. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | Yes | The type of the resources. Instance resources are supported. Example: `Instance` |
| `tagKey` | string[] | No | - |

## listTagResources

Queries the tags that are added to cloud resources. Instance resources are supported.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key of the resource. You can specify up to 20 tag keys. The tag key cannot be an empty strin Example: `test-key` |
| `value` | string | No | The tag value of the resource. You can specify up to 20 tag values. The tag value can be an empty st Example: `test-val` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAAfj+3fkqd8igM6VLaQjlaYc=` |
| `regionId` | string | Yes | The ID of the region in which the resources are deployed. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | Yes | The type of the resources. Instance resources are supported. Example: `Instance` |
| `tag` | ListTagResourcesRequestTag[] | No | - |

## createStorageDomainRoutingRule

Creates an instance store domain name routing rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID Example: `cri-xkx6vujuhay0****` |
| `routes` | RouteItem[] | Yes | The route list |

## deleteStorageDomainRoutingRule

Deletes an instance store domain name routing rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID Example: `cri-4cdrlqmhn4gm****` |
| `ruleId` | string | Yes | The rule ID. Example: `crsdr-n6pbhgjxtla***` |

## getStorageDomainRoutingRule

Queries instance storage domain routing rules.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-kmsiwlxxdcva****` |
| `ruleId` | string | No | The rule ID. Example: `crasr-mdbpung4i1rm****` |

## updateStorageDomainRoutingRule

Updates a routing rule for an instance store domain name.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID Example: `cri-kmsiwlxxdcva****` |
| `routes` | RouteItem[] | Yes | The route list |
| `ruleId` | string | Yes | The rule ID. Example: `crsdr-b6thg027zmk1****` |

