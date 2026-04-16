import { sleep } from './runtime';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { resolve4, resolve6 } from 'dns/promises';
import { isIP } from 'net';

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
  allowClientError?: boolean;
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
    .filter((item) => item.length > 0 || item === '')
    .map((item) => (item.length === 0 || item.startsWith('/') ? item : `/${item}`));
  return [...new Set(normalized)];
}

function buildProbeUrl(baseUrl: string, path: string) {
  if (path === '') return baseUrl;
  return `${baseUrl.replace(/\/+$/g, '')}${path}`;
}

function formatProbeError(err: unknown) {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return '请求超时';
    const causeCode = String((err as { cause?: { code?: unknown } }).cause?.code || '').trim();
    const causeMessage = String((err as { cause?: { message?: unknown } }).cause?.message || '').trim();
    if (err.message === 'fetch failed') {
      const detail = [causeCode, causeMessage].filter((item) => item.length > 0).join(' ');
      return detail || err.message;
    }
    if (causeCode && !err.message.includes(causeCode)) {
      return `${err.message} (${causeCode})`;
    }
    return err.message;
  }
  return String(err);
}

function shouldFallbackToAuthoritativeDns(err: unknown) {
  if (!(err instanceof Error)) return false;
  const code = String((err as { code?: unknown }).code || (err as { cause?: { code?: unknown } }).cause?.code || '').toUpperCase();
  const message = `${err.message} ${String((err as { cause?: { message?: unknown } }).cause?.message || '')}`.toLowerCase();
  return code === 'ENOTFOUND'
    || code === 'EAI_AGAIN'
    || code === 'ENODATA'
    || message.includes('enotfound')
    || message.includes('could not resolve')
    || message.includes('name not resolved');
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

async function resolveAuthoritativeAddresses(hostname: string) {
  const addresses: string[] = [];
  try {
    addresses.push(...await resolve4(hostname));
  } catch {
    // ignore and continue with AAAA lookup
  }
  try {
    addresses.push(...await resolve6(hostname));
  } catch {
    // ignore when AAAA is unavailable
  }
  return [...new Set(addresses.filter((item) => item.trim().length > 0))];
}

function buildRequestPath(target: URL) {
  const pathname = target.pathname && target.pathname.length > 0 ? target.pathname : '/';
  return `${pathname}${target.search}`;
}

function requestStatusOnce(target: URL, timeoutMs: number, resolvedAddress?: string): Promise<number> {
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
          'user-agent': 'licell-health-check/1.0',
          host: target.host
        },
        ...(resolvedAddress
          ? {
              lookup: ((_hostname: string, _options: unknown, callback: (err: Error | null, address: string, family: number) => void) => {
                callback(null, resolvedAddress, isIP(resolvedAddress) || 4);
              }) as never
            }
          : {}),
        ...(isHttps
          ? {
              servername: target.hostname,
              minVersion: 'TLSv1.2',
              maxVersion: 'TLSv1.2'
            }
          : {}),
        path: buildRequestPath(target)
      },
      (res) => {
        if (timer) clearTimeout(timer);
        const statusCode = res.statusCode ?? 0;
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

async function requestStatusWithTimeout(
  url: string,
  timeoutMs: number,
  options: { authoritativeDnsFallback?: boolean } = {}
): Promise<number> {
  const target = new URL(url);
  try {
    return await requestStatusOnce(target, timeoutMs);
  } catch (err: unknown) {
    if (!options.authoritativeDnsFallback) throw err;
    const addresses = await resolveAuthoritativeAddresses(target.hostname);
    let lastError = err;
    for (const address of addresses) {
      try {
        return await requestStatusOnce(target, timeoutMs, address);
      } catch (candidateErr: unknown) {
        lastError = candidateErr;
      }
    }
    throw lastError;
  }
}

async function readProbeStatus(url: string, timeoutMs: number, fetchImpl?: ProbeFetch) {
  if (!fetchImpl) {
    return await requestStatusWithTimeout(url, timeoutMs, { authoritativeDnsFallback: true });
  }
  try {
    return (await fetchWithTimeout(url, timeoutMs, fetchImpl)).status;
  } catch (err: unknown) {
    if (!shouldFallbackToAuthoritativeDns(err)) throw err;
    return await requestStatusWithTimeout(url, timeoutMs, { authoritativeDnsFallback: true });
  }
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
  const successStatusUpperBoundExclusive = options.allowClientError === false ? 400 : 500;
  let lastError = '未知错误';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    for (const path of paths) {
      const checkedUrl = buildProbeUrl(target, path);
      try {
        const status = await readProbeStatus(checkedUrl, timeoutMs, fetchImpl);
        if (status < successStatusUpperBoundExclusive) {
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
      await sleep(intervalMs);
    }
  }

  return { ok: false, error: lastError, attempt: maxAttempts };
}
