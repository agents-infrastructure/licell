import { describe, expect, it } from 'vitest';
import { resolveCliVersion } from '../utils/version';

describe('version', () => {
  it('prefers LICELL_VERSION env', () => {
    expect(resolveCliVersion({
      env: { LICELL_VERSION: 'v0.9.9' } as NodeJS.ProcessEnv,
      bundledVersion: 'v0.9.8',
      packageVersion: '1.0.0'
    })).toBe('v0.9.9');
  });

  it('uses bundled version when injected', () => {
    expect(resolveCliVersion({
      env: {} as NodeJS.ProcessEnv,
      bundledVersion: 'v0.9.9',
      packageVersion: '1.0.0'
    })).toBe('v0.9.9');
  });

  it('falls back to npm_package_version', () => {
    expect(resolveCliVersion({
      env: { npm_package_version: '1.2.3' } as NodeJS.ProcessEnv,
      packageVersion: null
    })).toBe('1.2.3');
  });

  it('falls back to package version', () => {
    expect(resolveCliVersion({
      env: {} as NodeJS.ProcessEnv,
      packageVersion: '2.0.0'
    })).toBe('2.0.0');
  });

  it('returns dev when no version source exists', () => {
    expect(resolveCliVersion({
      env: {} as NodeJS.ProcessEnv,
      packageVersion: null
    })).toBe('dev');
  });
});
