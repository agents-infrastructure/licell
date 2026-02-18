import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { Config } from '../utils/config';
import { isConflictError, isNotFoundError, isTransientError } from '../utils/alicloud-error';
import { withRetry } from '../utils/retry';
import { ensureDomainCname, normalizeDnsValue } from './domain';
import { resolveSdkCtor } from '../utils/sdk';

const RpcClientCtor = resolveSdkCtor<$OpenApi.default>($OpenApi.default, '@alicloud/openapi-client');

interface CdnDomainDetail {
  domainName: string;
  cname?: string;
}

interface CdnEnableResult {
  cdnCname: string;
  created: boolean;
  httpsConfigured?: boolean;
}

function createCdnRpcClient() {
  const auth = Config.requireAuth();
  return new RpcClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region,
    endpoint: 'cdn.aliyuncs.com'
  }));
}

function toRpcQueryValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function toRpcQuery(query: Record<string, unknown>) {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const normalized = toRpcQueryValue(value);
    if (normalized === undefined) continue;
    output[key] = normalized;
  }
  return output;
}

async function callCdnRpc(action: string, query: Record<string, unknown>) {
  const client = createCdnRpcClient();
  const params = new $OpenApi.Params({
    action,
    version: '2018-05-10',
    protocol: 'HTTPS',
    pathname: '/',
    method: 'POST',
    authType: 'AK',
    style: 'RPC',
    reqBodyType: 'formData',
    bodyType: 'json'
  });
  const request = new $OpenApi.OpenApiRequest({
    query: toRpcQuery(query)
  });
  return client.callApi(
    params,
    request,
    new $Util.RuntimeOptions({ readTimeout: 20_000, connectTimeout: 8_000 })
  );
}

function normalizeDomain(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) throw new Error('域名不能为空');
  return normalized;
}

function normalizeOriginDomain(value: string) {
  const normalized = normalizeDnsValue(value);
  if (!normalized) throw new Error('CDN 回源域名不能为空');
  return normalized;
}

function toCdnDomainRow(row: unknown): CdnDomainDetail | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const item = row as Record<string, unknown>;
  const domainName = String(item.DomainName || item.domainName || '').trim().toLowerCase();
  if (!domainName) return undefined;
  const cnameRaw = String(item.Cname || item.cname || '').trim();
  return {
    domainName,
    cname: cnameRaw ? normalizeDnsValue(cnameRaw) : undefined
  };
}

function extractPageData(body: unknown) {
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  const domains = root.Domains;
  if (!domains || typeof domains !== 'object') return [];
  const pageData = (domains as Record<string, unknown>).PageData;
  if (!Array.isArray(pageData)) return [];
  return pageData;
}

function isCdnDomainNotReadyError(err: unknown) {
  if (typeof err !== 'object' || err === null) return false;
  const code = String((err as { code?: unknown }).code || '').toLowerCase();
  const message = String((err as { message?: unknown }).message || '').toLowerCase();
  return (
    code.includes('invaliddomainstatus') ||
    code.includes('domainnotexist') ||
    message.includes('domain status') ||
    message.includes('processing') ||
    message.includes('not ready')
  );
}

async function getCdnDomain(domainName: string): Promise<CdnDomainDetail | undefined> {
  const normalizedDomain = normalizeDomain(domainName);
  const response = await withRetry(() => callCdnRpc('DescribeUserDomains', {
    DomainName: normalizedDomain,
    PageNumber: 1,
    PageSize: 50
  }));
  const rows = extractPageData(response.body);
  for (const row of rows) {
    const item = toCdnDomainRow(row);
    if (!item) continue;
    if (item.domainName === normalizedDomain) return item;
  }
  return undefined;
}

async function addCdnDomain(domainName: string, originDomain: string) {
  const normalizedDomain = normalizeDomain(domainName);
  const normalizedOrigin = normalizeOriginDomain(originDomain);
  const sources = JSON.stringify([
    {
      content: normalizedOrigin,
      type: 'domain',
      port: 80,
      priority: '20',
      weight: '10'
    }
  ]);
  await withRetry(() => callCdnRpc('AddCdnDomain', {
    DomainName: normalizedDomain,
    CdnType: 'web',
    Sources: sources
  }));
}

async function waitCdnCnameReady(domainName: string, maxAttempts = 60, intervalMs = 3_000) {
  const normalizedDomain = normalizeDomain(domainName);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const detail = await getCdnDomain(normalizedDomain);
    if (detail?.cname) return detail.cname;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`CDN 域名已创建，但暂未返回 CNAME: ${normalizedDomain}`);
}

async function configureCdnHttps(domainName: string, certificate: string, privateKey: string) {
  const normalizedDomain = normalizeDomain(domainName);
  const certValue = certificate.trim();
  const keyValue = privateKey.trim();
  if (!certValue || !keyValue) return;
  const certName = `licell-cdn-cert-${Date.now()}`;
  await withRetry(
    () => callCdnRpc('SetCdnDomainSSLCertificate', {
      DomainName: normalizedDomain,
      SSLProtocol: 'on',
      CertType: 'upload',
      CertName: certName,
      SSLPub: certValue,
      SSLPri: keyValue
    }),
    {
      maxAttempts: 12,
      baseDelayMs: 2_000,
      shouldRetry: (err: unknown) => isTransientError(err) || isNotFoundError(err) || isCdnDomainNotReadyError(err)
    }
  );
}

export async function ensureCdnDomain(domainName: string, originDomain: string): Promise<CdnEnableResult> {
  const normalizedDomain = normalizeDomain(domainName);
  const normalizedOrigin = normalizeOriginDomain(originDomain);
  let created = false;
  let detail = await getCdnDomain(normalizedDomain);

  if (!detail) {
    try {
      await addCdnDomain(normalizedDomain, normalizedOrigin);
      created = true;
    } catch (err: unknown) {
      if (!isConflictError(err)) throw err;
      detail = await getCdnDomain(normalizedDomain);
    }
  }

  const cname = detail?.cname || await waitCdnCnameReady(normalizedDomain);
  return {
    cdnCname: cname,
    created
  };
}

export async function removeCdnDomain(domainName: string) {
  const normalizedDomain = normalizeDomain(domainName);
  try {
    await withRetry(() => callCdnRpc('DeleteUserCdnDomain', {
      DomainName: normalizedDomain
    }));
  } catch (err: unknown) {
    if (isNotFoundError(err)) return;
    throw err;
  }
}

export async function enableCdnForDomain(
  domainName: string,
  originDomain: string,
  options: { certificate?: string; privateKey?: string } = {}
): Promise<CdnEnableResult> {
  const normalizedDomain = normalizeDomain(domainName);
  const result = await ensureCdnDomain(normalizedDomain, originDomain);
  let httpsConfigured = false;
  if (options.certificate && options.privateKey) {
    await configureCdnHttps(normalizedDomain, options.certificate, options.privateKey);
    httpsConfigured = true;
  }
  await ensureDomainCname(normalizedDomain, result.cdnCname);
  return { ...result, httpsConfigured };
}

export function parseCdnDomainRowsFromBody(body: unknown): CdnDomainDetail[] {
  return extractPageData(body)
    .map((row) => toCdnDomainRow(row))
    .filter((item): item is CdnDomainDetail => Boolean(item));
}
