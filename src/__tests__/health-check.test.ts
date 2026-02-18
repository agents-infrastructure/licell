import { describe, expect, it } from 'vitest';
import { probeHttpHealth } from '../utils/health-check';

describe('probeHttpHealth', () => {
  it('passes when /healthz returns success', async () => {
    const calls: string[] = [];
    const result = await probeHttpHealth('https://example.com/', {
      intervalMs: 0,
      fetchImpl: async (url) => {
        calls.push(url);
        return new Response('ok', { status: 200 });
      }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checkedUrl).toBe('https://example.com/healthz');
      expect(result.statusCode).toBe(200);
    }
    expect(calls).toEqual(['https://example.com/healthz']);
  });

  it('falls back to / when /healthz is 404', async () => {
    const calls: string[] = [];
    const result = await probeHttpHealth('https://example.com', {
      intervalMs: 0,
      fetchImpl: async (url) => {
        calls.push(url);
        if (url.endsWith('/healthz')) return new Response('missing', { status: 404 });
        return new Response('root', { status: 200 });
      }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checkedUrl).toBe('https://example.com/');
    }
    expect(calls).toEqual([
      'https://example.com/healthz',
      'https://example.com/'
    ]);
  });

  it('retries when first attempt fails and later succeeds', async () => {
    let callCount = 0;
    const result = await probeHttpHealth('https://example.com', {
      maxAttempts: 3,
      intervalMs: 0,
      fetchImpl: async (_url) => {
        callCount += 1;
        if (callCount <= 2) throw new Error('connect timeout');
        return new Response('ok', { status: 200 });
      }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attempt).toBe(2);
    }
    expect(callCount).toBe(3);
  });

  it('returns failure when service keeps returning 5xx', async () => {
    const result = await probeHttpHealth('https://example.com', {
      maxAttempts: 2,
      intervalMs: 0,
      fetchImpl: async () => new Response('bad', { status: 500 })
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.attempt).toBe(2);
      expect(result.error).toContain('返回 500');
    }
  });

  it('returns timeout when fetch hangs without honoring abort', async () => {
    const startedAt = Date.now();
    const result = await probeHttpHealth('https://example.com', {
      maxAttempts: 1,
      intervalMs: 0,
      timeoutMs: 1000,
      fetchImpl: async () => new Promise<Response>(() => { /* keep pending */ })
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('请求超时');
    }
    expect(Date.now() - startedAt).toBeLessThan(2500);
  });
});
