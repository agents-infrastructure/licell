import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listFnCustomDomainsMock,
  resolveDefaultFcGatewayDomainMock,
  listFunctionAliasesMock,
  listFunctionVersionsMock,
  getCdnDomainDetailMock,
  listCdnDomainsMock,
  listDnsRecordsMock,
  resolveAuthoritativeDnsSnapshotMock,
  getOssBucketInfoMock,
  resolveOssBucketNameMock,
  resolveOssBucketOriginDomainMock
} = vi.hoisted(() => ({
  listFnCustomDomainsMock: vi.fn(),
  resolveDefaultFcGatewayDomainMock: vi.fn(),
  listFunctionAliasesMock: vi.fn(),
  listFunctionVersionsMock: vi.fn(),
  getCdnDomainDetailMock: vi.fn(),
  listCdnDomainsMock: vi.fn(),
  listDnsRecordsMock: vi.fn(),
  resolveAuthoritativeDnsSnapshotMock: vi.fn(),
  getOssBucketInfoMock: vi.fn(),
  resolveOssBucketNameMock: vi.fn(),
  resolveOssBucketOriginDomainMock: vi.fn()
}));

vi.mock('../providers/fc/custom-domain', () => ({
  listFnCustomDomains: listFnCustomDomainsMock,
  resolveDefaultFcGatewayDomain: resolveDefaultFcGatewayDomainMock
}));

vi.mock('../providers/fc/release', () => ({
  listFunctionAliases: listFunctionAliasesMock,
  listFunctionVersions: listFunctionVersionsMock
}));

vi.mock('../providers/cdn', () => ({
  getCdnDomainDetail: getCdnDomainDetailMock,
  listCdnDomains: listCdnDomainsMock
}));

vi.mock('../providers/dns', () => ({
  listDnsRecords: listDnsRecordsMock,
  resolveAuthoritativeDnsSnapshot: resolveAuthoritativeDnsSnapshotMock,
  normalizeDnsValue: (value: string) => value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\.$/, '')
}));

vi.mock('../providers/oss', () => ({
  getOssBucketInfo: getOssBucketInfoMock,
  listOssBuckets: vi.fn(),
  listOssObjects: vi.fn(),
  resolveOssBucketName: resolveOssBucketNameMock,
  resolveOssBucketOriginDomain: resolveOssBucketOriginDomainMock
}));

describe('probeDoctorDomainConsistency', () => {
  beforeEach(() => {
    listFnCustomDomainsMock.mockReset();
    resolveDefaultFcGatewayDomainMock.mockReset();
    listFunctionAliasesMock.mockReset();
    listFunctionVersionsMock.mockReset();
    getCdnDomainDetailMock.mockReset();
    listCdnDomainsMock.mockReset();
    listDnsRecordsMock.mockReset();
    resolveAuthoritativeDnsSnapshotMock.mockReset();
    getOssBucketInfoMock.mockReset();
    resolveOssBucketNameMock.mockReset();
    resolveOssBucketOriginDomainMock.mockReset();
  });

  it('accepts api domain when fc route, cdn, and dns are aligned', async () => {
    const { probeDoctorDomainConsistency } = await import('../providers/doctor-cloud');

    listFnCustomDomainsMock.mockResolvedValue([
      {
        domainName: 'api.example.com',
        protocol: 'HTTP',
        routes: [{ path: '/*', functionName: 'demo-api', qualifier: 'prod' }]
      }
    ]);
    resolveDefaultFcGatewayDomainMock.mockReturnValue('123456.cn-hangzhou.fc.aliyuncs.com');
    listFunctionAliasesMock.mockResolvedValue([{ aliasName: 'prod', versionId: '12' }]);
    listFunctionVersionsMock.mockResolvedValue([{ versionId: '12' }]);
    getCdnDomainDetailMock.mockResolvedValue({
      domainName: 'api.example.com',
      cname: 'api.example.com.w.cdngslb.com',
      status: 'online',
      origins: [{ content: '123456.cn-hangzhou.fc.aliyuncs.com', type: 'domain' }]
    });
    listDnsRecordsMock.mockResolvedValue([
      { recordId: '1', rr: 'api', type: 'CNAME', value: 'api.example.com.w.cdngslb.com' }
    ]);
    resolveAuthoritativeDnsSnapshotMock.mockResolvedValue({
      domainName: 'api.example.com',
      nameServerHosts: [],
      nameServerIps: [],
      cname: ['api.example.com.w.cdngslb.com'],
      addresses: []
    });

    const result = await probeDoctorDomainConsistency({
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

    expect(result.status).toBe('ok');
    expect(result.summary).toContain('一致性通过');
  });

  it('reports api domain route drift when qualifier alias is missing', async () => {
    const { probeDoctorDomainConsistency } = await import('../providers/doctor-cloud');

    listFnCustomDomainsMock.mockResolvedValue([
      {
        domainName: 'api.example.com',
        protocol: 'HTTP',
        routes: [{ path: '/*', functionName: 'demo-api', qualifier: 'prod' }]
      }
    ]);
    resolveDefaultFcGatewayDomainMock.mockReturnValue('123456.cn-hangzhou.fc.aliyuncs.com');
    listFunctionAliasesMock.mockResolvedValue([]);
    listFunctionVersionsMock.mockResolvedValue([{ versionId: '12' }]);
    getCdnDomainDetailMock.mockResolvedValue(undefined);
    listDnsRecordsMock.mockResolvedValue([
      { recordId: '1', rr: 'api', type: 'CNAME', value: '123456.cn-hangzhou.fc.aliyuncs.com' }
    ]);
    resolveAuthoritativeDnsSnapshotMock.mockResolvedValue({
      domainName: 'api.example.com',
      nameServerHosts: [],
      nameServerIps: [],
      cname: ['123456.cn-hangzhou.fc.aliyuncs.com'],
      addresses: []
    });

    const result = await probeDoctorDomainConsistency({
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
    expect(result.details.join('\n')).toContain('missing alias: prod');
  });

  it('accepts static domain when cdn origin and dns are aligned with bucket origin', async () => {
    const { probeDoctorDomainConsistency } = await import('../providers/doctor-cloud');

    resolveOssBucketNameMock.mockReturnValue('licell-demo-1494');
    resolveOssBucketOriginDomainMock.mockReturnValue('licell-demo-1494.oss-cn-hangzhou.aliyuncs.com');
    getOssBucketInfoMock.mockResolvedValue({
      name: 'licell-demo-1494',
      location: 'oss-cn-hangzhou',
      extranetEndpoint: 'oss-cn-hangzhou.aliyuncs.com',
      domains: []
    });
    listCdnDomainsMock.mockResolvedValue([
      {
        domainName: 'static.example.com',
        cname: 'static.example.com.w.cdngslb.com',
        status: 'online',
        origins: [{ content: 'licell-demo-1494.oss-cn-hangzhou.aliyuncs.com', type: 'oss' }]
      }
    ]);
    listDnsRecordsMock.mockResolvedValue([
      { recordId: '1', rr: 'static', type: 'CNAME', value: 'static.example.com.w.cdngslb.com' }
    ]);
    resolveAuthoritativeDnsSnapshotMock.mockResolvedValue({
      domainName: 'static.example.com',
      nameServerHosts: [],
      nameServerIps: [],
      cname: ['static.example.com.w.cdngslb.com'],
      addresses: []
    });

    const result = await probeDoctorDomainConsistency({
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

    expect(result.status).toBe('ok');
    expect(result.summary).toContain('一致性通过');
  });
});
