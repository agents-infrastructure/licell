# Bucket Management

Bucket CRUD, listing, info, location, ACL, and basic operations.

## putBucket

**Signature:** `putBucket(bucket: string, request: PutBucketRequest)`

putBucket operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `createBucketConfiguration` | CreateBucketConfiguration | No | - |

## listBuckets

**Signature:** `listBuckets(request: ListBucketsRequest)`

listBuckets operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `marker` | string | No | - |
| `maxKeys` | number | No | - |
| `prefix` | string | No | - |

## getBucketInfo

**Signature:** `getBucketInfo(bucket: string)`

getBucketInfo operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketLocation

**Signature:** `getBucketLocation(bucket: string)`

getBucketLocation operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketAcl

**Signature:** `getBucketAcl(bucket: string)`

getBucketAcl operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## putBucketAcl

**Signature:** `putBucketAcl(bucket: string)`

putBucketAcl operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## deleteBucket

**Signature:** `deleteBucket(bucket: string)`

deleteBucket operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## describeRegions

**Signature:** `describeRegions(request: DescribeRegionsRequest)`

describeRegions operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regions` | string | No | - |

## listObjects

**Signature:** `listObjects(bucket: string, request: ListObjectsRequest)`

listObjects operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `delimiter` | string | No | - |
| `encodingType` | string | No | - |
| `marker` | string | No | - |
| `maxKeys` | number | No | - |
| `prefix` | string | No | - |

## listObjectsV2

**Signature:** `listObjectsV2(bucket: string, request: ListObjectsV2Request)`

listObjectsV2 operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `continuationToken` | string | No | - |
| `delimiter` | string | No | - |
| `encodingType` | string | No | - |
| `fetchOwner` | boolean | No | - |
| `maxKeys` | number | No | - |
| `prefix` | string | No | - |
| `startAfter` | string | No | - |

## listObjectVersions

**Signature:** `listObjectVersions(bucket: string, request: ListObjectVersionsRequest)`

listObjectVersions operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `delimiter` | string | No | - |
| `encodingType` | string | No | - |
| `keyMarker` | string | No | - |
| `maxKeys` | number | No | - |
| `prefix` | string | No | - |
| `versionIdMarker` | string | No | - |

