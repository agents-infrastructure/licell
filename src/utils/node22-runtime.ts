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
const CACHE_DIR = join(RUNTIME_CACHE_ROOT, 'node22');
const SHASUMS_FILE = 'SHASUMS256.txt';

interface Node22DownloadSpec {
  tarballName: string;
  downloadUrl: string;
  sha256: string;
}

interface PreparedNode22Runtime {
  nodeBinaryInCode: string;
}

function getShasumsSources() {
  const fromEnv = readLicellEnv(process.env, 'NODE22_SHASUMS_URL');
  const defaults = [
    'https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt',
    'https://cdn.npmmirror.com/binaries/node/latest-v22.x/SHASUMS256.txt'
  ];
  return fromEnv ? [fromEnv, ...defaults] : defaults;
}

function requestUrl(url: string, redirects = 5): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;
      if ([301, 302, 307, 308].includes(status) && location && redirects > 0) {
        res.resume();
        const next = new URL(location, url).toString();
        requestUrl(next, redirects - 1).then(resolve).catch(reject);
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

async function fetchText(url: string) {
  const response = await requestUrl(url);
  let data = '';
  response.setEncoding('utf8');
  for await (const chunk of response) {
    data += chunk;
  }
  return data;
}

async function downloadFile(url: string, filePath: string) {
  const response = await requestUrl(url);
  await pipeline(response, createWriteStream(filePath));
}

function parseNode22TarballSpec(shasums: string) {
  for (const line of shasums.split('\n')) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([a-fA-F0-9]{64})\s+\*?(node-v22\.\d+\.\d+-linux-x64\.tar\.gz)$/);
    if (!match) continue;
    return {
      sha256: match[1].toLowerCase(),
      tarballName: match[2]
    };
  }
  return null;
}

async function resolveNode22DownloadSpec(): Promise<Node22DownloadSpec> {
  const sources = getShasumsSources();
  let lastError: Error | null = null;
  for (const shasumsUrl of sources) {
    try {
      const shasums = await fetchText(shasumsUrl);
      const spec = parseNode22TarballSpec(shasums);
      if (!spec) {
        lastError = new Error(`未在 ${shasumsUrl} 找到 Node 22 Linux x64 安装包`);
        continue;
      }
      const baseUrl = shasumsUrl.endsWith(SHASUMS_FILE)
        ? shasumsUrl.slice(0, -SHASUMS_FILE.length)
        : `${shasumsUrl.replace(/\/+$/, '')}/`;
      return {
        tarballName: spec.tarballName,
        downloadUrl: new URL(spec.tarballName, baseUrl).toString(),
        sha256: spec.sha256
      };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new Error(`无法获取 Node 22 运行时下载信息: ${lastError?.message || '未知错误'}`);
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
  throw new Error(`解压 Node 22 运行时失败: ${details}`);
}

async function ensureNode22RuntimeCacheDir() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const { tarballName, downloadUrl, sha256 } = await resolveNode22DownloadSpec();
  const folderName = tarballName.replace(/\.tar\.gz$/, '');
  const extractedDir = join(CACHE_DIR, folderName);
  const binaryPath = join(extractedDir, 'bin', 'node');
  if (existsSync(binaryPath)) {
    return { folderName, extractedDir };
  }

  const archiveFile = join(CACHE_DIR, tarballName);
  rmSync(extractedDir, { recursive: true, force: true });
  await downloadFile(downloadUrl, archiveFile);
  const actualSha256 = await getFileSha256(archiveFile);
  if (actualSha256 !== sha256) {
    rmSync(archiveFile, { force: true });
    throw new Error(`Node 22 运行时包校验失败: expected=${sha256}, actual=${actualSha256}`);
  }
  extractTarGz(archiveFile, CACHE_DIR);
  rmSync(archiveFile, { force: true });
  if (!existsSync(binaryPath)) {
    throw new Error('Node 22 运行时下载完成但未找到可执行文件 bin/node');
  }
  return { folderName, extractedDir };
}

export async function prepareNode22RuntimeInCode(outdir: string): Promise<PreparedNode22Runtime> {
  const runtimeRoot = join(outdir, '.licell-runtime');
  mkdirSync(runtimeRoot, { recursive: true });
  const { folderName, extractedDir } = await ensureNode22RuntimeCacheDir();
  const targetDir = join(runtimeRoot, folderName);
  rmSync(targetDir, { recursive: true, force: true });
  cpSync(extractedDir, targetDir, { recursive: true });
  return {
    nodeBinaryInCode: `/code/.licell-runtime/${folderName}/bin/node`
  };
}
