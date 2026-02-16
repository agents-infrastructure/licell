# Quick Start Guide

## Installation

```bash
npm install @alicloud/alidns20150109 @alicloud/openapi-core @darabonba/typescript
```

## Authentication

Set environment variables before using the SDK:

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your-access-key-secret"
```

## Client Initialization

```typescript
import Client from '@alicloud/alidns20150109';
import { Config } from '@alicloud/openapi-core';

const config = new Config({
  accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
  endpoint: 'alidns.cn-hangzhou.aliyuncs.com',
});

const client = new Client(config);
```

## Available Endpoints

| Region | Endpoint |
|--------|----------|
| China (Hangzhou) | alidns.cn-hangzhou.aliyuncs.com |
| China (Shanghai) | alidns.cn-shanghai.aliyuncs.com |
| Singapore | alidns.ap-southeast-1.aliyuncs.com |
| Global (default) | alidns.aliyuncs.com |

Alidns is a global service. Most APIs do not require `regionId`. Use the default endpoint `alidns.aliyuncs.com` unless you need a specific region.

## API Calling Pattern

Alidns uses RPC-style APIs. Parameters are flat fields in a Request object:

```typescript
import * as models from '@alicloud/alidns20150109/dist/models';

const request = new models.DescribeDomainsRequest({
  pageNumber: 1,
  pageSize: 20,
});
const { body } = await client.describeDomains(request);
```

## Pagination

Most List/Describe APIs use `pageNumber` + `pageSize`:

```typescript
let pageNumber = 1;
const pageSize = 100;
let allDomains: any[] = [];

while (true) {
  const { body } = await client.describeDomains(new models.DescribeDomainsRequest({
    pageSize,
    pageNumber,
  }));
  allDomains.push(...(body.domains?.domain || []));
  if (allDomains.length >= (body.totalCount || 0)) break;
  pageNumber++;
}
```

## Error Handling

```typescript
try {
  await client.describeDomains(request);
} catch (error: any) {
  console.error(`Error Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Request ID: ${error.data?.RequestId}`);
}
```

## Common Record Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `A` | IPv4 address | `1.2.3.4` |
| `AAAA` | IPv6 address | `2001:db8::1` |
| `CNAME` | Canonical name | `cdn.example.com` |
| `MX` | Mail exchange | `mail.example.com` |
| `TXT` | Text record | `v=spf1 include:example.com ~all` |
| `NS` | Name server | `ns1.example.com` |
| `SRV` | Service locator | `0 5 5060 sip.example.com` |
| `CAA` | Certificate authority | `0 issue "letsencrypt.org"` |
| `REDIRECT_URL` | URL redirect (explicit) | `http://www.example.com` |
| `FORWARD_URL` | URL forward (implicit) | `http://www.example.com` |

## Common Line Values

| Line | Description |
|------|-------------|
| `default` | Default line |
| `telecom` | China Telecom |
| `unicom` | China Unicom |
| `mobile` | China Mobile |
| `edu` | Education network |
| `oversea` | Overseas |

Use `describeSupportLines` API to get the full list of supported lines.

## TTL Values

| TTL (seconds) | Description |
|----------------|-------------|
| 600 | 10 minutes (default) |
| 60 | 1 minute (minimum for paid plans) |
| 1 | 1 second (Enterprise Ultimate) |
| 3600 | 1 hour |
| 86400 | 1 day |
