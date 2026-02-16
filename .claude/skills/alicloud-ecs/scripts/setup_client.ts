/**
 * Alibaba Cloud ECS SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/ecs20140526 @alicloud/openapi-core @darabonba/typescript
 *
 * Environment variables required:
 *   ALIBABA_CLOUD_ACCESS_KEY_ID     - AccessKey ID
 *   ALIBABA_CLOUD_ACCESS_KEY_SECRET - AccessKey Secret
 *   ALIBABA_CLOUD_REGION_ID         - Region ID (e.g., cn-hangzhou)
 *
 * Usage:
 *   import { createClient } from './setup_client';
 *   const client = createClient();
 */

import Client from '@alicloud/ecs20140526';
import { Config } from '@alicloud/openapi-core';

export function createClient(regionId?: string): Client {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  const region = regionId || process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou';

  if (!accessKeyId || !accessKeySecret) {
    throw new Error(
      'Missing credentials. Set ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET.'
    );
  }

  const config = new Config({
    accessKeyId,
    accessKeySecret,
    regionId: region,
    endpoint: `ecs.${region}.aliyuncs.com`,
  });

  return new Client(config);
}

// Example: List all instances in the region
async function main() {
  const client = createClient();
  const { DescribeInstancesRequest } = await import('@alicloud/ecs20140526/dist/models');
  const { body } = await client.describeInstances(
    new DescribeInstancesRequest({
      regionId: process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou',
      pageSize: 100,
    })
  );
  console.log('Instances:', JSON.stringify(body.instances?.instance, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
