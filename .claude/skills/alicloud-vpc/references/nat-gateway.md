# NAT Gateway

NAT gateway CRUD, SNAT/DNAT entries, NAT IP, and full NAT.

## createNatGateway

**Signature:** `createNatGateway(request: CreateNatGatewayRequest)`

## Usage notes Before you call this operation, take note of the following items: *   When you create an enhanced NAT gateway for the first time, the system automatically creates the service-linked rol.

**Parameters:** (2 required, 23 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modeValue` | string | No | Access mode. Valid values: Example: `route` |
| `tunnelType` | string | No | Tunnel mode type: Example: `geneve` |
| `key` | string | No | The tag key. The format of Tag.N.Key when you call the operation. Valid values of N: 1 to 20. The ta Example: `TestKey` |
| `value` | string | No | The tag value. The format of Tag.N.Value when you call the operation. Valid values of N: 1 to 20. Th Example: `TestValue` |
| `accessMode` | CreateNatGatewayRequestAccessMode | No | The access mode for reverse access to the VPC NAT gateway. Example: `MULTI_BINDED` |
| `autoPay` | boolean | No | Subscription Internet NAT gateways are no longer available for purchase. Ignore this parameter. Example: `Invalid` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `description` | string | No | The description of the NAT gateway. Example: `testnat` |
| `duration` | string | No | Subscription Internet NAT gateways are no longer available for purchase. Ignore this parameter. Example: `Invalid` |
| `eipBindMode` | string | No | The mode in which the EIP is associated with the NAT gateway. Valid values: Example: `MULTI_BINDED` |
| `icmpReplyEnabled` | boolean | No | Specifies whether to enable ICMP retrieval. Valid values: Example: `true` |
| `instanceChargeType` | string | No | The billing method of the NAT gateway. Example: `PostPaid` |
| `internetChargeType` | string | No | The metering method of the NAT gateway. Set the value to **PayByLcu**, which specifies the pay-by-CU Example: `PayByLcu` |
| `ipv4Prefix` | string | No | Create an IP prefix address segment for batch creation of NAT IPs. Please use the reserved and unall Example: `192.168.0.0/28` |
| `name` | string | No | The name of the NAT gateway. Example: `fortest` |
| `natIp` | string | No | The private IP address occupied by the NAT gateway. Please use an unassigned IP from the subnet wher Example: `192.168.0.x` |
| `natType` | string | No | The type of NAT gateway. Set the value to **Enhanced**, which specifies enhanced NAT gateway. Example: `Enhanced` |
| `networkType` | string | No | The network type of the NAT gateway. Valid values: Example: `internet` |
| `pricingCycle` | string | No | Subscription Internet NAT gateways are no longer available for purchase. Ignore this parameter. Example: `Invalid` |
| `privateLinkEnabled` | boolean | No | PrivateLink is not supported by default. If you set the value to true, PrivateLink is supported. Example: `false` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |
| `spec` | string | No | Subscription Internet NAT gateways are no longer available for purchase. Ignore this parameter. Example: `Invalid` |
| `tag` | CreateNatGatewayRequestTag[] | No | The tags. Example: `MULTI_BINDED` |
| `vSwitchId` | string | No | The ID of the vSwitch to which the NAT gateway is attached. Example: `vsw-bp1e3se98n9fq8hle****` |
| `vpcId` | string | Yes | The ID of the VPC where you want to create the NAT gateway. Example: `vpc-bp1di7uewzmtvfuq8****` |

## deleteNatGateway

**Signature:** `deleteNatGateway(request: DeleteNatGatewayRequest)`

## [](#)Description *   **DeleteNatGateway** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeNatGa.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `force` | boolean | No | Specifies whether to forcefully delete the NAT gateway. Valid values: Example: `false` |
| `natGatewayId` | string | Yes | The ID of the NAT gateway that you want to delete. Example: `ngw-bp1uewa15k4iy5770****` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |

## describeNatGateways

**Signature:** `describeNatGateways(request: DescribeNatGatewaysRequest)`

You can call this operation to query both Virtual Private Cloud (VPC) NAT gateways and Internet NAT gateways. NAT gateways in this topic refer to both VPC NAT gateways and Internet NAT gateways..

**Parameters:** (1 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag keys of the NAT gateway. You can specify up to 20 tag keys. Example: `KeyTest` |
| `value` | string | No | The tag values of the NAT gateway. You can specify up to 20 tag values. Example: `valueTest` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `instanceChargeType` | string | No | The billing method of the NAT gateway. Set the value to **PostPaid**, which specifies the pay-as-you Example: `PostPaid` |
| `name` | string | No | The name of the NAT gateway. Example: `test` |
| `natGatewayId` | string | No | The ID of the NAT gateway. Example: `ngw-bp1uewa15k4iy5770****` |
| `natType` | string | No | The type of NAT gateway. Set the value to **Enhanced** (enhanced NAT gateway). Example: `Enhanced` |
| `networkType` | string | No | The type of the NAT gateway. Valid values: Example: `internet` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `10` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `1` |
| `regionId` | string | Yes | The region ID of the NAT gateways that you want to query. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the NAT gateway belongs. Example: `rg-bp67acfmxazb4ph****` |
| `spec` | string | No | The size of the NAT gateway. Ignore this parameter. Example: `Invalid` |
| `status` | string | No | The status of the NAT gateway. Valid values: Example: `Available` |
| `tag` | DescribeNatGatewaysRequestTag[] | No | - |
| `vpcId` | string | No | The ID of the VPC to which the NAT gateway belongs. Example: `vpc-bp15zckdt37pq72z****` |
| `zoneId` | string | No | The ID of the zone to which the NAT gateway belongs. Example: `cn-hangzhou-b` |

## modifyNatGatewayAttribute

**Signature:** `modifyNatGatewayAttribute(request: ModifyNatGatewayAttributeRequest)`

## [](#)Description You can call this operation to query an Internet NAT gateway or a virtual private cloud (VPC) NAT gateway. The term NAT gateway in this topic refers to both NAT gateway types..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `logDeliveryType` | string | No | Session log write type. Value: **sls**, Alibaba Cloud Log Service SLS. Example: `sls` |
| `logDestination` | string | No | Session log write address. Value: acs:log:${regionName}:${projectOwnerAliUid}:project/${projectName} Example: `acs:log:cn-hangzhou:0000:project/nat_session_log_project/logstore/session_log_test` |
| `description` | string | No | The description of the NAT gateway. Example: `Description` |
| `eipBindMode` | string | No | Modifies the mode in which the EIP is associated with the NAT gateway. The value can be empty or **N Example: `NAT` |
| `enableSessionLog` | boolean | No | Whether to enable session logging, with values: - **true**: Session logging is enabled.  - **false** Example: `true` |
| `icmpReplyEnabled` | boolean | No | Specifies whether to enable the Internet Control Message Protocol (ICMP) non-retrieval feature. Vali Example: `false` |
| `logDelivery` | ModifyNatGatewayAttributeRequestLogDelivery | No | - |
| `name` | string | No | The name of the NAT gateway. Example: `nat123` |
| `natGatewayId` | string | Yes | The ID of the NAT gateway. Example: `ngw-2ze0dcn4mq31qx2jc****` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |

## modifyNatGatewaySpec

**Signature:** `modifyNatGatewaySpec(request: ModifyNatGatewaySpecRequest)`

- You cannot call this operation to downgrade a subscription Internet NAT gateway. You can downgrade a subscription Internet NAT gateway only in the console. - When you call this operation to upgrade .

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to automatically complete the payment. Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655****` |
| `natGatewayId` | string | Yes | The ID of the Internet NAT gateway that you want to upgrade. Example: `ngw-bp1uewa15k4iy5770****` |
| `regionId` | string | Yes | The ID of the region where the Internet NAT gateway is deployed. Example: `cn-hangzhou` |
| `spec` | string | Yes | The size of the Internet NAT gateway. Valid values: Example: `Middle` |

## getNatGatewayAttribute

**Signature:** `getNatGatewayAttribute(request: GetNatGatewayAttributeRequest)`

You can call this operation to query information about a specified Internet NAT gateway or Virtual Private Cloud (VPC) NAT gateway. In this topic, "NAT gateway" refers to both gateway types..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `natGatewayId` | string | Yes | The ID of the NAT gateway. Example: `ngw-bp1b0lic8uz4r6vf2****` |
| `regionId` | string | Yes | The ID of the region where the NAT gateway is deployed. Example: `cn-qingdao` |

## updateNatGatewayNatType

**Signature:** `updateNatGatewayNatType(request: UpdateNatGatewayNatTypeRequest)`

updateNatGatewayNatType operation.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dryRun` | boolean | No | Specifies whether to only precheck this request. Valid values: Example: `false` |
| `natGatewayId` | string | Yes | The ID of the standard NAT gateway to be upgraded. Example: `ngw-bp1b0lic8uz4r6vf2****` |
| `natType` | string | Yes | The type of Internet NAT gateway. Set the value to **Enhanced**, which specifies an enhanced Interne Example: `Enhanced` |
| `regionId` | string | Yes | The ID of the region where the NAT gateway that you want to upgrade is deployed. Example: `cn-qingdao` |
| `vSwitchId` | string | Yes | The vSwitch to which the enhanced Internet NAT gateway belongs. Example: `vsw-bp17nszybg8epodke****` |

## createSnatEntry

**Signature:** `createSnatEntry(request: CreateSnatEntryRequest)`

You can call this operation to add SNAT entries to Internet NAT gateways and Virtual Private Cloud (VPC) NAT gateways. In this topic, a **NAT** gateway refers to both gateway types. Before you call th.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44****` |
| `dryRun` | boolean | No | Indicates whether to only precheck this request. Values: - **true**: Sends a precheck request and do Example: `false` |
| `eipAffinity` | number | No | Specifies whether to enable EIP affinity. Valid values: Example: `1` |
| `networkInterfaceId` | string | No | Elastic Network Interface ID.   > The IPv4 address set of the elastic network interface will be used Example: `eni-gw8g131ef2dnbu3k****` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |
| `snatEntryName` | string | No | The name of the SNAT entry. Example: `SnatEntry-1` |
| `snatIp` | string | No | *   The EIPs in the SNAT entry when you add an SNAT entry to an Internet NAT gateway. Separate EIPs  Example: `47.98.XX.XX` |
| `snatTableId` | string | Yes | The ID of the SNAT table. Example: `stb-bp190wu8io1vgev****` |
| `sourceCIDR` | string | No | You can specify the CIDR block of a VPC, a vSwitch, or an ECS instance or enter a custom CIDR block. Example: `10.1.1.0/24` |
| `sourceVSwitchId` | string | No | The ID of the vSwitch. Example: `vsw-bp1nhx2s9ui5o****` |

## deleteSnatEntry

**Signature:** `deleteSnatEntry(request: DeleteSnatEntryRequest)`

DeleteSnatEntry is an asynchronous operation. After you make a request, the ID of the request is returned but the specified SNAT entry is not deleted. The system deletes the SNAT entry in the backgrou.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |
| `snatEntryId` | string | Yes | The ID of the SNAT entry that you want to delete. Example: `snat-bp1vcgcf8tm0plqcg****` |
| `snatTableId` | string | Yes | The ID of the SNAT table to which the SNAT entry belongs. Example: `stb-bp190wu8io1vgev80****` |

## describeSnatTableEntries

**Signature:** `describeSnatTableEntries(request: DescribeSnatTableEntriesRequest)`

Queries SNAT entries..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `natGatewayId` | string | No | The ID of the NAT gateway. Example: `ngw-bp1uewa15k4iy5770****` |
| `networkInterfaceIds` | string[] | No | - |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where you want to create the NAT gateway. Example: `cn-hangzhou` |
| `snatEntryId` | string | No | The ID of the SNAT entry. Example: `snat-8vbae8uqh7rjpk7d2****` |
| `snatEntryName` | string | No | The name of the SNAT entry. Example: `SnatEntry-1` |
| `snatIp` | string | No | *   When you query SNAT entries of Internet NAT gateways, this parameter specifies the EIP in an SNA Example: `116.22.XX.XX` |
| `snatTableId` | string | No | The ID of the SNAT table. Example: `stb-8vbczigrhop8x5u3t****` |
| `sourceCIDR` | string | No | The source CIDR block specified in the SNAT entry. Example: `116.22.XX.XX/24` |
| `sourceVSwitchId` | string | No | The ID of the vSwitch. Example: `vsw-3xbjkhjshjdf****` |

## modifySnatEntry

**Signature:** `modifySnatEntry(request: ModifySnatEntryRequest)`

## [](#) **ModifySnatEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeSnatTableEntries](htt.

**Parameters:** (3 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001****` |
| `dryRun` | boolean | No | Whether to perform a dry run of this request, with values: - **true**: Sends a check request without Example: `false` |
| `eipAffinity` | number | No | Whether to enable IP affinity. Values: - **0**: Disable IP affinity. - **1**: Enable IP affinity. >  Example: `1` |
| `networkInterfaceId` | string | No | Elastic Network Interface ID. The IPv4 address set of the elastic network interface will be used as  Example: `eni-gw8g131ef2dnbu3k****` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |
| `snatEntryId` | string | Yes | The ID of the SNAT entry that you want to modify. Example: `snat-bp1vcgcf8tm0plqcg****` |
| `snatEntryName` | string | No | The name of the SNAT entry. Example: `SnatEntry-1` |
| `snatIp` | string | No | *   The elastic IP addresses (EIPs) specified in the SNAT entry when you modify an SNAT entry of an  Example: `47.98.XX.XX` |
| `snatTableId` | string | Yes | The ID of the SNAT table to which the SNAT entry belongs. Example: `stb-8vbczigrhop8x5u3t****` |

## createForwardEntry

**Signature:** `createForwardEntry(request: CreateForwardEntryRequest)`

## [](#) Each DNAT entry consists of the following parameters: **ExternalIp**, **ExternalPort**, **IpProtocol**, **InternalIp**, and **InternalPort**. After you add a DNAT entry, the NAT gateway forwa.

**Parameters:** (7 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe6****` |
| `dryRun` | boolean | No | Indicates whether to perform a dry run of the request. Values: - **true**: Sends a check request wit Example: `false` |
| `externalIp` | string | Yes | *   The EIP that can be accessed over the Internet when you configure a DNAT entry for an Internet N Example: `116.28.XX.XX` |
| `externalPort` | string | Yes | *   The external port range that is used for port forwarding when you configure a DNAT entry for an  Example: `8080` |
| `forwardEntryName` | string | No | The name of the DNAT entry. Example: `ForwardEntry-1` |
| `forwardTableId` | string | Yes | The ID of the DNAT table. Example: `ftb-bp1mbjubq34hlcqpa****` |
| `internalIp` | string | Yes | *   The private IP address of the ECS instance that needs to communicate with the Internet when you  Example: `192.168.XX.XX` |
| `internalPort` | string | Yes | *   The internal port or port range that is used for port forwarding when you configure a DNAT entry Example: `80` |
| `ipProtocol` | string | Yes | The protocol. Valid values: Example: `TCP` |
| `portBreak` | boolean | No | Whether to enable port breakthrough, with values: - **true**: Enable port breakthrough.  - **false** Example: `false` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |

## deleteForwardEntry

**Signature:** `deleteForwardEntry(request: DeleteForwardEntryRequest)`

## [](#)Description *   **DeleteForwardEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeFor.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `forwardEntryId` | string | Yes | The ID of the DNAT entry to be deleted. Example: `fwd-8vbn3bc8roygjp0gy****` |
| `forwardTableId` | string | Yes | The ID of the DNAT table to which the DNAT entry belongs. Example: `ftb-8vbx8xu2lqj9qb334****` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |

## describeForwardTableEntries

**Signature:** `describeForwardTableEntries(request: DescribeForwardTableEntriesRequest)`

Queries DNAT entries..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `externalIp` | string | No | *   The elastic IP addresses (EIPs) that can be accessed over the Internet when you query DNAT entri Example: `116.28.XX.XX` |
| `externalPort` | string | No | *   The external port or port range that is used for port forwarding when you query DNAT entries of  Example: `8080` |
| `forwardEntryId` | string | No | The ID of the DNAT entry. Example: `fwd-8vbn3bc8roygjp0gy****` |
| `forwardEntryName` | string | No | The name of the DNAT entry. Example: `ForwardEntry-1` |
| `forwardTableId` | string | No | The ID of the DNAT table. Example: `ftb-bp1mbjubq34hlcqpa****` |
| `internalIp` | string | No | The private IP address. Example: `192.168.XX.XX` |
| `internalPort` | string | No | *   The internal port or port range that is used for port forwarding when you query DNAT entries of  Example: `80` |
| `ipProtocol` | string | No | The protocol. Valid values: Example: `TCP` |
| `natGatewayId` | string | No | The ID of the NAT gateway. Example: `ngw-bp1uewa15k4iy5770****` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where you want to create the NAT gateway. Example: `cn-hangzhou` |

## modifyForwardEntry

**Signature:** `modifyForwardEntry(request: ModifyForwardEntryRequest)`

**ModifyForwardEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeForwardTableEntries](https:.

**Parameters:** (3 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `externalIp` | string | No | *   When you modify DNAT entries of Internet NAT gateways, this parameter specifies the elastic IP a Example: `116.85.XX.XX` |
| `externalPort` | string | No | *   The external port that is used to forward traffic when you modify DNAT entries of Internet NAT g Example: `80` |
| `forwardEntryId` | string | Yes | The ID of the DNAT entry. Example: `fwd-8vbn3bc8roygjp0gy****` |
| `forwardEntryName` | string | No | The new name of the DNAT entry. Example: `test` |
| `forwardTableId` | string | Yes | The ID of the DNAT table to which the DNAT entry belongs. Example: `ftb-8vbx8xu2lqj9qb334****` |
| `internalIp` | string | No | *   The private IP address of the ECS instance that uses DNAT entries to communicate with the Intern Example: `10.0.0.78` |
| `internalPort` | string | No | *   The internal port or port range that is used to forward traffic when you modify DNAT entries of  Example: `80` |
| `ipProtocol` | string | No | The protocol. Valid values: Example: `TCP` |
| `portBreak` | boolean | No | Specifies whether to remove limits on the port range. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the NAT gateway. Example: `cn-hangzhou` |

## createFullNatEntry

**Signature:** `createFullNatEntry(request: CreateFullNatEntryRequest)`

**CreateFullNatEntry** is an asynchronous operation. After you send a request to call this operation, the system returns a FULLNAT entry and the FULLNAT entry is being added in the backend. You can ca.

**Parameters:** (6 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessDomain` | string | No | - |
| `accessIp` | string | No | The backend IP address to be modified in FULLNAT address translation. Example: `192.168.XX.XX` |
| `accessPort` | string | Yes | The backend port to be modified in the mapping of FULLNAT port. Valid values: **1** to **65535**. Example: `80` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to only precheck this request. Valid values: Example: `false` |
| `fullNatEntryDescription` | string | No | The description of the FULLNAT entry. Example: `abc` |
| `fullNatEntryName` | string | No | The FULLNAT entry name. The name must be 2 to 128 characters in length. It must start with a letter  Example: `test` |
| `fullNatTableId` | string | Yes | The ID of the FULLNAT table to which the FULLNAT entry belongs. Example: `fulltb-gw88z7hhlv43rmb26****` |
| `ipProtocol` | string | Yes | The protocol of the packets that are forwarded by the port. Valid values: Example: `TCP` |
| `natIp` | string | Yes | The NAT IP address that provides address translation. Example: `192.168.XX.XX` |
| `natIpPort` | string | No | The frontend port to be modified in the mapping of FULLNAT port. Valid values: **1** to **65535**. Example: `80` |
| `networkInterfaceId` | string | Yes | The elastic network interface (ENI) ID. Example: `eni-gw8g131ef2dnbu3k****` |
| `regionId` | string | Yes | The region ID of the Virtual Private Cloud (VPC) NAT gateway to which the FULLNAT entry to be added  Example: `eu-central-1` |

## deleteFullNatEntry

**Signature:** `deleteFullNatEntry(request: DeleteFullNatEntryRequest)`

## [](#)Description **DeleteFullNatEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListFullNatEntr.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `fullNatEntryId` | string | Yes | The ID of the FULLNAT entry that you want to delete. Example: `fullnat-gw8fz23jezpbblf1j****` |
| `fullNatTableId` | string | Yes | The ID of the FULLNAT table to which the FULLNAT entry to be deleted belongs. Example: `fulltb-gw88z7hhlv43rmb26****` |
| `regionId` | string | Yes | The region ID of the VPC NAT gateway to which the FULLNAT entry to be deleted belongs. Example: `eu-central-1` |

## modifyFullNatEntryAttribute

**Signature:** `modifyFullNatEntryAttribute(request: ModifyFullNatEntryAttributeRequest)`

## [](#) *   **ModifyFullNatEntryAttribute** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListFullNatEn.

**Parameters:** (3 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessDomain` | string | No | - |
| `accessIp` | string | No | The backend IP address to be modified in FULLNAT address translation. Example: `192.168.XX.XX` |
| `accessPort` | string | No | The backend port to be modified in FULLNAT port mapping. Valid values: **1** to **65535**. Example: `80` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `fullNatEntryDescription` | string | No | The new description of the FULLNAT entry. Example: `abcd` |
| `fullNatEntryId` | string | Yes | The ID of the FULLNAT entry to be modified. Example: `fullnat-gw8fz23jezpbblf1j****` |
| `fullNatEntryName` | string | No | The new name of the FULLNAT entry. Example: `modify` |
| `fullNatTableId` | string | Yes | The ID of the FULLNAT table to be modified. Example: `fulltb-gw88z7hhlv43rmb26****` |
| `ipProtocol` | string | No | The protocol of the packets that are forwarded by the port. Valid values: Example: `TCP` |
| `natIp` | string | No | The NAT IP address to be modified. Example: `192.168.XX.XX` |
| `natIpPort` | string | No | The frontend port to be modified in FULLNAT port mapping. Valid values: **1** to **65535**. Example: `80` |
| `networkInterfaceId` | string | No | The ID of the elastic network interface (ENI) to be modified. Example: `eni-gw8g131ef2dnbu3k****` |
| `regionId` | string | Yes | The region ID of the Virtual Private Cloud (VPC) NAT gateway to which the FULLNAT entry to be modifi Example: `eu-central-1` |

## createNatIp

**Signature:** `createNatIp(request: CreateNatIpRequest)`

## [](#) **CreateNatIp** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListNatIps](https://help.aliyun.c.

**Parameters:** (3 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `ipv4Prefix` | string | No | The created IP prefix address segment must be within the reserved network segment of the switch wher Example: `null` |
| `ipv4PrefixCount` | number | No | The number of automatically assigned IP prefixes. These are randomly allocated from the unassigned r Example: `1` |
| `natGatewayId` | string | Yes | The ID of the Virtual Private Cloud (VPC) NAT gateway for which you want to create the NAT IP addres Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIp` | string | No | The NAT IP address that you want to create. Example: `192.168.0.34` |
| `natIpCidr` | string | Yes | The CIDR block to which the NAT IP address belongs. Example: `192.168.0.0/24` |
| `natIpDescription` | string | No | The description of the NAT IP address. Example: `test` |
| `natIpName` | string | No | The name of the NAT IP address. Example: `newnatip` |
| `regionId` | string | Yes | The region ID of the NAT gateway to which the NAT IP address that you want to create belongs. Example: `eu-central-1` |

## deleteNatIp

**Signature:** `deleteNatIp(request: DeleteNatIpRequest)`

## [](#)Description *   **DeleteNatIp** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListNatIps](https:.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `ipv4Prefix` | string | No | The IP prefix address to be deleted. Example: `192.168.0.0/28` |
| `natGatewayId` | string | No | The ID of the NAT gateway instance to which the IP prefix to be deleted belongs. Required when delet Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIpId` | string | No | The ID of the NAT IP address that you want to delete. Example: `vpcnatip-gw8y7q3cpk3fggs87****` |
| `regionId` | string | Yes | The region ID of the NAT gateway to which the NAT IP address that you want to delete belongs. Example: `cn-qingdao` |

## modifyNatIpAttribute

**Signature:** `modifyNatIpAttribute(request: ModifyNatIpAttributeRequest)`

## [](#)Description You cannot repeatedly call the **ModifyNatIpAttribute** operation to modify the name and description of a NAT IP address within the specified period of time..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Example: `false` |
| `natIpDescription` | string | No | The description of the NAT IP address that you want to modify. Example: `test` |
| `natIpId` | string | Yes | The ID of the NAT IP address that you want to modify. Example: `vpcnatip-gw8e1n11f44wpg****` |
| `natIpName` | string | No | The name of the NAT IP address that you want to modify. Example: `newname` |
| `regionId` | string | Yes | The region ID of the NAT gateway to which the NAT IP address that you want to modify belongs. Example: `eu-central-1` |

## createNatIpCidr

**Signature:** `createNatIpCidr(request: CreateNatIpCidrRequest)`

## [](#)Description You cannot repeatedly call the **CreateNatIpCidr** operation to create a NAT CIDR block within the specified period of time..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `natGatewayId` | string | Yes | The ID of the Virtual Private Cloud (VPC) NAT gateway with which you want to associate the CIDR bloc Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIpCidr` | string | Yes | The NAT CIDR block that you want to associate with the NAT gateway. Example: `172.16.0.0/24` |
| `natIpCidrDescription` | string | No | The description of the NAT CIDR block. Example: `mycidr` |
| `natIpCidrName` | string | No | The name of the CIDR block. Example: `newcidr` |
| `regionId` | string | Yes | The region ID of the NAT gateway with which you want to associate the CIDR block. Example: `eu-central-1` |

## deleteNatIpCidr

**Signature:** `deleteNatIpCidr(request: DeleteNatIpCidrRequest)`

## [](#)Description You cannot repeatedly call the **DeleteNatIpCidr** operation to delete a NAT CIDR block within the specified period of time..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `natGatewayId` | string | Yes | The ID of the NAT gateway to which the NAT CIDR block to be deleted belongs. Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIpCidr` | string | Yes | The NAT CIDR block to be deleted. Example: `172.16.0.0/24` |
| `regionId` | string | Yes | The region ID of the NAT gateway to which the NAT CIDR block to be deleted belongs. Example: `eu-central-1` |

## modifyNatIpCidrAttribute

**Signature:** `modifyNatIpCidrAttribute(request: ModifyNatIpCidrAttributeRequest)`

Modifies the name and description of a NAT CIDR block..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `natGatewayId` | string | Yes | The ID of the Virtual Private Cloud (VPC) NAT gateway to which the NAT CIDR block belongs. Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIpCidr` | string | Yes | The NAT CIDR block whose name and description you want to modify. Example: `172.16.0.0/24` |
| `natIpCidrDescription` | string | No | The new description of the NAT CIDR block. Example: `newtest` |
| `natIpCidrName` | string | No | The new name of the NAT CIDR block. Example: `newname` |
| `regionId` | string | Yes | The region ID of the NAT gateway to which the NAT CIDR block belongs. Example: `eu-central-1` |


## describeNatGatewayAssociateNetworkInterfaces

**Signature:** `describeNatGatewayAssociateNetworkInterfaces(request: DescribeNatGatewayAssociateNetworkInterfacesRequest)`

Queries elastic network interfaces (ENIs) associated with a virtual private cloud (VPC) NAT gateway when the VPC NAT gateway serves as a PrivateLink service resource. This feature is not publicly avai.

**Parameters:** (2 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter key. Example: `ResourceId` |
| `value` | string | No | Separate multiple values with commas (,). Example: `ep-8psre8c8936596cd****` |
| `key` | string | No | The tag key You can specify at most 20 tag keys. It cannot be an empty string, Example: `FinanceDept` |
| `value` | string | No | The tag key. You can specify at most 20 tag keys. It cannot be an empty string. Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF****` |
| `filter` | DescribeNatGatewayAssociateNetworkInterfacesRequestFilter[] | No | - |
| `maxResults` | number | No | The number of entries to return per page. Valid values: **1 to 100**. Default value: **20**. Example: `20` |
| `natGatewayId` | string | Yes | The ID of the NAT gateway. Example: `ngw-bp1uewa15k4iy5770****` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `caeba0bbb2be03f84eb48b699f0a****` |
| `regionId` | string | Yes | The region ID of the Internet NAT gateway. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmxazdjdhd****` |
| `tag` | DescribeNatGatewayAssociateNetworkInterfacesRequestTag[] | No | - |


## listEnhanhcedNatGatewayAvailableZones

**Signature:** `listEnhanhcedNatGatewayAvailableZones(request: ListEnhanhcedNatGatewayAvailableZonesRequest)`

You can call this operation to query zones that support NAT gateways, including Internet NAT gateways and Virtual Private Cloud (VPC) NAT gateways..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter key. Only **PrivateLinkEnabled** is supported. Example: `PrivateLinkEnabled` |
| `value` | string | No | The value of the filter key. Example: `true` |
| `acceptLanguage` | string | No | The language to display the results. Valid values: Example: `zh-CN` |
| `filter` | ListEnhanhcedNatGatewayAvailableZonesRequestFilter[] | No | - |
| `regionId` | string | Yes | The ID of the region that you want to query. Example: `me-east-1` |


## listFullNatEntries

**Signature:** `listFullNatEntries(request: ListFullNatEntriesRequest)`

Queries FULLNAT entries..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `fullNatEntryId` | string | No | The ID of the FULLNAT entry that you want to query. Example: `fullnat-gw8fz23jezpbblf1j****` |
| `fullNatEntryNames` | string[] | No | The name of the FULLNAT entry that you want to query. You can specify at most 20 names. |
| `fullNatTableId` | string | No | The ID of the FULLNAT table to which the FULLNAT entries to be queried belong. Example: `fulltb-gw88z7hhlv43rmb26****` |
| `ipProtocol` | string | No | The protocol of the packets that are forwarded by the port. Valid values: Example: `TCP` |
| `maxResults` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `natGatewayId` | string | No | The ID of the NAT gateway. Example: `ngw-bp1uewa15k4iy5770****` |
| `natIp` | string | No | The NAT IP address that provides address translation in FULLNAT entries. Example: `10.0.XX.XX` |
| `natIpPort` | string | No | The frontend port to be modified in the mapping of FULLNAT port. Valid values: **1** to **65535**. Example: `443` |
| `networkInterfaceIds` | string[] | No | - |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the virtual private cloud (VPC) NAT gateway to which the FULLNAT entries to be quer Example: `eu-central-1` |


## listNatIpCidrs

**Signature:** `listNatIpCidrs(request: ListNatIpCidrsRequest)`

Queries the CIDR blocks of a specified NAT gateway..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to only precheck this request. Valid values: Example: `false` |
| `maxResults` | string | No | The number of entries to return on each page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `natGatewayId` | string | Yes | The ID of the VPC NAT gateway that you want to query. Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIpCidr` | string | No | The CIDR block of the NAT gateway that you want to query. Example: `172.16.0.0/24` |
| `natIpCidrName` | string[] | No | The name of the CIDR block that you want to query. Valid values of **N**: **1** to **20**. Example: `test` |
| `natIpCidrStatus` | string | No | The status of the CIDR block that you want to query. Set the value to **Available**. Example: `Available` |
| `natIpCidrs` | string[] | No | The CIDR block of the NAT gateway that you want to query. Valid values of **N**: **1** to **20**. Example: `172.16.0.0/24` |
| `nextToken` | string | No | The token that is used for the next query. Set the value as needed. Example: `caeba0bbb2be03f84eb48b699f0a4883` |
| `regionId` | string | Yes | The region ID of the Virtual Private Cloud (VPC) NAT gateway that you want to query. Example: `eu-central-1` |


## listNatIps

**Signature:** `listNatIps(request: ListNatIpsRequest)`

Queries the IP addresses on a NAT gateway..

**Parameters:** (2 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `5A2CFF0E-5718-45B5-9D4D-70B3FF3898` |
| `dryRun` | boolean | No | Specifies whether to only precheck the request. Valid values: Example: `false` |
| `ipOrigin` | string | No | The enumeration of the fields used to describe the source of the NatIp. Prefix indicates the NatIp t Example: `cidr` |
| `ipv4Prefix` | string | No | The IP prefix address range. Example: `192.168.0.0/28` |
| `maxResults` | string | No | The number of entries to return on each page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `natGatewayId` | string | Yes | The ID of the NAT gateway. Example: `ngw-gw8v16wgvtq26vh59****` |
| `natIpCidr` | string | No | The CIDR block to which the IP address belongs. Example: `192.168.0.0/24` |
| `natIpIds` | string[] | No | The ID of the IP address. Valid values of **N**: **1** to **20**. Example: `vpcnatip-gw8a863sut1zijxh0****` |
| `natIpName` | string[] | No | The name of the IP address. Valid values of **N**: **1** to **20**. Example: `test` |
| `natIpStatus` | string | No | The status of the IP address. Valid values: Example: `Available` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****f84eb48b699f0a4883` |
| `regionId` | string | Yes | The ID of the region where the NAT gateway is deployed. Example: `eu-central-1` |


## vpcDescribeVpcNatGatewayNetworkInterfaceQuota

**Signature:** `vpcDescribeVpcNatGatewayNetworkInterfaceQuota(request: VpcDescribeVpcNatGatewayNetworkInterfaceQuotaRequest)`

Before you call this operation, make sure that a VPC NAT gateway is created. For more information, see [CreateNatGateway](https://help.aliyun.com/document_detail/120219.html)..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `natGatewayId` | string | No | The ID of the VPC NAT gateway. Example: `ngw-bp1uewa15k4iy5770****` |
| `regionId` | string | No | The region ID of the VPC NAT gateway. Example: `cn-hangzhou` |
| `resourceUid` | number | No | The ID of the Alibaba Cloud account to which the resource belongs. Example: `132193271328****` |

