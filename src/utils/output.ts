import {
  isAccessDeniedError,
  isAuthCredentialInvalidError,
  isConflictError,
  isInstanceClassError,
  isNotFoundError,
  isTransientError
} from './alicloud-error';
import { formatErrorMessage } from './errors';

export type CliOutputMode = 'text' | 'json';
export type CliErrorCategory =
  | 'auth'
  | 'permission'
  | 'input'
  | 'network'
  | 'quota'
  | 'conflict'
  | 'not_found'
  | 'internal';

export const LICELL_JSON_PREFIX = '@@LICELL_JSON@@';
const SCHEMA_VERSION = '1.0';

interface OutputContext {
  mode: CliOutputMode;
  command: string;
  resultEmitted: boolean;
  errorEmitted: boolean;
}

const outputContext: OutputContext = {
  mode: 'text',
  command: '',
  resultEmitted: false,
  errorEmitted: false
};

let consoleBridgeInstalled = false;
let consoleBridgeActive = false;
const ANSI_ESCAPE_RE = /\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

function safeStringifyValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeConsoleMessage(args: unknown[]) {
  const text = args.map((part) => safeStringifyValue(part)).join(' ');
  return text.replace(ANSI_ESCAPE_RE, '').trim();
}

function isUiChromeLine(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return /^(┌|└|│|◇|◆|◼|◻|▲|▼|◉|◎)/.test(trimmed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeOutputMode(value: string): CliOutputMode {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'text') return 'text';
  if (normalized === 'json') return 'json';
  throw new Error('--output 仅支持 text 或 json');
}

function inferCommandFromArgv(argv: string[]) {
  const args = argv.slice(2);
  const commandTokens: string[] = [];
  for (const token of args) {
    if (token === '--') break;
    if (token.startsWith('-')) break;
    commandTokens.push(token);
    if (commandTokens.length >= 3) break;
  }
  if (commandTokens.length === 0) return 'help';
  return commandTokens.join(' ');
}

export function parseGlobalOutputModeArgv(argv: string[]) {
  const rewritten: string[] = [];
  let mode: CliOutputMode = 'text';
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (i < 2) {
      rewritten.push(token);
      continue;
    }
    if (token === '--') {
      rewritten.push(...argv.slice(i));
      break;
    }
    if (token === '--output') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        throw new Error('--output 需要指定 text 或 json');
      }
      mode = normalizeOutputMode(next);
      i += 1;
      continue;
    }
    if (token.startsWith('--output=')) {
      mode = normalizeOutputMode(token.slice('--output='.length));
      continue;
    }
    rewritten.push(token);
  }
  return {
    mode,
    argv: rewritten
  };
}

export function initOutputContext(mode: CliOutputMode, argv: string[]) {
  outputContext.mode = mode;
  outputContext.command = inferCommandFromArgv(argv);
  outputContext.resultEmitted = false;
  outputContext.errorEmitted = false;
}

export function getOutputMode() {
  return outputContext.mode;
}

export function isJsonOutput() {
  return outputContext.mode === 'json';
}

function writeJsonRecord(record: Record<string, unknown>) {
  process.stdout.write(`${LICELL_JSON_PREFIX}${JSON.stringify(record)}\n`);
}

function sanitizeCode(raw: string) {
  const normalized = raw.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized.length > 0 ? normalized.toUpperCase() : 'UNKNOWN';
}

function parseMissingArgsUsage(message: string) {
  const match = message.match(/missing required args for command `(.+?)`/);
  return match ? match[1] : undefined;
}

function extractErrorCode(err: unknown) {
  if (!isRecord(err)) return undefined;
  return toOptionalString(err.code);
}

function extractErrorDetails(err: unknown) {
  if (!isRecord(err)) return undefined;
  if (!isRecord(err.details)) return undefined;
  return { ...err.details };
}

function detectErrorCategory(message: string, err: unknown): CliErrorCategory {
  const lower = message.toLowerCase();
  const rawCode = extractErrorCode(err);
  if (rawCode === 'DEPLOY_PRECHECK_FAILED') return 'input';
  if (
    lower.includes('unknown command')
    || lower.includes('未知命令')
    || lower.includes('missing required args for command')
    || lower.includes('precheck')
    || lower.includes('预检')
    || lower.includes('缺少')
    || lower.includes('不能为空')
    || lower.includes('无效')
    || lower.includes('不支持')
    || lower.includes('invalid')
    || lower.includes('unsupported')
  ) {
    return 'input';
  }
  if (lower.includes('未登录') || lower.includes('please login') || isAuthCredentialInvalidError(err)) {
    return 'auth';
  }
  if (isAccessDeniedError(err)) return 'permission';
  if (isConflictError(err)) return 'conflict';
  if (isNotFoundError(err)) return 'not_found';
  if (isTransientError(err)) return 'network';
  if (isInstanceClassError(err)) return 'quota';
  return 'internal';
}

function detectErrorCode(message: string, err: unknown, category: CliErrorCategory) {
  const lower = message.toLowerCase();
  const rawCode = extractErrorCode(err);
  if (rawCode === 'DEPLOY_PRECHECK_FAILED') return 'CLI_DEPLOY_PRECHECK_FAILED';
  if (lower.includes('unknown command') || lower.includes('未知命令')) return 'CLI_UNKNOWN_COMMAND';
  if (lower.includes('missing required args for command')) return 'CLI_MISSING_REQUIRED_ARGS';
  if (category === 'auth') {
    if (isAuthCredentialInvalidError(err)) return 'AUTH_INVALID_CREDENTIAL';
    if (lower.includes('未登录') || lower.includes('please login')) return 'AUTH_MISSING_CREDENTIAL';
    return 'AUTH_ERROR';
  }
  if (category === 'permission') return 'AUTH_PERMISSION_DENIED';
  if (category === 'conflict') return 'RESOURCE_CONFLICT';
  if (category === 'not_found') return 'RESOURCE_NOT_FOUND';
  if (category === 'network') return 'PROVIDER_TRANSIENT';
  if (category === 'quota') return 'PROVIDER_QUOTA_OR_CLASS';
  if (category === 'input') return 'CLI_INVALID_INPUT';

  if (rawCode) {
    if (rawCode.startsWith('ALI_')) return rawCode;
    return `ALI_${sanitizeCode(rawCode)}`;
  }
  if (isRecord(err)) {
    const providerCode = toOptionalString(err.code);
    if (providerCode) return `ALI_${sanitizeCode(providerCode)}`;
  }
  return 'CLI_RUNTIME_ERROR';
}

function extractProviderContext(err: unknown) {
  if (!isRecord(err)) return undefined;
  const data = isRecord(err.data) ? err.data : {};
  const requestId = toOptionalString(err.requestId)
    || toOptionalString(data.RequestId)
    || toOptionalString(data.requestId);
  const httpStatus = toOptionalNumber(err.statusCode)
    || toOptionalNumber(err.status)
    || toOptionalNumber(data.statusCode);
  const providerCode = toOptionalString(err.code) || toOptionalString(data.Code);
  const endpoint = toOptionalString(err.endpoint)
    || toOptionalString(data.Endpoint)
    || toOptionalString(data.endpoint);
  const action = toOptionalString(data.Action)
    || toOptionalString(data.action)
    || toOptionalString(data.Api)
    || toOptionalString(data.api);
  const service = toOptionalString(err.service)
    || toOptionalString(data.Service)
    || toOptionalString(data.service);

  const hasProviderSignal = Boolean(
    requestId
    || httpStatus !== undefined
    || endpoint
    || action
    || service
  );
  if (!hasProviderSignal) return undefined;

  const provider: Record<string, unknown> = {};
  if (service) provider.service = service;
  if (action) provider.action = action;
  if (providerCode) provider.code = providerCode;
  if (requestId) provider.requestId = requestId;
  if (httpStatus !== undefined) provider.httpStatus = httpStatus;
  if (endpoint) provider.endpoint = endpoint;
  return Object.keys(provider).length > 0 ? provider : undefined;
}

function buildRemediation(message: string, category: CliErrorCategory, err: unknown) {
  const tips: Array<Record<string, string>> = [];
  const usage = parseMissingArgsUsage(message);
  const rawCode = extractErrorCode(err);
  if (usage) {
    tips.push({
      type: 'fix_input',
      reason: 'missing required args',
      commandTemplate: `licell ${usage}`
    });
  }
  if (rawCode === 'DEPLOY_PRECHECK_FAILED') {
    const details = extractErrorDetails(err);
    const runtime = toOptionalString(details?.runtime) || '<runtime>';
    const entry = toOptionalString(details?.entry);
    tips.push({
      type: 'read_spec',
      reason: 'runtime contract must be satisfied before deploy',
      commandTemplate: `licell deploy spec ${runtime}`
    });
    tips.push({
      type: 'run_precheck',
      reason: 'validate entry and handler contract locally',
      commandTemplate: entry
        ? `licell deploy check --runtime ${runtime} --entry ${entry}`
        : `licell deploy check --runtime ${runtime}`
    });
  }
  if (category === 'input' && !usage) {
    tips.push({
      type: 'fix_input',
      reason: 'invalid or missing CLI arguments',
      commandTemplate: `licell ${outputContext.command} --help`.trim()
    });
  }
  if (category === 'auth' || category === 'permission') {
    tips.push({
      type: 'repair_auth',
      reason: 'credentials missing/invalid or insufficient permissions',
      commandTemplate: 'licell auth repair --account-id <id> --ak <super-ak> --sk <super-sk>'
    });
    if (category === 'auth') {
      tips.push({
        type: 'login',
        reason: 'no active credential',
        commandTemplate: 'licell login'
      });
    }
  }
  if (category === 'network') {
    tips.push({
      type: 'retry',
      reason: 'transient network/provider issue',
      commandTemplate: `licell ${outputContext.command}`.trim()
    });
  }
  return tips;
}

export function emitCliEvent(event: {
  stage: string;
  action: string;
  status: 'start' | 'ok' | 'failed' | 'skipped' | 'info';
  message?: string;
  data?: Record<string, unknown>;
}) {
  if (!isJsonOutput()) return;
  writeJsonRecord({
    schemaVersion: SCHEMA_VERSION,
    type: 'event',
    ts: new Date().toISOString(),
    command: outputContext.command,
    ...event
  });
}

export function installJsonConsoleBridge() {
  if (!isJsonOutput()) return;
  if (consoleBridgeInstalled) return;
  consoleBridgeInstalled = true;

  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  const emitConsoleEvent = (
    action: 'log' | 'info' | 'warn' | 'error',
    args: unknown[]
  ) => {
    if (consoleBridgeActive) return;
    const message = normalizeConsoleMessage(args);
    if (!message || isUiChromeLine(message)) return;
    consoleBridgeActive = true;
    try {
      emitCliEvent({
        stage: action === 'warn' || action === 'error' ? 'stderr' : 'stdout',
        action,
        status: 'info',
        message,
        data: { source: 'console', level: action }
      });
    } finally {
      consoleBridgeActive = false;
    }
  };

  console.log = (...args: unknown[]) => {
    emitConsoleEvent('log', args);
  };
  console.info = (...args: unknown[]) => {
    emitConsoleEvent('info', args);
  };
  console.warn = (...args: unknown[]) => {
    emitConsoleEvent('warn', args);
  };
  console.error = (...args: unknown[]) => {
    emitConsoleEvent('error', args);
  };

  // Keep references alive for debuggability (and to avoid TS removing as unused).
  void original;
}

export function emitCliResult(result: Record<string, unknown>) {
  if (!isJsonOutput()) return;
  outputContext.resultEmitted = true;
  writeJsonRecord({
    schemaVersion: SCHEMA_VERSION,
    type: 'result',
    ts: new Date().toISOString(),
    command: outputContext.command,
    ok: true,
    ...result
  });
}

export function buildCliErrorRecord(
  err: unknown,
  context?: { stage?: string; command?: string; details?: Record<string, unknown> }
) {
  const message = formatErrorMessage(err);
  const category = detectErrorCategory(message, err);
  const code = detectErrorCode(message, err, category);
  const provider = extractProviderContext(err);
  const retryable = category === 'network';
  const record: Record<string, unknown> = {
    schemaVersion: SCHEMA_VERSION,
    type: 'error',
    ts: new Date().toISOString(),
    command: context?.command || outputContext.command,
    stage: context?.stage || 'runtime',
    error: {
      code,
      category,
      message,
      retryable
    },
    remediation: buildRemediation(message, category, err)
  };
  if (provider) record.provider = provider;
  const mergedDetails: Record<string, unknown> = {};
  const errorDetails = extractErrorDetails(err);
  if (errorDetails) {
    Object.assign(mergedDetails, errorDetails);
  }
  if (context?.details && Object.keys(context.details).length > 0) {
    Object.assign(mergedDetails, context.details);
  }
  if (Object.keys(mergedDetails).length > 0) {
    record.details = mergedDetails;
  }
  return record;
}

export function emitCliError(
  err: unknown,
  context?: { stage?: string; command?: string; details?: Record<string, unknown> }
) {
  if (!isJsonOutput()) return;
  outputContext.errorEmitted = true;
  writeJsonRecord(buildCliErrorRecord(err, context));
}

export function hasEmittedCliResult() {
  return outputContext.resultEmitted;
}

export function hasEmittedCliError() {
  return outputContext.errorEmitted;
}

export function extractJsonRecordsFromOutput(text: string) {
  const records: unknown[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith(LICELL_JSON_PREFIX)) continue;
    const payload = line.slice(LICELL_JSON_PREFIX.length);
    if (!payload) continue;
    try {
      records.push(JSON.parse(payload));
    } catch {
      // ignore malformed records
    }
  }
  return records;
}
