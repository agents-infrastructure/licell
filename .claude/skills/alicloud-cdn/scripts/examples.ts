/**
 * Alibaba Cloud CDN - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/cdn20180510';
import * as models from '@alicloud/cdn20180510/dist/models';
import { Config } from '@alicloud/openapi-core';

function createClient(): Client {
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    endpoint: 'cdn.aliyuncs.com',
  }));
}

// --- Domain Management ---

async function listDomains(client: Client) {
  let pageNumber = 1;
  const allDomains: any[] = [];
  while (true) {
    const { body } = await client.describeUserDomains(new models.DescribeUserDomainsRequest({
      pageSize: 50, pageNumber,
    }));
    allDomains.push(...(body.domains?.pageData || []));
    if (allDomains.length >= (body.totalCount || 0)) break;
    pageNumber++;
  }
  return allDomains;
}

async function addDomain(client: Client, domainName: string, cdnType: string, originDomain: string) {
  await client.addCdnDomain(new models.AddCdnDomainRequest({
    domainName, cdnType,
    sources: JSON.stringify([{ content: originDomain, type: 'domain', port: 443, priority: '20' }]),
  }));
}

async function deleteDomain(client: Client, domainName: string) {
  await client.deleteCdnDomain(new models.DeleteCdnDomainRequest({ domainName }));
}

async function getDomainDetail(client: Client, domainName: string) {
  const { body } = await client.describeCdnDomainDetail(
    new models.DescribeCdnDomainDetailRequest({ domainName })
  );
  return body.getDomainDetailModel;
}

// --- Domain Configuration ---

async function setDomainConfig(client: Client, domainNames: string, functions: any[]) {
  await client.batchSetCdnDomainConfig(new models.BatchSetCdnDomainConfigRequest({
    domainNames,
    functions: JSON.stringify(functions),
  }));
}

async function enableHttpsForce(client: Client, domainName: string) {
  await setDomainConfig(client, domainName, [
    { functionName: 'https_force', functionArgs: [{ argName: 'enable', argValue: 'on' }] },
  ]);
}

async function setCacheTtl(client: Client, domainName: string, fileTypes: string, ttlSeconds: string) {
  await setDomainConfig(client, domainName, [
    {
      functionName: 'filetype_based_ttl_set',
      functionArgs: [
        { argName: 'ttl', argValue: ttlSeconds },
        { argName: 'file_type', argValue: fileTypes },
        { argName: 'weight', argValue: '1' },
      ],
    },
  ]);
}

// --- SSL Certificate ---

async function enableSsl(client: Client, domainName: string, certName: string, certType: string = 'cas') {
  await client.setCdnDomainSSLCertificate(new models.SetCdnDomainSSLCertificateRequest({
    domainName, SSLProtocol: 'on', certName, certType,
  }));
}

// --- Cache Refresh & Prefetch ---

async function refreshUrls(client: Client, urls: string[]) {
  const { body } = await client.refreshObjectCaches(new models.RefreshObjectCachesRequest({
    objectPath: urls.join('\n'), objectType: 'File',
  }));
  return body.refreshTaskId;
}

async function refreshDirs(client: Client, dirs: string[]) {
  const { body } = await client.refreshObjectCaches(new models.RefreshObjectCachesRequest({
    objectPath: dirs.join('\n'), objectType: 'Directory',
  }));
  return body.refreshTaskId;
}

async function prefetchUrls(client: Client, urls: string[]) {
  const { body } = await client.pushObjectCache(new models.PushObjectCacheRequest({
    objectPath: urls.join('\n'),
  }));
  return body.pushTaskId;
}

async function getRefreshQuota(client: Client) {
  const { body } = await client.describeRefreshQuota(new models.DescribeRefreshQuotaRequest({}));
  return { urlRemain: body.urlRemain, dirRemain: body.dirRemain, preloadRemain: body.preloadRemain };
}

// --- Monitoring ---

async function getRealTimeQps(client: Client, domainName: string, startTime: string, endTime: string) {
  const { body } = await client.describeDomainRealTimeQpsData(
    new models.DescribeDomainRealTimeQpsDataRequest({ domainName, startTime, endTime })
  );
  return body.data?.qpsModel || [];
}

async function getRealTimeBps(client: Client, domainName: string, startTime: string, endTime: string) {
  const { body } = await client.describeDomainRealTimeBpsData(
    new models.DescribeDomainRealTimeBpsDataRequest({ domainName, startTime, endTime })
  );
  return body.data?.bpsModel || [];
}

async function getTopUrls(client: Client, domainName: string, startTime: string) {
  const { body } = await client.describeDomainTopUrlVisit(
    new models.DescribeDomainTopUrlVisitRequest({ domainName, startTime })
  );
  return body.url200List?.urlList || [];
}

// --- Log Management ---

async function getDomainLogs(client: Client, domainName: string, startTime: string, endTime: string) {
  const { body } = await client.describeCdnDomainLogs(new models.DescribeCdnDomainLogsRequest({
    domainName, startTime, endTime, pageSize: 100,
  }));
  return body.domainLogDetails?.domainLogDetail || [];
}

// --- IP Tools ---

async function checkIp(client: Client, ip: string) {
  const { body } = await client.describeIpInfo(new models.DescribeIpInfoRequest({ IP: ip }));
  return { isCdnIp: body.cdnIp, isp: body.ispName, region: body.regionName };
}

// --- Usage & Billing ---

async function getUsageData(client: Client, domainName: string, startTime: string, endTime: string, field: string = 'traf') {
  const { body } = await client.describeDomainUsageData(new models.DescribeDomainUsageDataRequest({
    domainName, startTime, endTime, field,
  }));
  return body.usageDataPerInterval?.dataModule || [];
}

// --- Tags ---

async function tagDomains(client: Client, resourceIds: string[], tags: Record<string, string>) {
  await client.tagResources(new models.TagResourcesRequest({
    resourceId: resourceIds, resourceType: 'DOMAIN',
    tag: Object.entries(tags).map(([key, value]) => ({ key, value })),
  }));
}

export {
  createClient, listDomains, addDomain, deleteDomain, getDomainDetail,
  setDomainConfig, enableHttpsForce, setCacheTtl, enableSsl,
  refreshUrls, refreshDirs, prefetchUrls, getRefreshQuota,
  getRealTimeQps, getRealTimeBps, getTopUrls,
  getDomainLogs, checkIp, getUsageData, tagDomains,
};
