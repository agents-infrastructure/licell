# Prefix List

Prefix list management for IP address range grouping.

## createPrefixList

**Signature:** `createPrefixList(request: CreatePrefixListRequest)`

## [](#)Usage notes *   A prefix list is a collection of network prefixes (CIDR blocks) and can be referenced to configure network rules for other resources. For more information, see [Overview](https.

**Parameters:** (5 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidr` | string | Yes | The CIDR block in entry N. Valid values of N: 0 to 200. Notes: Example: `192.168.1.0/24` |
| `description` | string | No | The description in entry N. The description must be 2 to 32 characters in length and cannot start wi Example: `Description` |
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. The tag key cannot be an empty string. The tag key can Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. The tag value can be an empty string. Example: `TestValue` |
| `addressFamily` | string | Yes | The IP address family. Valid values: Example: `IPv4` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `description` | string | No | The description of the prefix list. The description must be 2 to 256 characters in length and cannot Example: `This` |
| `entry` | CreatePrefixListRequestEntry[] | No | - |
| `maxEntries` | number | Yes | The maximum number of entries that the prefix list can contain. Valid values: 1 to 200. Example: `10` |
| `prefixListName` | string | Yes | The name of the prefix list. The name must be 2 to 128 characters in length, and can contain letters Example: `PrefixListNameSample` |
| `regionId` | string | Yes | The ID of the region in which to create the prefix list. Example: `cn-chengdu` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the prefix list. Example: `rg-bp67acfmxazb4p****` |
| `tag` | CreatePrefixListRequestTag[] | No | - |

## deletePrefixList

**Signature:** `deletePrefixList(request: DeletePrefixListRequest)`

If a prefix list is associated with resources, you cannot delete the prefix list. You must disassociate the prefix list from the resources before you delete the prefix list. You can call the [Describe.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `prefixListId` | string | Yes | The ID of the prefix list. Example: `pl-x1j1k5ykzqlixdcy****` |
| `regionId` | string | Yes | The region ID of the prefix list. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-chengdu` |

## describePrefixLists

**Signature:** `describePrefixLists(request: DescribePrefixListsRequest)`

You can specify the `AddressFamily`, `PrefixListId.N`, and `PrefixListName` request parameters in the request. Specified parameters have logical AND relations. Only the parameters that you set are inc.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the prefix list. Valid values of N: 1 to 20. The tag key cannot be an empty stri Example: `TestKey` |
| `value` | string | No | The value of tag N of the prefix list. Valid values of N: 1 to 20. The tag value can be an empty str Example: `TestValue` |
| `addressFamily` | string | No | The IP address family. Valid values: Example: `IPv4` |
| `maxResults` | number | No | The number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the request to retrieve a new page of results. Set the value to Example: `AAAAAdDWBF2****` |
| `prefixListId` | string[] | No | The IDs of prefix lists. Valid values of N: 0 to 100. Example: `pl-x1j1k5ykzqlixdcy****` |
| `prefixListName` | string | No | The name of the prefix list. Example: `PrefixListNameSample` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-chengdu` |
| `resourceGroupId` | string | No | The ID of the resource group to which the prefix list belongs. Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribePrefixListsRequestTag[] | No | - |

## describePrefixListAssociations

**Signature:** `describePrefixListAssociations(request: DescribePrefixListAssociationsRequest)`

Queries information about resources that are associated with a prefix list, such as the resource IDs and types..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `nextToken` | string | No | The query token. Set the value to the `NextToken` value returned in the previous call to the Describ Example: `AAAAAdDWBF2****` |
| `prefixListId` | string | Yes | The ID of the prefix list. Example: `pl-x1j1k5ykzqlixdcy****` |
| `regionId` | string | Yes | The region ID of the prefix list. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-chengdu` |

## modifyPrefixList

**Signature:** `modifyPrefixList(request: ModifyPrefixListRequest)`

## [](#)Usage notes *   The specified CIDR block must be valid. For example, 10.0.0.0/8 is a valid CIDR block while 10.0.0.1/8 is not. For more information, see the [What is CIDR?](~~40637#section-jua.

**Parameters:** (4 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidr` | string | Yes | The CIDR block in entry N to be added to the prefix list. Valid values of N: 0 to 200. Example: `192.168.2.0/24` |
| `description` | string | No | The description in entry N. The description must be 2 to 32 characters in length and cannot start wi Example: `Description` |
| `cidr` | string | Yes | The CIDR block in entry N to be deleted from the prefix list. Valid values of N: 0 to 200. Example: `192.168.1.0/24` |
| `addEntry` | ModifyPrefixListRequestAddEntry[] | No | - |
| `description` | string | No | The description of the prefix list. The description must be 2 to 256 characters in length and cannot Example: `This` |
| `prefixListId` | string | Yes | The ID of the prefix list. Example: `pl-x1j1k5ykzqlixdcy****` |
| `prefixListName` | string | No | The name of the prefix list. The name must be 2 to 128 characters in length. It must start with a le Example: `PrefixListNameSample` |
| `regionId` | string | Yes | The region ID of the prefix list. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-chengdu` |
| `removeEntry` | ModifyPrefixListRequestRemoveEntry[] | No | - |

