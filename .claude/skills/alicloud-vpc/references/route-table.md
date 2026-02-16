# Route Table & Route Entry

Route table CRUD, route entries, route associations, and gateway routes.

## createRouteTable

**Signature:** `createRouteTable(request: CreateRouteTableRequest)`

**CreateRouteTable** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the operation in the background. You can call the [DescribeRouteTableList](https://.

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify up to 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `associateType` | string | No | The type of the route table. Valid values: Example: `VSwitch` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04` |
| `description` | string | No | The description of the route table. Example: `abc` |
| `regionId` | string | Yes | The region ID of the virtual private cloud (VPC) to which the custom route table belongs. Example: `cn-zhangjiakou` |
| `routeTableName` | string | No | The name of the route table. Example: `myRouteTable` |
| `tag` | CreateRouteTableRequestTag[] | No | - |
| `vpcId` | string | Yes | The ID of the VPC to which the custom route table belongs. Example: `vpc-bp1qpo0kug3a20qqe****` |

## deleteRouteTable

**Signature:** `deleteRouteTable(request: DeleteRouteTableRequest)`

## [](#)Description *   **DeleteRouteTable** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeRoute.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the virtual private cloud (VPC) to which the custom route table belongs. Example: `cn-hangzhou` |
| `routeTableId` | string | Yes | The ID of the custom route table. Example: `vtb-bp145q7glnuzdvzu2****` |

## describeRouteTables

**Signature:** `describeRouteTables(request: DescribeRouteTablesRequest)`

describeRouteTables operation.

**Parameters:** (0 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `pageNumber` | number | No | The page number. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | No | The region ID of the VPC to which the route table belongs. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the route table to be queried belongs. Example: `rg-acfmxazccb4ph****` |
| `routeTableId` | string | No | The ID of the route table that you want to query. Example: `rtb-bp12mw1f8k3jgygk9****` |
| `routeTableName` | string | No | The name of the route table that you want to query. Example: `RouteTable-1` |
| `routerId` | string | No | The ID of the router to which the route table belongs. Example: `vtb-bp1krxxzp0c29fmon****` |
| `routerType` | string | No | The type of the router to which the route table belongs. Valid values: Example: `VRouter` |
| `type` | string | No | The route type. Valid values: Example: `custom` |
| `VRouterId` | string | No | The ID of the vRouter. Example: `vtb-bp1krxxzp0c29fmon****` |

## modifyRouteTableAttributes

**Signature:** `modifyRouteTableAttributes(request: ModifyRouteTableAttributesRequest)`

You cannot repeatedly call the **ModifyRouteTableAttributes** operation to modify the name and description of a route table within the specified period of time..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the route table. Example: `test` |
| `regionId` | string | Yes | The region ID of the virtual private cloud (VPC) to which the custom route table belongs. Example: `cn-hangzhou` |
| `routePropagationEnable` | boolean | No | Indicates whether to enable route propagation to receive dynamic routes. Valid values: Example: `true` |
| `routeTableId` | string | Yes | The ID of the route table. Example: `vtb-bp145q7glnuzdvzu2****` |
| `routeTableName` | string | No | The name of the route table. Example: `doctest` |

## associateRouteTable

**Signature:** `associateRouteTable(request: AssociateRouteTableRequest)`

*AssociateRouteTable** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVSwitchAttributes](https://.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The region ID of the VPC to which the route table belongs. Example: `cn-hangzhou` |
| `routeTableId` | string | Yes | The ID of the route table. Example: `vtb-bp145q7glnuzdvzu2****` |
| `vSwitchId` | string | Yes | The ID of the vSwitch. Example: `vsw-25ncdvfaue4****` |

## unassociateRouteTable

**Signature:** `unassociateRouteTable(request: UnassociateRouteTableRequest)`

## [](#)References *   **UnassociateRouteTable** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeV.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The region ID of the virtual private cloud (VPC) to which the custom route table belongs. Example: `cn-hangzhou` |
| `routeTableId` | string | Yes | The ID of the route table. Example: `vtb-bp145q7glnuzdvzu2****` |
| `vSwitchId` | string | Yes | The ID of the vSwitch from which you want to disassociate the route table. Example: `vsw-25naue4****` |

## associateRouteTableWithGateway

**Signature:** `associateRouteTableWithGateway(request: AssociateRouteTableWithGatewayRequest)`

Associates a gateway route table with an IPv4 gateway in the same virtual private cloud (VPC)..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `gatewayId` | string | Yes | The ID of the IPv4 gateway. Example: `ipv4gw-5tsnc6s4ogsedtp3k****` |
| `gatewayType` | string | No | The type of a gateway to be associated with a route table. Example: `Ipv4Gateway` |
| `regionId` | string | Yes | The region ID of the IPv4 gateway with which you want to associate the gateway route table. Example: `ap-southeast-6` |
| `routeTableId` | string | Yes | The ID of the gateway route table. Example: `vtb-5ts0ohchwkp3dydt2****` |

## dissociateRouteTableFromGateway

**Signature:** `dissociateRouteTableFromGateway(request: DissociateRouteTableFromGatewayRequest)`

Disassociates a gateway route table from an IPv4 gateway..

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to only precheck the request. Valid values: Example: `false` |
| `gatewayId` | string | Yes | The ID of the IPv4 gateway. Example: `ipv4gw-5tsnc6s4ogsedtp3k****` |
| `gatewayType` | string | No | The type of a gateway to be disassociated from a route table. Example: `Ipv4Gateway` |
| `regionId` | string | Yes | The region ID of the IPv4 gateway from which you want to disassociate the gateway route table. Example: `ap-southeast-6` |
| `routeTableId` | string | Yes | The ID of the gateway route table. Example: `vtb-5ts0ohchwkp3dydt2****` |

## associateRouteTablesWithVpcGatewayEndpoint

**Signature:** `associateRouteTablesWithVpcGatewayEndpoint(request: AssociateRouteTablesWithVpcGatewayEndpointRequest)`

When you call this operation, take note of the following limits: *   The gateway endpoint to be associated with the route table cannot be in one of the following states: **Creating**, **Modifying**, *.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `endpointId` | string | Yes | The ID of the gateway endpoint to be associated with the route table. Example: `vpce-m5e371h5clm3uadih****` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |
| `routeTableIds` | string[] | Yes | The ID of the route table. Valid values of **N** are **1** to **20**, which specifies that you can a Example: `vtb-m5elgtm3aj586iitr****` |

## createRouteEntry

**Signature:** `createRouteEntry(request: CreateRouteEntryRequest)`

**CreateRouteEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeRouteEntryList](https://help..

**Parameters:** (2 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nextHopId` | string | No | The ID of the next hop of the ECMP route. Example: `ri-2zeo3xzyf3cd8r4****` |
| `nextHopType` | string | No | The type of next hop of the ECMP route entry. Set the value to **RouterInterface**. Example: `RouterInterface` |
| `weight` | number | No | The weight of the next hop of the ECMP route entry. Example: `10` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001****` |
| `description` | string | No | The description of the custom route entry. Example: `test` |
| `destinationCidrBlock` | string | Yes | The destination CIDR block of the custom route entry. Both IPv4 and IPv6 CIDR blocks are supported.  Example: `192.168.0.0/24` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `nextHopId` | string | No | The ID of the next hop for the custom route. Example: `i-j6c2fp57q8rr4jlu****` |
| `nextHopList` | CreateRouteEntryRequestNextHopList[] | No | - |
| `nextHopType` | string | No | The type of next hop of the custom route entry. Valid values: Example: `RouterInterface` |
| `regionId` | string | No | The region ID of the route table. Example: `cn-hangzhou` |
| `routeEntryName` | string | No | The name of the custom route entry that you want to add. Example: `test` |
| `routeTableId` | string | Yes | The ID of the route table to which you want to add a custom route entry. Example: `vtb-bp145q7glnuzd****` |

## createRouteEntries

**Signature:** `createRouteEntries(request: CreateRouteEntriesRequest)`

## [](#)References *   **CreateRouteEntries** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeRout.

**Parameters:** (6 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the custom route. You can specify at most 50 descriptions. Example: `test` |
| `dstCidrBlock` | string | Yes | The destination CIDR block of the custom route. IPv4 CIDR blocks, IPv6 CIDR blocks, and prefix lists Example: `192.168.0.0/24` |
| `ipVersion` | number | No | The IP version. Valid values: You can specify at most 50 IP versions. Valid values: Example: `IPv4` |
| `name` | string | No | The name of the custom route that you want to add. You can specify at most 50 names. Example: `test` |
| `nextHop` | string | Yes | The ID of the next hop for the custom route. You can specify at most 50 instance IDs. Example: `i-j6c2fp57q8rr4jlu****` |
| `nextHopType` | string | Yes | The type of next hop. You can specify at most 50 next hop types. Valid values: Example: `RouterInterface` |
| `routeTableId` | string | Yes | The ID of the route table to which you want to add custom route s. You can specify at most 50 route  Example: `vtb-bp145q7glnuzd****` |
| `dryRun` | boolean | No | Specifies whether to only precheck the request. Valid values: Example: `true` |
| `regionId` | string | Yes | The region ID of the route table. Example: `cn-hangzhou` |
| `routeEntries` | CreateRouteEntriesRequestRouteEntries[] | Yes | The routes. |

## deleteRouteEntry

**Signature:** `deleteRouteEntry(request: DeleteRouteEntryRequest)`

When you call this operation, take note of the following items: *   You can delete only routes that are in the **Available** state. *   You cannot delete a route entry of a virtual private cloud (VPC).

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nextHopId` | string | No | The ID of the next hop that is configured for ECMP routing. You can specify information about at mos Example: `ri-2zeo3xzyf38r43cd****` |
| `nextHopType` | string | No | The type of the next hop that is configured for ECMP routing. Set the value to **RouterInterface**.  Example: `RouterInterface` |
| `destinationCidrBlock` | string | No | The destination CIDR block of the route. Only IPv4 CIDR blocks, IPv6 CIDR blocks, and prefix lists a Example: `47.100.XX.XX/16` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: |
| `nextHopId` | string | No | The ID of the next hop. Example: `ri-2zeo3xzyf38r4urzd****` |
| `nextHopList` | DeleteRouteEntryRequestNextHopList[] | No | - |
| `regionId` | string | No | The region ID of the route table. Example: `cn-hangzhou` |
| `routeEntryId` | string | No | The ID of the route that you want to delete. Example: `rte-bp1mnnr2al0naomnpv****` |
| `routeTableId` | string | No | The ID of the route table to which the route belongs. Example: `vtb-2ze3jgygk9bmsj23s****` |

## deleteRouteEntries

**Signature:** `deleteRouteEntries(request: DeleteRouteEntriesRequest)`

When you call this operation, take note of the following items: *   You can delete only routes that are in the **Available** state. *   You cannot delete a route of a virtual private cloud (VPC) in wh.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dstCidrBlock` | string | No | The destination CIDR block of the route that you want to delete. IPv4 and IPv6 CIDR blocks are suppo Example: `47.100.XX.XX/24` |
| `nextHop` | string | No | The ID of the next hop that you want to delete. You can specify up to 50 next hop IDs. Example: `i-j6c2fp57q8rr4jlu****` |
| `routeEntryId` | string | No | The ID of the route that you want to delete. You can specify up to 50 route IDs. Example: `rte-bp1mnnr2al0naomnpv****` |
| `routeTableId` | string | Yes | The ID of the route table to which the routes to be deleted belongs. You can specify up to 50 route  Example: `vtb-2ze3jgygk9bmsj23s****` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the route table. Example: `cn-hangzhou` |
| `routeEntries` | DeleteRouteEntriesRequestRouteEntries[] | No | - |

## describeRouteEntryList

**Signature:** `describeRouteEntryList(request: DescribeRouteEntryListRequest)`

Before you call the [DeleteRouteEntry](https://help.aliyun.com/document_detail/36013.html) operation to delete a route, you can call this operation to query the next hop of the route that you want to .

**Parameters:** (2 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destCidrBlockList` | string[] | No | - |
| `destinationCidrBlock` | string | No | The destination CIDR block of the route. IPv4 and IPv6 CIDR blocks are supported. Example: `192.168.2.0/24` |
| `ipVersion` | string | No | The IP version. Valid values: Example: `IPv4` |
| `maxResult` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **10**. Example: `10` |
| `nextHopId` | string | No | The ID of the next hop. Example: `vpn-bp10zyaph5cc8b7c7****` |
| `nextHopType` | string | No | The next hop type. Valid values: Example: `Instance` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the route table. Example: `cn-hangzhou` |
| `routeEntryId` | string | No | The ID of the route that you want to query. Example: `rte-bp1mnnr2al0naomnp****` |
| `routeEntryName` | string | No | The name of the route entry. Example: `abc` |
| `routeEntryType` | string | No | The route type. Valid values: Example: `System` |
| `routeTableId` | string | Yes | The ID of the route table that you want to query. Example: `vtb-bp1r9pvl4xen8s9ju****` |
| `serviceType` | string | No | Specifies whether to host the route. If the parameter is empty, the route is not hosted. Example: `TR` |

## modifyRouteEntry

**Signature:** `modifyRouteEntry(request: ModifyRouteEntryRequest)`

You cannot repeatedly call the **ModifyRouteEntry** operation to modify the name and description of a custom route within the specified period of time..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the route entry. Example: `EntryDescription` |
| `destinationCidrBlock` | string | No | The destination CIDR block of the route entry. Only IPv4 CIDR blocks, IPv6 CIDR blocks, and prefix l Example: `192.168.0.0/24` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `newNextHopId` | string | No | The ID of the new next hop instance. Example: `eni-bp17y37ytsenqyim****` |
| `newNextHopType` | string | No | The new next hop type of the route. Example: `NetworkInterface` |
| `regionId` | string | Yes | The ID of the region to which the route belongs. Example: `cn-hangzhou` |
| `routeEntryId` | string | No | The ID of the custom route entry. Example: `rte-acfvgfsghfdd****` |
| `routeEntryName` | string | No | The name of the route entry. Example: `EntryName` |
| `routeTableId` | string | No | The ID of the route table to which the route entry belongs. Example: `vtb-bp1nk7zk65du3pni8z9td` |

## describeRouteTableList

**Signature:** `describeRouteTableList(request: DescribeRouteTableListRequest)`

Queries route tables..

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The value of tag N to add to the resource. You can specify up to 20 tag values. The tag value can be Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify up to 20 tag values. The tag value can be Example: `FinanceJoshua` |
| `pageNumber` | number | No | The number of the returned page. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the VPC to which the route table belongs. Example: `ap-southeast-6` |
| `resourceGroupId` | string | No | The ID of the resource group to which the route table belongs. Example: `rg-acfmxazb4ph****` |
| `routeTableId` | string | No | The ID of the route table. Example: `vtb-bp145q7glnuzdvzu2****` |
| `routeTableName` | string | No | The name of the route table. Example: `doctest` |
| `routeTableType` | string | No | The type of the route table. Example: `System` |
| `routerId` | string | No | The ID of vRouter to which the route table belongs. Example: `vrt-bp1lhl0taikrteen8****` |
| `routerType` | string | No | The type of the router to which the route table belongs. Valid value: Example: `VRouter` |
| `tag` | DescribeRouteTableListRequestTag[] | No | - |
| `vpcId` | string | No | The ID of the VPC to which the route table belongs. Example: `vpc-bp15zckdt37pq72****` |

## listGatewayRouteTableEntries

**Signature:** `listGatewayRouteTableEntries(request: ListGatewayRouteTableEntriesRequest)`

Queries route entries of a gateway route table..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destinationCidrBlock` | string | No | The destination CIDR block of the route entry in the gateway route table. Example: `192.168.0.5` |
| `gatewayRouteTableId` | string | Yes | The ID of the gateway route table that you want to query. Example: `vtb-5ts0ohchwkp3dydt2****` |
| `maxResults` | number | No | The number of entries to return on each page. Valid values: **1** to **100**. Default value: **10**. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the gateway route table. Example: `ap-southeast-6` |

## createRouteTargetGroup

**Signature:** `createRouteTargetGroup(request: CreateRouteTargetGroupRequest)`

- The **CreateRouteTargetGroup** interface is an asynchronous interface, meaning the system will return an instance ID, but the route target group instance has not yet been fully created, and the syst.

**Parameters:** (7 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memberId` | string | Yes | The instance ID of the route target group member. Example: `ep-xxxx` |
| `memberType` | string | Yes | The type of the route target group member. Example: `GatewayLoadBalancerEndpoint` |
| `weight` | number | Yes | The weight value of the route target group member. Values: Example: `100` |
| `key` | string | No | The tag key of the resource. Up to 20 tag keys are supported. If you need to pass this value, you ca Example: `FinanceDept` |
| `value` | string | No | The tag value of the resource. Up to 20 tag values are supported. If you need to pass this value, yo Example: `FinanceJoshua` |
| `clientToken` | string | No | Client token used to ensure the idempotence of the request. Generate a parameter value from your cli Example: `0c593ea1-3bea-11e9-b96b-88e9fe6****` |
| `configMode` | string | Yes | The configuration mode of the route target group. Supported modes: Example: `Active-Standby` |
| `regionId` | string | Yes | The region ID to which the route target group belongs. You can obtain the region ID by calling the D Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmxazffggds****` |
| `routeTargetGroupDescription` | string | No | The description of the route target group. Example: `myRouteTargetGroupDescription` |
| `routeTargetGroupName` | string | No | The name of the route target group. Example: `myRouteTargetGroupName` |
| `routeTargetMemberList` | CreateRouteTargetGroupRequestRouteTargetMemberList[] | Yes | The member list of the route target group. |
| `tag` | CreateRouteTargetGroupRequestTag[] | No | - |
| `vpcId` | string | Yes | The ID of the VPC to which the route target group belongs. Example: `vpc-xxxx` |

## deleteRouteTargetGroup

**Signature:** `deleteRouteTargetGroup(request: DeleteRouteTargetGroupRequest)`

- The **DeleteRouteTargetGroup** interface is an asynchronous API, meaning the system will return a request ID, but the route target group has not yet been successfully deleted as the deletion task is.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | Tag key of the resource. Supports up to 20 tag keys. If you need to pass this value, you cannot inpu Example: `FinanceDept` |
| `value` | string | No | Tag value of the resource. Supports up to 20 tag values. If you need to pass this value, you can inp Example: `FinanceJoshua` |
| `clientToken` | string | No | Client token used to ensure idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3****` |
| `regionId` | string | Yes | The region ID of the resource group to be modified. Example: `cn-hangzhou` |
| `routeTargetGroupId` | string | Yes | The ID of the route target group instance. Example: `rtg-xxxx` |
| `tag` | DeleteRouteTargetGroupRequestTag[] | No | - |

## getRouteTargetGroup

**Signature:** `getRouteTargetGroup(request: GetRouteTargetGroupRequest)`

Get the information of the route target group instance..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | Resource tag key. Up to 20 tag keys are supported. If you need to pass this value, you cannot input  Example: `FinanceDept` |
| `value` | string | No | Resource tag value. Up to 20 tag values are supported. If you need to pass this value, you can input Example: `FinanceJoshua` |
| `clientToken` | string | No | Client token, used to ensure idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | ID of the region to which the route target group belongs. You can obtain the region ID by calling th Example: `cn-hangzhou` |
| `routeTargetGroupId` | string | Yes | ID of the route target group member instance. Example: `rtg-xxxx` |
| `tag` | GetRouteTargetGroupRequestTag[] | No | - |

## listRouteTargetGroups

**Signature:** `listRouteTargetGroups(request: ListRouteTargetGroupsRequest)`

Lists the route target groups..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | Resource tag key. Up to 20 tag keys are supported. If you need to pass this value, you cannot input  Example: `FinanceJoshua` |
| `value` | string | No | Resource tag value. Up to 20 tag values are supported. If you need to pass this value, you can input Example: `FinanceJoshua` |
| `clientToken` | string | No | Client token used to ensure idempotence of the request. Generate a unique parameter value from your  Example: `123e4567-e89b-12d3-a456-426655440000` |
| `maxResults` | number | No | Page size, with a range of **1** to **50**. Default value: **50**. Example: `50` |
| `memberId` | string | No | Route target group member instance ID. Filters the route target groups that contain the specified me Example: `ep-xxxx` |
| `nextToken` | string | No | Token for the next query. Value: If it is the first query or there is no next query, this field does Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the VPC to which the route target group belongs. You can obtain the region ID by ca Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | Resource group ID. For more information about resource groups, see What is a Resource Group? Example: `rg-acfmxazdjdhd****` |
| `routeTargetGroupIds` | string[] | No | List of route target group instance IDs. |
| `tag` | ListRouteTargetGroupsRequestTag[] | No | - |
| `vpcId` | string | No | The ID of the VPC to which the route target group belongs. Example: `vpc-xxxx` |

## updateRouteTargetGroup

**Signature:** `updateRouteTargetGroup(request: UpdateRouteTargetGroupRequest)`

- The **UpdateRouteTargetGroup** interface is an asynchronous API, meaning the system will return a request ID, but the route target group has not yet been fully updated, and the system\\"s background.

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memberId` | string | No | ID of the route target group member instance. Example: `ep-xxxx` |
| `memberType` | string | No | The member type of the route target group. Example: `GatewayLoadBalancerEndpoint` |
| `weight` | number | No | The weight value of the route target group member. Values: - 100: indicates the member is the primar Example: `100` |
| `clientToken` | string | No | Client Token, used to ensure the idempotence of requests. Generate a unique value for this parameter Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The ID of the region to which the route target group instance belongs. You can obtain the region ID  Example: `cn-hangzhou` |
| `routeTargetGroupDescription` | string | No | Description of the route target group. Example: `myRouteTargetGroupDescription` |
| `routeTargetGroupId` | string | Yes | The ID of the route target group instance. Example: `rtg-xxx` |
| `routeTargetGroupName` | string | No | The name of the route target group. Example: `myRouteTargetGroupName` |
| `routeTargetMemberList` | UpdateRouteTargetGroupRequestRouteTargetMemberList[] | No | - |

## switchActiveRouteTarget

**Signature:** `switchActiveRouteTarget(request: SwitchActiveRouteTargetRequest)`

Switch Active and Standby For RouteTargetGroup..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the resource tag. Up to 20 tag keys are supported. If you need to pass this value, you ca Example: `FinanceDept` |
| `value` | string | No | The value of the resource tag. Up to 20 tag values are supported. If you need to pass this value, yo Example: `FinanceJoshua` |
| `clientToken` | string | No | Client token, used to ensure the idempotence of the request. Generate a unique value for this parame Example: `0c593ea1-3bea-11e9-b96b-88e9fe6****` |
| `regionId` | string | Yes | The region ID where the RouteTargetGroup is located. Example: `cn-hangzhou` |
| `routeTargetGroupId` | string | Yes | The instance ID of the RouteTargetGroup. Example: `rtg-xxxx` |
| `tag` | SwitchActiveRouteTargetRequestTag[] | No | - |

## describeEcGrantRelation

**Signature:** `describeEcGrantRelation(request: DescribeEcGrantRelationRequest)`

Queries whether permissions on a virtual private cloud (VPC) are granted to a virtual border router (VBR)..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `vbr-bp12mw1f8k3jgygk9****` |
| `instanceType` | string | Yes | The type of instance. Valid values: Example: `VBR` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `vbrRegionNo` | string | No | The ID of the region where the instance is deployed. Example: `cn-hangzhou` |

## describeGrantRulesToCen

**Signature:** `describeGrantRulesToCen(request: DescribeGrantRulesToCenRequest)`

查询指定网络实例（VPC、VBR）的云企业网跨账号授权信息.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `instanceId` | string | Yes | The ID of the network instance that you want to query. Example: `vpc-bp18sth14qii3pnvc****` |
| `instanceType` | string | Yes | The type of the network instance. Valid values: Example: `VPC` |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the network instance that you want to query. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the network instance belongs. Example: `rg-acfmxazb4p****` |

## describeGrantRulesToEcr

**Signature:** `describeGrantRulesToEcr(request: DescribeGrantRulesToEcrRequest)`

Queries the cross-account authorization list of an Express Connect Router (ECR)..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag keys. You must specify at least one tag key and at most 20 tag keys. The tag key cannot be a Example: `FinanceDept` |
| `value` | string | No | The value of the tag. Example: `FinanceJoshua` |
| `instanceId` | string | Yes | The ID of the VBR. Example: `vbr-xxxxxx` |
| `pageNumber` | number | No | The number of the page to return. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `20` |
| `regionId` | string | Yes | The region ID Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazdjdhd****` |
| `tags` | DescribeGrantRulesToEcrRequestTags[] | No | - |

## revokeInstanceFromCen

**Signature:** `revokeInstanceFromCen(request: RevokeInstanceFromCenRequest)`

## [](#)Usage notes *   **RevokeInstanceFromCen** is a Virtual Private Cloud (VPC) operation. Therefore, you must use `vpc.aliyuncs.com` as the domain name when you call this operation. The API versio.

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cenId` | string | Yes | The ID of the CEN instance to which the network instance is attached. Example: `cen-7qthudw0ll6jmc****` |
| `cenOwnerId` | number | Yes | The user ID (UID) of the Apsara Stack tenant account to which the CEN instance belongs. Example: `123456789` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `instanceId` | string | Yes | The ID of the network instance. Example: `vpc-uf6o8d1dj8sjwxi6o****` |
| `instanceType` | string | Yes | The type of the network instance. Valid values: Example: `VPC` |
| `regionId` | string | Yes | The ID of the region where the network instance is deployed. Example: `cn-hangzhou` |


## getVpcRouteEntrySummary

**Signature:** `getVpcRouteEntrySummary(request: GetVpcRouteEntrySummaryRequest)`

查询路由类型的明细。.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the route table. Example: `cn-hangzhou` |
| `routeEntryType` | string | Yes | The type of the route. Valid values: Example: `Custom` |
| `routeTableId` | string | No | The ID of the route table that you want to query. Example: `vtb-bp145q7glnuzdvzu2****` |
| `vpcId` | string | Yes | The ID of the virtual private cloud (VPC) to which the route table belongs. Example: `vpc-bp15zckdt37pq72****` |


## listVpcPublishedRouteEntries

**Signature:** `listVpcPublishedRouteEntries(request: ListVpcPublishedRouteEntriesRequest)`

Queries advertised routes..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destinationCidrBlock` | string | No | The destination CIDR block of the route entry, supporting both IPv4 and IPv6 segments. Example: `47.100.XX.XX/16` |
| `maxResults` | number | No | The number of entries to display per batch query. Range: **1**~**500**, default value is **50**. Example: `50` |
| `nextToken` | string | No | Indicates whether there is a token for the next query. Values: - If **NextToken** is empty, it means Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | No | The ID of the region where the instance is located. Example: `cn-hangzhou` |
| `routeTableId` | string | Yes | The ID of the route table. Example: `vtb-bp145q7glnuzd****` |
| `targetInstanceId` | string | No | The ID of the route publishing target instance. Example: `ecr-dhw2xsds5****` |
| `targetType` | string | Yes | The type of the route publishing target. Example: `ECR` |


## publishVpcRouteEntries

**Signature:** `publishVpcRouteEntries(request: PublishVpcRouteEntriesRequest)`

Advertises VPC routes to an external component..

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destinationCidrBlock` | string | Yes | The destination CIDR block for the route entry. Example: `121.41.165.123/32` |
| `routeTableId` | string | Yes | The ID of the route table for the route entry. Example: `vtb-2ze3jgygk9bmsj23s****` |
| `dryRun` | boolean | No | Indicates whether to perform a dry run of this request. Values: Example: `false` |
| `regionId` | string | No | The ID of the region where the instance is located. You can obtain the region ID by calling the Desc Example: `cn-hangzhou` |
| `routeEntries` | PublishVpcRouteEntriesRequestRouteEntries[] | No | - |
| `targetInstanceId` | string | Yes | The ID of the target instance for route publication. Example: `ecr-dhw2xsds5****` |
| `targetType` | string | Yes | The type of the target for route publication. Example: `ECR` |


## withdrawVpcPublishedRouteEntries

**Signature:** `withdrawVpcPublishedRouteEntries(request: WithdrawVpcPublishedRouteEntriesRequest)`

Withdraw advertised Virtual Private Cloud (VPC) routes..

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destinationCidrBlock` | string | Yes | The destination CIDR block Example: `10.0.0.0/24` |
| `routeTableId` | string | Yes | The ID of the route table. Example: `vtb-bp145q7glnuzd****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | No | The ID of the region. Call the DescribeRegions operation to access it. Example: `cn-hangzhou` |
| `routeEntries` | WithdrawVpcPublishedRouteEntriesRequestRouteEntries[] | No | - |
| `targetInstanceId` | string | Yes | Target instance ID. Example: `ecr-dhw2xsds5****` |
| `targetType` | string | Yes | The type of target instance. Example: `ECR` |


## updateGatewayRouteTableEntryAttribute

**Signature:** `updateGatewayRouteTableEntryAttribute(request: UpdateGatewayRouteTableEntryAttributeRequest)`

Modifies the next hop type and next hop of the route entry in a gateway route table..

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the gateway route table. Example: `new` |
| `destinationCidrBlock` | string | Yes | The destination CIDR block of the route entry in the gateway route table. Example: `47.100.XX.XX/16` |
| `dryRun` | boolean | No | Specifies whether to precheck only this request. Valid values: Example: `false` |
| `gatewayRouteTableId` | string | No | The ID of the gateway route table that you want to modify. Example: `vtb-5ts0ohchwkp3dydt2****` |
| `IPv4GatewayRouteTableId` | string | No | The ID of the gateway route table that you want to modify. Example: `vtb-5ts0ohchwkp3dydt2****` |
| `name` | string | No | The name of the gateway route table. Example: `test` |
| `nextHopId` | string | No | The new next hop ID of the route entry. Example: `i-bp18xq9yguxoxe7m****` |
| `nextHopType` | string | Yes | The new next hop type of the route. Valid values: Example: `EcsInstance` |
| `regionId` | string | Yes | The ID of the region to which the gateway route table that you want to modify belongs. Example: `ap-southeast-6` |


## dissociateRouteTablesFromVpcGatewayEndpoint

**Signature:** `dissociateRouteTablesFromVpcGatewayEndpoint(request: DissociateRouteTablesFromVpcGatewayEndpointRequest)`

Disassociates a gateway endpoint from a route table..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `endpointId` | string | Yes | The ID of the gateway endpoint to be disassociated from the route table. Example: `vpce-m5e371h5clm3uadih****` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |
| `routeTableIds` | string[] | Yes | The ID of the route table. Valid values of **N** are **1** to **20**, which specifies that you can d Example: `vtb-m5elgtm3aj586iitr****` |

