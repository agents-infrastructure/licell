import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockResolve4, mockResolve6, mockHttpsRequest, mockHttpRequest } = vi.hoisted(() => ({
  mockResolve4: vi.fn(),
  mockResolve6: vi.fn(),
  mockHttpsRequest: vi.fn(),
  mockHttpRequest: vi.fn()
}));

vi.mock('dns/promises', () => ({
  resolve4: mockResolve4,
  resolve6: mockResolve6
}));

vi.mock('https', () => ({
  request: mockHttpsRequest
}));

vi.mock('http', () => ({
  request: mockHttpRequest
}));

import { probeHttpHealth } from '../utils/health-check';

describe('probeHttpHealth authoritative DNS fallback', () => {
  beforeEach(() => {
    mockResolve4.mockReset();
    mockResolve6.mockReset();
    mockHttpsRequest.mockReset();
    mockHttpRequest.mockReset();
    mockResolve4.mockResolvedValue(['203.0.113.10']);
    mockResolve6.mockResolvedValue([]);
  });

  it('falls back to authoritative DNS when fetch and system lookup both miss the fresh record', async () => {
    const requestOptions: Array<Record<string, unknown>> = [];

    mockHttpsRequest.mockImplementation((_url: unknown, options: Record<string, unknown>, callback: (res: {
      statusCode?: number;
      resume: () => void;
      once: (event: string, handler: () => void) => void;
      destroy: () => void;
    }) => void) => {
      const handlers = new Map<string, (err?: Error) => void>();
      requestOptions.push(options);
      return {
        on(event: string, handler: (err?: Error) => void) {
          handlers.set(event, handler);
          return this;
        },
        end() {
          if (typeof options.lookup === 'function') {
            callback({
              statusCode: 200,
              resume() {},
              once() {},
              destroy() {}
            });
            return;
          }
          const err = Object.assign(new Error('getaddrinfo ENOTFOUND example.com'), { code: 'ENOTFOUND' });
          handlers.get('error')?.(err);
        },
        destroy(err?: Error) {
          handlers.get('error')?.(err);
        }
      };
    });

    const result = await probeHttpHealth('https://example.com', {
      maxAttempts: 1,
      intervalMs: 0,
      fetchImpl: async () => {
        throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND example.com' } });
      }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.checkedUrl).toBe('https://example.com/healthz');
      expect(result.statusCode).toBe(200);
    }
    expect(mockResolve4).toHaveBeenCalledWith('example.com');
    expect(requestOptions).toHaveLength(2);
    expect(typeof requestOptions[1]?.lookup).toBe('function');
  });
});
