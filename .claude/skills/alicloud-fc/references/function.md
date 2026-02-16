# Function Management

Function CRUD, code, versions, and invocation control.

## createFunction

**Signature:** `createFunction(request: CreateFunctionRequest)`

Resources of Function Compute are scheduled and run based on functions. A function usually refers to a code snippet that is written by a user and can be independently executed to respond to events and requests..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body.code` | InputCodeLocation | No | - |
| `body.cpu` | number | No | - Example: `1` |
| `body.description` | string | No | - Example: `my` |
| `body.diskSize` | number | No | - Example: `512` |
| `body.functionName` | string | Yes | This parameter is required. Example: `my-function-1` |
| `body.handler` | string | Yes | This parameter is required. Example: `index.handler` |
| `body.idleTimeout` | number | No | - Example: `100` |
| `body.instanceConcurrency` | number | No | - Example: `1` |
| `body.internetAccess` | boolean | No | - Example: `true` |
| `body.memorySize` | number | No | - Example: `512` |
| `body.role` | string | No | - Example: `acs:ram::188077086902****:role/fc-test` |
| `body.runtime` | string | Yes | This parameter is required. Example: `python3.10` |
| `body.sessionAffinity` | string | No | - Example: `MCP_SSE` |
| `body.timeout` | number | No | - Example: `60` |

## deleteFunction

**Signature:** `deleteFunction(functionName: string)`

Deletes a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |

## getFunction

**Signature:** `getFunction(functionName: string, request: GetFunctionRequest)`

getFunction operation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | 2023-03-10T10:10:10Z Example: `LATEST` |

## getFunctionCode

**Signature:** `getFunctionCode(functionName: string, request: GetFunctionCodeRequest)`

Queries a code package of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

## listFunctions

**Signature:** `listFunctions(request: ListFunctionsRequest)`

ListFunctions returns only a subset of a function\\"s attribute fields. To obtain the additional fields, which include state, stateReasonCode, stateReason, lastUpdateStatus, lastUpdateStatusReasonCode, and lastUpdateStatusReason, use [GetFunction](https://help.aliyun.com/document_detail/2618610.html)..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the functions to retrieve. Example: `test_description` |
| `fcVersion` | string | No | The version of Function Compute to which the functions belong. Example: `v3` |
| `gpuType` | string | No | The GPU type of the functions to retrieve. Example: `fc.gpu.tesla.1` |
| `limit` | number | No | The number of functions to return. The minimum value is 1 and the maximum value is 100. Example: `10` |
| `nextToken` | string | No | The pagination token. Example: `MTIzNCNhYmM=` |
| `prefix` | string | No | The prefix of the function name. Example: `my-func` |
| `runtime` | string | No | The runtime of the functions to retrieve. Example: `python3.10` |
| `tags` | Tag[] | No | - |

## updateFunction

**Signature:** `updateFunction(functionName: string, request: UpdateFunctionRequest)`

Updates the information about a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.code` | InputCodeLocation | No | - |
| `body.cpu` | number | No | - Example: `1` |
| `body.description` | string | No | - Example: `my` |
| `body.diskSize` | number | No | - Example: `512` |
| `body.handler` | string | No | - Example: `index.handler` |
| `body.idleTimeout` | number | No | - Example: `100` |
| `body.instanceConcurrency` | number | No | - Example: `1` |
| `body.internetAccess` | boolean | No | - Example: `true` |
| `body.memorySize` | number | No | - Example: `512` |
| `body.role` | string | No | - Example: `acs:ram::188077086902****:role/fc-test` |
| `body.sessionAffinity` | string | No | - Example: `MCP_SSE` |
| `body.timeout` | number | No | - Example: `60` |

## publishFunctionVersion

**Signature:** `publishFunctionVersion(functionName: string, request: PublishFunctionVersionRequest)`

Publishes a function version..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.description` | string | No | - Example: `my` |

## deleteFunctionVersion

**Signature:** `deleteFunctionVersion(functionName: string, versionId: string)`

deleteFunctionVersion operation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `versionId` | string | Yes | Path parameter: versionId |

## listFunctionVersions

**Signature:** `listFunctionVersions(functionName: string, request: ListFunctionVersionsRequest)`

Queries versions of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `direction` | string | No | The sorting mode of function versions. Valid values: BACKWARD and FORWARD. Example: `BACKWARD` |
| `limit` | number | No | The number of function versions that are returned. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `MTIzNCNhYmM=` |

## invokeFunction

**Signature:** `invokeFunction(functionName: string, request: InvokeFunctionRequest)`

Invokes a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body` | Readable | No | The request parameters of function invocation. Example: `event` |
| `qualifier` | string | No | The version or alias of the function. Example: `LATEST` |

## disableFunctionInvocation

**Signature:** `disableFunctionInvocation(functionName: string, request: DisableFunctionInvocationRequest)`

Exercise caution when you call this operation on a function in a production environment, as improper deactivation may lead to business disruptions..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `abortOngoingRequest` | boolean | No | Specifies whether to immediately terminate all ongoing requests. Example: `false` |
| `reason` | string | No | - |

## enableFunctionInvocation

**Signature:** `enableFunctionInvocation(functionName: string)`

The EnableFunctionInvocation operation allows a function to be invoked and resumes the creation of provisioned instances. This operation is currently in private preview..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |

