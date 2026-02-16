import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../utils/retry';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const result = await withRetry(async () => 'ok');
    expect(result).toBe('ok');
  });

  it('retries on transient error and succeeds', async () => {
    let attempt = 0;
    const result = await withRetry(async () => {
      attempt += 1;
      if (attempt < 3) throw { code: 'Throttling', message: 'too many requests' };
      return 'recovered';
    }, { baseDelayMs: 10 });
    expect(result).toBe('recovered');
    expect(attempt).toBe(3);
  });

  it('throws immediately on non-transient error', async () => {
    let attempt = 0;
    await expect(
      withRetry(async () => {
        attempt += 1;
        throw new Error('permanent failure');
      }, { baseDelayMs: 10 })
    ).rejects.toThrow('permanent failure');
    expect(attempt).toBe(1);
  });

  it('throws after max attempts exhausted', async () => {
    let attempt = 0;
    await expect(
      withRetry(async () => {
        attempt += 1;
        throw { code: 'Throttling', message: 'rate limited' };
      }, { maxAttempts: 2, baseDelayMs: 10 })
    ).rejects.toMatchObject({ code: 'Throttling' });
    expect(attempt).toBe(2);
  });

  it('respects custom shouldRetry predicate', async () => {
    let attempt = 0;
    const result = await withRetry(async () => {
      attempt += 1;
      if (attempt < 2) throw new Error('custom-retryable');
      return 'done';
    }, {
      baseDelayMs: 10,
      shouldRetry: (err) => err instanceof Error && err.message === 'custom-retryable'
    });
    expect(result).toBe('done');
    expect(attempt).toBe(2);
  });

  it('does not retry when shouldRetry returns false', async () => {
    let attempt = 0;
    await expect(
      withRetry(async () => {
        attempt += 1;
        throw new Error('non-retryable');
      }, {
        baseDelayMs: 10,
        shouldRetry: () => false
      })
    ).rejects.toThrow('non-retryable');
    expect(attempt).toBe(1);
  });
});
