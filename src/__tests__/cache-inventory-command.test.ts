import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, listCacheBackupsMock, listCacheParametersMock, listCacheAccountsMock, listCacheTopologyMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  listCacheBackupsMock: vi.fn(),
  listCacheParametersMock: vi.fn(),
  listCacheAccountsMock: vi.fn(),
  listCacheTopologyMock: vi.fn()
}));

vi.mock('../providers/redis', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../providers/redis')>()),
  listCacheBackups: listCacheBackupsMock,
  listCacheParameters: listCacheParametersMock,
  listCacheAccounts: listCacheAccountsMock,
  listCacheTopology: listCacheTopologyMock
}));
vi.mock('../utils/auth-recovery', () => ({ executeWithAuthRecovery: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()) }));
vi.mock('../utils/cli-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/cli-shared')>()),
  ensureAuthOrExit: vi.fn(), isInteractiveTTY: vi.fn(() => false)
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/output')>()), emitCommandResult: emitCommandResultMock, isJsonOutput: vi.fn(() => true)
}));

describe('Redis/Tair inventory commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    listCacheBackupsMock.mockReset().mockResolvedValue({ instanceId: 'r-1', regionId: 'cn-shanghai', backups: [{ backupId: 1 }], policy: {}, truncated: false });
    listCacheParametersMock.mockReset().mockResolvedValue({ instanceId: 'r-1', regionId: 'cn-shanghai', source: 'DescribeParameters', running: [], configured: [], truncated: false });
    listCacheAccountsMock.mockReset().mockResolvedValue({ instanceId: 'r-1', regionId: 'cn-shanghai', accounts: [{ name: 'app' }], truncated: false });
    listCacheTopologyMock.mockReset().mockResolvedValue({ instanceId: 'r-1', regionId: 'cn-shanghai', count: 1, members: [{ name: 'r-1-db-0' }], truncated: false });
  });

  it.each([
    ['cache backups', ['r-1', '--days', '30', '--limit', '20'], listCacheBackupsMock, { days: 30, limit: 20 }, 'cache.backups'],
    ['cache parameters', ['r-1', '--node', 'r-1-db-0', '--prefix', 'max', '--limit', '20'], listCacheParametersMock, { nodeId: 'r-1-db-0', prefix: 'max', limit: 20 }, 'cache.parameters'],
    ['cache accounts', ['r-1', '--name', 'app', '--limit', '20'], listCacheAccountsMock, { name: 'app', limit: 20 }, 'cache.accounts'],
    ['cache topology', ['r-1', '--limit', '20'], listCacheTopologyMock, { limit: 20 }, 'cache.topology']
  ])('maps %s options to its provider', async (command, args, provider, expectedOptions, stage) => {
    const cli = cac('licell');
    const { registerCacheCommands } = await import('../commands/cache');
    registerCacheCommands(cli);
    await cli.parse(['node', 'src/cli.ts', command, ...args]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provider).toHaveBeenCalledWith('r-1', expectedOptions);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage, instanceId: 'r-1' }));
  }, 20_000);
});
