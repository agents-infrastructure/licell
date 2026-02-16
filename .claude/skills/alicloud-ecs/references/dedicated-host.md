# Dedicated Host

Dedicated host allocation, release, and management.

## allocateDedicatedHosts

**Signature:** `allocateDedicatedHosts(request: AllocateDedicatedHostsRequest)`

Before you create a dedicated host, you can call the [DescribeAvailableResource](https://help.aliyun.com/document_detail/66186.html) operation to query the resources available in a specific region or .

**Parameters:** (2 required, 22 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slbUdpTimeout` | number | No | The timeout period for a UDP session between a Server Load Balancer (SLB) instance and the dedicated Example: `60` |
| `udpTimeout` | number | No | The timeout period for a UDP session between a user and an Alibaba Cloud service on the dedicated ho Example: `60` |
| `key` | string | No | The key of tag N to add to the dedicated host. Valid values of N: 1 to 20. Example: `Environment` |
| `value` | string | No | The value of tag N to add to the dedicated host. Valid values of N: 1 to 20. Example: `Production` |
| `actionOnMaintenance` | string | No | The policy for migrating the instances deployed on the dedicated host when the dedicated host fails  Example: `Migrate` |
| `autoPlacement` | string | No | Specifies whether to add the dedicated host to the resource pool for automatic deployment. If you cr Example: `off` |
| `autoReleaseTime` | string | No | The time when to automatically release the dedicated host. Specify the time in the `ISO 8601` standa Example: `2019-08-21T12:30:24Z` |
| `autoRenew` | boolean | No | Specifies whether to automatically renew the subscription dedicated host. Example: `false` |
| `autoRenewPeriod` | number | No | The auto-renewal duration of the dedicated host. The **AutoRenewPeriod** parameter takes effect and  Example: `1` |
| `chargeType` | string | No | The billing method of the dedicated host. Valid values: Example: `PrePaid` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `cpuOverCommitRatio` | number | No | The CPU overcommit ratio. You can configure CPU overcommit ratios only for the following dedicated h Example: `1` |
| `dedicatedHostClusterId` | string | No | The ID of the dedicated host cluster in which to create the dedicated host. Example: `dc-bp12wlf6am0vz9v2****` |
| `dedicatedHostName` | string | No | The name of the dedicated host. The name must be 2 to 128 characters in length and can contain lette Example: `myDDH` |
| `dedicatedHostType` | string | Yes | The dedicated host type. You can call the [DescribeDedicatedHostTypes](https://help.aliyun.com/docum Example: `ddh.c5` |
| `description` | string | No | The description of the dedicated host. The description must be 2 to 256 characters in length and can Example: `This-is-my-DDH` |
| `minQuantity` | number | No | The minimum number of dedicated hosts to create. Valid values: 1 to 100. Example: `2` |
| `period` | number | No | The subscription duration of the dedicated host. The `Period` parameter is required and takes effect Example: `6` |
| `periodUnit` | string | No | The unit of the subscription duration of the dedicated host. Valid values: Example: `Month` |
| `quantity` | number | No | The number of dedicated hosts that you want to create. Valid values: 1 to 100. Example: `2` |
| `regionId` | string | Yes | The ID of the region in which to create the dedicated host. You can call the [DescribeRegions](https Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the dedicated host. Example: `rg-bp67acfmxazb4ph***` |
| `tag` | AllocateDedicatedHostsRequestTag[] | No | - |
| `zoneId` | string | No | The ID of the zone in which to create the dedicated host. Example: `cn-hangzhou-f` |

## releaseDedicatedHost

**Signature:** `releaseDedicatedHost(request: ReleaseDedicatedHostRequest)`

## Usage notes Before you release a pay-as-you-go dedicated host, make sure that no ECS instances are deployed on the dedicated host..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostId` | string | Yes | The ID of the dedicated host. Example: `dh-bp199lyny9b3****` |
| `regionId` | string | Yes | The region ID of the dedicated host. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `terminateSubscription` | boolean | No | The expiration time of the subscription dedicated host. Example: `false` |

## renewDedicatedHosts

**Signature:** `renewDedicatedHosts(request: RenewDedicatedHostsRequest)`

## [](#)Usage notes When you renew subscription dedicated hosts, vouchers are used first by default. Make sure that your account supports credit card payments or balance payments..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dedicatedHostIds` | string | Yes | The IDs of dedicated hosts. You can specify the IDs of up to 100 subscription dedicated hosts. Speci Example: `dh-bp199lyny9b3****` |
| `period` | number | Yes | The renewal duration. Valid values: Example: `1` |
| `periodUnit` | string | No | The unit of the renewal period. Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the dedicated host. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## describeDedicatedHosts

**Signature:** `describeDedicatedHosts(request: DescribeDedicatedHostsRequest)`

## [](#)Usage notes You can use one of the following methods to query the information about dedicated hosts: *   Specify `DedicatedHostIds` to query the details of specified dedicated hosts. *   Speci.

**Parameters:** (1 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the DDH. The tag key cannot be an empty string. The tag key can be up to 128 cha Example: `TestKey` |
| `value` | string | No | The value of tag N of the DDH. You can specify empty strings as tag values. The tag value can be up  Example: `TestValue` |
| `dedicatedHostClusterId` | string | No | The ID of the dedicated host cluster. Example: `dc-bp12wlf6am0vz9v2****` |
| `dedicatedHostIds` | string | No | The list of DDH IDs. You can specify up to 100 deployment set IDs in each request. Separate the depl Example: `["dh-bp165p6xk2tlw61e****",` |
| `dedicatedHostName` | string | No | The name of the dedicated host. Example: `MyDDHTestName` |
| `dedicatedHostType` | string | No | The type of the DDH. You can call the [DescribeDedicatedHostTypes](https://help.aliyun.com/document_ Example: `ddh.g5` |
| `lockReason` | string | No | The reason why the dedicated host is locked. Valid values: Example: `financial` |
| `maxResults` | number | No | The maximum number of entries per page. If you specify this parameter, both MaxResults and NextToken Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `e71d8a535bd9cc11` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. You can use NextToken and MaxResults for a paged qu Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. You can use NextToken and MaxResults for a paged qu Example: `10` |
| `regionId` | string | Yes | The region ID of the dedicated host. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the dedicated host belongs. When this parameter is specified t Example: `rg-aek3b6jzp66****` |
| `socketDetails` | string | No | Specifies whether to display socket information. You can view the remaining resources (vCPUs, memory Example: `true` |
| `status` | string | No | The service state of the dedicated host. Valid values: Example: `Available` |
| `tag` | DescribeDedicatedHostsRequestTag[] | No | - |
| `zoneId` | string | No | The zone ID of the dedicated host. You can call the [DescribeZones](https://help.aliyun.com/document Example: `cn-hangzhou-g` |

## describeDedicatedHostTypes

**Signature:** `describeDedicatedHostTypes(request: DescribeDedicatedHostTypesRequest)`

Queries the details of dedicated host types supported in a region, or the Elastic Compute Service (ECS) instance families supported by a specific dedicated host type..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostType` | string | No | The dedicated host type. For more information, see [Dedicated host types](https://help.aliyun.com/do Example: `ddh.sn1ne` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `supportedInstanceTypeFamily` | string | No | The ECS instance family supported by the dedicated host type. Example: `ecs.sn1ne` |

## describeDedicatedHostClusters

**Signature:** `describeDedicatedHostClusters(request: DescribeDedicatedHostClustersRequest)`

## [](#)Usage notes You can specify multiple request parameters to filter query results. Specified request parameters have logical AND relations. Only the specified parameters are included in the filt.

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. Valid values of N: 1 to 20. The tag key cannot be an empty string. It can be up to 64 c Example: `TestKey` |
| `value` | string | No | The tag value. Valid values of N: 1 to 20. The tag value cannot be an empty string. It can be up to  Example: `TestValue` |
| `dedicatedHostClusterIds` | string | No | The list of host group IDs. The value can be a JSON array consisting of multiple IDs in the `["dc-xx Example: `["dc-bp12wlf6am0vz9v2****",` |
| `dedicatedHostClusterName` | string | No | The name of the host group. Example: `myDDHCluster` |
| `lockReason` | string | No | >  This parameter is unavailable for use. Example: `null` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `5` |
| `regionId` | string | Yes | The region ID of the host group. You can call the [DescribeRegions](https://help.aliyun.com/document Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID of the host group. You can use a resource group ID to filter no more than 1,00 Example: `rg-bp67acfmxazb4p****` |
| `status` | string | No | >  This parameter is unavailable for use. Example: `null` |
| `tag` | DescribeDedicatedHostClustersRequestTag[] | No | - |
| `zoneId` | string | No | The zone ID of the host group. You can call the [DescribeZones](https://help.aliyun.com/document_det Example: `cn-hangzhou-f` |

## describeDedicatedHostAutoRenew

**Signature:** `describeDedicatedHostAutoRenew(request: DescribeDedicatedHostAutoRenewRequest)`

Queries the auto-renewal status of one or more subscription dedicated hosts..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostIds` | string | Yes | The ID of the dedicated host. You can specify up to 100 subscription dedicated host IDs. Separate mu Example: `dh-bp165p6xk2tlw61e****,dh-bp1f9vxmno****` |
| `regionId` | string | Yes | The ID of the region where the dedicated host resides. Example: `cn-hangzhou` |

## modifyDedicatedHostAttribute

**Signature:** `modifyDedicatedHostAttribute(request: ModifyDedicatedHostAttributeRequest)`

## [](#)Usage notes *   All Elastic Compute Service (ECS) instances that are hosted on a dedicated host must be in the Stopped (`Stopped`) state before you can modify the CPU overcommit ratio of the d.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slbUdpTimeout` | number | No | The timeout period for a UDP session between a Server Load Balancer (SLB) instance and the dedicated Example: `60` |
| `udpTimeout` | number | No | The timeout period for a UDP session between a user and an Alibaba Cloud service on the dedicated ho Example: `60` |
| `actionOnMaintenance` | string | No | The policy for migrating the instances deployed on the dedicated host when the dedicated host fails  Example: `Migrate` |
| `autoPlacement` | string | No | Specifies whether to add the dedicated host to the resource pool for automatic deployment. If you do Example: `on` |
| `cpuOverCommitRatio` | number | No | The CPU overcommit ratio. You can configure CPU overcommit ratios only for the following dedicated h Example: `1` |
| `dedicatedHostClusterId` | string | No | The ID of the dedicated host cluster to which to assign the dedicated host. Example: `dc-bp165p6xk2tlw61e****` |
| `dedicatedHostId` | string | Yes | The ID of the dedicated host. Example: `dh-bp165p6xk2tlw61e****` |
| `dedicatedHostName` | string | No | The name of the dedicated host. The name must be 2 to 128 characters in length. The name must start  Example: `testDedicatedHostName` |
| `description` | string | No | The description of the dedicated host. The description must be 2 to 256 characters in length and can Example: `testDescription` |
| `regionId` | string | Yes | The ID of the region where the dedicated host resides. You can call the [DescribeRegions](https://he Example: `cn-hangzhou` |

## modifyDedicatedHostAutoReleaseTime

**Signature:** `modifyDedicatedHostAutoReleaseTime(request: ModifyDedicatedHostAutoReleaseTimeRequest)`

## Usage notes A pay-as-you-go dedicated host can be automatically released at the specified time. Before you release a pay-as-you-go dedicated host, make sure that the host is no longer required and .

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoReleaseTime` | string | No | The automatic release time of the dedicated host. Specify the time in the ISO 8601 standard in the y Example: `2019-06-04T13:35:00Z` |
| `dedicatedHostId` | string | Yes | The ID of the dedicated host. Example: `dh-bp165p6xk2tlw61e****` |
| `regionId` | string | Yes | The region ID of the dedicated host. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## modifyDedicatedHostAutoRenewAttribute

**Signature:** `modifyDedicatedHostAutoRenewAttribute(request: ModifyDedicatedHostAutoRenewAttributeRequest)`

If you enable auto-renewal for your subscription dedicated host, the system attempts to deduct the renewal payment at 08:00:00 (UTC+8) nine days before the dedicated host expires to renew the dedicate.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | boolean | No | Specifies whether to automatically renew the subscription. Valid values: Example: `false` |
| `autoRenewWithEcs` | string | No | Specifies whether to automatically renew the subscription dedicated hosts along with the subscriptio Example: `StopRenewWithEcs` |
| `dedicatedHostIds` | string | Yes | The IDs of dedicated hosts. You can specify up to 100 subscription dedicated host IDs. Separate the  Example: `dh-bp165p6xk2tlw61e****` |
| `duration` | number | No | The renewal duration. Example: `1` |
| `periodUnit` | string | No | The unit of the renewal period. Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the dedicated host. Example: `cn-hangzhou` |
| `renewalStatus` | string | No | Specifies whether to automatically renew the subscription dedicated host. The `RenewalStatus` parame Example: `Normal` |

## modifyDedicatedHostClusterAttribute

**Signature:** `modifyDedicatedHostClusterAttribute(request: ModifyDedicatedHostClusterAttributeRequest)`

Modifies the information of a dedicated host group, including the name, description, and properties..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostClusterId` | string | Yes | The ID of the host group. Example: `dc-bp12wlf6am0vz9v2****` |
| `dedicatedHostClusterName` | string | No | The name of the host group. It must be 2 to 128 characters in length and start with a letter. It can Example: `newClusterName` |
| `description` | string | No | The description of the host group. It must be 2 to 256 characters in length, and cannot start with ` Example: `newClusterDescription` |
| `regionId` | string | Yes | The region ID of the host group. You can call the [DescribeRegions](https://help.aliyun.com/document Example: `cn-hangzhou` |

## createDedicatedHostCluster

**Signature:** `createDedicatedHostCluster(request: CreateDedicatedHostClusterRequest)`

Creates a dedicated host group..

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. Valid values of N: 1 to 20. The tag key cannot be an empty string. It can be no more th Example: `TestKey` |
| `value` | string | No | The tag value. Valid values of N: 1 to 20. The tag value cannot be an empty string. It can be no mor Example: `TestValue` |
| `dedicatedHostClusterName` | string | No | The name of the host group. It must be 2 to 128 characters in length and can contain letters, digits Example: `myDDHCluster` |
| `description` | string | No | The description of the host group. It must be 2 to 256 characters in length, and cannot start with ` Example: `This-is-my-DDHCluster` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the host group. You can call the [DescribeRegions](https://help.aliyun.com/document Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID of the host group. Example: `rg-bp67acfmxazb4p****` |
| `tag` | CreateDedicatedHostClusterRequestTag[] | No | - |
| `zoneId` | string | Yes | The zone ID of the host group. You can call the [DescribeZones](https://help.aliyun.com/document_det Example: `cn-hangzhou-f` |

## deleteDedicatedHostCluster

**Signature:** `deleteDedicatedHostCluster(request: DeleteDedicatedHostClusterRequest)`

Deletes a dedicated host group. Before you call the API operation, you must migrate the dedicated hosts in the host group to another host group..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostClusterId` | string | Yes | The ID of the host group. Example: `dc-bp12wlf6am0vz9v2****` |
| `regionId` | string | Yes | The region ID of the host group. You can call the [DescribeRegions](https://help.aliyun.com/document Example: `cn-hangzhou` |

## redeployDedicatedHost

**Signature:** `redeployDedicatedHost(request: RedeployDedicatedHostRequest)`

If a dedicated host is in the `UnderAssessment` state, we recommend that you call this operation to migrate ECS instances away from the dedicated host to prevent permanent failures. You can call the [.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dedicatedHostId` | string | Yes | The ID of the dedicated host. Example: `dh-bp165p6xk2tlw61e****` |
| `migrationType` | string | No | Specifies whether to stop the instance before it is migrated to the destination dedicated host. Vali Example: `Reboot` |
| `regionId` | string | Yes | The region ID of the dedicated host. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## modifyDedicatedHostsChargeType

**Signature:** `modifyDedicatedHostsChargeType(request: ModifyDedicatedHostsChargeTypeRequest)`

Changes the billing method of dedicated hosts..

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to automatically complete the payment. Valid value: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `e4567-e89b-12d3-a456-426655440000` |
| `dedicatedHostChargeType` | string | No | The new billing method for the dedicated host. Valid value: Example: `PrePaid` |
| `dedicatedHostIds` | string | Yes | The IDs of the dedicated hosts. The value can be a JSON array that consists of up to 20 dedicated ho Example: `["dh-bp181e5064b5sotr****","dh-bp18064b5sotrr9c****"]` |
| `detailFee` | boolean | No | Specifies whether to return the billing details of the order when the billing method is changed from Example: `false` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run. Valid value: Example: `false` |
| `period` | number | No | The renewal duration of the subscription dedicated hosts. Valid values: Example: `1` |
| `periodUnit` | string | No | The unit of the renewal duration specified by `Period`. Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the dedicated hosts. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |

