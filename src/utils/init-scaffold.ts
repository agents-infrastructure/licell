import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { normalizeFcRuntime } from '../providers/fc';

export type InitTemplate = 'node' | 'python' | 'docker';

export interface ScaffoldFile {
  path: string;
  content: string;
}

const NODE_RUNTIMES = new Set(['nodejs20', 'nodejs22']);
const PYTHON_RUNTIMES = new Set(['python3.12', 'python3.13']);
const DOCKER_RUNTIMES = new Set(['docker']);
const WORKSPACE_IGNORE_ENTRIES = new Set(['.licell', '.ali', '.git', '.DS_Store', '.vscode', '.idea', 'node_modules']);

export function deriveDefaultAppName(cwd = process.cwd()) {
  const raw = basename(cwd).toLowerCase();
  const sanitized = raw
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || 'licell-app';
}

export function validateAppName(input: string) {
  const appName = input.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(appName)) throw new Error('应用名仅允许小写字母、数字和短横线');
  if (appName.length > 128) throw new Error('应用名长度不能超过 128 个字符');
  return appName;
}

export function templateForRuntime(runtime: string): InitTemplate {
  if (PYTHON_RUNTIMES.has(runtime)) return 'python';
  if (DOCKER_RUNTIMES.has(runtime)) return 'docker';
  if (NODE_RUNTIMES.has(runtime)) return 'node';
  throw new Error(`不支持的 runtime: ${runtime}`);
}

export function resolveInitRuntime(runtimeInput?: string): { template: InitTemplate; runtime: string } {
  const runtime = runtimeInput ? normalizeFcRuntime(runtimeInput) : 'nodejs20';
  const template = templateForRuntime(runtime);
  return { template, runtime };
}

export function getScaffoldFiles(template: InitTemplate): ScaffoldFile[] {
  if (template === 'docker') {
    return [
      {
        path: 'package.json',
        content: `{
  "name": "licell-docker-hono",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build ./src/index.ts --target bun --outfile dist/index.js",
    "start": "bun run dist/index.js"
  },
  "dependencies": {
    "hono": "^4.10.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.9"
  }
}
`
      },
      {
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["bun"]
  }
}
`
      },
      {
        path: 'src/index.ts',
        content: `import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    ok: true,
    message: 'Hello from Licell Docker + Bun + Hono',
    runtime: 'docker'
  });
});

const port = Number(process.env.PORT || 9000);

export default {
  port,
  fetch: app.fetch
};
`
      },
      {
        path: 'Dockerfile',
        content: `FROM oven/bun:1-slim
WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bun run build

ENV PORT=9000
EXPOSE 9000

CMD ["bun", "run", "start"]
`
      },
      {
        path: '.dockerignore',
        content: `node_modules
dist
.git
.licell
.ali
`
      }
    ];
  }

  if (template === 'python') {
    return [
      {
        path: 'src/main.py',
        content: `import json

def _pick_path(event):
  if isinstance(event, dict):
    path = event.get("path") or event.get("rawPath")
    if isinstance(path, str) and path:
      return path
  return "/"

def handler(event, context):
  payload = {"ok": True, "message": "Hello from Licell Python Scaffold", "path": _pick_path(event)}
  return {
    "statusCode": 200,
    "headers": {"content-type": "application/json; charset=utf-8"},
    "body": json.dumps(payload, ensure_ascii=False)
  }
`
      },
      {
        path: 'requirements.txt',
        content: `# Add your Python dependencies here
`
      }
    ];
  }

  return [{
    path: 'src/index.ts',
    content: `interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function pickPath(event: unknown) {
  if (typeof event !== 'object' || event === null) return '/';
  const data = event as Record<string, unknown>;
  if (typeof data.path === 'string') return data.path;
  if (typeof data.rawPath === 'string') return data.rawPath;
  return '/';
}

export async function handler(event: unknown): Promise<HttpResponse> {
  const payload = {
    ok: true,
    message: 'Hello from Licell Node Scaffold',
    path: pickPath(event)
  };

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  };
}
`
  }];
}

export function isWorkspaceEffectivelyEmpty(rootDir: string = process.cwd()) {
  const entriesInDir = readdirSync(rootDir, { withFileTypes: true })
    .map((entry) => entry.name)
    .filter((name) => !WORKSPACE_IGNORE_ENTRIES.has(name));
  if (entriesInDir.length > 0) return false;

  const entries = [
    '.gitignore',
    'package.json',
    'pyproject.toml',
    'requirements.txt',
    'Dockerfile',
    'bun.lock',
    'bun.lockb',
    'pnpm-lock.yaml',
    'yarn.lock',
    'package-lock.json',
    'npm-shrinkwrap.json',
    'tsconfig.json',
    'src',
    'app'
  ];

  for (const entry of entries) {
    if (existsSync(join(rootDir, entry))) return false;
  }

  const probableEntries = ['.env', 'README.md'];
  for (const entry of probableEntries) {
    if (existsSync(join(rootDir, entry))) return false;
  }

  return true;
}

export function detectWorkspaceTemplateAndRuntime(rootDir: string = process.cwd()): { template: InitTemplate; runtime: string } {
  if (existsSync(join(rootDir, 'Dockerfile'))) return { template: 'docker', runtime: 'docker' };
  if (
    existsSync(join(rootDir, 'requirements.txt'))
    || existsSync(join(rootDir, 'pyproject.toml'))
    || existsSync(join(rootDir, 'src', 'main.py'))
  ) {
    return { template: 'python', runtime: 'python3.12' };
  }
  if (
    existsSync(join(rootDir, 'package.json'))
    || existsSync(join(rootDir, 'bun.lock'))
    || existsSync(join(rootDir, 'bun.lockb'))
    || existsSync(join(rootDir, 'pnpm-lock.yaml'))
    || existsSync(join(rootDir, 'yarn.lock'))
    || existsSync(join(rootDir, 'package-lock.json'))
    || existsSync(join(rootDir, 'npm-shrinkwrap.json'))
    || existsSync(join(rootDir, 'tsconfig.json'))
    || existsSync(join(rootDir, 'src', 'index.ts'))
    || existsSync(join(rootDir, 'src', 'index.js'))
  ) {
    return { template: 'node', runtime: 'nodejs20' };
  }
  return { template: 'node', runtime: 'nodejs20' };
}

export function writeScaffoldFiles(rootDir: string, files: ScaffoldFile[], force = false) {
  const conflicts: string[] = [];
  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const absolutePath = join(rootDir, file.path);
    if (!existsSync(absolutePath)) continue;
    const current = readFileSync(absolutePath, 'utf-8');
    if (current === file.content) {
      skipped.push(file.path);
      continue;
    }
    if (!force) conflicts.push(file.path);
  }

  if (conflicts.length > 0) {
    throw new Error(`以下文件已存在且内容不同，请使用 --force 覆盖:\n${conflicts.join('\n')}`);
  }

  for (const file of files) {
    const absolutePath = join(rootDir, file.path);
    if (existsSync(absolutePath) && readFileSync(absolutePath, 'utf-8') === file.content) continue;
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, file.content);
    written.push(file.path);
  }

  return { written, skipped };
}
