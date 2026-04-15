import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const { emitCommandResultMock, emitCliErrorMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  emitCliErrorMock: vi.fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  emitCliError: emitCliErrorMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerBootstrapCommand } = await import('../commands/bootstrap');
  registerBootstrapCommand(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('bootstrap command', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-bootstrap-'));
    previousCwd = process.cwd();
    process.chdir(root);
    emitCommandResultMock.mockReset();
    emitCliErrorMock.mockReset();
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('returns component choices when multiple discovered candidates exist', async () => {
    mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
    mkdirSync(join(root, 'apps', 'api', 'src'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces: ['apps/*'] }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'package.json'), JSON.stringify({ dependencies: { vite: '^5.0.0' } }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'export default {}\n');
    writeFileSync(join(root, 'apps', 'api', 'package.json'), JSON.stringify({ dependencies: { hono: '^4.0.0' } }, null, 2));
    writeFileSync(join(root, 'apps', 'api', 'src', 'index.ts'), 'export const handler = () => {};\n');

    const cli = await createCli();
    await getCommandAction(cli, 'bootstrap')({});

    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'single',
      applied: false,
      discoveredComponents: expect.arrayContaining([
        expect.objectContaining({ component: 'api' }),
        expect.objectContaining({ component: 'web' })
      ]),
      questions: expect.arrayContaining([
        expect.objectContaining({ id: 'component', choices: ['api', 'web'] }),
        expect.objectContaining({ id: 'type', choices: ['static', 'api', 'task'] })
      ])
    }), expect.objectContaining({ stage: 'bootstrap' }));
  });

  it('infers type/path/artifact from discovery when component is provided', async () => {
    mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces: ['apps/*'] }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'package.json'), JSON.stringify({ dependencies: { react: '^18.0.0', vite: '^5.0.0' } }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'export default {}\n');

    const cli = await createCli();
    await getCommandAction(cli, 'bootstrap')({ component: 'web' });

    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'single',
      component: 'web',
      path: 'apps/web',
      deployType: 'static',
      project: expect.objectContaining({
        artifact: { kind: 'directory', path: 'dist' },
        deployTarget: expect.objectContaining({ service: 'oss-static' })
      }),
      refinements: expect.arrayContaining([
        expect.objectContaining({ reason: 'review_bucket', flags: ['--bucket'] })
      ])
    }), expect.objectContaining({ stage: 'bootstrap' }));
  });

  it('batch-initializes discovered components with include/default filtering', async () => {
    mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
    mkdirSync(join(root, 'apps', 'api', 'src'), { recursive: true });
    mkdirSync(join(root, 'services', 'worker', 'src'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces: ['apps/*', 'services/*'] }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'package.json'), JSON.stringify({ dependencies: { vite: '^5.0.0' } }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'export default {}\n');
    writeFileSync(join(root, 'apps', 'api', 'package.json'), JSON.stringify({ dependencies: { hono: '^4.0.0' } }, null, 2));
    writeFileSync(join(root, 'apps', 'api', 'src', 'index.ts'), 'export const handler = () => {};\n');
    writeFileSync(join(root, 'services', 'worker', 'package.json'), JSON.stringify({ dependencies: { bullmq: '^5.0.0' } }, null, 2));
    writeFileSync(join(root, 'services', 'worker', 'src', 'worker.ts'), 'export const handler = () => {};\n');

    const cli = await createCli();
    await getCommandAction(cli, 'bootstrap')({
      allDiscovered: true,
      include: 'api,web',
      defaultComponent: 'api',
      apply: true
    });

    const project = JSON.parse(readFileSync(join(root, '.licell', 'project.json'), 'utf-8'));
    const state = JSON.parse(readFileSync(join(root, '.licell', 'state.json'), 'utf-8'));
    expect(project.defaultComponent).toBe('api');
    expect(Object.keys(project.components).sort()).toEqual(['api', 'web']);
    expect(project.components.web.deployType).toBe('static');
    expect(project.components.api.deployTarget.function).toContain('-api');
    expect(state.defaultComponent).toBe('api');
    expect(state.bootstrap).toEqual(expect.objectContaining({
      mode: 'batch',
      selectedComponents: ['api', 'web'],
      skippedComponents: ['worker'],
      defaultComponent: 'api'
    }));
    expect(Object.keys(state.components).sort()).toEqual(['api', 'web']);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'batch',
      applied: true,
      defaultComponent: 'api',
      components: expect.arrayContaining([
        expect.objectContaining({
          component: 'api',
          refinements: expect.arrayContaining([
            expect.objectContaining({ reason: 'review_function' }),
            expect.objectContaining({ reason: 'configure_alias' })
          ])
        }),
        expect.objectContaining({
          component: 'web',
          refinements: expect.arrayContaining([
            expect.objectContaining({ reason: 'review_bucket' })
          ])
        })
      ]),
      skipped: expect.arrayContaining([
        expect.objectContaining({ component: 'worker', reason: 'excluded_by_user' })
      ]),
      unresolved: expect.arrayContaining([
        expect.objectContaining({ component: 'api', field: 'route.domain' }),
        expect.objectContaining({ component: 'web', field: 'route.domain' })
      ])
    }), expect.objectContaining({ stage: 'bootstrap' }));
  });

  it('supports dry-run batch bootstrap without writing files', async () => {
    mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces: ['apps/*'] }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'package.json'), JSON.stringify({ dependencies: { vite: '^5.0.0' } }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'export default {}\n');

    const cli = await createCli();
    await getCommandAction(cli, 'bootstrap')({ allDiscovered: true, dryRun: true });

    expect(() => readFileSync(join(root, '.licell', 'project.json'), 'utf-8')).toThrow();
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'batch',
      applied: false,
      dryRun: true
    }), expect.objectContaining({ stage: 'bootstrap' }));
  });
});
