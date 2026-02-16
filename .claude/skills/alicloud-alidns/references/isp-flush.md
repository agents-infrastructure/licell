# ISP Cache Flush

ISP DNS cache flush tasks and quota management.

## describeIspFlushCacheInstances

**Signature:** `describeIspFlushCacheInstances(request: DescribeIspFlushCacheInstancesRequest)`

获取缓存刷新套餐包列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | - |

## describeIspFlushCacheRemainQuota

**Signature:** `describeIspFlushCacheRemainQuota(request: DescribeIspFlushCacheRemainQuotaRequest)`

获取剩余可缓存刷新次数.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |

## describeIspFlushCacheTask

**Signature:** `describeIspFlushCacheTask(request: DescribeIspFlushCacheTaskRequest)`

获取缓存刷新任务详情.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lang` | string | No | - |
| `taskId` | string | Yes | - |

## describeIspFlushCacheTasks

**Signature:** `describeIspFlushCacheTasks(request: DescribeIspFlushCacheTasksRequest)`

获取缓存刷新任务列表.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | No | - |

## submitIspFlushCacheTask

**Signature:** `submitIspFlushCacheTask(request: SubmitIspFlushCacheTaskRequest)`

提交缓存刷新任务.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | Yes | - |
| `domainName` | string | Yes | - |
| `isp` | string[] | Yes | - |

## updateIspFlushCacheInstanceConfig

**Signature:** `updateIspFlushCacheInstanceConfig(request: UpdateIspFlushCacheInstanceConfigRequest)`

修改缓存刷新套餐包配置.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | - |
| `instanceName` | string | Yes | - |

