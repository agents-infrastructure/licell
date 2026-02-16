import { describe, expect, it, vi } from 'vitest';
import { resolveFunctionVpcConfig } from '../providers/fc';

describe('resolveFunctionVpcConfig', () => {
  it('returns undefined when network is missing', async () => {
    await expect(resolveFunctionVpcConfig(undefined)).resolves.toBeUndefined();
  });

  it('uses configured sgId and does not call resolver', async () => {
    const resolver = vi.fn(async () => ({ sgId: 'sg-ignored' }));
    const config = await resolveFunctionVpcConfig({
      vpcId: 'vpc-1',
      vswId: 'vsw-1',
      sgId: 'sg-1'
    }, resolver);

    expect(config).toEqual({
      vpcId: 'vpc-1',
      vSwitchIds: ['vsw-1'],
      securityGroupId: 'sg-1'
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it('resolves missing sgId from network resolver', async () => {
    const resolver = vi.fn(async () => ({ sgId: 'sg-resolved' }));
    const config = await resolveFunctionVpcConfig({
      vpcId: 'vpc-2',
      vswId: 'vsw-2'
    }, resolver);

    expect(config).toEqual({
      vpcId: 'vpc-2',
      vSwitchIds: ['vsw-2'],
      securityGroupId: 'sg-resolved'
    });
    expect(resolver).toHaveBeenCalledWith({
      vpcId: 'vpc-2',
      vswId: 'vsw-2'
    });
  });

  it('never writes empty-string securityGroupId', async () => {
    const resolver = vi.fn(async () => ({ sgId: '' }));
    const config = await resolveFunctionVpcConfig({
      vpcId: 'vpc-3',
      vswId: 'vsw-3'
    }, resolver);

    expect(config).toEqual({
      vpcId: 'vpc-3',
      vSwitchIds: ['vsw-3']
    });
    expect((config as { securityGroupId?: string }).securityGroupId).toBeUndefined();
  });
});
