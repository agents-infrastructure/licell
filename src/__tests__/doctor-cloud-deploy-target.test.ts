import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getFunctionInfoMock,
  listFunctionAliasesMock,
  listFunctionVersionsMock,
  getOssBucketInfoMock,
  listOssObjectsMock,
  resolveOssBucketNameMock,
  resolveOssBucketOriginDomainMock
} = vi.hoisted(() => ({
  getFunctionInfoMock: vi.fn(),
  listFunctionAliasesMock: vi.fn(),
  listFunctionVersionsMock: vi.fn(),
  getOssBucketInfoMock: vi.fn(),
  listOssObjectsMock: vi.fn(),
  resolveOssBucketNameMock: vi.fn(),
  resolveOssBucketOriginDomainMock: vi.fn()
}));

vi.mock('../providers/fc/function-ops', () => ({
  getFunctionInfo: getFunctionInfoMock,
  listFunctions: vi.fn()
}));

vi.mock('../providers/fc/release', () => ({
  listFunctionAliases: listFunctionAliasesMock,
  listFunctionVersions: listFunctionVersionsMock
}));

vi.mock('../providers/oss', () => ({
  getOssBucketInfo: getOssBucketInfoMock,
  listOssBuckets: vi.fn(),
  listOssObjects: listOssObjectsMock,
  resolveOssBucketName: resolveOssBucketNameMock,
  resolveOssBucketOriginDomain: resolveOssBucketOriginDomainMock
}));

describe('probeDoctorDeployTarget', () => {
  beforeEach(() => {
    getFunctionInfoMock.mockReset();
    listFunctionAliasesMock.mockReset();
    listFunctionVersionsMock.mockReset();
    getOssBucketInfoMock.mockReset();
    listOssObjectsMock.mockReset();
    resolveOssBucketNameMock.mockReset();
    resolveOssBucketOriginDomainMock.mockReset();
  });

  it('reports api alias drift as blocking', async () => {
    const { probeDoctorDeployTarget } = await import('../providers/doctor-cloud');

    getFunctionInfoMock.mockResolvedValue({
      functionName: 'demo-api',
      runtime: 'custom.debian12',
      handler: 'dist/index.handler',
      state: 'Active',
      lastModifiedTime: '2026-03-11T00:00:00Z',
      customRuntimeConfig: {
        command: ['/bin/sh'],
        args: ['/code/.licell/node22-launcher.sh']
      }
    });
    listFunctionAliasesMock.mockResolvedValue([
      { aliasName: 'prod', versionId: '9' }
    ]);
    listFunctionVersionsMock.mockResolvedValue([
      { versionId: '1' }
    ]);

    const result = await probeDoctorDeployTarget({
      auth: {
        accountId: '1494910986361453',
        ak: 'demo-ak',
        sk: 'demo-sk',
        region: 'cn-hangzhou'
      },
      project: {
        appName: 'demo-api',
        runtime: 'nodejs22',
        envs: {}
      },
      deployTypeHint: 'api',
      runtime: 'nodejs22'
    });

    expect(result.status).toBe('error');
    expect(result.summary).toContain('阻塞项');
    expect(result.details.join('\n')).toContain('broken aliases: prod');
    expect(result.nextActions).toEqual([
      expect.objectContaining({
        commandTemplate: 'licell deploy --type api',
        phase: 'mutate',
        priority: 'primary',
        source: 'doctor-next-command'
      }),
      expect.objectContaining({
        commandTemplate: 'licell release promote --target <alias>',
        phase: 'mutate',
        priority: 'secondary',
        source: 'doctor-next-command'
      }),
      expect.objectContaining({
        commandTemplate: 'licell fn info',
        phase: 'inspect',
        priority: 'secondary',
        source: 'doctor-next-command'
      })
    ]);
  }, 15000);

  it('reports empty static bucket as warning', async () => {
    const { probeDoctorDeployTarget } = await import('../providers/doctor-cloud');

    resolveOssBucketNameMock.mockReturnValue('licell-demo-1494');
    resolveOssBucketOriginDomainMock.mockReturnValue('licell-demo-1494.oss-cn-hangzhou.aliyuncs.com');
    getOssBucketInfoMock.mockResolvedValue({
      name: 'licell-demo-1494',
      location: 'oss-cn-hangzhou',
      extranetEndpoint: 'oss-cn-hangzhou.aliyuncs.com',
      acl: 'private',
      publicAccessBlock: true,
      domains: []
    });
    listOssObjectsMock.mockResolvedValue([]);

    const result = await probeDoctorDeployTarget({
      auth: {
        accountId: '1494910986361453',
        ak: 'demo-ak',
        sk: 'demo-sk',
        region: 'cn-hangzhou'
      },
      project: {
        appName: 'demo-static',
        runtime: 'static',
        envs: {}
      },
      deployTypeHint: 'static',
      runtime: null
    });

    expect(result.status).toBe('warn');
    expect(result.summary).toContain('待收敛项');
    expect(result.details.join('\n')).toContain('sampleObjectCount: 0');
    expect(result.nextActions).toEqual([
      expect.objectContaining({
        commandTemplate: 'licell deploy --type static',
        phase: 'mutate',
        priority: 'primary',
        source: 'doctor-next-command'
      }),
      expect.objectContaining({
        commandTemplate: 'licell oss upload <bucket>',
        phase: 'mutate',
        priority: 'secondary',
        source: 'doctor-next-command'
      })
    ]);
  });
});
