# Asynchronous Invocation

Async invocation configurations and task management.

## putAsyncInvokeConfig

**Signature:** `putAsyncInvokeConfig(functionName: string, request: PutAsyncInvokeConfigRequest)`

Creates or modifies an asynchronous invocation configuration for a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.asyncTask` | boolean | No | - Example: `true` |
| `body.maxAsyncEventAgeInSeconds` | number | No | - Example: `300` |
| `body.maxAsyncRetryAttempts` | number | No | - Example: `3` |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

## getAsyncInvokeConfig

**Signature:** `getAsyncInvokeConfig(functionName: string, request: GetAsyncInvokeConfigRequest)`

Gets asynchronous invocation configurations of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

## deleteAsyncInvokeConfig

**Signature:** `deleteAsyncInvokeConfig(functionName: string, request: DeleteAsyncInvokeConfigRequest)`

Deletes an asynchronous invocation configuration..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

## listAsyncInvokeConfigs

**Signature:** `listAsyncInvokeConfigs(request: ListAsyncInvokeConfigsRequest)`

Queries all asynchronous configurations of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | No | The function name. If you do not configure this parameter, the asynchronous invocation configuration Example: `my-func` |
| `limit` | number | No | The maximum number of entries to be returned. Example: `10` |
| `nextToken` | string | No | The paging information. This parameter specifies the start point of the query. Example: `MTIzNCNhYmM=` |

## getAsyncTask

**Signature:** `getAsyncTask(functionName: string, taskId: string, request: GetAsyncTaskRequest)`

Queries the information about an asynchronous task..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `taskId` | string | Yes | Path parameter: taskId |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

## listAsyncTasks

**Signature:** `listAsyncTasks(functionName: string, request: ListAsyncTasksRequest)`

Lists asynchronous tasks..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `includePayload` | boolean | No | Specifies whether to return input parameters of the asynchronous tasks. Valid values: Example: `true` |
| `limit` | number | No | The number of asynchronous tasks to return. The default value is 20. Valid values: [1,100]. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. You do not  Example: `MTIzNCNhYmM=` |
| `prefix` | string | No | The ID prefix of asynchronous tasks. If this parameter is specified, a list of asynchronous tasks wh Example: `job-` |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |
| `sortOrderByTime` | string | No | The order in which the returned asynchronous tasks are sorted. Example: `asc` |
| `startedTimeBegin` | number | No | The start time of the period during which the asynchronous tasks are initiated. Example: `1640966400000` |
| `startedTimeEnd` | number | No | The end time of the period during which the asynchronous tasks are initiated. Example: `1640966400000` |
| `status` | string | No | The state of asynchronous tasks. The following items list the states of an asynchronous task: Example: `Running` |

## stopAsyncTask

**Signature:** `stopAsyncTask(functionName: string, taskId: string, request: StopAsyncTaskRequest)`

Stops an asynchronous task..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `taskId` | string | Yes | Path parameter: taskId |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

