import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { cac } from 'cac';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  deployFCMock,
  emitCliErrorMock,
  ensureDefaultNetworkMock,
  observedNetworkIds,
  resolveDeployContextMock,
  runFcApiDeployPrecheckMock,
  upsertAsyncInvokeConfigMock
} = vi.hoisted(() => ({
  deployFCMock: vi.fn(),
  emitCliErrorMock: vi.fn(),
  ensureDefaultNetworkMock: vi.fn(),
  observedNetworkIds: [] as Array<string | undefined>,
  resolveDeployContextMock: vi.fn(),
  runFcApiDeployPrecheckMock: vi.fn(),
  upsertAsyncInvokeConfigMock: vi.fn()
}));

vi.mock('../commands/deploy-context', () => ({
  resolveDeployContext: resolveDeployContextMock
}));

vi.mock('../commands/deploy-api', () => ({ executeApiDeploy: vi.fn() }));
vi.mock('../commands/deploy-static', () => ({ executeStaticDeploy: vi.fn() }));

vi.mock('../providers/vpc', async () => {
  const { Config } = await vi.importActual<typeof import('../utils/config')>('../utils/config');
  ensureDefaultNetworkMock.mockImplementation(async () => {
    const network = Config.getProject().network;
    observedNetworkIds.push(network?.vpcId);
    if (!network) throw new Error('missing project network');
    return network;
  });
  return { ensureDefaultNetwork: ensureDefaultNetworkMock };
});

vi.mock('../providers/fc', () => ({
  DEFAULT_FC_RUNTIME: 'nodejs22',
  createFcApiDeployPrecheckError: vi.fn(() => new Error('precheck failed')),
  deployFC: deployFCMock,
  getFcApiDeploySpecDocument: vi.fn(),
  getFcApiRuntimeDeploySpec: vi.fn(() => ({ defaultEntry: 'src/index.ts' })),
  promoteFunctionAlias: vi.fn(),
  publishFunctionVersion: vi.fn(),
  runFcApiDeployPrecheck: runFcApiDeployPrecheckMock,
  upsertAsyncInvokeConfig: upsertAsyncInvokeConfigMock,
  waitForFunctionDeploymentMarker: vi.fn()
}));

vi.mock('../providers/fc/runtime-handler', () => ({
  getRuntime: vi.fn(() => ({
    defaultEntry: 'src/task.ts',
    supportsInternalDeploymentProbe: true
  }))
}));

vi.mock('../utils/auth-recovery', () => ({
  detectAuthIssue: vi.fn(() => 'unknown'),
  ensureAuthCapabilityPreflight: vi.fn(async () => undefined),
  ensureAuthReadyForCommand: vi.fn(async () => undefined),
  tryRecoverAuthForError: vi.fn(async () => false)
}));

vi.mock('../utils/cli-shared', async () => {
  const actual = await vi.importActual<typeof import('../utils/cli-shared')>('../utils/cli-shared');
  return {
    ...actual,
    createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() }),
    isInteractiveTTY: vi.fn(() => false),
    showIntro: vi.fn(),
    showOutro: vi.fn(),
    withSpinner: vi.fn(async (_spinner, _start, _fail, run: () => Promise<unknown>) => run())
  };
});

vi.mock('../utils/output', () => ({
  emitCliError: emitCliErrorMock,
  emitCliEvent: vi.fn(),
  emitCommandEvent: vi.fn(),
  emitCommandResult: vi.fn(),
  isJsonOutput: vi.fn(() => true)
}));

vi.mock('../utils/hooks', () => ({ runHook: vi.fn() }));
vi.mock('../utils/deploy-config', () => ({ buildDeployProjectPatch: vi.fn(() => ({})) }));
vi.mock('../utils/deploy-state', () => ({ buildDeployStatePatch: vi.fn(() => ({})) }));
vi.mock('../utils/project-state', () => ({ updateLicellComponentState: vi.fn() }));

import { registerDeployCommand } from '../commands/deploy';
import { Config } from '../utils/config';

describe('workspace task deploy network selection', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    vi.clearAllMocks();
    observedNetworkIds.length = 0;
    previousCwd = process.cwd();
    root = realpathSync(mkdtempSync(join(tmpdir(), 'licell-deploy-workspace-network-')));
    mkdirSync(join(root, '.licell'), { recursive: true });
    mkdirSync(join(root, 'apps', 'web'), { recursive: true });
    mkdirSync(join(root, 'services', 'worker'), { recursive: true });
    writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      defaultComponent: 'web',
      components: {
        web: {
          path: 'apps/web',
          appName: 'demo-web',
          deployType: 'static',
          network: { vpcId: 'vpc-web', vswId: 'vsw-web', region: 'cn-shanghai' }
        },
        worker: {
          path: 'services/worker',
          appName: 'demo-worker',
          deployType: 'task',
          runtime: 'nodejs22',
          entry: 'src/task.ts',
          useVpc: true,
          network: { vpcId: 'vpc-worker', vswId: 'vsw-worker', region: 'cn-shanghai' }
        }
      }
    }, null, 2));
    process.chdir(root);

    const auth = {
      accountId: '1234567890',
      ak: 'test-ak',
      sk: 'test-sk',
      region: 'cn-shanghai'
    };
    vi.spyOn(Config, 'getAuth').mockReturnValue(auth);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    resolveDeployContextMock.mockImplementation(async (options: { component?: string }) => {
      const project = Config.getProject({ component: options.component });
      return {
        component: options.component,
        appName: project.appName,
        type: 'task',
        releaseTarget: undefined,
        cliDomain: undefined,
        projectDomain: undefined,
        domainSuffix: undefined,
        enableCdn: false,
        cdnRefreshMode: 'off',
        useVpc: true,
        enableSSL: false,
        forceSslRenew: false,
        preview: false,
        interactiveTTY: false,
        auth,
        project,
        projectRuntime: 'nodejs22',
        projectEntry: 'src/task.ts'
      };
    });
    runFcApiDeployPrecheckMock.mockReturnValue({ ok: true, issues: [] });
    deployFCMock.mockResolvedValue({ deploymentMarker: 'marker-worker' });
    upsertAsyncInvokeConfigMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    vi.restoreAllMocks();
    rmSync(root, { recursive: true, force: true });
  });

  it('uses the --component project when task deploy prepares its VPC network', async () => {
    expect(Config.getProject().network?.vpcId).toBe('vpc-web');

    const cli = cac('licell');
    registerDeployCommand(cli);
    const command = cli.commands.find((item) => item.name === 'deploy');
    if (!command?.commandAction) throw new Error('deploy command not found');

    await command.commandAction({
      component: 'worker',
      region: 'cn-shanghai'
    });

    expect(resolveDeployContextMock).toHaveBeenCalledWith(expect.objectContaining({
      component: 'worker'
    }));
    expect(emitCliErrorMock).not.toHaveBeenCalled();
    expect(ensureDefaultNetworkMock).toHaveBeenCalledTimes(1);
    expect(observedNetworkIds).toEqual(['vpc-worker']);
    expect(deployFCMock).toHaveBeenCalledWith(
      'demo-worker',
      'src/task.ts',
      'nodejs22',
      expect.objectContaining({
        network: expect.objectContaining({ vpcId: 'vpc-worker' }),
        project: expect.objectContaining({
          appName: 'demo-worker',
          network: expect.objectContaining({ vpcId: 'vpc-worker' })
        })
      })
    );
    expect(process.cwd()).toBe(root);
  });
});
