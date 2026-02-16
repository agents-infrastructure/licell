# Launch Template

Launch template management for standardized instance creation.

## createLaunchTemplate

**Signature:** `createLaunchTemplate(request: CreateLaunchTemplateRequest)`

After you create a launch template by calling the CreateLaunchTemplate operation, a default version that has a version number of 1 is automatically generated for the launch template. You can call the .

**Parameters:** (3 required, 85 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `launchTemplateName` | string | Yes | The name of the launch template. The name must be 2 to 128 characters in length. The name must start Example: `testLaunchTemplateName` |
| `regionId` | string | Yes | The ID of the region in which to create the launch template. You can call the [DescribeRegions](http Example: `cn-hangzhou` |
| `vSwitchId` | string | Yes | The ID of the vSwitch to which to connect the instance. This parameter is required if you specify th Example: `vsw-bp1s5fnvk4gn2tws0****` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy to apply to the system disk. Example: `sp-gc7c37d4ylw7mtnk****` |
| `burstingEnabled` | boolean | No | Specifies whether to enable the performance burst feature for the system disk. Valid values: Example: `true` |
| `category` | string | No | The category of the system disk. Valid values: Example: `cloud_ssd` |
| `deleteWithInstance` | boolean | No | Specifies whether to release the system disk when the instance is released. Valid values: Example: `true` |
| `description` | string | No | The description of the system disk. The description must be 2 to 256 characters in length and cannot Example: `testSystemDiskDescription` |
| `diskName` | string | No | The name of the system disk. The name must be 2 to 128 characters in length. The name must start wit Example: `testSystemDiskName` |
| `encrypted` | string | No | Specifies whether to encrypt the system disk. Valid values: Example: `false` |
| `iops` | number | No | > This parameter is in invitational preview and is unavailable for general users. Example: `null` |
| `KMSKeyId` | string | No | The ID of the KMS key to use for the system disk. Example: `0e478b7a-4262-4802-b8cb-00d3fb40****` |
| `performanceLevel` | string | No | The performance level of the ESSD to use as the system disk. Default value: PL0. Valid values: Example: `PL0` |
| `provisionedIops` | number | No | The provisioned read/write IOPS of the ESSD AutoPL disk to use as the system disk. Valid values: 0 t Example: `50000` |
| `size` | number | No | The size of the system disk. Unit: GiB. Valid values: Example: `40` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy to apply to data disk N. Example: `sp-m5e7fa9ute44ssa****` |
| `burstingEnabled` | boolean | No | Specifies whether to enable the performance burst feature for the system disk. Valid values: Example: `true` |
| `category` | string | No | The category of data disk N. Valid values: Example: `cloud_ssd` |
| ... | ... | ... | *70 more optional parameters* |

## createLaunchTemplateVersion

**Signature:** `createLaunchTemplateVersion(request: CreateLaunchTemplateVersionRequest)`

## [](#)Usage notes If you want to modify the parameters of a launch template version, you can create another version with different parameter settings for the launch template. You can create up to 30.

**Parameters:** (2 required, 83 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |
| `vSwitchId` | string | Yes | The ID of the vSwitch to which to connect the instance. This parameter is required if you specify th Example: `vsw-bp1s5fnvk4gn2tws0****` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy to apply to the system disk. Example: `sp-bp1dgzpaxwc4load****` |
| `burstingEnabled` | boolean | No | Specifies whether to enable the performance burst feature. Valid values: Example: `true` |
| `category` | string | No | The category of the system disk. Valid values: Example: `cloud_ssd` |
| `deleteWithInstance` | boolean | No | Specifies whether to release the system disk when the instance is released. Valid values: Example: `true` |
| `description` | string | No | The description of the system disk. The description must be 2 to 256 characters in length and cannot Example: `testSystemDiskDescription` |
| `diskName` | string | No | The name of the system disk. The name must be 2 to 128 characters in length. The name must start wit Example: `cloud_ssdSystem` |
| `encrypted` | string | No | Specifies whether to encrypt the system disk. Valid values: Example: `false` |
| `iops` | number | No | >  This parameter is not publicly available. Example: `30000` |
| `KMSKeyId` | string | No | The ID of the KMS key to use for the system disk. Example: `0e478b7a-4262-4802-b8cb-00d3fb40****` |
| `performanceLevel` | string | No | The performance level of the ESSD to be used as the system disk. Default value: PL0. Valid values: Example: `PL0` |
| `provisionedIops` | number | No | The provisioned read/write IOPS of the ESSD AutoPL disk to use as data disk N. Valid values: 0 to mi Example: `50000` |
| `size` | number | No | The size of the system disk. Unit: GiB. Valid values: Example: `40` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy to apply to data disk N. Example: `sp-bp67acfmxazb4p****` |
| `burstingEnabled` | boolean | No | Specifies whether to enable the performance burst feature for the system disk. Valid values: Example: `true` |
| `category` | string | No | The category of data disk N. Valid values: Example: `cloud_ssd` |
| ... | ... | ... | *68 more optional parameters* |

## deleteLaunchTemplate

**Signature:** `deleteLaunchTemplate(request: DeleteLaunchTemplateRequest)`

Take note of the following items: *   After you delete a launch template, Elastic Compute Service (ECS) instances created based on the launch template are not affected. *   After you delete a launch t.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `launchTemplateId` | string | No | The ID of the launch template. For more information, see [DescribeLaunchTemplates](https://help.aliy Example: `lt-bp1apo0bbbkuy0rj****` |
| `launchTemplateName` | string | No | The name of the launch template. Example: `testLaunchTemplateName` |
| `regionId` | string | Yes | The region ID of the launch template. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |

## deleteLaunchTemplateVersion

**Signature:** `deleteLaunchTemplateVersion(request: DeleteLaunchTemplateVersionRequest)`

Take note of the following items: *   You cannot delete the default version of a launch template by calling this operation. To delete the default version of a launch template, you must delete the laun.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleteVersion` | number[] | Yes | The version numbers of the launch template. Example: `2` |
| `launchTemplateId` | string | No | The ID of the launch template. For more information, call the [DescribeLaunchTemplates](https://help Example: `lt-bp1apo0bbbkuy0rj****` |
| `launchTemplateName` | string | No | The name of the launch template. Example: `testLaunchTemplateName` |
| `regionId` | string | Yes | The region ID of the launch template. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |

## describeLaunchTemplates

**Signature:** `describeLaunchTemplates(request: DescribeLaunchTemplatesRequest)`

Queries the information of one or more launch templates, such as the total number of launch templates, the creation time of each launch template, and the latest version number of each launch template..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the launch template. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the launch template. Valid values of N: 1 to 20. Example: `TestValue` |
| `launchTemplateId` | string[] | No | The IDs of launch templates. Example: `lt-m5e3ofjr1zn1aw7q****` |
| `launchTemplateName` | string[] | No | The names of launch templates. Example: `wd-152630748****` |
| `pageNumber` | number | No | The page number. Page starts from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the launch template. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |
| `templateResourceGroupId` | string | No | The ID of the resource group to which the launch template belongs. If you specify this parameter to  Example: `rg-acfmxazb4p****` |
| `templateTag` | DescribeLaunchTemplatesRequestTemplateTag[] | No | The tags of the launch template. |

## describeLaunchTemplateVersions

**Signature:** `describeLaunchTemplateVersions(request: DescribeLaunchTemplateVersionsRequest)`

Queries the information of launch template versions, such as the total number of launch templates, launch template names, and launch template version numbers..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `defaultVersion` | boolean | No | Specifies whether to query the default version. Example: `true` |
| `detailFlag` | boolean | No | Specifies whether to query the configurations of the launch template. Valid values: Example: `true` |
| `launchTemplateId` | string | No | The ID of the launch template. Example: `lt-bp168lnahrdwl39p****` |
| `launchTemplateName` | string | No | The name of the launch template. Example: `testLaunchTemplateName` |
| `launchTemplateVersion` | number[] | No | The versions of the launch template. Example: `1` |
| `maxVersion` | number | No | The maximum version number in the version range to query. This parameter is used together with `MinV Example: `10` |
| `minVersion` | number | No | The minimum version number in the version range to query. This parameter is used together with `MaxV Example: `1` |
| `pageNumber` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `10` |
| `regionId` | string | Yes | The region ID of the launch template. Example: `cn-hangzhou` |

## modifyLaunchTemplateDefaultVersion

**Signature:** `modifyLaunchTemplateDefaultVersion(request: ModifyLaunchTemplateDefaultVersionRequest)`

## Debugging [OpenAPI Explorer automatically calculates the signature value. For your convenience, we recommend that you call this operation in OpenAPI Explorer. OpenAPI Explorer dynamically generates.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `defaultVersionNumber` | number | Yes | The default version number of the instance launch template. Example: `2` |
| `launchTemplateId` | string | No | The ID of the launch template. You must specify the LaunchTemplateId or LaunchTemplateName parameter Example: `lt-s-bp177juajht6****` |
| `launchTemplateName` | string | No | The name of the instance launch template. You must specify the LaunchTemplateId or LaunchTemplateNam Example: `testLaunchTemplateName` |
| `regionId` | string | Yes | The region ID of the launch template. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |

