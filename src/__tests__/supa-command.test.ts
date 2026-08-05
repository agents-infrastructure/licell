import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  configState,
  executeWithAuthRecoveryMock,
  getProjectMock,
  setProjectMock,
  showIntroMock,
  showOutroMock,
  spinnerStopMock
} = vi.hoisted(() => ({
  configState: {
    current: {
      envs: {} as Record<string, string>,
      database: undefined as unknown,
      supabase: undefined as unknown
    }
  },
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  setProjectMock: vi.fn(),
  showIntroMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  isCancel: vi.fn(() => false)
}));

vi.mock('../providers/supabase', () => ({
  provisionSupabase: vi.fn(),
  listSupabaseInstances: vi.fn(),
  getSupabaseInstanceDetail: vi.fn(),
  getSupabaseEndpoints: vi.fn(),
  getSupabaseAuthInfo: vi.fn(),
  getSupabaseStorageConfig: vi.fn(),
  getSupabaseRAGConfig: vi.fn(),
  getSupabaseIpWhitelist: vi.fn(),
  modifySupabaseAuthConfig: vi.fn(),
  modifySupabaseStorageConfig: vi.fn(),
  modifySupabaseRAGConfig: vi.fn(),
  modifySupabaseIpWhitelist: vi.fn(),
  resetSupabasePassword: vi.fn(),
  restartSupabaseInstance: vi.fn(),
  stopSupabaseInstance: vi.fn(),
  startSupabaseInstance: vi.fn(),
  deleteSupabaseInstanceCascade: vi.fn()
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
  createSpinner: () => ({
    start: vi.fn(),
    stop: spinnerStopMock,
    message: vi.fn()
  }),
  isInteractiveTTY: vi.fn(() => false),
  showIntro: showIntroMock,
  showOutro: showOutroMock,
  toOptionalString: (input: unknown) => {
    if (input === null || input === undefined) return undefined;
    const value = String(input).trim();
    return value.length > 0 ? value : undefined;
  },
  parseListLimit: (_input: unknown, fallback: number) => fallback,
  withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: vi.fn(),
  isJsonOutput: vi.fn(() => false)
}));

import { deleteSupabaseInstanceCascade } from '../providers/supabase';

const deleteSupabaseInstanceCascadeMock = deleteSupabaseInstanceCascade as unknown as ReturnType<typeof vi.fn>;

async function createCli() {
  const cli = cac('licell');
  const { registerSupaCommands } = await import('../commands/supa');
  registerSupaCommands(cli);
  return cli;
}

describe('supa rm command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    configState.current = { envs: {}, database: undefined, supabase: undefined };
    executeWithAuthRecoveryMock.mockClear();
    getProjectMock.mockReset();
    getProjectMock.mockImplementation(() => configState.current);
    setProjectMock.mockReset();
    showIntroMock.mockClear();
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();
    deleteSupabaseInstanceCascadeMock.mockReset();
    deleteSupabaseInstanceCascadeMock.mockResolvedValue({
      instanceName: 'demo-supa',
      dbInstanceId: 'pgm-demo',
      deletedDatabase: true
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('requires both rdsai and rds capabilities and cascades postgres deletion', async () => {
    configState.current = {
      envs: {
        SUPABASE_URL: 'http://demo.example',
        SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
        SUPABASE_INSTANCE_NAME: 'demo-supa',
        SUPABASE_DASHBOARD_USERNAME: 'supabase',
        SUPABASE_DASHBOARD_PASSWORD: 'dash-secret',
        SUPABASE_DB_PASSWORD: 'db-secret',
        DATABASE_URL: 'postgresql://demo:secret@db.example:5432/app',
        KEEP_ME: '1'
      },
      database: {
        type: 'postgres',
        instanceId: 'pgm-demo',
        user: 'demo',
        name: 'app'
      },
      supabase: {
        instanceName: 'demo-supa',
        region: 'cn-shanghai'
      }
    };

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'supa rm', 'demo-supa', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledTimes(1);
    expect(executeWithAuthRecoveryMock.mock.calls[0]?.[0]).toMatchObject({
      requiredCapabilities: ['rdsai', 'rds']
    });
    expect(deleteSupabaseInstanceCascadeMock).toHaveBeenCalledTimes(1);
    expect(deleteSupabaseInstanceCascadeMock.mock.calls[0]?.[0]).toBe('demo-supa');
    expect(deleteSupabaseInstanceCascadeMock.mock.calls[0]?.[1]).toMatchObject({
      onProgress: expect.any(Function)
    });
    expect(setProjectMock).toHaveBeenCalledWith({
      database: undefined,
      supabase: undefined,
      envs: {
        KEEP_ME: '1'
      }
    }, { replaceEnvs: true });
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('删除完成'));
  });

  it('does not clear unrelated project bindings', async () => {
    configState.current = {
      envs: {
        SUPABASE_INSTANCE_NAME: 'other-supa',
        SUPABASE_URL: 'http://other.example',
        DATABASE_URL: 'postgresql://demo:secret@db.example:5432/app',
        KEEP_ME: '1'
      },
      database: {
        type: 'postgres',
        instanceId: 'pgm-other',
        user: 'demo',
        name: 'app'
      },
      supabase: {
        instanceName: 'other-supa',
        region: 'cn-beijing'
      }
    };

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'supa rm', 'demo-supa', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setProjectMock).not.toHaveBeenCalled();
  });
});
