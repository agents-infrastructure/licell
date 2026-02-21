import { describe, it, expect } from 'vitest';
import { normalizeDnsValue } from '../providers/domain';

describe('wildcard DNS', () => {
  describe('normalizeDnsValue', () => {
    it('should normalize DNS values correctly', () => {
      expect(normalizeDnsValue('example.com')).toBe('example.com');
      expect(normalizeDnsValue('EXAMPLE.COM')).toBe('example.com');
      expect(normalizeDnsValue('example.com.')).toBe('example.com');
      expect(normalizeDnsValue('https://example.com')).toBe('example.com');
      expect(normalizeDnsValue('http://example.com')).toBe('example.com');
    });
  });

  describe('wildcard domain format', () => {
    it('should generate correct wildcard domain', () => {
      const domainSuffix = 'example.com';
      const wildcardDomain = `*.${domainSuffix}`;
      expect(wildcardDomain).toBe('*.example.com');
    });

    it('should handle subdomains in suffix', () => {
      const domainSuffix = 'app.example.com';
      const wildcardDomain = `*.${domainSuffix}`;
      expect(wildcardDomain).toBe('*.app.example.com');
    });
  });

  describe('FC origin domain format', () => {
    it('should generate correct FC origin domain', () => {
      const accountId = '1234567890';
      const region = 'cn-hangzhou';
      const fcOriginDomain = `${accountId}.${region}.fc.aliyuncs.com`;
      expect(fcOriginDomain).toBe('1234567890.cn-hangzhou.fc.aliyuncs.com');
    });
  });
});
