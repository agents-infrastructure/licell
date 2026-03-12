import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createRedisClientMock,
  ensureDefaultNetworkMock,
  resolveProvidedNetworkMock,
  getProjectMock,
  setProjectMock,
  ensureKvstoreServiceLinkedRoleMock,
  listTairKVCacheInstancesMock,
  sleepMock,
  tryApplySecurityIpsMock,
  tryCreateInferInstanceMock
} = vi.hoisted(() => ({
  createRedisClientMock: vi.fn(),
  ensureDefaultNetworkMock: vi.fn(),
  resolveProvidedNetworkMock: vi.fn(),
  getProjectMock: vi.fn(),
  setProjectMock: vi.fn(),
  ensureKvstoreServiceLinkedRoleMock: vi.fn(),
  listTairKVCacheInstancesMock: vi.fn(),
  sleepMock: vi.fn(async () => {}),
  tryApplySecurityIpsMock: vi.fn(),
  tryCreateInferInstanceMock: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({
      accountId: '1494123412341234',
      ak: 'test-ak',
      sk: 'test-sk',
      region: 'cn-hangzhou'
    }),
    getProject: getProjectMock,
    setProject: setProjectMock
  }
}));

vi.mock('../utils/crypto', () => ({
  randomStrongPassword: () => 'StrongPassword123!'
}));

vi.mock('../utils/runtime', () => ({
  sleep: sleepMock
}));

vi.mock('../providers/vpc', () => ({
  ensureDefaultNetwork: ensureDefaultNetworkMock,
  resolveProvidedNetwork: resolveProvidedNetworkMock
}));

vi.mock('../providers/redis/client', () => ({
  createRedisClient: createRedisClientMock
}));

vi.mock('../providers/redis/internals', () => ({
  formatInferCreateErrorWithCode: vi.fn(() => 'fallback'),
  ensureKvstoreServiceLinkedRole: ensureKvstoreServiceLinkedRoleMock,
  listTairKVCacheInstances: listTairKVCacheInstancesMock,
  resolveRedisAccountName: vi.fn(),
  resolveTairKVCacheEndpoint: vi.fn(),
  selectVkName: vi.fn(),
  tryApplySecurityIps: tryApplySecurityIpsMock,
  tryCreateInferInstance: tryCreateInferInstanceMock,
  tryResetPasswordWithAccount: vi.fn(),
  tryResetPasswordWithCustomApi: vi.fn()
}));

import { provisionRedis } from '../providers/redis/provision';

describe('cache provider network zone selection', () => {
  const describeAvailableResourceMock = vi.fn();
  const createInstanceMock = vi.fn();
  const describeInstanceAttributeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    getProjectMock.mockReturnValue({
      appName: 'demo-app',
      envs: {},
      cache: undefined,
      network: undefined
    });

    createRedisClientMock.mockReturnValue({
      describeAvailableResource: describeAvailableResourceMock,
      createInstance: createInstanceMock,
      describeInstanceAttribute: describeInstanceAttributeMock
    });

    ensureDefaultNetworkMock.mockResolvedValue({
      vpcId: 'vpc-123',
      vswId: 'vsw-123',
      sgId: 'sg-123',
      cidrBlock: '10.0.0.0/8',
      zoneId: 'cn-hangzhou-e'
    });

    resolveProvidedNetworkMock.mockResolvedValue({
      vpcId: 'vpc-custom',
      vswId: 'vsw-custom',
      sgId: 'sg-custom',
      cidrBlock: '10.1.0.0/16',
      zoneId: 'cn-hangzhou-h'
    });

    ensureKvstoreServiceLinkedRoleMock.mockResolvedValue(undefined);
    tryApplySecurityIpsMock.mockResolvedValue(undefined);
    tryCreateInferInstanceMock.mockResolvedValue({
      instanceId: 'tk-created',
      host: 'cache.internal',
      port: 6379,
      accountName: 'default',
      password: 'StrongPassword123!',
      redisUrl: 'redis://default:StrongPassword123!@cache.internal:6379'
    });
    createInstanceMock.mockResolvedValue({
      body: {
        instanceId: 'r-created',
        connectionDomain: 'classic.internal',
        port: 6379
      }
    });
    describeInstanceAttributeMock.mockResolvedValue({
      body: {
        instances: {
          DBInstanceAttribute: [
            {
              instanceStatus: 'Normal',
              connectionDomain: 'classic.internal',
              port: 6379
            }
          ]
        }
      }
    });
  });

  it('defaults to classic mode for new cache creation', async () => {
    listTairKVCacheInstancesMock.mockResolvedValue([
      { instanceId: 'tk-demo-1', zoneId: 'cn-hangzhou-e', instanceStatus: 'Normal' }
    ]);
    describeAvailableResourceMock.mockResolvedValue({
      body: {
        availableZones: {
          availableZone: [
            { zoneId: 'cn-hangzhou-b' },
            { zoneId: 'cn-hangzhou-e' }
          ]
        }
      }
    });

    const spinner = { message: vi.fn() };
    const result = await provisionRedis(spinner as never, {});

    expect(ensureDefaultNetworkMock).toHaveBeenCalledWith({
      preferredZoneIds: ['cn-hangzhou-e', 'cn-hangzhou-b']
    });
    expect(createInstanceMock).toHaveBeenCalledTimes(1);
    expect(tryCreateInferInstanceMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: 'classic-redis',
      instanceId: 'r-created'
    });
  });

  it('prefers observed serverless zones before classic available zones for explicit serverless mode', async () => {
    listTairKVCacheInstancesMock.mockResolvedValue([
      { instanceId: 'tk-demo-1', zoneId: 'cn-hangzhou-e', instanceStatus: 'Normal' },
      { instanceId: 'tk-demo-2', zoneId: 'cn-hangzhou-b', instanceStatus: 'Released' }
    ]);
    describeAvailableResourceMock.mockResolvedValue({
      body: {
        availableZones: {
          availableZone: [
            { zoneId: 'cn-hangzhou-b' },
            { zoneId: 'cn-hangzhou-e' },
            { zoneId: 'cn-hangzhou-f' }
          ]
        }
      }
    });

    const spinner = { message: vi.fn() };
    const result = await provisionRedis(spinner as never, { mode: 'serverless' });

    expect(ensureDefaultNetworkMock).toHaveBeenCalledWith({
      preferredZoneIds: ['cn-hangzhou-e', 'cn-hangzhou-b', 'cn-hangzhou-f']
    });
    expect(result).toMatchObject({
      mode: 'tair-serverless-kv',
      instanceId: 'tk-created'
    });
    expect(tryApplySecurityIpsMock).toHaveBeenCalledWith(
      expect.anything(),
      'tk-created',
      '10.0.0.0/8',
      spinner
    );
  });

  it('falls back to default network probing when cache zones cannot be discovered', async () => {
    listTairKVCacheInstancesMock.mockRejectedValue(new Error('infer unavailable'));
    describeAvailableResourceMock.mockRejectedValue(new Error('classic unavailable'));

    const spinner = { message: vi.fn() };
    await provisionRedis(spinner as never, { mode: 'classic' });

    expect(ensureDefaultNetworkMock).toHaveBeenCalledWith({
      preferredZoneIds: undefined
    });
  });

  it('fails explicitly in serverless mode instead of auto-falling back to classic', async () => {
    listTairKVCacheInstancesMock.mockResolvedValue([]);
    describeAvailableResourceMock.mockResolvedValue({
      body: {
        availableZones: {
          availableZone: [{ zoneId: 'cn-hangzhou-b' }]
        }
      }
    });
    tryCreateInferInstanceMock.mockRejectedValue(new Error('CreateTairKVCacheInferInstance failed'));

    const spinner = { message: vi.fn() };

    await expect(provisionRedis(spinner as never, { mode: 'serverless' }))
      .rejects
      .toThrow('serverless 模式创建失败');
    expect(createInstanceMock).not.toHaveBeenCalled();
  });
});
