import { sleep } from './runtime';
import { isTransientError } from './alicloud-error';

export interface RetryContext {
  attempt: number;
  nextAttempt: number;
  maxAttempts: number;
  delayMs: number;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (err: unknown) => boolean;
  onRetry?: (err: unknown, context: RetryContext) => void | Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options.shouldRetry ?? isTransientError;
  const sleepFn = options.sleep ?? sleep;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (attempt === maxAttempts || !shouldRetry(err)) throw err;
      const delayMs = baseDelayMs * attempt * (0.5 + Math.random() * 0.5);
      await options.onRetry?.(err, {
        attempt,
        nextAttempt: attempt + 1,
        maxAttempts,
        delayMs
      });
      await sleepFn(delayMs);
    }
  }
  throw lastError;
}
