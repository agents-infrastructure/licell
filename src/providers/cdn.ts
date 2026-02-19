import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { Config } from '../utils/config';
import { isConflictError, isNotFoundError, isTransientError } from '../utils/alicloud-error';
import { formatErrorMessage } from '../utils/errors';
import { withRetry } from '../utils/retry';
import { ensureDomainCname, normalizeDnsValue } from './domain';
import { resolveSdkCtor } from '../utils/sdk';

const RpcClientCtor = resolveSdkCtor<$OpenApi.default>($OpenApi.default, '@alicloud/openapi-client');

interface CdnDomainDetail {
  domainName: string;
  cname?: string;
  status?: string;
}

interface CdnEnableResult {
  cdnCname: string;
  created: boolean;
  httpsConfigured?: boolean;
}

type CdnSourceType = 'domain' | 'oss';
type CdnScope = 'domestic' | 'overseas' | 'global';

interface CdnEnableOptions {
  certificate?: string;
  privateKey?: string;
  sourceType?: CdnSourceType;
  scope?: CdnScope;
  enablePrivateOssAuth?: boolean;
  waitForOnline?: boolean;
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

function normalizeSourceType(value: CdnSourceType | undefined): CdnSourceType {
  return value === 'oss' ? 'oss' : 'domain';
}

function inferDefaultScope(domainName: string): CdnScope {
  // Keep current product behavior as domestic by default; CDN domain status may still take time to become online.
  // Non-domestic acceleration strategies can be introduced via explicit CLI options in a future iteration.
  void domainName;
  return 'domestic';
}

function normalizeScope(value: CdnScope | undefined, domainName: string): CdnScope {
  if (value === 'domestic' || value === 'overseas' || value === 'global') return value;
  return inferDefaultScope(domainName);
}

function normalizeDomainStatus(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || undefined;
}

function toCdnDomainRow(row: unknown): CdnDomainDetail | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const item = row as Record<string, unknown>;
  const domainName = String(item.DomainName || item.domainName || '').trim().toLowerCase();
  if (!domainName) return undefined;
  const cnameRaw = String(item.Cname || item.cname || '').trim();
  return {
    domainName,
    cname: cnameRaw ? normalizeDnsValue(cnameRaw) : undefined,
    status: normalizeDomainStatus(item.DomainStatus || item.domainStatus)
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

async function addCdnDomain(
  domainName: string,
  originDomain: string,
  options: { sourceType?: CdnSourceType; scope?: CdnScope } = {}
) {
  const normalizedDomain = normalizeDomain(domainName);
  const normalizedOrigin = normalizeOriginDomain(originDomain);
  const sourceType = normalizeSourceType(options.sourceType);
  const scope = normalizeScope(options.scope, normalizedDomain);
  const sources = JSON.stringify([
    {
      content: normalizedOrigin,
      type: sourceType,
      port: 80,
      priority: '20',
      weight: '10'
    }
  ]);
  await withRetry(() => callCdnRpc('AddCdnDomain', {
    DomainName: normalizedDomain,
    CdnType: 'web',
    Scope: scope,
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

function isPrivateOssAuthBootstrapError(err: unknown) {
  const text = formatErrorMessage(err).toLowerCase();
  return (
    text.includes('aliyuncdnaccessingprivateossrole') ||
    text.includes('private oss') ||
    text.includes('private_oss_auth') ||
    text.includes('l2_oss_key') ||
    text.includes('authorize')
  );
}

async function configurePrivateOssOriginAuth(domainName: string) {
  const normalizedDomain = normalizeDomain(domainName);
  const functions = JSON.stringify([
    {
      functionName: 'l2_oss_key',
      functionArgs: [
        { argName: 'private_oss_auth', argValue: 'on' }
      ]
    }
  ]);
  try {
    await withRetry(
      () => callCdnRpc('BatchSetCdnDomainConfig', {
        DomainNames: normalizedDomain,
        Functions: functions
      }),
      {
        maxAttempts: 12,
        baseDelayMs: 2_000,
        shouldRetry: (err: unknown) => isTransientError(err) || isCdnDomainNotReadyError(err)
      }
    );
  } catch (err: unknown) {
    if (!isPrivateOssAuthBootstrapError(err)) throw err;
    throw new Error(
      `CDN 私有 OSS 回源授权失败，请先在 CDN 控制台完成一次“私有 OSS Bucket 回源授权”，` +
      `确保服务关联角色 AliyunCDNAccessingPrivateOSSRole 已创建。原始错误: ${formatErrorMessage(err)}`
    );
  }
}

async function configureStaticRootRewrite(domainName: string) {
  const normalizedDomain = normalizeDomain(domainName);
  const functions = JSON.stringify([
    {
      functionName: 'back_to_origin_url_rewrite',
      functionArgs: [
        { argName: 'source_url', argValue: '^/$' },
        { argName: 'target_url', argValue: '/index.html' },
        { argName: 'flag', argValue: 'break' }
      ]
    }
  ]);
  await withRetry(
    () => callCdnRpc('BatchSetCdnDomainConfig', {
      DomainNames: normalizedDomain,
      Functions: functions
    }),
    {
      maxAttempts: 12,
      baseDelayMs: 2_000,
      shouldRetry: (err: unknown) => isTransientError(err) || isCdnDomainNotReadyError(err)
    }
  );
}

function isCdnOnlineStatus(status: string | undefined) {
  return status === 'online';
}

function isCdnFailedStatus(status: string | undefined) {
  return status === 'configure_failed' || status === 'check_failed';
}

async function waitCdnDomainOnline(domainName: string, maxAttempts = 40, intervalMs = 3_000) {
  const normalizedDomain = normalizeDomain(domainName);
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const detail = await getCdnDomain(normalizedDomain);
    if (isCdnOnlineStatus(detail?.status)) return;
    if (isCdnFailedStatus(detail?.status)) {
      throw new Error(`CDN 域名状态异常: ${normalizedDomain} (${detail?.status})`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`CDN 域名长时间未就绪: ${normalizedDomain}`);
}

export async function ensureCdnDomain(
  domainName: string,
  originDomain: string,
  options: { sourceType?: CdnSourceType; scope?: CdnScope } = {}
): Promise<CdnEnableResult> {
  const normalizedDomain = normalizeDomain(domainName);
  const normalizedOrigin = normalizeOriginDomain(originDomain);
  let created = false;
  let detail = await getCdnDomain(normalizedDomain);

  if (!detail) {
    try {
      await addCdnDomain(normalizedDomain, normalizedOrigin, options);
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
    await withRetry(() => callCdnRpc('DeleteCdnDomain', {
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
  options: CdnEnableOptions = {}
): Promise<CdnEnableResult> {
  const normalizedDomain = normalizeDomain(domainName);
  const sourceType = normalizeSourceType(options.sourceType);
  const scope = normalizeScope(options.scope, normalizedDomain);
  const result = await ensureCdnDomain(normalizedDomain, originDomain, {
    sourceType,
    scope
  });
  if (sourceType === 'oss' && options.enablePrivateOssAuth !== false) {
    await configurePrivateOssOriginAuth(normalizedDomain);
    await configureStaticRootRewrite(normalizedDomain);
  }
  let httpsConfigured = false;
  if (options.certificate && options.privateKey) {
    await configureCdnHttps(normalizedDomain, options.certificate, options.privateKey);
    httpsConfigured = true;
  }
  await ensureDomainCname(normalizedDomain, result.cdnCname);
  if (options.waitForOnline) {
    await waitCdnDomainOnline(normalizedDomain);
  }
  return { ...result, httpsConfigured };
}

export function parseCdnDomainRowsFromBody(body: unknown): CdnDomainDetail[] {
  return extractPageData(body)
    .map((row) => toCdnDomainRow(row))
    .filter((item): item is CdnDomainDetail => Boolean(item));
}
