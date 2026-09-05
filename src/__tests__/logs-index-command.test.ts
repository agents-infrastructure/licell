import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, executeWithAuthRecoveryMock, getSlsIndexMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getSlsIndexMock: vi.fn()
}));

vi.mock('../providers/sls-query', () => ({ getSlsIndex: getSlsIndexMock }));
vi.mock('../utils/auth-recovery', () => ({ executeWithAuthRecovery: executeWithAuthRecoveryMock }));
vi.mock('../utils/cli-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/cli-shared')>()),
  ensureAuthOrExit: vi.fn(),
  isInteractiveTTY: vi.fn(() => false)
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/output')>()),
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

describe('SLS index command', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    getSlsIndexMock.mockReset().mockResolvedValue({
      stage: 'logs.index', project: 'app-logs', logstore: 'access', index: { fields: [] }
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps project, logstore, and region to the index provider', async () => {
    const cli = cac('licell');
    const { registerLogsCommand } = await import('../commands/logs');
    registerLogsCommand(cli);
    await cli.parse(['node', 'src/cli.ts', 'logs index', 'app-logs', 'access', '--region', 'cn-shanghai']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getSlsIndexMock).toHaveBeenCalledWith({
      project: 'app-logs', logstore: 'access', regionId: 'cn-shanghai'
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'logs.index' }));
  }, 20_000);
});
