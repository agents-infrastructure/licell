import { describe, expect, it } from 'vitest';
import { listCdnDomainsForAgent } from '../providers/cdn-query';

const auth = { accountId: 'account-1', ak: 'ak-test', sk: 'sk-test', region: 'cn-hangzhou' };

describe('CDN domain query provider', () => {
  it('invokes protocol-backed DescribeUserDomains and projects domain summaries', async () => {
    const calls: unknown[] = [];
    const result = await listCdnDomainsForAgent({ prefix: 'static.', limit: 2 }, {
      auth,
      execute: async (operationRef, input, context) => {
        calls.push({ operationRef, input, context });
        return {
          requestId: 'req-cdn-1',
          response: {
            TotalCount: 3,
            Domains: {
              PageData: [{
                DomainName: 'static.example.com',
                Cname: 'static.example.com.w.kunlunsl.com',
                DomainStatus: 'online',
                ServerCertificateStatus: 'on',
                Sources: { Source: [{ Content: 'bucket.oss-cn-hangzhou.aliyuncs.com', Type: 'oss' }] }
              }]
            }
          }
        };
      }
    });

    expect(calls).toEqual([{
      operationRef: 'cdn.DescribeUserDomains',
      input: { PageNumber: 1, PageSize: 2 },
      context: { region: 'cn-hangzhou', auth }
    }]);
    expect(result).toMatchObject({
      stage: 'cdn.domains', regionId: 'cn-hangzhou', count: 1, totalCount: 3, truncated: true,
      requestId: 'req-cdn-1',
      domains: [{
        domainName: 'static.example.com',
        cname: 'static.example.com.w.kunlunsl.com',
        status: 'online',
        serverCertificateStatus: 'on',
        origins: [{ content: 'bucket.oss-cn-hangzhou.aliyuncs.com', type: 'oss' }]
      }]
    });
  });

  it('maps protocol filters and keeps empty responses stable', async () => {
    let input: Record<string, unknown> | undefined;
    const result = await listCdnDomainsForAgent({ domainName: 'example.com', status: 'online', source: 'oss', limit: 20 }, {
      auth,
      execute: async (_operationRef, request) => {
        input = request;
        return { response: { Domains: { PageData: [] }, TotalCount: 0 } };
      }
    });

    expect(input).toEqual({ PageNumber: 1, PageSize: 20, DomainName: 'example.com', DomainStatus: 'online', Source: 'oss' });
    expect(result).toMatchObject({ stage: 'cdn.domains', count: 0, totalCount: 0, truncated: false, domains: [] });
  });
});
