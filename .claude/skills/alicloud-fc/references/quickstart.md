# Quick Start Guide

## Installation

```bash
npm install @alicloud/fc20230330 @alicloud/openapi-core @darabonba/typescript
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
import Client from '@alicloud/fc20230330';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  regionId: 'cn-hangzhou',
  endpoint: 'cn-hangzhou.fc.aliyuncs.com',
});

const client = new Client(config);
```

## Available Regions

Common regions for Function Compute 3.0:

| Region | Region ID | Endpoint |
|--------|-----------|----------|
| China (Hangzhou) | cn-hangzhou | cn-hangzhou.fc.aliyuncs.com |
| China (Shanghai) | cn-shanghai | cn-shanghai.fc.aliyuncs.com |
| China (Beijing) | cn-beijing | cn-beijing.fc.aliyuncs.com |
| China (Shenzhen) | cn-shenzhen | cn-shenzhen.fc.aliyuncs.com |
| China (Hong Kong) | cn-hongkong | cn-hongkong.fc.aliyuncs.com |
| Singapore | ap-southeast-1 | ap-southeast-1.fc.aliyuncs.com |
| US (Virginia) | us-east-1 | us-east-1.fc.aliyuncs.com |
| US (Silicon Valley) | us-west-1 | us-west-1.fc.aliyuncs.com |

Use `describeRegions` API to get the full list of supported regions.

## API Calling Patterns

### RESTful Path Parameters

FC 3.0 APIs use RESTful style. Many APIs take path parameters (e.g., `functionName`, `aliasName`) as direct method arguments, plus an optional request object for query/body parameters:

```typescript
// Path param: functionName; Request object for query params
const { body } = await client.getFunction('my-function', { qualifier: 'LATEST' });
```

### Body Input Pattern

Create/Update APIs use a `body` field in the request to pass structured input:

```typescript
await client.createFunction({
  body: {
    functionName: 'my-function',
    runtime: 'nodejs18',
    handler: 'index.handler',
    memorySize: 512,
    timeout: 60,
    code: { zipFile: 'base64-encoded-zip' },
  },
});
```

### Pagination

List APIs use `nextToken` + `limit` cursor-based pagination:

```typescript
let nextToken: string | undefined;
let allFunctions: any[] = [];

do {
  const { body } = await client.listFunctions({
    limit: 100,
    nextToken,
  });
  allFunctions.push(...(body.functions || []));
  nextToken = body.nextToken;
} while (nextToken);
```

## Error Handling

```typescript
try {
  await client.getFunction('my-function', {});
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Supported Runtimes

| Runtime | Value |
|---------|-------|
| Node.js 18 | `nodejs18` |
| Node.js 16 | `nodejs16` |
| Node.js 14 | `nodejs14` |
| Python 3.10 | `python3.10` |
| Python 3.9 | `python3.9` |
| Python 3 | `python3` |
| Java 11 | `java11` |
| Java 8 | `java8` |
| Go 1 | `go1` |
| .NET 6 | `dotnetcore3.1` |
| PHP 7.2 | `php7.2` |
| Custom Runtime | `custom` |
| Custom Container | `custom-container` |
