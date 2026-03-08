import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  ensureDestructiveActionConfirmedMock,
  executeWithAuthRecoveryMock,
  removeFnCustomDomainMock,
  removeMatchingCnameRecordsMock
} = vi.hoisted(() => ({
  ensureDestructiveActionConfirmedMock: vi.fn(async () => {}),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  removeFnCustomDomainMock: vi.fn(),
  removeMatchingCnameRecordsMock: vi.fn()
}));

vi.mock('../providers/fc', () => ({
  bindFnCustomDomain: vi.fn(),
  getFnCustomDomain: vi.fn(),
  listFnCustomDomains: vi.fn(),
  removeFnCustomDomain: removeFnCustomDomainMock,
  resolveDefaultFcGatewayDomain: vi.fn(() => 'demo.cn-hangzhou.fcapp.run')
}));

vi.mock('../providers/dns', () => ({
  ensureDomainCname: vi.fn(),
  removeMatchingCnameRecords: removeMatchingCnameRecordsMock
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: vi.fn(() => ({ appName: 'demo-app' }))
  }
}));

vi.mock('../utils/cli-shared', () => ({
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
  ensureAuthOrExit: vi.fn(),
  ensureDestructiveActionConfirmed: ensureDestructiveActionConfirmedMock,
  isInteractiveTTY: vi.fn(() => false),
  parseListLimit: (_input: unknown, fallback: number) => fallback,
  showOutro: vi.fn(),
  toOptionalString: (value: unknown) => value == null ? undefined : String(value).trim() || undefined,
  toPromptValue: (value: unknown) => String(value).trim(),
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

async function createCli() {
  const cli = cac('licell');
  const { registerFnDomainCommands } = await import('../commands/fn-domain');
  registerFnDomainCommands(cli);
  return cli;
}

describe('fn domain commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    ensureDestructiveActionConfirmedMock.mockClear();
    removeFnCustomDomainMock.mockReset();
    removeMatchingCnameRecordsMock.mockReset();
    removeFnCustomDomainMock.mockResolvedValue(true);
    removeMatchingCnameRecordsMock.mockResolvedValue(['rec-1']);
  });

  it('maps `fn domain unbind --cleanup-dns --yes` to provider cleanup calls', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'fn domain unbind',
      'api.example.com',
      '--cleanup-dns',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(removeFnCustomDomainMock).toHaveBeenCalledTimes(1);
    expect(removeFnCustomDomainMock).toHaveBeenCalledWith('api.example.com');
    expect(executeWithAuthRecoveryMock).toHaveBeenCalledTimes(1);
    expect(executeWithAuthRecoveryMock.mock.calls[0][0]).toMatchObject({
      requiredCapabilities: ['fc', 'dns']
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });
});
