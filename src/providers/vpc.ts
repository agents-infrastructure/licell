import Vpc, * as $Vpc from '@alicloud/vpc20160428';
import Ecs, * as $Ecs from '@alicloud/ecs20140526';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config } from '../utils/config';
import { sleep } from '../utils/runtime';
import { resolveSdkCtor } from '../utils/sdk';
import { isCidrConflictError } from '../utils/alicloud-error';

const VpcClientCtor = resolveSdkCtor<Vpc>(Vpc, '@alicloud/vpc20160428');
const EcsClientCtor = resolveSdkCtor<Ecs>(Ecs, '@alicloud/ecs20140526');
const DEFAULT_VPC_CIDR = '10.0.0.0/8';
const DEFAULT_VSW_NAME = 'licell-vsw';
const VSW_PAGE_SIZE = 50;

interface EnsureDefaultNetworkOptions {
  preferredZoneIds?: string[];
}

export interface ResolveProvidedNetworkOptions {
  vpcId: string;
  vswId: string;
  zoneId?: string;
}

interface VSwitchSummary {
  vSwitchId?: string;
  zoneId?: string;
  vSwitchName?: string;
  cidrBlock?: string;
  status?: string;
}

function normalizePreferredZones(zoneIds?: string[]) {
  const normalized: string[] = [];
  for (const zoneId of zoneIds || []) {
    if (typeof zoneId !== 'string') continue;
    const trimmed = zoneId.trim();
    if (!trimmed || normalized.includes(trimmed)) continue;
    normalized.push(trimmed);
  }
  return normalized;
}

function isManagedVSwitchName(vSwitchName?: string) {
  return vSwitchName === DEFAULT_VSW_NAME || (vSwitchName || '').startsWith(`${DEFAULT_VSW_NAME}-`);
}

function isUsableSwitch(vswitch: VSwitchSummary) {
  const status = (vswitch.status || '').toLowerCase();
  if (!status) return true;
  return status === 'available';
}

async function listAllVSwitches(client: Vpc, regionId: string, vpcId: string) {
  const all: VSwitchSummary[] = [];
  let pageNumber = 1;
  while (true) {
    const res = await client.describeVSwitches(new $Vpc.DescribeVSwitchesRequest({
      regionId,
      vpcId,
      pageNumber,
      pageSize: VSW_PAGE_SIZE
    }));
    const current = res.body.vSwitches?.vSwitch || [];
    if (current.length === 0) break;
    all.push(...current);
    const totalCount = res.body.totalCount || all.length;
    if (all.length >= totalCount) break;
    pageNumber += 1;
    if (pageNumber > 20) break;
  }
  return all;
}

function buildCidrCandidates(existingVSwitches: VSwitchSummary[]) {
  const used = new Set(
    existingVSwitches
      .map((item) => item.cidrBlock)
      .filter((item): item is string => typeof item === 'string' && item.length > 0)
  );
  const candidates: string[] = [];
  for (let octet = 1; octet < 255; octet += 1) candidates.push(`10.0.${octet}.0/24`);
  for (let octet = 0; octet < 255; octet += 1) candidates.push(`10.1.${octet}.0/24`);
  return candidates.filter((cidr) => !used.has(cidr));
}

function pickExistingSwitch(existingVSwitches: VSwitchSummary[], preferredZoneIds: string[]) {
  const usable = existingVSwitches.filter(isUsableSwitch);
  const pool = usable.length > 0 ? usable : existingVSwitches;

  if (preferredZoneIds.length > 0) {
    for (const zoneId of preferredZoneIds) {
      const managed = pool.find((item) => item.zoneId === zoneId && isManagedVSwitchName(item.vSwitchName));
      if (managed?.vSwitchId) return managed;
    }
    for (const zoneId of preferredZoneIds) {
      const first = pool.find((item) => item.zoneId === zoneId);
      if (first?.vSwitchId) return first;
    }
    return null;
  }

  const managed = pool.find((item) => isManagedVSwitchName(item.vSwitchName));
  if (managed?.vSwitchId) return managed;
  return pool.find((item) => typeof item.vSwitchId === 'string' && item.vSwitchId.length > 0) || null;
}

async function resolveZoneForNewSwitch(client: Vpc, regionId: string, preferredZoneIds: string[]) {
  if (preferredZoneIds.length > 0) return preferredZoneIds[0];
  const zones = await client.describeZones(new $Vpc.DescribeZonesRequest({ regionId }));
  return zones.body.zones?.zone?.[0]?.zoneId || '';
}

async function createSwitchInZone(
  client: Vpc,
  regionId: string,
  vpcId: string,
  zoneId: string,
  existingVSwitches: VSwitchSummary[]
) {
  const candidates = buildCidrCandidates(existingVSwitches);
  for (const cidrBlock of candidates) {
    try {
      const createVsw = await client.createVSwitch(new $Vpc.CreateVSwitchRequest({
        regionId,
        vpcId,
        zoneId,
        cidrBlock,
        vSwitchName: `${DEFAULT_VSW_NAME}-${zoneId}`
      }));
      if (!createVsw.body.vSwitchId) throw new Error('VSwitch 创建失败：未返回 vSwitchId');
      return createVsw.body.vSwitchId;
    } catch (err: unknown) {
      if (isCidrConflictError(err)) continue;
      throw err;
    }
  }
  throw new Error(`VSwitch 创建失败：在 ${zoneId} 未找到可用网段`);
}

async function ensureSecurityGroupForVpc(
  ecsClient: Ecs,
  regionId: string,
  vpcId: string
) {
  const named = await ecsClient.describeSecurityGroups(new $Ecs.DescribeSecurityGroupsRequest({
    regionId,
    vpcId,
    securityGroupName: 'licell-sg'
  }));
  const namedGroup = named.body?.securityGroups?.securityGroup?.[0];
  if (namedGroup?.securityGroupId) return namedGroup.securityGroupId;

  const existing = await ecsClient.describeSecurityGroups(new $Ecs.DescribeSecurityGroupsRequest({
    regionId,
    vpcId
  }));
  const existingGroup = existing.body?.securityGroups?.securityGroup?.[0];
  if (existingGroup?.securityGroupId) return existingGroup.securityGroupId;

  const createSg = await ecsClient.createSecurityGroup(new $Ecs.CreateSecurityGroupRequest({
    regionId,
    vpcId,
    securityGroupName: 'licell-sg',
    securityGroupType: 'normal'
  }));
  if (!createSg.body?.securityGroupId) throw new Error('安全组创建失败：未返回 SecurityGroupId');
  await sleep(2000);
  return createSg.body.securityGroupId;
}

export async function ensureDefaultNetwork(options?: EnsureDefaultNetworkOptions) {
  const auth = Config.requireAuth();
  const regionId = auth.region;
  const preferredZoneIds = normalizePreferredZones(options?.preferredZoneIds);
  const vpcConfig = new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId,
    endpoint: `vpc.${regionId}.aliyuncs.com`
  });
  const ecsConfig = new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId,
    endpoint: `ecs.${regionId}.aliyuncs.com`
  });
  const client = new VpcClientCtor(vpcConfig);
  const ecsClient = new EcsClientCtor(ecsConfig);

  const vpcName = 'licell-vpc';
  let vpcId = '', vswId = '', sgId = '', zoneId = '', cidrBlock = DEFAULT_VPC_CIDR;

  const vpcRes = await client.describeVpcs(new $Vpc.DescribeVpcsRequest({ regionId, vpcName }));
  const existingVpc = vpcRes.body.vpcs?.vpc?.[0];
  if (existingVpc?.vpcId) {
    vpcId = existingVpc.vpcId;
    cidrBlock = existingVpc.cidrBlock || DEFAULT_VPC_CIDR;
  } else {
    const createVpc = await client.createVpc(new $Vpc.CreateVpcRequest({ regionId, vpcName, cidrBlock: DEFAULT_VPC_CIDR }));
    if (!createVpc.body.vpcId) throw new Error('VPC 创建失败：未返回 vpcId');
    vpcId = createVpc.body.vpcId;
    cidrBlock = DEFAULT_VPC_CIDR;
    await sleep(5000);
  }

  const existingVSwitches = await listAllVSwitches(client, regionId, vpcId);
  const existingVsw = pickExistingSwitch(existingVSwitches, preferredZoneIds);
  if (existingVsw?.vSwitchId && existingVsw.zoneId) {
    vswId = existingVsw.vSwitchId;
    zoneId = existingVsw.zoneId;
  } else {
    zoneId = await resolveZoneForNewSwitch(client, regionId, preferredZoneIds);
    if (!zoneId) throw new Error(`Region ${regionId} 未查询到可用区，无法创建 vSwitch`);
    vswId = await createSwitchInZone(client, regionId, vpcId, zoneId, existingVSwitches);
    await sleep(3000);
  }

  sgId = await ensureSecurityGroupForVpc(ecsClient, regionId, vpcId);

  if (!zoneId) {
    const vswDetail = await client.describeVSwitchAttributes(new $Vpc.DescribeVSwitchAttributesRequest({
      regionId,
      vSwitchId: vswId
    }));
    zoneId = vswDetail.body?.zoneId || '';
  }

  if (!zoneId) throw new Error(`无法确定 vSwitch 所在可用区 (vswId=${vswId})`);
  return { vpcId, vswId, sgId, cidrBlock, zoneId };
}

export async function resolveProvidedNetwork(options: ResolveProvidedNetworkOptions) {
  const auth = Config.requireAuth();
  const regionId = auth.region;
  const vpcId = options.vpcId.trim();
  const vswId = options.vswId.trim();
  const expectedZoneId = options.zoneId?.trim();

  if (!vpcId || !vswId) throw new Error('解析网络信息失败：vpcId 和 vswId 不能为空');

  const vpcClient = new VpcClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId,
    endpoint: `vpc.${regionId}.aliyuncs.com`
  }));
  const ecsClient = new EcsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId,
    endpoint: `ecs.${regionId}.aliyuncs.com`
  }));

  const vpcRes = await vpcClient.describeVpcs(new $Vpc.DescribeVpcsRequest({ regionId, vpcId }));
  const vpc = (vpcRes.body?.vpcs?.vpc || []).find((item) => item.vpcId === vpcId);
  if (!vpc?.vpcId) throw new Error(`指定 VPC 不存在或不可访问: ${vpcId}`);

  const vswRes = await vpcClient.describeVSwitchAttributes(new $Vpc.DescribeVSwitchAttributesRequest({
    regionId,
    vSwitchId: vswId
  }));
  const vswVpcId = vswRes.body?.vpcId;
  if (typeof vswVpcId === 'string' && vswVpcId.length > 0 && vswVpcId !== vpcId) {
    throw new Error(`指定 --vsw (${vswId}) 不属于 --vpc (${vpcId})`);
  }

  const actualZoneId = vswRes.body?.zoneId || '';
  if (expectedZoneId && actualZoneId && expectedZoneId !== actualZoneId) {
    throw new Error(`指定 --zone (${expectedZoneId}) 与 --vsw 实际可用区 (${actualZoneId}) 不一致`);
  }
  const zoneId = actualZoneId || expectedZoneId || '';
  if (!zoneId) throw new Error(`无法确定 vSwitch 所在可用区 (vswId=${vswId})`);

  const sgId = await ensureSecurityGroupForVpc(ecsClient, regionId, vpcId);
  return {
    vpcId,
    vswId,
    sgId,
    cidrBlock: vpc.cidrBlock || DEFAULT_VPC_CIDR,
    zoneId
  };
}
