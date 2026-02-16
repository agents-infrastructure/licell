/**
 * Alibaba Cloud Redis (R-KVStore) SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/r-kvstore20150101 @alicloud/openapi-core @darabonba/typescript
 *
 * Environment variables required:
 *   ALIBABA_CLOUD_ACCESS_KEY_ID     - AccessKey ID
 *   ALIBABA_CLOUD_ACCESS_KEY_SECRET - AccessKey Secret
 *
 * Usage:
 *   import { createClient } from './setup_client';
 *   const client = createClient('cn-hangzhou');
 */

import Client from '@alicloud/r-kvstore20150101';
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
    regionId,
    endpoint: endpoint || 'r-kvstore.aliyuncs.com',
  });

  return new Client(config);
}

// Example: List all Redis instances
async function main() {
  const client = createClient('cn-hangzhou');
  const { DescribeInstancesRequest } = await import('@alicloud/r-kvstore20150101/dist/models');
  const { body } = await client.describeInstances(
    new DescribeInstancesRequest({ regionId: 'cn-hangzhou', pageSize: 50 })
  );
  console.log('Instances:', JSON.stringify(body.instances?.KVStoreInstance, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
