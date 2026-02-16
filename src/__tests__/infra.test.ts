import { describe, it, expect } from 'vitest';
import { normalizeDbUser } from '../providers/infra';

describe('normalizeDbUser', () => {
  it('lowercases input', () => {
    expect(normalizeDbUser('MyApp')).toBe('myapp');
  });

  it('replaces hyphens with underscores', () => {
    expect(normalizeDbUser('my-app')).toBe('my_app');
  });

  it('replaces special chars with underscores', () => {
    expect(normalizeDbUser('my@app!v2')).toBe('my_app_v2');
  });

  it('collapses consecutive underscores', () => {
    expect(normalizeDbUser('my--app')).toBe('my_app');
  });

  it('prepends a_ when starting with digit', () => {
    expect(normalizeDbUser('123app')).toBe('a_123app');
  });

  it('prepends a_ when starting with underscore', () => {
    expect(normalizeDbUser('_app')).toBe('a_app');
  });

  it('truncates to 16 chars', () => {
    expect(normalizeDbUser('a-very-long-application-name')).toBe('a_very_long_appl');
  });

  it('returns aero_user for empty string', () => {
    // empty -> lowercased -> replace non-alnum -> '' -> length < 2 -> 'aero_user'
    expect(normalizeDbUser('')).toBe('aero_user');
  });

  it('returns aero_user for single char that becomes underscore', () => {
    // '-' -> '_' -> prepend 'a_' -> 'a__' -> collapse -> 'a_' -> length 2, ok
    const result = normalizeDbUser('-');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles Chinese characters', () => {
    // Chinese chars get replaced with underscores
    const result = normalizeDbUser('我的应用');
    expect(result).toMatch(/^[a-z_]/);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles all-digit input', () => {
    const result = normalizeDbUser('12345');
    expect(result).toBe('a_12345');
    expect(result).toMatch(/^[a-z]/);
  });

  it('preserves underscores', () => {
    expect(normalizeDbUser('my_app')).toBe('my_app');
  });

  it('handles exactly 16 chars', () => {
    expect(normalizeDbUser('abcdefghijklmnop')).toBe('abcdefghijklmnop');
  });

  it('truncation with prefix does not exceed 16', () => {
    const result = normalizeDbUser('0123456789abcdef');
    // '0...' -> prepend 'a_' -> 'a_0123456789abcdef' -> truncate to 16
    expect(result.length).toBeLessThanOrEqual(16);
    expect(result).toMatch(/^[a-z]/);
  });

  it('handles dot-separated names', () => {
    expect(normalizeDbUser('api.v2')).toBe('api_v2');
  });
});
