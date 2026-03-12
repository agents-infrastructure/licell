import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  deleteCacheInstanceMock,
  executeWithAuthRecoveryMock,
  listCacheClassesMock,
  provisionRedisMock,
  selectPromptMock,
  showOutroMock,
  spinnerStopMock
} = vi.hoisted(() => ({
  deleteCacheInstanceMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listCacheClassesMock: vi.fn(),
  provisionRedisMock: vi.fn(),
  selectPromptMock: vi.fn(),
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
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'cache rm', 'r-demo', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteCacheInstanceMock).toHaveBeenCalledWith('r-demo');
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('实例 r-demo 已删除'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });
});
