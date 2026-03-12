import { describe, expect, it } from 'vitest';
import {
  assertE2eInvokeResult,
  assertE2eTaskInvokeResult,
  buildE2eInvokePayload,
  buildE2eTaskPayload
} from '../commands/e2e';

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

  it('builds a task payload for immediate success', () => {
    expect(JSON.parse(buildE2eTaskPayload('run-123'))).toEqual({
      runId: 'run-123',
      mode: 'ok'
    });
  });

  it('builds a task payload for stop testing', () => {
    expect(JSON.parse(buildE2eTaskPayload('run-123', { mode: 'sleep', sleepMs: 45000 }))).toEqual({
      runId: 'run-123',
      mode: 'sleep',
      sleepMs: 45000
    });
  });

  it('accepts async task invoke result and returns task id', () => {
    expect(assertE2eTaskInvokeResult({
      statusCode: 202,
      taskId: 'job-123',
      invocationType: 'Async'
    })).toBe('job-123');
  });

  it('rejects non-async task invoke result', () => {
    expect(() => assertE2eTaskInvokeResult({
      statusCode: 200,
      taskId: 'job-123',
      invocationType: 'Async'
    })).toThrow(/非 202/);
  });
});
