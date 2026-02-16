/**
 * Alibaba Cloud ECS - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/ecs20140526';
import * as models from '@alicloud/ecs20140526/dist/models';
import { Config } from '@alicloud/openapi-core';

function createClient(): Client {
  const region = process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou';
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    regionId: region,
    endpoint: `ecs.${region}.aliyuncs.com`,
  }));
}

const REGION = process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou';

// --- Instance Operations ---

async function listInstances(client: Client) {
  let pageNumber = 1;
  const allInstances: any[] = [];
  while (true) {
    const { body } = await client.describeInstances(new models.DescribeInstancesRequest({
      regionId: REGION, pageSize: 100, pageNumber,
    }));
    allInstances.push(...(body.instances?.instance || []));
    if (allInstances.length >= (body.totalCount || 0)) break;
    pageNumber++;
  }
  return allInstances;
}

async function createInstance(client: Client, opts: {
  imageId: string; instanceType: string; securityGroupId: string;
  vSwitchId: string; name?: string; keyPairName?: string;
}) {
  const { body } = await client.runInstances(new models.RunInstancesRequest({
    regionId: REGION,
    imageId: opts.imageId,
    instanceType: opts.instanceType,
    securityGroupId: opts.securityGroupId,
    vSwitchId: opts.vSwitchId,
    instanceName: opts.name || 'new-instance',
    internetMaxBandwidthOut: 5,
    systemDisk: { category: 'cloud_essd', size: '40' },
    keyPairName: opts.keyPairName,
    amount: 1,
  }));
  return body.instanceIdSets?.instanceIdSet || [];
}

async function stopInstance(client: Client, instanceId: string) {
  await client.stopInstance(new models.StopInstanceRequest({ instanceId }));
}

async function startInstance(client: Client, instanceId: string) {
  await client.startInstance(new models.StartInstanceRequest({ instanceId }));
}

async function deleteInstance(client: Client, instanceId: string) {
  await client.deleteInstance(new models.DeleteInstanceRequest({
    instanceId, force: true,
  }));
}

// --- Security Group Operations ---

async function createSecurityGroup(client: Client, vpcId: string, name: string) {
  const { body } = await client.createSecurityGroup(new models.CreateSecurityGroupRequest({
    regionId: REGION, vpcId, securityGroupName: name,
  }));
  return body.securityGroupId;
}

async function allowInbound(client: Client, sgId: string, port: string, cidr = '0.0.0.0/0') {
  await client.authorizeSecurityGroup(new models.AuthorizeSecurityGroupRequest({
    regionId: REGION, securityGroupId: sgId,
    ipProtocol: 'tcp', portRange: port, sourceCidrIp: cidr,
  }));
}

// --- Disk Operations ---

async function createDisk(client: Client, zoneId: string, sizeGB: number) {
  const { body } = await client.createDisk(new models.CreateDiskRequest({
    regionId: REGION, zoneId, diskCategory: 'cloud_essd', size: sizeGB,
  }));
  return body.diskId;
}

async function attachDisk(client: Client, instanceId: string, diskId: string) {
  await client.attachDisk(new models.AttachDiskRequest({ instanceId, diskId }));
}

async function createSnapshot(client: Client, diskId: string, name: string) {
  const { body } = await client.createSnapshot(new models.CreateSnapshotRequest({
    diskId, snapshotName: name,
  }));
  return body.snapshotId;
}

// --- Image Operations ---

async function createImage(client: Client, instanceId: string, name: string) {
  const { body } = await client.createImage(new models.CreateImageRequest({
    regionId: REGION, instanceId, imageName: name,
  }));
  return body.imageId;
}

async function listImages(client: Client, owner = 'self') {
  const { body } = await client.describeImages(new models.DescribeImagesRequest({
    regionId: REGION, imageOwnerAlias: owner, pageSize: 100,
  }));
  return body.images?.image || [];
}

// --- Key Pair Operations ---

async function createKeyPair(client: Client, name: string) {
  const { body } = await client.createKeyPair(new models.CreateKeyPairRequest({
    regionId: REGION, keyPairName: name,
  }));
  return { name: body.keyPairName, fingerprint: body.keyPairFingerPrint, privateKey: body.privateKeyBody };
}

// --- Cloud Assistant ---

async function runRemoteCommand(client: Client, instanceIds: string[], command: string) {
  const { body } = await client.runCommand(new models.RunCommandRequest({
    regionId: REGION,
    type: 'RunShellScript',
    commandContent: command,
    instanceId: instanceIds,
    timeout: 120,
  }));
  return body.invokeId;
}

async function getCommandResult(client: Client, invokeId: string) {
  const { body } = await client.describeInvocationResults(
    new models.DescribeInvocationResultsRequest({ regionId: REGION, invokeId })
  );
  return body.invocation?.invocationResults?.invocationResult || [];
}

// --- Tag Operations ---

async function tagInstances(client: Client, instanceIds: string[], tags: Record<string, string>) {
  await client.tagResources(new models.TagResourcesRequest({
    regionId: REGION,
    resourceType: 'instance',
    resourceId: instanceIds,
    tag: Object.entries(tags).map(([key, value]) => ({ key, value })),
  }));
}

// --- Region & Zone ---

async function listRegions(client: Client) {
  const { body } = await client.describeRegions(new models.DescribeRegionsRequest({}));
  return body.regions?.region || [];
}

async function listZones(client: Client) {
  const { body } = await client.describeZones(new models.DescribeZonesRequest({
    regionId: REGION,
  }));
  return body.zones?.zone || [];
}

export {
  createClient, listInstances, createInstance, stopInstance, startInstance, deleteInstance,
  createSecurityGroup, allowInbound, createDisk, attachDisk, createSnapshot,
  createImage, listImages, createKeyPair, runRemoteCommand, getCommandResult,
  tagInstances, listRegions, listZones,
};
