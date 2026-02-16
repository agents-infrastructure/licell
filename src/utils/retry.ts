import { sleep } from './runtime';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (err: unknown) => boolean;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

function isTransientError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const text = `${(err as { code?: unknown }).code || ''} ${(err as { message?: unknown }).message || ''}`.toLowerCase();
  return (
    text.includes('throttling') ||
    text.includes('too many requests') ||
    text.includes('connecttimeout') ||
    text.includes('readtimeout') ||
    text.includes('requesttimeouterror') ||
    text.includes('socket disconnected') ||
    text.includes('econnreset') ||
    text.includes('econnrefused') ||
    text.includes('service unavailable') ||
    text.includes('internal error')
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options.shouldRetry ?? isTransientError;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (attempt === maxAttempts || !shouldRetry(err)) throw err;
      await sleep(baseDelayMs * attempt);
    }
  }
  throw lastError;
}
