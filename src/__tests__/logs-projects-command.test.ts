import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, executeWithAuthRecoveryMock, listSlsProjectsMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listSlsProjectsMock: vi.fn()
}));

vi.mock('../providers/sls-query', () => ({ listSlsProjects: listSlsProjectsMock }));
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

describe('SLS project commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listSlsProjectsMock.mockReset().mockResolvedValue({
      stage: 'logs.projects', count: 0, totalCount: 0, limit: 20, truncated: false, filters: {}, projects: []
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps project inventory filters to the protocol-backed provider', async () => {
    const cli = cac('licell');
    const { registerLogsCommand } = await import('../commands/logs');
    registerLogsCommand(cli);
    await cli.parse(['node', 'src/cli.ts', 'logs projects', '--region', 'cn-shanghai', '--project', 'app-logs', '--resource-group', 'rg-1', '--fetch-quota', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(
      expect.objectContaining({ commandLabel: 'licell logs projects' }),
      expect.any(Function)
    );
    expect(listSlsProjectsMock).toHaveBeenCalledWith({
      regionId: 'cn-shanghai', projectName: 'app-logs', resourceGroupId: 'rg-1', fetchQuota: true, limit: 20
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'logs.projects' }));
  }, 20_000);
});
