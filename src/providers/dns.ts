import Alidns, * as $Alidns from '@alicloud/alidns20150109';
import * as $OpenApi from '@alicloud/openapi-client';
import { Resolver, resolve4 as resolveIpv4, resolve6 as resolveIpv6, resolveCname as resolveDnsCname, resolveNs } from 'dns/promises';
import { Config } from '../utils/config';
import { parseRootAndSubdomain } from '../utils/domain';
import { isConflictError, isInvalidDomainNameError, isNotFoundError } from '../utils/alicloud-error';
import { withRetry } from '../utils/retry';
import { resolveSdkCtor } from '../utils/sdk';
import { sleep } from '../utils/runtime';

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

export interface AddDnsRecordOptions {
  rr: string;
  type: string;
  value: string;
  ttl?: number;
  line?: string;
}

export interface WildcardCnameResult {
  created: boolean;
  skipped: boolean;
  wildcardDomain: string;
  targetValue: string;
}

export interface AuthoritativeDnsSnapshot {
  domainName: string;
  nameServerHosts: string[];
  nameServerIps: string[];
  cname: string[];
  addresses: string[];
}

export interface WaitForAuthoritativeCnameOptions {
  maxAttempts?: number;
  intervalMs?: number;
}

interface DomainRecordLike {
  recordId?: string;
  RR?: string;
  type?: string;
  value?: string;
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

async function findAuthoritativeNameServerHosts(domainName: string) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) return [];

  const labels = normalizedDomain.split('.').filter((item) => item.length > 0);
  for (let index = 0; index < labels.length - 1; index += 1) {
    const candidate = labels.slice(index).join('.');
    try {
      const hosts = await resolveNs(candidate);
      const normalizedHosts = [...new Set(hosts.map((item) => normalizeDnsValue(item)).filter((item) => item.length > 0))];
      if (normalizedHosts.length > 0) return normalizedHosts;
    } catch {
      // continue walking up labels until a delegated zone responds with NS records
    }
  }

  return [];
}

async function resolveNameServerIps(hosts: string[]) {
  const addresses: string[] = [];

  for (const host of hosts) {
    try {
      addresses.push(...await resolveIpv4(host));
    } catch {
      // ignore v4 miss and continue with AAAA lookup
    }
    try {
      addresses.push(...await resolveIpv6(host));
    } catch {
      // ignore when AAAA is unavailable
    }
  }

  return [...new Set(addresses.filter((item) => item.trim().length > 0))];
}

export async function resolveAuthoritativeDnsSnapshot(domainName: string): Promise<AuthoritativeDnsSnapshot> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) {
    return {
      domainName: normalizedDomain,
      nameServerHosts: [],
      nameServerIps: [],
      cname: [],
      addresses: []
    };
  }

  const nameServerHosts = await findAuthoritativeNameServerHosts(normalizedDomain);
  const nameServerIps = await resolveNameServerIps(nameServerHosts);
  const resolver = nameServerIps.length > 0 ? new Resolver() : null;
  if (resolver && nameServerIps.length > 0) {
    resolver.setServers(nameServerIps);
  }

  const addresses: string[] = [];
  const cname: string[] = [];
  const collect = async (task: () => Promise<string[]>, sink: string[], normalize = false) => {
    try {
      const values = await task();
      sink.push(...values.map((item) => normalize ? normalizeDnsValue(item) : item).filter((item) => item.trim().length > 0));
    } catch {
      // ignore missing record types and keep collecting the rest
    }
  };

  await collect(() => resolver ? resolver.resolve4(normalizedDomain) : resolveIpv4(normalizedDomain), addresses);
  await collect(() => resolver ? resolver.resolve6(normalizedDomain) : resolveIpv6(normalizedDomain), addresses);
  await collect(() => resolver ? resolver.resolveCname(normalizedDomain) : resolveDnsCname(normalizedDomain), cname, true);

  return {
    domainName: normalizedDomain,
    nameServerHosts,
    nameServerIps,
    cname: [...new Set(cname)],
    addresses: [...new Set(addresses)]
  };
}

export async function waitForAuthoritativeCnameTarget(
  domainName: string,
  targetValue: string,
  options: WaitForAuthoritativeCnameOptions = {}
) {
  const normalizedDomain = domainName.trim().toLowerCase();
  const normalizedTarget = normalizeDnsValue(targetValue);
  if (!normalizedDomain) throw new Error('域名不能为空');
  if (!normalizedTarget) throw new Error('目标 CNAME 不能为空');

  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 36));
  const intervalMs = Math.max(0, Math.floor(options.intervalMs ?? 5_000));
  let lastSnapshot: AuthoritativeDnsSnapshot | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const snapshot = await resolveAuthoritativeDnsSnapshot(normalizedDomain);
    lastSnapshot = snapshot;
    if (snapshot.cname.includes(normalizedTarget)) {
      return snapshot;
    }
    if (attempt < maxAttempts && intervalMs > 0) {
      await sleep(intervalMs);
    }
  }

  const observed = lastSnapshot
    ? [...lastSnapshot.cname, ...lastSnapshot.addresses].join(', ') || '∅'
    : '∅';
  throw new Error(`权威 DNS 未收敛到预期 CNAME: ${normalizedDomain} -> ${normalizedTarget}（当前: ${observed}）`);
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
      const response = await withRetry(() => dnsClient.describeSubDomainRecords(new $Alidns.DescribeSubDomainRecordsRequest({
        domainName: rootDomain,
        subDomain: candidate,
        type: 'CNAME',
        pageNumber: 1,
        pageSize: 100
      })));
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

async function listExactCnameRecords(
  dnsClient: Alidns,
  rootDomain: string,
  subDomain: string
) {
  const deleted = new Set<string>();
  const results: DomainRecordLike[] = [];
  const candidates = buildSubDomainQueryCandidates(rootDomain, subDomain);

  for (const candidate of candidates) {
    let records: DomainRecordLike[] = [];
    try {
      const response = await withRetry(() => dnsClient.describeSubDomainRecords(new $Alidns.DescribeSubDomainRecordsRequest({
        domainName: rootDomain,
        subDomain: candidate,
        type: 'CNAME',
        pageNumber: 1,
        pageSize: 200
      })));
      records = (response.body?.domainRecords?.record || []) as DomainRecordLike[];
    } catch (err: unknown) {
      if (isInvalidDomainNameError(err)) continue;
      throw err;
    }

    for (const record of records) {
      const item = record as DomainRecordLike;
      const recordId = item.recordId;
      if ((item.RR || '@') !== subDomain || (item.type || '').toUpperCase() !== 'CNAME' || !recordId || deleted.has(recordId)) {
        continue;
      }
      deleted.add(recordId);
      results.push(item);
    }
  }

  return results;
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
      await withRetry(() => dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
        domainName: rootDomain,
        RR: subDomain,
        type: 'CNAME',
        value: normalizedTarget
      })));
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

  await withRetry(() => dnsClient.updateDomainRecord(new $Alidns.UpdateDomainRecordRequest({
    recordId: existing.recordId,
    RR: subDomain,
    type: 'CNAME',
    value: normalizedTarget
  })));
}

export async function ensureDomainCname(domainName: string, targetValue: string) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const { rootDomain, subDomain } = parseRootAndSubdomain(normalizedDomain);
  const dnsClient = createDnsClient();
  await ensureCnameRecord(dnsClient, normalizedDomain, rootDomain, subDomain, targetValue);
}

export async function removeDomainCname(domainName: string) {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const { rootDomain, subDomain } = parseRootAndSubdomain(normalizedDomain);
  const dnsClient = createDnsClient();
  const records = await listExactCnameRecords(dnsClient, rootDomain, subDomain);
  const deletedRecordIds: string[] = [];

  for (const record of records) {
    const recordId = record.recordId;
    if (!recordId) continue;
    try {
      await withRetry(() => dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId })));
      deletedRecordIds.push(recordId);
    } catch (err: unknown) {
      if (!isNotFoundError(err)) throw err;
    }
  }

  return deletedRecordIds;
}

export async function listDnsRecords(domainName: string, limit = 200): Promise<DnsRecordSummary[]> {
  const normalizedDomain = domainName.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const dnsClient = createDnsClient();
  const results: DnsRecordSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  const pageSize = Math.min(100, safeLimit);

  for (let pageNumber = 1; pageNumber <= 20 && results.length < safeLimit; pageNumber += 1) {
    const response = await withRetry(() => dnsClient.describeDomainRecords(new $Alidns.DescribeDomainRecordsRequest({
      domainName: normalizedDomain,
      pageNumber,
      pageSize
    })));
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
  const response = await withRetry(() => dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
    domainName: normalizedDomain,
    RR: rr,
    type,
    value,
    TTL: options.ttl,
    line: options.line || 'default'
  })));
  const recordId = response.body?.recordId;
  if (!recordId) throw new Error('添加 DNS 记录失败：未返回 recordId');
  return recordId;
}

export async function removeDnsRecord(recordId: string) {
  const normalized = recordId.trim();
  if (!normalized) throw new Error('recordId 不能为空');
  const dnsClient = createDnsClient();
  await withRetry(() => dnsClient.deleteDomainRecord(new $Alidns.DeleteDomainRecordRequest({ recordId: normalized })));
}

export async function ensureWildcardCname(
  domainSuffix: string,
  targetValue: string,
  options: {
    interactiveTTY: boolean;
    skipConfirm?: boolean;
    onConfirm?: () => Promise<boolean>;
  }
): Promise<WildcardCnameResult> {
  const normalizedSuffix = domainSuffix.trim().toLowerCase();
  const normalizedTarget = normalizeDnsValue(targetValue);
  const { rootDomain, subDomain } = parseRootAndSubdomain(normalizedSuffix);
  const wildcardRR = subDomain ? `*.${subDomain}` : '*';
  const wildcardDomain = subDomain ? `*.${subDomain}.${rootDomain}` : `*.${rootDomain}`;
  const dnsClient = createDnsClient();

  const existing = await findCnameRecord(dnsClient, rootDomain, wildcardRR);
  if (existing?.recordId) {
    const normalizedExisting = normalizeDnsValue(existing.value || '');
    if (normalizedExisting !== normalizedTarget) {
      await withRetry(() => dnsClient.updateDomainRecord(new $Alidns.UpdateDomainRecordRequest({
        recordId: existing.recordId,
        RR: wildcardRR,
        type: 'CNAME',
        value: normalizedTarget
      })));
    }
    return { created: false, skipped: false, wildcardDomain, targetValue: normalizedTarget };
  }

  if (!options.skipConfirm) {
    if (!options.interactiveTTY) {
      return { created: false, skipped: true, wildcardDomain, targetValue: normalizedTarget };
    }
    if (options.onConfirm) {
      const confirmed = await options.onConfirm();
      if (!confirmed) {
        return { created: false, skipped: true, wildcardDomain, targetValue: normalizedTarget };
      }
    }
  }

  await withRetry(() => dnsClient.addDomainRecord(new $Alidns.AddDomainRecordRequest({
    domainName: rootDomain,
    RR: wildcardRR,
    type: 'CNAME',
    value: normalizedTarget
  })));

  return { created: true, skipped: false, wildcardDomain, targetValue: normalizedTarget };
}

export { removeDomainCname as removeMatchingCnameRecords };
