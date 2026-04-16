import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { Config } from '../utils/config';
import { isConflictError, isNotFoundError, isTransientError } from '../utils/alicloud-error';
import { readLicellEnv } from '../utils/env';
import { formatErrorMessage } from '../utils/errors';
import { withRetry } from '../utils/retry';
import { ensureDomainCname, normalizeDnsValue, waitForAuthoritativeCnameTarget } from './dns';
import { parsePositiveIntEnv, resolveSdkCtor } from '../utils/sdk';

const RpcClientCtor = resolveSdkCtor<$OpenApi.default>($OpenApi.default, '@alicloud/openapi-client');
const DEFAULT_CDN_DOMAIN_READY_TIMEOUT_MS = 15 * 60_000;
const DEFAULT_CDN_DOMAIN_READY_INTERVAL_MS = 5_000;
const DEFAULT_CDN_HTTPS_READY_TIMEOUT_MS = 10 * 60_000;
const DEFAULT_CDN_HTTPS_READY_INTERVAL_MS = 3_000;
const DEFAULT_CDN_REFRESH_READY_TIMEOUT_MS = 5 * 60_000;
const DEFAULT_CDN_REFRESH_READY_INTERVAL_MS = 3_000;

export interface CdnDomainOrigin {
  content: string;
  type?: string;
  port?: string;
  priority?: string;
  weight?: string;
}

export interface CdnDomainDetail {
  domainName: string;
  cname?: string;
  status?: string;
  serverCertificateStatus?: string;
  origins?: CdnDomainOrigin[];
}

export interface CdnRefreshTaskDetail {
  taskId: string;
  status?: string;
  objectPath?: string;
  objectType?: string;
}

interface CdnEnableResult {
  cdnCname: string;
  created: boolean;
  httpsConfigured?: boolean;
}

export interface CdnRefreshRequest {
  objectPath: string[];
  objectType: 'File' | 'Directory';
}

export interface CdnRefreshResult {
  taskIds: string[];
  tasks: CdnRefreshTaskDetail[];
}

export type CdnSourceType = 'domain' | 'oss';
type CdnScope = 'domestic' | 'overseas' | 'global';

interface CdnEnableOptions {
  certificate?: string;
  privateKey?: string;
  sourceType?: CdnSourceType;
  scope?: CdnScope;
  enablePrivateOssAuth?: boolean;
  waitForOnline?: boolean;
}

interface CdnWaitConfig {
  timeoutMs: number;
  intervalMs: number;
  maxAttempts: number;
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

function normalizeServerCertificateStatus(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || undefined;
}

function resolveCdnWaitConfig(
  kind: 'domain' | 'https' | 'refresh',
  env: NodeJS.ProcessEnv = process.env
): CdnWaitConfig {
  const timeoutMs = kind === 'domain'
    ? parsePositiveIntEnv(
      readLicellEnv(env, 'CDN_DOMAIN_READY_TIMEOUT_MS'),
      DEFAULT_CDN_DOMAIN_READY_TIMEOUT_MS
    )
    : kind === 'https'
      ? parsePositiveIntEnv(
      readLicellEnv(env, 'CDN_HTTPS_READY_TIMEOUT_MS'),
      DEFAULT_CDN_HTTPS_READY_TIMEOUT_MS
      )
      : parsePositiveIntEnv(
        readLicellEnv(env, 'CDN_REFRESH_READY_TIMEOUT_MS'),
        DEFAULT_CDN_REFRESH_READY_TIMEOUT_MS
      );
  const intervalMs = kind === 'domain'
    ? parsePositiveIntEnv(
      readLicellEnv(env, 'CDN_DOMAIN_READY_INTERVAL_MS'),
      DEFAULT_CDN_DOMAIN_READY_INTERVAL_MS
    )
    : kind === 'https'
      ? parsePositiveIntEnv(
      readLicellEnv(env, 'CDN_HTTPS_READY_INTERVAL_MS'),
      DEFAULT_CDN_HTTPS_READY_INTERVAL_MS
      )
      : parsePositiveIntEnv(
        readLicellEnv(env, 'CDN_REFRESH_READY_INTERVAL_MS'),
        DEFAULT_CDN_REFRESH_READY_INTERVAL_MS
      );
  return {
    timeoutMs,
    intervalMs,
    maxAttempts: Math.max(1, Math.ceil(timeoutMs / intervalMs))
  };
}

function formatWaitSeconds(ms: number) {
  return `${Math.ceil(ms / 1000)}s`;
}

function toSourceRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const directKeys = ['Source', 'source', 'SourcesData', 'sourcesData', 'SourceInfo', 'sourceInfo'];
  for (const key of directKeys) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
  }
  const nestedKeys = ['Sources', 'sources', 'SourceInfos', 'sourceInfos'];
  for (const key of nestedKeys) {
    const nested = record[key];
    const rows = toSourceRows(nested);
    if (rows.length > 0) return rows;
  }
  return [];
}

function toCdnDomainOrigins(value: unknown): CdnDomainOrigin[] | undefined {
  const rows = toSourceRows(value);
  const origins = rows
    .map((row) => {
      const contentRaw = String(row.Content || row.content || '').trim();
      if (!contentRaw) return null;
      const typeRaw = String(row.Type || row.type || '').trim().toLowerCase();
      const portRaw = String(row.Port || row.port || '').trim();
      const priorityRaw = String(row.Priority || row.priority || '').trim();
      const weightRaw = String(row.Weight || row.weight || '').trim();
      return {
        content: normalizeDnsValue(contentRaw),
        ...(typeRaw ? { type: typeRaw } : {}),
        ...(portRaw ? { port: portRaw } : {}),
        ...(priorityRaw ? { priority: priorityRaw } : {}),
        ...(weightRaw ? { weight: weightRaw } : {})
      } satisfies CdnDomainOrigin;
    })
    .filter((item): item is CdnDomainOrigin => Boolean(item));
  return origins.length > 0 ? origins : undefined;
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
    status: normalizeDomainStatus(item.DomainStatus || item.domainStatus),
    serverCertificateStatus: normalizeServerCertificateStatus(
      item.ServerCertificateStatus || item.serverCertificateStatus || item.SslProtocol || item.sslProtocol
    ),
    origins: toCdnDomainOrigins(item.Sources || item.sources || item.SourceInfos || item.sourceInfos)
  };
}

function toCdnDomainDetail(body: unknown): CdnDomainDetail | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const root = body as Record<string, unknown>;
  const detail = root.GetDomainDetailModel || root.getDomainDetailModel;
  return toCdnDomainRow(detail);
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

function collectNestedRows(value: unknown, rows: Record<string, unknown>[], depth = 0): void {
  if (depth > 8) return;
  if (Array.isArray(value)) {
    for (const item of value) collectNestedRows(item, rows, depth + 1);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (record.TaskId || record.taskId || record.ObjectPath || record.objectPath || record.Status || record.status) {
    rows.push(record);
  }
  for (const nested of Object.values(record)) {
    collectNestedRows(nested, rows, depth + 1);
  }
}

function findNestedStringField(value: unknown, keys: string[], depth = 0): string | undefined {
  if (depth > 8) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedStringField(item, keys, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  for (const nested of Object.values(record)) {
    const found = findNestedStringField(nested, keys, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function toCdnRefreshTaskDetail(row: unknown): CdnRefreshTaskDetail | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const item = row as Record<string, unknown>;
  const taskId = String(item.TaskId || item.taskId || '').trim();
  if (!taskId) return undefined;
  const status = String(item.Status || item.status || '').trim();
  const objectPath = String(item.ObjectPath || item.objectPath || '').trim();
  const objectType = String(item.ObjectType || item.objectType || '').trim();
  return {
    taskId,
    ...(status ? { status } : {}),
    ...(objectPath ? { objectPath } : {}),
    ...(objectType ? { objectType } : {})
  };
}

function extractRefreshTaskDetails(body: unknown) {
  const rows: Record<string, unknown>[] = [];
  collectNestedRows(body, rows);
  const tasks: CdnRefreshTaskDetail[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const detail = toCdnRefreshTaskDetail(row);
    if (!detail || seen.has(detail.taskId)) continue;
    seen.add(detail.taskId);
    tasks.push(detail);
  }
  return tasks;
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

export async function getCdnDomainDetail(domainName: string): Promise<CdnDomainDetail | undefined> {
  const normalizedDomain = normalizeDomain(domainName);
  try {
    const response = await withRetry(() => callCdnRpc('DescribeCdnDomainDetail', {
      DomainName: normalizedDomain
    }));
    return toCdnDomainDetail(response.body);
  } catch (err: unknown) {
    if (isNotFoundError(err)) return undefined;
    throw err;
  }
}

export async function listCdnDomains(
  limit = 100,
  filters: {
    prefix?: string;
    source?: string;
  } = {}
): Promise<CdnDomainDetail[]> {
  const results: CdnDomainDetail[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 2000));
  const pageSize = Math.min(100, safeLimit);
  const prefix = filters.prefix?.trim().toLowerCase();
  const source = filters.source ? normalizeOriginDomain(filters.source) : undefined;

  for (let pageNumber = 1; pageNumber <= 50 && results.length < safeLimit; pageNumber += 1) {
    const response = await withRetry(() => callCdnRpc('DescribeUserDomains', {
      PageNumber: pageNumber,
      PageSize: pageSize,
      ...(source ? { Source: source } : {})
    }));
    const rows = extractPageData(response.body);
    for (const row of rows) {
      const item = toCdnDomainRow(row);
      if (!item) continue;
      if (prefix && !item.domainName.startsWith(prefix)) continue;
      if (source && !item.origins?.some((origin) => normalizeDnsValue(origin.content) === source)) continue;
      results.push(item);
      if (results.length >= safeLimit) break;
    }
    const totalCount = Number((response.body as { TotalCount?: unknown } | undefined)?.TotalCount || 0);
    if (rows.length === 0 || (totalCount > 0 && pageNumber * pageSize >= totalCount)) break;
  }

  return results;
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
    const detail = await getCdnDomainDetail(normalizedDomain) || await getCdnDomain(normalizedDomain);
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
  await waitCdnHttpsConfigured(normalizedDomain);
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

function normalizeCdnRefreshTaskStatus(status: string | undefined) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized || undefined;
}

function isCdnRefreshTaskComplete(status: string | undefined) {
  const normalized = normalizeCdnRefreshTaskStatus(status);
  return normalized === 'complete' || normalized === 'completed' || normalized === 'success' || normalized === 'succeeded';
}

function isCdnRefreshTaskFailed(status: string | undefined) {
  const normalized = normalizeCdnRefreshTaskStatus(status);
  return normalized === 'fail' || normalized === 'failed' || normalized === 'failure' || normalized === 'canceled';
}

async function waitCdnDomainOnline(domainName: string, maxAttempts?: number, intervalMs?: number) {
  const normalizedDomain = normalizeDomain(domainName);
  const waitConfig = resolveCdnWaitConfig('domain');
  const resolvedMaxAttempts = maxAttempts ?? waitConfig.maxAttempts;
  const resolvedIntervalMs = intervalMs ?? waitConfig.intervalMs;
  const timeoutMs = resolvedMaxAttempts * resolvedIntervalMs;
  let lastStatus: string | undefined;
  for (let attempt = 1; attempt <= resolvedMaxAttempts; attempt += 1) {
    const detail = await getCdnDomainDetail(normalizedDomain) || await getCdnDomain(normalizedDomain);
    lastStatus = detail?.status;
    if (isCdnOnlineStatus(detail?.status)) return;
    if (isCdnFailedStatus(detail?.status)) {
      throw new Error(`CDN 域名状态异常: ${normalizedDomain} (${detail?.status})`);
    }
    await new Promise((resolve) => setTimeout(resolve, resolvedIntervalMs));
  }
  throw new Error(
    `CDN 域名长时间未就绪: ${normalizedDomain}${lastStatus ? ` (${lastStatus})` : ''}` +
    `；已等待 ${formatWaitSeconds(timeoutMs)}，可通过 LICELL_CDN_DOMAIN_READY_TIMEOUT_MS / LICELL_CDN_DOMAIN_READY_INTERVAL_MS 调整`
  );
}

function isCdnServerCertificateEnabled(status: string | undefined) {
  return status === 'on' || status === 'enabled';
}

async function waitCdnHttpsConfigured(domainName: string, maxAttempts?: number, intervalMs?: number) {
  const normalizedDomain = normalizeDomain(domainName);
  const waitConfig = resolveCdnWaitConfig('https');
  const resolvedMaxAttempts = maxAttempts ?? waitConfig.maxAttempts;
  const resolvedIntervalMs = intervalMs ?? waitConfig.intervalMs;
  const timeoutMs = resolvedMaxAttempts * resolvedIntervalMs;
  let lastStatus: string | undefined;
  for (let attempt = 1; attempt <= resolvedMaxAttempts; attempt += 1) {
    const detail = await getCdnDomainDetail(normalizedDomain) || await getCdnDomain(normalizedDomain);
    lastStatus = detail?.serverCertificateStatus;
    if (isCdnServerCertificateEnabled(detail?.serverCertificateStatus)) return;
    if (isCdnFailedStatus(detail?.status)) {
      throw new Error(`CDN 边缘 HTTPS 配置失败: ${normalizedDomain} (${detail?.status})`);
    }
    await new Promise((resolve) => setTimeout(resolve, resolvedIntervalMs));
  }
  throw new Error(
    `CDN 边缘 HTTPS 长时间未就绪: ${normalizedDomain}${lastStatus ? ` (serverCertificateStatus=${lastStatus})` : ''}` +
    `；已等待 ${formatWaitSeconds(timeoutMs)}，可通过 LICELL_CDN_HTTPS_READY_TIMEOUT_MS / LICELL_CDN_HTTPS_READY_INTERVAL_MS 调整`
  );
}

async function waitForCdnRefreshTasks(taskIds: string[], maxAttempts?: number, intervalMs?: number) {
  const pendingTaskIds = [...new Set(taskIds.filter((item) => item.trim().length > 0))];
  if (pendingTaskIds.length === 0) return [];
  const waitConfig = resolveCdnWaitConfig('refresh');
  const resolvedMaxAttempts = maxAttempts ?? waitConfig.maxAttempts;
  const resolvedIntervalMs = intervalMs ?? waitConfig.intervalMs;
  const timeoutMs = resolvedMaxAttempts * resolvedIntervalMs;
  let latestTasks: CdnRefreshTaskDetail[] = [];

  for (let attempt = 1; attempt <= resolvedMaxAttempts; attempt += 1) {
    latestTasks = await describeCdnRefreshTasks({ taskIds: pendingTaskIds });
    const statusByTaskId = new Map(latestTasks.map((task) => [task.taskId, task.status]));
    const failedTask = pendingTaskIds.find((taskId) => isCdnRefreshTaskFailed(statusByTaskId.get(taskId)));
    if (failedTask) {
      throw new Error(`CDN 缓存刷新失败: ${failedTask} (${String(statusByTaskId.get(failedTask) || 'unknown')})`);
    }
    const allComplete = pendingTaskIds.every((taskId) => isCdnRefreshTaskComplete(statusByTaskId.get(taskId)));
    if (allComplete) return latestTasks;
    await new Promise((resolve) => setTimeout(resolve, resolvedIntervalMs));
  }

  throw new Error(
    `CDN 缓存刷新长时间未完成: ${pendingTaskIds.join(', ')}` +
    `；已等待 ${formatWaitSeconds(timeoutMs)}，可通过 LICELL_CDN_REFRESH_READY_TIMEOUT_MS / LICELL_CDN_REFRESH_READY_INTERVAL_MS 调整`
  );
}

export async function describeCdnRefreshTasks(filters: {
  taskIds?: string[];
  objectPath?: string;
  objectType?: 'File' | 'Directory';
  domainName?: string;
} = {}): Promise<CdnRefreshTaskDetail[]> {
  const taskIds = [...new Set((filters.taskIds || []).map((item) => item.trim()).filter(Boolean))];
  if (taskIds.length <= 1) {
    const response = await withRetry(() => callCdnRpc('DescribeRefreshTasks', {
      ...(filters.domainName ? { DomainName: normalizeDomain(filters.domainName) } : {}),
      ...(filters.objectPath ? { ObjectPath: filters.objectPath } : {}),
      ...(filters.objectType ? { ObjectType: filters.objectType.toLowerCase() } : {}),
      ...(taskIds[0] ? { TaskId: taskIds[0] } : {}),
      PageNumber: 1,
      PageSize: 100
    }));
    return extractRefreshTaskDetails(response.body);
  }

  const tasks = await Promise.all(taskIds.map(async (taskId) => {
    const response = await withRetry(() => callCdnRpc('DescribeRefreshTasks', {
      TaskId: taskId,
      PageNumber: 1,
      PageSize: 100
    }));
    return extractRefreshTaskDetails(response.body);
  }));
  return tasks.flat();
}

export async function refreshCdnObjectCaches(
  requests: CdnRefreshRequest[],
  options: { waitForCompletion?: boolean } = {}
): Promise<CdnRefreshResult> {
  const taskIds: string[] = [];
  for (const request of requests) {
    const objectPaths = [...new Set(request.objectPath.map((item) => item.trim()).filter(Boolean))];
    if (objectPaths.length === 0) continue;
    const response = await withRetry(
      () => callCdnRpc('RefreshObjectCaches', {
        ObjectPath: objectPaths.join('\n'),
        ObjectType: request.objectType
      }),
      {
        maxAttempts: 12,
        baseDelayMs: 2_000,
        shouldRetry: (err: unknown) => isTransientError(err) || isCdnDomainNotReadyError(err)
      }
    );
    const taskId = findNestedStringField(response.body, ['RefreshTaskId', 'refreshTaskId', 'TaskId', 'taskId']);
    if (!taskId) {
      throw new Error(`CDN 刷新请求未返回 taskId (${request.objectType})`);
    }
    taskIds.push(taskId);
  }

  if (taskIds.length === 0) {
    return { taskIds: [], tasks: [] };
  }

  const tasks = options.waitForCompletion === false
    ? taskIds.map((taskId) => ({ taskId }))
    : await waitForCdnRefreshTasks(taskIds);
  return {
    taskIds,
    tasks
  };
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
    await withRetry(
      () => callCdnRpc('DeleteCdnDomain', {
        DomainName: normalizedDomain
      }),
      {
        maxAttempts: 36,
        baseDelayMs: 5_000,
        shouldRetry: (err: unknown) => isTransientError(err) || isCdnDomainNotReadyError(err)
      }
    );
    return true;
  } catch (err: unknown) {
    if (isNotFoundError(err)) return false;
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
  await ensureDomainCname(normalizedDomain, result.cdnCname);
  if (options.waitForOnline) {
    await waitForAuthoritativeCnameTarget(normalizedDomain, result.cdnCname, {
      maxAttempts: 36,
      intervalMs: 5_000
    });
    await waitCdnDomainOnline(normalizedDomain);
  }
  let httpsConfigured = false;
  if (options.certificate && options.privateKey) {
    await configureCdnHttps(normalizedDomain, options.certificate, options.privateKey);
    httpsConfigured = true;
  }
  return { ...result, httpsConfigured };
}

export function parseCdnDomainRowsFromBody(body: unknown): CdnDomainDetail[] {
  return extractPageData(body)
    .map((row) => toCdnDomainRow(row))
    .filter((item): item is CdnDomainDetail => Boolean(item));
}
