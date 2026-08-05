import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getClassicInstanceByIdMock,
  project,
  redisClient,
  resolveRedisAccountNameMock,
  setProjectMock
} = vi.hoisted(() => ({
  getClassicInstanceByIdMock: vi.fn(),
  project: {
    envs: { KEEP_ME: '1' } as Record<string, string>,
    cache: {
      type: 'redis',
      instanceId: 'r-bound',
      host: 'bound.internal',
      port: 6379,
      accountName: 'bound-user',
      region: 'cn-shanghai'
    }
  },
  redisClient: {
    resetAccountPassword: vi.fn()
  },
  resolveRedisAccountNameMock: vi.fn(),
  setProjectMock: vi.fn()
}));

vi.mock('../utils/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/config')>()),
  Config: {
    requireAuth: () => ({ accountId: '123', ak: 'ak', sk: 'sk', region: 'cn-shanghai' }),
    getProject: () => project,
    setProject: setProjectMock
  }
}));

vi.mock('@alicloud/r-kvstore20150101', () => ({
  default: class MockRedisClient {},
  ResetAccountPasswordRequest: class ResetAccountPasswordRequest {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
    }
  }
}));

vi.mock('../providers/redis/client', () => ({
  createRedisClient: () => redisClient
}));

vi.mock('../providers/redis/internals', () => ({
  getClassicInstanceById: getClassicInstanceByIdMock,
  resolveRedisAccountName: resolveRedisAccountNameMock,
  resolveTairKVCacheEndpoint: vi.fn(),
  tryResetPasswordWithAccount: vi.fn(),
  tryResetPasswordWithCustomApi: vi.fn()
}));

vi.mock('../utils/crypto', () => ({ randomStrongPassword: () => 'StrongPassword123!' }));

import { rotateRedisPassword } from '../providers/redis/rotate';

describe('Redis password rotation binding safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    project.envs = { KEEP_ME: '1' };
    project.cache = {
      type: 'redis',
      instanceId: 'r-bound',
      host: 'bound.internal',
      port: 6379,
      accountName: 'bound-user',
      region: 'cn-shanghai'
    };
    redisClient.resetAccountPassword.mockResolvedValue({});
    resolveRedisAccountNameMock.mockResolvedValue('rotated-user');
  });

  it('fails before mutation when an explicit classic instance is absent from the effective region', async () => {
    getClassicInstanceByIdMock.mockResolvedValue(null);

    await expect(rotateRedisPassword({ message: vi.fn() } as never, 'r-other'))
      .rejects
      .toThrow('当前地域 cn-shanghai 未查询到 Redis 实例: r-other');

    expect(redisClient.resetAccountPassword).not.toHaveBeenCalled();
    expect(setProjectMock).not.toHaveBeenCalled();
  });

  it('does not replace the project binding when rotating a different verified instance', async () => {
    getClassicInstanceByIdMock.mockResolvedValue({
      instanceId: 'r-other',
      connectionDomain: 'other.internal',
      port: 6380
    });

    await expect(rotateRedisPassword({ message: vi.fn() } as never, 'r-other'))
      .resolves
      .toMatchObject({
        instanceId: 'r-other',
        redisUrl: expect.stringContaining('@other.internal:6380'),
        persisted: false
      });

    expect(resolveRedisAccountNameMock).toHaveBeenCalledWith(redisClient, 'r-other', undefined);
    expect(redisClient.resetAccountPassword).toHaveBeenCalledTimes(1);
    expect(setProjectMock).not.toHaveBeenCalled();
    expect(project.cache.instanceId).toBe('r-bound');
    expect(project.envs).toEqual({ KEEP_ME: '1' });
  });

  it('persists a verified region when rotating the bound instance', async () => {
    getClassicInstanceByIdMock.mockResolvedValue({
      instanceId: 'r-bound',
      connectionDomain: 'bound-new.internal',
      port: 6379
    });

    await expect(rotateRedisPassword({ message: vi.fn() } as never)).resolves.toMatchObject({
      instanceId: 'r-bound',
      persisted: true
    });

    expect(setProjectMock).toHaveBeenCalledWith(expect.objectContaining({
      cache: expect.objectContaining({
        instanceId: 'r-bound',
        host: 'bound-new.internal',
        region: 'cn-shanghai'
      })
    }));
  });
});
