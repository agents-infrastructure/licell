import { sleep } from './runtime';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

const DEFAULT_PATHS = ['/healthz', '/'];
const DEFAULT_MAX_ATTEMPTS = 4;
const DEFAULT_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 5000;

interface ProbeFetch {
  (input: string, init?: RequestInit): Promise<Response>;
}

export interface ProbeHttpHealthOptions {
  paths?: string[];
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
  fetchImpl?: ProbeFetch;
}

export interface ProbeHttpHealthSuccess {
  ok: true;
  checkedUrl: string;
  statusCode: number;
  attempt: number;
}

export interface ProbeHttpHealthFailure {
  ok: false;
  error: string;
  attempt: number;
}

export type ProbeHttpHealthResult = ProbeHttpHealthSuccess | ProbeHttpHealthFailure;

function normalizeProbePaths(paths: string[] | undefined) {
  const source = paths && paths.length > 0 ? paths : DEFAULT_PATHS;
  const normalized = source
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => (item.startsWith('/') ? item : `/${item}`));
  return [...new Set(normalized)];
}

function buildProbeUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/g, '')}${path}`;
}

function formatProbeError(err: unknown) {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return '请求超时';
    return err.message;
  }
  return String(err);
}

async function fetchWithTimeout(url: string, timeoutMs: number, fetchImpl: ProbeFetch) {
  const controller = new AbortController();
  const timeoutError = new Error('请求超时');
  timeoutError.name = 'AbortError';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(timeoutError);
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      fetchImpl(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'licell-health-check/1.0'
        }
      }),
      timeoutPromise
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function requestStatusWithTimeout(url: string, timeoutMs: number): Promise<number> {
  const target = new URL(url);
  const isHttps = target.protocol === 'https:';
  const requestFn = isHttps ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const req = requestFn(
      target,
      {
        method: 'GET',
        headers: {
          'user-agent': 'licell-health-check/1.0'
        },
        ...(isHttps ? { minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' } : {})
      },
      (res) => {
        if (timer) clearTimeout(timer);
        const statusCode = res.statusCode ?? 0;
        // We only need the status code; don't wait for a potentially long-lived body/connection.
        res.resume();
        res.once('error', () => {});
        if (!settled) {
          settled = true;
          resolve(statusCode);
        }
        res.destroy();
      }
    );

    timer = setTimeout(() => {
      req.destroy(new Error('请求超时'));
    }, timeoutMs);

    req.on('error', (err) => {
      if (timer) clearTimeout(timer);
      if (settled) return;
      settled = true;
      reject(err);
    });
    req.end();
  });
}

export async function probeHttpHealth(baseUrl: string, options: ProbeHttpHealthOptions = {}): Promise<ProbeHttpHealthResult> {
  const target = baseUrl.trim();
  if (!target) {
    return { ok: false, error: 'URL 为空', attempt: 1 };
  }

  const fetchImpl =
    options.fetchImpl ??
    (typeof globalThis.fetch === 'function' ? (globalThis.fetch.bind(globalThis) as ProbeFetch) : undefined);
  const paths = normalizeProbePaths(options.paths);
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS));
  const intervalMs = Math.max(0, Math.floor(options.intervalMs ?? DEFAULT_INTERVAL_MS));
  const timeoutMs = Math.max(1000, Math.floor(options.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  let lastError = '未知错误';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    for (const path of paths) {
      const checkedUrl = buildProbeUrl(target, path);
      try {
        const status = fetchImpl
          ? (await fetchWithTimeout(checkedUrl, timeoutMs, fetchImpl)).status
          : await requestStatusWithTimeout(checkedUrl, timeoutMs);
        if (status < 500) {
          if (path === '/healthz' && status === 404 && paths.includes('/')) {
            lastError = `GET ${checkedUrl} 返回 404`;
            continue;
          }
          return { ok: true, checkedUrl, statusCode: status, attempt };
        }
        lastError = `GET ${checkedUrl} 返回 ${status}`;
      } catch (err: unknown) {
        lastError = `GET ${checkedUrl} 请求失败: ${formatProbeError(err)}`;
      }
    }
    if (attempt < maxAttempts && intervalMs > 0) {
      await sleep(intervalMs * attempt);
    }
  }

  return { ok: false, error: lastError, attempt: maxAttempts };
}
