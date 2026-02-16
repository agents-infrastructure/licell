# BGP Routing

BGP groups, peers, and network routes for Express Connect.

## createBgpGroup

**Signature:** `createBgpGroup(request: CreateBgpGroupRequest)`

You can connect a VBR to a data center through BGP. Each BGP group is associated with a VBR. You can add a BGP peer that needs to communicate with a VBR to a BGP group and advertise the BGP network in.

**Parameters:** (3 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authKey` | string | No | The authentication key of the BGP group. Example: `!PWZ2****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the BGP group. Example: `BGP` |
| `ipVersion` | string | No | The IP version. Valid values: Example: `IPv4` |
| `isFakeAsn` | boolean | No | Specifies whether to use a fake ASN. Valid values: Example: `true` |
| `localAsn` | number | No | The custom ASN on the Alibaba Cloud side. Valid values: Example: `45104` |
| `name` | string | No | The name of the BGP group. Example: `test` |
| `peerAsn` | number | Yes | The ASN of the gateway device in the data center. Example: `1****` |
| `regionId` | string | Yes | The region ID of the VBR. Example: `cn-shanghai` |
| `routeQuota` | number | No | The maximum number of routes supported by a BGP peer. Default value: **110**. Example: `110` |
| `routerId` | string | Yes | The ID of the VBR. Example: `vbr-bp1ctxy813985gkuk****` |

## deleteBgpGroup

**Signature:** `deleteBgpGroup(request: DeleteBgpGroupRequest)`

Deletes a Border Gateway Protocol (BGP) group..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgpGroupId` | string | Yes | The ID of the BGP group. Example: `bgpg-bp1k25cyp26cllath****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the BGP group. Example: `cn-hangzhou` |

## describeBgpGroups

**Signature:** `describeBgpGroups(request: DescribeBgpGroupsRequest)`

Queries Border Gateway Protocol (BGP) groups in a region..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgpGroupId` | string | No | The ID of the BGP group. Example: `bgpg-bp1k25cyp26cllath****` |
| `isDefault` | boolean | No | Specifies whether the BGP group is the default one. Valid values: Example: `false` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. The maximum value is **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region in which the VBR is deployed. Example: `cn-shanghai` |
| `routerId` | string | No | The ID of the virtual border router (VBR) that is associated with the BGP group. Example: `vbr-bp1ctxy813985gkuk****` |

## modifyBgpGroupAttribute

**Signature:** `modifyBgpGroupAttribute(request: ModifyBgpGroupAttributeRequest)`

Modifies the configuration of a Border Gateway Protocol (BGP) group..

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authKey` | string | No | The authentication key of the BGP group. Example: `!PWZ2****` |
| `bgpGroupId` | string | Yes | The BGP group ID. Example: `bgpg-wz9f62v4fbg2g****` |
| `clearAuthKey` | boolean | No | Specifies whether to clear the secret key. Valid values: Example: `false` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The BGP group description. Example: `BGP` |
| `isFakeAsn` | boolean | No | Specifies whether to use a fake AS number. Valid values: Example: `false` |
| `localAsn` | number | No | The custom autonomous system number (ASN) of the BGP on the Alibaba Cloud side. Valid values: Example: `45104` |
| `name` | string | No | The BGP group name. Example: `test` |
| `peerAsn` | number | No | The ASN of the gateway device in the data center. Example: `1****` |
| `regionId` | string | Yes | The region ID of the BGP group. Example: `cn-shanghai` |
| `routeQuota` | number | No | The maximum number of routes supported by a BGP peer. Default value: **110**. Example: `110` |

## createBgpPeer

**Signature:** `createBgpPeer(request: CreateBgpPeerRequest)`

Adds a Border Gateway Protocol (BGP) peer to a BGP group..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bfdMultiHop` | number | Yes | The BFD hop count. Valid values: **1** to **255**. Example: `3` |
| `bgpGroupId` | string | Yes | The ID of the BGP group. Example: `bgpg-wz9f62v4fbg****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `enableBfd` | boolean | No | Specifies whether to enable the Bidirectional Forwarding Detection (BFD) feature. Valid values: Example: `true` |
| `ipVersion` | string | No | The IP version. Valid values: Example: `IPv4` |
| `peerIpAddress` | string | No | The IP address of the BGP peer. Example: `116.62.XX.XX` |
| `regionId` | string | Yes | The ID of the region to which the BGP group belongs. Example: `cn-shanghai` |

## deleteBgpPeer

**Signature:** `deleteBgpPeer(request: DeleteBgpPeerRequest)`

Deletes a Border Gateway Protocol (BGP) peer..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgpPeerId` | string | Yes | The ID of the BGP peer. Example: `bgp-wz977wcrmb69a********` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the BGP group. Example: `cn-shanghai` |

## describeBgpPeers

**Signature:** `describeBgpPeers(request: DescribeBgpPeersRequest)`

Queries Border Gateway Protocol (BGP) peers in a region..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bgpGroupId` | string | No | The ID of the BGP group to which the BGP peer that you want to query belongs. Example: `bgpg-2zev8h2wo414sfh****` |
| `bgpPeerId` | string | No | The ID of the BGP peer that you want to query. Example: `bgp-2ze3un0ft1jd1xd****` |
| `isDefault` | boolean | No | Specifies whether the BGP group is the default group. Valid values: Example: `false` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the BGP group to which the BGP peer that you want to query belongs. Example: `cn-shanghai` |
| `routerId` | string | No | The ID of the virtual border router (VBR) that is associated with the BGP peer that you want to quer Example: `vbr-2zecmmvg5gvu8i4te****` |

## modifyBgpPeerAttribute

**Signature:** `modifyBgpPeerAttribute(request: ModifyBgpPeerAttributeRequest)`

Modifies the configuration of a BGP peer..

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bfdMultiHop` | number | Yes | The BFD hop count. Valid values: **1** to **255**. Example: `3` |
| `bgpGroupId` | string | No | The ID of the BGP group to which the BGP peer that you want to modify belongs. Example: `bgpg-m5eo12jxuw2hc0uqq****` |
| `bgpPeerId` | string | Yes | The ID of the BGP peer that you want to modify. Example: `bgp-m5eoyp2mwegk8ce9v****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `enableBfd` | boolean | No | Specifies whether to enable the Bidirectional Forwarding Detection (BFD) feature. Valid values: Example: `false` |
| `peerIpAddress` | string | No | The IP address of the BGP peer that you want to modify. Example: `116.62.XX.XX` |
| `regionId` | string | Yes | The region ID of the BGP group to which the BGP peer that you want to modify belongs. Example: `cn-shanghai` |

## addBgpNetwork

**Signature:** `addBgpNetwork(request: AddBgpNetworkRequest)`

Advertises a Border Gateway Protocol (BGP) network..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dstCidrBlock` | string | Yes | The CIDR block of the virtual private cloud (VPC) or vSwitch that you want to connect to a data cent Example: `10.10.XX.XX/32` |
| `regionId` | string | Yes | The region ID of the virtual border router (VBR) group. Example: `cn-shanghai` |
| `routerId` | string | Yes | The ID of the router that is associated with the router interface. Example: `vrt-2zeo3xzyf38r4u******` |
| `vpcId` | string | No | The ID of the VPC. Example: `vpc-bp1qpo0kug3a2*****` |

## deleteBgpNetwork

**Signature:** `deleteBgpNetwork(request: DeleteBgpNetworkRequest)`

Deletes an advertised Border Gateway Protocol (BGP) network..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dstCidrBlock` | string | Yes | The CIDR block of the virtual private cloud (VPC) or vSwitch that you want to connect to a data cent Example: `10.110.192.12/32` |
| `regionId` | string | Yes | The region ID of the BGP group. Example: `cn-hangzhou` |
| `routerId` | string | Yes | The ID of the VBR. Example: `vrt-bp1lhl0taikrteen8****` |

## describeBgpNetworks

**Signature:** `describeBgpNetworks(request: DescribeBgpNetworksRequest)`

Queries advertised Border Gateway Protocol (BGP) networks..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `pageNumber` | number | No | The number of the returned page. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. The maximum value is **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the BGP group. Example: `cn-hangzhou` |
| `routerId` | string | No | The ID of the VBR. Example: `vrt-bp1lhl0taikrteen8****` |

