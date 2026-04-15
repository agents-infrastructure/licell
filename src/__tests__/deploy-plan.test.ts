import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Config } from '../utils/config';
import { buildDeployPlan } from '../utils/deploy-plan';

describe('deploy plan', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-plan-'));
    previousCwd = process.cwd();
    mkdirSync(join(root, '.licell'), { recursive: true });
    writeFileSync(join(root, '.licell', 'project.json'), JSON.stringify({
      schemaVersion: 3,
      defaultComponent: 'web',
      components: {
        web: {
          path: 'apps/web',
          appName: 'demo-web',
          deployType: 'static',
          artifact: { kind: 'directory', path: 'dist' },
          deployTarget: { service: 'oss-static', bucket: 'demo-web', region: 'cn-hangzhou' },
          route: { domain: 'www.example.com', cdn: true, ssl: true }
        },
        api: {
          path: 'apps/api',
          appName: 'demo-api',
          deployType: 'api',
          artifact: { kind: 'source', entry: 'src/index.ts' },
          deployTarget: { service: 'fc-http', function: 'demo-api', runtime: 'nodejs22', alias: 'prod', region: 'cn-hangzhou', vpc: true },
          route: { domain: 'api.example.com', ssl: true }
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
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('renders component plans from workspace config', () => {
    const snapshot = Config.getWorkspace();
    if (!snapshot) throw new Error('missing workspace snapshot');
    const plan = buildDeployPlan(snapshot);
    expect(plan.selectionSource).toBe('bootstrap');
    expect(plan.selectedComponents).toEqual(['web']);
    expect(plan.skippedComponents).toEqual(['api']);
    expect(plan.components).toHaveLength(1);
    expect(plan.components.find((item) => item.component === 'web')).toMatchObject({
      deployType: 'static',
      expectedUrl: 'https://www.example.com',
      target: { bucket: 'demo-web' }
    });
  });

  it('supports explicit include filters and overrides bootstrap selection', () => {
    const snapshot = Config.getWorkspace();
    if (!snapshot) throw new Error('missing workspace snapshot');
    const plan = buildDeployPlan(snapshot, { include: 'api' });
    expect(plan.selectionSource).toBe('explicit-filter');
    expect(plan.selectedComponents).toEqual(['api']);
    expect(plan.skippedComponents).toEqual(['web']);
    expect(plan.components.find((item) => item.component === 'api')).toMatchObject({
      deployType: 'api',
      command: 'licell deploy --component api --output json',
      target: { function: 'demo-api', alias: 'prod' }
    });
  });

  it('falls back to workspace deployables when bootstrap selection is stale', () => {
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

    const snapshot = Config.getWorkspace();
    if (!snapshot) throw new Error('missing workspace snapshot');
    const plan = buildDeployPlan(snapshot);
    expect(plan.selectionSource).toBe('workspace');
    expect(plan.selectedComponents).toEqual(['api', 'web']);
    expect(plan.skippedComponents).toEqual([]);
    expect(plan.components).toHaveLength(2);
  });
});
