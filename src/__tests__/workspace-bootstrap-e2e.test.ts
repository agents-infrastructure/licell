import { beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { extractJsonRecordsFromOutput } from '../utils/output';

beforeAll(() => {
  const warmup = spawnSync('bun', ['x', 'tsx', '--version'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  if (warmup.status !== 0) {
    throw new Error(warmup.stderr || warmup.stdout || warmup.error?.message || 'tsx warmup failed');
  }
}, 30000);

function runCli(args: string[], cwd: string) {
  const result = spawnSync(
    'bun',
    [
      'x',
      'tsx',
      '--tsconfig',
      resolve(process.cwd(), 'tsconfig.json'),
      resolve(process.cwd(), 'src/cli.ts'),
      ...args
    ],
    {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' }
    }
  );

  const stdout = result.stdout || '';
  const records = extractJsonRecordsFromOutput(stdout) as Array<Record<string, any>>;
  return {
    status: result.status,
    stdout,
    stderr: result.stderr || '',
    error: result.error?.message,
    records,
    result: records.find((record) => record.type === 'result')
  };
}

describe('workspace bootstrap e2e', () => {
  it('drives a frontend + api monorepo through discover/bootstrap/plan/state/ci', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-workspace-e2e-'));
    try {
      mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
      mkdirSync(join(root, 'apps', 'api', 'src'), { recursive: true });
      writeFileSync(join(root, 'package.json'), JSON.stringify({
        name: 'licell-workspace-e2e',
        private: true,
        workspaces: ['apps/*']
      }, null, 2));
      writeFileSync(join(root, 'apps', 'web', 'package.json'), JSON.stringify({
        name: '@demo/web',
        private: true,
        dependencies: {
          react: '^18.0.0',
          vite: '^5.0.0'
        }
      }, null, 2));
      writeFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'export default {};\n');
      writeFileSync(join(root, 'apps', 'web', 'dist', 'index.html'), '<!doctype html><title>demo</title>\n');
      writeFileSync(join(root, 'apps', 'api', 'package.json'), JSON.stringify({
        name: '@demo/api',
        private: true,
        dependencies: {
          hono: '^4.0.0'
        }
      }, null, 2));
      writeFileSync(join(root, 'apps', 'api', 'src', 'index.ts'), 'export const handler = () => new Response("ok");\n');

      const discover = runCli(['workspace', 'discover', '--output', 'json'], root);
      expect(discover.error).toBeUndefined();
      expect(discover.status).toBe(0);
      expect(discover.stderr).toBe('');
      expect(discover.result?.stage).toBe('workspace.discover');
      expect(discover.result?.components.map((item: { component: string }) => item.component)).toEqual(['api', 'web']);

      const bootstrap = runCli(['bootstrap', '--all-discovered', '--default-component', 'web', '--apply', '--output', 'json'], root);
      expect(bootstrap.error).toBeUndefined();
      expect(bootstrap.status).toBe(0);
      expect(bootstrap.stderr).toBe('');
      expect(bootstrap.result?.stage).toBe('bootstrap');
      expect(bootstrap.result?.mode).toBe('batch');
      expect(bootstrap.result?.applied).toBe(true);
      expect(bootstrap.result?.defaultComponent).toBe('web');
      expect(bootstrap.result?.components.map((item: { component: string }) => item.component)).toEqual(['api', 'web']);
      expect(bootstrap.result?.unresolved).toEqual(expect.arrayContaining([
        expect.objectContaining({ component: 'api', field: 'route.domain' }),
        expect.objectContaining({ component: 'web', field: 'route.domain' })
      ]));

      const workspaceConfig = JSON.parse(readFileSync(join(root, '.licell', 'project.json'), 'utf8')) as Record<string, any>;
      expect(workspaceConfig.defaultComponent).toBe('web');
      expect(Object.keys(workspaceConfig.components).sort()).toEqual(['api', 'web']);
      expect(workspaceConfig.components.web.deployType).toBe('static');
      expect(workspaceConfig.components.api.deployType).toBe('api');

      const state = runCli(['state', 'show', '--output', 'json'], root);
      expect(state.error).toBeUndefined();
      expect(state.status).toBe(0);
      expect(state.stderr).toBe('');
      expect(state.result?.stage).toBe('state.show');
      expect(state.result?.defaultComponent).toBe('web');
      expect(state.result?.bootstrap).toEqual(expect.objectContaining({
        mode: 'batch',
        selectedComponents: ['api', 'web'],
        defaultComponent: 'web'
      }));

      const plan = runCli(['deploy', 'plan', '--output', 'json'], root);
      expect(plan.error).toBeUndefined();
      expect(plan.status).toBe(0);
      expect(plan.stderr).toBe('');
      expect(plan.result?.stage).toBe('deploy.plan');
      expect(plan.result?.selectionSource).toBe('bootstrap');
      expect(plan.result?.selectedComponents).toEqual(['api', 'web']);
      expect(plan.result?.components).toEqual(expect.arrayContaining([
        expect.objectContaining({
          component: 'api',
          deployType: 'api',
          command: 'licell deploy --component api --output json'
        }),
        expect.objectContaining({
          component: 'web',
          deployType: 'static',
          command: 'licell deploy --component web --output json'
        })
      ]));

      const githubCi = runCli(['ci', 'init', 'github', '--apply', '--output', 'json'], root);
      expect(githubCi.error).toBeUndefined();
      expect(githubCi.status).toBe(0);
      expect(githubCi.stderr).toBe('');
      expect(githubCi.result?.stage).toBe('ci.init.github');
      expect(githubCi.result?.selectionSource).toBe('bootstrap');
      expect(githubCi.result?.selectedComponents).toEqual(['api', 'web']);
      const workflow = readFileSync(join(root, '.github', 'workflows', 'licell-deploy.yml'), 'utf8');
      expect(workflow).toContain('deploy-api:');
      expect(workflow).toContain('deploy-web:');
      expect(workflow).toContain('npx licell@latest deploy --component api --output json');
      expect(workflow).toContain('npx licell@latest deploy --component web --output json');

      const gitlabCi = runCli(['ci', 'init', 'gitlab', '--apply', '--output', 'json'], root);
      expect(gitlabCi.error).toBeUndefined();
      expect(gitlabCi.status).toBe(0);
      expect(gitlabCi.stderr).toBe('');
      expect(gitlabCi.result?.stage).toBe('ci.init.gitlab');
      expect(gitlabCi.result?.selectionSource).toBe('bootstrap');
      expect(gitlabCi.result?.selectedComponents).toEqual(['api', 'web']);
      const pipeline = readFileSync(join(root, '.gitlab-ci.licell.yml'), 'utf8');
      expect(pipeline).toContain('deploy:api:');
      expect(pipeline).toContain('deploy:web:');
      expect(pipeline).toContain('npx licell@latest deploy --component api --output json');
      expect(pipeline).toContain('npx licell@latest deploy --component web --output json');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 45000);
});
