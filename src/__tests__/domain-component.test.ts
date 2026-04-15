import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  executeWithAuthRecoveryMock,
  getProjectMock,
  emitCommandResultMock,
  bindAppDomainWorkflowMock
} = vi.hoisted(() => ({
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  emitCommandResultMock: vi.fn(),
  bindAppDomainWorkflowMock: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock
  }
}));

vi.mock('../workflows/domain', () => ({
  bindAppDomainWorkflow: bindAppDomainWorkflowMock,
  unbindAppDomainWorkflow: vi.fn(),
  bindStaticDomainWorkflow: vi.fn(),
  unbindStaticDomainWorkflow: vi.fn()
}));

vi.mock('../utils/cli-shared', () => ({
  ensureAuthOrExit: vi.fn(),
  ensureDestructiveActionConfirmed: vi.fn(),
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
  isInteractiveTTY: vi.fn(() => false),
  requireAppName: (project: { appName?: string }) => {
    if (!project.appName) throw new Error('missing appName');
  },
  showIntro: vi.fn(),
  showOutro: vi.fn(),
  toOptionalString: (value: unknown) => value == null ? undefined : String(value).trim() || undefined,
  toPromptValue: (value: string) => value,
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

vi.mock('../utils/cli-helpers', () => ({
  normalizeReleaseTarget: (value?: string) => value?.trim().toLowerCase() || 'prod'
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerDomainAppCommands } = await import('../commands/domain-app');
  registerDomainAppCommands(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('domain app component support', () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    getProjectMock.mockReturnValue({ appName: 'demo-api', envs: {} });
    bindAppDomainWorkflowMock.mockReset();
    bindAppDomainWorkflowMock.mockResolvedValue({
      domainName: 'api.example.com',
      releaseTarget: 'prod',
      aliasEnsured: true,
      aliasVersionId: '3',
      httpsConfigured: true,
      finalUrl: 'https://api.example.com'
    });
    emitCommandResultMock.mockReset();
  });

  it('uses component-scoped appName for domain app bind', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'domain app bind')('api.example.com', { component: 'api', target: 'prod', ssl: true });

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'api' });
    expect(bindAppDomainWorkflowMock).toHaveBeenCalledWith('api.example.com', expect.objectContaining({
      functionName: 'demo-api',
      releaseTarget: 'prod',
      enableHttps: true
    }));
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      workflow: 'app',
      component: 'api',
      functionName: 'demo-api',
      domain: 'api.example.com'
    }));
  });
});
