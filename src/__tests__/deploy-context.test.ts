import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getProjectMock, getGlobalConfigMock, setProjectMock } = vi.hoisted(() => ({
  getProjectMock: vi.fn(),
  getGlobalConfigMock: vi.fn(),
  setProjectMock: vi.fn()
}));

const { ensureAuthOrExitMock, isInteractiveTTYMock } = vi.hoisted(() => ({
  ensureAuthOrExitMock: vi.fn(),
  isInteractiveTTYMock: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: getProjectMock,
    getGlobalConfig: getGlobalConfigMock,
    setProject: setProjectMock
  }
}));

vi.mock('../utils/cli-shared', async () => {
  const actual = await vi.importActual<typeof import('../utils/cli-shared')>('../utils/cli-shared');
  return {
    ...actual,
    ensureAuthOrExit: ensureAuthOrExitMock,
    isInteractiveTTY: isInteractiveTTYMock
  };
});

import { resolveDeployContext } from '../commands/deploy-context';

describe('resolveDeployContext', () => {
  beforeEach(() => {
    getGlobalConfigMock.mockReturnValue({});
    ensureAuthOrExitMock.mockResolvedValue({
      accountId: '1234567890123456',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    });
    isInteractiveTTYMock.mockReturnValue(false);
    setProjectMock.mockReset();
  });

  it('reuses persisted static deploy preferences', async () => {
    getProjectMock.mockReturnValue({
      appName: 'demo-web',
      deployType: 'static',
      dist: 'build',
      domain: 'www.example.com',
      enableCdn: true,
      envs: {}
    });

    const ctx = await resolveDeployContext({});

    expect(ctx).toMatchObject({
      appName: 'demo-web',
      type: 'static',
      projectDomain: 'www.example.com',
      projectDist: 'build',
      enableCdn: true,
      enableSSL: true,
      useVpc: false
    });
  });

  it('reuses persisted api deploy preferences', async () => {
    getProjectMock.mockReturnValue({
      appName: 'demo-api',
      deployType: 'api',
      runtime: 'nodejs22',
      entry: 'src/index.ts',
      domainSuffix: 'example.com',
      target: 'prod',
      useVpc: false,
      enableSSL: true,
      envs: {}
    });

    const ctx = await resolveDeployContext({});

    expect(ctx).toMatchObject({
      appName: 'demo-api',
      type: 'api',
      projectRuntime: 'nodejs22',
      projectEntry: 'src/index.ts',
      domainSuffix: 'example.com',
      releaseTarget: 'prod',
      useVpc: false,
      enableSSL: true
    });
  });

  it('forwards explicit component selection to config lookup', async () => {
    getProjectMock.mockImplementation((options?: { component?: string }) => {
      if (options?.component === 'web') {
        return {
          appName: 'demo-web',
          deployType: 'static',
          dist: 'dist',
          envs: {}
        };
      }
      return {
        appName: 'demo-api',
        deployType: 'api',
        envs: {}
      };
    });

    const ctx = await resolveDeployContext({ component: 'web' });

    expect(getProjectMock).toHaveBeenCalledWith({ component: 'web' });
    expect(ctx).toMatchObject({
      component: 'web',
      appName: 'demo-web',
      type: 'static'
    });
  });
});
