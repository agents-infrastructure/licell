import { describe, it, expect } from 'vitest';
import {
  detectInstallSource,
  buildPackageManagerUpgradeCommand,
  formatInstallSourceDisplay,
  formatUpgradeDryRunText,
  resolveUpgradePlan,
  resolveUpgradeScriptUrl,
  resolveChecksumUrl,
  parseChecksumForFile,
  verifySha256
} from '../commands/upgrade';

describe('upgrade command helpers', () => {
  it('uses latest release installer by default', () => {
    expect(resolveUpgradeScriptUrl({})).toBe(
      'https://github.com/agents-infrastructure/licell/releases/latest/download/install.sh'
    );
  });

  it('uses versioned release installer when version is provided', () => {
    expect(resolveUpgradeScriptUrl({ version: 'v1.2.3' })).toBe(
      'https://github.com/agents-infrastructure/licell/releases/download/v1.2.3/install.sh'
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
    expect(resolveChecksumUrl('https://github.com/agents-infrastructure/licell/releases/latest/download/install.sh'))
      .toBe('https://github.com/agents-infrastructure/licell/releases/latest/download/SHA256SUMS.txt');
  });

  it('handles versioned url', () => {
    expect(resolveChecksumUrl('https://github.com/agents-infrastructure/licell/releases/download/v1.0.0/install.sh'))
      .toBe('https://github.com/agents-infrastructure/licell/releases/download/v1.0.0/SHA256SUMS.txt');
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

describe('detectInstallSource', () => {
  it('detects npm global install from node_modules path', () => {
    expect(detectInstallSource({
      argv: ['node', '/usr/local/lib/node_modules/licell/dist/licell.js'],
      execPath: '/usr/local/bin/node'
    })).toMatchObject({
      kind: 'package-manager',
      packageManager: 'npm'
    });
  });

  it('detects pnpm global install from .pnpm path', () => {
    expect(detectInstallSource({
      argv: ['node', '/Users/test/Library/pnpm/global/5/.pnpm/licell@0.9.43/node_modules/licell/dist/licell.js'],
      execPath: '/usr/local/bin/node'
    })).toMatchObject({
      kind: 'package-manager',
      packageManager: 'pnpm'
    });
  });

  it('detects yarn global install from yarn global path', () => {
    expect(detectInstallSource({
      argv: ['node', '/Users/test/.config/yarn/global/node_modules/licell/dist/licell.js'],
      execPath: '/usr/local/bin/node'
    })).toMatchObject({
      kind: 'package-manager',
      packageManager: 'yarn'
    });
  });

  it('detects release install from install root runtime path', () => {
    expect(detectInstallSource({
      argv: ['node', '/Users/test/.local/share/licell/current/dist/licell.js'],
      execPath: '/usr/local/bin/node'
    })).toMatchObject({
      kind: 'release'
    });
  });

  it('detects release install from standalone executable path', () => {
    expect(detectInstallSource({
      argv: ['/Users/test/.local/bin/licell', 'upgrade'],
      execPath: '/Users/test/.local/bin/licell'
    })).toMatchObject({
      kind: 'release'
    });
  });

  it('detects project install from workspace node_modules path', () => {
    expect(detectInstallSource({
      argv: ['node', '/Users/test/work/app/node_modules/licell/dist/licell.js'],
      execPath: '/usr/local/bin/node'
    })).toMatchObject({
      kind: 'project',
      packageManager: 'npm'
    });
  });

  it('detects project install from linked local dist path', () => {
    expect(detectInstallSource({
      argv: ['node', '/Users/test/work/licell/dist/licell.js'],
      execPath: '/usr/local/bin/node'
    })).toMatchObject({
      kind: 'project'
    });
  });
});

describe('buildPackageManagerUpgradeCommand', () => {
  it('builds npm upgrade command and strips leading v from version', () => {
    expect(buildPackageManagerUpgradeCommand({
      packageManager: 'npm',
      version: 'v1.2.3'
    })).toEqual({
      command: 'npm',
      args: ['install', '-g', 'licell@1.2.3'],
      displayCommand: 'npm install -g licell@1.2.3'
    });
  });

  it('builds yarn upgrade command for latest version by default', () => {
    expect(buildPackageManagerUpgradeCommand({
      packageManager: 'yarn'
    })).toEqual({
      command: 'yarn',
      args: ['global', 'add', 'licell@latest'],
      displayCommand: 'yarn global add licell@latest'
    });
  });
});

describe('dry-run formatting', () => {
  it('formats install source label with package manager', () => {
    expect(formatInstallSourceDisplay({
      kind: 'package-manager',
      packageManager: 'pnpm',
      runtimePath: '/tmp/x',
      execPath: '/usr/local/bin/node'
    })).toBe('package-manager (pnpm)');
  });

  it('formats dry-run text with detected install source and command', () => {
    expect(formatUpgradeDryRunText({
      installSource: {
        kind: 'project',
        packageManager: 'npm',
        runtimePath: '/Users/test/work/app/node_modules/licell/dist/licell.js',
        execPath: '/usr/local/bin/node'
      },
      channel: 'npm',
      plan: {
        mode: 'package-manager',
        packageManager: 'npm',
        command: 'npm',
        args: ['install', '-g', 'licell@1.2.3'],
        displayCommand: 'npm install -g licell@1.2.3'
      }
    })).toBe([
      'detected install source: project (npm)',
      'requested channel: npm',
      'package manager command: npm install -g licell@1.2.3'
    ].join('\n'));
  });
});

describe('resolveUpgradePlan', () => {
  it('uses package manager upgrade plan for npm-installed cli', () => {
    expect(resolveUpgradePlan({
      version: 'v1.2.3',
      installSource: {
        kind: 'package-manager',
        packageManager: 'npm',
        runtimePath: '/usr/local/lib/node_modules/licell/dist/licell.js',
        execPath: '/usr/local/bin/node'
      }
    })).toMatchObject({
      mode: 'package-manager',
      packageManager: 'npm',
      command: 'npm',
      args: ['install', '-g', 'licell@1.2.3']
    });
  });

  it('forces release upgrade plan when repo override is provided', () => {
    expect(resolveUpgradePlan({
      repo: 'foo/bar',
      installSource: {
        kind: 'package-manager',
        packageManager: 'npm',
        runtimePath: '/usr/local/lib/node_modules/licell/dist/licell.js',
        execPath: '/usr/local/bin/node'
      }
    })).toEqual({
      mode: 'release',
      scriptUrl: 'https://github.com/foo/bar/releases/latest/download/install.sh'
    });
  });

  it('rejects auto upgrade for project-local install', () => {
    expect(() => resolveUpgradePlan({
      installSource: {
        kind: 'project',
        packageManager: 'npm',
        runtimePath: '/Users/test/work/app/node_modules/licell/dist/licell.js',
        execPath: '/usr/local/bin/node'
      }
    })).toThrow('项目内依赖或开发链接');
  });

  it('allows explicit channel override for project-local install', () => {
    expect(resolveUpgradePlan({
      channel: 'npm',
      version: 'v1.2.3',
      installSource: {
        kind: 'project',
        packageManager: 'npm',
        runtimePath: '/Users/test/work/app/node_modules/licell/dist/licell.js',
        execPath: '/usr/local/bin/node'
      }
    })).toMatchObject({
      mode: 'package-manager',
      packageManager: 'npm',
      command: 'npm',
      args: ['install', '-g', 'licell@1.2.3']
    });
  });

  it('allows explicit release channel override for project-local install', () => {
    expect(resolveUpgradePlan({
      channel: 'release',
      version: 'v1.2.3',
      installSource: {
        kind: 'project',
        packageManager: 'npm',
        runtimePath: '/Users/test/work/app/node_modules/licell/dist/licell.js',
        execPath: '/usr/local/bin/node'
      }
    })).toEqual({
      mode: 'release',
      scriptUrl: 'https://github.com/agents-infrastructure/licell/releases/download/v1.2.3/install.sh'
    });
  });
});
