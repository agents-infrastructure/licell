import { Config, type AuthConfig } from '../utils/config';
import { executeAlicloudApi, type OpenApiRunnerContext, type OpenApiRunnerResult } from './openapi/runner';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export type SlsProjectSummary = {
  projectName: string;
  description?: string;
  region?: string;
  status?: string;
  createTime?: string;
  lastModifyTime?: string;
  quota?: Record<string, unknown>;
};

export interface SlsProjectQueryOptions {
  regionId?: string;
  projectName?: string;
  resourceGroupId?: string;
  fetchQuota?: boolean;
  limit?: number;
}

export type SlsProjectExecutor = (
  operationRef: string,
  input: Record<string, unknown>,
  context: OpenApiRunnerContext
) => Promise<Pick<OpenApiRunnerResult, 'response' | 'requestId'> & Partial<Pick<OpenApiRunnerResult, 'ok' | 'exitCode' | 'stderr'>>>;

export interface SlsProjectQueryDependencies {
  auth?: AuthConfig;
  execute?: SlsProjectExecutor;
}

export type SlsLogstoreSummary = {
  logstoreName: string;
  mode?: string;
  telemetryType?: string;
  ttl?: number;
  shardCount?: number;
  enableTracking?: boolean;
};

export interface SlsLogstoreQueryOptions {
  regionId?: string;
  project: string;
  logstoreName?: string;
  mode?: string;
  telemetryType?: string;
  limit?: number;
}

export interface SlsLogstoreQueryDependencies {
  auth?: AuthConfig;
  execute?: SlsProjectExecutor;
}

export type SlsIndexField = {
  name: string;
  type?: string;
  alias?: string;
  caseSensitive?: boolean;
  chineseAnalyzer?: boolean;
  docValue?: boolean;
  token?: string[];
};

export type SlsIndexSummary = {
  indexMode?: string;
  storage?: string;
  ttl?: number;
  lastModifyTime?: number;
  lastUserModifyTime?: number;
  line?: Omit<SlsIndexField, 'name' | 'type' | 'alias' | 'docValue'>;
  fields: SlsIndexField[];
};

export interface SlsIndexQueryOptions {
  regionId?: string;
  project: string;
  logstore: string;
}

export interface SlsIndexQueryDependencies {
  auth?: AuthConfig;
  execute?: SlsProjectExecutor;
}

function assertRunnerSuccess(
  operationRef: string,
  result: Partial<Pick<OpenApiRunnerResult, 'ok' | 'exitCode' | 'stderr'>>
) {
  if (result.ok === false) {
    throw new Error(`${operationRef} 调用失败: ${result.stderr?.trim() || `aliyun-cli exited with code ${result.exitCode ?? 1}`}`);
  }
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

function numberField(record: Record<string, unknown>, names: string[]) {
  const raw = field(record, names);
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  for (const name of names) {
    const match = Object.entries(record).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (typeof match?.[1] === 'number' && Number.isFinite(match[1])) return match[1];
  }
  return undefined;
}

function booleanField(record: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const match = Object.entries(record).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (typeof match?.[1] === 'boolean') return match[1];
  }
  return undefined;
}

function stringArrayField(record: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const match = Object.entries(record).find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (Array.isArray(match?.[1])) {
      const values = match[1].filter((item): item is string => typeof item === 'string');
      if (values.length > 0) return values;
    }
  }
  return undefined;
}

function safeQuota(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/secret|token|password|credential|key/i.test(key)) continue;
    if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') result[key] = child;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function summarizeProject(value: unknown): SlsProjectSummary | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const projectName = field(record, ['projectName', 'ProjectName', 'name', 'Name']);
  if (!projectName) return undefined;
  const quota = safeQuota(record.quota || record.Quota);
  return {
    projectName,
    ...(field(record, ['description', 'Description']) ? { description: field(record, ['description', 'Description']) } : {}),
    ...(field(record, ['region', 'Region', 'regionId', 'RegionId']) ? { region: field(record, ['region', 'Region', 'regionId', 'RegionId']) } : {}),
    ...(field(record, ['status', 'Status']) ? { status: field(record, ['status', 'Status']) } : {}),
    ...(field(record, ['createTime', 'CreateTime']) ? { createTime: field(record, ['createTime', 'CreateTime']) } : {}),
    ...(field(record, ['lastModifyTime', 'LastModifyTime', 'updateTime', 'UpdateTime']) ? { lastModifyTime: field(record, ['lastModifyTime', 'LastModifyTime', 'updateTime', 'UpdateTime']) } : {}),
    ...(quota ? { quota } : {})
  };
}

export async function listSlsProjects(
  options: SlsProjectQueryOptions = {},
  dependencies: SlsProjectQueryDependencies = {}
) {
  const auth = dependencies.auth || Config.requireAuth();
  const regionId = options.regionId?.trim() || auth.region;
  const limit = normalizeLimit(options.limit);
  const projectName = options.projectName?.trim() || undefined;
  const resourceGroupId = options.resourceGroupId?.trim() || undefined;
  const fetchQuota = Boolean(options.fetchQuota);
  const execute = dependencies.execute || executeAlicloudApi;
  const result = await execute('sls.ListProject', {
    offset: 0,
    size: limit,
    ...(projectName ? { projectName } : {}),
    ...(resourceGroupId ? { resourceGroupId } : {}),
    ...(fetchQuota ? { fetchQuota: true } : {})
  }, { region: regionId, auth });
  assertRunnerSuccess('sls.ListProject', result);
  const response = result.response;
  const rows = findArray(response, ['projects', 'Projects']).map(summarizeProject).filter((row): row is SlsProjectSummary => Boolean(row));
  const totalCount = findNumber(response, ['total', 'totalCount', 'Total']) ?? rows.length;
  return {
    stage: 'logs.projects',
    regionId,
    count: rows.length,
    totalCount,
    limit,
    truncated: totalCount > rows.length,
    filters: {
      ...(projectName ? { projectName } : {}),
      ...(resourceGroupId ? { resourceGroupId } : {}),
      ...(fetchQuota ? { fetchQuota: true } : {})
    },
    ...(result.requestId ? { requestId: result.requestId } : {}),
    projects: rows
  };
}

function summarizeLogstore(value: unknown): SlsLogstoreSummary | undefined {
  if (typeof value === 'string' && value.trim()) return { logstoreName: value.trim() };
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const logstoreName = field(record, ['logstoreName', 'LogstoreName', 'name', 'Name']);
  if (!logstoreName) return undefined;
  const ttl = numberField(record, ['ttl', 'TTL']);
  const shardCount = numberField(record, ['shardCount', 'ShardCount', 'shards']);
  const enableTracking = record.enableTracking ?? record.EnableTracking;
  return {
    logstoreName,
    ...(field(record, ['mode', 'Mode']) ? { mode: field(record, ['mode', 'Mode']) } : {}),
    ...(field(record, ['telemetryType', 'TelemetryType']) ? { telemetryType: field(record, ['telemetryType', 'TelemetryType']) } : {}),
    ...(ttl !== undefined ? { ttl } : {}),
    ...(shardCount !== undefined ? { shardCount } : {}),
    ...(typeof enableTracking === 'boolean' ? { enableTracking } : {})
  };
}

function summarizeIndex(response: unknown): SlsIndexSummary {
  const root = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const keys = root.keys && typeof root.keys === 'object' && !Array.isArray(root.keys)
    ? root.keys as Record<string, unknown>
    : {};
  const fields = Object.entries(keys).flatMap(([name, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const record = value as Record<string, unknown>;
    return [{
      name,
      ...(field(record, ['type', 'Type']) ? { type: field(record, ['type', 'Type']) } : {}),
      ...(field(record, ['alias', 'Alias']) ? { alias: field(record, ['alias', 'Alias']) } : {}),
      ...(booleanField(record, ['caseSensitive', 'CaseSensitive']) !== undefined ? { caseSensitive: booleanField(record, ['caseSensitive', 'CaseSensitive']) } : {}),
      ...(booleanField(record, ['chn', 'Chn']) !== undefined ? { chineseAnalyzer: booleanField(record, ['chn', 'Chn']) } : {}),
      ...(booleanField(record, ['doc_value', 'docValue', 'DocValue']) !== undefined ? { docValue: booleanField(record, ['doc_value', 'docValue', 'DocValue']) } : {}),
      ...(stringArrayField(record, ['token', 'Token']) ? { token: stringArrayField(record, ['token', 'Token']) } : {})
    } satisfies SlsIndexField];
  });
  const lineRecord = root.line && typeof root.line === 'object' && !Array.isArray(root.line)
    ? root.line as Record<string, unknown>
    : undefined;
  const line = lineRecord ? {
    ...(booleanField(lineRecord, ['caseSensitive', 'CaseSensitive']) !== undefined ? { caseSensitive: booleanField(lineRecord, ['caseSensitive', 'CaseSensitive']) } : {}),
    ...(booleanField(lineRecord, ['chn', 'Chn']) !== undefined ? { chineseAnalyzer: booleanField(lineRecord, ['chn', 'Chn']) } : {}),
    ...(stringArrayField(lineRecord, ['token', 'Token']) ? { token: stringArrayField(lineRecord, ['token', 'Token']) } : {})
  } : undefined;
  return {
    ...(field(root, ['index_mode', 'indexMode', 'IndexMode']) ? { indexMode: field(root, ['index_mode', 'indexMode', 'IndexMode']) } : {}),
    ...(field(root, ['storage', 'Storage']) ? { storage: field(root, ['storage', 'Storage']) } : {}),
    ...(numberField(root, ['ttl', 'TTL']) !== undefined ? { ttl: numberField(root, ['ttl', 'TTL']) } : {}),
    ...(numberField(root, ['lastModifyTime', 'LastModifyTime']) !== undefined ? { lastModifyTime: numberField(root, ['lastModifyTime', 'LastModifyTime']) } : {}),
    ...(numberField(root, ['lastUserModifyTime', 'LastUserModifyTime']) !== undefined ? { lastUserModifyTime: numberField(root, ['lastUserModifyTime', 'LastUserModifyTime']) } : {}),
    ...(line && Object.keys(line).length > 0 ? { line } : {}),
    fields
  };
}

export async function listSlsLogstores(
  options: SlsLogstoreQueryOptions,
  dependencies: SlsLogstoreQueryDependencies = {}
) {
  const auth = dependencies.auth || Config.requireAuth();
  const project = options.project.trim();
  if (!project) throw new Error('project 不能为空');
  const regionId = options.regionId?.trim() || auth.region;
  const limit = normalizeLimit(options.limit);
  const logstoreName = options.logstoreName?.trim() || undefined;
  const mode = options.mode?.trim() || undefined;
  const telemetryType = options.telemetryType?.trim() || undefined;
  const execute = dependencies.execute || executeAlicloudApi;
  const result = await execute('sls.ListLogStores', {
    project,
    offset: 0,
    size: limit,
    ...(logstoreName ? { logstoreName } : {}),
    ...(mode ? { mode } : {}),
    ...(telemetryType ? { telemetryType } : {})
  }, { region: regionId, auth });
  assertRunnerSuccess('sls.ListLogStores', result);
  const response = result.response;
  const rows = findArray(response, ['logstores', 'Logstores']).map(summarizeLogstore).filter((row): row is SlsLogstoreSummary => Boolean(row));
  const totalCount = findNumber(response, ['total', 'totalCount', 'Total']) ?? rows.length;
  return {
    stage: 'logs.logstores',
    regionId,
    project,
    count: rows.length,
    totalCount,
    limit,
    truncated: totalCount > rows.length,
    filters: {
      ...(logstoreName ? { logstoreName } : {}),
      ...(mode ? { mode } : {}),
      ...(telemetryType ? { telemetryType } : {})
    },
    ...(result.requestId ? { requestId: result.requestId } : {}),
    logstores: rows
  };
}

export async function getSlsIndex(
  options: SlsIndexQueryOptions,
  dependencies: SlsIndexQueryDependencies = {}
) {
  const auth = dependencies.auth || Config.requireAuth();
  const project = options.project.trim();
  const logstore = options.logstore.trim();
  if (!project) throw new Error('project 不能为空');
  if (!logstore) throw new Error('logstore 不能为空');
  const regionId = options.regionId?.trim() || auth.region;
  const execute = dependencies.execute || executeAlicloudApi;
  const result = await execute('sls.GetIndex', { project, logstore }, { region: regionId, auth });
  assertRunnerSuccess('sls.GetIndex', result);
  return {
    stage: 'logs.index',
    regionId,
    project,
    logstore,
    ...(result.requestId ? { requestId: result.requestId } : {}),
    index: summarizeIndex(result.response)
  };
}
