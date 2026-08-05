import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockSetProject,
  mockGetRuntime,
  mockEnsureDefaultNetwork,
  mockDeployFC,
  mockRunFcApiDeployPrecheck,
  mockCreateFcApiDeployPrecheckError,
  mockPublishFunctionVersion,
  mockPromoteFunctionAlias,
  mockWaitForFunctionDeploymentMarker,
  mockUpsertAsyncInvokeConfig,
  mockEmitCommandEvent,
  mockWithSpinner
} = vi.hoisted(() => ({
  mockSetProject: vi.fn(),
  mockGetRuntime: vi.fn(),
  mockEnsureDefaultNetwork: vi.fn(),
  mockDeployFC: vi.fn(),
  mockRunFcApiDeployPrecheck: vi.fn(),
  mockCreateFcApiDeployPrecheckError: vi.fn(),
  mockPublishFunctionVersion: vi.fn(),
  mockPromoteFunctionAlias: vi.fn(),
  mockWaitForFunctionDeploymentMarker: vi.fn(),
  mockUpsertAsyncInvokeConfig: vi.fn(),
  mockEmitCommandEvent: vi.fn(),
  mockWithSpinner: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    setProject: mockSetProject
  }
}));

vi.mock('../providers/fc/runtime-handler', () => ({
  getRuntime: mockGetRuntime
}));

vi.mock('../providers/vpc', () => ({
  ensureDefaultNetwork: mockEnsureDefaultNetwork
}));

vi.mock('../providers/fc', () => ({
  DEFAULT_FC_RUNTIME: 'nodejs22',
  createFcApiDeployPrecheckError: mockCreateFcApiDeployPrecheckError,
  deployFC: mockDeployFC,
  publishFunctionVersion: mockPublishFunctionVersion,
  promoteFunctionAlias: mockPromoteFunctionAlias,
  runFcApiDeployPrecheck: mockRunFcApiDeployPrecheck,
  upsertAsyncInvokeConfig: mockUpsertAsyncInvokeConfig,
  waitForFunctionDeploymentMarker: mockWaitForFunctionDeploymentMarker
}));

vi.mock('../utils/errors', () => ({
  formatErrorMessage: (err: unknown) => String(err)
}));

vi.mock('../utils/cli-shared', () => ({
  toPromptValue: (value: unknown) => String(value),
  withSpinner: mockWithSpinner
}));

vi.mock('../utils/output', () => ({
  emitCommandEvent: mockEmitCommandEvent
}));

import { executeTaskDeploy } from '../commands/deploy-task';

describe('executeTaskDeploy', () => {
  beforeEach(() => {
    mockSetProject.mockReset();
    mockGetRuntime.mockReset();
    mockEnsureDefaultNetwork.mockReset();
    mockDeployFC.mockReset();
    mockRunFcApiDeployPrecheck.mockReset();
    mockCreateFcApiDeployPrecheckError.mockReset();
    mockPublishFunctionVersion.mockReset();
    mockPromoteFunctionAlias.mockReset();
    mockWaitForFunctionDeploymentMarker.mockReset();
    mockUpsertAsyncInvokeConfig.mockReset();
    mockEmitCommandEvent.mockReset();
    mockWithSpinner.mockReset();

    mockGetRuntime.mockReturnValue({
      defaultEntry: 'src/task.ts',
      supportsInternalDeploymentProbe: true
    });
    mockRunFcApiDeployPrecheck.mockReturnValue({ ok: true, issues: [] });
    mockDeployFC.mockResolvedValue({ deploymentMarker: 'marker-123' });
    mockPublishFunctionVersion.mockResolvedValue('9');
    mockPromoteFunctionAlias.mockResolvedValue(undefined);
    mockWaitForFunctionDeploymentMarker.mockResolvedValue(undefined);
    mockUpsertAsyncInvokeConfig.mockResolvedValue(undefined);
    mockWithSpinner.mockImplementation(async (_spinner, _start, _fail, task) => task());
  });

  it('waits for alias invoke convergence before writing qualifier async config', async () => {
    const spinner = {
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn()
    };

    const result = await executeTaskDeploy({
      appName: 'demo-task',
      type: 'task',
      releaseTarget: 'preview',
      enableCdn: false,
      useVpc: false,
      enableSSL: false,
      forceSslRenew: false,
      preview: false,
      interactiveTTY: false,
      auth: { accountId: '123', region: 'cn-hangzhou' },
      project: {},
      cliRuntime: 'nodejs22',
      cliEntry: 'src/task.ts'
    } as never, spinner as never);

    expect(mockWaitForFunctionDeploymentMarker).toHaveBeenCalledWith('demo-task', 'marker-123', {
      qualifier: 'preview',
      timeoutMs: 90_000,
      intervalMs: 2_000
    });
    expect(mockUpsertAsyncInvokeConfig).toHaveBeenNthCalledWith(1, 'demo-task', { asyncTask: true });
    expect(mockUpsertAsyncInvokeConfig).toHaveBeenNthCalledWith(2, 'demo-task', {
      qualifier: 'preview',
      asyncTask: true
    });
    expect(mockWaitForFunctionDeploymentMarker.mock.invocationCallOrder[0]).toBeLessThan(
      mockUpsertAsyncInvokeConfig.mock.invocationCallOrder[1]
    );
    expect(result?.promotedVersion).toBe('9');
    expect(mockEmitCommandEvent.mock.calls.map(([event]) => event.stage)).toEqual(expect.arrayContaining([
      'deploy.task.function',
      'deploy.task.async-config.latest',
      'deploy.task.release.version',
      'deploy.task.release.alias',
      'deploy.task.release.converge',
      'deploy.task.async-config.alias'
    ]));
  });

  it('revalidates an existing network in the effective region before task deploy', async () => {
    const spinner = { start: vi.fn(), stop: vi.fn(), message: vi.fn() };
    const existingNetwork = { vpcId: 'vpc-hz', vswId: 'vsw-hz', region: 'cn-hangzhou' };
    const effectiveNetwork = { vpcId: 'vpc-sh', vswId: 'vsw-sh', sgId: 'sg-sh', region: 'cn-shanghai' };
    mockEnsureDefaultNetwork.mockResolvedValue(effectiveNetwork);

    await executeTaskDeploy({
      appName: 'demo-task',
      type: 'task',
      enableCdn: false,
      useVpc: true,
      enableSSL: false,
      forceSslRenew: false,
      preview: false,
      interactiveTTY: false,
      auth: { accountId: '123', region: 'cn-shanghai' },
      project: { network: existingNetwork },
      cliRuntime: 'nodejs22',
      cliEntry: 'src/task.ts'
    } as never, spinner as never);

    expect(mockEnsureDefaultNetwork).toHaveBeenCalledTimes(1);
    expect(mockSetProject).toHaveBeenCalledWith({ network: effectiveNetwork }, { component: undefined });
    expect(mockDeployFC).toHaveBeenCalledWith(
      'demo-task',
      'src/task.ts',
      'nodejs22',
      expect.objectContaining({ network: effectiveNetwork, ensureHttpUrl: false })
    );
  });

  it('fails instead of silently dropping an existing VPC on transient validation errors', async () => {
    const spinner = { start: vi.fn(), stop: vi.fn(), message: vi.fn() };
    const existingNetwork = { vpcId: 'vpc-hz', vswId: 'vsw-hz', region: 'cn-hangzhou' };
    mockEnsureDefaultNetwork.mockRejectedValue(new Error('Throttling.User'));

    await expect(executeTaskDeploy({
      appName: 'demo-task',
      type: 'task',
      enableCdn: false,
      useVpc: true,
      enableSSL: false,
      forceSslRenew: false,
      preview: false,
      interactiveTTY: false,
      auth: { accountId: '123', region: 'cn-shanghai' },
      project: { network: existingNetwork },
      cliRuntime: 'nodejs22',
      cliEntry: 'src/task.ts'
    } as never, spinner as never)).rejects.toThrow('Throttling.User');

    expect(mockDeployFC).not.toHaveBeenCalled();
    expect(mockSetProject).not.toHaveBeenCalled();
  });
});
