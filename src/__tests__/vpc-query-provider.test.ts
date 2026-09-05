import { describe, expect, it, vi } from 'vitest';
import {
  getVpcInfo,
  inspectVpcTopology,
  listVpcNetworks,
  type VpcQueryClient
} from '../providers/vpc/query';

function createClient(overrides: Partial<VpcQueryClient> = {}): VpcQueryClient {
  return {
    describeVpcs: vi.fn(async () => ({ body: { totalCount: 0, vpcs: { vpc: [] } } })),
    describeVSwitches: vi.fn(async () => ({ body: { totalCount: 0, vSwitches: { vSwitch: [] } } })),
    describeRouteTables: vi.fn(async () => ({ body: { totalCount: 0, routeTables: { routeTable: [] } } })),
    describeNatGateways: vi.fn(async () => ({ body: { totalCount: 0, natGateways: { natGateway: [] } } })),
    describeEipAddresses: vi.fn(async () => ({ body: { totalCount: 0, eipAddresses: { eipAddress: [] } } })),
    ...overrides
  };
}

const auth = {
  accountId: 'account',
  ak: 'test-ak',
  sk: 'test-sk',
  region: 'cn-hangzhou'
};

describe('VPC readonly provider', () => {
  it('lists VPCs with explicit region, filters, limit, and stable summaries', async () => {
    const describeVpcs = vi.fn(async () => ({
      body: {
        totalCount: 2,
        vpcs: {
          vpc: [
            {
              vpcId: 'vpc-a',
              vpcName: 'prod',
              description: 'production network',
              regionId: 'cn-shanghai',
              status: 'Available',
              cidrBlock: '10.0.0.0/8',
              isDefault: false,
              vSwitchIds: { vSwitchId: ['vsw-a'] },
              routerTableIds: { routerTableIds: ['vtb-a'] }
            }
          ]
        }
      }
    }));
    const client = createClient({ describeVpcs });

    const result = await listVpcNetworks(
      { regionId: 'cn-shanghai', name: 'prod', limit: 1 },
      { auth, client }
    );

    expect(describeVpcs).toHaveBeenCalledWith(expect.objectContaining({
      regionId: 'cn-shanghai',
      vpcName: 'prod',
      pageNumber: 1,
      pageSize: 1
    }));
    expect(result).toMatchObject({
      regionId: 'cn-shanghai',
      filters: { name: 'prod' },
      totalCount: 2,
      count: 1,
      limit: 1,
      truncated: true,
      vpcs: [{ vpcId: 'vpc-a', vpcName: 'prod', description: 'production network', vSwitchIds: ['vsw-a'] }]
    });
  });

  it('continues pagination when TotalCount is omitted and a page is full', async () => {
    const describeVpcs = vi.fn(async (request: { pageNumber?: number }) => ({
      body: {
        vpcs: {
          vpc: request.pageNumber === 1
            ? Array.from({ length: 50 }, (_, index) => ({ vpcId: `vpc-${index}`, regionId: 'cn-hangzhou' }))
            : [{ vpcId: 'vpc-50', regionId: 'cn-hangzhou' }]
        }
      }
    }));

    const result = await listVpcNetworks({ limit: 200 }, { auth, client: createClient({ describeVpcs }) });

    expect(describeVpcs).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ totalCount: 51, count: 51, truncated: false });
  });

  it('resolves an exact VPC name and rejects ambiguous names', async () => {
    const exactClient = createClient({
      describeVpcs: vi.fn(async () => ({
        body: {
          totalCount: 1,
          vpcs: { vpc: [{ vpcId: 'vpc-a', vpcName: 'prod', regionId: 'cn-hangzhou' }] }
        }
      }))
    });

    await expect(getVpcInfo('prod', {}, { auth, client: exactClient })).resolves.toMatchObject({
      regionId: 'cn-hangzhou',
      vpcId: 'vpc-a',
      vpc: { vpcName: 'prod' }
    });

    const ambiguousClient = createClient({
      describeVpcs: vi.fn(async () => ({
        body: {
          totalCount: 2,
          vpcs: { vpc: [{ vpcId: 'vpc-a', vpcName: 'prod' }, { vpcId: 'vpc-b', vpcName: 'prod' }] }
        }
      }))
    });
    await expect(getVpcInfo('prod', {}, { auth, client: ambiguousClient })).rejects.toThrow(/多个|VPC ID/);
  });

  it('builds an agent-readable topology across switches, routes, NAT gateways, and EIPs', async () => {
    const client = createClient({
      describeVpcs: vi.fn(async () => ({
        body: {
          totalCount: 1,
          vpcs: {
            vpc: [{
              vpcId: 'vpc-a',
              vpcName: 'prod',
              regionId: 'cn-hangzhou',
              VRouterId: 'vrt-a',
              cidrBlock: '10.0.0.0/8'
            }]
          }
        }
      })),
      describeVSwitches: vi.fn(async () => ({
        body: {
          totalCount: 1,
          vSwitches: { vSwitch: [{ vSwitchId: 'vsw-a', vpcId: 'vpc-a', zoneId: 'cn-hangzhou-h', cidrBlock: '10.0.1.0/24' }] }
        }
      })),
      describeRouteTables: vi.fn(async () => ({
        body: {
          totalCount: 1,
          routeTables: { routeTable: [{ routeTableId: 'vtb-a', VRouterId: 'vrt-a', vSwitchIds: { vSwitchId: ['vsw-a'] } }] }
        }
      })),
      describeNatGateways: vi.fn(async () => ({
        body: {
          totalCount: 1,
          natGateways: { natGateway: [{ natGatewayId: 'ngw-a', vpcId: 'vpc-a', name: 'prod-nat', status: 'Available' }] }
        }
      })),
      describeEipAddresses: vi.fn(async () => ({
        body: {
          totalCount: 2,
          eipAddresses: {
            eipAddress: [
              { allocationId: 'eip-a', ipAddress: '47.1.1.1', vpcId: 'vpc-a', instanceId: 'ngw-a', instanceType: 'Nat' },
              { allocationId: 'eip-other', ipAddress: '47.2.2.2', vpcId: 'vpc-other' }
            ]
          }
        }
      }))
    });

    const result = await inspectVpcTopology('vpc-a', {}, { auth, client });

    expect(client.describeRouteTables).toHaveBeenCalledWith(expect.objectContaining({
      regionId: 'cn-hangzhou',
      VRouterId: 'vrt-a'
    }));
    expect(result.counts).toEqual({ vSwitches: 1, routeTables: 1, natGateways: 1, eipAddresses: 1 });
    expect(result.relationships).toEqual({
      vpcToVSwitches: ['vsw-a'],
      vpcToRouteTables: ['vtb-a'],
      vpcToNatGateways: ['ngw-a'],
      eipBindings: [{ allocationId: 'eip-a', instanceId: 'ngw-a', instanceType: 'Nat' }]
    });
    expect(result.eipAddresses).toHaveLength(1);
  });
});
