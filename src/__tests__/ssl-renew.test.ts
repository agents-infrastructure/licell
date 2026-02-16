import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SSL_RENEW_BEFORE_DAYS,
  resolveRenewBeforeDays,
  shouldIssueNewCertificate,
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
