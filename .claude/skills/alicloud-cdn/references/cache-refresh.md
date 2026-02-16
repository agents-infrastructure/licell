# Cache Refresh & Prefetch

URL/directory refresh, content prefetch (push), and task queries.

## refreshObjectCaches

**Signature:** `refreshObjectCaches(request: RefreshObjectCachesRequest)`

Alibaba Cloud CDN supports POST requests in which parameters are sent as a form. *   You can call the [RefreshObjectCaches](https://help.aliyun.com/document_detail/91164.html) operation to refresh con.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `force` | boolean | No | - |
| `objectPath` | string | Yes | - |

## refreshObjectCacheByCacheTag

**Signature:** `refreshObjectCacheByCacheTag(request: RefreshObjectCacheByCacheTagRequest)`

Refreshes the cache based on cache tags that you configured..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cacheTag` | string | Yes | The tags of Cache. If multiple tags are returned, the tags are separated by commas (,). Example: `tag1,tag2` |
| `domainName` | string | Yes | The accelerated domain name. Example: `example.com` |
| `force` | boolean | No | Specifies whether to purge all resources that you submit if the requested content is one of the reso Example: `true` |

## pushObjectCache

**Signature:** `pushObjectCache(request: PushObjectCacheRequest)`

Alibaba Cloud CDN supports POST requests in which parameters are sent as a form. *   You can call the [RefreshObjectCaches](https://help.aliyun.com/document_detail/91164.html) operation to refresh con.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | The acceleration region where content is to be prefetched. Valid values: Example: `domestic` |
| `l2Preload` | boolean | No | Specifies whether to prefetch content to L2 points of presence (POPs). Valid values: Example: `true` |
| `objectPath` | string | Yes | The URLs based on which content is prefetched. Format: **accelerated domain name/files to be prefetc Example: `example.com/image/1.png\\nexample.org/image/2.png` |
| `queryHashkey` | boolean | No | This parameter specifies whether to enable the hash key query mode when you run a prefetch task. Val Example: `true` |
| `withHeader` | string | No | The custom header for prefetch in the JSON format. Example: `{` |

## describeRefreshTasks

**Signature:** `describeRefreshTasks(request: DescribeRefreshTasksRequest)`

You can query the status of tasks by task ID or URL. *   You can set both the **TaskId** and **ObjectPath** parameters. If you do not set the **TaskId** or **ObjectPath** parameter, data entries on th.

**Parameters:** (0 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. You can specify only one accelerated domain name in each call. By defau Example: `example.com` |
| `endTime` | string | No | The end time. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:mm:ssZ format. The time Example: `2017-12-22T08:00:00Z` |
| `objectPath` | string | No | The path of the object. The path is used as a condition for exact matching. Example: `http://example.com/1.txt` |
| `objectType` | string | No | The type of the task. Valid values: Example: `file` |
| `pageNumber` | number | No | The number of the page to return. Valid values: **1** to **100000**. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Default value: **20**. Maximum value: **100**. Valid v Example: `20` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmyuji4b6r4**` |
| `startTime` | string | No | The start of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH Example: `2017-12-21T08:00:00Z` |
| `status` | string | No | The status of the task. Valid values: Example: `Complete` |
| `taskId` | string | No | The ID of the task that you want to query. Example: `1234321` |

## describeRefreshTaskById

**Signature:** `describeRefreshTaskById(request: DescribeRefreshTaskByIdRequest)`

You can query data in the last three days. *   You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | The ID of the task that you want to query. Example: `12345678` |

## describePreloadDetailById

**Signature:** `describePreloadDetailById(request: DescribePreloadDetailByIdRequest)`

You can query data within the last 3 days. *   You can call this operation up to 30 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Queries the details of a preload task by task ID. You can query one task ID at a time. Example: `15423123921` |

## describeRefreshQuota

**Signature:** `describeRefreshQuota(request: DescribeRefreshQuotaRequest)`

Queries the maximum and remaining numbers of URLs and directories that can be refreshed, the maximum and remaining numbers of times that you can prefetch content, and the maximum and remaining numbers.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |

