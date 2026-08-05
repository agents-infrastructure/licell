import { describe, expect, it, vi } from 'vitest';
import {
  applyInvocationRegion,
  getInvocationRegionId,
  isRegionalInvocation,
  runWithInvocationRegion
} from '../utils/region-context';
import { Config } from '../utils/config';
import { ensureAuthOrExit } from '../utils/cli-shared';

describe('invocation region context', () => {
  it('keeps concurrent async invocations isolated', async () => {
    const observed = await Promise.all([
      runWithInvocationRegion(
        { scope: 'auth', regionId: 'cn-shanghai', resolveFallbackRegion: () => 'cn-hangzhou' },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return getInvocationRegionId();
        }
      ),
      runWithInvocationRegion(
        { scope: 'auth', regionId: 'cn-beijing', resolveFallbackRegion: () => 'cn-hangzhou' },
        async () => {
          await Promise.resolve();
          return getInvocationRegionId();
        }
      )
    ]);

    expect(observed).toEqual(['cn-shanghai', 'cn-beijing']);
    expect(isRegionalInvocation()).toBe(false);
  });

  it('clones fallback auth without mutating the raw object', async () => {
    const rawAuth = {
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    };

    const effective = await runWithInvocationRegion(
      { scope: 'auth', resolveFallbackRegion: () => rawAuth.region },
      async () => applyInvocationRegion(rawAuth)
    );

    expect(effective).toEqual(rawAuth);
    expect(effective).not.toBe(rawAuth);
    expect(rawAuth.region).toBe('cn-hangzhou');
  });

  it('overlays only the cloned auth region', async () => {
    const rawAuth = {
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    };

    const effective = await runWithInvocationRegion(
      { scope: 'project', regionId: ' CN-SHANGHAI ' },
      async () => applyInvocationRegion(rawAuth)
    );

    expect(effective.region).toBe('cn-shanghai');
    expect(rawAuth.region).toBe('cn-hangzhou');
  });

  it('lets Config.requireAuth return an overridden clone without persisting it', async () => {
    const rawAuth = {
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    };
    const getAuthSpy = vi.spyOn(Config, 'getAuth').mockReturnValue(rawAuth);
    const setAuthSpy = vi.spyOn(Config, 'setAuth');

    try {
      const effective = await runWithInvocationRegion(
        { scope: 'auth', regionId: 'cn-shanghai' },
        async () => Config.requireAuth()
      );

      expect(effective).toEqual({ ...rawAuth, region: 'cn-shanghai' });
      expect(effective).not.toBe(rawAuth);
      expect(rawAuth.region).toBe('cn-hangzhou');
      expect(setAuthSpy).not.toHaveBeenCalled();
    } finally {
      getAuthSpy.mockRestore();
      setAuthSpy.mockRestore();
    }
  });

  it('keeps the invocation override through ensureAuthOrExit without persisting it', async () => {
    const rawAuth = {
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    };
    const getAuthSpy = vi.spyOn(Config, 'getAuth').mockReturnValue(rawAuth);
    const setAuthSpy = vi.spyOn(Config, 'setAuth');

    try {
      const effective = await runWithInvocationRegion(
        { scope: 'auth', regionId: 'cn-shanghai' },
        async () => ensureAuthOrExit()
      );

      expect(effective).toEqual({ ...rawAuth, region: 'cn-shanghai' });
      expect(effective).not.toBe(rawAuth);
      expect(rawAuth.region).toBe('cn-hangzhou');
      expect(setAuthSpy).not.toHaveBeenCalled();
    } finally {
      getAuthSpy.mockRestore();
      setAuthSpy.mockRestore();
    }
  });

  it('uses the loaded auth region before consulting the lazy disk fallback', async () => {
    const resolveFallbackRegion = vi.fn(() => 'cn-beijing');
    const effective = await runWithInvocationRegion(
      { scope: 'auth', resolveFallbackRegion },
      async () => applyInvocationRegion({
        accountId: '123',
        ak: 'ak',
        sk: 'sk',
        region: 'cn-hangzhou'
      })
    );

    expect(effective.region).toBe('cn-hangzhou');
    expect(resolveFallbackRegion).not.toHaveBeenCalled();
  });
});
