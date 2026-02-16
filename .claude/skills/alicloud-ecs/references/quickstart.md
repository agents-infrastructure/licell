# Quick Start Guide

## Installation

```bash
npm install @alicloud/ecs20140526 @alicloud/openapi-core @darabonba/typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIBABA_CLOUD_REGION_ID="cn-hangzhou"
```

## Client Initialization

```typescript
import Client from '@alicloud/ecs20140526';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  regionId: 'cn-hangzhou',
  endpoint: 'ecs.cn-hangzhou.aliyuncs.com',
});

const client = new Client(config);
```

## Available Regions

| Region | Region ID | Endpoint |
|--------|-----------|----------|
| China (Hangzhou) | cn-hangzhou | ecs.cn-hangzhou.aliyuncs.com |
| China (Shanghai) | cn-shanghai | ecs.cn-shanghai.aliyuncs.com |
| China (Beijing) | cn-beijing | ecs.cn-beijing.aliyuncs.com |
| China (Shenzhen) | cn-shenzhen | ecs.cn-shenzhen.aliyuncs.com |
| China (Hong Kong) | cn-hongkong | ecs.cn-hongkong.aliyuncs.com |
| Singapore | ap-southeast-1 | ecs.ap-southeast-1.aliyuncs.com |
| US (Virginia) | us-east-1 | ecs.us-east-1.aliyuncs.com |
| US (Silicon Valley) | us-west-1 | ecs.us-west-1.aliyuncs.com |

Use `describeRegions` API to get the full list of supported regions.

## API Calling Pattern

ECS uses RPC-style APIs. All parameters are flat fields in a single Request object:

```typescript
import * as models from '@alicloud/ecs20140526/dist/models';

const request = new models.DescribeInstancesRequest({
  regionId: 'cn-hangzhou',
  pageSize: 10,
  pageNumber: 1,
});
const { body } = await client.describeInstances(request);
```

## Pagination

Most List/Describe APIs use `pageNumber` + `pageSize` pagination:

```typescript
let pageNumber = 1;
const pageSize = 100;
let allInstances: any[] = [];

while (true) {
  const { body } = await client.describeInstances(new models.DescribeInstancesRequest({
    regionId: 'cn-hangzhou',
    pageSize,
    pageNumber,
  }));
  allInstances.push(...(body.instances?.instance || []));
  if (allInstances.length >= (body.totalCount || 0)) break;
  pageNumber++;
}
```

## Error Handling

```typescript
try {
  await client.describeInstances(request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Common Instance Types

| Category | Instance Type | vCPU | Memory | Use Case |
|----------|--------------|------|--------|----------|
| General | ecs.g7.large | 2 | 8 GiB | Web servers, small databases |
| General | ecs.g7.xlarge | 4 | 16 GiB | Medium workloads |
| Compute | ecs.c7.large | 2 | 4 GiB | Compute-intensive tasks |
| Memory | ecs.r7.large | 2 | 16 GiB | In-memory databases |
| GPU | ecs.gn7i-c8g1.2xlarge | 8 | 30 GiB | AI/ML inference |

Use `describeInstanceTypes` to query all available instance types.

## Charge Types

| Value | Description |
|-------|-------------|
| `PostPaid` | Pay-as-you-go (default) |
| `PrePaid` | Subscription (monthly/yearly) |

## Instance Status Values

| Status | Description |
|--------|-------------|
| `Pending` | Being created |
| `Running` | Running normally |
| `Starting` | Starting up |
| `Stopping` | Shutting down |
| `Stopped` | Stopped |
