import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { normalizeLicellStateFile, readLicellState, setLicellBootstrapSelection, updateLicellComponentState } from '../utils/project-state';

describe('project state helpers', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-state-'));
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
          route: { domain: 'www.example.com', ssl: true }
        }
      }
    }, null, 2));
    process.chdir(root);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
  });

  it('normalizes raw state payloads', () => {
    expect(normalizeLicellStateFile({
      bootstrap: {
        mode: 'batch',
        selectedComponents: ['web', 'api'],
        skippedComponents: ['worker'],
        defaultComponent: 'web'
      },
      components: { web: { route: { domain: 'WWW.EXAMPLE.COM', ssl: 'true' } } }
    })).toEqual({
      schemaVersion: 1,
      bootstrap: {
        mode: 'batch',
        selectedComponents: ['web', 'api'],
        skippedComponents: ['worker'],
        defaultComponent: 'web'
      },
      components: {
        web: {
          route: {
            domain: 'www.example.com',
            ssl: true
          }
        }
      }
    });
  });

  it('updates component state and writes state.json', () => {
    const next = updateLicellComponentState({
      resources: {
        bucket: { name: 'demo-web', region: 'cn-hangzhou' }
      },
      route: {
        domain: 'www.example.com',
        url: 'https://www.example.com',
        ssl: true
      },
      liveRevision: {
        commitSha: 'abc123',
        deployedAt: '2026-04-15T00:00:00.000Z'
      }
    }, { cwd: root, component: 'web' });

    expect(next.defaultComponent).toBe('web');
    expect(readLicellState(root).components.web.route?.url).toBe('https://www.example.com');
    const payload = JSON.parse(readFileSync(join(root, '.licell', 'state.json'), 'utf-8'));
    expect(payload.components.web.resources.bucket.name).toBe('demo-web');
  });

  it('persists bootstrap selection metadata for downstream ci generation', () => {
    const next = setLicellBootstrapSelection({
      mode: 'batch',
      selectedComponents: ['web'],
      skippedComponents: ['api'],
      defaultComponent: 'web'
    }, root);

    expect(next.bootstrap).toEqual(expect.objectContaining({
      mode: 'batch',
      selectedComponents: ['web'],
      skippedComponents: ['api'],
      defaultComponent: 'web'
    }));
    expect(readLicellState(root).bootstrap?.selectedComponents).toEqual(['web']);
  });

  it('preserves bootstrap selection metadata when component state is updated later', () => {
    setLicellBootstrapSelection({
      mode: 'batch',
      selectedComponents: ['web'],
      skippedComponents: ['api'],
      defaultComponent: 'web'
    }, root);

    const next = updateLicellComponentState({
      route: {
        url: 'https://www.example.com',
        ssl: true
      }
    }, { cwd: root, component: 'web' });

    expect(next.bootstrap).toEqual(expect.objectContaining({
      mode: 'batch',
      selectedComponents: ['web'],
      skippedComponents: ['api'],
      defaultComponent: 'web'
    }));
  });

  it('allows later bootstrap runs to replace the persisted default component', () => {
    setLicellBootstrapSelection({
      mode: 'batch',
      selectedComponents: ['web'],
      defaultComponent: 'web'
    }, root);

    const next = setLicellBootstrapSelection({
      mode: 'batch',
      selectedComponents: ['api', 'web'],
      defaultComponent: 'api'
    }, root);

    expect(next.defaultComponent).toBe('api');
    expect(next.bootstrap?.defaultComponent).toBe('api');
  });
});
