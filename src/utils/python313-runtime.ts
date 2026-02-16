import { cpSync, createReadStream, createWriteStream, existsSync, mkdirSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import https from 'https';
import { pipeline } from 'stream/promises';
import { spawnSync } from 'child_process';
import type { IncomingMessage } from 'http';
import { createHash } from 'crypto';
import { readLicellEnv } from './env';

const RUNTIME_CACHE_ROOT = readLicellEnv(process.env, 'RUNTIME_CACHE_DIR')?.trim()
  || join(homedir(), '.licell-cli', 'runtimes');
const CACHE_DIR = join(RUNTIME_CACHE_ROOT, 'python313');
const RELEASE_API_URL = 'https://api.github.com/repos/indygreg/python-build-standalone/releases/latest';
const ASSET_PATTERN = /^cpython-3\.13\.\d+\+\d+-x86_64-unknown-linux-gnu-install_only_stripped\.tar\.gz$/;

interface Python313DownloadSpec {
  tarballName: string;
  downloadUrl: string;
  sha256: string;
}

interface PreparedPython313Runtime {
  pythonBinaryInCode: string;
}

function requestUrl(url: string, redirects = 5, headers: Record<string, string> = {}): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;
      if ([301, 302, 307, 308].includes(status) && location && redirects > 0) {
        res.resume();
        const next = new URL(location, url).toString();
        requestUrl(next, redirects - 1, headers).then(resolve).catch(reject);
        return;
      }
      if (status < 200 || status >= 300) {
        const message = `HTTP ${status} for ${url}`;
        res.resume();
        reject(new Error(message));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
  });
}

async function downloadFile(url: string, filePath: string) {
  const response = await requestUrl(url);
  await pipeline(response, createWriteStream(filePath));
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await requestUrl(url, 5, {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'licell-cli'
  });
  let data = '';
  response.setEncoding('utf8');
  for await (const chunk of response) {
    data += chunk;
  }
  return JSON.parse(data);
}

function getEnvOverrideSpec(): Python313DownloadSpec | null {
  const tarballUrl = readLicellEnv(process.env, 'PYTHON313_TARBALL_URL')?.trim();
  if (!tarballUrl) return null;
  const sha256 = readLicellEnv(process.env, 'PYTHON313_SHA256')?.trim().toLowerCase();
  if (!sha256 || !/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error('设置 LICELL_PYTHON313_TARBALL_URL 时，必须同时提供 LICELL_PYTHON313_SHA256（64 位十六进制）');
  }

  const pathname = new URL(tarballUrl).pathname;
  const tarballName = decodeURIComponent(pathname.split('/').pop() || '');
  if (!tarballName.endsWith('.tar.gz')) {
    throw new Error(`LICELL_PYTHON313_TARBALL_URL 必须指向 .tar.gz 文件，当前为: ${tarballName || '(empty)'}`);
  }

  return { tarballName, downloadUrl: tarballUrl, sha256 };
}

export function parsePython313SpecFromRelease(body: unknown): Python313DownloadSpec | null {
  if (typeof body !== 'object' || body === null) return null;
  const assets = (body as { assets?: unknown }).assets;
  if (!Array.isArray(assets)) return null;

  for (const asset of assets) {
    if (typeof asset !== 'object' || asset === null) continue;
    const row = asset as { name?: unknown; browser_download_url?: unknown; digest?: unknown };
    const name = typeof row.name === 'string' ? row.name : '';
    if (!ASSET_PATTERN.test(name)) continue;
    const downloadUrl = typeof row.browser_download_url === 'string' ? row.browser_download_url : '';
    if (!downloadUrl) continue;
    const digest = typeof row.digest === 'string' ? row.digest : '';
    const digestMatch = digest.match(/^sha256:([a-fA-F0-9]{64})$/);
    if (!digestMatch) continue;
    return {
      tarballName: name,
      downloadUrl,
      sha256: digestMatch[1].toLowerCase()
    };
  }
  return null;
}

async function resolvePython313DownloadSpec(): Promise<Python313DownloadSpec> {
  const envSpec = getEnvOverrideSpec();
  if (envSpec) return envSpec;

  const releaseApiUrl = readLicellEnv(process.env, 'PYTHON313_RELEASE_API_URL')?.trim() || RELEASE_API_URL;
  const release = await fetchJson(releaseApiUrl);
  const spec = parsePython313SpecFromRelease(release);
  if (!spec) {
    throw new Error(`无法在 ${releaseApiUrl} 找到 python3.13 Linux x64 运行时包`);
  }
  return spec;
}

async function getFileSha256(filePath: string) {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

function extractTarGz(archiveFile: string, extractToDir: string) {
  const result = spawnSync('tar', ['-xzf', archiveFile, '-C', extractToDir], { encoding: 'utf8' });
  if (result.status === 0) return;
  const details = result.stderr?.trim() || result.stdout?.trim() || 'tar extract failed';
  throw new Error(`解压 Python 3.13 运行时失败: ${details}`);
}

async function ensurePython313RuntimeCacheDir() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const { tarballName, downloadUrl, sha256 } = await resolvePython313DownloadSpec();
  const folderName = tarballName.replace(/\.tar\.gz$/, '');
  const extractedDir = join(CACHE_DIR, folderName);
  const binaryPath = join(extractedDir, 'python', 'bin', 'python3.13');
  if (existsSync(binaryPath)) {
    return { folderName, extractedDir };
  }

  const archiveFile = join(CACHE_DIR, tarballName);
  rmSync(extractedDir, { recursive: true, force: true });
  await downloadFile(downloadUrl, archiveFile);
  const actualSha256 = await getFileSha256(archiveFile);
  if (actualSha256 !== sha256) {
    rmSync(archiveFile, { force: true });
    throw new Error(`Python 3.13 运行时包校验失败: expected=${sha256}, actual=${actualSha256}`);
  }
  mkdirSync(extractedDir, { recursive: true });
  extractTarGz(archiveFile, extractedDir);
  rmSync(archiveFile, { force: true });
  if (!existsSync(binaryPath)) {
    throw new Error('Python 3.13 运行时下载完成但未找到可执行文件 python/bin/python3.13');
  }
  return { folderName, extractedDir };
}

export async function preparePython313RuntimeInCode(outdir: string): Promise<PreparedPython313Runtime> {
  const runtimeRoot = join(outdir, '.licell-runtime');
  mkdirSync(runtimeRoot, { recursive: true });
  const { folderName, extractedDir } = await ensurePython313RuntimeCacheDir();
  const targetDir = join(runtimeRoot, folderName);
  rmSync(targetDir, { recursive: true, force: true });
  cpSync(extractedDir, targetDir, { recursive: true });
  return {
    pythonBinaryInCode: `/code/.licell-runtime/${folderName}/python/bin/python3.13`
  };
}
