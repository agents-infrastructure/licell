import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { copyNode22RuntimeSubset, ensureNode22RuntimeExecutable } from '../utils/node22-runtime';

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

describe('copyNode22RuntimeSubset', () => {
  it('copies only the embedded node binary and preserves executability', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-node22-copy-'));
    try {
      const sourceDir = join(root, 'source');
      const targetDir = join(root, 'target');
      const sourceBinary = join(sourceDir, 'bin', 'node');
      const extraFile = join(sourceDir, 'lib', 'node_modules', 'npm', 'package.json');
      mkdirSync(join(sourceDir, 'bin'), { recursive: true });
      mkdirSync(join(sourceDir, 'lib', 'node_modules', 'npm'), { recursive: true });
      writeFileSync(sourceBinary, '#!/usr/bin/env node\nconsole.log("ok");\n');
      writeFileSync(extraFile, '{"name":"npm"}\n');
      chmodSync(sourceBinary, 0o644);

      copyNode22RuntimeSubset(sourceDir, targetDir);

      const targetBinary = join(targetDir, 'bin', 'node');
      expect(readFileSync(targetBinary, 'utf8')).toContain('console.log("ok")');
      expect(statSync(targetBinary).mode & 0o777).toBe(0o755);
      expect(existsSync(join(targetDir, 'lib', 'node_modules', 'npm', 'package.json'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('throws when required runtime files are missing', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-node22-copy-missing-'));
    try {
      const sourceDir = join(root, 'source');
      mkdirSync(sourceDir, { recursive: true });
      expect(() => copyNode22RuntimeSubset(sourceDir, join(root, 'target'))).toThrow('缺少必要文件: bin/node');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
