import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  executeWithAuthRecoveryMock,
  getProjectMock,
  emitCommandResultMock,
  tailLogsMock
} = vi.hoisted(() => ({
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  emitCommandResultMock: vi.fn(),
  tailLogsMock: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock
  }
}));

vi.mock('../providers/fc', () => ({
  getFunctionInfo: vi.fn(),
  invokeFunction: vi.fn(),
  listFunctions: vi.fn(),
  removeFunction: vi.fn(),
  bindFnCustomDomain: vi.fn(),
  getFnCustomDomain: vi.fn(),
  listFnCustomDomains: vi.fn(),
  removeFnCustomDomain: vi.fn(),
  resolveDefaultFcGatewayDomain: vi.fn(() => '123.cn-hangzhou.fc.aliyuncs.com')
}));

vi.mock('../providers/dns', () => ({
  ensureDomainCname: vi.fn(),
  removeMatchingCnameRecords: vi.fn()
}));

vi.mock('../providers/logs', () => ({
  tailLogs: tailLogsMock
}));

vi.mock('../utils/cli-shared', () => ({
  ensureAuthOrExit: vi.fn(),
  ensureDestructiveActionConfirmed: vi.fn(),
  isInteractiveTTY: vi.fn(() => false),
  toOptionalString: (value: unknown) => value == null ? undefined : String(value).trim() || undefined,
  parseListLimit: vi.fn((_value, fallback) => fallback),
  parseOptionalPositiveInt: vi.fn(),
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
  showIntro: vi.fn(),
  showOutro: vi.fn(),
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerFnCommands } = await import('../commands/fn');
  registerFnCommands(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('fn commands component support', () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    getProjectMock.mockReturnValue({ appName: 'demo-api', envs: {} });
    tailLogsMock.mockReset();
    tailLogsMock.mockResolvedValue({ logs: ['line-1'], lines: ['line-1'] });
    emitCommandResultMock.mockReset();
  });

  it('uses component-scoped project lookup for fn logs', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'fn logs')(undefined, { component: 'api', once: true });

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'api' });
    expect(tailLogsMock).toHaveBeenCalledWith('demo-api', expect.objectContaining({ once: true }));
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'fn.logs',
      component: 'api',
      functionName: 'demo-api',
      count: 1
    }));
  });
});
