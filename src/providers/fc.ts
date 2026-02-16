import FC20230330, * as $FC from '@alicloud/fc20230330';
import * as $OpenApi from '@alicloud/openapi-client';
import AdmZip from 'adm-zip';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { Readable } from 'stream';
import { Config, type AuthConfig, type ProjectNetworkConfig } from '../utils/config';
import { isConflictError, formatErrorMessage } from '../utils/errors';
import { buildEntrypointWithBun } from '../utils/runtime';
import { createSharedFcClient, resolveSdkCtor } from '../utils/sdk';
import { prepareNode22RuntimeInCode } from '../utils/node22-runtime';
import { preparePython313RuntimeInCode } from '../utils/python313-runtime';
import { vendorPythonDependencies, type VendorPythonRuntime } from '../utils/python-deps';
import { withRetry } from '../utils/retry';
import { resolveProvidedNetwork } from './vpc';

export const SUPPORTED_FC_RUNTIMES = ['nodejs20', 'nodejs22', 'python3.12', 'python3.13'] as const;
export type FcRuntime = (typeof SUPPORTED_FC_RUNTIMES)[number];
export const DEFAULT_FC_RUNTIME: FcRuntime = 'nodejs20';
const CUSTOM_NODE22_FC_RUNTIME = 'custom.debian12';
const CUSTOM_NODE22_BOOTSTRAP = '.aero/node22-bootstrap.cjs';
const CUSTOM_NODE22_PORT = 9000;
const PYTHON_312_RUNTIME = 'python3.12';
const PYTHON_313_RUNTIME = 'python3.13';
const CUSTOM_PYTHON313_FC_RUNTIME = 'custom.debian12';
const CUSTOM_PYTHON313_BOOTSTRAP = '.aero/python313-bootstrap.py';
const CUSTOM_PYTHON313_PORT = 9000;
const PYTHON_COPY_IGNORED_DIRS = new Set([
  '.git',
  '.github',
  '.ali',
  '.tmp-build',
  '.pytest_cache',
  '__pycache__',
  'node_modules',
  '.venv',
  'venv',
  'dist',
  'coverage'
]);
const PYTHON_INCLUDE_FILES = new Set([
  'requirements.txt',
  'requirements-dev.txt',
  'pyproject.toml',
  'poetry.lock',
  'pipfile',
  'pipfile.lock'
]);
const DEFAULT_HTTP_TRIGGER_NAME = 'aero-http';
const DEFAULT_HTTP_TRIGGER_CONFIG = JSON.stringify({
  authType: 'anonymous',
  disableURLInternet: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
});

export interface FunctionSummary {
  functionName: string;
  runtime?: string;
  state?: string;
  lastModifiedTime?: string;
  description?: string;
}

export interface FunctionInvokeResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type ResolveNetworkLike = (options: { vpcId: string; vswId: string }) => Promise<{ sgId?: string }>;

export async function resolveFunctionVpcConfig(
  network: ProjectNetworkConfig | undefined,
  resolveNetwork: ResolveNetworkLike = resolveProvidedNetwork
) {
  if (!network) return undefined;
  const vpcId = network.vpcId?.trim();
  const vswId = network.vswId?.trim();
  if (!vpcId || !vswId) return undefined;

  let securityGroupId = network.sgId?.trim();
  if (!securityGroupId) {
    const resolved = await resolveNetwork({ vpcId, vswId });
    securityGroupId = resolved.sgId?.trim();
  }

  const vpcConfig: {
    vpcId: string;
    vSwitchIds: string[];
    securityGroupId?: string;
  } = {
    vpcId,
    vSwitchIds: [vswId]
  };
  if (securityGroupId) vpcConfig.securityGroupId = securityGroupId;
  return vpcConfig;
}

export function normalizeFcRuntime(input: string): FcRuntime {
  const value = input.trim().toLowerCase();
  if ((SUPPORTED_FC_RUNTIMES as readonly string[]).includes(value)) {
    return value as FcRuntime;
  }
  throw new Error(`函数运行时仅支持: ${SUPPORTED_FC_RUNTIMES.join(', ')}`);
}

function findFirstJsOutput(dir: string): string | null {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      const nested = findFirstJsOutput(fullPath);
      if (nested) return nested;
      continue;
    }
    if (fullPath.endsWith('.js')) return fullPath;
  }
  return null;
}

function shouldCopyPythonFile(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.endsWith('.py')) return true;
  const fileName = normalized.split('/').pop()?.toLowerCase() || '';
  return PYTHON_INCLUDE_FILES.has(fileName);
}

function copyPythonProjectFiles(sourceRoot: string, targetRoot: string, relativeDir = '') {
  const currentDir = relativeDir ? join(sourceRoot, relativeDir) : sourceRoot;
  for (const entry of readdirSync(currentDir)) {
    const entryLower = entry.toLowerCase();
    if (PYTHON_COPY_IGNORED_DIRS.has(entryLower)) continue;

    const nextRelative = relativeDir ? `${relativeDir}/${entry}` : entry;
    const sourcePath = join(sourceRoot, nextRelative);
    const stats = statSync(sourcePath);
    if (stats.isDirectory()) {
      copyPythonProjectFiles(sourceRoot, targetRoot, nextRelative);
      continue;
    }
    if (!stats.isFile()) continue;
    if (!shouldCopyPythonFile(nextRelative)) continue;

    const targetPath = join(targetRoot, nextRelative);
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
  }
}

async function preparePythonEntrypoint(entryFile: string, outdir: string, runtime: VendorPythonRuntime) {
  const normalizedEntry = entryFile.replace(/\\/g, '/');
  if (!normalizedEntry.endsWith('.py')) {
    throw new Error('Python runtime 要求入口文件为 .py（并导出 handler 函数）');
  }
  copyPythonProjectFiles(process.cwd(), outdir);
  await vendorPythonDependencies({
    runtime,
    sourceRoot: process.cwd(),
    outdir
  });
  const copiedEntry = join(outdir, normalizedEntry);
  if (!existsSync(copiedEntry)) {
    throw new Error(`Python 入口文件未打包进部署产物: ${normalizedEntry}`);
  }
  return normalizedEntry;
}

function createPython313Bootstrap(outdir: string, entryFileInCode: string) {
  const bootstrapPath = join(outdir, CUSTOM_PYTHON313_BOOTSTRAP);
  mkdirSync(join(outdir, '.aero'), { recursive: true });
  const entryPath = `/code/${entryFileInCode.replace(/\\/g, '/')}`;
  const source = `#!/usr/bin/env python3
import asyncio
import importlib.util
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ENTRY_PATH = ${JSON.stringify(entryPath)}
CODE_ROOT = "/code"

if CODE_ROOT not in sys.path:
  sys.path.insert(0, CODE_ROOT)
entry_parent = os.path.dirname(ENTRY_PATH)
if entry_parent and entry_parent not in sys.path:
  sys.path.insert(0, entry_parent)

spec = importlib.util.spec_from_file_location("aero_entry_module", ENTRY_PATH)
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
      status = 500
      out_headers = {"content-type": "application/json; charset=utf-8"}
      out_body = _json_bytes({"error": str(error)})

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
  port = int(os.getenv("FC_SERVER_PORT", os.getenv("PORT", "${CUSTOM_PYTHON313_PORT}")))
  server = ThreadingHTTPServer(("0.0.0.0", port), RequestHandler)
  server.serve_forever()
`;
  writeFileSync(bootstrapPath, source);
  return CUSTOM_PYTHON313_BOOTSTRAP;
}

function createFcClient(auth?: AuthConfig) {
  return createSharedFcClient(auth);
}

interface ResolvedRuntimeConfig {
  runtime: string;
  handler: string;
  customRuntimeConfig?: $FC.CustomRuntimeConfig;
}

function createNode22Bootstrap(outdir: string, bootFile: string) {
  const bootstrapPath = join(outdir, CUSTOM_NODE22_BOOTSTRAP);
  mkdirSync(join(outdir, '.aero'), { recursive: true });
  const entryRequirePath = `./${relative('.aero', bootFile).replace(/\\/g, '/')}`;
  const source = `'use strict';
const http = require('http');
const { URL } = require('url');

const mod = require(${JSON.stringify(entryRequirePath)});
const handler = typeof mod.handler === 'function'
  ? mod.handler
  : (typeof mod.default === 'function' ? mod.default : null);

if (typeof handler !== 'function') {
  throw new Error('入口文件需导出 handler 或 default 函数');
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
    if (body === undefined || body === null) {
      res.end();
      return;
    }
    if (Buffer.isBuffer(body) || typeof body === 'string') {
      res.end(body);
      return;
    }
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
    return;
  }

  if (result === undefined || result === null) {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (Buffer.isBuffer(result) || typeof result === 'string') {
    res.statusCode = 200;
    res.end(result);
    return;
  }
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result));
}

const port = Number(process.env.FC_SERVER_PORT || process.env.PORT || ${CUSTOM_NODE22_PORT});
const server = http.createServer(async (req, res) => {
  try {
    const event = await toEvent(req);
    const result = await handler(event, {});
    writeResult(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(port, '0.0.0.0');
`;
  writeFileSync(bootstrapPath, source);
  return CUSTOM_NODE22_BOOTSTRAP;
}

async function resolveRuntimeConfig(runtime: FcRuntime, outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
  const defaultHandler = `${bootFile.replace(/\.[^.]+$/, '').replace(/\//g, '.')}.handler`;
  if (runtime === 'nodejs20') {
    return { runtime, handler: defaultHandler };
  }
  if (runtime === PYTHON_312_RUNTIME) {
    return { runtime, handler: defaultHandler };
  }
  if (runtime === PYTHON_313_RUNTIME) {
    const runtimeArtifact = await preparePython313RuntimeInCode(outdir);
    const bootstrapPath = createPython313Bootstrap(outdir, bootFile).replace(/\\/g, '/');
    return {
      runtime: CUSTOM_PYTHON313_FC_RUNTIME,
      handler: defaultHandler,
      customRuntimeConfig: new $FC.CustomRuntimeConfig({
        command: [runtimeArtifact.pythonBinaryInCode],
        args: [`/code/${bootstrapPath}`],
        port: CUSTOM_PYTHON313_PORT
      })
    };
  }

  const runtimeArtifact = await prepareNode22RuntimeInCode(outdir);
  const bootstrapPath = createNode22Bootstrap(outdir, bootFile).replace(/\\/g, '/');
  return {
    runtime: CUSTOM_NODE22_FC_RUNTIME,
    handler: defaultHandler,
    customRuntimeConfig: new $FC.CustomRuntimeConfig({
      command: [runtimeArtifact.nodeBinaryInCode],
      args: [`/code/${bootstrapPath}`],
      port: CUSTOM_NODE22_PORT
    })
  };
}

function isInvalidRuntimeValueError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return code === 'InvalidArgument' && message.includes('Runtime is set to an invalid value');
}

function buildUnsupportedRuntimeMessage(runtime: FcRuntime) {
  if (runtime === 'nodejs22') {
    return `当前地域暂不支持 runtime=${runtime}。请改用 nodejs20，或确认 custom.debian12 在目标地域可用后重试。`;
  }
  if (runtime === 'python3.12') {
    return `当前地域暂不支持 runtime=${runtime}。请改用 nodejs20，或确认 python3.12 在目标地域可用后重试。`;
  }
  if (runtime === 'python3.13') {
    return `当前地域暂不支持 runtime=${runtime}。请改用 nodejs20，或确认 custom.debian12（含 python3.13）在目标地域可用后重试。`;
  }
  return `当前地域暂不支持 runtime=${runtime}。请改用 nodejs20 后重试。`;
}

export async function deployFC(appName: string, entryFile: string, runtime: FcRuntime = DEFAULT_FC_RUNTIME) {
  const { client } = createFcClient();
  const project = Config.getProject();

  const outdir = './.ali/dist';
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });

  const resolvedEntry = resolve(entryFile);
  const entryRelativeToCwd = relative(process.cwd(), resolvedEntry);
  if (entryRelativeToCwd.startsWith('..') || isAbsolute(entryRelativeToCwd)) {
    throw new Error(`入口文件必须在项目目录内: ${entryFile}`);
  }
  if (!existsSync(resolvedEntry)) throw new Error(`入口文件不存在: ${entryFile}`);
  if (!statSync(resolvedEntry).isFile()) throw new Error(`入口文件不是有效文件: ${entryFile}`);

  const entryRelative = entryRelativeToCwd.replace(/\\/g, '/');
  let bootFile: string;
  if (runtime === PYTHON_312_RUNTIME || runtime === PYTHON_313_RUNTIME) {
    bootFile = await preparePythonEntrypoint(entryRelative, outdir, runtime);
  } else {
    const buildResult = await buildEntrypointWithBun(entryFile, outdir);
    if (!buildResult.success) {
      const logs = buildResult.logs.map((log) => log.message).join('\n');
      throw new Error(`构建失败:\n${logs}`);
    }
    const jsOutputPath = findFirstJsOutput(outdir);
    if (!jsOutputPath) throw new Error('构建完成但未发现可执行 JS 产物');
    bootFile = relative(outdir, jsOutputPath).replace(/\\/g, '/');
  }
  const runtimeConfig = await resolveRuntimeConfig(runtime, outdir, bootFile);

  const zip = new AdmZip();
  zip.addLocalFolder(outdir);
  const zipBase64 = zip.toBuffer().toString('base64');
  const environmentVariables = { NODE_ENV: 'production', ...project.envs };
  const vpcConfig = await resolveFunctionVpcConfig(project.network);

  const req = new $FC.CreateFunctionRequest({
    body: new $FC.CreateFunctionInput({
      functionName: appName,
      runtime: runtimeConfig.runtime,
      handler: runtimeConfig.handler,
      memorySize: 256,
      timeout: 30,
      code: { zipFile: zipBase64 },
      environmentVariables,
      vpcConfig,
      customRuntimeConfig: runtimeConfig.customRuntimeConfig
    })
  });

  try {
    await withRetry(() => client.createFunction(req));
  } catch (err: unknown) {
    if (isConflictError(err)) {
      try {
        await withRetry(() => client.updateFunction(appName, new $FC.UpdateFunctionRequest({
          body: new $FC.UpdateFunctionInput({
            code: { zipFile: zipBase64 },
            runtime: runtimeConfig.runtime,
            handler: runtimeConfig.handler,
            environmentVariables,
            vpcConfig,
            customRuntimeConfig: runtimeConfig.customRuntimeConfig
          })
        })));
      } catch (updateErr: unknown) {
        if (isInvalidRuntimeValueError(updateErr)) {
          throw new Error(buildUnsupportedRuntimeMessage(runtime));
        }
        if (isRuntimeChangeNotSupportedError(updateErr)) {
          throw new Error(`当前函数运行时无法原地切换到 ${runtime}。请更换 appName 重新部署，或先手动删除原函数后再重试。`);
        }
        throw updateErr;
      }
    } else {
      if (isInvalidRuntimeValueError(err)) {
        throw new Error(buildUnsupportedRuntimeMessage(runtime));
      }
      throw err;
    }
  }
  return ensureFunctionHttpUrl(appName, client);
}

export async function pullFunctionEnvs(appName: string, qualifier?: string) {
  const { client } = createFcClient();
  const response = await client.getFunction(appName, new $FC.GetFunctionRequest({ qualifier }));
  return response.body?.environmentVariables || {};
}

function toFunctionSummary(item: $FC.Function): FunctionSummary | null {
  const functionName = item.functionName;
  if (!functionName) return null;
  return {
    functionName,
    runtime: item.runtime,
    state: item.state,
    lastModifiedTime: item.lastModifiedTime,
    description: item.description
  };
}

export async function listFunctions(limit = 100, prefix?: string): Promise<FunctionSummary[]> {
  const { client } = createFcClient();
  const results: FunctionSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  let nextToken: string | undefined;

  while (results.length < safeLimit) {
    const response = await client.listFunctions(new $FC.ListFunctionsRequest({
      limit: Math.min(100, safeLimit - results.length),
      nextToken,
      prefix,
      fcVersion: 'v3'
    }));
    const rows = response.body?.functions || [];
    for (const row of rows) {
      const summary = toFunctionSummary(row);
      if (!summary) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return results;
}

export async function getFunctionInfo(functionName: string, qualifier?: string) {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  const response = await client.getFunction(normalizedName, new $FC.GetFunctionRequest({ qualifier }));
  const fn = response.body;
  if (!fn?.functionName) throw new Error(`未找到函数: ${normalizedName}`);
  return fn;
}

export async function removeFunction(functionName: string) {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  await client.deleteFunction(normalizedName);
}

async function readInvokeBody(readable?: Readable) {
  if (!readable) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    if (Buffer.isBuffer(chunk)) chunks.push(chunk);
    else chunks.push(Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function invokeFunction(
  functionName: string,
  options: { qualifier?: string; payload?: string } = {}
): Promise<FunctionInvokeResult> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  const body = typeof options.payload === 'string' ? Readable.from([Buffer.from(options.payload)]) : undefined;
  const response = await client.invokeFunction(normalizedName, new $FC.InvokeFunctionRequest({
    qualifier: options.qualifier,
    body
  }));
  const content = await readInvokeBody(response.body);
  return {
    statusCode: response.statusCode || 0,
    headers: response.headers || {},
    body: content
  };
}

async function replaceFunctionEnvs(appName: string, envs: Record<string, string>) {
  const { client } = createFcClient();
  await client.updateFunction(appName, new $FC.UpdateFunctionRequest({
    body: new $FC.UpdateFunctionInput({
      environmentVariables: envs
    })
  }));
}

export async function setFunctionEnv(appName: string, key: string, value: string) {
  const current = await pullFunctionEnvs(appName);
  const next = { ...current, [key]: value };
  await replaceFunctionEnvs(appName, next);
  return next;
}

export async function removeFunctionEnv(appName: string, key: string) {
  const current = await pullFunctionEnvs(appName);
  if (!Object.prototype.hasOwnProperty.call(current, key)) {
    return current;
  }
  const { [key]: _removed, ...next } = current;
  await replaceFunctionEnvs(appName, next);
  return next;
}

function toVersionSortValue(versionId: string) {
  const asNumber = Number(versionId);
  return Number.isFinite(asNumber) ? asNumber : -1;
}

function isRuntimeChangeNotSupportedError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return code === 'InvalidArgument' && message.toLowerCase().includes('change of runtime');
}

function isHttpTrigger(trigger: $FC.Trigger) {
  return (trigger.triggerType || '').toLowerCase() === 'http';
}

async function listAllTriggers(appName: string, fcClient: FC20230330) {
  const triggers: $FC.Trigger[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fcClient.listTriggers(appName, new $FC.ListTriggersRequest({
      limit: 100,
      nextToken
    }));
    const rows = response.body?.triggers || [];
    triggers.push(...rows);
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }
  return triggers;
}

function pickPublicHttpTriggerUrl(triggers: $FC.Trigger[]) {
  for (const trigger of triggers) {
    if (!isHttpTrigger(trigger)) continue;
    const url = trigger.httpTrigger?.urlInternet;
    if (typeof url === 'string' && url.trim().length > 0) return url;
  }
  return null;
}

async function upsertDefaultHttpTrigger(appName: string, fcClient: FC20230330) {
  try {
    await fcClient.createTrigger(appName, new $FC.CreateTriggerRequest({
      body: new $FC.CreateTriggerInput({
        triggerName: DEFAULT_HTTP_TRIGGER_NAME,
        triggerType: 'http',
        description: 'managed by aero-cli',
        triggerConfig: DEFAULT_HTTP_TRIGGER_CONFIG
      })
    }));
    return;
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
  }

  await fcClient.updateTrigger(appName, DEFAULT_HTTP_TRIGGER_NAME, new $FC.UpdateTriggerRequest({
    body: new $FC.UpdateTriggerInput({
      triggerConfig: DEFAULT_HTTP_TRIGGER_CONFIG
    })
  }));
}

export async function ensureFunctionHttpUrl(appName: string, fcClient?: FC20230330) {
  const client = fcClient ?? createFcClient().client;
  const initialTriggers = await listAllTriggers(appName, client);
  const existing = pickPublicHttpTriggerUrl(initialTriggers);
  if (existing) return existing;

  await upsertDefaultHttpTrigger(appName, client);
  const refreshedTriggers = await listAllTriggers(appName, client);
  const refreshed = pickPublicHttpTriggerUrl(refreshedTriggers);
  if (refreshed) return refreshed;
  throw new Error('函数部署成功，但未获取到公网 HTTP Trigger URL，请检查函数触发器配置');
}

export async function listFunctionVersions(appName: string, limit = 20, fcClient?: FC20230330) {
  const client = fcClient ?? createFcClient().client;
  const versions: $FC.Version[] = [];
  let nextToken: string | undefined;
  let remaining = Math.max(limit, 1);

  while (remaining > 0) {
    const pageLimit = Math.min(remaining, 100);
    const response = await client.listFunctionVersions(appName, new $FC.ListFunctionVersionsRequest({
      direction: 'BACKWARD',
      limit: pageLimit,
      nextToken
    }));
    const page = response.body?.versions || [];
    versions.push(...page);
    remaining -= page.length;
    nextToken = response.body?.nextToken;
    if (!nextToken || page.length === 0) break;
  }

  versions.sort((a, b) => toVersionSortValue(b.versionId || '') - toVersionSortValue(a.versionId || ''));
  return versions;
}

export async function publishFunctionVersion(appName: string, description?: string) {
  const { client } = createFcClient();
  const response = await client.publishFunctionVersion(appName, new $FC.PublishFunctionVersionRequest({
    body: new $FC.PublishVersionInput({ description })
  }));
  const versionId = response.body?.versionId;
  if (!versionId) throw new Error('发布函数版本失败：未返回 versionId');
  return versionId;
}

export async function promoteFunctionAlias(
  appName: string,
  aliasName: string,
  versionId: string,
  description?: string
) {
  const { client } = createFcClient();
  const body = new $FC.CreateAliasInput({
    aliasName,
    versionId,
    description
  });

  try {
    await client.createAlias(appName, new $FC.CreateAliasRequest({ body }));
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    await client.updateAlias(appName, aliasName, new $FC.UpdateAliasRequest({
      body: new $FC.UpdateAliasInput({
        versionId,
        description
      })
    }));
  }
}

export interface PruneFunctionVersionsResult {
  apply: boolean;
  keep: number;
  totalVersions: number;
  aliasProtectedVersions: string[];
  candidates: string[];
  deleted: string[];
  failed: Array<{ versionId: string; reason: string }>;
}

async function listAllAliases(appName: string, fcClient: FC20230330) {
  const aliases: $FC.Alias[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fcClient.listAliases(appName, new $FC.ListAliasesRequest({
      limit: 100,
      nextToken
    }));
    const rows = response.body?.aliases || [];
    aliases.push(...rows);
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }
  return aliases;
}

function uniqueSortedVersionIds(versionIds: Iterable<string>) {
  return [...new Set(versionIds)]
    .filter((id) => /^\d+$/.test(id))
    .sort((a, b) => toVersionSortValue(a) - toVersionSortValue(b));
}

export async function pruneFunctionVersions(
  appName: string,
  keep: number,
  apply = false
): Promise<PruneFunctionVersionsResult> {
  const { client } = createFcClient();
  const normalizedKeep = Number.isFinite(keep) && keep > 0 ? Math.floor(keep) : 10;
  const versions = await listFunctionVersions(appName, 1000, client);
  const aliases = await listAllAliases(appName, client);
  const aliasProtectedSet = new Set<string>();

  for (const alias of aliases) {
    if (alias.versionId) aliasProtectedSet.add(alias.versionId);
    const weighted = alias.additionalVersionWeight || {};
    for (const versionId of Object.keys(weighted)) aliasProtectedSet.add(versionId);
  }

  const publishedVersions = versions
    .map((version) => version.versionId || '')
    .filter((id) => /^\d+$/.test(id));
  const keptVersions = publishedVersions.slice(0, normalizedKeep);
  const candidates = publishedVersions.filter((id) => !keptVersions.includes(id) && !aliasProtectedSet.has(id));
  const result: PruneFunctionVersionsResult = {
    apply,
    keep: normalizedKeep,
    totalVersions: publishedVersions.length,
    aliasProtectedVersions: uniqueSortedVersionIds(aliasProtectedSet),
    candidates,
    deleted: [],
    failed: []
  };

  if (!apply || candidates.length === 0) return result;

  for (const versionId of candidates) {
    try {
      await client.deleteFunctionVersion(appName, versionId);
      result.deleted.push(versionId);
    } catch (err: unknown) {
      const reason = formatErrorMessage(err);
      result.failed.push({ versionId, reason });
    }
  }
  return result;
}
