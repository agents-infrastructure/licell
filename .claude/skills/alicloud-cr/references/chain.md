# Delivery Chain

Delivery chain management for CI/CD pipelines.

## createChain

Creates a delivery chain.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainConfig` | string | No | The configuration of the delivery chain in the JSON format. Example: `chainconfig` |
| `description` | string | No | The description of the delivery chain. Example: `description` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-4cdrlqmhn4gm****` |
| `name` | string | Yes | The name of the delivery chain. Example: `test` |
| `repoName` | string | No | The name of the repository. Example: `repo1` |
| `repoNamespaceName` | string | No | The name of the namespace. Example: `ns1` |
| `scopeExclude` | string[] | No | - |

## deleteChain

Deletes a delivery pipeline.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | string | Yes | The ID of the delivery pipeline. Example: `chi-02ymhtwl3cq8****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-4cdrlqmhn4gm****` |

## getChain

获取交付链.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainId` | string | Yes | This parameter is required. Example: `chi-0ops0gsmw5x2****` |
| `instanceId` | string | Yes | This parameter is required. Example: `cri-4cdrlqmhn4gm****` |

## listChain

Queries delivery chains.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-4cdrlqmhn4gm****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `10` |
| `repoName` | string | No | The name of the image repository. Example: `repo1` |
| `repoNamespaceName` | string | No | The name of the namespace. Example: `ns1` |

## updateChain

Updates the information about a delivery chain, such as the node execution sequence of the delivery chain.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainConfig` | string | Yes | The configuration of the delivery chain in the JSON format. Example: `chainconfig` |
| `chainId` | string | Yes | The ID of the delivery chain. Example: `chi-02ymhtwl3cq8****` |
| `description` | string | No | The description of the delivery chain. Example: `description` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-4cdrlqmhn4gm****` |
| `name` | string | Yes | The name of the delivery chain. Example: `test` |
| `scopeExclude` | string[] | No | - |

## listChainInstance

The response code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The operation that you want to perform. Set this parameter to **ListChainInstance**. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The time when the delivery chain started. Example: `1` |
| `pageSize` | number | No | The name of the image repository. Example: `30` |
| `repoName` | string | No | The time when the delivery chain is completed. Example: `test-repo` |
| `repoNamespaceName` | string | No | The name of the delivery chain. Example: `test-namespace` |

