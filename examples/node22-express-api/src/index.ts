import type { AddressInfo } from 'net';
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
        resolve(`http://127.0.0.1:${address.port}`);
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
  const querySuffix = req.rawQueryString ? `?${req.rawQueryString}` : '';
  const url = `${baseUrl}${req.path}${querySuffix}`;

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
