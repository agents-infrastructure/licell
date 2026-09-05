import { describe, expect, it } from 'vitest';
import { listCasCertificates } from '../providers/cas-query';

const auth = { accountId: 'account-1', ak: 'ak-test', sk: 'sk-test', region: 'cn-hangzhou' };

describe('CAS certificate query provider', () => {
  it('invokes protocol-backed ListCert and projects safe certificate metadata', async () => {
    const calls: unknown[] = [];
    const result = await listCasCertificates({ keyword: 'example.com', limit: 2 }, {
      auth,
      execute: async (operationRef, input, context) => {
        calls.push({ operationRef, input, context });
        return {
          requestId: 'req-cas-1',
          response: {
            TotalCount: 3,
            CertList: {
              Cert: [
                {
                  CertId: 123,
                  Identifier: '123-cn-hangzhou',
                  Name: 'example',
                  Domain: 'example.com',
                  Status: 'ISSUE',
                  NotAfter: '2027-01-01T00:00:00Z',
                  Cert: '-----BEGIN CERTIFICATE-----',
                  PrivateKey: 'should-not-escape'
                }
              ]
            }
          }
        };
      }
    });

    expect(calls).toEqual([{
      operationRef: 'cas.ListCert',
      input: { CurrentPage: 1, ShowSize: 2, KeyWord: 'example.com' },
      context: { region: 'cn-hangzhou', auth }
    }]);
    expect(result).toMatchObject({
      stage: 'cas.certificates',
      regionId: 'cn-hangzhou',
      count: 1,
      totalCount: 3,
      truncated: true,
      requestId: 'req-cas-1',
      certificates: [{ certificateId: '123', identifier: '123-cn-hangzhou', name: 'example', domain: 'example.com', status: 'ISSUE' }]
    });
    expect(JSON.stringify(result)).not.toContain('BEGIN CERTIFICATE');
    expect(JSON.stringify(result)).not.toContain('should-not-escape');
  });

  it('clamps invalid limits and accepts alternate certificate list shapes', async () => {
    let input: Record<string, unknown> | undefined;
    const result = await listCasCertificates({ limit: 999 }, {
      auth,
      execute: async (_operationRef, request) => {
        input = request;
        return { response: { Certificates: [{ CertificateId: 'cert-1', CertificateName: 'one' }] } };
      }
    });

    expect(input).toMatchObject({ CurrentPage: 1, ShowSize: 200 });
    expect(result.limit).toBe(200);
    expect(result.certificates).toEqual([{ certificateId: 'cert-1', name: 'one' }]);
  });
});
