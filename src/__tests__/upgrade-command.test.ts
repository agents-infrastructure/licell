import { describe, it, expect } from 'vitest';
import {
  resolveUpgradeScriptUrl,
  resolveChecksumUrl,
  parseChecksumForFile,
  verifySha256
} from '../commands/upgrade';

describe('upgrade command helpers', () => {
  it('uses latest release installer by default', () => {
    expect(resolveUpgradeScriptUrl({})).toBe(
      'https://github.com/dafang/licell/releases/latest/download/install.sh'
    );
  });

  it('uses versioned release installer when version is provided', () => {
    expect(resolveUpgradeScriptUrl({ version: 'v1.2.3' })).toBe(
      'https://github.com/dafang/licell/releases/download/v1.2.3/install.sh'
    );
  });

  it('uses custom repository when provided', () => {
    expect(resolveUpgradeScriptUrl({ repo: 'foo/bar' })).toBe(
      'https://github.com/foo/bar/releases/latest/download/install.sh'
    );
  });

  it('uses script-url override with highest priority', () => {
    expect(resolveUpgradeScriptUrl({
      repo: 'foo/bar',
      version: 'v9.9.9',
      scriptUrl: 'https://example.com/install.sh'
    })).toBe('https://example.com/install.sh');
  });

  it('throws on invalid repository slug', () => {
    expect(() => resolveUpgradeScriptUrl({ repo: 'foo' })).toThrow('无效的仓库格式');
  });
});

describe('resolveChecksumUrl', () => {
  it('derives SHA256SUMS url from script url', () => {
    expect(resolveChecksumUrl('https://github.com/dafang/licell/releases/latest/download/install.sh'))
      .toBe('https://github.com/dafang/licell/releases/latest/download/SHA256SUMS.txt');
  });

  it('handles versioned url', () => {
    expect(resolveChecksumUrl('https://github.com/dafang/licell/releases/download/v1.0.0/install.sh'))
      .toBe('https://github.com/dafang/licell/releases/download/v1.0.0/SHA256SUMS.txt');
  });

  it('returns null for url without slash', () => {
    expect(resolveChecksumUrl('install.sh')).toBeNull();
  });
});

describe('parseChecksumForFile', () => {
  const sampleChecksums = [
    'abc123def456abc123def456abc123def456abc123def456abc123def456abc12345  licell-linux-x64.tar.gz',
    'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef  install.sh',
    ''
  ].join('\n');

  it('finds checksum for install.sh', () => {
    expect(parseChecksumForFile(sampleChecksums, 'install.sh'))
      .toBe('deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
  });

  it('returns null for missing file', () => {
    expect(parseChecksumForFile(sampleChecksums, 'missing.sh')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseChecksumForFile('', 'install.sh')).toBeNull();
  });
});

describe('verifySha256', () => {
  it('returns true for matching hash', () => {
    const content = 'hello world';
    // sha256 of "hello world"
    const hash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    expect(verifySha256(content, hash)).toBe(true);
  });

  it('returns false for mismatched hash', () => {
    expect(verifySha256('hello world', '0000000000000000000000000000000000000000000000000000000000000000')).toBe(false);
  });
});
