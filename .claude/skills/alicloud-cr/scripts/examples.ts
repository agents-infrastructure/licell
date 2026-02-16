/**
 * Alibaba Cloud Container Registry - Common Operation Examples
 *
 * This file demonstrates typical workflows using the CR SDK.
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/cr20181201';
import { Config } from '@alicloud/openapi-core';

function createClient(): Client {
  const config = new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    regionId: process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou',
    endpoint: `cr.${process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou'}.aliyuncs.com`,
  });
  return new Client(config);
}

// --- Instance Operations ---

async function listInstances(client: Client) {
  const { body } = await client.listInstance({ pageNo: 1, pageSize: 30 });
  return body.instances;
}

async function getInstanceUsage(client: Client, instanceId: string) {
  const { body } = await client.getInstanceUsage({ instanceId });
  return body;
}

// --- Namespace Operations ---

async function createNamespace(client: Client, instanceId: string, namespaceName: string) {
  const { body } = await client.createNamespace({
    instanceId,
    namespaceName,
    autoCreateRepo: true,
    defaultRepoType: 'PRIVATE',
  });
  return body;
}

async function listNamespaces(client: Client, instanceId: string) {
  const { body } = await client.listNamespace({
    instanceId,
    pageNo: 1,
    pageSize: 100,
  });
  return body.namespaces;
}

// --- Repository Operations ---

async function createRepository(
  client: Client,
  instanceId: string,
  namespaceName: string,
  repoName: string
) {
  const { body } = await client.createRepository({
    instanceId,
    repoNamespaceName: namespaceName,
    repoName,
    repoType: 'PRIVATE',
    summary: `Repository ${repoName}`,
  });
  return body;
}

async function listRepositories(client: Client, instanceId: string) {
  const { body } = await client.listRepository({
    instanceId,
    pageNo: 1,
    pageSize: 100,
  });
  return body.repositories;
}

// --- Image Tag Operations ---

async function listImageTags(client: Client, instanceId: string, repoId: string) {
  const { body } = await client.listRepoTag({
    instanceId,
    repoId,
    pageNo: 1,
    pageSize: 100,
  });
  return body.images;
}

async function deleteImageTag(client: Client, instanceId: string, repoId: string, tag: string) {
  const { body } = await client.deleteRepoTag({
    instanceId,
    repoId,
    tag,
  });
  return body;
}

// --- Security Scanning ---

async function triggerScan(client: Client, instanceId: string, repoId: string, tag: string) {
  const { body } = await client.createRepoTagScanTask({
    instanceId,
    repoId,
    tag,
    scanType: 'DEFAULT',
  });
  return body;
}

async function getScanResults(
  client: Client,
  instanceId: string,
  repoId: string,
  tag: string
) {
  const { body } = await client.listRepoTagScanResult({
    instanceId,
    repoId,
    tag,
    pageNo: 1,
    pageSize: 100,
  });
  return body.vulnerabilities;
}

// --- Image Sync ---

async function createSyncRule(
  client: Client,
  instanceId: string,
  namespaceName: string,
  targetInstanceId: string,
  targetRegionId: string,
  targetNamespaceName: string
) {
  const { body } = await client.createRepoSyncRule({
    instanceId,
    namespaceName,
    targetInstanceId,
    targetRegionId,
    targetNamespaceName,
    syncTrigger: 'PASSIVE',
    syncScope: 'NAMESPACE',
    tagFilter: '.*',
  });
  return body;
}

// --- Build Operations ---

async function createBuildRule(
  client: Client,
  instanceId: string,
  repoId: string,
  dockerfileLocation: string,
  dockerfileName: string
) {
  const { body } = await client.createRepoBuildRule({
    instanceId,
    repoId,
    pushType: 'GIT_TAG',
    pushName: 'release-*',
    dockerfileLocation,
    dockerfileName,
    imageTag: 'release-${tag}',
  });
  return body;
}

// --- Helm Chart Operations ---

async function listChartRepos(client: Client, instanceId: string) {
  const { body } = await client.listChartRepository({
    instanceId,
    pageNo: 1,
    pageSize: 100,
  });
  return body.repositories;
}

export {
  createClient,
  listInstances,
  getInstanceUsage,
  createNamespace,
  listNamespaces,
  createRepository,
  listRepositories,
  listImageTags,
  deleteImageTag,
  triggerScan,
  getScanResults,
  createSyncRule,
  createBuildRule,
  listChartRepos,
};
