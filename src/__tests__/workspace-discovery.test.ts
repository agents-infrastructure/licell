import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { discoverWorkspaceComponents } from '../utils/workspace-discovery';

describe('workspace discovery', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-discover-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('discovers nested static and api candidates from a monorepo layout', () => {
    mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
    mkdirSync(join(root, 'apps', 'api', 'src'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ workspaces: ['apps/*'] }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'package.json'), JSON.stringify({
      name: '@demo/web',
      dependencies: { react: '^18.0.0', vite: '^5.0.0' },
      scripts: { build: 'vite build' }
    }, null, 2));
    writeFileSync(join(root, 'apps', 'web', 'vite.config.ts'), 'export default {}\n');
    writeFileSync(join(root, 'apps', 'api', 'package.json'), JSON.stringify({
      name: '@demo/api',
      dependencies: { hono: '^4.0.0' },
      scripts: { start: 'node dist/server.js' }
    }, null, 2));
    writeFileSync(join(root, 'apps', 'api', 'src', 'index.ts'), 'export const handler = () => {};\n');

    const result = discoverWorkspaceComponents(root);
    expect(result.components.map((item) => item.component)).toEqual(['api', 'web']);
    expect(result.components.find((item) => item.component === 'web')).toMatchObject({
      path: 'apps/web',
      type: 'static',
      artifact: { kind: 'directory', path: 'dist' },
      deployTarget: { service: 'oss-static', bucket: expect.stringContaining('-web') }
    });
    expect(result.components.find((item) => item.component === 'api')).toMatchObject({
      path: 'apps/api',
      type: 'api',
      artifact: { kind: 'source', entry: 'src/index.ts' },
      deployTarget: { service: 'fc-http', function: expect.stringContaining('-api') }
    });
  });

  it('assigns unique component names when duplicate leaf directories exist', () => {
    mkdirSync(join(root, 'apps', 'api', 'src'), { recursive: true });
    mkdirSync(join(root, 'services', 'api', 'src'), { recursive: true });
    writeFileSync(join(root, 'apps', 'api', 'src', 'index.ts'), 'export const handler = () => {};\n');
    writeFileSync(join(root, 'services', 'api', 'src', 'worker.ts'), 'export const handler = () => {};\n');
    writeFileSync(join(root, 'services', 'api', 'package.json'), JSON.stringify({
      name: '@demo/services-api',
      dependencies: { bullmq: '^5.0.0' }
    }, null, 2));

    const result = discoverWorkspaceComponents(root);
    expect(result.components.map((item) => item.component)).toEqual(['apps-api', 'services-api']);
    expect(result.components.find((item) => item.component === 'apps-api')).toMatchObject({
      path: 'apps/api',
      type: 'api'
    });
    expect(result.components.find((item) => item.component === 'services-api')).toMatchObject({
      path: 'services/api',
      type: 'task'
    });
  });
});
