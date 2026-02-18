import { describe, expect, it } from 'vitest';
import { normalizeCustomDomain, normalizeDomainSuffix, tryNormalizeCustomDomain } from '../utils/cli-shared';

describe('normalizeCustomDomain', () => {
  it('normalizes case and trims spaces', () => {
    expect(normalizeCustomDomain(' API.Example.COM ')).toBe('api.example.com');
  });

  it('strips leading and trailing dots', () => {
    expect(normalizeCustomDomain('.api.example.com.')).toBe('api.example.com');
  });

  it('throws on invalid input', () => {
    expect(() => normalizeCustomDomain('not-a-domain')).toThrow('无效域名');
  });
});

describe('tryNormalizeCustomDomain', () => {
  it('returns normalized domain for valid input', () => {
    expect(tryNormalizeCustomDomain('API.EXAMPLE.COM')).toBe('api.example.com');
  });

  it('returns undefined for invalid input', () => {
    expect(tryNormalizeCustomDomain('not-a-domain')).toBeUndefined();
  });

  it('returns undefined for non-string input', () => {
    expect(tryNormalizeCustomDomain(undefined)).toBeUndefined();
  });
});

describe('normalizeDomainSuffix compatibility', () => {
  it('still accepts normal suffix values', () => {
    expect(normalizeDomainSuffix('Example.COM')).toBe('example.com');
  });
});
