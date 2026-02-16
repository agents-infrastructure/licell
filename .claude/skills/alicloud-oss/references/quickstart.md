# Quick Start Guide

## Installation

```bash
npm install @alicloud/oss20190517 @alicloud/openapi-client @alicloud/gateway-oss @alicloud/gateway-spi @alicloud/tea-util @alicloud/openapi-util @alicloud/tea-typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

## Client Initialization

OSS uses a region-based endpoint pattern:

```typescript
import Client from '@alicloud/oss20190517';
import { Config } from '@alicloud/openapi-client';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  regionId: 'cn-hangzhou',
});

const client = new Client(config);
```

## Important: OSS SDK API Style

OSS uses a **RESTful-style** API, which differs from other Alibaba Cloud RPC-style SDKs:

1. **Path parameters**: `bucket` and `key` are passed as function arguments, not in the Request object
2. **Request body**: Configuration is passed via nested model objects, not flat fields
3. **No regionId in requests**: The region is determined by the client endpoint
4. **Models are inline**: All models are exported from the main client module

```typescript
// Import models from the client module directly
import Client, { PutObjectRequest, GetObjectRequest } from '@alicloud/oss20190517';
```

## Available Endpoints

| Region | Endpoint |
|--------|----------|
| China (Hangzhou) | oss-cn-hangzhou.aliyuncs.com |
| China (Shanghai) | oss-cn-shanghai.aliyuncs.com |
| China (Beijing) | oss-cn-beijing.aliyuncs.com |
| China (Shenzhen) | oss-cn-shenzhen.aliyuncs.com |
| Singapore | oss-ap-southeast-1.aliyuncs.com |
| US (Virginia) | oss-us-east-1.aliyuncs.com |
| US (Silicon Valley) | oss-us-west-1.aliyuncs.com |

Pattern: `oss-{regionId}.aliyuncs.com`

## Bucket Naming Rules

- 3-63 characters, lowercase letters, numbers, and hyphens only
- Must start and end with a lowercase letter or number
- Globally unique across all OSS users

## Storage Classes

| Class | Value | Description |
|-------|-------|-------------|
| Standard | `Standard` | Frequently accessed data |
| Infrequent Access | `IA` | Infrequently accessed, min 30 days |
| Archive | `Archive` | Archival data, min 60 days |
| Cold Archive | `ColdArchive` | Rarely accessed, min 180 days |
| Deep Cold Archive | `DeepColdArchive` | Almost never accessed |

## ACL Values

| ACL | Value | Description |
|-----|-------|-------------|
| Private | `private` | Only owner can read/write |
| Public Read | `public-read` | Anyone can read, owner writes |
| Public Read-Write | `public-read-write` | Anyone can read/write |

## Pagination

OSS uses marker-based pagination (not page numbers):

```typescript
let marker = '';
let allObjects: any[] = [];
while (true) {
  const { body } = await client.listObjects('my-bucket', new ListObjectsRequest({
    maxKeys: 1000,
    marker,
  }));
  allObjects.push(...(body.contents || []));
  if (!body.isTruncated) break;
  marker = body.nextMarker || '';
}
```

For ListObjectsV2:
```typescript
let continuationToken = '';
while (true) {
  const { body } = await client.listObjectsV2('my-bucket', new ListObjectsV2Request({
    maxKeys: 1000,
    continuationToken: continuationToken || undefined,
  }));
  allObjects.push(...(body.contents || []));
  if (!body.isTruncated) break;
  continuationToken = body.nextContinuationToken || '';
}
```

## Error Handling

```typescript
try {
  await client.putObject('my-bucket', 'my-key', request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
  console.error(`Host ID: ${error.data?.HostId}`);
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| NoSuchBucket | Bucket does not exist |
| NoSuchKey | Object does not exist |
| BucketAlreadyExists | Bucket name already taken |
| AccessDenied | Permission denied |
| InvalidBucketName | Invalid bucket name |
| InvalidObjectName | Invalid object key |
| EntityTooLarge | Object exceeds 5 GB (use multipart) |
