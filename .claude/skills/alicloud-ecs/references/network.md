# Network & EIP

VPC, VSwitch, EIP, ENI, HaVip, and network interface management.

## createVpc

**Signature:** `createVpc(request: CreateVpcRequest)`

createVpc operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidrBlock` | string | No | - |
| `regionId` | string | Yes | - |

## deleteVpc

**Signature:** `deleteVpc(request: DeleteVpcRequest)`

deleteVpc operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `vpcId` | string | Yes | - |

## describeVpcs

**Signature:** `describeVpcs(request: DescribeVpcsRequest)`

describeVpcs operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isDefault` | boolean | No | - |
| `regionId` | string | Yes | - |

## modifyVpcAttribute

**Signature:** `modifyVpcAttribute(request: ModifyVpcAttributeRequest)`

modifyVpcAttribute operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidrBlock` | string | No | - |
| `vpcId` | string | Yes | - |

## createVSwitch

**Signature:** `createVSwitch(request: CreateVSwitchRequest)`

createVSwitch operation.

**Parameters:** See `CreateVSwitchRequest` model.

## deleteVSwitch

**Signature:** `deleteVSwitch(request: DeleteVSwitchRequest)`

deleteVSwitch operation.

**Parameters:** See `DeleteVSwitchRequest` model.

## describeVSwitches

**Signature:** `describeVSwitches(request: DescribeVSwitchesRequest)`

describeVSwitches operation.

**Parameters:** See `DescribeVSwitchesRequest` model.

## modifyVSwitchAttribute

**Signature:** `modifyVSwitchAttribute(request: ModifyVSwitchAttributeRequest)`

modifyVSwitchAttribute operation.

**Parameters:** See `ModifyVSwitchAttributeRequest` model.

## allocateEipAddress

**Signature:** `allocateEipAddress(request: AllocateEipAddressRequest)`

allocateEipAddress operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activityId` | number | No | - |
| `regionId` | string | Yes | - |

## associateEipAddress

**Signature:** `associateEipAddress(request: AssociateEipAddressRequest)`

associateEipAddress operation.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | - |
| `instanceId` | string | Yes | - |

## unassociateEipAddress

**Signature:** `unassociateEipAddress(request: UnassociateEipAddressRequest)`

unassociateEipAddress operation.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | - |
| `instanceId` | string | Yes | - |

## describeEipAddresses

**Signature:** `describeEipAddresses(request: DescribeEipAddressesRequest)`

describeEipAddresses operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `regionId` | string | Yes | - |

## modifyEipAddressAttribute

**Signature:** `modifyEipAddressAttribute(request: ModifyEipAddressAttributeRequest)`

modifyEipAddressAttribute operation.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | - |
| `bandwidth` | string | Yes | - |

## releaseEipAddress

**Signature:** `releaseEipAddress(request: ReleaseEipAddressRequest)`

releaseEipAddress operation.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | - |

## createNetworkInterface

**Signature:** `createNetworkInterface(request: CreateNetworkInterfaceRequest)`

Take note of the following items: *   This operation is a synchronous operation. After an ENI is created, the ENI immediately enters the Available (`Available`) state and can be attached to an Elastic.

**Parameters:** (2 required, 41 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The region in which to create the ENI. You can call the [DescribeRegions](https://help.aliyun.com/do Example: `cn-hangzhou` |
| `vSwitchId` | string | Yes | The ID of the vSwitch to which to connect the ENI. Private IP addresses are assigned to the ENI from Example: `vsw-bp1s5fnvk4gn2tws03****` |
| `tcpClosedAndTimeWaitTimeout` | number | No | The timeout period for TCP connections in the TIME_WAIT or CLOSE_WAIT state. Unit: seconds. Valid va Example: `3` |
| `tcpEstablishedTimeout` | number | No | The timeout period for TCP connections in the ESTABLISHED state. Unit: seconds. Valid values: 30, 60 Example: `910` |
| `udpTimeout` | number | No | The timeout period for UDP flows. Unit: seconds. Valid values: 10, 20, 30, 60, 80, and 100. Example: `30` |
| `enableRss` | boolean | No | >  This parameter is not publicly available. Example: `true` |
| `enableSriov` | boolean | No | >  This parameter is not publicly available. Example: `true` |
| `networkInterfaceTrafficMode` | string | No | The communication mode of the ENI. Example: `HighPerformance` |
| `queueNumber` | number | No | The number of queues supported by the ENI. Example: `8` |
| `queuePairNumber` | number | No | The number of QPs supported by the ERI. Example: `8` |
| `rxQueueSize` | number | No | The Rx queue depth of the ENI. Example: `8192` |
| `txQueueSize` | number | No | The Tx queue depth of the ENI. Example: `8192` |
| `key` | string | No | The key of tag N to add to the ENI. Valid values of N: 1 to 20. The tag key cannot be an empty strin Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the ENI. Valid values of N: 1 to 20. The tag value can be an empty stri Example: `TestValue` |
| `businessType` | string | No | > This parameter is no longer used. Example: `null` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `connectionTrackingConfiguration` | CreateNetworkInterfaceRequestConnectionTrackingConfiguration | No | The connection tracking configurations of the ENI. |
| ... | ... | ... | *26 more optional parameters* |

## deleteNetworkInterface

**Signature:** `deleteNetworkInterface(request: DeleteNetworkInterfaceRequest)`

Take note of the following items: *   The ENI to be deleted must be in the Available state. *   If the ENI to be deleted is attached to an Elastic Compute Service (ECS) instance, you must detach the E.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp14v2sdd3v8htln****` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |

## describeNetworkInterfaces

**Signature:** `describeNetworkInterfaces(request: DescribeNetworkInterfacesRequest)`

## [](#)Usage notes You can call the `DescribeNetworkInterfaces` operation for paged query by specifying the `MaxResults` or `NextToken` parameter. Take note of the following items: *   During a paged.

**Parameters:** (1 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the ENI. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the ENI. Valid values of N: 1 to 20. Example: `TestValue` |
| `instanceId` | string | No | The ID of the instance to which the ENI is attached. Example: `i-bp1e2l6djkndyuli****` |
| `ipv6Address` | string[] | No | An array that consists of the IPv6 address of the ENI. You can specify multiple IPv6 addresses. Vali Example: `2408:4321:180:1701:94c7:bc38:3bfa:****` |
| `maxResults` | number | No | The maximum number of entries to return on each page. Valid values: 10 to 500. Example: `50` |
| `networkInterfaceId` | string[] | No | An array that consists of the IDs of the ENIs. You specify multiple ENI IDs. Valid values of N: 1 to Example: `eni-bp125p95hhdhn3ot****` |
| `networkInterfaceName` | string | No | The name of the ENI. Example: `test-eni-name` |
| `nextToken` | string | No | The query token. Set the value to the `NextToken` value returned in the last call to this operation. Example: `AAAAAdDWBF2****` |
| `primaryIpAddress` | string | No | The primary private IPv4 address of the ENI. Example: ```192.168.**.**``` |
| `privateIpAddress` | string[] | No | An array that consists of the secondary private IPv4 addresses of the ENI. You can specify multiple  Example: ```192.168.**.**``` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the ENI belongs. If this parameter is specified to query resou Example: `rg-bp67acfmxazb4p****` |
| `securityGroupId` | string | No | The ID of the security group to which the secondary ENI belongs. Example: `sg-bp144yr32sx6ndw****` |
| `serviceManaged` | boolean | No | Specifies whether the user of the ENI is an Alibaba Cloud service or a distributor. Example: `true` |
| `status` | string | No | The state of the ENI. Valid values: Example: `Available` |
| `tag` | DescribeNetworkInterfacesRequestTag[] | No | - |
| `type` | string | No | The type of the ENI. Valid values: Example: `Secondary` |
| `vSwitchId` | string | No | The ID of the vSwitch with which the ENI is associated. Example: `vsw-bp16usj2p27htro3****` |
| `vpcId` | string | No | The ID of the virtual private cloud (VPC) to which the elastic network interface (ENI) belongs. Example: `vsw-bp16usj2p27htro3****` |

## describeNetworkInterfacePermissions

**Signature:** `describeNetworkInterfacePermissions(request: DescribeNetworkInterfacePermissionsRequest)`

Queries the permissions on elastic network interfaces (ENIs) that are granted to an Alibaba Cloud partner (certified ISV) or an individual user..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `networkInterfaceId` | string | No | The ID of ENI N. You must specify `NetworkInterfaceId` or `NetworkInterfacePermissionId.N` to determ Example: `eni-bp17pdijfczax****` |
| `networkInterfacePermissionId` | string[] | No | The IDs of ENI permissions. You can specify up to 100 ENI permission IDs. Example: `eni-perm-bp1cs4lwn56lfb****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID of the ENI permission. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |

## attachNetworkInterface

**Signature:** `attachNetworkInterface(request: AttachNetworkInterfaceRequest)`

Take note of the following items: *   The ENI must be in the **Available** state. You can attach an ENI to only one instance that resides in the same zone and VPC as the ENI. *   The instance must be .

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `i-bp16qstyvxj9gpqw****` |
| `networkCardIndex` | number | No | The index of the network interface controller (NIC). Example: `0` |
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp17pdijfczax1huji****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `trunkNetworkInstanceId` | string | No | The ID of the trunk ENI. Example: `eni-f8zapqwj1v1j4ia3****` |
| `waitForNetworkConfigurationReady` | boolean | No | > This parameter is no longer supported. Example: `null` |

## detachNetworkInterface

**Signature:** `detachNetworkInterface(request: DetachNetworkInterfaceRequest)`

Take note of the following items: *   You cannot detach the primary ENI of an instance. *   Make sure that the ENI to be detached is in the Detaching (Unbinding) or InUse (Bound) state. *   Make sure .

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the trunk ENI. Example: `i-bp67acfmxazb4p****` |
| `networkInterfaceId` | string | Yes | The ID of the instance Example: `eni-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The ID of the ENI. Example: `cn-hangzhou` |
| `trunkNetworkInstanceId` | string | No | The ID of the request. Example: `eni-f8zapqwj1v1j4ia3****` |

## modifyNetworkInterfaceAttribute

**Signature:** `modifyNetworkInterfaceAttribute(request: ModifyNetworkInterfaceAttributeRequest)`

Modifies the attributes of an elastic network interface (ENI), such as the number of queues supported by the ENI, the security groups to which the ENI belongs, the queue depth, the communication mode,.

**Parameters:** (2 required, 21 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tcpClosedAndTimeWaitTimeout` | number | No | The timeout period for TCP connections in the TIME_WAIT or CLOSE_WAIT state. Unit: seconds. Valid va Example: `3` |
| `tcpEstablishedTimeout` | number | No | The timeout period for TCP connections in the ESTABLISHED state. Unit: seconds. Valid values: 30, 60 Example: `910` |
| `udpTimeout` | number | No | The timeout period for UDP flows. Unit: seconds. Valid values: 10, 20, 30, 60, 80, and 100. Example: `30` |
| `enableRss` | boolean | No | >  This parameter is not publicly available. Example: `false` |
| `enableSriov` | boolean | No | This parameter is not publicly available. Example: `true` |
| `networkInterfaceTrafficMode` | string | No | The communication mode of the ENI. Valid values: Example: `HighPerformance` |
| `queueNumber` | number | No | The number of queues supported by the ENI. When the ENI is in the InUse state, take note of the foll Example: `8` |
| `queuePairNumber` | number | No | The number of queues supported by the ERI. When the ERI is in the InUse state, take note of the foll Example: `8` |
| `rxQueueSize` | number | No | The receive (Rx) queue depth of the ENI. Example: `8192` |
| `txQueueSize` | number | No | The Tx queue depth of the ENI. Example: `8192` |
| `connectionTrackingConfiguration` | ModifyNetworkInterfaceAttributeRequestConnectionTrackingConfiguration | No | - |
| `deleteOnRelease` | boolean | No | Specifies whether to release the ENI when the associated instance is released. Valid values: Example: `true` |
| `description` | string | No | The description of the ENI. The description must be 2 to 255 characters in length and cannot start w Example: `testDescription` |
| `enhancedNetwork` | ModifyNetworkInterfaceAttributeRequestEnhancedNetwork | No | - |
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp67acfmxazb4p****` |
| `networkInterfaceName` | string | No | The name of the ENI. The name must be 2 to 128 characters in length. The name must start with a lett Example: `eniTestName` |
| `networkInterfaceTrafficConfig` | ModifyNetworkInterfaceAttributeRequestNetworkInterfaceTrafficConfig | No | - |
| `queueNumber` | number | No | The number of queues supported by the ENI. Valid values: 1 to 2048. Example: `8` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |
| `rxQueueSize` | number | No | The receive (Rx) queue depth of the ENI. Example: `8192` |
| `securityGroupId` | string[] | No | The IDs of the security groups to which to add the secondary ENI. The secondary ENI is added to the  |
| `sourceDestCheck` | boolean | No | Source and destination IP address check We recommend that you enable the feature to improve network  Example: `false` |
| `txQueueSize` | number | No | The Tx queue depth of the ENI. Example: `8192` |

## createNetworkInterfacePermission

**Signature:** `createNetworkInterfacePermission(request: CreateNetworkInterfacePermissionRequest)`

Before you call this operation, submit a ticket to apply for using this operation..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | number | Yes | The ID of the Alibaba Cloud partner (a certified ISV) or individual user. Example: `1234567890` |
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp14v2sdd3v8htln****` |
| `permission` | string | Yes | The permission on the ENI. Valid values: Example: `InstanceAttach` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |

## deleteNetworkInterfacePermission

**Signature:** `deleteNetworkInterfacePermission(request: DeleteNetworkInterfacePermissionRequest)`

deleteNetworkInterfacePermission operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `force` | boolean | No | - |
| `networkInterfacePermissionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## assignPrivateIpAddresses

**Signature:** `assignPrivateIpAddresses(request: AssignPrivateIpAddressesRequest)`

## [](#)Usage notes *   The ENI to which you want to assign IP prefixes must be in the Available (Available) or InUse (InUse) state. *   When you assign private IP addresses to a primary ENI, the Elas.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `ipv4Prefix` | string[] | No | The IPv4 prefixes to assign to the ENI. Valid values of N: 1 to 10. |
| `ipv4PrefixCount` | number | No | The number of IPv4 prefixes to be randomly generated for the ENI. Valid values: 1 to 10. Example: `hide` |
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp67acfmxazb4p****` |
| `privateIpAddress` | string[] | No | Secondary private IP address N to be automatically assigned from the CIDR block of the vSwitch that  Example: ```10.1.**.**``` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |
| `secondaryPrivateIpAddressCount` | number | No | The number of private IP addresses to be automatically assigned from the CIDR block of the vSwitch t Example: `1` |

## unassignPrivateIpAddresses

**Signature:** `unassignPrivateIpAddresses(request: UnassignPrivateIpAddressesRequest)`

## [](#)Usage notes *   The ENI from which to unassign secondary private IP addresses must be in the **Available** (Available) or **InUse** (InUse) state. *   If the ENI is a primary ENI, the Elastic .

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ipv4Prefix` | string[] | No | - |
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp67acfmxazb4ph****` |
| `privateIpAddress` | string[] | No | The secondary private IP addresses to unassign. Example: ```192.168.**.**``` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |

## assignIpv6Addresses

**Signature:** `assignIpv6Addresses(request: AssignIpv6AddressesRequest)`

## [](#)Usage notes You can specify IPv6 addresses in the CIDR block of the vSwitch to which the ENI is connected. You can also specify the number of IPv6 addresses that the system assigns to the ENI..

**Parameters:** See `AssignIpv6AddressesRequest` model.

## unassignIpv6Addresses

**Signature:** `unassignIpv6Addresses(request: UnassignIpv6AddressesRequest)`

## [](#)Usage notes Take note of the following items: *   The ENI must be in the **Available** (Available) or **InUse** (InUse) state. *   If the ENI is a primary ENI, the Elastic Compute Service (ECS.

**Parameters:** See `UnassignIpv6AddressesRequest` model.

## allocatePublicIpAddress

**Signature:** `allocatePublicIpAddress(request: AllocatePublicIpAddressRequest)`

### [](#)Precautions *   The ECS instance to which you want to assign a static public IP address must be in the **Running** (`Running`) or **Stopped** (`Stopped`) state. *   If `OperationLocks` in the.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance to which you want to assign a public IP address. Example: `i-bp1gtjxuuvwj17zr****` |
| `ipAddress` | string | No | The static public IP address that you want to assign to the instance. This parameter is empty by def Example: ```112.124.**.**``` |
| `vlanId` | string | No | The virtual LAN (VLAN) ID of the instance. Example: `720` |

## createHaVip

**Signature:** `createHaVip(request: CreateHaVipRequest)`

createHaVip operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `regionId` | string | Yes | - |
| `vSwitchId` | string | Yes | - |

## deleteHaVip

**Signature:** `deleteHaVip(request: DeleteHaVipRequest)`

deleteHaVip operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `haVipId` | string | Yes | - |
| `regionId` | string | Yes | - |

## describeHaVips

**Signature:** `describeHaVips(request: DescribeHaVipsRequest)`

describeHaVips operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `filter` | DescribeHaVipsRequestFilter[] | Yes | - |
| `regionId` | string | Yes | - |

## modifyHaVipAttribute

**Signature:** `modifyHaVipAttribute(request: ModifyHaVipAttributeRequest)`

modifyHaVipAttribute operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `haVipId` | string | Yes | - |
| `regionId` | string | Yes | - |

## associateHaVip

**Signature:** `associateHaVip(request: AssociateHaVipRequest)`

associateHaVip operation.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `haVipId` | string | Yes | - |
| `instanceId` | string | Yes | - |
| `regionId` | string | Yes | - |

## unassociateHaVip

**Signature:** `unassociateHaVip(request: UnassociateHaVipRequest)`

unassociateHaVip operation.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `haVipId` | string | Yes | - |
| `instanceId` | string | Yes | - |
| `regionId` | string | Yes | - |

## describeClassicLinkInstances

**Signature:** `describeClassicLinkInstances(request: DescribeClassicLinkInstancesRequest)`

Take note of the following items: *   This operation applies only to instances that reside in the classic network. *   You can query a maximum of 100 instances that reside in the classic network at a .

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The instance ID. You can specify a maximum of 100 instance IDs in a single request. Separate the ins Example: `i-bp1a5zr3u7nq9cxh****` |
| `pageNumber` | string | No | The page number. Pages start from page 1. Example: `1` |
| `pageSize` | string | No | The number of entries per page. Valid values: 1 to 100. Example: `10` |
| `regionId` | string | Yes | The region ID of the instances. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |
| `vpcId` | string | No | The VPC ID. The ClassicLink feature must be enabled for the specified VPC. For more information, see Example: `vpc-bp1vwnn14rqpyiczj****` |

## attachClassicLinkVpc

**Signature:** `attachClassicLinkVpc(request: AttachClassicLinkVpcRequest)`

When you call this operation, take note of the following items: *   The instance that you want to connect to a VPC must be in the **Running** or **Stopped** state. *   The ClassicLink feature must be .

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance that is deployed in the classic network. You can call the [DescribeInstances] Example: `i-bp1gtjxuuvwj17zr****` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC for which the ClassicLink feature is enabled. You can call the [DescribeVpcs](http Example: `vpc-bp1j4z1sr8zxu4l8u****` |

## detachClassicLinkVpc

**Signature:** `detachClassicLinkVpc(request: DetachClassicLinkVpcRequest)`

Unlinks an Elastic Compute Service (ECS) instance that resides in the classic network from a virtual private cloud (VPC) by closing the ClassicLink connection between the instance and the VPC. After t.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance that resides in the classic network. Example: `i-bp67acfmxazb4p****` |
| `ownerId` | number | No | RAM用户的虚拟账号ID。 Example: `155780923770` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceOwnerAccount` | string | No | 资源主账号的账号名称。 Example: `ECSforCloud` |
| `resourceOwnerId` | number | No | 资源主账号的ID，亦即UID。 Example: `155780923770` |
| `vpcId` | string | Yes | The ID of the VPC to which the instance is connected. Example: `vpc-bp67acfmxazb4p****` |

## describeBandwidthLimitation

**Signature:** `describeBandwidthLimitation(request: DescribeBandwidthLimitationRequest)`

Queries the maximum public bandwidth that can be purchased, upgraded, or downgraded for various Elastic Compute Service (ECS) instance types..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceChargeType` | string | No | The billing method of the instance. For more information, see [Billing overview](https://help.aliyun Example: `PostPaid` |
| `instanceType` | string | Yes | The instance type. For information about the values, see [Overview of ECS instance families](https:/ Example: `ecs.g5.large` |
| `operationType` | string | No | Specifies the operation for which to query the maximum public bandwidth. Valid values: Example: `Upgrade` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The resource ID. Example: `i-bp67acfmxazb4ph***` |
| `spotStrategy` | string | No | The bidding policy for the pay-as-you-go instance. Valid values: Example: `NoSpot` |

## describeBandwidthPackages

**Signature:** `describeBandwidthPackages(request: DescribeBandwidthPackagesRequest)`

describeBandwidthPackages operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | No | - |
| `regionId` | string | Yes | - |

## addBandwidthPackageIps

**Signature:** `addBandwidthPackageIps(request: AddBandwidthPackageIpsRequest)`

addBandwidthPackageIps operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | - |
| `ipCount` | string | Yes | - |
| `regionId` | string | Yes | - |

## removeBandwidthPackageIps

**Signature:** `removeBandwidthPackageIps(request: RemoveBandwidthPackageIpsRequest)`

RemoveBandwidthPackageIps.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | - |
| `regionId` | string | Yes | - |
| `removedIpAddresses` | string[] | Yes | - |

## createNatGateway

**Signature:** `createNatGateway(request: CreateNatGatewayRequest)`

createNatGateway operation.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | number | No | - |
| `bandwidthPackage` | CreateNatGatewayRequestBandwidthPackage[] | Yes | - |
| `regionId` | string | Yes | - |
| `vpcId` | string | Yes | - |

## deleteNatGateway

**Signature:** `deleteNatGateway(request: DeleteNatGatewayRequest)`

deleteNatGateway operation.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `natGatewayId` | string | Yes | - |
| `regionId` | string | Yes | - |

## describeNatGateways

**Signature:** `describeNatGateways(request: DescribeNatGatewaysRequest)`

describeNatGateways operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `natGatewayId` | string | No | - |
| `regionId` | string | Yes | - |

## createForwardEntry

**Signature:** `createForwardEntry(request: CreateForwardEntryRequest)`

createForwardEntry operation.

**Parameters:** (7 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `externalIp` | string | Yes | - |
| `externalPort` | string | Yes | - |
| `forwardTableId` | string | Yes | - |
| `internalIp` | string | Yes | - |
| `internalPort` | string | Yes | - |
| `ipProtocol` | string | Yes | - |
| `regionId` | string | Yes | - |

## deleteForwardEntry

**Signature:** `deleteForwardEntry(request: DeleteForwardEntryRequest)`

deleteForwardEntry operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `forwardEntryId` | string | Yes | - |
| `forwardTableId` | string | Yes | - |
| `regionId` | string | Yes | - |

## describeForwardTableEntries

**Signature:** `describeForwardTableEntries(request: DescribeForwardTableEntriesRequest)`

describeForwardTableEntries operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `forwardEntryId` | string | No | - |
| `forwardTableId` | string | Yes | - |
| `regionId` | string | Yes | - |

## modifyForwardEntry

**Signature:** `modifyForwardEntry(request: ModifyForwardEntryRequest)`

modifyForwardEntry operation.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `externalIp` | string | No | - |
| `forwardEntryId` | string | Yes | - |
| `forwardTableId` | string | Yes | - |
| `regionId` | string | Yes | - |

## createRouteEntry

**Signature:** `createRouteEntry(request: CreateRouteEntryRequest)`

createRouteEntry operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nextHopId` | string | No | - |
| `destinationCidrBlock` | string | Yes | - |
| `routeTableId` | string | Yes | - |

## deleteRouteEntry

**Signature:** `deleteRouteEntry(request: DeleteRouteEntryRequest)`

deleteRouteEntry operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nextHopId` | string | No | - |
| `destinationCidrBlock` | string | Yes | - |
| `routeTableId` | string | Yes | - |

## describeRouteTables

**Signature:** `describeRouteTables(request: DescribeRouteTablesRequest)`

describeRouteTables operation.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |

## activateRouterInterface

**Signature:** `activateRouterInterface(request: ActivateRouterInterfaceRequest)`

activateRouterInterface operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | - |
| `routerInterfaceId` | string | Yes | - |

## connectRouterInterface

**Signature:** `connectRouterInterface(request: ConnectRouterInterfaceRequest)`

connectRouterInterface operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | - |
| `routerInterfaceId` | string | Yes | - |

## deactivateRouterInterface

**Signature:** `deactivateRouterInterface(request: DeactivateRouterInterfaceRequest)`

deactivateRouterInterface operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | - |
| `routerInterfaceId` | string | Yes | - |

## createRouterInterface

**Signature:** `createRouterInterface(request: CreateRouterInterfaceRequest)`

createRouterInterface operation.

**Parameters:** (6 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessPointId` | string | No | - |
| `oppositeRegionId` | string | Yes | - |
| `regionId` | string | Yes | - |
| `role` | string | Yes | - |
| `routerId` | string | Yes | - |
| `routerType` | string | Yes | - |
| `spec` | string | Yes | - |

## deleteRouterInterface

**Signature:** `deleteRouterInterface(request: DeleteRouterInterfaceRequest)`

deleteRouterInterface operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `regionId` | string | Yes | - |
| `routerInterfaceId` | string | Yes | - |

## describeRouterInterfaces

**Signature:** `describeRouterInterfaces(request: DescribeRouterInterfacesRequest)`

describeRouterInterfaces operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `regionId` | string | Yes | - |

## modifyRouterInterfaceAttribute

**Signature:** `modifyRouterInterfaceAttribute(request: ModifyRouterInterfaceAttributeRequest)`

modifyRouterInterfaceAttribute operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | - |
| `regionId` | string | Yes | - |
| `routerInterfaceId` | string | Yes | - |

## modifyRouterInterfaceSpec

**Signature:** `modifyRouterInterfaceSpec(request: ModifyRouterInterfaceSpecRequest)`

modifyRouterInterfaceSpec operation.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `regionId` | string | Yes | - |
| `routerInterfaceId` | string | Yes | - |
| `spec` | string | Yes | - |

## createVirtualBorderRouter

**Signature:** `createVirtualBorderRouter(request: CreateVirtualBorderRouterRequest)`

createVirtualBorderRouter operation.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitCode` | string | No | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |
| `vlanId` | number | Yes | - |

## deleteVirtualBorderRouter

**Signature:** `deleteVirtualBorderRouter(request: DeleteVirtualBorderRouterRequest)`

deleteVirtualBorderRouter operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `regionId` | string | Yes | - |
| `vbrId` | string | Yes | - |

## describeVirtualBorderRouters

**Signature:** `describeVirtualBorderRouters(request: DescribeVirtualBorderRoutersRequest)`

describeVirtualBorderRouters operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `regionId` | string | Yes | - |

## describeVirtualBorderRoutersForPhysicalConnection

**Signature:** `describeVirtualBorderRoutersForPhysicalConnection(request: DescribeVirtualBorderRoutersForPhysicalConnectionRequest)`

describeVirtualBorderRoutersForPhysicalConnection operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## modifyVirtualBorderRouterAttribute

**Signature:** `modifyVirtualBorderRouterAttribute(request: ModifyVirtualBorderRouterAttributeRequest)`

modifyVirtualBorderRouterAttribute operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitCode` | string | No | - |
| `regionId` | string | Yes | - |
| `vbrId` | string | Yes | - |

## terminateVirtualBorderRouter

**Signature:** `terminateVirtualBorderRouter(request: TerminateVirtualBorderRouterRequest)`

terminateVirtualBorderRouter operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `regionId` | string | Yes | - |
| `vbrId` | string | Yes | - |

## recoverVirtualBorderRouter

**Signature:** `recoverVirtualBorderRouter(request: RecoverVirtualBorderRouterRequest)`

recoverVirtualBorderRouter operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `regionId` | string | Yes | - |
| `vbrId` | string | Yes | - |

## createPhysicalConnection

**Signature:** `createPhysicalConnection(request: CreatePhysicalConnectionRequest)`

createPhysicalConnection operation.

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessPointId` | string | Yes | - |
| `lineOperator` | string | Yes | - |
| `peerLocation` | string | Yes | - |
| `regionId` | string | Yes | - |

## deletePhysicalConnection

**Signature:** `deletePhysicalConnection(request: DeletePhysicalConnectionRequest)`

deletePhysicalConnection operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## describePhysicalConnections

**Signature:** `describePhysicalConnections(request: DescribePhysicalConnectionsRequest)`

describePhysicalConnections operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `regionId` | string | Yes | - |

## modifyPhysicalConnectionAttribute

**Signature:** `modifyPhysicalConnectionAttribute(request: ModifyPhysicalConnectionAttributeRequest)`

modifyPhysicalConnectionAttribute operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitCode` | string | No | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## cancelPhysicalConnection

**Signature:** `cancelPhysicalConnection(request: CancelPhysicalConnectionRequest)`

cancelPhysicalConnection operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## terminatePhysicalConnection

**Signature:** `terminatePhysicalConnection(request: TerminatePhysicalConnectionRequest)`

terminatePhysicalConnection operation.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## enablePhysicalConnection

**Signature:** `enablePhysicalConnection(request: EnablePhysicalConnectionRequest)`

enablePhysicalConnection operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | Yes | - |
| `physicalConnectionId` | string | Yes | - |
| `regionId` | string | Yes | - |

## describeVRouters

**Signature:** `describeVRouters(request: DescribeVRoutersRequest)`

describeVRouters operation.

**Parameters:** See `DescribeVRoutersRequest` model.

## modifyVRouterAttribute

**Signature:** `modifyVRouterAttribute(request: ModifyVRouterAttributeRequest)`

modifyVRouterAttribute operation.

**Parameters:** See `ModifyVRouterAttributeRequest` model.

## describeAccessPoints

**Signature:** `describeAccessPoints(request: DescribeAccessPointsRequest)`

describeAccessPoints operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `regionId` | string | Yes | - |

## describeEipMonitorData

**Signature:** `describeEipMonitorData(request: DescribeEipMonitorDataRequest)`

describeEipMonitorData operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | - |
| `endTime` | string | Yes | - |
| `startTime` | string | Yes | - |

## describeNewProjectEipMonitorData

**Signature:** `describeNewProjectEipMonitorData(request: DescribeNewProjectEipMonitorDataRequest)`

describeNewProjectEipMonitorData operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | - |
| `endTime` | string | Yes | - |
| `startTime` | string | Yes | - |

## describeEniMonitorData

**Signature:** `describeEniMonitorData(request: DescribeEniMonitorDataRequest)`

## [](#)Usage notes The monitoring data of a secondary ENI includes the amount of traffic sent and received over the internal network, the number of packets sent and received by the secondary ENI, and.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com/docum Example: `2018-05-21T12:22:00Z` |
| `eniId` | string | No | The secondary ENI ID. By default, all secondary ENIs that are bound to the specified instance are qu Example: `eni-bp19da36d6xdwey****` |
| `instanceId` | string | Yes | The ID of the instance to which the secondary ENI is bound. Example: `i-bp1a5zr3u7nq9cx****` |
| `period` | number | No | The interval at which to retrieve the monitoring data. Unit: seconds. Default value: Month. Valid va Example: `60` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the [ISO 8601](https://help.aliyun.com Example: `2018-05-21T12:19:00Z` |

## describeNetworkInterfaceAttribute

**Signature:** `describeNetworkInterfaceAttribute(request: DescribeNetworkInterfaceAttributeRequest)`

## Debugging [OpenAPI Explorer automatically calculates the signature value. For your convenience, we recommend that you call this operation in OpenAPI Explorer. OpenAPI Explorer dynamically generates.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | >  This parameter is unavailable. Example: `TestKey` |
| `value` | string | No | >  This parameter is unavailable. Example: `TestValue` |
| `attribute` | string | No | The attribute of the ENI. Valid values: Example: `attachment` |
| `networkInterfaceId` | string | Yes | The ID of the ENI. Example: `eni-bp67acfmxazb4p****` |
| `regionId` | string | Yes | The region ID of the ENI. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-hangzhou` |
| `tag` | DescribeNetworkInterfaceAttributeRequestTag[] | No | - |

## disableNetworkInterfaceQoS

**Signature:** `disableNetworkInterfaceQoS(request: DisableNetworkInterfaceQoSRequest)`

Disables Elastic Network Interface (ENI) QoS speed setting..

**Parameters:** See `DisableNetworkInterfaceQoSRequest` model.

## enableNetworkInterfaceQoS

**Signature:** `enableNetworkInterfaceQoS(request: EnableNetworkInterfaceQoSRequest)`

启用或修改弹性网卡QoS限速设置.

**Parameters:** See `EnableNetworkInterfaceQoSRequest` model.

## deleteBandwidthPackage

**Signature:** `deleteBandwidthPackage(request: DeleteBandwidthPackageRequest)`

DeleteBandwidthPackage.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | - |
| `regionId` | string | Yes | - |

## modifyBandwidthPackageSpec

**Signature:** `modifyBandwidthPackageSpec(request: ModifyBandwidthPackageSpecRequest)`

modifyBandwidthPackageSpec operation.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | Yes | - |
| `bandwidthPackageId` | string | Yes | - |
| `regionId` | string | Yes | - |

## createPortRangeList

**Signature:** `createPortRangeList(request: CreatePortRangeListRequest)`

Creates a port list. You can associate a port list with resources, such as security groups..

**Parameters:** (3 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of port range N. The description must be 2 to 32 characters in length and cannot sta Example: `Description` |
| `portRange` | string | No | Port range N. Valid values of N: 0 to 200. Example: `80/80` |
| `key` | string | No | The key of tag N to add to the port list. Example: `key` |
| `value` | string | No | The value of tag N to add to the port list. Example: `value` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the port list. The description must be 2 to 256 characters in length and cannot s Example: `Description` |
| `entry` | CreatePortRangeListRequestEntry[] | No | - |
| `maxEntries` | number | Yes | The maximum number of entries in the port list. The value cannot be changed after you create the por Example: `10` |
| `portRangeListName` | string | Yes | The name of the port list. The name must be 2 to 128 characters in length. It must start with a lett Example: `PortRangeListNameSample` |
| `regionId` | string | Yes | The region ID of the port list. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the port list belongs. Example: `rg-aek3b6jzp66****` |
| `tag` | CreatePortRangeListRequestTag[] | No | - |

## deletePortRangeList

**Signature:** `deletePortRangeList(request: DeletePortRangeListRequest)`

Deletes a port list and all entries in the port list..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `portRangeListId` | string | Yes | The ID of the port list. Example: `prl-2ze9743****` |
| `regionId` | string | Yes | The region ID of the port list. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |

## describePortRangeLists

**Signature:** `describePortRangeLists(request: DescribePortRangeListsRequest)`

Queries the port lists..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values: 1 to 20. Example: `key` |
| `value` | string | No | The value of tag N. Example: `value` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the request to retrieve a new page of results. You do not need  Example: `727d41872117f2816343eeb432fbc5bfd21dc824589d2a4be0b5e8707e68181f` |
| `portRangeListId` | string[] | No | - |
| `portRangeListName` | string | No | The name of the port list. The name must be 2 to 128 characters in length. It must start with a lett Example: `PortRangeListNameSample` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/2679950.ht Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. If you specify this parameter to query resources, up to 1,000 resource Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribePortRangeListsRequestTag[] | No | - |

## describePortRangeListAssociations

**Signature:** `describePortRangeListAssociations(request: DescribePortRangeListAssociationsRequest)`

Queries the resources that are associated with a port list, such as security groups..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAARbaCuN6hiD08qrLdwJ9Fh15YZPnzqF7Vs2EB6Ix327v` |
| `portRangeListId` | string | Yes | The ID of the port list. Example: `prl-2ze9743****` |
| `regionId` | string | Yes | The region ID of the port list. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |

## describePortRangeListEntries

**Signature:** `describePortRangeListEntries(request: DescribePortRangeListEntriesRequest)`

Queries the entries of a specified port list..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `portRangeListId` | string | Yes | The ID of the port list. Example: `prl-2ze9743****` |
| `regionId` | string | Yes | The region ID of the port list. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |

## modifyPortRangeList

**Signature:** `modifyPortRangeList(request: ModifyPortRangeListRequest)`

Modifies the name and entries of a port list. You can call this operation to add, modify, and remove entries for a port list..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the port range in entry N. The description must be 2 to 32 characters in length a Example: `This` |
| `portRange` | string | No | The port range in entry N. Valid values of N: 0 to 200. Take note of the following limits: Example: `80/80` |
| `portRange` | string | No | The port range in entry N. Valid values of N: 0 to 200. Take note of the following limits: Example: `80/80` |
| `addEntry` | ModifyPortRangeListRequestAddEntry[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `473469C7-AA6F-4DC5-B3DB-A3DC0DE3C83E` |
| `description` | string | No | The description of the port list. The description must be 2 to 256 characters in length and cannot s Example: `This` |
| `portRangeListId` | string | Yes | The ID of the port list. Example: `prl-2ze9743****` |
| `portRangeListName` | string | No | The name of the port list. The name must be 2 to 128 characters in length. It must start with a lett Example: `PortRangeListNameSample` |
| `regionId` | string | Yes | The region ID of the port list. You can call the [DescribeRegions](https://help.aliyun.com/document_ Example: `cn-hangzhou` |
| `removeEntry` | ModifyPortRangeListRequestRemoveEntry[] | No | - |

## describePrefixListAttributes

**Signature:** `describePrefixListAttributes(request: DescribePrefixListAttributesRequest)`

Queries the details of a prefix list, including the name, address family, maximum number of entries, and details of the entries..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `prefixListId` | string | Yes | The ID of the prefix list. Example: `pl-x1j1k5ykzqlixdcy****` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-chengdu` |

