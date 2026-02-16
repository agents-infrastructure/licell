/**
 * Alibaba Cloud Function Compute (FC) 3.0 SDK Client Setup
 *
 * Prerequisites:
 *   npm install @alicloud/fc20230330 @alicloud/openapi-core @darabonba/typescript
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

import Client from '@alicloud/fc20230330';
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
    endpoint: `${region}.fc.aliyuncs.com`,
  });

  return new Client(config);
}

// Example: List all functions
async function main() {
  const client = createClient();
  const { body } = await client.listFunctions({ limit: 100 });
  console.log('Functions:', JSON.stringify(body.functions, null, 2));
}

if (require.main === module) {
  main().catch(console.error);
}
