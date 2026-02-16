# Quick Start Guide

## Installation

```bash
npm install @alicloud/cr20181201 @alicloud/openapi-core @darabonba/typescript
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
import Client from '@alicloud/cr20181201';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  regionId: 'cn-hangzhou',
  endpoint: 'cr.cn-hangzhou.aliyuncs.com',
});

const client = new Client(config);
```

## Available Regions

Common regions for Container Registry:

| Region | Region ID | Endpoint |
|--------|-----------|----------|
| China (Hangzhou) | cn-hangzhou | cr.cn-hangzhou.aliyuncs.com |
| China (Shanghai) | cn-shanghai | cr.cn-shanghai.aliyuncs.com |
| China (Beijing) | cn-beijing | cr.cn-beijing.aliyuncs.com |
| China (Shenzhen) | cn-shenzhen | cr.cn-shenzhen.aliyuncs.com |
| China (Hong Kong) | cn-hongkong | cr.cn-hongkong.aliyuncs.com |
| Singapore | ap-southeast-1 | cr.ap-southeast-1.aliyuncs.com |
| US (Virginia) | us-east-1 | cr.us-east-1.aliyuncs.com |
| US (Silicon Valley) | us-west-1 | cr.us-west-1.aliyuncs.com |

Use `listInstanceRegion` API to get the full list of supported regions.

## Error Handling

All API calls may throw errors. Wrap calls in try-catch:

```typescript
try {
  const { body } = await client.listInstance({ pageNo: 1, pageSize: 30 });
  console.log(body.instances);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Pagination

Most list APIs support pagination with `pageNo` and `pageSize`:

```typescript
let pageNo = 1;
const pageSize = 30;
let allItems: any[] = [];

while (true) {
  const { body } = await client.listRepository({
    instanceId: 'cri-xxx',
    pageNo,
    pageSize,
  });
  allItems = allItems.concat(body.repositories || []);
  if (!body.repositories || body.repositories.length < pageSize) break;
  pageNo++;
}
```

## Common Instance ID

Almost all APIs require an `instanceId` parameter. Get it first:

```typescript
const { body } = await client.listInstance({ pageNo: 1, pageSize: 30 });
const instanceId = body.instances?.[0]?.instanceId;
```
