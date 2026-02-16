/**
 * Alibaba Cloud OSS SDK Client Factory
 *
 * Usage:
 *   import { createOssClient } from './setup_client';
 *   const client = createOssClient('cn-hangzhou');
 */

import Client from '@alicloud/oss20190517';
import { Config } from '@alicloud/openapi-client';

export function createOssClient(regionId: string = 'cn-hangzhou'): Client {
  const config = new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId,
  });
  return new Client(config);
}

export function createOssClientWithSTS(
  regionId: string,
  securityToken: string,
): Client {
  const config = new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    securityToken,
    regionId,
  });
  return new Client(config);
}

export function createOssClientWithEndpoint(endpoint: string): Client {
  const config = new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    endpoint,
  });
  return new Client(config);
}
