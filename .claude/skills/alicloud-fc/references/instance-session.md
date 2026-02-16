# Instance & Session

Function instance listing and session management.

## listInstances

**Signature:** `listInstances(functionName: string, request: ListInstancesRequest)`

Queries a list of function instances..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `endTimeMs` | number | No | - |
| `qualifier` | string | No | The function version or alias. Example: `LATEST` |
| `withAllActive` | boolean | No | Specifies whether to list all instances. Valid values: true and false. Example: `true` |

## createSession

**Signature:** `createSession(functionName: string, request: CreateSessionRequest)`

The CreateSession operation creates an explicit session resource. The system automatically generates a unique session ID, pre-allocates a function instance, and associates it with the session. You can specify values for TTL and idle timeout. This method applies to the HEADER_FIELD and GENERATED_COOKIE affinity types. It handles session preload and configuration initialization. After you call the InvokeFunction API, the session information can be included in the InvokeFunction request to enable request routing..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.disableSessionIdReuse` | boolean | No | - |
| `body.sessionId` | string | No | - Example: `custom-test-session-id` |
| `body.sessionIdleTimeoutInSeconds` | number | No | - Example: `1800` |
| `body.sessionTTLInSeconds` | number | No | - Example: `21600` |
| `qualifier` | string | No | Specifies the version or alias to which the sesion belongs. Example: `aliasName1` |

## deleteSession

**Signature:** `deleteSession(functionName: string, sessionId: string, request: DeleteSessionRequest)`

Deletes the specified session and prohibits new requests from being routed to it. Clears the session metadata from the database, so subsequent requests with the same session ID are treated as new sessions. Releases resources and performs session cleanup. In session isolation scenarios, terminates running requests and releases the instance bound to the session. In non-session isolation scenarios, allows running requests to continue and gracefully terminates them..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `sessionId` | string | Yes | Path parameter: sessionId |
| `qualifier` | string | No | The function alias or version associated with the session to be deleted. Example: `aliasName1` |

## getSession

**Signature:** `getSession(functionName: string, sessionId: string, request: GetSessionRequest)`

You can use this operation to retrieve detailed information about a specific session, including its session ID, associated function, affinity type, lifecycle configuration, status, and instance details. This operation retrieves the current metadata for a session. You can identify the metadata precisely using either the function name or qualifier. This capability enables you to monitor and debug external systems with ease. Only sessions that are in the Active state can be queried..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `sessionId` | string | Yes | Path parameter: sessionId |
| `qualifier` | string | No | The function alias or version associated with the queried session ID. Example: `aliasName1` |

## listSessions

**Signature:** `listSessions(functionName: string, request: ListSessionsRequest)`

Lists sessions in the Active and/or Expired state(s) under the specified function. Supports filtering by qualifier, status, and session ID, as well as paginated queries. Returns basic session attributes for batch viewing of session distribution and status, helping with operations monitoring and integration with external systems, and enhancing session visibility and management..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `limit` | number | No | The number of sessions to be returned. If this parameter is not specified, 20 sessions are returned  Example: `10` |
| `nextToken` | string | No | The token for the next page. Example: `MTIzNCNhYmM=` |
| `qualifier` | string | No | The function alias or version. Example: `aliasName1` |
| `sessionId` | string | No | The SessionId value to filter. If specified, all session information associated with this session ID Example: `test-session-id-1` |
| `sessionStatus` | string | No | The session status to filter. By default, information for all sessions in the Active and Expired sta Example: `Active` |

## updateSession

**Signature:** `updateSession(functionName: string, sessionId: string, request: UpdateSessionRequest)`

Updates session configurations while the session is in the Active state, such as lifecycle parameters (e.g., SessionTTLInSeconds and SessionIdleTimeoutInSeconds). After the update takes effect, LastModifiedTime is automatically refreshed. These updates can be used to extend or shorten the validity period of a session and enable dynamic management without changing the execution environment bound to the session..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `sessionId` | string | Yes | Path parameter: sessionId |
| `body.disableSessionIdReuse` | boolean | No | - |
| `body.sessionIdleTimeoutInSeconds` | number | No | - Example: `1800` |
| `body.sessionTTLInSeconds` | number | No | - Example: `21600` |
| `qualifier` | string | No | The function alias or version associated with the session to be updated. Example: `aliasName1` |

