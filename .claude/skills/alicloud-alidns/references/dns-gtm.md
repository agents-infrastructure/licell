# DNS GTM (Global Traffic Manager)

DNS GTM instances, access strategies, address pools, and monitoring.

## addDnsGtmAccessStrategy

**Signature:** `addDnsGtmAccessStrategy(request: AddDnsGtmAccessStrategyRequest)`

Creates an access policy..

**Parameters:** (6 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | No | The ID of the address pool in the primary address pool set. Example: `pool1` |
| `lbaWeight` | number | No | The weight of the address pool in the primary address pool set. Example: `1` |
| `id` | string | No | The ID of the address pool in the secondary address pool set. Example: `pool1` |
| `lbaWeight` | number | No | The weight of the address pool in the secondary address pool set. Example: `1` |
| `defaultAddrPool` | AddDnsGtmAccessStrategyRequestDefaultAddrPool[] | Yes | The address pools in the primary address pool set. |
| `defaultAddrPoolType` | string | Yes | The type of the primary address pool. Valid values: Example: `ipv4` |
| `defaultLatencyOptimization` | string | No | Specifies whether to enable DNS resolution with optimal latency for the primary address pool set. Va Example: `open` |
| `defaultLbaStrategy` | string | No | The load balancing policy of the primary address pool set. Valid values: Example: `all_rr` |
| `defaultMaxReturnAddrNum` | number | No | The maximum number of addresses returned from the primary address pool set. Example: `3` |
| `defaultMinAvailableAddrNum` | number | Yes | The minimum number of available addresses in the primary address pool set. Example: `1` |
| `failoverAddrPool` | AddDnsGtmAccessStrategyRequestFailoverAddrPool[] | No | - |
| `failoverAddrPoolType` | string | No | The type of the secondary address pool. Valid values: Example: `ipv4` |
| `failoverLatencyOptimization` | string | No | Specifies whether to enable DNS resolution with optimal latency for the secondary address pool set.  Example: `open` |
| `failoverLbaStrategy` | string | No | The load balancing policy of the secondary address pool set. Valid values: Example: `all_rr` |
| `failoverMaxReturnAddrNum` | number | No | The maximum number of addresses returned from the secondary address pool set. Example: `1` |
| `failoverMinAvailableAddrNum` | number | No | The minimum number of available addresses in the secondary address pool set. Example: `1` |
| `instanceId` | string | Yes | The instance ID. Example: `instance1` |
| `lang` | string | No | The language of the values for specific response parameters. Default value: en. Valid values: en, zh Example: `en` |
| `lines` | string | No | The Domain Name System (DNS) request source. For example: `["default", "drpeng"]` indicates Global a Example: `["default",` |
| `strategyMode` | string | Yes | The type of the access policy. Valid values: Example: `geo` |
| `strategyName` | string | Yes | The name of the access policy. Example: `testStrategyName` |

## addDnsGtmAddressPool

**Signature:** `addDnsGtmAddressPool(request: AddDnsGtmAddressPoolRequest)`

Creates an address pool..

**Parameters:** (8 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addr` | string | Yes | The address in the address pool. Example: `1.1.1.1` |
| `attributeInfo` | string | Yes | The information about the source region of the address. The value of this parameter is a JSON string Example: `default` |
| `lbaWeight` | number | No | The weight of the address. Example: `1` |
| `mode` | string | Yes | The return mode of the addresses: Valid values: Example: `online` |
| `remark` | string | No | The description of the address pool. Example: `test` |
| `cityCode` | string | No | The city code. Example: `503` |
| `ispCode` | string | No | *   The Internet service provider (ISP) node. Specify the parameter according to the value of IspCod Example: `465` |
| `addr` | AddDnsGtmAddressPoolRequestAddr[] | Yes | The address pools. |
| `evaluationCount` | number | No | The number of consecutive failures. Example: `1` |
| `instanceId` | string | Yes | The instance ID. Example: `instance1` |
| `interval` | number | No | The health check interval. Unit: seconds. Example: `1` |
| `ispCityNode` | AddDnsGtmAddressPoolRequestIspCityNode[] | No | - |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `lbaStrategy` | string | Yes | The load balancing policy of the address pool. Valid values: Example: `all_rr` |
| `monitorExtendInfo` | string | No | The extended information. The required parameters vary based on the health check protocol. Example: `{\\"code\\":200,\\"path\\":\\"\\\\index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `monitorStatus` | string | No | Specifies whether to enable the health check feature. If you set this parameter to OPEN, the system  Example: `open` |
| `name` | string | Yes | The name of the address pool. Example: `test` |
| `protocolType` | string | No | The health check protocol. Valid values: Example: `http` |
| `timeout` | number | No | The timeout period. Unit: milliseconds. Example: `1` |
| `type` | string | Yes | The type of the address pool. Valid values: Example: `ipv4` |

## addDnsGtmMonitor

**Signature:** `addDnsGtmMonitor(request: AddDnsGtmMonitorRequest)`

**.

**Parameters:** (7 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cityCode` | string | No | The code of the city where the monitored node is deployed. Example: `123` |
| `ispCode` | string | No | The code of the Internet service provider (ISP) to which the monitored node belongs. Example: `123` |
| `addrPoolId` | string | Yes | The ID of the address pool. Example: `pool1` |
| `evaluationCount` | number | Yes | The maximum number of consecutive exceptions detected. If the number of consecutive exceptions detec Example: `1` |
| `interval` | number | Yes | The health check interval. Unit: seconds. Example: `60` |
| `ispCityNode` | AddDnsGtmMonitorRequestIspCityNode[] | Yes | The monitored nodes. |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `monitorExtendInfo` | string | Yes | The extended information. The required parameters vary based on the value of ProtocolType. Example: `{\\"code\\":200,\\"path\\":\\"\\\\index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `protocolType` | string | Yes | The health check protocol. Valid values: Example: `http` |
| `timeout` | number | Yes | The timeout period. Unit: milliseconds. Example: `30000` |

## deleteDnsGtmAccessStrategy

**Signature:** `deleteDnsGtmAccessStrategy(request: DeleteDnsGtmAccessStrategyRequest)`

@param request - DeleteDnsGtmAccessStrategyRequest.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |
| `strategyId` | string | Yes | The ID of the access policy. Example: `testStrategyId1` |

## deleteDnsGtmAddressPool

**Signature:** `deleteDnsGtmAddressPool(request: DeleteDnsGtmAddressPoolRequest)`

@param request - DeleteDnsGtmAddressPoolRequest.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addrPoolId` | string | Yes | The ID of the address pool. Example: `testpool1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |

## describeDnsGtmAccessStrategies

**Signature:** `describeDnsGtmAccessStrategies(request: DescribeDnsGtmAccessStrategiesRequest)`

Queries access policies of a Global Traffic Manager (GTM) instance..

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `1` |
| `strategyMode` | string | Yes | The type of the access policy. Valid values: Example: `geo` |

## describeDnsGtmAccessStrategy

**Signature:** `describeDnsGtmAccessStrategy(request: DescribeDnsGtmAccessStrategyRequest)`

Queries detailed information about an access policy of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |
| `strategyId` | string | Yes | The ID of the access policy. Example: `strategyId1` |

## describeDnsGtmAccessStrategyAvailableConfig

**Signature:** `describeDnsGtmAccessStrategyAvailableConfig(request: DescribeDnsGtmAccessStrategyAvailableConfigRequest)`

Queries the available configurations of an access policy of a Global Traffic Manager (GTM) instance..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |
| `strategyMode` | string | Yes | The type of the access policy. Valid values: Example: `geo` |

## describeDnsGtmAddrAttributeInfo

**Signature:** `describeDnsGtmAddrAttributeInfo(request: DescribeDnsGtmAddrAttributeInfoRequest)`

Queries the source regions of addresses..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addrs` | string | Yes | The addresses. Example: `["1.1.1.1"]` |
| `lang` | string | No | The language of the values for specific response parameters. Default value: en. Valid values: en, zh Example: `en` |
| `type` | string | Yes | The type of addresses. Valid values: Example: `ipv4` |

## describeDnsGtmAddressPoolAvailableConfig

**Signature:** `describeDnsGtmAddressPoolAvailableConfig(request: DescribeDnsGtmAddressPoolAvailableConfigRequest)`

Queries the available configurations of an address pool of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |

## describeDnsGtmAvailableAlertGroup

**Signature:** `describeDnsGtmAvailableAlertGroup(request: DescribeDnsGtmAvailableAlertGroupRequest)`

@param request - DescribeDnsGtmAvailableAlertGroupRequest.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |

## describeDnsGtmInstance

**Signature:** `describeDnsGtmInstance(request: DescribeDnsGtmInstanceRequest)`

Queries detailed information about a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance about which you want to query the information. Example: `instance1` |
| `lang` | string | No | The language in which you want the values of some response parameters to be returned. These response Example: `en` |

## describeDnsGtmInstanceAddressPool

**Signature:** `describeDnsGtmInstanceAddressPool(request: DescribeDnsGtmInstanceAddressPoolRequest)`

Queries detailed information about an address pool of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addrPoolId` | string | Yes | The ID of the address pool. Example: `testpool1` |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |

## describeDnsGtmInstanceAddressPools

**Signature:** `describeDnsGtmInstanceAddressPools(request: DescribeDnsGtmInstanceAddressPoolsRequest)`

Queries the address pools of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: 100. Default value: 20. Example: `1` |

## describeDnsGtmInstanceStatus

**Signature:** `describeDnsGtmInstanceStatus(request: DescribeDnsGtmInstanceStatusRequest)`

Queries the status of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |

## describeDnsGtmInstanceSystemCname

**Signature:** `describeDnsGtmInstanceSystemCname(request: DescribeDnsGtmInstanceSystemCnameRequest)`

Queries the CNAME domain name assigned by the system for a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |

## describeDnsGtmInstances

**Signature:** `describeDnsGtmInstances(request: DescribeDnsGtmInstancesRequest)`

Queries a list of instances..

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | The keyword that you use for the query. Fuzzy search by instance ID or instance name is supported. Example: `instance1` |
| `lang` | string | No | The language of the values for specific response parameters. Default value: en. Valid values: en, zh Example: `en` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **100**. Default value: **20**. Example: `1` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-testgroupid` |

## describeDnsGtmLogs

**Signature:** `describeDnsGtmLogs(request: DescribeDnsGtmLogsRequest)`

Queries operation logs of a Global Traffic Manager (GTM) instance..

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTimestamp` | number | No | The timestamp that specifies the end of the time range to query. Example: `1516779348000` |
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `keyword` | string | No | The keyword for searches in "%KeyWord%" mode. The value is not case-sensitive. Example: `demo` |
| `lang` | string | No | The language to return some response parameters. Default value: en. Valid values: en, zh, and ja. Example: `en` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: 100. Default value: 20. Example: `1` |
| `startTimestamp` | number | No | The timestamp that specifies the beginning of the time range to query. Example: `1516779348000` |

## describeDnsGtmMonitorAvailableConfig

**Signature:** `describeDnsGtmMonitorAvailableConfig(request: DescribeDnsGtmMonitorAvailableConfigRequest)`

Queries the configuration items that can be set for a health check task..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |

## describeDnsGtmMonitorConfig

**Signature:** `describeDnsGtmMonitorConfig(request: DescribeDnsGtmMonitorConfigRequest)`

Queries the health check configuration of an address pool..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `monitorConfigId` | string | Yes | The ID of the health check task. Example: `MonitorConfigId1` |

## setDnsGtmAccessMode

**Signature:** `setDnsGtmAccessMode(request: SetDnsGtmAccessModeRequest)`

***.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accessMode` | string | Yes | The switchover policy for primary and secondary address pool sets. Valid values: Example: `auto` |
| `lang` | string | No | The language of the values for specific response parameters. Default value: en. Valid values: en, zh Example: `en` |
| `strategyId` | string | Yes | The policy ID. Example: `strategyId` |

## setDnsGtmMonitorStatus

**Signature:** `setDnsGtmMonitorStatus(request: SetDnsGtmMonitorStatusRequest)`

Specifies the health check status of an address pool..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | The language of the values for specific response parameters. Default value: en. Valid values: en, zh Example: `en` |
| `monitorConfigId` | string | Yes | The ID of the health check task. Example: `MonitorConfigId1` |
| `status` | string | Yes | Specifies whether to enable the health check feature. Valid values: Example: `open` |

## switchDnsGtmInstanceStrategyMode

**Signature:** `switchDnsGtmInstanceStrategyMode(request: SwitchDnsGtmInstanceStrategyModeRequest)`

Changes the access policy type for a Global Traffic Manager (GTM) instance..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the GTM instance. Example: `instance1` |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `strategyMode` | string | Yes | The access policy type. Valid values: Example: `GEO` |

## updateDnsGtmAccessStrategy

**Signature:** `updateDnsGtmAccessStrategy(request: UpdateDnsGtmAccessStrategyRequest)`

Modifies an access policy..

**Parameters:** (5 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | No | The ID of the address pool in the primary address pool set. Example: `pool1` |
| `lbaWeight` | number | No | The weight of the address pool in the primary address pool set. Example: `1` |
| `id` | string | No | The ID of the address pool in the secondary address pool set. Example: `pool1` |
| `lbaWeight` | number | No | The weight of the address pool in the secondary address pool set. Example: `1` |
| `accessMode` | string | No | The primary/secondary switchover policy for address pool sets. Valid values: Example: `DEFAULT` |
| `defaultAddrPool` | UpdateDnsGtmAccessStrategyRequestDefaultAddrPool[] | Yes | The address pools in the primary address pool set. |
| `defaultAddrPoolType` | string | Yes | The type of the primary address pool. Valid values: Example: `ipv4` |
| `defaultLatencyOptimization` | string | No | Specifies whether to enable Domain Name System (DNS) resolution with optimal latency for the primary Example: `open` |
| `defaultLbaStrategy` | string | No | The load balancing policy of the primary address pool set. Valid values: Example: `all_rr` |
| `defaultMaxReturnAddrNum` | number | No | The maximum number of addresses returned from the primary address pool set. Example: `1` |
| `defaultMinAvailableAddrNum` | number | Yes | The minimum number of available addresses in the primary address pool set. Example: `1` |
| `failoverAddrPool` | UpdateDnsGtmAccessStrategyRequestFailoverAddrPool[] | No | - |
| `failoverAddrPoolType` | string | No | The type of the secondary address pool. Valid values: Example: `ipv4` |
| `failoverLatencyOptimization` | string | No | Specifies whether to enable DNS resolution with optimal latency for the secondary address pool set.  Example: `open` |
| `failoverLbaStrategy` | string | No | The load balancing policy of the secondary address pool set. Valid values: Example: `all_rr` |
| `failoverMaxReturnAddrNum` | number | No | The maximum number of addresses returned from the secondary address pool set. Example: `1` |
| `failoverMinAvailableAddrNum` | number | No | The minimum number of available addresses in the secondary address pool set. Example: `1` |
| `lang` | string | No | The language of the values for specific response parameters. Default value: en. Valid values: en, zh Example: `en` |
| `lines` | string | No | The line codes of the source regions. Example: `["default", "drpeng"]`, which indicates the global l Example: `["default",` |
| `strategyId` | string | Yes | The ID of the access policy. Example: `StrategyId1` |
| `strategyName` | string | Yes | The name of the access policy. Example: `StrategyName1` |

## updateDnsGtmAddressPool

**Signature:** `updateDnsGtmAddressPool(request: UpdateDnsGtmAddressPoolRequest)`

Modifies an address pool..

**Parameters:** (5 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addr` | string | Yes | The address in the address pool. Example: `1.1.1.1` |
| `attributeInfo` | string | No | The information about the source region of the address. The value of the parameter is a string in th Example: `Linecode:default,lineCodes:["default"],lineCodeRectifyType:"NO_NEED"` |
| `lbaWeight` | number | No | The weight of the address. Example: `1` |
| `mode` | string | Yes | The return mode of the addresses. Valid values: Example: `online` |
| `remark` | string | No | The description of the address pool. Example: `test` |
| `addr` | UpdateDnsGtmAddressPoolRequestAddr[] | Yes | The address pools. |
| `addrPoolId` | string | Yes | The ID of the address pool. Example: `testpool1` |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `lbaStrategy` | string | Yes | The load balancing policy of the address pool. Valid values: Example: `all_rr` |
| `name` | string | No | The name of the address pool. Example: `testpoolname` |

## updateDnsGtmInstanceGlobalConfig

**Signature:** `updateDnsGtmInstanceGlobalConfig(request: UpdateDnsGtmInstanceGlobalConfigRequest)`

Modifies the configurations of a Global Traffic Manager (GTM) instance..

**Parameters:** (3 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dingtalkNotice` | boolean | No | - Example: `true` |
| `emailNotice` | boolean | No | - Example: `true` |
| `noticeType` | string | No | - Example: `ADDR_ALERT` |
| `smsNotice` | boolean | No | - Example: `true` |
| `alertGroup` | string | No | The name of the alert group in the JSON format. Example: `alertGroup1` |
| `cnameType` | string | No | The type of the canonical name (CNAME). Example: `public` |
| `forceUpdate` | boolean | No | Specifies whether to enable force updates. Valid values: Example: `true` |
| `instanceId` | string | Yes | The ID of the instance. Example: `instance1` |
| `instanceName` | string | Yes | The name of the instance. This parameter is required only for the first update. Example: `test` |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `publicCnameMode` | string | No | Specifies whether to use a custom CNAME domain name or a CNAME domain name assigned by the system to Example: `custom` |
| `publicRr` | string | No | The hostname corresponding to the CNAME domain name that is used to access the instance over the Int Example: `test.rr` |
| `publicUserDomainName` | string | No | The service domain name that is used over the Internet. Example: `example.com` |
| `publicZoneName` | string | Yes | The CNAME domain name that is used to access the instance over the Internet, which is the primary do Example: `gtm-003.com` |
| `ttl` | number | No | The global time to live (TTL). Example: `1` |

## updateDnsGtmMonitor

**Signature:** `updateDnsGtmMonitor(request: UpdateDnsGtmMonitorRequest)`

Modifies a health check task..

**Parameters:** (4 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cityCode` | string | No | The code of the city where the monitored node is deployed. Example: `123` |
| `ispCode` | string | No | The code of the Internet service provider (ISP) to which the monitored node belongs. Example: `123` |
| `evaluationCount` | number | No | The maximum number of consecutive exceptions detected. If the number of consecutive exceptions detec Example: `2` |
| `interval` | number | No | The health check interval. Unit: seconds. Example: `60` |
| `ispCityNode` | UpdateDnsGtmMonitorRequestIspCityNode[] | Yes | The monitored nodes. |
| `lang` | string | No | The language of the values of specific response parameters. Default value: en. Valid values: en, zh, Example: `en` |
| `monitorConfigId` | string | Yes | The ID of the health check configuration. Example: `MonitorConfigId1` |
| `monitorExtendInfo` | string | Yes | The extended information. The required parameters vary based on the health check protocol. Example: `{\\"code\\":200,\\"path\\":\\"\\\\index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `protocolType` | string | Yes | The protocol used for the health check. Valid values: Example: `http` |
| `timeout` | number | No | The timeout period. Unit: milliseconds. Example: `3000` |

## validateDnsGtmCnameRrCanUse

**Signature:** `validateDnsGtmCnameRrCanUse(request: ValidateDnsGtmCnameRrCanUseRequest)`

检查实例主机名是否可添加.

**Parameters:** (5 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cnameMode` | string | Yes | - |
| `cnameRr` | string | Yes | - |
| `cnameType` | string | Yes | - |
| `cnameZone` | string | Yes | - |
| `instanceId` | string | Yes | - |

