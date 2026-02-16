# Express Connect & VBR

Physical connections, virtual border routers (VBR), VPC peering, and Express Connect Router.

## createPhysicalConnection

**Signature:** `createPhysicalConnection(request: CreatePhysicalConnectionRequest)`

You can apply for a dedicated Express Connect circuit for yourself or create a hosted connection for a tenant. After your application is approved, the Express Connect circuit changes to the **Initial*.

**Parameters:** (3 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an e Example: `FinanceDept` |
| `value` | string | No | The tag value to add to the resource. You can specify up to 20 tag values The tag value can be an em Example: `FinanceJoshua` |
| `accessPointId` | string | Yes | The access point ID of the Express Connect circuit. Example: `ap-cn-beijing-ft-A` |
| `circuitCode` | string | No | The circuit code of the Express Connect circuit. The circuit code is provided by the connectivity pr Example: `longtel001` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-42665544****` |
| `description` | string | No | The description of the Express Connect circuit. Example: `description` |
| `deviceAdvancedCapacity` | string[] | No | - |
| `lineOperator` | string | Yes | The connectivity provider of the Express Connect circuit. Valid values: Example: `CT` |
| `name` | string | No | The name of the Express Connect circuit. Example: `test` |
| `peerLocation` | string | No | The geographical location of the data center. Example: `cn-hangzhou` |
| `portType` | string | No | The port type. Valid values: Example: `1000Base-T` |
| `redundantPhysicalConnectionId` | string | No | The ID of the redundant Express Connect circuit. The redundant Express Connect circuit must be in th Example: `pc-119mfjzm****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The ID of the resource group to which the Express Connect circuit belongs. Example: `rg-acfmoiyermp****` |
| `tag` | CreatePhysicalConnectionRequestTag[] | No | - |
| `type` | string | No | The type of Express Connect circuit. Default value: **VPC**. Example: `VPC` |
| `bandwidth` | number | No | The maximum bandwidth of the hosted connection. Unit: Mbit/s. Example: `50` |

## deletePhysicalConnection

**Signature:** `deletePhysicalConnection(request: DeletePhysicalConnectionRequest)`

You can only delete a connection over an Express Connect circuit that is in the **Allocated**, **Confirmed**, **Rejected**, **Canceled**, **AllocationFailed**, and **Terminated** states..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mfjzm7*********` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |

## describePhysicalConnections

**Signature:** `describePhysicalConnections(request: DescribePhysicalConnectionsRequest)`

By default, the system queries information about all Express Connect circuits in the specified region. You can query Express Connect circuits that meet specific conditions by specifying filter conditi.

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the filter. Valid values: Example: `Name` |
| `value` | string[] | No | The filter values. Example: `1` |
| `key` | string | No | The key of tag N to add to the resource. You can specify at most 20 tag keys. The tag key cannot be  Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001` |
| `filter` | DescribePhysicalConnectionsRequestFilter[] | No | - |
| `includeReservationData` | boolean | No | Specifies whether to return the data about pending orders. Valid values: Example: `false` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: **10**. Valid values: **1** to **50**. Example: `10` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the Express Connect circuit belongs. Example: `rg-aek2yvwibxrmrkq` |
| `tags` | DescribePhysicalConnectionsRequestTags[] | No | - |

## modifyPhysicalConnectionAttribute

**Signature:** `modifyPhysicalConnectionAttribute(request: ModifyPhysicalConnectionAttributeRequest)`

When you call this operation, take note of the following limits: *   If an Express Connect circuit is in the **Initial**, **Enabled**, or **Rejected** state, you can modify the specifications of the E.

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitCode` | string | No | The circuit code of the Express Connect circuit. The circuit code is provided by the connectivity pr Example: `longtel001` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `efefe566754h` |
| `description` | string | No | The description of the Express Connect circuit. Example: `The` |
| `lineOperator` | string | No | The connectivity provider of the Express Connect circuit. Valid values: Example: `CT` |
| `name` | string | No | The name of the Express Connect circuit. Example: `Name` |
| `peerLocation` | string | No | The geographical location of the data center. Example: `XX` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mfjzm******` |
| `portType` | string | No | The port type of the Express Connect circuit. Valid values: Example: `1000Base-LX` |
| `redundantPhysicalConnectionId` | string | No | The ID of the redundant Express Connect circuit. The redundant Express Connect circuit must be in th Example: `pc-119mfjzm7` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |
| `bandwidth` | number | No | The bandwidth value for the connection over the Express Connect circuit. Unit: Mbit/s. Valid values: Example: `5` |

## enablePhysicalConnection

**Signature:** `enablePhysicalConnection(request: EnablePhysicalConnectionRequest)`

When you call this operation, take note of the following limits: *   You can enable only an Express Connect circuit that is in the **Confirmed** state. *   After you enable an Express Connect circuit,.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `byPassSp` | boolean | No | Specifies whether to skip the order lifecycle. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mfjz****` |
| `regionId` | string | Yes | The region where the Express Connect circuit is deployed. Example: `cn-shanghai` |

## terminatePhysicalConnection

**Signature:** `terminatePhysicalConnection(request: TerminatePhysicalConnectionRequest)`

After you call this operation, the specified Express Connect circuit changes to the **Terminating** state. After the Express Connect circuit is disabled, it changes to the **Terminated** state. When y.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mfjzm****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |

## cancelPhysicalConnection

**Signature:** `cancelPhysicalConnection(request: CancelPhysicalConnectionRequest)`

You can cancel only an Express Connect circuit that is in the **Initial**, **Approved**, **Allocated**, or **Confirmed** state..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mfjzm7****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |

## confirmPhysicalConnection

**Signature:** `confirmPhysicalConnection(request: ConfirmPhysicalConnectionRequest)`

Changes the status of an Express Connect circuit to Confirmed..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e0****` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mf****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |

## applyPhysicalConnectionLOA

**Signature:** `applyPhysicalConnectionLOA(request: ApplyPhysicalConnectionLOARequest)`

Applies for a Letter of Authorization (LOA) for an Express Connect circuit..

**Parameters:** See `ApplyPhysicalConnectionLOARequest` model.

## completePhysicalConnectionLOA

**Signature:** `completePhysicalConnectionLOA(request: CompletePhysicalConnectionLOARequest)`

Generates a report for an installed Express Connect circuit..

**Parameters:** See `CompletePhysicalConnectionLOARequest` model.

## describePhysicalConnectionLOA

**Signature:** `describePhysicalConnectionLOA(request: DescribePhysicalConnectionLOARequest)`

查询物理专线LOA信息.

**Parameters:** See `DescribePhysicalConnectionLOARequest` model.

## createVirtualBorderRouter

**Signature:** `createVirtualBorderRouter(request: CreateVirtualBorderRouterRequest)`

After you create a VBR, the VBR is in the **active** state..

**Parameters:** (3 required, 17 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You must enter at least one tag key. You can specify up to 20 tag keys. The tag key can Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `bandwidth` | number | No | The bandwidth of the VBR. Unit: Mbit/s. Example: `100` |
| `circuitCode` | string | No | The circuit code of the Express Connect circuit. The circuit code is provided by the connectivity pr Example: `longtel001` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the VBR. Example: `desc` |
| `enableIpv6` | boolean | No | Specifies whether to enable IPv6. Valid values: Example: `true` |
| `localGatewayIp` | string | No | The IP address of the VBR. Only the owner of the VBR can set or modify this parameter. Example: `192.168.XX.XX` |
| `localIpv6GatewayIp` | string | No | The IPv6 address of the VBR. Only the owner of the VBR can set or modify this parameter. Example: `2001:XXXX:3c4d:0015:0000:0000:0000:1a2b` |
| `name` | string | No | The name of the VBR. Example: `test` |
| `peerGatewayIp` | string | No | The IP address of the gateway device in the data center. Only the owner of the VBR can set or modify Example: `116.62.XX.XX` |
| `peerIpv6GatewayIp` | string | No | The IPv6 address of the gateway device in the data center. Only the owner of the VBR can set or modi Example: `2001:XXXX:4:4:4:4:4:4` |
| `peeringIpv6SubnetMask` | string | No | The subnet mask of the IPv6 addresses of the VBR and the gateway device in the data center. Example: `2408:4004:cc:400::/56` |
| `peeringSubnetMask` | string | No | The subnet mask of the IP addresses of the VBR and the gateway device in the data center. Example: `255.255.255.252` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-2zextbehcx****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmxazb4ph6aiy****` |
| `tags` | CreateVirtualBorderRouterRequestTags[] | No | - |
| `vbrOwnerId` | number | No | The account ID of the VBR owner. Example: `168811111****` |
| `vlanId` | number | Yes | The VLAN ID of the VBR. Valid values: **0 to 2999**. Example: `0` |

## deleteVirtualBorderRouter

**Signature:** `deleteVirtualBorderRouter(request: DeleteVirtualBorderRouterRequest)`

Before you call this operation, take note of the following limits: *   Before you delete a VBR, you must delete all router interfaces of the VBR. *   You can delete only a VBR in the **unconfirmed**, .

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The region ID of the VBR. You can call the [DescribeRegions](https://help.aliyun.com/document_detail Example: `cn-shanghai` |
| `vbrId` | string | Yes | The ID of the VBR. Example: `vbr-bp12mw1f8k3jgygk9****` |

## describeVirtualBorderRouters

**Signature:** `describeVirtualBorderRouters(request: DescribeVirtualBorderRoutersRequest)`

Queries virtual border routers (VBRs)..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter conditions. You can specify up to five filter conditions. Valid values: Example: `Status` |
| `value` | string[] | No | The filter values for keys. You can specify multiple filter values for one key. The logical operator Example: `Active` |
| `key` | string | No | The tag key. You can specify at most 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `filter` | DescribeVirtualBorderRoutersRequestFilter[] | No | - |
| `includeCrossAccountVbr` | boolean | No | Specifies whether cross-account VBRs are included. Example: `false` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region in which the VBR is deployed. You can call the [DescribeRegions](https://help.a Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmxazb4ph6aiy****` |
| `tags` | DescribeVirtualBorderRoutersRequestTags[] | No | - |

## describeVirtualBorderRoutersForPhysicalConnection

**Signature:** `describeVirtualBorderRoutersForPhysicalConnection(request: DescribeVirtualBorderRoutersForPhysicalConnectionRequest)`

Queries the virtual border routers (VBRs) that are associated with an Express Connect circuit. The VBRs can be created by the owner of the Express Connect circuit and by other Alibaba Cloud accounts..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter conditions. You can specify at most five filter conditions. The following filter conditio Example: `Status` |
| `value` | string[] | No | The filter value for the key. You can specify multiple filter values for one key. The logical operat Example: `Active` |
| `filter` | DescribeVirtualBorderRoutersForPhysicalConnectionRequestFilter[] | No | - |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-119mfj****` |
| `regionId` | string | Yes | The region in which the Express Connect circuit is deployed. You can call the [DescribeRegions](http Example: `cn-shanghai` |

## modifyVirtualBorderRouterAttribute

**Signature:** `modifyVirtualBorderRouterAttribute(request: ModifyVirtualBorderRouterAttributeRequest)`

# [](#) *   Only the owner of an Express Connect circuit can modify the **VlanId** parameter. *   One VLAN ID of an Express Connect circuit cannot be used only by one VBR at the same time. *   The VLA.

**Parameters:** (2 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `associatedPhysicalConnections` | string | No | The information about the Express Connect circuit associated with the VBR, including the following p Example: `[` |
| `bandwidth` | number | No | The bandwidth value. Unit: Mbit/s. Example: `100` |
| `circuitCode` | string | No | The circuit code of the Express Connect circuit. The circuit code is provided by the connectivity pr Example: `longtel001` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-00****` |
| `description` | string | No | The description of the VBR. Example: `desc` |
| `detectMultiplier` | number | No | The maximum number of dropped packets that is allowed by the receiver when the initiator transmits p Example: `3` |
| `enableIpv6` | boolean | No | Specifies whether to enable IPv6. Valid values: Example: `false` |
| `localGatewayIp` | string | No | The IP address of the VBR. Example: `192.168.XX.XX` |
| `localIpv6GatewayIp` | string | No | The IPv6 address of the VBR. Example: `2001:XXXX:3c4d:0015:0000:0000:0000:1a2b` |
| `minRxInterval` | number | No | The time interval to receive BFD packets. Valid values: **200 to 1000**. Unit: milliseconds. Example: `300` |
| `minTxInterval` | number | No | The time interval to send BFD packets. Valid values: **200 to 1000**. Unit: milliseconds. Example: `300` |
| `name` | string | No | The name of the VBR. Example: `VBR` |
| `peerGatewayIp` | string | No | The IP address of the gateway device in the data center. Example: `192.168.XX.X` |
| `peerIpv6GatewayIp` | string | No | The IPv6 address of the gateway device in the data center. Example: `2001:XXXX:3c4d:0015:0000:0000:0000:2a2b` |
| `peeringIpv6SubnetMask` | string | No | The subnet mask of the IPv6 addresses of the VBR and the gateway device in the data center. Example: `2408:4004:cc:400::/56` |
| `peeringSubnetMask` | string | No | The subnet mask for the IP addresses of the gateway devices on the Alibaba Cloud side and on the cus Example: `255.255.255.252` |
| `regionId` | string | Yes | The region ID of the VBR. Example: `cn-shanghai` |
| `sitelinkEnable` | boolean | No | Indicates whether to allow service access between data centers. Valid values: Example: `false` |
| `vbrId` | string | Yes | The VBR ID. Example: `vbr-bp1lhl0taikrte****` |
| `vlanId` | number | No | The VLAN ID of the VBR. Valid values: **0 to 2999**. Example: `0` |

## recoverVirtualBorderRouter

**Signature:** `recoverVirtualBorderRouter(request: RecoverVirtualBorderRouterRequest)`

After you call this operation, the VBR changes from the **terminated** state to the **recovering** state. After the operation is performed, the VBR enters the **active** state. When you call this oper.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The region ID of the VBR. Example: `cn-shanghai` |
| `vbrId` | string | Yes | The ID of the VBR. Example: `vbr-bp1lhl0taikrte****` |

## terminateVirtualBorderRouter

**Signature:** `terminateVirtualBorderRouter(request: TerminateVirtualBorderRouterRequest)`

After you call this operation, the VBR enters the **terminating** state from the **active** state. After the VBR is terminated, the VBR enters the **terminated** state. >  Only the owner of an Express.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the VBR. Example: `cn-shanghai` |
| `vbrId` | string | Yes | The ID of the VBR. Example: `vbr-bp15zckdt37pq72****` |

## associatePhysicalConnectionToVirtualBorderRouter

**Signature:** `associatePhysicalConnectionToVirtualBorderRouter(request: AssociatePhysicalConnectionToVirtualBorderRouterRequest)`

Associates a virtual border router (VBR) with a specified Express Connect circuit..

**Parameters:** (4 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `circuitCode` | string | No | The circuit code of the Express Connect circuit. The circuit code is provided by the connectivity pr Example: `longtel001` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `enableIpv6` | string | No | Specifies whether to enable IPv6. Valid values: Example: `false` |
| `localGatewayIp` | string | No | The IP address of the gateway device on the Alibaba Cloud side. Example: `192.168.XX.XX` |
| `localIpv6GatewayIp` | string | No | The IPv6 address of the gateway device on the Alibaba Cloud side. Example: `2001:XXXX:3c4d:0015:0000:0000:0000:1a2b` |
| `peerGatewayIp` | string | No | The IP address of the gateway device on the user side. Example: `192.168.XX.XX` |
| `peerIpv6GatewayIp` | string | No | The IPv6 address of the gateway device in the data center. Example: `2001:XXXX:4:4:4:4:4:4` |
| `peeringIpv6SubnetMask` | string | No | The subnet mask of the IPv6 addresses of the gateway devices on the user side and Alibaba Cloud side Example: `2408:4004:cc:400::/56` |
| `peeringSubnetMask` | string | No | The subnet mask of the IP addresses of the VBR and the gateway device in the data center. Example: `255.255.255.0` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-bp1qrb3044eqixog****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |
| `vbrId` | string | Yes | The ID of the VBR. Example: `vbr-bp186tnz6rijyhj******` |
| `vlanId` | string | Yes | The VLAN ID of the VBR. Valid values: **0 to 2999**. Example: `123` |

## unassociatePhysicalConnectionFromVirtualBorderRouter

**Signature:** `unassociatePhysicalConnectionFromVirtualBorderRouter(request: UnassociatePhysicalConnectionFromVirtualBorderRouterRequest)`

Disassociates a virtual border router (VBR) from an Express Connect circuit..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-bp1qrb3044eqixog****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |
| `vbrId` | string | Yes | The ID of the VBR that you want to disassociate from the Express Connect circuit. Example: `vbr-bp16ksp61j7e0tkn*****` |

## createVpconnFromVbr

**Signature:** `createVpconnFromVbr(request: CreateVpconnFromVbrRequest)`

If an Express Connect partner has created a virtual border router (VBR) for a tenant before, the Express Connect partner can push the Express Connect circuit that is associated with the VBR to the ten.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `orderMode` | string | No | The payer for the shared Express Connect circuit. Valid values: Example: `PayByVirtualPhysicalConnectionOwner` |
| `regionId` | string | Yes | The region ID of the hosted connection. Example: `cn-hangzhou` |
| `token` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `vbrId` | string | Yes | The ID of the associated VBR. Example: `vbr-bp136flp1mf8mlq6r****` |

## createVpcPrefixList

**Signature:** `createVpcPrefixList(request: CreateVpcPrefixListRequest)`

You cannot repeatedly call the **CreateVpcPrefixList** operation within the specified period of time..

**Parameters:** (1 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidr` | string | No | The CIDR block specified in the prefix list. Example: `192.168.0.0/16` |
| `description` | string | No | The description of the CIDR block specified in the prefix list. Example: `CIDR` |
| `key` | string | No | The key of tag N. You can specify up to 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The value of tag N. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `ipVersion` | string | No | The IP version. Valid values: Example: `IPv4` |
| `maxEntries` | number | No | The maximum number of CIDR blocks that you can specify in the prefix list. Default value: 50. Example: `50` |
| `prefixListDescription` | string | No | The description of the prefix list. Example: `description` |
| `prefixListEntries` | CreateVpcPrefixListRequestPrefixListEntries[] | No | - |
| `prefixListName` | string | No | The name of the prefix list. Example: `name` |
| `regionId` | string | Yes | The ID of the region where you want to create the prefix list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the prefix list belongs. Example: `rg-bp67acfmxazb4ph****` |
| `tag` | CreateVpcPrefixListRequestTag[] | No | - |

## deleteVpcPrefixList

**Signature:** `deleteVpcPrefixList(request: DeleteVpcPrefixListRequest)`

You cannot repeatedly call the **DeleteDhcpOptionsSet** operation to delete a prefix list within the specified period of time..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `prefixListId` | string | Yes | The ID of the prefix list that you want to delete. Example: `pl-0b78hw45f****` |
| `regionId` | string | Yes | The region ID of the prefix list. Example: `cn-hangzhou` |

## getVpcPrefixListAssociations

**Signature:** `getVpcPrefixListAssociations(request: GetVpcPrefixListAssociationsRequest)`

Queries the resources that are associated with a prefix list..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries to return in each call. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `prefixListId` | string | Yes | The ID of the prefix list that you want to query. Example: `pl-0b7hwu67****` |
| `regionId` | string | Yes | The region ID of the prefix list. Example: `cn-hangzhou` |

## getVpcPrefixListEntries

**Signature:** `getVpcPrefixListEntries(request: GetVpcPrefixListEntriesRequest)`

Queries the information about a prefix list..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `prefixListId` | string | Yes | The ID of the prefix list that you want to query. Example: `pl-0b7hwu67****` |
| `regionId` | string | Yes | The region ID of the prefix list. Example: `cn-hangzhou` |

## listPrefixLists

**Signature:** `listPrefixLists(request: ListPrefixListsRequest)`

Queries prefix lists..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify up to 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify up to 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `maxResults` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `prefixListIds` | string[] | No | The IDs of prefix lists to be queried. Valid values of **N** are **1** to **100**, which specifies t Example: `pl-m5estsqsdqwg88hjf****` |
| `prefixListName` | string | No | The name of the prefix list to query. Example: `name` |
| `regionId` | string | Yes | The ID of the region where you want to query prefix lists. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the prefix list belongs. Example: `rg-bp67acfmxazb4ph****` |
| `tags` | ListPrefixListsRequestTags[] | No | - |

## modifyVpcPrefixList

**Signature:** `modifyVpcPrefixList(request: ModifyVpcPrefixListRequest)`

**ModifyVpcPrefixList** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListPrefixLists](https://help.aliy.

**Parameters:** (2 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidr` | string | No | The CIDR block to be added to the prefix list. Example: `172.16.0.0/12` |
| `description` | string | No | The description of the CIDR block to be added to the prefix list. Example: `newcidr` |
| `cidr` | string | No | The CIDR block that you want to delete from the prefix list. Example: `192.168.0.0/16` |
| `description` | string | No | The description of the CIDR block that you want to delete. Example: `cidr` |
| `addPrefixListEntry` | ModifyVpcPrefixListRequestAddPrefixListEntry[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to only precheck the request. Valid values: Example: `false` |
| `maxEntries` | number | No | The maximum number of CIDR blocks supported by the prefix list after the configuration of the prefix Example: `20` |
| `prefixListDescription` | string | No | The new description of the prefix list. Example: `newdescription` |
| `prefixListId` | string | Yes | The ID of the prefix list. Example: `pl-0b7hwu67****` |
| `prefixListName` | string | No | The new name of the prefix list. Example: `newname` |
| `regionId` | string | Yes | The region ID of the prefix list. Example: `cn-hangzhou` |
| `removePrefixListEntry` | ModifyVpcPrefixListRequestRemovePrefixListEntry[] | No | - |

## createRouterInterface

**Signature:** `createRouterInterface(request: CreateRouterInterfaceRequest)`

When you call this operation, take note of the following limits: *   You can create only one pair of interfaces to be connected between two routers. *   You can create a maximum of five router interfa.

**Parameters:** (12 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessPointId` | string | Yes | The ID of the access point to which the VBR belongs. Example: `ap-cn-hangzhou-yh-ts-A` |
| `autoPay` | boolean | Yes | Specifies whether to enable automatic payment. Valid values: Example: `false` |
| `healthCheckTargetIp` | string | Yes | The destination IP address that is used to perform health checks. Example: `192.168.0.8` |
| `oppositeAccessPointId` | string | Yes | The ID of the access point to which the peer belongs. Example: `ap-cn-shanghai-nt-aligroup-C` |
| `oppositeRegionId` | string | Yes | The ID of the region in which the acceptor is deployed. Example: `cn-shanghai` |
| `period` | number | Yes | The subscription duration. Valid values: Example: `3` |
| `pricingCycle` | string | Yes | The billing cycle of the subscription. Valid values: Example: `Month` |
| `regionId` | string | Yes | The ID of the region to which the router interface belongs. Example: `cn-hangzhou` |
| `role` | string | Yes | The role of the router interface. Valid values: Example: `InitiatingSide` |
| `routerId` | string | Yes | The ID of the router that is associated with the router interface. Example: `vbr-m5ebm6g9ptc9mly1c****` |
| `routerType` | string | Yes | The type of router that is associated with the router interface. Valid values: Example: `VRouter` |
| `spec` | string | Yes | The specification of the router interface and the corresponding bandwidth. Valid values: Example: `Mini.2` |
| `key` | string | No | The tag key to add to the resource. You must enter at least one tag key. You can specify up to 20 ta Example: `FinanceDept` |
| `value` | string | No | The tag value to add to the resource. You can specify up to 20 tag values. The tag value can be an e Example: `FinanceJoshua` |
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the router interface. Example: `abcabc` |
| `fastLinkMode` | boolean | No | Specifies whether the VBR that is created in the Fast Link mode is uplinked to the router interface. Example: `false` |
| `healthCheckSourceIp` | string | No | The source IP address that is used to perform health checks. The source IP address must be an idle I Example: `192.168.0.6` |
| `instanceChargeType` | string | No | The billing method of the router interface. Valid values: Example: `PrePaid` |
| `name` | string | No | The name of the router interface. Example: `abc` |
| `oppositeInterfaceId` | string | No | The ID of the peer router interface. Example: `ri-2zeo3xzyf38r4urzd****` |
| `oppositeInterfaceOwnerId` | string | No | The ID of the Alibaba Cloud account to which the peer router interface belongs. Example: `253460731706911258` |
| `oppositeRouterId` | string | No | The ID of the peer router. Example: `vrt-bp1lhl0taikrteen8****` |
| `oppositeRouterType` | string | No | The type of router that is associated with the peer router interface. Valid values: Example: `VRouter` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazb4ph6aiy****` |
| `tags` | CreateRouterInterfaceRequestTags[] | No | - |

## deleteRouterInterface

**Signature:** `deleteRouterInterface(request: DeleteRouterInterfaceRequest)`

When you call this operation, take note of the following limits: *   You can delete only a router interface that is in the **Idle** or **Inactive** state. *   Before you delete a router interface, you.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The ID of the region where the router interface is deployed. Example: `cn-shanghai` |
| `routerInterfaceId` | string | Yes | The ID of the router interface. Example: `ri-2zeo3xzyf38r4urz****` |

## describeRouterInterfaces

**Signature:** `describeRouterInterfaces(request: DescribeRouterInterfacesRequest)`

Queries router interfaces in a specified region..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter conditions. You can specify up to five filter conditions. The following filter conditions Example: `Filter.1.Status` |
| `value` | string[] | No | Specifies the value in the filter condition based on the key. You can specify multiple filter values Example: `Filter.1.Active` |
| `key` | string | No | The key of the resource tag. At least one tag key must be entered, and a maximum of 20 tag keys are  Example: `FinanceDept` |
| `value` | string | No | The value of the resource tag. A maximum of 20 tag values can be entered. If this value needs to be  Example: `FinanceJoshua` |
| `filter` | DescribeRouterInterfacesRequestFilter[] | No | - |
| `includeReservationData` | boolean | No | Specifies whether renewal data is included. Valid values: Example: `false` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the router interface. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | Resource Group ID. Example: `rg-acfmxazb4ph6aiy****` |
| `tags` | DescribeRouterInterfacesRequestTags[] | No | - |

## modifyRouterInterfaceAttribute

**Signature:** `modifyRouterInterfaceAttribute(request: ModifyRouterInterfaceAttributeRequest)`

Modifies the configuration of a router interface..

**Parameters:** (3 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleteHealthCheckIp` | boolean | No | Specifies whether to delete the health check IP addresses configured on the router interface. Valid  Example: `false` |
| `description` | string | No | The description of the router interface. Example: `The` |
| `hcRate` | number | No | The rate of health checks. Unit: milliseconds. The recommended value is **2000**. This value specifi Example: `2000` |
| `hcThreshold` | number | No | The healthy threshold. Unit: packets. We recommend that you set the value to **8**. This value speci Example: `8` |
| `healthCheckSourceIp` | string | No | The source IP address that is used to perform health checks. The source IP address must be an idle I Example: `116.62.XX.XX` |
| `healthCheckTargetIp` | string | Yes | The destination IP address that is used to perform health checks. Example: `116.62.XX.XX` |
| `name` | string | No | The name of the router interface. Example: `TEST` |
| `oppositeInterfaceId` | string | No | The ID of the peer router interface. Example: `ri-2zeo3xzyf38r4urz****` |
| `oppositeInterfaceOwnerId` | number | No | The ID of the Alibaba Cloud account to which the peer router interface belongs. Example: `28768383240243****` |
| `oppositeRouterId` | string | No | The ID of the peer router. Example: `vrt-bp1jcg5cmxjbl9xgc****` |
| `oppositeRouterType` | string | No | The type of router to which the peer router interface belongs. Valid values: Example: `VBR` |
| `regionId` | string | Yes | The region ID of the router interface. Example: `cn-shanghai` |
| `routerInterfaceId` | string | Yes | The ID of the router interface. Example: `ri-2zeo3xzyf38r4urz****` |

## modifyRouterInterfaceSpec

**Signature:** `modifyRouterInterfaceSpec(request: ModifyRouterInterfaceSpecRequest)`

After you call this operation, the router interface enters the **Activating** state. After the router interface is activated, the router interface enters the **Active** state. >  You cannot modify the.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The ID of the region where the router interface is deployed. Example: `cn-hangzhou` |
| `routerInterfaceId` | string | Yes | The ID of the router interface. Example: `ri-2zeo3xzyf38r4urzd****` |
| `spec` | string | Yes | The specification of the router interface. Valid specifications and bandwidth values: Example: `Small.1` |

## activateRouterInterface

**Signature:** `activateRouterInterface(request: ActivateRouterInterfaceRequest)`

After you call this operation, the router interface enters the **Activating** state. After the router interface is activated, it enters the **Active** state. >  You cannot activate a router interface .

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID of the router interface. Example: `cn-hangzhou` |
| `routerInterfaceId` | string | Yes | The ID of the router interface. Example: `ri-2zeo3xzyf38r4urz****` |

## deactivateRouterInterface

**Signature:** `deactivateRouterInterface(request: DeactivateRouterInterfaceRequest)`

冻结路由器接口.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The ID of the region where the router interface is deployed. Example: `cn-hangzhou` |
| `routerInterfaceId` | string | Yes | The ID of the router interface. Example: `ri-2zeo3xzyf38r4urz****` |

## connectRouterInterface

**Signature:** `connectRouterInterface(request: ConnectRouterInterfaceRequest)`

After you call this operation, the router interface enters the **Connecting** state. When the connection is established, it enters the **Active** state. When you call this operation, take note of the .

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The ID of the region where the router interface is deployed. Example: `cn-hangzhou` |
| `routerInterfaceId` | string | Yes | The ID of the initiator router interface. Example: `ri-2zeo3xzyf38r4urzd****` |

## describeRouterInterfaceAttribute

**Signature:** `describeRouterInterfaceAttribute(request: DescribeRouterInterfaceAttributeRequest)`

Queries the configuration of a router interface..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the router interface. Example: `ri-m5egfc10sednwk2yt****` |
| `regionId` | string | Yes | The ID of the region to which the router interface belongs. Example: `cn-qingdao` |

## grantInstanceToCen

**Signature:** `grantInstanceToCen(request: GrantInstanceToCenRequest)`

Before you can attach a network instance that belongs to another Alibaba Cloud account to your CEN instance, you must grant permissions to your CEN instance. >  **GrantInstanceToCen** is a Virtual Pri.

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cenId` | string | Yes | The ID of the CEN instance to which you want to grant permissions. Example: `cen-7qthudw0ll6jmc****` |
| `cenOwnerId` | number | Yes | The user ID (UID) of the Apsara Stack tenant account to which the CEN instance belongs. Example: `123456789` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `instanceId` | string | Yes | The ID of the network instance. Example: `vpc-uf6o8d1dj8sjwxi6o****` |
| `instanceType` | string | Yes | The type of the network instance. Valid values: Example: `VPC` |
| `regionId` | string | Yes | The ID of the region where the network instance is deployed. Example: `cn-hangzhou` |

## grantInstanceToVbr

**Signature:** `grantInstanceToVbr(request: GrantInstanceToVbrRequest)`

## Usage notes When you connect a VBR to a VPC that belongs to another Alibaba Cloud account, the VBR must acquire the required permissions from the VPC..

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grantType` | string | Yes | The VBRs that need to acquire permissions on the VPC. Valid values: Example: `All` |
| `instanceId` | string | Yes | The ID of the VPC. Example: `vpc-bp1lqhq93q8evjpky****` |
| `regionId` | string | Yes | The ID of the region where the VPC is deployed. Example: `cn-hangzhou` |
| `vbrInstanceIds` | string[] | No | The information about the VBRs. |
| `vbrOwnerUid` | number | Yes | The ID of the Alibaba Cloud account to which the VBR belongs. Example: `1210123456123456` |
| `vbrRegionNo` | string | Yes | The ID of the region where the VBR is deployed. Example: `cn-hangzhou` |

## createExpressCloudConnection

**Signature:** `createExpressCloudConnection(request: CreateExpressCloudConnectionRequest)`

Creates an Express Cloud Connect (ECC) instance..

**Parameters:** (4 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | number | Yes | The bandwidth for ECC, which corresponds to the bandwidth for the underlying circuit. Example: `2` |
| `contactMail` | string | No | The email address of the contact who applies for ECC. Example: `XX@example.com` |
| `contactTel` | string | No | The phone number of the contact who applies for ECC. Example: `132*********` |
| `description` | string | No | The description of ECC. Example: `ECC` |
| `IDCardNo` | string | No | The ID card number of the contact who applies for ECC. Example: `32*****************` |
| `idcSP` | string | Yes | The Internet service provider (ISP) for the data center. Example: `CU` |
| `name` | string | No | The name of the ECC instance. Example: `doctest` |
| `peerCity` | string | No | The city where the data center is located. Example: `Hangzhou` |
| `peerLocation` | string | Yes | The geographical location of the data center. Example: `\\*\\*city\\*\\*district/county\\*\\*road\\*\\*number\\*\\*property` |
| `portType` | string | No | The port of the Express Connect circuit. Valid values: Example: `100Base-T` |
| `redundantEccId` | string | No | The ID of the standby Express Connect circuit. Example: `ecc-d****` |
| `regionId` | string | Yes | The region ID of the ECC instance. Example: `cn-hangzhou` |

## modifyExpressCloudConnectionAttribute

**Signature:** `modifyExpressCloudConnectionAttribute(request: ModifyExpressCloudConnectionAttributeRequest)`

Modifies the configuration of an Express Cloud Connect (ECC) instance..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgpAs` | string | No | The BGP autonomous system number (ASN) to be configured for the Smart Access Gateway (SAG) device. Example: `sag-ejfge***` |
| `ceIp` | string | No | The peer IP address when the SAG device is connected to the cloud. Example: ```172.16.**.**``` |
| `description` | string | No | Descriptions of ECC. Example: `ECC` |
| `eccId` | string | Yes | The ID of the ECC instance. Example: `ecc-bp1t9osmuln*******` |
| `name` | string | No | The name of the ECC instance. Example: `doctest` |
| `peIp` | string | No | The on-premises IP address when the SAG device is connected to the cloud. Example: ```10.10.**.**``` |
| `regionId` | string | Yes | The region ID of the ECC instance. Example: `cn-hangzhou` |

## modifyExpressCloudConnectionBandwidth

**Signature:** `modifyExpressCloudConnectionBandwidth(request: ModifyExpressCloudConnectionBandwidthRequest)`

Modifies the bandwidth of an Express Cloud Connect (ECC) instance..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | No | The bandwidth of the ECC instance. Example: `2` |
| `eccId` | string | Yes | The ID of the ECC instance. Example: `ecc-xxxxxxxxx` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |

## describeAccessPoints

**Signature:** `describeAccessPoints(request: DescribeAccessPointsRequest)`

Queries the access points of Express Connect circuits in a region..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the access point. Example: `cn-hangzhou` |

## listBusinessAccessPoints

**Signature:** `listBusinessAccessPoints(request: ListBusinessAccessPointsRequest)`

Queries the access points of an Express Connect circuit..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | No | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |

## createFailoverTestJob

**Signature:** `createFailoverTestJob(request: CreateFailoverTestJobRequest)`

You cannot create a failover test in the following scenarios: *   You have created a failover test in the region and its type is StartNow. *   The Express Connect circuit or hosted connection has pend.

**Parameters:** (4 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the failover test. Example: `test` |
| `dryRun` | boolean | No | If you set the value to true, the system performs only a dry run without actually performing the act Example: `false` |
| `jobDuration` | number | Yes | The duration of the failover test. Unit: minutes. Valid values: **1 to 4320**. Example: `60` |
| `jobType` | string | Yes | The type of the failover test. Valid values: Example: `StartNow` |
| `name` | string | No | The name of the failover test. Example: `test` |
| `regionId` | string | No | The region ID of the failover test. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The IDs of failover test resources. You can add at most 16 resources. |
| `resourceType` | string | Yes | The resource type of the failover test. Set the value to **PHYSICALCONNECTION**. Example: `PHYSICALCONNECTION` |

## deleteFailoverTestJob

**Signature:** `deleteFailoverTestJob(request: DeleteFailoverTestJobRequest)`

You can delete only failover tests that are in the **Pending** or **Complete** state..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `jobId` | string | Yes | The ID of the failover test. Example: `ftj-xxxxxxxxx` |
| `regionId` | string | No | The region ID of the failover test. Example: `ch-hangzhou` |

## describeFailoverTestJob

**Signature:** `describeFailoverTestJob(request: DescribeFailoverTestJobRequest)`

Queries failover tests..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `jobId` | string | Yes | The ID of the failover test. Example: `ftj-xxxxxxxxx` |
| `regionId` | string | No | The region ID of the failover test. Example: `cn-hangzhou` |

## describeFailoverTestJobs

**Signature:** `describeFailoverTestJobs(request: DescribeFailoverTestJobsRequest)`

Queries failover tests for Express Connect..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter key. Valid values: Example: `JobId` |
| `value` | string[] | No | The value of the filter key. |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `filter` | DescribeFailoverTestJobsRequestFilter[] | No | - |
| `maxResults` | number | No | The number of entries per page. Valid values: **1 to 100**. Default value: 20. Example: `20` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | No | The region where you want to perform the failover test. Example: `cn-hangzhou` |

## startFailoverTestJob

**Signature:** `startFailoverTestJob(request: StartFailoverTestJobRequest)`

You can perform only failover tests that are in the **Pending** state..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `jobId` | string | Yes | The ID of the failover test. Example: `ftj-xxxxxxxxx` |
| `regionId` | string | No | The region ID of the failover test. Example: `cn-hangzhou` |

## stopFailoverTestJob

**Signature:** `stopFailoverTestJob(request: StopFailoverTestJobRequest)`

Terminates a failover test..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `jobId` | string | Yes | The ID of the failover test. Example: `ftj-xxxxxxxxx` |
| `regionId` | string | No | The region ID of the failover test. Example: `cn-hangzhou` |

## updateFailoverTestJob

**Signature:** `updateFailoverTestJob(request: UpdateFailoverTestJobRequest)`

Updates a failover test..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the failover test. Example: `test` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `jobDuration` | number | No | The duration of the failover test. Unit: minutes. Valid values: **1** to **4320**. Example: `60` |
| `jobId` | string | Yes | The ID of the failover test. Example: `ftj-xxxxxxxxx` |
| `name` | string | No | The name of the failover test. Example: `test` |
| `regionId` | string | No | The region ID of the failover test. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |


## createExpressConnectTrafficQos

**Signature:** `createExpressConnectTrafficQos(request: CreateExpressConnectTrafficQosRequest)`

Creates a quality of service (QoS) policy..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key to add to the resource. You must enter at least one tag key. You can specify up to 20 ta Example: `FinanceDept` |
| `value` | string | No | The tag value to add to the resource. You can specify up to 20 tag values. The tag value can be an e Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `qosDescription` | string | No | The description of the QoS policy. Example: `qos-test` |
| `qosName` | string | No | The name of the QoS policy. Example: `qos-test` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazfdgdg****` |
| `tags` | CreateExpressConnectTrafficQosRequestTags[] | No | - |


## createExpressConnectTrafficQosQueue

**Signature:** `createExpressConnectTrafficQosQueue(request: CreateExpressConnectTrafficQosQueueRequest)`

Creates a quality of service (QoS) queue..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPercent` | string | No | The percentage of bandwidth allocated to the QoS queue. Example: `100` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueDescription` | string | No | The description of the QoS queue. Example: `qos-queue-test` |
| `queueName` | string | No | The name of the QoS queue. Example: `qos-queue-test` |
| `queueType` | string | Yes | The priority of the QoS queue. Valid values: Example: `High` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |


## createExpressConnectTrafficQosRule

**Signature:** `createExpressConnectTrafficQosRule(request: CreateExpressConnectTrafficQosRuleRequest)`

Creates a quality of service (QoS) rule..

**Parameters:** (5 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dstCidr` | string | No | The destination IPv4 CIDR block that matches the QoS rule traffic. Example: `1.1.1.0/24` |
| `dstIPv6Cidr` | string | No | The destination IPv6 CIDR block that matches the QoS rule traffic. Example: `2001:0db8:1234:5678::/64` |
| `dstPortRange` | string | No | The range of destination ports that match the QoS rule traffic. Valid values: **0** to **65535**. If Example: `-1/-1` |
| `matchDscp` | number | No | The DSCP value that matches the QoS rule traffic. Valid values: **0** to **63**. If no value is matc Example: `1` |
| `priority` | number | Yes | The priority of the QoS rule. Valid values: **1** to **9000**. A larger value indicates a higher pri Example: `1` |
| `protocol` | string | Yes | The protocol of the QoS rule. Valid values: Example: `ALL` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueId` | string | Yes | The ID of the QoS queue. Example: `qos-queue-9nyx2u7n71s2rcy4n5` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |
| `remarkingDscp` | number | No | The new DSCP value. Valid values: **0** to **63**. If you do not change the value, set the value to  Example: `1` |
| `ruleDescription` | string | No | The description of the QoS rule. Example: `qos-rule-test` |
| `ruleName` | string | No | The name of the QoS rule. Example: `qos-rule-test` |
| `srcCidr` | string | No | The source IPv4 CIDR block that matches the QoS rule traffic. Example: `1.1.1.0/24` |
| `srcIPv6Cidr` | string | No | The source IPv6 CIDR block that matches the QoS rule traffic. Example: `2001:0db8:1234:5678::/64` |
| `srcPortRange` | string | No | The range of source ports that match the QoS rule traffic. Valid values: **0** to **65535**. If the  Example: `-1/-1` |


## createHighReliablePhysicalConnection

**Signature:** `createHighReliablePhysicalConnection(request: CreateHighReliablePhysicalConnectionRequest)`

Creates Express Connect circuits in high reliability mode. This improves the stability of multiple Express Connect circuits and prevents service interruptions caused by single points of failures (SPOF.

**Parameters:** (7 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessPointId` | string | Yes | The ID of the access point that is associated with the Express Connect circuit. Example: `ap-cn-beijing-ft-A` |
| `bandwidth` | number | No | The maximum bandwidth of the hosted connection. Unit: Mbit/s. Example: `50` |
| `circuitCode` | string | No | The circuit code of the Express Connect circuit, which is provided by the connectivity provider. Example: `longtel001` |
| `description` | string | No | The description of the Express Connect circuit. Example: `description` |
| `lineOperator` | string | Yes | The connectivity provider of the Express Connect circuit. Valid values: Example: `CT` |
| `name` | string | No | The name of the Express Connect circuit. Example: `test` |
| `peerLocation` | string | No | The geographical location of the data center. Example: `ram-test` |
| `portNum` | number | Yes | The number of ports. Valid values: 2 to 16. This parameter is required only when **HighReliableType* Example: `2` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-shanghai` |
| `type` | string | No | The type of the Express Connect circuit. Default value: **VPC**. Example: `VPC` |
| `key` | string | No | The key of tag N to add to the resource. Valid values of N: 1 to 20. The tag key cannot be an empty  Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. Valid values of N: 1 to 20. The tag value cannot be an em Example: `FinanceJoshua` |
| `acceptLanguage` | string | No | The language to display the results. Valid values: Example: `zh-CN` |
| `apList` | CreateHighReliablePhysicalConnectionRequestApList[] | Yes | The access points. |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `deviceAdvancedCapacity` | string[] | No | - |
| `dryRun` | string | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `highReliableType` | string | Yes | The high availability mode. Valid values: Example: `MultiApMultiDevice` |
| `portType` | string | Yes | The port type. Valid values: Example: `1000Base-T` |
| `regionId` | string | No | The region ID of the Express Connect circuit. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazb4p****` |
| `tag` | CreateHighReliablePhysicalConnectionRequestTag[] | No | - |


## createPhysicalConnectionOccupancyOrder

**Signature:** `createPhysicalConnectionOccupancyOrder(request: CreatePhysicalConnectionOccupancyOrderRequest)`

>  You can call this operation only when the Express Connect circuit is in the **Complete** state..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payments. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944` |
| `instanceChargeType` | string | No | The billing method. Set the value to Example: `PrePaid` |
| `period` | number | No | The subscription duration. Example: `1` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-bp1hp0wr072f6****` |
| `pricingCycle` | string | No | The billing cycle of the subscription. Valid values: Example: `Month` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |


## createPhysicalConnectionSetupOrder

**Signature:** `createPhysicalConnectionSetupOrder(request: CreatePhysicalConnectionSetupOrderRequest)`

Creates an order for initial installation of an Express Connect circuit..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessPointId` | string | Yes | The ID of the access point. Example: `ap-cn-beijing-ft-A` |
| `autoPay` | boolean | No | Specifies whether to enable automatic payments. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `318BB676-0A2B-43A0-9AD8-F1D34E93750F` |
| `lineOperator` | string | Yes | The connectivity provider of the Express Connect circuit. Valid values: Example: `CT` |
| `portType` | string | No | The port type of the Express Connect circuit. Valid values: Example: `100Base-T` |
| `redundantPhysicalConnectionId` | string | No | The ID of the redundant physical connection. The redundant physical connection must be in the **Allo Example: `pc-bp10zsv5ntp****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-beijing` |


## createVbrHa

**Signature:** `createVbrHa(request: CreateVbrHaRequest)`

Creates a virtual border router (VBR) failover group..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `description` | string | No | The description of the VBR failover group. Example: `VBRHa` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Va Example: `false` |
| `name` | string | No | The name of the VBR failover group. Example: `VBRHa` |
| `peerVbrId` | string | Yes | The ID of the other VBR in the VBR failover group. Example: `vbr-bp12mw1f8k3jgygk9****` |
| `regionId` | string | Yes | The ID of the region in which the VBR is deployed. Example: `cn-hangzhou` |
| `vbrId` | string | Yes | The ID of the VBR. Example: `vbr-bp1jcg5cmxjbl9xgc****` |


## createVirtualPhysicalConnection

**Signature:** `createVirtualPhysicalConnection(request: CreateVirtualPhysicalConnectionRequest)`

# [](#)Description Before you call this operation, we recommend that you learn about the workflow for creating a hosted connection and the environment requirements. For more information, see [Overview.

**Parameters:** (6 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify at most 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `description` | string | No | The description of the hosted connection. Example: `desctest` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Default value: 45104. Example: `false` |
| `name` | string | No | The name of the hosted connection. Example: `nametest` |
| `orderMode` | string | Yes | The payer for the hosted connection. Valid values: Example: `PayByVirtualPhysicalConnectionOwner` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit over which the hosted connection is created. Example: `pc-bp1ciz7ekd2grn1as****` |
| `regionId` | string | Yes | The region ID of the hosted connection. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the hosted connection belongs. Example: `rg-aekzjty2chzuqky` |
| `spec` | string | Yes | The bandwidth value of the hosted connection. Example: `50M` |
| `tag` | CreateVirtualPhysicalConnectionRequestTag[] | No | - |
| `token` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `vlanId` | number | Yes | The virtual local area network (VLAN) ID of the hosted connection. Valid values: **0** to **2999**. Example: `4` |
| `vpconnAliUid` | number | Yes | The Alibaba Cloud account ID of the tenant. Example: `1210123456123456` |


## deleteExpressConnect

**Signature:** `deleteExpressConnect(request: DeleteExpressConnectRequest)`

Deletes a Express Connect instance, including the initiator and acceptor..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-00****` |
| `force` | boolean | No | Specifies whether to delete the route entries associated with the Express Connect instance. Example: `false` |
| `regionId` | string | Yes | The ID of the region where the Express Connect instance is deployed. Call the [DescribeRegion](https Example: `cn-shanghai` |
| `routerInterfaceId` | string | Yes | The ID of the Express Connect instance. Example: `ri-119mfjz****` |


## deleteExpressConnectTrafficQos

**Signature:** `deleteExpressConnectTrafficQos(request: DeleteExpressConnectTrafficQosRequest)`

Deletes a quality of service (QoS) policy..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `qosId` | string | Yes | The instance ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |


## deleteExpressConnectTrafficQosQueue

**Signature:** `deleteExpressConnectTrafficQosQueue(request: DeleteExpressConnectTrafficQosQueueRequest)`

Deletes a quality of service (QoS) queue..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueId` | string | Yes | The ID of the QoS queue. Example: `qos-queue-9nyx2u7n71s2rcy4n5` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |


## deleteExpressConnectTrafficQosRule

**Signature:** `deleteExpressConnectTrafficQosRule(request: DeleteExpressConnectTrafficQosRuleRequest)`

Deletes a quality of service (QoS) rule..

**Parameters:** (4 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-00****` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueId` | string | Yes | The ID of the QoS queue. Example: `qos-queue-9nyx2u7n71s2rcy4n5` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |
| `ruleId` | string | Yes | The ID of the QoS rule. Example: `qos-rule-iugg0l9x27f2nocouj` |


## deleteVbrHa

**Signature:** `deleteVbrHa(request: DeleteVbrHaRequest)`

Deletes a virtual border router (VBR) failover group..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `instanceId` | string | Yes | The ID of the VBR failover group. Example: `vbrha-sa1******` |
| `regionId` | string | Yes | The ID of the region in which the VBR is deployed. Example: `cn-hangzhou` |


## describeExpressConnectTrafficQos

**Signature:** `describeExpressConnectTrafficQos(request: DescribeExpressConnectTrafficQosRequest)`

Queries the quality of service (QoS) policies of Express Connect. The response can be displayed by page..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You must enter at least one tag key. You can specify up to 20 tag keys. The tag key can Example: `FinanceDept` |
| `value` | string | No | The tag values of the resources. You can specify up to 20 tag values. The tag value can be an empty  Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `maxResults` | number | No | The maximum number of entries to return. Valid values: **1** to **100**. Default value: **10**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `qosIdList` | string[] | No | - |
| `qosNameList` | string[] | No | - |
| `regionId` | string | Yes | The ID of the region in which the QoS policy is created. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmxazfdgdg****` |
| `tags` | DescribeExpressConnectTrafficQosRequestTags[] | No | - |


## describeExpressConnectTrafficQosQueue

**Signature:** `describeExpressConnectTrafficQosQueue(request: DescribeExpressConnectTrafficQosQueueRequest)`

Queries the information about the quality of service (QoS) queues of the Express Connect circuit..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `qosId` | string | No | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueIdList` | string[] | No | - |
| `queueNameList` | string[] | No | - |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |


## describeExpressConnectTrafficQosRule

**Signature:** `describeExpressConnectTrafficQosRule(request: DescribeExpressConnectTrafficQosRuleRequest)`

Queries quality of service (QoS) rules. Paging parameters are not supported..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `qosId` | string | No | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueId` | string | No | The ID of the QoS queue. Example: `qos-queue-9nyx2u7n71s2rcy4n5` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |
| `ruleIdList` | string[] | No | - |
| `ruleNameList` | string[] | No | - |


## describeTagKeysForExpressConnect

**Signature:** `describeTagKeysForExpressConnect(request: DescribeTagKeysForExpressConnectRequest)`

Queries the tags of an Express Connect circuit..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The keyword of the tag. Fuzzy match is supported. You can specify a keyword to query all tags that c Example: `keyword` |
| `maxResult` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The ID of the region to which the resource resides. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | No | The type of the resource. Set the value to **PHYSICALCONNECTION**, which specifies an Express Connec Example: `PHYSICALCONNECTION` |


## describeVbrHa

**Signature:** `describeVbrHa(request: DescribeVbrHaRequest)`

Queries virtual border router (VBR) failover groups..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid Values: Example: `false` |
| `regionId` | string | Yes | The ID of the region in which the VBR is deployed. Example: `cn-shanghai` |
| `vbrHaId` | string | No | The ID of the VBR failover group. Example: `vbrha-sa1sxheuxtd98****` |
| `vbrId` | string | No | The VBR ID. Example: `vbr-bp1jcg5cmxjbl9xgc****` |


## getPhysicalConnectionServiceStatus

**Signature:** `getPhysicalConnectionServiceStatus(request: GetPhysicalConnectionServiceStatusRequest)`

You can call this API operation to query the status of outbound data transfer billing for the current account. For more information about outbound data transfer billing, see [Outbound data transfer bi.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The ID of the region for which you want to query the status of outbound data transfer billing. Example: `cn-hangzhou` |


## listPhysicalConnectionFeatures

**Signature:** `listPhysicalConnectionFeatures(request: ListPhysicalConnectionFeaturesRequest)`

Querying the connection features supported by a Express Connect circuit..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `physicalConnectionId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-bp1qrb3044eqixog****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |


## listTagResourcesForExpressConnect

**Signature:** `listTagResourcesForExpressConnect(request: ListTagResourcesForExpressConnectRequest)`

## [](#) *   If you want to query a specific object, you must specify **ResourceId.N** or **Tag.N** that consists of **Tag.N.Key** and **Tag.N.Value** in the request. *   **Tag.N** is a resource tag t.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag to add to the resource. You can specify up to 20 tag keys. The tag key cannot be  Example: `FinanceDept` |
| `value` | string | No | The value of the tag to add to the resource. You can specify up to 20 tag values The tag value can b Example: `FinanceJoshua` |
| `maxResults` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The ID of the region to which the resource resides. Example: `cn-hangzhou` |
| `resourceId` | string[] | No | - |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `PHYSICALCONNECTION` |
| `tag` | ListTagResourcesForExpressConnectRequestTag[] | No | - |


## listVirtualPhysicalConnections

**Signature:** `listVirtualPhysicalConnections(request: ListVirtualPhysicalConnectionsRequest)`

Queries hosted connections..

**Parameters:** (1 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify at most 20 tag keys. The tag key cannot be  Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `isConfirmed` | boolean | No | Specifies whether the hosted connection is accepted by the tenant. Valid values: Example: `true` |
| `maxResults` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `dd20****` |
| `physicalConnectionId` | string | No | The ID of the Express Connect circuit over which the hosted connections are created. Example: `pc-bp1ciz7ekd2grn1as****` |
| `regionId` | string | Yes | The region ID of the hosted connection. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The ID of the resource group to which the hosted connection belongs. Example: `rg-acfmxazb4p****` |
| `tags` | ListVirtualPhysicalConnectionsRequestTags[] | No | - |
| `virtualPhysicalConnectionAliUids` | string[] | No | The information about the Alibaba Cloud account that owns the hosted connection. Example: `189xxx` |
| `virtualPhysicalConnectionBusinessStatus` | string | No | The business status of the hosted connection. Valid values: Example: `Normal` |
| `virtualPhysicalConnectionIds` | string[] | No | The information about the hosted connection. Example: `pc-xxx` |
| `virtualPhysicalConnectionStatuses` | string[] | No | The business status of the hosted connection. Example: `pc-xxx` |
| `vlanIds` | string[] | No | The VLAN ID of the hosted connection. Example: `pc-xxx` |


## modifyExpressConnectTrafficQos

**Signature:** `modifyExpressConnectTrafficQos(request: ModifyExpressConnectTrafficQosRequest)`

Modifies a quality of service (QoS) policy or associates a QoS policy with a dedicated Express Connect circuit..

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The ID of the instance to be associated. Example: `pc-bp159zj8zujwy3p07****` |
| `instanceType` | string | No | The type of instance to be associated. Set the value to **PHYSICALCONNECTION**. Example: `PHYSICALCONNECTION` |
| `instanceId` | string | No | The ID of the associated instance. Example: `pc-bp1j37am632492qzw****` |
| `instanceType` | string | No | The type of the associated instance. Set the value to **PHYSICALCONNECTION**. Example: `PHYSICALCONNECTION` |
| `addInstanceList` | ModifyExpressConnectTrafficQosRequestAddInstanceList[] | No | The instances to be added. Ignore this parameter if no instances are to be added. |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `qosDescription` | string | No | The description of the QoS policy. Example: `qos-test` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `qosName` | string | No | The name of the QoS policy. Example: `qos-test` |
| `regionId` | string | Yes | The region ID of the resource. Example: `cn-shanghai` |
| `removeInstanceList` | ModifyExpressConnectTrafficQosRequestRemoveInstanceList[] | No | - |


## modifyExpressConnectTrafficQosQueue

**Signature:** `modifyExpressConnectTrafficQosQueue(request: ModifyExpressConnectTrafficQosQueueRequest)`

Modifies a quality of service (QoS) queue..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPercent` | string | No | The percentage of bandwidth allocated to the QoS queue. Example: `100` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueDescription` | string | No | The description of the QoS queue. Example: `qos-queue-test` |
| `queueId` | string | Yes | The ID of the QoS queue. Example: `qos-queue-9nyx2u7n71s2rcy4n5` |
| `queueName` | string | No | The name of the QoS queue. Example: `qos-queue-test` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |


## modifyExpressConnectTrafficQosRule

**Signature:** `modifyExpressConnectTrafficQosRule(request: ModifyExpressConnectTrafficQosRuleRequest)`

Modifies a quality of service (QoS) rule..

**Parameters:** (4 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dstCidr` | string | No | The destination IPv4 CIDR block that matches the QoS rule traffic. Example: `1.1.1.0/24` |
| `dstIPv6Cidr` | string | No | The destination IPv6 CIDR block that matches the QoS rule traffic. Example: `2001:0db8:1234:5678::/64` |
| `dstPortRange` | string | No | The range of destination ports that match the QoS rule traffic. Valid values: **0** to **65535**. If Example: `-1/-1` |
| `matchDscp` | number | No | The DSCP value that matches the QoS rule traffic. Valid values: **0** to **63**. If no value is matc Example: `1` |
| `priority` | number | No | The priority of the QoS rule. Valid values: **1** to **9000**. A larger value indicates a higher pri Example: `1` |
| `protocol` | string | No | The protocol of the QoS rule. Valid values: Example: `ALL` |
| `qosId` | string | Yes | The ID of the QoS policy. Example: `qos-2giu0a6vd5x0mv4700` |
| `queueId` | string | Yes | The ID of the QoS queue. Example: `qos-queue-9nyx2u7n71s2rcy4n5` |
| `regionId` | string | Yes | The region ID of the QoS policy. Example: `cn-shanghai` |
| `remarkingDscp` | number | No | The new DSCP value. Valid values: **0** to **63**. If you do not change the value, set the value to  Example: `1` |
| `ruleDescription` | string | No | The description of the QoS rule. Example: `qos-rule-test` |
| `ruleId` | string | Yes | The ID of the QoS rule. Example: `qos-rule-iugg0l9x27f2nocouj` |
| `ruleName` | string | No | The name of the QoS rule. Example: `qos-rule-test` |
| `srcCidr` | string | No | The source IPv4 CIDR block that matches the QoS rule traffic. Example: `1.1.1.0/24` |
| `srcIPv6Cidr` | string | No | The source IPv6 CIDR block that matches the QoS rule traffic. Example: `2001:0db8:1234:5678::/64` |
| `srcPortRange` | string | No | The range of source ports that match the QoS rule traffic. Valid values: **0** to **65535**. If the  Example: `-1/-1` |


## recoverPhysicalConnection

**Signature:** `recoverPhysicalConnection(request: RecoverPhysicalConnectionRequest)`

# [](#)Description You can call this API operation to resume a suspended Express Connect circuit. You can resume only shared Express Connect circuits by calling this API operation..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the Express Connect circuit. Example: `pc-bp1mrgfbtmc9brre7****` |
| `regionId` | string | Yes | The region ID of the Express Connect circuit. Example: `cn-hangzhou` |
| `token` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |


## retryVpcPrefixListAssociation

**Signature:** `retryVpcPrefixListAssociation(request: RetryVpcPrefixListAssociationRequest)`

If you modify the information about a prefix list but the modification is not automatically applied to the route table that is associated with the prefix list, you can call this operation to apply the.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to only precheck the request. Valid values: Example: `false` |
| `prefixListId` | string | Yes | The ID of the prefix list that you want to re-apply. Example: `pl-0b7hwu67****` |
| `regionId` | string | Yes | The region ID of the prefix list that you want to re-apply. Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The ID of the associated resource. Example: `vtb-bp1drpcfz9srr393h****` |
| `resourceType` | string | Yes | The type of the resource with which the prefix list is associated. Valid values: Example: `vpcRouteTable` |


## revokeInstanceFromVbr

**Signature:** `revokeInstanceFromVbr(request: RevokeInstanceFromVbrRequest)`

Revokes the permissions granted to a virtual border router (VBR) on a virtual private cloud (VPC)..

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grantType` | string | Yes | The VBRs for which you want to revoke permissions on the VPC. Valid values: Example: `ALL` |
| `instanceId` | string | Yes | The VPC ID. Example: `vpc-bp1brjuegjc88v3u9****` |
| `regionId` | string | Yes | The ID of the region where the VPC is deployed. Example: `cn-hangzhou` |
| `vbrInstanceIds` | string[] | No | - |
| `vbrOwnerUid` | string | Yes | The ID of the Alibaba Cloud account to which the VBR belongs. Example: `1210123456123456` |
| `vbrRegionNo` | string | Yes | The ID of the region where the VBR is deployed. Example: `cn-hangzhou` |


## secondApplyPhysicalConnectionLOA

**Signature:** `secondApplyPhysicalConnectionLOA(request: SecondApplyPhysicalConnectionLOARequest)`

If your application for a Letter of Authorization (LOA) by calling the ApplyPhysicalConnectionLOA operation is denied, you can call this operation to apply again..


## tagResourcesForExpressConnect

**Signature:** `tagResourcesForExpressConnect(request: TagResourcesForExpressConnectRequest)`

## [](#) Tags are used to classify instances. Each tag consists of a key-value pair. Before you use tags, take note of the following items: *   Each tag key that is added to an instance must be unique.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag to add to the resource. You can specify up to 20 tag keys. The tag key cannot be  Example: `FinanceDept` |
| `value` | string | No | The value of the tag to add to the resource. You can specify up to 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `regionId` | string | Yes | The ID of the region in which the resource is deployed. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The resource IDs. You can specify up to 20 resource IDs. |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `PHYSICALCONNECTION` |
| `tag` | TagResourcesForExpressConnectRequestTag[] | Yes | The tags to add to the resource. |


## untagResourcesForExpressConnect

**Signature:** `untagResourcesForExpressConnect(request: UntagResourcesForExpressConnectRequest)`

Removes tags from an Express Connect circuit at a time..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `all` | boolean | No | Specifies whether to remove all tags from the specified resource. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region in which the resource is deployed. Example: `cn-hangzhou` |
| `resourceId` | string[] | Yes | The IDs of the resources from which you want to remove tags. |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `PHYSICALCONNECTION` |
| `tagKey` | string[] | No | - |


## updateVirtualBorderBandwidth

**Signature:** `updateVirtualBorderBandwidth(request: UpdateVirtualBorderBandwidthRequest)`

Updates the maximum bandwidth value of outbound data transfer for a virtual border router (VBR)..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | number | Yes | The new maximum bandwidth value for the VBR. Unit: Mbit/s. Example: `2` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016****` |
| `regionId` | string | Yes | The region ID of the VBR. Example: `cn-shanghai` |
| `virtualBorderRouterId` | string | Yes | The ID of the VBR. Example: `vbr-bp15zckdt37pq72****` |


## updateVirtualPhysicalConnection

**Signature:** `updateVirtualPhysicalConnection(request: UpdateVirtualPhysicalConnectionRequest)`

Changes the virtual local area network (VLAN) ID of a hosted connection over Express Connect circuit..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Va Example: `false` |
| `expectSpec` | string | No | The estimated bandwidth value of the hosted connection. The estimated bandwidth value takes effect o Example: `50M` |
| `instanceId` | string | Yes | The ID of the hosted connection over Express Connect circuit. Example: `pc-bp1mrgfbtmc9brre7****` |
| `regionId` | string | Yes | The region ID of the hosted connection. Example: `cn-hangzhou` |
| `token` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `vlanId` | number | Yes | The VLAN ID of the hosted connection over Express Connect circuit. Valid values: **0** to **2999**. Example: `1` |

