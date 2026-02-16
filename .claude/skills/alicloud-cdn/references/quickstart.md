# Quick Start Guide

## Installation

```bash
npm install @alicloud/cdn20180510 @alicloud/openapi-core @darabonba/typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

## Client Initialization

```typescript
import Client from '@alicloud/cdn20180510';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: 'cdn.aliyuncs.com',
});

const client = new Client(config);
```

## Endpoint

CDN is a global service. Use the single endpoint `cdn.aliyuncs.com` for all operations. No `regionId` is required for most APIs.

## API Calling Pattern

CDN uses RPC-style APIs with flat Request parameters:

```typescript
import * as models from '@alicloud/cdn20180510/dist/models';

const { body } = await client.describeUserDomains(new models.DescribeUserDomainsRequest({
  pageSize: 50,
  pageNumber: 1,
}));
```

## Pagination

Most Describe APIs use `pageNumber` + `pageSize`:

```typescript
let pageNumber = 1;
const pageSize = 50;
let allDomains: any[] = [];

while (true) {
  const { body } = await client.describeUserDomains(new models.DescribeUserDomainsRequest({
    pageSize,
    pageNumber,
  }));
  allDomains.push(...(body.domains?.pageData || []));
  if (allDomains.length >= (body.totalCount || 0)) break;
  pageNumber++;
}
```

## Error Handling

```typescript
try {
  await client.addCdnDomain(request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## CDN Domain Types

| Type | cdnType Value | Description |
|------|---------------|-------------|
| Web | `web` | Images and small files |
| Download | `download` | Large file downloads |
| Video | `video` | Audio/video on demand |

## Source Types

| Type | sourceType Value | Description |
|------|------------------|-------------|
| IP | `ipaddr` | Origin server IP address |
| Domain | `domain` | Origin server domain name |
| OSS | `oss` | Alibaba Cloud OSS bucket |
| FC | `fc_domain` | Function Compute domain |

## Common Domain Configurations (Functions)

| Function Name | Description |
|---------------|-------------|
| `referer_white_list_set` | Referer whitelist |
| `referer_black_list_set` | Referer blacklist |
| `filetype_based_ttl_set` | Cache TTL by file type |
| `path_based_ttl_set` | Cache TTL by path |
| `ip_black_list_set` | IP blacklist |
| `ip_white_list_set` | IP whitelist |
| `https_force` | Force HTTPS redirect |
| `http_force` | Force HTTP redirect |
| `set_req_header` | Custom request header |
| `set_resp_header` | Custom response header |
| `gzip` | Gzip compression |
| `https_option` | HTTPS settings |
| `forward_scheme` | Origin protocol policy |
| `green_manager` | Content moderation |

Use `batchSetCdnDomainConfig` with `functions` JSON to set these configurations.

## Time Format

Most monitoring/statistics APIs accept time ranges in ISO 8601 format:

```
startTime: '2026-02-15T00:00:00Z'
endTime: '2026-02-16T00:00:00Z'
```

Data granularity depends on the time range:
- ≤ 3 days: 5-minute intervals
- 3-31 days: 1-hour intervals
- > 31 days: 1-day intervals
