import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { resolvePythonRequirementsPath, vendorPythonDependencies } from '../utils/python-deps';

function createTmpDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix));
}

describe('resolvePythonRequirementsPath', () => {
  it('picks requirements.txt when present', () => {
    const root = createTmpDir('aero-pyreq-');
    try {
      writeFileSync(join(root, 'requirements.txt'), 'requests==2.32.3\n');
      const resolved = resolvePythonRequirementsPath(root, {});
      expect(resolved).toBe(join(root, 'requirements.txt'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('respects ALI_PYTHON_REQUIREMENTS override', () => {
    const root = createTmpDir('aero-pyreq-');
    try {
      mkdirSync(join(root, 'deps'), { recursive: true });
      writeFileSync(join(root, 'deps', 'prod.txt'), 'httpx==0.28.1\n');
      const resolved = resolvePythonRequirementsPath(root, {
        ALI_PYTHON_REQUIREMENTS: 'deps/prod.txt'
      });
      expect(resolved).toBe(join(root, 'deps', 'prod.txt'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('throws when ALI_PYTHON_REQUIREMENTS points to missing file', () => {
    const root = createTmpDir('aero-pyreq-');
    try {
      expect(() =>
        resolvePythonRequirementsPath(root, {
          ALI_PYTHON_REQUIREMENTS: 'missing.txt'
        })
      ).toThrow('ALI_PYTHON_REQUIREMENTS 指定文件不存在');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('vendorPythonDependencies', () => {
  it('does nothing when no requirements file exists', async () => {
    const root = createTmpDir('aero-pydeps-');
    const outdir = join(root, 'out');
    mkdirSync(outdir, { recursive: true });
    let called = false;

    try {
      await vendorPythonDependencies({
        runtime: 'python3.12',
        sourceRoot: root,
        outdir,
        runCommand: () => {
          called = true;
          return { status: 0, stdout: '', stderr: '' };
        }
      });
      expect(called).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('uses manylinux wheel download/install flow by default', async () => {
    const root = createTmpDir('aero-pydeps-');
    const outdir = join(root, 'out');
    mkdirSync(outdir, { recursive: true });
    writeFileSync(join(root, 'requirements.txt'), 'requests==2.32.3\n');
    const calls: Array<{ command: string; args: string[] }> = [];

    try {
      await vendorPythonDependencies({
        runtime: 'python3.13',
        sourceRoot: root,
        outdir,
        runCommand: (command, args) => {
          calls.push({ command, args });
          return { status: 0, stdout: '', stderr: '' };
        }
      });
      expect(calls).toHaveLength(2);
      expect(calls[0].command).toBe('python3');
      expect(calls[0].args).toContain('download');
      expect(calls[0].args).toContain('manylinux2014_x86_64');
      expect(calls[0].args).toContain('3.13');
      expect(calls[0].args).not.toContain('--abi');
      expect(calls[1].args).toContain('install');
      expect(calls[1].args).toContain('--no-index');
      expect(calls[1].args).toContain('--platform');
      expect(calls[1].args).toContain('manylinux2014_x86_64');
      expect(calls[1].args).toContain('--python-version');
      expect(calls[1].args).toContain('3.13');
      expect(calls[1].args).toContain('--target');
      expect(calls[1].args).toContain(outdir);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('falls back to source install when wheel download fails and ALI_PYTHON_ALLOW_SOURCE=1', async () => {
    const root = createTmpDir('aero-pydeps-');
    const outdir = join(root, 'out');
    mkdirSync(outdir, { recursive: true });
    writeFileSync(join(root, 'requirements.txt'), 'example==1.0.0\n');
    let index = 0;
    const calls: Array<{ command: string; args: string[] }> = [];

    try {
      await vendorPythonDependencies({
        runtime: 'python3.12',
        sourceRoot: root,
        outdir,
        env: { ALI_PYTHON_ALLOW_SOURCE: '1' },
        runCommand: (command, args) => {
          calls.push({ command, args });
          index += 1;
          if (index === 1) {
            return { status: 1, stdout: '', stderr: 'no wheel' };
          }
          return { status: 0, stdout: '', stderr: '' };
        }
      });
      expect(calls).toHaveLength(2);
      expect(calls[0].args).toContain('download');
      expect(calls[1].args).toContain('install');
      expect(calls[1].args).not.toContain('--no-index');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('throws clear error when wheel download fails without fallback', async () => {
    const root = createTmpDir('aero-pydeps-');
    const outdir = join(root, 'out');
    mkdirSync(outdir, { recursive: true });
    writeFileSync(join(root, 'requirements.txt'), 'example==1.0.0\n');

    try {
      await expect(
        vendorPythonDependencies({
          runtime: 'python3.12',
          sourceRoot: root,
          outdir,
          runCommand: () => ({ status: 1, stdout: '', stderr: 'no wheel' })
        })
      ).rejects.toThrow('下载 Linux 兼容 Python 依赖失败');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
