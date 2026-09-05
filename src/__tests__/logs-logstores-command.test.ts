import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, executeWithAuthRecoveryMock, listSlsLogstoresMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listSlsLogstoresMock: vi.fn()
}));

vi.mock('../providers/sls-query', () => ({ listSlsLogstores: listSlsLogstoresMock }));
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

describe('SLS logstore commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listSlsLogstoresMock.mockReset().mockResolvedValue({
      stage: 'logs.logstores', project: 'app-logs', count: 0, totalCount: 0, limit: 20, truncated: false, filters: {}, logstores: []
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps the required project and logstore filters to the provider', async () => {
    const cli = cac('licell');
    const { registerLogsCommand } = await import('../commands/logs');
    registerLogsCommand(cli);
    await cli.parse(['node', 'src/cli.ts', 'logs logstores', 'app-logs', '--region', 'cn-shanghai', '--name', 'app', '--mode', 'standard', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(
      expect.objectContaining({ commandLabel: 'licell logs logstores' }),
      expect.any(Function)
    );
    expect(listSlsLogstoresMock).toHaveBeenCalledWith({
      regionId: 'cn-shanghai', project: 'app-logs', logstoreName: 'app', mode: 'standard', telemetryType: undefined, limit: 20
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'logs.logstores' }));
  }, 20_000);
});
