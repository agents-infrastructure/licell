import { describe, it, expect } from 'vitest';
import { resolveUpgradeScriptUrl } from '../commands/upgrade';

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
