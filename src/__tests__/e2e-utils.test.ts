import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  buildE2eManagedBucketName,
  buildE2eManagedDomain,
  compactE2eToken,
  ensureEmptyOrMissingDir,
  generateE2eRunId,
  getE2eManifestPath,
  hasSuccessfulE2eStep,
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

  it('builds compact tokens and managed resource names', () => {
    expect(compactE2eToken('20260309-010802-2466')).toBe('202603090108022466');
    expect(buildE2eManagedBucketName('1494123412341234', '20260309-010802-2466', 'oss')).toBe('licell-oss-2603090108022466-1494');
    expect(buildE2eManagedDomain('bazhuayu.xyz', '20260309-010802-2466', 'static-bind')).toBe('static-bind-202603090108022466.bazhuayu.xyz');
  });

  it('caps managed domain labels to 63 chars', () => {
    const domain = buildE2eManagedDomain('bazhuayu.xyz', '20260309-010802-2466', 'x'.repeat(80));
    const [label] = domain.split('.');
    expect(label.length).toBeLessThanOrEqual(63);
    expect(domain.endsWith('.bazhuayu.xyz')).toBe(true);
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
        region: 'cn-shanghai',
        resources: {
          dnsRecordIds: ['123'],
          managedBuckets: ['licell-oss-demo-1494'],
          managedDomains: [{ workflow: 'oss', domain: 'oss-demo.bazhuayu.xyz', bucket: 'licell-oss-demo-1494' }]
        },
        steps: []
      };
      const path = saveE2eManifest(manifest, root);
      expect(path).toBe(getE2eManifestPath(manifest.runId, root));
      const loaded = loadE2eManifest(manifest.runId, root);
      expect(loaded?.runId).toBe(manifest.runId);
      expect(loaded?.region).toBe('cn-shanghai');
      expect(loaded?.resources.managedBuckets).toEqual(['licell-oss-demo-1494']);
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

  it('detects whether e2e steps succeeded', () => {
    expect(hasSuccessfulE2eStep({ steps: [{ name: 'deploy-api', status: 'ok', startedAt: 'a', endedAt: 'b' }] } as never, ['deploy-api'])).toBe(true);
    expect(hasSuccessfulE2eStep({ steps: [{ name: 'deploy-api', status: 'failed', startedAt: 'a', endedAt: 'b' }] } as never, ['deploy-api'])).toBe(false);
    expect(hasSuccessfulE2eStep({ steps: [{ name: 'deploy-static-preview', status: 'ok', startedAt: 'a', endedAt: 'b' }] } as never, ['deploy-api-preview', 'deploy-static-preview'])).toBe(true);
  });

  it('resolves self cli invocation for script mode and binary mode', () => {
    const script = '/repo/src/cli.ts';
    const scriptInvocation = resolveSelfCliInvocation(
      ['node', 'src/cli.ts', 'e2e', 'run'],
      '/usr/local/bin/node',
      ['--require', '/tmp/tsx/preflight.cjs', '--import', 'file:///tmp/tsx/loader.mjs'],
      '/repo',
      (path) => path === script
    );
    expect(scriptInvocation).toEqual({
      command: '/usr/local/bin/node',
      prefixArgs: ['--require', '/tmp/tsx/preflight.cjs', '--import', 'file:///tmp/tsx/loader.mjs', '/repo/src/cli.ts']
    });

    const binaryInvocation = resolveSelfCliInvocation(
      ['/usr/local/bin/licell', 'e2e', 'run'],
      '/usr/local/bin/licell',
      [],
      '/repo',
      () => false
    );
    expect(binaryInvocation).toEqual({
      command: '/usr/local/bin/licell',
      prefixArgs: []
    });
  });

  it('resolves tsx tsconfig path to an absolute env override', () => {
    const previous = process.env.TSX_TSCONFIG_PATH;
    process.env.TSX_TSCONFIG_PATH = 'tsconfig.json';
    try {
      const invocation = resolveSelfCliInvocation(
        ['node', 'src/cli.ts', 'e2e', 'run'],
        '/usr/local/bin/node',
        ['--require', '/tmp/tsx/preflight.cjs'],
        '/repo',
        (path) => path === '/repo/src/cli.ts'
      );
      expect(invocation.env).toEqual({
        TSX_TSCONFIG_PATH: '/repo/tsconfig.json'
      });
    } finally {
      if (previous === undefined) {
        delete process.env.TSX_TSCONFIG_PATH;
      } else {
        process.env.TSX_TSCONFIG_PATH = previous;
      }
    }
  });
});
