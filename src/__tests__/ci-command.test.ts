import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs';
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
  const { registerCiCommands } = await import('../commands/ci');
  registerCiCommands(cli);
  return cli;
}

function getCommandAction(cli: Awaited<ReturnType<typeof createCli>>, name: string) {
  const command = cli.commands.find((item) => item.name === name);
  if (!command?.commandAction) throw new Error(`command not found: ${name}`);
  return command.commandAction;
}

describe('ci init commands', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-ci-'));
    previousCwd = process.cwd();
    mkdirSync(join(root, '.licell'), { recursive: true });
    writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      schemaVersion: 3,
      defaultComponent: 'web',
      components: {
        web: {
          path: '.',
          appName: 'demo-web',
          deployType: 'static',
          artifact: { kind: 'directory', path: 'dist' },
          deployTarget: { service: 'oss-static', bucket: 'demo-web' },
          route: { domain: 'www.example.com', ssl: true, cdn: true }
        },
        api: {
          path: 'apps/api',
          appName: 'demo-api',
          deployType: 'api',
          artifact: { kind: 'source', entry: 'src/index.ts' },
          deployTarget: { service: 'fc-http', function: 'demo-api', runtime: 'nodejs22' },
          route: { ssl: true }
        }
      }
    }, null, 2));
    writeFileSync(join(root, '.licell', 'state.json'), JSON.stringify({
      schemaVersion: 1,
      defaultComponent: 'web',
      bootstrap: {
        mode: 'batch',
        selectedComponents: ['web'],
        skippedComponents: ['api'],
        defaultComponent: 'web'
      },
      components: {}
    }, null, 2));
    process.chdir(root);
    emitCommandResultMock.mockReset();
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('generates and writes a github deploy-only workflow', async () => {
    const cli = await createCli();

    await getCommandAction(cli, 'ci init github')({ apply: true });

    const workflow = readFileSync(join(root, '.github', 'workflows', 'licell-deploy.yml'), 'utf-8');
    expect(workflow).toContain('# No additional licell bootstrap refinements detected from the current project config.');
    expect(workflow).toContain('npx licell@latest deploy --component web --output json');
    expect(workflow).not.toContain('npx licell@latest deploy --component api --output json');
    expect(workflow).toContain('TODO: Ensure the deploy artifact');
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'github',
      path: '.github/workflows/licell-deploy.yml',
      applied: true,
      selectionSource: 'bootstrap',
      selectedComponents: ['web'],
      skippedComponents: ['api'],
      requiredSecrets: ['LICELL_ACCOUNT_ID', 'LICELL_AK', 'LICELL_SK', 'LICELL_REGION']
    }), expect.objectContaining({ stage: 'ci.init.github' }));
  });

  it('supports include/exclude filtering for github jobs', async () => {
    const cli = await createCli();

    await getCommandAction(cli, 'ci init github')({ apply: true, include: 'api' });

    const workflow = readFileSync(join(root, '.github', 'workflows', 'licell-deploy.yml'), 'utf-8');
    expect(workflow).toContain('deploy-api:');
    expect(workflow).not.toContain('deploy-web:');
    expect(emitCommandResultMock).toHaveBeenLastCalledWith(expect.objectContaining({
      provider: 'github',
      selectionSource: 'explicit-filter',
      selectedComponents: ['api'],
      skippedComponents: ['web']
    }), expect.objectContaining({ stage: 'ci.init.github' }));
  });

  it('generates and writes a gitlab deploy-only pipeline include file', async () => {
    const cli = await createCli();

    await getCommandAction(cli, 'ci init gitlab')({ apply: true });

    const pipeline = readFileSync(join(root, '.gitlab-ci.licell.yml'), 'utf-8');
    expect(pipeline).toContain('# No additional licell bootstrap refinements detected from the current project config.');
    expect(pipeline).toContain("# Include this file from your main `.gitlab-ci.yml`");
    expect(pipeline).toContain('the deploy job needs a real Docker daemon');
    expect(pipeline).toContain('prefer mounting the host Docker socket');
    expect(pipeline).toContain('`privileged = true`');
    expect(pipeline).toContain("deploy:web:");
    expect(pipeline).not.toContain("deploy:api:");
    expect(pipeline).toContain("when: manual");
    expect(pipeline).toContain('npx licell@latest deploy --component web --output json');
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'gitlab',
      path: '.gitlab-ci.licell.yml',
      applied: true,
      selectionSource: 'bootstrap',
      selectedComponents: ['web'],
      skippedComponents: ['api'],
      requiredSecrets: ['LICELL_ACCOUNT_ID', 'LICELL_AK', 'LICELL_SK', 'LICELL_REGION']
    }), expect.objectContaining({ stage: 'ci.init.gitlab' }));
  });

  it('supports include/exclude filtering for gitlab jobs', async () => {
    const cli = await createCli();

    await getCommandAction(cli, 'ci init gitlab')({ apply: true, include: 'api' });

    const pipeline = readFileSync(join(root, '.gitlab-ci.licell.yml'), 'utf-8');
    expect(pipeline).toContain('deploy:api:');
    expect(pipeline).not.toContain('deploy:web:');
    expect(emitCommandResultMock).toHaveBeenLastCalledWith(expect.objectContaining({
      provider: 'gitlab',
      selectionSource: 'explicit-filter',
      selectedComponents: ['api'],
      skippedComponents: ['web']
    }), expect.objectContaining({ stage: 'ci.init.gitlab' }));
  });

  it('falls back to workspace deployables when bootstrap selection is stale', async () => {
    writeFileSync(join(root, '.licell', 'state.json'), JSON.stringify({
      schemaVersion: 1,
      defaultComponent: 'web',
      bootstrap: {
        mode: 'batch',
        selectedComponents: ['legacy-web'],
        defaultComponent: 'legacy-web'
      },
      components: {}
    }, null, 2));

    const cli = await createCli();
    await getCommandAction(cli, 'ci init github')({ apply: true });

    const workflow = readFileSync(join(root, '.github', 'workflows', 'licell-deploy.yml'), 'utf-8');
    expect(workflow).toContain('deploy-web:');
    expect(workflow).toContain('deploy-api:');
    expect(emitCommandResultMock).toHaveBeenLastCalledWith(expect.objectContaining({
      provider: 'github',
      selectionSource: 'workspace',
      selectedComponents: ['api', 'web'],
      skippedComponents: []
    }), expect.objectContaining({ stage: 'ci.init.github' }));
  });
});
