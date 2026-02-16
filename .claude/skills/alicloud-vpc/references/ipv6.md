# IPv6 & HAVIP

IPv6 translation, HAVIP (High-Availability Virtual IP), and gateway endpoints.

## modifyIPv6TranslatorAttribute

**Signature:** `modifyIPv6TranslatorAttribute(request: ModifyIPv6TranslatorAttributeRequest)`

Modifies the name and description of an IPv6 Translation Service instance..

**Parameters:** See `ModifyIPv6TranslatorAttributeRequest` model.

## modifyIPv6TranslatorAclAttribute

**Signature:** `modifyIPv6TranslatorAclAttribute(request: ModifyIPv6TranslatorAclAttributeRequest)`

modifyIPv6TranslatorAclAttribute operation.

**Parameters:** See `ModifyIPv6TranslatorAclAttributeRequest` model.

## modifyIPv6TranslatorAclListEntry

**Signature:** `modifyIPv6TranslatorAclListEntry(request: ModifyIPv6TranslatorAclListEntryRequest)`

Modifies an IP entry in an access control list (ACL)..

**Parameters:** See `ModifyIPv6TranslatorAclListEntryRequest` model.

## modifyIPv6TranslatorBandwidth

**Signature:** `modifyIPv6TranslatorBandwidth(request: ModifyIPv6TranslatorBandwidthRequest)`

Modifies the maximum bandwidth of an IPv6 Translation Service instance..

**Parameters:** See `ModifyIPv6TranslatorBandwidthRequest` model.

## modifyIPv6TranslatorEntry

**Signature:** `modifyIPv6TranslatorEntry(request: ModifyIPv6TranslatorEntryRequest)`

modifyIPv6TranslatorEntry operation.

**Parameters:** See `ModifyIPv6TranslatorEntryRequest` model.

## addIPv6TranslatorAclListEntry

**Signature:** `addIPv6TranslatorAclListEntry(request: AddIPv6TranslatorAclListEntryRequest)`

addIPv6TranslatorAclListEntry operation.

**Parameters:** See `AddIPv6TranslatorAclListEntryRequest` model.

## describeIPv6TranslatorAclListAttributes

**Signature:** `describeIPv6TranslatorAclListAttributes(request: DescribeIPv6TranslatorAclListAttributesRequest)`

Queries the details of an access control list (ACL), including the specified IP addresses and associated IPv6 mapping entries..

**Parameters:** See `DescribeIPv6TranslatorAclListAttributesRequest` model.

## describeIPv6TranslatorAclLists

**Signature:** `describeIPv6TranslatorAclLists(request: DescribeIPv6TranslatorAclListsRequest)`

describeIPv6TranslatorAclLists operation.

**Parameters:** See `DescribeIPv6TranslatorAclListsRequest` model.

## describeIPv6Translators

**Signature:** `describeIPv6Translators(request: DescribeIPv6TranslatorsRequest)`

describeIPv6Translators operation.

**Parameters:** See `DescribeIPv6TranslatorsRequest` model.

## createHaVip

**Signature:** `createHaVip(request: CreateHaVipRequest)`

*CreateHaVip** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeHaVips](https://help.aliyun.com/doc.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify up to 20 tag values. The tag value can be Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `description` | string | No | The description of the HaVip. Example: `This` |
| `ipAddress` | string | No | The IP address of the HaVip. Example: `192.XX.XX.10` |
| `name` | string | No | The name of the HaVip. Example: `test` |
| `regionId` | string | Yes | The region ID of the HaVip. You can call the [DescribeRegions](https://help.aliyun.com/document_deta Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the HaVip belongs. Example: `rg-acfmxazb4ph6aiy****` |
| `tag` | CreateHaVipRequestTag[] | No | - |
| `vSwitchId` | string | Yes | The ID of the vSwitch to which the HaVip belongs. Example: `vsw-asdfjlnaue4g****` |

## deleteHaVip

**Signature:** `deleteHaVip(request: DeleteHaVipRequest)`

When you call this operation, take note of the following rules: *   The HaVip must be in the available state before it can be deleted. *   Make sure that no routes are destined for the HaVip. *   Make.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `haVipId` | string | Yes | The ID of the HaVip that you want to delete. Example: `havip-2zeo05qre24nhrqpy****` |
| `regionId` | string | Yes | The region where the HaVip resides. Call the [DescribeRegions](https://help.aliyun.com/document_deta Example: `cn-shanghai` |

## describeHaVips

**Signature:** `describeHaVips(request: DescribeHaVipsRequest)`

Queries HaVips in a region..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter keys. You can specify at most five filter keys. Valid values of **N**: **1 to 5**. The fo Example: `HaVipId` |
| `value` | string[] | No | The value of the filter key. Valid values of **N**: **1 to 5**. Example: `havip-bp19o63nequs01i8d****` |
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `filter` | DescribeHaVipsRequestFilter[] | No | - |
| `pageNumber` | number | No | The number of the returned page. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the HaVip. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the HaVip belongs. Example: `rg-bp67acfmxazb4ph****` |
| `tags` | DescribeHaVipsRequestTags[] | No | - |

## modifyHaVipAttribute

**Signature:** `modifyHaVipAttribute(request: ModifyHaVipAttributeRequest)`

You cannot repeatedly call the **ModifyHaVipAttribute** operation to modify the name and description of an HaVip within the specified periods of time..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e0****` |
| `description` | string | No | The description of the HaVip. Example: `This` |
| `haVipId` | string | Yes | The ID of the HaVip. Example: `havip-2zeo05qre24nhrqp****` |
| `name` | string | No | The name of the HaVip. Example: `test` |
| `regionId` | string | Yes | The ID of the region to which the HaVip belongs. Example: `cn-shanghai` |

## associateHaVip

**Signature:** `associateHaVip(request: AssociateHaVipRequest)`

When you call this operation, take note of the following limits: *   An HaVip immediately takes effect after it is associated. You do not need to restart the ECS instance. However, you must associate .

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `haVipId` | string | Yes | The ID of the HaVip. Example: `havip-2zeo05qre24nhrqpy****` |
| `instanceId` | string | Yes | The ID of the ECS instance to be associated with the HaVip. Example: `i-faf344422ffsfad****` |
| `instanceType` | string | No | The type of the instance to be associated with the HaVip. Valid values: Example: `EcsInstance` |
| `regionId` | string | Yes | The ID of the region to which the HaVip belongs. Example: `cn-shanghai` |

## unassociateHaVip

**Signature:** `unassociateHaVip(request: UnassociateHaVipRequest)`

## [](#) When you call this operation, take note of the following limits: *   The ECS instance must be in the **Running** or **Stopped** state. *   The HaVip must be in the **Available** or **InUse** .

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `force` | string | No | Specifies whether to forcefully disassociate the HAVIP from the ECS instance or ENI. Valid values: Example: `True` |
| `haVipId` | string | Yes | The ID of the HAVIP that you want to disassociate. Example: `havip-2zeo05qre24nhrqpy****` |
| `instanceId` | string | Yes | The ID of the ECS instance or ENI from which you want to disassociate the HAVIP. Example: `i-faf344422ffsfad****` |
| `instanceType` | string | No | The type of the instance from which you want to disassociate the HAVIP. Valid values: Example: `EcsInstance` |
| `regionId` | string | Yes | The region ID of the HAVIP. Example: `cn-shanghai` |

## createVpcGatewayEndpoint

**Signature:** `createVpcGatewayEndpoint(request: CreateVpcGatewayEndpointRequest)`

**CreateVpcGatewayEndpoint** is an asynchronous operation. After a request is sent, the system returns an **EndpointId** and runs the task in the background. You can call the [ListVpcGatewayEndpoints].

**Parameters:** (3 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify up to 20 tag values. The tag value can be Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `endpointDescription` | string | No | The description of the gateway endpoint. Example: `test` |
| `endpointName` | string | No | The name of the gateway endpoint. Example: `test` |
| `policyDocument` | string | No | The access policy for the cloud service. Example: `{` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the gateway endpoint belongs. Example: `rg-acfmxazb4ph****` |
| `serviceName` | string | Yes | The name of the endpoint service. Example: `com.aliyun.cn-hangzhou.oss` |
| `tag` | CreateVpcGatewayEndpointRequestTag[] | No | - |
| `vpcId` | string | Yes | The ID of the virtual private cloud (VPC) where you want to create the gateway endpoint. Example: `vpc-bp1gsk7h12ew7oegk****` |

## deleteVpcGatewayEndpoint

**Signature:** `deleteVpcGatewayEndpoint(request: DeleteVpcGatewayEndpointRequest)`

Deletes a gateway endpoint..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `endpointId` | string | Yes | The ID of the gateway endpoint. Example: `vpce-bp1w1dmdqjpwul0v3****` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |

## getVpcGatewayEndpointAttribute

**Signature:** `getVpcGatewayEndpointAttribute(request: GetVpcGatewayEndpointAttributeRequest)`

Queries the attributes of a gateway endpoint..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpointId` | string | Yes | The ID of the gateway endpoint. Example: `vpce-bp1w1dmdqjpwul0v3****` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |

## listVpcGatewayEndpoints

**Signature:** `listVpcGatewayEndpoints(request: ListVpcGatewayEndpointsRequest)`

Queries gateway endpoints..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N added to the resource. You can specify at most 20 tag keys. It cannot be an empty s Example: `FinanceDept` |
| `value` | string | No | The value of tag N added to the resource. You can specify at most 20 tag values. The tag value can b Example: `FinanceJoshua` |
| `endpointId` | string | No | The ID of the gateway endpoint. Example: `vpce-bp1i1212ss2whuwyw****` |
| `endpointName` | string | No | The name of the gateway endpoint. Example: `test` |
| `maxResults` | number | No | The number of entries to return per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the gateway endpoint belongs. Example: `rg-acfmxvfvazb4p****` |
| `serviceName` | string | No | The name of the endpoint service. Example: `com.aliyun.cn-hangzhou.oss` |
| `tags` | ListVpcGatewayEndpointsRequestTags[] | No | - |
| `vpcId` | string | No | The ID of the virtual private cloud (VPC) to which the gateway endpoint belongs. Example: `vpc-bp1gsk7h12ew7oegk****` |

## updateVpcGatewayEndpointAttribute

**Signature:** `updateVpcGatewayEndpointAttribute(request: UpdateVpcGatewayEndpointAttributeRequest)`

**UpdateVpcGatewayEndpointAttribute** is an asynchronous operation. After a request is sent, the system returns a **request ID** and runs the task in the background. You can call the [GetVpcGatewayEnd.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `endpointDescription` | string | No | The new description of the gateway endpoint. Example: `updateendpoint` |
| `endpointId` | string | Yes | The ID of the gateway endpoint that you want to modify. Example: `vpce-bp1w1dmdqjpwul0v3****` |
| `endpointName` | string | No | The new name of the gateway endpoint. Example: `update` |
| `policyDocument` | string | No | The access policy for the cloud service. Example: `{` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |


## allocateIpv6Address

**Signature:** `allocateIpv6Address(request: AllocateIpv6AddressRequest)`

Assigns an IPv6 address..


## allocateIpv6InternetBandwidth

**Signature:** `allocateIpv6InternetBandwidth(request: AllocateIpv6InternetBandwidthRequest)`

Before you call this operation, make sure that an ECS instance that supports IPv6 is created in a VPC that has an IPv6 CIDR block. For more information, see [Create a VPC with an IPv6 CIDR block](http.


## createIPv6Translator

**Signature:** `createIPv6Translator(request: CreateIPv6TranslatorRequest)`

createIPv6Translator operation.


## createIPv6TranslatorAclList

**Signature:** `createIPv6TranslatorAclList(request: CreateIPv6TranslatorAclListRequest)`

createIPv6TranslatorAclList operation.


## createIPv6TranslatorEntry

**Signature:** `createIPv6TranslatorEntry(request: CreateIPv6TranslatorEntryRequest)`

createIPv6TranslatorEntry operation.


## createIpv4Gateway

**Signature:** `createIpv4Gateway(request: CreateIpv4GatewayRequest)`

**CreateIpv4Gateway** is an asynchronous operation. After you send a request, the system returns a request ID and runs the task in the background. You can call the [GetIpv4GatewayAttribute](https://he.


## createIpv6EgressOnlyRule

**Signature:** `createIpv6EgressOnlyRule(request: CreateIpv6EgressOnlyRuleRequest)`

**CreateIpv6EgressOnlyRule** is an asynchronous operation. After a request is sent, the system returns a request ID and creates the rule in the background. You can call the [DescribeIpv6EgressOnlyRule.


## createIpv6Gateway

**Signature:** `createIpv6Gateway(request: CreateIpv6GatewayRequest)`

**CreateIpv6Gateway** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeIpv6GatewayAttribute](https:.


## deleteIPv6Translator

**Signature:** `deleteIPv6Translator(request: DeleteIPv6TranslatorRequest)`

Deletes an IPv6 Translation Service instance..


## deleteIPv6TranslatorAclList

**Signature:** `deleteIPv6TranslatorAclList(request: DeleteIPv6TranslatorAclListRequest)`

deleteIPv6TranslatorAclList operation.


## deleteIPv6TranslatorEntry

**Signature:** `deleteIPv6TranslatorEntry(request: DeleteIPv6TranslatorEntryRequest)`

deleteIPv6TranslatorEntry operation.


## deleteIpv4Gateway

**Signature:** `deleteIpv4Gateway(request: DeleteIpv4GatewayRequest)`

### [](#)Description *   Before you delete an IPv4 gateway, make sure that no route tables are associated with the IPv4 gateway. *   **DeleteIpv4Gateway** is an asynchronous operation. After a request.


## deleteIpv6EgressOnlyRule

**Signature:** `deleteIpv6EgressOnlyRule(request: DeleteIpv6EgressOnlyRuleRequest)`

**DeleteIpv6EgressOnlyRule** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeIpv6EgressOnlyRules](.


## deleteIpv6Gateway

**Signature:** `deleteIpv6Gateway(request: DeleteIpv6GatewayRequest)`

Before you delete an IPv6 gateway, you must delete the egress-only rules of the IPv6 gateway. For more information, see [DeleteIpv6EgressOnlyRule](https://help.aliyun.com/document_detail/102201.html)..


## deleteIpv6InternetBandwidth

**Signature:** `deleteIpv6InternetBandwidth(request: DeleteIpv6InternetBandwidthRequest)`

You cannot call the **DeleteIpv6InternetBandwidth** operation within the specified period of time..


## describeIPv6TranslatorEntries

**Signature:** `describeIPv6TranslatorEntries(request: DescribeIPv6TranslatorEntriesRequest)`

describeIPv6TranslatorEntries operation.


## describeIpv6Addresses

**Signature:** `describeIpv6Addresses(request: DescribeIpv6AddressesRequest)`

Queries IPv6 addresses in a region..


## describeIpv6EgressOnlyRules

**Signature:** `describeIpv6EgressOnlyRules(request: DescribeIpv6EgressOnlyRulesRequest)`

Queries egress-only rules..


## describeIpv6GatewayAttribute

**Signature:** `describeIpv6GatewayAttribute(request: DescribeIpv6GatewayAttributeRequest)`

Queries the information about an IPv6 gateway, including the region, virtual private cloud (VPC), status, and billing method..


## describeIpv6Gateways

**Signature:** `describeIpv6Gateways(request: DescribeIpv6GatewaysRequest)`

Queries IPv6 gateways in a region..


## enableVpcIpv4Gateway

**Signature:** `enableVpcIpv4Gateway(request: EnableVpcIpv4GatewayRequest)`

## [](#)Description *   **EnableVpcIpv4Gateway** is an asynchronous operation. After a request is sent, the system returns a **request ID** and runs the task in the background. You can call the [GetIp.


## modifyIpv6AddressAttribute

**Signature:** `modifyIpv6AddressAttribute(request: ModifyIpv6AddressAttributeRequest)`

Modifies the name and description of an IPv6 address..


## modifyIpv6GatewayAttribute

**Signature:** `modifyIpv6GatewayAttribute(request: ModifyIpv6GatewayAttributeRequest)`

Modifies the name and description of an IPv6 gateway..


## modifyIpv6InternetBandwidth

**Signature:** `modifyIpv6InternetBandwidth(request: ModifyIpv6InternetBandwidthRequest)`

You cannot repeatedly call the **ModifyIpv6InternetBandwidth** operation to modify the Internet bandwidth value of an IPv6 CIDR block within the specified period of time..


## releaseIpv6Address

**Signature:** `releaseIpv6Address(request: ReleaseIpv6AddressRequest)`

Releases an idle IPv6 address..


## removeIPv6TranslatorAclListEntry

**Signature:** `removeIPv6TranslatorAclListEntry(request: RemoveIPv6TranslatorAclListEntryRequest)`

Deletes an IP entry from an ACL..


## updateIpv4GatewayAttribute

**Signature:** `updateIpv4GatewayAttribute(request: UpdateIpv4GatewayAttributeRequest)`

You cannot repeatedly call the **UpdateIpv4GatewayAttribute** operation to modify the name or description of an IPv4 gateway within the specified period of time..

