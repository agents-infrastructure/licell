import { Dirent, existsSync, readdirSync, readFileSync } from 'fs';
import { basename, join, relative, resolve } from 'path';

export interface WorkspaceDiscoverQuestion {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export interface WorkspaceDiscoverProposal {
  component: string;
  path: string;
  confidence: number;
  type: 'static' | 'api' | 'task';
  artifact: {
    kind: 'directory' | 'source';
    path?: string;
    entry?: string;
  };
  deployTarget: {
    service: 'oss-static' | 'fc-http' | 'fc-task';
    runtime?: string;
    bucket?: string;
    function?: string;
  };
  route: {
    cdn?: boolean;
    ssl?: boolean;
  };
  signals: string[];
}

export interface WorkspaceDiscoverResult {
  rootDir: string;
  components: WorkspaceDiscoverProposal[];
  questions: WorkspaceDiscoverQuestion[];
}

interface PackageJsonSummary {
  name?: string;
  workspaces: string[];
  dependencies: Set<string>;
  scripts: Set<string>;
}

interface CandidateProposal extends Omit<WorkspaceDiscoverProposal, 'component'> {
  baseComponent: string;
}

const IGNORE_DIRS = new Set(['.git', '.svn', '.hg', '.idea', '.vscode', 'node_modules', '.next', '.turbo', 'dist', 'build', 'coverage']);
const CONTAINER_DIRS = new Set(['apps', 'packages', 'services', 'workers', 'functions', 'jobs', 'modules', 'packages-apps']);
const SOURCE_CONTAINER_DIRS = new Set(['src', 'app', 'lib']);
const MAX_SCAN_DEPTH = 4;

function toComponentName(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'app';
}

function repoSlug(rootDir: string) {
  return toComponentName(basename(rootDir));
}

function safeRelative(rootDir: string, fullPath: string) {
  const value = relative(rootDir, fullPath).replace(/\\/g, '/');
  return value || '.';
}

function hasAnyFile(dir: string, candidates: string[]) {
  return candidates.some((candidate) => existsSync(join(dir, candidate)));
}

function readPackageJson(dir: string): PackageJsonSummary | null {
  const filePath = join(dir, 'package.json');
  if (!existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
    const deps = new Set<string>();
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const value = raw[field];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const key of Object.keys(value as Record<string, unknown>)) deps.add(key);
      }
    }
    const scripts = new Set<string>();
    if (raw.scripts && typeof raw.scripts === 'object' && !Array.isArray(raw.scripts)) {
      for (const key of Object.keys(raw.scripts as Record<string, unknown>)) scripts.add(key);
    }
    const workspacesRaw = raw.workspaces;
    const workspaceList: string[] = [];
    if (Array.isArray(workspacesRaw)) {
      for (const item of workspacesRaw) {
        if (typeof item === 'string' && item.trim()) workspaceList.push(item.trim());
      }
    } else if (workspacesRaw && typeof workspacesRaw === 'object' && Array.isArray((workspacesRaw as { packages?: unknown[] }).packages)) {
      for (const item of (workspacesRaw as { packages?: unknown[] }).packages || []) {
        if (typeof item === 'string' && item.trim()) workspaceList.push(item.trim());
      }
    }
    return {
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : undefined,
      workspaces: workspaceList,
      dependencies: deps,
      scripts
    };
  } catch {
    return null;
  }
}

function listVisibleSubdirs(dir: string) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory() && !IGNORE_DIRS.has(entry.name) && !entry.name.startsWith('.'))
    .map((entry) => join(dir, entry.name));
}

function detectRuntime(dir: string, pkg: PackageJsonSummary | null) {
  if (existsSync(join(dir, 'Dockerfile'))) return 'docker';
  if (hasAnyFile(dir, ['src/main.py', 'main.py', 'app.py', 'src/app.py', 'worker.py', 'src/worker.py', 'celery_app.py'])) return 'python3.13';
  if (pkg && (pkg.dependencies.has('python-shell') || pkg.dependencies.has('bullmq') || pkg.dependencies.has('hono') || pkg.dependencies.has('express'))) {
    return 'nodejs22';
  }
  if (hasAnyFile(dir, ['src/index.ts', 'src/index.js', 'src/server.ts', 'src/server.js', 'server.ts', 'server.js', 'app.ts', 'app.js'])) return 'nodejs22';
  return undefined;
}

function detectStaticArtifactPath(dir: string) {
  if (existsSync(join(dir, 'dist'))) return 'dist';
  if (existsSync(join(dir, 'build'))) return 'build';
  if (existsSync(join(dir, 'out'))) return 'out';
  if (existsSync(join(dir, '.next'))) return '.next';
  return 'dist';
}

function detectSourceEntry(dir: string, task = false) {
  const taskCandidates = ['src/task.ts', 'src/worker.ts', 'task.ts', 'worker.ts', 'src/task.py', 'src/worker.py', 'task.py', 'worker.py', 'celery_app.py'];
  const apiCandidates = ['src/index.ts', 'src/index.js', 'src/main.py', 'src/server.ts', 'src/server.js', 'app.ts', 'app.js', 'main.py'];
  const candidates = task ? taskCandidates : apiCandidates;
  return candidates.find((candidate) => existsSync(join(dir, candidate))) || (task ? 'src/task.ts' : 'src/index.ts');
}

function hasDependency(pkg: PackageJsonSummary | null, names: string[]) {
  if (!pkg) return false;
  return names.some((name) => pkg.dependencies.has(name));
}

function hasScript(pkg: PackageJsonSummary | null, names: string[]) {
  if (!pkg) return false;
  return names.some((name) => pkg.scripts.has(name));
}

function isWorkspaceContainer(dir: string, pkg: PackageJsonSummary | null, childDirs: string[]) {
  const name = basename(dir).toLowerCase();
  if (pkg?.workspaces.length) return true;
  if (!CONTAINER_DIRS.has(name)) return false;
  const childProjectCount = childDirs.filter((childDir) => {
    return Boolean(readPackageJson(childDir)) || hasAnyFile(childDir, ['src/index.ts', 'src/index.js', 'src/task.ts', 'src/task.py', 'index.html']);
  }).length;
  return childProjectCount > 0;
}

function scoreDirectory(rootDir: string, dir: string): CandidateProposal | null {
  const name = basename(dir).toLowerCase();
  if (SOURCE_CONTAINER_DIRS.has(name) && !existsSync(join(dir, 'package.json'))) return null;
  const pkg = readPackageJson(dir);
  const childDirs = listVisibleSubdirs(dir);
  const signals: string[] = [];
  let staticScore = 0;
  let apiScore = 0;
  let taskScore = 0;

  if (hasAnyFile(dir, ['index.html', 'vite.config.ts', 'vite.config.js', 'next.config.js', 'next.config.mjs', 'nuxt.config.ts', 'astro.config.mjs', 'svelte.config.js', 'svelte.config.ts'])) {
    staticScore += 3;
    signals.push('frontend-config');
  }
  if (existsSync(join(dir, 'public')) || existsSync(join(dir, 'app'))) {
    staticScore += 1;
    signals.push('frontend-structure');
  }
  if (existsSync(join(dir, 'dist')) || existsSync(join(dir, 'build')) || existsSync(join(dir, 'out'))) {
    staticScore += 2;
    signals.push('static-artifact-dir');
  }
  if (/web|frontend|site|client|ui|docs|landing|admin/.test(name)) {
    staticScore += 1;
    signals.push('frontend-name');
  }
  if (hasDependency(pkg, ['next', 'vite', 'astro', 'nuxt', '@sveltejs/kit', 'react', 'vue'])) {
    staticScore += 2;
    signals.push('frontend-package');
  }
  if (hasScript(pkg, ['build', 'export'])) {
    staticScore += 1;
    signals.push('build-script');
  }

  if (hasAnyFile(dir, ['src/index.ts', 'src/index.js', 'src/server.ts', 'src/server.js', 'src/main.py', 'server.ts', 'server.js', 'app.ts', 'app.js', 'Dockerfile'])) {
    apiScore += 3;
    signals.push('api-entry');
  }
  if (/api|server|backend|service|gateway/.test(name)) {
    apiScore += 1;
    signals.push('api-name');
  }
  if (hasDependency(pkg, ['express', 'fastify', 'koa', 'hono', '@nestjs/core', '@nestjs/common', '@fastify/static'])) {
    apiScore += 3;
    signals.push('api-package');
  }
  if (hasScript(pkg, ['start', 'dev', 'serve'])) {
    apiScore += 1;
    signals.push('runtime-script');
  }

  if (hasAnyFile(dir, ['src/task.ts', 'src/worker.ts', 'task.ts', 'worker.ts', 'src/task.py', 'src/worker.py', 'task.py', 'worker.py', 'celery_app.py'])) {
    taskScore += 4;
    signals.push('task-entry');
  }
  if (/task|worker|job|queue|cron/.test(name)) {
    taskScore += 1;
    signals.push('task-name');
  }
  if (hasDependency(pkg, ['bullmq', 'bull', 'agenda', 'bree', 'celery'])) {
    taskScore += 2;
    signals.push('task-package');
  }

  const maxScore = Math.max(staticScore, apiScore, taskScore);
  if (maxScore <= 0) return null;
  if (isWorkspaceContainer(dir, pkg, childDirs) && maxScore < 5) return null;

  const path = safeRelative(rootDir, dir);
  const baseComponent = toComponentName(path === '.' ? basename(rootDir) : basename(dir));
  const slug = repoSlug(rootDir);

  if (taskScore === maxScore) {
    return {
      baseComponent,
      path,
      confidence: Math.min(0.95, 0.45 + (taskScore / 7)),
      type: 'task',
      artifact: { kind: 'source', entry: detectSourceEntry(dir, true) },
      deployTarget: { service: 'fc-task', function: `${slug}-${baseComponent}`, runtime: detectRuntime(dir, pkg) || 'nodejs22' },
      route: {},
      signals
    };
  }

  if (staticScore >= apiScore) {
    return {
      baseComponent,
      path,
      confidence: Math.min(0.95, 0.45 + (staticScore / 7)),
      type: 'static',
      artifact: { kind: 'directory', path: detectStaticArtifactPath(dir) },
      deployTarget: { service: 'oss-static', bucket: `${slug}-${baseComponent}` },
      route: { cdn: true, ssl: true },
      signals
    };
  }

  return {
    baseComponent,
    path,
    confidence: Math.min(0.95, 0.45 + (apiScore / 7)),
    type: 'api',
    artifact: { kind: 'source', entry: detectSourceEntry(dir) },
    deployTarget: { service: 'fc-http', function: `${slug}-${baseComponent}`, runtime: detectRuntime(dir, pkg) || 'nodejs22' },
    route: { ssl: true },
    signals
  };
}

function walkCandidateDirs(rootDir: string, dir: string, depth: number, acc: Set<string>) {
  if (depth > MAX_SCAN_DEPTH) return;
  acc.add(dir);
  const childDirs = listVisibleSubdirs(dir);
  for (const childDir of childDirs) {
    walkCandidateDirs(rootDir, childDir, depth + 1, acc);
  }
}

function listCandidateDirs(rootDir: string) {
  const dirs = new Set<string>();
  walkCandidateDirs(rootDir, rootDir, 0, dirs);
  return [...dirs];
}

function assignUniqueComponentNames(proposals: CandidateProposal[]) {
  const baseNameCounts = proposals.reduce<Map<string, number>>((map, proposal) => {
    map.set(proposal.baseComponent, (map.get(proposal.baseComponent) || 0) + 1);
    return map;
  }, new Map());

  return proposals.map((proposal) => {
    const segments = proposal.path === '.' ? [proposal.baseComponent] : proposal.path.split('/').filter(Boolean);
    const preferred = baseNameCounts.get(proposal.baseComponent) === 1
      ? proposal.baseComponent
      : toComponentName(segments.slice(-2).join('-'));
    return {
      ...proposal,
      component: preferred
    } satisfies WorkspaceDiscoverProposal;
  });
}

export function discoverWorkspaceComponents(rootDir = process.cwd()): WorkspaceDiscoverResult {
  const resolvedRoot = resolve(rootDir);
  const proposals = assignUniqueComponentNames(
    listCandidateDirs(resolvedRoot)
      .map((dir) => scoreDirectory(resolvedRoot, dir))
      .filter((value): value is CandidateProposal => value !== null)
      .sort((left, right) => left.path.localeCompare(right.path))
  );

  const questions: WorkspaceDiscoverQuestion[] = [];
  for (const proposal of proposals) {
    if (proposal.type === 'static') {
      questions.push({
        id: `${proposal.component}.bucket`,
        title: `确认静态组件 ${proposal.component} 的 OSS Bucket 名称`,
        description: `当前建议值为 ${proposal.deployTarget.bucket}。`,
        required: true
      });
      questions.push({
        id: `${proposal.component}.domain`,
        title: `确认静态组件 ${proposal.component} 的访问域名`,
        description: '如果暂时不绑定自定义域名，可回答 NONE。',
        required: true
      });
    } else if (proposal.type === 'api') {
      questions.push({
        id: `${proposal.component}.function`,
        title: `确认 API 组件 ${proposal.component} 的 FC Function 名称`,
        description: `当前建议值为 ${proposal.deployTarget.function}。`,
        required: true
      });
      questions.push({
        id: `${proposal.component}.domain`,
        title: `确认 API 组件 ${proposal.component} 的访问域名`,
        description: '如果暂时不绑定自定义域名，可回答 NONE。',
        required: true
      });
    } else {
      questions.push({
        id: `${proposal.component}.function`,
        title: `确认任务组件 ${proposal.component} 的 FC Function 名称`,
        description: `当前建议值为 ${proposal.deployTarget.function}。`,
        required: true
      });
    }
  }

  return {
    rootDir: resolvedRoot,
    components: proposals,
    questions
  };
}
