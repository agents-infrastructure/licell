import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { describe, expect, it } from 'vitest';
import { packageCodeAsBase64 } from '../providers/fc/deploy';

function hasCommand(bin: string) {
  const res = spawnSync(bin, ['-v'], { stdio: 'ignore' });
  return res.status === 0;
}

describe('packageCodeAsBase64', () => {
  it('preserves executable mode for runtime binaries', () => {
    if (!hasCommand('zip') || !hasCommand('unzip')) return;

    const root = mkdtempSync(join(tmpdir(), 'licell-package-'));
    try {
      const outdir = join(root, 'out');
      const binDir = join(outdir, '.licell-runtime', 'node-v22.22.0-linux-x64', 'bin');
      const binaryPath = join(binDir, 'node');
      mkdirSync(binDir, { recursive: true });
      writeFileSync(binaryPath, '#!/usr/bin/env node\n');
      chmodSync(binaryPath, 0o755);

      const base64 = packageCodeAsBase64(outdir);
      const zipPath = join(root, 'code.zip');
      writeFileSync(zipPath, Buffer.from(base64, 'base64'));

      const extractDir = join(root, 'extract');
      mkdirSync(extractDir, { recursive: true });
      const unzipRes = spawnSync('unzip', ['-q', zipPath, '-d', extractDir], { encoding: 'utf8' });
      if (unzipRes.status !== 0) {
        throw new Error(unzipRes.stderr || unzipRes.stdout || 'unzip failed');
      }

      const unpackedBinary = join(extractDir, '.licell-runtime', 'node-v22.22.0-linux-x64', 'bin', 'node');
      expect(readFileSync(unpackedBinary, 'utf-8')).toContain('usr/bin/env node');
      expect(statSync(unpackedBinary).mode & 0o777).toBe(0o755);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
