# Domain Configuration

CDN domain function configurations, staging/gray configs, batch config operations.

## describeCdnDomainConfigs

**Signature:** `describeCdnDomainConfigs(request: DescribeCdnDomainConfigsRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configId` | string | No | The ID of the configuration. For more information about ConfigId, see [Usage notes on ConfigId](http Example: `6295` |
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |
| `functionNames` | string | No | The names of the features. Separate multiple feature names with commas (,). For more information, se Example: `aliauth` |

## batchSetCdnDomainConfig

**Signature:** `batchSetCdnDomainConfig(request: BatchSetCdnDomainConfigRequest)`

You can call this operation up to 30 times per second per account. *   You can specify multiple domain names and must separate them with commas (,). You can specify up to 50 domain names in each call..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The accelerated domain names. You can specify multiple accelerated domain names and separate them wi Example: `www.example.com` |
| `functions` | string | Yes | The features that you want to configure. Format: Example: `[{"functionArgs":` |

## batchDeleteCdnDomainConfig

**Signature:** `batchDeleteCdnDomainConfig(request: BatchDeleteCdnDomainConfigRequest)`

You can specify up to 50 domain names in each request. *   You can call this operation up to 30 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | The accelerated domain names whose configurations you want to delete. Separate multiple accelerated  Example: `example.com,example.org` |
| `functionNames` | string | Yes | The names of the features that you want to delete. Separate multiple feature names with commas (,).  Example: `referer_white_list_set,https_force` |

## describeCdnDomainStagingConfig

**Signature:** `describeCdnDomainStagingConfig(request: DescribeCdnDomainStagingConfigRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |
| `functionNames` | string | No | The list of feature names. Separate multiple values with commas (,). For more information, see [A li Example: `aliauth` |

## setCdnDomainStagingConfig

**Signature:** `setCdnDomainStagingConfig(request: SetCdnDomainStagingConfigRequest)`

>  You can call this operation up to 30 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |
| `functions` | string | Yes | The features that you want to configure. Format: Example: `[{"functionArgs":[{"argName":"enable","argValue":"on"},{"argName":"pri","argValue":"1"},{"argName":"rule","argValue":"xxx"}],"functionName":"edge_function"}]` |

## publishStagingConfigToProduction

**Signature:** `publishStagingConfigToProduction(request: PublishStagingConfigToProductionRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each call. Example: `example.com` |

## rollbackStagingConfig

**Signature:** `rollbackStagingConfig(request: RollbackStagingConfigRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |

## batchSetGrayDomainFunction

**Signature:** `batchSetGrayDomainFunction(request: BatchSetGrayDomainFunctionRequest)`

批量配置多个域名的灰度动态功能.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configs` | string | Yes | This parameter is required. Example: `[{"functionArgs":` |
| `domainNames` | string | Yes | This parameter is required. Example: `example.com,xxx.org.com` |

## getGrayDomainFunction

**Signature:** `getGrayDomainFunction(request: GetGrayDomainFunctionRequest)`

按域名、functionName查询灰度配置信息，返回的信息中包含当前的灰度状态、灰度进度.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |
| `functionNames` | string | No | - Example: `domain_status,https_option` |

## publishGrayDomainConfig

**Signature:** `publishGrayDomainConfig(request: PublishGrayDomainConfigRequest)`

发布灰度配置到线上，支持多种模式，如全网发布、指定方式(灰度发布)，回滚.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `customCountryId` | number | No | - |
| `customPercent` | number | No | - Example: `15` |
| `domainName` | string | Yes | This parameter is required. Example: `example.com` |
| `publishMode` | string | Yes | This parameter is required. Example: `publishByCustom` |

## describeUserConfigs

**Signature:** `describeUserConfigs(request: DescribeUserConfigsRequest)`

Queries configurations of security features..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | string | Yes | The feature whose configurations you want to query. You can specify only one feature in each request Example: `oss` |

## modifyCustomDomainSampleRate

**Signature:** `modifyCustomDomainSampleRate(request: ModifyCustomDomainSampleRateRequest)`

A客户定制新增修改域名采样率接口.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseConfigID` | string | No | - |
| `domainNames` | string | Yes | - |
| `sampleRate` | number | Yes | - |

## setReqHeaderConfig

**Signature:** `setReqHeaderConfig(request: SetReqHeaderConfigRequest)`

Sets a custom origin header..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configId` | number | No | The ID of the configuration. Example: `123` |
| `domainName` | string | Yes | The accelerated domain name. Separate multiple domain names with commas (,). Example: `example.com` |
| `key` | string | Yes | The name of the custom header. Example: `testkey` |
| `value` | string | Yes | The value of the custom header. Example: `testvalue` |

## setWaitingRoomConfig

**Signature:** `setWaitingRoomConfig(request: SetWaitingRoomConfigRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (6 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allowPct` | number | Yes | The percentage of requests that are allowed to be redirected to the origin server. Valid values: **0 Example: `30` |
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |
| `gapTime` | number | Yes | The length of waiting time to skip after an exit from the queue. Unit: seconds. Example: `20` |
| `maxTimeWait` | number | Yes | The maximum length of waiting time in the queue. Unit: seconds. Example: `30` |
| `waitUri` | string | Yes | The regular expression that is used to match URI strings for which the virtual waiting room feature  |
| `waitUrl` | string | Yes | The URL of the waiting page. Example: `https://example.com/waitingroom.html` |


## deleteSpecificConfig

**Signature:** `deleteSpecificConfig(request: DeleteSpecificConfigRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configId` | string | Yes | The ID of the configuration. Separate multiple configuration IDs with commas (,). For more informati Example: `2317` |
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name. Example: `example.com` |


## deleteSpecificStagingConfig

**Signature:** `deleteSpecificStagingConfig(request: DeleteSpecificStagingConfigRequest)`

> You can call this operation up to 20 times per second per account..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configId` | string | Yes | The configuration IDs. Separate configuration IDs with commas (,). For more information about Config Example: `2317` |
| `domainName` | string | Yes | The accelerated domain name. You can specify up to 50 domain names in each request. Separate multipl Example: `example.com` |


## describeCdnSecFuncInfo

**Signature:** `describeCdnSecFuncInfo(request: DescribeCdnSecFuncInfoRequest)`

Queries information about security features of Alibaba Cloud CDN..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | Yes | The language. Example: `zh` |
| `secFuncType` | string | Yes | The type of the security feature. Valid values: Example: `CipherSuiteGroupCustomize` |


## describeCdnUserConfigs

**Signature:** `describeCdnUserConfigs(request: DescribeCdnUserConfigsRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | The configuration that you want to query. Valid values: Example: `domain_business_control` |


## deleteCustomDomainSampleRate

**Signature:** `deleteCustomDomainSampleRate(request: DeleteCustomDomainSampleRateRequest)`

A客户定制实时日志删除接口.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | Yes | - |


## describeCustomDomainSampleRate

**Signature:** `describeCustomDomainSampleRate(request: DescribeCustomDomainSampleRateRequest)`

A客户定制查询域名采样率.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainNames` | string | No | - |

