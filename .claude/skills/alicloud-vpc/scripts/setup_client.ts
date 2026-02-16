/**
 * Alibaba Cloud VPC SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/vpc20160428 @alicloud/openapi-core @darabonba/typescript
 *
 * Environment variables required:
 *   ALIBABA_CLOUD_ACCESS_KEY_ID     - AccessKey ID
 *   ALIBABA_CLOUD_ACCESS_KEY_SECRET - AccessKey Secret
 *
 * Usage:
 *   import { createClient } from './setup_client';
 *   const client = createClient('cn-hangzhou');
 */

import Client from '@alicloud/vpc20160428';
import { Config } from '@alicloud/openapi-core';

export function createClient(regionId: string = 'cn-hangzhou', endpoint?: string): Client {
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
    endpoint: endpoint || 'vpc.aliyuncs.com',
    regionId,
  });

  return new Client(config);
}

// Example: List all VPCs
async function main() {
  const client = createClient('cn-hangzhou');
  const { DescribeVpcsRequest } = await import('@alicloud/vpc20160428/dist/models');
  const { body } = await client.describeVpcs(
    new DescribeVpcsRequest({ regionId: 'cn-hangzhou', pageSize: 50 })
  );
  console.log('VPCs:', JSON.stringify(body.vpcs?.vpc, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
