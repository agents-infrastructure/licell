import * as $FC from '@alicloud/fc20230330';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { Config } from '../../../utils/config';
import { checkDockerAvailable, dockerBuild, dockerLogin, dockerPush } from '../../../utils/docker';
import { generateDockerfile, detectProjectType } from '../../../utils/dockerfile';
import { ensureAcrReady, getDockerLoginCredentials, buildImageUri, formatTimestampTag } from '../../cr';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

const CUSTOM_CONTAINER_RUNTIME = 'custom-container';
const DEFAULT_PORT = 9000;
const GENERATED_DOCKER_DIR = '.licell/docker';
const GENERATED_DOCKERFILE = '.licell/docker/Dockerfile.generated';

function normalizePath(input: string) {
  return input.replace(/\\/g, '/');
}

function readPackageScripts(projectRoot: string): Record<string, unknown> {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return {};
  try {
    const data = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { scripts?: Record<string, unknown> };
    return data.scripts || {};
  } catch {
    return {};
  }
}

function resolveNodeEntry(projectRoot: string, entryFile?: string): string {
  if (entryFile) return normalizePath(entryFile);

  const hasTsConfig = existsSync(join(projectRoot, 'tsconfig.json'));
  const scripts = readPackageScripts(projectRoot);
  const hasBuildScript = typeof scripts.build === 'string' && scripts.build.trim().length > 0;

  if (hasTsConfig && !hasBuildScript) {
    throw new Error(
      '检测到 tsconfig.json，但 package.json 未定义 build 脚本，无法推断容器入口文件。\n' +
      '请提供 --entry（例如 dist/index.js），或补充 build 脚本，或手动维护 Dockerfile。'
    );
  }

  return hasTsConfig ? 'dist/index.js' : 'src/index.js';
}

function resolvePythonEntry(projectRoot: string, entryFile?: string): string {
  if (entryFile) return normalizePath(entryFile);
  if (existsSync(join(projectRoot, 'src/main.py'))) return 'src/main.py';
  if (existsSync(join(projectRoot, 'main.py'))) return 'main.py';
  return 'src/main.py';
}

function writeNodeBootstrap(projectRoot: string, appEntry: string): string {
  const bootstrapRelativePath = `${GENERATED_DOCKER_DIR}/node-bootstrap.cjs`;
  const bootstrapDir = GENERATED_DOCKER_DIR;
  const appEntryFromBootstrap = normalizePath(relative(bootstrapDir, appEntry));
  const source = `'use strict';
const http = require('http');
const path = require('path');
const { pathToFileURL } = require('url');

const ENTRY_RELATIVE = ${JSON.stringify(appEntryFromBootstrap)};
const port = Number(process.env.FC_SERVER_PORT || process.env.PORT || ${DEFAULT_PORT});
let handlerPromise;

async function loadHandler() {
  const entryAbsPath = path.resolve(__dirname, ENTRY_RELATIVE);
  let requireError;

  try {
    const mod = require(entryAbsPath);
    const handler = typeof mod.handler === 'function'
      ? mod.handler
      : (typeof mod.default === 'function' ? mod.default : null);
    if (typeof handler === 'function') return handler;
  } catch (error) {
    requireError = error;
    if (!(error && typeof error === 'object' && error.code === 'ERR_REQUIRE_ESM')) throw error;
  }

  const imported = await import(pathToFileURL(entryAbsPath).href);
  const handler = typeof imported.handler === 'function'
    ? imported.handler
    : (typeof imported.default === 'function' ? imported.default : null);
  if (typeof handler === 'function') return handler;

  if (requireError) throw requireError;
  throw new Error('入口文件需导出 handler 或 default 函数');
}

function getHandler() {
  if (!handlerPromise) handlerPromise = loadHandler();
  return handlerPromise;
}

function normalizeHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (Array.isArray(value)) out[key] = value.join(',');
    else if (typeof value === 'string') out[key] = value;
    else if (typeof value === 'number') out[key] = String(value);
  }
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function toEvent(req) {
  const bodyBuffer = await readBody(req);
  const url = new URL(req.url || '/', 'http://localhost');
  const queryParameters = {};
  for (const [key, value] of url.searchParams.entries()) queryParameters[key] = value;
  const method = req.method || 'GET';
  return {
    path: url.pathname,
    rawPath: url.pathname,
    rawQueryString: url.search.slice(1),
    httpMethod: method,
    headers: normalizeHeaders(req.headers),
    queryParameters,
    body: bodyBuffer.toString('utf8'),
    isBase64Encoded: false,
    requestContext: {
      http: {
        method,
        path: url.pathname,
        sourceIp: req.socket?.remoteAddress || ''
      }
    }
  };
}

function writeResult(res, result) {
  if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'statusCode')) {
    const statusCode = Number(result.statusCode);
    res.statusCode = Number.isFinite(statusCode) ? statusCode : 200;
    const headers = result.headers && typeof result.headers === 'object' ? result.headers : {};
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined || value === null) continue;
      res.setHeader(key, String(value));
    }
    const body = result.body;
    if (body === undefined || body === null) { res.end(); return; }
    if (Buffer.isBuffer(body) || typeof body === 'string') { res.end(body); return; }
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
    return;
  }
  if (result === undefined || result === null) { res.statusCode = 204; res.end(); return; }
  if (Buffer.isBuffer(result) || typeof result === 'string') { res.statusCode = 200; res.end(result); return; }
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result));
}

const server = http.createServer(async (req, res) => {
  try {
    const handler = await getHandler();
    const event = await toEvent(req);
    const result = await handler(event, {});
    writeResult(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write('[licell] handler error: ' + message + '\\n');
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

server.listen(port, '0.0.0.0');
`;
  const bootstrapPath = join(projectRoot, bootstrapRelativePath);
  mkdirSync(join(projectRoot, GENERATED_DOCKER_DIR), { recursive: true });
  writeFileSync(bootstrapPath, source);
  return bootstrapRelativePath;
}

function writePythonBootstrap(projectRoot: string, appEntry: string): string {
  const bootstrapRelativePath = `${GENERATED_DOCKER_DIR}/python-bootstrap.py`;
  const bootstrapDir = GENERATED_DOCKER_DIR;
  const appEntryFromBootstrap = normalizePath(relative(bootstrapDir, appEntry));
  const source = `#!/usr/bin/env python3
import asyncio
import importlib.util
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ENTRY_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), ${JSON.stringify(appEntryFromBootstrap)}))
CODE_ROOT = "/app"

if CODE_ROOT not in sys.path:
  sys.path.insert(0, CODE_ROOT)
entry_parent = os.path.dirname(ENTRY_PATH)
if entry_parent and entry_parent not in sys.path:
  sys.path.insert(0, entry_parent)

spec = importlib.util.spec_from_file_location("licell_entry_module", ENTRY_PATH)
if spec is None or spec.loader is None:
  raise RuntimeError(f"无法加载 Python 入口文件: {ENTRY_PATH}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
handler = getattr(module, "handler", None)
if not callable(handler):
  raise RuntimeError("Python 入口文件必须包含可调用的 handler(event, context) 函数")

def _json_bytes(payload):
  return json.dumps(payload, ensure_ascii=False).encode("utf-8")

def _normalize_event(method, path, headers, body_bytes, source_ip):
  parsed = urlparse(path)
  query_params = {k: (v[-1] if v else "") for k, v in parse_qs(parsed.query, keep_blank_values=True).items()}
  return {
    "path": parsed.path,
    "rawPath": parsed.path,
    "rawQueryString": parsed.query,
    "httpMethod": method,
    "headers": headers,
    "queryParameters": query_params,
    "body": body_bytes.decode("utf-8", errors="replace"),
    "isBase64Encoded": False,
    "requestContext": {
      "http": {
        "method": method,
        "path": parsed.path,
        "sourceIp": source_ip or ""
      }
    }
  }

def _normalize_response(result):
  if isinstance(result, dict) and "statusCode" in result:
    status = int(result.get("statusCode", 200) or 200)
    headers = result.get("headers") if isinstance(result.get("headers"), dict) else {}
    body = result.get("body")
    if body is None:
      return status, headers, b""
    if isinstance(body, (bytes, bytearray)):
      return status, headers, bytes(body)
    if isinstance(body, str):
      return status, headers, body.encode("utf-8")
    response_headers = {"content-type": "application/json; charset=utf-8", **headers}
    return status, response_headers, _json_bytes(body)

  if result is None:
    return 204, {}, b""
  if isinstance(result, (bytes, bytearray)):
    return 200, {}, bytes(result)
  if isinstance(result, str):
    return 200, {}, result.encode("utf-8")
  return 200, {"content-type": "application/json; charset=utf-8"}, _json_bytes(result)

class RequestHandler(BaseHTTPRequestHandler):
  def _handle(self):
    content_length = int(self.headers.get("content-length") or 0)
    body = self.rfile.read(content_length) if content_length > 0 else b""
    headers = {k: v for k, v in self.headers.items()}
    source_ip = self.client_address[0] if self.client_address else ""
    event = _normalize_event(self.command, self.path, headers, body, source_ip)
    try:
      result = handler(event, {})
      if asyncio.iscoroutine(result):
        result = asyncio.run(result)
      status, out_headers, out_body = _normalize_response(result)
    except Exception as error:
      print(f"[licell] handler error: {error}", file=sys.stderr)
      status = 500
      out_headers = {"content-type": "application/json; charset=utf-8"}
      out_body = _json_bytes({"error": "Internal Server Error"})

    self.send_response(status)
    for key, value in out_headers.items():
      if value is None:
        continue
      self.send_header(str(key), str(value))
    self.end_headers()
    if out_body:
      self.wfile.write(out_body)

  def do_GET(self): self._handle()
  def do_POST(self): self._handle()
  def do_PUT(self): self._handle()
  def do_PATCH(self): self._handle()
  def do_DELETE(self): self._handle()
  def do_HEAD(self): self._handle()
  def do_OPTIONS(self): self._handle()

  def log_message(self, _format, *_args):
    return

if __name__ == "__main__":
  port = int(os.getenv("FC_SERVER_PORT", os.getenv("PORT", "${DEFAULT_PORT}")))
  server = ThreadingHTTPServer(("0.0.0.0", port), RequestHandler)
  server.serve_forever()
`;
  const bootstrapPath = join(projectRoot, bootstrapRelativePath);
  mkdirSync(join(projectRoot, GENERATED_DOCKER_DIR), { recursive: true });
  writeFileSync(bootstrapPath, source);
  return bootstrapRelativePath;
}

function ensureGeneratedDockerfile(projectRoot: string, entryFile: string) {
  const detector = detectProjectType(projectRoot);
  if (!detector) {
    throw new Error(
      '未找到 Dockerfile，且无法自动探测项目类型。\n' +
      '请在项目根目录创建 Dockerfile，或确保存在 package.json / requirements.txt'
    );
  }

  const normalizedEntry = normalizePath(entryFile || '');
  let bootstrapEntry: string;
  if (detector.name === 'nodejs') {
    const appEntry = resolveNodeEntry(projectRoot, normalizedEntry || undefined);
    bootstrapEntry = writeNodeBootstrap(projectRoot, appEntry);
  } else if (detector.name === 'python') {
    const appEntry = resolvePythonEntry(projectRoot, normalizedEntry || undefined);
    bootstrapEntry = writePythonBootstrap(projectRoot, appEntry);
  } else {
    throw new Error(`不支持为 ${detector.name} 自动生成 Dockerfile，请手动维护 Dockerfile`);
  }

  const dockerfileContent = generateDockerfile(projectRoot, bootstrapEntry);
  const generatedDockerfilePath = join(projectRoot, GENERATED_DOCKERFILE);
  mkdirSync(join(projectRoot, GENERATED_DOCKER_DIR), { recursive: true });
  writeFileSync(generatedDockerfilePath, dockerfileContent);
  return generatedDockerfilePath;
}

export const dockerHandler: RuntimeHandler = {
  name: 'docker',
  defaultEntry: '',
  unsupportedMessage: '当前地域暂不支持 custom-container 运行时。请确认目标地域支持自定义容器镜像后重试。',

  async prepareBootFile(entryFile: string, _outdir: string) {
    const projectRoot = process.cwd();

    checkDockerAvailable();

    const dockerfilePath = existsSync(join(projectRoot, 'Dockerfile'))
      ? join(projectRoot, 'Dockerfile')
      : ensureGeneratedDockerfile(projectRoot, entryFile);

    const auth = Config.requireAuth();
    const project = Config.getProject();
    const appName = project.appName;
    if (!appName) throw new Error('appName 未设置，请检查项目配置');

    const acrInfo = await ensureAcrReady(appName, auth.region, auth, project.acrNamespace);
    const tag = formatTimestampTag();
    const pushUri = buildImageUri(acrInfo, tag, false);

    dockerBuild(pushUri, projectRoot, dockerfilePath);

    const creds = await getDockerLoginCredentials(acrInfo, auth);
    dockerLogin(creds.endpoint, creds.userName, creds.password);
    dockerPush(pushUri);

    const vpcUri = buildImageUri(acrInfo, tag, true);
    return vpcUri;
  },

  async resolveConfig(_outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
    return {
      runtime: CUSTOM_CONTAINER_RUNTIME,
      handler: 'not-used',
      customContainerConfig: new $FC.CustomContainerConfig({
        image: bootFile,
        port: DEFAULT_PORT
      }),
      skipCodePackaging: true
    };
  }
};
