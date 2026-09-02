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

  it('does not inject a request model for older FC SDK read APIs without a request parameter', async () => {
    let attempts = 0;
    const client = {
      async getCustomDomainWithOptions(
        domainName: string,
        headers: Record<string, string>,
        _runtime: unknown
      ) {
        attempts += 1;
        expect(domainName).toBe('api.example.com');
        expect(headers).toEqual({});
        expect('validate' in headers).toBe(false);
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

  it('injects the request model for FC resource read APIs even when function length is unreliable', async () => {
    let attempts = 0;
    const client = {
      getFunctionWithOptions: async (...args: unknown[]) => {
        attempts += 1;
        const [functionName, request] = args as [string, { validate?: () => void }];
        expect(functionName).toBe('demo-fn');
        expect(typeof request.validate).toBe('function');
        return {
          body: {
            functionName: 'demo-fn'
          }
        };
      }
    } as unknown as Record<string, unknown>;

    const response = await callFcWithGuard<$FC.GetFunctionResponse>(
      client,
      'getFunction',
      ['demo-fn'],
      {
        operation: 'getFunction(demo-fn)',
        maxAttempts: 1
      }
    );

    expect(response.body?.functionName).toBe('demo-fn');
    expect(attempts).toBe(1);
  });

  it('uses a non-enumerable validate fallback for compat request shims', async () => {
    const client = {
      async deleteScalingConfigWithOptions(
        functionName: string,
        request: { validate?: () => void },
        _headers: unknown,
        _runtime: unknown
      ) {
        expect(functionName).toBe('demo-fn');
        expect(typeof request.validate).toBe('function');
        expect(Object.keys(request)).toEqual([]);
        return { body: {} };
      }
    } as unknown as Record<string, unknown>;

    await callFcWithGuard(
      client,
      'deleteScalingConfig',
      ['demo-fn'],
      {
        operation: 'deleteScalingConfig(demo-fn)',
        maxAttempts: 1
      }
    );
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
      LICELL_FC_MUTATION_READY_TIMEOUT_MS: '200',
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

  it('waits for pending functions to become active before reporting readiness', async () => {
    let attempts = 0;
    const client = {
      async getFunctionWithOptions() {
        attempts += 1;
        return {
          body: {
            functionName: 'demo-fn',
            state: attempts < 3 ? 'Pending' : 'Active'
          }
        };
      }
    } as unknown as FC20230330;

    const fn = await waitForFcFunctionReadable('demo-fn', client, {
      env: {
        LICELL_FC_MUTATION_READY_TIMEOUT_MS: '100',
        LICELL_FC_QUALIFIER_READY_INTERVAL_MS: '1'
      },
      profile: 'mutation'
    });

    expect(fn.functionName).toBe('demo-fn');
    expect(attempts).toBe(3);
  });

  it('waits for an active function update to finish before reporting readiness', async () => {
    let attempts = 0;
    const client = {
      async getFunctionWithOptions() {
        attempts += 1;
        return {
          body: {
            functionName: 'demo-fn',
            state: 'Active',
            lastUpdateStatus: attempts < 3 ? 'InProgress' : 'Successful',
            lastUpdateStatusReasonCode: attempts < 3 ? 'ImageOptimizing' : undefined
          }
        };
      }
    } as unknown as FC20230330;

    const fn = await waitForFcFunctionReadable('demo-fn', client, {
      timeoutMs: 100,
      intervalMs: 1,
      profile: 'mutation'
    });

    expect(fn.lastUpdateStatus).toBe('Successful');
    expect(attempts).toBe(3);
  });

  it('rejects a failed function update even when the function remains active', async () => {
    let attempts = 0;
    const client = {
      async getFunctionWithOptions() {
        attempts += 1;
        return {
          body: {
            functionName: 'demo-fn',
            state: 'Active',
            lastUpdateStatus: 'Failed',
            lastUpdateStatusReasonCode: 'ImageOptimizingFailed',
            lastUpdateStatusReason: 'invalid image, platform of image is unknown/unknown'
          }
        };
      }
    } as unknown as FC20230330;

    await expect(waitForFcFunctionReadable('demo-fn', client, {
      timeoutMs: 50,
      intervalMs: 1,
      profile: 'mutation'
    })).rejects.toThrow(
      '函数 demo-fn 更新失败: ImageOptimizingFailed: invalid image, platform of image is unknown/unknown'
    );
    expect(attempts).toBe(1);
  });

  it('keeps active functions readable after a failed update', async () => {
    const client = {
      async getFunctionWithOptions() {
        return {
          body: {
            functionName: 'demo-fn',
            state: 'Active',
            lastUpdateStatus: 'Failed',
            lastUpdateStatusReasonCode: 'ImageOptimizingFailed'
          }
        };
      }
    } as unknown as FC20230330;

    const fn = await waitForFcFunctionReadable('demo-fn', client, {
      timeoutMs: 50,
      intervalMs: 1,
      profile: 'read'
    });

    expect(fn.functionName).toBe('demo-fn');
  });
});
