import * as $FC from '@alicloud/fc20230330';
import { Config } from '../../utils/config';
import { isConflictError } from '../../utils/errors';
import { isAccessDeniedError } from '../../utils/alicloud-error';
import { withRetry } from '../../utils/retry';
import { createFcClient } from './client';
import { packageCodeAsBase64 } from './deploy';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const PROXY_FUNCTION_SUFFIX = '-static-proxy';
const DEFAULT_MEMORY_SIZE = 256;
const DEFAULT_TIMEOUT = 30;
const DEFAULT_CPU = 0.25;

function generateProxyHandlerCode(bucketName: string, region: string): string {
  return `
const https = require('https');
const crypto = require('crypto');

const BUCKET = '${bucketName}';
const REGION = '${region}';
const OSS_HOST = \`\${BUCKET}.oss-\${REGION}.aliyuncs.com\`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json'
};

function getMimeType(path) {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// OSS V1 signature
function signOssRequest(method, objectKey, date, accessKeyId, accessKeySecret, securityToken) {
  const canonicalizedResource = '/' + BUCKET + '/' + objectKey;
  const stringToSign = method + '\\n' + '\\n' + '\\n' + date + '\\n';
  const signStr = securityToken
    ? stringToSign + 'x-oss-security-token:' + securityToken + '\\n' + canonicalizedResource
    : stringToSign + canonicalizedResource;
  const signature = crypto.createHmac('sha1', accessKeySecret).update(signStr).digest('base64');
  return 'OSS ' + accessKeyId + ':' + signature;
}

function fetchFromOss(objectKey, credentials) {
  return new Promise((resolve, reject) => {
    const date = new Date().toUTCString();
    const headers = {
      'Host': OSS_HOST,
      'Date': date
    };

    if (credentials) {
      headers['Authorization'] = signOssRequest('GET', objectKey, date, credentials.accessKeyId, credentials.accessKeySecret, credentials.securityToken);
      if (credentials.securityToken) {
        headers['x-oss-security-token'] = credentials.securityToken;
      }
    }

    const options = {
      hostname: OSS_HOST,
      port: 443,
      path: '/' + encodeURIComponent(objectKey).replace(/%2F/g, '/'),
      method: 'GET',
      headers,
      timeout: 25000
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks)
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OSS request timeout'));
    });
    req.end();
  });
}

// FC 3.0 HTTP handler - returns Response object
module.exports.handler = async (request, context) => {
  const previewPath = process.env.PREVIEW_PATH || '';
  let urlPath = request.path || '/';
  if (urlPath === '/') urlPath = '/index.html';

  const objectKey = previewPath
    ? previewPath.replace(/^\\/+|\\/+$/g, '') + urlPath
    : urlPath.replace(/^\\/+/, '');

  // Get credentials from FC context (requires function role) or env vars
  let credentials = null;
  if (context.credentials && context.credentials.accessKeyId) {
    credentials = {
      accessKeyId: context.credentials.accessKeyId,
      accessKeySecret: context.credentials.accessKeySecret,
      securityToken: context.credentials.securityToken
    };
  } else if (process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET) {
    credentials = {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      securityToken: null
    };
  }

  try {
    let ossResp = await fetchFromOss(objectKey, credentials);

    // Handle directory-like paths: try index.html fallback
    if (ossResp.statusCode === 404 && !objectKey.includes('.')) {
      const indexKey = objectKey.replace(/\\/$/, '') + '/index.html';
      ossResp = await fetchFromOss(indexKey, credentials);
    }

    // SPA fallback: serve index.html for 404 on non-asset paths
    if (ossResp.statusCode === 404 && !objectKey.match(/\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webm|mp3|wav|pdf|xml|txt|map|json)$/i)) {
      const fallbackKey = previewPath
        ? previewPath.replace(/^\\/+|\\/+$/g, '') + '/index.html'
        : 'index.html';
      ossResp = await fetchFromOss(fallbackKey, credentials);
    }

    if (ossResp.statusCode === 404) {
      return {
        statusCode: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
        body: 'Not Found'
      };
    }

    const headers = {
      'content-type': ossResp.headers['content-type'] || getMimeType(objectKey)
    };
    if (ossResp.headers['cache-control']) {
      headers['cache-control'] = ossResp.headers['cache-control'];
    }
    if (ossResp.headers['etag']) {
      headers['etag'] = ossResp.headers['etag'];
    }

    return {
      statusCode: ossResp.statusCode,
      headers,
      isBase64Encoded: true,
      body: ossResp.body.toString('base64')
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      body: 'Bad Gateway: ' + (err.message || 'Unknown error')
    };
  }
};
`.trim();
}

export function resolveStaticProxyFunctionName(appName: string): string {
  return `${appName}${PROXY_FUNCTION_SUFFIX}`;
}

export async function deployStaticProxyFunction(
  appName: string,
  bucketName: string,
  previewPath: string
): Promise<string> {
  const auth = Config.requireAuth();
  const project = Config.getProject();
  const { client: fcClient } = createFcClient();
  const functionName = resolveStaticProxyFunctionName(appName);

  const tmpDir = join(tmpdir(), `licell-static-proxy-${Date.now()}-${process.pid}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const handlerCode = generateProxyHandlerCode(bucketName, auth.region);
    writeFileSync(join(tmpDir, 'index.js'), handlerCode);
    const codeBase64 = packageCodeAsBase64(tmpDir);

    const fcRole = `acs:ram::${auth.accountId}:role/AliyunFCDefaultRole`;

    // Try with FC service role first (more secure: uses temporary STS credentials)
    // Fall back to AK/SK env vars if role doesn't exist or permission denied
    const result = await deployWithRoleFallback(
      fcClient, functionName, codeBase64, project.envs || {}, previewPath, fcRole, auth
    );

    return result;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function deployWithRoleFallback(
  fcClient: any,
  functionName: string,
  codeBase64: string,
  projectEnvs: Record<string, string>,
  previewPath: string,
  fcRole: string,
  auth: { ak: string; sk: string; accountId: string; region: string }
): Promise<string> {
  // Build base config shared by both attempts
  const baseConfig = {
    runtime: 'nodejs20' as const,
    handler: 'index.handler',
    memorySize: DEFAULT_MEMORY_SIZE,
    timeout: DEFAULT_TIMEOUT,
    cpu: DEFAULT_CPU,
    diskSize: 512,
    instanceConcurrency: 10,
    code: new $FC.InputCodeLocation({ zipFile: codeBase64 })
  };

  // Attempt 1: with FC service role (no AK/SK in env vars)
  try {
    const envVars = { ...projectEnvs, PREVIEW_PATH: previewPath };
    return await createOrUpdateFunction(fcClient, functionName, {
      ...baseConfig,
      role: fcRole,
      environmentVariables: envVars
    });
  } catch (err: unknown) {
    if (!isAccessDeniedError(err)) throw err;
  }

  // Attempt 2: fallback to AK/SK env vars (role not available)
  const envVars = {
    ...projectEnvs,
    PREVIEW_PATH: previewPath,
    OSS_ACCESS_KEY_ID: auth.ak,
    OSS_ACCESS_KEY_SECRET: auth.sk
  };
  return await createOrUpdateFunction(fcClient, functionName, {
    ...baseConfig,
    environmentVariables: envVars
  });
}

async function createOrUpdateFunction(
  fcClient: any,
  functionName: string,
  config: Record<string, unknown>
): Promise<string> {
  try {
    await withRetry(() => fcClient.createFunction(new $FC.CreateFunctionRequest({
      body: new $FC.CreateFunctionInput({ functionName, ...config })
    })));
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    await withRetry(() => fcClient.updateFunction(functionName, new $FC.UpdateFunctionRequest({
      body: new $FC.UpdateFunctionInput(config)
    })));
  }
  return functionName;
}

export async function publishStaticProxyVersion(
  appName: string,
  description?: string
): Promise<string> {
  const { client: fcClient } = createFcClient();
  const functionName = resolveStaticProxyFunctionName(appName);

  const response = await withRetry(() => fcClient.publishFunctionVersion(
    functionName,
    new $FC.PublishFunctionVersionRequest({
      body: new $FC.PublishVersionInput({
        description: description || `static preview at ${new Date().toISOString()}`
      })
    })
  ));

  const versionId = response.body?.versionId;
  if (!versionId) {
    throw new Error('发布版本失败：未返回 versionId');
  }
  return versionId;
}
