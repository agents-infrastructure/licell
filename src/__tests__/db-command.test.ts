import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  configState,
  deleteDatabaseInstanceMock,
  executeWithAuthRecoveryMock,
  getProjectMock,
  listDatabaseClassesMock,
  setProjectMock,
  showOutroMock,
  spinnerStopMock
} = vi.hoisted(() => ({
  configState: {
    current: { envs: {} as Record<string, string>, database: undefined as unknown }
  },
  deleteDatabaseInstanceMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getProjectMock: vi.fn(),
  listDatabaseClassesMock: vi.fn(),
  setProjectMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  isCancel: vi.fn(() => false)
}));

vi.mock('../providers/infra', () => ({
  normalizeDbUser: vi.fn(),
  provisionDatabase: vi.fn(),
  listDatabaseClasses: listDatabaseClassesMock,
  listDatabaseInstances: vi.fn(),
  getDatabaseInstanceDetail: vi.fn(),
  resolveDatabaseConnectInfo: vi.fn(),
  deleteDatabaseInstance: deleteDatabaseInstanceMock,
  allocateDbPublicConnection: vi.fn(),
  applyDbPublicWhitelist: vi.fn()
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
  showIntro: vi.fn(),
  showOutro: showOutroMock,
  toOptionalString: (input: unknown) => {
    if (input == null) return undefined;
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

async function createCli() {
  const cli = cac('licell');
  const { registerDbCommands } = await import('../commands/db');
  registerDbCommands(cli);
  return cli;
}

describe('db commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    deleteDatabaseInstanceMock.mockReset();
    deleteDatabaseInstanceMock.mockResolvedValue(undefined);
    executeWithAuthRecoveryMock.mockClear();
    configState.current = { envs: {}, database: undefined };
    getProjectMock.mockReset();
    getProjectMock.mockImplementation(() => configState.current);
    listDatabaseClassesMock.mockReset();
    listDatabaseClassesMock.mockResolvedValue({
      regionId: 'cn-hangzhou',
      dbType: 'postgres',
      engine: 'PostgreSQL',
      engineVersion: '18.0',
      category: 'Basic',
      storageType: 'cloud_essd',
      chargeType: 'PostPaid',
      zoneId: undefined,
      zoneIds: ['cn-hangzhou-b'],
      queriedAllZones: false,
      defaultClass: 'pg.n1e.1c.1m',
      classes: [
        {
          instanceClass: 'pg.n1e.1c.1m',
          storageRange: { minGb: 20, maxGb: 2000, stepGb: 5 },
          zoneIds: ['cn-hangzhou-b']
        }
      ],
      zones: [
        {
          zoneId: 'cn-hangzhou-b',
          classCount: 1,
          classes: ['pg.n1e.1c.1m']
        }
      ]
    });
    setProjectMock.mockReset();
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('supports querying database classes', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'db class', 'postgresql', '--limit', '10']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listDatabaseClassesMock).toHaveBeenCalledWith('postgres', {
      engineVersion: undefined,
      category: undefined,
      storageType: undefined,
      zoneId: undefined,
      allZones: false
    });
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('数据库规格已返回'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });

  it('supports querying database classes across all zones', async () => {
    listDatabaseClassesMock.mockResolvedValueOnce({
      regionId: 'cn-hangzhou',
      dbType: 'postgres',
      engine: 'PostgreSQL',
      engineVersion: '18.0',
      category: 'Basic',
      storageType: 'cloud_essd',
      chargeType: 'PostPaid',
      zoneId: undefined,
      zoneIds: ['cn-hangzhou-b', 'cn-hangzhou-e'],
      queriedAllZones: true,
      defaultClass: 'pg.n1e.1c.1m',
      classes: [
        {
          instanceClass: 'pg.n1e.1c.1m',
          storageRange: { minGb: 20, maxGb: 2000, stepGb: 5 },
          zoneIds: ['cn-hangzhou-b', 'cn-hangzhou-e']
        }
      ],
      zones: [
        {
          zoneId: 'cn-hangzhou-b',
          classCount: 1,
          classes: ['pg.n1e.1c.1m']
        },
        {
          zoneId: 'cn-hangzhou-e',
          classCount: 1,
          classes: ['pg.n1e.1c.1m']
        }
      ]
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'db class', 'postgresql', '--all-zones']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listDatabaseClassesMock).toHaveBeenCalledWith('postgres', {
      engineVersion: undefined,
      category: undefined,
      storageType: undefined,
      zoneId: undefined,
      allZones: true
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Zone Breakdown'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('cn-hangzhou-b'));
  });

  it('stops spinner after successful deletion', async () => {
    configState.current = {
      envs: {
        DATABASE_URL: 'postgresql://demo:secret@db.example:5432/app',
        KEEP_ME: '1'
      },
      database: {
        type: 'postgres',
        instanceId: 'pgm-demo',
        user: 'demo',
        name: 'app'
      }
    };
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'db rm', 'pgm-demo', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteDatabaseInstanceMock).toHaveBeenCalledWith('pgm-demo');
    expect(setProjectMock).toHaveBeenCalledWith({
      database: undefined,
      envs: {
        KEEP_ME: '1'
      }
    }, { replaceEnvs: true });
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('实例 pgm-demo 已删除'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });
});
