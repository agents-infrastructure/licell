# Bucket Replication & WORM

Cross-region replication, same-region replication, and compliance retention (WORM) policies.

## getBucketReplication

**Signature:** `getBucketReplication(bucket: string)`

getBucketReplication operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketReplicationLocation

**Signature:** `getBucketReplicationLocation(bucket: string)`

getBucketReplicationLocation operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## getBucketReplicationProgress

**Signature:** `getBucketReplicationProgress(bucket: string, request: GetBucketReplicationProgressRequest)`

getBucketReplicationProgress operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `ruleId` | string | No | - |

## putBucketReplication

**Signature:** `putBucketReplication(bucket: string, request: PutBucketReplicationRequest)`

putBucketReplication operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `replicationConfiguration` | ReplicationConfiguration | No | - |

## deleteBucketReplication

**Signature:** `deleteBucketReplication(bucket: string, request: DeleteBucketReplicationRequest)`

deleteBucketReplication operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `body` | ReplicationRules | No | - |

## initiateBucketWorm

**Signature:** `initiateBucketWorm(bucket: string, request: InitiateBucketWormRequest)`

initiateBucketWorm operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `initiateWormConfiguration` | InitiateWormConfiguration | No | - |

## getBucketWorm

**Signature:** `getBucketWorm(bucket: string)`

getBucketWorm operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## abortBucketWorm

**Signature:** `abortBucketWorm(bucket: string)`

abortBucketWorm operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |

## completeBucketWorm

**Signature:** `completeBucketWorm(bucket: string, request: CompleteBucketWormRequest)`

completeBucketWorm operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `wormId` | string | No | - |

## extendBucketWorm

**Signature:** `extendBucketWorm(bucket: string, request: ExtendBucketWormRequest)`

extendBucketWorm operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `body` | ExtendWormConfiguration | No | - |
| `wormId` | string | No | - |

