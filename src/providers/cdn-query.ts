import { Config, type AuthConfig } from '../utils/config';
import { executeAlicloudApi, type OpenApiRunnerContext, type OpenApiRunnerResult } from './openapi/runner';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export type CdnAgentOrigin = {
  content: string;
  type?: string;
  port?: string;
  priority?: string;
  weight?: string;
};

export type CdnAgentDomain = {
  domainName: string;
  cname?: string;
  status?: string;
  serverCertificateStatus?: string;
  origins?: CdnAgentOrigin[];
};

export interface CdnDomainQueryOptions {
  regionId?: string;
  domainName?: string;
  status?: string;
  prefix?: string;
  source?: string;
  limit?: number;
}

export type CdnDomainExecutor = (
  operationRef: string,
  input: Record<string, unknown>,
  context: OpenApiRunnerContext
) => Promise<Pick<OpenApiRunnerResult, 'response' | 'requestId'>>;

export interface CdnDomainQueryDependencies {
  auth?: AuthConfig;
  execute?: CdnDomainExecutor;
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(Math.trunc(value!), MAX_LIMIT));
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function field(record: Record<string, unknown>, names: string[]) {
  const entries = Object.entries(record);
  for (const name of names) {
    const match = entries.find(([key]) => key.toLowerCase() === name.toLowerCase());
    const value = match ? stringValue(match[1]) : undefined;
    if (value) return value;
  }
  return undefined;
}

function findArray(value: unknown, names: string[], depth = 0): unknown[] {
  if (depth > 8) return [];
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  for (const name of names) {
    const match = Object.entries(record).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (match && Array.isArray(match[1])) return match[1];
  }
  for (const child of Object.values(record)) {
    const rows = findArray(child, names, depth + 1);
    if (rows.length > 0) return rows;
  }
  return [];
}

function findNumber(value: unknown, names: string[], depth = 0): number | undefined {
  if (depth > 8 || !value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const name of names) {
    const match = Object.entries(record).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (!match) continue;
    const raw = match[1];
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw);
  }
  for (const child of Object.values(record)) {
    const result = findNumber(child, names, depth + 1);
    if (result !== undefined) return result;
  }
  return undefined;
}

function summarizeOrigin(value: unknown): CdnAgentOrigin | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const content = field(record, ['Content', 'content']);
  if (!content) return undefined;
  return {
    content: content.toLowerCase(),
    ...(field(record, ['Type', 'type']) ? { type: field(record, ['Type', 'type']) } : {}),
    ...(field(record, ['Port', 'port']) ? { port: field(record, ['Port', 'port']) } : {}),
    ...(field(record, ['Priority', 'priority']) ? { priority: field(record, ['Priority', 'priority']) } : {}),
    ...(field(record, ['Weight', 'weight']) ? { weight: field(record, ['Weight', 'weight']) } : {})
  };
}

function summarizeDomain(value: unknown): CdnAgentDomain | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const domainName = field(record, ['DomainName', 'domainName'])?.toLowerCase();
  if (!domainName) return undefined;
  const sourceRows = findArray(record, ['Source', 'source', 'Sources', 'sources', 'SourceInfos', 'sourceInfos']);
  const origins = sourceRows.map(summarizeOrigin).filter((row): row is CdnAgentOrigin => Boolean(row));
  return {
    domainName,
    ...(field(record, ['Cname', 'cname']) ? { cname: field(record, ['Cname', 'cname'])?.toLowerCase() } : {}),
    ...(field(record, ['DomainStatus', 'domainStatus', 'Status', 'status']) ? { status: field(record, ['DomainStatus', 'domainStatus', 'Status', 'status']) } : {}),
    ...(field(record, ['ServerCertificateStatus', 'serverCertificateStatus', 'SslProtocol', 'sslProtocol']) ? { serverCertificateStatus: field(record, ['ServerCertificateStatus', 'serverCertificateStatus', 'SslProtocol', 'sslProtocol']) } : {}),
    ...(origins.length > 0 ? { origins } : {})
  };
}

export async function listCdnDomainsForAgent(
  options: CdnDomainQueryOptions = {},
  dependencies: CdnDomainQueryDependencies = {}
) {
  const auth = dependencies.auth || Config.requireAuth();
  const regionId = options.regionId?.trim() || auth.region;
  const limit = normalizeLimit(options.limit);
  const domainName = options.domainName?.trim() || undefined;
  const status = options.status?.trim() || undefined;
  const prefix = options.prefix?.trim().toLowerCase() || undefined;
  const source = options.source?.trim() || undefined;
  const execute = dependencies.execute || executeAlicloudApi;
  const result = await execute('cdn.DescribeUserDomains', {
    PageNumber: 1,
    PageSize: limit,
    ...(domainName ? { DomainName: domainName } : {}),
    ...(status ? { DomainStatus: status } : {}),
    ...(source ? { Source: source } : {})
  }, { region: regionId, auth });
  const response = result.response;
  const rows = findArray(response, ['PageData']).map(summarizeDomain).filter((row): row is CdnAgentDomain => Boolean(row));
  const domains = prefix ? rows.filter((row) => row.domainName.startsWith(prefix)) : rows;
  const totalCount = findNumber(response, ['TotalCount', 'Total', 'Count']) ?? domains.length;
  return {
    stage: 'cdn.domains',
    regionId,
    count: domains.length,
    totalCount,
    limit,
    truncated: totalCount > domains.length,
    filters: {
      ...(domainName ? { domainName } : {}),
      ...(status ? { status } : {}),
      ...(prefix ? { prefix } : {}),
      ...(source ? { source } : {})
    },
    ...(result.requestId ? { requestId: result.requestId } : {}),
    domains
  };
}
