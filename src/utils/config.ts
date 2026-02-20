import { homedir } from 'os';
import { join } from 'path';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';

const GLOBAL_DIR = join(homedir(), '.licell-cli');
const LEGACY_GLOBAL_DIR = join(homedir(), '.ali-cli');
const GLOBAL_FILE = join(GLOBAL_DIR, 'auth.json');
const GLOBAL_CONFIG_FILE = join(GLOBAL_DIR, 'config.json');
const LEGACY_GLOBAL_FILE = join(LEGACY_GLOBAL_DIR, 'auth.json');
function getLocalDir() { return join(process.cwd(), '.licell'); }
function getLegacyLocalDir() { return join(process.cwd(), '.ali'); }
function getLocalFile() { return join(getLocalDir(), 'project.json'); }
function getLegacyLocalFile() { return join(getLegacyLocalDir(), 'project.json'); }
const SECURE_DIR_MODE = 0o700;
const SECURE_FILE_MODE = 0o600;
export const DEFAULT_ALI_REGION = 'cn-hangzhou';

export interface AuthConfig {
  accountId: string;
  ak: string;
  sk: string;
  region: string;
  authSource?: 'manual' | 'bootstrap';
  ramUser?: string;
  ramPolicy?: string;
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

export interface ProjectResourcesConfig {
  memorySize?: number;
  timeout?: number;
  cpu?: number;
  instanceConcurrency?: number;
}

export interface ProjectHooksConfig {
  preDeploy?: string;
  postDeploy?: string;
}

export interface ProjectConfig {
  appName?: string;
  runtime?: string;
  acrNamespace?: string;
  envs: Record<string, string>;
  resources?: ProjectResourcesConfig;
  hooks?: ProjectHooksConfig;
  network?: ProjectNetworkConfig;
  cache?: ProjectCacheConfig;
  [key: string]: unknown;
}

export interface GlobalConfig {
  domainSuffix?: string;
}

interface SetProjectOptions {
  replaceEnvs?: boolean;
}

export function ensureSecureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true, mode: SECURE_DIR_MODE });
  try { chmodSync(path, SECURE_DIR_MODE); } catch {
    console.error(`⚠️ 无法设置目录权限 ${path}，请手动确认权限为 0700`);
  }
}

function readJsonSafely<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function writeJsonSafely(filePath: string, data: unknown, secure = false) {
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), secure ? { mode: SECURE_FILE_MODE } : undefined);
    if (secure) {
      try { chmodSync(tmpPath, SECURE_FILE_MODE); } catch {
        throw new Error(`无法设置安全文件权限 ${filePath}，凭证未写入`);
      }
    }
    renameSync(tmpPath, filePath);
  } catch (err) {
    try { rmSync(tmpPath, { force: true }); } catch { /* 清理失败不覆盖原始错误 */ }
    throw err;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPositiveNumber(value: unknown) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
  }
  return undefined;
}

function toPositiveInt(value: unknown) {
  const parsed = toPositiveNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed)) return undefined;
  return parsed;
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
  if (typeof projectRaw.acrNamespace === 'string' && projectRaw.acrNamespace.trim().length > 0) {
    normalized.acrNamespace = projectRaw.acrNamespace.trim();
  }
  const resourcesRaw = isRecord(projectRaw.resources) ? projectRaw.resources : null;
  if (resourcesRaw) {
    const memorySize = toPositiveInt(resourcesRaw.memorySize);
    const timeout = toPositiveInt(resourcesRaw.timeout);
    const cpu = toPositiveNumber(resourcesRaw.cpu);
    const instanceConcurrency = toPositiveInt(resourcesRaw.instanceConcurrency);
    const resources: ProjectResourcesConfig = {
      ...(memorySize !== undefined ? { memorySize } : {}),
      ...(timeout !== undefined ? { timeout } : {}),
      ...(cpu !== undefined ? { cpu } : {}),
      ...(instanceConcurrency !== undefined ? { instanceConcurrency } : {})
    };
    if (Object.keys(resources).length > 0) {
      normalized.resources = resources;
    }
  }

  const hooksRaw = isRecord(projectRaw.hooks) ? projectRaw.hooks : null;
  if (hooksRaw) {
    const preDeploy = typeof hooksRaw.preDeploy === 'string' ? hooksRaw.preDeploy.trim() : '';
    const postDeploy = typeof hooksRaw.postDeploy === 'string' ? hooksRaw.postDeploy.trim() : '';
    const hooks: ProjectHooksConfig = {
      ...(preDeploy ? { preDeploy } : {}),
      ...(postDeploy ? { postDeploy } : {})
    };
    if (Object.keys(hooks).length > 0) {
      normalized.hooks = hooks;
    }
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

  const {
    appName: _a,
    runtime: _r,
    acrNamespace: _an,
    envs: _e,
    resources: _res,
    hooks: _h,
    network: _n,
    cache: _c,
    ...extra
  } = projectRaw;
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
  const authSource = raw.authSource === 'bootstrap' || raw.authSource === 'manual'
    ? raw.authSource
    : undefined;
  const ramUser = typeof raw.ramUser === 'string' && raw.ramUser.trim().length > 0
    ? raw.ramUser.trim()
    : undefined;
  const ramPolicy = typeof raw.ramPolicy === 'string' && raw.ramPolicy.trim().length > 0
    ? raw.ramPolicy.trim()
    : undefined;
  return {
    accountId: raw.accountId.trim(),
    ak: raw.ak.trim(),
    sk: raw.sk.trim(),
    region,
    ...(authSource ? { authSource } : {}),
    ...(ramUser ? { ramUser } : {}),
    ...(ramPolicy ? { ramPolicy } : {})
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
  const localFile = getLocalFile();
  if (existsSync(localFile)) return localFile;
  const legacyFile = getLegacyLocalFile();
  if (existsSync(legacyFile)) return legacyFile;
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
    ensureSecureDir(getLocalDir());
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
    writeJsonSafely(getLocalFile(), next, true);
  },
  getGlobalConfig(): GlobalConfig {
    return readJsonSafely<GlobalConfig>(GLOBAL_CONFIG_FILE, {});
  },
  setGlobalConfig(data: Partial<GlobalConfig>) {
    ensureSecureDir(GLOBAL_DIR);
    const current = this.getGlobalConfig();
    const next: GlobalConfig = { ...current, ...data };
    writeJsonSafely(GLOBAL_CONFIG_FILE, next);
  }
};
