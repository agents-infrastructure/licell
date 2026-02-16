/**
 * Alibaba Cloud VPC - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/vpc20160428';
import * as models from '@alicloud/vpc20160428/dist/models';
import { Config } from '@alicloud/openapi-core';

function createClient(regionId: string = 'cn-hangzhou'): Client {
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    endpoint: 'vpc.aliyuncs.com',
    regionId,
  }));
}

// --- VPC Operations ---

async function listVpcs(client: Client, regionId: string) {
  let pageNumber = 1;
  const allVpcs: any[] = [];
  while (true) {
    const { body } = await client.describeVpcs(new models.DescribeVpcsRequest({
      regionId, pageSize: 50, pageNumber,
    }));
    allVpcs.push(...(body.vpcs?.vpc || []));
    if (allVpcs.length >= (body.totalCount || 0)) break;
    pageNumber++;
  }
  return allVpcs;
}

async function createVpc(client: Client, regionId: string, cidrBlock: string, name: string) {
  const { body } = await client.createVpc(new models.CreateVpcRequest({
    regionId, cidrBlock, vpcName: name,
  }));
  return body.vpcId;
}

async function deleteVpc(client: Client, regionId: string, vpcId: string) {
  await client.deleteVpc(new models.DeleteVpcRequest({ regionId, vpcId }));
}

// --- VSwitch Operations ---

async function createVSwitch(client: Client, opts: {
  vpcId: string; zoneId: string; cidrBlock: string; name: string;
}) {
  const { body } = await client.createVSwitch(new models.CreateVSwitchRequest({
    vpcId: opts.vpcId, zoneId: opts.zoneId, cidrBlock: opts.cidrBlock, vSwitchName: opts.name,
  }));
  return body.vSwitchId;
}

async function listVSwitches(client: Client, regionId: string, vpcId: string) {
  const { body } = await client.describeVSwitches(new models.DescribeVSwitchesRequest({
    regionId, vpcId, pageSize: 50,
  }));
  return body.vSwitches?.vSwitch || [];
}

// --- Route Table Operations ---

async function addRouteEntry(client: Client, routeTableId: string, destCidr: string, nextHopType: string, nextHopId: string) {
  await client.createRouteEntry(new models.CreateRouteEntryRequest({
    routeTableId, destinationCidrBlock: destCidr, nextHopType, nextHopId,
  }));
}

async function listRouteEntries(client: Client, routeTableId: string) {
  const { body } = await client.describeRouteEntryList(new models.DescribeRouteEntryListRequest({
    regionId: 'cn-hangzhou', routeTableId, maxResult: 100,
  }));
  return body.routeEntrys?.routeEntry || [];
}

// --- EIP Operations ---

async function allocateEip(client: Client, regionId: string, bandwidth: string = '5') {
  const { body } = await client.allocateEipAddress(new models.AllocateEipAddressRequest({
    regionId, bandwidth, internetChargeType: 'PayByTraffic',
  }));
  return { allocationId: body.allocationId, eipAddress: body.eipAddress };
}

async function bindEip(client: Client, regionId: string, allocationId: string, instanceId: string, instanceType: string) {
  await client.associateEipAddress(new models.AssociateEipAddressRequest({
    regionId, allocationId, instanceId, instanceType,
  }));
}

async function unbindEip(client: Client, regionId: string, allocationId: string, instanceId: string) {
  await client.unassociateEipAddress(new models.UnassociateEipAddressRequest({
    regionId, allocationId, instanceId,
  }));
}

async function releaseEip(client: Client, regionId: string, allocationId: string) {
  await client.releaseEipAddress(new models.ReleaseEipAddressRequest({
    regionId, allocationId,
  }));
}

// --- NAT Gateway Operations ---

async function createNatGw(client: Client, regionId: string, vpcId: string, vSwitchId: string, name: string) {
  const { body } = await client.createNatGateway(new models.CreateNatGatewayRequest({
    regionId, vpcId, vSwitchId, natGatewayName: name, natType: 'Enhanced',
  }));
  return body.natGatewayId;
}

async function addSnatRule(client: Client, regionId: string, snatTableId: string, sourceCIDR: string, snatIp: string) {
  const { body } = await client.createSnatEntry(new models.CreateSnatEntryRequest({
    regionId, snatTableId, sourceCIDR, snatIp,
  }));
  return body.snatEntryId;
}

async function addDnatRule(client: Client, regionId: string, forwardTableId: string, externalIp: string, externalPort: string, internalIp: string, internalPort: string, ipProtocol: string) {
  const { body } = await client.createForwardEntry(new models.CreateForwardEntryRequest({
    regionId, forwardTableId, externalIp, externalPort, internalIp, internalPort, ipProtocol,
  }));
  return body.forwardEntryId;
}

// --- Network ACL Operations ---

async function createAcl(client: Client, regionId: string, vpcId: string, name: string) {
  const { body } = await client.createNetworkAcl(new models.CreateNetworkAclRequest({
    regionId, vpcId, networkAclName: name,
  }));
  return body.networkAclId;
}

// --- Flow Log Operations ---

async function createAndActivateFlowLog(client: Client, regionId: string, vpcId: string, project: string, logStore: string) {
  const { body } = await client.createFlowLog(new models.CreateFlowLogRequest({
    regionId, resourceType: 'VPC', resourceId: vpcId, trafficType: 'All',
    projectName: project, logStoreName: logStore,
  }));
  await client.activeFlowLog(new models.ActiveFlowLogRequest({
    regionId, flowLogId: body.flowLogId!,
  }));
  return body.flowLogId;
}

// --- Tag Operations ---

async function tagResources(client: Client, regionId: string, resourceType: string, resourceIds: string[], tags: Record<string, string>) {
  await client.tagResources(new models.TagResourcesRequest({
    regionId, resourceType, resourceId: resourceIds,
    tag: Object.entries(tags).map(([key, value]) => ({ key, value })),
  }));
}

export {
  createClient, listVpcs, createVpc, deleteVpc,
  createVSwitch, listVSwitches,
  addRouteEntry, listRouteEntries,
  allocateEip, bindEip, unbindEip, releaseEip,
  createNatGw, addSnatRule, addDnatRule,
  createAcl, createAndActivateFlowLog, tagResources,
};
