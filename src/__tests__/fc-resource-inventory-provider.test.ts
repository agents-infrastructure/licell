import { describe, expect, it, vi } from 'vitest';
import { listFunctionTags, listFunctionVpcBindings } from '../providers/fc/resource-inventory';

describe('FC resource inventory provider', () => {
  it('rejects an unbounded tag query before calling FC', async () => {
    const client = { listTagResourcesWithOptions: vi.fn() };

    await expect(listFunctionTags({}, client as never)).rejects.toThrow(/query|condition|条件|无效/i);
    expect(client.listTagResourcesWithOptions).not.toHaveBeenCalled();
  });

  it('returns unique VPC binding IDs through the guarded FC client', async () => {
    const client = {
      listVpcBindingsWithOptions: vi.fn(async () => ({ body: { vpcIds: ['vpc-a', 'vpc-a', 'vpc-b'] } }))
    };

    const result = await listFunctionVpcBindings(' demo-fn ', client as never);

    expect(client.listVpcBindingsWithOptions).toHaveBeenCalledWith('demo-fn', {}, expect.anything());
    expect(result).toEqual({ functionName: 'demo-fn', vpcIds: ['vpc-a', 'vpc-b'] });
  });

  it('paginates tag resources and filters an exact function name after decoding its ARN', async () => {
    const client = {
      listTagResourcesWithOptions: vi.fn()
        .mockResolvedValueOnce({
          body: {
            nextToken: 'next-1',
            tagResources: [
              { resourceId: 'acs:fc:cn-shanghai:123:functions/other', tagKey: 'env', tagValue: 'test' }
            ]
          }
        })
        .mockResolvedValueOnce({
          body: {
            tagResources: [
              { resourceId: 'acs:fc:cn-shanghai:123:functions/demo%20fn', resourceType: 'ALIYUN::FC::FUNCTION', tagKey: 'env', tagValue: 'prod' }
            ]
          }
        })
    };

    const result = await listFunctionTags({
      functionName: 'demo fn',
      tags: [{ key: 'env', value: 'prod' }],
      limit: 20,
      accountId: '123',
      regionId: 'cn-shanghai'
    }, client as never);

    expect(client.listTagResourcesWithOptions).toHaveBeenCalledTimes(2);
    const firstRequest = client.listTagResourcesWithOptions.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(firstRequest).toMatchObject({
      limit: 100,
      resourceId: ['acs:fc:cn-shanghai:123:functions/demo fn'],
      resourceType: 'ALIYUN::FC::FUNCTION',
      tag: [{ key: 'env', value: 'prod' }]
    });
    expect(result).toMatchObject({
      functionName: 'demo fn',
      scannedCount: 2,
      truncated: false,
      tagResources: [{ tagKey: 'env', tagValue: 'prod' }]
    });
  });
});
