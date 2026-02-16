# Storage Capacity Unit & Savings Plan

Storage capacity units, savings plans, and dedicated block storage clusters.

## createStorageSet

**Signature:** `createStorageSet(request: CreateStorageSetRequest)`

A storage set can distribute disks or Shared Block Storage devices to different locations. You can specify the number of partitions in a storage set. A larger number of partitions indicate more discre.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the storage set. The description must be 2 to 256 characters in length and cannot Example: `testDescription` |
| `maxPartitionNumber` | number | No | The maximum number of partitions supported by the storage set. The value must be greater than or equ Example: `10` |
| `regionId` | string | Yes | The region ID of the storage set. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `storageSetName` | string | No | The name of the storage set. The name must be 2 to 128 characters in length and can contain letters, Example: `testStorageSetName` |
| `zoneId` | string | Yes | The zone ID of the storage set. You can call the [DescribeZones](https://help.aliyun.com/document_de Example: `cn-hangzhou-g` |

## deleteStorageSet

**Signature:** `deleteStorageSet(request: DeleteStorageSetRequest)`

(Beta) Deletes an empty storage set. The storage set that you want to delete must be empty and do not contain disks or Shared Block Storage devices..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `ownerAccount` | string | No | - Example: `hide` |
| `ownerId` | number | No | - Example: `111` |
| `regionId` | string | Yes | The region ID of the storage set. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `hide` |
| `resourceOwnerId` | number | No | - Example: `111` |
| `storageSetId` | string | Yes | The ID of the storage set. Example: `ss-bp67acfmxazb4p****` |

## describeStorageSets

**Signature:** `describeStorageSets(request: DescribeStorageSetsRequest)`

Describes the details of storage sets in a specific region. The details of a storage set include its region, zone, creation time, and maximum number of partitions..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `ownerAccount` | string | No | - Example: `hide` |
| `ownerId` | number | No | - Example: `111` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: 100. Example: `1` |
| `regionId` | string | Yes | The region ID of the storage set. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `hide` |
| `resourceOwnerId` | number | No | - Example: `111` |
| `storageSetIds` | string | No | The IDs of storage sets. The value is a JSON array that consists of up to 100 storage set IDs. Separ Example: `["ss-bp1d6tsvznfghy7y****",` |
| `storageSetName` | string | No | The name of the storage set. Example: `storageSetTest` |
| `zoneId` | string | No | The zone ID of the storage set. You can call the [DescribeZones](https://help.aliyun.com/document_de Example: `cn-hangzhou-g` |

## describeStorageSetDetails

**Signature:** `describeStorageSetDetails(request: DescribeStorageSetDetailsRequest)`

Queries the details of the disks or Shared Block Storage devices in a storage set..

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `diskIds` | string | No | The IDs of disks or Shared Block Storage devices. The value can be a JSON array that consists of up  Example: `["d-bp1d6tsvznfghy7y****",` |
| `ownerAccount` | string | No | - Example: `hide` |
| `ownerId` | number | No | - Example: `111` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the storage set. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `hide` |
| `resourceOwnerId` | number | No | - Example: `111` |
| `storageSetId` | string | Yes | The ID of the storage set. Example: `ss-bp67acfmxazb4p****` |
| `storageSetPartitionNumber` | number | No | The maximum number of partitions in the storage set. Example: `3` |

## modifyStorageSetAttribute

**Signature:** `modifyStorageSetAttribute(request: ModifyStorageSetAttributeRequest)`

Modifies the name or description of a storage set..

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the storage set. Example: `testStorageSetDescription` |
| `ownerAccount` | string | No | - Example: `hide` |
| `ownerId` | number | No | - Example: `111` |
| `regionId` | string | Yes | The region ID of the storage set. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `hide` |
| `resourceOwnerId` | number | No | - Example: `111` |
| `storageSetId` | string | Yes | The ID of the storage set. Example: `ss-bp67acfmxazb4ph****` |
| `storageSetName` | string | No | The name of the storage set. Example: `testStorageSetName` |

## describeStorageCapacityUnits

**Signature:** `describeStorageCapacityUnits(request: DescribeStorageCapacityUnitsRequest)`

Queries the details of storage capacity units (SCUs). In the request, you can specify the name, status, or capacity of each SCU..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to be added to the SCU. Example: `TestKey` |
| `value` | string | No | The value of tag N to be added to the SCU. Example: `TestValue` |
| `allocationType` | string | No | The allocation type. Valid values: Example: `Normal` |
| `capacity` | number | No | The capacity of the SCU. Unit: GiB. Valid values: 20, 40, 100, 200, 500, 1024, 2048, 5120, 10240, 20 Example: `20` |
| `name` | string | No | The name of the SCU. The name must be 2 to 128 characters in length. It must start with a letter but Example: `testScuName` |
| `pageNumber` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `1` |
| `regionId` | string | Yes | The region ID of the SCU. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |
| `status` | string[] | No | The states of SCUs. The array is 1 to 4 in length. Example: `Active` |
| `storageCapacityUnitId` | string[] | No | The IDs of the SCUs. You can specify 1 to 100 SCU IDs. Example: `scu-bp67acfmxazb4p****` |
| `tag` | DescribeStorageCapacityUnitsRequestTag[] | No | - |

## modifyStorageCapacityUnitAttribute

**Signature:** `modifyStorageCapacityUnitAttribute(request: ModifyStorageCapacityUnitAttributeRequest)`

Modifies the name or description of a storage capacity unit (SCU)..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The new description of the SCU. The description must be 2 to 256 characters in length and cannot sta Example: `testNewScuDescription` |
| `name` | string | No | The new name of the SCU. The name must be 2 to 128 characters in length. It must start with a letter Example: `testNewScuName` |
| `ownerAccount` | string | No | - Example: `hide` |
| `ownerId` | number | No | - Example: `111` |
| `regionId` | string | Yes | The region ID of the SCU. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | - Example: `hide` |
| `resourceOwnerId` | number | No | - Example: `111` |
| `storageCapacityUnitId` | string | Yes | The ID of the SCU. Example: `scu-bp67acfmxazb4p****` |

## describeSavingsPlanEstimation

**Signature:** `describeSavingsPlanEstimation(request: DescribeSavingsPlanEstimationRequest)`

节省计划测算.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `estimationResource` | string | No | - |

## describeSavingsPlanPrice

**Signature:** `describeSavingsPlanPrice(request: DescribeSavingsPlanPriceRequest)`

询价购买节省计划并预付费换购按量付费.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `committedAmount` | string | No | - |

## createSavingsPlan

**Signature:** `createSavingsPlan(request: CreateSavingsPlanRequest)`

购买节省计划并预付费换购按量付费.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chargeType` | string | No | - |

## describeDeploymentSets

**Signature:** `describeDeploymentSets(request: DescribeDeploymentSetsRequest)`

Queries detailed information about one or more deployment sets..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deploymentSetIds` | string | No | The IDs of deployment sets. The value can be a JSON array that consists of deployment set IDs in the Example: `["ds-bp67acfmxazb4ph****",` |
| `deploymentSetName` | string | No | The name of the deployment set. The name must be 2 to 128 characters in length. The name must start  Example: `testDeploymentSetName` |
| `domain` | string | No | >  This parameter is deprecated. Example: `null` |
| `granularity` | string | No | >  This parameter is deprecated. Example: `null` |
| `networkType` | string | No | >  This parameter is deprecated. Example: `null` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `10` |
| `regionId` | string | Yes | The region ID of the deployment set. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `strategy` | string | No | The deployment strategy. Valid values: Example: `Availability` |

## createDeploymentSet

**Signature:** `createDeploymentSet(request: CreateDeploymentSetRequest)`

Creates a deployment set in a region..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The description of the deployment set. The description must be 2 to 256 characters in length and can Example: `123e4567-e89b-12d3-a456-426655440000` |
| `deploymentSetName` | string | No | The name of the deployment set. The name must be 2 to 128 characters in length. The name must start  Example: `testDeploymentSetName` |
| `description` | string | No | The emergency solution to use in the situation where instances in the deployment set cannot be evenl Example: `testDescription` |
| `domain` | string | No | >  This parameter is deprecated. Example: `Default` |
| `granularity` | string | No | >  This parameter is deprecated. Example: `host` |
| `groupCount` | number | No | The deployment strategy. Valid values: Example: `1` |
| `onUnableToRedeployFailedInstance` | string | No | The region ID of the deployment set. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `CancelMembershipAndStart` |
| `regionId` | string | Yes | Creates a deployment set in a specific region. Example: `cn-hangzhou` |
| `strategy` | string | No | The deployment strategy. Valid values: Example: `Availability` |

## deleteDeploymentSet

**Signature:** `deleteDeploymentSet(request: DeleteDeploymentSetRequest)`

Before you delete a deployment set, make sure that no instances exist in the deployment set. If instances exist in the deployment set, move the instances to a different deployment set or release the i.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deploymentSetId` | string | Yes | The ID of the deployment set that you want to delete. Example: `ds-bp1g5ahlkal88d7x****` |
| `regionId` | string | Yes | The region ID of the deployment set. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## modifyDeploymentSetAttribute

**Signature:** `modifyDeploymentSetAttribute(request: ModifyDeploymentSetAttributeRequest)`

Modifies the name and description of a deployment set..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deploymentSetId` | string | Yes | The ID of the deployment set. Example: `ds-bp1frxuzdg87zh4p****` |
| `deploymentSetName` | string | No | The new name of the deployment set. The name must be 2 to 128 characters in length and can contain l Example: `DeploymentSetTestName` |
| `description` | string | No | The new description of the deployment set. The description must be 2 to 256 characters in length and Example: `TestDescription` |
| `regionId` | string | Yes | The region ID of the deployment set. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## modifyInstanceDeployment

**Signature:** `modifyInstanceDeployment(request: ModifyInstanceDeploymentRequest)`

Take note of the following items: *   The instance must be in the **Stopped** (Stopped) state. The instance is automatically restarted after it is migrated. *   The network type of the instance must b.

**Parameters:** (3 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `affinity` | string | No | Specifies whether to associate the instance with a dedicated host. Valid values: Example: `host` |
| `dedicatedHostClusterId` | string | No | The ID of the dedicated host cluster. Example: `dc-bp67acfmxazb4ph****` |
| `dedicatedHostId` | string | No | The ID of the destination dedicated host. You can call the [DescribeDedicatedHosts](https://help.ali Example: `dh-bp67acfmxazb4ph****` |
| `deploymentSetGroupNo` | number | No | The number of the deployment set group in which to deploy the instance in the destination deployment Example: `3` |
| `deploymentSetId` | string | Yes | The ID of the destination deployment set. Example: `ds-bp67acfmxazb4ph****` |
| `force` | boolean | No | Specifies whether to forcefully change the host of the instance when the deployment set of the insta Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp67acfmxazb4ph***` |
| `instanceType` | string | No | The instance type to which the instance is changed. You can call the [DescribeInstanceTypes](https:/ Example: `ecs.c6.large` |
| `migrationType` | string | No | Specifies whether to stop the instance before it is migrated to the destination dedicated host. Vali Example: `live` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `removeFromDeploymentSet` | boolean | No | Specifies whether to remove the specified instance from the specified deployment set. Valid values: Example: `false` |
| `tenancy` | string | No | Specifies whether to deploy the instance on a dedicated host. Set the value to host, which indicates Example: `host` |

## describeDeploymentSetSupportedInstanceTypeFamily

**Signature:** `describeDeploymentSetSupportedInstanceTypeFamily(request: DescribeDeploymentSetSupportedInstanceTypeFamilyRequest)`

## [](#)Usage notes For information about instance families, see [Overview of instance families](https://help.aliyun.com/document_detail/25378.html)..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `strategy` | string | No | The deployment strategy. Valid values: Example: `Availability` |

