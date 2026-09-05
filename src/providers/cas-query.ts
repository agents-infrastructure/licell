import { Config, type AuthConfig } from '../utils/config';
import { executeAlicloudApi, type OpenApiRunnerContext, type OpenApiRunnerResult } from './openapi/runner';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export type CasCertificate = {
  certificateId: string;
  identifier?: string;
  name?: string;
  domain?: string;
  status?: string;
  certType?: string;
  sourceType?: string;
  issuer?: string;
  notBefore?: string;
  notAfter?: string;
};

export interface CasCertificateOptions {
  regionId?: string;
  keyword?: string;
  status?: string;
  certType?: string;
  sourceType?: string;
  limit?: number;
}

export type CasCertificateExecutor = (
  operationRef: string,
  input: Record<string, unknown>,
  context: OpenApiRunnerContext
) => Promise<Pick<OpenApiRunnerResult, 'response' | 'requestId'>>;

export interface CasCertificateDependencies {
  auth?: AuthConfig;
  execute?: CasCertificateExecutor;
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(Math.trunc(value!), MAX_LIMIT));
}

function stringValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function recordValue(record: Record<string, unknown>, names: string[]) {
  const entries = Object.entries(record);
  for (const name of names) {
    const normalized = name.toLowerCase();
    const match = entries.find(([key]) => key.toLowerCase() === normalized);
    const value = match ? stringValue(match[1]) : undefined;
    if (value) return value;
  }
  return undefined;
}

function findRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
  }
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const entries = Object.entries(record).sort(([left], [right]) => {
    const leftScore = /cert/i.test(left) ? 0 : 1;
    const rightScore = /cert/i.test(right) ? 0 : 1;
    return leftScore - rightScore;
  });
  for (const [, child] of entries) {
    const rows = findRows(child);
    if (rows.length > 0) return rows;
  }
  return [];
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function findNumber(value: unknown, names: string[]): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const direct = numberValue(recordValue(record, names));
  if (direct !== undefined) return direct;
  for (const child of Object.values(record)) {
    const nested = findNumber(child, names);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function summarizeCertificate(row: Record<string, unknown>): CasCertificate | undefined {
  const certificateId = recordValue(row, ['CertId', 'CertificateId', 'Id', 'Identifier']);
  if (!certificateId) return undefined;
  const identifier = recordValue(row, ['Identifier']);
  return {
    certificateId,
    ...(identifier && identifier !== certificateId ? { identifier } : {}),
    ...(recordValue(row, ['Name', 'CertName', 'CertificateName', 'CommonName']) ? { name: recordValue(row, ['Name', 'CertName', 'CertificateName', 'CommonName']) } : {}),
    ...(recordValue(row, ['Domain', 'DomainName']) ? { domain: recordValue(row, ['Domain', 'DomainName']) } : {}),
    ...(recordValue(row, ['Status', 'CertStatus', 'CertificateStatus']) ? { status: recordValue(row, ['Status', 'CertStatus', 'CertificateStatus']) } : {}),
    ...(recordValue(row, ['CertType', 'CertificateType']) ? { certType: recordValue(row, ['CertType', 'CertificateType']) } : {}),
    ...(recordValue(row, ['SourceType', 'Source']) ? { sourceType: recordValue(row, ['SourceType', 'Source']) } : {}),
    ...(recordValue(row, ['Issuer', 'IssuerName']) ? { issuer: recordValue(row, ['Issuer', 'IssuerName']) } : {}),
    ...(recordValue(row, ['NotBefore', 'StartTime', 'ValidityStart']) ? { notBefore: recordValue(row, ['NotBefore', 'StartTime', 'ValidityStart']) } : {}),
    ...(recordValue(row, ['NotAfter', 'EndTime', 'ValidityEnd']) ? { notAfter: recordValue(row, ['NotAfter', 'EndTime', 'ValidityEnd']) } : {})
  };
}

export async function listCasCertificates(
  options: CasCertificateOptions = {},
  dependencies: CasCertificateDependencies = {}
) {
  const auth = dependencies.auth || Config.requireAuth();
  const regionId = options.regionId?.trim() || auth.region;
  const limit = normalizeLimit(options.limit);
  const keyword = options.keyword?.trim() || undefined;
  const status = options.status?.trim() || undefined;
  const certType = options.certType?.trim() || undefined;
  const sourceType = options.sourceType?.trim() || undefined;
  const execute = dependencies.execute || executeAlicloudApi;
  const result = await execute('cas.ListCert', {
    CurrentPage: 1,
    ShowSize: limit,
    ...(keyword ? { KeyWord: keyword } : {}),
    ...(status ? { Status: status } : {}),
    ...(certType ? { CertType: certType } : {}),
    ...(sourceType ? { SourceType: sourceType } : {})
  }, { region: regionId, auth });
  const response = result.response;
  const root = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const rows = findRows(root).map(summarizeCertificate).filter((row): row is CasCertificate => Boolean(row));
  const totalCount = findNumber(root, ['TotalCount', 'Total', 'Count']) ?? rows.length;
  return {
    stage: 'cas.certificates',
    regionId,
    count: rows.length,
    totalCount,
    limit,
    truncated: totalCount > rows.length,
    filters: {
      ...(keyword ? { keyword } : {}),
      ...(status ? { status } : {}),
      ...(certType ? { certType } : {}),
      ...(sourceType ? { sourceType } : {})
    },
    ...(result.requestId ? { requestId: result.requestId } : {}),
    certificates: rows
  };
}
