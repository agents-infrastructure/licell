import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  buildOssObjectKey,
  collectOssUploadFiles,
  normalizeOssTargetDir,
  resolveOssContentType
} from '../providers/oss';

describe('oss upload helpers', () => {
  it('normalizes target directory', () => {
    expect(normalizeOssTargetDir('  /mysite//v2/  ')).toBe('mysite/v2');
    expect(normalizeOssTargetDir('')).toBeUndefined();
    expect(normalizeOssTargetDir('   ')).toBeUndefined();
    expect(normalizeOssTargetDir(undefined)).toBeUndefined();
  });

  it('builds object key in root prefix', () => {
    expect(buildOssObjectKey('index.html')).toBe('index.html');
    expect(buildOssObjectKey('\\assets\\app.js')).toBe('assets/app.js');
  });

  it('builds object key under target directory', () => {
    expect(buildOssObjectKey('assets/app.js', 'mysite')).toBe('mysite/assets/app.js');
    expect(buildOssObjectKey('assets/app.js', '/mysite/v2/')).toBe('mysite/v2/assets/app.js');
  });

  it('throws on empty object path', () => {
    expect(() => buildOssObjectKey('')).toThrow('对象路径不能为空');
    expect(() => buildOssObjectKey('/')).toThrow('对象路径不能为空');
    expect(() => buildOssObjectKey('.')).toThrow('对象路径不能为空');
  });

  it('collects files recursively and applies target dir', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-oss-upload-'));
    try {
      mkdirSync(join(root, 'assets'), { recursive: true });
      writeFileSync(join(root, 'index.html'), '<h1>hi</h1>\n');
      writeFileSync(join(root, 'assets', 'app.js'), 'console.log("ok")\n');

      const collected = collectOssUploadFiles(root, 'mysite');
      const objectNames = collected.files.map((item) => item.objectName).sort();
      expect(objectNames).toEqual([
        'mysite/assets/app.js',
        'mysite/index.html'
      ]);
      expect(collected.skippedSymlinkCount).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('skips symbolic links to avoid traversal/loop risks', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-oss-upload-link-'));
    try {
      mkdirSync(join(root, 'nested'), { recursive: true });
      writeFileSync(join(root, 'nested', 'real.txt'), 'hello\n');

      try {
        symlinkSync(join(root, 'nested', 'real.txt'), join(root, 'linked-file.txt'));
        symlinkSync(join(root, 'nested'), join(root, 'linked-dir'));
      } catch {
        // Some environments do not allow symlink creation for regular users.
        return;
      }

      const collected = collectOssUploadFiles(root, 'site');
      const objectNames = collected.files.map((item) => item.objectName).sort();
      expect(objectNames).toEqual(['site/nested/real.txt']);
      expect(collected.skippedSymlinkCount).toBeGreaterThanOrEqual(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolves content-type with charset for known types', () => {
    expect(resolveOssContentType('/tmp/index.html', 'site/index.html')).toBe('text/html; charset=utf-8');
    expect(resolveOssContentType('/tmp/main.js', 'site/main.js')).toBe('application/javascript; charset=utf-8');
    expect(resolveOssContentType('/tmp/styles.css', 'site/styles.css')).toBe('text/css; charset=utf-8');
  });

  it('falls back to application/octet-stream for unknown extensions', () => {
    expect(resolveOssContentType('/tmp/README', 'site/README')).toBe('application/octet-stream');
  });

  it('prefers objectName extension over sourceFile extension', () => {
    expect(resolveOssContentType('/tmp/data.bin', 'site/index.html')).toBe('text/html; charset=utf-8');
  });
});
