import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { ensureNode22RuntimeExecutable } from '../utils/node22-runtime';

describe('ensureNode22RuntimeExecutable', () => {
  it('sets node binary mode to 755', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-node22-perm-'));
    try {
      const runtimeDir = join(root, 'node-v22.22.0-linux-x64');
      const binary = join(runtimeDir, 'bin', 'node');
      mkdirSync(join(runtimeDir, 'bin'), { recursive: true });
      writeFileSync(binary, '#!/usr/bin/env node\n');
      chmodSync(binary, 0o644);

      ensureNode22RuntimeExecutable(runtimeDir);

      expect(statSync(binary).mode & 0o777).toBe(0o755);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('is no-op when node binary does not exist', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-node22-perm-empty-'));
    try {
      expect(() => ensureNode22RuntimeExecutable(root)).not.toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
