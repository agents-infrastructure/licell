# Repository Management

Image repository CRUD, source code binding, and triggers.

## createRepository

Creates an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `detail` | string | No | The description of the repository. Example: `repo1` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `repoName` | string | Yes | The name of the image repository. Example: `repo1` |
| `repoNamespaceName` | string | Yes | The name of the namespace to which the image repository belongs. Example: `namespace01` |
| `repoType` | string | Yes | The type of the repository. Valid values: Example: `PRIVATE` |
| `summary` | string | Yes | The summary about the repository. Example: `repo1` |
| `tagImmutability` | boolean | No | Specifies whether to enable the feature of image tag immutability. Valid values: Example: `true` |

## deleteRepository

Deletes an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `repoId` | string | No | The ID of the image repository. Example: `crr-l4933wbcmun2****` |
| `repoName` | string | No | The name of the repository. Example: `test-repo` |
| `repoNamespaceName` | string | No | The name of the namespace to which the repository belongs. Example: `test-namespace` |

## getRepository

Queries details about an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | No | The ID of the repository. Example: `crr-03cuozrsqhkw****` |
| `repoName` | string | No | The name of the repository. Example: `test` |
| `repoNamespaceName` | string | No | The name of the namespace to which the repository belongs. Example: `test` |

## listRepository

Queries image repositories.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: 100. If you specify a value larger than 100 for this  Example: `30` |
| `repoName` | string | No | The name of the repository. Example: `repo-test` |
| `repoNamespaceName` | string | No | The name of the namespace to which the repository belongs. Example: `repo-namespace-test` |
| `repoStatus` | string | No | - Example: `ALL` |

## updateRepository

The ID of the request.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `detail` | string | No | - Example: `repo-for-test` |
| `instanceId` | string | Yes | This parameter is required. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | No | - Example: `crr-tquyps22md8p****` |
| `repoName` | string | No | - Example: `dsp/domain-microapp` |
| `repoNamespaceName` | string | No | - Example: `ejiayou-other` |
| `repoType` | string | Yes | This parameter is required. Example: `PUBLIC` |
| `summary` | string | Yes | This parameter is required. Example: `test` |
| `tagImmutability` | boolean | No | - Example: `true` |

## createRepoSourceCodeRepo

Binds a source code repository to an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoBuild` | boolean | No | Specifies whether to trigger image building when source code is committed. Valid values: Example: `true` |
| `codeRepoName` | string | Yes | The name of the source code repository. Example: `repo` |
| `codeRepoNamespaceName` | string | Yes | The namespace to which the source code repository belongs. Example: `namespace` |
| `codeRepoType` | string | Yes | The type of the source code hosting platform. Valid values: `GITHUB`, `GITLAB`, `GITEE`, `CODE`, and Example: `GITHUB` |
| `disableCacheBuild` | boolean | No | Specifies whether to disable building caches. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-shac42yvqzvq****` |
| `overseaBuild` | boolean | No | Specifies whether to enable Build With Servers Deployed Outside Chinese Mainland. Valid values: Example: `false` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-gzsrlevmvoaq****` |

## getRepoSourceCodeRepo

Queries the information about the source code repository that is bound to an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-shac42yvqzvq****` |
| `repoId` | string | Yes | The ID of the repository. Example: `crr-gzsrlevmvoaq****` |

## updateRepoSourceCodeRepo

Updates the URL of the source code repository that is bound to an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoBuild` | string | No | Specifies whether to enable automatic image building when code is committed. Valid values: Example: `true` |
| `codeRepoId` | string | No | The ID of the source code repository. Example: `crr-cp7d6sget5r****` |
| `codeRepoName` | string | Yes | The name of the source code repository. Example: `repo` |
| `codeRepoNamespaceName` | string | Yes | The namespace to which the source code repository belongs. Example: `namespace` |
| `codeRepoType` | string | Yes | The type of the source code hosting platform. Valid values: GITHUB, GITLAB, GITEE, CODE, and CODEUP. Example: `GITHUB` |
| `disableCacheBuild` | string | No | Specifies whether to disable building caches. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the Container Registry Enterprise Edition instance. Example: `cri-shac42yvqzvq****` |
| `overseaBuild` | string | No | Specifies whether to enable Build With Servers Deployed Outside Chinese Mainland. Valid values: Example: `false` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-gzsrlevmvoa****` |

## createRepoTrigger

Creates a trigger for a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-xwvi3osiy4ff****` |
| `triggerName` | string | Yes | The name of the trigger. Example: `trigger1` |
| `triggerTag` | string | No | The image tag based on which the trigger is set. Example: `[1]` |
| `triggerType` | string | Yes | The type of the trigger. Valid values: Example: `ALL` |
| `triggerUrl` | string | Yes | The URL of the trigger. Example: `http://www.mysite.com` |

## deleteRepoTrigger

Deletes a trigger of an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-xwvi3osiy4ff****` |
| `triggerId` | string | Yes | The ID of the trigger. Example: `crw-0z4pf81pgz35****` |

## listRepoTrigger

Queries the triggers of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | Yes | The ID of the repository. Example: `crr-tquyps22md8p****` |

## updateRepoTrigger

Updates a trigger of an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-tquyps22md8p****` |
| `triggerId` | string | Yes | The ID of the trigger. Example: `crw-k7bdx4kt52ty****` |
| `triggerName` | string | No | The name of the trigger. Example: `test_trigger` |
| `triggerTag` | string | No | The image tag based on which the trigger is set. Example: `master` |
| `triggerType` | string | No | The type of the trigger. Valid values: Example: `TAG_LIST` |
| `triggerUrl` | string | No | The URL of the trigger. Example: `https://www.test.com` |

