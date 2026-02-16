# Event Center

Event notification rules and records.

## deleteEventCenterRule

Deletes an event notification rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The ID of the instance. Example: `cri-xkx6vujuhay0****` |
| `ruleId` | string | No | The ID of the event notification rule. Example: `crecr-n6pbhgjx*****` |

## updateEventCenterRule

Updates an event notification rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventChannel` | string | No | The event notification channel. Example: `EVENT_BRIDGE` |
| `eventConfig` | string | No | The event configuration. Example: `{` |
| `eventScope` | string | No | The event scope. Valid values: Example: `INSTANCE` |
| `eventType` | string | No | The type of the event. Valid values: Example: `cr:Artifact:DeliveryChainCompleted` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `namespaces` | string[] | No | The namespaces to which the event notification rule applies. Example: `ns` |
| `repoNames` | string[] | No | The names of the repositories to which the event notification rule applies. Example: `reponame` |
| `repoTagFilterPattern` | string | No | The regular expression for image tags. Example: `.*` |
| `ruleId` | string | Yes | The ID of the event notification rule. Example: `crecr-n6pbhgjxt*****` |
| `ruleName` | string | No | The name of the event notification rule. Example: `chain-demo` |

## listEventCenterRecord

Queries the historical events of an event rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventType` | string | No | The type of the event. Valid values: Example: `cr:Artifact:DeliveryChainCompleted` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |
| `repoName` | string | No | The name of the repository. Example: `test` |
| `repoNamespaceName` | string | No | The name of the namespace to which the repository belongs. Example: `test` |
| `ruleId` | string | No | The ID of the event notification rule. Example: `crecr-n6pbhgjxtla***` |

## listEventCenterRuleName

Queries the names of event notification rules.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-kmsiwlxxdcva****` |

