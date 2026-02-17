import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { ensurePython313RuntimeExecutables } from '../utils/python313-runtime';

describe('ensurePython313RuntimeExecutables', () => {
  it('sets python bin files mode to 755', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-python313-perm-'));
    try {
      const runtimeDir = join(root, 'cpython-3.13.12+20260211-x86_64-unknown-linux-gnu-install_only_stripped');
      const binDir = join(runtimeDir, 'python', 'bin');
      const python = join(binDir, 'python3.13');
      const pip = join(binDir, 'pip3.13');
      mkdirSync(binDir, { recursive: true });
      writeFileSync(python, '#!/usr/bin/env python3\n');
      writeFileSync(pip, '#!/usr/bin/env python3\n');
      chmodSync(python, 0o644);
      chmodSync(pip, 0o600);

      ensurePython313RuntimeExecutables(runtimeDir);

      expect(statSync(python).mode & 0o777).toBe(0o755);
      expect(statSync(pip).mode & 0o777).toBe(0o755);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('is no-op when python/bin does not exist', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-python313-perm-empty-'));
    try {
      expect(() => ensurePython313RuntimeExecutables(root)).not.toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
