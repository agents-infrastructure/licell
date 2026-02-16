# Cloud GTM (Global Traffic Manager)

Cloud GTM instances, configs, address pools, addresses, monitors, and alerts.

## createCloudGtmAddress

**Signature:** `createCloudGtmAddress(request: CreateCloudGtmAddressRequest)`

Creates an address..

**Parameters:** (7 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `port` | number | No | The service port of the address on which health check tasks are performed. If the ping protocol is u Example: `80` |
| `templateId` | string | No | The ID of the health check template associated with the address. Example: `mtp-89518052425100**80` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |
| `address` | string | Yes | IP address or domain name. Example: `223.5.XX.XX` |
| `attributeInfo` | string | No | Address ownership information. Example: `This` |
| `availableMode` | string | Yes | The failover mode that is used when address exceptions are identified. Valid values: Example: `auto` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | Yes | Indicates the current enabled status of the address: - enable: Enabled status  - disable: Disabled s Example: `enable` |
| `healthJudgement` | string | Yes | The condition for determining the health status of the address. This parameter is required when Heal Example: `p50_ok` |
| `healthTasks` | CreateCloudGtmAddressRequestHealthTasks[] | No | - |
| `manualAvailableStatus` | string | Yes | The availability state of the address. This parameter is required when AvailableMode is set to **man Example: `available` |
| `name` | string | Yes | Address name. Example: `Address-1` |
| `remark` | string | No | Remarks. Example: `test` |
| `type` | string | Yes | Address type: - IPv4 - IPv6 - domain Example: `IPv4` |

## createCloudGtmAddressPool

**Signature:** `createCloudGtmAddressPool(request: CreateCloudGtmAddressPoolRequest)`

Creates an address pool..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolName` | string | No | Address pool name, helping users distinguish the purpose of address pools. Example: `Address` |
| `addressPoolType` | string | No | The type of the address pool. Valid values: Example: `IPv4` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | The enabling state of the address pool. Valid values: Example: `enable` |
| `healthJudgement` | string | No | The condition for determining the health status of the address pool. Valid values: Example: `any_ok` |
| `remark` | string | No | Remarks for the address pool, helping users distinguish the usage scenarios of different address poo Example: `app` |

## createCloudGtmInstanceConfig

**Signature:** `createCloudGtmInstanceConfig(request: CreateCloudGtmInstanceConfigRequest)`

创建gtm实例配置.

**Parameters:** (0 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `chargeType` | string | No | - Example: `postpay/prepay` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | The enabling state of the access domain name. Valid values: Example: `enable` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) 3.0 instance. This ID uniquely identifies a GTM 3.0 insta Example: `gtm-cn-jmp3qnw**03` |
| `remark` | string | No | The description of the access domain name. Example: `test` |
| `scheduleHostname` | string | No | The hostname of the access domain name. Example: `www` |
| `scheduleRrType` | string | No | The type of the Domain Name System (DNS) record configured for the access domain name. Valid values: Example: `A` |
| `scheduleZoneMode` | string | No | The configuration mode of the access domain name. Valid values: Example: `custom` |
| `scheduleZoneName` | string | No | The name of the parent zone for the access domain name configured in GTM. In most cases, the value o Example: `example.com` |
| `ttl` | number | No | The global time to live (TTL) period. Unit: seconds. The global TTL period affects how long the DNS  Example: `30` |

## createCloudGtmMonitorTemplate

**Signature:** `createCloudGtmMonitorTemplate(request: CreateCloudGtmMonitorTemplateRequest)`

Creates a health check template..

**Parameters:** (8 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cityCode` | string | No | The city code of the health check node. Example: `503` |
| `ispCode` | string | No | The Internet service provider (ISP) code of the health check node. Example: `465` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `evaluationCount` | number | Yes | This parameter is required. Example: `2` |
| `extendInfo` | string | No | The extended information. The value of this parameter is a JSON string. The required parameters vary Example: `{\\"code\\":200,\\"path\\":\\"\\\\index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `failureRate` | number | Yes | This parameter is required. Example: `50` |
| `interval` | number | Yes | This parameter is required. Example: `60` |
| `ipVersion` | string | Yes | The IP address type of health check nodes. Valid values: Example: `IPv4` |
| `ispCityNodes` | CreateCloudGtmMonitorTemplateRequestIspCityNodes[] | Yes | The health check nodes. You can call the [ListCloudGtmMonitorNodes](~~ListCloudGtmMonitorNodes~~) op |
| `name` | string | Yes | The name of the health check template. We recommend that you use a name that distinguishes the type  Example: `Ping-IPv4` |
| `protocol` | string | Yes | This parameter is required. Example: `ping` |
| `timeout` | number | Yes | This parameter is required. Example: `5000` |

## deleteCloudGtmAddress

**Signature:** `deleteCloudGtmAddress(request: DeleteCloudGtmAddressRequest)`

Deletes an address..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressId` | string | Yes | The address ID. This ID uniquely identifies the address. Example: `addr-895182181143688192` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## deleteCloudGtmAddressPool

**Signature:** `deleteCloudGtmAddressPool(request: DeleteCloudGtmAddressPoolRequest)`

Deletes an address pool..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89528023225442**16` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## deleteCloudGtmInstanceConfig

**Signature:** `deleteCloudGtmInstanceConfig(request: DeleteCloudGtmInstanceConfigRequest)`

Deletes an access domain name that is configured for a Global Traffic Manager (GTM) 3.0 instance..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `config-000**1` |
| `instanceId` | string | No | The access domain name that is configured for the desired GTM 3.0 instance. You can delete only one  Example: `gtm-cn-jmp3qnw**03` |

## deleteCloudGtmMonitorTemplate

**Signature:** `deleteCloudGtmMonitorTemplate(request: DeleteCloudGtmMonitorTemplateRequest)`

Deletes a health check template..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language in which the returned results are displayed. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `templateId` | string | Yes | The ID of the health check template. This ID uniquely identifies a health check template. Example: `mtp-89518052425100**80` |

## describeCloudGtmAddress

**Signature:** `describeCloudGtmAddress(request: DescribeCloudGtmAddressRequest)`

Queries the configurations of an address..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressId` | string | Yes | The address ID. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## describeCloudGtmAddressPool

**Signature:** `describeCloudGtmAddressPool(request: DescribeCloudGtmAddressPoolRequest)`

Queries the configurations of an address pool..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89564674533755**96` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## describeCloudGtmAddressPoolReference

**Signature:** `describeCloudGtmAddressPoolReference(request: DescribeCloudGtmAddressPoolReferenceRequest)`

Queries the information about the access domain names that reference an address pool..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89528023225442**16` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## describeCloudGtmAddressReference

**Signature:** `describeCloudGtmAddressReference(request: DescribeCloudGtmAddressReferenceRequest)`

Queries the information about the address pools and Global Traffic Manager (GTM) 3.0 instances that reference an address..

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressId` | string | No | The address ID. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## describeCloudGtmGlobalAlert

**Signature:** `describeCloudGtmGlobalAlert(request: DescribeCloudGtmGlobalAlertRequest)`

查询全局流量管理告警配置.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## describeCloudGtmInstanceConfigAlert

**Signature:** `describeCloudGtmInstanceConfigAlert(request: DescribeCloudGtmInstanceConfigAlertRequest)`

@param request - DescribeCloudGtmInstanceConfigAlertRequest.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) 3.0 instance. Example: `gtm-cn-wwo3a3hbz**` |

## describeCloudGtmInstanceConfigFullInfo

**Signature:** `describeCloudGtmInstanceConfigFullInfo(request: DescribeCloudGtmInstanceConfigFullInfoRequest)`

Queries the complete configuration information about a Global Traffic Manager (GTM) instance..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the GTM 3.0 instance. Example: `gtm-cn-wwo3a3hbz**` |

## describeCloudGtmMonitorTemplate

**Signature:** `describeCloudGtmMonitorTemplate(request: DescribeCloudGtmMonitorTemplateRequest)`

Queries the configurations of a health check template..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `templateId` | string | Yes | The ID of the health check template that you want to query. This ID uniquely identifies the health c Example: `mtp-89518052425100**80` |

## describeCloudGtmSummary

**Signature:** `describeCloudGtmSummary(request: DescribeCloudGtmSummaryRequest)`

@param request - DescribeCloudGtmSummaryRequest.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |

## listCloudGtmAddressPools

**Signature:** `listCloudGtmAddressPools(request: ListCloudGtmAddressPoolsRequest)`

Queries a list of address pools..

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolName` | string | No | Address pool name. Example: `AddressPool-1` |
| `addressPoolType` | string | No | The type of the address pool. Valid values: Example: `IPv4` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | The enabling state of the address pool. Valid values: Example: `enable` |
| `pageNumber` | number | No | Current page number, starting at **1**, default is **1**. Example: `1` |
| `pageSize` | number | No | The number of rows per page when paginating queries, with a maximum value of **100**, and a default  Example: `20` |
| `remark` | string | No | The additional description of the address pool. Example: `test` |

## listCloudGtmAddresses

**Signature:** `listCloudGtmAddresses(request: ListCloudGtmAddressesRequest)`

Queries a list of addresses..

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | Return language value, options: - zh-CN: Chinese. - en-US: English. Example: `en-US` |
| `address` | string | No | IP address or domain name. Example: `223.5.XX.XX` |
| `addressId` | string | No | The address ID. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | Indicates the current availability of the address: - enable: Enabled status - disable: Disabled stat Example: `enable` |
| `healthStatus` | string | No | The health check state of the address. Valid values: Example: `ok` |
| `monitorTemplateId` | string | No | The ID of the health check template. This ID uniquely identifies the health check template. Example: `mtp-89518052425100**80` |
| `name` | string | No | Address name. Example: `test` |
| `pageNumber` | number | Yes | Current page number, starting from **1**, default is **1**. Example: `1` |
| `pageSize` | number | Yes | The number of rows per page when paginating queries, with a maximum value of 100 and a default of 20 Example: `20` |
| `type` | string | No | Address type: - IPv4 - IPv6 - domain Example: `IPv4` |

## listCloudGtmAlertLogs

**Signature:** `listCloudGtmAlertLogs(request: ListCloudGtmAlertLogsRequest)`

@param request - ListCloudGtmAlertLogsRequest.

**Parameters:** (4 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionType` | string | No | Alert type: - ALERT - RESUME Example: `ALERT` |
| `endTimestamp` | number | Yes | The end time of the query (timestamp). Example: `1711328826977` |
| `entityType` | string | No | Alarm object types: - GTM_ADDRESS: Address - GTM_ADDRESS_POOL: Address Pool - GTM_INSTANCE: Instance Example: `GTM_ADDRESS` |
| `keyword` | string | No | Search keyword, usually an address ID, address pool ID, domain information, etc. Example: `pool-895280232254422016` |
| `lang` | string | No | Language type of the returned information: - zh-CN: Chinese - en-US: English Example: `zh-CN` |
| `pageNumber` | number | Yes | Current page number, starting from **1**, default is **1**. Example: `1` |
| `pageSize` | number | Yes | The number of rows per page when paginating queries, with a maximum value of 100 and a default of 20 Example: `20` |
| `startTimestamp` | number | Yes | The start time of the query (timestamp). Example: `1611328826977` |

## listCloudGtmAvailableAlertGroups

**Signature:** `listCloudGtmAvailableAlertGroups(request: ListCloudGtmAvailableAlertGroupsRequest)`

@param request - ListCloudGtmAvailableAlertGroupsRequest.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |

## listCloudGtmInstanceConfigs

**Signature:** `listCloudGtmInstanceConfigs(request: ListCloudGtmInstanceConfigsRequest)`

Queries the configurations of a Global Traffic Manager (GTM) instance, including the information about access domain names and address pools..

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | The enabling state of the access domain name. Valid values: Example: `enable` |
| `instanceId` | string | No | The ID of the GTM 3.0 instance. Example: `gtm-cn-wwo3a3hbz**` |
| `pageNumber` | number | No | Current page number, starting at **1**, default is **1**. Example: `1` |
| `pageSize` | number | No | The number of rows per page when paginating queries, with a maximum value of **100**, and a default  Example: `20` |
| `remark` | string | No | Remarks. Example: `test` |
| `scheduleDomainName` | string | No | The GTM access domain name. The value of this parameter is composed of the value of ScheduleHostname Example: `www.example.com` |
| `scheduleZoneName` | string | No | The zone (such as example.com) or subzone (such as a.example.com) of the GTM access domain name. In  Example: `example.com` |

## listCloudGtmInstances

**Signature:** `listCloudGtmInstances(request: ListCloudGtmInstancesRequest)`

Queries a list of Global Traffic Manager (GTM) 3.0 instances..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | Return language value. Options: - zh-CN: Chinese. - en-US: English. Example: `en-US` |
| `chargeType` | string | No | - Example: `postpay/prepay` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `instanceId` | string | No | The ID of the GTM instance. Example: `gtm-cn-jmp3qnw**03` |
| `instanceName` | string | No | Instance name, used to distinguish the business purpose of the instance. Example: `test` |
| `pageNumber` | number | No | Current page number, starting from **1**, default is **1**. Example: `1` |
| `pageSize` | number | No | The number of rows per page when paginating queries, with a maximum value of **100**, and a default  Example: `20` |

## listCloudGtmMonitorNodes

**Signature:** `listCloudGtmMonitorNodes(request: ListCloudGtmMonitorNodesRequest)`

Queries a list of health check nodes..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |

## listCloudGtmMonitorTemplates

**Signature:** `listCloudGtmMonitorTemplates(request: ListCloudGtmMonitorTemplatesRequest)`

Queries a list of health check templates..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `ipVersion` | string | No | The IP address type of health check nodes. Valid values: Example: `IPv4` |
| `name` | string | No | The name of the health check probe template, which is recommended to be distinguishable for configur Example: `IPv4-Ping` |
| `pageNumber` | number | Yes | Current page number, starting from **1**, default is **1**. Example: `1` |
| `pageSize` | number | Yes | The number of rows per page when paginating queries, with a maximum value of 100 and a default of 20 Example: `20` |
| `protocol` | string | No | Protocol types for initiating probes to the target IP address: - ping - tcp - http - https Example: `ping` |

## replaceCloudGtmAddressPoolAddress

**Signature:** `replaceCloudGtmAddressPoolAddress(request: ReplaceCloudGtmAddressPoolAddressRequest)`

Replaces the addresses referenced by an address pool..

**Parameters:** (0 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addressId` | string | No | The ID of the new address. This ID uniquely identifies the address. Example: `addr-89636516932803**44` |
| `requestSource` | string[] | No | - |
| `serialNumber` | number | No | The sequence number that specifies the priority for returning the new address. A smaller sequence nu Example: `1` |
| `weightValue` | number | No | The weight value of the new address. You can set a different weight value for each address. This way Example: `1` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool for which you want to replace addresses. This ID uniquely identifies the  Example: `pool-89618921167339**24` |
| `addresses` | ReplaceCloudGtmAddressPoolAddressRequestAddresses[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## replaceCloudGtmInstanceConfigAddressPool

**Signature:** `replaceCloudGtmInstanceConfigAddressPool(request: ReplaceCloudGtmInstanceConfigAddressPoolRequest)`

Replaces address pools that are associated with a Global Traffic Manager (GTM) 3.0 instance with new address pools..

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89564542105737**12` |
| `requestSource` | string[] | No | - |
| `serialNumber` | number | No | The sequence number of the new address pool. The address pool with the smallest sequence number is p Example: `1` |
| `weightValue` | number | No | The weight value of the new address pool. You can set a different weight value for each address pool Example: `1` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPools` | ReplaceCloudGtmInstanceConfigAddressPoolRequestAddressPools[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the GTM 3.0 instance for which you want to change address pools. Example: `gtm-cn-wwo3a3hbz**` |

## searchCloudGtmAddressPools

**Signature:** `searchCloudGtmAddressPools(request: SearchCloudGtmAddressPoolsRequest)`

Queries a list of address pools..

**Parameters:** (0 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolName` | string | No | Address pool name, supports fuzzy search for the entered address pool name. Example: `AddressPool-1` |
| `addressPoolType` | string | No | Address pool type, supports precise query for address pool types: - IPv4 - IPv6 - domain Example: `IPv4` |
| `availableStatus` | string | No | Address pool availability status, supporting precise queries for address pool availability: - availa Example: `available` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | Address pool enable status, supports precise query of address pool enable status: - enable: Enabled  Example: `enable` |
| `healthStatus` | string | No | The health state of the address pool. You can enter a health state for exact search. Valid values: Example: `ok` |
| `pageNumber` | number | No | Current page number, starting from 1, default is 1. Example: `1` |
| `pageSize` | number | No | The number of rows per page when paginating queries, with a maximum value of 100 and a default of 20 Example: `20` |
| `remark` | string | No | Address pool remarks, supporting fuzzy search for the input remarks. Example: `test` |

## searchCloudGtmAddresses

**Signature:** `searchCloudGtmAddresses(request: SearchCloudGtmAddressesRequest)`

Queries a list of addresses based on address names, descriptions, health check templates referenced by the addresses, or address IDs..

**Parameters:** (4 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `address` | string | No | Query by service address with precise conditions, supporting IP addresses or domain names. Example: `223.5.XX.XX` |
| `addressId` | string | No | The address ID. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `availableStatus` | string | No | Search by address availability status with precise conditions: - available - unavailable Example: `available` |
| `enableStatus` | string | No | Query by exact address enable status: - enable: enabled status - disable: disabled status Example: `enable` |
| `healthStatus` | string | No | The health state of the addresses that you want to query. Valid values: Example: `ok` |
| `monitorTemplateName` | string | No | Health check template name. Example: `Ping-IPv4` |
| `nameSearchCondition` | string | Yes | The logical condition for querying addresses by name. This parameter is required if you want to quer Example: `or` |
| `names` | string[] | No | - |
| `pageNumber` | number | Yes | Current page number, starting from 1, default is 1. Example: `1` |
| `pageSize` | number | Yes | The number of rows per page when paginating queries, with a maximum value of 100 and a default of 20 Example: `20` |
| `remarkSearchCondition` | string | Yes | The logical condition for querying addresses by additional description. This parameter is required i Example: `or` |
| `remarks` | string[] | No | - |
| `type` | string | No | Search precisely by address type conditions: - IPv4 - IPv6 - domain Example: `IPv4` |

## searchCloudGtmInstanceConfigs

**Signature:** `searchCloudGtmInstanceConfigs(request: SearchCloudGtmInstanceConfigsRequest)`

Queries the configurations of an access domain name..

**Parameters:** (0 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |
| `availableStatus` | string | No | The availability state of the access domain name. Valid values: Example: `available` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | The enabling state of the access domain name. Valid values: Example: `enable` |
| `healthStatus` | string | No | The health state of the access domain name. Valid values: Example: `ok` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) 3.0 instance. Example: `gtm-cn-wwo3a3hbz**` |
| `pageNumber` | number | No | Current page number, starting from 1, default is 1. Example: `1` |
| `pageSize` | number | No | The number of rows per page when paginating queries, with a maximum value of **100**, and a default  Example: `20` |
| `remark` | string | No | Remarks for the domain instance. Example: `test` |
| `scheduleDomainName` | string | No | The access domain name. The value of this parameter is composed of the value of ScheduleHostname and Example: `www.example.com` |
| `scheduleZoneName` | string | No | The zone such as example.com or subzone such as a.example.com of the access domain name. In most cas Example: `example.com` |

## searchCloudGtmInstances

**Signature:** `searchCloudGtmInstances(request: SearchCloudGtmInstancesRequest)`

Queries a list of instances..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the return value. Options are: - **zh-CN**: Chinese.  - **en-US**: English. Example: `en-US` |
| `chargeType` | string | No | - Example: `prepay` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) 3.0 instance. Example: `gtm-cn-wwo3a3hbz**` |
| `instanceName` | string | No | Schedule instance name, supports fuzzy search. Example: `test` |
| `pageNumber` | number | No | Current page number, starting from 1, default is 1. Example: `1` |
| `pageSize` | number | No | The number of rows per page when paginating queries, with a maximum value of **100**, and a default  Example: `20` |

## searchCloudGtmMonitorTemplates

**Signature:** `searchCloudGtmMonitorTemplates(request: SearchCloudGtmMonitorTemplatesRequest)`

Queries the list of health check templates..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `ipVersion` | string | No | The IP address type of health check nodes. An exact search is performed based on the IP address type Example: `IPv4` |
| `name` | string | No | - Example: `IPv4-Ping` |
| `pageNumber` | number | Yes | This parameter is required. Example: `1` |
| `pageSize` | number | Yes | This parameter is required. Example: `20` |
| `protocol` | string | No | - Example: `ping` |

## setCloudGtmInstanceConfigLogSwitch

**Signature:** `setCloudGtmInstanceConfigLogSwitch(request: SetCloudGtmInstanceConfigLogSwitchRequest)`

设置全局流量管理实例配置日志开关.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `F4D7C841-A1C9-50B4-88B7-F5****` |
| `configId` | string | Yes | This parameter is required. Example: `Config-000****` |
| `instanceId` | string | No | - Example: `gtm-cn-wwo3a3h****` |
| `status` | string | Yes | This parameter is required. Example: `enable` |

## updateCloudGtmAddress

**Signature:** `updateCloudGtmAddress(request: UpdateCloudGtmAddressRequest)`

Modifies the condition for determining the health status of a specified address..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `port` | number | No | The service port of the address on which health check tasks are performed. If the ping protocol is u Example: `80` |
| `templateId` | string | Yes | The ID of the health check template that is associated with the address. This parameter is required  Example: `mtp-89518052425100**80` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `address` | string | No | The IP address or domain name. Example: `223.5.XX.XX` |
| `addressId` | string | Yes | The ID of the address. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `attributeInfo` | string | No | Address Attribution information. Example: `This` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `healthJudgement` | string | No | The new condition for determining the health state of the address. Valid values: Example: `p50_ok` |
| `healthTasks` | UpdateCloudGtmAddressRequestHealthTasks[] | No | - |
| `name` | string | No | The name of the address. Example: `Address-1` |

## updateCloudGtmAddressEnableStatus

**Signature:** `updateCloudGtmAddressEnableStatus(request: UpdateCloudGtmAddressEnableStatusRequest)`

If an address is **enabled** and the health status of the address is **Normal**, the availability status of the address is **Available**. *   If an address is **disabled** or the health status of the .

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the returned results. Valid values: Example: `en-US` |
| `addressId` | string | Yes | The ID of the address. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | Yes | The enabling state of the address. Valid values: Example: `enable` |

## updateCloudGtmAddressManualAvailableStatus

**Signature:** `updateCloudGtmAddressManualAvailableStatus(request: UpdateCloudGtmAddressManualAvailableStatusRequest)`

Modifies the failover mode that is used when address exceptions are identified..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressId` | string | Yes | The ID of the address. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `availableMode` | string | No | The failover mode that is used when address exceptions are identified. Valid values: Example: `manual` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `manualAvailableStatus` | string | No | The availability state of the address when AvailableMode is set to manual. Valid values: Example: `available` |

## updateCloudGtmAddressPoolBasicConfig

**Signature:** `updateCloudGtmAddressPoolBasicConfig(request: UpdateCloudGtmAddressPoolBasicConfigRequest)`

Modifies the basic configurations of an address pool..

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89528023225442**16` |
| `addressPoolName` | string | No | Address pool name, helping users distinguish the purpose of address pools. Example: `app` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `healthJudgement` | string | No | The condition for determining the health status of the address pool. Valid values: Example: `any_ok` |

## updateCloudGtmAddressPoolEnableStatus

**Signature:** `updateCloudGtmAddressPoolEnableStatus(request: UpdateCloudGtmAddressPoolEnableStatusRequest)`

If an address pool is **enabled** and the health status of the address pool is **Normal**, the availability status of the address pool is **Available**. *   If an address pool is **disabled** or the h.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89528023225442**16` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `enableStatus` | string | No | The enabling state of the address pool. Valid values: Example: `enable` |

## updateCloudGtmAddressPoolLbStrategy

**Signature:** `updateCloudGtmAddressPoolLbStrategy(request: UpdateCloudGtmAddressPoolLbStrategyRequest)`

Modifies the load balancing policy of an address pool..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressLbStrategy` | string | No | Load balancing policy among addresses in the address pool: - round_robin: Round-robin, for any sourc Example: `sequence` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89528023225442**16` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `sequenceLbStrategyMode` | string | Yes | The mode used if the address with the smallest sequence number is recovered. This parameter is requi Example: `preemptive` |

## updateCloudGtmAddressPoolRemark

**Signature:** `updateCloudGtmAddressPoolRemark(request: UpdateCloudGtmAddressPoolRemarkRequest)`

Modifies the remarks of an address pool..

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressPoolId` | string | No | The ID of the address pool. This ID uniquely identifies the address pool. Example: `pool-89528023225442**16` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `remark` | string | No | The input parameter serves as the updated note; if an empty value is passed, the note will be delete Example: `test` |

## updateCloudGtmAddressRemark

**Signature:** `updateCloudGtmAddressRemark(request: UpdateCloudGtmAddressRemarkRequest)`

Modifies the remarks of an address..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `addressId` | string | Yes | The ID of the address. This ID uniquely identifies the address. Example: `addr-89518218114368**92` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `remark` | string | No | The input parameter serves as the updated note; if an empty value is passed, the note will be delete Example: `test` |

## updateCloudGtmGlobalAlert

**Signature:** `updateCloudGtmGlobalAlert(request: UpdateCloudGtmGlobalAlertRequest)`

更新全局流量管理告警设置.

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dingtalkNotice` | boolean | No | Specifies whether to configure DingTalk notifications. Valid values: Example: `false` |
| `emailNotice` | boolean | No | Specifies whether to configure email notifications. Valid values: Example: `true` |
| `noticeType` | string | No | The type of the alert event. Valid values: Example: `addr_alert` |
| `smsNotice` | boolean | No | Specifies whether to configure text message notifications. Valid values: Example: `true` |
| `threshold` | number | No | - Example: `100` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `alertConfig` | UpdateCloudGtmGlobalAlertRequestAlertConfig[] | No | - |
| `alertGroup` | string[] | No | - |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |

## updateCloudGtmInstanceConfigAlert

**Signature:** `updateCloudGtmInstanceConfigAlert(request: UpdateCloudGtmInstanceConfigAlertRequest)`

@param request - UpdateCloudGtmInstanceConfigAlertRequest.

**Parameters:** (0 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dingtalkNotice` | boolean | No | Specifies whether to configure DingTalk notifications. Valid values: Example: `true` |
| `emailNotice` | boolean | No | Specifies whether to configure email notifications. Valid values: Example: `true` |
| `noticeType` | string | No | The type of the alert event. Valid values: Example: `addr_alert` |
| `smsNotice` | boolean | No | Specifies whether to configure text message notifications. Valid values: Example: `true` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |
| `alertConfig` | UpdateCloudGtmInstanceConfigAlertRequestAlertConfig[] | No | - |
| `alertGroup` | string[] | No | - |
| `alertMode` | string | No | The alert configuration mode of the instance. Valid values: Example: `global` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when an A record and an  Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) 3.0 instance. Example: `gtm-cn-zz11t58**0s` |

## updateCloudGtmInstanceConfigBasic

**Signature:** `updateCloudGtmInstanceConfigBasic(request: UpdateCloudGtmInstanceConfigBasicRequest)`

Updates the global time-to-live (TTL) configuration of a GTM 3.0 instance..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the GTM 3.0 instance for which you want to modify the TTL configuration. Example: `gtm-cn-wwo3a3hbz**` |
| `scheduleHostname` | string | No | Host record of the domain accessed by GTM. Example: `www` |
| `scheduleZoneName` | string | No | The zone (such as example.com) or subzone (such as a.example.com) of the GTM access domain name. In  Example: `example.com` |
| `ttl` | number | No | The global TTL value, in seconds. The global TTL value affects how long the DNS records that map the Example: `60` |

## updateCloudGtmInstanceConfigEnableStatus

**Signature:** `updateCloudGtmInstanceConfigEnableStatus(request: UpdateCloudGtmInstanceConfigEnableStatusRequest)`

If an access domain name is **enabled** and the health state is **normal**, the access domain name is deemed **available**. *   If an access domain name is **disabled** or the health state is **abnorm.

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `zh-CN` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `enableStatus` | string | No | The enabling state of the access domain name. Valid values: Example: `enable` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) 3.0 instance. Example: `gtm-cn-wwo3a3hbz**` |

## updateCloudGtmInstanceConfigLbStrategy

**Signature:** `updateCloudGtmInstanceConfigLbStrategy(request: UpdateCloudGtmInstanceConfigLbStrategyRequest)`

Modifies the load balancing policy of a Global Traffic Manager (GTM) 3.0 instance..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language in which the returned results are displayed. Valid values: Example: `en-US` |
| `addressPoolLbStrategy` | string | No | The new policy for load balancing between address pools. Valid values: Example: `sequence` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the GTM 3.0 instance for which you want to modify the load balancing policy. Example: `gtm-cn-wwo3a3hbz**` |
| `sequenceLbStrategyMode` | string | Yes | The mode used if the address pool with the smallest sequence number is recovered. This parameter is  Example: `preemptive` |

## updateCloudGtmInstanceConfigRemark

**Signature:** `updateCloudGtmInstanceConfigRemark(request: UpdateCloudGtmInstanceConfigRemarkRequest)`

Modifies the description of a Global Traffic Manager (GTM) 3.0 instance..

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language in which the returned results are displayed. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `configId` | string | No | The configuration ID of the access domain name. Two configuration IDs exist when the access domain n Example: `Config-000**11` |
| `instanceId` | string | No | The ID of the GTM 3.0 instance for which you want to modify the description. Example: `gtm-cn-wwo3a3hbz**` |
| `remark` | string | No | - Example: `API` |

## updateCloudGtmInstanceName

**Signature:** `updateCloudGtmInstanceName(request: UpdateCloudGtmInstanceNameRequest)`

@param request - UpdateCloudGtmInstanceNameRequest.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can specify a custom val Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `instanceId` | string | No | The ID of the Global Traffic Manager (GTM) instance. Example: `gtm-cn-jmp3qnw**03` |
| `instanceName` | string | No | The name of the instance. You cannot leave this parameter empty. Example: `test` |

## updateCloudGtmMonitorTemplate

**Signature:** `updateCloudGtmMonitorTemplate(request: UpdateCloudGtmMonitorTemplateRequest)`

Modifies the information about a health check template..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cityCode` | string | No | The city code of the health check node. Example: `503` |
| `ispCode` | string | No | The Internet service provider (ISP) code of the health check node. Example: `465` |
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `evaluationCount` | number | No | The number of retries. The system will only judge the application service as abnormal after consecut Example: `2` |
| `extendInfo` | string | No | The extended information. The value of this parameter is a JSON string. The required parameters vary Example: `{\\"code\\":200,\\"path\\":\\"\\\\index.htm\\",\\"host\\":\\"aliyun.com\\"}` |
| `failureRate` | number | No | Percentage of selected node probe failures (%), that is, the percentage of abnormal detection points Example: `50` |
| `interval` | number | No | The time interval (in seconds) for each health check probe. By default, it probes every 60 seconds.  Example: `60` |
| `ispCityNodes` | UpdateCloudGtmMonitorTemplateRequestIspCityNodes[] | No | - |
| `name` | string | No | The name of the health check probe template, which is generally recommended to be distinguishable an Example: `Ping-IPv4` |
| `templateId` | string | Yes | The ID of the health check template that you want to modify. This ID uniquely identifies the health  Example: `mtp-89518052425100**80` |
| `timeout` | number | No | Probe timeout (in milliseconds), data packets not returned within the timeout period are considered  Example: `5000` |

## updateCloudGtmMonitorTemplateRemark

**Signature:** `updateCloudGtmMonitorTemplateRemark(request: UpdateCloudGtmMonitorTemplateRemarkRequest)`

@param request - UpdateCloudGtmMonitorTemplateRemarkRequest.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `remark` | string | No | The new description of the template. If you do not specify this parameter, the original description  Example: `test` |
| `templateId` | string | Yes | The ID of the health check template. This ID uniquely identifies a health check template. Example: `mtp-89518052455928**00` |

