import * as $FC from '@alicloud/fc20230330';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { buildEntrypointWithBun } from '../../../utils/runtime';
import { prepareNode22RuntimeInCode } from '../../../utils/node22-runtime';
import { createManagedPreferredLauncher, shouldIncludeManagedRuntimeFallback } from '../custom-runtime-launcher';
import { findFirstJsOutput } from '../runtime-utils';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

const CUSTOM_FC_RUNTIME = 'custom.debian12';
const BOOTSTRAP_PATH = '.licell/node22-bootstrap.cjs';
const LAUNCHER_PATH = '.licell/node22-launcher.sh';
const MANAGED_NODE_BINARY = '/var/fc/lang/nodejs22/bin/node';
const PORT = 9000;

function createBootstrap(outdir: string, bootFile: string) {
  const bootstrapPath = join(outdir, BOOTSTRAP_PATH);
  mkdirSync(join(outdir, '.licell'), { recursive: true });
  const bootstrapDir = dirname(BOOTSTRAP_PATH);
  const entryPath = `./${relative(bootstrapDir, bootFile).replace(/\\/g, '/')}`;
  const source = `'use strict';
const http = require('http');
const mod = require(${JSON.stringify(entryPath)});
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

function pickHeaderValue(value) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function isFcInvokeRequest(req) {
  const controlPath = pickHeaderValue(req.headers['x-fc-control-path']).trim().toLowerCase();
  if (controlPath === '/invoke') return true;
  const requestId = pickHeaderValue(req.headers['x-fc-request-id']).trim();
  const url = new URL(req.url || '/', 'http://localhost');
  return Boolean(requestId && url.pathname === '/invoke');
}

function decodeInvokePayload(bodyBuffer, headers) {
  if (bodyBuffer.length === 0) return {};
  const contentType = pickHeaderValue(headers['content-type']).trim().toLowerCase();
  const text = bodyBuffer.toString('utf8');
  const trimmed = text.trim();
  const shouldTryJson = contentType === ''
    || contentType.includes('json')
    || contentType.includes('text')
    || contentType.includes('octet-stream');
  if (shouldTryJson && trimmed) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return text;
    }
  }
  if (text.length > 0) return text;
  return bodyBuffer.toString('base64');
}

function toHttpEvent(req, bodyBuffer) {
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

async function toHandlerEvent(req) {
  const bodyBuffer = await readBody(req);
  if (isFcInvokeRequest(req)) {
    return decodeInvokePayload(bodyBuffer, req.headers);
  }
  return toHttpEvent(req, bodyBuffer);
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

const port = Number(process.env.FC_SERVER_PORT || process.env.PORT || ${PORT});
const server = http.createServer(async (req, res) => {
  try {
    const event = await toHandlerEvent(req);
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
  writeFileSync(bootstrapPath, source);
  return BOOTSTRAP_PATH;
}

export const nodejs22Handler: RuntimeHandler = {
  name: 'nodejs22',
  defaultEntry: 'src/index.ts',
  unsupportedMessage: '当前地域暂不支持 runtime=nodejs22。请改用 nodejs20，或确认 custom.debian12 在目标地域可用后重试。',

  async prepareBootFile(entryFile: string, outdir: string) {
    const buildResult = await buildEntrypointWithBun(entryFile, outdir);
    if (!buildResult.success) {
      const logs = buildResult.logs.map((log) => log.message).join('\n');
      throw new Error(`构建失败:\n${logs}`);
    }
    const jsOutputPath = findFirstJsOutput(outdir);
    if (!jsOutputPath) throw new Error('构建完成但未发现可执行 JS 产物');
    return relative(outdir, jsOutputPath).replace(/\\/g, '/');
  },

  async resolveConfig(outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
    const handler = `${bootFile.replace(/\.[^.]+$/, '').replace(/\//g, '.')}.handler`;
    const bootstrapPath = createBootstrap(outdir, bootFile).replace(/\\/g, '/');
    const runtimeArtifact = shouldIncludeManagedRuntimeFallback()
      ? await prepareNode22RuntimeInCode(outdir)
      : undefined;
    const launcherPath = createManagedPreferredLauncher({
      outdir,
      launcherPath: LAUNCHER_PATH,
      managedExecutablePath: MANAGED_NODE_BINARY,
      fallbackExecutablePath: runtimeArtifact?.nodeBinaryInCode,
      args: [`/code/${bootstrapPath}`]
    });
    return {
      runtime: CUSTOM_FC_RUNTIME,
      handler,
      customRuntimeConfig: new $FC.CustomRuntimeConfig({
        command: ['/bin/sh'],
        args: [`/code/${launcherPath}`],
        port: PORT
      })
    };
  }
};
