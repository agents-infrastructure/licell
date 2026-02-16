import Alidns, * as $Alidns from '@alicloud/alidns20150109';
import * as $FC from '@alicloud/fc20230330';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config } from '../utils/config';
import { parseRootAndSubdomain } from '../utils/domain';
import { isConflictError } from '../utils/errors';
import { createSharedFcClient, resolveSdkCtor } from '../utils/sdk';

const AlidnsClientCtor = resolveSdkCtor<Alidns>(Alidns, '@alicloud/alidns20150109');

export function normalizeDnsValue(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, '').replace(/\.$/, '');
}

export interface DnsRecordSummary {
  recordId: string;
  rr: string;
  type: string;
  value: string;
  ttl?: number;
  line?: string;
  status?: string;
}

export function buildSubDomainQueryCandidates(rootDomain: string, subDomain: string) {
  const normalizedRoot = rootDomain.trim().toLowerCase();
  const normalizedSub = subDomain.trim().toLowerCase();
  if (!normalizedRoot) return normalizedSub ? [normalizedSub] : [];
  const fullDomain = normalizedSub === '@' || !normalizedSub
    ? normalizedRoot
    : `${normalizedSub}.${normalizedRoot}`;
  const candidates = [fullDomain, normalizedSub];
  return [...new Set(candidates.filter((item) => item.length > 0))];
}

function createDnsClient() {
  const auth = Config.requireAuth();
  return new AlidnsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    endpoint: 'alidns.aliyuncs.com'
  }));
}

function createFcClient() {
  return createSharedFcClient().client;
}

function isNotFoundError(err: unknown) {
  const text = `${(err as { code?: unknown })?.code || ''} ${(err as { message?: unknown })?.message || ''}`.toLowerCase();
  return text.includes('notfound') || text.includes('no such') || text.includes('404');
}

function isInvalidDomainNameError(err: unknown) {
  const text = `${(err as { code?: unknown })?.code || ''} ${(err as { message?: unknown })?.message || ''}`.toLowerCase();
  return text.includes('invaliddomainname.format') || text.includes('invalid domain name');
}

interface DomainRecordLike {
  recordId?: string;
  RR?: string;
  type?: string;
  value?: string;
}

async function findCnameRecord(
  dnsClient: Alidns,
  rootDomain: string,
  subDomain: string
) {
  const allRecords: DomainRecordLike[] = [];
  const candidates = buildSubDomainQueryCandidates(rootDomain, subDomain);
  for (const candidate of candidates) {
    try {
      const response = await dnsClient.describeSubDomainRecords(new $Alidns.DescribeSubDomainRecordsRequest({
        domainName: rootDomain,
        subDomain: candidate,
        type: 'CNAME',
        pageNumber: 1,
        pageSize: 100
      }));
      allRecords.push(...((response.body?.domainRecords?.record || []) as DomainRecordLike[]));
    } catch (err: unknown) {
      if (isInvalidDomainNameError(err)) continue;
      throw err;
    }
  }
  return allRecords.find((record) => {
    const item = record as DomainRecordLike;
    return (item.RR || '@') === subDomain && (item.type || '').toUpperCase() === 'CNAME';
  }) as DomainRecordLike | undefined;
}

async function ensureCnameRecord(
  dnsClient: Alidns,
  domainName: string,
  rootDomain: string,
  subDomain: string,
  targetValue: string
) {
  const normalizedTarget = normalizeDnsValue(targetValue);
  let existing = await findCnameRecord(dnsClient, rootDomain, subDomain);

  if (!existing?.recordId) {
    try {
      await dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
        domainName: rootDomain,
        RR: subDomain,
        type: 'CNAME',
        value: normalizedTarget
      }));
      return;
    } catch (err: unknown) {
      if (!isConflictError(err)) throw err;
      existing = await findCnameRecord(dnsClient, rootDomain, subDomain);
    }
  }

  if (!existing?.recordId) {
    throw new Error(`DNS 记录已存在但无法定位可更新记录: ${domainName}`);
  }

  const normalizedExisting = normalizeDnsValue(existing.value || '');
  if (normalizedExisting === normalizedTarget) return;

  await dnsClient.updateDomainRecord(new $Alidns.UpdateDomainRecordRequest({
    recordId: existing.recordId,
    RR: subDomain,
    type: 'CNAME',
    value: normalizedTarget
  }));
}

export async function bindCustomDomain(
  domainName: string,
  targetFcDomain: string,
  aliasName?: string
) {
  const project = Config.getProject();
  if (!project.appName) throw new Error('未找到应用名，请先执行 ali deploy');
  const { rootDomain, subDomain } = parseRootAndSubdomain(domainName);

  const dnsClient = createDnsClient();
  await ensureCnameRecord(dnsClient, domainName, rootDomain, subDomain, targetFcDomain);

  const fcClient = createFcClient();
  const routeConfig = {
    routes: [{
      path: '/*',
      functionName: project.appName,
      qualifier: aliasName
    }]
  };
  const domainInput = new $FC.CreateCustomDomainInput({
    domainName,
    protocol: 'HTTP',
    routeConfig
  });
  try {
    await fcClient.createCustomDomain(new $FC.CreateCustomDomainRequest({
      body: domainInput
    }));
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    await fcClient.updateCustomDomain(domainName, new $FC.UpdateCustomDomainRequest({
      body: new $FC.UpdateCustomDomainInput({ routeConfig })
    }));
  }
  return `http://${domainName}`;
}

export async function unbindCustomDomain(domainName: string) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const { rootDomain, subDomain } = parseRootAndSubdomain(normalizedDomain);
  const dnsClient = createDnsClient();
  const fcClient = createFcClient();

  try {
    await fcClient.deleteCustomDomain(normalizedDomain);
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
  }

  const deleted = new Set<string>();
  const candidates = buildSubDomainQueryCandidates(rootDomain, subDomain);
  for (const candidate of candidates) {
    let records: DomainRecordLike[] = [];
    try {
      const recordsRes = await dnsClient.describeSubDomainRecords(new $Alidns.DescribeSubDomainRecordsRequest({
        domainName: rootDomain,
        subDomain: candidate,
        type: 'CNAME',
        pageNumber: 1,
        pageSize: 200
      }));
      records = (recordsRes.body?.domainRecords?.record || []) as DomainRecordLike[];
    } catch (err: unknown) {
      if (isInvalidDomainNameError(err)) continue;
      throw err;
    }
    for (const record of records) {
      const item = record as DomainRecordLike;
      if ((item.RR || '@') !== subDomain || (item.type || '').toUpperCase() !== 'CNAME') continue;
      const recordId = item.recordId;
      if (!recordId || deleted.has(recordId)) continue;
      deleted.add(recordId);
      try {
        await dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId }));
      } catch (err: unknown) {
        if (!isNotFoundError(err)) throw err;
      }
    }
  }
}

export async function listDnsRecords(domainName: string, limit = 200): Promise<DnsRecordSummary[]> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const dnsClient = createDnsClient();
  const results: DnsRecordSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  const pageSize = Math.min(100, safeLimit);

  for (let pageNumber = 1; pageNumber <= 20 && results.length < safeLimit; pageNumber += 1) {
    const response = await dnsClient.describeDomainRecords(new $Alidns.DescribeDomainRecordsRequest({
      domainName: normalizedDomain,
      pageNumber,
      pageSize
    }));
    const rows = response.body?.domainRecords?.record || [];
    for (const row of rows) {
      const recordId = row.recordId;
      if (!recordId) continue;
      results.push({
        recordId,
        rr: row.RR || '@',
        type: row.type || '',
        value: row.value || '',
        ttl: row.TTL,
        line: row.line,
        status: row.status
      });
      if (results.length >= safeLimit) break;
    }
    const total = response.body?.totalCount || 0;
    if (rows.length === 0 || (total > 0 && results.length >= total)) break;
  }

  return results;
}

export interface AddDnsRecordOptions {
  rr: string;
  type: string;
  value: string;
  ttl?: number;
  line?: string;
}

export async function addDnsRecord(domainName: string, options: AddDnsRecordOptions) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const rr = options.rr.trim();
  const type = options.type.trim().toUpperCase();
  const value = options.value.trim();
  if (!rr) throw new Error('RR 不能为空');
  if (!type) throw new Error('记录类型不能为空');
  if (!value) throw new Error('记录值不能为空');

  const dnsClient = createDnsClient();
  const response = await dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
    domainName: normalizedDomain,
    RR: rr,
    type,
    value,
    TTL: options.ttl,
    line: options.line || 'default'
  }));
  const recordId = response.body?.recordId;
  if (!recordId) throw new Error('添加 DNS 记录失败：未返回 recordId');
  return recordId;
}

export async function removeDnsRecord(recordId: string) {
  const normalized = recordId.trim();
  if (!normalized) throw new Error('recordId 不能为空');
  const dnsClient = createDnsClient();
  await dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId: normalized }));
}
