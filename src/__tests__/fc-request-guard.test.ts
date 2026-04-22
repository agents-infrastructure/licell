import { describe, expect, it } from 'vitest';
import type FC20230330 from '@alicloud/fc20230330';
import * as $FC from '@alicloud/fc20230330';
import {
  FcOperationTimeoutError,
  callFcWithGuard,
  getFcGuardConfig,
  waitForFcFunctionReadable,
  withFcOperationDeadline,
  withFcRetry
} from '../providers/fc/request-guard';

describe('fc request guard', () => {
  it('returns successful operation result before deadline', async () => {
    await expect(withFcOperationDeadline('demo', async () => 'ok', { timeoutMs: 50 })).resolves.toBe('ok');
  });

  it('fails stalled operation with explicit FC timeout error', async () => {
    await expect(withFcOperationDeadline('stall', async () => await new Promise<string>(() => {}), { timeoutMs: 10 }))
      .rejects.toBeInstanceOf(FcOperationTimeoutError);
  });

  it('retries transient errors classified by error name', async () => {
    let attempts = 0;
    const result = await withFcRetry('connectivity-check', async () => {
      attempts += 1;
      if (attempts < 3) {
        const err = new Error('Connect HTTPS://example.com failed');
        err.name = 'ConnectTimeout';
        throw err;
      }
      return 'ok';
    }, {
      maxAttempts: 3,
      baseDelayMs: 1
    });

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('combines runtime call, deadline and retry for FC methods', async () => {
    let attempts = 0;
    const client = {
      async listFunctionsWithOptions(request: unknown) {
        attempts += 1;
        expect(request).toBeInstanceOf($FC.ListFunctionsRequest);
        if (attempts < 2) {
          const err = new Error('Connect HTTPS://example.com failed');
          err.name = 'ConnectTimeout';
          throw err;
        }
        return {
          body: {
            functions: []
          }
        };
      }
    } as unknown as Record<string, unknown>;

    const response = await callFcWithGuard<$FC.ListFunctionsResponse>(
      client,
      'listFunctions',
      [new $FC.ListFunctionsRequest({ limit: 1 })],
      {
        operation: 'listFunctions(test)',
        maxAttempts: 2,
        baseDelayMs: 1
      }
    );

    expect(response.body?.functions).toEqual([]);
    expect(attempts).toBe(2);
  });

  it('injects an empty request model for read APIs whose SDK added a request parameter', async () => {
    let attempts = 0;
    const client = {
      async getCustomDomainWithOptions(
        domainName: string,
        request: { validate: () => void },
        _headers: unknown,
        _runtime: unknown
      ) {
        attempts += 1;
        expect(domainName).toBe('api.example.com');
        expect(typeof request.validate).toBe('function');
        return {
          body: {
            domainName: 'api.example.com'
          }
        };
      }
    } as unknown as Record<string, unknown>;

    const response = await callFcWithGuard<$FC.GetCustomDomainResponse>(
      client,
      'getCustomDomain',
      ['api.example.com'],
      {
        operation: 'getCustomDomain(api.example.com)',
        maxAttempts: 1
      }
    );

    expect(response.body?.domainName).toBe('api.example.com');
    expect(attempts).toBe(1);
  });

  it('uses mutation profile with longer connect timeout', async () => {
    let attempts = 0;
    let seenConnectTimeout = 0;
    const client = {
      async createFunctionWithOptions(_request: unknown, _headers: unknown, runtime: { connectTimeout?: number }) {
        attempts += 1;
        seenConnectTimeout = Number(runtime?.connectTimeout || 0);
        if (attempts < 2) {
          const err = new Error('Connect HTTPS://example.com failed');
          err.name = 'ConnectTimeout';
          throw err;
        }
        return { body: {} };
      }
    } as unknown as Record<string, unknown>;

    await callFcWithGuard(
      client,
      'createFunction',
      [new $FC.CreateFunctionRequest({
        body: new $FC.CreateFunctionInput({ functionName: 'demo-fn' })
      })],
      {
        operation: 'createFunction(demo-fn)',
        profile: 'mutation',
        maxAttempts: 2,
        baseDelayMs: 1
      }
    );

    expect(attempts).toBe(2);
    expect(seenConnectTimeout).toBeGreaterThanOrEqual(30_000);
  });

  it('retries transient EPIPE errors for mutation calls', async () => {
    let attempts = 0;
    const client = {
      async createFunctionWithOptions() {
        attempts += 1;
        if (attempts < 2) {
          const err = new Error('write EPIPE');
          (err as Error & { code?: string }).code = 'EPIPE';
          throw err;
        }
        return { body: {} };
      }
    } as unknown as Record<string, unknown>;

    await callFcWithGuard(
      client,
      'createFunction',
      [new $FC.CreateFunctionRequest({
        body: new $FC.CreateFunctionInput({ functionName: 'demo-fn' })
      })],
      {
        operation: 'createFunction(demo-fn)',
        profile: 'mutation',
        maxAttempts: 2,
        baseDelayMs: 1
      }
    );

    expect(attempts).toBe(2);
  });

  it('retries transient ENETDOWN errors for mutation calls', async () => {
    let attempts = 0;
    const client = {
      async createFunctionWithOptions() {
        attempts += 1;
        if (attempts < 2) {
          const err = new Error('read ENETDOWN POST https://example.com failed');
          (err as Error & { code?: string }).code = 'ENETDOWN';
          throw err;
        }
        return { body: {} };
      }
    } as unknown as Record<string, unknown>;

    await callFcWithGuard(
      client,
      'createFunction',
      [new $FC.CreateFunctionRequest({
        body: new $FC.CreateFunctionInput({ functionName: 'demo-fn' })
      })],
      {
        operation: 'createFunction(demo-fn)',
        profile: 'mutation',
        maxAttempts: 2,
        baseDelayMs: 1
      }
    );

    expect(attempts).toBe(2);
  });


  it('uses a longer default convergence timeout for post-mutation reads', () => {
    const config = getFcGuardConfig({
      LICELL_FC_QUALIFIER_READY_TIMEOUT_MS: '30000'
    });

    expect(config.qualifierReadyTimeoutMs).toBe(30_000);
    expect(config.mutationReadyTimeoutMs).toBe(180_000);
  });

  it('lets mutation convergence timeout inherit larger explicit read windows', () => {
    const config = getFcGuardConfig({
      LICELL_FC_QUALIFIER_READY_TIMEOUT_MS: '240000'
    });

    expect(config.qualifierReadyTimeoutMs).toBe(240_000);
    expect(config.mutationReadyTimeoutMs).toBe(240_000);
  });

  it('waits until function qualifier becomes readable', async () => {
    let attempts = 0;
    const client = {
      async getFunctionWithOptions() {
        attempts += 1;
        if (attempts < 3) {
          const err = new Error('alias not exist');
          (err as Error & { code?: string }).code = 'AliasNotFound';
          throw err;
        }
        return {
          body: {
            functionName: 'demo-fn',
            environmentVariables: { NODE_ENV: 'production' }
          }
        };
      }
    } as unknown as FC20230330;

    const fn = await waitForFcFunctionReadable('demo-fn', client, {
      qualifier: 'preview',
      timeoutMs: 50,
      intervalMs: 1
    });

    expect(fn.functionName).toBe('demo-fn');
    expect(attempts).toBe(3);
  });

  it('exposes dedicated mutation convergence timeout', () => {
    const config = getFcGuardConfig({
      LICELL_FC_QUALIFIER_READY_TIMEOUT_MS: '1500',
      LICELL_FC_MUTATION_READY_TIMEOUT_MS: '9000'
    });

    expect(config.qualifierReadyTimeoutMs).toBe(1500);
    expect(config.mutationReadyTimeoutMs).toBe(9000);
  });

  it('uses longer mutation convergence timeout for post-mutation readability waits', async () => {
    function createClient() {
      let attempts = 0;
      const client = {
        async getFunctionWithOptions() {
          attempts += 1;
          if (attempts < 3) {
            const err = new Error('alias not exist');
            (err as Error & { code?: string }).code = 'AliasNotFound';
            throw err;
          }
          return {
            body: {
              functionName: 'demo-fn'
            }
          };
        }
      } as unknown as FC20230330;
      return { client, getAttempts: () => attempts };
    }

    const env = {
      LICELL_FC_QUALIFIER_READY_TIMEOUT_MS: '5',
      LICELL_FC_MUTATION_READY_TIMEOUT_MS: '40',
      LICELL_FC_QUALIFIER_READY_INTERVAL_MS: '10'
    };

    const readProbe = createClient();
    await expect(waitForFcFunctionReadable('demo-fn', readProbe.client, {
      qualifier: 'preview',
      env
    })).rejects.toThrow(/等待函数就绪超时/);
    expect(readProbe.getAttempts()).toBe(1);

    const mutationProbe = createClient();
    const fn = await waitForFcFunctionReadable('demo-fn', mutationProbe.client, {
      qualifier: 'preview',
      env,
      profile: 'mutation'
    });
    expect(fn.functionName).toBe('demo-fn');
    expect(mutationProbe.getAttempts()).toBe(3);
  });
});
