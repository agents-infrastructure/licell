import { sleep } from './runtime';

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
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'licell-health-check/1.0'
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function probeHttpHealth(baseUrl: string, options: ProbeHttpHealthOptions = {}): Promise<ProbeHttpHealthResult> {
  const target = baseUrl.trim();
  if (!target) {
    return { ok: false, error: 'URL 为空', attempt: 1 };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const paths = normalizeProbePaths(options.paths);
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS));
  const intervalMs = Math.max(0, Math.floor(options.intervalMs ?? DEFAULT_INTERVAL_MS));
  const timeoutMs = Math.max(1000, Math.floor(options.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  let lastError = '未知错误';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    for (const path of paths) {
      const checkedUrl = buildProbeUrl(target, path);
      try {
        const response = await fetchWithTimeout(checkedUrl, timeoutMs, fetchImpl);
        const { status } = response;
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
