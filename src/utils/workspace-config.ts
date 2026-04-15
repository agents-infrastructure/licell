import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { normalizeProject, type ProjectConfig } from './config';

export interface WorkspaceFileShape {
  schemaVersion?: number;
  defaultComponent?: string;
  defaults?: Record<string, unknown>;
  components: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

const WORKSPACE_SCHEMA_VERSION = 3;
const LEGACY_COMPATIBILITY_KEYS = [
  'schemaVersion',
  'appName',
  'runtime',
  'deployType',
  'acrNamespace',
  'domain',
  'domainSuffix',
  'entry',
  'dist',
  'target',
  'enableCdn',
  'enableSSL',
  'useVpc',
  'region',
  'envs',
  'resources',
  'hooks',
  'network',
  'cache',
  'database',
  'artifact',
  'deployTarget',
  'route'
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

export function normalizeComponentName(input: string) {
  const value = input.trim().toLowerCase();
  if (!value) throw new Error('component 不能为空');
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(value)) {
    throw new Error('component 仅支持小写字母、数字、短横线和下划线，且必须以字母或数字开头');
  }
  return value;
}

export function deriveDefaultAppName(componentName: string, componentPath: string) {
  const source = componentName || componentPath.split('/').filter(Boolean).pop() || 'app';
  return source
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'app';
}

export function normalizeWorkspacePath(rootDir: string, input: string | undefined, componentName: string) {
  const candidate = (input || componentName).trim();
  if (!candidate) return componentName;
  const resolvedPath = resolve(rootDir, candidate);
  const relativePath = relative(rootDir, resolvedPath).replace(/\\/g, '/');
  if (relativePath.startsWith('..')) {
    throw new Error('workspace component path 必须位于当前目录内');
  }
  const normalized = relativePath.replace(/\/+$/g, '');
  return normalized === '' ? '.' : normalized;
}

export function readWorkspaceFile(rootDir: string): WorkspaceFileShape | null {
  const filePath = join(rootDir, '.licell', 'project.json');
  if (!existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as unknown;
  if (!isRecord(raw)) {
    throw new Error('project 配置格式无效');
  }
  if (!isRecord(raw.components)) {
    return null;
  }
  return raw as WorkspaceFileShape;
}

export function readProjectFile(rootDir: string): Record<string, unknown> | null {
  const filePath = join(rootDir, '.licell', 'project.json');
  if (!existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as unknown;
  if (!isRecord(raw)) {
    throw new Error('project 配置格式无效');
  }
  return raw;
}

function buildCompatibilityRoot(project: ProjectConfig) {
  const root: Record<string, unknown> = {};
  for (const key of LEGACY_COMPATIBILITY_KEYS) {
    const value = project[key];
    if (value !== undefined) {
      root[key] = value;
    }
  }
  return root;
}

export function buildWorkspacePayload(base: WorkspaceFileShape, preserveKeys: Record<string, unknown> = {}) {
  const defaultComponentName = toOptionalString(base.defaultComponent);
  const defaultComponentRaw = defaultComponentName && isRecord(base.components[defaultComponentName])
    ? base.components[defaultComponentName]
    : undefined;
  const { path: _path, ...defaultComponentProjectRaw } = defaultComponentRaw || {};
  const compatibilityRoot = defaultComponentRaw ? buildCompatibilityRoot(normalizeProject(defaultComponentProjectRaw)) : {};

  return {
    ...preserveKeys,
    ...compatibilityRoot,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    ...(base.defaultComponent ? { defaultComponent: base.defaultComponent } : {}),
    ...(base.defaults ? { defaults: base.defaults } : {}),
    components: base.components
  };
}

export function writeWorkspaceFile(rootDir: string, payload: WorkspaceFileShape, preserveKeys: Record<string, unknown> = {}) {
  const dir = join(rootDir, '.licell');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const next = buildWorkspacePayload(payload, preserveKeys);
  writeFileSync(join(dir, 'project.json'), `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
}

export interface UpsertWorkspaceComponentOptions {
  rootDir: string;
  componentName: string;
  componentPath: string;
  project: ProjectConfig;
  defaultComponent?: boolean;
}

export function upsertWorkspaceComponent(options: UpsertWorkspaceComponentOptions) {
  const rawProject = readProjectFile(options.rootDir);
  const existingWorkspace = readWorkspaceFile(options.rootDir);
  const preservedRoot = rawProject
    ? Object.fromEntries(Object.entries(rawProject).filter(([key]) => key !== 'components' && key !== 'defaultComponent'))
    : {};
  const workspace: WorkspaceFileShape = existingWorkspace || { schemaVersion: WORKSPACE_SCHEMA_VERSION, components: {} };
  const nextWorkspace: WorkspaceFileShape = {
    ...workspace,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    ...(options.defaultComponent
      ? { defaultComponent: options.componentName }
      : workspace.defaultComponent
        ? { defaultComponent: workspace.defaultComponent }
        : Object.keys(workspace.components).length === 0
          ? { defaultComponent: options.componentName }
          : {}),
    components: {
      ...workspace.components,
      [options.componentName]: {
        path: options.componentPath,
        ...options.project
      }
    }
  };
  writeWorkspaceFile(options.rootDir, nextWorkspace, preservedRoot);
  return nextWorkspace;
}
