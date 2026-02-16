# Security Group

Security group CRUD and rule authorization/revocation.

## createSecurityGroup

**Signature:** `createSecurityGroup(request: CreateSecurityGroupRequest)`

By default, the internal access control policy (InnerAccessPolicy) of the basic security group that you create by calling this operation is internal interconnectivity (**Accept**). You can call the [M.

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag to add to the security group. Example: `TestKey` |
| `value` | string | No | The value of the tag to add to the security group. Example: `TestValue` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the security group. The description must be 2 to 256 characters in length. It can Example: `testDescription` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the security group belongs. Example: `rg-bp67acfmxazb4p****` |
| `securityGroupName` | string | No | The name of the security group. The name must be 2 to 128 characters in length. The name must start  Example: `testSecurityGroupName` |
| `securityGroupType` | string | No | The type of the security group. Valid values: Example: `enterprise` |
| `serviceManaged` | boolean | No | This parameter is not publicly available. Example: `false` |
| `tag` | CreateSecurityGroupRequestTag[] | No | - |
| `vpcId` | string | No | The ID of the VPC in which you want to create the security group. Example: `vpc-bp1opxu1zkhn00gzv****` |

## deleteSecurityGroup

**Signature:** `deleteSecurityGroup(request: DeleteSecurityGroupRequest)`

Make sure that no Elastic Compute Service (ECS) instances exist in the security group. You can query instances by calling the [DescribeInstances](https://help.aliyun.com/document_detail/2679689.html) .

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The security group ID. You can call the [DescribeSecurityGroups](https://help.aliyun.com/document_de Example: `sg-bp1fg655nh68xyz9****` |

## describeSecurityGroups

**Signature:** `describeSecurityGroups(request: DescribeSecurityGroupsRequest)`

**Paged query**: We recommend that you specify `MaxResults` and `NextToken`. *   If the response does not include `NextToken`, the current page of results is the last page and no more results are to b.

**Parameters:** (1 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the security group. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the security group. Valid values of N: 1 to 20. Example: `TestValue` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `fuzzyQuery` | boolean | No | > This parameter is deprecated. Example: `null` |
| `isQueryEcsCount` | boolean | No | Specifies whether to query the capacity of the security group. If you set this parameter to True, th Example: `null` |
| `maxResults` | number | No | The maximum number of entries per page. If you specify this parameter, both `MaxResults` and `NextTo Example: `10` |
| `networkType` | string | No | The network type of the security group. Valid values: Example: `vpc` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `e71d8a535bd9cc11` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the security group belongs. If this parameter is specified to  Example: `rg-bp67acfmxazb4p****` |
| `securityGroupId` | string | No | The security group ID. Example: `sg-bp67acfmxazb4p****` |
| `securityGroupIds` | string | No | The security group IDs. Set this parameter to a JSON array that consists of up to 100 security group Example: `["sg-bp67acfmxazb4p****",` |
| `securityGroupName` | string | No | The name of the security group. Example: `SGTestName` |
| `securityGroupType` | string | No | The type of the security group. Valid values: Example: `normal` |
| `serviceManaged` | boolean | No | Specifies whether to query managed security groups. Valid values: Example: `false` |
| `tag` | DescribeSecurityGroupsRequestTag[] | No | - |
| `vpcId` | string | No | The ID of the virtual private cloud (VPC) to which the security group belongs. Example: `vpc-bp67acfmxazb4p****` |

## describeSecurityGroupAttribute

**Signature:** `describeSecurityGroupAttribute(request: DescribeSecurityGroupAttributeRequest)`

Queries the details of a specified security group and the security group rules of the security group..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attribute` | string | No | The attributes of the security group. Valid value: snapshotPolicyIds: queries information about snap Example: `snapshotPolicyIds` |
| `direction` | string | No | The direction in which the security group rule is applied. Valid values: Example: `all` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `500` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAAdDWBF2****` |
| `nicType` | string | No | The network interface controller (NIC) type of the security group rule. Example: `intranet` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. Example: `sg-bp1gxw6bznjjvhu3****` |

## describeSecurityGroupReferences

**Signature:** `describeSecurityGroupReferences(request: DescribeSecurityGroupReferencesRequest)`

If you cannot delete a security group by calling the [DeleteSecurityGroup](https://help.aliyun.com/document_detail/25558.html) operation, call the DescribeSecurityGroupReferences operation to check wh.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The ID of the region. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/256 Example: `cn-hangzhou` |
| `securityGroupId` | string[] | Yes | The IDs of security groups. You can specify up to 10 IDs of security groups. Example: `sg-bp14vtedjtobkvi****` |

## modifySecurityGroupAttribute

**Signature:** `modifySecurityGroupAttribute(request: ModifySecurityGroupAttributeRequest)`

Modifies the name or description of a specific security group..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The new description of the security group. The description must be 2 to 256 characters in length and Example: `TestDescription` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The security group ID. Example: `sg-bp67acfmxazb4p****` |
| `securityGroupName` | string | No | The new name of the security group. The name must be 2 to 128 characters in length. The name must st Example: `SecurityGroupTestName` |

## modifySecurityGroupPolicy

**Signature:** `modifySecurityGroupPolicy(request: ModifySecurityGroupPolicyRequest)`

By default, advanced security groups use the **internal isolation policy**, and Elastic Compute Service (ECS) instances in each advanced security group cannot communicate with each other. The internal.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `innerAccessPolicy` | string | Yes | The internal access control policy of the security group. Valid values: Example: `Drop` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. Example: `sg-bp67acfmxazb4ph****` |

## modifySecurityGroupRule

**Signature:** `modifySecurityGroupRule(request: ModifySecurityGroupRuleRequest)`

Take note of the following items: *   An authorization object in a security group rule can be of one of the following types: IPv4 CIDR block or address, IPv6 CIDR block or address, security group, or .

**Parameters:** (2 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the security group rule. The description must be 1 to 512 characters in length. Example: `This` |
| `destCidrIp` | string | No | The destination IPv4 CIDR block. IPv4 CIDR blocks and IPv4 addresses are supported. Example: `10.0.0.0/8` |
| `ipProtocol` | string | No | Network Layer /transport layer protocol. Two types of assignments are supported: Example: `all` |
| `ipv6DestCidrIp` | string | No | The destination IPv6 CIDR block. IPv6 CIDR blocks and IPv6 addresses are supported. Example: `2001:db8:1234:1a00::***` |
| `ipv6SourceCidrIp` | string | No | The source IPv6 CIDR block. IPv6 CIDR blocks and IPv6 addresses are supported. Example: `2001:db8:1233:1a00::***` |
| `nicType` | string | No | The type of the network interface controller (NIC). Example: `intranet` |
| `policy` | string | No | The action of the security group rule. Valid values: Example: `accept` |
| `portRange` | string | No | The range of destination ports that correspond to the transport layer protocol. Valid values: Example: `80/80` |
| `portRangeListId` | string | No | The ID of the port list. You can call the `DescribePortRangeLists` operation to query the IDs of ava Example: `prl-2ze9743****` |
| `priority` | string | No | The priority of the security group rule. Valid values: 1 to 100. Example: `1` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The security group ID. Example: `sg-bp67acfmxazb4p****` |
| `securityGroupRuleId` | string | No | The ID of the security group rule. You can call the [DescribeSecurityGroupAttribute](https://help.al Example: `sgr-bp67acfmxa123b***` |
| `sourceCidrIp` | string | No | The source IPv4 CIDR block. IPv4 CIDR blocks and IPv4 addresses are supported. Example: `10.0.0.0/8` |
| `sourceGroupId` | string | No | The source security group ID. You must specify either `SourceGroupId` or `SourceCidrIp` or specify b Example: `sg-bp67acfmxa123b****` |
| `sourceGroupOwnerAccount` | string | No | The Alibaba Cloud account that manages the source security group when you configure a security group Example: `EcsforCloud@Alibaba.com` |
| `sourceGroupOwnerId` | number | No | The ID of the Alibaba Cloud account that manages the source security group when you configure a secu Example: `12345678910` |
| `sourcePortRange` | string | No | The range of source ports that correspond to the transport layer protocol. Valid values: Example: `80/80` |
| `sourcePrefixListId` | string | No | The ID of the source prefix list to which you want to control access. You can call the [DescribePref Example: `pl-x1j1k5ykzqlixdcy****` |

## modifySecurityGroupEgressRule

**Signature:** `modifySecurityGroupEgressRule(request: ModifySecurityGroupEgressRuleRequest)`

Take note of the following items: *   An authorization object in a security group rule can be of one of the following types: IPv4 CIDR block or address, IPv6 CIDR block or address, security group, or .

**Parameters:** (2 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the security group rule. The description must be 1 to 512 characters in length. Example: `This` |
| `destCidrIp` | string | No | The destination IPv4 CIDR block. IPv4 CIDR blocks and IPv4 addresses are supported. Example: `10.0.0.0/8` |
| `destGroupId` | string | No | The ID of the destination security group. You must specify at least one of `DestGroupId` and `DestCi Example: `sg-bp67acfmxa123b****` |
| `destGroupOwnerAccount` | string | No | The Alibaba Cloud account that manages the destination security group when you set security group ru Example: `EcsforCloud@Alibaba.com` |
| `destGroupOwnerId` | number | No | The ID of the Alibaba Cloud account that manages the destination security group when you set securit Example: `1234567890` |
| `destPrefixListId` | string | No | The ID of the destination prefix list. You can call the [DescribePrefixLists](https://help.aliyun.co Example: `pl-x1j1k5ykzqlixdcy****` |
| `ipProtocol` | string | No | Network Layer /transport layer protocol. Two types of assignments are supported: Example: `tcp` |
| `ipv6DestCidrIp` | string | No | The destination IPv6 CIDR block. IPv6 CIDR blocks and IPv6 addresses are supported. Example: `2001:db8:1233:1a00::***` |
| `ipv6SourceCidrIp` | string | No | The source IPv6 CIDR block. IPv6 CIDR blocks and IPv6 addresses are supported. Example: `2001:db8:1234:1a00::***` |
| `nicType` | string | No | The network interface controller (NIC) type. Example: `intranet` |
| `policy` | string | No | The action of the security group rule. Valid values: Example: `accept` |
| `portRange` | string | No | The range of destination ports that correspond to the transport layer protocol. Valid values: Example: `80/80` |
| `portRangeListId` | string | No | The ID of the port list. You can call the `DescribePortRangeLists` operation to query the IDs of ava Example: `prl-2ze9743****` |
| `priority` | string | No | The priority of the security group rule. Valid values: 1 to 100. Example: `1` |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. Example: `sg-bp67acfmxazb4p****` |
| `securityGroupRuleId` | string | No | The ID of the security group rule. You can call the [DescribeSecurityGroupAttribute](https://help.al Example: `sgr-bp67acfmxazb4q****` |
| `sourceCidrIp` | string | No | The source IPv4 CIDR block. IPv4 CIDR blocks and IPv4 addresses are supported. Example: `10.0.0.0/8` |
| `sourcePortRange` | string | No | The range of source ports that correspond to the transport layer protocol. Valid values: Example: `80/80` |

## authorizeSecurityGroup

**Signature:** `authorizeSecurityGroup(request: AuthorizeSecurityGroupRequest)`

### [](#)Precautions *   **Quantity limit**: The maximum number of inbound and outbound rules in all security groups associated with an elastic network interface (ENI) cannot exceed 1,000. For more in.

**Parameters:** (2 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the security group rule. The name must be 1 to 512 characters in length. Example: `This` |
| `destCidrIp` | string | No | The destination IPv4 CIDR block. IPv4 CIDR blocks and IPv4 addresses are supported. Example: `10.0.0.0/8` |
| `ipProtocol` | string | No | Network Layer /transport layer protocol. Two types of assignments are supported: Example: `ALL` |
| `ipv6DestCidrIp` | string | No | The destination IPv6 CIDR block. IP address ranges in the CIDR format and IPv6 format are supported. Example: `2001:250:6000::***` |
| `ipv6SourceCidrIp` | string | No | The source IPv6 CIDR block of the security group rule. IPv6 CIDR blocks and IPv6 addresses are suppo Example: `2001:250:6000::***` |
| `nicType` | string | No | The network interface controller (NIC) type of the security group rule if the security group resides Example: `intranet` |
| `policy` | string | No | The action of the security group rule. Valid values: Example: `accept` |
| `portRange` | string | No | The range of destination port numbers for the protocols specified in the security group rule. Valid  Example: `80/80` |
| `portRangeListId` | string | No | The ID of the port list. You can call the `DescribePortRangeLists` to query the ID of the port list  Example: `prl-2ze9743****` |
| `priority` | string | No | The priority of the security group rule. A smaller value specifies a higher priority. Valid values:  Example: `1` |
| `sourceCidrIp` | string | No | The source IPv4 CIDR block of the security group rule. IPv4 CIDR blocks and IPv4 addresses are suppo Example: `10.0.0.0/8` |
| `sourceGroupId` | string | No | The ID of the source security group referenced in the security group rule. Example: `sg-bp67acfmxazb4p****` |
| `sourceGroupOwnerAccount` | string | No | The Alibaba Cloud account that manages the source security group referenced in the security group ru Example: `test@aliyun.com` |
| `sourceGroupOwnerId` | number | No | The ID of the Alibaba Cloud account that manages the source security group referenced in the securit Example: `1234567890` |
| `sourcePortRange` | string | No | The range of source port numbers for the protocols specified in the security group rule. Default val Example: `7000/8000` |
| `sourcePrefixListId` | string | No | The ID of the source prefix list of the security group rule. You can call the [DescribePrefixLists]( Example: `pl-x1j1k5ykzqlixdcy****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `permissions` | AuthorizeSecurityGroupRequestPermissions[] | No | - |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. Example: `sg-bp67acfmxazb4p****` |

## authorizeSecurityGroupEgress

**Signature:** `authorizeSecurityGroupEgress(request: AuthorizeSecurityGroupEgressRequest)`

### [](#)Precautions *   **Quantity limit**: The maximum number of inbound and outbound rules in all security groups associated with an elastic network interface (ENI) cannot exceed 1,000. For more in.

**Parameters:** (2 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the security group rule. The description can be up to 1 to 512 characters in leng Example: `This` |
| `destCidrIp` | string | No | The destination IPv4 CIDR block of the security group rule. IPv4 CIDR blocks and IPv4 addresses are  Example: `10.0.0.0/8` |
| `destGroupId` | string | No | The ID of the destination security group that is specified in the security group rule. Example: `sg-bp67acfmxazb4p****` |
| `destGroupOwnerAccount` | string | No | The Alibaba Cloud account that manages the destination security group. Example: `Test@aliyun.com` |
| `destGroupOwnerId` | number | No | The ID of the Alibaba Cloud account that manages the destination security group. Example: `12345678910` |
| `destPrefixListId` | string | No | The ID of the destination prefix list. You can call the [DescribePrefixLists](https://help.aliyun.co Example: `pl-x1j1k5ykzqlixdcy****` |
| `ipProtocol` | string | No | Network Layer /transport layer protocol. Two types of assignments are supported: Example: `ALL` |
| `ipv6DestCidrIp` | string | No | The destination IPv6 CIDR block of the security group rule. IPv6 CIDR blocks and IPv6 addresses are  Example: `2001:db8:1233:1a00::***` |
| `ipv6SourceCidrIp` | string | No | The source IPv6 CIDR block of the security group rule. or IPv6 address. Example: `2001:db8:1234:1a00::***` |
| `nicType` | string | No | The network interface controller (NIC) type of the security group rule if the security group resides Example: `intranet` |
| `policy` | string | No | The action of the security group rule. Valid values: Example: `accept` |
| `portRange` | string | No | The destination port range of the security group rule. Valid values: Example: `80/80` |
| `portRangeListId` | string | No | The ID of the port list. You can call the `DescribePortRangeLists` operation to query the IDs of ava Example: `prl-2ze9743****` |
| `priority` | string | No | The priority of security group rule N. A smaller value specifies a higher priority. Valid values: 1  Example: `1` |
| `sourceCidrIp` | string | No | The source IPv4 CIDR block of the security group rule. IPv4 CIDR blocks and IPv4 addresses are suppo Example: `10.0.0.0/8` |
| `sourcePortRange` | string | No | The source port range of the security group rule. Valid values: Example: `80/80` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `permissions` | AuthorizeSecurityGroupEgressRequestPermissions[] | No | - |
| `regionId` | string | Yes | The region ID of the source security group. You can call the [DescribeRegions](https://help.aliyun.c Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The security group ID. Example: `sg-bp67acfmxazb4p****` |

## revokeSecurityGroup

**Signature:** `revokeSecurityGroup(request: RevokeSecurityGroupRequest)`

>  Alibaba Cloud modified verification rules for the RevokeSecurityGroup operation on July 8, 2024. When you call the RevokeSecurityGroup operation to delete a security group rule that does not exist,.

**Parameters:** (2 required, 19 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the security group rule. The description must be 1 to 512 characters in length. Example: `This` |
| `destCidrIp` | string | No | The destination IPv4 CIDR block. IPv4 CIDR blocks and IPv4 addresses are supported. Example: `10.0.0.0/8` |
| `ipProtocol` | string | No | The protocol. The values of this parameter are case-insensitive. Valid values: Example: `TCP` |
| `ipv6DestCidrIp` | string | No | The destination IPv6 CIDR block. IPv6 CIDR blocks and IPv6 addresses are supported. Example: `2001:db8:1233:1a00::***` |
| `ipv6SourceCidrIp` | string | No | The source IPv6 CIDR block of the security group rule. IPv6 CIDR blocks and IPv6 addresses are suppo Example: `2001:db8:1234:1a00::***` |
| `nicType` | string | No | The network interface controller (NIC) type of the security group rule if the security group resides Example: `intranet` |
| `policy` | string | No | The action of the security group rule. Valid values: Example: `accept` |
| `portRange` | string | No | The destination port range of the security group rule. Valid values: Example: `1/200` |
| `portRangeListId` | string | No | The ID of the port list. You can call the `DescribePortRangeLists` operation to query the IDs of ava Example: `prl-2ze9743****` |
| `priority` | string | No | The priority of the security group rule. A smaller value specifies a higher priority. Valid values:  Example: `1` |
| `sourceCidrIp` | string | No | The source IPv4 CIDR block of the security group rule. IPv4 CIDR blocks and IPv4 addresses are suppo Example: `10.0.0.0/8` |
| `sourceGroupId` | string | No | The ID of the source security group referenced in the security group rule. Example: `sg-bp67acfmxa123b****` |
| `sourceGroupOwnerAccount` | string | No | The Alibaba Cloud account that manages the source security group referenced in the security group ru Example: `Test@aliyun.com` |
| `sourceGroupOwnerId` | number | No | The ID of the Alibaba Cloud account that manages the source security group referenced in the securit Example: `12345678910` |
| `sourcePortRange` | string | No | The source port range of the security group rule. Valid values: Example: `80/80` |
| `sourcePrefixListId` | string | No | The ID of the source prefix list of the security group rule. You can call the [DescribePrefixLists]( Example: `pl-x1j1k5ykzqlixdcy****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `permissions` | RevokeSecurityGroupRequestPermissions[] | No | - |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. Example: `sg-bp67acfmxazb4p****` |
| `securityGroupRuleId` | string[] | No | - |

## revokeSecurityGroupEgress

**Signature:** `revokeSecurityGroupEgress(request: RevokeSecurityGroupEgressRequest)`

>  Alibaba Cloud modified verification rules for the RevokeSecurityGroupEgress operation on July 8, 2024. When you use the RevokeSecurityGroupEgress operation to delete a security group rule that does.

**Parameters:** (2 required, 19 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the security group rule. The description must be 1 to 512 characters in length. Example: `This` |
| `destCidrIp` | string | No | The destination IPv4 CIDR block of the security group rule. IPv4 CIDR blocks and IPv4 addresses are  Example: `10.0.0.0/8` |
| `destGroupId` | string | No | The ID of the destination security group of the security group rule. Example: `sg-bp67acfmxa123b****` |
| `destGroupOwnerAccount` | string | No | The Alibaba Cloud account that manages the destination security group specified in the security grou Example: `Test@aliyun.com` |
| `destGroupOwnerId` | string | No | The ID of the Alibaba Cloud account that manages the destination security group specified in the sec Example: `12345678910` |
| `destPrefixListId` | string | No | The ID of the destination prefix list of the security group rule. You can call the [DescribePrefixLi Example: `pl-x1j1k5ykzqlixdcy****` |
| `ipProtocol` | string | No | The protocol type. The values of this parameter are case-insensitive. Valid values: Example: `TCP` |
| `ipv6DestCidrIp` | string | No | The destination IPv6 CIDR block of the security group rule. IPv6 CIDR blocks and IPv6 addresses are  Example: `2001:db8:1233:1a00::***` |
| `ipv6SourceCidrIp` | string | No | The source IPv6 CIDR block of the security group rule. IPv6 CIDR blocks and IPv6 addresses are suppo Example: `2001:db8:1234:1a00::***` |
| `nicType` | string | No | The network interface controller (NIC) type of the security group rule if the security group resides Example: `intranet` |
| `policy` | string | No | The action of the security group rule. Valid values: Example: `accept` |
| `portRange` | string | No | The destination port range of the security group rule. Valid values: Example: `22/22` |
| `portRangeListId` | string | No | The ID of the port list. You can call the `DescribePortRangeLists` operation to query the IDs of ava Example: `prl-2ze9743****` |
| `priority` | string | No | The priority of the security group rule. A smaller value specifies a higher priority. Valid values:  Example: `1` |
| `sourceCidrIp` | string | No | The source IPv4 CIDR block of the security group rule. IPv4 CIDR blocks and IPv4 addresses are suppo Example: `10.0.0.0/8` |
| `sourcePortRange` | string | No | The source port range of the security group rule. Valid values: Example: `22/22` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `473469C7-AA6F-4DC5-B3DB-A3DC0DE3C83E` |
| `permissions` | RevokeSecurityGroupEgressRequestPermissions[] | No | - |
| `regionId` | string | Yes | The region ID of the security group. You can call the [DescribeRegions](https://help.aliyun.com/docu Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. Example: `sg-bp67acfmxazb4p****` |
| `securityGroupRuleId` | string[] | No | - |

## joinSecurityGroup

**Signature:** `joinSecurityGroup(request: JoinSecurityGroupRequest)`

> This operation is not recommended. We recommend that you call the [ModifyInstanceAttribute](https://help.aliyun.com/document_detail/25503.html) operation to add an instance to or remove an instance .

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The instance ID. Example: `i-bp67acfmxazb4p****` |
| `networkInterfaceId` | string | No | The ENI ID. Example: `eni-bp13kd656hxambfe****` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The ID of the security group. You can call the [DescribeSecurityGroups](https://help.aliyun.com/docu Example: `sg-bp67acfmxazb4p****` |

## leaveSecurityGroup

**Signature:** `leaveSecurityGroup(request: LeaveSecurityGroupRequest)`

>  This operation is not recommended. We recommend that you call the [ModifyInstanceAttribute](https://help.aliyun.com/document_detail/25503.html) operation to add an instance to or remove an instance.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The instance ID. Example: `i-bp67acfmxazb4p****` |
| `networkInterfaceId` | string | No | The ENI ID. Example: `eni-bp13kd656hxambfe****` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `securityGroupId` | string | Yes | The security group ID. Example: `sg-bp67acfmxazb4p****` |

