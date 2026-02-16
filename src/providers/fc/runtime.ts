import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { type ProjectNetworkConfig } from '../../utils/config';
import { vendorPythonDependencies, type VendorPythonRuntime } from '../../utils/python-deps';
import { resolveProvidedNetwork } from '../vpc';
import { getRuntime, getSupportedRuntimeNames, type ResolvedRuntimeConfig } from './runtime-handler';
import './runtimes';

export type { ResolvedRuntimeConfig } from './runtime-handler';

const PYTHON_COPY_IGNORED_DIRS = new Set([
  '.git', '.github', '.licell', '.ali', '.tmp-build',
  '.pytest_cache', '__pycache__', 'node_modules',
  '.venv', 'venv', 'dist', 'coverage'
]);
const PYTHON_INCLUDE_FILES = new Set([
  'requirements.txt', 'requirements-dev.txt', 'pyproject.toml',
  'poetry.lock', 'pipfile', 'pipfile.lock'
]);

type ResolveNetworkLike = (options: { vpcId: string; vswId: string }) => Promise<{ sgId?: string }>;

export async function resolveFunctionVpcConfig(
  network: ProjectNetworkConfig | undefined,
  resolveNetwork: ResolveNetworkLike = resolveProvidedNetwork
) {
  if (!network) return undefined;
  const vpcId = network.vpcId?.trim();
  const vswId = network.vswId?.trim();
  if (!vpcId || !vswId) return undefined;

  let securityGroupId = network.sgId?.trim();
  if (!securityGroupId) {
    const resolved = await resolveNetwork({ vpcId, vswId });
    securityGroupId = resolved.sgId?.trim();
  }

  const vpcConfig: {
    vpcId: string;
    vSwitchIds: string[];
    securityGroupId?: string;
  } = { vpcId, vSwitchIds: [vswId] };
  if (securityGroupId) vpcConfig.securityGroupId = securityGroupId;
  return vpcConfig;
}

export function normalizeFcRuntime(input: string): string {
  const value = input.trim().toLowerCase();
  const supported = getSupportedRuntimeNames();
  if (supported.includes(value)) return value;
  throw new Error(`函数运行时仅支持: ${supported.join(', ')}`);
}

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

export async function prepareBootFile(entryFile: string, outdir: string, runtime: string) {
  return getRuntime(runtime).prepareBootFile(entryFile, outdir);
}

export async function resolveRuntimeConfig(runtime: string, outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
  return getRuntime(runtime).resolveConfig(outdir, bootFile);
}

export function buildUnsupportedRuntimeMessage(runtime: string) {
  try {
    return getRuntime(runtime).unsupportedMessage;
  } catch {
    return `当前地域暂不支持 runtime=${runtime}。请改用 nodejs20 后重试。`;
  }
}

export function isInvalidRuntimeValueError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return code === 'InvalidArgument' && message.includes('Runtime is set to an invalid value');
}

export function isRuntimeChangeNotSupportedError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return code === 'InvalidArgument' && message.toLowerCase().includes('change of runtime');
}
