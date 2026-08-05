import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  authState,
  ecsMocks,
  projectState,
  RequestCtor,
  vpcMocks
} = vi.hoisted(() => ({
  authState: { region: 'cn-shanghai' },
  ecsMocks: {
    describeSecurityGroups: vi.fn(),
    createSecurityGroup: vi.fn()
  },
  projectState: { network: undefined as unknown },
  RequestCtor: class RequestCtor {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
    }
  },
  vpcMocks: {
    describeVpcs: vi.fn(),
    describeVSwitches: vi.fn(),
    describeVSwitchAttributes: vi.fn(),
    describeZones: vi.fn(),
    createVpc: vi.fn(),
    createVSwitch: vi.fn()
  }
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({ accountId: '123', ak: 'ak', sk: 'sk', region: authState.region }),
    getProject: () => projectState
  }
}));

vi.mock('@alicloud/vpc20160428', () => ({
  default: class MockVpcClient {
    describeVpcs = vpcMocks.describeVpcs;
    describeVSwitches = vpcMocks.describeVSwitches;
    describeVSwitchAttributes = vpcMocks.describeVSwitchAttributes;
    describeZones = vpcMocks.describeZones;
    createVpc = vpcMocks.createVpc;
    createVSwitch = vpcMocks.createVSwitch;
  },
  DescribeVpcsRequest: RequestCtor,
  DescribeVSwitchesRequest: RequestCtor,
  DescribeVSwitchAttributesRequest: RequestCtor,
  DescribeZonesRequest: RequestCtor,
  CreateVpcRequest: RequestCtor,
  CreateVSwitchRequest: RequestCtor
}));

vi.mock('@alicloud/ecs20140526', () => ({
  default: class MockEcsClient {
    describeSecurityGroups = ecsMocks.describeSecurityGroups;
    createSecurityGroup = ecsMocks.createSecurityGroup;
  },
  DescribeSecurityGroupsRequest: RequestCtor,
  CreateSecurityGroupRequest: RequestCtor
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: RequestCtor
}));

vi.mock('../utils/sdk', () => ({ resolveSdkCtor: (ctor: unknown) => ctor }));
vi.mock('../utils/runtime', () => ({ sleep: vi.fn(async () => {}) }));

import { ensureDefaultNetwork } from '../providers/vpc';

function mockSecurityGroup() {
  ecsMocks.describeSecurityGroups.mockResolvedValue({
    body: { securityGroups: { securityGroup: [{ securityGroupId: 'sg-managed' }] } }
  });
}

describe('VPC binding region validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.region = 'cn-shanghai';
    projectState.network = undefined;
    mockSecurityGroup();
  });

  it('validates and backfills a legacy network binding in the effective region', async () => {
    projectState.network = { vpcId: 'vpc-old', vswId: 'vsw-old' };
    vpcMocks.describeVpcs.mockResolvedValue({
      body: { vpcs: { vpc: [{ vpcId: 'vpc-old', cidrBlock: '10.0.0.0/8' }] } }
    });
    vpcMocks.describeVSwitchAttributes.mockResolvedValue({
      body: { vpcId: 'vpc-old', zoneId: 'cn-shanghai-m' }
    });

    const result = await ensureDefaultNetwork();

    expect(result).toMatchObject({
      vpcId: 'vpc-old',
      vswId: 'vsw-old',
      zoneId: 'cn-shanghai-m',
      region: 'cn-shanghai'
    });
    expect(vpcMocks.createVpc).not.toHaveBeenCalled();
  });

  it('skips a network owned by another region and resolves a local managed network', async () => {
    projectState.network = { vpcId: 'vpc-old', vswId: 'vsw-old', region: 'cn-hangzhou' };
    vpcMocks.describeVpcs.mockResolvedValue({
      body: { vpcs: { vpc: [{ vpcId: 'vpc-managed', cidrBlock: '10.1.0.0/16' }] } }
    });
    vpcMocks.describeVSwitches.mockResolvedValue({
      body: {
        vSwitches: {
          vSwitch: [{
            vSwitchId: 'vsw-managed',
            zoneId: 'cn-shanghai-m',
            vSwitchName: 'licell-vsw-cn-shanghai-m',
            cidrBlock: '10.1.1.0/24',
            status: 'Available'
          }]
        },
        totalCount: 1
      }
    });

    const result = await ensureDefaultNetwork();

    expect(result).toMatchObject({
      vpcId: 'vpc-managed',
      vswId: 'vsw-managed',
      region: 'cn-shanghai'
    });
    expect(vpcMocks.describeVpcs.mock.calls.some(([request]) => request.vpcId === 'vpc-old')).toBe(false);
  });

  it('rebuilds a legacy binding only after confirming that it is stale', async () => {
    projectState.network = { vpcId: 'vpc-old', vswId: 'vsw-old' };
    vpcMocks.describeVpcs
      .mockResolvedValueOnce({ body: { vpcs: { vpc: [] } } })
      .mockResolvedValueOnce({
        body: { vpcs: { vpc: [{ vpcId: 'vpc-managed', cidrBlock: '10.2.0.0/16' }] } }
      });
    vpcMocks.describeVSwitches.mockResolvedValue({
      body: {
        vSwitches: {
          vSwitch: [{
            vSwitchId: 'vsw-managed',
            zoneId: 'cn-shanghai-m',
            vSwitchName: 'licell-vsw-cn-shanghai-m',
            cidrBlock: '10.2.1.0/24',
            status: 'Available'
          }]
        },
        totalCount: 1
      }
    });

    await expect(ensureDefaultNetwork()).resolves.toMatchObject({
      vpcId: 'vpc-managed',
      vswId: 'vsw-managed',
      region: 'cn-shanghai'
    });
    expect(vpcMocks.describeVpcs.mock.calls[0]?.[0]).toMatchObject({ vpcId: 'vpc-old' });
  });

  it('does not treat transient validation failures as a missing binding', async () => {
    projectState.network = { vpcId: 'vpc-old', vswId: 'vsw-old' };
    vpcMocks.describeVpcs.mockRejectedValue({ code: 'Throttling', message: 'too many requests' });

    await expect(ensureDefaultNetwork()).rejects.toMatchObject({ code: 'Throttling' });
    expect(vpcMocks.createVpc).not.toHaveBeenCalled();
  });
});
