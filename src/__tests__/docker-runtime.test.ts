import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const {
  mockCheckDockerAvailable,
  mockDockerBuild,
  mockDockerLogin,
  mockDockerPush,
  mockEnsureAcrReady,
  mockGetDockerLoginCredentials,
  mockFormatTimestampTag
} = vi.hoisted(() => ({
  mockCheckDockerAvailable: vi.fn(),
  mockDockerBuild: vi.fn(),
  mockDockerLogin: vi.fn(),
  mockDockerPush: vi.fn(),
  mockEnsureAcrReady: vi.fn(),
  mockGetDockerLoginCredentials: vi.fn(),
  mockFormatTimestampTag: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: vi.fn(() => ({
      accountId: '123456',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    })),
    getProject: vi.fn(() => ({
      appName: 'demo-app',
      envs: {}
    }))
  }
}));

vi.mock('../utils/docker', () => ({
  checkDockerAvailable: mockCheckDockerAvailable,
  dockerBuild: mockDockerBuild,
  dockerLogin: mockDockerLogin,
  dockerPush: mockDockerPush
}));

vi.mock('../providers/cr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../providers/cr')>();
  return {
    ...actual,
    ensureAcrReady: mockEnsureAcrReady,
    getDockerLoginCredentials: mockGetDockerLoginCredentials,
    formatTimestampTag: mockFormatTimestampTag
  };
});

import { getSupportedFcRuntimes, normalizeFcRuntime } from '../providers/fc';
import { getRuntime } from '../providers/fc/runtime-handler';

describe('docker runtime integration', () => {
  let originalCwd = '';
  let workdir = '';

  beforeEach(() => {
    vi.clearAllMocks();
    originalCwd = process.cwd();
    workdir = mkdtempSync(join(tmpdir(), 'licell-docker-runtime-test-'));
    process.chdir(workdir);
    writeFileSync(join(workdir, 'Dockerfile'), 'FROM scratch\n');
    mockEnsureAcrReady.mockResolvedValue({
      instanceId: null,
      registryEndpoint: 'registry.cn-hangzhou.aliyuncs.com',
      vpcRegistryEndpoint: 'registry-vpc.cn-hangzhou.aliyuncs.com',
      namespace: 'licell',
      repoName: 'demo-app'
    });
    mockGetDockerLoginCredentials.mockResolvedValue({
      endpoint: 'registry.cn-hangzhou.aliyuncs.com',
      userName: 'user',
      password: 'pass'
    });
    mockFormatTimestampTag.mockReturnValue('20260622-160000');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (workdir) rmSync(workdir, { recursive: true, force: true });
  });

  it('docker is registered as a supported runtime', () => {
    expect(getSupportedFcRuntimes()).toContain('docker');
  });

  it('normalizeFcRuntime accepts docker', () => {
    expect(normalizeFcRuntime('docker')).toBe('docker');
    expect(normalizeFcRuntime(' Docker ')).toBe('docker');
  });

  it('getRuntime returns docker handler', () => {
    const handler = getRuntime('docker');
    expect(handler.name).toBe('docker');
    expect(handler.defaultEntry).toBe('');
    expect(handler.unsupportedMessage).toContain('custom-container');
  });

  it('docker resolveConfig returns custom-container runtime with skipCodePackaging', async () => {
    const handler = getRuntime('docker');
    const config = await handler.resolveConfig('/tmp/fake', 'registry-vpc.cn-hangzhou.aliyuncs.com/licell/app:20260217');
    expect(config.runtime).toBe('custom-container');
    expect(config.skipCodePackaging).toBe(true);
    expect(config.customContainerConfig).toBeDefined();
    expect(config.customRuntimeConfig).toBeUndefined();
  });

  it('returns the public ACR image URI for FC custom-container pulls', async () => {
    const handler = getRuntime('docker');
    const bootFile = await handler.prepareBootFile('', '/tmp/fake', {
      appName: 'demo-app',
      envs: {}
    });

    expect(bootFile).toBe('registry.cn-hangzhou.aliyuncs.com/licell/demo-app:20260622-160000');
    expect(mockDockerBuild).toHaveBeenCalledWith(
      'registry.cn-hangzhou.aliyuncs.com/licell/demo-app:20260622-160000',
      realpathSync(workdir),
      realpathSync(join(workdir, 'Dockerfile'))
    );
    expect(mockDockerPush).toHaveBeenCalledWith(
      'registry.cn-hangzhou.aliyuncs.com/licell/demo-app:20260622-160000'
    );
  });
});
