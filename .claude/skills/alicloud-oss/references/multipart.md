# Multipart Upload

Multipart upload operations for large file uploads.

## initiateMultipartUpload

**Signature:** `initiateMultipartUpload(bucket: string, key: string, request: InitiateMultipartUploadRequest)`

- When you call the InitiateMultipartUpload operation, OSS creates and returns a unique upload ID to identify the multipart upload task. You can initiate operations such as stopping or querying the mu.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `encodingType` | string | No | - |

## uploadPart

**Signature:** `uploadPart(bucket: string, key: string, request: UploadPartRequest)`

uploadPart operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `body` | Readable | No | - |
| `partNumber` | number | No | - |
| `uploadId` | string | No | - |

## uploadPartCopy

**Signature:** `uploadPartCopy(bucket: string, key: string, request: UploadPartCopyRequest)`

uploadPartCopy operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `partNumber` | number | No | - |
| `uploadId` | string | No | - |

## completeMultipartUpload

**Signature:** `completeMultipartUpload(bucket: string, key: string, request: CompleteMultipartUploadRequest)`

completeMultipartUpload operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `body` | CompleteMultipartUpload | No | - |
| `encodingType` | string | No | - |
| `uploadId` | string | No | - |

## abortMultipartUpload

**Signature:** `abortMultipartUpload(bucket: string, key: string, request: AbortMultipartUploadRequest)`

abortMultipartUpload operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `uploadId` | string | No | - |

## listMultipartUploads

**Signature:** `listMultipartUploads(bucket: string, request: ListMultipartUploadsRequest)`

listMultipartUploads operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `delimiter` | string | No | - |
| `encodingType` | string | No | - |
| `keyMarker` | string | No | - |
| `maxUploads` | number | No | - |
| `prefix` | string | No | - |
| `uploadIdMarker` | string | No | - |

## listParts

**Signature:** `listParts(bucket: string, key: string, request: ListPartsRequest)`

listParts operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `key` | string | Yes | Path parameter: key |
| `encodingType` | string | No | - |
| `maxParts` | number | No | - |
| `partNumberMarker` | number | No | - |
| `uploadId` | string | No | - |

