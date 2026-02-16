# Helm Chart

Helm chart namespace, repository, and release management.

## createChartNamespace

Creates a chart namespace in an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoCreateRepo` | boolean | No | Specifies whether to automatically create repositories in the namespace. Valid values: Example: `true` |
| `defaultRepoType` | string | No | The default repository type. Valid values: Example: `PUBLIC` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `namespaceName` | string | Yes | The name of the namespace. Example: `namespace01` |

## deleteChartNamespace

Deletes a chart namespace from an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `namespaceName` | string | Yes | The name of the chart namespace that you want to delete. Example: `ns2` |

## getChartNamespace

Queries a chart namespace in an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `namespaceName` | string | Yes | The name of the namespace. Example: `ns1` |

## listChartNamespace

Queries the chart namespaces of a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `namespaceName` | string | No | The name of the namespace. Example: `test` |
| `namespaceStatus` | string | No | The status of the namespace. Valid values: Example: `NORMAL` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |

## updateChartNamespace

Updates a chart namespace.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoCreateRepo` | boolean | No | Specifies whether to automatically create repositories in the namespace. Valid values: Example: `true` |
| `defaultRepoType` | string | No | The default type of the repository. Valid values: Example: `PUBLIC` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `namespaceName` | string | Yes | The name of the namespace to which the repository belongs. Example: `test` |

## createChartRepository

Creates a chart repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `repoName` | string | Yes | The name of the repository. Example: `repo01` |
| `repoNamespaceName` | string | Yes | The name of the namespace to which the repository belongs. Example: `namespace01` |
| `repoType` | string | No | The default repository type. Valid values: Example: `PUBLIC` |
| `summary` | string | No | The summary of the repository. Example: `summary` |

## deleteChartRepository

Deletes a chart repository from an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay****` |
| `repoName` | string | Yes | The name of the repository. Example: `repo01` |
| `repoNamespaceName` | string | Yes | The name of the namespace to which the repository belongs. Example: `namespace01` |

## getChartRepository

Queries the information about a chart repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-kmsiwlxxdcva****` |
| `repoName` | string | Yes | The name of the repository. Example: `test` |
| `repoNamespaceName` | string | Yes | The name of the namespace. Example: `test` |

## listChartRepository

Queries the chart repositories of a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |
| `repoName` | string | No | The name of the repository. Example: `ns1` |
| `repoNamespaceName` | string | No | The name of the namespace to which the repository belongs. Example: `repo1` |
| `repoStatus` | string | No | The status of the chart repositories that you want to query. Valid values: Example: `ALL` |

## updateChartRepository

Updates a chart repository of a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `repoName` | string | Yes | The name of the repository. Example: `test` |
| `repoNamespaceName` | string | Yes | The name of the namespace to which the repository belongs. Example: `test` |
| `repoType` | string | No | The type of the repository. Valid values: Example: `PUBLIC` |
| `summary` | string | No | The summary of the repository. Example: `test` |

## deleteChartRelease

Deletes a chart version from a chart repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chart` | string | Yes | The name of the chart. Example: `chart3` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `release` | string | Yes | The version of the chart that you want to delete. Example: `0.1.0` |
| `repoName` | string | Yes | The name of the repository. Example: `repo1` |
| `repoNamespaceName` | string | Yes | The name of the namespace. Example: `ns1` |

## listChartRelease

Queries the versions of a chart in a chart repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chart` | string | No | The chart whose versions you want to query. Example: `null` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `20` |
| `repoName` | string | Yes | The name of the repository. Example: `repo1` |
| `repoNamespaceName` | string | Yes | The name of the namespace. Example: `ns1` |

