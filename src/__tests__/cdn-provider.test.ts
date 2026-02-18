import { describe, expect, it } from 'vitest';
import { parseCdnDomainRowsFromBody } from '../providers/cdn';

describe('parseCdnDomainRowsFromBody', () => {
  it('parses domains from DescribeUserDomains response', () => {
    const rows = parseCdnDomainRowsFromBody({
      Domains: {
        PageData: [
          { DomainName: 'API.EXAMPLE.COM', Cname: 'api.example.com.w.cdngslb.com.' },
          { DomainName: 'static.example.com', Cname: 'STATIC.EXAMPLE.COM.W.CDNGLSB.COM' }
        ]
      }
    });

    expect(rows).toEqual([
      {
        domainName: 'api.example.com',
        cname: 'api.example.com.w.cdngslb.com'
      },
      {
        domainName: 'static.example.com',
        cname: 'static.example.com.w.cdnglsb.com'
      }
    ]);
  });

  it('returns empty list when payload shape is invalid', () => {
    expect(parseCdnDomainRowsFromBody(null)).toEqual([]);
    expect(parseCdnDomainRowsFromBody({})).toEqual([]);
    expect(parseCdnDomainRowsFromBody({ Domains: { PageData: {} } })).toEqual([]);
  });
});
