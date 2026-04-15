import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  ensureDestructiveActionConfirmedMock,
  executeWithAuthRecoveryMock,
  getProjectMock,
  getAsyncInvokeConfigMock,
  removeAsyncInvokeConfigMock,
  showOutroMock,
  spinnerStopMock,
  upsertAsyncInvokeConfigMock
} = vi.hoisted(() => ({
  ensureDestructiveActionConfirmedMock: vi.fn(async () => {}),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(() => ({ appName: 'demo-worker' })),
  getAsyncInvokeConfigMock: vi.fn(),
  removeAsyncInvokeConfigMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn(),
  upsertAsyncInvokeConfigMock: vi.fn()
}));

vi.mock('../providers/fc', () => ({
  getAsyncTask: vi.fn(),
  getAsyncInvokeConfig: getAsyncInvokeConfigMock,
  invokeFunctionAsync: vi.fn(),
  listAsyncTasks: vi.fn(),
  removeAsyncInvokeConfig: removeAsyncInvokeConfigMock,
  stopAsyncTask: vi.fn(),
  upsertAsyncInvokeConfig: upsertAsyncInvokeConfigMock
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
  createSpinner: () => ({
    start: vi.fn(),
    stop: spinnerStopMock,
    message: vi.fn()
  }),
  ensureAuthOrExit: vi.fn(),
  ensureDestructiveActionConfirmed: ensureDestructiveActionConfirmedMock,
  isInteractiveTTY: vi.fn(() => false),
  parseListLimit: (_input: unknown, fallback: number) => fallback,
  showOutro: showOutroMock,
  toOptionalString: (value: unknown) => value == null ? undefined : String(value).trim() || undefined,
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

import {
  getAsyncInvokeConfig,
  removeAsyncInvokeConfig,
  upsertAsyncInvokeConfig
} from '../providers/fc';
import { buildNextAsyncInvokeConfig } from '../commands/task';

const getAsyncInvokeConfigProviderMock = getAsyncInvokeConfig as unknown as ReturnType<typeof vi.fn>;
const removeAsyncInvokeConfigProviderMock = removeAsyncInvokeConfig as unknown as ReturnType<typeof vi.fn>;
const upsertAsyncInvokeConfigProviderMock = upsertAsyncInvokeConfig as unknown as ReturnType<typeof vi.fn>;

async function createCli() {
  const cli = cac('licell');
  const { registerTaskCommands } = await import('../commands/task');
  registerTaskCommands(cli);
  return cli;
}

describe('task commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    ensureDestructiveActionConfirmedMock.mockClear();
    executeWithAuthRecoveryMock.mockClear();
    getAsyncInvokeConfigProviderMock.mockReset();
    getProjectMock.mockReset();
    getProjectMock.mockImplementation(() => ({ appName: 'demo-worker' }));
    removeAsyncInvokeConfigProviderMock.mockReset();
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();
    upsertAsyncInvokeConfigProviderMock.mockReset();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('merges existing async config for `task config set`', () => {
    const next = buildNextAsyncInvokeConfig({
      asyncTask: true,
      maxAsyncRetryAttempts: 3,
      destinationConfig: {
        onSuccess: 'acs:fc:cn-hangzhou:123:functions/success',
        onFailure: 'acs:mns:cn-hangzhou:123:/queues/dlq/messages'
      }
    }, 'prod', {
      maxRetryAttempts: '0',
      maxEventAge: '600',
      clearOnSuccess: true
    });

    expect(next).toEqual({
      qualifier: 'prod',
      asyncTask: true,
      maxAsyncRetryAttempts: 0,
      maxAsyncEventAgeInSeconds: 600,
      destinationConfig: {
        onFailure: 'acs:mns:cn-hangzhou:123:/queues/dlq/messages'
      }
    });
  });

  it('reads current config when running `task config set`', async () => {
    getAsyncInvokeConfigProviderMock.mockResolvedValue({
      asyncTask: true,
      maxAsyncRetryAttempts: 3,
      destinationConfig: {
        onSuccess: 'acs:fc:cn-hangzhou:123:functions/success',
        onFailure: 'acs:mns:cn-hangzhou:123:/queues/dlq/messages'
      }
    });
    upsertAsyncInvokeConfigProviderMock.mockResolvedValue({
      qualifier: 'prod',
      asyncTask: true,
      maxAsyncRetryAttempts: 0,
      maxAsyncEventAgeInSeconds: 600,
      destinationConfig: {
        onFailure: 'acs:mns:cn-hangzhou:123:/queues/dlq/messages'
      }
    });

    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'task config set',
      'image-worker',
      '--target',
      'prod',
      '--max-retry-attempts',
      '0',
      '--max-event-age',
      '600',
      '--clear-on-success'
    ]);

    expect(getAsyncInvokeConfigProviderMock).toHaveBeenCalledWith('image-worker', 'prod');
    expect(executeWithAuthRecoveryMock.mock.calls[0]?.[0]).toMatchObject({
      requiredCapabilities: ['fc']
    });
  });

  it('confirms before deleting async config', async () => {
    removeAsyncInvokeConfigProviderMock.mockResolvedValue({
      functionName: 'image-worker',
      qualifier: 'prod',
      removed: true
    });

    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'task config rm',
      'image-worker',
      '--target',
      'prod',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(removeAsyncInvokeConfigProviderMock).toHaveBeenCalledWith('image-worker', 'prod');
  });

  it('resolves project appName from the selected component', async () => {
    getAsyncInvokeConfigProviderMock.mockResolvedValue({
      qualifier: 'preview',
      asyncTask: true
    });

    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'task config',
      '--component',
      'worker',
      '--target',
      'preview'
    ]);

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'worker' });
    expect(getAsyncInvokeConfigProviderMock).toHaveBeenCalledWith('demo-worker', 'preview');
  });
});
