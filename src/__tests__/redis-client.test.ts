import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createdConfigs } = vi.hoisted(() => ({
  createdConfigs: [] as Array<Record<string, unknown>>
}));

vi.mock('@alicloud/r-kvstore20150101', () => ({
  default: class MockRedisClient {}
}));

vi.mock('@alicloud/openapi-client', () => ({
  default: class MockRpcClient {},
  Config: class MockOpenApiConfig {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
      createdConfigs.push(input);
    }
  },
  Params: class Params {},
  OpenApiRequest: class OpenApiRequest {}
}));

vi.mock('../utils/sdk', () => ({ resolveSdkCtor: (ctor: unknown) => ctor }));

import { createRedisClient } from '../providers/redis/client';
import { Config } from '../utils/config';
import { runWithInvocationRegion } from '../utils/region-context';

describe('Redis client region routing', () => {
  beforeEach(() => {
    createdConfigs.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the effective auth region in SDK config', () => {
    createRedisClient({
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-shanghai'
    });

    expect(createdConfigs.at(-1)).toMatchObject({
      regionId: 'cn-shanghai',
      endpoint: 'r-kvstore.aliyuncs.com'
    });
  });

  it('propagates an invocation override through requireAuth into the SDK config', () => {
    vi.spyOn(Config, 'getAuth').mockReturnValue({
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    });

    runWithInvocationRegion({ scope: 'binding', regionId: 'cn-shanghai' }, () => {
      createRedisClient(Config.requireAuth());
    });

    expect(createdConfigs.at(-1)).toMatchObject({
      regionId: 'cn-shanghai',
      endpoint: 'r-kvstore.aliyuncs.com'
    });
  });
});
