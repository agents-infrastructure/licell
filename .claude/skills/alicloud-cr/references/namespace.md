# Namespace Management

Namespace CRUD operations within CR instances.

## createNamespace

Creates a namespace of image repositories.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoCreateRepo` | boolean | No | Specifies whether to automatically create an image repository in the namespace. Example: `true` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `namespaceName` | string | Yes | The name of the namespace. The name must be 2 to 120 characters in length, and can contain lowercase Example: `namespace1` |

## deleteNamespace

Deletes a namespace.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `namespaceName` | string | Yes | The name of the namespace. Example: `ns3` |

## getNamespace

Queries the information about a namespace.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `namespaceId` | string | No | The ID of the namespace. Example: `crn-tiw8t3f8i5lta****` |
| `namespaceName` | string | No | The name of the namespace. Example: `test` |

## listNamespace

Queries namespaces in a Container Registry instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-94klsruryslx****` |
| `namespaceName` | string | No | The namespace name. Example: `test-namespace` |
| `namespaceStatus` | string | No | The status of the namespace. Valid values: Example: `NORMAL` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |

## updateNamespace

Updates a namespace.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoCreateRepo` | boolean | No | Specifies whether to automatically create a repository when an image is pushed to the namespace. Example: `true` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `namespaceName` | string | Yes | The name of the namespace. Example: `test` |

