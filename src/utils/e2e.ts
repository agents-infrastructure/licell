import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

export type E2eSuite = 'smoke' | 'full';
export type E2eRunStatus = 'running' | 'succeeded' | 'failed' | 'cleaned' | 'partial_cleaned';
export type E2eStepStatus = 'ok' | 'failed' | 'skipped';

export interface E2eStepRecord {
  name: string;
  command?: string;
  status: E2eStepStatus;
  startedAt: string;
  endedAt: string;
  error?: string;
}

export interface E2eCleanupRecord {
  attemptedAt?: string;
  finishedAt?: string;
  status?: 'done' | 'partial' | 'pending';
  details?: string[];
  errors?: string[];
}

export interface E2eManifest {
  runId: string;
  suite: E2eSuite;
  status: E2eRunStatus;
  createdAt: string;
  updatedAt: string;
  projectRoot: string;
  workspaceDir: string;
  target: string;
  runtime: string;
  resources: {
    appName?: string;
    domain?: string;
    domainSuffix?: string;
    staticBucket?: string;
    dnsRecordIds?: string[];
  };
  steps: E2eStepRecord[];
  cleanup?: E2eCleanupRecord;
  notes?: string[];
}

export function normalizeE2eSuite(input: string | undefined): E2eSuite {
  const value = (input || '').trim().toLowerCase();
  if (!value || value === 'smoke') return 'smoke';
  if (value === 'full') return 'full';
  throw new Error('--suite 仅支持 smoke 或 full');
}

export function generateE2eRunId(now = new Date()) {
  const pad2 = (value: number) => String(value).padStart(2, '0');
  return [
    now.getUTCFullYear(),
    pad2(now.getUTCMonth() + 1),
    pad2(now.getUTCDate()),
    '-',
    pad2(now.getUTCHours()),
    pad2(now.getUTCMinutes()),
    pad2(now.getUTCSeconds()),
    '-',
    String(now.getTime()).slice(-4)
  ].join('');
}

export function getE2eManifestDir(projectRoot = process.cwd()) {
  return join(projectRoot, '.licell', 'e2e');
}

export function getE2eManifestPath(runId: string, projectRoot = process.cwd()) {
  return join(getE2eManifestDir(projectRoot), `${runId}.json`);
}

export function ensureE2eManifestDir(projectRoot = process.cwd()) {
  const dir = getE2eManifestDir(projectRoot);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveE2eManifest(manifest: E2eManifest, projectRoot = manifest.projectRoot) {
  ensureE2eManifestDir(projectRoot);
  const path = getE2eManifestPath(manifest.runId, projectRoot);
  writeFileSync(path, JSON.stringify(manifest, null, 2));
  return path;
}

export function loadE2eManifest(runId: string, projectRoot = process.cwd()) {
  const path = getE2eManifestPath(runId, projectRoot);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as E2eManifest;
}

export function listE2eManifestRunIds(projectRoot = process.cwd()) {
  const dir = getE2eManifestDir(projectRoot);
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir)
    .filter((item) => item.endsWith('.json'))
    .map((item) => item.slice(0, -5))
    .filter((item) => item.length > 0);
  entries.sort((a, b) => b.localeCompare(a));
  return entries;
}

export function resolveDefaultE2eManifestRunId(projectRoot = process.cwd()) {
  const list = listE2eManifestRunIds(projectRoot);
  return list[0];
}

export function ensureEmptyOrMissingDir(path: string) {
  if (!existsSync(path)) return;
  const stats = statSync(path);
  if (!stats.isDirectory()) {
    throw new Error(`路径已存在且不是目录: ${path}`);
  }
  const children = readdirSync(path);
  if (children.length > 0) {
    throw new Error(`目录非空，请更换 --workspace 或先清理: ${path}`);
  }
}

export interface CliSelfInvocation {
  command: string;
  prefixArgs: string[];
}

export function resolveSelfCliInvocation(
  processArgv = process.argv,
  execPath = process.execPath,
  cwd = process.cwd(),
  existsFn: (path: string) => boolean = existsSync
): CliSelfInvocation {
  const scriptArg = processArgv[1];
  if (scriptArg && typeof scriptArg === 'string' && !scriptArg.startsWith('-')) {
    const scriptPath = resolve(cwd, scriptArg);
    if (existsFn(scriptPath)) {
      return {
        command: execPath,
        prefixArgs: [scriptPath]
      };
    }
  }
  return {
    command: execPath,
    prefixArgs: []
  };
}
