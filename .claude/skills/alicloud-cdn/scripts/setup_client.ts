/**
 * Alibaba Cloud CDN SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/cdn20180510 @alicloud/openapi-core @darabonba/typescript
 *
 * Environment variables required:
 *   ALIBABA_CLOUD_ACCESS_KEY_ID     - AccessKey ID
 *   ALIBABA_CLOUD_ACCESS_KEY_SECRET - AccessKey Secret
 *
 * Usage:
 *   import { createClient } from './setup_client';
 *   const client = createClient();
 */

import Client from '@alicloud/cdn20180510';
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
    endpoint: endpoint || 'cdn.aliyuncs.com',
  });

  return new Client(config);
}

// Example: List all CDN domains
async function main() {
  const client = createClient();
  const { DescribeUserDomainsRequest } = await import('@alicloud/cdn20180510/dist/models');
  const { body } = await client.describeUserDomains(
    new DescribeUserDomainsRequest({ pageSize: 50 })
  );
  console.log('Domains:', JSON.stringify(body.domains?.pageData, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
