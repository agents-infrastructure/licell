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

function resolveScaffoldRuntime(template: InitTemplate, runtime?: string) {
  if (template === 'docker') return 'docker';
  if (template === 'python') {
    if (runtime && PYTHON_RUNTIMES.has(runtime)) return runtime;
    return 'python3.12';
  }
  if (runtime && NODE_RUNTIMES.has(runtime)) return runtime;
  return 'nodejs20';
}

export function getScaffoldFiles(template: InitTemplate, runtime?: string): ScaffoldFile[] {
  const scaffoldRuntime = resolveScaffoldRuntime(template, runtime);

  if (template === 'docker') {
    return [
      {
        path: '.gitignore',
        content: `node_modules
.licell/
.ali/
.env
`
      },
      {
        path: 'package.json',
        content: `{
  "name": "licell-docker-bun-hono-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun run src/index.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.14.1",
    "hono": "^4.10.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.9",
    "typescript": "^5.6.3"
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
import { serve } from '@hono/node-server';

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const todos: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Read Licell docs',
    done: true,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'todo-2',
    title: 'Deploy this example to FC',
    done: false,
    priority: 'high',
    createdAt: new Date().toISOString()
  }
];

function runtimeName() {
  return process.env.LICELL_FC_RUNTIME || process.env.FC_RUNTIME || process.env.RUNTIME || 'docker';
}

function regionName() {
  return process.env.LICELL_REGION || process.env.ALI_REGION || process.env.FC_REGION || process.env.REGION || 'unknown';
}

function parsePriority(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}

const app = new Hono();

app.get('/', (c) => c.json({
  ok: true,
  service: 'licell-docker-bun-hono-api',
  framework: 'hono',
  runtime: runtimeName(),
  endpoints: ['GET /healthz', 'GET /meta', 'GET /echo?message=', 'GET /todos', 'POST /todos', 'PATCH /todos/:id/toggle', 'POST /math/sum']
}));

app.get('/healthz', (c) => c.json({
  ok: true,
  now: new Date().toISOString(),
  framework: 'hono',
  runtime: runtimeName()
}));

app.get('/meta', (c) => c.json({
  ok: true,
  framework: 'hono',
  runtime: runtimeName(),
  region: regionName(),
  appName: process.env.LICELL_APP_NAME || process.env.APP_NAME || 'unknown'
}));

app.get('/echo', (c) => {
  const message = c.req.query('message') || 'hello-from-hono';
  return c.json({
    ok: true,
    message,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query()
  });
});

app.get('/todos', (c) => {
  const done = c.req.query('done');
  let items = todos;
  if (done === 'true') items = todos.filter((item) => item.done);
  else if (done === 'false') items = todos.filter((item) => !item.done);
  else if (done !== undefined) return c.json({ ok: false, error: 'done must be true or false' }, 400);

  return c.json({ ok: true, total: items.length, items });
});

app.post('/todos', async (c) => {
  const payload = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  if (!title) return c.json({ ok: false, error: 'title is required' }, 400);
  if (title.length > 120) return c.json({ ok: false, error: 'title is too long' }, 400);

  const item: TodoItem = {
    id: 'todo-' + Date.now(),
    title,
    done: false,
    priority: parsePriority(payload?.priority),
    createdAt: new Date().toISOString()
  };
  todos.unshift(item);

  return c.json({ ok: true, item, total: todos.length }, 201);
});

app.patch('/todos/:id/toggle', (c) => {
  const id = c.req.param('id');
  const item = todos.find((todo) => todo.id === id);
  if (!item) return c.json({ ok: false, error: 'todo not found' }, 404);
  item.done = !item.done;
  return c.json({ ok: true, item });
});

app.post('/math/sum', async (c) => {
  const payload = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const numbers = payload?.numbers;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return c.json({ ok: false, error: 'numbers must be a non-empty array' }, 400);
  }
  if (numbers.length > 100) {
    return c.json({ ok: false, error: 'numbers array is too large' }, 400);
  }

  const normalized = numbers.map((value) => Number(value));
  if (normalized.some((value) => !Number.isFinite(value))) {
    return c.json({ ok: false, error: 'numbers must contain only finite values' }, 400);
  }

  const sum = normalized.reduce((acc, value) => acc + value, 0);
  return c.json({
    ok: true,
    count: normalized.length,
    sum,
    average: sum / normalized.length
  });
});

const port = Number(process.env.PORT || process.env.FC_SERVER_PORT || 9000);
serve({ fetch: app.fetch, port });

console.log('[docker-bun-hono-api] listening on http://127.0.0.1:' + port);
`
      },
      {
        path: 'Dockerfile',
        content: `FROM oven/bun:1-slim
WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

ENV PORT=9000
EXPOSE 9000

CMD ["bun", "run", "src/index.ts"]
`
      },
      {
        path: 'README.md',
        content: `# Docker + Bun + Hono API

通过 \`licell init --runtime docker\` 生成，示例风格与仓库 \`examples/docker-bun-hono-api\` 对齐。

## 本地运行

\`\`\`bash
bun install
bun run dev
\`\`\`

## 部署

\`\`\`bash
licell deploy --type api --runtime docker --target preview
\`\`\`
`
      }
    ];
  }

  if (template === 'python') {
    return [
      {
        path: '.gitignore',
        content: `__pycache__/
.venv/
.licell/
.ali/
.env
`
      },
      {
        path: 'requirements.txt',
        content: `Flask==3.0.3
`
      },
      {
        path: 'src/main.py',
        content: `import base64
import json
import os
import time
from typing import Any
from urllib.parse import urlencode

from flask import Flask, jsonify, request

app = Flask(__name__)
START_TIME = time.time()

TODOS = [
    {
        "id": "todo-1",
        "title": "Read Licell docs",
        "done": True,
        "priority": "medium",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    },
    {
        "id": "todo-2",
        "title": "Deploy this example to FC",
        "done": False,
        "priority": "high",
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    },
]


def runtime_name() -> str:
    return (
        os.getenv("LICELL_FC_RUNTIME")
        or os.getenv("FC_RUNTIME")
        or os.getenv("RUNTIME")
        or "${scaffoldRuntime}"
    )


def region_name() -> str:
    return (
        os.getenv("LICELL_REGION")
        or os.getenv("ALI_REGION")
        or os.getenv("FC_REGION")
        or os.getenv("REGION")
        or "unknown"
    )


def parse_priority(value: Any) -> str:
    if value in ("low", "medium", "high"):
        return value
    return "medium"


@app.route("/", methods=["GET"])
def index():
    return jsonify(
        {
            "ok": True,
            "service": "licell-python-flask-api",
            "framework": "flask",
            "runtime": runtime_name(),
            "endpoints": [
                "GET /healthz",
                "GET /meta",
                "GET /echo?message=",
                "GET /todos",
                "POST /todos",
                "PATCH /todos/<id>/toggle",
                "POST /math/sum",
            ],
        }
    )


@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify(
        {
            "ok": True,
            "now": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "uptimeSec": int(time.time() - START_TIME),
            "framework": "flask",
            "runtime": runtime_name(),
        }
    )


@app.route("/meta", methods=["GET"])
def meta():
    return jsonify(
        {
            "ok": True,
            "framework": "flask",
            "runtime": runtime_name(),
            "region": region_name(),
            "appName": os.getenv("LICELL_APP_NAME") or os.getenv("APP_NAME") or "unknown",
        }
    )


@app.route("/echo", methods=["GET"])
def echo():
    message = request.args.get("message", "hello-from-flask")
    return jsonify(
        {
            "ok": True,
            "message": message,
            "method": request.method,
            "path": request.path,
            "query": request.args.to_dict(flat=True),
        }
    )


@app.route("/todos", methods=["GET"])
def list_todos():
    done_arg = request.args.get("done")
    if done_arg is None:
        items = TODOS
    elif done_arg == "true":
        items = [item for item in TODOS if item["done"]]
    elif done_arg == "false":
        items = [item for item in TODOS if not item["done"]]
    else:
        return jsonify({"ok": False, "error": "done must be true or false"}), 400

    return jsonify({"ok": True, "total": len(items), "items": items})


@app.route("/todos", methods=["POST"])
def create_todo():
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title", "")).strip()
    if not title:
        return jsonify({"ok": False, "error": "title is required"}), 400
    if len(title) > 120:
        return jsonify({"ok": False, "error": "title is too long"}), 400

    todo = {
        "id": "todo-" + str(int(time.time() * 1000)),
        "title": title,
        "done": False,
        "priority": parse_priority(payload.get("priority")),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    TODOS.insert(0, todo)
    return jsonify({"ok": True, "item": todo, "total": len(TODOS)}), 201


@app.route("/todos/<todo_id>/toggle", methods=["PATCH"])
def toggle_todo(todo_id: str):
    for item in TODOS:
        if item["id"] == todo_id:
            item["done"] = not item["done"]
            return jsonify({"ok": True, "item": item})
    return jsonify({"ok": False, "error": "todo not found"}), 404


@app.route("/math/sum", methods=["POST"])
def math_sum():
    payload = request.get_json(silent=True) or {}
    numbers = payload.get("numbers")
    if not isinstance(numbers, list) or len(numbers) == 0:
        return jsonify({"ok": False, "error": "numbers must be a non-empty array"}), 400
    if len(numbers) > 100:
        return jsonify({"ok": False, "error": "numbers array is too large"}), 400

    normalized = []
    for value in numbers:
        try:
            normalized.append(float(value))
        except (TypeError, ValueError):
            return jsonify({"ok": False, "error": "numbers must contain only numeric values"}), 400

    total = sum(normalized)
    return jsonify(
        {
            "ok": True,
            "count": len(normalized),
            "sum": total,
            "average": total / len(normalized),
        }
    )


def _to_dict(event: Any) -> dict[str, Any]:
    if isinstance(event, dict):
        return event
    if isinstance(event, str):
        try:
            parsed = json.loads(event)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            return {}
    return {}


def _extract_method(event: dict[str, Any]) -> str:
    method = event.get("httpMethod")
    if isinstance(method, str):
        return method.upper()

    request_context = event.get("requestContext")
    if isinstance(request_context, dict):
        http_obj = request_context.get("http")
        if isinstance(http_obj, dict):
            http_method = http_obj.get("method")
            if isinstance(http_method, str):
                return http_method.upper()

    return "GET"


def _extract_path(event: dict[str, Any]) -> str:
    for key in ("path", "rawPath"):
        value = event.get(key)
        if isinstance(value, str) and value:
            return value

    request_context = event.get("requestContext")
    if isinstance(request_context, dict):
        http_obj = request_context.get("http")
        if isinstance(http_obj, dict):
            http_path = http_obj.get("path")
            if isinstance(http_path, str) and http_path:
                return http_path

    return "/"


def _extract_query(event: dict[str, Any]) -> str:
    raw_query = event.get("rawQueryString")
    if isinstance(raw_query, str):
        return raw_query

    query_params = event.get("queryParameters")
    if isinstance(query_params, dict):
        normalized = {str(k): str(v) for k, v in query_params.items() if v is not None}
        return urlencode(normalized)

    return ""


def _extract_headers(event: dict[str, Any]) -> dict[str, str]:
    headers = event.get("headers")
    if not isinstance(headers, dict):
        return {}
    return {str(k): str(v) for k, v in headers.items() if v is not None}


def _extract_body(event: dict[str, Any]) -> bytes:
    body = event.get("body")
    if body is None:
        return b""

    is_base64 = event.get("isBase64Encoded") is True
    if isinstance(body, str):
        return base64.b64decode(body) if is_base64 else body.encode("utf-8")

    if isinstance(body, (dict, list)):
        return json.dumps(body, ensure_ascii=False).encode("utf-8")

    return str(body).encode("utf-8")


def handler(event: Any, context: Any):
    data = _to_dict(event)
    method = _extract_method(data)
    path = _extract_path(data)
    query = _extract_query(data)
    headers = _extract_headers(data)
    body = _extract_body(data)

    if body and "content-type" not in {k.lower() for k in headers.keys()}:
        headers["content-type"] = "application/json; charset=utf-8"

    full_path = path if not query else path + "?" + query

    with app.test_client() as client:
        response = client.open(path=full_path, method=method, headers=headers, data=body)

    out_headers = {k: v for k, v in response.headers.items() if k.lower() not in {"content-length", "server", "date"}}
    return {
        "statusCode": response.status_code,
        "headers": out_headers,
        "body": response.get_data(as_text=True),
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", "9000"))
    app.run(host="0.0.0.0", port=port)
`
      },
      {
        path: 'README.md',
        content: `# Python Flask API

通过 \`licell init --runtime ${scaffoldRuntime}\` 生成，示例风格与仓库 \`examples/python313-flask-api\` 对齐。

## 本地运行

\`\`\`bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/main.py
\`\`\`

## 部署

\`\`\`bash
licell deploy --type api --runtime ${scaffoldRuntime} --entry src/main.py --target preview
\`\`\`
`
      }
    ];
  }

  return [
    {
      path: '.gitignore',
      content: `node_modules
.licell/
.ali/
.env
`
    },
    {
      path: 'package.json',
      content: `{
  "name": "licell-node-express-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/dev.ts"
  },
  "dependencies": {
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.17.57",
    "typescript": "^5.6.3"
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
    "types": ["node"]
  }
}
`
    },
    {
      path: 'src/app.ts',
      content: `import express, { type NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';

interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const todos: TodoItem[] = [
  {
    id: 'todo-1',
    title: 'Read Licell docs',
    done: true,
    priority: 'medium',
    createdAt: new Date().toISOString()
  },
  {
    id: 'todo-2',
    title: 'Deploy this example to FC',
    done: false,
    priority: 'high',
    createdAt: new Date().toISOString()
  }
];

function runtimeName() {
  return process.env.LICELL_FC_RUNTIME || process.env.FC_RUNTIME || process.env.RUNTIME || '${scaffoldRuntime}';
}

function regionName() {
  return process.env.LICELL_REGION || process.env.ALI_REGION || process.env.FC_REGION || process.env.REGION || 'unknown';
}

function parsePriority(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return 'medium';
}

function parseDoneFilter(value: unknown): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] ? String(req.headers['x-request-id']) : randomUUID();
  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  next();
});

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'licell-node-express-api',
    framework: 'express',
    runtime: runtimeName(),
    endpoints: ['GET /healthz', 'GET /meta', 'GET /echo?message=', 'GET /todos', 'POST /todos', 'PATCH /todos/:id/toggle', 'POST /math/sum']
  });
});

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    now: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    framework: 'express',
    runtime: runtimeName()
  });
});

app.get('/meta', (_req, res) => {
  res.json({
    ok: true,
    framework: 'express',
    runtime: runtimeName(),
    region: regionName(),
    appName: process.env.LICELL_APP_NAME || process.env.APP_NAME || 'unknown',
    requestId: res.locals.requestId
  });
});

app.get('/echo', (req, res) => {
  const message = typeof req.query.message === 'string' ? req.query.message : 'hello-from-express';
  res.json({
    ok: true,
    message,
    method: req.method,
    path: req.path,
    query: req.query,
    requestId: res.locals.requestId
  });
});

app.get('/todos', (req, res) => {
  const done = parseDoneFilter(req.query.done);
  const items = done === undefined ? todos : todos.filter((item) => item.done === done);
  res.json({
    ok: true,
    total: items.length,
    items,
    requestId: res.locals.requestId
  });
});

app.post('/todos', (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) throw new ApiError(400, 'title is required');
  if (title.length > 120) throw new ApiError(400, 'title is too long');

  const todo: TodoItem = {
    id: 'todo-' + Date.now(),
    title,
    done: false,
    priority: parsePriority(req.body?.priority),
    createdAt: new Date().toISOString()
  };
  todos.unshift(todo);

  res.status(201).json({
    ok: true,
    item: todo,
    total: todos.length,
    requestId: res.locals.requestId
  });
});

app.patch('/todos/:id/toggle', (req, res) => {
  const todo = todos.find((item) => item.id === req.params.id);
  if (!todo) throw new ApiError(404, 'todo not found');
  todo.done = !todo.done;

  res.json({
    ok: true,
    item: todo,
    requestId: res.locals.requestId
  });
});

app.post('/math/sum', (req, res) => {
  const numbers = req.body?.numbers;
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new ApiError(400, 'numbers must be a non-empty array');
  }
  if (numbers.length > 100) {
    throw new ApiError(400, 'numbers array is too large');
  }

  const normalized = numbers.map((value) => Number(value));
  if (normalized.some((value) => !Number.isFinite(value))) {
    throw new ApiError(400, 'numbers must contain only finite values');
  }

  const sum = normalized.reduce((acc, value) => acc + value, 0);
  res.json({
    ok: true,
    count: normalized.length,
    sum,
    average: sum / normalized.length,
    requestId: res.locals.requestId
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ ok: false, error: err.message, details: err.details, requestId: res.locals.requestId });
    return;
  }
  if (err instanceof Error && err.name === 'SyntaxError') {
    res.status(400).json({ ok: false, error: 'invalid JSON body', requestId: res.locals.requestId });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ ok: false, error: message, requestId: res.locals.requestId });
});

export { app };
`
    },
    {
      path: 'src/index.ts',
      content: `import type { AddressInfo } from 'net';
import { app } from './app';

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface NormalizedRequest {
  method: string;
  path: string;
  rawQueryString: string;
  headers: Record<string, string>;
  body?: Buffer;
}

let baseUrlPromise: Promise<string> | null = null;

function toRecord(input: unknown): Record<string, unknown> {
  if (typeof input === 'object' && input !== null) return input as Record<string, unknown>;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeHeaders(input: unknown): Record<string, string> {
  const source = toRecord(input);
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue;
    headers[String(key).toLowerCase()] = String(value);
  }
  return headers;
}

function pickMethod(event: Record<string, unknown>) {
  if (typeof event.httpMethod === 'string') return event.httpMethod.toUpperCase();
  const requestContext = toRecord(event.requestContext);
  const http = toRecord(requestContext.http);
  if (typeof http.method === 'string') return http.method.toUpperCase();
  return 'GET';
}

function pickPath(event: Record<string, unknown>) {
  if (typeof event.path === 'string') return event.path;
  if (typeof event.rawPath === 'string') return event.rawPath;
  const requestContext = toRecord(event.requestContext);
  const http = toRecord(requestContext.http);
  if (typeof http.path === 'string') return http.path;
  return '/';
}

function pickRawQueryString(event: Record<string, unknown>) {
  if (typeof event.rawQueryString === 'string') return event.rawQueryString;
  const queryParameters = toRecord(event.queryParameters);
  const entries = Object.entries(queryParameters).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) return '';
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    params.set(key, String(value));
  }
  return params.toString();
}

function pickBody(event: Record<string, unknown>): Buffer | undefined {
  const body = event.body;
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string') {
    const isBase64 = event.isBase64Encoded === true;
    return isBase64 ? Buffer.from(body, 'base64') : Buffer.from(body);
  }
  if (Buffer.isBuffer(body)) return body;
  return Buffer.from(JSON.stringify(body));
}

function normalizeEvent(event: unknown): NormalizedRequest {
  const data = toRecord(event);
  return {
    method: pickMethod(data),
    path: pickPath(data),
    rawQueryString: pickRawQueryString(data),
    headers: normalizeHeaders(data.headers),
    body: pickBody(data)
  };
}

async function ensureBaseUrl() {
  if (!baseUrlPromise) {
    baseUrlPromise = new Promise((resolve, reject) => {
      const server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo | null;
        if (!address) {
          reject(new Error('Failed to start Express app'));
          return;
        }
        resolve('http://127.0.0.1:' + address.port);
      });
      server.on('error', reject);
    });
  }
  return baseUrlPromise;
}

function canIncludeBody(method: string) {
  return method !== 'GET' && method !== 'HEAD';
}

export async function handler(event: unknown): Promise<HttpResponse> {
  const req = normalizeEvent(event);
  const baseUrl = await ensureBaseUrl();
  const querySuffix = req.rawQueryString ? '?' + req.rawQueryString : '';
  const url = baseUrl + req.path + querySuffix;

  const bodyInit = req.body && canIncludeBody(req.method)
    ? (new Uint8Array(req.body) as BodyInit)
    : undefined;

  const response = await fetch(url, {
    method: req.method,
    headers: req.headers,
    body: bodyInit
  });

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    statusCode: response.status,
    headers,
    body: await response.text()
  };
}
`
    },
    {
      path: 'src/dev.ts',
      content: `import { app } from './app';

const port = Number(process.env.PORT || 9000);
app.listen(port, '0.0.0.0', () => {
  console.log('[node-express-api] listening on http://127.0.0.1:' + port);
});
`
    },
    {
      path: 'README.md',
      content: `# Node + Express API

通过 \`licell init --runtime ${scaffoldRuntime}\` 生成，示例风格与仓库 \`examples/node22-express-api\` 对齐。

## 本地运行

\`\`\`bash
bun install
bun run dev
\`\`\`

## 部署

\`\`\`bash
licell deploy --type api --runtime ${scaffoldRuntime} --entry src/index.ts --target preview
\`\`\`
`
    }
  ];
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
