import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isNotFoundError } from '../utils/alicloud-error';

const { describeInstancesMock, createdConfigs } = vi.hoisted(() => ({
  describeInstancesMock: vi.fn(),
  createdConfigs: [] as Array<Record<string, unknown>>
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({
      accountId: '1494123412341234',
      ak: 'test-ak',
      sk: 'test-sk',
      region: 'cn-hangzhou'
    })
  }
}));

vi.mock('@alicloud/ecs20140526', () => ({
  default: class MockEcsClient {
    describeInstances = describeInstancesMock;
  },
  DescribeInstancesRequest: class DescribeInstancesRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  DescribeInstancesRequestTag: class DescribeInstancesRequestTag {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
      createdConfigs.push(input);
    }
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: (ctor: unknown) => ctor
}));

function ecsRow(input: Record<string, unknown>) {
  return input;
}

describe('ecs readonly provider', () => {
  beforeEach(() => {
    describeInstancesMock.mockReset();
    createdConfigs.length = 0;
  });

  it('creates an ECS client with explicit or auth region endpoints', async () => {
    const { createEcsClient, listEcsInstances } = await import('../providers/ecs');

    const explicit = createEcsClient('cn-shanghai');
    expect(explicit.regionId).toBe('cn-shanghai');
    expect(createdConfigs.at(-1)).toMatchObject({
      accessKeyId: 'test-ak',
      accessKeySecret: 'test-sk',
      regionId: 'cn-shanghai',
      endpoint: 'ecs.cn-shanghai.aliyuncs.com'
    });

    describeInstancesMock.mockResolvedValueOnce({
      body: { totalCount: 0, instances: { instance: [] } }
    });
    await listEcsInstances({ limit: 2 });

    expect(createdConfigs.at(-1)).toMatchObject({
      regionId: 'cn-hangzhou',
      endpoint: 'ecs.cn-hangzhou.aliyuncs.com'
    });
    expect(describeInstancesMock.mock.calls[0]?.[0]).toMatchObject({
      regionId: 'cn-hangzhou',
      pageNumber: 1,
      pageSize: 2
    });
  });

  it('maps supported filters into DescribeInstances request and does not post-filter rows', async () => {
    const { listEcsInstances } = await import('../providers/ecs');
    describeInstancesMock.mockResolvedValueOnce({
      body: {
        totalCount: 1,
        instances: {
          instance: [
            ecsRow({
              instanceId: 'i-unmatched',
              instanceName: 'returned-by-sdk',
              regionId: 'cn-shanghai',
              status: 'Running'
            })
          ]
        }
      }
    });

    const result = await listEcsInstances({
      regionId: 'cn-shanghai',
      instanceIds: ['i-a', 'i-b', 'i-a', ''],
      namePrefix: 'prod-',
      status: 'Running',
      zoneId: 'cn-shanghai-a',
      vpcId: 'vpc-1',
      vSwitchId: 'vsw-1',
      instanceType: 'ecs.g7.large',
      chargeType: 'PostPaid',
      privateIpAddress: '172.16.0.10',
      publicIpAddress: '47.1.1.1',
      eipAddress: '8.8.8.8',
      tags: [{ key: 'env', value: 'prod' }, { key: 'owner' }]
    });

    expect(describeInstancesMock.mock.calls[0]?.[0]).toMatchObject({
      regionId: 'cn-shanghai',
      instanceIds: JSON.stringify(['i-a', 'i-b']),
      instanceName: 'prod-*',
      status: 'Running',
      zoneId: 'cn-shanghai-a',
      vpcId: 'vpc-1',
      vSwitchId: 'vsw-1',
      instanceType: 'ecs.g7.large',
      instanceChargeType: 'PostPaid',
      privateIpAddresses: JSON.stringify(['172.16.0.10']),
      publicIpAddresses: JSON.stringify(['47.1.1.1']),
      eipAddresses: JSON.stringify(['8.8.8.8']),
      tag: [{ key: 'env', value: 'prod' }, { key: 'owner' }]
    });
    expect(result.filters).toMatchObject({
      regionId: 'cn-shanghai',
      instanceIds: ['i-a', 'i-b'],
      namePrefix: 'prod-',
      tags: [{ key: 'env', value: 'prod' }, { key: 'owner' }]
    });
    expect(result.instances).toHaveLength(1);
    expect(result.instances[0]?.instanceId).toBe('i-unmatched');
  });

  it('maps exact instance name and preserves status casing in provider request', async () => {
    const { listEcsInstances } = await import('../providers/ecs');
    describeInstancesMock.mockResolvedValueOnce({
      body: {
        totalCount: 0,
        instances: { instance: [] }
      }
    });

    await listEcsInstances({
      regionId: 'cn-hangzhou',
      name: 'Prod-API-01',
      status: 'rUnNiNg',
      limit: 10
    });

    expect(describeInstancesMock.mock.calls[0]?.[0]).toMatchObject({
      regionId: 'cn-hangzhou',
      instanceName: 'Prod-API-01',
      status: 'rUnNiNg'
    });
  });

  it('rejects mutually exclusive name filters with classifiable input error', async () => {
    const { listEcsInstances } = await import('../providers/ecs');

    await expect(listEcsInstances({ name: 'prod-a', namePrefix: 'prod-' }))
      .rejects
      .toThrow(/无效|invalid/i);
    expect(describeInstancesMock).not.toHaveBeenCalled();
  });

  it('paginates with a bounded limit and normalizes summaries through a whitelist', async () => {
    const { listEcsInstances } = await import('../providers/ecs');
    describeInstancesMock
      .mockResolvedValueOnce({
        body: {
          totalCount: 3,
          instances: {
            instance: [
              ecsRow({
                instanceId: 'i-1',
                instanceName: 'demo-1',
                status: 'Running',
                regionId: 'cn-hangzhou',
                zoneId: 'cn-hangzhou-a',
                instanceType: 'ecs.g7.large',
                OSName: 'Alibaba Cloud Linux',
                instanceChargeType: 'PostPaid',
                vpcAttributes: {
                  vpcId: 'vpc-1',
                  vSwitchId: 'vsw-1',
                  privateIpAddress: { ipAddress: ['172.16.0.10'] }
                },
                publicIpAddress: { ipAddress: ['47.1.1.1'] },
                eipAddress: { ipAddress: '8.8.8.8' },
                securityGroupIds: { securityGroupId: ['sg-1'] },
                tags: { tag: [{ tagKey: 'env', tagValue: 'prod' }] },
                creationTime: '2026-01-01T00:00Z',
                expiredTime: '2027-01-01T00:00Z',
                rawAttribute: 'secret',
                userData: 'secret',
                consoleOutput: 'secret',
                password: 'secret',
                vncUrl: 'secret',
                keyPairPrivateKey: 'secret'
              }),
              ecsRow({
                instanceId: 'i-2',
                regionId: 'cn-hangzhou'
              })
            ]
          }
        }
      })
      .mockResolvedValueOnce({
        body: {
          totalCount: 3,
          instances: {
            instance: [
              ecsRow({
                instanceId: 'i-3',
                regionId: 'cn-hangzhou',
                tags: { tag: [{ tagKey: 'empty-value' }] }
              })
            ]
          }
        }
      });

    const result = await listEcsInstances({ limit: 3 });

    expect(describeInstancesMock).toHaveBeenCalledTimes(2);
    expect(describeInstancesMock.mock.calls.map(([request]) => request.pageNumber)).toEqual([1, 2]);
    expect(result).toMatchObject({
      regionId: 'cn-hangzhou',
      totalCount: 3,
      count: 3,
      limit: 3,
      truncated: false
    });
    expect(result.instances[0]).toEqual({
      instanceId: 'i-1',
      instanceName: 'demo-1',
      status: 'Running',
      regionId: 'cn-hangzhou',
      zoneId: 'cn-hangzhou-a',
      instanceType: 'ecs.g7.large',
      osName: 'Alibaba Cloud Linux',
      chargeType: 'PostPaid',
      vpcId: 'vpc-1',
      vSwitchId: 'vsw-1',
      privateIpAddresses: ['172.16.0.10'],
      publicIpAddresses: ['47.1.1.1'],
      eipAddress: '8.8.8.8',
      securityGroupIds: ['sg-1'],
      tags: [{ key: 'env', value: 'prod' }],
      createdAt: '2026-01-01T00:00Z',
      expiredAt: '2027-01-01T00:00Z'
    });
    expect(result.instances[1]).toMatchObject({
      instanceId: 'i-2',
      privateIpAddresses: [],
      publicIpAddresses: [],
      securityGroupIds: [],
      tags: []
    });
    expect(JSON.stringify(result.instances)).not.toMatch(/rawAttribute|userData|consoleOutput|password|vncUrl|keyPairPrivateKey/);
  });

  it('marks list results as truncated when limit is lower than totalCount', async () => {
    const { listEcsInstances } = await import('../providers/ecs');
    describeInstancesMock.mockResolvedValueOnce({
      body: {
        totalCount: 2,
        instances: {
          instance: [
            ecsRow({ instanceId: 'i-1', regionId: 'cn-hangzhou' })
          ]
        }
      }
    });

    const result = await listEcsInstances({ limit: 1 });

    expect(describeInstancesMock).toHaveBeenCalledTimes(1);
    expect(result.truncated).toBe(true);
    expect(result.count).toBe(1);
  });

  it('stops pagination at 20 pages and marks the result truncated', async () => {
    const { listEcsInstances } = await import('../providers/ecs');
    for (let index = 1; index <= 25; index += 1) {
      describeInstancesMock.mockResolvedValueOnce({
        body: {
          instances: {
            instance: [ecsRow({ instanceId: `i-${index}`, regionId: 'cn-hangzhou' })]
          }
        }
      });
    }

    const result = await listEcsInstances({ limit: 25 });

    expect(describeInstancesMock).toHaveBeenCalledTimes(20);
    expect(describeInstancesMock.mock.calls.map(([request]) => request.pageNumber)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1)
    );
    expect(result.count).toBe(20);
    expect(result.truncated).toBe(true);
  });

  it('uses raw rows rather than normalized count when comparing totalCount', async () => {
    const { listEcsInstances } = await import('../providers/ecs');
    describeInstancesMock.mockResolvedValueOnce({
      body: {
        totalCount: 2,
        instances: {
          instance: [
            ecsRow({ regionId: 'cn-hangzhou' }),
            ecsRow({ instanceId: 'i-valid', regionId: 'cn-hangzhou' })
          ]
        }
      }
    });

    const result = await listEcsInstances({ limit: 10 });

    expect(describeInstancesMock).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it('gets detail through instanceIds and throws not-found with classifiable token', async () => {
    const { getEcsInstanceDetail } = await import('../providers/ecs');
    describeInstancesMock
      .mockResolvedValueOnce({
        body: {
          totalCount: 1,
          instances: {
            instance: [ecsRow({ instanceId: 'i-found', regionId: 'cn-hangzhou' })]
          }
        }
      })
      .mockResolvedValueOnce({
        body: {
          totalCount: 0,
          instances: { instance: [] }
        }
      });

    await expect(getEcsInstanceDetail(' i-found ', { regionId: 'cn-hangzhou' }))
      .resolves
      .toMatchObject({ summary: { instanceId: 'i-found' } });
    expect(describeInstancesMock.mock.calls[0]?.[0]).toMatchObject({
      instanceIds: JSON.stringify(['i-found']),
      pageSize: 1
    });

    let caught: unknown;
    try {
      await getEcsInstanceDetail('i-missing', { regionId: 'cn-hangzhou' });
    } catch (err: unknown) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toContain('not exist');
    expect(isNotFoundError(caught)).toBe(true);
  });

  it('rejects empty detail instance id with input-token error', async () => {
    const { getEcsInstanceDetail } = await import('../providers/ecs');

    await expect(getEcsInstanceDetail('   '))
      .rejects
      .toThrow(/不能为空|invalid/i);
    expect(describeInstancesMock).not.toHaveBeenCalled();
  });
});
