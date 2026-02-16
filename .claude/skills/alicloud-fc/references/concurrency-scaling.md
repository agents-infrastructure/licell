# Concurrency & Scaling

Concurrency configs, scaling configs, and provisioned configurations.

## putConcurrencyConfig

**Signature:** `putConcurrencyConfig(functionName: string, request: PutConcurrencyConfigRequest)`

Configures concurrency of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.reservedConcurrency` | number | Yes | This parameter is required. Example: `10` |

## getConcurrencyConfig

**Signature:** `getConcurrencyConfig(functionName: string)`

Obtains a concurrency configuration..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |

## deleteConcurrencyConfig

**Signature:** `deleteConcurrencyConfig(functionName: string)`

Deletes a concurrency configuration..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |

## listConcurrencyConfigs

**Signature:** `listConcurrencyConfigs(request: ListConcurrencyConfigsRequest)`

列出函数并发度配置。.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | No | The function name. If you leave this parameter empty, the concurrency configurations of all function Example: `my-func` |
| `limit` | number | No | The maximum number of entries returned. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `MTIzNCNhYmM=` |

## putScalingConfig

**Signature:** `putScalingConfig(functionName: string, request: PutScalingConfigRequest)`

Scaling settings.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.enableMixMode` | boolean | No | - |
| `qualifier` | string | No | The function alias. Example: `LATEST` |

## getScalingConfig

**Signature:** `getScalingConfig(functionName: string, request: GetScalingConfigRequest)`

Gets the scaling settings of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The alias of the function. Example: `LATEST` |

## deleteScalingConfig

**Signature:** `deleteScalingConfig(functionName: string, request: DeleteScalingConfigRequest)`

Deletes the scaling settings of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The function alias. Example: `LATEST` |

## listScalingConfigs

**Signature:** `listScalingConfigs(request: ListScalingConfigsRequest)`

Lists the scaling settings of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | No | The name of the function. Example: `my-func` |
| `limit` | number | No | The number of scaling settings to return. Example: `20` |
| `nextToken` | string | No | The token for the next page. Example: `MTIzNCNhYmM=` |

## putProvisionConfig

**Signature:** `putProvisionConfig(functionName: string, request: PutProvisionConfigRequest)`

Creates provisioned configurations..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.alwaysAllocateCPU` | boolean | No | - Example: `true` |
| `body.alwaysAllocateGPU` | boolean | No | - Example: `true` |
| `body.defaultTarget` | number | No | - |
| `qualifier` | string | No | The function alias. Example: `LATEST` |

## getProvisionConfig

**Signature:** `getProvisionConfig(functionName: string, request: GetProvisionConfigRequest)`

Queries provisioned configurations..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The function alias. Example: `LATEST` |

## deleteProvisionConfig

**Signature:** `deleteProvisionConfig(functionName: string, request: DeleteProvisionConfigRequest)`

Deletes a provisioned configuration..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `qualifier` | string | No | The function alias. Example: `LATEST` |

## listProvisionConfigs

**Signature:** `listProvisionConfigs(request: ListProvisionConfigsRequest)`

Queries a list of provisioned configurations..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | No | The name of the function. If this parameter is not specified, the provisioned configurations of all  Example: `my-func` |
| `limit` | number | No | Number of provisioned configurations to return. Example: `10` |
| `nextToken` | string | No | A pagination token. Example: `MTIzNCNhYmM=` |

