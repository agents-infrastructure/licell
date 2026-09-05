import { describe, expect, it, vi } from 'vitest';
import {
  applyVpcConfig,
  normalizeVpcConfigDesiredState,
  planVpcConfig,
  type VpcConfigClient
} from '../providers/vpc/config';

const auth = {
  accountId: 'account',
  ak: 'test-ak',
  sk: 'test-sk',
  region: 'cn-hangzhou'
};

function vpcResponse(name: string, description?: string) {
  return {
    body: {
      totalCount: 1,
      vpcs: {
        vpc: [{
          vpcId: 'vpc-a',
          vpcName: name,
          description,
          regionId: 'cn-hangzhou'
        }]
      }
    }
  };
}

function createClient(
  describeVpcs: VpcConfigClient['describeVpcs'],
  modifyVpcAttribute: VpcConfigClient['modifyVpcAttribute'] = vi.fn(async () => ({ body: { requestId: 'request-a' } }))
): VpcConfigClient {
  return {
    describeVpcs,
    modifyVpcAttribute,
    describeVSwitches: vi.fn(async () => ({ body: {} })),
    describeRouteTables: vi.fn(async () => ({ body: {} })),
    describeNatGateways: vi.fn(async () => ({ body: {} })),
    describeEipAddresses: vi.fn(async () => ({ body: {} }))
  };
}

describe('VPC config desired-state provider', () => {
  it('accepts only explicit name and description desired state', () => {
    expect(normalizeVpcConfigDesiredState({ name: ' prod ', description: null })).toEqual({
      name: 'prod',
      description: null
    });
    expect(() => normalizeVpcConfigDesiredState({})).toThrow(/至少需要/);
    expect(() => normalizeVpcConfigDesiredState({ cidrBlock: '10.0.0.0\/8' })).toThrow(/未知字段/);
    expect(() => normalizeVpcConfigDesiredState({ name: '' })).toThrow(/非空字符串/);
  });

  it('plans field-level set, clear, and noop operations without mutation', async () => {
    const modifyVpcAttribute = vi.fn(async () => ({ body: {} }));
    const client = createClient(vi.fn(async () => vpcResponse('prod', 'old')), modifyVpcAttribute);

    const plan = await planVpcConfig(
      'vpc-a',
      { name: 'prod', description: null },
      {},
      { auth, client }
    );

    expect(plan).toMatchObject({
      vpcId: 'vpc-a',
      current: { name: 'prod', description: 'old' },
      after: { name: 'prod', description: null },
      changeCount: 1,
      willExecute: false,
      changes: [
        { field: 'name', action: 'noop', before: 'prod', after: 'prod' },
        { field: 'description', action: 'clear', before: 'old', after: null }
      ]
    });
    expect(modifyVpcAttribute).not.toHaveBeenCalled();
  });

  it('applies only changed attributes and verifies the read-back state', async () => {
    const describeVpcs = vi.fn()
      .mockResolvedValueOnce(vpcResponse('old', 'before'))
      .mockResolvedValueOnce(vpcResponse('new', 'after'));
    const modifyVpcAttribute = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client = createClient(describeVpcs, modifyVpcAttribute);

    const result = await applyVpcConfig(
      'vpc-a',
      { name: 'new', description: 'after' },
      {},
      { auth, client }
    );

    expect(modifyVpcAttribute).toHaveBeenCalledTimes(1);
    expect(modifyVpcAttribute).toHaveBeenCalledWith(expect.objectContaining({
      regionId: 'cn-hangzhou',
      vpcId: 'vpc-a',
      vpcName: 'new',
      description: 'after'
    }));
    expect(result).toMatchObject({
      execution: { performed: true, requestId: 'request-a' },
      verify: { performed: true, matched: true, attributes: { name: 'new', description: 'after' } }
    });
  });

  it('does not call ModifyVpcAttribute when desired state already matches', async () => {
    const modifyVpcAttribute = vi.fn(async () => ({ body: {} }));
    const client = createClient(vi.fn(async () => vpcResponse('prod', 'same')), modifyVpcAttribute);

    const result = await applyVpcConfig('vpc-a', { description: 'same' }, {}, { auth, client });

    expect(modifyVpcAttribute).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      plan: { changeCount: 0, willExecute: false },
      execution: { performed: false },
      verify: { performed: true, matched: true }
    });
  });

  it('does not issue a second write when read-back verification fails', async () => {
    const denied = Object.assign(new Error('not authorized to describe VPC'), { code: 'Forbidden.RAM' });
    const describeVpcs = vi.fn()
      .mockResolvedValueOnce(vpcResponse('old', 'before'))
      .mockRejectedValueOnce(denied);
    const modifyVpcAttribute = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client = createClient(describeVpcs, modifyVpcAttribute);

    await expect(applyVpcConfig(
      'vpc-a',
      { name: 'new', description: 'after' },
      {},
      { auth, client }
    )).rejects.toThrow(/已被接受，但读回验证未完成/);

    expect(modifyVpcAttribute).toHaveBeenCalledTimes(1);
  });
});
