# VPN Gateway

VPN gateway, IPsec connections, SSL VPN, customer gateways, and tunnels.

## createVpnGateway

**Signature:** `createVpnGateway(request: CreateVpnGatewayRequest)`

Before you create a VPN gateway, we recommend that you know more about the limits of VPN gateways. For more information, see the [Limits](https://help.aliyun.com/document_detail/65290.html) section in.

**Parameters:** (3 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Valid values: Example: `false` |
| `bandwidth` | number | Yes | The maximum bandwidth of the VPN gateway. Unit: Mbit/s. Example: `5` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4****` |
| `disasterRecoveryVSwitchId` | string | No | The second vSwitch with which you want to associate the VPN gateway. Example: `vsw-p0wiz7obm0tbimu4r****` |
| `enableIpsec` | boolean | No | Specifies whether to enable IPsec-VPN for the VPN gateway. Valid values: Example: `true` |
| `enableSsl` | boolean | No | Specifies whether to enable SSL-VPN. Valid values: Example: `false` |
| `instanceChargeType` | string | No | The billing method of the VPN gateway. Set the value to **POSTPAY**, which specifies the pay-as-you- Example: `Example` |
| `name` | string | No | The name of the VPN gateway. The default value is the ID of the VPN gateway. Example: `MYVPN` |
| `networkType` | string | No | The network type of the VPN gateway. Valid values: Example: `public` |
| `period` | number | No | The subscription duration. Unit: month. Valid values: **1** to **9**, **12**, **24**, and **36**. Example: `1` |
| `regionId` | string | Yes | The region ID of the VPN gateway. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the VPN gateway belongs. Example: `rg-acfmzs372yg****` |
| `sslConnections` | number | No | The maximum number of clients that can be connected at the same time. Valid values: **5** (default), Example: `5` |
| `vSwitchId` | string | No | The vSwitch with which you want to associate the VPN gateway. Example: `vsw-bp1j5miw2bae9s2vt****` |
| `vpcId` | string | Yes | The ID of the virtual private cloud (VPC) where you want to create the VPN gateway. Example: `vpc-bp1ub1yt9cvakoelj****` |
| `vpnType` | string | No | The type of the VPN gateway. Valid values: Example: `Normal` |

## deleteVpnGateway

**Signature:** `deleteVpnGateway(request: DeleteVpnGatewayRequest)`

>  You cannot delete a VPN gateway associated with existing IPsec-VPN connections..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-hangzhou` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1q8bgx4xnkm2ogj****` |

## describeVpnGateways

**Signature:** `describeVpnGateways(request: DescribeVpnGatewaysRequest)`

Queries VPN gateways in a region..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. Example: `FinanceDept` |
| `value` | string | No | The tag value. Example: `FinanceJoshua` |
| `businessStatus` | string | No | The payment status of the VPN gateway. Valid values: Example: `Normal` |
| `includeReservationData` | boolean | No | Specifies whether to return information about pending orders. Valid values: Example: `true` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1** to **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-zhangjiakou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the VPN gateway belongs. Example: `rg-acfmzs372yg****` |
| `status` | string | No | The status of the VPN gateway. Valid values: Example: `active` |
| `tag` | DescribeVpnGatewaysRequestTag[] | No | - |
| `vpcId` | string | No | The ID of the virtual private cloud (VPC) to which the VPN gateway belongs. Example: `vpc-bp1m3i0kn1nd4wiw9****` |
| `vpnGatewayId` | string | No | The ID of the VPN gateway. Example: `vpn-bp17lofy9fd0dnvzv****` |

## modifyVpnGatewayAttribute

**Signature:** `modifyVpnGatewayAttribute(request: ModifyVpnGatewayAttributeRequest)`

**ModifyVpnGatewayAttribute** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https://help.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPropagate` | boolean | No | Specifies whether to automatically advertise BGP routes to the virtual private cloud (VPC). Valid va Example: `true` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `description` | string | No | The new description of the VPN connection. Example: `test` |
| `name` | string | No | The new name of the VPN gateway. Example: `myvpn` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. You can call the [DescribeRegions](https://he Example: `cn-shanghai` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1q8bgx4xnkm2ogj****` |

## describeVpnGateway

**Signature:** `describeVpnGateway(request: DescribeVpnGatewayRequest)`

Queries the detailed information about a VPN gateway..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `includeReservationData` | boolean | No | Specifies whether to include the data about pending orders. Valid values: Example: `true` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-zhangjiakou` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1r3v1xqkl0w519g****` |

## listVpnCertificateAssociations

**Signature:** `listVpnCertificateAssociations(request: ListVpnCertificateAssociationsRequest)`

When you call **ListVpnCertificateAssociations**, take note of the following information: *   If you specify only **RegionId**, the SSL certificates associated with all VPN gateways in the specified r.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `certificateId` | string[] | No | The list of certificate IDs. Example: `6bfe4218-ea1d****` |
| `certificateType` | string | No | The certificate type. Valid values: Example: `Signature` |
| `maxResults` | number | No | The number of entries to return on each page. Valid values: **1** to **20**. Default value: **1**. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `caeba0bbb2be0****` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-hangzhou` |
| `vpnGatewayId` | string[] | No | The list of VPN gateway IDs. Example: `vpn-bp1q8bgx4xnkm****` |

## associateVpnGatewayWithCertificate

**Signature:** `associateVpnGatewayWithCertificate(request: AssociateVpnGatewayWithCertificateRequest)`

Before you associate a VPN gateway with an SSL certificate, take note of the following items: *   You can associate only VPN gateways of the ShangMi (SM) type with SSL certificates. You need to associ.

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `certificateId` | string | Yes | The ID of the certificate. Example: `6bfe4218-ea1d****` |
| `certificateType` | string | Yes | The type of the certificate. Valid values: Example: `Signature` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea****` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-hangzhou` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1q8bgx4xnkm2ogj****` |

## checkVpnBgpEnabled

**Signature:** `checkVpnBgpEnabled(request: CheckVpnBgpEnabledRequest)`

Checks whether the region of an IPsec-VPN connection supports BGP..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |

## diagnoseVpnGateway

**Signature:** `diagnoseVpnGateway(request: DiagnoseVpnGatewayRequest)`

Diagnoses a VPN gateway..

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001****` |
| `IPsecExtendInfo` | string | No | Check the connectivity of the destination address. Valid values: Example: `{"PrivateSourceIp":"192.168.1.1","PrivateDestinationIp":"192.168.0.1"}` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-qingdao` |
| `resourceId` | string | Yes | The ID of the resource to be diagnosed. Example: `vco-uf66xniofskqtuoz1****` |
| `resourceType` | string | Yes | The type of the resource. Example: `IPsec` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-m5efhj0k1p47ctuhl****` |

## createVpnConnection

**Signature:** `createVpnConnection(request: CreateVpnConnectionRequest)`

If the VPN gateway supports the dual-tunnel mode, you can specify the following parameters in addition to the required parameters when you call `CreateVpnConnection`: **ClientToken**, **Name**, **Effe.

**Parameters:** (5 required, 40 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customerGatewayId` | string | Yes | The ID of the customer gateway that is associated with the tunnel. Example: `cgw-p0wy363lucf1uyae8****` |
| `localSubnet` | string | Yes | The CIDR block of the virtual private cloud (VPC) that needs to communicate with the on-premises dat Example: `10.10.1.0/24,10.10.2.0/24` |
| `regionId` | string | Yes | The ID of the region where the IPsec-VPN connection is created. You can call the [DescribeRegions](h Example: `cn-shanghai` |
| `remoteSubnet` | string | Yes | The CIDR block of the on-premises database that needs to communicate with the VPC. The CIDR block is Example: `10.10.3.0/24,10.10.4.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1q8bgx4xnkm****` |
| `key` | string | No | The tag key. The tag key cannot be an empty string. Example: `TagKey` |
| `value` | string | No | The tag value. Example: `TagValue` |
| `localAsn` | number | No | The autonomous system number (ASN) of the tunnel on the Alibaba Cloud side. Valid values: **1** to * Example: `65530` |
| `localBgpIp` | string | No | The BGP IP address of the tunnel on the Alibaba Cloud side. The address is an IP address that falls  Example: `169.254.10.1` |
| `tunnelCidr` | string | No | The BGP CIDR block of the tunnel. The CIDR block must fall within 169.254.0.0/16 and the mask of the Example: `169.254.10.0/30` |
| `ikeAuthAlg` | string | No | The authentication algorithm that is used in Phase 1 negotiations. Example: `md5` |
| `ikeEncAlg` | string | No | The encryption algorithm that is used in Phase 1 negotiations. Example: `aes` |
| `ikeLifetime` | number | No | The SA lifetime as a result of Phase 1 negotiations. Unit: seconds Example: `86400` |
| `ikeMode` | string | No | The negotiation mode of IKE. Valid values: **main** and **aggressive**. Default value: **main**. Example: `main` |
| `ikePfs` | string | No | The Diffie-Hellman key exchange algorithm that is used in Phase 1 negotiations. Default value: **gro Example: `group2` |
| `ikeVersion` | string | No | The version of the IKE protocol. Valid values: **ikev1** and **ikev2**. Default value: **ikev1**. Example: `ikev1` |
| `localId` | string | No | The identifier of the tunnel on the Alibaba Cloud side, which is used in Phase 1 negotiations. The i Example: `47.21.XX.XX` |
| `psk` | string | No | The pre-shared key that is used for identity authentication between the tunnel and the tunnel peer. Example: `123456****` |
| `remoteId` | string | No | The identifier of the tunnel peer, which is used in Phase 1 negotiations. The identifier cannot exce Example: `47.42.XX.XX` |
| `ipsecAuthAlg` | string | No | The authentication algorithm that is used in Phase 2 negotiations. Example: `md5` |
| ... | ... | ... | *25 more optional parameters* |

## deleteVpnConnection

**Signature:** `deleteVpnConnection(request: DeleteVpnConnectionRequest)`

**DeleteVpnConnection** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVpnGateway](https://help.a.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The ID of the region where the IPsec-VPN connection is created. Example: `cn-hangzhou` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-bp1bbi27hojx80nck****` |

## describeVpnConnections

**Signature:** `describeVpnConnections(request: DescribeVpnConnectionsRequest)`

Queries IPsec-VPN connections..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. The tag key cannot be an empty string. Example: `TagKey` |
| `value` | string | No | The tag value. Example: `TagValue` |
| `customerGatewayId` | string | No | The ID of the customer gateway. Example: `cgw-bp1mvj4g9kogw****` |
| `pageNumber` | number | No | The page number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries returned on each page. Default value: **10**. Valid values: **1** to **50**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the IPsec-VPN connection is created. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the IPsec-VPN connection belongs. Example: `rg-acfmzs372yg****` |
| `tag` | DescribeVpnConnectionsRequestTag[] | No | The tag value. |
| `vpnConnectionId` | string | No | The ID of the IPsec-VPN connection. Example: `vco-bp10lz7aejumd****` |
| `vpnGatewayId` | string | No | The ID of the VPN gateway. Example: `vpn-bp1q8bgx4xnkx****` |

## modifyVpnConnectionAttribute

**Signature:** `modifyVpnConnectionAttribute(request: ModifyVpnConnectionAttributeRequest)`

If you want to modify a IPsec-VPN connection in dual-tunnel mode, call the `ModifyVpnConnectionAttribute` operation. You can modify the required parameters and the following request parameters: **Clie.

**Parameters:** (3 required, 39 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgpConfig` | string | Yes | This parameter is supported if you modify the configurations of an IPsec-VPN connection in single-tu Example: `{"EnableBgp":"true","LocalAsn":"65530","TunnelCidr":"169.254.11.0/30","LocalBgpIp":"169.254.11.1"}` |
| `regionId` | string | Yes | The ID of the region in which the IPsec-VPN connection is created. Example: `cn-shanghai` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-bp1bbi27hojx80nck****` |
| `localAsn` | number | No | The ASN of the tunnel on the Alibaba Cloud side. Valid values: **1** to **4294967295**. Default valu Example: `65530` |
| `localBgpIp` | string | No | The BGP IP address of the tunnel on the Alibaba Cloud side. The address is an IP address that falls  Example: `169.254.10.1` |
| `tunnelCidr` | string | No | The BGP CIDR block of the tunnel. Example: `169.254.10.0/30` |
| `ikeAuthAlg` | string | No | The authentication algorithm that is used in Phase 1 negotiations. Example: `md5` |
| `ikeEncAlg` | string | No | The encryption algorithm that is used in Phase 1 negotiations. Example: `aes` |
| `ikeLifetime` | number | No | The SA lifetime as a result of Phase 1 negotiations. Unit: seconds Valid values: **0** to **86400**. Example: `86400` |
| `ikeMode` | string | No | The negotiation mode of IKE. Valid values: Example: `main` |
| `ikePfs` | string | No | The Diffie-Hellman key exchange algorithm that is used in Phase 1 negotiations. Valid values: **grou Example: `group2` |
| `ikeVersion` | string | No | The version of the IKE protocol. Valid values: **ikev1** and **ikev2**. Example: `ikev1` |
| `localId` | string | No | The identifier on the Alibaba Cloud side, which is used in Phase 1 negotiations. The identifier cann Example: `47.21.XX.XX` |
| `psk` | string | No | The pre-shared key, which is used for identity authentication between the tunnel and the tunnel peer Example: `123456****` |
| `remoteId` | string | No | The identifier of the tunnel peer, which is used in Phase 1 negotiations. The identifier cannot exce Example: `47.42.XX.XX` |
| `ipsecAuthAlg` | string | No | The authentication algorithm that is used in Phase 2 negotiations. Example: `md5` |
| `ipsecEncAlg` | string | No | The encryption algorithm that is used in Phase 2 negotiations. Example: `aes` |
| `ipsecLifetime` | number | No | The SA lifetime as a result of Phase 2 negotiations. Unit: seconds Valid values: **0** to **86400**. Example: `86400` |
| ... | ... | ... | *24 more optional parameters* |

## describeVpnConnection

**Signature:** `describeVpnConnection(request: DescribeVpnConnectionRequest)`

Queries the detailed information about an IPsec-VPN connection..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The ID of the region where the IPsec-VPN connection is created. Example: `cn-hangzhou` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-bp1bbi27hojx80nck****` |

## downloadVpnConnectionConfig

**Signature:** `downloadVpnConnectionConfig(request: DownloadVpnConnectionConfigRequest)`

Queries the configuration of an IPsec-VPN connection..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The ID of the region where the IPsec-VPN connection is created. Example: `cn-shanghai` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-bp1bbi27hojx80nck****` |

## createVpnAttachment

**Signature:** `createVpnAttachment(request: CreateVpnAttachmentRequest)`

By default, the IPsec-VPN connection created by calling the `CreateVpnAttachment` operation is not bound to any resources. You can call the [CreateTransitRouterVpnAttachment](https://help.aliyun.com/d.

**Parameters:** (5 required, 40 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customerGatewayId` | string | Yes | The ID of the customer gateway that is associated with the tunnel. Example: `cgw-p0w2jemrcj5u61un8****` |
| `customerGatewayId` | string | Yes | The customer gateway ID. Example: `cgw-p0w2jemrcj5u61un8****` |
| `localSubnet` | string | Yes | The CIDR block on the VPC side. The CIDR block is used in Phase 2 negotiations. Example: `10.1.1.0/24,10.1.2.0/24` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |
| `remoteSubnet` | string | Yes | The CIDR block on the data center side. This CIDR block is used in Phase 2 negotiations. Example: `10.1.3.0/24,10.1.4.0/24` |
| `key` | string | No | The tag key. The tag key cannot be an empty string. Example: `TagKey` |
| `value` | string | No | The tag value. Example: `TagValue` |
| `localAsn` | number | No | The ANS of the tunnel on the Alibaba Cloud side. Valid values: **1** to **4294967295**. Default valu Example: `65530` |
| `localBgpIp` | string | No | The BGP IP address of the tunnel on the Alibaba Cloud side. The address is an IP address that falls  Example: `169.254.10.1` |
| `tunnelCidr` | string | No | The BGP CIDR block of the tunnel. The CIDR block must fall into 169.254.0.0/16 and the mask of the C Example: `169.254.10.0/30` |
| `ikeAuthAlg` | string | No | The authentication algorithm that is used in Phase 1 negotiations. Valid values: **md5**, **sha1**,  Example: `sha1` |
| `ikeEncAlg` | string | No | The encryption algorithm that is used in Phase 1 negotiations. Valid values: **aes**, **aes192**, ** Example: `aes` |
| `ikeLifetime` | number | No | The SA lifetime as a result of Phase 1 negotiations. Unit: seconds. Example: `86400` |
| `ikeMode` | string | No | The negotiation mode of IKE. Valid values: **main** and **aggressive**. Default value: **main**. Example: `main` |
| `ikePfs` | string | No | The Diffie-Hellman key exchange algorithm that is used in Phase 1 negotiations. Default value: **gro Example: `group2` |
| `ikeVersion` | string | No | The version of the IKE protocol. Valid values: **ikev1** and **ikev2**. Default value: **ikev2**. Example: `ikev2` |
| `localId` | string | No | The identifier of the tunnel on the Alibaba Cloud side, which is used in Phase 1 negotiations. The i Example: `47.XX.XX.1` |
| `psk` | string | No | The pre-shared key that is used for identity authentication between the tunnel and the tunnel peer. Example: `123456****` |
| `remoteId` | string | No | The identifier of the tunnel peer, which is used in Phase 1 negotiations. The identifier cannot exce Example: `47.XX.XX.2` |
| `ipsecAuthAlg` | string | No | The authentication algorithm that is used in Phase 2 negotiations. Example: `sha1` |
| ... | ... | ... | *25 more optional parameters* |

## deleteVpnAttachment

**Signature:** `deleteVpnAttachment(request: DeleteVpnAttachmentRequest)`

If an IPsec-VPN connection is associated with a transit router, you must disassociate the transit router from the IPsec-VPN connection before you delete the IPsec-VPN connection. For more information,.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-p0w7gtr14m09r9lkr****` |

## describeVpnAttachments

**Signature:** `describeVpnAttachments(request: DescribeVpnAttachmentsRequest)`

Queries the IPsec-VPN connections associated with a transit router..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attachType` | string | No | The type of resource that is associated with the IPsec-VPN connection. Default value: **CEN**. Example: `CEN` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: **10**. Valid values: **1** to **50**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the IPsec-VPN connection is established. Example: `cn-hangzhou` |
| `vpnConnectionId` | string | No | The ID of the IPsec-VPN connection. Example: `vco-p0w2jpkhi2eeop6q6****` |

## modifyVpnAttachmentAttribute

**Signature:** `modifyVpnAttachmentAttribute(request: ModifyVpnAttachmentAttributeRequest)`

When you modify a IPsec-VPN connection in dual-tunnel mode, you can configure the following parameters in addition to the required request parameters: **ClientToken**, **Name**, **LocalSubnet**, **Rem.

**Parameters:** (2 required, 41 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The ID of the region in which the IPsec-VPN connection is established. Example: `cn-hangzhou` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-p0w5112fgnl2ihlmf****` |
| `localAsn` | number | No | The autonomous system number (ASN) of the tunnel on the Alibaba Cloud side. Valid values: **1** to * Example: `65530` |
| `localBgpIp` | string | No | The BGP IP address of the tunnel on the Alibaba Cloud side. The address is an IP address that falls  Example: `169.254.10.1` |
| `tunnelCidr` | string | No | The BGP CIDR block of the tunnel. The CIDR block must fall within 169.254.0.0/16 and the mask of the Example: `169.254.10.0/30` |
| `ikeAuthAlg` | string | No | The authentication algorithm that is used in Phase 1 negotiations. Valid values: **md5**, **sha1**,  Example: `sha1` |
| `ikeEncAlg` | string | No | The encryption algorithm that is used in Phase 1 negotiations. Valid values: **aes**, **aes192**, ** Example: `aes` |
| `ikeLifetime` | number | No | The SA lifetime as a result of Phase 1 negotiations. Unit: seconds. Example: `86400` |
| `ikeMode` | string | No | The negotiation mode of IKE. Valid values: **main** and **aggressive**. Example: `main` |
| `ikePfs` | string | No | The Diffie-Hellman key exchange algorithm that is used in Phase 1 negotiations. Valid values: **grou Example: `group2` |
| `ikeVersion` | string | No | The version of the IKE protocol. Valid values: **ikev1** and **ikev2**. Example: `ikev2` |
| `localId` | string | No | The identifier of the tunnel on the Alibaba Cloud side, which is used in Phase 1 negotiations. The i Example: `47.XX.XX.1` |
| `psk` | string | No | The pre-shared key that is used for identity authentication between the tunnel and the tunnel peer. Example: `123456****` |
| `remoteId` | string | No | The identifier of the tunnel peer, which is used in Phase 1 negotiations. The identifier cannot exce Example: `47.XX.XX.2` |
| `ipsecAuthAlg` | string | No | The authentication algorithm that is used in Phase 2 negotiations. Example: `sha1` |
| `ipsecEncAlg` | string | No | The encryption algorithm that is used in Phase 2 negotiations. Valid values: **aes**, **aes192**, ** Example: `aes` |
| `ipsecLifetime` | number | No | The SA lifetime as a result of Phase 2 negotiations. Unit: seconds. Example: `86400` |
| ... | ... | ... | *26 more optional parameters* |

## createVpnRouteEntry

**Signature:** `createVpnRouteEntry(request: CreateVpnRouteEntryRequest)`

**CreateVpnRouteEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https://help.aliyu.

**Parameters:** (6 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3828dae****` |
| `description` | string | No | The description of the destination-based route. Example: `mytest` |
| `nextHop` | string | Yes | The next hop of the destination-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `overlayMode` | string | No | The tunneling protocol. The value is set to **Ipsec**, which indicates the IPsec tunneling protocol. Example: `Ipsec` |
| `publishVpc` | boolean | Yes | Specifies whether to advertise the destination-based route to a virtual private cloud (VPC) route ta Example: `true` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the destination-based route. Example: `10.0.0.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The weight of the destination-based route. Valid values: Example: `0` |

## deleteVpnRouteEntry

**Signature:** `deleteVpnRouteEntry(request: DeleteVpnRouteEntryRequest)`

**DeleteVpnRouteEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https://help.aliyu.

**Parameters:** (5 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3828dae492b` |
| `nextHop` | string | Yes | The next hop of the destination-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**. Example: `Ipsec` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. You can call the [DescribeRegions](https://he Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the destination-based route. Example: `10.0.0.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The weight of the destination-based route. Valid values: Example: `0` |

## describeVpnRouteEntries

**Signature:** `describeVpnRouteEntries(request: DescribeVpnRouteEntriesRequest)`

Queries destination-based and BGP route entries of a VPN gateway..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. Example: `cn-hangzhou` |
| `routeEntryType` | string | No | The type of the route entry. Valid values: Example: `System` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1cmw7jh1nfe43m9****` |

## modifyVpnRouteEntryWeight

**Signature:** `modifyVpnRouteEntryWeight(request: ModifyVpnRouteEntryWeightRequest)`

In scenarios where a VPN gateway has an active and a standby destination-based route, if you need to modify the weight of the active destination-based route, you must first delete the standby destinat.

**Parameters:** (6 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3828dae492b` |
| `newWeight` | number | Yes | The new weight of the destination-based route. Valid values: Example: `100` |
| `nextHop` | string | Yes | The next hop of the destination-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**. Example: `Ipsec` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. You can call the [DescribeRegions](https://he Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the destination-based route. Example: `10.0.0.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The original weight of the destination-based route. Valid values: Example: `0` |

## publishVpnRouteEntry

**Signature:** `publishVpnRouteEntry(request: PublishVpnRouteEntryRequest)`

Advertises a VPN route to a VPC..

**Parameters:** (6 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b382****` |
| `nextHop` | string | Yes | The next hop of the VPN gateway route. Example: `vco-bp15oes1py4i66rmd****` |
| `publishVpc` | boolean | Yes | Specifies whether to advertise the VPN gateway route to the VPC route table. Valid values: Example: `true` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the VPN gateway route. Example: `10.0.0.0/24` |
| `routeType` | string | Yes | The type of the VPN gateway route. Valid values: Example: `pbr` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |

## createVpnPbrRouteEntry

**Signature:** `createVpnPbrRouteEntry(request: CreateVpnPbrRouteEntryRequest)`

Before you call this operation, make sure that you are familiar with the match rules of and limits on policy-based routes. For more information, see [Manage policy-based routes](https://help.aliyun.co.

**Parameters:** (7 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3****` |
| `description` | string | No | The description of the policy-based route. Example: `desctest` |
| `nextHop` | string | Yes | The next hop of the policy-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**. Example: `Ipsec` |
| `priority` | number | No | The priority of the policy-based route. Valid values: **1** to **100**. Default value: **10**. Example: `10` |
| `publishVpc` | boolean | Yes | Specifies whether to advertise the policy-based route to a virtual private cloud (VPC) route table.  Example: `true` |
| `regionId` | string | Yes | The region ID of the VPN gateway. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the policy-based route. Example: `10.0.0.0/24` |
| `routeSource` | string | Yes | The source CIDR block of the policy-based route. Example: `192.168.1.0/24` |
| `vpnGatewayId` | string | Yes | The VPN gateway ID. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The weight of the policy-based route. Example: `0` |

## deleteVpnPbrRouteEntry

**Signature:** `deleteVpnPbrRouteEntry(request: DeleteVpnPbrRouteEntryRequest)`

**DeleteVpnPbrRouteEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https://help.al.

**Parameters:** (6 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `nextHop` | string | Yes | The next hop of the policy-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**. Example: `Ipsec` |
| `priority` | number | No | The priority of the policy-based route. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. You can call the [DescribeRegions](https://he Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the policy-based route. Example: `10.0.0.0/24` |
| `routeSource` | string | Yes | The source CIDR block of the policy-based route. Example: `192.168.1.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The weight of the policy-based route. Valid values: Example: `0` |

## describeVpnPbrRouteEntries

**Signature:** `describeVpnPbrRouteEntries(request: DescribeVpnPbrRouteEntriesRequest)`

Queries policy-based routes configured for a VPN gateway..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-zhangjiakou` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |

## modifyVpnPbrRouteEntryAttribute

**Signature:** `modifyVpnPbrRouteEntryAttribute(request: ModifyVpnPbrRouteEntryAttributeRequest)`

You can call the **ModifyVpnPbrRouteEntryAttribute** operation to modify the weight and priority of a policy-based route. *   If you want to modify only the weight of a policy-based route, call [Modif.

**Parameters:** (7 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3****` |
| `newPriority` | number | No | The new priority of the policy-based route. Valid values: **1** to **100**. Example: `10` |
| `newWeight` | number | No | The new weight of the policy-based route. Valid values: Example: `0` |
| `nextHop` | string | Yes | The next hop of the policy-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `priority` | number | Yes | The original priority of the policy-based route. Valid values: **1** to **100**. Example: `5` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-heyuan` |
| `routeDest` | string | Yes | The destination CIDR block of the policy-based route. Example: `10.0.0.0/24` |
| `routeSource` | string | Yes | The source CIDR block of the policy-based route. Example: `192.168.1.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The original weight of the policy-based route. Valid values: Example: `100` |

## modifyVpnPbrRouteEntryPriority

**Signature:** `modifyVpnPbrRouteEntryPriority(request: ModifyVpnPbrRouteEntryPriorityRequest)`

**ModifyVpnPbrRouteEntryPriority** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https:/.

**Parameters:** (7 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3****` |
| `newPriority` | number | Yes | The new priority of the policy-based route. Valid values: **1** to **100**. Example: `10` |
| `nextHop` | string | Yes | The next hop of the policy-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `priority` | number | No | The original priority of the policy-based route. Valid values: **1** to **100**. Example: `5` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. Example: `cn-henyuan` |
| `routeDest` | string | Yes | The destination CIDR block of the policy-based route. Example: `10.0.0.0/24` |
| `routeSource` | string | Yes | The source CIDR block of the policy-based route. Example: `192.168.1.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The weight of the policy-based route. Valid values: Example: `100` |

## modifyVpnPbrRouteEntryWeight

**Signature:** `modifyVpnPbrRouteEntryWeight(request: ModifyVpnPbrRouteEntryWeightRequest)`

**ModifyVpnPbrRouteEntryWeight** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https://h.

**Parameters:** (7 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b3828dae492b` |
| `newWeight` | number | Yes | The new weight of the policy-based route. Valid values: Example: `100` |
| `nextHop` | string | Yes | The next hop of the policy-based route. Example: `vco-bp15oes1py4i66rmd****` |
| `overlayMode` | string | No | The tunneling protocol. The value is set to **Ipsec**, which indicates the IPsec tunneling protocol. Example: `Ipsec` |
| `priority` | number | No | The priority of the policy-based route. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. You can call the [DescribeRegions](https://he Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the policy-based route. Example: `10.0.0.0/24` |
| `routeSource` | string | Yes | The source CIDR block of the policy-based route. Example: `192.168.1.0/24` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1a3kqjiiq9legfx****` |
| `weight` | number | Yes | The original weight of the policy-based route. Valid values: Example: `0` |

## createSslVpnServer

**Signature:** `createSslVpnServer(request: CreateSslVpnServerRequest)`

**CreateSslVpnServer** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVpnGateway](https://help.al.

**Parameters:** (4 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cipher` | string | No | The encryption algorithm that is used by the SSL-VPN connection. Example: `AES-128-CBC` |
| `clientIpPool` | string | Yes | The client CIDR block. Example: `192.168.1.0/24` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `compress` | boolean | No | Specifies whether to enable data compression. Valid values: Example: `false` |
| `enableMultiFactorAuth` | boolean | No | Specifies whether to enable two-factor authentication. To enable two-factor authentication, you need Example: `false` |
| `IDaaSApplicationId` | string | No | The ID of the IDaaS application. Example: `app_my6g4qmvnwxzj2f****` |
| `IDaaSInstanceId` | string | No | The ID of the IDaaS EIAM instance. Example: `idaas-cn-hangzhou-p****` |
| `IDaaSRegionId` | string | No | The region ID of the IDaaS EIAM instance. Example: `cn-hangzhou` |
| `localSubnet` | string | Yes | The local CIDR block. Example: `10.0.0.0/8` |
| `name` | string | No | The SSL server name. Example: `sslvpnname` |
| `port` | number | No | The port that is used by the SSL server. Valid values of port numbers: **1** to **65535**. Default v Example: `1194` |
| `proto` | string | No | The protocol that is used by the SSL server. Valid values: Example: `UDP` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-shanghai` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp1hgim8by0kc9nga****` |

## deleteSslVpnServer

**Signature:** `deleteSslVpnServer(request: DeleteSslVpnServerRequest)`

**DeleteSslVpnServer** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVpnGateway](https://help.al.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The region ID of the SSL server. Example: `cn-hangzhou` |
| `sslVpnServerId` | string | Yes | The ID of the SSL server. Example: `vss-bp18q7hzj6largv4v****` |

## describeSslVpnServers

**Signature:** `describeSslVpnServers(request: DescribeSslVpnServersRequest)`

Queries one or more SSL-VPN servers..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | The SSL server name. Example: `test` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the SSL server. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID of the SSL server. Example: `rg-acfmzs372yg****` |
| `sslVpnServerId` | string | No | The ID of the SSL server. Example: `vss-bp15j3du13gq1dgey****` |
| `vpnGatewayId` | string | No | The ID of the VPN gateway. Example: `vpn-bp1on0xae9d771ggi****` |

## modifySslVpnServer

**Signature:** `modifySslVpnServer(request: ModifySslVpnServerRequest)`

To enable two-factor authentication for an SSL server, make sure that the VPN gateway supports two-factor authentication. You may need to upgrade the VPN gateway. For more information, see [Two-factor.

**Parameters:** (2 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cipher` | string | No | The encryption algorithm that is used in the SSL-VPN connection. Valid values: Example: `AES-128-CBC` |
| `clientIpPool` | string | No | The client CIDR block. Example: `10.30.30.0/24` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `compress` | boolean | No | Specifies whether to enable data compression. Valid values: Example: `true` |
| `enableMultiFactorAuth` | boolean | No | Specifies whether to enable two-factor authentication. To enable two-factor authentication, you need Example: `false` |
| `IDaaSApplicationId` | string | No | The ID of the IDaaS application. Example: `app_my6g4qmvnwxzj2f****` |
| `IDaaSInstanceId` | string | No | The ID of the IDaaS EIAM instance. Example: `idaas-cn-hangzhou-****` |
| `IDaaSRegionId` | string | No | The region ID of the IDaaS EIAM instance. Example: `cn-hangzhou` |
| `localSubnet` | string | No | The local CIDR block. Example: `10.20.20.0/24` |
| `name` | string | No | The name of the SSL server. Example: `test` |
| `port` | number | No | The port that is used by the SSL server. Valid values of port numbers: **1** to **65535**. Default v Example: `1194` |
| `proto` | string | No | The protocol that is used by the SSL server. Valid values: Example: `UDP` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-hangzhou` |
| `sslVpnServerId` | string | Yes | The ID of the SSL server. Example: `vss-bp18q7hzj6largv4v****` |

## createSslVpnClientCert

**Signature:** `createSslVpnClientCert(request: CreateSslVpnClientCertRequest)`

Before you create an SSL client certificate, make sure that an SSL server is created on the VPN gateway. For more information, see [CreateSslVpnServer](https://help.aliyun.com/document_detail/2794075..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `name` | string | No | The name of the SSL client certificate. Example: `SslVpnClientCert1` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is created. Example: `cn-hangzhou` |
| `sslVpnServerId` | string | Yes | The ID of the SSL server. Example: `vss-m5et0q3iy1qex328w****` |

## deleteSslVpnClientCert

**Signature:** `deleteSslVpnClientCert(request: DeleteSslVpnClientCertRequest)`

If you delete an SSL client certificate, all SSL-VPN client connections to the SSL server are disconnected. You need to reinitiate connections from SSL clients. For example, SSL client certificate 1 a.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `regionId` | string | Yes | The ID of the region where the SSL client certificate is created. Example: `cn-hangzhou` |
| `sslVpnClientCertId` | string | Yes | The ID of the SSL client certificate. Example: `vsc-bp1n8wcf134yl0osr****` |

## describeSslVpnClientCerts

**Signature:** `describeSslVpnClientCerts(request: DescribeSslVpnClientCertsRequest)`

Queries SSL client certificates..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | The name of the SSL client certificate. Example: `cert1` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: **10**. Valid values: **1** to **50**. Example: `10` |
| `regionId` | string | Yes | The region ID of the SSL client certificate. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the SSL client certificate belongs. Example: `rg-acfmzs372yg****` |
| `sslVpnClientCertId` | string | No | The ID of the SSL client certificate. Example: `vsc-bp1n8wcf134yl0osr****` |
| `sslVpnServerId` | string | No | The ID of the SSL server. Example: `vss-bp18q7hzj6largv4v****` |

## modifySslVpnClientCert

**Signature:** `modifySslVpnClientCert(request: ModifySslVpnClientCertRequest)`

Modifies the name of an SSL-VPN client certificate..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `name` | string | No | The new name of the SSL client certificate. This parameter cannot be left empty. Example: `cert2` |
| `regionId` | string | Yes | The ID of the region where the SSL client certificate is created. Example: `cn-hangzhou` |
| `sslVpnClientCertId` | string | Yes | The ID of the SSL client certificate. Example: `vsc-bp1n8wcf134yl0osrc****` |

## describeSslVpnClientCert

**Signature:** `describeSslVpnClientCert(request: DescribeSslVpnClientCertRequest)`

Queries the details of an SSL client certificate..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the SSL client certificate. You can call the [DescribeRegions](https://help.aliyun. Example: `cn-hangzhou` |
| `sslVpnClientCertId` | string | Yes | The ID of the SSL client certificate that you want to query. Example: `vsc-bp17r58rjf5r1gjyr****` |

## createIpsecServer

**Signature:** `createIpsecServer(request: CreateIpsecServerRequest)`

Before you create an IPsec server, you must create a VPN gateway and enable the SSL-VPN feature for the VPN gateway. For more information, see [CreateVpnGateway](https://help.aliyun.com/document_detai.

**Parameters:** (5 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientIpPool` | string | Yes | The client CIDR block from which an IP address is allocated to the virtual network interface control Example: `10.0.0.0/24` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `d7d24a21-f4ba-4454-9173-b38****` |
| `dryRun` | string | No | Specifies whether to only precheck this request. Valid values: Example: `false` |
| `effectImmediately` | boolean | No | Specify whether to start connection negotiations immediately. Valid values: Example: `true` |
| `ikeConfig` | string | No | The configuration of Phase 1 negotiation. Valid values: Example: `{"IkeVersion":"ikev2","IkeMode":"main","IkeEncAlg":"aes","IkeAuthAlg":"sha1","IkePfs":"group2","IkeLifetime":86400}` |
| `ipSecServerName` | string | No | The name of the IPsec server. Example: `test` |
| `ipsecConfig` | string | No | The configuration of Phase 2 negotiation. Valid values: Example: `{"IpsecEncAlg":"aes","IpsecAuthAlg":"sha1","IpsecPfs":"group2","IpsecLifetime":86400}` |
| `localSubnet` | string | Yes | The local CIDR blocks, which are the CIDR blocks of the virtual private cloud (VPC) for the client t Example: `192.168.0.0/24` |
| `psk` | string | No | The pre-shared key. Example: `Cfd123****` |
| `pskEnabled` | boolean | Yes | Indicates whether pre-shared key authentication is enabled. If you set the value to **true**, pre-sh Example: `true` |
| `regionId` | string | Yes | The ID of the region where the VPN gateway is deployed. Example: `cn-hangzhou` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-bp17lofy9fd0dnvzv****` |

## deleteIpsecServer

**Signature:** `deleteIpsecServer(request: DeleteIpsecServerRequest)`

**DeleteIpsecServer** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [DescribeVpnGateway](https://help.aliyun..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-00****` |
| `dryRun` | string | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `ipsecServerId` | string | Yes | The ID of the IPsec server. Example: `iss-bp1jougp8cfsbo8y9****` |
| `regionId` | string | Yes | The ID of the region where the IPsec server is created. Example: `cn-hangzhou` |

## listIpsecServers

**Signature:** `listIpsecServers(request: ListIpsecServersRequest)`

Queries IPsec servers..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ipsecServerId` | string[] | No | The ID of the IPsec server. Example: `iss-bp1bo3xuvcxo7ixll****` |
| `ipsecServerName` | string | No | The name of the IPsec server. Example: `test` |
| `maxResults` | number | No | The number of entries to return on each page. Valid values: **1** to **20**. Default value: **10**. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `caeba0bbb2be03f84eb48b699f0a****` |
| `regionId` | string | Yes | The ID of the region where the IPsec server is created. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the IPsec server belongs. Example: `rg-acfmzs372yg****` |
| `vpnGatewayId` | string | No | The ID of the VPN gateway. Example: `vpn-bp1q8bgx4xnkm2ogj****` |

## updateIpsecServer

**Signature:** `updateIpsecServer(request: UpdateIpsecServerRequest)`

If you modify only **IpsecServerName** of the IPsec server, this operation is synchronous. If you modify other parameters besides **IpsecServerName**, this operation is asynchronous. *   If **UpdateIp.

**Parameters:** (2 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientIpPool` | string | No | The client CIDR block from which an IP address is allocated to the virtual network interface control Example: `10.0.0.0/24` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `e4567-e89b-12d3-a456-42665544****` |
| `dryRun` | string | No | Specifies whether to only precheck this request. Valid values: Example: `false` |
| `effectImmediately` | boolean | No | Specifies whether to delete the negotiated IPsec tunnel and initiate the negotiation again. Valid va Example: `false` |
| `ikeConfig` | string | No | The configuration of Phase 1 negotiations. Valid values: Example: `{"IkeVersion":"ikev2","IkeMode":"main","IkeEncAlg":"aes","IkeAuthAlg":"sha1","IkePfs":"group2","IkeLifetime":86400}` |
| `ipsecConfig` | string | No | The configuration of Phase 2 negotiation. Valid values: Example: `{"IpsecEncAlg":"aes","IpsecAuthAlg":"sha1","IpsecPfs":"group2","IpsecLifetime":86400}` |
| `ipsecServerId` | string | Yes | The IPsec server ID. Example: `iss-bp1bo3xuvcxo7ixll****` |
| `ipsecServerName` | string | No | The name of the IPsec server. Example: `test` |
| `localSubnet` | string | No | The local CIDR blocks, which are the CIDR blocks of the virtual private cloud (VPC) for the client t Example: `192.168.0.0/24,172.17.0.0/16` |
| `psk` | string | No | The pre-shared key. Example: `Cfd123****` |
| `pskEnabled` | boolean | No | Specifies whether to enable pre-shared key authentication. If you set the value to **true**, pre-sha Example: `true` |
| `regionId` | string | Yes | The ID of the region where the IPsec server is created. Example: `cn-shanghai` |

## listIpsecServerLogs

**Signature:** `listIpsecServerLogs(request: ListIpsecServerLogsRequest)`

Queries the logs of an IPsec server..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | number | No | The beginning of the time range to query. The value must be a UNIX timestamp. For example, 167100374 Example: `1671003744` |
| `ipsecServerId` | string | Yes | The ID of the IPsec server. Example: `iss-2zei2n5q5zhirfh73****` |
| `minutePeriod` | number | No | The interval at which log data is queried. Valid values: **1** to **10**. Unit: minutes. Example: `10` |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **1** to **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the IPsec server is created. Example: `cn-hangzhou` |
| `to` | number | No | The end of the time range to query. The value must be a unix timestamp. For example, 1671004344 spec Example: `1671004344` |

## createCustomerGateway

**Signature:** `createCustomerGateway(request: CreateCustomerGatewayRequest)`

Creates a customer gateway..

**Parameters:** (3 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. The tag key cannot be an empty string. Example: `TagKey` |
| `value` | string | No | The tag value. Example: `TagValue` |
| `asn` | string | Yes | The autonomous system number (ASN) of the gateway device in your data center. This parameter is requ Example: `65530` |
| `authKey` | string | No | The authentication key of the BGP routing protocol for the gateway device in the data center. Example: `AuthKey****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44****` |
| `description` | string | No | The description of the customer gateway. Example: `desctest` |
| `ipAddress` | string | Yes | The static IP address of the gateway device in the data center. Example: `101.12.XX.XX` |
| `name` | string | No | The name of the customer gateway. Example: `nametest` |
| `regionId` | string | Yes | The region ID of the customer gateway. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The ID of the resource group to which the customer gateway belongs. Example: `rg-aek2qo2h4jy****` |
| `tags` | CreateCustomerGatewayRequestTags[] | No | The tag value. |

## deleteCustomerGateway

**Signature:** `deleteCustomerGateway(request: DeleteCustomerGatewayRequest)`

Before you delete a customer gateway, make sure that no IPsec-VPN connection is associated with the customer gateway. For more information about how to delete an IPsec-VPN connection, see [DeleteVpnAt.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04****` |
| `customerGatewayId` | string | Yes | The ID of the customer gateway. Example: `cgw-bp1pvpl9r9adju6l5****` |
| `regionId` | string | Yes | The region ID of the customer gateway. You can call the [DescribeRegions](https://help.aliyun.com/do Example: `cn-shanghai` |

## describeCustomerGateway

**Signature:** `describeCustomerGateway(request: DescribeCustomerGatewayRequest)`

Queries details of a customer gateway..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customerGatewayId` | string | Yes | The ID of the customer gateway. Example: `cgw-bp1pvpl9r9adju6l5****` |
| `regionId` | string | Yes | The ID of the region where the customer gateway is deployed. Example: `cn-shanghai` |

## describeCustomerGateways

**Signature:** `describeCustomerGateways(request: DescribeCustomerGatewaysRequest)`

Queries customer gateways..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag. The tag key cannot be an empty string. Example: `TagKey` |
| `value` | string | No | The value of the tag. Example: `TagValue` |
| `customerGatewayId` | string | No | The ID of the customer gateway. Example: `cgw-bp1pvpl9r9adju6l5****` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the customer gateway is deployed. Example: `cn-shanghai` |
| `resourceGroupId` | string | No | The ID of the resource group to which the customer gateway belongs. Example: `rg-acfmzs372yg****` |
| `tag` | DescribeCustomerGatewaysRequestTag[] | No | - |

## modifyCustomerGatewayAttribute

**Signature:** `modifyCustomerGatewayAttribute(request: ModifyCustomerGatewayAttributeRequest)`

When you call **ModifyCustomerGatewayAttribute**, if a value is assigned to **AuthKey**, the operation is asynchronous. After a request is sent, the system returns a request ID and runs the task in th.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authKey` | string | No | The authentication key of the BGP routing protocol for the gateway device in the data center. Example: `AuthKey****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44****` |
| `customerGatewayId` | string | Yes | The ID of the customer gateway. Example: `cgw-bp1pvpl9r9adju6l5****` |
| `description` | string | No | The description of the customer gateway. Example: `desctest` |
| `name` | string | No | The name of the customer gateway. Example: `nametest` |
| `regionId` | string | Yes | The ID of the region where the customer gateway is deployed. Example: `cn-shanghai` |

## modifyTunnelAttribute

**Signature:** `modifyTunnelAttribute(request: ModifyTunnelAttributeRequest)`

Modifies a VPN tunnel..

**Parameters:** (2 required, 26 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tunnelId` | string | Yes | The tunnel ID. Example: `tun-gbyz2e070xzo93****` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec connection. Example: `vco-gw69vm1i71y354****` |
| `localAsn` | number | No | The local autonomous system number (ASN). Valid values: **1** to **4294967295**. Example: `65530` |
| `localBgpIp` | string | No | The BGP IP address of the tunnel. The address needs to be an IP address within the **TunnelCidr**. Example: `169.254.11.1` |
| `tunnelCidr` | string | No | The CIDR block of the tunnel. Example: `169.254.11.0/30` |
| `ikeAuthAlg` | string | No | The authentication algorithm that is used in IKE Phase 1 negotiations. Example: `sha1` |
| `ikeEncAlg` | string | No | The encryption algorithm that is used in IKE Phase 1 negotiations. Example: `aes` |
| `ikeLifetime` | number | No | The SA lifetime as a result of Phase 1 negotiations. Unit: seconds Valid values: **0 to 86400**. Example: `86400` |
| `ikeMode` | string | No | The negotiation mode of IKE. Valid values: Example: `main` |
| `ikePfs` | string | No | The Diffie-Hellman key exchange algorithm that is used in Phase 1 negotiations. Valid values: **grou Example: `group2` |
| `ikeVersion` | string | No | The version of the IKE protocol. Valid values: **ikev1** and **ikev2**. Example: `ikev2` |
| `localId` | string | No | The tunnel identifier. The identifier can be up to 100 characters in length and cannot contain space Example: `47.XX.XX.87` |
| `psk` | string | No | The pre-shared key that is used to verify identities between the tunnel and peer. Example: `123456****` |
| `remoteId` | string | No | The peer identifier. The identifier can be up to 100 characters in length, and cannot contain spaces Example: `47.XX.XX.207` |
| `ipsecAuthAlg` | string | No | The authentication algorithm that is used in IPsec Phase 2 negotiations. Example: `sha1` |
| `ipsecEncAlg` | string | No | The encryption algorithm that is used in IPsec Phase 2 negotiations. Example: `aes` |
| `ipsecLifetime` | number | No | The SA lifetime as a result of Phase 2 negotiations. Unit: seconds Valid values: **0 to 86400**. Example: `86400` |
| ... | ... | ... | *11 more optional parameters* |


## describeSslVpnClients

**Signature:** `describeSslVpnClients(request: DescribeSslVpnClientsRequest)`

If your VPN gateway was created before December 10, 2022, you need to upgrade the VPN gateway to the latest version to view the connection information about SSL clients. For more information, see [Upg.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1** to **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `eu-central-1` |
| `vpnGatewayId` | string | Yes | The ID of the VPN gateway. Example: `vpn-gw8gfb947ctddabja****` |


## describeVpnConnectionLogs

**Signature:** `describeVpnConnectionLogs(request: DescribeVpnConnectionLogsRequest)`

Queries logs of IPsec-VPN connections..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | number | No | The start time of the flow log. This value is a UNIX timestamp representing the number of millisecon Example: `1671003744` |
| `minutePeriod` | number | No | The interval at which log data is collected. Valid values: **1** to **10**. Unit: minutes. Example: `10` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1** to **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `eu-central-1` |
| `to` | number | No | The end time of the flow log. This value is a UNIX timestamp representing the number of milliseconds Example: `1671004344` |
| `tunnelId` | string | No | The ID of the IPsec-VPN connection. Example: `tun-opsqc4d97wni27****` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-m5evqnds4y459flt3****` |


## describeVpnCrossAccountAuthorizations

**Signature:** `describeVpnCrossAccountAuthorizations(request: DescribeVpnCrossAccountAuthorizationsRequest)`

Queries the cross-account authorization information about an IPsec-VPN connection..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Default value: **10**. Valid values: **1** to **50**. Example: `10` |
| `regionId` | string | Yes | The ID of the region to which the IPsec-VPN connection belongs. Example: `cn-hangzhou` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-p0w2jpkhi2eeop6q6****` |


## describeVpnGatewayAvailableZones

**Signature:** `describeVpnGatewayAvailableZones(request: DescribeVpnGatewayAvailableZonesRequest)`

Queries zones that support IPsec-VPN connections in a region..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language in which the returned results are displayed. Valid values: Example: `zh-CN` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `spec` | string | Yes | The bandwidth specification. Example: `5M` |


## describeVpnSslServerLogs

**Signature:** `describeVpnSslServerLogs(request: DescribeVpnSslServerLogsRequest)`

Queries the log entries of an SSL server..

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | number | No | The beginning of the time range to query. The value must be a unix timestamp. For example, 160073896 Example: `1600738962` |
| `minutePeriod` | number | No | The interval at which log data is queried. Unit: minutes. Example: `10` |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the SSL server is created. You can call the [DescribeRegions](https://hel Example: `cn-hangzhou` |
| `sslVpnClientCertId` | string | No | The ID of the SSL client certificate. Example: `vsc-m5euof6s5jy8vs5kd****` |
| `to` | number | No | The end of the time range to query. The value must be a unix timestamp. For example, 1600738962 spec Example: `1600738962` |
| `vpnSslServerId` | string | Yes | The ID of the SSL server. Example: `vss-bp155e9yclsg1xgq4****` |


## diagnoseVpnConnections

**Signature:** `diagnoseVpnConnections(request: DiagnoseVpnConnectionsRequest)`

If the IPsec-VPN connection is in single-tunnel mode, the request parameter `VpnConnectionIds` is required when you call the **DiagnoseVpnConnections** operation. *   If the IPsec-VPN connection is in.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-qingdao` |
| `tunnelIds` | string[] | No | - |
| `vpnConnectionIds` | string[] | No | - |
| `vpnGatewayId` | string | No | The ID of the VPN gateway. Example: `vpn-bp10hz6b0mbp39flt****` |


## getVpnGatewayDiagnoseResult

**Signature:** `getVpnGatewayDiagnoseResult(request: GetVpnGatewayDiagnoseResultRequest)`

When you call the **GetVpnGatewayDiagnoseResult** operation, you must specify one of **DiagnoseId** and **VpnGatewayId**..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001****` |
| `diagnoseId` | string | No | The ID of the diagnostic operation. Example: `vpndgn-uf6kuxbe3iv028k3s****` |
| `regionId` | string | Yes | The region ID of the VPN gateway. Example: `cn-qingdao` |
| `vpnGatewayId` | string | No | The ID of the VPN gateway. Example: `vpn-uf6fzwp0ck3frwtbk****` |


## moveVpnResourceGroup

**Signature:** `moveVpnResourceGroup(request: MoveVpnResourceGroupRequest)`

Moves a VPN gateway resource to a new resource group..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the resource. Example: `vpn-8vb3lzn7biepthri8****` |
| `newResourceGroupId` | string | Yes | The ID of the new resource group. Example: `rg-acfmzs372yg****` |
| `regionId` | string | Yes | The region ID of the resource. Example: `cn-zhangjiakou` |
| `resourceType` | string | Yes | The type of resource. Example: `VpnGateway` |


## createVcoRouteEntry

**Signature:** `createVcoRouteEntry(request: CreateVcoRouteEntryRequest)`

The IPsec-VPN connection must be associated with a transit router. For more information, see [CreateTransitRouterVpnAttachment](https://help.aliyun.com/document_detail/468249.html). *   You cannot cre.

**Parameters:** (5 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `description` | string | No | The description of the destination-based route. Example: `desctest` |
| `nextHop` | string | Yes | The next hop of the destination-based route. Example: `vco-p0w2jpkhi2eeop6q6****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**, which specifies the IPsec tunneling protocol. Example: `Ipsec` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the destination-based route. Example: `192.168.10.0/24` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-p0w2jpkhi2eeop6q6****` |
| `weight` | number | Yes | The weight of the destination-based route. Valid values: Example: `100` |


## deleteVcoRouteEntry

**Signature:** `deleteVcoRouteEntry(request: DeleteVcoRouteEntryRequest)`

**DeleteVcoRouteEntry** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVpnConnection](https://hel.

**Parameters:** (5 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `nextHop` | string | Yes | The next hop of the destination-based route that you want to delete. Example: `vco-p0w5112fgnl2ihlmf****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**, which specifies the IPsec tunneling protocol. Example: `Ipsec` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the destination-based route that you want to delete. Example: `192.168.10.0/24` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN attachment. Example: `vco-p0w5112fgnl2ihlmf****` |
| `weight` | number | Yes | The weight of the destination-based route that you want to delete. Valid values: Example: `100` |


## describeVcoRouteEntries

**Signature:** `describeVcoRouteEntries(request: DescribeVcoRouteEntriesRequest)`

Queries the routes of an IPsec-VPN connection..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Default value: **10**. Valid values: **1** to **50**. Example: `10` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |
| `routeEntryType` | string | No | The route type. Valid values: Example: `custom` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-p0w2jpkhi2eeop6q6****` |


## modifyVcoRouteEntryWeight

**Signature:** `modifyVcoRouteEntryWeight(request: ModifyVcoRouteEntryWeightRequest)`

**ModifyVcoRouteEntryWeight** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeVpnConnection](https.

**Parameters:** (6 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-4266****` |
| `newWeight` | number | Yes | The new weight of the destination-based route that you want to modify. Valid values: Example: `0` |
| `nextHop` | string | Yes | The next hop of the destination-based route that you want to modify. Example: `vco-p0w2jpkhi2eeop6q6****` |
| `overlayMode` | string | No | The tunneling protocol. Set the value to **Ipsec**, which specifies the IPsec tunneling protocol. Example: `Ipsec` |
| `regionId` | string | Yes | The region ID of the IPsec-VPN connection. Example: `cn-hangzhou` |
| `routeDest` | string | Yes | The destination CIDR block of the destination-based route that you want to modify. Example: `192.168.10.0/24` |
| `vpnConnectionId` | string | Yes | The ID of the IPsec-VPN connection. Example: `vco-p0w2jpkhi2eeop6q6****` |
| `weight` | number | Yes | The current weight of the destination-based route that you want to modify. Valid values: Example: `100` |

