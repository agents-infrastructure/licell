import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as acme from 'acme-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAcmeRateLimitedError,
  issueAcmeCertificateWithFallback,
  resolveAcmeProviderPlan,
  resolveZeroSslExternalAccountBinding
} from '../providers/ssl';

const acmeTransport = acme.axios as typeof acme.axios & {
  defaults: typeof acme.axios.defaults & {
    acmeSettings?: Record<string, unknown> & {
      retryMaxAttempts?: number;
    };
  };
};

function createSpinner() {
  const message = vi.fn();
  return { spinner: { message } as never, message };
}

const tempDirs: string[] = [];

function createTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'licell-ssl-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  vi.restoreAllMocks();
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

describe('resolveAcmeProviderPlan', () => {
  it('defaults to Let\'s Encrypt with ZeroSSL fallback', () => {
    const providers = resolveAcmeProviderPlan({});
    expect(providers.map((item) => item.name)).toEqual(['letsencrypt', 'zerossl']);
  });

  it('uses staging without fallback when requested', () => {
    const providers = resolveAcmeProviderPlan({ LICELL_SSL_ACME_DIRECTORY: 'staging' });
    expect(providers.map((item) => item.name)).toEqual(['letsencrypt-staging']);
  });

  it('disables ZeroSSL fallback when configured off', () => {
    const providers = resolveAcmeProviderPlan({ LICELL_SSL_ZEROSSL_FALLBACK: '0' });
    expect(providers.map((item) => item.name)).toEqual(['letsencrypt']);
  });

  it('allows selecting ZeroSSL directly', () => {
    const providers = resolveAcmeProviderPlan({ LICELL_SSL_ACME_DIRECTORY: 'zerossl' });
    expect(providers.map((item) => item.name)).toEqual(['zerossl']);
  });
});

describe('isAcmeRateLimitedError', () => {
  it('detects ACME rate limit errors', () => {
    expect(isAcmeRateLimitedError(new Error('urn:ietf:params:acme:error:rateLimited: too many certificates already issued'))).toBe(true);
  });

  it('does not misclassify unrelated ACME errors', () => {
    expect(isAcmeRateLimitedError(new Error('urn:ietf:params:acme:error:dns: NXDOMAIN looking up TXT'))).toBe(false);
  });
});

describe('resolveZeroSslExternalAccountBinding', () => {
  it('prefers explicit EAB env vars', async () => {
    const fetchImpl = vi.fn();
    const binding = await resolveZeroSslExternalAccountBinding({
      env: {
        LICELL_SSL_ZEROSSL_EAB_KID: 'kid-env',
        LICELL_SSL_ZEROSSL_EAB_HMAC_KEY: 'hmac-env'
      },
      fetchImpl: fetchImpl as never,
      cachePath: join(createTempDir(), 'zerossl-eab.json')
    });

    expect(binding).toEqual({ kid: 'kid-env', hmacKey: 'hmac-env', source: 'env' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fetches and caches EAB credentials from ZeroSSL with email when no access key is configured', async () => {
    const cachePath = join(createTempDir(), 'zerossl-eab.json');
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toContain('eab-credentials-email');
      expect(String(init?.body || '')).toContain('admin%40example.com');
      return new Response(JSON.stringify({
        eab_kid: 'kid-api',
        eab_hmac_key: 'hmac-api'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    });

    const first = await resolveZeroSslExternalAccountBinding({
      email: 'admin@example.com',
      fetchImpl: fetchImpl as never,
      cachePath
    });
    const second = await resolveZeroSslExternalAccountBinding({
      email: 'admin@example.com',
      fetchImpl: vi.fn() as never,
      cachePath
    });

    expect(first).toEqual({ kid: 'kid-api', hmacKey: 'hmac-api', source: 'api' });
    expect(second).toEqual({ kid: 'kid-api', hmacKey: 'hmac-api', source: 'cache' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const persisted = JSON.parse(readFileSync(cachePath, 'utf8')) as {
      lookupType?: string;
      lookupFingerprint?: string;
      kid?: string;
      hmacKey?: string;
    };
    expect(persisted.kid).toBe('kid-api');
    expect(persisted.hmacKey).toBe('hmac-api');
    expect(persisted.lookupType).toBe('email');
    expect(persisted.lookupFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('uses access key lookup when explicitly configured', async () => {
    const cachePath = join(createTempDir(), 'zerossl-eab.json');
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain('access_key=access-key-1');
      return new Response(JSON.stringify({ eab_kid: 'kid-ak', eab_hmac_key: 'hmac-ak' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    });

    const binding = await resolveZeroSslExternalAccountBinding({
      env: { LICELL_SSL_ZEROSSL_ACCESS_KEY: 'access-key-1' },
      email: 'admin@example.com',
      fetchImpl: fetchImpl as never,
      cachePath
    });

    expect(binding).toEqual({ kid: 'kid-ak', hmacKey: 'hmac-ak', source: 'api' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('issueAcmeCertificateWithFallback', () => {
  it('falls back from Let\'s Encrypt to ZeroSSL on rate limit', async () => {
    const { spinner, message } = createSpinner();
    const providers = resolveAcmeProviderPlan({});

    const result = await issueAcmeCertificateWithFallback({
      domain: 'app.example.com',
      email: 'admin@example.com',
      spinner,
      providers,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      acmeHttpTimeoutMs: 30000,
      acmeHttpRetryMaxAttempts: 0,
      createCsr: async () => [Buffer.from('KEY'), Buffer.from('CSR')],
      resolveProvider: async (provider) => provider.name === 'zerossl'
        ? { ...provider, externalAccountBinding: { kid: 'kid', hmacKey: 'hmac' } }
        : provider,
      getAccountKey: async (provider) => Buffer.from(`ACCOUNT:${provider.name}`),
      createClient: (provider) => ({ providerName: provider.name } as never),
      runFlow: async ({ client }) => {
        const providerName = (client as { providerName?: string }).providerName;
        if (providerName === 'letsencrypt') {
          throw new Error('urn:ietf:params:acme:error:rateLimited: too many certificates already issued');
        }
        return 'CERTIFICATE';
      },
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    });

    expect(result.provider.name).toBe('zerossl');
    expect(result.cert).toBe('CERTIFICATE');
    expect(result.certKey.toString()).toBe('KEY');
    expect(message).toHaveBeenCalledWith(expect.stringContaining('正在切换到 ZeroSSL'));
  });

  it('applies ACME HTTP transport config during the flow and restores it afterward', async () => {
    const { spinner } = createSpinner();
    const providers = resolveAcmeProviderPlan({});
    const originalTimeout = acmeTransport.defaults.timeout;
    const originalAcmeSettings = { ...acmeTransport.defaults.acmeSettings };
    const observed: Array<{ timeout: unknown; retryMaxAttempts: unknown }> = [];

    const result = await issueAcmeCertificateWithFallback({
      domain: 'app.example.com',
      email: 'admin@example.com',
      spinner,
      providers: [providers[0]!],
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      acmeHttpTimeoutMs: 12345,
      acmeHttpRetryMaxAttempts: 7,
      createCsr: async () => [Buffer.from('KEY'), Buffer.from('CSR')],
      resolveProvider: async (provider) => provider,
      getAccountKey: async () => Buffer.from('ACCOUNT'),
      createClient: (provider) => ({ providerName: provider.name } as never),
      runFlow: async () => {
        observed.push({
          timeout: acmeTransport.defaults.timeout,
          retryMaxAttempts: acmeTransport.defaults.acmeSettings?.retryMaxAttempts
        });
        return 'CERTIFICATE';
      },
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    });

    expect(result.cert).toBe('CERTIFICATE');
    expect(observed).toEqual([{ timeout: 12345, retryMaxAttempts: 7 }]);
    expect(acmeTransport.defaults.timeout).toBe(originalTimeout);
    expect(acmeTransport.defaults.acmeSettings).toEqual(originalAcmeSettings);
  });

  it('falls back from Let\'s Encrypt to ZeroSSL on provider timeout', async () => {
    const { spinner, message } = createSpinner();
    const providers = resolveAcmeProviderPlan({});

    const result = await issueAcmeCertificateWithFallback({
      domain: 'app.example.com',
      email: 'admin@example.com',
      spinner,
      providers,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      acmeHttpTimeoutMs: 30000,
      acmeHttpRetryMaxAttempts: 0,
      createCsr: async () => [Buffer.from('KEY'), Buffer.from('CSR')],
      resolveProvider: async (provider) => provider.name === 'zerossl'
        ? { ...provider, externalAccountBinding: { kid: 'kid', hmacKey: 'hmac' } }
        : provider,
      getAccountKey: async (provider) => Buffer.from(`ACCOUNT:${provider.name}`),
      createClient: (provider) => ({ providerName: provider.name } as never),
      runFlow: async ({ client }) => {
        const providerName = (client as { providerName?: string }).providerName;
        if (providerName === 'letsencrypt') {
          throw new Error('ACME 证书签发(Let\'s Encrypt/app.example.com)/createOrder 超时（>30000ms）');
        }
        return 'CERTIFICATE';
      },
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    });

    expect(result.provider.name).toBe('zerossl');
    expect(result.cert).toBe('CERTIFICATE');
    expect(message).toHaveBeenCalledWith(expect.stringContaining('请求超时或暂时不可用'));
    expect(message).toHaveBeenCalledWith(expect.stringContaining('ZeroSSL'));
  });

  it('falls back from Let\'s Encrypt when acme-client drops the timeout error details', async () => {
    const { spinner, message } = createSpinner();
    const providers = resolveAcmeProviderPlan({});

    const result = await issueAcmeCertificateWithFallback({
      domain: 'app.example.com',
      email: 'admin@example.com',
      spinner,
      providers,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      acmeHttpTimeoutMs: 30000,
      acmeHttpRetryMaxAttempts: 0,
      createCsr: async () => [Buffer.from('KEY'), Buffer.from('CSR')],
      resolveProvider: async (provider) => provider.name === 'zerossl'
        ? { ...provider, externalAccountBinding: { kid: 'kid', hmacKey: 'hmac' } }
        : provider,
      getAccountKey: async (provider) => Buffer.from(`ACCOUNT:${provider.name}`),
      createClient: (provider) => ({ providerName: provider.name } as never),
      runFlow: async ({ client }) => {
        const providerName = (client as { providerName?: string }).providerName;
        if (providerName === 'letsencrypt') {
          throw new Error('ACME 证书签发(Let\'s Encrypt/app.example.com)/createAccount: ACME transport 未返回有效响应（可能是 HTTP timeout / 网络抖动; acme-client returned undefined response）');
        }
        return 'CERTIFICATE';
      },
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    });

    expect(result.provider.name).toBe('zerossl');
    expect(result.cert).toBe('CERTIFICATE');
    expect(message).toHaveBeenCalledWith(expect.stringContaining('请求超时或暂时不可用'));
  });

  it('does not fallback for non-rate-limit failures', async () => {
    const { spinner } = createSpinner();
    const providers = resolveAcmeProviderPlan({});

    await expect(issueAcmeCertificateWithFallback({
      domain: 'app.example.com',
      email: 'admin@example.com',
      spinner,
      providers,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      acmeHttpTimeoutMs: 30000,
      acmeHttpRetryMaxAttempts: 0,
      createCsr: async () => [Buffer.from('KEY'), Buffer.from('CSR')],
      resolveProvider: async (provider) => provider,
      getAccountKey: async () => Buffer.from('ACCOUNT'),
      createClient: (provider) => ({ providerName: provider.name } as never),
      runFlow: async () => {
        throw new Error('dns challenge failed');
      },
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    })).rejects.toThrow('dns challenge failed');
  });
});
