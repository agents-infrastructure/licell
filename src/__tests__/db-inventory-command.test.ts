import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, listDatabaseBackupsMock, listDatabaseParametersMock, listDatabaseAccountsMock, listDatabasesMock, planDatabaseRestoreMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  listDatabaseBackupsMock: vi.fn(),
  listDatabaseParametersMock: vi.fn(),
  listDatabaseAccountsMock: vi.fn(),
  listDatabasesMock: vi.fn(),
  planDatabaseRestoreMock: vi.fn()
}));

vi.mock('../providers/infra', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../providers/infra')>()),
  listDatabaseBackups: listDatabaseBackupsMock,
  listDatabaseParameters: listDatabaseParametersMock,
  listDatabaseAccounts: listDatabaseAccountsMock,
  listDatabases: listDatabasesMock,
  planDatabaseRestore: planDatabaseRestoreMock
}));
vi.mock('../utils/auth-recovery', () => ({ executeWithAuthRecovery: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()) }));
vi.mock('../utils/cli-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/cli-shared')>()),
  ensureAuthOrExit: vi.fn(), isInteractiveTTY: vi.fn(() => false)
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/output')>()), emitCommandResult: emitCommandResultMock, isJsonOutput: vi.fn(() => true)
}));

describe('RDS inventory commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    listDatabaseBackupsMock.mockReset().mockResolvedValue({ instanceId: 'rm-1', regionId: 'cn-shanghai', days: 30, limit: 20, totalCount: 1, truncated: false, policy: {}, backups: [{ backupId: 'b-1' }] });
    listDatabaseParametersMock.mockReset().mockResolvedValue({ instanceId: 'rm-1', regionId: 'cn-shanghai', engine: 'MySQL', parameterGroup: null, limit: 20, truncated: false, running: [{ name: 'max_connections', value: '100' }], configured: [] });
    listDatabaseAccountsMock.mockReset().mockResolvedValue({ instanceId: 'rm-1', regionId: 'cn-shanghai', limit: 20, totalCount: 1, truncated: false, accounts: [{ name: 'app' }] });
    listDatabasesMock.mockReset().mockResolvedValue({ instanceId: 'rm-1', regionId: 'cn-shanghai', limit: 20, totalCount: 1, truncated: false, databases: [{ name: 'appdb' }] });
    planDatabaseRestoreMock.mockReset().mockResolvedValue({ instanceId: 'rm-1', regionId: 'cn-shanghai', mode: 'backup-set', source: { instanceId: 'rm-1' }, availability: { backupCount: 1, pitr: { available: true } }, validation: { valid: true, blockers: [], warnings: [] }, execution: { performed: false } });
  });

  it.each([
    ['db backups', ['rm-1', '--days', '30', '--limit', '20'], listDatabaseBackupsMock, { days: 30, status: undefined, limit: 20 }, 'db.backups'],
    ['db parameters', ['rm-1', '--prefix', 'max_', '--limit', '20'], listDatabaseParametersMock, { prefix: 'max_', limit: 20 }, 'db.parameters'],
    ['db accounts', ['rm-1', '--name', 'app', '--limit', '20'], listDatabaseAccountsMock, { name: 'app', limit: 20 }, 'db.accounts'],
    ['db databases', ['rm-1', '--name', 'appdb', '--status', 'Running', '--limit', '20'], listDatabasesMock, { name: 'appdb', status: 'Running', limit: 20 }, 'db.databases']
  ])('maps %s options to its provider', async (command, args, provider, expectedOptions, stage) => {
    const cli = cac('licell');
    const { registerDbCommands } = await import('../commands/db');
    registerDbCommands(cli);
    await cli.parse(['node', 'src/cli.ts', command, ...args]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provider).toHaveBeenCalledWith('rm-1', expectedOptions);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage, instanceId: 'rm-1' }));
  }, 20_000);

  it('maps restore plan inputs without executing a mutation', async () => {
    const cli = cac('licell');
    const { registerDbCommands } = await import('../commands/db');
    registerDbCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'db restore plan', 'rm-1', '--backup-id', 'b-1', '--pay-type', 'Postpaid', '--days', '60']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(planDatabaseRestoreMock).toHaveBeenCalledWith('rm-1', {
      backupId: 'b-1', restoreTime: undefined, payType: 'Postpaid', days: 60
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'db.restore.plan', instanceId: 'rm-1' }));
  }, 20_000);
});
