import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockResolve4,
  mockResolve6,
  mockResolveNs,
  mockResolveCname,
  mockResolverSetServers,
  mockResolverResolve4,
  mockResolverResolve6,
  mockResolverResolveCname
} = vi.hoisted(() => ({
  mockResolve4: vi.fn(),
  mockResolve6: vi.fn(),
  mockResolveNs: vi.fn(),
  mockResolveCname: vi.fn(),
  mockResolverSetServers: vi.fn(),
  mockResolverResolve4: vi.fn(),
  mockResolverResolve6: vi.fn(),
  mockResolverResolveCname: vi.fn()
}));

vi.mock('dns/promises', () => ({
  Resolver: class {
    setServers = mockResolverSetServers;
    resolve4 = mockResolverResolve4;
    resolve6 = mockResolverResolve6;
    resolveCname = mockResolverResolveCname;
  },
  resolve4: mockResolve4,
  resolve6: mockResolve6,
  resolveNs: mockResolveNs,
  resolveCname: mockResolveCname
}));

import { resolveAuthoritativeDnsSnapshot, waitForAuthoritativeCnameTarget } from '../providers/dns';

describe('authoritative DNS helpers', () => {
  beforeEach(() => {
    mockResolve4.mockReset();
    mockResolve6.mockReset();
    mockResolveNs.mockReset();
    mockResolveCname.mockReset();
    mockResolverSetServers.mockReset();
    mockResolverResolve4.mockReset();
    mockResolverResolve6.mockReset();
    mockResolverResolveCname.mockReset();

    mockResolveNs.mockImplementation(async (domain: string) => {
      if (domain === 'example.com') return ['ns1.example.net', 'ns2.example.net'];
      throw Object.assign(new Error(`queryNs ENODATA ${domain}`), { code: 'ENODATA' });
    });
    mockResolve4.mockImplementation(async (host: string) => {
      if (host === 'ns1.example.net') return ['203.0.113.53'];
      if (host === 'ns2.example.net') return ['203.0.113.54'];
      throw Object.assign(new Error(`queryA ENODATA ${host}`), { code: 'ENODATA' });
    });
    mockResolve6.mockResolvedValue([]);
    mockResolverResolve4.mockResolvedValue([]);
    mockResolverResolve6.mockResolvedValue([]);
    mockResolverResolveCname.mockResolvedValue(['static.example.com.w.cdngslb.com']);
  });

  it('resolves NS hostnames to IPs before querying authoritative records', async () => {
    const snapshot = await resolveAuthoritativeDnsSnapshot('static.example.com');

    expect(mockResolverSetServers).toHaveBeenCalledWith(['203.0.113.53', '203.0.113.54']);
    expect(snapshot).toMatchObject({
      domainName: 'static.example.com',
      nameServerHosts: ['ns1.example.net', 'ns2.example.net'],
      nameServerIps: ['203.0.113.53', '203.0.113.54'],
      cname: ['static.example.com.w.cdngslb.com'],
      addresses: []
    });
  });

  it('waits until the authoritative cname matches the expected CDN target', async () => {
    mockResolverResolveCname
      .mockResolvedValueOnce(['1494910986361453.cn-hangzhou.fc.aliyuncs.com'])
      .mockResolvedValueOnce(['static.example.com.w.cdngslb.com']);

    const snapshot = await waitForAuthoritativeCnameTarget(
      'static.example.com',
      'static.example.com.w.cdngslb.com',
      { maxAttempts: 2, intervalMs: 0 }
    );

    expect(mockResolverResolveCname).toHaveBeenCalledTimes(2);
    expect(snapshot.cname).toEqual(['static.example.com.w.cdngslb.com']);
  });
});
