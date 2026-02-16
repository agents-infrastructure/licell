# GTM Classic

Classic Global Traffic Manager instances, strategies, address pools, monitors, and recovery plans.

## addGtmAccessStrategy

**Signature:** `addGtmAccessStrategy(request: AddGtmAccessStrategyRequest)`

@param request - AddGtmAccessStrategyRequest.

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessLines` | string | Yes | The line codes of access regions. Example: `["default",` |
| `defaultAddrPoolId` | string | Yes | The ID of the default address pool. Example: `hrsix` |
| `failoverAddrPoolId` | string | Yes | The ID of the failover address pool. Example: `hrsyw` |
| `instanceId` | string | Yes | The ID of the GTM instance for which you want to create an access policy. Example: `instance1` |
| `lang` | string | No | The language used by the user. Example: `en` |
| `strategyName` | string | Yes | The name of the access policy. |

## addGtmAddressPool

**Signature:** `addGtmAddressPool(request: AddGtmAddressPoolRequest)`

Creates an address pool..

**Parameters:** (5 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lbaWeight` | number | No | The weight of the address pool. Example: `1` |
| `mode` | string | No | The mode of the address pool. Valid values: Example: `SMART` |
| `value` | string | No | The address in the address pool. Example: `1.1.1.1` |
| `cityCode` | string | No | The code of the city where the monitored node is deployed. For more information about specific value Example: `546` |
| `ispCode` | string | No | *   The code of the Internet service provider (ISP) to which the monitored node belongs. For more in Example: `465` |
| `addr` | AddGtmAddressPoolRequestAddr[] | Yes | The address pools. |
| `evaluationCount` | number | No | The number of consecutive failures. Example: `2` |
| `instanceId` | string | Yes | The ID of the GTM instance for which you want to create an address pool. Example: `gtm-cn-xxxxxxx` |
| `interval` | number | No | The health check interval. Unit: seconds. Set the value to 60. Example: `60` |
| `ispCityNode` | AddGtmAddressPoolRequestIspCityNode[] | No | - |
| `lang` | string | No | The language of the values of specific response parameters. Example: `en` |
| `minAvailableAddrNum` | number | Yes | The minimum number of available addresses in the address pool. Example: `2` |
| `monitorExtendInfo` | string | No | The extended information. The required parameters vary based on the value of ProtocolType. Example: `{"host":"aliyun.com","port":80}` |
| `monitorStatus` | string | No | Specifies whether to enable the health check. Valid values: Example: `OPEN` |
| `name` | string | Yes | The name of the address pool. Example: `Alibaba` |
| `protocolType` | string | No | The health check protocol. Valid values: Example: `HTTPS` |
| `timeout` | number | No | The timeout period. Unit: milliseconds. Valid values: 2000, 3000, 5000, and 10000. Example: `60` |
| `type` | string | Yes | The type of the address pool. Valid values: Example: `IP` |

## addGtmMonitor

**Signature:** `addGtmMonitor(request: AddGtmMonitorRequest)`

Creates a health check task..

**Parameters:** (7 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cityCode` | string | No | The city code. Example: `503` |
| `ispCode` | string | No | The Internet service provider (ISP) node. Specify the parameter according to the value of IspCode re Example: `465` |
| `addrPoolId` | string | Yes | The ID of the address pool. Example: `xxxx` |
| `evaluationCount` | number | Yes | The number of consecutive failures. Example: `3` |
| `interval` | number | Yes | The health check interval. Unit: seconds. Set the value to 60. Example: `60` |
| `ispCityNode` | AddGtmMonitorRequestIspCityNode[] | Yes | The nodes for monitoring. |
| `lang` | string | No | The language. Example: `en` |
| `monitorExtendInfo` | string | Yes | The extended information. The required parameters vary based on the health check protocol. Example: `{\\"code\\":200,\\"path\\":\\"/index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `protocolType` | string | Yes | The protocol used for the health check. Valid values: Example: `HTTP` |
| `timeout` | number | Yes | The health check timeout period. Unit: milliseconds. Valid values: 2000, 3000, 5000, and 10000. Example: `3000` |

## addGtmRecoveryPlan

**Signature:** `addGtmRecoveryPlan(request: AddGtmRecoveryPlanRequest)`

Creates a disaster recovery plan..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `faultAddrPool` | string | Yes | The IDs of faulty address pools. Example: `["hra0or"]` |
| `lang` | string | No | The language. Example: `en` |
| `name` | string | Yes | The name of the disaster recovery plan. Example: `name-example` |
| `remark` | string | No | The description of the disaster recovery plan. Example: `remark` |

## copyGtmConfig

**Signature:** `copyGtmConfig(request: CopyGtmConfigRequest)`

Copies the configurations of a Global Traffic Manager (GTM) instance..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `copyType` | string | Yes | The type of the object that is copied. Only the INSTANCE type is supported. Example: `INSTANCE` |
| `lang` | string | No | The language. Example: `en` |
| `sourceId` | string | Yes | The ID of the source object. Only instance IDs are supported. Example: `gtm-cn-0pp1j84v60d` |
| `targetId` | string | Yes | The ID of the target object. Only instance IDs are supported. Example: `gtm-cn-v0h1gaujg06` |

## deleteGtmAccessStrategy

**Signature:** `deleteGtmAccessStrategy(request: DeleteGtmAccessStrategyRequest)`

@param request - DeleteGtmAccessStrategyRequest.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used by the user. Example: `en` |
| `strategyId` | string | No | The ID of the access policy that you want to delete. Example: `hrskc` |

## deleteGtmAddressPool

**Signature:** `deleteGtmAddressPool(request: DeleteGtmAddressPoolRequest)`

@param request - DeleteGtmAddressPoolRequest.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addrPoolId` | string | Yes | The ID of the address pool that you want to delete. Example: `1234` |
| `lang` | string | No | The language used by the user. Example: `en` |

## deleteGtmRecoveryPlan

**Signature:** `deleteGtmRecoveryPlan(request: DeleteGtmRecoveryPlanRequest)`

@param request - DeleteGtmRecoveryPlanRequest.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used by the user. Example: `en` |
| `recoveryPlanId` | number | Yes | The ID of the disaster recovery plan that you want to delete. Example: `100` |

## describeGtmAccessStrategies

**Signature:** `describeGtmAccessStrategies(request: DescribeGtmAccessStrategiesRequest)`

You can call this operation to query the access policies of a Global Traffic Manager (GTM) instance..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The ID of the GTM instance whose access policies you want to query. Example: `instance1` |
| `lang` | string | No | The language used by the user. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Example: `20` |

## describeGtmAccessStrategy

**Signature:** `describeGtmAccessStrategy(request: DescribeGtmAccessStrategyRequest)`

You can call this operation to query the details about an access policy of a Global Traffic Manager (GTM) instance based on the policy ID..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used by the user. Example: `en` |
| `strategyId` | string | Yes | The ID of the access policy that you want to query. Example: `hra0hs` |

## describeGtmAccessStrategyAvailableConfig

**Signature:** `describeGtmAccessStrategyAvailableConfig(request: DescribeGtmAccessStrategyAvailableConfigRequest)`

Queries the configuration items that can be set for an access policy..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Global Traffic Manager (GTM) instance. Example: `gtm-cn-xxxx` |
| `lang` | string | No | The language. Example: `en` |

## describeGtmAvailableAlertGroup

**Signature:** `describeGtmAvailableAlertGroup(request: DescribeGtmAvailableAlertGroupRequest)`

@param request - DescribeGtmAvailableAlertGroupRequest.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used by the user. Example: `en` |

## describeGtmInstance

**Signature:** `describeGtmInstance(request: DescribeGtmInstanceRequest)`

Queries the details about a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the GTM instance. Example: `instance1` |
| `lang` | string | No | The language of the values of specific response parameters. Example: `en` |
| `needDetailAttributes` | boolean | No | Specifies whether additional information is required. Default value: **false**. If the value is **tr Example: `false` |

## describeGtmInstanceAddressPool

**Signature:** `describeGtmInstanceAddressPool(request: DescribeGtmInstanceAddressPoolRequest)`

You can call this operation to query the details about an address pool of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addrPoolId` | string | Yes | The ID of the address pool that you want to query. Example: `1234` |
| `lang` | string | No | The language used by the user. Example: `en` |

## describeGtmInstanceAddressPools

**Signature:** `describeGtmInstanceAddressPools(request: DescribeGtmInstanceAddressPoolsRequest)`

You can call this operation to query the address pools of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the GTM instance that you want to query. Example: `gtmtest` |
| `lang` | string | No | The language used by the user. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Maximum value: **100**. Default value: **20**. Example: `20` |

## describeGtmInstanceStatus

**Signature:** `describeGtmInstanceStatus(request: DescribeGtmInstanceStatusRequest)`

Queries the status of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `instance1` |
| `lang` | string | No | The language. Example: `en` |

## describeGtmInstanceSystemCname

**Signature:** `describeGtmInstanceSystemCname(request: DescribeGtmInstanceSystemCnameRequest)`

@param request - DescribeGtmInstanceSystemCnameRequest.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Global Traffic Manager (GTM) instance. Example: `instance1` |
| `lang` | string | No | The language used by the user. Example: `en` |

## describeGtmInstances

**Signature:** `describeGtmInstances(request: DescribeGtmInstancesRequest)`

Queries the Global Traffic Manager (GTM) instances under your account..

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The keyword that you use for query. Exact match is supported by instance ID or instance name. Example: `test` |
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |
| `needDetailAttributes` | boolean | No | Specifies whether additional information is required. Default value: **false**. Example: `false` |
| `pageNumber` | number | No | The page number to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Example: `20` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-xxxxx` |

## describeGtmLogs

**Signature:** `describeGtmLogs(request: DescribeGtmLogsRequest)`

You can call this operation to query logs of a Global Traffic Manager (GTM) instance..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTimestamp` | number | No | The timestamp that specifies the end of the time range to query. Example: `1363453350000` |
| `instanceId` | string | No | The ID of the GTM instance whose logs you want to query. Example: `gtm-cn-xxxxx` |
| `keyword` | string | No | The keyword for searching logs, in case-insensitive "%Keyword%" format. Example: `test` |
| `lang` | string | No | The language used by the user. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **100**. Default value: **20**. Example: `20` |
| `startTimestamp` | number | No | The beginning of the time range to query. Example: `1363453340000` |

## describeGtmMonitorAvailableConfig

**Signature:** `describeGtmMonitorAvailableConfig(request: DescribeGtmMonitorAvailableConfigRequest)`

Queries available monitored nodes..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the values of specific response parameters. Example: `en` |

## describeGtmMonitorConfig

**Signature:** `describeGtmMonitorConfig(request: DescribeGtmMonitorConfigRequest)`

Queries the health check configuration of an address pool of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the values of specific response parameters. Example: `en` |
| `monitorConfigId` | string | Yes | The ID of the health check configuration. Example: `100` |

## describeGtmRecoveryPlan

**Signature:** `describeGtmRecoveryPlan(request: DescribeGtmRecoveryPlanRequest)`

Queries the details of a disaster recovery plan..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `recoveryPlanId` | number | Yes | The ID of the disaster recovery plan. Example: `100` |

## describeGtmRecoveryPlanAvailableConfig

**Signature:** `describeGtmRecoveryPlanAvailableConfig(request: DescribeGtmRecoveryPlanAvailableConfigRequest)`

Queries the configuration items that can be set for a disaster recovery plan..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language in which the returned results are displayed. Valid values: Example: `en` |

## describeGtmRecoveryPlans

**Signature:** `describeGtmRecoveryPlans(request: DescribeGtmRecoveryPlansRequest)`

Queries the disaster recovery plans for a Global Traffic Manager (GTM) instance..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The keyword for the query. Fuzzy match is supported by disaster recovery plan name. Example: `test` |
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |
| `pageNumber` | number | No | The page number to return. The page number starts from **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Maximum value: **100**. Default value: **20**. Example: `20` |

## executeGtmRecoveryPlan

**Signature:** `executeGtmRecoveryPlan(request: ExecuteGtmRecoveryPlanRequest)`

Executes a disaster recovery plan..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `recoveryPlanId` | number | Yes | The ID of the disaster recovery plan. Example: `100` |

## moveGtmResourceGroup

**Signature:** `moveGtmResourceGroup(request: MoveGtmResourceGroupRequest)`

@param request - MoveGtmResourceGroupRequest.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - Example: `en` |
| `newResourceGroupId` | string | Yes | This parameter is required. Example: `AgIDE1MA_XXX` |
| `resourceId` | string | Yes | This parameter is required. Example: `rg-aekzzk7hx3*****` |

## previewGtmRecoveryPlan

**Signature:** `previewGtmRecoveryPlan(request: PreviewGtmRecoveryPlanRequest)`

You can call this operation to preview a disaster recovery plan of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used by the user. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on per page. Maximum value: **20**. Default value: **5**. Example: `5` |
| `recoveryPlanId` | number | Yes | The ID of the disaster recovery plan that you want to preview. Example: `100` |

## rollbackGtmRecoveryPlan

**Signature:** `rollbackGtmRecoveryPlan(request: RollbackGtmRecoveryPlanRequest)`

Rolls back a disaster recovery plan..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the response. Valid values: Example: `en` |
| `recoveryPlanId` | number | Yes | The ID of the disaster recovery plan. Example: `100` |

## setGtmAccessMode

**Signature:** `setGtmAccessMode(request: SetGtmAccessModeRequest)`

Modifies a policy for switchover between address pool sets..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessMode` | string | Yes | The desired access policy. Valid values: Example: `AUTO` |
| `lang` | string | No | The language. Example: `en` |
| `strategyId` | string | Yes | The ID of the access policy. Example: `hra0hx` |

## setGtmMonitorStatus

**Signature:** `setGtmMonitorStatus(request: SetGtmMonitorStatusRequest)`

@param request - SetGtmMonitorStatusRequest.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language used by the user. Example: `en` |
| `monitorConfigId` | string | Yes | The health check ID. Example: `abc1234` |
| `status` | string | Yes | Specifies whether health check is enabled for the address pool. Valid values: Example: `OPEN` |

## updateGtmAccessStrategy

**Signature:** `updateGtmAccessStrategy(request: UpdateGtmAccessStrategyRequest)`

@param request - UpdateGtmAccessStrategyRequest.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessLines` | string | No | The line codes of access regions. Example: `["default",` |
| `defaultAddrPoolId` | string | No | The ID of the default address pool. Example: `hrsix` |
| `failoverAddrPoolId` | string | No | The ID of the failover address pool. Example: `hrsyw` |
| `lang` | string | No | The language used by the user. Example: `en` |
| `strategyId` | string | Yes | The ID of the access policy that you want to query for the GTM instance. Example: `hrmxc` |
| `strategyName` | string | No | - |

## updateGtmAddressPool

**Signature:** `updateGtmAddressPool(request: UpdateGtmAddressPoolRequest)`

@param request - UpdateGtmAddressPoolRequest.

**Parameters:** (3 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lbaWeight` | number | No | The weight of the address pool that you want to modify. Example: `1` |
| `mode` | string | No | The mode of the address pool that you want to modify. Example: `SMART` |
| `value` | string | No | The addresses in the address pool. Example: `1.1.1.1` |
| `addr` | UpdateGtmAddressPoolRequestAddr[] | Yes | - |
| `addrPoolId` | string | Yes | The ID of the address pool that you want to modify. Example: `1234abc` |
| `lang` | string | No | The language used by the user. Example: `en` |
| `minAvailableAddrNum` | number | No | The minimum number of available addresses in the address pool. Example: `2` |
| `name` | string | No | - |
| `type` | string | Yes | The type of the address pool that you want to modify. Example: `IP` |

## updateGtmInstanceGlobalConfig

**Signature:** `updateGtmInstanceGlobalConfig(request: UpdateGtmInstanceGlobalConfigRequest)`

Modifies the configurations of a Global Traffic Manager (GTM) instance based on the specified parameters..

**Parameters:** (5 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `alertGroup` | string | Yes | The alert group. Only one alert group is supported. |
| `cnameCustomDomainName` | string | No | If you set **CnameMode** to **CUSTOM**, you must specify the CnameCustomDomainName parameter, which  Example: `www.example.com` |
| `cnameMode` | string | No | Specifies whether to use a system-assigned canonical name (CNAME) or a custom CNAME to access GTM. V Example: `SYSTEM_ASSIGN` |
| `instanceId` | string | Yes | The ID of the GTM instance. Example: `instance1` |
| `instanceName` | string | Yes | The name of the GTM instance. |
| `lang` | string | No | The language. Example: `en` |
| `lbaStrategy` | string | Yes | The balancing policy. Valid values: Example: `RATIO` |
| `ttl` | number | No | The global time-to-live (TTL). Example: `60` |
| `userDomainName` | string | Yes | The primary domain name. Example: `www.example.com` |

## updateGtmMonitor

**Signature:** `updateGtmMonitor(request: UpdateGtmMonitorRequest)`

Modifies the health check configuration for an address pool of a Global Traffic Manager (GTM) instance..

**Parameters:** (4 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cityCode` | string | No | The code of the city where the monitored node is deployed. Example: `572` |
| `ispCode` | string | No | *   The code of the Internet service provider (ISP) to which the monitored node belongs. For more in Example: `465` |
| `evaluationCount` | number | No | The maximum number of consecutive exceptions detected. If the number of consecutive exceptions detec Example: `3` |
| `interval` | number | No | The health check interval. Unit: seconds. Set the value to 60. Example: `60` |
| `ispCityNode` | UpdateGtmMonitorRequestIspCityNode[] | Yes | The monitored nodes. |
| `lang` | string | No | The language of the values of specific response parameters. Example: `en` |
| `monitorConfigId` | string | Yes | The ID of the health check configuration. Example: `1234abc` |
| `monitorExtendInfo` | string | Yes | The extended information, that is, the parameters required for the protocol. Different protocols req Example: `{\\"code\\":200,\\"path\\":\\"\\\\index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `protocolType` | string | Yes | The protocol used for the health check. Example: `HTTP` |
| `timeout` | number | No | The health check timeout period. Unit: milliseconds. Valid values: 2000, 3000, 5000, and 10000. Example: `3000` |

## updateGtmRecoveryPlan

**Signature:** `updateGtmRecoveryPlan(request: UpdateGtmRecoveryPlanRequest)`

Modifies a disaster recovery plan..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `faultAddrPool` | string | No | The list of faulty address pools. Example: `["hra0or"]` |
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |
| `name` | string | No | The name of the disaster recovery plan. Example: `abc` |
| `recoveryPlanId` | number | Yes | The ID of the disaster recovery plan. Example: `100` |
| `remark` | string | No | The remarks about the disaster recovery plan. Example: `remark` |

