import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createdConfigs } = vi.hoisted(() => ({
  createdConfigs: [] as Array<Record<string, unknown>>
}));

vi.mock('@alicloud/rds20140815', () => ({
  default: class MockRdsClient {}
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
      createdConfigs.push(input);
    }
  }
}));

vi.mock('../utils/sdk', () => ({ resolveSdkCtor: (ctor: unknown) => ctor }));

import { createRdsClient } from '../providers/infra/client';
import { Config } from '../utils/config';
import { runWithInvocationRegion } from '../utils/region-context';

describe('RDS client region routing', () => {
  beforeEach(() => {
    createdConfigs.length = 0;
    vi.spyOn(Config, 'getAuth').mockReturnValue({
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('propagates an invocation override through requireAuth into the SDK config', () => {
    runWithInvocationRegion({ scope: 'binding', regionId: 'cn-shanghai' }, () => {
      createRdsClient();
    });

    expect(createdConfigs.at(-1)).toMatchObject({
      regionId: 'cn-shanghai',
      endpoint: 'rds.cn-shanghai.aliyuncs.com'
    });
  });

  it('keeps an explicit factory region above the invocation context', () => {
    runWithInvocationRegion({ scope: 'binding', regionId: 'cn-shanghai' }, () => {
      createRdsClient('cn-beijing');
    });

    expect(createdConfigs.at(-1)).toMatchObject({
      regionId: 'cn-beijing',
      endpoint: 'rds.cn-beijing.aliyuncs.com'
    });
  });
});
