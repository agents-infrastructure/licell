import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { vendorPythonDependencies, type VendorPythonRuntime } from '../../utils/python-deps';

const PYTHON_COPY_IGNORED_DIRS = new Set([
  '.git', '.github', '.licell', '.ali', '.tmp-build',
  '.pytest_cache', '__pycache__', 'node_modules',
  '.venv', 'venv', 'dist', 'coverage'
]);
const PYTHON_INCLUDE_FILES = new Set([
  'requirements.txt', 'requirements-dev.txt', 'pyproject.toml',
  'poetry.lock', 'pipfile', 'pipfile.lock'
]);

export function findFirstJsOutput(dir: string): string | null {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      const nested = findFirstJsOutput(fullPath);
      if (nested) return nested;
      continue;
    }
    if (fullPath.endsWith('.js')) return fullPath;
  }
  return null;
}

export function hasPythonHandlerSymbol(source: string) {
  return /^\s*(async\s+)?def\s+handler\s*\(/m.test(source);
}

export function hasNodeHandlerExport(source: string) {
  const checks = [
    /\bexport\s+(?:async\s+)?function\s+handler\b/,
    /\bexport\s+(?:const|let|var)\s+handler\b/,
    /\bexport\s*\{\s*handler(?:\s+as\s+\w+)?\s*\}/,
    /\bexport\s*\{\s*default\s+as\s+handler\s*\}/,
    /\bmodule\.exports\.handler\s*=/,
    /\bexports\.handler\s*=/,
    /\bmodule\.exports\s*=\s*\{[\s\S]*\bhandler\b[\s\S]*\}/
  ];
  return checks.some((pattern) => pattern.test(source));
}

export function hasNodeDefaultExport(source: string) {
  const checks = [
    /\bexport\s+default\b/,
    /\bexports\.default\s*=/
  ];
  return checks.some((pattern) => pattern.test(source));
}

function readEntrypointSource(entryFile: string) {
  try {
    return readFileSync(entryFile, 'utf8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`读取入口文件失败: ${entryFile}\n${message}`);
  }
}

export function validateRuntimeEntrypoint(entryFile: string, runtime: string) {
  if (runtime === 'docker') return;

  if (runtime.startsWith('python')) {
    if (!entryFile.toLowerCase().endsWith('.py')) {
      throw new Error(`Python runtime=${runtime} 要求入口文件为 .py，当前为: ${entryFile}`);
    }
    const source = readEntrypointSource(entryFile);
    if (hasPythonHandlerSymbol(source)) return;
    throw new Error(
      `Python 入口文件缺少 handler 函数: ${entryFile}\n` +
      '请导出可调用函数，例如:\n' +
      'def handler(event, context):\n' +
      '  return {"statusCode": 200, "body": "ok"}'
    );
  }

  if (!runtime.startsWith('nodejs')) return;
  const source = readEntrypointSource(entryFile);
  if (runtime === 'nodejs22') {
    if (hasNodeHandlerExport(source) || hasNodeDefaultExport(source)) return;
    throw new Error(
      `Node 入口文件缺少导出函数: ${entryFile}\n` +
      'runtime=nodejs22 需导出 handler 或 default 函数。'
    );
  }
  if (hasNodeHandlerExport(source)) return;
  throw new Error(
    `Node 入口文件缺少 handler 导出: ${entryFile}\n` +
    'runtime=nodejs20 需导出 handler(event, context) 函数。'
  );
}

function shouldCopyPythonFile(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.endsWith('.py')) return true;
  const fileName = normalized.split('/').pop()?.toLowerCase() || '';
  return PYTHON_INCLUDE_FILES.has(fileName);
}

function copyPythonProjectFiles(sourceRoot: string, targetRoot: string, relativeDir = '') {
  const currentDir = relativeDir ? join(sourceRoot, relativeDir) : sourceRoot;
  for (const entry of readdirSync(currentDir)) {
    const entryLower = entry.toLowerCase();
    if (PYTHON_COPY_IGNORED_DIRS.has(entryLower)) continue;
    const nextRelative = relativeDir ? `${relativeDir}/${entry}` : entry;
    const sourcePath = join(sourceRoot, nextRelative);
    const stats = statSync(sourcePath);
    if (stats.isDirectory()) {
      copyPythonProjectFiles(sourceRoot, targetRoot, nextRelative);
      continue;
    }
    if (!stats.isFile()) continue;
    if (!shouldCopyPythonFile(nextRelative)) continue;
    const targetPath = join(targetRoot, nextRelative);
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}

export async function preparePythonEntrypoint(entryFile: string, outdir: string, runtime: VendorPythonRuntime) {
  const normalizedEntry = entryFile.replace(/\\/g, '/');
  if (!normalizedEntry.endsWith('.py')) {
    throw new Error('Python runtime 要求入口文件为 .py（并导出 handler 函数）');
  }
  copyPythonProjectFiles(process.cwd(), outdir);
  await vendorPythonDependencies({ runtime, sourceRoot: process.cwd(), outdir });
  const copiedEntry = join(outdir, normalizedEntry);
  if (!existsSync(copiedEntry)) {
    throw new Error(`Python 入口文件未打包进部署产物: ${normalizedEntry}`);
  }
  return normalizedEntry;
}
