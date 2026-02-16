# Quick Start Guide

## Installation

```bash
npm install @alicloud/r-kvstore20150101 @alicloud/openapi-core @darabonba/typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

## Client Initialization

```typescript
import Client from '@alicloud/r-kvstore20150101';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: 'r-kvstore.aliyuncs.com',
  regionId: 'cn-hangzhou',
});

const client = new Client(config);
```

## Available Endpoints

| Region | Endpoint |
|--------|----------|
| Default (all regions) | r-kvstore.aliyuncs.com |
| China (Hangzhou) | r-kvstore.cn-hangzhou.aliyuncs.com |
| China (Shanghai) | r-kvstore.cn-shanghai.aliyuncs.com |
| China (Beijing) | r-kvstore.cn-beijing.aliyuncs.com |
| Singapore | r-kvstore.ap-southeast-1.aliyuncs.com |
| US (Virginia) | r-kvstore.us-east-1.aliyuncs.com |

## Supported Instance Types

| Type | Value | Description |
|------|-------|-------------|
| Redis Community | `Redis` | Open-source Redis compatible |
| Tair (DRAM) | `Tair_rdb` | Enhanced in-memory, Redis-compatible |
| Tair (Persistent Memory) | `Tair_scm` | Persistent memory, lower cost |
| Tair (ESSD) | `Tair_essd` | Disk-based, large capacity |

## Instance Architectures

| Architecture | Value | Description |
|-------------|-------|-------------|
| Standard | `standard` | Single node or primary-replica |
| Cluster | `cluster` | Distributed cluster with shards |
| Read/Write Splitting | `rwsplit` | Read/write splitting proxy |

## Supported Redis Versions

- Redis 4.0, 5.0, 6.0, 7.0
- Tair versions align with Redis compatibility

## API Calling Pattern

R-KVStore uses RPC-style APIs with flat Request parameters:

```typescript
import * as models from '@alicloud/r-kvstore20150101/dist/models';

const { body } = await client.describeInstances(new models.DescribeInstancesRequest({
  regionId: 'cn-hangzhou',
  pageSize: 50,
  pageNumber: 1,
}));
```

## Pagination

Most Describe APIs use `pageNumber` + `pageSize`:

```typescript
let pageNumber = 1;
const pageSize = 50;
let allInstances: any[] = [];

while (true) {
  const { body } = await client.describeInstances(new models.DescribeInstancesRequest({
    regionId: 'cn-hangzhou',
    pageSize,
    pageNumber,
  }));
  allInstances.push(...(body.instances?.KVStoreInstance || []));
  if (allInstances.length >= (body.totalCount || 0)) break;
  pageNumber++;
}
```

## Instance Charge Types

| Type | Value | Description |
|------|-------|-------------|
| Pay-As-You-Go | `PostPaid` | Billed by hour |
| Subscription | `PrePaid` | Monthly/yearly subscription |

## Common Instance Status Values

| Status | Description |
|--------|-------------|
| `Normal` | Instance is running normally |
| `Creating` | Instance is being created |
| `Changing` | Specification is being changed |
| `Inactive` | Instance is overdue or locked |
| `Flushing` | Data is being flushed |
| `Released` | Instance has been released |
| `Transforming` | Billing method is being changed |
| `Unavailable` | Instance is unavailable |

## Error Handling

```typescript
try {
  await client.createInstance(request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Async Operations

Many operations are asynchronous. Poll instance status:

```typescript
while (true) {
  const { body } = await client.describeInstanceAttribute(
    new models.DescribeInstanceAttributeRequest({ instanceId })
  );
  const status = body.instances?.DBInstanceAttribute?.[0]?.instanceStatus;
  if (status === 'Normal') break;
  await new Promise(r => setTimeout(r, 5000));
}
```
