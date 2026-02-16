# VPC Management

VPC CRUD, CIDR blocks, DHCP options, IPv6, and vRouter management.

## createVpc

**Signature:** `createVpc(request: CreateVpcRequest)`

When you call this operation, take note of the following items: *   You can specify only one CIDR block for each VPC. *   After you create a VPC, you cannot change its CIDR block. However, you can add.

**Parameters:** (1 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify at most 20 tag keys. The tag key cannot be  Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `cidrBlock` | string | No | The CIDR block of the VPC. Example: `172.16.0.0/12` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the VPC. Example: `This` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `enableDnsHostname` | boolean | No | Whether to enable the DNS hostname feature. Values: - **false** (default): Not enabled.  - **true**: Example: `false` |
| `enableIpv6` | boolean | No | Indicates whether IPv6 is enabled. Valid values: Example: `false` |
| `ipv4CidrMask` | number | No | Allocate VPC from the IPAM address pool by inputting a mask. > When creating a VPC with a specified  Example: `12` |
| `ipv4IpamPoolId` | string | No | The ID of the IP Address Manager (IPAM) pool of the IPv4 type. Example: `ipam-pool-sycmt3p2a9v63i****` |
| `ipv6CidrBlock` | string | No | The IPv6 CIDR block of the VPC. If you enable IPv6 for a VPC, the system allocates an IPv6 CIDR bloc Example: `2408:XXXX:0:6a::/56` |
| `ipv6CidrMask` | number | No | Add an IPv6 CIDR block from the IPAM pool to the VPC by entering a mask. Example: `56` |
| `ipv6IpamPoolId` | string | No | The ID of the IP Address Manager (IPAM) pool of the IPv6 type. Example: `ipam-pool-bp1aq51kkfh477z03****` |
| `ipv6Isp` | string | No | The type of the IPv6 CIDR block of the VPC. Valid values: Example: `BGP` |
| `regionId` | string | Yes | The ID of the region to which the VPC belongs. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazb4ph6aiy****` |
| `tag` | CreateVpcRequestTag[] | No | - |
| `userCidr` | string | No | The user CIDR block. Separate user CIDR blocks with commas (,). You can specify up to three user CID Example: `192.168.0.0/12` |
| `vpcName` | string | No | The name of the VPC. Example: `abc` |

## deleteVpc

**Signature:** `deleteVpc(request: DeleteVpcRequest)`

When you call this operation, take note of the following limits: *   Before you delete a VPC, make sure that all resources deployed in the VPC are released or removed, such as vSwitches, instances, an.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `forceDelete` | boolean | No | Specifies whether to forcefully delete the VPC. Valid values: Example: `false` |
| `regionId` | string | No | The ID of the region where the VPC is deployed. Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC that you want to delete. Example: `vpc-bp1m7v25emi1h5mtc****` |

## describeVpcs

**Signature:** `describeVpcs(request: DescribeVpcsRequest)`

Queries virtual private clouds (VPCs)..

**Parameters:** (1 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify at most 20 tag keys. The tag key cannot be  Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `dhcpOptionsSetId` | string | No | The ID of the DHCP options set. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `enableIpv6` | boolean | No | Query for VPCs in the specified region that have enabled IPv6 CIDR blocks. The value is empty by def Example: `false` |
| `isDefault` | boolean | No | Specifies whether to query the default VPC in the specified region. Valid values: Example: `false` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the VPC. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the VPC to be queried belongs. Example: `rg-acfmxvfvazb4p****` |
| `tag` | DescribeVpcsRequestTag[] | No | - |
| `vpcId` | string | No | The VPC ID. Example: `vpc-bp1b1xjllp3ve5yze****` |
| `vpcName` | string | No | The name of the VPC. Example: `Vpc-1` |
| `vpcOwnerId` | number | No | The ID of the Alibaba Cloud account to which the VPC belongs. Example: `253460731706911258` |

## modifyVpcAttribute

**Signature:** `modifyVpcAttribute(request: ModifyVpcAttributeRequest)`

## [](#)Description You cannot repeatedly call the **ModifyVpcAttribute** operation to modify the name and description of a VPC within the specified period of time..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidrBlock` | string | No | The new IPv4 CIDR block of the VPC. Example: `192.168.0.0/24` |
| `description` | string | No | The new description of the VPC. Example: `This` |
| `enableDnsHostname` | boolean | No | Indicates whether the DNS hostname feature is enabled. Valid values: Example: `false` |
| `enableIPv6` | boolean | No | Specifies whether to enable IPv6 CIDR blocks. Valid values: Example: `false` |
| `ipv6CidrBlock` | string | No | The IPv6 CIDR block of the VPC. Example: `2408:XXXX:0:6a::/56` |
| `ipv6Isp` | string | No | The type of IPv6 CIDR block. Valid values: Example: `BGP` |
| `regionId` | string | No | The region ID of the VPC. Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC that you want to modify. Example: `vpc-bp1qtbach57ywecf****` |
| `vpcName` | string | No | The new name of the VPC. Example: `Vpc-1` |

## createDefaultVpc

**Signature:** `createDefaultVpc(request: CreateDefaultVpcRequest)`

## Usage notes When you call this operation, take note of the following items: *   After you create a default VPC, you cannot change its CIDR block. However, you can add secondary IPv4 CIDR blocks to .

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `enableIpv6` | boolean | No | Specifies whether to enable IPv6. Valid values: Example: `false` |
| `ipv6CidrBlock` | string | No | The IPv6 CIDR block of the default VPC. Example: `2408:XXXX:346:b600::/56` |
| `regionId` | string | Yes | The ID of the region to which the default VPC belongs. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmystnjq4****` |

## enableVpcClassicLink

**Signature:** `enableVpcClassicLink(request: EnableVpcClassicLinkRequest)`

Enables ClassicLink for a VPC..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the VPC for which you want to enable ClassicLink. Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC. Example: `vpc-bp1m7v25emi1h5mtc****` |

## disableVpcClassicLink

**Signature:** `disableVpcClassicLink(request: DisableVpcClassicLinkRequest)`

Disables ClassicLink for a virtual private cloud (VPC)..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the VPC for which you want to disable ClassicLink. Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC for which you want to disable ClassicLink. Example: `vpc-bp1m7v25emi1h5mtc****` |

## associateVpcCidrBlock

**Signature:** `associateVpcCidrBlock(request: AssociateVpcCidrBlockRequest)`

## [](#) *   Take note of the following limits: *   Each VPC can contain up to five secondary IPv4 CIDR blocks. *   Each VPC can contain up to five secondary IPv6 CIDR blocks. *   You cannot repeatedl.

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `IPv6CidrBlock` | string | No | The IPv6 CIDR block that you want to add to the VPC. Example: `2408:XXXX:0:6a::/56` |
| `ipVersion` | string | No | The version of the IP address. Valid values: Example: `IPV4` |
| `ipamPoolId` | string | No | The ID of the IPAM pool. Example: `ipam-pool-sycmt3p2a9v63i****` |
| `ipv6CidrMask` | number | No | Add an IPv6 CIDR block from the IPAM pool to the VPC by entering a mask. Example: `56` |
| `ipv6Isp` | string | No | The type of the IPv6 CIDR block. Valid values: Example: `BGP` |
| `regionId` | string | No | The region ID of the VPC to which you want to add a secondary CIDR block. Example: `ch-hangzhou` |
| `secondaryCidrBlock` | string | No | The IPv4 CIDR block to be added. Take note of the following requirements: Example: `192.168.0.0/16` |
| `secondaryCidrMask` | number | No | Add an IPv4 CIDR block from the IPAM pool to the VPC by specifying a mask. Example: `16` |
| `vpcId` | string | Yes | The ID of the VPC to which you want to add a secondary CIDR block. Example: `vpc-o6wrloqsdqc9io3mg****` |

## unassociateVpcCidrBlock

**Signature:** `unassociateVpcCidrBlock(request: UnassociateVpcCidrBlockRequest)`

Before you delete a secondary CIDR block from a VPC, delete the vSwitch which is created with the CIDR block. For more information, see [DeleteVSwitch](https://help.aliyun.com/document_detail/35746.ht.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `IPv6CidrBlock` | string | No | The secondary IPv6 CIDR block to be deleted. Example: `2408:XXXX:0:6a::/56` |
| `regionId` | string | Yes | The region ID of the VPC to which the secondary CIDR block to be deleted belongs. Example: `ch-hangzhou` |
| `secondaryCidrBlock` | string | No | The secondary IPv4 CIDR block to be deleted. Example: `192.168.0.0/16` |
| `vpcId` | string | Yes | The ID of the VPC from which you want to delete a secondary CIDR block. Example: `vpc-o6wrloqsdqc9io3mg****` |

## allocateVpcIpv6Cidr

**Signature:** `allocateVpcIpv6Cidr(request: AllocateVpcIpv6CidrRequest)`

# [](#) The following section describes how to allocate an IPv6 CIDR block to a virtual private cloud (VPC): 1.  Call the AllocateVpcIpv6Cidr operation to reserve the IPv6 CIDR block. 2.  To allocate .

**Parameters:** See `AllocateVpcIpv6CidrRequest` model.

## checkCanAllocateVpcPrivateIpAddress

**Signature:** `checkCanAllocateVpcPrivateIpAddress(request: CheckCanAllocateVpcPrivateIpAddressRequest)`

Checks whether a private IP address in a specified vSwitch is available..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ipVersion` | string | No | The version of the private IP address. Valid values: Example: `ipv4` |
| `privateIpAddress` | string | Yes | To query whether a private IP address is available, the private IP address must belong to the vSwitc Example: `10.0.0.7` |
| `regionId` | string | Yes | The region ID of the vSwitch to which the private IP address that you want to query belongs. Example: `cn-qingdao` |
| `vSwitchId` | string | Yes | The ID of the vSwitch to which the private IP address to be queried belongs. Example: `vsw-m5ew3t46z2drmifnt****` |

## describeVpcAttribute

**Signature:** `describeVpcAttribute(request: DescribeVpcAttributeRequest)`

Queries the configuration of a virtual private cloud (VPC)..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `isDefault` | boolean | No | Specifies whether the VPC is the default VPC. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region where the VPC is deployed. Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC that you want to query. Example: `vpc-bp18sth14qii3pnv****` |

## listVpcEndpointServicesByEndUser

**Signature:** `listVpcEndpointServicesByEndUser(request: ListVpcEndpointServicesByEndUserRequest)`

Queries available endpoint services..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | The number of entries to return per page. Valid values: **1** to **100**. Default value: **20**. Example: `20` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the gateway endpoint. Example: `cn-hangzhou` |
| `serviceName` | string | No | The name of the endpoint service that you want to query. Example: `com.aliyun.cn-hangzhou.oss` |

## attachDhcpOptionsSetToVpc

**Signature:** `attachDhcpOptionsSetToVpc(request: AttachDhcpOptionsSetToVpcRequest)`

The **AttachDhcpOptionsSetToVpc** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system background. You .

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dhcpOptionsSetId` | string | Yes | The ID of the DHCP options set. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `regionId` | string | Yes | The region to which the DHCP options set belongs. You can call the [DescribeRegions](https://help.al Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC to be associated with the DHCP options set. Example: `vpc-sfdkfdjkdf****` |

## detachDhcpOptionsSetFromVpc

**Signature:** `detachDhcpOptionsSetFromVpc(request: DetachDhcpOptionsSetFromVpcRequest)`

## [](#)Description *   **DetachDhcpOptionsSetFromVpc** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [De.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dhcpOptionsSetId` | string | Yes | The ID of the DHCP options set to be disassociated from a VPC. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region to which the DHCP options set belongs. You can call the [DescribeRegions](https://help.al Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC. Example: `vpc-dfdgrgthhy****` |

## openPhysicalConnectionService

**Signature:** `openPhysicalConnectionService(request: OpenPhysicalConnectionServiceRequest)`

Enables billing for outbound data transfer..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The ID of the region where the Express Connect circuit is deployed. Example: `cn-hangzhou` |

## openTrafficMirrorService

**Signature:** `openTrafficMirrorService(request: OpenTrafficMirrorServiceRequest)`

## [](#)Usage notes You can enable traffic mirror for different regions. You cannot repeatedly call the **OpenTrafficMirrorService** operation to enable traffic mirror for one region within the specif.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655442222` |
| `regionId` | string | No | The ID of the region to which the mirrored traffic belongs. Example: `cn-hangzhou` |

## attachVbrToVpconn

**Signature:** `attachVbrToVpconn(request: AttachVbrToVpconnRequest)`

Associates a virtual border router (VBR) with a hosted connection..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region ID of the hosted connection. Example: `cn-hangzhou` |
| `token` | string | No | The client token that is used to ensure the idempotence of the request. Example: `CBCE910E-D396-4944-8****` |
| `vbrId` | string | Yes | The ID of the VBR. Example: `vbr-bp133sn3nwjvu7twc****` |
| `vpconnId` | string | Yes | The ID of the hosted connection. Example: `pc-bp1mrgfbtmc9brre7****` |

## describeVRouters

**Signature:** `describeVRouters(request: DescribeVRoutersRequest)`

Queries vRouters in a region..

**Parameters:** See `DescribeVRoutersRequest` model.

## modifyVRouterAttribute

**Signature:** `modifyVRouterAttribute(request: ModifyVRouterAttributeRequest)`

You cannot repeatedly call the **ModifyVRouterAttribute** operation within a specific period of time..

**Parameters:** See `ModifyVRouterAttributeRequest` model.

## createDhcpOptionsSet

**Signature:** `createDhcpOptionsSet(request: CreateDhcpOptionsSetRequest)`

**CreateDhcpOptionsSet** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [GetDhcpOptionsSet](https://help.aliyu.

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dhcpOptionsSetDescription` | string | No | The description of the DHCP options set. Example: `description` |
| `dhcpOptionsSetName` | string | No | The name of the DHCP options set. Example: `name` |
| `domainName` | string | No | The root domain. For example, you can set the value to example.com. Example: `example.com` |
| `domainNameServers` | string | No | The IP address of the DNS server. You can enter at most four DNS server IP addresses. Separate IP ad Example: `192.XX.XX.123` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Example: `false` |
| `ipv6LeaseTime` | string | No | The lease time of the IPv6 addresses for the DHCP options set. Example: `3650d` |
| `leaseTime` | string | No | The lease time of the IPv4 addresses for the DHCP options set. Example: `3650d` |
| `regionId` | string | Yes | The region to which the DHCP options set belongs. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the DHCP options set belongs. Example: `rg-acfmxazb4ph****` |
| `tag` | CreateDhcpOptionsSetRequestTag[] | No | - |

## deleteDhcpOptionsSet

**Signature:** `deleteDhcpOptionsSet(request: DeleteDhcpOptionsSetRequest)`

## [](#)Description *   **DeleteDhcpOptionsSet** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [GetDhcpOp.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dhcpOptionsSetId` | string | Yes | The ID of the DHCP options set to be deleted. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The region of the DHCP options set to be deleted. You can call the [DescribeRegions](https://help.al Example: `cn-hangzhou` |

## getDhcpOptionsSet

**Signature:** `getDhcpOptionsSet(request: GetDhcpOptionsSetRequest)`

Queries a DHCP options set..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dhcpOptionsSetId` | string | Yes | The ID of the DHCP options set. Example: `dopt-o6w0df4epg9zo8isy****` |
| `regionId` | string | Yes | The region ID of the DHCP options set that you want to query. Example: `cn-hangzhou` |

## listDhcpOptionsSets

**Signature:** `listDhcpOptionsSets(request: ListDhcpOptionsSetsRequest)`

Queries Dynamic Host Configuration Protocol (DHCP) options sets..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify up to 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `dhcpOptionsSetId` | string[] | No | The ID of the DHCP options set. You can specify at most 20 IDs. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dhcpOptionsSetName` | string | No | The name of the DHCP options set. Example: `test` |
| `domainName` | string | No | The root domain. For example, you can set the value to example.com. Example: `example.com` |
| `maxResults` | number | No | The number of entries per page. Valid values: **1** to **100**. Default value: **10**. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the DHCP options sets that you want to query. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the DHCP options set belongs. Example: `rg-acfmxazb4ph****` |
| `tags` | ListDhcpOptionsSetsRequestTags[] | No | - |

## updateDhcpOptionsSetAttribute

**Signature:** `updateDhcpOptionsSetAttribute(request: UpdateDhcpOptionsSetAttributeRequest)`

修改Dhcp选项集信息.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dhcpOptionsSetDescription` | string | No | Enter a description for the DHCP options set. Example: `description` |
| `dhcpOptionsSetId` | string | Yes | The ID of the DHCP options set. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dhcpOptionsSetName` | string | No | The name of the DHCP options set. Example: `name` |
| `domainName` | string | No | The root domain. For example, you can set the value to example.com. Example: `example.com` |
| `domainNameServers` | string | No | The IP address of the DNS server. You can enter at most four DNS server IP addresses. Separate IP ad Example: `192.XX.XX.123` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `ipv6LeaseTime` | string | No | The lease time of the IPv6 addresses for the DHCP options set. Example: `3650d` |
| `leaseTime` | string | No | The lease time of the IPv4 addresses for the DHCP options set. Example: `3650d` |
| `regionId` | string | Yes | The region where the DHCP options set is deployed. You can call the [DescribeRegions](https://help.a Example: `cn-hangzhou` |

## getIpv4GatewayAttribute

**Signature:** `getIpv4GatewayAttribute(request: GetIpv4GatewayAttributeRequest)`

Queries an IPv4 gateway..

**Parameters:** See `GetIpv4GatewayAttributeRequest` model.

## listIpv4Gateways

**Signature:** `listIpv4Gateways(request: ListIpv4GatewaysRequest)`

Queries IPv4 gateways..

**Parameters:** See `ListIpv4GatewaysRequest` model.

## changeResourceGroup

**Signature:** `changeResourceGroup(request: ChangeResourceGroupRequest)`

## [](#) You cannot repeatedly call the **ChangeResourceGroup** operation to modify the resource group of the same Express Connect circuit..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newResourceGroupId` | string | Yes | The ID of the new resource group. Example: `rg-bp1drpcfz9srr393h****` |
| `regionId` | string | Yes | The ID of the region to which the new resource group belongs. Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The ID of the Express Connect circuit whose resource group you want to modify. Example: `pc-bp16qjewdsunr41m1****` |
| `resourceType` | string | Yes | The type of the resource. Valid values: Example: `PHYSICALCONNECTION` |

## moveResourceGroup

**Signature:** `moveResourceGroup(request: MoveResourceGroupRequest)`

Moves a resource to another resource group..

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newResourceGroupId` | string | Yes | The ID of the resource group to which you want to move the resource. Example: `rg-acfm3peow3k****` |
| `regionId` | string | Yes | The ID of the region to which the cloud resource belongs. Example: `cn-hangzhou` |
| `resourceId` | string | Yes | The resource ID. Example: `vpc-hp31psbg8ec3023s6****` |
| `resourceType` | string | Yes | The type of the resource for which you want to modify the resource group. Valid values: Example: `vpc` |

## deletionProtection

**Signature:** `deletionProtection(request: DeletionProtectionRequest)`

After you enable deletion protection for an instance, you cannot delete the instance. You must disable deletion protection before you can delete the instance..

**Parameters:** (4 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `instanceId` | string | Yes | The ID of the instance for which you want to enable deletion protection. Example: `eip-uf6id7gvguruxe41v****` |
| `protectionEnable` | boolean | Yes | Specifies whether to enable deletion protection. Valid values: Example: `true` |
| `regionId` | string | Yes | The ID of the region where the instance for which you want to enable deletion protection is deployed Example: `cn-hangzhou` |
| `type` | string | Yes | The type of instance. Valid values: Example: `EIP` |


## replaceVpcDhcpOptionsSet

**Signature:** `replaceVpcDhcpOptionsSet(request: ReplaceVpcDhcpOptionsSetRequest)`

The **ReplaceVpcDhcpOptionsSet** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system background. You c.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dhcpOptionsSetId` | string | Yes | The ID of the new DHCP options set. Example: `dopt-o6w0df4epg9zo8isy****` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `regionId` | string | Yes | The region to which the DHCP options set belongs. You can call the [DescribeRegions](https://help.al Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the associated VPC. Example: `vpc-dsferghthth****` |


## describeVpcGrantRulesToEcr

**Signature:** `describeVpcGrantRulesToEcr(request: DescribeVpcGrantRulesToEcrRequest)`

Queries the cross-account authorization information of an ECR for a specified network instance..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag. You must specify at least one tag key and at most 20 tag keys. The tag key canno Example: `FinanceDept` |
| `value` | string | No | The value of the tag. You can enter a maximum of 20 tag values. The tag value can be an empty string Example: `FinanceJoshua` |
| `ecrInstanceId` | string | No | The ID of the ECR that you want to query. Example: `ecr-ncxadcujadncsa****` |
| `ecrOwnerId` | number | No | The ID of the Alibaba Cloud account to which the ECR belongs. Example: `192732132151****` |
| `instanceId` | string | No | The ID of the network instance. Example: `vpc-wz9ek66wd7tl5xqpy****` |
| `instanceType` | string | No | The type of instance. Valid values: Example: `VPC` |
| `maxResults` | number | No | The number of entries to return per page. Valid values: **1** to **100**. Default value: **10**. Example: `50` |
| `nextToken` | string | No | A pagination token. It can be used in the next request to retrieve a new page of results. Valid valu Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The region ID of the network instance that you want to query. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the network instance belongs. Example: `rg-acfmxazb4ph6aiy****` |
| `tags` | DescribeVpcGrantRulesToEcrRequestTags[] | No | - |

