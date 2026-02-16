/**
 * Alibaba Cloud Alidns SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/alidns20150109 @alicloud/openapi-core @darabonba/typescript
 *
 * Environment variables required:
 *   ALIBABA_CLOUD_ACCESS_KEY_ID     - AccessKey ID
 *   ALIBABA_CLOUD_ACCESS_KEY_SECRET - AccessKey Secret
 *
 * Usage:
 *   import { createClient } from './setup_client';
 *   const client = createClient();
 */

import Client from '@alicloud/alidns20150109';
import { Config } from '@alicloud/openapi-core';

export function createClient(endpoint?: string): Client {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error(
      'Missing credentials. Set ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET.'
    );
  }

  const config = new Config({
    accessKeyId,
    accessKeySecret,
    endpoint: endpoint || 'alidns.cn-hangzhou.aliyuncs.com',
  });

  return new Client(config);
}

// Example: List all domains
async function main() {
  const client = createClient();
  const { DescribeDomainsRequest } = await import('@alicloud/alidns20150109/dist/models');
  const { body } = await client.describeDomains(
    new DescribeDomainsRequest({ pageSize: 100 })
  );
  console.log('Domains:', JSON.stringify(body.domains?.domain, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
