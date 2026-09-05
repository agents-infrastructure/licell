import Vpc, * as $Vpc from '@alicloud/vpc20160428';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config, type AuthConfig } from '../../utils/config';
import { resolveSdkCtor } from '../../utils/sdk';

const VpcClientCtor = resolveSdkCtor<Vpc>(Vpc, '@alicloud/vpc20160428');
const PAGE_SIZE = 50;
const MAX_PAGES = 1_000;

type Row = Record<string, any>;
type ApiResponse<T extends object> = Promise<{ body: T }>;

export interface VpcQueryClient {
  describeVpcs(request: $Vpc.DescribeVpcsRequest): ApiResponse<{
    totalCount?: number;
    vpcs?: { vpc?: Row[] };
  }>;
  describeVSwitches(request: $Vpc.DescribeVSwitchesRequest): ApiResponse<{
    totalCount?: number;
    vSwitches?: { vSwitch?: Row[] };
  }>;
  describeRouteTables(request: $Vpc.DescribeRouteTablesRequest): ApiResponse<{
    totalCount?: number;
    routeTables?: { routeTable?: Row[] };
  }>;
  describeNatGateways(request: $Vpc.DescribeNatGatewaysRequest): ApiResponse<{
    totalCount?: number;
    natGateways?: { natGateway?: Row[] };
  }>;
  describeEipAddresses(request: $Vpc.DescribeEipAddressesRequest): ApiResponse<{
    totalCount?: number;
    eipAddresses?: { eipAddress?: Row[] };
  }>;
}

export interface VpcListOptions {
  regionId?: string;
  name?: string;
  limit?: number;
}

export interface VpcLookupOptions {
  regionId?: string;
}

export interface VpcSummary {
  vpcId: string;
  vpcName?: string;
  description?: string;
  regionId: string;
  status?: string;
  cidrBlock?: string;
  secondaryCidrBlocks: string[];
  ipv6CidrBlock?: string;
  isDefault?: boolean;
  vRouterId?: string;
  vSwitchIds: string[];
  routeTableIds: string[];
  natGatewayIds: string[];
  resourceGroupId?: string;
  tags: Array<{ key: string; value?: string }>;
  createdAt?: string;
}

export interface VpcQueryDependencies {
  auth?: AuthConfig;
  client?: VpcQueryClient;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function nestedStrings(value: unknown, ...keys: string[]) {
  let current: unknown = value;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return [];
    current = (current as Record<string, unknown>)[key];
  }
  if (!Array.isArray(current)) return [];
  return current.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function tags(value: unknown) {
  if (!value || typeof value !== 'object') return [];
  const rows = (value as { tag?: unknown }).tag;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const record = row as Record<string, unknown>;
    const key = stringValue(record.key);
    if (!key) return [];
    return [{ key, value: stringValue(record.value) }];
  });
}

function summarizeVpc(row: Row, fallbackRegionId: string): VpcSummary | undefined {
  const vpcId = stringValue(row.vpcId);
  if (!vpcId) return undefined;
  return {
    vpcId,
    vpcName: stringValue(row.vpcName),
    description: stringValue(row.description),
    regionId: stringValue(row.regionId) || fallbackRegionId,
    status: stringValue(row.status),
    cidrBlock: stringValue(row.cidrBlock),
    secondaryCidrBlocks: nestedStrings(row.secondaryCidrBlocks, 'secondaryCidrBlock'),
    ipv6CidrBlock: stringValue(row.ipv6CidrBlock),
    isDefault: typeof row.isDefault === 'boolean' ? row.isDefault : undefined,
    vRouterId: stringValue(row.VRouterId),
    vSwitchIds: nestedStrings(row.vSwitchIds, 'vSwitchId'),
    routeTableIds: nestedStrings(row.routerTableIds, 'routerTableIds'),
    natGatewayIds: nestedStrings(row.natGatewayIds, 'natGatewayIds'),
    resourceGroupId: stringValue(row.resourceGroupId),
    tags: tags(row.tags),
    createdAt: stringValue(row.creationTime)
  };
}

function summarizeVSwitch(row: Row) {
  return {
    vSwitchId: stringValue(row.vSwitchId) || '',
    vSwitchName: stringValue(row.vSwitchName),
    vpcId: stringValue(row.vpcId),
    zoneId: stringValue(row.zoneId),
    status: stringValue(row.status),
    cidrBlock: stringValue(row.cidrBlock),
    ipv6CidrBlock: stringValue(row.ipv6CidrBlock),
    availableIpAddressCount: typeof row.availableIpAddressCount === 'number' ? row.availableIpAddressCount : undefined,
    routeTableId: stringValue(row.routeTable?.routeTableId),
    networkAclId: stringValue(row.networkAclId),
    isDefault: typeof row.isDefault === 'boolean' ? row.isDefault : undefined,
    tags: tags(row.tags)
  };
}

function summarizeRouteTable(row: Row) {
  return {
    routeTableId: stringValue(row.routeTableId) || '',
    vRouterId: stringValue(row.VRouterId),
    routeTableType: stringValue(row.routeTableType),
    status: stringValue(row.status),
    vSwitchIds: nestedStrings(row.vSwitchIds, 'vSwitchId'),
    routeEntryCount: Array.isArray(row.routeEntrys?.routeEntry) ? row.routeEntrys.routeEntry.length : 0,
    createdAt: stringValue(row.creationTime)
  };
}

function summarizeNatGateway(row: Row) {
  return {
    natGatewayId: stringValue(row.natGatewayId) || '',
    name: stringValue(row.name),
    vpcId: stringValue(row.vpcId),
    regionId: stringValue(row.regionId),
    status: stringValue(row.status),
    businessStatus: stringValue(row.businessStatus),
    natType: stringValue(row.natType),
    networkType: stringValue(row.networkType),
    chargeType: stringValue(row.instanceChargeType),
    snatTableIds: nestedStrings(row.snatTableIds, 'snatTableId'),
    forwardTableIds: nestedStrings(row.forwardTableIds, 'forwardTableId'),
    tags: tags(row.tags),
    createdAt: stringValue(row.creationTime)
  };
}

function summarizeEip(row: Row) {
  return {
    allocationId: stringValue(row.allocationId) || '',
    ipAddress: stringValue(row.ipAddress),
    name: stringValue(row.name),
    regionId: stringValue(row.regionId),
    status: stringValue(row.status),
    vpcId: stringValue(row.vpcId),
    instanceId: stringValue(row.instanceId),
    instanceType: stringValue(row.instanceType),
    bandwidth: stringValue(row.bandwidth),
    chargeType: stringValue(row.chargeType),
    internetChargeType: stringValue(row.internetChargeType),
    ISP: stringValue(row.ISP),
    tags: tags(row.tags),
    allocatedAt: stringValue(row.allocationTime)
  };
}

export function createVpcQueryClient(regionId: string, auth: AuthConfig = Config.requireAuth()): VpcQueryClient {
  return new VpcClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId,
    endpoint: `vpc.${regionId}.aliyuncs.com`
  }));
}

function resolveContext(regionId: string | undefined, dependencies: VpcQueryDependencies) {
  const auth = dependencies.auth || Config.requireAuth();
  const region = regionId?.trim() || auth.region;
  return {
    regionId: region,
    client: dependencies.client || createVpcQueryClient(region, auth)
  };
}

async function collectPages<T>(
  limit: number | undefined,
  fetchPage: (pageNumber: number, pageSize: number) => Promise<{ rows: T[]; totalCount?: number }>
) {
  const rows: T[] = [];
  let pageNumber = 1;
  let totalCount: number | undefined;
  while (pageNumber <= MAX_PAGES) {
    const remaining = limit === undefined ? PAGE_SIZE : Math.max(0, limit - rows.length);
    if (remaining === 0) break;
    const pageSize = Math.min(PAGE_SIZE, remaining);
    const page = await fetchPage(pageNumber, pageSize);
    rows.push(...page.rows.slice(0, pageSize));
    if (typeof page.totalCount === 'number') {
      totalCount = Math.max(totalCount || 0, page.totalCount);
    }
    if (page.rows.length < pageSize || (totalCount !== undefined && rows.length >= totalCount)) break;
    pageNumber += 1;
  }
  return { rows, totalCount: totalCount ?? rows.length };
}

async function fetchVpcs(
  input: { regionId: string; client: VpcQueryClient; name?: string; vpcId?: string; limit?: number }
) {
  return collectPages(input.limit, async (pageNumber, pageSize) => {
    const response = await input.client.describeVpcs(new $Vpc.DescribeVpcsRequest({
      regionId: input.regionId,
      vpcName: input.name,
      vpcId: input.vpcId,
      pageNumber,
      pageSize
    }));
    return {
      rows: response.body.vpcs?.vpc || [],
      totalCount: response.body.totalCount
    };
  });
}

export async function listVpcNetworks(options: VpcListOptions = {}, dependencies: VpcQueryDependencies = {}) {
  const { regionId, client } = resolveContext(options.regionId, dependencies);
  const limit = Math.max(1, Math.min(options.limit || 20, 200));
  const name = options.name?.trim() || undefined;
  const response = await fetchVpcs({ regionId, client, name, limit });
  const vpcs = response.rows
    .map((row) => summarizeVpc(row, regionId))
    .filter((row): row is VpcSummary => row !== undefined);
  return {
    regionId,
    filters: { ...(name ? { name } : {}) },
    totalCount: response.totalCount,
    count: vpcs.length,
    limit,
    truncated: response.totalCount > vpcs.length,
    vpcs
  };
}

export async function getVpcInfo(
  identifier: string,
  options: VpcLookupOptions = {},
  dependencies: VpcQueryDependencies = {}
) {
  const normalized = identifier.trim();
  if (!normalized) throw new Error('VPC ID 或名称不能为空');
  const { regionId, client } = resolveContext(options.regionId, dependencies);
  const byId = normalized.startsWith('vpc-');
  const response = await fetchVpcs({
    regionId,
    client,
    ...(byId ? { vpcId: normalized, limit: 1 } : { name: normalized, limit: 2 })
  });
  const matches = response.rows
    .map((row) => summarizeVpc(row, regionId))
    .filter((row): row is VpcSummary => row !== undefined)
    .filter((row) => byId ? row.vpcId === normalized : row.vpcName === normalized);
  if (matches.length === 0) throw new Error(`VPC 不存在或不可访问: ${normalized}`);
  if (matches.length > 1) throw new Error(`名称 ${normalized} 匹配到多个 VPC，请改用 VPC ID`);
  return { regionId, vpcId: matches[0]!.vpcId, vpc: matches[0]! };
}

export async function inspectVpcTopology(
  identifier: string,
  options: VpcLookupOptions = {},
  dependencies: VpcQueryDependencies = {}
) {
  const context = resolveContext(options.regionId, dependencies);
  const detail = await getVpcInfo(identifier, { regionId: context.regionId }, {
    auth: dependencies.auth,
    client: context.client
  });
  const { vpc } = detail;

  const [vSwitchPage, routePage, natPage, eipPage] = await Promise.all([
    collectPages<Row>(undefined, async (pageNumber, pageSize) => {
      const response = await context.client.describeVSwitches(new $Vpc.DescribeVSwitchesRequest({
        regionId: context.regionId,
        vpcId: vpc.vpcId,
        pageNumber,
        pageSize
      }));
      return { rows: response.body.vSwitches?.vSwitch || [], totalCount: response.body.totalCount };
    }),
    vpc.vRouterId
      ? collectPages<Row>(undefined, async (pageNumber, pageSize) => {
        const response = await context.client.describeRouteTables(new $Vpc.DescribeRouteTablesRequest({
          regionId: context.regionId,
          VRouterId: vpc.vRouterId,
          pageNumber,
          pageSize
        }));
        return { rows: response.body.routeTables?.routeTable || [], totalCount: response.body.totalCount };
      })
      : Promise.resolve({ rows: [] as Row[], totalCount: 0 }),
    collectPages<Row>(undefined, async (pageNumber, pageSize) => {
      const response = await context.client.describeNatGateways(new $Vpc.DescribeNatGatewaysRequest({
        regionId: context.regionId,
        vpcId: vpc.vpcId,
        pageNumber,
        pageSize
      }));
      return { rows: response.body.natGateways?.natGateway || [], totalCount: response.body.totalCount };
    }),
    collectPages<Row>(undefined, async (pageNumber, pageSize) => {
      const response = await context.client.describeEipAddresses(new $Vpc.DescribeEipAddressesRequest({
        regionId: context.regionId,
        pageNumber,
        pageSize
      }));
      return { rows: response.body.eipAddresses?.eipAddress || [], totalCount: response.body.totalCount };
    })
  ]);

  const vSwitches = vSwitchPage.rows.map(summarizeVSwitch).filter((row) => row.vSwitchId);
  const routeTables = routePage.rows.map(summarizeRouteTable).filter((row) => row.routeTableId);
  const natGateways = natPage.rows.map(summarizeNatGateway).filter((row) => row.natGatewayId);
  const natGatewayIds = new Set(natGateways.map((row) => row.natGatewayId));
  const eipAddresses = eipPage.rows
    .map(summarizeEip)
    .filter((row) => row.allocationId && (row.vpcId === vpc.vpcId || Boolean(row.instanceId && natGatewayIds.has(row.instanceId))));

  return {
    regionId: context.regionId,
    vpc,
    counts: {
      vSwitches: vSwitches.length,
      routeTables: routeTables.length,
      natGateways: natGateways.length,
      eipAddresses: eipAddresses.length
    },
    vSwitches,
    routeTables,
    natGateways,
    eipAddresses,
    relationships: {
      vpcToVSwitches: vSwitches.map((row) => row.vSwitchId),
      vpcToRouteTables: routeTables.map((row) => row.routeTableId),
      vpcToNatGateways: natGateways.map((row) => row.natGatewayId),
      eipBindings: eipAddresses.map((row) => ({
        allocationId: row.allocationId,
        instanceId: row.instanceId,
        instanceType: row.instanceType
      }))
    }
  };
}
