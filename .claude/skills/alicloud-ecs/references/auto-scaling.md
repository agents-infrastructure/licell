# Auto Provisioning & Elasticity

Auto provisioning groups, elasticity assurances, and capacity reservations.

## createAutoProvisioningGroup

**Signature:** `createAutoProvisioningGroup(request: CreateAutoProvisioningGroupRequest)`

## [](#)Usage notes *   Auto Provisioning is a service that allows quick deployment of an instance cluster that consists of spot instances and pay-as-you-go instances. Auto Provisioning supports push-.

**Parameters:** (3 required, 113 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | boolean | Yes | Specifies whether to enable auto-renewal for the reserved instance. This parameter is required only  Example: `true` |
| `regionId` | string | Yes | The ID of the region in which to create the auto provisioning group. You can call the [DescribeRegio Example: `cn-hangzhou` |
| `totalTargetCapacity` | string | Yes | The total target capacity of the auto provisioning group. The value must be a positive integer. Example: `60` |
| `assumeRoleFor` | number | No | >  This parameter is in invitational preview and is not publicly available. Example: `123456789012****` |
| `roleType` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `34458433936495****:alice` |
| `rolearn` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `acs:ram::123456789012****:role/adminrole` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy to apply to data disk N. Example: `sp-bp67acfmxazb4p****` |
| `burstingEnabled` | boolean | No | Specifies whether to enable the performance burst feature for the system disk. Valid values: Example: `false` |
| `category` | string | No | The category of data disk N. Valid values of N: 1 to 16. Valid values: Example: `cloud_ssd` |
| `deleteWithInstance` | boolean | No | Specifies whether to release data disk N when the instance to which the data disk is attached is rel Example: `true` |
| `description` | string | No | The description of data disk N. The description must be 2 to 256 characters in length and cannot sta Example: `DataDisk_Description` |
| `device` | string | No | The mount point of data disk N. When both LaunchTemplateId and LaunchConfiguration.\\* parameters ar Example: `/dev/vd1` |
| `diskName` | string | No | The name of data disk N. The name must be 2 to 128 characters in length. The name must start with a  Example: `cloud_ssdData` |
| `encryptAlgorithm` | string | No | >  This parameter is not publicly available. Example: `null` |
| `encrypted` | boolean | No | Specifies whether to encrypt data disk N. Valid values: Example: `false` |
| `kmsKeyId` | string | No | The ID of the Key Management Service (KMS) key to use for data disk N. When both LaunchTemplateId an Example: `0e478b7a-4262-4802-b8cb-00d3fb40****` |
| `performanceLevel` | string | No | The performance level of the Enterprise SSD (ESSD) to use as data disk N. The value of N in this par Example: `PL1` |
| `provisionedIops` | number | No | The provisioned read/write IOPS of the ESSD AutoPL disk to use as the system disk. Valid values: 0 t Example: `40000` |
| ... | ... | ... | *98 more optional parameters* |

## deleteAutoProvisioningGroup

**Signature:** `deleteAutoProvisioningGroup(request: DeleteAutoProvisioningGroupRequest)`

Deletes an auto provisioning group. When you call this operation, you can specify AutoProvisioningGroupId and TerminateInstances in the request..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoProvisioningGroupId` | string | Yes | The ID of the auto provisioning group. Example: `apg-bpuf6jel2bbl62wh13****` |
| `regionId` | string | Yes | The region ID of the auto provisioning group. Example: `cn-hangzhou` |
| `terminateInstances` | boolean | No | Specifies whether to release instances in the auto provisioning group. Valid values: Example: `true` |

## describeAutoProvisioningGroups

**Signature:** `describeAutoProvisioningGroups(request: DescribeAutoProvisioningGroupsRequest)`

Queries information about one or more auto provisioning groups..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N that is added to the auto provisioning group. Example: `TestKey` |
| `value` | string | No | The value of tag N that is added to the auto provisioning group. Example: `TestValue` |
| `autoProvisioningGroupId` | string[] | No | The ID of the auto provisioning group. You can specify up to 20 IDs. Example: `apg-sn54avj8htgvtyh8****` |
| `autoProvisioningGroupName` | string | No | The name of the auto provisioning group. Example: `testAutoProvisioningGroupName` |
| `autoProvisioningGroupStatus` | string[] | No | The status of the auto provisioning group. Example: `active` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `2` |
| `regionId` | string | Yes | The region ID of the auto provisioning group. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the auto provisioning group belongs. Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribeAutoProvisioningGroupsRequestTag[] | No | - |

## describeAutoProvisioningGroupInstances

**Signature:** `describeAutoProvisioningGroupInstances(request: DescribeAutoProvisioningGroupInstancesRequest)`

Queries information about Elastic Compute Service (ECS) instances in an auto provisioning group..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoProvisioningGroupId` | string | Yes | The ID of the auto provisioning group. Example: `apg-uf6jel2bbl62wh13****` |
| `ownerAccount` | string | No | - Example: `123456` |
| `ownerId` | number | No | - Example: `123456` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the auto provisioning group. You can call the [DescribeRegions](https://help.aliyun Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `123456` |
| `resourceOwnerId` | number | No | - Example: `123456` |

## describeAutoProvisioningGroupHistory

**Signature:** `describeAutoProvisioningGroupHistory(request: DescribeAutoProvisioningGroupHistoryRequest)`

Queries the scheduling tasks of an auto provisioning group..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoProvisioningGroupId` | string | Yes | The ID of the auto provisioning group. Example: `apg-bp67acfmxazb4p****` |
| `endTime` | string | No | The end of the time range of the queried data. The time follows the [ISO 8601](https://help.aliyun.c Example: `2019-06-20T15:10:20Z` |
| `ownerAccount` | string | No | - Example: `123456` |
| `ownerId` | number | No | - Example: `123456` |
| `pageNumber` | number | No | The page number of the returned page. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `5` |
| `regionId` | string | Yes | The region ID of the auto provisioning group. Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `123456` |
| `resourceOwnerId` | number | No | - Example: `123456` |
| `startTime` | string | No | The beginning of the time range of the queried data. The time follows the [ISO 8601](https://help.al Example: `2019-04-01T15:10:20Z` |

## modifyAutoProvisioningGroup

**Signature:** `modifyAutoProvisioningGroup(request: ModifyAutoProvisioningGroupRequest)`

Before you call this operation, take note of the following items: *   If you modify the capacity or capacity-related settings of an auto-provisioning group, the group executes a scheduling task after .

**Parameters:** (1 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceType` | string | No | The instance type in extended configuration N. Valid values of N: 1 to 20. For more information abou Example: `ecs.g5.large` |
| `maxPrice` | number | No | The maximum price of spot instances in extended configuration N. Example: `3` |
| `priority` | number | No | The priority of extended configuration N. A value of 0 indicates the highest priority. The value mus Example: `1` |
| `vSwitchId` | string | No | The ID of the vSwitch in extended configuration N. The zone of the instances created from the extend Example: `vsw-sn5bsitu4lfzgc5o7****` |
| `weightedCapacity` | number | No | The weight of the instance type specified in the extended configuration. A greater weight indicates  Example: `2` |
| `autoProvisioningGroupId` | string | No | The auto-provisioning group ID. Example: `apg-bp67acfmxazb4ph****` |
| `autoProvisioningGroupName` | string | No | The name of the auto-provisioning group. The name must be 2 to 128 characters in length. It must sta Example: `apg-test` |
| `defaultTargetCapacityType` | string | No | The type of supplemental instances. When the sum of the PayAsYouGoTargetCapacity and SpotTargetCapac Example: `Spot` |
| `excessCapacityTerminationPolicy` | string | No | Specifies whether to release the removed instances when the real-time capacity of the auto-provision Example: `no-termination` |
| `launchTemplateConfig` | ModifyAutoProvisioningGroupRequestLaunchTemplateConfig[] | No | - |
| `maxSpotPrice` | number | No | The maximum price of spot instances in the auto-provisioning group. Example: `0.5` |
| `payAsYouGoTargetCapacity` | string | No | The target capacity of pay-as-you-go instances in the auto-provisioning group. Valid values: Set thi Example: `30` |
| `regionId` | string | Yes | The region ID of the auto-provisioning group. You can call the [DescribeRegions](https://help.aliyun Example: `cn-hangzhou` |
| `spotTargetCapacity` | string | No | The target capacity of spot instances in the auto-provisioning group. Valid values: Set this paramet Example: `30` |
| `terminateInstancesWithExpiration` | boolean | No | Specifies whether to release instances that are located in the auto-provisioning group after the gro Example: `false` |
| `totalTargetCapacity` | string | No | The total target capacity of the auto-provisioning group. The value must be a positive integer. Example: `70` |

## createElasticityAssurance

**Signature:** `createElasticityAssurance(request: CreateElasticityAssuranceRequest)`

Elasticity Assurance provides a new method to purchase and use guaranteed resources in a flexible manner. Elasticity Assurance is a resource reservation service that provides assured access to resourc.

**Parameters:** (3 required, 21 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `matchCriteria` | string | No | The type of the private pool with which you want to associate the elasticity assurance. Valid values Example: `Open` |
| `name` | string | No | The name of the elasticity assurance. The name must be 2 to 128 characters in length. It must start  Example: `eapTestName` |
| `endHour` | number | No | The end time of the assurance period for the capacity reservation. Specify an on-the-hour point in t Example: `10` |
| `recurrenceType` | string | No | The type of the assurance schedule. Valid values: Example: `Daily` |
| `recurrenceValue` | string | No | The days of the week or month on which the capacity reservation takes effect or the interval, in num Example: `1` |
| `startHour` | number | No | The start time of the assurance period for the capacity reservation. Specify an on-the-hour point in Example: `4` |
| `key` | string | No | The key of tag N to add to the elasticity assurance. Valid values of N: 1 to 20. The tag key cannot  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the elasticity assurance. Valid values of N: 1 to 20. The tag value can Example: `TestValue` |
| `assuranceTimes` | string | No | The total number of times that the elasticity assurance can be used. Set the value to Unlimited. Thi Example: `Unlimited` |
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal for the elasticity assurance. Valid values: Example: `true` |
| `autoRenewPeriod` | number | No | The auto-renewal period. Unit: month. Valid values: 1, 2, 3, 6, 12, 24, and 36. Example: `1` |
| `clientToken` | string | No | The client token that you want to use to ensure the idempotence of the request. You can use the clie Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `description` | string | No | The description of the elasticity assurance. The description must be 2 to 256 characters in length.  Example: `This` |
| `instanceAmount` | number | No | The total number of instances of an instance type for which you want to reserve capacity. Example: `2` |
| `instanceCpuCoreCount` | number | No | > This parameter is no longer used. Example: `null` |
| `instanceType` | string[] | Yes | The instance type. An elasticity assurance can be created to reserve the capacity of a single instan Example: `ecs.c6.xlarge` |
| `period` | number | No | The validity period of the elasticity assurance. The unit of the validity period is determined by th Example: `1` |
| `periodUnit` | string | No | The unit of the validity period of the elasticity assurance. Valid values: Example: `Year` |
| `recurrenceRules` | CreateElasticityAssuranceRequestRecurrenceRules[] | No | The assurance schedules based on which the capacity reservation takes effect. |
| `regionId` | string | Yes | The ID of the region in which to create the elasticity assurance. You can call the [DescribeRegions] Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the elasticity assurance. Example: `rg-bp67acfmxazb4p****` |
| `startTime` | string | No | The time when the elasticity assurance takes effect. The default value is the time when the CreateEl Example: `2020-10-30T06:32:00Z` |
| `tag` | CreateElasticityAssuranceRequestTag[] | No | - |
| `zoneId` | string[] | Yes | The ID of the zone in which to create the elasticity assurance. An elasticity assurance can be used  Example: `cn-hangzhou-h` |

## describeElasticityAssurances

**Signature:** `describeElasticityAssurances(request: DescribeElasticityAssurancesRequest)`

Queries the details of elasticity assurances..

**Parameters:** (1 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | No | The IDs of the elasticity assurances. The value can be a JSON array that consists of up to 100 elast Example: `["eap-bp67acfmxazb4****",` |
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. Example: `TestValue` |
| `instanceChargeType` | string | No | The billing method of the instance. Set the value to PostPaid. Only pay-as-you-go instances can be c Example: `PostPaid` |
| `instanceType` | string | No | The instance type. Example: `ecs.c6.large` |
| `maxResults` | number | No | The maximum number of entries to return on each page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the request to retrieve a new page of results. You must specify Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `packageType` | string | No | The type of the elasticity assurance. Valid values: Example: `ElasticityAssurance` |
| `platform` | string | No | > This parameter is deprecated. Example: `null` |
| `regionId` | string | Yes | The region ID of the elasticity assurances. You can call the [DescribeRegions](https://help.aliyun.c Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. If you configure this parameter to query resources, up to 1,000 resour Example: `rg-bp67acfmxazb4p****` |
| `status` | string | No | The status of the elasticity assurance. Valid values: Example: `Active` |
| `tag` | DescribeElasticityAssurancesRequestTag[] | No | - |
| `zoneId` | string | No | The zone ID of the elasticity assurances. Example: `cn-hangzhou-h` |

## describeElasticityAssuranceInstances

**Signature:** `describeElasticityAssuranceInstances(request: DescribeElasticityAssuranceInstancesRequest)`

When an elasticity assurance expires, data about the association between the instances and the private pool generated by the elasticity assurance becomes invalid. When you call this operation to query.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the elasticity assurance. Example: `eap-bp67acfmxazb4****` |
| `maxResults` | number | No | The number of entries to return on each page. Example: `10` |
| `nextToken` | string | No | The token used to start the query. Set the value to the NextToken value obtained from the response t Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the elasticity assurance. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |

## modifyElasticityAssurance

**Signature:** `modifyElasticityAssurance(request: ModifyElasticityAssuranceRequest)`

Modifies information about an elasticity assurance, including the name, description, and capacity. Only capacity scale-in is supported ..

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the elasticity assurance. Example: `eap-bp67acfmxazb4****` |
| `name` | string | No | The name of the elasticity assurance. The name must be 2 to 128 characters in length. The name must  Example: `eapTestName` |
| `endHour` | number | No | The end time of the assurance period for the capacity reservation of the time-segmented elasticity a Example: `10` |
| `recurrenceType` | string | No | The type of the assurance schedule. Valid values: Example: `Daily` |
| `recurrenceValue` | string | No | The days of the week or month on which the capacity reservation of the time-segmented elasticity ass Example: `5` |
| `startHour` | number | No | The start time of the assurance period for the capacity reservation of the time-segmented elasticity Example: `4` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the elasticity assurance. The description must be 2 to 256 characters in length a Example: `This` |
| `instanceAmount` | number | No | The total number of instances for which you want to reserve capacity. Valid values: the number of cr Example: `10` |
| `recurrenceRules` | ModifyElasticityAssuranceRequestRecurrenceRules[] | No | The assurance schedules of the time-segmented elasticity assurance. |
| `regionId` | string | Yes | The region ID of the elasticity assurance. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |

## renewElasticityAssurances

**Signature:** `renewElasticityAssurances(request: RenewElasticityAssurancesRequest)`

Renews elasticity assurances that you purchased..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string[] | No | The IDs of elasticity assurances. |
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Valid values: Example: `true` |
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal for the elasticity assurance. Valid values: Example: `true` |
| `autoRenewPeriod` | number | Yes | The auto-renewal period. Unit: month. Valid values: 1, 2, 3, 6, 12, 24, and 36. Example: `1` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `period` | number | No | The renewal duration. The unit of the renewal duration is determined by the `PeriodUnit` value. Vali Example: `1` |
| `periodUnit` | string | No | The unit of the renewal duration. Valid values: Example: `Year` |
| `regionId` | string | No | The region ID of the elasticity assurance. Example: `cn-hangzhou` |

## createCapacityReservation

**Signature:** `createCapacityReservation(request: CreateCapacityReservationRequest)`

When you create a capacity reservation, you can specify attributes such as a zone and an instance type. The system uses a private pool to reserve resources that match the specified attributes. For mor.

**Parameters:** (4 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `matchCriteria` | string | No | The type of the private pool to generate after the capacity reservation takes effect. Valid values: Example: `Open` |
| `name` | string | No | The capacity reservation name. The name must be 2 to 128 characters in length. It must start with a  Example: `crpTestName` |
| `key` | string | No | The key of tag N to add to the capacity reservation. Valid values of N: 1 to 20. The tag key cannot  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the capacity reservation. Valid values of N: 1 to 20. The tag value can Example: `TestValue` |
| `clientToken` | string | No | The client token that is used to ensure the idempotency of the request. You can use the client to ge Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `description` | string | No | The description of the capacity reservation. The description must be 2 to 256 characters in length a Example: `This` |
| `endTime` | string | No | The time when the capacity reservation expires. Specify the time in the ISO 8601 standard in the `yy Example: `2021-10-30T06:32:00Z` |
| `endTimeType` | string | No | The release mode of the capacity reservation. Valid values: Example: `Unlimited` |
| `instanceAmount` | number | Yes | The total number of instances for which the capacity of an instance type is reserved. Example: `2` |
| `instanceType` | string | Yes | The instance type. You can create a capacity reservation to reserve the capacity of only one instanc Example: `ecs.g6.xlarge` |
| `platform` | string | No | The operating system of the image used by the instance. This parameter corresponds to the `Platform` Example: `Linux` |
| `regionId` | string | Yes | The ID of the region in which to create the capacity reservation. You can call the [DescribeRegions] Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which you want to assign the capacity reservation. Example: `rg-bp67acfmxazb4p****` |
| `startTime` | string | No | The mode in which the capacity reservation takes effect. You can call the CreateCapacityReservation  Example: `2021-10-30T05:32:00Z` |
| `tag` | CreateCapacityReservationRequestTag[] | No | - |
| `zoneId` | string[] | Yes | The ID of the zone in which you want to create the capacity reservation. A capacity reservation can  Example: `cn-hangzhou-h` |

## describeCapacityReservations

**Signature:** `describeCapacityReservations(request: DescribeCapacityReservationsRequest)`

Queries the details of capacity reservations..

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | No | The IDs of capacity reservations. The value can be a JSON array that consists of up to 100 capacity  Example: `["crp-bp1gubrkqutenqdd****",` |
| `key` | string | No | The key of tag N of the capacity reservation. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the capacity reservation. Valid values of N: 1 to 20. Example: `TestValue` |
| `instanceChargeType` | string | No | The billing method of the instance. Valid values: Example: `PostPaid` |
| `instanceType` | string | No | The instance type of the capacity reservation. You can specify this parameter to query only effectiv Example: `ecs.c6.large` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `platform` | string | No | The operating system of the instance. Valid values: Example: `linux` |
| `regionId` | string | Yes | The region ID of the capacity reservation. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the capacity reservation belongs. If you specify this paramete Example: `rg-bp67acfmxazb4p****` |
| `status` | string | No | The status of the capacity reservation. Valid values: Example: `Active` |
| `tag` | DescribeCapacityReservationsRequestTag[] | No | - |
| `zoneId` | string | No | The zone ID of the capacity reservation. Example: `cn-hangzhou-h` |

## describeCapacityReservationInstances

**Signature:** `describeCapacityReservationInstances(request: DescribeCapacityReservationInstancesRequest)`

Queries the Elastic Compute Service (ECS) instances that match a capacity reservation..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the capacity reservation. Example: `crp-bp67acfmxazb4****` |
| `maxResults` | number | No | The number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the capacity reservation. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |

## modifyCapacityReservation

**Signature:** `modifyCapacityReservation(request: ModifyCapacityReservationRequest)`

Modifies the information of a capacity reservation, including the name, description, release mode, and the total number of Elastic Compute Service (ECS) instances for which capacity is reserved..

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The capacity reservation ID. Example: `crp-bp67acfmxazb4****` |
| `name` | string | No | The name of the capacity reservation. The name must be 2 to 128 characters in length. It must start  Example: `eapTestName` |
| `description` | string | No | The description of the capacity reservation. The description must be 2 to 256 characters in length.  Example: `This` |
| `endTime` | string | No | The expiration time of the capacity reservation. This parameter takes effect only when `EndTimeType` Example: `2021-10-30T06:32:00Z` |
| `endTimeType` | string | No | The release mode of the capacity reservation. Valid values: Example: `Unlimited` |
| `instanceAmount` | number | No | The total number of instances for which capacity is reserved. Valid values: the number of used insta Example: `100` |
| `platform` | string | No | The operating system of the image used by the instance. Valid values: Example: `Linux` |
| `regionId` | string | Yes | The region ID of the capacity reservation. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |
| `startTime` | string | No | The mode in which the capacity reservation takes effect. Only immediate capacity reservations are su Example: `Now` |

## purchaseElasticityAssurance

**Signature:** `purchaseElasticityAssurance(request: PurchaseElasticityAssuranceRequest)`

Before you call this operation, familiarize yourself with the billing rules and [pricing](https://www.alibabacloud.com/zh?spm=5176.28117011.nav-v2-dropdown-language.exp-location-zh.9ae4165bF98IHz&_p_l.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the elasticity assurance. Example: `eap-bp67acfmxazb4****` |
| `matchCriteria` | string | No | The type of the private pool with which you want to associate the elasticity assurance. Valid values Example: `Open` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `period` | number | No | The validity period of the elasticity assurance. The unit of the validity period is determined by th Example: `1` |
| `periodUnit` | string | No | The unit of the validity period of the elasticity assurance. Valid values: Example: `Month` |
| `regionId` | string | Yes | The ID of the region in which to purchase the elasticity assurance. You can call the [DescribeRegion Example: `cn-hangzhou` |
| `startTime` | string | No | The time when the elasticity assurance takes effect. The default value is the time when the elastici Example: `2024-06-18T00:00Z` |

## describeElasticityAssuranceAutoRenewAttribute

**Signature:** `describeElasticityAssuranceAutoRenewAttribute(request: DescribeElasticityAssuranceAutoRenewAttributeRequest)`

Queries the auto-renewal attribute of elasticity assurances..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string[] | No | The IDs of elasticity assurances. |
| `regionId` | string | Yes | The region ID of the elasticity assurance. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |

## modifyElasticityAssuranceAutoRenewAttribute

**Signature:** `modifyElasticityAssuranceAutoRenewAttribute(request: ModifyElasticityAssuranceAutoRenewAttributeRequest)`

Modifies the auto-renewal attribute of elasticity assurances..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string[] | No | The IDs of elasticity assurances. |
| `period` | number | No | The auto-renewal period for the elasticity assurance. Example: `1` |
| `periodUnit` | string | No | The unit of the renewal duration. Valid values: Example: `Month` |
| `regionId` | string | Yes | The ID of the region to which the elasticity assurance belongs. You can call the [DescribeRegions](h Example: `cn-hangzhou` |
| `renewalStatus` | string | No | The auto-renewal status of the elasticity assurance. Valid values: Example: `Normal` |

## releaseCapacityReservation

**Signature:** `releaseCapacityReservation(request: ReleaseCapacityReservationRequest)`

If the release mode of a capacity reservation that takes effect immediately is set to manual release, you can call this operation to release the capacity reservation..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the capacity reservation. Example: `crp-bp67acfmxazb4****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Set the value to Example: `false` |
| `regionId` | string | Yes | The region ID of the capacity reservation. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |

## purchaseStorageCapacityUnit

**Signature:** `purchaseStorageCapacityUnit(request: PurchaseStorageCapacityUnitRequest)`

*Before you call this operation, make sure that you understand the [billing methods](https://help.aliyun.com/document_detail/137897.html) and [pricing](https://www.alibabacloud.com/zh/pricing-calculat.

**Parameters:** (2 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the SCU. The tag key cannot be an empty string. The tag key can be up to  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the SCU. The tag value can be an empty string. The tag value can be up  Example: `TestValue` |
| `amount` | number | No | The number of SCUs that you want to purchase. Valid values: 1 to 20. Example: `1` |
| `capacity` | number | Yes | The capacity of the SCU. Unit: GiB. Valid values: 20, 40, 100, 200, 500, 1024, 2048, 5210, 10240, 20 Example: `20` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the SCU. The description must be 2 to 256 characters in length and cannot start w Example: `ScuPurchaseDemo` |
| `fromApp` | string | No | The source of the request. The value is automatically set to OpenAPI and does not need to be changed Example: `OpenAPI` |
| `name` | string | No | The name of the SCU. The name must be 2 to 128 characters in length. It must start with a letter and Example: `ScuPurchaseDemo` |
| `period` | number | No | The validity period of the SCU. Valid values: Example: `1` |
| `periodUnit` | string | No | The unit of the validity period of the SCU. Valid values: Example: `Month` |
| `regionId` | string | Yes | The ID of the region in which to purchase the SCU. The purchased SCU can offset the bills of pay-as- Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to add the SCU. You can specify only the IDs of the resource g Example: `rg-bp67acfmxazb4p****` |
| `startTime` | string | No | The time at which the SCU takes effect. The time can be up to 180 days from the creation time of the Example: `2020-09-09T02:00:00Z` |
| `tag` | PurchaseStorageCapacityUnitRequestTag[] | No | - |

