# Image Management

Image lifecycle: create, import, export, copy, share, and image pipeline.

## createImage

**Signature:** `createImage(request: CreateImageRequest)`

### [](#)Considerations *   This operation is an asynchronous operation. After a request to create a custom image is sent, an image ID is returned but the creation of the custom image is in progress. .

**Parameters:** (1 required, 22 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device` | string | No | The device name of disk N in the custom image. Valid values: Example: `/dev/vdb` |
| `diskType` | string | No | The type of disk N in the custom image. You can specify this parameter to create the system disk of  Example: `system` |
| `size` | number | No | The size of disk N in the custom image. Unit: GiB. The valid values and default value of DiskDeviceM Example: `2000` |
| `snapshotId` | string | No | The ID of the snapshot. Example: `s-bp17441ohwkdca0****` |
| `imdsSupport` | string | No | The image metadata access mode. Valid values: Example: `v2` |
| `key` | string | No | The key of tag N of the custom image. Valid values of N: 1 to 20. The tag key cannot be an empty str Example: `KeyTest` |
| `value` | string | No | The value of tag N of the custom image. Valid values of N: 1 to 20. The tag value can be an empty st Example: `ValueTest` |
| `architecture` | string | No | The system architecture of the system disk. If you specify a data disk snapshot to create the system Example: `x86_64` |
| `bootMode` | string | No | The boot mode of the image. Valid values: Example: `BIOS` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The image description. The description must be 2 to 256 characters in length and cannot start with [ Example: `ImageTestDescription` |
| `detectionStrategy` | string | No | The mode in which to check the custom image. If you do not specify this parameter, the image is not  Example: `Standard` |
| `diskDeviceMapping` | CreateImageRequestDiskDeviceMapping[] | No | - |
| `features` | CreateImageRequestFeatures | No | - |
| `imageFamily` | string | No | The name of the image family. The name must be 2 to 128 characters in length. The name must start wi Example: `hangzhou-daily-update` |
| `imageName` | string | No | The name of the custom image. The name must be 2 to 128 characters in length. The name must start wi Example: `TestCentOS` |
| `imageVersion` | string | No | The image version. Example: `2017011017` |
| `instanceId` | string | No | The ID of the ECS instance from which to create the custom image. To create a custom image from an E Example: `i-bp1g6zv0ce8oghu7****` |
| `platform` | string | No | The operating system distribution for the system disk in the custom image. If you specify a data dis Example: `CentOS` |
| `regionId` | string | Yes | The region ID of the custom image that you want to create. You can call the [DescribeRegions](https: Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the custom image. If you leave this parameter empty, Example: `rg-bp67acfmxazb4p****` |
| `snapshotId` | string | No | The ID of the snapshot from which to create the custom image. Example: `s-bp17441ohwkdca0****` |
| `tag` | CreateImageRequestTag[] | No | - |

## createImageComponent

**Signature:** `createImageComponent(request: CreateImageComponentRequest)`

## [](#)Usage notes Take note of the following items: *   You can create only custom image components. *   Each version number of an image component must be unique. When you add a version of an image .

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. The tag key cannot be an empty string. The tag key can Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. The tag value can be an empty string. The tag value  Example: `TestValue` |
| `clientToken` | string | No | The client token that is used to ensure the idempotency of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `componentType` | string | No | The type of the image component. Only image building components and image test components are suppor Example: `Build` |
| `componentVersion` | string | No | The version number of the image component, which is used together with the name of the image compone Example: `null` |
| `content` | string | No | The content of the image component. The image component consists of multiple commands. The command c Example: `RUN` |
| `description` | string | No | The description. The description must be 2 to 256 characters in length and cannot start with [http:/ Example: `This` |
| `name` | string | No | The name of the image component. The name must be 2 to 128 characters in length. The name must start Example: `testComponent` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-bp67acfmxazb4p****` |
| `systemType` | string | No | The type of the operating system supported by the image component. Example: `Linux` |
| `tag` | CreateImageComponentRequestTag[] | No | - |

## createImagePipeline

**Signature:** `createImagePipeline(request: CreateImagePipelineRequest)`

## [](#)Usage notes You can use image templates to customize image content and create images across regions and accounts. Take note of the following items: *   You can create only custom image templat.

**Parameters:** (2 required, 44 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseImageType` | string | Yes | The type of the source image. Valid values: Example: `IMAGE` |
| `regionId` | string | Yes | The ID of the region. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/256 Example: `cn-hangzhou` |
| `imageNameSuffix` | string | No | Specifies whether to disable the feature that automatically adds a suffix to the name of the image c Example: `disable` |
| `retainCloudAssistant` | boolean | No | Specifies whether to retain Cloud Assistant Agent that is installed during the image building proces Example: `true` |
| `nvmeSupport` | string | No | Specifies whether the image created based on the image template supports the NVMe protocol. Valid va Example: `auto` |
| `key` | string | No | The key of tag N to add to the image. Valid values of N: 1 to 20. The tag key cannot be an empty str Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the image. Valid values of N: 1 to 20. The tag value can be an empty st Example: `TestValue` |
| `description` | string | No | The description of the image. The description must be 2 to 256 characters in length and cannot start Example: `This` |
| `imageFamily` | string | No | The image family. The image family name must be 2 to 128 characters in length. The name must start w Example: `family` |
| `imageFeatures` | CreateImagePipelineRequestImageOptionsImageFeatures | No | - |
| `imageName` | string | No | The prefix of the image name. The prefix must be 2 to 64 characters in length. The prefix must start Example: `testImageName` |
| `imageTags` | CreateImagePipelineRequestImageOptionsImageTags[] | No | - |
| `diskImageSize` | number | No | The size of disk N in the custom image after the source image is imported. Example: `40` |
| `format` | string | No | The format of the source image. Valid values: Example: `RAW` |
| `OSSBucket` | string | No | The Object Storage Service (OSS) bucket where the image file is stored. Example: `ecsimageos` |
| `OSSObject` | string | No | The name (key) of the object that the image file is stored as in the OSS bucket. Example: `CentOS_5.4_32.raw` |
| `nvmeSupport` | string | No | Specifies whether the imported source image supports the Non-Volatile Memory Express (NVMe) protocol Example: `supported` |
| ... | ... | ... | *29 more optional parameters* |

## deleteImage

**Signature:** `deleteImage(request: DeleteImageRequest)`

For information about scenarios in which you cannot delete a custom image and the considerations related to custom image deletion, see [Delete a custom image](https://help.aliyun.com/document_detail/2.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | - |
| `force` | boolean | No | Specifies whether to forcefully delete the custom image. Valid values: Example: `false` |
| `imageId` | string | Yes | The ID of the image. If the specified custom image does not exist, the request is ignored. Example: `m-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The region ID of the custom image. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

## deleteImageComponent

**Signature:** `deleteImageComponent(request: DeleteImageComponentRequest)`

Only custom image components can be deleted. *   When you delete a component, make sure that the component is not used in the template. Otherwise, the component fails to be deleted..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageComponentId` | string | Yes | The ID of the image component. Example: `ic-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The region ID of the image component. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |

## deleteImagePipeline

**Signature:** `deleteImagePipeline(request: DeleteImagePipelineRequest)`

If an ongoing image building task is associated with an image template, you cannot delete the image template. You can delete the image template only if the image building task reaches the SUCCESS, FAI.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imagePipelineId` | string | Yes | The ID of the image template. Example: `ip-2ze5tsl5bp6nf2b3****` |
| `regionId` | string | Yes | The region ID of the image template. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## describeImages

**Signature:** `describeImages(request: DescribeImagesRequest)`

## [](#)Usage notes *   You can query your custom images, public images provided by Alibaba Cloud, Alibaba Cloud Marketplace images, and shared images from other Alibaba Cloud accounts. *   This is a .

**Parameters:** (1 required, 26 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID of the image. You can call the [DescribeRegions](https://help.aliyun.com/document_deta Example: `cn-hangzhou` |
| `key` | string | No | The key of filter N used to query resources. Valid values: Example: `CreationStartTime` |
| `value` | string | No | The value of filter N used to query resources. Valid values: Example: `2017-12-05T22:40Z` |
| `key` | string | No | The tag N key of the image. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The tag value of the image. Valid values of N: 1 to 20. Example: `TestValue` |
| `actionType` | string | No | The scenario in which the image is used. Valid values: Example: `CreateEcs` |
| `architecture` | string | No | The architecture of the image. Valid values: Example: `i386` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run without performing the actual request. Example: `false` |
| `filter` | DescribeImagesRequestFilter[] | No | - |
| `imageFamily` | string | No | The name of the image family. You can set this parameter to query images of the specified image fami Example: `hangzhou-daily-update` |
| `imageId` | string | No | The ID of the image. Example: `m-bp1g7004ksh0oeuc****` |
| `imageName` | string | No | The image name. Fuzzy match is supported. Example: `testImageName` |
| `imageOwnerAlias` | string | No | The image source. Valid values: Example: `self` |
| `imageOwnerId` | number | No | The ID of the Alibaba Cloud account to which the image belongs. This parameter takes effect only if  Example: `1234567890` |
| `instanceType` | string | No | The instance type for which the image can be used. Example: `ecs.g5.large` |
| `isPublic` | boolean | No | Specifies whether to query published community images. Valid values: Example: `false` |
| ... | ... | ... | *11 more optional parameters* |

## describeImageComponents

**Signature:** `describeImageComponents(request: DescribeImageComponentsRequest)`

You can use `NextToken` to configure the query token. Set the value to the `NextToken` value that is returned in the previous call to the DescribeImageComponents operation. Then, use `MaxResults` to s.

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. Example: `TestValue` |
| `componentType` | string | No | The type of the image component. Example: `null` |
| `componentVersion` | string | No | The version number of the image component in the \\<major>.\\<minor>.\\<patch> format. You can set \ Example: `null` |
| `imageComponentId` | string[] | No | The IDs of image components. Valid values of N: 1 to 20. Example: `ic-bp67acfmxazb4p****` |
| `maxResults` | number | No | The maximum number of entries per page. Valid values: 1 to 500. Example: `50` |
| `name` | string | No | The name of the image component. You must specify an exact name to search for the image component. Example: `testComponent` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAAdDWBF2****` |
| `owner` | string | No | The type of the image component. Valid values: Example: `SELF` |
| `regionId` | string | Yes | The region ID of the image component. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. If this parameter is specified to query resources, up to 1,000 resourc Example: `rg-bp67acfmxazb4p****` |
| `systemType` | string | No | The type of the operating system supported by the image component. Example: `null` |
| `tag` | DescribeImageComponentsRequestTag[] | No | - |

## describeImageFromFamily

**Signature:** `describeImageFromFamily(request: DescribeImageFromFamilyRequest)`

## [](#)Usage notes If no available image exists in a specific image family, the response is empty..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageFamily` | string | Yes | The family name of the image that you want to use to create the instances. Example: `hangzhou-daily-update` |
| `regionId` | string | Yes | The ID of the region in which to create the custom image. You can call the [DescribeRegions](https:/ Example: `cn-hangzhou` |

## describeImagePipelines

**Signature:** `describeImagePipelines(request: DescribeImagePipelinesRequest)`

You can use `NextToken` to configure the query token. Set the value to the `NextToken` value that is returned in the previous call to the `DescribeImagePipelines` operation. Then, use `MaxResults` to .

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. Example: `TestValue` |
| `imagePipelineId` | string[] | No | The IDs of image templates. Valid values of N: 1 to 20. Example: `ip-2ze5tsl5bp6nf2b3****` |
| `maxResults` | number | No | The maximum number of entries per page. Valid values: 1 to 500 Example: `50` |
| `name` | string | No | The name of the image template. Example: `testImagePipeline` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAAdDWBF2****` |
| `regionId` | string | Yes | The region ID of the image template. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. If this parameter is specified to query resources, up to 1,000 resourc Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribeImagePipelinesRequestTag[] | No | - |

## describeImagePipelineExecutions

**Signature:** `describeImagePipelineExecutions(request: DescribeImagePipelineExecutionsRequest)`

The status of the image creation task. Valid values: *   PREPARING: Resources, such as intermediate instances, are being created. *   REPAIRING: The source image is being repaired. *   BUILDING: The u.

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the image creation task. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | null Example: `TestValue` |
| `executionId` | string | No | null Example: `exec-5fb8facb8ed7427c****` |
| `imagePipelineId` | string | No | The value of tag N of the image creation task. Valid values of N: 1 to 20. Example: `ip-2ze5tsl5bp6nf2b3****` |
| `maxResults` | number | No | The status of the image creation task. You can specify multiple values. Separate the values with com Example: `50` |
| `nextToken` | string | No | The ID of the image creation task. Example: `AAAAAdDWBF2****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `status` | string | No | The ID of the image template. Example: `BUILDING` |
| `tag` | DescribeImagePipelineExecutionsRequestTag[] | No | - |

## describeImageSupportInstanceTypes

**Signature:** `describeImageSupportInstanceTypes(request: DescribeImageSupportInstanceTypesRequest)`

Queries the Elastic Compute Service (ECS) instance types supported by an image..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | Filter N used to filter instance types. Example: `imageId` |
| `value` | string | No | The ID of the image. Example: `m-o6w3gy99qf89rkga****` |
| `actionType` | string | No | The scenario in which the image is used. Valid values: Example: `CreateEcs` |
| `filter` | DescribeImageSupportInstanceTypesRequestFilter[] | No | - |
| `imageId` | string | No | The region ID of the image. You can call the [DescribeRegions](https://help.aliyun.com/document_deta Example: `m-o6w3gy99qf89rkga****` |
| `regionId` | string | Yes | Details about the instance types that are supported by the image. Example: `cn-hangzhou` |

## describeImageSharePermission

**Signature:** `describeImageSharePermission(request: DescribeImageSharePermissionRequest)`

Queries the accounts with which a custom image is shared. When you call this operation, you can specify parameters, such as RegionId and ImageId, in the request. The response can be displayed by page..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageId` | string | Yes | The ID of the custom image. Example: `m-bp1caf3yicx5jlfl****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the custom image. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

## modifyImageAttribute

**Signature:** `modifyImageAttribute(request: ModifyImageAttributeRequest)`

Modifies the attributes of a custom image, such as the image family, name, boot mode, and status and whether the image supports the Non-Volatile Memory Express (NVMe) protocol. When you call this oper.

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imdsSupport` | string | No | The image metadata access mode. Valid values: Example: `v2` |
| `nvmeSupport` | string | No | Specifies whether the image supports the Non-Volatile Memory Express (NVMe) protocol. Valid values: Example: `supported` |
| `bootMode` | string | No | The new boot mode of the image. Valid values: Example: `BIOS` |
| `description` | string | No | The new description of the custom image. The description must be 2 to 256 characters in length It ca Example: `testDescription` |
| `features` | ModifyImageAttributeRequestFeatures | No | The attributes of the custom image. |
| `imageFamily` | string | No | The name of the image family. The name must be 2 to 128 characters in length. It must start with a l Example: `hangzhou-daily-update` |
| `imageId` | string | Yes | The ID of the custom image. Example: `m-bp18ygjuqnwhechc****` |
| `imageName` | string | No | The name of the custom image. The name must be 2 to 128 characters in length. It must start with a l Example: `testImageName` |
| `licenseType` | string | No | The type of the license that is used to activate the operating system after the image is imported. S Example: `Auto` |
| `regionId` | string | Yes | The region ID of the custom image. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |
| `status` | string | No | The new state of the custom image. Valid values: Example: `Deprecated` |

## modifyImageSharePermission

**Signature:** `modifyImageSharePermission(request: ModifyImageSharePermissionRequest)`

Before you call this operation, read [Share a custom image](https://help.aliyun.com/document_detail/25463.html). When you call this operation, take note of the following sharing rules: *   **Sharing l.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addAccount` | string[] | No | The IDs of Alibaba Cloud accounts to which you want to share the custom image. Valid values of N: 1  Example: `1234567890` |
| `imageId` | string | Yes | The ID of the shared custom image. Example: `m-bp18ygjuqnwhechc****` |
| `isPublic` | boolean | No | Specifies whether to publish or unpublish a community image. Valid values: Example: `false` |
| `launchPermission` | string | No | > This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `regionId` | string | Yes | The region ID of the custom image. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |
| `removeAccount` | string[] | No | The IDs of Alibaba Cloud accounts from which you want to unshare the custom image. Valid values of N Example: `1234567890` |

## copyImage

**Signature:** `copyImage(request: CopyImageRequest)`

## [](#)Usage notes After you copy a custom image to the destination region, you can use the image copy (new image) to create ECS instances by calling the RunInstances operation or replace the system .

**Parameters:** (2 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the image copy. Valid values of N: 1 to 20. The tag key cannot be an empty strin Example: `TestKey` |
| `value` | string | No | The value of tag N of the image copy. Valid values of N: 1 to 20. The tag value can be an empty stri Example: `TestValue` |
| `clientToken` | string | No | The client token that you want to use to ensure the idempotence of the request. You can use the clie Example: `123e4567-e89b-12d3-a456-426655440000` |
| `destinationDescription` | string | No | The description of the image copy. The description must be 2 to 256 characters in length and cannot  Example: `This` |
| `destinationImageName` | string | No | The name of the new image. The name must be 2 to 128 characters in length. The name must start with  Example: `YourImageName` |
| `destinationRegionId` | string | No | The ID of the destination region to which the source custom image is copied. Example: `cn-shanghai` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Specifies whethe Example: `false` |
| `encryptAlgorithm` | string | No | > This parameter is unavailable. Example: `hide` |
| `encrypted` | boolean | No | Specifies whether to encrypt the new image. Example: `false` |
| `imageId` | string | Yes | The ID of the source custom image. Example: `m-bp1h46wfpjsjastc****` |
| `KMSKeyId` | string | No | The ID of the key used to encrypt the image copy. Example: `e522b26d-abf6-4e0d-b5da-04b7******3c` |
| `regionId` | string | Yes | The region ID of the source custom image. You can call the [DescribeRegions](https://help.aliyun.com Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the new image. If you do not specify this parameter, Example: `rg-bp67acfmxazb4p****` |
| `tag` | CopyImageRequestTag[] | No | - |

## cancelCopyImage

**Signature:** `cancelCopyImage(request: CancelCopyImageRequest)`

When you call this operation, take note of the following items: *   After you cancel an image copy task, the image copy created in the destination region is deleted, and the copied image remains uncha.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageId` | string | Yes | The ID of the image that is being copied. Example: `m-bp1caf3yicx5jlfl****` |
| `regionId` | string | Yes | The region ID of the image copy. You can call the [DescribeRegions](https://help.aliyun.com/document Example: `cn-hangzhou` |

## importImage

**Signature:** `importImage(request: ImportImageRequest)`

### [](#)Usage notes Take note of the following items: *   Before you import an image, you must upload the image to an Object Storage Service (OSS) bucket. For more information, see [Upload objects](h.

**Parameters:** (1 required, 26 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID of the source image. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |
| `device` | string | No | The device name of disk N in the custom image. Example: `null` |
| `diskImSize` | number | No | The size of disk N in the custom image. Unit: GiB. Example: `80` |
| `diskImageSize` | number | No | The size of disk N in the custom image after the source image is imported. Example: `80` |
| `format` | string | No | The format of the source image. Valid values: Example: `QCOW2` |
| `OSSBucket` | string | No | The Object Storage Service (OSS) bucket where the image file is stored. Example: `ecsimageos` |
| `OSSObject` | string | No | The name (key) of the object that the image file is stored as in the OSS bucket. Example: `CentOS_5.4_32.raw` |
| `imdsSupport` | string | No | The metadata access mode version of the image. Valid values: Example: `v2` |
| `nvmeSupport` | string | No | Specifies whether the image supports the Non-Volatile Memory Express (NVMe) protocol. Valid values: Example: `supported` |
| `key` | string | No | The key of tag N of the image. Valid values of N: 1 to 20. The tag key cannot be an empty string. Th Example: `TestKey` |
| `value` | string | No | The value of tag N of the image. Valid values of N: 1 to 20. The tag value can be an empty string. T Example: `TestValue` |
| `architecture` | string | No | The system architecture. Valid values: Example: `x86_64` |
| `bootMode` | string | No | The boot mode of the image. Valid values: Example: `BIOS` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The image description. The description must be 2 to 256 characters in length and cannot start with ` Example: `TestDescription` |
| `detectionStrategy` | string | No | The mode in which to check the image. If you do not specify this parameter, the image is not checked Example: `Standard` |
| ... | ... | ... | *11 more optional parameters* |

## exportImage

**Signature:** `exportImage(request: ExportImageRequest)`

Take note of the following items: *   Make sure that you are familiar with the prerequisites and considerations. For more information, see [Export a custom image](https://help.aliyun.com/document_deta.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | - |
| `imageFormat` | string | No | The format in which you want to export the custom image. Valid values: Example: `raw` |
| `imageId` | string | Yes | The custom image ID. Example: `m-bp67acfmxazb4p****` |
| `OSSBucket` | string | Yes | The OSS bucket in which you want to store the exported custom image. Example: `testexportImage` |
| `OSSPrefix` | string | No | The prefix for the name of the OSS object. The prefix must be 1 to 30 characters in length and can c Example: `EcsExport` |
| `regionId` | string | Yes | The region ID of the custom image. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |
| `roleName` | string | No | The name of the RAM role that you want to use to export the custom image. Example: `AliyunECSImageExportDefaultRole` |

## startImagePipelineExecution

**Signature:** `startImagePipelineExecution(request: StartImagePipelineExecutionRequest)`

After you create an image template, you can call the StartImagePipelineExecution operation to create a pipeline task. The system creates, copies, and shares images based on the parameters configured i.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. The tag key cannot be an empty string. The tag key can Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. The tag value can be an empty string. The tag value  Example: `TestValue` |
| `key` | string | No | >  This parameter is deprecated. Example: `null` |
| `value` | string | No | >  This parameter is deprecated. Example: `null` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `imagePipelineId` | string | Yes | The ID of the image template. Example: `ip-2ze5tsl5bp6nf2b3****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `tag` | StartImagePipelineExecutionRequestTag[] | No | - |

## cancelImagePipelineExecution

**Signature:** `cancelImagePipelineExecution(request: CancelImagePipelineExecutionRequest)`

Before you call the CancelImagePipelineExecution operation, make sure that the image building task to be canceled is in the BUILDING, PREPARING, or REPAIRING state..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | >  This parameter is not publicly available. Example: `null` |
| `value` | string | No | >  This parameter is not publicly available. Example: `null` |
| `executionId` | string | Yes | The ID of the image building task. Example: `exec-5fb8facb8ed7427c****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `templateTag` | CancelImagePipelineExecutionRequestTemplateTag[] | No | - |

## describeAvailableResource

**Signature:** `describeAvailableResource(request: DescribeAvailableResourceRequest)`

查询可用资源.

**Parameters:** (2 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cores` | number | No | - Example: `2` |
| `dataDiskCategory` | string | No | - Example: `cloud_ssd` |
| `dedicatedHostId` | string | No | - Example: `dh-bp165p6xk2tlw61e****` |
| `destinationResource` | string | Yes | This parameter is required. Example: `InstanceType` |
| `instanceChargeType` | string | No | - Example: `PrePaid` |
| `instanceType` | string | No | - Example: `ecs.g5.large` |
| `ioOptimized` | string | No | - Example: `optimized` |
| `memory` | number | No | - Example: `8.0` |
| `networkCategory` | string | No | - Example: `vpc` |
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `resourceType` | string | No | - Example: `instance` |
| `scope` | string | No | - Example: `Region` |
| `spotDuration` | number | No | - Example: `1` |
| `spotStrategy` | string | No | - Example: `NoSpot` |
| `systemDiskCategory` | string | No | - Example: `cloud_ssd` |
| `zoneId` | string | No | - Example: `cn-hangzhou-e` |

## modifyImageShareGroupPermission

**Signature:** `modifyImageShareGroupPermission(request: ModifyImageShareGroupPermissionRequest)`

modifyImageShareGroupPermission operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addGroup` | string[] | No | - |
| `imageId` | string | Yes | - |
| `regionId` | string | Yes | - |

