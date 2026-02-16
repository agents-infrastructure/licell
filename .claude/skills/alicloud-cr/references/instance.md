# Instance Management

Container Registry instance lifecycle, endpoints, VPC endpoints, and usage.

## getInstance

The ID of the resource group to which the instance belongs.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-xkx6vujuhay0****` |

## getInstanceCount

Cancels an artifact building task.

**Parameters:** None

## getInstanceUsage

Queries the quota usage of an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |

## getInstanceEndpoint

Queries the number of instances.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpointType` | string | Yes | The type of the endpoint. Set the value to Internet. Example: `internet` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Registry` |

## getInstanceVpcEndpoint

Queries the endpoints of the virtual private clouds (VPCs) in which a Container Registry instance is deployed.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Chart` |

## listInstance

Queries Container Registry instances.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceStatus` | string | No | The status of the instance. Valid values: Example: `RUNNING` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `resourceGroupId` | string | No | The ID of the resource group to which the instance belongs. Example: `rg-acfmv36i4is****` |

## listInstanceEndpoint

Queries the endpoints of a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Chart` |
| `summary` | boolean | No | Specify whether to return endpoints in simple mode. If yes, no access control information about the  Example: `false` |

## listInstanceRegion

Queries regions in which you can create Container Registry instances.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used for response parameters. Set this parameter to `zh-CN`. Example: `zh-CN` |

## createInstanceEndpointAclPolicy

Creates a whitelist policy for the public endpoint of the instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `comment` | string | No | The description. Example: `test` |
| `endpointType` | string | Yes | The type of the endpoint. Set the value to Internet. Example: `internet` |
| `entry` | string | Yes | The CIDR block that is accessible. Example: `192.168.1.1/32` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Registry` |

## createInstanceVpcEndpointLinkedVpc

Associates a virtual private cloud (VPC) with a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enableCreateDNSRecordInPvzt` | boolean | No | Specifies whether to automatically create Alibaba Cloud DNS PrivateZone records. Valid values: Example: `false` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-xkx6vujuhay0****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Registry` |
| `vpcId` | string | Yes | The VPC ID. Example: `vpc-uf6pa68zxnnlc48dd****` |
| `vswitchId` | string | Yes | The ID of the vSwitch that is associated with the specified VPC. Example: `vsw-uf6u0kn8x2gbzxfn2****` |

## deleteInstanceEndpointAclPolicy

Deletes a whitelist policy for the public endpoint of an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpointType` | string | Yes | The type of the endpoint. Set the value to Internet. Example: `internet` |
| `entry` | string | Yes | The CIDR block. Example: `127.0.0.1/32` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Chart` |

## deleteInstanceVpcEndpointLinkedVpc

Disassociates a virtual private cloud (VPC) from an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Chart` |
| `vpcId` | string | Yes | The ID of the VPC. Example: `vpc-uf6pa68zxnnlc48dd****` |
| `vswitchId` | string | Yes | The ID of the vSwitch. Example: `vpc-uf6pa68zxnnlc48dd****` |

## updateInstanceEndpointStatus

Updates the status of an instance endpoint.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enable` | boolean | Yes | Specifies whether to enable the instance endpoint. Valid values: Example: `false` |
| `endpointType` | string | Yes | The type of the endpoint. Set the value to Internet. Example: `internet` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `moduleName` | string | No | The name of the module that you want to access. Valid values: Example: `Chart` |

## getAuthorizationToken

Queries a pair of temporary username and password that you use to log on to a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the request. Example: `cri-kmsiwlxxdcvaduwb` |

## resetLoginPassword

Resets the logon password of a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `password` | string | Yes | The new password that you specify to log on to the instance. The password must be 8 to 32 bits in le Example: `test` |

## changeResourceGroup

Changes the resource group to which a resource belongs.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resourceGroupId` | string | Yes | The ID of the resource group to which you want to move the resource. Example: `rg-aekz5nlvlaksnvi` |
| `resourceId` | string | Yes | The ID of the resource. Example: `cri-8qong6ve5p3mhlgt` |
| `resourceRegionId` | string | Yes | The ID of the region. Example: `cn-shenzhen-finance-1` |

