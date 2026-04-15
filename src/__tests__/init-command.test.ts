import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const { emitCommandResultMock, emitCliErrorMock, emitCommandEventMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  emitCliErrorMock: vi.fn(),
  emitCommandEventMock: vi.fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  emitCliError: emitCliErrorMock,
  emitCommandEvent: emitCommandEventMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerInitCommand } = await import('../commands/init');
  registerInitCommand(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('init command', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-init-command-'));
    previousCwd = process.cwd();
    process.chdir(root);
    emitCommandResultMock.mockReset();
    emitCliErrorMock.mockReset();
    emitCommandEventMock.mockReset();
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('initializes a fresh local project without requiring --kind', async () => {
    const cli = await createCli();
    await getCommandAction(cli, 'init')({
      runtime: 'nodejs22',
      app: 'demo-init',
      yes: true
    });

    const project = JSON.parse(readFileSync(join(root, '.licell', 'project.json'), 'utf-8')) as Record<string, any>;
    expect(project.appName).toBe('demo-init');
    expect(project.deployType).toBe('api');
    expect(project.runtime).toBe('nodejs22');
    expect(emitCliErrorMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      runtime: 'nodejs22',
      kind: 'api',
      appName: 'demo-init'
    }));
  });

  it('ignores ancestor project config when bootstrapping a nested empty directory', async () => {
    mkdirSync(join(root, '.licell'), { recursive: true });
    writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      appName: 'ancestor-static',
      deployType: 'static'
    }, null, 2));
    const child = join(root, '.licell', 'e2e-work', 'nested-app');
    mkdirSync(child, { recursive: true });
    process.chdir(child);

    const cli = await createCli();
    await getCommandAction(cli, 'init')({
      runtime: 'nodejs22',
      app: 'nested-app',
      yes: true
    });

    const childProject = JSON.parse(readFileSync(join(child, '.licell', 'project.json'), 'utf-8')) as Record<string, any>;
    const ancestorProject = JSON.parse(readFileSync(join(root, '.licell', 'project.json'), 'utf-8')) as Record<string, any>;
    expect(childProject.appName).toBe('nested-app');
    expect(childProject.deployType).toBe('api');
    expect(ancestorProject.appName).toBe('ancestor-static');
    expect(ancestorProject.deployType).toBe('static');
    expect(emitCliErrorMock).not.toHaveBeenCalled();
  });
});
