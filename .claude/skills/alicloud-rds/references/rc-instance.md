# RDS Custom (RC) Instance

RDS Custom instances for SQL Server: instance lifecycle, disks, images, key pairs, security groups, and commands.

## runRCInstances

**Signature:** `runRCInstances(request: RunRCInstancesRequest)`

Before you create RDS Custom instances, you must submit a ticket to add your Alibaba Cloud account to a whitelist. *   You can create only subscription RDS Custom instances. *   Subscription RDS Custo.

**Parameters:** See `RunRCInstancesRequest` model.

## createRCNodePool

**Signature:** `createRCNodePool(request: CreateRCNodePoolRequest)`

Creates an edge node pool in the Container Service for Kubernetes (ACK) Edge cluster to which the RDS Custom instance belongs..

**Parameters:** See `CreateRCNodePoolRequest` model.

## deleteRCNodePool

**Signature:** `deleteRCNodePool(request: DeleteRCNodePoolRequest)`

Deletes the edge node pool of an RDS Custom instance..

**Parameters:** See `DeleteRCNodePoolRequest` model.

## describeRCClusterNodes

**Signature:** `describeRCClusterNodes(request: DescribeRCClusterNodesRequest)`

Queries the RDS custom nodes in a Container Service for Kubernetes (ACK) cluster..

**Parameters:** See `DescribeRCClusterNodesRequest` model.

## describeRCClusters

**Signature:** `describeRCClusters(request: DescribeRCClustersRequest)`

Queries Container Service for Kubernetes (ACK) clusters to which RDS Custom nodes reside in a specific region..

**Parameters:** See `DescribeRCClustersRequest` model.

## describeRCNodePool

**Signature:** `describeRCNodePool(request: DescribeRCNodePoolRequest)`

Queries the configuration information about the edge node pool of an RDS Custom instance..

**Parameters:** See `DescribeRCNodePoolRequest` model.

## modifyRCVCluster

**Signature:** `modifyRCVCluster(request: ModifyRCVClusterRequest)`

修改RCVCluster.

**Parameters:** See `ModifyRCVClusterRequest` model.

## rebootRCInstance

**Signature:** `rebootRCInstance(request: RebootRCInstanceRequest)`

Restarts an RDS Custom instance that is in the Running state..

**Parameters:** See `RebootRCInstanceRequest` model.

## rebootRCInstances

**Signature:** `rebootRCInstances(request: RebootRCInstancesRequest)`

### [](#)Supported database engine SQL Server.

**Parameters:** See `RebootRCInstancesRequest` model.

## startRCInstance

**Signature:** `startRCInstance(request: StartRCInstanceRequest)`

Starts RDS Custom instances that are in the Stopped state. After the operation is successfully called, the instances enter the Starting state..

**Parameters:** See `StartRCInstanceRequest` model.

## startRCInstances

**Signature:** `startRCInstances(request: StartRCInstancesRequest)`

### [](#)Supported database engine SQL Server.

**Parameters:** See `StartRCInstancesRequest` model.

## stopRCInstance

**Signature:** `stopRCInstance(request: StopRCInstanceRequest)`

Stops an RDS Custom instance that is in the Running state. After the operation is successfully called, the status of the RDS Custom instance changes from Stopping to Stopped..

**Parameters:** See `StopRCInstanceRequest` model.

## stopRCInstances

**Signature:** `stopRCInstances(request: StopRCInstancesRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS SQL Server ### [](#)References *   [Introduction to RDS Custom for MySQL](https://help.aliyun.com/document_detail/2844223.html) *   [Introduct.

**Parameters:** See `StopRCInstancesRequest` model.

## redeployRCInstance

**Signature:** `redeployRCInstance(request: RedeployRCInstanceRequest)`

RedeployInstance is an **asynchronous** operation. It migrates data before it restarts the instance. If the instance is successfully redeployed, it enters the Running state. If the instance fails to b.

**Parameters:** See `RedeployRCInstanceRequest` model.

## renewRCInstance

**Signature:** `renewRCInstance(request: RenewRCInstanceRequest)`

Renews a subscription RDS Custom instance..

**Parameters:** See `RenewRCInstanceRequest` model.

## describeRCInstances

**Signature:** `describeRCInstances(request: DescribeRCInstancesRequest)`

Queries the details of an RDS Custom instance..

**Parameters:** See `DescribeRCInstancesRequest` model.

## describeRCInstanceAttribute

**Signature:** `describeRCInstanceAttribute(request: DescribeRCInstanceAttributeRequest)`

Queries the details of an RDS Custom instance..

**Parameters:** See `DescribeRCInstanceAttributeRequest` model.

## describeRCInstanceTypes

**Signature:** `describeRCInstanceTypes(request: DescribeRCInstanceTypesRequest)`

Queries the instance types of RDS Custom instances..

**Parameters:** See `DescribeRCInstanceTypesRequest` model.

## createRCDisk

**Signature:** `createRCDisk(request: CreateRCDiskRequest)`

The disk can be an ultra disk, an Enterprise SSD (ESSD), an SSD, or a Premium ESSD. By default, Premium ESSD is used. *   When you set InstanceChargeType to **Prepaid**, the disk billing method is sub.

**Parameters:** See `CreateRCDiskRequest` model.

## deleteRCDisk

**Signature:** `deleteRCDisk(request: DeleteRCDiskRequest)`

Before you call this operation, take note of the following items: *   Manual snapshots of the disk are retained. *   The disk must be in the Unattached (Available) state. *   If no disk with the speci.

**Parameters:** See `DeleteRCDiskRequest` model.

## describeRCDisks

**Signature:** `describeRCDisks(request: DescribeRCDisksRequest)`

Queries the disk information about an RDS Custom instance..

**Parameters:** See `DescribeRCDisksRequest` model.

## modifyRCDiskAttribute

**Signature:** `modifyRCDiskAttribute(request: ModifyRCDiskAttributeRequest)`

修改块存储属性.

**Parameters:** See `ModifyRCDiskAttributeRequest` model.

## resizeRCInstanceDisk

**Signature:** `resizeRCInstanceDisk(request: ResizeRCInstanceDiskRequest)`

Expand the storage capacity of an RDS Custom instance..

**Parameters:** See `ResizeRCInstanceDiskRequest` model.

## attachRCDisk

**Signature:** `attachRCDisk(request: AttachRCDiskRequest)`

Attaches a pay-as-you-go data disk or a system disk to an RDS Custom instance. The instance and the disk must reside in the same zone..

**Parameters:** See `AttachRCDiskRequest` model.

## detachRCDisk

**Signature:** `detachRCDisk(request: DetachRCDiskRequest)`

Detaches a pay-as-you-go data disk or a system disk from an RDS Custom instance..

**Parameters:** See `DetachRCDiskRequest` model.

## createRCSnapshot

**Signature:** `createRCSnapshot(request: CreateRCSnapshotRequest)`

In the following scenarios, you cannot create snapshots for a specific disk: *   The number of manual snapshots of the disk has reached 256. *   A snapshot is being created for the disk. *   The insta.

**Parameters:** See `CreateRCSnapshotRequest` model.

## deleteRCSnapshot

**Signature:** `deleteRCSnapshot(request: DeleteRCSnapshotRequest)`

Before you call this operation, take note of the following items: *   If the specified snapshot ID does not exist, the request will be ignored. *   If the snapshot is used to create custom images, the.

**Parameters:** See `DeleteRCSnapshotRequest` model.

## describeRCSnapshots

**Signature:** `describeRCSnapshots(request: DescribeRCSnapshotsRequest)`

Queries the details of snapshots. The details include the status of the snapshots, the amount of remaining time required to create the snapshots, and the retention period of the automatic snapshots in.

**Parameters:** See `DescribeRCSnapshotsRequest` model.

## createRCImage

**Signature:** `createRCImage(request: CreateRCImageRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS SQL Server ### [](#)References *   [Introduction to RDS Custom for MySQL](https://help.aliyun.com/document_detail/2844223.html) *   [Introduct.

**Parameters:** See `CreateRCImageRequest` model.

## replaceRCInstanceSystemDisk

**Signature:** `replaceRCInstanceSystemDisk(request: ReplaceRCInstanceSystemDiskRequest)`

The instance must be in the Stopped state. *   If you reinstall the system, the data on the original system disk is lost. Exercise caution when you perform this operation..

**Parameters:** See `ReplaceRCInstanceSystemDiskRequest` model.

## syncRCKeyPair

**Signature:** `syncRCKeyPair(request: SyncRCKeyPairRequest)`

Synchronizes a custom key pair to an RDS Custom instance. If you change the key pair that you created for your RDS Custom instance and you want the change to immediately take effect on the RDS Custom .

**Parameters:** See `SyncRCKeyPairRequest` model.

## describeRCSecurityGroupList

**Signature:** `describeRCSecurityGroupList(request: DescribeRCSecurityGroupListRequest)`

Queries the security groups of RDS Custom instances..

**Parameters:** See `DescribeRCSecurityGroupListRequest` model.

## describeRCSecurityGroupPermission

**Signature:** `describeRCSecurityGroupPermission(request: DescribeRCSecurityGroupPermissionRequest)`

描述RC安全组规则.

**Parameters:** See `DescribeRCSecurityGroupPermissionRequest` model.

## modifyRCSecurityGroupPermission

**Signature:** `modifyRCSecurityGroupPermission(request: ModifyRCSecurityGroupPermissionRequest)`

修改RC安全组规则.

**Parameters:** See `ModifyRCSecurityGroupPermissionRequest` model.

## revokeRCSecurityGroupPermission

**Signature:** `revokeRCSecurityGroupPermission(request: RevokeRCSecurityGroupPermissionRequest)`

Deletes security group rules with the specified IDs..

**Parameters:** See `RevokeRCSecurityGroupPermissionRequest` model.

## syncRCSecurityGroup

**Signature:** `syncRCSecurityGroup(request: SyncRCSecurityGroupRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Introduction to ApsaraDB RDS Custom](https://help.aliyun.com/document_detail/2864363.html).

**Parameters:** See `SyncRCSecurityGroupRequest` model.

## modifyRCInstanceAttribute

**Signature:** `modifyRCInstanceAttribute(request: ModifyRCInstanceAttributeRequest)`

Modifies the attributes of an RDS Custom instance, such as the password, hostname, security groups, and whether release protection is enabled..

**Parameters:** See `ModifyRCInstanceAttributeRequest` model.

## modifyRCInstanceChargeType

**Signature:** `modifyRCInstanceChargeType(request: ModifyRCInstanceChargeTypeRequest)`

### [](#)Precautions *   Before you call this operation, make sure that you are familiar with the subscription and pay-as-you-go billing methods and pricing of RDS Custom. *   The instances must be in.

**Parameters:** See `ModifyRCInstanceChargeTypeRequest` model.

## modifyRCInstanceDescription

**Signature:** `modifyRCInstanceDescription(request: ModifyRCInstanceDescriptionRequest)`

Modifies the name of an RDS Custom instance..

**Parameters:** See `ModifyRCInstanceDescriptionRequest` model.

## modifyRCInstanceVpcAttribute

**Signature:** `modifyRCInstanceVpcAttribute(request: ModifyRCInstanceVpcAttributeRequest)`

修改RC实例安全组.

**Parameters:** See `ModifyRCInstanceVpcAttributeRequest` model.

## describeRCInstanceVncUrl

**Signature:** `describeRCInstanceVncUrl(request: DescribeRCInstanceVncUrlRequest)`

The address returned is valid only for 15 seconds. If you do not use the returned address to establish a connection within 15 seconds, the address expires and you must call the operation again to obta.

**Parameters:** See `DescribeRCInstanceVncUrlRequest` model.

## describeRCDeploymentSets

**Signature:** `describeRCDeploymentSets(request: DescribeRCDeploymentSetsRequest)`

Queries the details of one or more deployment sets for RDS Custom instances. Before you call this operation, you must specify parameters such as DeploymentSetIds, Strategy, and DeploymentSetName..

**Parameters:** See `DescribeRCDeploymentSetsRequest` model.

## createRCDeploymentSet

**Signature:** `createRCDeploymentSet(request: CreateRCDeploymentSetRequest)`

Creates a deployment set for an RDS Custom instance in a region. Before you call this operation, you must specify parameters such as OnUnableToRedeployFailedInstance, DeploymentSetName, and Strategy..

**Parameters:** See `CreateRCDeploymentSetRequest` model.

## deleteRCDeploymentSet

**Signature:** `deleteRCDeploymentSet(request: DeleteRCDeploymentSetRequest)`

Deletes a deployment set for an RDS Custom instance. Before you call this operation, you must specify parameters such as RegionId and DeploymentSetId..

**Parameters:** See `DeleteRCDeploymentSetRequest` model.

## runRCCommand

**Signature:** `runRCCommand(request: RunRCCommandRequest)`

创建并执行云助手命令.

**Parameters:** See `RunRCCommandRequest` model.

## associateEipAddressWithRCInstance

**Signature:** `associateEipAddressWithRCInstance(request: AssociateEipAddressWithRCInstanceRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Introduction to ApsaraDB RDS Custom](https://help.aliyun.com/document_detail/2864363.html) ### [](#)Precautions If the RDS Custom ins.

**Parameters:** See `AssociateEipAddressWithRCInstanceRequest` model.

## unassociateEipAddressWithRCInstance

**Signature:** `unassociateEipAddressWithRCInstance(request: UnassociateEipAddressWithRCInstanceRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Introduction to ApsaraDB RDS Custom](https://help.aliyun.com/document_detail/2864363.html).

**Parameters:** See `UnassociateEipAddressWithRCInstanceRequest` model.


## deleteRCInstance

**Signature:** `deleteRCInstance(request: DeleteRCInstanceRequest)`

删除RDS用户专属主机实例.


## deleteRCInstances

**Signature:** `deleteRCInstances(request: DeleteRCInstancesRequest)`

After an instance is released, all physical resources used by the instance are recycled. Relevant data is erased and cannot be restored..


## deleteRCClusterNodes

**Signature:** `deleteRCClusterNodes(request: DeleteRCClusterNodesRequest)`

Deletes a RDS Custom node from a Container Service for Kubernetes (ACK) cluster..


## deleteRCVCluster

**Signature:** `deleteRCVCluster(request: DeleteRCVClusterRequest)`

RCVCluster删除接口.


## attachRCInstances

**Signature:** `attachRCInstances(request: AttachRCInstancesRequest)`

Adds RDS Custom nodes to a Container Service for Kubernetes (ACK) cluster..


## describeRCAvailableResource

**Signature:** `describeRCAvailableResource(request: DescribeRCAvailableResourceRequest)`

查询可用区的资源库存.


## describeRCCloudAssistantStatus

**Signature:** `describeRCCloudAssistantStatus(request: DescribeRCCloudAssistantStatusRequest)`

Before you run commands on or send files to instances, especially new instances, we recommend that you query the status of Cloud Assistant on the instances by calling this operation and checking the r.


## describeRCClusterConfig

**Signature:** `describeRCClusterConfig(request: DescribeRCClusterConfigRequest)`

Kubeconfig files store identity and authentication information that is used by clients to access ACK clusters. To use kubectl to manage an ACK cluster, you must use the kubeconfig file to connect to t.


## describeRCElasticScaling

**Signature:** `describeRCElasticScaling(request: DescribeRCElasticScalingRequest)`

查询RDS用户专属主机实例.


## modifyRCElasticScaling

**Signature:** `modifyRCElasticScaling(request: ModifyRCElasticScalingRequest)`

查询RDS用户专属主机实例.


## describeRCImageList

**Signature:** `describeRCImageList(request: DescribeRCImageListRequest)`

Queries custom images that can be used to create an RDS Custom instance. Before you call this operation, you must specify parameters such as RegionId..


## describeRCInstanceDdosCount

**Signature:** `describeRCInstanceDdosCount(request: DescribeRCInstanceDdosCountRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Introduction to ApsaraDB RDS Custom](https://help.aliyun.com/document_detail/2864363.html).


## describeRCInstanceHistoryEvents

**Signature:** `describeRCInstanceHistoryEvents(request: DescribeRCInstanceHistoryEventsRequest)`

You can query system events that were completed within the last 30 days. No limits apply to the time range for querying uncompleted system events. *   If you do not specify the EventCycleStatus or Ins.


## describeRCInstanceIpAddress

**Signature:** `describeRCInstanceIpAddress(request: DescribeRCInstanceIpAddressRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Introduction to ApsaraDB RDS Custom](https://help.aliyun.com/document_detail/2864363.html) >  If one or more assets of the current Al.


## describeRCInstanceTypeFamilies

**Signature:** `describeRCInstanceTypeFamilies(request: DescribeRCInstanceTypeFamiliesRequest)`

Queries the instance families of RDS Custom instances..


## describeRCInvocationResults

**Signature:** `describeRCInvocationResults(request: DescribeRCInvocationResultsRequest)`

查询云助手命令执行结果.


## describeRCResourcesModification

**Signature:** `describeRCResourcesModification(request: DescribeRCResourcesModificationRequest)`

变更实例规格或系统盘类型之前，查询某一可用区下实例规格或系统盘的库存情况.


## describeRCVCluster

**Signature:** `describeRCVCluster(request: DescribeRCVClusterRequest)`

描述vCluster.


## listRCVClusters

**Signature:** `listRCVClusters(request: ListRCVClustersRequest)`

RCVCluster列表接口.


## installRCCloudAssistant

**Signature:** `installRCCloudAssistant(request: InstallRCCloudAssistantRequest)`

为实例安装云助手Agent.


## modifyRCDiskChargeType

**Signature:** `modifyRCDiskChargeType(request: ModifyRCDiskChargeTypeRequest)`

修改RDS用户磁盘付费类型.


## modifyRCDiskSpec

**Signature:** `modifyRCDiskSpec(request: ModifyRCDiskSpecRequest)`

>  To minimize the impacts on your business, we recommend that you change specifications during off-peak hours. Take note of the following items: *   For a pay-as-you-go Enterprise SSD (ESSD), you can.


## modifyRCInstance

**Signature:** `modifyRCInstance(request: ModifyRCInstanceRequest)`

Before you call this operation, make sure that you are familiar with the billing methods, pricing, and refund rules of RDS Custom. Before you call this operation, take note of the following items: *  .


## modifyRCInstanceKeyPair

**Signature:** `modifyRCInstanceKeyPair(request: ModifyRCInstanceKeyPairRequest)`

Modifies the key pair of an RDS Custom instance..


## modifyRCInstanceNetworkSpec

**Signature:** `modifyRCInstanceNetworkSpec(request: ModifyRCInstanceNetworkSpecRequest)`

### [](#)Supported database engine Custom for SQL Server.


## authorizeRCSecurityGroupPermission

**Signature:** `authorizeRCSecurityGroupPermission(request: AuthorizeRCSecurityGroupPermissionRequest)`

Adds rules to the specified security group..


## acceptRCInquiredSystemEvent

**Signature:** `acceptRCInquiredSystemEvent(request: AcceptRCInquiredSystemEventRequest)`

Accepts the default operation for a system event in the Inquiring state and authorizes the system to perform the default operation..


## createDBInstanceEndpointAddress

**Signature:** `createDBInstanceEndpointAddress(request: CreateDBInstanceEndpointAddressRequest)`

### [](#)Supported database engine MySQL ### [](#)Precautions *   You can create a public endpoint of an endpoint type only when no public endpoint is created for this endpoint type. *   The node weig.


## deleteDBInstanceEndpointAddress

**Signature:** `deleteDBInstanceEndpointAddress(request: DeleteDBInstanceEndpointAddressRequest)`

### [](#)Supported database engines MySQL ### [](#)Precautions You can delete only the public endpoint of each endpoint type from the instance. If you want to delete an internal endpoint of any endpoi.

