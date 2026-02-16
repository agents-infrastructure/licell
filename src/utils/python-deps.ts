import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { isAbsolute, join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { readLicellEnv } from './env';

const DEFAULT_REQUIREMENTS_FILES = [
  'requirements.txt',
  'requirements-prod.txt',
  'requirements.prod.txt',
  'requirements/production.txt'
];

export type VendorPythonRuntime = 'python3.12' | 'python3.13';

type RunCommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

type RunCommand = (
  command: string,
  args: string[],
  options: { cwd: string }
) => RunCommandResult;

export interface VendorPythonDependenciesOptions {
  runtime: VendorPythonRuntime;
  sourceRoot: string;
  outdir: string;
  env?: NodeJS.ProcessEnv;
  runCommand?: RunCommand;
}

function toOptionalString(input: unknown) {
  if (typeof input !== 'string') return undefined;
  const value = input.trim();
  return value.length > 0 ? value : undefined;
}

function isTruthy(input: unknown) {
  const value = toOptionalString(input)?.toLowerCase();
  if (!value) return false;
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function runCommandSync(command: string, args: string[], options: { cwd: string }): RunCommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error || undefined
  };
}

function formatCommandOutput(result: RunCommandResult) {
  const stderr = result.stderr.trim();
  if (stderr) return stderr;
  const stdout = result.stdout.trim();
  if (stdout) return stdout;
  return `exit=${result.status ?? 'unknown'}`;
}

function resolveRequirementsPathFromEnv(sourceRoot: string, env: NodeJS.ProcessEnv) {
  const override = toOptionalString(readLicellEnv(env, 'PYTHON_REQUIREMENTS'));
  if (!override) return null;
  const resolved = isAbsolute(override) ? override : resolve(sourceRoot, override);
  if (!existsSync(resolved) || !statSync(resolved).isFile()) {
    throw new Error(`LICELL_PYTHON_REQUIREMENTS 指定文件不存在: ${override}`);
  }
  return resolved;
}

export function resolvePythonRequirementsPath(sourceRoot: string, env: NodeJS.ProcessEnv = process.env) {
  const fromEnv = resolveRequirementsPathFromEnv(sourceRoot, env);
  if (fromEnv) return fromEnv;

  for (const relativePath of DEFAULT_REQUIREMENTS_FILES) {
    const fullPath = resolve(sourceRoot, relativePath);
    if (!existsSync(fullPath)) continue;
    if (!statSync(fullPath).isFile()) continue;
    return fullPath;
  }
  return null;
}

function resolveRuntimeWheelTarget(runtime: VendorPythonRuntime) {
  if (runtime === 'python3.12') {
    return { pythonVersion: '3.12' };
  }
  return { pythonVersion: '3.13' };
}

function runOrThrow(
  runCommand: RunCommand,
  command: string,
  args: string[],
  cwd: string,
  failMessage: string
) {
  const result = runCommand(command, args, { cwd });
  if (result.error) {
    throw new Error(`${failMessage}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${failMessage}: ${formatCommandOutput(result)}`);
  }
}

export async function vendorPythonDependencies(options: VendorPythonDependenciesOptions) {
  const env = options.env || process.env;
  if (isTruthy(readLicellEnv(env, 'PYTHON_SKIP_VENDOR'))) return;

  const requirementsPath = resolvePythonRequirementsPath(options.sourceRoot, env);
  if (!requirementsPath) return;

  const pythonInterpreter = toOptionalString(readLicellEnv(env, 'PYTHON_PIP')) || 'python3';
  const runCommand = options.runCommand || runCommandSync;
  const allowSourceInstall = isTruthy(readLicellEnv(env, 'PYTHON_ALLOW_SOURCE'));
  const { pythonVersion } = resolveRuntimeWheelTarget(options.runtime);
  const wheelTmpDir = mkdtempSync(join(tmpdir(), 'licell-pydeps-'));
  const wheelhouse = join(wheelTmpDir, 'wheelhouse');
  mkdirSync(wheelhouse, { recursive: true });

  try {
    const downloadArgs = [
      '-m',
      'pip',
      'download',
      '--disable-pip-version-check',
      '--dest',
      wheelhouse,
      '--requirement',
      requirementsPath,
      '--only-binary=:all:',
      '--platform',
      'manylinux2014_x86_64',
      '--implementation',
      'cp',
      '--python-version',
      pythonVersion
    ];

    const download = runCommand(pythonInterpreter, downloadArgs, { cwd: options.sourceRoot });
    if (download.error) {
      throw new Error(`准备 Python 依赖失败: ${download.error.message}`);
    }

    if (download.status !== 0) {
      if (!allowSourceInstall) {
        throw new Error(
          `下载 Linux 兼容 Python 依赖失败。请优先使用可用 manylinux wheel 的依赖，` +
            `或在 Linux CI 执行部署。若你接受本机编译依赖可设置 LICELL_PYTHON_ALLOW_SOURCE=1。` +
            ` 原因: ${formatCommandOutput(download)}`
        );
      }

      runOrThrow(
        runCommand,
        pythonInterpreter,
        [
          '-m',
          'pip',
          'install',
          '--disable-pip-version-check',
          '--no-cache-dir',
          '--no-input',
          '--no-compile',
          '--target',
          options.outdir,
          '--requirement',
          requirementsPath
        ],
        options.sourceRoot,
        '安装 Python 依赖失败'
      );
      return;
    }

    runOrThrow(
      runCommand,
      pythonInterpreter,
      [
        '-m',
        'pip',
        'install',
        '--disable-pip-version-check',
        '--no-cache-dir',
        '--no-input',
        '--no-compile',
        '--no-index',
        '--find-links',
        wheelhouse,
        '--only-binary=:all:',
        '--platform',
        'manylinux2014_x86_64',
        '--implementation',
        'cp',
        '--python-version',
        pythonVersion,
        '--target',
        options.outdir,
        '--requirement',
        requirementsPath
      ],
      options.sourceRoot,
      '安装 Python 依赖失败'
    );
  } finally {
    rmSync(wheelTmpDir, { recursive: true, force: true });
  }
}
