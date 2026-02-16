# Disk & Snapshot

Disk and snapshot lifecycle: create, attach, detach, resize, delete, and snapshot management.

## createDisk

**Signature:** `createDisk(request: CreateDiskRequest)`

You can enable the multi-attach (`MultiAttach`) feature when you create a disk. Before you enable the multi-attach feature, we recommend that you familiarize yourself with the feature and the limits o.

**Parameters:** (2 required, 26 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The ID of the region in which to create the disk. You can call the [DescribeRegions](https://help.al Example: `cn-hangzhou` |
| `size` | number | Yes | The size of the data disk. Unit: GiB. This parameter is required. Valid values for different disk ca Example: `2000` |
| `assumeRoleFor` | number | No | >  This parameter is not publicly available. Example: `1000000000` |
| `roleType` | string | No | >  This parameter is not publicly available. Example: `hide` |
| `rolearn` | string | No | >  This parameter is not publicly available. Example: `hide` |
| `key` | string | No | The key of tag N to add to the disk. Valid values of N: 1 to 20. The tag key cannot be an empty stri Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the disk. Valid values of N: 1 to 20. The tag value can be an empty str Example: `TestValue` |
| `advancedFeatures` | string | No | This parameter is not publicly available. Example: `hide` |
| `arn` | CreateDiskRequestArn[] | No | - |
| `burstingEnabled` | boolean | No | Specifies whether to enable the performance burst feature. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the disk. The description must be 2 to 256 characters in length and cannot start  Example: `testDescription` |
| `diskCategory` | string | No | The category of the data disk. Valid values for different disk categories: Example: `cloud_ssd` |
| `diskName` | string | No | The name of the data disk. The name must be 2 to 128 characters in length and can contain letters, d Example: `testDiskName` |
| `encryptAlgorithm` | string | No | This parameter is not publicly available. Example: `hide` |
| `encrypted` | boolean | No | Specifies whether to encrypt the disk. Valid values: Example: `false` |
| `instanceId` | string | No | The ID of the subscription instance to which to attach the subscription disk. Example: `i-bp18pnlg1ds9rky4****` |
| ... | ... | ... | *11 more optional parameters* |

## deleteDisk

**Signature:** `deleteDisk(request: DeleteDiskRequest)`

When you call this operation, take note of the following items: *   Manual snapshots of the disk are retained. *   You can call the [ModifyDiskAttribute](https://help.aliyun.com/document_detail/25517..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diskId` | string | Yes | The ID of the disk that you want to release. Example: `d-bp14k9cxvr5uzy5****` |

## describeDisks

**Signature:** `describeDisks(request: DescribeDisksRequest)`

You can specify multiple request parameters such as `RegionId`, `ZoneId`, `DiskIds`, and `InstanceId` as filters. The specified parameters are evaluated by using the "AND" operator. If you specify mor.

**Parameters:** (1 required, 32 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID of the disk. You can call the [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |
| `key` | string | No | The key of filter 1 used to query resources. Set the value to `CreationStartTime`. You can specify a Example: `CreationStartTime` |
| `value` | string | No | The value of filter 1 used to query resources. Set the value to a time. If you specify this paramete Example: `2017-12-05T22:40Z` |
| `key` | string | No | The key of tag N of the disk. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the disk. Valid values of N: 1 to 20. Example: `TestValue` |
| `additionalAttributes` | string[] | No | The additional attributes. Set the value to `Placement`, which indicates the data storage locations  Example: `IOPS` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy that is applied to the cloud disk. Example: `sp-m5e2w2jutw8bv31****` |
| `category` | string | No | The disk category. Valid values: Example: `all` |
| `deleteAutoSnapshot` | boolean | No | Specifies whether to delete the automatic snapshots of the cloud disk after the disk is released. Example: `false` |
| `deleteWithInstance` | boolean | No | Specifies whether the disk is released when the associated instance is released. Valid values: Example: `false` |
| `diskChargeType` | string | No | The billing method of the disk. Valid values: Example: `PostPaid` |
| `diskIds` | string | No | The IDs of cloud disks, local disks, or elastic ephemeral disks. The value is a JSON array that cons Example: `["d-bp67acfmxazb4p****",` |
| `diskName` | string | No | The name of the disk. The name must be 2 to 128 characters in length and can contain letters, digits Example: `testDiskName` |
| `diskType` | string | No | The type of the disk. Valid values: Example: `all` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run without performing the actual request. Valid values: Example: `false` |
| `enableAutoSnapshot` | boolean | No | Specifies whether the automatic snapshot policy feature is enabled for the cloud disk. Valid values: Example: `true` |
| ... | ... | ... | *17 more optional parameters* |

## describeDisksFullStatus

**Signature:** `describeDisksFullStatus(request: DescribeDisksFullStatusRequest)`

The full status information about an EBS device includes the lifecycle status specified by the `Status` parameter, health status specified by the `HealthStatus` parameter, and event type specified by .

**Parameters:** (1 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `end` | string | No | The end of the time range to query occurred events. Example: `2018-05-08T02:48:52Z` |
| `start` | string | No | The beginning of the time range to query occurred events. Example: `2018-05-06T02:43:10Z` |
| `key` | string | No | The key of tag N to add to the EBS device. A key-value pair consists of a key specified by the Tag.N Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the EBS device. A key-value pair consists of a key specified by the `Ta Example: `TestValue` |
| `diskId` | string[] | No | The ID of EBS device N. Valid values of N: 1 to 100. Example: `d-bp67acfmxazb4p****` |
| `eventId` | string[] | No | The ID of event N. Valid values of N: 1 to 100. Example: `e-bp67acfmxazb4p****` |
| `eventType` | string | No | The event type of the EBS device. Valid values: Example: `Stalled` |
| `healthStatus` | string | No | The health status of the EBS device. Valid values: Example: `Warning` |
| `pageNumber` | number | No | The page number. Pages start from page 1. The value must be a positive integer. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `regionId` | string | Yes | The region ID of the EBS device. You can call the [DescribeRegions](https://help.aliyun.com/document Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the EBS device belongs. If you configure this parameter to que Example: `rg-aek2kkmhmhs****` |
| `status` | string | No | The lifecycle status of the EBS device. For more information, see [Disk status](https://help.aliyun. Example: `Available` |
| `tag` | DescribeDisksFullStatusRequestTag[] | No | - |

## attachDisk

**Signature:** `attachDisk(request: AttachDiskRequest)`

Take note of the following items: *   The ECS instance and the disk must reside in the same zone. *   The disk must be in the **Unattached** (`Available`) state. *   When you attach the disk as a data.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bootable` | boolean | No | Specifies whether to attach the disk as the system disk. Valid values: Example: `false` |
| `deleteWithInstance` | boolean | No | Specifies whether to release the disk when the instance is released. Valid values: Example: `false` |
| `device` | string | No | The device name of the disk. Example: `testDeviceName` |
| `diskId` | string | Yes | The ID of the disk. The disk specified by `DiskId` and the instance specified by `InstanceId` must r Example: `d-bp1j4l5axzdy6ftk****` |
| `force` | boolean | No | Specifies whether to force attach the disk to the instance. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the instance to which you want to attach the disk. Example: `i-bp1dq5lozx5f4pmd****` |
| `keyPairName` | string | No | The name of the SSH key pair that you bind to the Linux instance when you attach the system disk. Example: `KeyPairTestName` |
| `password` | string | No | The password that is set when you attach the system disk. The password is applicable only to the adm Example: `EcsV587!` |

## detachDisk

**Signature:** `detachDisk(request: DetachDiskRequest)`

Take note of the following items: *   This operation is an asynchronous operation. After you call the operation to detach a disk from an ECS instance, the disk is detached in approximately 1 minute. *.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleteWithInstance` | boolean | No | Specifies whether to release the system disk or data disk when the instance from which you want to d Example: `false` |
| `diskId` | string | Yes | The ID of the disk that you want to detach. Example: `d-bp67acfmxazb4p****` |
| `instanceId` | string | Yes | The ID of the ECS instance from which you want to detach the disk. Example: `i-bp67acfmxazb4p****` |

## resizeDisk

**Signature:** `resizeDisk(request: ResizeDiskRequest)`

>  Before you call this operation to resize a disk, you must check the partition format of the disk. If the format is MBR, you cannot resize the file to more than 2TiB. Otherwise, data loss may occur..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The new disk capacity. Unit: GiB. Valid values: Example: `123e4567-e89b-12d3-a456-426655440000` |
| `diskId` | string | Yes | The ID of the disk. You can call the [DescribeDisks](https://help.aliyun.com/document_detail/25514.h Example: `d-bp67acfmxazb4p****` |
| `newSize` | number | Yes | The new disk capacity. Unit: GiB. Valid values: Example: `1900` |
| `type` | string | No | The method that you want to use to resize the disk. Valid values: Example: `offline` |

## resetDisk

**Signature:** `resetDisk(request: ResetDiskRequest)`

Before you call this operation, read [Roll back a disk by using a snapshot](https://help.aliyun.com/document_detail/25450.html). Take note of the following items: *   The cloud disk that you want to r.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diskId` | string | Yes | The ID of the cloud disk that you want to roll back. Example: `d-bp199lyny9b3****` |
| `dryRun` | boolean | No | Specifies whether to check the validity of the request without actually making the request. Valid va Example: `false` |
| `snapshotId` | string | Yes | The ID of the snapshot that you want to use to roll back the cloud disk. Example: `s-bp199lyny9b3****` |

## resetDisks

**Signature:** `resetDisks(request: ResetDisksRequest)`

This operation will be removed in the future. We recommend that you call the [ResetDisk](https://help.aliyun.com/document_detail/25520.html) operation to roll back a disk..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diskId` | string | No | The ID of the disk that you want to roll back. You can specify up to 10 disk IDs. Example: `d-j6cf7l0ewidb78lq****` |
| `snapshotId` | string | No | The ID of the disk snapshot that is contained in the instance snapshot. You can specify up to 10 dis Example: `s-j6cdofbycydvg7ey****` |
| `disk` | ResetDisksRequestDisk[] | Yes | The disks that you want to roll back. |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## modifyDiskAttribute

**Signature:** `modifyDiskAttribute(request: ModifyDiskAttributeRequest)`

You can use `DiskId` to specify a block storage device and modify the attributes of the device, such as the name and description of the device and whether to release the device together with the assoc.

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `burstingEnabled` | boolean | No | Specifies whether to enable performance burst for the disk if the disk supports performance burst. V Example: `false` |
| `deleteAutoSnapshot` | boolean | No | Specifies whether to delete the automatic snapshots of the disk when the disk is released. Valid val Example: `false` |
| `deleteWithInstance` | boolean | No | Specifies whether to release the disk together with the associated instance. This parameter is empty Example: `false` |
| `description` | string | No | The description of the disk. The description must be 2 to 256 characters in length. It cannot start  Example: `TestDescription` |
| `diskId` | string | No | The ID of the disk whose attributes you want to modify. Example: `d-bp1famypsnar20bv****` |
| `diskIds` | string[] | No | The IDs of the disks whose attributes you want to modify. Valid values of N: 0 to 100. Example: `d-bp1famypsnar20bv****` |
| `diskName` | string | No | The name of the disk. The name must be 2 to 128 characters in length and can contain Unicode charact Example: `MyDiskName` |
| `enableAutoSnapshot` | boolean | No | Specifies whether to enable the automatic snapshot policy feature. Valid values: Example: `true` |
| `regionId` | string | No | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |

## modifyDiskChargeType

**Signature:** `modifyDiskChargeType(request: ModifyDiskChargeTypeRequest)`

For information about how to change the billing method of cloud disks, see [Change the billing methods of a disk](https://help.aliyun.com/document_detail/145018.html). Take note of the following items.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to automatically complete the payment. Valid values: Example: `true` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `diskChargeType` | string | No | The new billing method of the disk. Valid values: Example: `PostPaid` |
| `diskIds` | string | Yes | The IDs of disks. The value is a JSON array that consists of up to 16 disk IDs. Separate the disk ID Example: `[“d-bp67acfmxazb4ph****”,` |
| `instanceId` | string | Yes | The ID of the instance to which disks are attached. Example: `i-bp1i778bq705cvx1****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## modifyDiskSpec

**Signature:** `modifyDiskSpec(request: ModifyDiskSpecRequest)`

To minimize impacts on your business, change the disk categories or performance levels of cloud disks during off-peak hours. Take note of the following items: *   To change the performance level of an.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `IOPS` | number | No | The new IOPS rate of the cloud disk. You can modify the IOPS rate of only cloud disks in dedicated b Example: `2000` |
| `recover` | string | No | Specifies whether to reset the IOPS rate and throughput of the cloud disk. This parameter takes effe Example: `All` |
| `throughput` | number | No | The new throughput of the cloud disk. You can change the throughput of only cloud disks in dedicated Example: `200` |
| `destinationZoneId` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `cn-hangzhou-g` |
| `diskCategory` | string | No | The new disk category of the cloud disk. Valid values: Example: `cloud_essd` |
| `diskId` | string | Yes | The disk ID. Example: `d-bp131n0q38u3a4zi****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `performanceControlOptions` | ModifyDiskSpecRequestPerformanceControlOptions | No | - |
| `performanceLevel` | string | No | The new performance level of the ESSD. Valid values: Example: `PL2` |
| `provisionedIops` | number | No | The provisioned read/write IOPS of the ESSD AutoPL disk. Example: `50000` |

## resetDiskDefaultKMSKeyId

**Signature:** `resetDiskDefaultKMSKeyId(request: ResetDiskDefaultKMSKeyIdRequest)`

You must grant the RAM user the `AliyunECSFullAccess` permissions. For information about how to grant permissions to a RAM user, see [Grant permissions to a RAM user](https://help.aliyun.com/document_.

**Parameters:** See `ResetDiskDefaultKMSKeyIdRequest` model.

## createSnapshot

**Signature:** `createSnapshot(request: CreateSnapshotRequest)`

The local snapshot feature is replaced by the instant access feature. Take note of the following items: *   If you have used the local snapshot feature before December 14, 2020, you can use `Category`.

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the snapshot. Valid values of N: 1 to 20. The tag key cannot be an empty  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the snapshot. Valid values of N: 1 to 20. The tag value can be an empty Example: `TestValue` |
| `category` | string | No | The category of the snapshot. Valid values: Example: `Standard` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the snapshot. The description must be 2 to 256 characters in length and cannot st Example: `testDescription` |
| `diskId` | string | Yes | The ID of the cloud disk. Example: `d-bp1s5fnvk4gn2tws0****` |
| `instantAccess` | boolean | No | Specifies whether to enable the instant access feature. Valid values: Example: `false` |
| `instantAccessRetentionDays` | number | No | The validity period of the instant access feature. When the validity period ends, the feature is dis Example: `1` |
| `resourceGroupId` | string | No | The snapshot type. Valid values: Example: `rg-bp67acfmxazb4p****` |
| `retentionDays` | number | No | The retention period of the snapshot. Unit: days. Valid values: 1 to 65536. After the retention peri Example: `30` |
| `snapshotName` | string | No | The name of the snapshot. The name must be 2 to 128 characters in length and start with a letter. Th Example: `testSnapshotName` |
| `storageLocationArn` | string | No | > This parameter is unavailable for public use. Example: `null` |
| `tag` | CreateSnapshotRequestTag[] | No | - |

## createSnapshotGroup

**Signature:** `createSnapshotGroup(request: CreateSnapshotGroupRequest)`

You can specify `InstanceId` to create a snapshot-consistent group for disks on a specific ECS instance. You can also specify `DiskId.N` to create a snapshot-consistent group for multiple disks on mul.

**Parameters:** (1 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the snapshot-consistent group. Valid values of N: 1 to 20. The tag key cannot be Example: `TestKey` |
| `value` | string | No | The value of tag N of the snapshot-consistent group. Valid values of N: 1 to 20. The tag value can b Example: `TestValue` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the snapshot-consistent group. The description must be 2 to 256 characters in len Example: `This` |
| `diskId` | string[] | No | The IDs of the cloud disks for which you want to create a snapshot-consistent group. You can specify |
| `excludeDiskId` | string[] | No | The IDs of the cloud disks for which you do not want to create snapshots. After you specify the IDs  Example: `d-j6cf7l0ewidb78lq****` |
| `instanceId` | string | No | The instance ID. Example: `i-j6ca469urv8ei629****` |
| `instantAccess` | boolean | No | Specifies whether to enable the instant access feature. Valid values: Example: `false` |
| `instantAccessRetentionDays` | number | No | The number of days for which the instant access feature is available. Unit: days. Valid values: 1 to Example: `1` |
| `name` | string | No | The name of the snapshot-consistent group. The name must be 2 to 128 characters in length. The name  Example: `testName` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the snapshot-consistent group belongs. Example: `rg-bp67acfmxazb4p****` |
| `storageLocationArn` | string | No | > This parameter is unavailable for public use. Example: `null` |
| `tag` | CreateSnapshotGroupRequestTag[] | No | - |

## deleteSnapshot

**Signature:** `deleteSnapshot(request: DeleteSnapshotRequest)`

Take note of the following items: *   If the snapshot does not exist, the request is ignored. *   If the snapshot has been used to create custom images, the snapshot cannot be deleted. You need to cal.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `force` | boolean | No | Specifies whether to force delete the snapshot that has been used to create cloud disks. Valid value Example: `false` |
| `snapshotId` | string | Yes | The snapshot ID. Example: `s-bp1c0doj0taqyzzl****` |

## deleteSnapshotGroup

**Signature:** `deleteSnapshotGroup(request: DeleteSnapshotGroupRequest)`

If a disk snapshot that is contained in a snapshot-consistent group has been used to create a custom image, the disk snapshot is retained after the snapshot-consistent group is deleted. Before you can.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the snapshot-consistent group. You can call the [DescribeRegions](https://help.aliy Example: `cn-hangzhou` |
| `snapshotGroupId` | string | Yes | The ID of the snapshot-consistent group. You can call the [DescribeSnapshotGroups](https://help.aliy Example: `ssg-j6c9lpuyxo2uxxny****` |

## describeSnapshots

**Signature:** `describeSnapshots(request: DescribeSnapshotsRequest)`

You can specify multiple request parameters, such as `InstanceId`, `DiskId`, and `SnapshotIds`, to query snapshots. The specified parameters have logical AND relations. Only the specified parameters a.

**Parameters:** (1 required, 23 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of filter 1 that is used to query resources. Set the value to `CreationStartTime`. You can s Example: `CreationStartTime` |
| `value` | string | No | The value of filter 1 that is used to query resources. Set the value to a time. If you configure thi Example: `2019-12-13T17:00Z` |
| `key` | string | No | The key of tag N of the snapshot. Valid values of N: 1 to 20 Example: `TestKey` |
| `value` | string | No | The value of tag N of the snapshot. Valid values of N: 1 to 20. Example: `TestValue` |
| `category` | string | No | The category of the snapshot. Valid values: Example: `Standard` |
| `diskId` | string | No | The disk ID. Example: `d-bp67acfmxazb4p****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `encrypted` | boolean | No | Specifies whether the snapshot is encrypted. Default value: false. Example: `false` |
| `instanceId` | string | No | The ID of the instance whose cloud disk snapshots you want to query. Example: `i-bp67acfmxazb4p****` |
| `KMSKeyId` | string | No | The ID of the Key Management Service (KMS) key that is used for the data disk. Example: `0e478b7a-4262-4802-b8cb-00d3fb40****` |
| `maxResults` | number | No | The number of entries per page. Maximum value: 100 Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `regionId` | string | Yes | The region ID of the disk. You can call the [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. If you configure this parameter to query resources, up to 1,000 resources tha Example: `rg-bp67acfmxazb4p****` |
| `snapshotIds` | string | No | The IDs of snapshots. You can specify a JSON array that consists of up to 100 snapshot IDs. Separate Example: `["s-bp67acfmxazb4p****",` |
| `snapshotLinkId` | string | No | The snapshot chain ID. You can specify a JSON array that contains up to 100 snapshot chain IDs. Sepa Example: `["sl-bp1grgphbcc9brb5****",` |
| `snapshotName` | string | No | The name of the snapshot. Example: `testSnapshotName` |
| `snapshotType` | string | No | The type of the snapshot. Valid values: Example: `all` |
| `sourceDiskType` | string | No | The source disk type of the snapshot. Valid values: Example: `Data` |
| `status` | string | No | The status of the snapshot. Valid values: Example: `all` |
| `tag` | DescribeSnapshotsRequestTag[] | No | - |
| `usage` | string | No | Specifies whether the snapshot has been used to create custom images or disks. Valid values: Example: `none` |

## describeSnapshotGroups

**Signature:** `describeSnapshotGroups(request: DescribeSnapshotGroupsRequest)`

You can specify multiple request parameters to be queried, such as `InstanceId`, `SnapshotGroupId.N`, and `Status.N`. Specified parameters have logical AND relations. Only the specified parameters are.

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the snapshot-consistent group. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the snapshot-consistent group. Valid values of N: 1 to 20. Example: `TestValue` |
| `additionalAttributes` | string[] | No | This parameter is not publicly available. Example: `hide` |
| `instanceId` | string | No | The ID of the instance. Example: `i-j6ca469urv8ei629****` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `name` | string | No | The name of the snapshot-consistent group. Example: `testName` |
| `nextToken` | string | No | The token that determines the start point of the next query. Set the value to the NextToken value th Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the snapshot-consistent group. You can call the [DescribeRegions](https://help.aliy Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the snapshot-consistent group belongs. Example: `rg-bp67acfmxazb4p****` |
| `snapshotGroupId` | string[] | No | The ID of snapshot-consistent group N. Valid values of N: 1 to 10. Example: `ssg-j6ciyh3k52qp7ovm****` |
| `status` | string[] | No | The state of snapshot-consistent group N. Valid values of the second N: 1, 2, and 3. Valid values: Example: `accomplished` |
| `tag` | DescribeSnapshotGroupsRequestTag[] | No | - |

## describeSnapshotLinks

**Signature:** `describeSnapshotLinks(request: DescribeSnapshotLinksRequest)`

## [](#)Usage notes Take note of the following items: *   You can specify multiple request parameters, such as `RegionId`, `DiskIds`, and `InstanceId`, to query snapshot chains. Specified parameters h.

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diskIds` | string | No | The disk IDs. You can specify a JSON array that contains a maximum of 100 disk IDs. Separate the dis Example: `["d-bp1d6tsvznfghy7y****",` |
| `instanceId` | string | No | The instance ID. Example: `i-bp1h6jmbefj2cyqs****` |
| `maxResults` | number | No | The maximum number of entries per page. Maximum value: 100. Default value: Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `caeba0bbb2be03f84eb48b699f0a****` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `50` |
| `regionId` | string | Yes | The region ID of the disk. You can call the [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |
| `snapshotLinkIds` | string | No | The snapshot chain IDs. You can specify a JSON array that contains a maximum of 100 snapshot chain I Example: `["sl-bp1grgphbcc9brb5****",` |

## describeSnapshotMonitorData

**Signature:** `describeSnapshotMonitorData(request: DescribeSnapshotMonitorDataRequest)`

## [](#)Usage notes Take note of the following items: *   Up to 400 monitoring data entries can be returned at a time. Make sure that the `TotalCount` value does not exceed 400. The value is calculate.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The type of the snapshot. Valid values: Example: `Standard` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com/docum Example: `2019-05-10T03:00:00Z` |
| `period` | number | No | The interval at which to query the monitoring data of snapshot sizes. Unit: seconds. Valid values: Example: `60` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com Example: `2019-05-10T00:00:00Z` |

## describeSnapshotPackage

**Signature:** `describeSnapshotPackage(request: DescribeSnapshotPackageRequest)`

Queries the Object Storage Service (OSS) storage plans that you purchased in an Alibaba Cloud region. OSS storage plans can be used to offset the storage fees for standard snapshots instead of local s.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: 1 to 100. Example: `10` |
| `regionId` | string | Yes | The ID of the request. Example: `cn-hangzhou` |

## modifySnapshotAttribute

**Signature:** `modifySnapshotAttribute(request: ModifySnapshotAttributeRequest)`

Modifies the name, description, or retention period of a snapshot..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The snapshot description. It can be empty or up to 256 characters in length. It cannot start with ht Example: `testDescription` |
| `disableInstantAccess` | boolean | No | Specifies whether to disable the instant access feature. Valid values: Example: `false` |
| `retentionDays` | number | No | The retention period of the snapshot. After you specify this parameter, the end time of the new rete Example: `10` |
| `snapshotId` | string | Yes | The ID of the snapshot. Example: `s-bp199lyny9bb47pa****` |
| `snapshotName` | string | No | The name of the snapshot. The name must be 2 to 128 characters in length. It must start with a lette Example: `testSnapshotName` |

## modifySnapshotGroup

**Signature:** `modifySnapshotGroup(request: ModifySnapshotGroupRequest)`

Modifies the name and description of a snapshot-consistent group..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The new description of the snapshot-consistent group. The description must be 2 to 256 characters in Example: `This` |
| `name` | string | No | The new name of the snapshot-consistent group. The name must be 2 to 128 characters in length. The n Example: `testName02` |
| `regionId` | string | Yes | The region ID of the snapshot-consistent group. You can call the [DescribeRegions](https://help.aliy Example: `cn-hangzhou` |
| `snapshotGroupId` | string | Yes | The ID of the snapshot-consistent group. You can call the [DescribeSnapshotGroups](https://help.aliy Example: `ssg-j6ciyh3k52qp7ovm****` |

## copySnapshot

**Signature:** `copySnapshot(request: CopySnapshotRequest)`

When you call this operation, take note of the following item: *   New snapshots (snapshot copies) cannot be used to roll back the disks for which source snapshots (copied snapshots) were created. *  .

**Parameters:** (5 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `assumeRoleFor` | number | No | > This parameter is not publicly available. Example: `0` |
| `roleType` | string | No | > This parameter is not publicly available. Example: `null` |
| `rolearn` | string | No | > This parameter is not publicly available. Example: `null` |
| `key` | string | No | The key of tag N to add to the new snapshot. The tag key cannot be an empty string. It can be up to  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the new snapshot. The tag value can be an empty string. It can be up to Example: `TestValue` |
| `arn` | CopySnapshotRequestArn[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `destinationRegionId` | string | Yes | The ID of the destination region to which to copy the source snapshot. Example: `us-east-1` |
| `destinationSnapshotDescription` | string | Yes | The description of the new snapshot. The description must be 2 to 256 characters in length and canno Example: `CopySnapshotDemo` |
| `destinationSnapshotName` | string | Yes | The name of the new snapshot. The name must be 2 to 128 characters in length. The name must start wi Example: `CopySnapshotDemo` |
| `destinationStorageLocationArn` | string | No | >  This parameter is not publicly available. Example: `null` |
| `encrypted` | boolean | No | Specifies whether to encrypt the new snapshot. Valid values: Example: `false` |
| `KMSKeyId` | string | No | The ID of the customer master key (CMK) in Key Management Service (KMS) in the destination region. Example: `0e478b7a-4262-4802-b8cb-00d3fb40****` |
| `regionId` | string | Yes | The region ID of the source snapshot. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-chengdu` |
| `resourceGroupId` | string | No | This parameter is not publicly available. Example: `rg-bp67acfmxazb4p****` |
| `retentionDays` | number | No | The retention period of the new snapshot. Unit: days. The new snapshot is automatically released whe Example: `60` |
| `snapshotId` | string | Yes | The ID of the source snapshot. Example: `s-bp67acfmxazb4p****` |
| `tag` | CopySnapshotRequestTag[] | No | - |

## unlockSnapshot

**Signature:** `unlockSnapshot(request: UnlockSnapshotRequest)`

Unlock snapshots that are locked in compliance mode but are still in a cooling-off period. If the snapshot is locked in compliance mode and the cooling-off period has ended, it cannot be unlocked..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | A client token that is used to ensure the idempotence of the request. You can use the client to gene Example: `5EC38E7D-389F-1925-ABE2-D7925A8F****` |
| `dryRun` | boolean | No | Specifies whether to perform the dry run. Valid values: Example: `false` |
| `ownerAccount` | string | No | - Example: `158704318252****` |
| `ownerId` | number | No | - Example: `158704318252****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/zh/ecs/developer-reference Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `158704318252****` |
| `resourceOwnerId` | number | No | - Example: `158704318252****` |
| `snapshotId` | string | Yes | The snapshot ID. Example: `s-9dp2qojdpdfmgfmf****` |

## createAutoSnapshotPolicy

**Signature:** `createAutoSnapshotPolicy(request: CreateAutoSnapshotPolicyRequest)`

Before you call this operation, learn about how to [create an automatic snapshot policy](https://help.aliyun.com/document_detail/127767.html). Take note of the following items: *   You can create up t.

**Parameters:** (4 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `assumeRoleFor` | number | No | >  This parameter is not publicly available. Example: `1000000000` |
| `roleType` | string | No | >  This parameter is not publicly available. Example: `hide` |
| `rolearn` | string | No | >  This parameter is not publicly available. Example: `hide` |
| `arn` | CreateAutoSnapshotPolicyRequestCopyEncryptionConfigurationArn[] | No | - |
| `encrypted` | boolean | No | Specifies whether to enable cross-region snapshot replication and encryption. Valid values: Example: `false` |
| `KMSKeyId` | string | No | The ID of the Key Management Service (KMS) key used in cross-region snapshot replication and encrypt Example: `0e478b7a-4262-4802-b8cb-00d3fb40826X` |
| `key` | string | No | The key of tag N to add to the automatic snapshot policy. Valid values of N: 1 to 20. The tag key ca Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the automatic snapshot policy. Valid values of N: 1 to 20. The tag valu Example: `TestValue` |
| `copiedSnapshotsRetentionDays` | number | No | The retention period of the snapshot copy in the destination region. Unit: days. Valid values: Example: `30` |
| `copyEncryptionConfiguration` | CreateAutoSnapshotPolicyRequestCopyEncryptionConfiguration | No | - |
| `enableCrossRegionCopy` | boolean | No | Specifies whether to enable cross-region replication for snapshots. Example: `false` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-aek2kkmhmhs****` |
| `storageLocationArn` | string | No | > This parameter is not publicly available. Example: `null` |
| `tag` | CreateAutoSnapshotPolicyRequestTag[] | No | - |
| `targetCopyRegions` | string | No | The destination region to which to copy the snapshot. You can specify only a single destination regi Example: `["cn-hangzhou"]` |
| `autoSnapshotPolicyName` | string | No | The name of the automatic snapshot policy. The name must be 2 to 128 characters in length. The name  Example: `TestName` |
| `regionId` | string | Yes | The ID of the region in which to create the automatic snapshot policy. You can call the [DescribeReg Example: `cn-hangzhou` |
| `repeatWeekdays` | string | Yes | The days of the week on which to create automatic snapshots. Valid values: 1 to 7, which correspond  Example: `["1","2"]` |
| `retentionDays` | number | Yes | The retention period of the automatic snapshot. Unit: days. Valid values: Example: `30` |
| `timePoints` | string | Yes | The points in time of the day at which to create automatic snapshots. The time must be in UTC+8. Uni Example: `["0",` |

## deleteAutoSnapshotPolicy

**Signature:** `deleteAutoSnapshotPolicy(request: DeleteAutoSnapshotPolicyRequest)`

Deletes an automatic snapshot policy. After you delete an automatic snapshot policy, the policy is no longer applied to the disks on which it previously took effect..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `155780923770` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `ECSforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `155780923770` |
| `autoSnapshotPolicyId` | string | Yes | The ID of the automatic snapshot policy. You can call the [DescribeAutoSnapshotPolicyEx](https://hel Example: `sp-bp14yziiuvu3s6jn****` |
| `regionId` | string | Yes | The ID of the region to which the automatic snapshot policy belongs. You can call the [DescribeRegio Example: `cn-hangzhou` |

## describeAutoSnapshotPolicyEx

**Signature:** `describeAutoSnapshotPolicyEx(request: DescribeAutoSnapshotPolicyExRequest)`

Queries the details of automatic snapshot policies that are created in a specific region..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the automatic snapshot policy. Valid values of N: 1 to 20. The tag key cannot be Example: `TestKey` |
| `value` | string | No | The value of tag N of the automatic snapshot policy. Valid values of N: 1 to 20. The tag value can b Example: `TestValue` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy. Example: `sp-bp67acfmxazb4ph****` |
| `autoSnapshotPolicyName` | string | No | The name of the automatic snapshot policy. Example: `TestName` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the automatic snapshot policy. You can call the [DescribeRegions](https://help.aliy Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. If this parameter is specified to query resources, up to 1,000 resourc Example: `rg-aek2kkmhmhs****` |
| `tag` | DescribeAutoSnapshotPolicyExRequestTag[] | No | - |

## modifyAutoSnapshotPolicyEx

**Signature:** `modifyAutoSnapshotPolicyEx(request: ModifyAutoSnapshotPolicyExRequest)`

Before you call this operation, take note of the following items: *   You cannot modify system policies. *   After an automatic snapshot policy is modified, the modifications immediately take effect o.

**Parameters:** (2 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `assumeRoleFor` | number | No | This parameter is not publicly available. Example: `1000000000` |
| `roleType` | string | No | This parameter is not publicly available. Example: `hide` |
| `rolearn` | string | No | This parameter is not publicly available. Example: `hide` |
| `arn` | ModifyAutoSnapshotPolicyExRequestCopyEncryptionConfigurationArn[] | No | - |
| `encrypted` | boolean | No | Specifies whether to enable encryption for cross-region snapshot replication. Valid values: Example: `false` |
| `KMSKeyId` | string | No | The ID of the KMS key used for encryption in cross-region snapshot replication. Example: `0e478b7a-4262-4802-b8cb-00d3fb40826X` |
| `copiedSnapshotsRetentionDays` | number | No | The retention period of the snapshot copy in the destination region. Unit: days. Valid values: Example: `30` |
| `copyEncryptionConfiguration` | ModifyAutoSnapshotPolicyExRequestCopyEncryptionConfiguration | No | - |
| `enableCrossRegionCopy` | boolean | No | Specifies whether to enable cross-region replication for the automatic snapshot. Example: `false` |
| `targetCopyRegions` | string | No | The destination region to which to copy the snapshot. You can specify only a single destination regi Example: `["cn-hangzhou"]` |
| `autoSnapshotPolicyId` | string | Yes | The ID of the automatic snapshot policy. You can call the [DescribeAutoSnapshotPolicyEx](https://hel Example: `sp-bp12m37ccmxvbmi5****` |
| `autoSnapshotPolicyName` | string | No | The name of the automatic snapshot policy. If this parameter is not specified, the original name of  Example: `SPTestName` |
| `regionId` | string | Yes | The region ID of the automatic snapshot policy. You can call the [DescribeRegions](https://help.aliy Example: `cn-hangzhou` |
| `repeatWeekdays` | string | No | The days of the week on which to create automatic snapshots. Valid values are 1 to 7, which correspo Example: `["1",` |
| `retentionDays` | number | No | The retention period of the automatic snapshot. Unit: days. Valid values: Example: `30` |
| `timePoints` | string | No | The points in time of the day at which to create automatic snapshots. The time must be in UTC+8. Uni Example: `["0",` |

## applyAutoSnapshotPolicy

**Signature:** `applyAutoSnapshotPolicy(request: ApplyAutoSnapshotPolicyRequest)`

## [](#)Usage notes When you call this operation, note that: *   You can apply only one automatic snapshot policy to each disk. *   You can apply a single automatic snapshot policy to multiple disks. .

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `autoSnapshotPolicyId` | string | Yes | The ID of the automatic snapshot policy. Example: `sp-bp14yziiuvu3s6jn****` |
| `diskIds` | string | Yes | The IDs of disks. The value is a JSON array that consists of disk IDs. Separate the disk IDs with co Example: `["d-bp14k9cxvr5uzy54****",` |
| `regionId` | string | Yes | The region ID of the automatic snapshot policy and the disks. You can call the [DescribeRegions](htt Example: `cn-hangzhou` |

## cancelAutoSnapshotPolicy

**Signature:** `cancelAutoSnapshotPolicy(request: CancelAutoSnapshotPolicyRequest)`

Disables automatic snapshot policies for one or more disks..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `155780923770` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `ECSforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `155780923770` |
| `diskIds` | string | Yes | The IDs of the disks for which you want to disable the automatic snapshot policy. To disable the aut Example: `["d-bp14k9cxvr5uzy54****",` |
| `regionId` | string | Yes | The region ID of the automatic snapshot policy and the disks. You can call the [DescribeRegions](htt Example: `cn-hangzhou` |

## reInitDisk

**Signature:** `reInitDisk(request: ReInitDiskRequest)`

Take note of the following items: *   The disk that you want to re-initialize must be in the **In Use** (`In_use`) state and the instance to which the disk is attached must be in the **Stopped** (`Sto.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoStartInstance` | boolean | No | Specifies whether to automatically start the instance after the disk is re-initialized. Valid values Example: `true` |
| `diskId` | string | Yes | The ID of the disk. Example: `d-bp67acfmxazb4ph****` |
| `keyPairName` | string | No | The name of the key pair. This parameter is empty by default. Example: `testKeyPairName` |
| `password` | string | No | Specifies whether to reset the password of the instance when you re-initialize its system disk. The  Example: `EcsV587!` |
| `securityEnhancementStrategy` | string | No | Specifies whether to use Security Center free of charge after the system disk is re-initialized. Val Example: `Active` |

## describeDiskDefaultKMSKeyId

**Signature:** `describeDiskDefaultKMSKeyId(request: DescribeDiskDefaultKMSKeyIdRequest)`

Queries the Key Management Service (KMS) key used by the Account-level Elastic Block Storage (EBS) Default Encryption feature in a region..

**Parameters:** See `DescribeDiskDefaultKMSKeyIdRequest` model.

## describeDiskEncryptionByDefaultStatus

**Signature:** `describeDiskEncryptionByDefaultStatus(request: DescribeDiskEncryptionByDefaultStatusRequest)`

Queries whether account-level default encryption of Elastic Block Storage (EBS) resources is enabled in a region..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/2679950.ht Example: `cn-hangzhou` |

## disableDiskEncryptionByDefault

**Signature:** `disableDiskEncryptionByDefault(request: DisableDiskEncryptionByDefaultRequest)`

**Instructions** *   You must grant the RAM user the `AliyunECSFullAccess` permissions. For information about how to grant permissions to a RAM user, see [Grant permissions to a RAM user](https://help.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The ID of the region for which you want to disable Account-level EBS Default Encryption. You can cal Example: `cn-hangzhou` |

## enableDiskEncryptionByDefault

**Signature:** `enableDiskEncryptionByDefault(request: EnableDiskEncryptionByDefaultRequest)`

>  The Account-level EBS Default Encryption feature is available only in specific regions and to specific users. To use the feature, [submit a ticket](https://smartservice.console.aliyun.com/service/c.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/2679950.ht Example: `cn-hangzhou` |

## modifyDiskDefaultKMSKeyId

**Signature:** `modifyDiskDefaultKMSKeyId(request: ModifyDiskDefaultKMSKeyIdRequest)`

To call this operation as a Resource Access Management (RAM) user, grant the `AliyunECSFullAccess` permission to the RAM user. For more information, see [Grant permissions to a RAM user](https://help..

**Parameters:** See `ModifyDiskDefaultKMSKeyIdRequest` model.

## modifyDiskDeployment

**Signature:** `modifyDiskDeployment(request: ModifyDiskDeploymentRequest)`

>  The Dedicated Block Storage Cluster feature is available in the following regions: China (Hangzhou), China (Shanghai), China (Beijing), China (Zhangjiakou), China (Ulanqab), China (Shenzhen), China.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `diskCategory` | string | No | The new disk category. The parameter can be used only when you migrate a disk between dedicated bloc Example: `cloud_essd` |
| `diskId` | string | Yes | The ID of the disk. Example: `d-bp131n0q38u3a4zi****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `performanceLevel` | string | No | The new performance level of the ESSD. The parameter can be used only when you migrate data between  Example: `PL1` |
| `storageClusterId` | string | No | The ID of the dedicated block storage cluster to which data disk N belongs. Example: `dbsc-cn-c4d2uea****` |

## describeAutoSnapshotPolicyAssociations

**Signature:** `describeAutoSnapshotPolicyAssociations(request: DescribeAutoSnapshotPolicyAssociationsRequest)`

Queries association relationships of automatic snapshot policies..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy. Example: `sp-bp12quk7gqhhuu1f****` |
| `diskId` | string | No | The ID of the disk. Example: `d-bp67acfmxazb4p****` |
| `maxResults` | number | No | The number of entries to return on each page. Maximum value: 100. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `caeba0bbb2be03f84eb48b699f0a****` |
| `regionId` | string | Yes | The region ID of the automatic snapshot policy. You can call the [DescribeRegions](https://help.aliy Example: `cn-hangzhou` |

## describeSnapshotsUsage

**Signature:** `describeSnapshotsUsage(request: DescribeSnapshotsUsageRequest)`

## [](#)Usage notes If you want to view the snapshot usage of each disk in the current region, we recommend that you call the [DescribeSnapshotLinks](https://help.aliyun.com/document_detail/55837.html.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the snapshot. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## describeLockedSnapshots

**Signature:** `describeLockedSnapshots(request: DescribeLockedSnapshotsRequest)`

Queries the lock information of a snapshot, such as snapshot lock status and lock configuration..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run. Valid values: Example: `false` |
| `lockStatus` | string | No | The lock status. Valid values: Example: `compliance-cooloff` |
| `maxResults` | number | No | The maximum number of entries to return on each page. Maximum value: 100. Example: `10` |
| `nextToken` | string | No | The query token. Set the value to the `NextToken` parameter value returned in the last API call. Example: `caeba0bbb2be03f84eb48b699f0a****` |
| `ownerAccount` | string | No | - Example: `158704318252****` |
| `ownerId` | number | No | - Example: `158704318252****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/zh/ecs/developer-reference Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `158704318252****` |
| `resourceOwnerId` | number | No | - Example: `158704318252****` |
| `snapshotIds` | string[] | No | - |

## lockSnapshot

**Signature:** `lockSnapshot(request: LockSnapshotRequest)`

You can also use this operation to reconfigure locked snapshots. The configurable items depend on the lock mode and lock status: *   If a snapshot is locked in compliance mode and is in a cooling-off .

**Parameters:** (5 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | A client token that is used to ensure the idempotence of the request. You can use the client to gene Example: `5EC38E7D-389F-1925-ABE2-D7925A8F****` |
| `coolOffPeriod` | number | Yes | Cooling-off period. In compliance mode, you can set a cooling-off period or skip the cooling-off per Example: `3` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run. Valid values: Example: `false` |
| `lockDuration` | number | Yes | Lock duration. After the lock duration ends, the snapshot lock will automatically expire. Example: `1` |
| `lockMode` | string | Yes | The lock mode. Valid values: Example: `compliance` |
| `ownerAccount` | string | No | - Example: `158704318252****` |
| `ownerId` | number | No | - Example: `158704318252****` |
| `regionId` | string | Yes | The region ID You can call the [DescribeRegions](https://help.aliyun.com/zh/ecs/developer-reference/ Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `158704318252****` |
| `resourceOwnerId` | number | No | - Example: `158704318252****` |
| `snapshotId` | string | Yes | The snapshot ID. Example: `s-9dp2qojdpdfmgfmf****` |

## exportSnapshot

**Signature:** `exportSnapshot(request: ExportSnapshotRequest)`

exportSnapshot operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ossBucket` | string | Yes | - |
| `regionId` | string | Yes | - |
| `snapshotId` | string | Yes | - |

## modifySnapshotCategory

**Signature:** `modifySnapshotCategory(request: ModifySnapshotCategoryRequest)`

Archived snapshots cannot be restored to standard snapshots. *   You can archive only standard snapshots that have been retained for at least 14 days. *   You cannot archive snapshots that are shared .

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The type of the snapshot. Example: `Archive` |
| `retentionDays` | number | No | The retention period of the snapshot. Unit: days. The retention period started at the point in time  Example: `60` |
| `snapshotId` | string | Yes | The ID of the snapshot. Example: `s-123**sd` |

## openSnapshotService

**Signature:** `openSnapshotService(request: OpenSnapshotServiceRequest)`

Activate the snapshot service..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID of the port list. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-beijing` |

