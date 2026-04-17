import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  DEFAULT_SSL_RENEW_BEFORE_DAYS,
  resolveRenewBeforeDays,
  resolveReusableCdnCertificate,
  resolveReusableLocalCertificate,
  shouldIssueNewCertificate,
  writeIssuedCertificateCache,
  type ExistingDomainLike,
  type ResolvedIssueSslOptions
} from '../providers/ssl';

function options(overrides: Partial<ResolvedIssueSslOptions> = {}): ResolvedIssueSslOptions {
  return {
    forceRenew: false,
    renewBeforeDays: DEFAULT_SSL_RENEW_BEFORE_DAYS,
    ...overrides
  };
}

function withHttps(cert?: string): ExistingDomainLike {
  return {
    protocol: 'HTTP,HTTPS',
    certConfig: cert ? { certificate: cert } : undefined
  };
}

const VALID_CERTIFICATE_PEM = `-----BEGIN CERTIFICATE-----
MIICqDCCAZACCQDCqUgM2rWjLjANBgkqhkiG9w0BAQsFADAWMRQwEgYDVQQDDAtl
eGFtcGxlLmNvbTAeFw0yNjA0MTcwMTM2NTRaFw0yNzA0MTcwMTM2NTRaMBYxFDAS
BgNVBAMMC2V4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA3K7T8o6sCy9jkCmrZaCnDB9d+Ud6sqC3XsL3SnHkA/59kmCKbp6IyhBk7gIM
MZMXmYsqYkpaoHezu9Zw7MpV4yVioY9RTe/K6SxYIpj64c5vmLgK43Ft3zf5HEk8
m1VNZqsYEAWvtt9zNsyw59QPnEPVyDxl7XhFAgo7H3kRYC+nxAwIdau7hlbus0wr
zLFqARiDR5HHf5mjLybcVOf1qg3EvgJOT4ueq9GYzEyww8QBVnSpSgABjgXozIV1
7WOcihAxCKEjD099mTK9XTNvRHgykBgOuRTGSBgZAV2966rouV6C857YrXhdw6jK
UBPDjDRs0viRK5jDzeYtj+CDSQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQDQTepd
xuWpi8vFUWacx/q6zsfvqywgQ0tgWEd0A0CROi/BrXnWupo9+Y/+YPPeJ8+tVsav
1nBKts+EvdZugs4pZqRTMM4UzyGYPqetL07TyaKwKT49ZuqqJxCWgorQ92hvToWG
l0MVwDnoEniQ33tQgDfvAfon8iCKIAFLyk3e3rc/O1GZFcdqhaRLBYrvyl3tJ0cI
AFOU6BzIDU8CAOAUKbE7+yrLkwUI4DZqOmSPAvir16zui/5JdQ7VRUq0/IVBC5Ou
Y+dsqZpkxaWUnsSIbqlhwghALJuDpQlIzyY0ABkBjpGjgfUmr9WGlGN+QAhtwnhR
msn3z9PmAuFDJdeb
-----END CERTIFICATE-----`;
const VALID_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDcrtPyjqwLL2OQ
KatloKcMH135R3qyoLdewvdKceQD/n2SYIpunojKEGTuAgwxkxeZiypiSlqgd7O7
1nDsylXjJWKhj1FN78rpLFgimPrhzm+YuArjcW3fN/kcSTybVU1mqxgQBa+233M2
zLDn1A+cQ9XIPGXteEUCCjsfeRFgL6fEDAh1q7uGVu6zTCvMsWoBGINHkcd/maMv
JtxU5/WqDcS+Ak5Pi56r0ZjMTLDDxAFWdKlKAAGOBejMhXXtY5yKEDEIoSMPT32Z
Mr1dM29EeDKQGA65FMZIGBkBXb3rqui5XoLzntiteF3DqMpQE8OMNGzS+JErmMPN
5i2P4INJAgMBAAECggEAWvwJjlucOxBSsEE91SyjMrBMAlaiE7uHXp5rbln+dFcc
VplO+cSLCSQxOJ/Hfzjx5fAmjVeyfa5cf/ktnbLeLkRfodSA5O0Ub4ZE4B7KcQa3
o/NdKeC+N+XP4wWe4zwMKWQpC5IMnA0MZ2+FEE+yD+832NJuA7YuXWTyc0trCohX
RkE+65XT+tz+zWXSND5PwS8NDQ9qpDs3fGvqpdKoQycrlZfpBxc9cHinnlKGq1oa
y50AwcMFbGWOMHEQZLSjK6vLDNmTPGSGBLkM/Dzvh4tNKbxdEhzrUuooLif8KsXc
eLQzVKfB9Q8875J24Ys4JsrbNjx6lU/ntJsQsQUQMQKBgQD0ODKAseBGbJGUIcB2
UGnCj93XVC7Xe5fm/CEEWkmQKyhE0uMXAlwZFZqHuBbUbWUbwsw9VJU+eeHkY1y2
cdTj067Uf+QWFhX+5CqSqBu5vc0bwlx5RrJxJf1vsEc5ysHYZwdhVC57PoII9Unf
gcA4WjVKkoOl7BotEMSDfFqAYwKBgQDnU/u9r4MnBkg8uGKX8YftyRZ1Q1i1PUpt
CLwHCBkXB6zatudKtvS8uxuXBQfrSgvrBI65NMjLWI5Vh/op4g+6HJnD/TsFt2X2
1N/6mlGLHSJFaH49C6l9uTBY+GfI9nvGBH3miC2j1wS2q29EDioRQkOiVg+5UdA/
wiVKTr2/YwKBgCXmztewQ2lKkjFWJ6N1CWTbpQc1Fmv0z3dWq90cEgyg1ggQXpQE
lryB4NCtXkWrkKSFT+M4zEy857TlQs9BzVNqV9i83G4dEV7UlFLcaikibsGfIXDk
6u6qgbGivvsWH41xN/D/+pK/+bhgMQ3R+j4Eqf6fzHSkts9FqenqE7WXAoGARv89
miAN7qI89XXZvKyCfXZkECVVSnq/JuuxWa8glDLk2FOedQ3l2y7J7vW6UnptYfoK
G8mZft90/8c1/jjFfudcQgysWrrI7pKzE2TddgbBB/BkHjRAFrgJoKTMpZ8Qqduj
EGfnKgvKBI5lHcwDGTzvKRmkxcnYUlkxvLaiAeUCgYEAx3MXrQV+3zq5WFQXFyj+
hs+5cUcmUVOwJymQYCyVCwPdvuBxOvVHx5SD+vCCmaRjNPab2LMuTnikcqHUee5Z
3y0enSVviWwZMfZp2Y1jQQzBO6YqZdkD4Sx8Mhk5FXd4vigP9xCMTrfg+ZbH2m5Y
J/AGU5gSyUPHdG1tLJbuwhg=
-----END PRIVATE KEY-----`;

describe('resolveRenewBeforeDays', () => {
  it('returns fallback for undefined', () => {
    expect(resolveRenewBeforeDays(undefined)).toBe(DEFAULT_SSL_RENEW_BEFORE_DAYS);
  });

  it('returns parsed value for valid string', () => {
    expect(resolveRenewBeforeDays('45')).toBe(45);
  });

  it('returns parsed value for valid number', () => {
    expect(resolveRenewBeforeDays(10)).toBe(10);
  });

  it('trims whitespace before parsing', () => {
    expect(resolveRenewBeforeDays('  60  ')).toBe(60);
  });

  it('falls back for invalid text', () => {
    expect(resolveRenewBeforeDays('abc')).toBe(DEFAULT_SSL_RENEW_BEFORE_DAYS);
  });

  it('falls back for non-positive values', () => {
    expect(resolveRenewBeforeDays(0)).toBe(DEFAULT_SSL_RENEW_BEFORE_DAYS);
    expect(resolveRenewBeforeDays(-5)).toBe(DEFAULT_SSL_RENEW_BEFORE_DAYS);
  });
});

describe('shouldIssueNewCertificate', () => {
  it('issues when domain does not exist', () => {
    const decision = shouldIssueNewCertificate(null, options());
    expect(decision.issue).toBe(true);
  });

  it('issues when HTTPS not enabled', () => {
    const decision = shouldIssueNewCertificate({ protocol: 'HTTP' }, options());
    expect(decision.issue).toBe(true);
  });

  it('issues when force renew enabled', () => {
    const decision = shouldIssueNewCertificate(withHttps('dummy-cert'), options({ forceRenew: true }));
    expect(decision.issue).toBe(true);
  });

  it('skips when cert content is missing', () => {
    const decision = shouldIssueNewCertificate(withHttps(), options());
    expect(decision.issue).toBe(false);
  });

  it('skips when cert cannot be parsed', () => {
    const decision = shouldIssueNewCertificate(withHttps('dummy-cert'), options(), () => null);
    expect(decision.issue).toBe(false);
  });

  it('skips when cert is still far from expiry', () => {
    const decision = shouldIssueNewCertificate(withHttps('dummy-cert'), options({ renewBeforeDays: 30 }), () => 45);
    expect(decision.issue).toBe(false);
  });

  it('renews when cert reaches threshold day', () => {
    const decision = shouldIssueNewCertificate(withHttps('dummy-cert'), options({ renewBeforeDays: 30 }), () => 30);
    expect(decision.issue).toBe(true);
  });

  it('renews when cert already expired', () => {
    const decision = shouldIssueNewCertificate(withHttps('dummy-cert'), options({ renewBeforeDays: 30 }), () => -1);
    expect(decision.issue).toBe(true);
  });
});

describe('resolveReusableLocalCertificate', () => {
  it('reuses cached local cert for static/CDN deploys when it is still healthy', () => {
    const dir = mkdtempSync(join(tmpdir(), 'licell-ssl-cache-'));
    const cachePath = join(dir, 'issued-cert.json');
    try {
      writeIssuedCertificateCache('static.example.com', VALID_CERTIFICATE_PEM, VALID_PRIVATE_KEY_PEM, cachePath);
      const reused = resolveReusableLocalCertificate(
        'static.example.com',
        options({ renewBeforeDays: 30 }),
        Date.parse('2026-04-18T00:00:00Z'),
        cachePath
      );
      expect(reused?.certificate).toBe(VALID_CERTIFICATE_PEM);
      expect(reused?.privateKey).toBe(VALID_PRIVATE_KEY_PEM);
      expect(reused?.daysRemaining).toBeGreaterThan(300);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not reuse cached local cert when it is inside the renew threshold', () => {
    const dir = mkdtempSync(join(tmpdir(), 'licell-ssl-cache-'));
    const cachePath = join(dir, 'issued-cert.json');
    try {
      writeIssuedCertificateCache('static.example.com', VALID_CERTIFICATE_PEM, VALID_PRIVATE_KEY_PEM, cachePath);
      const reused = resolveReusableLocalCertificate(
        'static.example.com',
        options({ renewBeforeDays: 400 }),
        Date.parse('2026-04-18T00:00:00Z'),
        cachePath
      );
      expect(reused).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('resolveReusableCdnCertificate', () => {
  it('reuses CDN-side certificate when edge HTTPS is enabled and expiry is far enough', () => {
    const reused = resolveReusableCdnCertificate({
      domainName: 'static.example.com',
      serverCertificateStatus: 'on',
      certExpireTime: '2027-04-17T01:36:54Z',
      certUpdateTime: '2026-04-17T01:36:54Z'
    }, options({ renewBeforeDays: 30 }), Date.parse('2026-04-18T00:00:00Z'));

    expect(reused).toMatchObject({
      source: 'cdn',
      daysRemaining: expect.any(Number)
    });
    expect(reused?.daysRemaining).toBeGreaterThan(300);
  });

  it('does not reuse CDN-side certificate when edge HTTPS is disabled or too close to expiry', () => {
    expect(resolveReusableCdnCertificate({
      domainName: 'static.example.com',
      serverCertificateStatus: 'off',
      certExpireTime: '2027-04-17T01:36:54Z'
    }, options(), Date.parse('2026-04-18T00:00:00Z'))).toBeNull();

    expect(resolveReusableCdnCertificate({
      domainName: 'static.example.com',
      serverCertificateStatus: 'on',
      certExpireTime: '2026-04-25T01:36:54Z'
    }, options({ renewBeforeDays: 30 }), Date.parse('2026-04-18T00:00:00Z'))).toBeNull();
  });
});
