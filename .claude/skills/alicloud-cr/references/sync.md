# Image Synchronization

Image sync rules and tasks across regions or instances.

## createRepoSyncRule

Creates an image synchronization rule for an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The source instance ID. Example: `cri-hpdfkc6utbaq****` |
| `namespaceName` | string | Yes | The namespace name of the source instance. Example: `ns1` |
| `repoName` | string | No | The name of the image repository in the source instance. Example: `repo1` |
| `repoNameFilter` | string | No | The regular expression that is used to filter repositories. Example: `.*` |
| `syncRuleName` | string | Yes | The name of the image synchronization rule. Example: `rule` |
| `syncScope` | string | Yes | The synchronization scope. Valid values: Example: `REPO` |
| `syncTrigger` | string | No | The mode of triggering the synchronization rule. Valid values: Example: `PASSIVE` |
| `tagFilter` | string | Yes | The regular expression that is used to filter image tags. Example: `.*` |
| `targetInstanceId` | string | Yes | The destination instance ID. Example: `cri-ibxs3piklys3****` |
| `targetNamespaceName` | string | Yes | The namespace name of the destination instance. Example: `ns1` |
| `targetRegionId` | string | Yes | The region ID of the destination instance. Example: `cn-shanghai` |
| `targetRepoName` | string | No | The name of the image repository in the destination instance. Example: `repo1` |
| `targetUserId` | string | No | The user ID (UID) of the account to which the destination instance belongs. Example: `12645940***` |

## deleteRepoSyncRule

Deletes an image replication rule of an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-hpdfkc6utbaq****` |
| `syncRuleId` | string | Yes | The ID of the synchronization rule. Example: `crsr-gk5p2ns1kzns****` |

## listRepoSyncRule

Queries image synchronization rules of a repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `namespaceName` | string | No | The name of the namespace. Example: `test-namespace` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |
| `repoName` | string | No | The name of the image repository. Example: `test-repo` |
| `targetInstanceId` | string | No | The ID of the destination instance. Example: `cri-k77rd2eo9ztt****` |
| `targetRegionId` | string | No | The region ID of the destination instance. Example: `cn-shenzhen` |

## createRepoSyncTask

@param request - CreateRepoSyncTaskRequest.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | This parameter is required. Example: `cri-hpdfkc6utbaq****` |
| `override` | boolean | No | - Example: `true` |
| `repoId` | string | Yes | This parameter is required. Example: `crr-iql7jalx4g0****` |
| `tag` | string | Yes | This parameter is required. Example: `tag1` |
| `targetInstanceId` | string | Yes | This parameter is required. Example: `cri-ibxs3piklys3****` |
| `targetNamespace` | string | Yes | This parameter is required. Example: `ns1` |
| `targetRegionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `targetRepoName` | string | Yes | This parameter is required. Example: `repo1` |
| `targetTag` | string | Yes | This parameter is required. Example: `tag1` |
| `targetUserId` | string | No | - Example: `12345***` |

## createRepoSyncTaskByRule

Creates an image replication task based on a manual replication rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-hpdfkc6utbaq****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-hnoq7j93or3k****` |
| `syncRuleId` | string | Yes | The ID of the synchronization rule. Example: `crsr-o8n4dijbumgq****` |
| `tag` | string | Yes | The version of the image to be synchronized. Example: `1.24` |

## cancelRepoSyncTask

Cancels a single replication task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-xkx6vujuhay0****` |
| `syncTaskId` | string | Yes | The ID of the replication task. Example: `rst-biu4u4pm4it5****` |

## getRepoSyncTask

Queries an image synchronization task in an instance.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-sgedpenzw80e****` |
| `syncTaskId` | string | Yes | The ID of the synchronization task. Example: `rst-zxjkiv5oil6f****` |

## listRepoSyncTask

Queries image synchronization tasks in an image repository.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `repoName` | string | No | The repository name. Example: `test` |
| `repoNamespaceName` | string | No | The name of the namespace to which the repository belongs. Example: `ns` |
| `syncRecordId` | string | No | The ID of the synchronization task record, which is the same as SyncBatchTaskId in the response. Example: `crsr-7lph66uloi6h****` |
| `tag` | string | No | The image tag. Example: `nginx` |

