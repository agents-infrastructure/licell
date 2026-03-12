import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  configState,
  deleteCacheInstanceMock,
  executeWithAuthRecoveryMock,
  getProjectMock,
  listCacheClassesMock,
  provisionRedisMock,
  selectPromptMock,
  setProjectMock,
  showOutroMock,
  spinnerStopMock
} = vi.hoisted(() => ({
  configState: {
    current: { envs: {} as Record<string, string>, cache: undefined as unknown }
  },
  deleteCacheInstanceMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  listCacheClassesMock: vi.fn(),
  provisionRedisMock: vi.fn(),
  selectPromptMock: vi.fn(),
  setProjectMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  select: selectPromptMock
}));

vi.mock('../providers/redis', () => ({
  getCacheInstanceDetail: vi.fn(),
  listCacheClasses: listCacheClassesMock,
  listCacheInstances: vi.fn(),
  provisionRedis: provisionRedisMock,
  resolveCacheConnectInfo: vi.fn(),
  rotateRedisPassword: vi.fn(),
  deleteCacheInstance: deleteCacheInstanceMock,
  allocateCachePublicConnection: vi.fn(),
  applyCachePublicWhitelist: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock,
    setProject: setProjectMock
  }
}));

vi.mock('../utils/cli-shared', () => ({
  ensureAuthOrExit: vi.fn(),
  createSpinner: () => ({
    start: vi.fn(),
    stop: spinnerStopMock,
    message: vi.fn()
  }),
  isInteractiveTTY: vi.fn(() => false),
  showIntro: vi.fn(),
  showOutro: showOutroMock,
  toPromptValue: (value: unknown) => String(value),
  toOptionalString: (input: unknown) => {
    if (input == null) return undefined;
    const value = String(input).trim();
    return value.length > 0 ? value : undefined;
  },
  parseListLimit: (_input: unknown, fallback: number) => fallback,
  parseOptionalPositiveInt: (input: unknown) => input == null ? undefined : Number(input),
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: vi.fn(),
  isJsonOutput: vi.fn(() => false)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerCacheCommands } = await import('../commands/cache');
  registerCacheCommands(cli);
  return cli;
}

describe('cache commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    deleteCacheInstanceMock.mockReset();
    deleteCacheInstanceMock.mockResolvedValue(undefined);
    executeWithAuthRecoveryMock.mockClear();
    configState.current = { envs: {}, cache: undefined };
    getProjectMock.mockReset();
    getProjectMock.mockImplementation(() => configState.current);
    listCacheClassesMock.mockReset();
    listCacheClassesMock.mockResolvedValue({
      regionId: 'cn-hangzhou',
      serverless: {
        querySupported: false,
        defaultClass: 'kvcache.cu.g4b.2',
        observedClasses: [],
        notes: ['note-a']
      },
      classic: {
        zoneIds: ['cn-hangzhou-b'],
        classes: [
          {
            instanceClass: 'redis.master.small.default',
            zoneIds: ['cn-hangzhou-b'],
            source: 'available-resource',
            remark: '官网标准1G'
          }
        ]
      }
    });
    provisionRedisMock.mockReset();
    provisionRedisMock.mockResolvedValue({
      redisUrl: 'redis://default:secret@cache.example:6379',
      mode: 'classic-redis',
      instanceId: 'r-demo',
      instanceClass: 'redis.master.small.default'
    });
    selectPromptMock.mockClear();
    setProjectMock.mockReset();
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('defaults to classic mode without opening a prompt', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'cache add']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(selectPromptMock).not.toHaveBeenCalled();
    expect(provisionRedisMock).toHaveBeenCalledTimes(1);
    expect(provisionRedisMock.mock.calls[0]?.[1]).toMatchObject({
      mode: 'classic',
      instanceId: undefined,
      existingPassword: undefined,
      accountName: undefined,
      instanceClass: undefined
    });
  });

  it('passes explicit serverless mode through to provider', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'cache add', '--mode', 'serverless']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provisionRedisMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      mode: 'serverless'
    }));
  });

  it('supports querying cache classes', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'cache class', 'classic', '--limit', '10']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listCacheClassesMock).toHaveBeenCalledWith({ zoneId: undefined });
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('缓存规格已返回'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });

  it('stops spinner after successful deletion', async () => {
    configState.current = {
      envs: {
        REDIS_URL: 'redis://default:secret@cache.example:6379',
        REDIS_HOST: 'cache.example',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: 'secret',
        REDIS_USERNAME: 'default',
        KEEP_ME: '1'
      },
      cache: {
        type: 'redis',
        instanceId: 'r-demo',
        host: 'cache.example',
        port: 6379,
        accountName: 'default'
      }
    };
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'cache rm', 'r-demo', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteCacheInstanceMock).toHaveBeenCalledWith('r-demo');
    expect(setProjectMock).toHaveBeenCalledWith({
      cache: undefined,
      envs: {
        KEEP_ME: '1'
      }
    }, { replaceEnvs: true });
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('实例 r-demo 已删除'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });
});
