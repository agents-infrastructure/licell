# Image Build

Image building rules, records, and logs.

## createRepoBuildRule

Creates an image building rule for a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildArgs` | string[] | No | - |
| `dockerfileLocation` | string | No | The path of the Dockerfile. Example: `/` |
| `dockerfileName` | string | No | The name of the Dockerfile. Example: `Dockerfile` |
| `imageTag` | string | Yes | The tag of the image. Example: `v0.9.5` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `platforms` | string[] | No | Architecture for image building. Valid values: |
| `pushName` | string | Yes | The name of the push that triggers the building rule. Example: `master` |
| `pushType` | string | Yes | The type of the push that triggers the building rule. Valid values: Example: `GIT_BRANCH` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-8dz3aedjqlmk****` |

## deleteRepoBuildRule

Deletes an image building rule of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRuleId` | string | Yes | The ID of the image building rule. Example: `crbr-36tffn0kouvi****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-xwvi3osiy4ff****` |

## listRepoBuildRule

Queries image building rules of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-tquyps22md8****` |

## updateRepoBuildRule

Updates an image building rule for a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildArgs` | string[] | No | - |
| `buildRuleId` | string | Yes | The ID of the building rule. Example: `crbr-ly77w5i3t31f****` |
| `dockerfileLocation` | string | No | The path of the Dockerfile. Example: `/` |
| `dockerfileName` | string | No | The name of the Dockerfile. Example: `Dockerfile` |
| `imageTag` | string | No | The tag of the image. Example: `v0.9.5` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `platforms` | string[] | No | Architecture for image building. Valid values: Example: `linux/amd64` |
| `pushName` | string | No | The name of the push that triggers the building rule. Example: `master` |
| `pushType` | string | No | The type of the push that triggers the building rule. Valid values: Example: `GIT_BRANCH` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-tquyps22md8p****` |

## createBuildRecordByRecord

Creates an image building record based on an existing record.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRecordId` | string | Yes | The ID of the image building record. Example: `0A311FC5-B8C6-4332-80E4-539EB73****` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-hpdfkc6utbaq****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-hnoq7j93or3k****` |

## createBuildRecordByRule

Creates an image building record based on a rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRuleId` | string | Yes | The ID of the image building rule. Example: `crbr-1j95g4bu2s1i****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-asd6vujuhay0****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-8dz3aedjqlmk****` |

## cancelRepoBuildRecord

Cancels an image building task of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRecordId` | string | Yes | The ID of the image building record. Example: `74FDBA62-30C0-4F22-BE7B-F1D36FD1****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-tquyps22md8p****` |

## getRepoBuildRecord

Queries the information about image building records of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRecordId` | string | Yes | The ID of the image building record. Example: `a78ec6fb-16ea-4649-93b7-f52afba7d****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |

## getRepoBuildRecordStatus

Queries the status of an image building task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRecordId` | string | Yes | The ID of the image building record. Example: `a78ec6fb-16ea-4649-93b7-f52afba7d****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-jnzm47ihjmgc****` |

## listRepoBuildRecord

Queries image building records of an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |
| `repoId` | string | Yes | The ID of the repository. Example: `crr-tquyps22md8****` |

## listRepoBuildRecordLog

Queries the log of an image building record.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildRecordId` | string | Yes | The ID of the image building record. Example: `C5B4D5D7-A1C6-4E9B-ABD2-401361C4****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-nmbv37dlv5d3****` |
| `offset` | number | No | The offset of log lines. Example: `0` |
| `repoId` | string | No | The ID of the image repository. Example: `crr-z4dvahhku9wv4****` |

