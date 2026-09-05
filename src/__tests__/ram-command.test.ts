import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  emitCommandResultMock,
  executeWithAuthRecoveryMock,
  listRamUsersMock
} = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listRamUsersMock: vi.fn()
}));

vi.mock('../providers/ram-query', () => ({ listRamUsers: listRamUsersMock }));
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

async function createCli() {
  const cli = cac('licell');
  const { registerRamCommands } = await import('../commands/ram');
  registerRamCommands(cli);
  return cli;
}

describe('RAM readonly commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listRamUsersMock.mockReset().mockResolvedValue({ stage: 'ram.users', count: 0, limit: 20, truncated: false, users: [] });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps the limit option and emits the structured user result', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ram users', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(
      expect.objectContaining({ commandLabel: 'licell ram users' }),
      expect.any(Function)
    );
    expect(listRamUsersMock).toHaveBeenCalledWith({ limit: 20 });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'ram.users', users: [] }));
  });
});
