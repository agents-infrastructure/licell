# Cloud Assistant (Command)

Cloud Assistant commands: create, invoke, describe, and manage.

## createCommand

**Signature:** `createCommand(request: CreateCommandRequest)`

## [](#)Usage notes *   You can create commands of the following types: *   Batch commands (RunBatScript), applicable to Windows instances *   PowerShell commands (RunPowerShellScript), applicable to .

**Parameters:** (4 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N. Valid values of N: 1 to 20. The tag key cannot be an empty string. Example: `TestKey` |
| `value` | string | No | The value of tag N. Valid values of N: 1 to 20. The tag value can be an empty string. Example: `TestValue` |
| `commandContent` | string | Yes | The Base64-encoded content of the command. Take note of the following items: Example: `ZWNobyAxMjM=` |
| `contentEncoding` | string | No | The encoding mode of the command content (CommandContent). Valid values: Example: `PlainText` |
| `description` | string | No | The description of the command. The description supports all character sets and can be up to 512 cha Example: `testDescription` |
| `enableParameter` | boolean | No | Specifies whether to use custom parameters in the command. Example: `false` |
| `launcher` | string | No | The launcher for script execution. The value cannot exceed 1 KB in length. Example: `python3` |
| `name` | string | Yes | The name of the command. The name supports all character sets and can be up to 128 characters in len Example: `testName` |
| `regionId` | string | Yes | The ID of the region in which to create the command. You can call the [DescribeRegions](https://help Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the command. Example: `rg-123******` |
| `tag` | CreateCommandRequestTag[] | No | - |
| `timeout` | number | No | he maximum timeout period for the command execution on the instance. Unit: seconds. When a command t Example: `60` |
| `type` | string | Yes | The command type. Valid values: Example: `RunShellScript` |
| `workingDir` | string | No | The execution path of the command on ECS instances. The value can be up to 200 characters in length. Example: `/root/` |

## deleteCommand

**Signature:** `deleteCommand(request: DeleteCommandRequest)`

Deletes a Cloud Assistant command in a region. This operation cannot delete Cloud Assistant commands that are being run..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandId` | string | Yes | The ID of the command. You can call the [DescribeCommands](https://help.aliyun.com/document_detail/6 Example: `c-4d34302d02424c5c8e10281e3a31****` |
| `regionId` | string | Yes | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |

## describeCommands

**Signature:** `describeCommands(request: DescribeCommandsRequest)`

## [](#)Usage notes *   If you specify only `Action` and `RegionId`, all available commands (`CommandId`) that you created in the specified region are queried by default. *   During a paged query, whe.

**Parameters:** (1 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the command. Valid values of N: 1 to 20. The tag key cannot be an empty string. Example: `TestKey` |
| `value` | string | No | The value of tag N of the command. Valid values of N: 1 to 20. The tag value can be an empty string. Example: `TestValue` |
| `commandId` | string | No | The ID of the command. Example: `c-hz01272yr52****` |
| `contentEncoding` | string | No | The encoding mode of the `CommandContent` and `Output` values in the response. Valid values: Example: `PlainText` |
| `description` | string | No | The description of the command. Example: `testDescription` |
| `latest` | boolean | No | Specifies whether to query only the latest version of common commands when common commands are queri Example: `true` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `name` | string | No | The name of the command. Example: `testName` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `AAAAAdDWBF2` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `provider` | string | No | The provider of the common command. Take note of the following items: Example: `AlibabaCloud` |
| `regionId` | string | Yes | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the command belongs. Example: `rg-123******` |
| `tag` | DescribeCommandsRequestTag[] | No | - |
| `type` | string | No | The type of the command. Valid values: Example: `RunShellScript` |

## invokeCommand

**Signature:** `invokeCommand(request: InvokeCommandRequest)`

## [](#)Usage notes *   The ECS instances on which you want to run the Cloud Assistant command must meet the following requirements. If multiple ECS instances are specified and one of the instances do.

**Parameters:** (2 required, 20 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the instance. Example: `TestKey` |
| `value` | string | No | The value of tag N of the instance. Example: `TestValue` |
| `key` | string | No | The key of tag N to add to the command task. Valid values of N: 1 to 20. The tag key cannot be an em Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the command task. Valid values of N: 1 to 20. The tag value can be an e Example: `TestValue` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-42665544****` |
| `commandId` | string | Yes | The command ID. You can call the [DescribeCommands](https://help.aliyun.com/document_detail/64843.ht Example: `c-e996287206324975b5fbe1d****` |
| `containerId` | string | No | The ID of the container. Only 64-bit hexadecimal strings are supported. You can use container IDs th Example: `ab141ddfbacfe02d9dbc25966ed971536124527097398d419a6746873fea****` |
| `containerName` | string | No | The name of the container. Example: `test-container` |
| `frequency` | string | No | The schedule on which to run the command. You can configure a command to run at a fixed interval bas |
| `instanceId` | string[] | No | The IDs of instances on which you want to run the command. You can specify up to 100 instance IDs in Example: `i-bp185dy2o3o6n****` |
| `launcher` | string | No | The launcher for script execution. The value cannot exceed 1 KB in length. Example: `python3` |
| `regionId` | string | Yes | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |
| `repeatMode` | string | No | Specifies how to run the command. Valid values: Example: `Once` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the command executions. When you set this parameter, Example: `rg-bp67acfmxazb4p****` |
| `resourceTag` | InvokeCommandRequestResourceTag[] | No | - |
| `tag` | InvokeCommandRequestTag[] | No | - |
| `terminationMode` | string | No | Specifies how to stop the command task when a command execution is manually stopped or times out. Va Example: `ProcessTree` |
| `timed` | boolean | No | >  This parameter is no longer used and does not take effect. Example: `true` |
| `timeout` | number | No | The timeout period for the command execution. Unit: seconds. Example: `60` |
| `username` | string | No | The username to use to run the command on the ECS instances. The username cannot exceed 255 characte Example: `test` |
| `windowsPasswordName` | string | No | The name of the password to use to run the command on a Windows instance. The name cannot exceed 255 Example: `axtSecretPassword` |
| `workingDir` | string | No | The execution path of the command on ECS instances. The value can be up to 200 characters in length. Example: `/home/user` |

## runCommand

**Signature:** `runCommand(request: RunCommandRequest)`

This operation is an asynchronous operation. After a request is sent, a response that contains a command ID and a command task ID is immediately returned. You can call the [DescribeInvocations](https:.

**Parameters:** (3 required, 25 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandContent` | string | Yes | The content of the command. The command content can be plaintext or Base64-encoded. Take note of the Example: `ZWNobyAxMjM=` |
| `regionId` | string | Yes | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |
| `type` | string | Yes | The type of the command. Valid values: Example: `RunShellScript` |
| `key` | string | No | The key of tag N of the instance. Example: `TestKey` |
| `value` | string | No | The value of tag N of the instance. Example: `TestValue` |
| `key` | string | No | The key of tag N to add to the command task. The tag key cannot be an empty string. Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the command task. The tag value can be an empty string. Example: `TestValue` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `123e4567-e89b-12d3-a456-426655440000` |
| `containerId` | string | No | The container ID. Only 64-bit hexadecimal strings are supported. `docker://`, `containerd://`, or `c Example: `ab141ddfbacfe02d9dbc25966ed971536124527097398d419a6746873fea****` |
| `containerName` | string | No | The container name. Example: `test-container` |
| `contentEncoding` | string | No | The encoding mode of command content (`CommandContent`). The valid values are case-insensitive. Vali Example: `Base64` |
| `description` | string | No | The description of the command. The description supports all character sets and can be up to 512 cha Example: `testDescription` |
| `enableParameter` | boolean | No | Specifies whether to include custom parameters in the command. Example: `false` |
| `frequency` | string | No | The schedule on which to run the command. You can configure a command to run at a fixed interval bas |
| `instanceId` | string[] | No | The IDs of instances on which to create and run the command. Specify at least one instance ID. You c Example: `i-bp185dy2o3o6neg****` |
| `keepCommand` | boolean | No | Specifies whether to retain the command after the command is run. Valid values: Example: `false` |
| `launcher` | string | No | The launcher for script execution. The value cannot exceed 1 KB in length. Example: `python3` |
| `name` | string | No | The name of the command. The name supports all character sets and can be up to 128 characters in len Example: `testName` |
| ... | ... | ... | *10 more optional parameters* |

## stopInvocation

**Signature:** `stopInvocation(request: StopInvocationRequest)`

## [](#)Usage notes *   If you stop the process of a command that runs only once, the executions that have started are not interrupted. The executions that have not started are canceled. *   If you st.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string[] | No | The ID of instance N on which you want to stop the process of the Cloud Assistant command. You can s Example: `i-bp67acfmxazb4p****` |
| `invokeId` | string | Yes | The ID of the command task. You can call the [DescribeInvocations](https://help.aliyun.com/document_ Example: `t-7d2a745b412b4601b2d47f6a768d****` |
| `regionId` | string | Yes | The ID of the command task. You can call the [DescribeInvocations](https://help.aliyun.com/document_ Example: `cn-hangzhou` |

## describeInvocations

**Signature:** `describeInvocations(request: DescribeInvocationsRequest)`

DescribeInvocations.

**Parameters:** (1 required, 18 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The command task ID. Example: `TestKey` |
| `value` | string | No | The ID of the resource group. After you set this parameter, command execution results in the specifi Example: `TestValue` |
| `commandId` | string | No | $.parameters[15].schema.items.description Example: `c-hz0jdfwcsr****` |
| `commandName` | string | No | $.parameters[15].schema.items.example Example: `CommandTestName` |
| `commandType` | string | No | $.parameters[15].schema.items.enumValueTitles Example: `RunShellScript` |
| `contentEncoding` | string | No | - Example: `PlainText` |
| `includeOutput` | boolean | No | - Example: `false` |
| `instanceId` | string | No | $.parameters[15].schema.enumValueTitles Example: `i-bp1i7gg30r52z2em****` |
| `invokeId` | string | No | $.parameters[15].schema.items.properties.Value.enumValueTitles Example: `t-hz0jdfwd9f****` |
| `invokeStatus` | string | No | $.parameters[15].schema.example Example: `Finished` |
| `maxResults` | number | No | acs:ecs:{#regionId}:{#accountId}:instance/* Example: `10` |
| `nextToken` | string | No | Instance Example: `AAAAAdDWBF2` |
| `pageNumber` | number | No | acs:ecs:{#regionId}:{#accountId}:command/* Example: `1` |
| `pageSize` | number | No | Command Example: `10` |
| `regionId` | string | Yes | $.parameters[15].schema.items.properties.Value.description Example: `cn-hangzhou` |
| `repeatMode` | string | No | FEATUREecsXZ3H4M Example: `Once` |
| `resourceGroupId` | string | No | $.parameters[15].schema.items.properties.Value.example Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribeInvocationsRequestTag[] | No | - |
| `timed` | boolean | No | $.parameters[15].schema.description Example: `true` |

## describeInvocationResults

**Signature:** `describeInvocationResults(request: DescribeInvocationResultsRequest)`

DescribeInvocationResults.

**Parameters:** (1 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The ID of the instance. Example: `TestKey` |
| `value` | string | No | The ID of the command task. You can call the [DescribeInvocations](https://help.aliyun.com/document_ Example: `TestValue` |
| `commandId` | string | No | $.parameters[11].schema.example Example: `c-hz0jdfwcsr****` |
| `contentEncoding` | string | No | <DescribeInvocationResultsResponse> <RequestId>473469C7-AA6F-4DC5-B3DB-A3DC0DE*****</RequestId> <Inv Example: `PlainText` |
| `includeHistory` | boolean | No | { "RequestId" : "473469C7-AA6F-4DC5-B3DB-A3DC0DE*****", "Invocation" : { "InvocationResults" : { "In Example: `false` |
| `instanceId` | string | No | $.parameters[11].schema.description Example: `i-bp1i7gg30r52z2em****` |
| `invokeId` | string | No | $.parameters[11].schema.items.enumValueTitles Example: `t-hz0jdfwd9f****` |
| `invokeRecordStatus` | string | No | $.parameters[11].schema.enumValueTitles Example: `Running` |
| `maxResults` | number | No | FEATUREecsXZ3H4M Example: `10` |
| `nextToken` | string | No | dubbo Example: `AAAAAdDWBF2` |
| `pageNumber` | number | No | acs:ecs:{#regionId}:{#accountId}:command/* Example: `1` |
| `pageSize` | number | No | acs:ecs:{#regionId}:{#accountId}:instance/* Example: `1` |
| `regionId` | string | Yes | $.parameters[11].schema.items.description Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | $.parameters[11].schema.items.example Example: `rg-bp67acfmxazb4p****` |
| `tag` | DescribeInvocationResultsRequestTag[] | No | - |

## installCloudAssistant

**Signature:** `installCloudAssistant(request: InstallCloudAssistantRequest)`

## [](#)Usage notes After you call the InstallCloudAssistant operation to install Cloud Assistant Agent on an ECS instance, call the [RebootInstance](https://help.aliyun.com/document_detail/25502.html.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string[] | Yes | The ID of the instance. Example: `i-bp1iudwa5b1tqa****` |
| `regionId` | string | Yes | The IDs of instances. You can specify up to 50 instance IDs in a single request. Example: `cn-hangzhou` |

## describeCloudAssistantStatus

**Signature:** `describeCloudAssistantStatus(request: DescribeCloudAssistantStatusRequest)`

## [](#)Usage notes *   Before you run commands on or send files to instances, especially new instances, we recommend that you query the status of Cloud Assistant on the instances by calling this oper.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string[] | No | The instance ID. Example: `i-bp1iudwa5b1tqa****` |
| `maxResults` | number | No | The maximum number of entries per page. If you specify **InstanceId**, this parameter does not take  Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `AAAAAdDWBF2` |
| `OSType` | string | No | The operating system type of the instance. Valid values: Example: `Windows` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `regionId` | string | Yes | The region ID of the instance. You can call [DescribeRegions](https://help.aliyun.com/document_detai Example: `cn-hangzhou` |

## describeCloudAssistantSettings

**Signature:** `describeCloudAssistantSettings(request: DescribeCloudAssistantSettingsRequest)`

Queries the configurations of Cloud Assistant features..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `settingType` | string[] | Yes | The Cloud Assistant configurations. |

## modifyCloudAssistantSettings

**Signature:** `modifyCloudAssistantSettings(request: ModifyCloudAssistantSettingsRequest)`

Modifies the configurations of a Cloud Assistant feature..

**Parameters:** (2 required, 17 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allowedUpgradeWindow` | string[] | No | The time windows during which Cloud Assistant Agent can be upgraded. The time windows can be accurat |
| `enabled` | boolean | No | Specifies whether to enable custom upgrade for Cloud Assistant Agent. If you set this parameter to f Example: `true` |
| `timeZone` | string | No | The time zone of the time windows. Default value: UTC. You can specify a time zone in the following  Example: `Asia/Shanghai` |
| `bucketName` | string | No | The name of the OSS bucket. Example: `example-bucket` |
| `enabled` | boolean | No | Specifies whether to deliver records to OSS. Default value: false. Example: `false` |
| `encryptionAlgorithm` | string | No | The OSS encryption algorithm. Valid values: Example: `AES256` |
| `encryptionKeyId` | string | No | The ID of the customer master key (CMK) when EncryptionType is set to KMS. Example: `a807****7a70e` |
| `encryptionType` | string | No | The OSS encryption method. Valid values: Example: `Inherit` |
| `prefix` | string | No | The prefix of the OSS bucket directory. The prefix must meet the following requirements: Example: `sessionmanager/audit` |
| `sessionManagerEnabled` | boolean | No | Specify whether to enable Cloud Assistant Session Manager. Valid values: Example: `true` |
| `enabled` | boolean | No | Specifies whether to deliver records to Simple Log Service. Default value: false. Example: `false` |
| `logstoreName` | string | No | The name of the Logstore. Example: `example-logstore` |
| `projectName` | string | No | The name of the Simple Log Service project. Example: `example-project` |
| `agentUpgradeConfig` | ModifyCloudAssistantSettingsRequestAgentUpgradeConfig | No | - |
| `ossDeliveryConfig` | ModifyCloudAssistantSettingsRequestOssDeliveryConfig | No | - |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `sessionManagerConfig` | ModifyCloudAssistantSettingsRequestSessionManagerConfig | No | - |
| `settingType` | string | Yes | The Cloud Assistant feature. Set SettingType to one of the following valid values: Example: `SessionManagerDelivery` |
| `slsDeliveryConfig` | ModifyCloudAssistantSettingsRequestSlsDeliveryConfig | No | - |

## describeManagedInstances

**Signature:** `describeManagedInstances(request: DescribeManagedInstancesRequest)`

During a paged query, when you call the DescribeManagedInstances operation to retrieve the first page of results, set `MaxResults` to specify the maximum number of entries to return in the call. The r.

**Parameters:** (1 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the managed instance. Valid values of N: 1 to 20. The tag key cannot be an empty Example: `TestKey` |
| `value` | string | No | The value of tag N of the managed instance. Valid values of N: 1 to 20. The tag value can be an empt Example: `TestValue` |
| `activationId` | string | No | The ID of the activation code. Example: `4ECEEE12-56F1-4FBC-9AB1-890F7494****` |
| `connected` | string | No | - Example: `true` |
| `instanceId` | string[] | No | The ID of managed instance N. Valid values of N: 1 to 50. Example: `mi-hz018jrc1o0****` |
| `instanceIp` | string | No | The internal or public IP address of the managed instance. Example: ```192.168.**.**``` |
| `instanceName` | string | No | The name of the managed instance. Example: `my-webapp-server` |
| `machineId` | string | No | The value of the MachineId parameter that you specify when you register a managed instance. A maximu Example: `GOG4X8312A0188` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `AAAAAdDWBF2****` |
| `osType` | string | No | The operating system type of the managed instance. Valid values: Example: `windows` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `regionId` | string | Yes | The region ID. Supported regions: China (Qingdao), China (Beijing), China (Zhangjiakou), China (Hohh Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the managed instance belongs. Example: `rg-123******` |
| `tag` | DescribeManagedInstancesRequestTag[] | No | - |

## deregisterManagedInstance

**Signature:** `deregisterManagedInstance(request: DeregisterManagedInstanceRequest)`

Deregisters a managed instance. After you deregister the managed instance, you can no longer use Cloud Assistant to send commands or files to the instance..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `instanceId` | string | Yes | The managed instance ID. Example: `mi-hz01axdfas****` |
| `regionId` | string | Yes | The region ID. Supported regions: China (Qingdao), China (Beijing), China (Zhangjiakou), China (Hohh Example: `cn-hangzhou` |

## createActivation

**Signature:** `createActivation(request: CreateActivationRequest)`

## [](#)Usage notes After you use an activation code to register a server that is not provided by Alibaba Cloud as an Alibaba Cloud managed instance, you can use various online services of Alibaba Clo.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the activation code. Valid values of N: 1 to 20. The tag key cannot be an Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the activation code. Valid values of N: 1 to 20. The tag value can be a Example: `TestValue` |
| `description` | string | No | The description of the activation code. The description must be 1 to 100 characters in length. Example: `This` |
| `instanceCount` | number | No | The maximum number of times that you can use the activation code to register managed instances. Vali Example: `10` |
| `instanceName` | string | No | The default instance name prefix. The prefix must be 2 to 50 characters in length and can contain le Example: `test-InstanceName` |
| `ipAddressRange` | string | No | The IP addresses of hosts that can use the activation code. The value can be IPv4 addresses, IPv6 ad Example: `0.0.0.0/0` |
| `regionId` | string | Yes | The region ID. Supported regions: China (Qingdao), China (Beijing), China (Zhangjiakou), China (Hohh Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the activation code. Example: `rg-123******` |
| `tag` | CreateActivationRequestTag[] | No | - |
| `timeToLiveInHours` | number | No | The validity period of the activation code. After the validity period ends, you can no longer use th Example: `4` |

## deleteActivation

**Signature:** `deleteActivation(request: DeleteActivationRequest)`

## [](#)Usage notes Before you call this operation to delete an activation code, make sure that no managed instances are registered with the activation code..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activationId` | string | Yes | The ID of the unused activation code. Example: `4ECEEE12-56F1-4FBC-9AB1-890F1234****` |
| `regionId` | string | Yes | The region ID of the activation code. Supported regions: China (Qingdao), China (Beijing), China (Zh Example: `cn-hangzhou` |

## describeActivations

**Signature:** `describeActivations(request: DescribeActivationsRequest)`

## [](#)Usage notes You can use one of the following methods to check the responses: *   Method 1: During a paged query, when you call the DescribeActivations operation to retrieve the first page of r.

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the activation code. Valid values of N: 1 to 20. The tag key cannot be an empty  Example: `TestKey` |
| `value` | string | No | The value of tag N of the activation code. Valid values of N: 1 to 20. The tag value can be an empty Example: `TestValue` |
| `activationId` | string | No | The ID of the activation code. Example: `4ECEEE12-56F1-4FBC-9AB1-890F1234****` |
| `instanceName` | string | No | The default instance name prefix. Example: `test-InstanceName` |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `AAAAAdDWBF2****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID. Supported regions: China (Qingdao), China (Beijing), China (Zhangjiakou), China (Hohh Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the activation code belongs. Example: `rg-123******` |
| `tag` | DescribeActivationsRequestTag[] | No | - |

## disableActivation

**Signature:** `disableActivation(request: DisableActivationRequest)`

## [](#)Usage notes To prevent an activation code from being leaked, you can call the DisableActivation operation to disable the activation code. Disabled activation codes cannot be used to register n.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activationId` | string | Yes | The request ID. Example: `4ECEEE12-56F1-4FBC-9AB1-890F1234****` |
| `regionId` | string | Yes | The region ID. Supported regions: China (Qingdao), China (Beijing), China (Zhangjiakou), China (Hohh Example: `cn-hangzhou` |

## modifyCommand

**Signature:** `modifyCommand(request: ModifyCommandRequest)`

You can modify a command when it is run. After the command is modified, the new command content applies to subsequent executions. You cannot modify the command type. For example, you cannot change a s.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandContent` | string | No | >  This parameter is no longer used and does not take effect. Example: `echo` |
| `commandId` | string | Yes | The command ID. You can call the [DescribeCommands](https://help.aliyun.com/document_detail/64843.ht Example: `c-hz01272yr52****` |
| `description` | string | No | The command description. The description supports all character sets and can be up to 512 characters Example: `This` |
| `launcher` | string | No | The launcher for script execution. The value cannot exceed 1 KB in length. Example: `python3` |
| `name` | string | No | The command name. The name supports all character sets and can be up to 128 characters in length. Example: `test-CommandName` |
| `regionId` | string | Yes | The region ID of the command. You can call the [DescribeRegions](https://help.aliyun.com/document_de Example: `cn-hangzhou` |
| `timeout` | number | No | The maximum timeout period for the command to be run on the instance. Unit: seconds. When a command  Example: `120` |
| `workingDir` | string | No | The working directory of the command. The value can be up to 200 characters in length. Example: `/home/` |

## modifyInvocationAttribute

**Signature:** `modifyInvocationAttribute(request: ModifyInvocationAttributeRequest)`

You can modify the execution information of a task that runs a command in one of the following modes. To query the execution mode of a command, you can call the [DescribeInvocations](https://help.aliy.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - |
| `commandContent` | string | No | The content of the command after modification. The command content can be plaintext or Base64-encode Example: `ZWNobyAxMjM=` |
| `contentEncoding` | string | No | The encoding mode of the command content that is specified by `CommandContent`. Valid values (case-i Example: `PlainText` |
| `enableParameter` | boolean | No | Specifies whether to include custom parameters in the command. Example: `false` |
| `frequency` | string | No | The frequency at which to run the command. This parameter takes effect only when `RepeatMode` is set |
| `instanceId` | string[] | No | - |
| `invokeId` | string | Yes | The execution ID of the command. Example: `t-hz0jdfwd9f****` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |

## modifyManagedInstance

**Signature:** `modifyManagedInstance(request: ModifyManagedInstanceRequest)`

## [](#)Usage notes The ModifyManagedInstance operation can be called to change only the name of a single managed instance..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The new name of the managed instance. The name must be 1 to 128 characters in length. It must start  Example: `mi-hz01nmcf****` |
| `instanceName` | string | Yes | The new name of the managed instance. The name must be 2 to 128 characters in length. The name must  Example: `testInstanceName` |
| `regionId` | string | Yes | The region ID. Supported regions: China (Qingdao), China (Beijing), China (Zhangjiakou), China (Hohh Example: `cn-hangzhou` |

## listPluginStatus

**Signature:** `listPluginStatus(request: ListPluginStatusRequest)`

Before you call this operation to query the status of Cloud Assistant plug-ins on ECS instances, make sure that the versions of Cloud Assistant Agent on the instances are not earlier than the followin.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string[] | No | - |
| `maxResults` | number | No | The maximum number of entries per page. Example: `10` |
| `name` | string | No | The name of the Cloud Assistant plug-in. The name supports all character sets and must be 1 to 255 c Example: `testPluginName` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You must sp Example: `AAAAAdDWBF2` |
| `pageNumber` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `1` |
| `pageSize` | number | No | >  This parameter will be removed in the future. We recommend that you use NextToken and MaxResults  Example: `10` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |

