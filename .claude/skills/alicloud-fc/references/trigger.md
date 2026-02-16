# Trigger Management

Trigger CRUD for event-driven function invocations.

## createTrigger

**Signature:** `createTrigger(functionName: string, request: CreateTriggerRequest)`

创建函数触发器。.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.description` | string | No | - Example: `trigger` |
| `body.invocationRole` | string | No | - Example: `acs:ram::1234567890:role/fc-test` |
| `body.qualifier` | string | No | - Example: `LATEST` |
| `body.sourceArn` | string | No | - Example: `acs:oss:cn-shanghai:12345:mybucket` |
| `body.triggerConfig` | string | Yes | This parameter is required. Example: `{"events":["oss:ObjectCreated:*"],"filter":{"key":{"prefix":"/prefix","suffix":".zip"}}}` |
| `body.triggerName` | string | Yes | This parameter is required. Example: `oss_create_object_demo` |
| `body.triggerType` | string | Yes | This parameter is required. Example: `oss` |

## deleteTrigger

**Signature:** `deleteTrigger(functionName: string, triggerName: string)`

Deletes a trigger..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `triggerName` | string | Yes | Path parameter: triggerName |

## getTrigger

**Signature:** `getTrigger(functionName: string, triggerName: string)`

Queries information about a trigger..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `triggerName` | string | Yes | Path parameter: triggerName |

## listTriggers

**Signature:** `listTriggers(functionName: string, request: ListTriggersRequest)`

Queries the triggers of a function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `limit` | number | No | The number of triggers returned. Example: `10` |
| `nextToken` | string | No | The token for the next page. Example: `MTIzNCNhYmM=` |
| `prefix` | string | No | The trigger name prefix. Example: `my-trigger` |

## updateTrigger

**Signature:** `updateTrigger(functionName: string, triggerName: string, request: UpdateTriggerRequest)`

Modifies a trigger..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `triggerName` | string | Yes | Path parameter: triggerName |
| `body.description` | string | No | - Example: `trigger` |
| `body.invocationRole` | string | No | - Example: `acs:ram::1234567890:role/fc-test` |
| `body.qualifier` | string | No | - Example: `LATEST` |
| `body.triggerConfig` | string | No | - Example: `{"events":["oss:ObjectCreated:*"],"filter":{"key":{"prefix":"/prefix","suffix":".zip"}}}` |

