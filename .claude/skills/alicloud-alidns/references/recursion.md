# Recursion DNS

Recursive DNS zones and records management.

## addRecursionRecord

**Signature:** `addRecursionRecord(request: AddRecursionRecordRequest)`

新增递归解析内置权威解析记录.

**Parameters:** (0 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `6447728c8578e66aacf062d2df4446dc` |
| `priority` | number | No | - Example: `1` |
| `requestSource` | string | No | - Example: `default` |
| `rr` | string | No | - Example: `www` |
| `ttl` | number | No | - Example: `60` |
| `type` | string | No | - Example: `A` |
| `userClientIp` | string | No | - Example: `192.168.0.1` |
| `value` | string | No | - Example: `1.1.1.1` |
| `weight` | number | No | - Example: `2` |
| `zoneId` | string | No | Zone ID。 Example: `173671468000011` |

## addRecursionZone

**Signature:** `addRecursionZone(request: AddRecursionZoneRequest)`

新增递归解析内置权威域名zone.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `1ae05db4-10e7-11ef-b126-00163e24**22` |
| `proxyPattern` | string | No | - Example: `record` |
| `zoneName` | string | No | - Example: `example.com` |

## deleteRecursionRecord

**Signature:** `deleteRecursionRecord(request: DeleteRecursionRecordRequest)`

删除递归解析内置权威解析记录.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `recordId` | string | No | - Example: `17432432424` |

## deleteRecursionZone

**Signature:** `deleteRecursionZone(request: DeleteRecursionZoneRequest)`

删除递归解析内置权威域名zone.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `zoneId` | string | No | - Example: `169783221000012` |

## describeRecursionRecord

**Signature:** `describeRecursionRecord(request: DescribeRecursionRecordRequest)`

查询递归解析内置权威解析记录详情.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recordId` | string | No | - Example: `1917628665627259904` |

## describeRecursionZone

**Signature:** `describeRecursionZone(request: DescribeRecursionZoneRequest)`

查询递归解析内置权威域名zone详情.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zoneId` | string | No | - Example: `169783221000012` |

## listRecursionRecords

**Signature:** `listRecursionRecords(request: ListRecursionRecordsRequest)`

查询递归解析内置权威解析记录.

**Parameters:** (2 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enable` | string | No | - Example: `enable` |
| `maxResults` | number | No | - Example: `100` |
| `nextToken` | string | No | - Example: `4698691` |
| `pageNumber` | number | Yes | This parameter is required. Example: `1` |
| `pageSize` | number | Yes | This parameter is required. Example: `20` |
| `remark` | string | No | - Example: `remark` |
| `requestSource` | string | No | - Example: `default` |
| `rr` | string | No | - Example: `www` |
| `ttl` | number | No | - Example: `60` |
| `type` | string | No | - Example: `A` |
| `weight` | number | No | - Example: `1` |
| `zoneId` | string | No | - Example: `17832322323` |

## listRecursionZones

**Signature:** `listRecursionZones(request: ListRecursionZonesRequest)`

查询递归解析内置权威域名zone.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `maxResults` | number | No | - Example: `100` |
| `nextToken` | string | No | - Example: `4698691` |
| `pageNumber` | number | Yes | This parameter is required. Example: `1` |
| `pageSize` | number | Yes | This parameter is required. Example: `10` |
| `remark` | string | No | - Example: `test` |
| `zoneName` | string | No | - Example: `lisheng999.com` |

## searchRecursionRecords

**Signature:** `searchRecursionRecords(request: SearchRecursionRecordsRequest)`

搜索递归解析内置权威解析记录.

**Parameters:** (2 required, 13 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | - Example: `asc` |
| `enableStatus` | string | No | - Example: `enable` |
| `maxResults` | number | No | - Example: `100` |
| `nextToken` | string | No | - Example: `4698691` |
| `orderBy` | string | No | - Example: `rr` |
| `pageNumber` | number | Yes | This parameter is required. Example: `1` |
| `pageSize` | number | Yes | This parameter is required. Example: `1` |
| `remark` | string | No | - Example: `test` |
| `requestSource` | string | No | - Example: `default` |
| `rr` | string | No | - Example: `www` |
| `ttl` | number | No | - Example: `60` |
| `type` | string | No | - Example: `A` |
| `value` | string | No | - Example: `1.1.XX.XX` |
| `weight` | number | No | - Example: `2` |
| `zoneId` | string | No | - Example: `169438909000011` |

## searchRecursionZones

**Signature:** `searchRecursionZones(request: SearchRecursionZonesRequest)`

搜索递归解析内置权威域名zone.

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveType` | string | No | - Example: `account` |
| `scope` | string[] | No | - Example: `[20003]` |
| `direction` | string | No | - Example: `asc` |
| `maxResults` | number | No | - Example: `50` |
| `nextToken` | string | No | - Example: `4698691` |
| `orderBy` | string | No | - Example: `default` |
| `pageNumber` | number | Yes | This parameter is required. Example: `1` |
| `pageSize` | number | Yes | This parameter is required. Example: `5` |
| `remark` | string | No | - Example: `test` |
| `zoneName` | string | No | - Example: `cheng.suow.cc` |

## updateRecursionRecord

**Signature:** `updateRecursionRecord(request: UpdateRecursionRecordRequest)`

修改递归解析内置权威解析记录.

**Parameters:** (0 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `priority` | number | No | - Example: `5` |
| `recordId` | string | No | - Example: `9*******` |
| `requestSource` | string | No | - Example: `WebSDK` |
| `rr` | string | No | - Example: `test` |
| `ttl` | number | No | - Example: `60` |
| `type` | string | No | - Example: `A` |
| `value` | string | No | - Example: `1.1.XX.XX` |
| `weight` | number | No | - Example: `2` |

## updateRecursionRecordEnableStatus

**Signature:** `updateRecursionRecordEnableStatus(request: UpdateRecursionRecordEnableStatusRequest)`

修改内置权威解析记录启用状态.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `enableStatus` | string | No | - Example: `enable` |
| `recordId` | string | No | - Example: `1781234321` |

## updateRecursionRecordRemark

**Signature:** `updateRecursionRecordRemark(request: UpdateRecursionRecordRemarkRequest)`

修改递归解析内置权威解析记录备注.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `e432232342423ew423` |
| `recordId` | string | No | record id Example: `173671468000010` |
| `remark` | string | No | - Example: `test` |

## updateRecursionRecordWeight

**Signature:** `updateRecursionRecordWeight(request: UpdateRecursionRecordWeightRequest)`

修改递归解析内置权威解析记录权重.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `recordId` | string | No | - Example: `17363242424` |
| `weight` | number | No | - Example: `1` |

## updateRecursionRecordWeightEnableStatus

**Signature:** `updateRecursionRecordWeightEnableStatus(request: UpdateRecursionRecordWeightEnableStatusRequest)`

修改递归解析内置权威解析记录权重算法启用状态.

**Parameters:** (0 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `enableStatus` | string | No | - Example: `enable` |
| `requestSource` | string | No | - Example: `default` |
| `rr` | string | No | - Example: `www` |
| `type` | string | No | - Example: `A` |
| `zoneId` | string | No | - Example: `176432424234` |

## updateRecursionZoneEffectiveScope

**Signature:** `updateRecursionZoneEffectiveScope(request: UpdateRecursionZoneEffectiveScopeRequest)`

修改递归解析内置权威域名zone生效范围.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveType` | string | No | - Example: `account` |
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `zoneId` | string | No | - Example: `173671468000011` |

## updateRecursionZoneProxyPattern

**Signature:** `updateRecursionZoneProxyPattern(request: UpdateRecursionZoneProxyPatternRequest)`

修改递归解析内置权威域名zone递归代理模式.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `proxyPattern` | string | No | - Example: `record` |
| `zoneId` | string | No | - Example: `173671468000011` |

## updateRecursionZoneRemark

**Signature:** `updateRecursionZoneRemark(request: UpdateRecursionZoneRemarkRequest)`

修改递归解析内置权威域名zone备注.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | - Example: `21079fa016944979537637959d09bc` |
| `zoneId` | string | No | - Example: `173671468000011` |

