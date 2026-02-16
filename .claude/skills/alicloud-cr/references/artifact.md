# Artifact Management

Artifact build rules, lifecycle rules, and subscription rules/tasks.

## createArtifactBuildRule

Create image repository acceleration rules for image building.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifactType` | string | Yes | The type of the artifact. Example: `ACCELERATED_IMAGE` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-cxreylqvcyje****` |
| `scopeId` | string | Yes | The ID of the effective range of the rule. Example: `crr-pmajihou6cg0****` |
| `scopeType` | string | Yes | The effective range of the rule. Valid values: Example: `REPOSITORY` |

## getArtifactBuildRule

@param request - GetArtifactBuildRuleRequest.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifactType` | string | No | The type of the artifact. Example: `ACCELERATED_IMAGE` |
| `buildRuleId` | string | No | The ID of the artifact building rule. Example: `crabr-o2670wqz2n70****` |
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-xkx6vujuhay0****` |
| `scopeId` | string | No | The ID of the effective range of the artifact building rule. Example: `crr-8dz3aedjqlmk****` |
| `scopeType` | string | No | The effective range of the artifact building rule. Valid values: Example: `REPOSITORY` |

## cancelArtifactBuildTask

Cancels an artifact building task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildTaskId` | string | Yes | The ID of the artifact building task. Example: `i2ei-12****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-shac42yvqzvq****` |

## getArtifactBuildTask

Queries the details of an artifact building task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildTaskId` | string | Yes | The ID of the artifact building task. Example: `i2a-1yu****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-shac42yvqzvq****` |

## listArtifactBuildTaskLog

Queries the log entries of an artifact building task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `buildTaskId` | string | Yes | The ID of the artifact build task. Example: `i2a-1yu****` |
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-shac42yvqzvq****` |
| `page` | number | Yes | The number of the page to return. Example: `1` |
| `pageSize` | number | Yes | The number of entries per page. Maximum value: 100. If you specify a value greater than 100 for this Example: `100` |

## createArtifactLifecycleRule

Creates a lifecycle management rule for an artifact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auto` | boolean | No | Specify whether to automatically execute the lifecycle management rule. Example: `false` |
| `enableDeleteTag` | boolean | No | Specify whether to enable lifecycle management for the artifact. Example: `true` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-gbwfk7qbgrxe****` |
| `namespaceName` | string | No | The name of the namespace. Example: `dev-backend` |
| `repoName` | string | No | The name of the image repository. Example: `test_1` |
| `retentionTagCount` | number | No | The number of images that you want to retain. Example: `30` |
| `scheduleTime` | string | No | The execution cycle of the lifecycle management rule. Example: `WEEK` |
| `scope` | string | No | The deletion scope. Example: `INSTANCE` |
| `tagRegexp` | string | No | The regular expression that is used to indicate which image tags are retained. Example: `release-.*` |

## deleteArtifactLifecycleRule

Deletes an artifact lifecycle management rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-brlg4cbj2ylkrqqq` |
| `ruleId` | string | Yes | The rule ID. Example: `cralr-3v8pao9k7chb8q62` |

## getArtifactLifecycleRule

Queries the lifecycle management rules of an artifact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-hpdfkc6utbaq****` |
| `ruleId` | string | Yes | The rule ID. Example: `cralr-a18bkiajy81****` |

## listArtifactLifecycleRule

Queries the lifecycle management rules of an artifact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enableDeleteTag` | boolean | No | Specifies whether to enable lifecycle management for the artifact. Example: `true` |
| `instanceId` | string | Yes | The ID of the Container Registry Enterprise Edition instance. Example: `cri-eztul9ucz76q****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: 100. If you specify a value greater than 100 for this Example: `10` |

## updateArtifactLifecycleRule

Updates a lifecycle management rule of an artifact.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auto` | boolean | No | Specifies whether to automatically execute the lifecycle management rule. Example: `false` |
| `enableDeleteTag` | boolean | No | Specifies whether to enable lifecycle management for the artifact. Example: `true` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-r6ym0lerldp****` |
| `namespaceName` | string | No | The name of the namespace. Example: `test-ns` |
| `repoName` | string | No | The name of the image repository. Example: `test_1` |
| `retentionTagCount` | number | No | The number of images that you want to retain. Example: `30` |
| `ruleId` | string | Yes | The rule ID. Example: `cralr-luq6qiegzvx****` |
| `scheduleTime` | string | No | The execution cycle of the lifecycle management rule. Example: `WEEK` |
| `scope` | string | No | The deletion scope of artifacts. Example: `REPO` |
| `tagRegexp` | string | No | The regular expression that indicates which image tags you want to retain. Example: `.*production_.*` |

## createArtifactSubscriptionRule

Creates an artifact subscription rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accelerate` | boolean | No | Indicates whether an acceleration link is enabled for image subscription. The subscription accelerat Example: `true` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-c0o11woew0k****` |
| `namespaceName` | string | Yes | The name of the Container Registry namespace. Example: `test-ns` |
| `override` | boolean | No | Indicates whether the original image is overwritten. Example: `true` |
| `platform` | string[] | Yes | The operating system and architecture. If the source repository contains a multi-arch image, only th |
| `repoName` | string | Yes | The name of the Container Registry repository. Example: `test-repo` |
| `sourceNamespaceName` | string | No | The source namespace. Example: `library` |
| `sourceProvider` | string | Yes | The source of the artifact. Example: `DOCKER_HUB` |
| `sourceRepoName` | string | Yes | The source repository. Example: `nginx` |
| `tagCount` | number | Yes | The number of subscribed images. Example: `1` |
| `tagRegexp` | string | Yes | The image tag in the subscription source repository. Regular expressions are supported. Example: `release-v.*` |

## deleteArtifactSubscriptionRule

Deletes an artifact subscription rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-c0o11woew0k****` |
| `ruleId` | string | Yes | The rule ID. Example: `crasr-mdbpung4i1rm****` |

## getArtifactSubscriptionRule

Queries the information about an artifact subscription rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-c0o11woew0k****` |
| `ruleId` | string | Yes | The rule ID. Example: `crasr-mdbpung4i1rm****` |

## listArtifactSubscriptionRule

Lists the subscription rules of artifacts.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-c0o11woew0k****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: 100. If you specify a value greater than 100 for this Example: `30` |

## updateArtifactSubscriptionRule

Updates an artifact subscription rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accelerate` | string | No | Specifies whether to enable an acceleration link for image subscription. The subscription accelerati Example: `true` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-c0o11woew0k****` |
| `namespaceName` | string | No | The name of the Container Registry namespace. Example: `test-ns` |
| `override` | string | No | Specifies whether to overwrite the original image. Example: `true` |
| `platform` | string[] | No | - |
| `repoName` | string | No | The name of the Container Registry repository. Example: `test-repo` |
| `ruleId` | string | Yes | The rule ID. Example: `crasr-mdbpung4i1rm****` |
| `sourceNamespaceName` | string | No | The name of the source namespace. Example: `library` |
| `sourceProvider` | string | No | The source of the artifacts. Example: `DOCKER_HUB` |
| `sourceRepoName` | string | No | The source repository. Example: `nginx` |
| `tagCount` | number | No | The number of subscribed images. Example: `1` |
| `tagRegexp` | string | No | The image tags in the subscription source repository. Regular expressions are supported. Example: `release-v.*` |

## createArtifactSubscriptionTask

Creates an artifact subscription task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-4ec5xvj4j0l****` |
| `ruleId` | string | Yes | The rule ID. Example: `crasr-88s7vmelc3m****` |

## getArtifactSubscriptionTask

Queries an artifact subscription task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-xkx6vujuhay0****` |
| `taskId` | string | Yes | The task ID. Example: `crast-40le4es9yh0p****` |

## getArtifactSubscriptionTaskResult

Queries the details of an artifact subscription task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-90fxryf9pwf****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `taskId` | string | Yes | The task ID. Example: `crast-y64sq01bgad****` |

## listArtifactSubscriptionTask

Lists artifact subscription tasks.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-m9ob8792vm****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |

