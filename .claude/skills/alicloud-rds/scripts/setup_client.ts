/**
 * Alibaba Cloud RDS SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/rds20140815 @alicloud/openapi-core @darabonba/typescript
 *
 * Environment variables required:
 *   ALIBABA_CLOUD_ACCESS_KEY_ID     - AccessKey ID
 *   ALIBABA_CLOUD_ACCESS_KEY_SECRET - AccessKey Secret
 *
 * Usage:
 *   import { createClient } from './setup_client';
 *   const client = createClient('cn-hangzhou');
 */

import Client from '@alicloud/rds20140815';
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
    endpoint: endpoint || 'rds.aliyuncs.com',
  });

  return new Client(config);
}

// Example: List all RDS instances
async function main() {
  const client = createClient('cn-hangzhou');
  const { DescribeDBInstancesRequest } = await import('@alicloud/rds20140815/dist/models');
  const { body } = await client.describeDBInstances(
    new DescribeDBInstancesRequest({ regionId: 'cn-hangzhou', pageSize: 100 })
  );
  console.log('Instances:', JSON.stringify(body.items?.DBInstance, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
