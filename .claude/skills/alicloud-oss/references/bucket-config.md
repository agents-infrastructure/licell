# Bucket Configuration

Lifecycle, versioning, CORS, logging, website hosting, referer, encryption, request payment, transfer acceleration, tags, inventory, and policy.

## getBucketLifecycle

**Signature:** `getBucketLifecycle(bucket: string)`

getBucketLifecycle operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketLifecycle

**Signature:** `putBucketLifecycle(bucket: string, request: PutBucketLifecycleRequest)`

putBucketLifecycle operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `lifecycleConfiguration` | LifecycleConfiguration | No | - |

## deleteBucketLifecycle

**Signature:** `deleteBucketLifecycle(bucket: string)`

deleteBucketLifecycle operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketVersioning

**Signature:** `getBucketVersioning(bucket: string)`

getBucketVersioning operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketVersioning

**Signature:** `putBucketVersioning(bucket: string, request: PutBucketVersioningRequest)`

putBucketVersioning operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `versioningConfiguration` | VersioningConfiguration | No | - |

## getBucketCors

**Signature:** `getBucketCors(bucket: string)`

getBucketCors operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketCors

**Signature:** `putBucketCors(bucket: string, request: PutBucketCorsRequest)`

putBucketCors operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `cORSConfiguration` | CORSConfiguration | No | - |

## deleteBucketCors

**Signature:** `deleteBucketCors(bucket: string)`

deleteBucketCors operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketLogging

**Signature:** `getBucketLogging(bucket: string)`

getBucketLogging operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketLogging

**Signature:** `putBucketLogging(bucket: string, request: PutBucketLoggingRequest)`

putBucketLogging operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `bucketLoggingStatus` | BucketLoggingStatus | No | - |

## deleteBucketLogging

**Signature:** `deleteBucketLogging(bucket: string)`

deleteBucketLogging operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketWebsite

**Signature:** `getBucketWebsite(bucket: string)`

getBucketWebsite operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketWebsite

**Signature:** `putBucketWebsite(bucket: string, request: PutBucketWebsiteRequest)`

putBucketWebsite operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `websiteConfiguration` | WebsiteConfiguration | No | - |

## deleteBucketWebsite

**Signature:** `deleteBucketWebsite(bucket: string)`

deleteBucketWebsite operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketReferer

**Signature:** `getBucketReferer(bucket: string)`

getBucketReferer operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketReferer

**Signature:** `putBucketReferer(bucket: string, request: PutBucketRefererRequest)`

putBucketReferer operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `refererConfiguration` | RefererConfiguration | No | - |

## getBucketEncryption

**Signature:** `getBucketEncryption(bucket: string)`

getBucketEncryption operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketEncryption

**Signature:** `putBucketEncryption(bucket: string, request: PutBucketEncryptionRequest)`

putBucketEncryption operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `serverSideEncryptionRule` | ServerSideEncryptionRule | No | - |

## deleteBucketEncryption

**Signature:** `deleteBucketEncryption(bucket: string)`

deleteBucketEncryption operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketRequestPayment

**Signature:** `getBucketRequestPayment(bucket: string)`

getBucketRequestPayment operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketRequestPayment

**Signature:** `putBucketRequestPayment(bucket: string, request: PutBucketRequestPaymentRequest)`

putBucketRequestPayment operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `requestPaymentConfiguration` | RequestPaymentConfiguration | No | - |

## getBucketTransferAcceleration

**Signature:** `getBucketTransferAcceleration(bucket: string)`

getBucketTransferAcceleration operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketTransferAcceleration

**Signature:** `putBucketTransferAcceleration(bucket: string, request: PutBucketTransferAccelerationRequest)`

putBucketTransferAcceleration operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `transferAccelerationConfiguration` | TransferAccelerationConfiguration | No | - |

## getBucketTags

**Signature:** `getBucketTags(bucket: string)`

getBucketTags operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketTags

**Signature:** `putBucketTags(bucket: string, request: PutBucketTagsRequest)`

putBucketTags operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `tagging` | Tagging | No | - |

## deleteBucketTags

**Signature:** `deleteBucketTags(bucket: string)`

deleteBucketTags operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketInventory

**Signature:** `getBucketInventory(bucket: string, request: GetBucketInventoryRequest)`

getBucketInventory operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `inventoryId` | string | No | - |

## listBucketInventory

**Signature:** `listBucketInventory(bucket: string, request: ListBucketInventoryRequest)`

listBucketInventory operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `continuationToken` | string | No | - |

## putBucketInventory

**Signature:** `putBucketInventory(bucket: string, request: PutBucketInventoryRequest)`

putBucketInventory operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `inventoryConfiguration` | InventoryConfiguration | No | - |
| `inventoryId` | string | No | - |

## deleteBucketInventory

**Signature:** `deleteBucketInventory(bucket: string, request: DeleteBucketInventoryRequest)`

deleteBucketInventory operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `inventoryId` | string | No | - |

## getBucketPolicy

**Signature:** `getBucketPolicy(bucket: string)`

getBucketPolicy operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketPolicy

**Signature:** `putBucketPolicy(bucket: string, request: PutBucketPolicyRequest)`

putBucketPolicy operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `policy` | string | No | - |

## deleteBucketPolicy

**Signature:** `deleteBucketPolicy(bucket: string)`

deleteBucketPolicy operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

