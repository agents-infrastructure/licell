import { describe, it, expect } from 'vitest';
import { sanitizeQueryValue } from '../providers/logs';

describe('sanitizeQueryValue', () => {
  it('returns normal string unchanged', () => {
    expect(sanitizeQueryValue('my-app-name')).toBe('my-app-name');
  });

  it('strips single quotes', () => {
    expect(sanitizeQueryValue("app'name")).toBe('appname');
  });

  it('strips double quotes', () => {
    expect(sanitizeQueryValue('app"name')).toBe('appname');
  });

  it('strips backslashes', () => {
    expect(sanitizeQueryValue('app\\name')).toBe('appname');
  });

  it('strips wildcards', () => {
    expect(sanitizeQueryValue('app*')).toBe('app');
    expect(sanitizeQueryValue('app?')).toBe('app');
  });

  it('strips colons', () => {
    expect(sanitizeQueryValue('key:value')).toBe('keyvalue');
  });

  it('strips pipes', () => {
    expect(sanitizeQueryValue('a|b')).toBe('ab');
  });

  it('strips brackets', () => {
    expect(sanitizeQueryValue('a[0]')).toBe('a0');
    expect(sanitizeQueryValue('a{b}')).toBe('ab');
    expect(sanitizeQueryValue('a(b)')).toBe('ab');
  });

  it('strips boolean operators', () => {
    expect(sanitizeQueryValue('a&b')).toBe('ab');
    expect(sanitizeQueryValue('!admin')).toBe('admin');
    expect(sanitizeQueryValue('a^b')).toBe('ab');
    expect(sanitizeQueryValue('~approx')).toBe('approx');
  });

  it('handles SLS injection attempt', () => {
    const malicious = '* | select count(*) as total';
    const sanitized = sanitizeQueryValue(malicious);
    expect(sanitized).not.toContain('|');
    expect(sanitized).not.toContain('*');
    expect(sanitized).not.toContain('(');
    expect(sanitized).not.toContain(')');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeQueryValue('my-app_v2')).toBe('my-app_v2');
  });

  it('preserves digits', () => {
    expect(sanitizeQueryValue('app123')).toBe('app123');
  });

  it('preserves dots', () => {
    expect(sanitizeQueryValue('api.v2.service')).toBe('api.v2.service');
  });

  it('handles empty string', () => {
    expect(sanitizeQueryValue('')).toBe('');
  });

  it('handles string with only special chars', () => {
    expect(sanitizeQueryValue('*?:!&|')).toBe('');
  });
});
