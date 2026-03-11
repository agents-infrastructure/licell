import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallApi = vi.fn();
const mockEnsureDomainCname = vi.fn();
const mockWaitForAuthoritativeCnameTarget = vi.fn();

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({
      accountId: '1494123412341234',
      ak: 'test-ak',
      sk: 'test-sk',
      region: 'cn-hangzhou'
    })
  }
}));

vi.mock('@alicloud/openapi-client', () => ({
  default: class MockRpcClient {
    callApi = mockCallApi;

    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  Config: class MockOpenApiConfig {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  OpenApiRequest: class OpenApiRequest {
    query?: Record<string, unknown>;

    constructor(input: { query?: Record<string, unknown> }) {
      this.query = input.query;
    }
  },
  Params: class Params {
    action?: string;

    constructor(input: { action?: string }) {
      this.action = input.action;
    }
  }
}));

vi.mock('@alicloud/tea-util', () => ({
  RuntimeOptions: class RuntimeOptions {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: (ctor: unknown) => ctor,
  parsePositiveIntEnv: (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
  }
}));

vi.mock('../utils/retry', () => ({
  withRetry: async <T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      shouldRetry?: (err: unknown) => boolean;
      onRetry?: (err: unknown, context: { attempt: number; nextAttempt: number; maxAttempts: number; delayMs: number }) => void | Promise<void>;
    } = {}
  ) => {
    const maxAttempts = options.maxAttempts ?? 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (err: unknown) {
        if (attempt === maxAttempts || !(options.shouldRetry?.(err) ?? false)) throw err;
        await options.onRetry?.(err, { attempt, nextAttempt: attempt + 1, maxAttempts, delayMs: 0 });
      }
    }
    throw new Error('unreachable');
  }
}));

vi.mock('../utils/alicloud-error', () => ({
  isConflictError: (err: unknown) => String((err as { code?: unknown })?.code || '').toLowerCase().includes('conflict'),
  isNotFoundError: (err: unknown) => String((err as { code?: unknown })?.code || '').toLowerCase().includes('notfound'),
  isTransientError: (err: unknown) => String((err as { code?: unknown })?.code || '').toLowerCase().includes('transient')
}));

vi.mock('../providers/dns', () => ({
  ensureDomainCname: mockEnsureDomainCname,
  waitForAuthoritativeCnameTarget: mockWaitForAuthoritativeCnameTarget,
  normalizeDnsValue: (value: string) => value.trim().replace(/\.$/, '').toLowerCase()
}));

function domainDetailBody(status: string, serverCertificateStatus: string) {
  return {
    GetDomainDetailModel: {
      DomainName: 'static.example.com',
      Cname: 'static.example.com.w.kunluncan.com',
      DomainStatus: status,
      ServerCertificateStatus: serverCertificateStatus
    }
  };
}

describe('enableCdnForDomain', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    mockCallApi.mockReset();
    mockEnsureDomainCname.mockReset();
    mockWaitForAuthoritativeCnameTarget.mockReset();
    mockEnsureDomainCname.mockResolvedValue(undefined);
    mockWaitForAuthoritativeCnameTarget.mockResolvedValue({
      domainName: 'static.example.com',
      nameServerHosts: [],
      nameServerIps: [],
      cname: ['static.example.com.w.kunluncan.com'],
      addresses: []
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.LICELL_CDN_DOMAIN_READY_TIMEOUT_MS;
    delete process.env.LICELL_CDN_DOMAIN_READY_INTERVAL_MS;
  });

  it('waits for authoritative DNS and CDN online before enabling HTTPS', async () => {
    vi.useFakeTimers();
    const events: string[] = [];
    let detailCalls = 0;

    mockEnsureDomainCname.mockImplementation(async () => {
      events.push('ensureDomainCname');
    });
    mockWaitForAuthoritativeCnameTarget.mockImplementation(async () => {
      events.push('waitForAuthoritativeCnameTarget');
      return {
        domainName: 'static.example.com',
        nameServerHosts: [],
        nameServerIps: [],
        cname: ['static.example.com.w.kunluncan.com'],
        addresses: []
      };
    });
    mockCallApi.mockImplementation(async (params: { action?: string }) => {
      const action = params.action || 'unknown';
      events.push(action);
      if (action === 'DescribeUserDomains') {
        return { body: { Domains: { PageData: [] } } };
      }
      if (action === 'AddCdnDomain' || action === 'BatchSetCdnDomainConfig' || action === 'SetCdnDomainSSLCertificate') {
        return { body: {} };
      }
      if (action === 'DescribeCdnDomainDetail') {
        detailCalls += 1;
        if (detailCalls === 1) return { body: domainDetailBody('configuring', 'off') };
        if (detailCalls === 2) return { body: domainDetailBody('online', 'off') };
        return { body: domainDetailBody('online', 'on') };
      }
      throw new Error(`unexpected action: ${action}`);
    });

    const { enableCdnForDomain } = await import('../providers/cdn');
    const pending = enableCdnForDomain('STATIC.EXAMPLE.COM', 'bucket.oss-cn-hangzhou.aliyuncs.com', {
      sourceType: 'oss',
      certificate: 'CERTIFICATE',
      privateKey: 'PRIVATE KEY',
      waitForOnline: true
    });
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.cdnCname).toBe('static.example.com.w.kunluncan.com');
    expect(result.httpsConfigured).toBe(true);
    expect(events.indexOf('ensureDomainCname')).toBeGreaterThan(-1);
    expect(events.indexOf('waitForAuthoritativeCnameTarget')).toBeGreaterThan(events.indexOf('ensureDomainCname'));
    expect(events.indexOf('SetCdnDomainSSLCertificate')).toBeGreaterThan(events.indexOf('waitForAuthoritativeCnameTarget'));
  });

  it('fails when CDN certificate status never becomes active', async () => {
    vi.useFakeTimers();
    let detailCalls = 0;

    mockCallApi.mockImplementation(async (params: { action?: string }) => {
      const action = params.action || 'unknown';
      if (action === 'DescribeUserDomains') {
        return { body: { Domains: { PageData: [] } } };
      }
      if (action === 'AddCdnDomain' || action === 'BatchSetCdnDomainConfig' || action === 'SetCdnDomainSSLCertificate') {
        return { body: {} };
      }
      if (action === 'DescribeCdnDomainDetail') {
        detailCalls += 1;
        if (detailCalls === 1) return { body: domainDetailBody('configuring', 'off') };
        return { body: domainDetailBody('online', 'off') };
      }
      throw new Error(`unexpected action: ${action}`);
    });

    const { enableCdnForDomain } = await import('../providers/cdn');
    const pending = enableCdnForDomain('static.example.com', 'bucket.oss-cn-hangzhou.aliyuncs.com', {
      sourceType: 'oss',
      certificate: 'CERTIFICATE',
      privateKey: 'PRIVATE KEY',
      waitForOnline: true
    });
    const assertion = expect(pending).rejects.toThrow('CDN 边缘 HTTPS 长时间未就绪');

    await vi.runAllTimersAsync();
    await assertion;
  });

  it('reports configured wait budget when CDN stays configuring', async () => {
    vi.useFakeTimers();
    let detailCalls = 0;

    mockCallApi.mockImplementation(async (params: { action?: string }) => {
      const action = params.action || 'unknown';
      if (action === 'DescribeUserDomains') {
        return { body: { Domains: { PageData: [] } } };
      }
      if (action === 'AddCdnDomain' || action === 'BatchSetCdnDomainConfig') {
        return { body: {} };
      }
      if (action === 'DescribeCdnDomainDetail') {
        detailCalls += 1;
        return { body: domainDetailBody('configuring', 'off') };
      }
      throw new Error(`unexpected action: ${action}`);
    });

    process.env.LICELL_CDN_DOMAIN_READY_TIMEOUT_MS = '15000';
    process.env.LICELL_CDN_DOMAIN_READY_INTERVAL_MS = '5000';

    const { enableCdnForDomain } = await import('../providers/cdn');
    const pending = enableCdnForDomain('static.example.com', 'bucket.oss-cn-hangzhou.aliyuncs.com', {
      sourceType: 'oss',
      waitForOnline: true
    });
    const assertion = expect(pending).rejects.toThrow('已等待 15s');

    await vi.runAllTimersAsync();
    await assertion;

    expect(detailCalls).toBeGreaterThan(0);
  });
});

describe('cdn read helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCallApi.mockReset();
  });

  it('parses CDN detail origins from DescribeCdnDomainDetail', async () => {
    mockCallApi.mockImplementation(async (params: { action?: string }) => {
      if (params.action !== 'DescribeCdnDomainDetail') throw new Error(`unexpected action: ${params.action}`);
      return {
        body: {
          GetDomainDetailModel: {
            DomainName: 'STATIC.EXAMPLE.COM',
            Cname: 'static.example.com.w.kunluncan.com.',
            DomainStatus: 'online',
            ServerCertificateStatus: 'on',
            Sources: {
              Source: [
                {
                  Content: 'bucket.oss-cn-hangzhou.aliyuncs.com',
                  Type: 'oss',
                  Port: '80',
                  Priority: '20',
                  Weight: '10'
                }
              ]
            }
          }
        }
      };
    });

    const { getCdnDomainDetail } = await import('../providers/cdn');
    await expect(getCdnDomainDetail('static.example.com')).resolves.toEqual({
      domainName: 'static.example.com',
      cname: 'static.example.com.w.kunluncan.com',
      status: 'online',
      serverCertificateStatus: 'on',
      origins: [
        {
          content: 'bucket.oss-cn-hangzhou.aliyuncs.com',
          type: 'oss',
          port: '80',
          priority: '20',
          weight: '10'
        }
      ]
    });
  });

  it('filters CDN list by prefix and normalizes nested origins', async () => {
    mockCallApi.mockImplementation(async (params: { action?: string }) => {
      if (params.action !== 'DescribeUserDomains') throw new Error(`unexpected action: ${params.action}`);
      return {
        body: {
          Domains: {
            PageData: [
              {
                DomainName: 'STATIC.EXAMPLE.COM',
                Cname: 'static.example.com.w.kunluncan.com.',
                DomainStatus: 'online',
                SourceInfos: {
                  SourceInfo: [
                    {
                      Content: 'bucket.oss-cn-hangzhou.aliyuncs.com',
                      Type: 'oss'
                    }
                  ]
                }
              },
              {
                DomainName: 'api.example.com',
                Cname: 'api.example.com.w.kunluncan.com'
              }
            ]
          },
          TotalCount: 2
        }
      };
    });

    const { listCdnDomains } = await import('../providers/cdn');
    await expect(listCdnDomains(20, { prefix: 'static.' })).resolves.toEqual([
      {
        domainName: 'static.example.com',
        cname: 'static.example.com.w.kunluncan.com',
        status: 'online',
        serverCertificateStatus: undefined,
        origins: [
          {
            content: 'bucket.oss-cn-hangzhou.aliyuncs.com',
            type: 'oss'
          }
        ]
      }
    ]);
  });
});
