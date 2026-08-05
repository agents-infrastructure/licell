import { homedir } from 'os';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { applyInvocationRegion, normalizeRegionId } from './region-context';

const GLOBAL_DIR = join(homedir(), '.licell-cli');
const LEGACY_GLOBAL_DIR = join(homedir(), '.ali-cli');
const GLOBAL_FILE = join(GLOBAL_DIR, 'auth.json');
const GLOBAL_CONFIG_FILE = join(GLOBAL_DIR, 'config.json');
const LEGACY_GLOBAL_FILE = join(LEGACY_GLOBAL_DIR, 'auth.json');
function getLocalDir(cwd = process.cwd()) { return join(cwd, '.licell'); }
function getLegacyLocalDir(cwd = process.cwd()) { return join(cwd, '.ali'); }
function getLocalFile(cwd = process.cwd()) { return join(getLocalDir(cwd), 'project.json'); }
function getLegacyLocalFile(cwd = process.cwd()) { return join(getLegacyLocalDir(cwd), 'project.json'); }
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
  region?: string;
}

export interface ProjectCacheConfig {
  type: 'redis' | string;
  instanceId: string;
  host?: string;
  port?: number;
  accountName?: string;
  vkName?: string;
  mode?: string;
  region?: string;
}

export interface ProjectDatabaseConfig {
  type?: string;
  instanceId: string;
  user?: string;
  name?: string;
  region?: string;
}

export interface ProjectSupabaseConfig {
  instanceName: string;
  region?: string;
}

export function withProjectBindingRegion<T extends object>(binding: T, regionId?: unknown): T & { region?: string } {
  const { region: existingRegion, ...withoutRegion } = binding as T & { region?: unknown };
  const region = normalizeRegionId(regionId) || normalizeRegionId(existingRegion);
  return {
    ...withoutRegion,
    ...(region ? { region } : {})
  } as T & { region?: string };
}

export interface ProjectResourcesConfig {
  memorySize?: number;
  diskSize?: number;
  timeout?: number;
  cpu?: number;
  instanceConcurrency?: number;
}

export interface ProjectHooksConfig {
  preDeploy?: string;
  postDeploy?: string;
}

export interface ProjectArtifactConfig {
  kind?: 'directory' | 'source' | 'prebuilt' | string;
  path?: string;
  entry?: string;
  // For kind='prebuilt': path to a directory containing already-built output.
  // licell will zip this directory as-is and upload it, skipping bun bundling.
  // The entry file (e.g. server/index.mjs) must exist inside prebuiltDir.
  prebuiltDir?: string;
}

export interface ProjectDeployTargetConfig {
  service?: 'oss-static' | 'fc-http' | 'fc-task' | string;
  region?: string;
  bucket?: string;
  function?: string;
  runtime?: string;
  alias?: string;
  vpc?: boolean;
}

export interface ProjectRouteConfig {
  domain?: string;
  domainSuffix?: string;
  cdn?: boolean;
  ssl?: boolean;
  cdnRefresh?: 'off' | 'entrypoints' | 'all' | string;
}

export interface ProjectConfig {
  schemaVersion?: number;
  appName?: string;
  runtime?: string;
  deployType?: string;
  acrNamespace?: string;
  domain?: string;
  domainSuffix?: string;
  entry?: string;
  dist?: string;
  target?: string;
  enableCdn?: boolean;
  enableSSL?: boolean;
  cdnRefresh?: 'off' | 'entrypoints' | 'all' | string;
  useVpc?: boolean;
  region?: string;
  envs: Record<string, string>;
  resources?: ProjectResourcesConfig;
  hooks?: ProjectHooksConfig;
  network?: ProjectNetworkConfig;
  cache?: ProjectCacheConfig;
  database?: ProjectDatabaseConfig;
  supabase?: ProjectSupabaseConfig;
  artifact?: ProjectArtifactConfig;
  deployTarget?: ProjectDeployTargetConfig;
  route?: ProjectRouteConfig;
  [key: string]: unknown;
}

export interface WorkspaceProjectComponentConfig extends ProjectConfig {
  path?: string;
}

export interface WorkspaceProjectConfig {
  defaultComponent?: string;
  defaults?: Partial<ProjectConfig>;
  components: Record<string, WorkspaceProjectComponentConfig>;
}

export interface GlobalConfig {
  domainSuffix?: string;
  authTransferBuckets?: Record<string, string>;
}

interface SetProjectOptions {
  replaceEnvs?: boolean;
  cwd?: string;
  component?: string;
  localOnly?: boolean;
}

export interface ProjectLookupOptions {
  cwd?: string;
  component?: string;
  localOnly?: boolean;
}

export interface WorkspaceComponentSummary {
  name: string;
  path?: string;
  project: ProjectConfig;
  matched: boolean;
  defaultComponent: boolean;
}

export interface WorkspaceConfigSnapshot {
  filePath: string;
  rootDir: string;
  mode: 'single' | 'workspace';
  project: ProjectConfig;
  componentName?: string;
  componentPath?: string;
  defaultComponent?: string;
  components: WorkspaceComponentSummary[];
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

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function mapDeployTypeToService(value: unknown) {
  const raw = toOptionalString(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === 'static') return 'oss-static';
  if (raw === 'api') return 'fc-http';
  if (raw === 'task') return 'fc-task';
  return raw;
}

function mapServiceToDeployType(value: unknown) {
  const raw = toOptionalString(value)?.toLowerCase();
  if (!raw) return undefined;
  if (raw === 'oss-static' || raw === 'static') return 'static';
  if (raw === 'fc-http' || raw === 'api') return 'api';
  if (raw === 'fc-task' || raw === 'task') return 'task';
  return undefined;
}

function normalizeArtifactConfig(raw: unknown): ProjectArtifactConfig | undefined {
  if (!isRecord(raw)) return undefined;
  const kind = toOptionalString(raw.kind)?.toLowerCase();
  const path = toOptionalString(raw.path);
  const entry = toOptionalString(raw.entry);
  const prebuiltDir = toOptionalString(raw.prebuiltDir);
  const normalized: ProjectArtifactConfig = {
    ...(kind ? { kind } : {}),
    ...(path ? { path } : {}),
    ...(entry ? { entry } : {}),
    ...(prebuiltDir ? { prebuiltDir } : {})
  };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeDeployTargetConfig(raw: unknown): ProjectDeployTargetConfig | undefined {
  if (!isRecord(raw)) return undefined;
  const service = toOptionalString(raw.service)?.toLowerCase();
  const region = toOptionalString(raw.region)?.toLowerCase();
  const bucket = toOptionalString(raw.bucket);
  const fn = toOptionalString(raw.function);
  const runtime = toOptionalString(raw.runtime);
  const alias = toOptionalString(raw.alias);
  const vpc = toOptionalBoolean(raw.vpc);
  const normalized: ProjectDeployTargetConfig = {
    ...(service ? { service } : {}),
    ...(region ? { region } : {}),
    ...(bucket ? { bucket } : {}),
    ...(fn ? { function: fn } : {}),
    ...(runtime ? { runtime } : {}),
    ...(alias ? { alias } : {}),
    ...(vpc !== undefined ? { vpc } : {})
  };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeRouteConfig(raw: unknown): ProjectRouteConfig | undefined {
  if (!isRecord(raw)) return undefined;
  const domain = toOptionalString(raw.domain)?.toLowerCase();
  const domainSuffix = toOptionalString(raw.domainSuffix)?.toLowerCase();
  const cdn = toOptionalBoolean(raw.cdn);
  const ssl = toOptionalBoolean(raw.ssl);
  const cdnRefresh = normalizeProjectCdnRefreshMode(raw.cdnRefresh);
  const normalized: ProjectRouteConfig = {
    ...(domain ? { domain } : {}),
    ...(domainSuffix ? { domainSuffix } : {}),
    ...(cdn !== undefined ? { cdn } : {}),
    ...(ssl !== undefined ? { ssl } : {}),
    ...(cdnRefresh ? { cdnRefresh } : {})
  };
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeProjectCdnRefreshMode(value: unknown) {
  const normalized = toOptionalString(value)?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'off' || normalized === 'entrypoints' || normalized === 'all') return normalized;
  return undefined;
}

function normalizeProjectLikePath(input: unknown, rootDir: string) {
  const raw = toOptionalString(input);
  if (!raw) return undefined;
  const resolved = resolve(rootDir, raw);
  const relativePath = relative(rootDir, resolved);
  if (relativePath.startsWith('..')) return undefined;
  if (isAbsolute(relativePath)) return undefined;
  const normalized = relativePath.replace(/\\/g, '/').replace(/\/+$/g, '');
  return normalized === '' ? '.' : normalized;
}

function isWithinProjectPath(cwdRelativePath: string, projectPath?: string) {
  if (!projectPath || projectPath === '.') {
    return cwdRelativePath === '.' || !cwdRelativePath.startsWith('..');
  }
  if (cwdRelativePath === projectPath) return true;
  return cwdRelativePath.startsWith(`${projectPath}/`);
}

function mergeProjectConfigs(base: ProjectConfig, override: ProjectConfig) {
  return normalizeProject({
    ...base,
    ...override,
    envs: {
      ...base.envs,
      ...override.envs
    }
  });
}

interface ProjectResolution {
  filePath: string;
  writeFilePath: string;
  rootDir: string;
  project: ProjectConfig;
  mode: 'single' | 'workspace';
  componentName?: string;
  componentPath?: string;
}

function isWorkspaceProjectRaw(raw: unknown): raw is Record<string, unknown> & { components: Record<string, unknown> } {
  return isRecord(raw) && isRecord(raw.components);
}

function resolveWorkspaceProject(
  filePath: string,
  raw: Record<string, unknown>,
  cwd: string,
  preferredComponent?: string
): ProjectResolution {
  const rootDir = dirname(dirname(filePath));
  const writeFilePath = join(rootDir, '.licell', 'project.json');
  const defaults = normalizeProject(isRecord(raw.defaults) ? raw.defaults : {});
  const cwdRelativePathRaw = relative(rootDir, cwd);
  const cwdRelativePath = cwdRelativePathRaw === '' ? '.' : cwdRelativePathRaw.replace(/\\/g, '/');
  const defaultComponent = toOptionalString(raw.defaultComponent);
  const componentsRaw = raw.components as Record<string, unknown>;
  const componentEntries = Object.entries(componentsRaw)
    .filter(([, value]) => isRecord(value))
    .map(([name, value]) => {
      const componentValue = value as Record<string, unknown>;
      const { path, ...componentRaw } = componentValue;
      return {
        name,
        path: normalizeProjectLikePath(path, rootDir),
        project: normalizeProject(componentRaw)
      };
    });

  const matchedByPath = componentEntries
    .filter((entry) => isWithinProjectPath(cwdRelativePath, entry.path))
    .sort((left, right) => (right.path || '.').length - (left.path || '.').length)[0];
  const matched = (preferredComponent
    ? componentEntries.find((entry) => entry.name === preferredComponent)
    : undefined)
    || matchedByPath
    || (defaultComponent ? componentEntries.find((entry) => entry.name === defaultComponent) : undefined)
    || (componentEntries.length === 1 ? componentEntries[0] : undefined);

  if (!matched) {
    return {
      filePath,
      writeFilePath,
      rootDir,
      project: defaults,
      mode: 'workspace'
    };
  }

  return {
    filePath,
    writeFilePath,
    rootDir,
    project: mergeProjectConfigs(defaults, matched.project),
    mode: 'workspace',
    componentName: matched.name,
    componentPath: matched.path
  };
}

export function normalizeProject(raw: unknown): ProjectConfig {
  const projectRaw = isRecord(raw) ? raw : {};
  const envsRaw = isRecord(projectRaw.envs) ? projectRaw.envs : {};
  const envs: Record<string, string> = {};
  for (const [key, value] of Object.entries(envsRaw)) {
    if (typeof value === 'string') envs[key] = value;
  }

  const normalized: ProjectConfig = { envs };
  const schemaVersion = typeof projectRaw.schemaVersion === 'number' && Number.isInteger(projectRaw.schemaVersion) && projectRaw.schemaVersion > 0
    ? projectRaw.schemaVersion
    : undefined;
  if (schemaVersion !== undefined) {
    normalized.schemaVersion = schemaVersion;
  }
  if (typeof projectRaw.appName === 'string' && projectRaw.appName.trim().length > 0) {
    normalized.appName = projectRaw.appName.trim();
  }
  if (typeof projectRaw.runtime === 'string' && projectRaw.runtime.trim().length > 0) {
    normalized.runtime = projectRaw.runtime.trim();
  }
  if (typeof projectRaw.deployType === 'string' && projectRaw.deployType.trim().length > 0) {
    normalized.deployType = projectRaw.deployType.trim();
  }
  if (typeof projectRaw.acrNamespace === 'string' && projectRaw.acrNamespace.trim().length > 0) {
    normalized.acrNamespace = projectRaw.acrNamespace.trim();
  }
  const domain = toOptionalString(projectRaw.domain);
  if (domain) normalized.domain = domain.toLowerCase();
  const domainSuffix = toOptionalString(projectRaw.domainSuffix);
  if (domainSuffix) normalized.domainSuffix = domainSuffix.toLowerCase();
  const entry = toOptionalString(projectRaw.entry);
  if (entry) normalized.entry = entry;
  const dist = toOptionalString(projectRaw.dist);
  if (dist) normalized.dist = dist;
  const target = toOptionalString(projectRaw.target);
  if (target) normalized.target = target;
  const enableCdn = toOptionalBoolean(projectRaw.enableCdn);
  if (enableCdn !== undefined) normalized.enableCdn = enableCdn;
  const enableSSL = toOptionalBoolean(projectRaw.enableSSL);
  if (enableSSL !== undefined) normalized.enableSSL = enableSSL;
  const cdnRefresh = normalizeProjectCdnRefreshMode(projectRaw.cdnRefresh);
  if (cdnRefresh) normalized.cdnRefresh = cdnRefresh;
  const useVpc = toOptionalBoolean(projectRaw.useVpc);
  if (useVpc !== undefined) normalized.useVpc = useVpc;
  const region = toOptionalString(projectRaw.region);
  if (region) normalized.region = region.toLowerCase();
  const resourcesRaw = isRecord(projectRaw.resources) ? projectRaw.resources : null;
  if (resourcesRaw) {
    const memorySize = toPositiveInt(resourcesRaw.memorySize);
    const diskSize = toPositiveInt(resourcesRaw.diskSize);
    const timeout = toPositiveInt(resourcesRaw.timeout);
    const cpu = toPositiveNumber(resourcesRaw.cpu);
    const instanceConcurrency = toPositiveInt(resourcesRaw.instanceConcurrency);
    const resources: ProjectResourcesConfig = {
      ...(memorySize !== undefined ? { memorySize } : {}),
      ...(diskSize !== undefined ? { diskSize } : {}),
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
    const region = normalizeRegionId(networkRaw.region);
    normalized.network = {
      vpcId: networkRaw.vpcId,
      vswId: networkRaw.vswId,
      sgId: typeof networkRaw.sgId === 'string' ? networkRaw.sgId : undefined,
      cidrBlock: typeof networkRaw.cidrBlock === 'string' ? networkRaw.cidrBlock : undefined,
      ...(region ? { region } : {})
    };
  }

  const cacheRaw = isRecord(projectRaw.cache) ? projectRaw.cache : null;
  if (
    cacheRaw &&
    typeof cacheRaw.type === 'string' &&
    typeof cacheRaw.instanceId === 'string'
  ) {
    const region = normalizeRegionId(cacheRaw.region);
    const cache: ProjectCacheConfig = {
      type: cacheRaw.type,
      instanceId: cacheRaw.instanceId,
      host: typeof cacheRaw.host === 'string' ? cacheRaw.host : undefined,
      port: typeof cacheRaw.port === 'number' ? cacheRaw.port : undefined,
      accountName: typeof cacheRaw.accountName === 'string' ? cacheRaw.accountName : undefined,
      ...(region ? { region } : {})
    };
    if (typeof cacheRaw.vkName === 'string') cache.vkName = cacheRaw.vkName;
    if (typeof cacheRaw.mode === 'string') cache.mode = cacheRaw.mode;
    normalized.cache = cache;
  }

  const databaseRaw = isRecord(projectRaw.database) ? projectRaw.database : null;
  if (databaseRaw && typeof databaseRaw.instanceId === 'string') {
    const region = normalizeRegionId(databaseRaw.region);
    const database: ProjectDatabaseConfig = {
      instanceId: databaseRaw.instanceId,
      type: typeof databaseRaw.type === 'string' ? databaseRaw.type : undefined,
      user: typeof databaseRaw.user === 'string' ? databaseRaw.user : undefined,
      name: typeof databaseRaw.name === 'string' ? databaseRaw.name : undefined,
      ...(region ? { region } : {})
    };
    normalized.database = database;
  }

  const supabaseRaw = isRecord(projectRaw.supabase) ? projectRaw.supabase : null;
  if (supabaseRaw && typeof supabaseRaw.instanceName === 'string') {
    const instanceName = supabaseRaw.instanceName.trim();
    const region = normalizeRegionId(supabaseRaw.region);
    if (instanceName) {
      normalized.supabase = {
        instanceName,
        ...(region ? { region } : {})
      };
    }
  }

  const derivedArtifact = normalizeArtifactConfig({
    ...(normalized.dist ? { kind: 'directory', path: normalized.dist } : {}),
    ...(normalized.entry ? { kind: 'source', entry: normalized.entry } : {})
  });
  const derivedDeployTarget = normalizeDeployTargetConfig({
    ...(mapDeployTypeToService(normalized.deployType) ? { service: mapDeployTypeToService(normalized.deployType) } : {}),
    ...(normalized.region ? { region: normalized.region } : {}),
    ...(normalized.appName && normalized.deployType !== 'static' ? { function: normalized.appName } : {}),
    ...(normalized.runtime ? { runtime: normalized.runtime } : {}),
    ...(normalized.target ? { alias: normalized.target } : {}),
    ...(normalized.useVpc !== undefined ? { vpc: normalized.useVpc } : {})
  });
  const derivedRoute = normalizeRouteConfig({
    ...(normalized.domain ? { domain: normalized.domain } : {}),
    ...(normalized.domainSuffix ? { domainSuffix: normalized.domainSuffix } : {}),
    ...(normalized.enableCdn !== undefined ? { cdn: normalized.enableCdn } : {}),
    ...(normalized.enableSSL !== undefined ? { ssl: normalized.enableSSL } : {}),
    ...(normalized.cdnRefresh ? { cdnRefresh: normalized.cdnRefresh } : {})
  });

  const artifact = normalizeArtifactConfig({
    ...(derivedArtifact || {}),
    ...(isRecord(projectRaw.artifact) ? projectRaw.artifact : {})
  });
  if (artifact) normalized.artifact = artifact;

  const deployTarget = normalizeDeployTargetConfig({
    ...(derivedDeployTarget || {}),
    ...(isRecord(projectRaw.deployTarget) ? projectRaw.deployTarget : {})
  });
  if (deployTarget) normalized.deployTarget = deployTarget;

  const route = normalizeRouteConfig({
    ...(derivedRoute || {}),
    ...(isRecord(projectRaw.route) ? projectRaw.route : {})
  });
  if (route) normalized.route = route;

  if (!normalized.deployType && deployTarget?.service) {
    normalized.deployType = mapServiceToDeployType(deployTarget.service);
  }
  if (!normalized.runtime && deployTarget?.runtime) {
    normalized.runtime = deployTarget.runtime;
  }
  if (!normalized.target && deployTarget?.alias) {
    normalized.target = deployTarget.alias;
  }
  if (normalized.useVpc === undefined && deployTarget?.vpc !== undefined) {
    normalized.useVpc = deployTarget.vpc;
  }
  if (!normalized.region && deployTarget?.region) {
    normalized.region = deployTarget.region;
  }
  if (normalized.region && normalized.deployTarget) {
    normalized.deployTarget = {
      ...normalized.deployTarget,
      region: normalized.region
    };
  }
  if (!normalized.appName && deployTarget?.function) {
    normalized.appName = deployTarget.function;
  }
  if (!normalized.entry && artifact?.entry) {
    normalized.entry = artifact.entry;
  }
  if (!normalized.dist && artifact?.path) {
    normalized.dist = artifact.path;
  }
  if (!normalized.domain && route?.domain) {
    normalized.domain = route.domain;
  }
  if (!normalized.domainSuffix && route?.domainSuffix) {
    normalized.domainSuffix = route.domainSuffix;
  }
  if (normalized.enableCdn === undefined && route?.cdn !== undefined) {
    normalized.enableCdn = route.cdn;
  }
  if (normalized.enableSSL === undefined && route?.ssl !== undefined) {
    normalized.enableSSL = route.ssl;
  }
  if (normalized.cdnRefresh === undefined && route?.cdnRefresh !== undefined) {
    normalized.cdnRefresh = route.cdnRefresh;
  }

  const {
    schemaVersion: _sv,
    appName: _a,
    runtime: _r,
    deployType: _dt,
    acrNamespace: _an,
    domain: _domain,
    domainSuffix: _domainSuffix,
    entry: _entry,
    dist: _dist,
    target: _target,
    enableCdn: _enableCdn,
    enableSSL: _enableSSL,
    cdnRefresh: _cdnRefresh,
    useVpc: _useVpc,
    region: _region,
    envs: _e,
    resources: _res,
    hooks: _h,
    network: _n,
    cache: _c,
    database: _db,
    supabase: _supabase,
    artifact: _artifact,
    deployTarget: _deployTarget,
    route: _route,
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

function getReadableAuthFile() {
  if (existsSync(GLOBAL_FILE)) return GLOBAL_FILE;
  if (existsSync(LEGACY_GLOBAL_FILE)) return LEGACY_GLOBAL_FILE;
  return null;
}

function getReadableProjectFile(startDir = process.cwd(), localOnly = false) {
  if (localOnly) {
    const localFile = getLocalFile(startDir);
    if (existsSync(localFile)) return localFile;
    const legacyFile = getLegacyLocalFile(startDir);
    if (existsSync(legacyFile)) return legacyFile;
    return null;
  }
  let currentDir = resolve(startDir);
  while (true) {
    const localFile = getLocalFile(currentDir);
    if (existsSync(localFile)) return localFile;
    const legacyFile = getLegacyLocalFile(currentDir);
    if (existsSync(legacyFile)) return legacyFile;
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) return null;
    currentDir = parentDir;
  }
}

function resolveProject(startDir = process.cwd(), preferredComponent?: string, localOnly = false): ProjectResolution | null {
  const projectFile = getReadableProjectFile(startDir, localOnly);
  if (!projectFile) return null;
  const rootDir = dirname(dirname(projectFile));
  const raw = readJsonSafely<unknown>(projectFile, { envs: {} });
  if (isWorkspaceProjectRaw(raw)) {
    return resolveWorkspaceProject(projectFile, raw, resolve(startDir), preferredComponent);
  }
  return {
    filePath: projectFile,
    writeFilePath: join(rootDir, '.licell', 'project.json'),
    rootDir,
    project: normalizeProject(raw),
    mode: 'single'
  };
}

function buildWorkspaceSnapshot(startDir = process.cwd(), preferredComponent?: string, localOnly = false): WorkspaceConfigSnapshot | null {
  const projectFile = getReadableProjectFile(startDir, localOnly);
  if (!projectFile) return null;
  const rootDir = dirname(dirname(projectFile));
  const raw = readJsonSafely<unknown>(projectFile, { envs: {} });
  const resolved = resolveProject(startDir, preferredComponent, localOnly);
  if (!resolved) return null;
  if (!isWorkspaceProjectRaw(raw)) {
    return {
      filePath: projectFile,
      rootDir,
      mode: 'single',
      project: resolved.project,
      components: []
    };
  }

  const defaults = normalizeProject(isRecord(raw.defaults) ? raw.defaults : {});
  const defaultComponent = toOptionalString(raw.defaultComponent);
  const componentsRaw = raw.components as Record<string, unknown>;
  const cwdRelativePathRaw = relative(rootDir, resolve(startDir));
  const cwdRelativePath = cwdRelativePathRaw === '' ? '.' : cwdRelativePathRaw.replace(/\\/g, '/');
  const components = Object.entries(componentsRaw)
    .filter(([, value]) => isRecord(value))
    .map(([name, value]) => {
      const componentValue = value as Record<string, unknown>;
      const { path, ...componentRaw } = componentValue;
      const normalizedPath = normalizeProjectLikePath(path, rootDir);
      return {
        name,
        path: normalizedPath,
        project: mergeProjectConfigs(defaults, normalizeProject(componentRaw)),
        matched: preferredComponent
          ? name === preferredComponent
          : isWithinProjectPath(cwdRelativePath, normalizedPath),
        defaultComponent: defaultComponent === name
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    filePath: projectFile,
    rootDir,
    mode: 'workspace',
    project: resolved.project,
    componentName: resolved.componentName,
    componentPath: resolved.componentPath,
    defaultComponent,
    components
  };
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
  getDefaultRegion() {
    const authFile = getReadableAuthFile();
    if (!authFile) return null;
    return normalizeAuth(readJsonSafely<unknown>(authFile, null))?.region || null;
  },
  requireAuth() {
    const auth = this.getAuth();
    if (!auth) throw new Error('未登录，请先执行 `licell login`');
    return applyInvocationRegion(auth);
  },
  setAuth(data: AuthConfig) {
    ensureSecureDir(GLOBAL_DIR);
    writeJsonSafely(GLOBAL_FILE, data, true);
  },
  clearAuth() {
    rmSync(GLOBAL_FILE, { force: true });
    rmSync(LEGACY_GLOBAL_FILE, { force: true });
  },
  getProject(options?: ProjectLookupOptions): ProjectConfig {
    const project = resolveProject(options?.cwd, options?.component, options?.localOnly);
    if (!project) return { envs: {} };
    return project.project;
  },
  setProject(data: Partial<ProjectConfig>, options?: SetProjectOptions) {
    const resolvedProject = resolveProject(options?.cwd, options?.component, options?.localOnly);
    if (!resolvedProject) {
      ensureSecureDir(getLocalDir(options?.cwd));
      const mergedEnvs = options?.replaceEnvs
        ? { ...(data.envs || {}) }
        : { ...(data.envs || {}) };
      const next = normalizeProject({ ...data, envs: mergedEnvs });
      writeJsonSafely(getLocalFile(options?.cwd), next, true);
      return;
    }

    if (resolvedProject.mode === 'workspace') {
      if (!resolvedProject.componentName) {
        throw new Error('当前目录未匹配到 licell workspace component；请在具体组件目录下执行，或为 workspace 配置 defaultComponent');
      }
      const raw = readJsonSafely<unknown>(resolvedProject.filePath, { components: {} });
      if (!isWorkspaceProjectRaw(raw)) {
        throw new Error('workspace project 配置已损坏：缺少 components');
      }
      const currentComponentRaw = isRecord(raw.components[resolvedProject.componentName])
        ? raw.components[resolvedProject.componentName] as Record<string, unknown>
        : {};
      const { path, ...currentProjectRaw } = currentComponentRaw;
      const currentProject = normalizeProject(currentProjectRaw);
      const mergedEnvs = options?.replaceEnvs
        ? { ...(data.envs || {}) }
        : { ...currentProject.envs, ...(data.envs || {}) };
      const nextProject = normalizeProject({
        ...currentProject,
        ...data,
        envs: mergedEnvs
      });
      const nextWorkspace = {
        ...raw,
        components: {
          ...raw.components,
          [resolvedProject.componentName]: {
            ...(typeof path === 'string' && path.trim().length > 0 ? { path } : {}),
            ...nextProject
          }
        }
      };
      ensureSecureDir(dirname(resolvedProject.writeFilePath));
      writeJsonSafely(resolvedProject.writeFilePath, nextWorkspace, true);
      return;
    }

    const current = resolvedProject.project;
    const mergedEnvs = options?.replaceEnvs
      ? { ...(data.envs || {}) }
      : { ...current.envs, ...(data.envs || {}) };
    const next = normalizeProject({
      ...current,
      ...data,
      envs: mergedEnvs
    });
    ensureSecureDir(dirname(resolvedProject.writeFilePath));
    writeJsonSafely(resolvedProject.writeFilePath, next, true);
  },
  getGlobalConfig(): GlobalConfig {
    return readJsonSafely<GlobalConfig>(GLOBAL_CONFIG_FILE, {});
  },
  getWorkspace(options?: ProjectLookupOptions): WorkspaceConfigSnapshot | null {
    return buildWorkspaceSnapshot(options?.cwd, options?.component, options?.localOnly);
  },
  setGlobalConfig(data: Partial<GlobalConfig>) {
    ensureSecureDir(GLOBAL_DIR);
    const current = this.getGlobalConfig();
    const next: GlobalConfig = { ...current, ...data };
    writeJsonSafely(GLOBAL_CONFIG_FILE, next);
  }
};
