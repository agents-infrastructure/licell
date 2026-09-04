import { createHash } from 'node:crypto';
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  open,
  readFile,
  rename,
  rm,
  writeFile
} from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import {
  ALICLOUD_RUNNER_MANIFEST,
  ALICLOUD_RUNNER_VERSION,
  type AlicloudRunnerArtifact
} from './runner-manifest';

const DOWNLOAD_TIMEOUT_MS = 120_000;
const LOCK_TIMEOUT_MS = 120_000;

export interface EnsureAlicloudRunnerOptions {
  platform?: NodeJS.Platform;
  arch?: string;
  installRoot?: string;
  fetchImpl?: typeof fetch;
  extractArchive?: (archivePath: string, targetDir: string) => Promise<void>;
  sleep?: (milliseconds: number) => Promise<void>;
  artifact?: AlicloudRunnerArtifact;
  version?: string;
}

function normalizedPlatform(platform: string = process.platform, arch: string = process.arch) {
  const normalizedArch = arch === 'x64' || arch === 'amd64'
    ? 'x64'
    : arch === 'arm64' || arch === 'aarch64'
      ? 'arm64'
      : arch;
  return `${platform}-${normalizedArch}`;
}

function artifactFor(platform: string = process.platform, arch: string = process.arch): AlicloudRunnerArtifact {
  const key = normalizedPlatform(platform, arch);
  const artifact = ALICLOUD_RUNNER_MANIFEST.artifacts[key as keyof typeof ALICLOUD_RUNNER_MANIFEST.artifacts];
  if (!artifact) throw new Error(`aliyun-cli runner 暂不支持当前平台: ${key}`);
  return artifact;
}

function runnerRoot(installRoot?: string) {
  return installRoot
    || process.env.LICELL_ALIYUN_RUNNER_DIR
    || join(homedir(), '.licell', 'bin', 'aliyun');
}

export function cachedAlicloudRunnerPath(options: Pick<EnsureAlicloudRunnerOptions, 'platform' | 'arch' | 'installRoot' | 'artifact' | 'version'> = {}) {
  const artifact = options.artifact || artifactFor(options.platform, options.arch);
  const version = options.version || ALICLOUD_RUNNER_VERSION;
  return join(runnerRoot(options.installRoot), version, artifact.platform, 'aliyun');
}

async function sha256(path: string) {
  const hash = createHash('sha256');
  hash.update(await readFile(path));
  return hash.digest('hex');
}

async function isValidRunner(path: string, expectedSha256: string) {
  try {
    await access(path, fsConstants.X_OK);
    return await sha256(path) === expectedSha256;
  } catch {
    return false;
  }
}

async function download(url: string, path: string, fetchImpl: typeof fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    await writeFile(path, Buffer.from(await response.arrayBuffer()), { mode: 0o600 });
  } finally {
    clearTimeout(timer);
  }
}

function defaultExtractArchive(archivePath: string, targetDir: string) {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn('tar', ['-xzf', archivePath, '-C', targetDir, 'aliyun'], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer | string) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`解压 aliyun-cli runner 失败: ${stderr.trim() || `tar exited with code ${code}`}`));
    });
  });
}

async function acquireInstallLock(path: string, expectedSha256: string, lockPath: string, options: EnsureAlicloudRunnerOptions) {
  const sleep = options.sleep || ((milliseconds: number) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)));
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isValidRunner(path, expectedSha256)) return { kind: 'runner', path } as const;
    try {
      return { kind: 'lock', handle: await open(lockPath, 'wx', 0o600) } as const;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    await sleep(200);
  }
  throw new Error(`等待 aliyun-cli runner 安装超时: ${path}`);
}

export async function ensureAlicloudRunner(options: EnsureAlicloudRunnerOptions = {}) {
  const artifact = options.artifact || artifactFor(options.platform, options.arch);
  const version = options.version || ALICLOUD_RUNNER_VERSION;
  const targetPath = cachedAlicloudRunnerPath(options);
  if (await isValidRunner(targetPath, artifact.binarySha256)) return targetPath;

  const targetDir = dirname(targetPath);
  const lockPath = `${targetDir}.lock`;
  await mkdir(dirname(targetDir), { recursive: true, mode: 0o700 });
  const acquired = await acquireInstallLock(targetPath, artifact.binarySha256, lockPath, options);
  if (acquired.kind === 'runner') return acquired.path;
  const lock = acquired.handle;

  const stagingDir = await mkdtemp(join(tmpdir(), 'licell-aliyun-runner-'));
  try {
    const archivePath = join(stagingDir, 'aliyun.tgz');
    await download(artifact.url, archivePath, options.fetchImpl || fetch);
    const archiveHash = await sha256(archivePath);
    if (archiveHash !== artifact.archiveSha256) {
      throw new Error(`aliyun-cli runner 压缩包 SHA-256 校验失败: expected ${artifact.archiveSha256}, got ${archiveHash}`);
    }
    await (options.extractArchive || defaultExtractArchive)(archivePath, stagingDir);
    const stagedBinary = join(stagingDir, 'aliyun');
    const binaryHash = await sha256(stagedBinary);
    if (binaryHash !== artifact.binarySha256) {
      throw new Error(`aliyun-cli runner 二进制 SHA-256 校验失败: expected ${artifact.binarySha256}, got ${binaryHash}`);
    }
    await chmod(stagedBinary, 0o755);
    await mkdir(targetDir, { recursive: true, mode: 0o700 });
    await rename(stagedBinary, targetPath);
    return targetPath;
  } catch (error) {
    throw new Error(`下载 aliyun-cli ${version} 失败；可安装全局 aliyun，或设置 LICELL_ALIYUN_BIN。${error instanceof Error ? ` 原因: ${error.message}` : ''}`);
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
    await rm(stagingDir, { recursive: true, force: true });
  }
}

export async function findExecutableOnPath(name: string, env: NodeJS.ProcessEnv = process.env) {
  const directories = (env.PATH || '').split(delimiter).filter(Boolean);
  for (const directory of directories) {
    const candidate = join(directory, name);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Continue searching PATH.
    }
  }
  return undefined;
}
