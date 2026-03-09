import { describe, expect, it, vi } from 'vitest';
import { runAcmeDns01Flow, selectPreferredAcmeChallenge } from '../providers/ssl';

function createSpinner() {
  return { message: vi.fn() } as never;
}

function createClient(overrides: Record<string, unknown> = {}) {
  return {
    getAccountUrl: vi.fn(() => 'account-url'),
    createAccount: vi.fn(async () => ({})),
    createOrder: vi.fn(async () => ({
      url: 'order-url',
      authorizations: ['authz-url'],
      finalize: 'finalize-url'
    })),
    getAuthorizations: vi.fn(async () => ([{
      url: 'authz-url',
      status: 'pending',
      identifier: { value: 'app.example.com' },
      challenges: [{ type: 'dns-01', url: 'challenge-url', token: 'token-1' }]
    }])),
    getChallengeKeyAuthorization: vi.fn(async () => 'txt-value'),
    verifyChallenge: vi.fn(async () => true),
    completeChallenge: vi.fn(async () => ({ status: 'processing' })),
    waitForValidStatus: vi.fn(async (item: Record<string, unknown>) => ({ ...item, status: 'valid' })),
    deactivateAuthorization: vi.fn(async () => ({ status: 'deactivated' })),
    finalizeOrder: vi.fn(async () => ({
      url: 'order-url',
      status: 'processing',
      certificate: 'certificate-url'
    })),
    getCertificate: vi.fn(async () => 'CERTIFICATE'),
    ...overrides
  };
}

describe('selectPreferredAcmeChallenge', () => {
  it('prefers dns-01 challenges', () => {
    expect(selectPreferredAcmeChallenge([
      { type: 'http-01' },
      { type: 'dns-01', url: 'dns-url' }
    ])).toEqual({ type: 'dns-01', url: 'dns-url' });
  });

  it('returns null when no preferred challenge exists', () => {
    expect(selectPreferredAcmeChallenge([{ type: 'http-01' }], ['dns-01'])).toBeNull();
  });
});

describe('runAcmeDns01Flow', () => {
  it('orchestrates the explicit dns-01 flow and cleans up challenge records', async () => {
    const spinner = createSpinner();
    const client = createClient();
    const onChallengeCreate = vi.fn(async () => {});
    const onChallengeRemove = vi.fn(async () => {});

    const certificate = await runAcmeDns01Flow({
      client: client as never,
      domains: ['app.example.com'],
      csr: Buffer.from('CSR'),
      email: 'admin@example.com',
      spinner,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      onChallengeCreate,
      onChallengeRemove
    });

    expect(certificate).toBe('CERTIFICATE');
    expect(client.createAccount).not.toHaveBeenCalled();
    expect(client.createOrder).toHaveBeenCalledWith({ identifiers: [{ type: 'dns', value: 'app.example.com' }] });
    expect(onChallengeCreate).toHaveBeenCalledWith('app.example.com', 'txt-value');
    expect(onChallengeRemove).toHaveBeenCalledWith('app.example.com', 'txt-value');
    expect(client.verifyChallenge).not.toHaveBeenCalled();
    expect(client.completeChallenge).toHaveBeenCalledTimes(1);
    expect(client.finalizeOrder).toHaveBeenCalledTimes(1);
    expect(client.getCertificate).toHaveBeenCalledTimes(1);
  });

  it('registers account when account url is missing', async () => {
    const spinner = createSpinner();
    const client = createClient({
      getAccountUrl: vi.fn(() => { throw new Error('missing account'); })
    });

    await runAcmeDns01Flow({
      client: client as never,
      domains: ['app.example.com'],
      csr: Buffer.from('CSR'),
      email: 'admin@example.com',
      spinner,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    });

    expect(client.createAccount).toHaveBeenCalledWith({
      termsOfServiceAgreed: true,
      contact: ['mailto:admin@example.com']
    });
  });

  it('includes the stage name when a step times out', async () => {
    const spinner = createSpinner();
    const client = createClient({
      createOrder: vi.fn(() => new Promise(() => {}))
    });

    await expect(runAcmeDns01Flow({
      client: client as never,
      domains: ['app.example.com'],
      csr: Buffer.from('CSR'),
      email: 'admin@example.com',
      spinner,
      skipChallengeVerification: true,
      totalTimeoutMs: 20,
      onChallengeCreate: async () => {},
      onChallengeRemove: async () => {}
    })).rejects.toThrow('createOrder');
  });

  it('deactivates authorization and still removes TXT records when challenge submission fails', async () => {
    const spinner = createSpinner();
    const client = createClient({
      completeChallenge: vi.fn(async () => { throw new Error('submit failed'); })
    });
    const onChallengeCreate = vi.fn(async () => {});
    const onChallengeRemove = vi.fn(async () => {});

    await expect(runAcmeDns01Flow({
      client: client as never,
      domains: ['app.example.com'],
      csr: Buffer.from('CSR'),
      email: 'admin@example.com',
      spinner,
      skipChallengeVerification: true,
      totalTimeoutMs: 1000,
      onChallengeCreate,
      onChallengeRemove
    })).rejects.toThrow('completeChallenge');

    expect(client.deactivateAuthorization).toHaveBeenCalledTimes(1);
    expect(onChallengeRemove).toHaveBeenCalledWith('app.example.com', 'txt-value');
  });
});
