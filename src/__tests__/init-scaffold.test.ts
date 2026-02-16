import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it } from 'vitest';
import {
  deriveDefaultAppName,
  getScaffoldFiles,
  normalizeInitTemplate,
  resolveInitTemplateAndRuntime,
  validateAppName,
  writeScaffoldFiles
} from '../utils/init-scaffold';

describe('init scaffold', () => {
  it('normalizes template aliases', () => {
    expect(normalizeInitTemplate('nodejs')).toBe('node');
    expect(normalizeInitTemplate('PY')).toBe('python');
  });

  it('resolves default template/runtime', () => {
    expect(resolveInitTemplateAndRuntime()).toEqual({ template: 'node', runtime: 'nodejs20' });
    expect(resolveInitTemplateAndRuntime('python')).toEqual({ template: 'python', runtime: 'python3.12' });
  });

  it('deduces template by runtime when template omitted', () => {
    expect(resolveInitTemplateAndRuntime(undefined, 'nodejs22')).toEqual({ template: 'node', runtime: 'nodejs22' });
    expect(resolveInitTemplateAndRuntime(undefined, 'python3.13')).toEqual({ template: 'python', runtime: 'python3.13' });
  });

  it('rejects mismatched template/runtime', () => {
    expect(() => resolveInitTemplateAndRuntime('node', 'python3.12')).toThrow('不匹配');
  });

  it('derives default app name from cwd', () => {
    expect(deriveDefaultAppName('/tmp/My App')).toBe('my-app');
  });

  it('validates app name format', () => {
    expect(validateAppName('my-app-01')).toBe('my-app-01');
    expect(() => validateAppName('My_App')).toThrow('应用名仅允许');
  });

  it('writes node scaffold files', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-node-'));
    try {
      const files = getScaffoldFiles('node');
      const result = writeScaffoldFiles(root, files, false);
      expect(result.written).toContain('src/index.ts');
      expect(readFileSync(join(root, 'src/index.ts'), 'utf-8')).toContain('Hello from Licell Node Scaffold');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('throws on conflicting existing file without force', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-conflict-'));
    try {
      const target = join(root, 'src/index.ts');
      writeScaffoldFiles(root, getScaffoldFiles('node'), false);
      writeFileSync(target, 'conflict content');
      expect(() => writeScaffoldFiles(root, getScaffoldFiles('node'), false)).toThrow('--force');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('overwrites conflicting file with force', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-force-'));
    try {
      const target = join(root, 'src/main.py');
      writeScaffoldFiles(root, getScaffoldFiles('python'), false);
      writeFileSync(target, 'print("old")\n');
      const result = writeScaffoldFiles(root, getScaffoldFiles('python'), true);
      expect(result.written).toContain('src/main.py');
      expect(readFileSync(target, 'utf-8')).toContain('Hello from Licell Python Scaffold');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
