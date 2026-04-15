import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const { emitCommandResultMock, runLicellDoctorMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  runLicellDoctorMock: vi.fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

vi.mock('../utils/doctor', () => ({
  runLicellDoctor: runLicellDoctorMock,
  renderLicellDoctorReport: vi.fn(() => 'doctor report')
}));

async function createCli() {
  const cli = cac('licell');
  const { registerWorkspaceCommands } = await import('../commands/workspace');
  registerWorkspaceCommands(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('workspace commands', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-workspace-'));
    previousCwd = process.cwd();
    emitCommandResultMock.mockReset();
    runLicellDoctorMock.mockReset();
    runLicellDoctorMock.mockResolvedValue({
      stage: 'doctor',
      healthy: true,
      checkCount: 1,
      okCount: 1,
      warnCount: 0,
      errorCount: 0,
      skipCount: 0,
      context: {
        cwd: root,
        globalDir: '/tmp/.licell-cli',
        authFile: null,
        globalConfigFile: null,
        projectFile: null,
        component: null,
        workspaceMode: 'workspace',
        workspaceRoot: root,
        runtime: null,
        entry: null,
        offline: false
      },
      checks: [],
      components: []
    });
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('initializes a workspace component at the repo root', async () => {
    mkdirSync(join(root, 'apps', 'web'), { recursive: true });
    process.chdir(root);
    const cli = await createCli();

    await getCommandAction(cli, 'workspace init')({
      component: 'web',
      path: 'apps/web',
      type: 'static',
      dist: 'dist',
      domain: 'www.example.com',
      default: true
    });

    const payload = JSON.parse(readFileSync(join(root, '.licell', 'project.json'), 'utf-8'));
    expect(payload).toMatchObject({
      defaultComponent: 'web',
      components: {
        web: {
          path: 'apps/web',
          appName: 'web',
          deployType: 'static',
          dist: 'dist',
          domain: 'www.example.com'
        }
      }
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      component: 'web',
      path: 'apps/web',
      deployType: 'static',
      defaultComponent: 'web'
    }), expect.objectContaining({ stage: 'workspace.init' }));
  });

  it('lists workspace components and highlights the resolved component', async () => {
    mkdirSync(join(root, '.licell'), { recursive: true });
    mkdirSync(join(root, 'apps', 'api'), { recursive: true });
    process.chdir(join(root, 'apps', 'api'));
    await import('fs').then(({ writeFileSync }) => writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      defaultComponent: 'api',
      components: {
        web: {
          path: 'apps/web',
          appName: 'demo-web',
          deployType: 'static'
        },
        api: {
          path: 'apps/api',
          appName: 'demo-api',
          deployType: 'api',
          runtime: 'nodejs22'
        }
      }
    }, null, 2)));
    const cli = await createCli();

    await getCommandAction(cli, 'workspace list')({});

    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'workspace',
      rootDir: realpathSync(root),
      componentName: 'api',
      defaultComponent: 'api',
      components: [
        expect.objectContaining({ name: 'api', matched: true, defaultComponent: true }),
        expect.objectContaining({ name: 'web', matched: false })
      ]
    }), expect.objectContaining({ stage: 'workspace.list' }));
  });

  it('runs workspace doctor across all components by default', async () => {
    process.chdir(root);
    const cli = await createCli();

    await getCommandAction(cli, 'workspace doctor')({});

    expect(runLicellDoctorMock).toHaveBeenCalledWith(expect.objectContaining({
      allComponents: true
    }));
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'doctor',
      healthy: true
    }), expect.objectContaining({ stage: 'workspace.doctor' }));
  });

  it('runs workspace doctor against a single component when requested', async () => {
    process.chdir(root);
    const cli = await createCli();

    await getCommandAction(cli, 'workspace doctor')({ component: 'api' });

    expect(runLicellDoctorMock).toHaveBeenCalledWith(expect.objectContaining({
      component: 'api'
    }));
    expect(runLicellDoctorMock).not.toHaveBeenCalledWith(expect.objectContaining({
      allComponents: true
    }));
  });

  it('migrates a legacy single-project config into mixed workspace format', async () => {
    mkdirSync(join(root, '.licell'), { recursive: true });
    process.chdir(root);
    await import('fs').then(({ writeFileSync }) => writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      envs: {},
      appName: 'demo-web',
      deployType: 'static',
      runtime: 'static',
      dist: 'dist',
      domain: 'www.example.com'
    }, null, 2)));
    const cli = await createCli();

    await getCommandAction(cli, 'workspace migrate')({ component: 'web', path: '.' });

    const payload = JSON.parse(readFileSync(join(root, '.licell', 'project.json'), 'utf-8'));
    expect(payload).toMatchObject({
      appName: 'demo-web',
      deployType: 'static',
      runtime: 'static',
      dist: 'dist',
      domain: 'www.example.com',
      defaultComponent: 'web',
      components: {
        web: {
          path: '.',
          appName: 'demo-web',
          deployType: 'static',
          runtime: 'static',
          dist: 'dist',
          domain: 'www.example.com'
        }
      }
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'migrated',
      component: 'web',
      path: '.',
      defaultComponent: 'web',
      backwardCompatible: true
    }), expect.objectContaining({ stage: 'workspace.migrate' }));
  });

  it('returns already-workspace when migrate is called twice', async () => {
    mkdirSync(join(root, '.licell'), { recursive: true });
    process.chdir(root);
    await import('fs').then(({ writeFileSync }) => writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      defaultComponent: 'web',
      components: {
        web: {
          path: '.',
          envs: {},
          appName: 'demo-web',
          deployType: 'static'
        }
      }
    }, null, 2)));
    const cli = await createCli();

    await getCommandAction(cli, 'workspace migrate')({ component: 'web', path: '.' });

    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'already-workspace',
      component: 'web',
      defaultComponent: 'web'
    }), expect.objectContaining({ stage: 'workspace.migrate' }));
  });

  it('supports dry-run migration without writing the file', async () => {
    mkdirSync(join(root, '.licell'), { recursive: true });
    process.chdir(root);
    await import('fs').then(({ writeFileSync }) => writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      envs: {},
      appName: 'demo-web',
      deployType: 'static'
    }, null, 2)));
    const before = readFileSync(join(root, '.licell', 'project.json'), 'utf-8');
    const cli = await createCli();

    await getCommandAction(cli, 'workspace migrate')({ component: 'web', path: '.', dryRun: true });

    const after = readFileSync(join(root, '.licell', 'project.json'), 'utf-8');
    expect(after).toBe(before);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'migrated',
      dryRun: true,
      diffSummary: expect.objectContaining({
        addedTopLevelKeys: expect.arrayContaining(['components', 'defaultComponent']),
        createdComponent: 'web',
        componentPath: '.'
      })
    }), expect.objectContaining({ stage: 'workspace.migrate' }));
  });
});
