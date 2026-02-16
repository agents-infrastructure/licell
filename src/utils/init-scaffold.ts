import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { normalizeFcRuntime } from '../providers/fc';

export type InitTemplate = 'node' | 'python';

export interface ScaffoldFile {
  path: string;
  content: string;
}

const NODE_RUNTIMES = new Set(['nodejs20', 'nodejs22']);
const PYTHON_RUNTIMES = new Set(['python3.12', 'python3.13']);

export function normalizeInitTemplate(input: string): InitTemplate {
  const value = input.trim().toLowerCase();
  if (value === 'node' || value === 'nodejs' || value === 'typescript' || value === 'ts') return 'node';
  if (value === 'python' || value === 'py') return 'python';
  throw new Error('--template 仅支持 node 或 python');
}

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

export function resolveInitTemplateAndRuntime(
  templateInput?: string,
  runtimeInput?: string
): { template: InitTemplate; runtime: string } {
  const runtime = runtimeInput ? normalizeFcRuntime(runtimeInput) : undefined;

  let template: InitTemplate | undefined;
  if (templateInput) template = normalizeInitTemplate(templateInput);
  else if (runtime) template = PYTHON_RUNTIMES.has(runtime) ? 'python' : 'node';
  else template = 'node';

  const finalRuntime = runtime || (template === 'python' ? 'python3.12' : 'nodejs20');
  const allowed = template === 'python' ? PYTHON_RUNTIMES : NODE_RUNTIMES;
  if (!allowed.has(finalRuntime)) {
    throw new Error(`template=${template} 与 runtime=${finalRuntime} 不匹配`);
  }

  return { template, runtime: finalRuntime };
}

export function getScaffoldFiles(template: InitTemplate): ScaffoldFile[] {
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
