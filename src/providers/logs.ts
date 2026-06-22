import SLS, * as $SLS from '@alicloud/sls20201230';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config, type AuthConfig } from '../utils/config';
import pc from 'picocolors';
import { sleep } from '../utils/runtime';
import { resolveSdkCtor } from '../utils/sdk';
import { formatErrorMessage } from '../utils/errors';
import { isConflictError, isNotFoundError, isTransientError } from '../utils/alicloud-error';
import { getFunctionInfo } from './fc/function-ops';

const SlsClientCtor = resolveSdkCtor<SLS>(SLS, '@alicloud/sls20201230');
const DEFAULT_FC_LOGSTORE = 'function-log';
const DEFAULT_SERVERLESS_LOGSTORE = 'default-logs';
const DEFAULT_FC_LOGSTORE_CANDIDATES = [DEFAULT_SERVERLESS_LOGSTORE, DEFAULT_FC_LOGSTORE] as const;
const DEFAULT_LINE_LIMIT = 1000;
const DEFAULT_ONCE_WINDOW_SECONDS = 120;
const DEFAULT_STREAM_LOOKBACK_SECONDS = 60;
const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_SLS_CONNECT_TIMEOUT_MS = 15_000;
const DEFAULT_SLS_READ_TIMEOUT_MS = 180_000;
const MAX_SLS_PROJECT_PAGES = 5;
const SLS_PROJECT_PAGE_SIZE = 100;
const DEFAULT_SLS_INDEX_TOKENS = [',', ' ', "'", '"', ';', '=', '(', ')', '[', ']', '{', '}', '?', '@', '&', '<', '>', '/', ':', '\n', '\t'] as const;
const defaultFcSlsTargetCache = new Map<string, Promise<SlsTailTarget[]>>();

export function sanitizeQueryValue(value: string): string {
  return value.replace(/['"\\*?:|\[\]{}()&!^~]/g, '');
}

interface LogEntry {
  __time__?: string;
  __source__?: string;
  message?: string;
  content?: string;
  [key: string]: unknown;
}

export interface TailLogsOptions {
  once?: boolean;
  windowSeconds?: number;
  lineLimit?: number;
  silent?: boolean;
}

export interface SlsTailOptions {
  project?: string;
  logstore?: string;
  region?: string;
  topic?: string;
  query?: string;
  functionName?: string;
  once?: boolean;
  from?: number;
  to?: number;
  sinceSeconds?: number;
  windowSeconds?: number;
  lineLimit?: number;
  reverse?: boolean;
  powerSql?: boolean;
  pollIntervalMs?: number;
  ignoreMissingTarget?: boolean;
  silent?: boolean;
}

export interface SlsTailTarget {
  region: string;
  project: string;
  logstore: string;
  topic?: string;
}

export interface FcDefaultLogConfig {
  project: string;
  logstore: string;
  enableRequestMetrics: boolean;
  enableInstanceMetrics: boolean;
}

export interface SlsResolvedTimeRange {
  from: number;
  to: number;
}

export interface SlsTailOnceResult {
  mode: 'once';
  target: SlsTailTarget;
  query: string;
  from: number;
  to: number;
  logs: LogEntry[];
  lines: string[];
}

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || !value || value <= 0) return fallback;
  return Math.floor(value);
}

function normalizeNonNegativeInteger(value: number | undefined) {
  if (!Number.isFinite(value) || value === undefined || value < 0) return undefined;
  return Math.floor(value);
}

function extractLatestLogTime(logs: LogEntry[], fallback: number) {
  return logs.reduce((latest, log) => {
    const logTime = parseInt(log.__time__ || '', 10);
    return Number.isFinite(logTime) && logTime > latest ? logTime : latest;
  }, fallback);
}

function shouldIgnoreLogsBootstrapError(err: unknown) {
  const message = formatErrorMessage(err).toLowerCase();
  return message.includes('projectnotexist') || message.includes('logstorenotexist');
}

function isInvalidLogStoreIndexConfigError(err: unknown) {
  const error = err as {
    code?: unknown;
    data?: { Code?: unknown; code?: unknown };
  };
  const code = String(error.code || error.data?.Code || error.data?.code || '').toLowerCase();
  const message = formatErrorMessage(err).toLowerCase();
  return code === 'invalidlogstoreindexconfig'
    || message.includes('invalidlogstoreindexconfig')
    || message.includes('logstore config is invalid');
}

export function resolveLegacyFcSlsProject(auth: Pick<AuthConfig, 'accountId' | 'region'>) {
  return `aliyun-fc-${auth.region}-${auth.accountId}`;
}

export function resolveDefaultFcSlsProject(auth: Pick<AuthConfig, 'accountId' | 'region'>) {
  return resolveLegacyFcSlsProject(auth);
}

function makeSlsTarget(region: string, project: string, logstore: string, topic?: string): SlsTailTarget {
  return { region, project, logstore, ...(topic ? { topic } : {}) };
}

function dedupeSlsTargets(targets: SlsTailTarget[]) {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.region}|${target.project}|${target.logstore}|${target.topic || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isFcProjectName(projectName: string, region: string) {
  return projectName.startsWith(`serverless-${region}-`) || projectName.startsWith(`aliyun-fc-${region}-`);
}

function rankFcProjectName(projectName: string) {
  if (projectName.startsWith('serverless-')) return 0;
  if (projectName.startsWith('aliyun-fc-')) return 1;
  return 9;
}

function rankFcLogstoreName(logstore: string) {
  if (logstore === DEFAULT_SERVERLESS_LOGSTORE) return 0;
  if (logstore === DEFAULT_FC_LOGSTORE) return 1;
  return 9;
}

function defaultLogstoreForProject(project: string | undefined) {
  if (!project) return DEFAULT_FC_LOGSTORE;
  if (project.startsWith('serverless-')) return DEFAULT_SERVERLESS_LOGSTORE;
  return DEFAULT_FC_LOGSTORE;
}

async function listProjectLogstores(client: SLS, project: string) {
  const response = await client.listLogStores(project, new $SLS.ListLogStoresRequest({
    offset: 0,
    size: 100
  }));
  return (response.body?.logstores || []).map(String);
}

export async function discoverDefaultFcSlsTargets(
  auth: Pick<AuthConfig, 'accountId' | 'ak' | 'sk' | 'region'>,
  region = auth.region
): Promise<SlsTailTarget[]> {
  const cacheKey = `${auth.accountId}:${region}`;
  const cached = defaultFcSlsTargetCache.get(cacheKey);
  if (cached) return cached;

  const pending = (async () => {
    const client = createSlsClient(auth, region);
    const discovered: SlsTailTarget[] = [];

    try {
      for (let page = 0; page < MAX_SLS_PROJECT_PAGES; page += 1) {
        const offset = page * SLS_PROJECT_PAGE_SIZE;
        const response = await client.listProject('', new $SLS.ListProjectRequest({
          offset,
          size: SLS_PROJECT_PAGE_SIZE
        }));
        const projects = (response.body?.projects || [])
          .map((project) => toOptionalString((project as { projectName?: unknown }).projectName))
          .filter((projectName): projectName is string => Boolean(projectName))
          .filter((projectName) => isFcProjectName(projectName, region));

        for (const projectName of projects) {
          try {
            const logstores = await listProjectLogstores(client, projectName);
            const preferred = logstores.filter((logstore) => DEFAULT_FC_LOGSTORE_CANDIDATES.includes(logstore as typeof DEFAULT_FC_LOGSTORE_CANDIDATES[number]));
            if (preferred.length > 0) {
              for (const logstore of preferred) {
                discovered.push(makeSlsTarget(region, projectName, logstore));
              }
            } else if (logstores.length > 0) {
              discovered.push(makeSlsTarget(region, projectName, logstores[0]));
            }
          } catch {
            /* listing logstores may fail for a project; keep probing other candidates */
          }
        }

        const count = Number(response.body?.count || projects.length || 0);
        const total = Number(response.body?.total || 0);
        if (count <= 0 || (total > 0 && offset + count >= total)) break;
        if (projects.length === 0 && count < SLS_PROJECT_PAGE_SIZE) break;
      }
    } catch {
      /* discovery falls back to legacy guessed target below when project listing is unavailable */
    }

    const fallbackTargets: SlsTailTarget[] = [
      makeSlsTarget(region, resolveLegacyFcSlsProject({ accountId: auth.accountId, region }), DEFAULT_FC_LOGSTORE)
    ];

    return dedupeSlsTargets([...discovered, ...fallbackTargets]).sort((left, right) => {
      const projectDelta = rankFcProjectName(left.project) - rankFcProjectName(right.project);
      if (projectDelta !== 0) return projectDelta;
      const logstoreDelta = rankFcLogstoreName(left.logstore) - rankFcLogstoreName(right.logstore);
      if (logstoreDelta !== 0) return logstoreDelta;
      return left.project.localeCompare(right.project);
    });
  })();

  defaultFcSlsTargetCache.set(cacheKey, pending);
  return pending;
}

export function appendSlsSearchCondition(query: string | undefined, condition: string) {
  const normalizedCondition = toOptionalString(condition);
  if (!normalizedCondition) return toOptionalString(query) || '*';

  const normalizedQuery = toOptionalString(query);
  if (!normalizedQuery || normalizedQuery === '*') {
    return normalizedCondition;
  }

  const pipelineIndex = normalizedQuery.indexOf('|');
  const searchPart = (pipelineIndex >= 0 ? normalizedQuery.slice(0, pipelineIndex) : normalizedQuery).trim();
  const pipelinePart = pipelineIndex >= 0 ? normalizedQuery.slice(pipelineIndex).trimStart() : '';
  const combinedSearch = !searchPart || searchPart === '*'
    ? normalizedCondition
    : `${searchPart} and ${normalizedCondition}`;
  return pipelinePart ? `${combinedSearch} ${pipelinePart}` : combinedSearch;
}

export function buildFunctionLogQuery(functionName: string | undefined, query?: string) {
  const normalizedFunctionName = toOptionalString(functionName);
  if (!normalizedFunctionName) return toOptionalString(query) || '*';
  const safeName = sanitizeQueryValue(normalizedFunctionName);
  return appendSlsSearchCondition(query, `functionName: "${safeName}"`);
}

export function resolveSlsTimeRange(
  options: Pick<SlsTailOptions, 'once' | 'from' | 'to' | 'sinceSeconds' | 'windowSeconds'>,
  nowSeconds = Math.floor(Date.now() / 1000)
): SlsResolvedTimeRange {
  const now = normalizePositiveInteger(nowSeconds, Math.floor(Date.now() / 1000));
  const explicitTo = normalizePositiveInteger(options.to, now) || now;
  const explicitFrom = normalizeNonNegativeInteger(options.from);
  const lookback = normalizePositiveInteger(
    options.sinceSeconds ?? options.windowSeconds,
    options.once ? DEFAULT_ONCE_WINDOW_SECONDS : DEFAULT_STREAM_LOOKBACK_SECONDS
  );

  if (explicitFrom !== undefined) {
    return {
      from: Math.min(explicitFrom, explicitTo),
      to: explicitTo
    };
  }

  return {
    from: Math.max(0, explicitTo - lookback),
    to: explicitTo
  };
}

export function resolveSlsTailTarget(
  auth: Pick<AuthConfig, 'accountId' | 'region'>,
  options: Pick<SlsTailOptions, 'project' | 'logstore' | 'region' | 'topic'>
): SlsTailTarget {
  const region = toOptionalString(options.region) || auth.region;
  const project = toOptionalString(options.project) || resolveLegacyFcSlsProject({ accountId: auth.accountId, region });
  return {
    region,
    project,
    logstore: toOptionalString(options.logstore) || defaultLogstoreForProject(project),
    topic: toOptionalString(options.topic)
  };
}

async function resolveSlsTailTargets(
  auth: Pick<AuthConfig, 'accountId' | 'ak' | 'sk' | 'region'>,
  options: Pick<SlsTailOptions, 'project' | 'logstore' | 'region' | 'topic'>
) {
  const explicitProject = toOptionalString(options.project);
  const explicitLogstore = toOptionalString(options.logstore);
  if (explicitProject && explicitLogstore) {
    return [resolveSlsTailTarget(auth, options)];
  }

  const region = toOptionalString(options.region) || auth.region;
  const discovered = await discoverDefaultFcSlsTargets(auth, region);
  if (explicitProject && !explicitLogstore) {
    return [makeSlsTarget(region, explicitProject, defaultLogstoreForProject(explicitProject), toOptionalString(options.topic))];
  }
  if (!explicitProject && explicitLogstore) {
    return dedupeSlsTargets(discovered.map((target) => ({
      ...target,
      logstore: explicitLogstore,
      ...(toOptionalString(options.topic) ? { topic: toOptionalString(options.topic) } : {})
    })));
  }
  return discovered.map((target) => ({
    ...target,
    ...(toOptionalString(options.topic) ? { topic: toOptionalString(options.topic) } : {})
  }));
}

function renderLogEntries(logs: LogEntry[], seenLogs?: Set<string>, silent = false) {
  const rendered: string[] = [];
  logs
    .sort((a, b) => parseInt(a.__time__ || '0', 10) - parseInt(b.__time__ || '0', 10))
    .forEach((log) => {
      const logKey = `${log.__time__ || ''}|${log.__source__ || ''}|${log.message || log.content || ''}`;
      if (seenLogs?.has(logKey)) return;
      if (seenLogs) {
        seenLogs.add(logKey);
        if (seenLogs.size > 5000) {
          const entries = [...seenLogs];
          seenLogs.clear();
          for (const entry of entries.slice(-2500)) seenLogs.add(entry);
        }
      }

      const timeStr = new Date(parseInt(log.__time__ || '0', 10) * 1000).toLocaleTimeString();
      let formattedMsg = String(log.message || log.content || JSON.stringify(log)).trim();
      if (formattedMsg.toLowerCase().includes('error')) formattedMsg = pc.red(formattedMsg);
      const line = `${pc.gray(`[${timeStr}]`)} ${formattedMsg}`;
      rendered.push(line);
      if (!silent) {
        console.log(line);
      }
    });
  return rendered;
}

function createSlsClient(auth: Pick<AuthConfig, 'ak' | 'sk'>, region: string) {
  return new SlsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    endpoint: `${region}.log.aliyuncs.com`,
    connectTimeout: DEFAULT_SLS_CONNECT_TIMEOUT_MS,
    readTimeout: DEFAULT_SLS_READ_TIMEOUT_MS
  }));
}

async function createSlsProjectIfMissing(client: SLS, project: string) {
  try {
    await client.createProject(new $SLS.CreateProjectRequest({
      projectName: project,
      description: 'Licell default Function Compute logs'
    }));
  } catch (err: unknown) {
    if (isConflictError(err)) return;
    throw err;
  }
}

async function createSlsLogstoreIfMissing(client: SLS, project: string, logstore: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await client.createLogStore(project, new $SLS.CreateLogStoreRequest({
        logstoreName: logstore,
        ttl: 30,
        shardCount: 2,
        autoSplit: true,
        maxSplitShard: 16
      }));
      return;
    } catch (err: unknown) {
      if (isConflictError(err)) return;
      if ((isNotFoundError(err) || isTransientError(err)) && attempt < 2) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

function buildDefaultFcSlsIndexKeys() {
  const textField = new $SLS.KeysValue({
    type: 'text',
    token: [...DEFAULT_SLS_INDEX_TOKENS],
    caseSensitive: false,
    chn: false,
    docValue: true
  });
  const keywordField = new $SLS.KeysValue({
    type: 'text',
    token: [...DEFAULT_SLS_INDEX_TOKENS],
    caseSensitive: false,
    chn: false,
    docValue: true
  });
  return {
    functionName: keywordField,
    qualifier: keywordField,
    requestId: keywordField,
    level: keywordField,
    message: textField,
    content: textField
  };
}

function buildDefaultFcSlsIndexRequest() {
  return new $SLS.CreateIndexRequest({
    line: new $SLS.CreateIndexRequestLine({
      token: [...DEFAULT_SLS_INDEX_TOKENS],
      caseSensitive: false,
      chn: false
    }),
    keys: buildDefaultFcSlsIndexKeys()
  });
}

function buildDefaultFcSlsUpdateIndexRequest() {
  return new $SLS.UpdateIndexRequest({
    line: new $SLS.UpdateIndexRequestLine({
      token: [...DEFAULT_SLS_INDEX_TOKENS],
      caseSensitive: false,
      chn: false
    }),
    keys: buildDefaultFcSlsIndexKeys()
  });
}

async function createSlsIndexIfMissing(client: SLS, project: string, logstore: string) {
  try {
    await client.createIndex(project, logstore, buildDefaultFcSlsIndexRequest());
  } catch (err: unknown) {
    if (isConflictError(err)) {
      await client.updateIndex(project, logstore, buildDefaultFcSlsUpdateIndexRequest());
      return;
    }
    throw err;
  }
}

export async function ensureDefaultFcSlsLogConfig(
  auth: Pick<AuthConfig, 'accountId' | 'ak' | 'sk' | 'region'> = Config.requireAuth()
): Promise<FcDefaultLogConfig> {
  const region = auth.region;
  const project = resolveDefaultFcSlsProject({ accountId: auth.accountId, region });
  const logstore = DEFAULT_FC_LOGSTORE;
  const client = createSlsClient(auth, region);

  await createSlsProjectIfMissing(client, project);
  await createSlsLogstoreIfMissing(client, project, logstore);
  await createSlsIndexIfMissing(client, project, logstore);

  defaultFcSlsTargetCache.delete(`${auth.accountId}:${region}`);

  return {
    project,
    logstore,
    enableRequestMetrics: true,
    enableInstanceMetrics: true
  };
}

async function fetchSlsLogs(
  client: SLS,
  target: SlsTailTarget,
  options: Pick<SlsTailOptions, 'lineLimit' | 'reverse' | 'powerSql'> & { query: string; from: number; to: number }
) {
  const response = await client.getLogs(
    target.project,
    target.logstore,
    new $SLS.GetLogsRequest({
      from: options.from,
      to: options.to,
      query: options.query,
      topic: target.topic,
      line: normalizePositiveInteger(options.lineLimit, DEFAULT_LINE_LIMIT),
      reverse: Boolean(options.reverse),
      powerSql: Boolean(options.powerSql)
    })
  );
  return (response.body as LogEntry[] | undefined) || [];
}

async function resolveFunctionLogTarget(functionName: string): Promise<SlsTailTarget | undefined> {
  try {
    const fn = await getFunctionInfo(functionName);
    const logConfig = (fn as { logConfig?: { project?: unknown; logstore?: unknown } }).logConfig;
    const project = toOptionalString(logConfig?.project);
    const logstore = toOptionalString(logConfig?.logstore);
    if (!project || !logstore) return undefined;
    const auth = Config.requireAuth();
    return makeSlsTarget(auth.region, project, logstore);
  } catch {
    return undefined;
  }
}

export async function tailSlsLogs(options: SlsTailOptions = {}): Promise<SlsTailOnceResult | void> {
  const auth = Config.requireAuth();
  const targets = await resolveSlsTailTargets(auth, options);
  const target = targets[0] || resolveSlsTailTarget(auth, options);
  const query = buildFunctionLogQuery(options.functionName, options.query);
  const lineLimit = normalizePositiveInteger(options.lineLimit, DEFAULT_LINE_LIMIT);

  if (options.once) {
    const range = resolveSlsTimeRange(options);
    let firstEmptyResult: SlsTailOnceResult | undefined;
    let lastBootstrapError: unknown;

    for (const currentTarget of targets) {
      const currentClient = createSlsClient(auth, currentTarget.region);
      try {
        const fetchOptions = {
          from: range.from,
          to: range.to,
          query,
          lineLimit,
          reverse: options.reverse,
          powerSql: options.powerSql
        };
        let logs: LogEntry[];
        try {
          logs = await fetchSlsLogs(currentClient, currentTarget, fetchOptions);
        } catch (err: unknown) {
          if (!isInvalidLogStoreIndexConfigError(err)) {
            throw err;
          }
          await createSlsIndexIfMissing(currentClient, currentTarget.project, currentTarget.logstore);
          logs = await fetchSlsLogs(currentClient, currentTarget, fetchOptions);
        }
        if (logs.length === 0) {
          firstEmptyResult = firstEmptyResult || {
            mode: 'once',
            target: currentTarget,
            query,
            from: range.from,
            to: range.to,
            logs: [],
            lines: []
          };
          continue;
        }
        const lines = renderLogEntries(logs, undefined, Boolean(options.silent));
        return { mode: 'once', target: currentTarget, query, from: range.from, to: range.to, logs, lines };
      } catch (err: unknown) {
        if (shouldIgnoreLogsBootstrapError(err)) {
          lastBootstrapError = err;
          continue;
        }
        throw err;
      }
    }

    if (firstEmptyResult) {
      if (!options.silent) {
        console.log(pc.gray(`最近 ${Math.max(0, range.to - range.from)}s 无日志`));
      }
      return firstEmptyResult;
    }

    if (options.ignoreMissingTarget && lastBootstrapError) {
      if (!options.silent) {
        console.log(pc.yellow(`⚠️ 日志服务尚未就绪，已跳过: ${formatErrorMessage(lastBootstrapError)}`));
      }
      return { mode: 'once', target, query, from: range.from, to: range.to, logs: [], lines: [] };
    }

    if (lastBootstrapError) {
      throw lastBootstrapError;
    }
  }

  const slsClient = createSlsClient(auth, target.region);
  if (!options.silent) {
    const topicText = target.topic ? ` / topic=${pc.cyan(target.topic)}` : '';
    console.log(
      pc.gray(
        `\n📡 正在监听 SLS ${pc.cyan(target.project)}/${pc.cyan(target.logstore)}${topicText} 的实时日志流 (Ctrl+C 退出)...\n`
      )
    );
    console.log(pc.gray(`query: ${query}\n`));
  }

  let lastLogTime = resolveSlsTimeRange(options).from;
  const pollIntervalMs = normalizePositiveInteger(options.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS);
  const seenLogs = new Set<string>();
  let lastErrorAt = 0;
  let running = true;

  const shutdown = () => {
    running = false;
    if (!options.silent) {
      console.log(pc.gray('\n👋 日志流已断开'));
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    while (running) {
      try {
        const toTime = Math.floor(Date.now() / 1000);
        if (toTime <= lastLogTime) {
          await sleep(pollIntervalMs);
          continue;
        }
        const logs = await fetchSlsLogs(slsClient, target, {
          from: lastLogTime,
          to: toTime,
          query,
          lineLimit,
          reverse: options.reverse,
          powerSql: options.powerSql
        });
        renderLogEntries(logs, seenLogs, Boolean(options.silent));
        lastLogTime = extractLatestLogTime(logs, lastLogTime);
      } catch (err: unknown) {
        const now = Date.now();
        if (now - lastErrorAt > 10_000) {
          const message = formatErrorMessage(err);
          if (!options.silent) {
            console.log(pc.yellow(`⚠️ 日志拉取失败，10 秒后重试: ${message}`));
          }
          lastErrorAt = now;
        }
      }
      if (running) {
        await sleep(pollIntervalMs);
      }
    }
  } finally {
    process.off('SIGINT', shutdown);
    process.off('SIGTERM', shutdown);
  }
}

export async function tailLogs(appName: string, options: TailLogsOptions = {}) {
  const target = await resolveFunctionLogTarget(appName);
  return tailSlsLogs({
    project: target?.project,
    logstore: target?.logstore,
    region: target?.region,
    functionName: appName,
    once: options.once,
    windowSeconds: options.windowSeconds,
    lineLimit: options.lineLimit,
    silent: options.silent,
    ignoreMissingTarget: true
  });
}
