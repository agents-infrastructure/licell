import * as $FC from '@alicloud/fc20230330';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { buildEntrypointWithBun } from '../../../utils/runtime';
import { prepareNode22RuntimeInCode } from '../../../utils/node22-runtime';
import { findFirstJsOutput } from '../runtime';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

const CUSTOM_FC_RUNTIME = 'custom.debian12';
const BOOTSTRAP_PATH = '.licell/node22-bootstrap.cjs';
const PORT = 9000;

/* PLACEHOLDER_NODEJS22_BOOTSTRAP */

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
/* PLACEHOLDER_NODEJS22_BOOTSTRAP_2 */

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
    const runtimeArtifact = await prepareNode22RuntimeInCode(outdir);
    const bootstrapPath = createBootstrap(outdir, bootFile).replace(/\\/g, '/');
    return {
      runtime: CUSTOM_FC_RUNTIME,
      handler,
      customRuntimeConfig: new $FC.CustomRuntimeConfig({
        command: [runtimeArtifact.nodeBinaryInCode],
        args: [`/code/${bootstrapPath}`],
        port: PORT
      })
    };
  }
};
