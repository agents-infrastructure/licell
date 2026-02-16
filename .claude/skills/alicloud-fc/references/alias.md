# Alias Management

Function alias CRUD for version routing and traffic shifting.

## createAlias

**Signature:** `createAlias(functionName: string, request: CreateAliasRequest)`

创建函数别名。.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.aliasName` | string | Yes | This parameter is required. Example: `prod` |
| `body.description` | string | No | - Example: `my` |
| `body.versionId` | string | Yes | This parameter is required. Example: `1` |

## deleteAlias

**Signature:** `deleteAlias(functionName: string, aliasName: string)`

Deletes an alias..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `aliasName` | string | Yes | Path parameter: aliasName |

## getAlias

**Signature:** `getAlias(functionName: string, aliasName: string)`

Queries information about an alias..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `aliasName` | string | Yes | Path parameter: aliasName |

## listAliases

**Signature:** `listAliases(functionName: string, request: ListAliasesRequest)`

Queries aliases..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `limit` | number | No | The number of aliases returned. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `MTIzNCNhYmM=` |
| `prefix` | string | No | The alias prefix. Example: `my-alias` |

## updateAlias

**Signature:** `updateAlias(functionName: string, aliasName: string, request: UpdateAliasRequest)`

Updates an alias..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `aliasName` | string | Yes | Path parameter: aliasName |
| `body.description` | string | No | - Example: `my` |
| `body.versionId` | string | No | - Example: `1` |

