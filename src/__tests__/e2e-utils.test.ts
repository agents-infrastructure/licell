import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  ensureEmptyOrMissingDir,
  generateE2eRunId,
  getE2eManifestPath,
  listE2eManifestRunIds,
  loadE2eManifest,
  normalizeE2eSuite,
  resolveSelfCliInvocation,
  saveE2eManifest,
  type E2eManifest
} from '../utils/e2e';

describe('e2e utils', () => {
  it('normalizes e2e suite', () => {
    expect(normalizeE2eSuite(undefined)).toBe('smoke');
    expect(normalizeE2eSuite('smoke')).toBe('smoke');
    expect(normalizeE2eSuite('full')).toBe('full');
    expect(() => normalizeE2eSuite('other')).toThrow('--suite 仅支持 smoke 或 full');
  });

  it('generates stable run id shape', () => {
    const runId = generateE2eRunId(new Date('2026-02-19T00:00:00.000Z'));
    expect(runId).toMatch(/^\d{8}-\d{6}-\d{4}$/);
  });

  it('saves/loads and lists manifests', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-e2e-utils-'));
    try {
      const manifest: E2eManifest = {
        runId: '20260219-000000-0001',
        suite: 'smoke',
        status: 'running',
        createdAt: '2026-02-19T00:00:00.000Z',
        updatedAt: '2026-02-19T00:00:00.000Z',
        projectRoot: root,
        workspaceDir: join(root, '.licell', 'e2e-work', '20260219-000000-0001'),
        target: 'preview',
        runtime: 'nodejs22',
        resources: {},
        steps: []
      };
      const path = saveE2eManifest(manifest, root);
      expect(path).toBe(getE2eManifestPath(manifest.runId, root));
      const loaded = loadE2eManifest(manifest.runId, root);
      expect(loaded?.runId).toBe(manifest.runId);
      expect(listE2eManifestRunIds(root)).toEqual([manifest.runId]);
      const raw = JSON.parse(readFileSync(path, 'utf8')) as E2eManifest;
      expect(raw.status).toBe('running');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('checks empty workspace constraint', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-e2e-empty-'));
    try {
      const dir = join(root, 'workspace');
      ensureEmptyOrMissingDir(dir);
      mkdirSync(dir, { recursive: true });
      ensureEmptyOrMissingDir(dir);
      writeFileSync(join(dir, 'file.txt'), 'x');
      expect(() => ensureEmptyOrMissingDir(dir)).toThrow('目录非空');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolves self cli invocation for script mode and binary mode', () => {
    const script = '/repo/src/cli.ts';
    const scriptInvocation = resolveSelfCliInvocation(
      ['bun', 'src/cli.ts', 'e2e', 'run'],
      '/usr/local/bin/bun',
      '/repo',
      (path) => path === script
    );
    expect(scriptInvocation).toEqual({
      command: '/usr/local/bin/bun',
      prefixArgs: ['/repo/src/cli.ts']
    });

    const binaryInvocation = resolveSelfCliInvocation(
      ['/usr/local/bin/licell', 'e2e', 'run'],
      '/usr/local/bin/licell',
      '/repo',
      () => false
    );
    expect(binaryInvocation).toEqual({
      command: '/usr/local/bin/licell',
      prefixArgs: []
    });
  });
});

