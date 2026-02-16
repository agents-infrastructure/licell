import { describe, it, expect } from 'vitest';
import { parseRootAndSubdomain } from '../utils/domain';

describe('parseRootAndSubdomain', () => {
  it('parses simple domain', () => {
    const result = parseRootAndSubdomain('example.com');
    expect(result.rootDomain).toBe('example.com');
    expect(result.subDomain).toBe('@');
  });

  it('parses www subdomain', () => {
    const result = parseRootAndSubdomain('www.example.com');
    expect(result.rootDomain).toBe('example.com');
    expect(result.subDomain).toBe('www');
  });

  it('parses deep subdomain', () => {
    const result = parseRootAndSubdomain('api.v2.example.com');
    expect(result.rootDomain).toBe('example.com');
    expect(result.subDomain).toBe('api.v2');
  });

  it('handles .co.uk TLD', () => {
    const result = parseRootAndSubdomain('www.example.co.uk');
    expect(result.rootDomain).toBe('example.co.uk');
    expect(result.subDomain).toBe('www');
  });

  it('handles .com.cn TLD', () => {
    const result = parseRootAndSubdomain('app.example.com.cn');
    expect(result.rootDomain).toBe('example.com.cn');
    expect(result.subDomain).toBe('app');
  });

  it('trims whitespace', () => {
    const result = parseRootAndSubdomain('  example.com  ');
    expect(result.rootDomain).toBe('example.com');
  });

  it('lowercases domain', () => {
    const result = parseRootAndSubdomain('WWW.Example.COM');
    expect(result.rootDomain).toBe('example.com');
    expect(result.subDomain).toBe('www');
  });

  it('throws on invalid domain', () => {
    expect(() => parseRootAndSubdomain('not-a-domain')).toThrow('无效域名');
  });

  it('throws on empty string', () => {
    expect(() => parseRootAndSubdomain('')).toThrow('无效域名');
  });

  it('throws on whitespace only', () => {
    expect(() => parseRootAndSubdomain('   ')).toThrow('无效域名');
  });

  it('handles bare .cn domain', () => {
    const result = parseRootAndSubdomain('example.cn');
    expect(result.rootDomain).toBe('example.cn');
    expect(result.subDomain).toBe('@');
  });
});
