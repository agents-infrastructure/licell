import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  configState,
  ensureEnvIgnoredMock,
  executeWithAuthRecoveryMock,
  getProjectMock,
  pullFunctionEnvsMock,
  setProjectMock,
  showOutroMock,
  spinnerStopMock,
  writeFileSyncMock
} = vi.hoisted(() => ({
  configState: {
    current: { appName: 'demo-app', envs: { KEEP_ME: '1' } as Record<string, string> }
  },
  ensureEnvIgnoredMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  pullFunctionEnvsMock: vi.fn(),
  setProjectMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn(),
  writeFileSyncMock: vi.fn()
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    writeFileSync: writeFileSyncMock
  };
});

vi.mock('../providers/fc', () => ({
  pullFunctionEnvs: pullFunctionEnvsMock,
  setFunctionEnv: vi.fn(),
  removeFunctionEnv: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock,
    setProject: setProjectMock
  }
}));

vi.mock('../utils/cli-shared', () => ({
  ensureAuthOrExit: vi.fn(),
  ensureDestructiveActionConfirmed: vi.fn(),
  createSpinner: () => ({
    start: vi.fn(),
    stop: spinnerStopMock,
    message: vi.fn()
  }),
  requireAppName: (project: { appName?: string }) => {
    if (!project.appName) throw new Error('missing appName');
  },
  isInteractiveTTY: vi.fn(() => false),
  showOutro: showOutroMock,
  toPromptValue: (value: string) => value,
  toOptionalString: (value: unknown) => value == null ? undefined : String(value).trim() || undefined,
  normalizeEnvKey: (value: string) => value.trim().toUpperCase(),
  ensureEnvIgnored: ensureEnvIgnoredMock,
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: vi.fn(),
  isJsonOutput: vi.fn(() => false)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerEnvCommands } = await import('../commands/env');
  registerEnvCommands(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('env pull command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    configState.current = { appName: 'demo-app', envs: { KEEP_ME: '1' } };
    executeWithAuthRecoveryMock.mockClear();
    ensureEnvIgnoredMock.mockReset();
    getProjectMock.mockReset();
    getProjectMock.mockImplementation(() => configState.current);
    pullFunctionEnvsMock.mockReset();
    pullFunctionEnvsMock.mockResolvedValue({ API_KEY: 'secret' });
    setProjectMock.mockReset();
    showOutroMock.mockReset();
    spinnerStopMock.mockReset();
    writeFileSyncMock.mockReset();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('syncs default function envs back into project config', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'env pull')({});

    expect(pullFunctionEnvsMock).toHaveBeenCalledWith('demo-app', undefined);
    expect(setProjectMock).toHaveBeenCalledWith({
      envs: {
        API_KEY: 'secret'
      }
    }, { replaceEnvs: true });
    expect(writeFileSyncMock).toHaveBeenCalledWith('.env', 'API_KEY=\"secret\"', { mode: 0o600 });
    expect(ensureEnvIgnoredMock).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite project config when pulling alias envs', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'env pull')({ target: 'preview' });

    expect(pullFunctionEnvsMock).toHaveBeenCalledWith('demo-app', 'preview');
    expect(setProjectMock).not.toHaveBeenCalled();
    expect(writeFileSyncMock).toHaveBeenCalledWith('.env', 'API_KEY=\"secret\"', { mode: 0o600 });
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('未覆盖项目配置'));
  });

  it('forwards component selection to config lookup and persistence', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'env pull')({ component: 'api' });

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'api' });
    expect(setProjectMock).toHaveBeenCalledWith({
      envs: {
        API_KEY: 'secret'
      }
    }, { replaceEnvs: true, component: 'api' });
  });
});
