# Network ACL

Network access control lists for VSwitch-level traffic filtering.

## createNetworkAcl

**Signature:** `createNetworkAcl(request: CreateNetworkAclRequest)`

Creates a network ACL..

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `description` | string | No | The description of the network ACL. Example: `This` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `networkAclName` | string | No | The name of the network ACL. Example: `acl-1` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |
| `tag` | CreateNetworkAclRequestTag[] | No | - |
| `vpcId` | string | Yes | The ID of the virtual private cloud (VPC) to which the network ACL belongs. Example: `vpc-dsfd34356vdf****` |

## deleteNetworkAcl

**Signature:** `deleteNetworkAcl(request: DeleteNetworkAclRequest)`

## [](#)Description You cannot repeatedly call the **DeleteNetworkAcl** operation within the specified period of time..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `223e4867-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `networkAclId` | string | Yes | The ID of the network ACL. Example: `nacl-bp1lhl0taikrbgnh****` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |

## describeNetworkAcls

**Signature:** `describeNetworkAcls(request: DescribeNetworkAclsRequest)`

Queries network ACLs..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `networkAclId` | string | No | The ID of the network ACL. Example: `nacl-bp1lhl0taikrbgnh****` |
| `networkAclName` | string | No | The name of the network ACL. Example: `acl-1` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |
| `resourceId` | string | No | The ID of the associated instance. Example: `vsw-bp1de348lntdwnhbg****` |
| `resourceType` | string | No | The type of the associated instance. Set the value to **VSwitch**. Example: `VSwitch` |
| `tags` | DescribeNetworkAclsRequestTags[] | No | - |
| `vpcId` | string | No | The ID of the VPC to which the network ACL belongs. Example: `vpc-m5ebpc2xh64mqm27e****` |

## describeNetworkAclAttributes

**Signature:** `describeNetworkAclAttributes(request: DescribeNetworkAclAttributesRequest)`

Queries network access control lists (ACLs)..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `networkAclId` | string | Yes | The ID of the network ACL. Example: `nacl-a2do9e413e0spzasx****` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |

## modifyNetworkAclAttributes

**Signature:** `modifyNetworkAclAttributes(request: ModifyNetworkAclAttributesRequest)`

Modifies the attributes of a network access control list (ACL)..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the network ACL. Example: `This` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `networkAclId` | string | Yes | The ID of the network ACL. Example: `acl-bp1lhl0taikrxxxxxxxx` |
| `networkAclName` | string | No | The name of the network ACL. Example: `acl-1` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |

## associateNetworkAcl

**Signature:** `associateNetworkAcl(request: AssociateNetworkAclRequest)`

## [](#)Description *   **AssociateNetworkAcl** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeNe.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resourceId` | string | No | The ID of the associated resource. Example: `vsw-bp1de348lntdw****` |
| `resourceType` | string | No | The type of resource with which you want to associate the network ACL. Set the value to **VSwitch**. Example: `VSwitch` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Example: `true` |
| `networkAclId` | string | Yes | The ID of the network ACL. Example: `nacl-a2do9e413e0sp****` |
| `regionId` | string | Yes | The region ID of the network ACL. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `resource` | AssociateNetworkAclRequestResource[] | No | - |

## unassociateNetworkAcl

**Signature:** `unassociateNetworkAcl(request: UnassociateNetworkAclRequest)`

## [](#)Description *   **UnassociateNetworkAcl** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [Describe.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resourceId` | string | No | The ID of the resource from which you want to disassociate the network ACL. Example: `vsw-bp1de348lntdw****` |
| `resourceType` | string | No | The type of the resource from which you want to disassociate the network ACL. Set the value to **VSw Example: `VSwitch` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `networkAclId` | string | Yes | The ID of the network ACL that you want to disassociate from a resource. Example: `nacl-a2do9e413e0sp****` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |
| `resource` | UnassociateNetworkAclRequestResource[] | No | - |

## copyNetworkAclEntries

**Signature:** `copyNetworkAclEntries(request: CopyNetworkAclEntriesRequest)`

## [](#)Description *   **CopyNetworkAclEntries** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [Describe.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `networkAclId` | string | Yes | The ID of the network ACL. Example: `nacl-a2do9e413e0spxxxxxxxx` |
| `regionId` | string | Yes | The region ID of the network ACL. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `sourceNetworkAclId` | string | Yes | The ID of the network ACL whose rules you want to copy. Example: `nacl-ghuo9ehg3e0spxxxxxxxx` |

## updateNetworkAclEntries

**Signature:** `updateNetworkAclEntries(request: UpdateNetworkAclEntriesRequest)`

**UpdateNetworkAclEntries** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeNetworkAclAttributes](.

**Parameters:** (2 required, 24 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `networkAclId` | string | Yes | The ID of the network ACL. Example: `nacl-bp1lhl0taikrzxsc****` |
| `regionId` | string | Yes | The region ID of the network ACL. Example: `cn-hangzhou` |
| `description` | string | No | The description of the outbound rule. Example: `This` |
| `destinationCidrIp` | string | No | The destination CIDR block. Example: `10.0.0.0/24` |
| `entryType` | string | No | The type of the rule. Set the value to **custom**, which specifies custom rules. Example: `custom` |
| `ipVersion` | string | No | The IP version. Valid values: Example: `IPv4` |
| `networkAclEntryId` | string | No | The ID of the outbound rule. Example: `nae-2zecs97e0brcge46****` |
| `networkAclEntryName` | string | No | The name of the outbound rule. Example: `acl-2` |
| `policy` | string | No | The action to be performed on network traffic that matches the rule. Valid values: Example: `accept` |
| `port` | string | No | The destination port range of the outbound traffic. Example: `-1/-1` |
| `protocol` | string | No | The protocol. Valid values: Example: `all` |
| `description` | string | No | The description of the inbound rule. Example: `This` |
| `entryType` | string | No | The type of the rule. Set the value to **custom**, which specifies custom rules. Example: `custom` |
| `ipVersion` | string | No | The IP version. Valid values: Example: `IPv4` |
| `networkAclEntryId` | string | No | The ID of the inbound rule. Example: `nae-2zepn32de59j8m4****` |
| `networkAclEntryName` | string | No | The name of the inbound rule. Example: `acl-3` |
| `policy` | string | No | The action to be performed on network traffic that matches the rule. Valid values: Example: `accept` |
| ... | ... | ... | *9 more optional parameters* |

