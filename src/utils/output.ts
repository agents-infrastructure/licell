import {
  isAccessDeniedError,
  isAuthCredentialInvalidError,
  isConflictError,
  isInstanceClassError,
  isNotFoundError,
  isTransientError
} from './alicloud-error';
import { formatErrorMessage } from './errors';
import { inferCommandTaskPhaseFromText, type CommandTaskEntryPhase } from './command-tasks';
import type { ResolvedCommandNextAction } from './command-next-actions';
import { getInvocationRegionId, isRegionalInvocation } from './region-context';

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
export const LICELL_CLI_RECORD_KIND = 'licell-cli-record' as const;
export const LICELL_CLI_RECORD_SCHEMA_VERSION = '1.0' as const;
export type CliEventStatus = 'start' | 'ok' | 'failed' | 'skipped' | 'info';
export type CliEventSource = 'command' | 'console' | 'stream';

export interface CliErrorRemediationItem {
  type: string;
  title: string;
  reason: string;
  commandTemplate: string;
  commandKey: string | null;
  commandDescription: string | null;
  phase: CommandTaskEntryPhase;
  priority: 'primary' | 'secondary';
  order: number;
}

export type CliErrorCommandIntent =
  | 'inspect'
  | 'verify'
  | 'login'
  | 'restore'
  | 'repair'
  | 'configure'
  | 'deploy'
  | 'bind'
  | 'release';

export interface CliErrorNextCommand {
  commandTemplate: string;
  commandKey: string | null;
  description: string | null;
  intent: CliErrorCommandIntent;
  priority: 'primary' | 'secondary';
}

export interface CliEventRecordInput {
  stage: string;
  action?: string;
  status: CliEventStatus;
  message?: string;
  data?: Record<string, unknown>;
  source?: CliEventSource;
}

export interface EmitCommandEventOptions {
  command?: string;
  stage?: string;
  action?: string;
  status: CliEventStatus;
  message?: string;
  data?: Record<string, unknown>;
  source?: CliEventSource;
}

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
const UI_CHROME_PREFIX_RE = /^(?:[┌└│◇◆◼◻▲▼◉◎◐◓◑◒]\s*)+/;

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

function buildCliRecordEnvelope(type: 'event' | 'result' | 'error', record: Record<string, unknown>) {
  return {
    ...record,
    kind: LICELL_CLI_RECORD_KIND,
    schemaVersion: LICELL_CLI_RECORD_SCHEMA_VERSION,
    type,
    ts: new Date().toISOString(),
    command: outputContext.command
  };
}

function sanitizeCode(raw: string) {
  const normalized = raw.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized.length > 0 ? normalized.toUpperCase() : 'UNKNOWN';
}

function normalizeCliEventAction(action: string | undefined) {
  const trimmed = (action || '').trim();
  if (!trimmed) return 'run';
  const normalized = trimmed
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalized || 'run';
}

function inferCommandEventAction(command = outputContext.command) {
  const tokens = command.trim().split(/\s+/).filter(Boolean);
  return tokens[tokens.length - 1] || 'run';
}

function isTerminalCliEventStatus(status: CliEventStatus) {
  return status === 'ok' || status === 'failed' || status === 'skipped';
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

function extractErrorSuggestions(details?: Record<string, unknown>) {
  if (!details) return [] as string[];
  if (!Array.isArray(details.suggestions)) return [] as string[];
  return details.suggestions
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
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

interface CliErrorGuidanceSeed {
  type: string;
  title: string;
  reason: string;
  commandTemplate: string;
  phase?: CommandTaskEntryPhase;
}

interface CliErrorGuidanceCommand {
  title: string;
  description: string;
  commandTemplate: string;
  commandKey: string | null;
  commandDescription: string | null;
  phase: CommandTaskEntryPhase;
  intent: CliErrorCommandIntent;
  priority: 'primary' | 'secondary';
  order: number;
}

function inferErrorCommandKey(commandTemplate: string) {
  const trimmed = commandTemplate.trim();
  if (!trimmed.startsWith('licell ')) return null;

  const tokens = trimmed.split(/\s+/).slice(1);
  const commandTokens: string[] = [];
  for (const token of tokens) {
    if (token === '--' || token.startsWith('-')) break;
    if ((token.startsWith('<') && token.endsWith('>')) || (token.startsWith('[') && token.endsWith(']'))) break;
    if (!/^[a-z][a-z0-9-]*$/i.test(token)) break;
    if (token.includes('.')) break;
    commandTokens.push(token);
  }

  return commandTokens.length > 0 ? commandTokens.join(' ') : null;
}

function inferCliErrorCommandIntent(commandTemplate: string, commandKey: string | null): CliErrorCommandIntent {
  const key = (commandKey || '').trim();
  if (key === 'login') return 'login';
  if (key === 'auth restore') return 'restore';
  if (key === 'auth repair') return 'repair';
  if (key === 'doctor' || key === 'deploy check') return 'verify';
  if (
    key === 'whoami'
    || key === 'help'
    || key.endsWith(' list')
    || key.endsWith(' info')
    || key === 'fn logs'
    || key === 'logs query'
    || key === 'logs tail'
    || key === 'deploy spec'
    || key.startsWith('dns records list')
  ) {
    return 'inspect';
  }
  if (
    key === 'init'
    || key === 'switch'
    || key.startsWith('config ')
    || key.startsWith('env set')
  ) {
    return 'configure';
  }
  if (key.startsWith('domain ') || key.startsWith('fn domain ') || key.startsWith('oss domain ')) {
    return 'bind';
  }
  if (key.startsWith('release ')) return 'release';
  if (key === 'deploy' || key.startsWith('oss upload') || key.startsWith('oss sync up')) return 'deploy';
  return commandTemplate.includes('doctor') ? 'verify' : 'inspect';
}

function buildCliErrorGuidanceCommands(tips: CliErrorGuidanceSeed[]) {
  const results: CliErrorGuidanceCommand[] = [];
  const seen = new Set<string>();

  for (const tip of tips) {
    const commandTemplate = tip.commandTemplate.trim();
    if (!commandTemplate) continue;
    if (seen.has(commandTemplate)) continue;
    seen.add(commandTemplate);

    const commandKey = inferErrorCommandKey(commandTemplate);
    const intent = inferCliErrorCommandIntent(commandTemplate, commandKey);
    results.push({
      title: tip.title,
      description: tip.reason,
      commandTemplate,
      commandKey,
      commandDescription: null,
      phase: tip.phase || inferCommandTaskPhaseFromText([commandKey, commandTemplate, tip.title, tip.reason].filter(Boolean).join(' ')) || 'general',
      intent,
      priority: results.length === 0 ? 'primary' : 'secondary',
      order: results.length + 1
    });
  }

  return results;
}

function buildCliErrorNextCommands(items: CliErrorGuidanceCommand[]) {
  return items.map((item) => ({
    commandTemplate: item.commandTemplate,
    commandKey: item.commandKey,
    description: item.commandDescription,
    intent: item.intent,
    priority: item.priority
  })) satisfies CliErrorNextCommand[];
}

function buildCliErrorNextActions(items: CliErrorGuidanceCommand[]) {
  return items.map((item) => ({
    title: item.title,
    description: item.description,
    commandTemplate: item.commandTemplate,
    commandKey: item.commandKey,
    commandDescription: item.commandDescription,
    phase: item.phase,
    priority: item.priority,
    order: item.order,
    source: 'error-remediation'
  })) satisfies ResolvedCommandNextAction[];
}

function buildCliErrorGuidance(
  message: string,
  category: CliErrorCategory,
  err: unknown,
  details?: Record<string, unknown>
) {
  const tips: CliErrorGuidanceSeed[] = [];
  const usage = parseMissingArgsUsage(message);
  const rawCode = extractErrorCode(err);
  const lower = message.toLowerCase();
  const suggestions = extractErrorSuggestions(details);
  if (usage) {
    tips.push({
      type: 'fix_input',
      title: '补齐必填参数',
      reason: 'missing required args',
      commandTemplate: `licell ${usage}`,
      phase: 'mutate'
    });
  }
  if (rawCode === 'DEPLOY_PRECHECK_FAILED') {
    const details = extractErrorDetails(err);
    const runtime = toOptionalString(details?.runtime) || '<runtime>';
    const entry = toOptionalString(details?.entry);
    tips.push({
      type: 'read_spec',
      title: '先看 runtime 规格',
      reason: 'runtime contract must be satisfied before deploy',
      commandTemplate: `licell deploy spec ${runtime}`,
      phase: 'inspect'
    });
    tips.push({
      type: 'run_precheck',
      title: '复跑本地预检',
      reason: 'validate entry and handler contract locally',
      commandTemplate: entry
        ? `licell deploy check --runtime ${runtime} --entry ${entry}`
        : `licell deploy check --runtime ${runtime}`,
      phase: 'verify'
    });
  }
  if (category === 'input' && !usage && rawCode !== 'DEPLOY_PRECHECK_FAILED') {
    const isUnknownCommand = lower.includes('unknown command') || lower.includes('未知命令');
    const helpTarget = isUnknownCommand
      ? (suggestions[0] ? `licell ${suggestions[0]} --help` : 'licell --help')
      : `licell ${outputContext.command} --help`.trim();
    tips.push({
      type: 'fix_input',
      title: '先看命令帮助',
      reason: 'invalid or missing CLI arguments',
      commandTemplate: helpTarget,
      phase: 'inspect'
    });
  }
  if (category === 'auth') {
    const missingCredential = lower.includes('未登录') || lower.includes('please login');
    if (missingCredential || isAuthCredentialInvalidError(err)) {
      tips.push({
        type: 'login',
        title: '重新登录',
        reason: missingCredential ? 'no active credential' : 'credential is invalid or expired',
        commandTemplate: 'licell login',
        phase: 'mutate'
      });
      tips.push({
        type: 'restore_auth',
        title: '恢复团队授权包',
        reason: 'reuse a team-issued restore token instead of re-entering credentials',
        commandTemplate: 'licell auth restore <token> [passkey]',
        phase: 'mutate'
      });
    } else {
      tips.push({
        type: 'repair_auth',
        title: '修复授权状态',
        reason: 'credentials missing/invalid or insufficient permissions',
        commandTemplate: 'licell auth repair --account-id <id> --ak <super-ak> --sk <super-sk>',
        phase: 'mutate'
      });
      tips.push({
        type: 'login',
        title: '重新登录',
        reason: 'refresh the saved credential locally',
        commandTemplate: 'licell login',
        phase: 'mutate'
      });
    }
  }
  if (category === 'permission') {
    tips.push({
      type: 'repair_auth',
      title: '修复授权状态',
      reason: 'credentials missing/invalid or insufficient permissions',
      commandTemplate: 'licell auth repair --account-id <id> --ak <super-ak> --sk <super-sk>',
      phase: 'mutate'
    });
  }
  if (category === 'network') {
    tips.push({
      type: 'retry',
      title: '重试当前命令',
      reason: 'transient network/provider issue',
      commandTemplate: `licell ${outputContext.command}`.trim(),
      phase: 'verify'
    });
  }

  const commands = buildCliErrorGuidanceCommands(tips);
  const nextCommands = buildCliErrorNextCommands(commands);
  const nextActions = buildCliErrorNextActions(commands);

  const actionByCommandTemplate = new Map(nextActions.map((action) => [action.commandTemplate, action] as const));
  const remediation: CliErrorRemediationItem[] = tips.map((tip, index) => {
    const action = actionByCommandTemplate.get(tip.commandTemplate);
    return {
      type: tip.type,
      title: tip.title,
      reason: tip.reason,
      commandTemplate: tip.commandTemplate,
      commandKey: action?.commandKey || null,
      commandDescription: action?.commandDescription || null,
      phase: action?.phase || tip.phase || 'general',
      priority: action?.priority || (index === 0 ? 'primary' : 'secondary'),
      order: action?.order || (index + 1)
    };
  });

  return {
    remediation,
    nextCommands,
    nextActions
  };
}

export function emitCliEvent(event: CliEventRecordInput) {
  if (!isJsonOutput()) return;
  const action = normalizeCliEventAction(event.action);
  const source = event.source || (action === 'stdout' || action === 'stderr' ? 'stream' : 'command');
  const terminal = isTerminalCliEventStatus(event.status);
  const data = event.data
    ? { ...event.data }
    : ((action === 'stdout' || action === 'stderr') ? {} : undefined);
  if ((action === 'stdout' || action === 'stderr') && data && typeof data.stream !== 'string') {
    data.stream = action;
  }

  writeJsonRecord(buildCliRecordEnvelope('event', {
    stage: event.stage,
    action,
    status: event.status,
    source,
    terminal,
    ...(event.status === 'ok' ? { ok: true } : {}),
    ...(event.status === 'failed' ? { ok: false } : {}),
    ...(event.message ? { message: event.message } : {}),
    ...(data && Object.keys(data).length > 0 ? { data } : {})
  }));
}

export function emitCommandEvent(options: EmitCommandEventOptions) {
  const command = options.command || outputContext.command;
  emitCliEvent({
    stage: options.stage || commandStage(command),
    action: options.action || inferCommandEventAction(command),
    status: options.status,
    ...(options.message ? { message: options.message } : {}),
    ...(options.data ? { data: options.data } : {}),
    ...(options.source ? { source: options.source } : {})
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
        source: 'console',
        data: { level: action }
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

export function emitCliResult<T extends object>(result: T) {
  if (!isJsonOutput()) return;
  outputContext.resultEmitted = true;
  writeJsonRecord(buildCliRecordEnvelope('result', {
    ...(result as Record<string, unknown>),
    ok: true
  }));
}

export function commandStage(command = outputContext.command) {
  const normalized = command.trim().split(/\s+/).filter(Boolean).join('.');
  return normalized || 'runtime';
}

const AUTO_COMMAND_OUTCOME_KEYS = new Set([
  'created',
  'updated',
  'removed',
  'deleted',
  'bound',
  'unbound',
  'promoted',
  'rolledBack',
  'connected',
  'cleared'
]);

const COMMAND_OUTCOME_BY_VERB: Record<string, string> = {
  add: 'created',
  create: 'created',
  set: 'updated',
  update: 'updated',
  bind: 'bound',
  unbind: 'unbound',
  rm: 'removed',
  remove: 'removed',
  delete: 'deleted',
  promote: 'promoted',
  rollback: 'rolledBack',
  connect: 'connected',
  clear: 'cleared',
  logout: 'cleared'
};

function hasExplicitOutcome(payload: Record<string, unknown>) {
  return Object.keys(payload).some((key) => AUTO_COMMAND_OUTCOME_KEYS.has(key));
}

function inferCommandOutcomeKey(command = outputContext.command) {
  const tokens = command.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;
  return COMMAND_OUTCOME_BY_VERB[tokens[tokens.length - 1]!] || undefined;
}

export interface EmitCommandResultOptions {
  command?: string;
  stage?: string;
  inferOutcome?: boolean;
}

function normalizeEmitCommandResultOptions(
  options?: string | EmitCommandResultOptions
): Required<Pick<EmitCommandResultOptions, 'inferOutcome'>> & Omit<EmitCommandResultOptions, 'inferOutcome'> {
  if (typeof options === 'string') {
    return {
      command: options,
      stage: undefined,
      inferOutcome: true
    };
  }

  return {
    command: options?.command,
    stage: options?.stage,
    inferOutcome: options?.inferOutcome !== false
  };
}

export function emitCommandResult<T extends object>(result: T, options?: string | EmitCommandResultOptions) {
  const normalized = normalizeEmitCommandResultOptions(options);
  const command = normalized.command || outputContext.command;
  const { stage, ...payload } = result as Record<string, unknown>;
  const callRegionId = isRegionalInvocation() ? getInvocationRegionId() : undefined;
  const regionalPayload = callRegionId && payload.callRegionId === undefined
    ? { ...payload, callRegionId }
    : payload;
  const inferredOutcomeKey = normalized.inferOutcome ? inferCommandOutcomeKey(command) : undefined;
  const finalPayload = inferredOutcomeKey && !hasExplicitOutcome(regionalPayload)
    ? { ...regionalPayload, [inferredOutcomeKey]: true }
    : regionalPayload;

  emitCliResult({
    stage: typeof stage === 'string' && stage.trim().length > 0
      ? stage
      : (normalized.stage && normalized.stage.trim().length > 0 ? normalized.stage : commandStage(command)),
    ...finalPayload
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
  const contextDetails = context?.details && Object.keys(context.details).length > 0 ? context.details : undefined;
  const guidance = buildCliErrorGuidance(message, category, err, contextDetails);
  const record: Record<string, unknown> = {
    kind: LICELL_CLI_RECORD_KIND,
    schemaVersion: LICELL_CLI_RECORD_SCHEMA_VERSION,
    type: 'error',
    ok: false,
    ts: new Date().toISOString(),
    command: context?.command || outputContext.command,
    stage: context?.stage || 'runtime',
    error: {
      code,
      category,
      message,
      retryable
    },
    remediation: guidance.remediation,
    nextCommands: guidance.nextCommands,
    nextActions: guidance.nextActions
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

export function sanitizeCapturedCliOutput(text: string) {
  const lines = text
    .replace(ANSI_ESCAPE_RE, '\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(UI_CHROME_PREFIX_RE, '').trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith(LICELL_JSON_PREFIX))
    .filter((line) => !line.startsWith('正在'));

  return [...new Set(lines)].join('\n');
}
