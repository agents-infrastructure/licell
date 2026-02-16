# Instance Management

ECS instance lifecycle: create, start, stop, reboot, delete, describe, and modify.

## runInstances

**Signature:** `runInstances(request: RunInstancesRequest)`

Before you call this operation, familiarize yourself with the billing rules and [pricing](https://www.alibabacloud.com/zh/pricing-calculator#/commodity/vm_intl) of ECS resources. This operation is an .

**Parameters:** (2 required, 132 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hpcClusterId` | string | Yes | The ID of the high performance computing (HPC) cluster to which the instance belongs. Example: `hpc-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The ID of the region in which to create the instance. You can call the [DescribeRegions](https://hel Example: `cn-hangzhou` |
| `core` | number | No | The number of CPU cores. Example: `2` |
| `numa` | string | No | This parameter is no longer used. Example: `1` |
| `threadsPerCore` | number | No | The number of threads per CPU core. The following formula is used to calculate the number of vCPUs o Example: `2` |
| `topologyType` | string | No | The CPU topology type of the instance. Valid values: Example: `DiscreteCoreToHTMapping` |
| `configured` | boolean | No | > This parameter is in invitational preview and is unavailable. Example: `false` |
| `id` | string | No | The ID of the private pool. The ID of a private pool is the same as that of the elasticity assurance Example: `eap-bp67acfmxazb4****` |
| `matchCriteria` | string | No | The type of the private pool to use to create the instance. A private pool is generated after an ela Example: `Open` |
| `dedicatedHostClusterId` | string | No | The ID of the dedicated host cluster in which to create the instance. After this parameter is specif Example: `dc-bp12wlf6am0vz9v2****` |
| `confidentialComputingMode` | string | No | The confidential computing mode. Set the value to Enclave. Example: `Enclave` |
| `trustedSystemMode` | string | No | The trusted system mode. Set the value to vTPM. Example: `vTPM` |
| `autoSnapshotPolicyId` | string | No | The ID of the automatic snapshot policy to apply to the system disk. Example: `sp-bp67acfmxazb4p****` |
| `category` | string | No | The category of the system disk. Valid values: Example: `cloud_ssd` |
| `description` | string | No | The description of the system disk. The description must be 2 to 256 characters in length. The descr Example: `SystemDisk_Description` |
| `diskName` | string | No | The name of the system disk. The name must be 2 to 128 characters in length and support Unicode char Example: `cloud_ssdSystem` |
| `performanceLevel` | string | No | The performance level of the ESSD to use as the system disk. Default value: PL1. Valid values: Example: `PL0` |
| ... | ... | ... | *117 more optional parameters* |

## createInstance

**Signature:** `createInstance(request: CreateInstanceRequest)`

>  This operation is no longer iterated or updated. We recommend that you call the [RunInstances](https://help.aliyun.com/document_detail/2679677.html) operation instead. **Before you call this operat.

**Parameters:** (5 required, 75 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenewPeriod` | number | Yes | The auto-renewal period of the instance. This parameter is required if AutoRenew is set to true. Example: `2` |
| `imageId` | string | Yes | The ID of the image to use to create the instance. To use an Alibaba Cloud Marketplace image, you ca Example: `ubuntu_18_04_64_20G_alibase_20190624.vhd` |
| `instanceType` | string | Yes | The instance type. Example: `ecs.g6.large` |
| `regionId` | string | Yes | The ID of the region in which to create the instance. You can call the [DescribeRegions](https://hel Example: `cn-hangzhou` |
| `vSwitchId` | string | Yes | The ID of the vSwitch to which to connect the instance. This parameter is required when you create a Example: `vsw-bp1s5fnvk4gn2tws0****` |
| `configured` | boolean | No | >  This parameter is in invitational preview and is not publicly available. Example: `false` |
| `id` | string | No | The ID of the private pool. The ID of a private pool is the same as that of the elasticity assurance Example: `eap-bp67acfmxazb4****` |
| `matchCriteria` | string | No | The type of the private pool to use to start the instance. A private pool is generated when an elast Example: `Open` |
| `category` | string | No | The category of the system disk. Valid values: Example: `cloud_ssd` |
| `description` | string | No | The description of the system disk. The description must be 2 to 256 characters in length and cannot Example: `TestDescription` |
| `diskName` | string | No | The name of the system disk. The name must be 2 to 128 characters in length. It must start with a le Example: `SystemDiskName` |
| `performanceLevel` | string | No | The performance level of the ESSD that is used as the system disk. Default value: PL1. Valid values: Example: `PL1` |
| `size` | number | No | The size of the system disk. Unit: GiB. Valid values: Example: `40` |
| `storageClusterId` | string | No | The ID of the dedicated block storage cluster. If you want to use disks in a dedicated block storage Example: `dbsc-j5e1sf2vaf5he8m2****` |
| `assumeRoleFor` | number | No | >  This parameter is in invitational preview and is not publicly available. Example: `1234567890` |
| `roleType` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `Primary` |
| `rolearn` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `acs:ram::123456789012****:role/adminrole` |
| `category` | string | No | The category of data disk N. Valid values: Example: `cloud_ssd` |
| `deleteWithInstance` | boolean | No | Specifies whether to release data disk N when the instance is released. Valid values: Example: `true` |
| `description` | string | No | The description of data disk N. The description must be 2 to 256 characters in length and cannot sta Example: `TestDescription` |
| ... | ... | ... | *60 more optional parameters* |

## startInstance

**Signature:** `startInstance(request: StartInstanceRequest)`

This operation is an asynchronous operation. After you call this operation to start an ECS instance, the operation sets the status of the ECS instance to Starting and begins the startup process. You c.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `true` |
| `initLocalDisk` | boolean | No | Specifies whether to restore the ECS instance to the initial health state on startup if a local disk Example: `true` |
| `instanceId` | string | Yes | The ID of the instance that you want to start. Example: `i-bp67acfmxazb4p****` |

## startInstances

**Signature:** `startInstances(request: StartInstancesRequest)`

This operation is an asynchronous operation. After you call this operation to start ECS instances, the operation sets the status of the ECS instances to Starting and begins the startup process. You ca.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `batchOptimization` | string | No | The batch operation mode. Valid values: Example: `AllTogether` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `instanceId` | string[] | Yes | The IDs of ECS instances. Valid values of N: 1 to 100. Example: `i-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The region ID of the ECS instance. You can call the [DescribeRegions](~~DescribeRegions~~) operation Example: `cn-hangzhou` |

## stopInstance

**Signature:** `stopInstance(request: StopInstanceRequest)`

This operation is an asynchronous operation. After you call this operation to stop an ECS instance, the operation sets the status of the ECS instance to Stopping and begins the stop process. You can c.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirmStop` | boolean | No | This parameter will be removed in the future and is retained only to ensure compatibility. We recomm Example: `true` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `true` |
| `forceStop` | boolean | No | Specifies whether to forcefully stop the ECS instance. Valid values: Example: `false` |
| `hibernate` | boolean | No | > This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp67acfmxazb4ph****` |
| `stoppedMode` | string | No | The stop mode of the pay-as-you-go instance. Valid values: Example: `KeepCharging` |

## stopInstances

**Signature:** `stopInstances(request: StopInstancesRequest)`

This operation is an asynchronous operation. After you call this operation to stop an ECS instance, the operation sets the status of the ECS instance to Stopping and begins the stop process. You can c.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `batchOptimization` | string | No | Specifies the batch operation mode. Valid values: Example: `AllTogether` |
| `dryRun` | boolean | No | Specifies whether to send a precheck request. Valid values: Example: `false` |
| `forceStop` | boolean | No | Specifies whether to forcefully stop instances. Valid values: Example: `false` |
| `instanceId` | string[] | Yes | The IDs of ECS instances. You can specify 1 to 100 instance IDs. Example: `i-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `stoppedMode` | string | No | Stop mode. Valid values: Example: `KeepCharging` |

## rebootInstance

**Signature:** `rebootInstance(request: RebootInstanceRequest)`

This operation is an asynchronous operation. After you call this operation to restart an ECS instance, the operation sets the status of the ECS instance to `Starting` and begins the restart process. Y.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `forceStop` | boolean | No | Specifies whether to forcefully stop the ECS instance before the instance is restarted. Valid values Example: `false` |
| `instanceId` | string | Yes | The instance ID. Example: `i-bp67acfmxazb4ph****` |

## rebootInstances

**Signature:** `rebootInstances(request: RebootInstancesRequest)`

This operation is an asynchronous operation. After you call this operation to restart an ECS instance, the operation sets the status of the ECS instance to `Starting` and begins the restart process. Y.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `batchOptimization` | string | No | The batch operation mode. Valid values: Example: `AllTogether` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `forceReboot` | boolean | No | Specifies whether to forcefully restart the instance. Valid values: Example: `false` |
| `instanceId` | string[] | Yes | The IDs of ECS instances. Valid values of N: 1 to 100. Example: `i-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## deleteInstance

**Signature:** `deleteInstance(request: DeleteInstanceRequest)`

* **Warning** After you release an instance, the physical resources used by the instance are recycled. Relevant data is erased and cannot be restored. *   After you release an instance, manual snapsho.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `force` | boolean | No | Specifies whether to forcefully release the ECS instance in the **Running** (`Running`) state. Valid Example: `false` |
| `forceStop` | boolean | No | Specifies whether to forcefully stop the ECS instance in the **Running** (`Running`) state before th Example: `true` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp1g6zv0ce8oghu7****` |
| `terminateSubscription` | boolean | No | Specifies whether to release the expired subscription instance. Valid values: Example: `false` |

## deleteInstances

**Signature:** `deleteInstances(request: DeleteInstancesRequest)`

>Warning: After you release an instance, the physical resources used by the instance are recycled. Relevant data is erased and cannot be restored. *   After you release an instance, manual snapshots o.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Example: `false` |
| `force` | boolean | No | Specifies whether to forcefully release the ECS instance in the **Running** (`Running`) state. Valid Example: `false` |
| `forceStop` | boolean | No | Specifies whether to forcefully stop the ECS instance in the **Running** (`Running`) state before th Example: `true` |
| `instanceId` | string[] | Yes | The IDs of ECS instances. You can specify 1 to 100 ECS instances. Example: `i-bp1g6zv0ce8oghu7****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `terminateSubscription` | boolean | No | Specifies whether to release the expired subscription instance. Example: `false` |

## describeInstances

**Signature:** `describeInstances(request: DescribeInstancesRequest)`

### [](#)Limits *   When you call the API operation by using Alibaba Cloud CLI, you must specify request parameter values of different data types in the required formats. For more information, see [Pa.

**Parameters:** (1 required, 40 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `key` | string | No | The key of filter 1 used to query resources. Set the value to `CreationStartTime`. You can specify a Example: `CreationStartTime` |
| `value` | string | No | The value of filter 1 used to query resources. Set the value to a time. If you specify this paramete Example: `2017-12-05T22:40Z` |
| `key` | string | No | The key of tag N of the instance. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the instance. Valid values of N: 1 to 20. Example: `TestValue` |
| `additionalAttributes` | string[] | No | The additional instance attributes. Example: `META_OPTIONS` |
| `deviceAvailable` | boolean | No | >  This parameter is in invitational preview and is not publicly available. Example: `false` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `eipAddresses` | string | No | The elastic IP addresses (EIPs) of instances. This parameter is valid when InstanceNetworkType is se Example: `["42.1.1.**",` |
| `hpcClusterId` | string | No | The ID of the high-performance computing (HPC) cluster to which the instance belongs. Example: `hpc-bp67acfmxazb4p****` |
| `httpEndpoint` | string | No | Specifies whether the access channel is enabled for instance metadata. Valid values: Example: `enabled` |
| `httpPutResponseHopLimit` | number | No | >  This parameter is in invitational preview and is not publicly available. Example: `0` |
| `httpTokens` | string | No | Specifies whether the security hardening mode (IMDSv2) is forcefully used to access instance metadat Example: `optional` |
| `imageId` | string | No | The ID of the image. Example: `m-bp67acfmxazb4p****` |
| `innerIpAddresses` | string | No | The internal IP addresses of instances located in the classic network. This parameter is valid when  Example: `["10.1.1.1",` |
| `instanceChargeType` | string | No | The billing method of the instance. Valid values: Example: `PostPaid` |
| ... | ... | ... | *25 more optional parameters* |

## describeInstanceStatus

**Signature:** `describeInstanceStatus(request: DescribeInstanceStatusRequest)`

For information about the lifecycle states of an ECS instance, see [Instance lifecycle](https://help.aliyun.com/document_detail/25687.html). ## [](#)Sample requests *   Query the ECS instances and the.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clusterId` | string | No | The ID of the cluster to which the ECS instances belong. Example: `cls-bp67acfmxazb4p****` |
| `instanceId` | string[] | No | The IDs of ECS instances. You can specify 1 to 100 instance IDs. Example: `i-bp1j4i2jdf3owlhe****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 50. Example: `10` |
| `regionId` | string | Yes | The region ID of the instances. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |
| `zoneId` | string | No | The zone ID of the instances. You can call the [DescribeZones](https://help.aliyun.com/document_deta Example: `cn-hangzhou-d` |

## describeInstanceAttribute

**Signature:** `describeInstanceAttribute(request: DescribeInstanceAttributeRequest)`

Queries the attributes of a specific Elastic Compute Service (ECS) instance..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `i-uf6f5trc95ug8t33****` |

## describeInstanceVncUrl

**Signature:** `describeInstanceVncUrl(request: DescribeInstanceVncUrlRequest)`

You cannot directly use the VNC logon address (VncUrl) in the response to log on to an ECS instance. To log on to the ECS instance, you can use the **web management terminal URL** that contains the VN.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance Example: `i-bp1hzoinajzkh91h****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## describeInstanceRamRole

**Signature:** `describeInstanceRamRole(request: DescribeInstanceRamRoleRequest)`

## [](#)Usage notes When you call the API operation by using Alibaba Cloud CLI, you must specify request parameter values of different data types in the required formats. For more information, see [Pa.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | No | The IDs of ECS instances. You can specify up to 50 instance IDs in a single request. Example: `["i-bp67acfmxazb1p****",` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `ramRoleName` | string | No | The name of the instance RAM role. If you specify this parameter, all ECS instances to which the ins Example: `EcsServiceRole-EcsDocGuideTest` |
| `regionId` | string | Yes | The region ID of the instance RAM role. You can call the [DescribeRegions](https://help.aliyun.com/d Example: `cn-hangzhou` |

## describeInstanceHistoryEvents

**Signature:** `describeInstanceHistoryEvents(request: DescribeInstanceHistoryEventsRequest)`

You can query system events that were completed within the last 30 days. No limits apply to the time range for querying uncompleted system events. *   If you do not specify the EventCycleStatus or Ins.

**Parameters:** (1 required, 21 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `end` | string | No | The end of the time range in which to query published system events. Specify the time in the [ISO 86 Example: `2017-12-01T06:32:31Z` |
| `start` | string | No | The beginning of the time range in which to query published system events. Specify the time in the [ Example: `2017-11-30T06:32:31Z` |
| `end` | string | No | The latest scheduled end time for the system event. Specify the time in the [ISO 8601](https://help. Example: `2017-12-01T06:32:31Z` |
| `start` | string | No | The earliest scheduled start time for the system event. Specify the time in the [ISO 8601](https://h Example: `2017-11-30T06:32:31Z` |
| `key` | string | No | The key of tag N of the resource. Example: `TestKey` |
| `value` | string | No | The value of tag N of the resource. Example: `TestValue` |
| `eventCycleStatus` | string | No | The lifecycle state of the system event. This parameter takes effect only when InstanceEventCycleSta Example: `Executed` |
| `eventId` | string[] | No | The ID of system event N. Valid values of N: 1 to 100. You can repeat this parameter to pass multipl Example: `e-uf64yvznlao4jl2c****` |
| `eventType` | string | No | The type of the system event. This parameter takes effect only when InstanceEventType.N is not speci Example: `SystemMaintenance.Reboot` |
| `impactLevel` | string | No | >  This parameter is not publicly available. Example: `null` |
| `instanceEventCycleStatus` | string[] | No | The lifecycle state of system event N. Valid values of N: 1 to 7. You can repeat this parameter to p Example: `Executed` |
| `instanceEventType` | string[] | No | The type of system event N. Valid values of N: 1 to 30. You can repeat this parameter to pass multip Example: `SystemMaintenance.Reboot` |
| `instanceId` | string | No | The ID of the instance. If this parameter is not specified, the system events of all instances in th Example: `i-uf678mass4zvr9n1****` |
| `maxResults` | number | No | The number of entries to return on each page. Valid values: 10 to 100. Example: `100` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `f1c9fa9de5752***` |
| `pageNumber` | number | No | >  This parameter is deprecated. We recommend that you specify MaxResults or NextToken for a paged q Example: `1` |
| `pageSize` | number | No | >  This parameter is deprecated. We recommend that you specify MaxResults or NextToken for a paged q Example: `10` |
| `regionId` | string | Yes | The region ID of the resource. You can call [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the resource belongs. Example: `rg-bp67acfmxazb4p****` |
| `resourceId` | string[] | No | The ID of resource N. Valid values of N: 1 to 100. You can repeat this parameter to pass multiple va Example: `i-uf678mass4zvr9n1****` |
| `resourceType` | string | No | The type of the resource. Valid values: Example: `instance` |
| `tag` | DescribeInstanceHistoryEventsRequestTag[] | No | - |

## describeInstanceMaintenanceAttributes

**Signature:** `describeInstanceMaintenanceAttributes(request: DescribeInstanceMaintenanceAttributesRequest)`

This operation is used to query the specified maintenance policy of an instance, which contains the following maintenance attributes: *   Maintenance window: the time period that you specify for maint.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string[] | No | The instance IDs. You can specify up to 100 instance IDs. Example: `i-bp67acfmxazb4p****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## describeInstanceAutoRenewAttribute

**Signature:** `describeInstanceAutoRenewAttribute(request: DescribeInstanceAutoRenewAttributeRequest)`

Only subscription instances are supported. If you call this operation for a pay-as-you-go instance, an error is returned. *   Before you configure auto-renewal or manual renewal for subscription insta.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The IDs of the instances. You can specify up to 100 subscription instance IDs in a single request. S Example: `i-bp18x3z4hc7bixhx****,i-bp1g6zv0ce8oghu7****` |
| `pageNumber` | string | No | The page number. Example: `1` |
| `pageSize` | string | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `renewalStatus` | string | No | The auto-renewal state of the instance. Valid values: Example: `AutoRenewal` |

## describeInstanceMonitorData

**Signature:** `describeInstanceMonitorData(request: DescribeInstanceMonitorDataRequest)`

## [](#)Usage notes Take note of the following items: *   Up to 400 monitoring data entries can be returned at a time. Make sure that the `TotalCount` value does not exceed 400. The value is calculate.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com/docum Example: `2014-10-30T08:00:00Z` |
| `instanceId` | string | Yes | The instance ID. Example: `i-bp1a36962lrhj4ab****` |
| `period` | number | No | The interval at which to retrieve monitoring data. Unit: seconds. Valid values: Example: `60` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com Example: `2014-10-29T23:00:00Z` |

## describeInstanceTopology

**Signature:** `describeInstanceTopology(request: DescribeInstanceTopologyRequest)`

Queries the topology of the host on which an Elastic Compute Service (ECS) instance resides..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | No | The IDs of one or more ECS instances. You can specify a maximum of 100 instance IDs. Example: `["i-bp67acfmxazb4p****"]` |
| `regionId` | string | Yes | The region ID of the ECS instance. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

## describeInstanceTypeFamilies

**Signature:** `describeInstanceTypeFamilies(request: DescribeInstanceTypeFamiliesRequest)`

Queries the instance families provided by Elastic Compute Service (ECS). You can call the DescribeInstanceTypeFamilies operation to obtain information about different series of instance families. This.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `generation` | string | No | The series of the instance family. For more information, see [Overview of instance families](https:/ Example: `ecs-5` |
| `regionId` | string | Yes | The region ID of the instance family. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |

## describeInstanceTypes

**Signature:** `describeInstanceTypes(request: DescribeInstanceTypesRequest)`

**Paged query**: You can set MaxResults to specify the maximum number of entries to return in a single call. If the number of entries to return exceeds the specified MaxResults value, the response inc.

**Parameters:** (0 required, 44 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `additionalAttributes` | string[] | No | - |
| `cpuArchitecture` | string | No | The CPU architecture. Valid values: Example: `X86` |
| `cpuArchitectures` | string[] | No | - |
| `GPUSpec` | string | No | The GPU model. Example: `NVIDIA` |
| `gpuSpecs` | string[] | No | - |
| `instanceCategories` | string[] | No | - |
| `instanceCategory` | string | No | The category of the instance type. Valid values: Example: `Big` |
| `instanceFamilyLevel` | string | No | The level of the instance family. Valid values: Example: `EntryLevel` |
| `instanceTypeFamilies` | string[] | No | - |
| `instanceTypeFamily` | string | No | The instance family to which the instance type belongs. For information about the valid values of th Example: `ecs.g6` |
| `instanceTypes` | string[] | No | The instance types. You can specify 1 to 10 instance types. If this parameter is empty, information  Example: `ecs.g6.large` |
| `localStorageCategories` | string[] | No | - |
| `localStorageCategory` | string | No | The category of local disks. For more information, see [Local disks](~~63138#section_n2w_8yc_5u1~~). Example: `local_ssd_pro` |
| `maxResults` | number | No | The maximum number of entries per page. Valid values: 1 to 1600. Example: `10` |
| `maximumCpuCoreCount` | number | No | The maximum number of vCPUs. The value must be a positive integer. Example: `10` |
| ... | ... | ... | *29 more optional parameters* |

## modifyInstanceAttribute

**Signature:** `modifyInstanceAttribute(request: ModifyInstanceAttributeRequest)`

You cannot call this operation to modify the attributes of the ECS instances that are locked for security reasons. For more information, see [API behavior when an instance is locked for security reaso.

**Parameters:** (1 required, 23 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `core` | number | No | The number of CPU cores. This parameter cannot be specified but only uses its default value. Example: `2` |
| `threadsPerCore` | number | No | The number of threads per CPU core. The following formula is used to calculate the number of vCPUs o Example: `2` |
| `topologyType` | string | No | The CPU topology type of the instance. Valid values: Example: `DiscreteCoreToHTMapping` |
| `enableInstanceIdDnsAAAARecord` | boolean | No | Specifies whether DNS Resolution from the Instance ID-based Hostname to the Instance Primary Private Example: `false` |
| `enableInstanceIdDnsARecord` | boolean | No | Specifies whether DNS Resolution from the Instance ID-based Hostname to the Instance Primary Private Example: `false` |
| `enableIpDnsARecord` | boolean | No | Specifies whether DNS Resolution from the IP Address-based Hostname to the Instance Primary Private  Example: `false` |
| `enableIpDnsPtrRecord` | boolean | No | Specifies whether Reverse DNS Resolution from the Instance Primary Private IPv4 Address to the IP Ad Example: `false` |
| `hostnameType` | string | No | The type of the hostname. Valid values: Example: `Custom` |
| `password` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `type` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `creditSpecification` | string | No | The performance mode of the burstable instance. Valid values: Example: `Standard` |
| `deletionProtection` | boolean | No | The release protection attribute of the instance. This parameter specifies whether you can use the E Example: `false` |
| `description` | string | No | The description of the instance. The description must be 2 to 256 characters in length and cannot st Example: `testInstanceDescription` |
| `enableJumboFrame` | boolean | No | Specifies whether to enable the Jumbo Frames feature for the instance. Valid values: Example: `false` |
| `hostName` | string | No | The hostname of the instance. Take note of the following items: Example: `testHostName` |
| `instanceId` | string | Yes | The instance ID. Example: `i-bp67acfmxazb4ph****` |
| `instanceName` | string | No | The name of the instance. The name must be 2 to 128 characters in length. The name must start with a Example: `testInstanceName` |
| `networkInterfaceQueueNumber` | number | No | The number of queues supported by the primary elastic network interface (ENI) of the instance. Take  Example: `8` |
| `password` | string | No | The password of the instance. The password must be 8 to 30 characters in length and contain at least Example: `Test123456` |
| `privateDnsNameOptions` | ModifyInstanceAttributeRequestPrivateDnsNameOptions | No | The private domain name options of the ECS instance. |
| `recyclable` | boolean | No | >  This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `remoteConnectionOptions` | ModifyInstanceAttributeRequestRemoteConnectionOptions | No | - |
| `securityGroupIds` | string[] | No | The IDs of the new security groups to which to assign the instance. Take note of the following items Example: `sg-bp15ed6xe1yxeycg7o****` |
| `userData` | string | No | The user data of the instance. We recommend that you encode the data in Base64. Take note of the fol Example: `ZWNobyBoZWxsbyBlY3Mh` |

## modifyInstanceAutoReleaseTime

**Signature:** `modifyInstanceAutoReleaseTime(request: ModifyInstanceAutoReleaseTimeRequest)`

Changes the automatic release time of a pay-as-you-go or spot instance or cancels the automatic release of the instance..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoReleaseTime` | string | No | The automatic release time of the instance. Specify the time in the [ISO 8601](https://help.aliyun.c Example: `2018-01-01T01:02:03Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp1env7nl3mijm2t****` |
| `regionId` | string | No | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## modifyInstanceAutoRenewAttribute

**Signature:** `modifyInstanceAutoRenewAttribute(request: ModifyInstanceAutoRenewAttributeRequest)`

*Before you call this operation, make sure that you are familiar with the billing methods and [pricing](https://www.alibabacloud.com/product/ecs#pricing) of Elastic Compute Service (ECS)**. *   Make s.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal. Example: `true` |
| `duration` | number | No | The auto-renewal period of the instance. Example: `1` |
| `instanceId` | string | Yes | The ID of the instance. You can specify up to 100 subscription instance IDs. Separate the instance I Example: `i-bp67acfmxazb4ph****,i-bp67acfmxazb4pi****` |
| `periodUnit` | string | No | The unit of the renewal period (`Duration`). Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `renewalStatus` | string | No | The auto-renewal status of the instance. Valid values: Example: `AutoRenewal` |

## modifyInstanceChargeType

**Signature:** `modifyInstanceChargeType(request: ModifyInstanceChargeTypeRequest)`

### [](#)Precautions *   Before you call this operation, make sure that you are familiar with the [subscription](https://help.aliyun.com/document_detail/56220.html) and [pay-as-you-go](https://help.al.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to automatically complete the payment. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `includeDataDisks` | boolean | No | Specifies whether to change the billing method of all data disks on the instance from pay-as-you-go  Example: `false` |
| `instanceChargeType` | string | No | The new billing method of the instance. Valid values: Example: `PrePaid` |
| `instanceIds` | string | Yes | The instance IDs. The value can be a JSON array that consists of up to 20 instance IDs. Separate the Example: `["i-bp67acfmxazb4p****","i-bp67acfmxazb4d****"]` |
| `isDetailFee` | boolean | No | Specifies whether to return cost details of the order after the billing method is changed from subsc Example: `false` |
| `period` | number | No | The renewal duration of the subscription instance. If the instance is hosted on a dedicated host, th Example: `1` |
| `periodUnit` | string | No | The unit of the renewal duration specified by `Period`. Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

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

## modifyInstanceMaintenanceAttributes

**Signature:** `modifyInstanceMaintenanceAttributes(request: ModifyInstanceMaintenanceAttributesRequest)`

This operation is used to modify the maintenance policy of an instance. The maintenance policy consists of the following maintenance attributes: *   Maintenance window: the time period that you specif.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end time of the maintenance window. The time must be on the hour. You must configure both StartT Example: `18:00:00` |
| `startTime` | string | No | The start time of the maintenance window. The time must be on the hour. You must configure both Star Example: `02:00:00` |
| `actionOnMaintenance` | string | No | The maintenance action. Valid values: Example: `AutoRecover` |
| `instanceId` | string[] | No | The ID of instance N. Valid values of N: 1 to 100. Example: `i-bp67acfmxazb4ph****` |
| `maintenanceWindow` | ModifyInstanceMaintenanceAttributesRequestMaintenanceWindow[] | No | - |
| `notifyOnMaintenance` | boolean | No | Specifies whether to send an event notification before maintenance. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## modifyInstanceMetadataOptions

**Signature:** `modifyInstanceMetadataOptions(request: ModifyInstanceMetadataOptionsRequest)`

Modifies the metadata access configurations of instances in a specific region, including whether to enable the metadata access channel and whether to forcefully use the security hardening mode to acce.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `httpEndpoint` | string | Yes | Specifies whether to enable the access channel for instance metadata. Valid values: Example: `enabled` |
| `httpPutResponseHopLimit` | number | No | >  This parameter is not publicly available. Example: `1` |
| `httpTokens` | string | No | Specifies whether to forcefully use the security hardening mode (IMDSv2) to access instance metadata Example: `optional` |
| `instanceId` | string | No | The ID of the instance. Example: `i-bp67acfmxaz****` |
| `instanceMetadataTags` | string | No | Specifies whether to enable the access channel for instance metadata. Valid values: Example: `null` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## modifyInstanceNetworkSpec

**Signature:** `modifyInstanceNetworkSpec(request: ModifyInstanceNetworkSpecRequest)`

Take note of the following items: *   If you upgrade the outbound public bandwidth (InternetMaxBandwidthOut) of a subscription (PrePaid) instance from 0 Mbit/s when you modify the network configuratio.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocatePublicIp` | boolean | No | Specifies whether to assign a public IP address. Valid values: Example: `false` |
| `autoPay` | boolean | No | Specifies whether to automatically complete the payment. Valid values: Example: `true` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `endTime` | string | No | The end time of the temporary bandwidth upgrade. Specify the time in the [ISO 8601](https://help.ali Example: `2017-12-06T22Z` |
| `ISP` | string | No | > This parameter is in invitational preview and is not publicly available. Example: `null` |
| `instanceId` | string | Yes | The ID of the instance for which you want to modify network configurations. Example: `i-bp67acfmxazb4****` |
| `internetMaxBandwidthIn` | number | No | The maximum inbound bandwidth from the Internet. Unit: Mbit/s. Valid values: Example: `10` |
| `internetMaxBandwidthOut` | number | No | The maximum outbound public bandwidth. Unit: Mbit/s. Valid values: Example: `10` |
| `networkChargeType` | string | No | The billing method for network usage. Valid values: Example: `PayByTraffic` |
| `startTime` | string | No | The start time of the temporary bandwidth upgrade. Specify the time in the [ISO 8601](https://help.a Example: `2017-12-05T22:40Z` |

## modifyInstanceSpec

**Signature:** `modifyInstanceSpec(request: ModifyInstanceSpecRequest)`

*Before you call this operation, familiarize yourself with the billing and [pricing](https://www.alibabacloud.com/zh/pricing-calculator#/commodity/vm_intl) of ECS resources.** Before you [change the i.

**Parameters:** (1 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The new category of the system disk. Valid values: Example: `cloud_ssd` |
| `endTime` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `internetMaxBandwidthOut` | number | No | >  This parameter is in invitational preview and is not publicly available. Example: `0` |
| `startTime` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `hide` |
| `category` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `null` |
| `diskId` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `null` |
| `performanceLevel` | string | No | >  This parameter is in invitational preview and is not publicly available. Example: `null` |
| `allowMigrateAcrossZone` | boolean | No | Specifies whether to allow cross-cluster instance type upgrade. Valid values: Example: `false` |
| `async` | boolean | No | Specifies whether to submit an asynchronous request. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `disk` | ModifyInstanceSpecRequestDisk[] | No | - |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp67acfmxazb4p****` |
| `instanceType` | string | No | The new instance type. For more information, see [Overview of instance families](https://help.aliyun Example: `ecs.g6.large` |
| `internetMaxBandwidthIn` | number | No | The maximum inbound public bandwidth. Unit: Mbit/s. Valid values: Example: `10` |
| `internetMaxBandwidthOut` | number | No | The maximum outbound public bandwidth. Unit: Mbit/s. Valid values: 0 to 100. Example: `10` |
| `modifyMode` | string | No | >  This parameter is not publicly available. Example: `null` |

## modifyInstanceVncPasswd

**Signature:** `modifyInstanceVncPasswd(request: ModifyInstanceVncPasswdRequest)`

The VNC password must be six characters in length and can contain uppercase letters, lowercase letters, and digits. *   After you modify the VNC password of an ECS instance, take note of the following.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the ECS instance. Example: `i-bp67acfmxazb4ph****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `vncPassword` | string | Yes | The new VNC password of the ECS instance. Example: `Ecs123` |

## modifyInstanceVpcAttribute

**Signature:** `modifyInstanceVpcAttribute(request: ModifyInstanceVpcAttributeRequest)`

The ECS instance that you want to manage must be in the **Stopped** (`Stopped`) state. *   When you call this operation to change the private IP address or vSwitch of an ECS instance, take note of the.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the ECS instance. Example: `i-bp1iudwa5b1tqag1****` |
| `privateIpAddress` | string | No | The new private IP address of the ECS instance. Example: ```172.17.**.**``` |
| `securityGroupId` | string[] | Yes | The IDs of new security groups to which the ECS instance belongs after the VPC is changed. This para Example: `sg-o6w9l8bc8dgmkw87****` |
| `vSwitchId` | string | Yes | The ID of the new vSwitch. Example: `vsw-bp1s5fnvk4gn3tw12****` |
| `vpcId` | string | No | The ID of the new VPC. Example: `vpc-bp1vwnn14rqpyiczj****` |

## modifyPrepayInstanceSpec

**Signature:** `modifyPrepayInstanceSpec(request: ModifyPrepayInstanceSpecRequest)`

*Before you call this operation, make sure that you are familiar with the billing methods, [prices](https://www.alibabacloud.com/zh/pricing-calculator#/commodity/vm_intl), and [rules for unsubscribing.

**Parameters:** (3 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The new category of the system disk. Valid values: Example: `cloud_efficiency` |
| `category` | string | No | >  This parameter is not publicly available. Example: `null` |
| `diskId` | string | No | >  This parameter is not publicly available. Example: `null` |
| `performanceLevel` | string | No | >  This parameter is not publicly available. Example: `null` |
| `autoPay` | boolean | No | Specifies whether to enable automatic payment when you upgrade the instance type. Valid values: Example: `true` |
| `clientToken` | string | No | The client token that you want to use to ensure the idempotency of the request. You can use the clie Example: `123e4567-e89b-12d3-a456-426655440000` |
| `disk` | ModifyPrepayInstanceSpecRequestDisk[] | No | - |
| `endTime` | string | No | The end time of the temporary change. The time follows the [ISO 8601](https://help.aliyun.com/docume Example: `2018-01-01T12:05Z` |
| `instanceId` | string | Yes | The instance ID. Example: `i-bp67acfmxazb4ph****` |
| `instanceType` | string | Yes | The new instance type. For information about available instance types, see [Instance families](https Example: `ecs.g5.xlarge` |
| `migrateAcrossZone` | boolean | No | Specifies whether to allow cross-cluster instance type upgrade. Valid values: Example: `false` |
| `modifyMode` | string | No | >  This parameter is not publicly available. Example: `null` |
| `operatorType` | string | No | The type of the change to the instance. Valid values: Example: `upgrade` |
| `rebootTime` | string | No | The restart time of the instance. The time follows the [ISO 8601](https://help.aliyun.com/document_d Example: `2018-01-01T12:05Z` |
| `rebootWhenFinished` | boolean | No | Specifies whether to restart the instance immediately after the instance type is changed. Valid valu Example: `false` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## renewInstance

**Signature:** `renewInstance(request: RenewInstanceRequest)`

*Before you call this operation, make sure that you are familiar with the billing methods and [pricing](https://www.alibabacloud.com/product/ecs#pricing) of ECS**. *   Make sure that your account bala.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `expectedRenewDay` | number | No | Specifies the [unified expiration date](https://help.aliyun.com/document_detail/63396.html). Valid v Example: `5` |
| `instanceId` | string | Yes | The ID of the instance that you want to renew. Example: `i-bp67acfmxazb4p****` |
| `period` | number | No | The renewal period of the subscription instance. If `DedicatedHostId` is specified, the value of Per Example: `1` |
| `periodUnit` | string | No | The unit of the renewal period. Valid values: Example: `Month` |

## replaceSystemDisk

**Signature:** `replaceSystemDisk(request: ReplaceSystemDiskRequest)`

Before you call this operation, refer to [Replace the operating system (system disk) of an instance](https://help.aliyun.com/document_detail/50134.html). When you call this operation for an ECS instan.

**Parameters:** (2 required, 17 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `size` | number | No | The capacity of the new system disk. Unit: GiB. Valid values: Example: `80` |
| `assumeRoleFor` | number | No | > This parameter is unavailable. Example: `0` |
| `roleType` | string | No | > This parameter is not available for public use. Example: `null` |
| `rolearn` | string | No | > This parameter is not available for public use. Example: `null` |
| `architecture` | string | No | >  This parameter is deprecated. Example: `i386` |
| `arn` | ReplaceSystemDiskRequestArn[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotency of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `diskId` | string | No | >  This parameter is deprecated. To improve compatibility, we recommend that you use `ImageId`. Example: `d-bp67acfmxazb4ph****` |
| `encryptAlgorithm` | string | No | > This parameter is not available for public use. Example: `hide` |
| `encrypted` | boolean | No | Specifies whether to encrypt the disk. Valid values: Example: `false` |
| `imageId` | string | Yes | The ID of the image used to replace the system disk. This parameter is required. Example: `m-bp67acfmxazb4ph****` |
| `instanceId` | string | Yes | The ID of the instance whose operating system you want to replace. Example: `i-bp67acfmxazb4ph****` |
| `KMSKeyId` | string | No | The ID of the KMS key to use for the system disk. Example: `e522b26d-abf6-4e0d-b5da-04b7******3c` |
| `keyPairName` | string | No | The name of the key pair. Example: `testKeyPairName` |
| `password` | string | No | Specifies whether to reset the password for the instance. The password must be 8 to 30 characters in Example: `EcsV587!` |
| `passwordInherit` | boolean | No | Specifies whether to use the preset password of the image. Example: `false` |
| `platform` | string | No | >  This parameter is deprecated. Example: `CentOS` |
| `securityEnhancementStrategy` | string | No | Specifies whether to use Security Center Basic after the system disk is replaced. Valid values: Example: `Active` |
| `useAdditionalService` | boolean | No | Specifies whether to use the system configurations for virtual machines provided by Alibaba Cloud. S Example: `true` |

## reportInstancesStatus

**Signature:** `reportInstancesStatus(request: ReportInstancesStatusRequest)`

Reports an exception on Elastic Compute Service (ECS) instances. You can report the same exception on multiple ECS instances or on multiple disks of an ECS instance..

**Parameters:** (4 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Yes | The description of the exception. Example: `The` |
| `device` | string[] | No | The device names of disks on an instance that have the exception. You can specify to 100 device name Example: `/dev/xvdb` |
| `diskId` | string[] | Yes | The IDs of disks on an instance that have the exception. You can specify up to 100 disk IDs in a sin Example: `d-bp1aeljlfad7x6u1****` |
| `endTime` | string | No | The end time of the instance exception. Specify the time in the ISO 8601 standard in the yyyy-MM-ddT Example: `2017-11-31T06:32:31Z` |
| `instanceId` | string[] | Yes | The IDs of instances. You can specify up to 100 instance IDs in a single request. Example: `i-bp165p6xk2tmdhj0****` |
| `issueCategory` | string | No | The category of the exception. This parameter is applicable only to ECS bare metal instances. Valid  Example: `hardware-cpu-error` |
| `reason` | string | No | The impact of the exception on the instance. Valid values: Example: `abnormal-local-disk` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `startTime` | string | No | The start time of the instance exception. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2017-11-30T06:32:31Z` |

## attachInstanceRamRole

**Signature:** `attachInstanceRamRole(request: AttachInstanceRamRoleRequest)`

You can call the [DescribeInstanceRamRole](https://help.aliyun.com/document_detail/2679686.html) operation to query the [instance RAM roles](https://help.aliyun.com/document_detail/61175.html) that ar.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | Yes | The IDs of ECS instances. You can specify 1 to 100 ECS instances. Example: `[“i-bp14ss25xca5ex1u****”,` |
| `policy` | string | No | The additional policy. When you attach an instance RAM role to instances, you can specify an additio Example: `{"Statement":` |
| `ramRoleName` | string | Yes | The name of the instance RAM role. You can call the [ListRoles](https://help.aliyun.com/document_det Example: `testRamRoleName` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## detachInstanceRamRole

**Signature:** `detachInstanceRamRole(request: DetachInstanceRamRoleRequest)`

Detaches instance Resource Access Management (RAM) roles from Elastic Compute Service (ECS) instances..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | Yes | The IDs of ECS instances. You can specify 1 to 100 instance IDs. Example: `["i-bp67acfmxazb4p****",` |
| `ramRoleName` | string | No | The name of the instance RAM role. You can call the [ListRoles](https://help.aliyun.com/document_det Example: `RamRoleTest` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## describeSpotPriceHistory

**Signature:** `describeSpotPriceHistory(request: DescribeSpotPriceHistoryRequest)`

This operation is applicable only to I/O optimized spot instances. *   The data returned by the interface may be paginated. If the returned data contains the `NextOffset` parameter, you can set the `O.

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | No | The end of the time range to query. Specify the time in the [ISO 8601 standard](https://help.aliyun. Example: `2017-08-22T08:45:08Z` |
| `instanceType` | string | Yes | The beginning of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com Example: `ecs.t1.xsmall` |
| `ioOptimized` | string | No | Specifies whether the instance is I/O optimized. Valid values: Example: `optimized` |
| `networkType` | string | Yes | The network type of the spot instance. Valid values: Example: `vpc` |
| `OSType` | string | No | The type of the operating system platform. Valid values: Example: `linux` |
| `offset` | number | No | The line from which the query starts. Example: `0` |
| `regionId` | string | Yes | The zone ID of the spot instance. Example: `cn-hangzhou` |
| `spotDuration` | number | No | The protection period of the spot instance. Unit: hours. Default value: 1. Valid values: Example: `1` |
| `startTime` | string | No | The beginning of the time range to query. The value of this parameter and the value of EndTime can b Example: `2017-08-22T08:45:08Z` |
| `zoneId` | string | No | The spot price (market price) of the spot instance. Example: `cn-hangzhou-g` |

## describeSpotAdvice

**Signature:** `describeSpotAdvice(request: DescribeSpotAdviceRequest)`

This operation is applicable only to I/O optimized spot instances that reside in virtual private clouds (VPCs). *   You can use one of the following methods to call this operation: *   Specify `Cores`.

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cores` | number | No | The number of vCPUs of the instance type. For more information, see [Instance families](https://help Example: `2` |
| `gpuAmount` | number | No | The number of GPUs that a GPU-accelerated instance has. For information about the valid values, see  Example: `2` |
| `gpuSpec` | string | No | The GPU type. Valid values: Example: `NVIDIA` |
| `instanceFamilyLevel` | string | No | The level of the instance family. Valid values: Example: `EntryLevel` |
| `instanceTypeFamily` | string | No | The instance family. For more information, see [Instance families](https://help.aliyun.com/document_ Example: `ecs.c5` |
| `instanceTypes` | string[] | No | The instance types. You can specify up to 10 instance types. Example: `ecs.c5.large` |
| `memory` | number | No | The memory size of the instance type. Unit: GiB. For more information, see [Instance families](https Example: `8.0` |
| `minCores` | number | No | The minimum number of vCPUs of the instance type. For more information, see [Instance families](http Example: `2` |
| `minMemory` | number | No | The minimum memory size of the instance type. For more information, see [Instance families](https:// Example: `8.0` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `zoneId` | string | No | The zone ID. Example: `cn-hangzhou-i` |

## describeRenewalPrice

**Signature:** `describeRenewalPrice(request: DescribeRenewalPriceRequest)`

You can call this operation to query the price for renewing a subscription instance for a specific period of time or to a synchronized expiration date. *   Take note of the following items: *   If you.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expectedRenewDay` | number | No | The synchronized expiration date. If you specify this parameter, the price for renewing a specified  Example: `5` |
| `period` | number | No | The renewal period. Valid values: Example: `1` |
| `priceUnit` | string | No | The unit of the renewal period. Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The ID of the resource. If the `ResourceType` parameter is set to`  instance `, the value of the `Re Example: `i-bp1f2o4ldh8l29zv****` |
| `resourceType` | string | No | The type of the resource. Set the value to instance. Example: `instance` |

## describePrice

**Signature:** `describePrice(request: DescribePriceRequest)`

The required parameters vary based on the type of resource whose prices you want to query. *   When `ResourceType` is set to instance, you must specify `InstanceType`. By default, `ChargeType` is set .

**Parameters:** (1 required, 37 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `category` | string | No | The category of data disk N. Valid values: Example: `cloud_ssd` |
| `performanceLevel` | string | No | The performance level of data disk N when the disk is an ESSD. This parameter takes effect only when Example: `PL1` |
| `size` | number | No | The size of data disk N. Unit: GiB. Valid values: Example: `2000` |
| `provisionedIops` | number | No | The provisioned read/write IOPS of the ESSD AutoPL disk to use as data disk N. Valid values: 0 to mi Example: `40000` |
| `dedicatedHostId` | string | No | This parameter takes effect only when ResourceType is set to instance. Example: `dh-bp67acfmxazb4p****` |
| `category` | string | No | The category of the system disk. Valid values: Example: `cloud_ssd` |
| `performanceLevel` | string | No | The performance level of the system disk when the disk is an ESSD. This parameter is valid only when Example: `PL1` |
| `size` | number | No | The size of the system disk. Unit: GiB. Valid values: Example: `80` |
| `endHour` | number | No | The end time of the assurance period for the capacity reservation of the time-segmented elasticity a Example: `10` |
| `recurrenceType` | string | No | The type of the assurance schedule. Valid values: Example: `Daily` |
| `recurrenceValue` | string | No | The days of the week or month on which the capacity reservation of the time-segmented elasticity ass Example: `5` |
| `startHour` | number | No | The start time of the assurance period for the capacity reservation of the time-segmented elasticity Example: `4` |
| `amount` | number | No | The number of ECS instances. You can specify this parameter when you want to query the prices of mul Example: `1` |
| `assuranceTimes` | string | No | The total number of times that the elasticity assurance can be applied. Set the value to Unlimited.  Example: `Unlimited` |
| `capacity` | number | No | The storage capacity. Unit: GiB. Example: `1024` |
| ... | ... | ... | *22 more optional parameters* |

## purchaseReservedInstancesOffering

**Signature:** `purchaseReservedInstancesOffering(request: PurchaseReservedInstancesOfferingRequest)`

*Before you call this operation, make sure that you are familiar with the billing methods and [pricing](https://www.alibabacloud.com/zh/pricing-calculator#/commodity/vm_intl) of reserved instances.** .

**Parameters:** (2 required, 17 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key to add to the reserved instance. The tag key cannot be an empty string. The tag key can  Example: `TestKey` |
| `value` | string | No | The tag value to add to the reserved instance. The tag value cannot be an empty string. The tag valu Example: `TestValue` |
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal for the reserved instance. Valid values: Example: `true` |
| `autoRenewPeriod` | number | No | The auto-renewal term of the reserved instance. Unit: months. This parameter takes effect only when  Example: `1` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the reserved instance. The description can be 2 to 256 characters in length and c Example: `testDescription` |
| `instanceAmount` | number | No | The number of pay-as-you-go instances of the same instance type that the reserved instance can match Example: `3` |
| `instanceType` | string | Yes | The instance type that the reserved instance can match. Example: `ecs.g5.large` |
| `offeringType` | string | No | The payment option of the reserved instance. Valid values: Example: `All` |
| `period` | number | No | The validity period of the reserved instance. Example: `1` |
| `periodUnit` | string | No | The unit of the validity period of the reserved instance. Example: `Year` |
| `platform` | string | No | The operating system of the image used by the instance. Valid values: Example: `Linux` |
| `regionId` | string | Yes | The ID of the region in which to purchase a reserved instance. You can call the [DescribeRegions](ht Example: `cn-hangzhou` |
| `reservedInstanceName` | string | No | The name of the reserved instance. The name must be 2 to 128 characters in length. The name must sta Example: `testReservedInstanceName` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-bp199lyny9b3****` |
| `scope` | string | No | The scope of reserved instance N. Valid values: Example: `Zone` |
| `startTime` | string | No | The time when you want the reserved instance to take effect. Specify the time in the [ISO 8601 stand Example: `2024-07-04T15Z` |
| `tag` | PurchaseReservedInstancesOfferingRequestTag[] | No | - |
| `zoneId` | string | No | The ID of the zone in which to purchase the reserved instance. This parameter takes effect and is re Example: `cn-hangzhou-g` |

## describeReservedInstances

**Signature:** `describeReservedInstances(request: DescribeReservedInstancesRequest)`

### [](#)Scenarios *   Query all reserved instances in a specific region. *   Query the details of a reserved instance based on the ID or name. *   Query your purchased reserved instances based on the.

**Parameters:** (1 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the reserved instance. The tag key cannot be empty and can be up to 128 characte Example: `TestKey` |
| `value` | string | No | The value of tag N of the reserved instance. The tag value cannot be empty and can be up to 128 char Example: `TestValue` |
| `allocationType` | string | No | The allocation type of the reserved instances. Valid values: Example: `Normal` |
| `instanceType` | string | No | The instance type of the reserved instance. For information about the valid values, see [Overview of Example: `ecs.g5.large` |
| `instanceTypeFamily` | string | No | The instance family of the reserved instance. For information about the valid values, see [Overview  Example: `ecs.g5` |
| `lockReason` | string | No | The reason why the reserved instance is locked. Valid values: Example: `security` |
| `offeringType` | string | No | The payment option of the reserved instance. Valid values: Example: `All` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to 100. Example: `50` |
| `regionId` | string | Yes | The region ID of the reserved instance. You can call the [DescribeRegions](https://help.aliyun.com/d Example: `cn-hangzhou` |
| `reservedInstanceId` | string[] | No | The IDs of reserved instances. You can specify up to 100 IDs of reserved instances. Example: `ri-bpzhex2ulpzf53****` |
| `reservedInstanceName` | string | No | The name of the reserved instance. Example: `testReservedInstanceName` |
| `scope` | string | No | The scope level of the reserved instance. Valid values: Example: `Region` |
| `status` | string[] | No | The status of the reserved instances. Example: `Active` |
| `tag` | DescribeReservedInstancesRequestTag[] | No | - |
| `zoneId` | string | No | The zone ID of the reserved instance. This parameter is valid and required if you set Scope to Zone. Example: `cn-hangzhou-z` |

## modifyReservedInstances

**Signature:** `modifyReservedInstances(request: ModifyReservedInstancesRequest)`

This operation is an asynchronous operation. After you call this operation to modify a reserved instance, the operation starts the modification process and returns the ID of the resulting new reserved.

**Parameters:** (3 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceAmount` | number | No | The number of pay-as-you-go instances of the specified instance type that the new reserved instance  Example: `1` |
| `instanceType` | string | No | The instance types that the new reserved instance can match. Example: `ecs.c5.4xlarge` |
| `reservedInstanceName` | string | No | The name of the new reserved instance. Example: `testReservedInstanceName` |
| `scope` | string | No | The scope level of the new reserved instance. Valid values: Example: `Zone` |
| `zoneId` | string | Yes | The zone ID of the new reserved instance. Example: `cn-hangzhou-i` |
| `configuration` | ModifyReservedInstancesRequestConfiguration[] | No | - |
| `regionId` | string | Yes | The region ID of the reserved instance. Example: `cn-hangzhou` |
| `reservedInstanceId` | string[] | Yes | The IDs of reserved instances that you want to modify. You can specify up to 20 reserved instance ID Example: `ReservedInstanceId.1="ecsri-bp1cx3****",ReservedInstanceId.2="ecsri-bp15xx2****"......` |

## describeSendFileResults

**Signature:** `describeSendFileResults(request: DescribeSendFileResultsRequest)`

## [](#)Usage notes *   When you send a file, the file may fail to be sent to specific Elastic Compute Service (ECS) instances. You can call this operation to check the file sending results. *   You c.

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the file sending task. Valid values of N: 1 to 20. The tag key cannot be an empt Example: `TestKey` |
| `value` | string | No | The value of tag N of the file sending task. Valid values of N: 1 to 20. The tag value can be an emp Example: `TestValue` |
| `instanceId` | string | No | The ID of the instance for which you want to query file sending records. Example: `i-hz0jdfwd9f****` |
| `invocationStatus` | string | No | The overall sending status of the file. The overall sending status of the file varies based on the s Example: `Success` |
| `invokeId` | string | No | The ID of the file sending task. Example: `f-hz0jdfwd9f****` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `name` | string | No | The name of the file whose sending records you want to query. Example: `test.txt` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `AAAAAdDWBF2` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `regionId` | string | Yes | The region ID of the ECS instance. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. After you set this parameter, file sending results in the specified re Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribeSendFileResultsRequestTag[] | No | - |

## sendFile

**Signature:** `sendFile(request: SendFileRequest)`

## [](#)Usage notes *   The instances to which you want to send a file must be in the Running (`Running`) state. *   [Cloud Assistant Agent](https://help.aliyun.com/document_detail/64921.html) must be.

**Parameters:** (5 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the file sending task. Valid values of N: 1 to 20. The tag key cannot be an empt Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the file sending task. Valid values of N: 1 to 20. The tag value can be Example: `TestValue` |
| `content` | string | Yes | The content of the file. The file must not exceed 32 KB in size after it is encoded in Base64. Example: `#!/bin/bash` |
| `contentType` | string | No | The content type of the file. Valid values: Example: `PlainText` |
| `description` | string | No | The description of the file. The description can be up to 512 characters in length and can contain a Example: `This` |
| `fileGroup` | string | No | The group of the file. This parameter takes effect only on Linux instances. Default value: root. The Example: `test` |
| `fileMode` | string | No | The permissions on the file. This parameter takes effect only on Linux instances. You can configure  Example: `0644` |
| `fileOwner` | string | No | The owner of the file. This parameter takes effect only on Linux instances. Default value: root. The Example: `test` |
| `instanceId` | string[] | Yes | The IDs of instances to which to send the file. You can specify up to 50 instance IDs in each reques Example: `i-bp185dy2o3o6n****` |
| `name` | string | Yes | The name of the file. The name can be up to 255 characters in length and can contain any characters. Example: `file.txt` |
| `overwrite` | boolean | No | Specifies whether to overwrite a file in the destination directory if the file has the same name as  Example: `true` |
| `regionId` | string | Yes | The region ID of the instance to which to send the file. You can call the [DescribeRegions](https:// Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. When you specify this parameter, take note of the following items: Example: `rg-bp67acfmxazb4p****` |
| `tag` | SendFileRequestTag[] | No | - |
| `targetDir` | string | Yes | The destination directory on the instance to which to send the file. If the specified directory does Example: `/home` |
| `timeout` | number | No | The timeout period for the file sending task. Unit: seconds. Example: `60` |

## startTerminalSession

**Signature:** `startTerminalSession(request: StartTerminalSessionRequest)`

## [](#)Usage notes When you use custom code to connect to an ECS instance that serves as a client, you can call this operation to obtain the WebSocket URL that is used to connect to the instance. Tak.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | boolean | No | - |
| `commandLine` | string | No | The command to run after the session is initiated. The command length cannot exceed 512 characters. Example: `ssh` |
| `connectionType` | string | No | The network type of the WebSocket URL required to connect to the instance. Valid values: Example: `Intranet` |
| `instanceId` | string[] | Yes | The instance IDs. |
| `portNumber` | number | No | The port number of the ECS instance. The port is used to forward data. After this parameter is confi Example: `22` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `targetServer` | string | No | The IP address of the instance. You can use the IP address to access the destination service in a vi Example: `192.168.0.246` |
| `username` | string | No | The username used for connection establishment. Example: `testUser` |

## describeTerminalSessions

**Signature:** `describeTerminalSessions(request: DescribeTerminalSessionsRequest)`

You can query the session records of Session Manager that were generated in the last four weeks..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The instance ID. Example: `i-bp1i7gg30r52z2em****` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAAdDWBF2****` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `sessionId` | string | No | The session ID. Example: `s-hz023od0x9****` |

## renewReservedInstances

**Signature:** `renewReservedInstances(request: RenewReservedInstancesRequest)`

*Before you call this operation, make sure that you are familiar with the billing and [pricing](https://www.alibabacloud.com/zh/pricing-calculator#/commodity/vm_intl) of reserved instances.** *   You .

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal for the reserved instance. Valid values: Example: `true` |
| `autoRenewPeriod` | number | No | The auto-renewal duration. Unit: months. This parameter takes effect only when AutoRenew is set to t Example: `1` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `period` | number | No | The validity period of the reserved instance. Example: `1` |
| `periodUnit` | string | No | The unit of the validity period of the reserved instance. Example: `Year` |
| `regionId` | string | No | The region ID of the reserved instance. Example: `cn-hangzhou` |
| `reservedInstanceId` | string[] | No | - |

## convertNatPublicIpToEip

**Signature:** `convertNatPublicIpToEip(request: ConvertNatPublicIpToEipRequest)`

## [](#)Usage notes After a public IP address is converted into an EIP, the EIP is billed separately. Make sure that you fully understand the billing methods of EIPs. For more information, see [Billin.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance whose public IP address you want to convert into an EIP. Example: `i-bp171jr36ge2ulvk****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## reActivateInstances

**Signature:** `reActivateInstances(request: ReActivateInstancesRequest)`

After you complete the overdue payment for a pay-as-you-go ECS instance, you do not need to call this operation to reactivate the instance. The system automatically reactivates the instance to restore.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance that you want to reactivate. Example: `i-bp67acfmxazb4p****` |
| `regionId` | string | No | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## getInstanceConsoleOutput

**Signature:** `getInstanceConsoleOutput(request: GetInstanceConsoleOutputRequest)`

ECS is a virtualized cloud-based service and cannot be connected to display devices. Alibaba Cloud caches system command outputs for the last start, restart, or shutdown of ECS instances. You can call.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `i-bp1c1xhsrac2coiw****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `removeSymbols` | boolean | No | Specifies whether to remove formatting symbols from the returned command output. Valid values: Example: `false` |

## getInstanceScreenshot

**Signature:** `getInstanceScreenshot(request: GetInstanceScreenshotRequest)`

After ECS returns a Base64-encoded instance screenshot in the JPG format, you must decode the screenshot. We recommend that you call this operation for troubleshooting and diagnosis. When you call thi.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `i-bp1gbz20g229bvu5****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-shenzhen` |
| `wakeUp` | boolean | No | Specifies whether to wake up the hibernated instance. Example: `false` |

## describeInstanceAttachmentAttributes

**Signature:** `describeInstanceAttachmentAttributes(request: DescribeInstanceAttachmentAttributesRequest)`

## [](#)Usage notes After an elasticity assurance or a capacity reservation is created, a private pool is generated and associated with information about the instances that are created by using the pr.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | Yes | The IDs of the instances. The value can be a JSON array that consists of up to 100 instance IDs. Sep Example: `["i-bp67acfmxazb4****",` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the elasticity assurance. You can call the [DescribeRegions](https://help.aliyun.co Example: `cn-hangzhou` |

## modifyInstanceAttachmentAttributes

**Signature:** `modifyInstanceAttachmentAttributes(request: ModifyInstanceAttachmentAttributesRequest)`

A private pool is generated after an elasticity assurance or a capacity reservation is created. The private pool is associated with information about the instances that use the private pool. You can s.

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The ID of the private pool. Set the value to the ID of the elasticity assurance or capacity reservat Example: `eap-bp67acfmxazb4****` |
| `matchCriteria` | string | Yes | The new type of private pool. Valid values: Example: `Open` |
| `instanceId` | string | Yes | The ID of the instance for which you want to modify the attributes of the private pool. Example: `i-bp67acfmxazb4****` |
| `regionId` | string | Yes | The region ID of the private pool. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

## describeInstanceModificationPrice

**Signature:** `describeInstanceModificationPrice(request: DescribeInstanceModificationPriceRequest)`

Pricing information can be queried for unexpired subscription ECS instances only when you upgrade their configurations. The pricing information cannot be queried when the instance configurations are d.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The category of the system disk. You must specify this parameter only when you upgrade a non-I/O opt Example: `cloud_ssd` |
| `category` | string | No | The category of data disk N. You can specify this parameter if you want to query the pricing informa Example: `cloud_essd` |
| `performanceLevel` | string | No | The performance level of data disk N that is an enhanced SSD (ESSD). The value of N must be the same Example: `PL1` |
| `size` | number | No | The capacity of data disk N. Valid values of N: 1 to 16. Unit: GiB. Valid values: Example: `100` |
| `dataDisk` | DescribeInstanceModificationPriceRequestDataDisk[] | No | - |
| `instanceId` | string | Yes | The ID of the instance for which you want to query pricing information for a configuration upgrade. Example: `i-bp1f2o4ldh8l****` |
| `instanceType` | string | No | The new instance type. We recommend that you call the [DescribeResourcesModification](https://help.a Example: `ecs.g6e.large` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |

## modifyInstanceClockOptions

**Signature:** `modifyInstanceClockOptions(request: ModifyInstanceClockOptionsRequest)`

When you call this operation, note that: *   This is an asynchronous operation. The ID of the asynchronous task is returned after the call. Query the asynchronous task result to determine whether the .

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `i-bp67acfmxazb4ph****` |
| `ptpStatus` | string | No | PTP status value. Valid values: Example: `enabled` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## modifyInstanceNetworkOptions

**Signature:** `modifyInstanceNetworkOptions(request: ModifyInstanceNetworkOptionsRequest)`

When you call this operation, note that: *   This is an asynchronous operation. The ID of the asynchronous task is returned after the call. Query the asynchronous task result to determine whether the .

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthWeighting` | string | No | The bandwidth weight. Example: `Vpc-L1` |
| `instanceId` | string | No | The ID of the instance whose network bandwidth weight is to be modified. Example: `i-bp67acfmxazb4p****` |

## describeRecommendInstanceType

**Signature:** `describeRecommendInstanceType(request: DescribeRecommendInstanceTypeRequest)`

Queries alternative instance types of an instance type. This operation is in internal preview. This operation lists all alternative instance types of an instance type that has been or is planed to be .

**Parameters:** (2 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cores` | number | No | The number of vCPU cores of the instance type. Example: `2` |
| `instanceChargeType` | string | No | The billing method of the ECS instance. For more information, see [Billing overview](https://help.al Example: `PostPaid` |
| `instanceFamilyLevel` | string | No | The level of the instance family. Valid values: Example: `EnterpriseLevel` |
| `instanceType` | string | No | The instance type. For more information, see [Overview of instance families](https://help.aliyun.com Example: `ecs.hfg6.large` |
| `instanceTypeFamily` | string[] | No | The instance families from which the alternative instance types are selected. You can specify up to  Example: `ecs.hfg6` |
| `ioOptimized` | string | No | Specifies whether instances of the instance type are I/O optimized. You cannot specify IoOptimized i Example: `optimized` |
| `maxPrice` | number | No | The maximum hourly price for pay-as-you-go instances or spot instances. Example: `10.0` |
| `memory` | number | No | The memory size of the instance type. Unit: GiB. Example: `8.0` |
| `networkType` | string | Yes | The network type of ECS instances. Valid values: Example: `vpc` |
| `priorityStrategy` | string | No | The policy for recommending instance types. Valid values: Example: `PriceFirst` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `scene` | string | No | Specifies the scenarios in which instance types are recommended. Valid values: Example: `CREATE` |
| `spotStrategy` | string | No | The bidding policy of the spot instance. Valid values: Example: `NoSpot` |
| `systemDiskCategory` | string | No | The category of the system disk. Valid values: Example: `cloud_ssd` |
| `zoneId` | string | No | The zone ID. You can call the [DescribeZones](https://help.aliyun.com/document_detail/25610.html) op Example: `cn-hangzhou-f` |
| `zoneMatchMode` | string | No | Specifies whether to recommend only instance types in the zone specified by ZoneId. Valid values: Example: `Strict` |

## releasePublicIpAddress

**Signature:** `releasePublicIpAddress(request: ReleasePublicIpAddressRequest)`

releasePublicIpAddress operation.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | > This parameter is unavailable. Example: `hide` |
| `instanceId` | string | No | The ID of the instance. Example: `i-bp67acfmxazb4p****` |
| `publicIpAddress` | string | Yes | The public IP address of the instance. Example: ```121.40.**.**``` |
| `regionId` | string | No | The region ID of the instance. Example: `cn-hangzhou` |

## describeReservedInstanceAutoRenewAttribute

**Signature:** `describeReservedInstanceAutoRenewAttribute(request: DescribeReservedInstanceAutoRenewAttributeRequest)`

Queries the auto-renewal attributes of one or more reserved instances, including the auto-renewal duration and auto-renewal status..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the reserved instance. Example: `cn-hangzhou` |
| `reservedInstanceId` | string[] | No | - |

## modifyReservedInstanceAttribute

**Signature:** `modifyReservedInstanceAttribute(request: ModifyReservedInstanceAttributeRequest)`

Modifies the attributes of a reserved instance, such as the name and description of the instance..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The error code. Example: `ri-example` |
| `regionId` | string | Yes | The ID of the reserved instance. Example: `cn-hangzhou` |
| `reservedInstanceId` | string | Yes | The new name of the reserved instance. The name must be 2 to 128 characters in length. It must start Example: `ecsri-uf61hdhue4kcorqsk****` |
| `reservedInstanceName` | string | No | The new description of the reserved instance. The description must be 2 to 256 characters in length. Example: `testReservedInstanceName` |

## modifyReservedInstanceAutoRenewAttribute

**Signature:** `modifyReservedInstanceAutoRenewAttribute(request: ModifyReservedInstanceAutoRenewAttributeRequest)`

Modifies the auto-renewal attributes of reserved instances. You can cancel or disable the auto-renewal feature for reserved instances..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `period` | number | No | The auto-renewal cycle. Example: `1` |
| `periodUnit` | string | No | The unit of the auto-renewal duration. Example: `Month` |
| `regionId` | string | Yes | The region ID of the reserved instances. You can call the [DescribeRegions](https://help.aliyun.com/ Example: `cn-hangzhou` |
| `renewalStatus` | string | No | Specifies whether to automatically renew the reserved instances. Valid values: Example: `AutoRenewal` |
| `reservedInstanceId` | string[] | No | - |

## describeHpcClusters

**Signature:** `describeHpcClusters(request: DescribeHpcClustersRequest)`

The client token that is used to ensure the idempotence of the request. You can use the client to generate the token, but you must make sure that the token is unique among different requests. The \\*\.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The page number. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `hpcClusterIds` | string | No | The number of entries per page. Example: `["hpc-xxxxxxxxx",` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The IDs of HPC clusters. The value is a JSON array that consists of up to 100 HPC cluster IDs. Separ Example: `cn-hangzhou` |

## createHpcCluster

**Signature:** `createHpcCluster(request: CreateHpcClusterRequest)`

Creates a high performance computing (HPC) cluster..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the HPC cluster. The description must be 2 to 256 characters in length. It cannot Example: `testHPCDescription` |
| `name` | string | Yes | The name of the HPC cluster. The name must be 2 to 128 characters in length, and can contain letters Example: `hpc-Cluster-01` |
| `ownerAccount` | string | No | RAM用户的账号登录名称。 Example: `ECSforCloud@Alibaba.com` |
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `1234567890` |
| `regionId` | string | Yes | The region ID of the HPC cluster. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `ECSforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `1234567890` |

## deleteHpcCluster

**Signature:** `deleteHpcCluster(request: DeleteHpcClusterRequest)`

Deletes a high performance computing (HPC) cluster..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotency of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `hpcClusterId` | string | Yes | The ID of the HPC cluster. Example: `hpc-cxvr5uzy54j0ya****` |
| `ownerAccount` | string | No | - Example: `EcsforCloud@Alibaba.com` |
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `155780923770` |
| `regionId` | string | Yes | The region ID of the HPC cluster. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `EcsforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `155780923770` |

## modifyHpcClusterAttribute

**Signature:** `modifyHpcClusterAttribute(request: ModifyHpcClusterAttributeRequest)`

Modifies the description of a high performance computing (HPC) cluster..

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the HPC cluster. The description must be 2 to 256 characters in length, and canno Example: `testDescription` |
| `hpcClusterId` | string | Yes | The ID of the HPC cluster. Example: `hpc-b8bq705cvx1****` |
| `name` | string | No | The name of the HPC cluster. The name must be 2 to 128 characters in length. The name must start wit Example: `testName` |
| `ownerAccount` | string | No | - Example: `EcsforCloud@Alibaba.com` |
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `1234567890` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `EcsforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `1234567890` |

## describeClusters

**Signature:** `describeClusters(request: DescribeClustersRequest)`

describeClusters operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | - |

## describeLimitation

**Signature:** `describeLimitation(request: DescribeLimitationRequest)`

describeLimitation operation.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limitation` | string | Yes | - |

