import { homedir } from 'os';
import { join } from 'path';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';

const GLOBAL_DIR = join(homedir(), '.licell-cli');
const LEGACY_GLOBAL_DIR = join(homedir(), '.ali-cli');
const GLOBAL_FILE = join(GLOBAL_DIR, 'auth.json');
const LEGACY_GLOBAL_FILE = join(LEGACY_GLOBAL_DIR, 'auth.json');
const LOCAL_DIR = join(process.cwd(), '.licell');
const LEGACY_LOCAL_DIR = join(process.cwd(), '.ali');
const LOCAL_FILE = join(LOCAL_DIR, 'project.json');
const LEGACY_LOCAL_FILE = join(LEGACY_LOCAL_DIR, 'project.json');
const SECURE_DIR_MODE = 0o700;
const SECURE_FILE_MODE = 0o600;
export const DEFAULT_ALI_REGION = 'cn-hangzhou';

export interface AuthConfig {
  accountId: string;
  ak: string;
  sk: string;
  region: string;
}

export interface ProjectNetworkConfig {
  vpcId: string;
  vswId: string;
  sgId?: string;
  cidrBlock?: string;
}

export interface ProjectCacheConfig {
  type: 'redis' | string;
  instanceId: string;
  host?: string;
  port?: number;
  accountName?: string;
  vkName?: string;
  mode?: string;
}

export interface ProjectConfig {
  appName?: string;
  runtime?: string;
  envs: Record<string, string>;
  network?: ProjectNetworkConfig;
  cache?: ProjectCacheConfig;
  [key: string]: unknown;
}

interface SetProjectOptions {
  replaceEnvs?: boolean;
}

function ensureSecureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true, mode: SECURE_DIR_MODE });
  try { chmodSync(path, SECURE_DIR_MODE); } catch { /* chmod may fail on some filesystems, non-critical */ }
}

function readJsonSafely<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonSafely(filePath: string, data: unknown, secure = false) {
  writeFileSync(filePath, JSON.stringify(data, null, 2), secure ? { mode: SECURE_FILE_MODE } : undefined);
  if (secure) {
    try { chmodSync(filePath, SECURE_FILE_MODE); } catch { /* chmod may fail on some filesystems, non-critical */ }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeProject(raw: unknown): ProjectConfig {
  const projectRaw = isRecord(raw) ? raw : {};
  const envsRaw = isRecord(projectRaw.envs) ? projectRaw.envs : {};
  const envs: Record<string, string> = {};
  for (const [key, value] of Object.entries(envsRaw)) {
    if (typeof value === 'string') envs[key] = value;
  }

  const normalized: ProjectConfig = { envs };
  if (typeof projectRaw.appName === 'string' && projectRaw.appName.trim().length > 0) {
    normalized.appName = projectRaw.appName.trim();
  }
  if (typeof projectRaw.runtime === 'string' && projectRaw.runtime.trim().length > 0) {
    normalized.runtime = projectRaw.runtime.trim();
  }

  const networkRaw = isRecord(projectRaw.network) ? projectRaw.network : null;
  if (
    networkRaw &&
    typeof networkRaw.vpcId === 'string' &&
    typeof networkRaw.vswId === 'string'
  ) {
    normalized.network = {
      vpcId: networkRaw.vpcId,
      vswId: networkRaw.vswId,
      sgId: typeof networkRaw.sgId === 'string' ? networkRaw.sgId : undefined,
      cidrBlock: typeof networkRaw.cidrBlock === 'string' ? networkRaw.cidrBlock : undefined
    };
  }

  const cacheRaw = isRecord(projectRaw.cache) ? projectRaw.cache : null;
  if (
    cacheRaw &&
    typeof cacheRaw.type === 'string' &&
    typeof cacheRaw.instanceId === 'string'
  ) {
    const cache: ProjectCacheConfig = {
      type: cacheRaw.type,
      instanceId: cacheRaw.instanceId,
      host: typeof cacheRaw.host === 'string' ? cacheRaw.host : undefined,
      port: typeof cacheRaw.port === 'number' ? cacheRaw.port : undefined,
      accountName: typeof cacheRaw.accountName === 'string' ? cacheRaw.accountName : undefined
    };
    if (typeof cacheRaw.vkName === 'string') cache.vkName = cacheRaw.vkName;
    if (typeof cacheRaw.mode === 'string') cache.mode = cacheRaw.mode;
    normalized.cache = cache;
  }

  const { appName: _a, runtime: _r, envs: _e, network: _n, cache: _c, ...extra } = projectRaw;
  return { ...extra, ...normalized, envs };
}

export function normalizeAuth(raw: unknown): AuthConfig | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.accountId !== 'string' ||
    typeof raw.ak !== 'string' ||
    typeof raw.sk !== 'string'
  ) {
    return null;
  }
  const regionRaw = typeof raw.region === 'string' ? raw.region : DEFAULT_ALI_REGION;
  const region = regionRaw.trim().toLowerCase() || DEFAULT_ALI_REGION;
  return {
    accountId: raw.accountId.trim(),
    ak: raw.ak.trim(),
    sk: raw.sk.trim(),
    region
  };
}

function ensureProjectConfigIgnored() {
  const gitignore = join(process.cwd(), '.gitignore');
  const ignoreEntries = ['.licell/', '.ali/'];
  if (!existsSync(gitignore)) {
    writeFileSync(gitignore, `${ignoreEntries.join('\n')}\n`);
    return;
  }

  let current = readFileSync(gitignore, 'utf-8');
  for (const ignoreEntry of ignoreEntries) {
    const normalizedEntry = ignoreEntry.replace(/\/$/, '');
    const hasEntry = current
      .split(/\r?\n/)
      .some((line) => {
        const trimmed = line.trim();
        return trimmed === ignoreEntry || trimmed === normalizedEntry;
      });
    if (hasEntry) continue;
    const suffix = current.endsWith('\n') || current.length === 0 ? '' : '\n';
    current = `${current}${suffix}${ignoreEntry}\n`;
  }
  writeFileSync(gitignore, current);
}

function getReadableAuthFile() {
  if (existsSync(GLOBAL_FILE)) return GLOBAL_FILE;
  if (existsSync(LEGACY_GLOBAL_FILE)) return LEGACY_GLOBAL_FILE;
  return null;
}

function getReadableProjectFile() {
  if (existsSync(LOCAL_FILE)) return LOCAL_FILE;
  if (existsSync(LEGACY_LOCAL_FILE)) return LEGACY_LOCAL_FILE;
  return null;
}

export const Config = {
  getAuth() {
    const authFile = getReadableAuthFile();
    if (!authFile) return null;
    const normalized = normalizeAuth(readJsonSafely<unknown>(authFile, null));
    if (normalized && authFile === LEGACY_GLOBAL_FILE) {
      this.setAuth(normalized);
    }
    return normalized;
  },
  requireAuth() {
    const auth = this.getAuth();
    if (!auth) throw new Error('未登录，请先执行 `licell login`');
    return auth;
  },
  setAuth(data: AuthConfig) {
    ensureSecureDir(GLOBAL_DIR);
    writeJsonSafely(GLOBAL_FILE, data, true);
  },
  clearAuth() {
    rmSync(GLOBAL_FILE, { force: true });
    rmSync(LEGACY_GLOBAL_FILE, { force: true });
  },
  getProject() {
    const projectFile = getReadableProjectFile();
    if (!projectFile) return { envs: {} };
    return normalizeProject(readJsonSafely<unknown>(projectFile, { envs: {} }));
  },
  setProject(data: Partial<ProjectConfig>, options?: SetProjectOptions) {
    ensureSecureDir(LOCAL_DIR);
    ensureProjectConfigIgnored();
    const current = this.getProject();
    const mergedEnvs = options?.replaceEnvs
      ? { ...(data.envs || {}) }
      : { ...current.envs, ...(data.envs || {}) };
    const next = normalizeProject({
      ...current,
      ...data,
      envs: mergedEnvs
    });
    writeJsonSafely(LOCAL_FILE, next, true);
  }
};
