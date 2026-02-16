# Quick Start Guide

## Installation

```bash
npm install @alicloud/rds20140815 @alicloud/openapi-core @darabonba/typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

## Client Initialization

```typescript
import Client from '@alicloud/rds20140815';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: 'rds.aliyuncs.com',
  regionId: 'cn-hangzhou',
});

const client = new Client(config);
```

## Available Endpoints

| Region | Endpoint |
|--------|----------|
| Default (all regions) | rds.aliyuncs.com |
| China (Hangzhou) | rds.cn-hangzhou.aliyuncs.com |
| China (Shanghai) | rds.cn-shanghai.aliyuncs.com |
| China (Beijing) | rds.cn-beijing.aliyuncs.com |
| Singapore | rds.ap-southeast-1.aliyuncs.com |
| US (Virginia) | rds.us-east-1.aliyuncs.com |

## Supported Database Engines

| Engine | Versions | Key Features |
|--------|----------|--------------|
| MySQL | 5.6, 5.7, 8.0 | Most popular, read-only instances, proxy |
| PostgreSQL | 10, 11, 12, 13, 14, 15, 16 | Extensions, major version upgrade, DuckDB |
| SQL Server | 2012, 2016, 2017, 2019, 2022 | RDS Custom, migration from on-premises |
| MariaDB | 10.3 | MySQL-compatible |

## API Calling Pattern

RDS uses RPC-style APIs with flat Request parameters:

```typescript
import * as models from '@alicloud/rds20140815/dist/models';

const { body } = await client.describeDBInstances(new models.DescribeDBInstancesRequest({
  regionId: 'cn-hangzhou',
  pageSize: 100,
  pageNumber: 1,
}));
```

## Pagination

Most Describe APIs use `pageNumber` + `pageSize`:

```typescript
let pageNumber = 1;
const pageSize = 100;
let allInstances: any[] = [];

while (true) {
  const { body } = await client.describeDBInstances(new models.DescribeDBInstancesRequest({
    regionId: 'cn-hangzhou',
    pageSize,
    pageNumber,
  }));
  allInstances.push(...(body.items?.DBInstance || []));
  if (allInstances.length >= (body.totalRecordCount || 0)) break;
  pageNumber++;
}
```

## Instance Charge Types

| Type | Value | Description |
|------|-------|-------------|
| Pay-As-You-Go | `Postpaid` | Billed by hour |
| Subscription | `Prepaid` | Monthly/yearly subscription |
| Serverless | `Serverless` | Auto-scaling, pay per use |

## Instance Categories

| Category | Value | Description |
|----------|-------|-------------|
| Basic | `Basic` | Single node, cost-effective |
| High Availability | `HighAvailability` | Primary + standby |
| Cluster | `cluster` | Multi-node cluster |
| AlwaysOn | `AlwaysOn` | SQL Server AlwaysOn |
| Finance | `Finance` | Three-node enterprise |

## Error Handling

```typescript
try {
  await client.createDBInstance(request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Async Operations

Many RDS operations are asynchronous. Poll instance status after creation:

```typescript
while (true) {
  const { body } = await client.describeDBInstanceAttribute(
    new models.DescribeDBInstanceAttributeRequest({ DBInstanceId: instanceId })
  );
  const status = body.items?.DBInstanceAttribute?.[0]?.DBInstanceStatus;
  if (status === 'Running') break;
  await new Promise(r => setTimeout(r, 10000));
}
```

## Common Instance Status Values

| Status | Description |
|--------|-------------|
| `Creating` | Instance is being created |
| `Running` | Instance is running normally |
| `Deleting` | Instance is being deleted |
| `Rebooting` | Instance is restarting |
| `DBInstanceClassChanging` | Specification is being changed |
| `NetAddressCreating` | Network address is being created |
| `TRANSING` | Instance is being migrated |
| `TempDBInstanceCreating` | Temporary instance is being created |
