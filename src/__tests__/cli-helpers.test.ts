import { describe, it, expect } from 'vitest';
import { escapeEnvValue, maskConnectionString, normalizeReleaseTarget } from '../utils/cli-helpers';

describe('escapeEnvValue', () => {
  it('escapes double quotes', () => {
    expect(escapeEnvValue('hello "world"')).toBe('hello \\"world\\"');
  });

  it('escapes backslashes', () => {
    expect(escapeEnvValue('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('escapes dollar signs', () => {
    expect(escapeEnvValue('$HOME/dir')).toBe('\\$HOME/dir');
  });

  it('escapes newlines', () => {
    expect(escapeEnvValue('line1\nline2')).toBe('line1\\nline2');
  });

  it('escapes all special chars together', () => {
    expect(escapeEnvValue('a\\b"c$d\ne')).toBe('a\\\\b\\"c\\$d\\ne');
  });

  it('returns empty string unchanged', () => {
    expect(escapeEnvValue('')).toBe('');
  });

  it('returns plain string unchanged', () => {
    expect(escapeEnvValue('simple-value')).toBe('simple-value');
  });

  it('handles password with special chars', () => {
    const pw = 'P@ss!w0rd$"test\\n';
    const escaped = escapeEnvValue(pw);
    expect(escaped).not.toContain('\n');
    expect(escaped).toBe('P@ss!w0rd\\$\\"test\\\\n');
  });

  it('handles password with backtick and carriage return', () => {
    const pw = '`pass`\r\n';
    const escaped = escapeEnvValue(pw);
    expect(escaped).toBe('\\`pass\\`\\r\\n');
  });

  it('does not escape single quotes', () => {
    // BUG FINDER: single quotes inside double-quoted .env values
    // are generally safe, but some parsers may have issues
    expect(escapeEnvValue("it's")).toBe("it's");
  });

  it('handles carriage return', () => {
    const result = escapeEnvValue('line1\r\nline2');
    expect(result).toBe('line1\\r\\nline2');
  });

  it('handles tab characters', () => {
    expect(escapeEnvValue('col1\tcol2')).toBe('col1\tcol2');
  });

  it('handles backtick', () => {
    const result = escapeEnvValue('`whoami`');
    expect(result).toBe('\\`whoami\\`');
  });
});

describe('maskConnectionString', () => {
  it('masks password in postgresql URL', () => {
    const url = 'postgresql://user:secret123@host:5432/db';
    const masked = maskConnectionString(url);
    expect(masked).toContain('******');
    expect(masked).not.toContain('secret123');
  });

  it('masks password in mysql URL', () => {
    const url = 'mysql://root:P@ss!@host:3306/main';
    const masked = maskConnectionString(url);
    expect(masked).not.toContain('P@ss!');
    expect(masked).toContain('******');
  });

  it('masks password in redis URL', () => {
    const url = 'redis://:mypassword@host:6379';
    const masked = maskConnectionString(url);
    expect(masked).not.toContain('mypassword');
    expect(masked).toContain('******');
  });

  it('masks password in redis URL with username', () => {
    const url = 'redis://admin:secret@host:6379';
    const masked = maskConnectionString(url);
    expect(masked).not.toContain('secret');
    expect(masked).toContain('admin');
  });

  it('returns URL unchanged when no password', () => {
    const url = 'https://example.com/path';
    expect(maskConnectionString(url)).toBe(url);
  });

  it('returns invalid URL unchanged', () => {
    expect(maskConnectionString('not-a-url')).toBe('not-a-url');
  });

  it('returns empty string unchanged', () => {
    expect(maskConnectionString('')).toBe('');
  });

  it('handles URL-encoded password', () => {
    const url = 'postgresql://user:P%40ss%21@host:5432/db';
    const masked = maskConnectionString(url);
    expect(masked).not.toContain('P%40ss%21');
    expect(masked).toContain('******');
  });
});

describe('normalizeReleaseTarget', () => {
  it('returns "prod" for non-string input', () => {
    expect(normalizeReleaseTarget(undefined)).toBe('prod');
    expect(normalizeReleaseTarget(null)).toBe('prod');
    expect(normalizeReleaseTarget(123)).toBe('prod');
  });

  it('returns "prod" for empty string', () => {
    expect(normalizeReleaseTarget('')).toBe('prod');
  });

  it('returns "prod" for whitespace', () => {
    expect(normalizeReleaseTarget('  ')).toBe('prod');
  });

  it('lowercases input', () => {
    expect(normalizeReleaseTarget('PROD')).toBe('prod');
    expect(normalizeReleaseTarget('Preview')).toBe('preview');
  });

  it('trims whitespace', () => {
    expect(normalizeReleaseTarget('  staging  ')).toBe('staging');
  });

  it('allows hyphens', () => {
    expect(normalizeReleaseTarget('pre-release')).toBe('pre-release');
  });

  it('allows digits', () => {
    expect(normalizeReleaseTarget('v2')).toBe('v2');
  });

  it('throws on special characters', () => {
    expect(() => normalizeReleaseTarget('prod/v1')).toThrow('发布目标仅允许小写字母、数字和短横线');
  });

  it('throws on underscores', () => {
    expect(() => normalizeReleaseTarget('my_alias')).toThrow();
  });

  it('throws on dots', () => {
    expect(() => normalizeReleaseTarget('v1.0')).toThrow();
  });

  it('throws on spaces in middle', () => {
    expect(() => normalizeReleaseTarget('my alias')).toThrow();
  });
});
