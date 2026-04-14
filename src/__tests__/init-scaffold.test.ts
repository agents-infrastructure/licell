import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, expect, it } from 'vitest';
import {
  deriveDefaultAppName,
  detectWorkspaceTemplateAndRuntime,
  getScaffoldFiles,
  isWorkspaceEffectivelyEmpty,
  resolveInitRuntime,
  templateForRuntime,
  validateAppName,
  writeScaffoldFiles
} from '../utils/init-scaffold';

describe('init scaffold', () => {
  it('maps runtime to scaffold template', () => {
    expect(templateForRuntime('nodejs20')).toBe('node');
    expect(templateForRuntime('nodejs22')).toBe('node');
    expect(templateForRuntime('python3.12')).toBe('python');
    expect(templateForRuntime('python3.13')).toBe('python');
    expect(templateForRuntime('docker')).toBe('docker');
  });

  it('resolves default runtime', () => {
    expect(resolveInitRuntime()).toEqual({ template: 'node', runtime: 'nodejs20' });
  });

  it('resolves explicit runtime values', () => {
    expect(resolveInitRuntime('nodejs22')).toEqual({ template: 'node', runtime: 'nodejs22' });
    expect(resolveInitRuntime('python3.13')).toEqual({ template: 'python', runtime: 'python3.13' });
    expect(resolveInitRuntime('docker')).toEqual({ template: 'docker', runtime: 'docker' });
  });

  it('injects runtime default into generated scaffold', () => {
    expect(getScaffoldFiles('node', 'nodejs22').find((f) => f.path === 'src/app.ts')?.content).toContain("'nodejs22'");
    expect(getScaffoldFiles('python', 'python3.13').find((f) => f.path === 'src/main.py')?.content).toContain('or "python3.13"');
    expect(getScaffoldFiles('python', 'python3.12').find((f) => f.path === 'README.md')?.content).toContain('--runtime python3.12');
    expect(getScaffoldFiles('node', 'nodejs22', 'task').find((f) => f.path === 'src/task.ts')?.content).toContain("'nodejs22'");
    expect(getScaffoldFiles('python', 'python3.13', 'task').find((f) => f.path === 'src/task.py')?.content).toContain('or "python3.13"');
    expect(getScaffoldFiles('python', 'python3.13', 'task').find((f) => f.path === 'README.md')?.content).toContain('--kind task');
  });

  it('does not scaffold .gitignore entries for local licell state', () => {
    const gitignores = [
      getScaffoldFiles('node', 'nodejs22'),
      getScaffoldFiles('node', 'nodejs22', 'task'),
      getScaffoldFiles('python', 'python3.13'),
      getScaffoldFiles('python', 'python3.13', 'task'),
      getScaffoldFiles('docker')
    ].map((files) => files.find((file) => file.path === '.gitignore')?.content || '');

    for (const content of gitignores) {
      expect(content).toContain('.env');
      expect(content).not.toContain('.licell/');
      expect(content).not.toContain('.ali/');
    }
  });

  it('rejects unsupported runtime values', () => {
    expect(() => resolveInitRuntime('python')).toThrow('函数运行时仅支持');
    expect(() => templateForRuntime('node')).toThrow('不支持的 runtime');
    expect(() => getScaffoldFiles('docker', 'docker', 'task')).toThrow('docker task 脚手架暂未提供');
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
      const files = getScaffoldFiles('node', 'nodejs22');
      const result = writeScaffoldFiles(root, files, false);
      expect(result.written).toContain('src/app.ts');
      expect(result.written).toContain('src/index.ts');
      expect(readFileSync(join(root, 'src/app.ts'), 'utf-8')).toContain("framework: 'express'");
      expect(readFileSync(join(root, 'src/index.ts'), 'utf-8')).toContain('ensureBaseUrl');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes node task scaffold files', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-node-task-'));
    try {
      const files = getScaffoldFiles('node', 'nodejs22', 'task');
      const result = writeScaffoldFiles(root, files, false);
      expect(result.written).toContain('src/task.ts');
      expect(readFileSync(join(root, 'src/task.ts'), 'utf-8')).toContain('export async function handler');
      expect(readFileSync(join(root, 'README.md'), 'utf-8')).toContain('licell deploy --type task --runtime nodejs22 --entry src/task.ts --target preview');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes docker scaffold files with hono entry', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-docker-'));
    try {
      const files = getScaffoldFiles('docker');
      const result = writeScaffoldFiles(root, files, false);
      expect(result.written).toContain('Dockerfile');
      expect(result.written).toContain('src/index.ts');
      expect(readFileSync(join(root, 'src/index.ts'), 'utf-8')).toContain('from \'hono\'');
      expect(readFileSync(join(root, 'src/index.ts'), 'utf-8')).toContain('GET /healthz');
      expect(readFileSync(join(root, 'package.json'), 'utf-8')).toContain('"@hono/node-server"');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes python task scaffold files', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-python-task-'));
    try {
      const files = getScaffoldFiles('python', 'python3.13', 'task');
      const result = writeScaffoldFiles(root, files, false);
      expect(result.written).toContain('src/task.py');
      expect(readFileSync(join(root, 'src/task.py'), 'utf-8')).toContain('def handler(event: Any, context: Any):');
      expect(readFileSync(join(root, 'README.md'), 'utf-8')).toContain('licell task invoke --target preview --payload');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects empty workspace accurately', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-empty-'));
    try {
      expect(isWorkspaceEffectivelyEmpty(root)).toBe(true);
      writeFileSync(join(root, 'README.md'), '# demo\n');
      expect(isWorkspaceEffectivelyEmpty(root)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('detects template/runtime from existing workspace files', () => {
    const root = mkdtempSync(join(tmpdir(), 'licell-init-detect-'));
    try {
      writeFileSync(join(root, 'Dockerfile'), 'FROM node:20\n');
      expect(detectWorkspaceTemplateAndRuntime(root)).toEqual({ template: 'docker', runtime: 'docker' });

      rmSync(join(root, 'Dockerfile'));
      writeFileSync(join(root, 'requirements.txt'), 'requests\n');
      expect(detectWorkspaceTemplateAndRuntime(root)).toEqual({ template: 'python', runtime: 'python3.12' });

      rmSync(join(root, 'requirements.txt'));
      writeFileSync(join(root, 'package.json'), '{"name":"demo"}\n');
      expect(detectWorkspaceTemplateAndRuntime(root)).toEqual({ template: 'node', runtime: 'nodejs20' });

      rmSync(join(root, 'package.json'));
      mkdirSync(join(root, '.licell'), { recursive: true });
      writeFileSync(join(root, '.licell', 'project.json'), '{}\n');
      expect(detectWorkspaceTemplateAndRuntime(root)).toEqual({ template: 'node', runtime: 'nodejs20' });
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
      expect(readFileSync(target, 'utf-8')).toContain('from flask import Flask, jsonify, request');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
