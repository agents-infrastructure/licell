# Image Tag Management

Image tag operations including create, delete, list, and get.

## createRepoTag

Creates an image tag based on an existing image tag in an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromTag` | string | Yes | The source image tag. Example: `v1` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-shac42yvqzv****` |
| `namespaceName` | string | Yes | The name of the namespace. Example: `ns` |
| `repoName` | string | Yes | The name of the image repository. Example: `repo1` |
| `toTag` | string | Yes | The image tag that you want to create. Example: `v2` |

## deleteRepoTag

Deletes an image tag.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-xwvi3osiy4ff****` |
| `tag` | string | Yes | The tag of the image. Example: `1.24` |

## getRepoTag

The version of the repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The return value of status code. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | Yes | The operation that you want to perform. Set the value to **GetRepoTag**. Example: `crr-tquyps22md8p****` |
| `tag` | string | Yes | The number of milliseconds that have elapsed since the image was created. Example: `1.0` |

## listRepoTag

Queries image tags in a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: 100. Example: `30` |
| `repoId` | string | Yes | The ID of the repository. Example: `crr-tquyps22md8p****` |

