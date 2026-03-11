import { describe, expect, it } from 'vitest';
import { assertE2eInvokeResult, buildE2eInvokePayload } from '../commands/e2e';

describe('e2e invoke helpers', () => {
  it('builds a healthz-shaped invoke payload', () => {
    const payload = JSON.parse(buildE2eInvokePayload('run-123')) as Record<string, unknown>;
    expect(payload.path).toBe('/healthz');
    expect(payload.rawPath).toBe('/healthz');
    expect(payload.httpMethod).toBe('GET');
    expect(payload.queryParameters).toEqual({
      runId: 'run-123',
      ping: 'pong'
    });
    expect(payload.requestContext).toEqual({
      http: {
        method: 'GET',
        path: '/healthz',
        sourceIp: '127.0.0.1'
      }
    });
  });

  it('accepts a successful healthz response', () => {
    expect(() => assertE2eInvokeResult({
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    })).not.toThrow();
  });

  it('rejects passthrough runtime invoke errors', () => {
    expect(() => assertE2eInvokeResult({
      statusCode: 200,
      body: '<pre>Cannot POST /invoke</pre>'
    })).toThrow(/runtime HTTP 控制面/);
  });
});
