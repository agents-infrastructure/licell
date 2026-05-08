import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  ensureAuthReadyForCommandMock,
  ensureAuthCapabilityPreflightMock,
  tryRecoverAuthForErrorMock,
  detectAuthIssueMock,
  resolveDeployContextMock,
  executeStaticDeployMock,
  emitCommandResultMock,
  getFcApiRuntimeDeploySpecMock,
  runFcApiDeployPrecheckMock,
  getProjectMock,
  getWorkspaceMock,
  getAuthMock,
  emitCliErrorMock,
  setProjectMock,
  updateLicellComponentStateMock
} = vi.hoisted(() => ({
  ensureAuthReadyForCommandMock: vi.fn(async () => undefined),
  ensureAuthCapabilityPreflightMock: vi.fn(async () => undefined),
  tryRecoverAuthForErrorMock: vi.fn(async () => false),
  detectAuthIssueMock: vi.fn(() => 'unknown'),
  resolveDeployContextMock: vi.fn(),
  executeStaticDeployMock: vi.fn(),
  emitCommandResultMock: vi.fn(),
  getFcApiRuntimeDeploySpecMock: vi.fn(),
  runFcApiDeployPrecheckMock: vi.fn(),
  getProjectMock: vi.fn(),
  getWorkspaceMock: vi.fn(),
  getAuthMock: vi.fn(),
  emitCliErrorMock: vi.fn(),
  setProjectMock: vi.fn(),
  updateLicellComponentStateMock: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  ensureAuthReadyForCommand: ensureAuthReadyForCommandMock,
  ensureAuthCapabilityPreflight: ensureAuthCapabilityPreflightMock,
  tryRecoverAuthForError: tryRecoverAuthForErrorMock,
  detectAuthIssue: detectAuthIssueMock
}));

vi.mock('../commands/deploy-context', () => ({
  resolveDeployContext: resolveDeployContextMock
}));

vi.mock('../commands/deploy-static', () => ({
  executeStaticDeploy: executeStaticDeployMock
}));

vi.mock('../commands/deploy-api', () => ({
  executeApiDeploy: vi.fn()
}));

vi.mock('../commands/deploy-task', () => ({
  executeTaskDeploy: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock,
    getWorkspace: getWorkspaceMock,
    getAuth: getAuthMock,
    setProject: setProjectMock
  }
}));

vi.mock('../utils/deploy-config', () => ({
  buildDeployProjectPatch: vi.fn(() => ({}))
}));

vi.mock('../utils/deploy-state', () => ({
  buildDeployStatePatch: vi.fn(() => ({}))
}));

vi.mock('../utils/project-state', () => ({
  updateLicellComponentState: updateLicellComponentStateMock
}));

vi.mock('../utils/hooks', () => ({
  runHook: vi.fn()
}));

vi.mock('../providers/fc', () => ({
  DEFAULT_FC_RUNTIME: 'nodejs22',
  getFcApiDeploySpecDocument: vi.fn(),
  getFcApiRuntimeDeploySpec: getFcApiRuntimeDeploySpecMock,
  runFcApiDeployPrecheck: runFcApiDeployPrecheckMock
}));

vi.mock('../utils/deploy-plan', () => ({
  buildDeployPlan: vi.fn(),
  getDeployPlanSnapshot: vi.fn()
}));

vi.mock('../utils/deploy-runtime', () => ({
  parseDeployRuntimeOption: vi.fn(() => ({}))
}));

vi.mock('../utils/env', () => ({
  readLicellEnv: vi.fn(() => undefined)
}));

vi.mock('../utils/errors', () => ({
  formatErrorMessage: (err: unknown) => err instanceof Error ? err.message : String(err)
}));

vi.mock('../utils/cli-shared', () => ({
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
  isInteractiveTTY: vi.fn(() => false),
  showIntro: vi.fn(),
  showOutro: vi.fn(),
  tryNormalizeFcRuntime: (value: unknown) => typeof value === 'string' ? value : undefined
}));

vi.mock('../utils/output', () => ({
  emitCliError: emitCliErrorMock,
  emitCliEvent: vi.fn(),
  emitCommandEvent: vi.fn(),
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerDeployCommand } = await import('../commands/deploy');
  registerDeployCommand(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('deploy command json result', () => {
  const cwdSpy = vi.spyOn(process, 'cwd');

  beforeEach(() => {
    ensureAuthReadyForCommandMock.mockClear();
    ensureAuthCapabilityPreflightMock.mockClear();
    tryRecoverAuthForErrorMock.mockClear();
    detectAuthIssueMock.mockClear();
    resolveDeployContextMock.mockReset();
    executeStaticDeployMock.mockReset();
    emitCommandResultMock.mockReset();
    getFcApiRuntimeDeploySpecMock.mockReset();
    runFcApiDeployPrecheckMock.mockReset();
    getProjectMock.mockReset();
    getWorkspaceMock.mockReset();
    getAuthMock.mockReset();
    emitCliErrorMock.mockReset();
    setProjectMock.mockReset();
    updateLicellComponentStateMock.mockReset();

    cwdSpy.mockReturnValue('/repo');
    getProjectMock.mockReturnValue({ runtime: 'nodejs22' });
    getWorkspaceMock.mockReturnValue(undefined);
    getAuthMock.mockReturnValue({
      accountId: '1494910986361453',
      region: 'cn-hangzhou',
      ak: 'test-ak'
    });
    resolveDeployContextMock.mockResolvedValue({
      component: 'web',
      appName: 'demo-web',
      type: 'static',
      releaseTarget: undefined,
      cliDomain: undefined,
      projectDomain: undefined,
      domainSuffix: 'bazhuayu.xyz',
      enableCdn: true,
      cdnRefreshMode: 'entrypoints',
      useVpc: false,
      enableSSL: true,
      forceSslRenew: false,
      preview: false,
      interactiveTTY: false,
      auth: { region: 'cn-hangzhou' },
      project: { envs: {}, region: 'cn-hangzhou' }
    });
    executeStaticDeployMock.mockResolvedValue({
      url: 'https://demo-web-bucket.oss-cn-hangzhou.aliyuncs.com/index.html',
      dist: 'dist',
      bucketName: 'demo-web-bucket',
      cdnCname: 'demo-web.bazhuayu.xyz.w.kunluncan.com',
      cdnRefreshTaskIds: ['refresh-task-1'],
      fixedDomain: 'demo-web.bazhuayu.xyz',
      healthCheckLogs: ['✅ 固定域名可访问 (200 https://demo-web.bazhuayu.xyz/)']
    });
    getFcApiRuntimeDeploySpecMock.mockReturnValue({
      defaultEntry: 'src/index.ts'
    });
    runFcApiDeployPrecheckMock.mockReturnValue({
      ok: true,
      runtime: 'nodejs22',
      entry: 'src/index.ts',
      projectRoot: '/repo/apps/api',
      issues: []
    });
  });

  it('includes static bucket and cdn details in json output', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'deploy')({ component: 'web' });

    expect(ensureAuthCapabilityPreflightMock).toHaveBeenCalledWith(expect.objectContaining({
      requiredCapabilities: expect.arrayContaining(['oss', 'cdn'])
    }));
    const [preflightInput] = ensureAuthCapabilityPreflightMock.mock.calls.at(0) as unknown as [{ requiredCapabilities?: string[] }];
    expect(preflightInput?.requiredCapabilities).not.toContain('logs');
    expect(executeStaticDeployMock).toHaveBeenCalledTimes(1);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'static',
      component: 'web',
      url: 'https://demo-web-bucket.oss-cn-hangzhou.aliyuncs.com/index.html',
      fixedDomain: 'demo-web.bazhuayu.xyz',
      bucketName: 'demo-web-bucket',
      cdnCname: 'demo-web.bazhuayu.xyz.w.kunluncan.com',
      cdnRefreshMode: 'entrypoints',
      cdnRefreshTaskIds: ['refresh-task-1'],
      healthCheckLogs: ['✅ 固定域名可访问 (200 https://demo-web.bazhuayu.xyz/)']
    }));
  });

  it('requires logs capability for static preview deploys because they create FC proxy functions', async () => {
    resolveDeployContextMock.mockResolvedValueOnce({
      component: 'web',
      appName: 'demo-web',
      type: 'static',
      releaseTarget: undefined,
      cliDomain: undefined,
      projectDomain: undefined,
      domainSuffix: 'bazhuayu.xyz',
      enableCdn: true,
      cdnRefreshMode: 'entrypoints',
      useVpc: false,
      enableSSL: true,
      forceSslRenew: false,
      preview: true,
      interactiveTTY: false,
      auth: { region: 'cn-hangzhou' },
      project: { envs: {}, region: 'cn-hangzhou' }
    });

    const cli = await createCli();
    await getCommandAction(cli, 'deploy')({ component: 'web', preview: true });

    expect(ensureAuthCapabilityPreflightMock).toHaveBeenCalledWith(expect.objectContaining({
      requiredCapabilities: expect.arrayContaining(['oss', 'fc', 'logs'])
    }));
  });

  it('resolves deploy check projectRoot to the matched workspace component path', async () => {
    getWorkspaceMock.mockReturnValue({
      mode: 'workspace',
      rootDir: '/repo',
      componentPath: 'apps/api'
    });

    const cli = await createCli();
    await getCommandAction(cli, 'deploy check')({});

    expect(runFcApiDeployPrecheckMock).toHaveBeenCalledWith(expect.objectContaining({
      runtime: 'nodejs22',
      entry: 'src/index.ts',
      projectRoot: '/repo/apps/api',
      checkDockerDaemon: false
    }));
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      projectRoot: '/repo/apps/api'
    }));
  });

  it('resolves deploy check component option to the selected workspace component', async () => {
    getProjectMock.mockReturnValue({ runtime: 'nodejs22', entry: 'src/server.ts' });
    getWorkspaceMock.mockReturnValue({
      mode: 'workspace',
      rootDir: '/repo',
      componentName: 'agent-api',
      componentPath: 'services/agent-api'
    });

    const cli = await createCli();
    await getCommandAction(cli, 'deploy check')({ component: 'agent-api' });

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'agent-api' });
    expect(getWorkspaceMock).toHaveBeenCalledWith({ component: 'agent-api' });
    expect(runFcApiDeployPrecheckMock).toHaveBeenCalledWith(expect.objectContaining({
      runtime: 'nodejs22',
      entry: 'src/server.ts',
      projectRoot: '/repo/services/agent-api',
      checkDockerDaemon: false
    }));
  });

  it('fails deploy check when the explicit workspace component is missing', async () => {
    getWorkspaceMock.mockReturnValue({
      mode: 'workspace',
      rootDir: '/repo',
      componentName: 'web',
      componentPath: 'apps/web'
    });

    const previousExitCode = process.exitCode;
    process.exitCode = undefined;
    const cli = await createCli();
    await getCommandAction(cli, 'deploy check')({ component: 'agent-api' });

    expect(runFcApiDeployPrecheckMock).not.toHaveBeenCalled();
    expect(emitCliErrorMock).toHaveBeenCalledWith(expect.any(Error), { stage: 'deploy.check' });
    expect(process.exitCode).toBe(1);
    process.exitCode = previousExitCode;
  });
});
