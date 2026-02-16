# Flow Log

VPC flow logs for network traffic capture and analysis.

## createFlowLog

**Signature:** `createFlowLog(request: CreateFlowLogRequest)`

*CreateFlowLog** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeFlowLogs](https://help.aliyun.com.

**Parameters:** (4 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of tag N to add to the resource. You can specify at most 20 tag values. The tag value can  Example: `FinanceJoshua` |
| `aggregationInterval` | number | No | The sampling interval of the flow log. Unit: seconds. Valid values: **1**, **5**, and **10** (defaul Example: `10` |
| `description` | string | No | The description of the flow log. Example: `This` |
| `flowLogName` | string | No | The name of the flow log. Example: `myFlowlog` |
| `logStoreName` | string | No | The name of the Logstore that stores the captured traffic data. Example: `FlowLogStore` |
| `projectName` | string | No | The name of the project that stores the captured traffic data. Example: `FlowLogProject` |
| `regionId` | string | Yes | The ID of the region where you want to create the flow log. You can call the [DescribeRegions](https Example: `cn-qingdao` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazdjdhd****` |
| `resourceId` | string | Yes | The ID of the resource whose traffic you want to capture. Example: `eni-askldfas****` |
| `resourceType` | string | Yes | The type of the resource whose traffic you want to capture. Valid values: Example: `NetworkInterface` |
| `tag` | CreateFlowLogRequestTag[] | No | - |
| `trafficPath` | string[] | No | The scope of the traffic that you want to capture. Valid values: |
| `trafficType` | string | Yes | The type of traffic that you want to capture. Valid values: Example: `All` |

## deleteFlowLog

**Signature:** `deleteFlowLog(request: DeleteFlowLogRequest)`

The **DeleteFlowLog** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system background. You can call the.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `flowLogId` | string | Yes | The ID of the flow log. Example: `fl-m5e8vhz2t21sel1nq****` |
| `regionId` | string | Yes | The region ID of the flow log. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-qingdao` |

## describeFlowLogs

**Signature:** `describeFlowLogs(request: DescribeFlowLogsRequest)`

Query flow logs..

**Parameters:** (1 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of the tag. Up to 20 tag keys are supported. If you need to pass this value, it cannot be an Example: `FinanceDept` |
| `value` | string | No | The value of the tag. Up to 20 tag values are supported. If you need to pass this value, it can be a Example: `FinanceJoshua` |
| `description` | string | No | The description of the flow log. Example: `This` |
| `flowLogId` | string | No | The ID of the flow log. Example: `fl-bp1f6qqhsrc2c12ta****` |
| `flowLogName` | string | No | The name of the flow log. Example: `myFlowlog` |
| `logStoreName` | string | No | The Logstore that stores the captured traffic. Example: `FlowLogStore` |
| `pageNumber` | number | No | The page number, with a default value of **1**. Example: `1` |
| `pageSize` | number | No | The number of items per page in a paginated query, with a maximum value of **50** and a default valu Example: `20` |
| `projectName` | string | No | The Project that manages the captured traffic. Example: `FlowLogProject` |
| `regionId` | string | Yes | The region ID of the flow log. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID of the flow log. Example: `rg-bp67acfmxazb4ph****` |
| `resourceId` | string | No | The resource ID of the traffic to capture. Example: `eni-askldfas****` |
| `resourceType` | string | No | The resource type of the traffic to capture. Values: - **NetworkInterface**: Elastic Network Interfa Example: `NetworkInterface` |
| `status` | string | No | The status of the flow log. Values: - **Active**: The flow log is in an active state. - **Activating Example: `Active` |
| `tags` | DescribeFlowLogsRequestTags[] | No | - |
| `trafficType` | string | No | The type of traffic to collect. Values: - **All**: All traffic. - **Allow**: Traffic allowed by acce Example: `All` |
| `vpcId` | string | No | The ID of the VPC for which you want to view the flow log. Example: `vpc-bp1nwd16gvo1wgs****` |

## modifyFlowLogAttribute

**Signature:** `modifyFlowLogAttribute(request: ModifyFlowLogAttributeRequest)`

**ModifyFlowLogAttribute** is an asynchronous operation. After you send a request, the system returns a request ID and runs the task in the background. You can call the [DescribeFlowLogs](https://help.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `aggregationInterval` | number | No | The new sampling interval of the flow log. Unit: minutes. Valid values: **1**, **5**, and **10**. Example: `1` |
| `description` | string | No | The new description of the flow log. Example: `This` |
| `flowLogId` | string | Yes | The ID of the flow log. Example: `fl-m5e8vhz2t21sel1nq****` |
| `flowLogName` | string | No | The new name of the flow log. Example: `myFlowlog` |
| `ipVersion` | string | No | The version of the IP address. Valid values: Example: `IPv4` |
| `regionId` | string | Yes | The ID of the region where the flow log is created. Example: `cn-qingdao` |

## activeFlowLog

**Signature:** `activeFlowLog(request: ActiveFlowLogRequest)`

The **ActiveFlowLog** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system background. You can call the.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `flowLogId` | string | Yes | The ID of the flow log. Example: `fl-m5e8vhz2t21sel1nq****` |
| `regionId` | string | Yes | The ID of the region where you want to create the flow log. You can call the [DescribeRegions](https Example: `cn-qingdao` |

## deactiveFlowLog

**Signature:** `deactiveFlowLog(request: DeactiveFlowLogRequest)`

The **DeactiveFlowLog** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system background. You can call t.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `flowLogId` | string | Yes | The ID of the flow log. Example: `fl-m5e8vhz2t21sel1nq****` |
| `regionId` | string | Yes | The ID of the region where you want to create the flow log. You can call the [DescribeRegions](https Example: `cn-qingdao` |

## getFlowLogServiceStatus

**Signature:** `getFlowLogServiceStatus(request: GetFlowLogServiceStatusRequest)`

Queries the status of a flow log..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the flow log. Example: `cn-hangzhou` |

## openFlowLogService

**Signature:** `openFlowLogService(request: OpenFlowLogServiceRequest)`

You cannot repeatedly call the **OpenFlowLogService** operation within the specified period of time by using an Alibaba Cloud account. *   You can call the [GetFlowLogServiceStatus](https://help.aliyu.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | Yes | The region ID of the flow log. Example: `cn-hangzhou` |

