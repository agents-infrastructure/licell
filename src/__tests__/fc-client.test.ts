import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createdConfigs } = vi.hoisted(() => ({
  createdConfigs: [] as Array<Record<string, unknown>>
}));

vi.mock('@alicloud/fc20230330', () => ({
  default: class MockFcClient {}
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
      createdConfigs.push(input);
    }
  }
}));

import { createFcClient } from '../providers/fc/client';
import { Config } from '../utils/config';
import { runWithInvocationRegion } from '../utils/region-context';

describe('FC client region routing', () => {
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

  it('propagates a project invocation region through requireAuth into the FC endpoint', () => {
    runWithInvocationRegion({ scope: 'project', regionId: 'cn-shanghai' }, () => {
      createFcClient();
    });

    expect(createdConfigs.at(-1)).toMatchObject({
      endpoint: '123.cn-shanghai.fc.aliyuncs.com'
    });
  });
});
