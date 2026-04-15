import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  executeWithAuthRecoveryMock,
  getProjectMock,
  emitCommandResultMock,
  listFunctionVersionsMock
} = vi.hoisted(() => ({
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  emitCommandResultMock: vi.fn(),
  listFunctionVersionsMock: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock
  }
}));

vi.mock('../utils/cli-shared', () => ({
  ensureAuthOrExit: vi.fn(),
  ensureDestructiveActionConfirmed: vi.fn(),
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
  showIntro: vi.fn(),
  showOutro: vi.fn(),
  requireAppName: (project: { appName?: string }) => {
    if (!project.appName) throw new Error('missing appName');
  },
  toOptionalString: (value: unknown) => value == null ? undefined : String(value).trim() || undefined,
  toPromptValue: (value: string) => value,
  isNoChangesPublishError: vi.fn(() => false),
  getLatestPublishedVersionId: vi.fn(),
  isInteractiveTTY: vi.fn(() => false),
  parseListLimit: vi.fn((_value, fallback) => fallback),
  parseOptionalPositiveInt: vi.fn(),
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

vi.mock('../providers/fc', () => ({
  publishFunctionVersion: vi.fn(),
  promoteFunctionAlias: vi.fn(),
  pruneFunctionVersions: vi.fn(),
  listFunctionVersions: listFunctionVersionsMock
}));

vi.mock('../workflows/preview', () => ({
  prunePreviewDomainsWorkflow: vi.fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerReleaseCommands } = await import('../commands/release');
  registerReleaseCommands(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('release commands component support', () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    getProjectMock.mockReturnValue({ appName: 'demo-api', envs: {} });
    listFunctionVersionsMock.mockReset();
    listFunctionVersionsMock.mockResolvedValue([{ versionId: '3' }]);
    emitCommandResultMock.mockReset();
  });

  it('uses component-scoped project lookup for release list', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'release list')({ component: 'api' });

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'api' });
    expect(listFunctionVersionsMock).toHaveBeenCalledWith('demo-api', 20);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      component: 'api',
      appName: 'demo-api',
      count: 1
    }));
  });
});
