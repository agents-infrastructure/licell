import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const roots: string[] = [];
const require = createRequire(import.meta.url);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('standalone OpenAPI runner bundle', () => {
  it('builds as CJS and reaches the managed-runner fallback without import.meta', async () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-runner-bundle-'));
    roots.push(root);
    const output = join(root, 'runner.cjs');
    const esbuild = resolve('node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
    const build = spawnSync(esbuild, [
      'src/providers/openapi/runner.ts',
      '--bundle',
      '--platform=node',
      '--target=node20',
      '--format=cjs',
      '--log-override:empty-import-meta=error',
      `--outfile=${output}`
    ], { cwd: resolve('.'), encoding: 'utf8' });

    expect(build.status, build.stderr).toBe(0);
    const bundled = require(output) as typeof import('../providers/openapi/runner');
    const managed = join(root, 'managed-aliyun');
    await expect(bundled.resolveAlicloudRunner(undefined, {
      env: { PATH: '' },
      ensureRunner: async () => managed
    })).resolves.toBe(managed);
  });
});
