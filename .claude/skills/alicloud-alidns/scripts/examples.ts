/**
 * Alibaba Cloud Alidns - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/alidns20150109';
import * as models from '@alicloud/alidns20150109/dist/models';
import { Config } from '@alicloud/openapi-core';

function createClient(): Client {
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    endpoint: 'alidns.cn-hangzhou.aliyuncs.com',
  }));
}

// --- Domain Operations ---

async function listDomains(client: Client) {
  let pageNumber = 1;
  const allDomains: any[] = [];
  while (true) {
    const { body } = await client.describeDomains(new models.DescribeDomainsRequest({
      pageSize: 100, pageNumber,
    }));
    allDomains.push(...(body.domains?.domain || []));
    if (allDomains.length >= (body.totalCount || 0)) break;
    pageNumber++;
  }
  return allDomains;
}

async function addDomain(client: Client, domainName: string) {
  const { body } = await client.addDomain(new models.AddDomainRequest({ domainName }));
  return body;
}

async function deleteDomain(client: Client, domainName: string) {
  await client.deleteDomain(new models.DeleteDomainRequest({ domainName }));
}

async function getDomainInfo(client: Client, domainName: string) {
  const { body } = await client.describeDomainInfo(
    new models.DescribeDomainInfoRequest({ domainName })
  );
  return body;
}

// --- Record Operations ---

async function listRecords(client: Client, domainName: string) {
  let pageNumber = 1;
  const allRecords: any[] = [];
  while (true) {
    const { body } = await client.describeDomainRecords(new models.DescribeDomainRecordsRequest({
      domainName, pageSize: 500, pageNumber,
    }));
    allRecords.push(...(body.domainRecords?.record || []));
    if (allRecords.length >= (body.totalCount || 0)) break;
    pageNumber++;
  }
  return allRecords;
}

async function addRecord(client: Client, opts: {
  domainName: string; rr: string; type: string; value: string;
  ttl?: number; priority?: number; line?: string;
}) {
  const { body } = await client.addDomainRecord(new models.AddDomainRecordRequest({
    domainName: opts.domainName,
    RR: opts.rr,
    type: opts.type,
    value: opts.value,
    TTL: opts.ttl || 600,
    priority: opts.priority,
    line: opts.line || 'default',
  }));
  return body.recordId;
}

async function updateRecord(client: Client, opts: {
  recordId: string; rr: string; type: string; value: string; ttl?: number;
}) {
  await client.updateDomainRecord(new models.UpdateDomainRecordRequest({
    recordId: opts.recordId,
    RR: opts.rr,
    type: opts.type,
    value: opts.value,
    TTL: opts.ttl || 600,
  }));
}

async function deleteRecord(client: Client, recordId: string) {
  await client.deleteDomainRecord(new models.DeleteDomainRecordRequest({ recordId }));
}

async function setRecordStatus(client: Client, recordId: string, status: 'Enable' | 'Disable') {
  await client.setDomainRecordStatus(new models.SetDomainRecordStatusRequest({
    recordId, status,
  }));
}

// --- DNSSLB Operations ---

async function enableDNSSLB(client: Client, domainName: string, subDomain: string) {
  await client.setDNSSLBStatus(new models.SetDNSSLBStatusRequest({
    domainName, subDomain, open: true,
  }));
}

async function setDNSSLBWeight(client: Client, recordId: string, weight: number) {
  await client.updateDNSSLBWeight(new models.UpdateDNSSLBWeightRequest({
    recordId, weight,
  }));
}

// --- Domain Group Operations ---

async function createDomainGroup(client: Client, groupName: string) {
  const { body } = await client.addDomainGroup(new models.AddDomainGroupRequest({ groupName }));
  return body.groupId;
}

async function moveDomainToGroup(client: Client, domainName: string, groupId: string) {
  await client.changeDomainGroup(new models.ChangeDomainGroupRequest({
    domainName, groupId,
  }));
}

// --- DNSSEC Operations ---

async function enableDNSSEC(client: Client, domainName: string) {
  await client.setDomainDnssecStatus(new models.SetDomainDnssecStatusRequest({
    domainName, status: 'ON',
  }));
}

async function getDNSSECInfo(client: Client, domainName: string) {
  const { body } = await client.describeDomainDnssecInfo(
    new models.DescribeDomainDnssecInfoRequest({ domainName })
  );
  return body;
}

// --- Statistics ---

async function getDomainStats(client: Client, domainName: string, startDate: string, endDate: string) {
  const { body } = await client.describeDomainStatistics(
    new models.DescribeDomainStatisticsRequest({ domainName, startDate, endDate })
  );
  return body.statistics?.statistic || [];
}

// --- Tag Operations ---

async function tagDomains(client: Client, domainNames: string[], tags: Record<string, string>) {
  await client.tagResources(new models.TagResourcesRequest({
    resourceType: 'DOMAIN',
    resourceId: domainNames,
    tag: Object.entries(tags).map(([key, value]) => ({ key, value })),
  }));
}

export {
  createClient, listDomains, addDomain, deleteDomain, getDomainInfo,
  listRecords, addRecord, updateRecord, deleteRecord, setRecordStatus,
  enableDNSSLB, setDNSSLBWeight,
  createDomainGroup, moveDomainToGroup,
  enableDNSSEC, getDNSSECInfo,
  getDomainStats, tagDomains,
};
