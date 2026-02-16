# Parameter Management

Instance parameter configuration and parameter templates.

## describeParameters

**Signature:** `describeParameters(request: DescribeParametersRequest)`

This operation is applicable only to classic instances. >  If the instance is deployed in cloud-native mode, you can use the [DescribeInstanceConfig](https://help.aliyun.com/document_detail/473846.htm.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the node. Example: `r-bp1xxxxxxxxxxxxx-db-0` |
| `regionId` | string | No | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

## describeParameterModificationHistory

**Signature:** `describeParameterModificationHistory(request: DescribeParameterModificationHistoryRequest)`

Queries the parameter modification history of a Tair (Redis OSS-compatible) instance..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2022-09-05T09:49:27Z` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the node. Example: `r-bp1xxxxxxxxxxxxx-db-0` |
| `parameterName` | string | No | The name of the parameter. Example: `script_check_enable` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2022-09-05T08:49:27Z` |

## describeParameterTemplates

**Signature:** `describeParameterTemplates(request: DescribeParameterTemplatesRequest)`

After you call this operation to query the parameters and default values of an instance, you can call the [ModifyInstanceConfig](https://help.aliyun.com/document_detail/473844.html) operation to recon.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `characterType` | string | Yes | The architecture of the instance. For more information, see [Overview](https://help.aliyun.com/docum Example: `logic` |
| `engine` | string | Yes | The database engine that is run on the instance. Set the value to **Redis**. Example: `Redis` |
| `engineVersion` | string | Yes | The major version of the instance. Valid values: **4.0**, **5.0**, **6.0**, and **7.0**. Example: `5.0` |
| `instanceId` | string | No | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |
| `resourceGroupId` | string | No | The ID of the resource group to which the instance belongs. You can call the [ListResourceGroups](ht Example: `rg-acfmyiu4ekp****` |

## createParameterGroup

**Signature:** `createParameterGroup(request: CreateParameterGroupRequest)`

Creates a parameter template..

**Parameters:** (6 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | The service category. Valid values: Example: `enterprise` |
| `engineType` | string | Yes | The engine type. Valid values: Example: `redis` |
| `engineVersion` | string | Yes | The compatible engine version. Valid values: Example: `6.0` |
| `parameterGroupDesc` | string | No | The description of the parameter template. The description must be 0 to 200 characters in length. Example: `test` |
| `parameterGroupName` | string | Yes | The new name of the parameter template. The name must meet the following requirements: Example: `tw_test1` |
| `parameters` | string | Yes | A JSON-formatted object that specifies the parameter-value pairs. Format: {"Parameter 1":"Value 1"," Example: `{"hz":"15","#no_loose_disabled-commands":"flushall"}` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |

## deleteParameterGroup

**Signature:** `deleteParameterGroup(request: DeleteParameterGroupRequest)`

Deletes a parameter template..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `parameterGroupId` | string | Yes | The ID of the parameter template. Example: `rpg-sys-00*****` |

## describeParameterGroup

**Signature:** `describeParameterGroup(request: DescribeParameterGroupRequest)`

Queries the basic information about a parameter template..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `parameterGroupId` | string | Yes | The ID of the parameter template. Example: `rpg-sys-00*****` |
| `regionId` | string | No | The ID of the region. Example: `cn-beijing` |

## describeParameterGroupTemplateList

**Signature:** `describeParameterGroupTemplateList(request: DescribeParameterGroupTemplateListRequest)`

Queries the information about the parameters that can be configured in a parameter template, such as the default values, value ranges, and descriptions..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | The service category. Valid values: Example: `standard` |
| `characterType` | string | No | The role of the instance. Valid values: logic: logical instance. db: database instance. proxy: proxy Example: `db` |
| `engineType` | string | Yes | The engine type. Valid values: Example: `redis` |
| `engineVersion` | string | Yes | The compatible engine version. Valid values: Example: `5.0` |

## describeParameterGroups

**Signature:** `describeParameterGroups(request: DescribeParameterGroupsRequest)`

Queries a list of available parameter templates..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dbType` | string | No | The engine type. Valid values: Example: `redis` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |

## modifyParameterGroup

**Signature:** `modifyParameterGroup(request: ModifyParameterGroupRequest)`

Modifies the settings of a parameter template..

**Parameters:** (4 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | The service category. Valid values: Example: `enterprise` |
| `parameterGroupDesc` | string | No | The description of the parameter template. The description must be 0 to 200 characters in length. Example: `test` |
| `parameterGroupId` | string | Yes | The parameter template ID. Example: `sys-001****` |
| `parameterGroupName` | string | Yes | The new name of the parameter template. The name must meet the following requirements: Example: `testGroupName` |
| `parameters` | string | Yes | A JSON-formatted object that specifies the parameter-value pairs. Format: {"Parameter 1":"Value 1"," Example: `{"hz":"12"}` |
| `regionId` | string | No | The region ID. Example: `cn-zhangjiakou` |

## modifyInstanceParameter

**Signature:** `modifyInstanceParameter(request: ModifyInstanceParameterRequest)`

Applies a parameter template to specific instances. This indicates that the parameter values in the template take effect on the instances. After you modify a parameter template, you must reapply it to.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `parameterGroupId` | string | No | The parameter template ID. Example: `g-idhwofwofewhf****` |
| `parameters` | string | No | The information about parameters. Example: `{"hz":` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |


## describeParameterGroupSupportParam

**Signature:** `describeParameterGroupSupportParam(request: DescribeParameterGroupSupportParamRequest)`

Queries the parameters that can be configured in parameter templates across different database versions..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The service category. Valid values: Example: `standard` |
| `engineType` | string | No | The engine type. Valid values: Example: `redis` |
| `engineVersion` | string | Yes | The compatible engine version. Valid values: Example: `5` |

