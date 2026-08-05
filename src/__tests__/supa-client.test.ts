import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authState, createdConfigs } = vi.hoisted(() => ({
  authState: { region: 'cn-hangzhou' },
  createdConfigs: [] as Array<Record<string, unknown>>
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({
      accountId: '1494123412341234',
      ak: 'test-ak',
      sk: 'test-sk',
      region: authState.region
    })
  }
}));

vi.mock('@alicloud/rdsai20250507', () => ({
  default: class MockRdsAiClient {}
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
      createdConfigs.push(input);
    }
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: (ctor: unknown) => ctor
}));

import { createRdsAiClient } from '../providers/supabase/client';

describe('RDS AI client region routing', () => {
  beforeEach(() => {
    createdConfigs.length = 0;
  });

  it.each([
    ['cn-beijing', 'rdsai.aliyuncs.com'],
    ['cn-wulanchabu', 'rdsai.aliyuncs.com'],
    ['cn-hangzhou', 'rdsai.aliyuncs.com'],
    ['cn-shanghai', 'rdsai.aliyuncs.com'],
    ['cn-shenzhen', 'rdsai.aliyuncs.com'],
    ['cn-guangzhou', 'rdsai.aliyuncs.com'],
    ['cn-chengdu', 'rdsai.cn-chengdu.aliyuncs.com'],
    ['cn-hongkong', 'rdsai.cn-hongkong.aliyuncs.com'],
    ['ap-northeast-1', 'rdsai.ap-northeast-1.aliyuncs.com'],
    ['ap-southeast-1', 'rdsai.ap-southeast-1.aliyuncs.com'],
    ['ap-southeast-3', 'rdsai.ap-southeast-3.aliyuncs.com'],
    ['ap-southeast-5', 'rdsai.ap-southeast-5.aliyuncs.com'],
    ['eu-central-1', 'rdsai.eu-central-1.aliyuncs.com'],
    ['us-west-1', 'rdsai.us-west-1.aliyuncs.com'],
    ['moon-1', 'rdsai.aliyuncs.com']
  ])('keeps %s in client config and resolves endpoint %s', (regionId, endpoint) => {
    authState.region = regionId;

    createRdsAiClient();

    expect(createdConfigs.at(-1)).toMatchObject({
      regionId,
      endpoint
    });
  });
});
