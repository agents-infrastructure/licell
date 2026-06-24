import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockDoROARequest } = vi.hoisted(() => ({
  mockDoROARequest: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: vi.fn(() => ({
      accountId: '123456',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    }))
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: () => class MockCrClient {
    doROARequest = mockDoROARequest;
  }
}));

import { getDockerLoginCredentials, setAcrRetrySleepForTest, type AcrInfo } from '../providers/cr';

describe('ACR retry behavior', () => {
  const personalAcr: AcrInfo = {
    instanceId: null,
    registryEndpoint: 'registry.cn-hangzhou.aliyuncs.com',
    vpcRegistryEndpoint: 'registry-vpc.cn-hangzhou.aliyuncs.com',
    namespace: 'licell',
    repoName: 'demo'
  };

  afterEach(() => {
    vi.clearAllMocks();
    setAcrRetrySleepForTest(null);
  });

  it('retries transient personal ACR token errors', async () => {
    const sleeps: number[] = [];
    setAcrRetrySleepForTest(async (ms) => { sleeps.push(ms); });
    mockDoROARequest
      .mockRejectedValueOnce(new Error('socket hang upGET https://cr.cn-hangzhou.aliyuncs.com/tokens failed.'))
      .mockResolvedValueOnce({
        body: {
          data: {
            tempUserName: 'temp-user',
            authorizationToken: 'temp-token'
          }
        }
      });

    await expect(getDockerLoginCredentials(personalAcr)).resolves.toEqual({
      endpoint: 'registry.cn-hangzhou.aliyuncs.com',
      userName: 'temp-user',
      password: 'temp-token'
    });
    expect(mockDoROARequest).toHaveBeenCalledTimes(2);
    expect(sleeps).toHaveLength(1);
  });
});
