# Quick Start Guide

## Installation

```bash
npm install @alicloud/vpc20160428 @alicloud/openapi-core @darabonba/typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

## Client Initialization

```typescript
import Client from '@alicloud/vpc20160428';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: 'vpc.aliyuncs.com',
  regionId: 'cn-hangzhou',
});

const client = new Client(config);
```

## Available Endpoints

| Region | Endpoint |
|--------|----------|
| Default (all regions) | vpc.aliyuncs.com |
| China (Hangzhou) | vpc.cn-hangzhou.aliyuncs.com |
| China (Shanghai) | vpc.cn-shanghai.aliyuncs.com |
| China (Beijing) | vpc.cn-beijing.aliyuncs.com |
| China (Shenzhen) | vpc.cn-shenzhen.aliyuncs.com |
| Singapore | vpc.ap-southeast-1.aliyuncs.com |
| US (Virginia) | vpc.us-east-1.aliyuncs.com |

The default endpoint `vpc.aliyuncs.com` supports all regions. Set `regionId` in the Config to specify the target region.

## API Calling Pattern

VPC uses RPC-style APIs. Parameters are flat fields in a Request object:

```typescript
import * as models from '@alicloud/vpc20160428/dist/models';

const request = new models.DescribeVpcsRequest({
  regionId: 'cn-hangzhou',
  pageNumber: 1,
  pageSize: 50,
});
const { body } = await client.describeVpcs(request);
```

## Pagination

Most Describe/List APIs use `pageNumber` + `pageSize`:

```typescript
let pageNumber = 1;
const pageSize = 50;
let allVpcs: any[] = [];

while (true) {
  const { body } = await client.describeVpcs(new models.DescribeVpcsRequest({
    regionId: 'cn-hangzhou',
    pageSize,
    pageNumber,
  }));
  allVpcs.push(...(body.vpcs?.vpc || []));
  if (allVpcs.length >= (body.totalCount || 0)) break;
  pageNumber++;
}
```

Some newer APIs use `nextToken` + `maxResults`:

```typescript
let nextToken: string | undefined;
let allItems: any[] = [];

do {
  const { body } = await client.listVpcGatewayEndpoints(new models.ListVpcGatewayEndpointsRequest({
    regionId: 'cn-hangzhou',
    maxResults: 50,
    nextToken,
  }));
  allItems.push(...(body.endpoints || []));
  nextToken = body.nextToken;
} while (nextToken);
```

## Error Handling

```typescript
try {
  await client.createVpc(request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Common CIDR Blocks

| CIDR Block | Usable IPs | Typical Use |
|------------|-----------|-------------|
| 10.0.0.0/8 | 16,777,214 | Large VPC |
| 172.16.0.0/12 | 1,048,574 | Medium VPC |
| 192.168.0.0/16 | 65,534 | Small VPC |
| 10.0.0.0/24 | 252 | Typical VSwitch |
| 10.0.1.0/24 | 252 | Typical VSwitch |

VPC CIDR must be one of: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, or a subset. VSwitch CIDR must be a subset of its VPC CIDR.

## Async Operations

Many VPC operations are asynchronous. After creating a resource, poll its status:

```typescript
// Create VPC
const { body } = await client.createVpc(new models.CreateVpcRequest({
  regionId: 'cn-hangzhou',
  cidrBlock: '10.0.0.0/8',
  vpcName: 'my-vpc',
}));
const vpcId = body.vpcId;

// Poll until Available
while (true) {
  const { body: desc } = await client.describeVpcs(new models.DescribeVpcsRequest({
    regionId: 'cn-hangzhou', vpcId,
  }));
  if (desc.vpcs?.vpc?.[0]?.status === 'Available') break;
  await new Promise(r => setTimeout(r, 2000));
}
```
