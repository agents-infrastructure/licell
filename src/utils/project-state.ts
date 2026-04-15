import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { Config } from './config';

const STATE_SCHEMA_VERSION = 1;

export interface LicellStateResourceRef {
  name: string;
  region?: string;
}

export interface LicellStateAliasRef {
  name?: string;
  versionId?: string;
}

export interface LicellStateCdnRef {
  enabled?: boolean;
  cname?: string;
}

export interface LicellStateRoute {
  url?: string;
  domain?: string;
  ssl?: boolean;
}

export interface LicellStateLiveRevision {
  versionId?: string;
  artifactDigest?: string;
  commitSha?: string;
  deployedAt?: string;
}

export interface LicellComponentState {
  resources?: {
    bucket?: LicellStateResourceRef;
    function?: LicellStateResourceRef;
    alias?: LicellStateAliasRef;
    cdn?: LicellStateCdnRef;
  };
  route?: LicellStateRoute;
  liveRevision?: LicellStateLiveRevision;
  [key: string]: unknown;
}

export interface LicellBootstrapSelectionState {
  mode?: 'single' | 'batch';
  selectedComponents: string[];
  skippedComponents?: string[];
  defaultComponent?: string;
  appliedAt?: string;
}

export interface LicellStateFile {
  schemaVersion: number;
  defaultComponent?: string;
  bootstrap?: LicellBootstrapSelectionState;
  components: Record<string, LicellComponentState>;
}

export interface StateLookupOptions {
  cwd?: string;
  component?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function toOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

function normalizeStateResourceRef(raw: unknown): LicellStateResourceRef | undefined {
  if (!isRecord(raw)) return undefined;
  const name = toOptionalString(raw.name);
  const region = toOptionalString(raw.region)?.toLowerCase();
  if (!name) return undefined;
  return {
    name,
    ...(region ? { region } : {})
  };
}

function normalizeStateAliasRef(raw: unknown): LicellStateAliasRef | undefined {
  if (!isRecord(raw)) return undefined;
  const name = toOptionalString(raw.name);
  const versionId = toOptionalString(raw.versionId);
  if (!name && !versionId) return undefined;
  return {
    ...(name ? { name } : {}),
    ...(versionId ? { versionId } : {})
  };
}

function normalizeStateCdnRef(raw: unknown): LicellStateCdnRef | undefined {
  if (!isRecord(raw)) return undefined;
  const enabled = toOptionalBoolean(raw.enabled);
  const cname = toOptionalString(raw.cname);
  if (enabled === undefined && !cname) return undefined;
  return {
    ...(enabled !== undefined ? { enabled } : {}),
    ...(cname ? { cname } : {})
  };
}

function normalizeStateRoute(raw: unknown): LicellStateRoute | undefined {
  if (!isRecord(raw)) return undefined;
  const url = toOptionalString(raw.url);
  const domain = toOptionalString(raw.domain)?.toLowerCase();
  const ssl = toOptionalBoolean(raw.ssl);
  if (!url && !domain && ssl === undefined) return undefined;
  return {
    ...(url ? { url } : {}),
    ...(domain ? { domain } : {}),
    ...(ssl !== undefined ? { ssl } : {})
  };
}

function normalizeStateLiveRevision(raw: unknown): LicellStateLiveRevision | undefined {
  if (!isRecord(raw)) return undefined;
  const versionId = toOptionalString(raw.versionId);
  const artifactDigest = toOptionalString(raw.artifactDigest);
  const commitSha = toOptionalString(raw.commitSha);
  const deployedAt = toOptionalString(raw.deployedAt);
  if (!versionId && !artifactDigest && !commitSha && !deployedAt) return undefined;
  return {
    ...(versionId ? { versionId } : {}),
    ...(artifactDigest ? { artifactDigest } : {}),
    ...(commitSha ? { commitSha } : {}),
    ...(deployedAt ? { deployedAt } : {})
  };
}

function normalizeBootstrapSelectionState(raw: unknown): LicellBootstrapSelectionState | undefined {
  if (!isRecord(raw)) return undefined;
  const mode = raw.mode === 'single' || raw.mode === 'batch' ? raw.mode : undefined;
  const selectedComponents = Array.isArray(raw.selectedComponents)
    ? raw.selectedComponents
      .map((item) => toOptionalString(item))
      .filter((item): item is string => Boolean(item))
    : [];
  const skippedComponents = Array.isArray(raw.skippedComponents)
    ? raw.skippedComponents
      .map((item) => toOptionalString(item))
      .filter((item): item is string => Boolean(item))
    : [];
  const defaultComponent = toOptionalString(raw.defaultComponent);
  const appliedAt = toOptionalString(raw.appliedAt);
  if (!mode && selectedComponents.length === 0 && skippedComponents.length === 0 && !defaultComponent && !appliedAt) {
    return undefined;
  }
  return {
    ...(mode ? { mode } : {}),
    selectedComponents,
    ...(skippedComponents.length > 0 ? { skippedComponents } : {}),
    ...(defaultComponent ? { defaultComponent } : {}),
    ...(appliedAt ? { appliedAt } : {})
  };
}

export function normalizeLicellComponentState(raw: unknown): LicellComponentState {
  const record = isRecord(raw) ? raw : {};
  const resourcesRaw = isRecord(record.resources) ? record.resources : {};
  const resources = {
    ...(normalizeStateResourceRef(resourcesRaw.bucket) ? { bucket: normalizeStateResourceRef(resourcesRaw.bucket) } : {}),
    ...(normalizeStateResourceRef(resourcesRaw.function) ? { function: normalizeStateResourceRef(resourcesRaw.function) } : {}),
    ...(normalizeStateAliasRef(resourcesRaw.alias) ? { alias: normalizeStateAliasRef(resourcesRaw.alias) } : {}),
    ...(normalizeStateCdnRef(resourcesRaw.cdn) ? { cdn: normalizeStateCdnRef(resourcesRaw.cdn) } : {})
  };

  return {
    ...(Object.keys(resources).length > 0 ? { resources } : {}),
    ...(normalizeStateRoute(record.route) ? { route: normalizeStateRoute(record.route) } : {}),
    ...(normalizeStateLiveRevision(record.liveRevision) ? { liveRevision: normalizeStateLiveRevision(record.liveRevision) } : {})
  };
}

export function normalizeLicellStateFile(raw: unknown): LicellStateFile {
  const record = isRecord(raw) ? raw : {};
  const componentsRaw = isRecord(record.components) ? record.components : {};
  const components = Object.fromEntries(
    Object.entries(componentsRaw)
      .filter(([, value]) => isRecord(value))
      .map(([name, value]) => [name, normalizeLicellComponentState(value)])
  );
  const defaultComponent = toOptionalString(record.defaultComponent);
  const bootstrap = normalizeBootstrapSelectionState(record.bootstrap);
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    ...(defaultComponent ? { defaultComponent } : {}),
    ...(bootstrap ? { bootstrap } : {}),
    components
  };
}

function resolveStateRootDir(startDir = process.cwd()) {
  const snapshot = Config.getWorkspace({ cwd: startDir });
  if (snapshot) return snapshot.rootDir;
  return resolve(startDir);
}

export function getLicellStateFilePath(startDir = process.cwd()) {
  return join(resolveStateRootDir(startDir), '.licell', 'state.json');
}

export function readLicellState(startDir = process.cwd()): LicellStateFile {
  const filePath = getLicellStateFilePath(startDir);
  if (!existsSync(filePath)) {
    const snapshot = Config.getWorkspace({ cwd: startDir });
    return {
      schemaVersion: STATE_SCHEMA_VERSION,
      ...(snapshot?.defaultComponent ? { defaultComponent: snapshot.defaultComponent } : {}),
      components: {}
    };
  }
  try {
    return normalizeLicellStateFile(JSON.parse(readFileSync(filePath, 'utf-8')) as unknown);
  } catch {
    return { schemaVersion: STATE_SCHEMA_VERSION, components: {} };
  }
}

export function writeLicellState(rootDir: string, payload: LicellStateFile) {
  const filePath = join(rootDir, '.licell', 'state.json');
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tmpPath, `${JSON.stringify(normalizeLicellStateFile(payload), null, 2)}\n`, { mode: 0o600 });
    renameSync(tmpPath, filePath);
  } catch (err) {
    try { rmSync(tmpPath, { force: true }); } catch { /* ignore */ }
    throw err;
  }
}

function mergeRecord<T extends object>(base: T | undefined, patch: T | undefined) {
  return {
    ...(base || {}),
    ...(patch || {})
  } as T;
}

export function mergeLicellComponentState(
  base: LicellComponentState | undefined,
  patch: LicellComponentState
): LicellComponentState {
  const normalizedBase = normalizeLicellComponentState(base);
  const normalizedPatch = normalizeLicellComponentState(patch);
  return normalizeLicellComponentState({
    resources: {
      ...mergeRecord(normalizedBase.resources, normalizedPatch.resources),
      bucket: normalizedPatch.resources?.bucket || normalizedBase.resources?.bucket,
      function: normalizedPatch.resources?.function || normalizedBase.resources?.function,
      alias: normalizedPatch.resources?.alias || normalizedBase.resources?.alias,
      cdn: mergeRecord(normalizedBase.resources?.cdn, normalizedPatch.resources?.cdn)
    },
    route: mergeRecord(normalizedBase.route, normalizedPatch.route),
    liveRevision: mergeRecord(normalizedBase.liveRevision, normalizedPatch.liveRevision)
  });
}

export function resolveStateComponentName(options: StateLookupOptions = {}) {
  const snapshot = Config.getWorkspace({ cwd: options.cwd, component: options.component });
  return options.component || snapshot?.componentName || snapshot?.defaultComponent || 'default';
}

export function setLicellBootstrapSelection(
  input: {
    mode: 'single' | 'batch';
    selectedComponents: string[];
    skippedComponents?: string[];
    defaultComponent?: string;
  },
  startDir = process.cwd()
) {
  const rootDir = resolveStateRootDir(startDir);
  const current = readLicellState(rootDir);
  const defaultComponent = input.defaultComponent || current.defaultComponent;
  const next: LicellStateFile = {
    ...current,
    schemaVersion: STATE_SCHEMA_VERSION,
    ...(defaultComponent ? { defaultComponent } : {}),
    bootstrap: {
      mode: input.mode,
      selectedComponents: [...input.selectedComponents],
      ...(input.skippedComponents && input.skippedComponents.length > 0 ? { skippedComponents: [...input.skippedComponents] } : {}),
      ...(defaultComponent ? { defaultComponent } : {}),
      appliedAt: new Date().toISOString()
    },
    components: current.components
  };
  writeLicellState(rootDir, next);
  return next;
}

export function updateLicellComponentState(
  patch: LicellComponentState,
  options: StateLookupOptions = {}
) {
  const rootDir = resolveStateRootDir(options.cwd);
  const current = readLicellState(rootDir);
  const component = resolveStateComponentName(options);
  const next: LicellStateFile = {
    ...current,
    schemaVersion: STATE_SCHEMA_VERSION,
    ...(current.defaultComponent || (component !== 'default' ? component : undefined)
      ? { defaultComponent: current.defaultComponent || (component !== 'default' ? component : undefined) }
      : {}),
    components: {
      ...current.components,
      [component]: mergeLicellComponentState(current.components[component], patch)
    }
  };
  writeLicellState(rootDir, next);
  return next;
}

export function resolveCurrentCommitSha(cwd = process.cwd()) {
  const envSha = process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA;
  if (envSha && envSha.trim().length > 0) return envSha.trim();
  try {
    return execSync('git rev-parse HEAD', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString('utf-8').trim() || undefined;
  } catch {
    return undefined;
  }
}
