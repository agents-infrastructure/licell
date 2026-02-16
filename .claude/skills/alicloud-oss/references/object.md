# Object Operations

Object upload, download, copy, delete, append, head, meta, ACL, symlink, tagging, restore, and select.

## putObject

**Signature:** `putObject(bucket: string, key: string, request: PutObjectRequest)`

putObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `body` | Readable | No | - |

## getObject

**Signature:** `getObject(bucket: string, key: string, request: GetObjectRequest)`

**Usage notes** - By default, the GetObject operation supports access over HTTP and HTTPS. To impose a limit on access to a bucket only over HTTPS, configure a bucket policy for the bucket to specify .

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `responseCacheControl` | string | No | - |
| `responseContentDisposition` | string | No | - |
| `responseContentEncoding` | string | No | - |
| `responseContentLanguage` | string | No | - |
| `responseContentType` | string | No | - |
| `responseExpires` | string | No | - |

## copyObject

**Signature:** `copyObject(bucket: string, key: string)`

copyObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |

## appendObject

**Signature:** `appendObject(bucket: string, key: string, request: AppendObjectRequest)`

appendObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `body` | Readable | No | - |
| `position` | number | No | - |

## deleteObject

**Signature:** `deleteObject(bucket: string, key: string, request: DeleteObjectRequest)`

deleteObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## deleteMultipleObjects

**Signature:** `deleteMultipleObjects(bucket: string, request: DeleteMultipleObjectsRequest)`

deleteMultipleObjects operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `delete` | Delete | No | - |
| `encodingType` | string | No | - |

## headObject

**Signature:** `headObject(bucket: string, key: string, request: HeadObjectRequest)`

- When you call this operation, the object content is not returned in the results.  - By default, you can call the HeadObject operation to query the metadata of the object of the current version. If t.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## getObjectMeta

**Signature:** `getObjectMeta(bucket: string, key: string, request: GetObjectMetaRequest)`

getObjectMeta operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## postObject

**Signature:** `postObject(bucket: string)`

-  The object that is uploaded by calling the PostObject operation cannot be larger than 5 GB in size. -  To initiate a PostObject request to a bucket, you must have write permissions on the bucket. I.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## restoreObject

**Signature:** `restoreObject(bucket: string, key: string, request: RestoreObjectRequest)`

restoreObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `restoreRequest` | RestoreRequest | No | - |
| `versionId` | string | No | - |

## selectObject

**Signature:** `selectObject(bucket: string, key: string, request: SelectObjectRequest)`

selectObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `selectRequest` | SelectRequest | No | - |

## createSelectObjectMeta

**Signature:** `createSelectObjectMeta(bucket: string, key: string, request: CreateSelectObjectMetaRequest)`

createSelectObjectMeta operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `selectMetaRequest` | SelectMetaRequest | No | - |

## optionObject

**Signature:** `optionObject(bucket: string, key: string)`

optionObject operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |

## getObjectAcl

**Signature:** `getObjectAcl(bucket: string, key: string, request: GetObjectAclRequest)`

getObjectAcl operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## putObjectAcl

**Signature:** `putObjectAcl(bucket: string, key: string, request: PutObjectAclRequest)`

putObjectAcl operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## getSymlink

**Signature:** `getSymlink(bucket: string, key: string, request: GetSymlinkRequest)`

getSymlink operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## putSymlink

**Signature:** `putSymlink(bucket: string, key: string)`

putSymlink operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |

## getObjectTagging

**Signature:** `getObjectTagging(bucket: string, key: string, request: GetObjectTaggingRequest)`

getObjectTagging operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

## putObjectTagging

**Signature:** `putObjectTagging(bucket: string, key: string, request: PutObjectTaggingRequest)`

putObjectTagging operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `tagging` | Tagging | No | - |
| `versionId` | string | No | - |

## deleteObjectTagging

**Signature:** `deleteObjectTagging(bucket: string, key: string, request: DeleteObjectTaggingRequest)`

deleteObjectTagging operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `versionId` | string | No | - |

