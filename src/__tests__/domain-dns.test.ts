import { describe, it, expect } from 'vitest';
import { buildSubDomainQueryCandidates, normalizeDnsValue } from '../providers/domain';

describe('normalizeDnsValue', () => {
  it('strips https:// prefix', () => {
    expect(normalizeDnsValue('https://example.com')).toBe('example.com');
  });

  it('strips http:// prefix', () => {
    expect(normalizeDnsValue('http://example.com')).toBe('example.com');
  });

  it('strips trailing dot', () => {
    expect(normalizeDnsValue('example.com.')).toBe('example.com');
  });

  it('lowercases', () => {
    expect(normalizeDnsValue('Example.COM')).toBe('example.com');
  });

  it('handles all transformations together', () => {
    expect(normalizeDnsValue('HTTPS://My-App.CN-HANGZHOU.fcapp.run.')).toBe('my-app.cn-hangzhou.fcapp.run');
  });

  it('returns plain domain unchanged', () => {
    expect(normalizeDnsValue('example.com')).toBe('example.com');
  });

  it('handles empty string', () => {
    expect(normalizeDnsValue('')).toBe('');
  });

  it('does not strip dots in the middle', () => {
    expect(normalizeDnsValue('a.b.c.d')).toBe('a.b.c.d');
  });

  it('handles FC domain format', () => {
    expect(normalizeDnsValue('my-app.cn-hangzhou.fcapp.run')).toBe('my-app.cn-hangzhou.fcapp.run');
  });
});

describe('buildSubDomainQueryCandidates', () => {
  it('returns both fqdn and rr for normal subdomain', () => {
    expect(buildSubDomainQueryCandidates('example.xyz', 'api')).toEqual([
      'api.example.xyz',
      'api'
    ]);
  });

  it('returns root domain and @ for apex records', () => {
    expect(buildSubDomainQueryCandidates('example.xyz', '@')).toEqual([
      'example.xyz',
      '@'
    ]);
  });

  it('normalizes case and whitespace', () => {
    expect(buildSubDomainQueryCandidates(' ExAmPlE.XyZ ', ' API ')).toEqual([
      'api.example.xyz',
      'api'
    ]);
  });
});
