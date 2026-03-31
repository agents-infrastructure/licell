import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { tailSlsLogs } from '../providers/logs';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  isInteractiveTTY,
  normalizeRegion,
  parseOptionalPositiveInt,
  showIntro,
  toOptionalString
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { DELIVERY_SECTION } from './sections';

interface LogsCommonCommandOptions {
  project?: unknown;
  store?: unknown;
  region?: unknown;
  topic?: unknown;
  from?: unknown;
  since?: unknown;
  window?: unknown;
  lines?: unknown;
  powerSql?: unknown;
  query?: unknown;
}

interface LogsQueryCommandOptions extends LogsCommonCommandOptions {
  to?: unknown;
  reverse?: unknown;
}

interface LogsTailCommandOptions extends LogsCommonCommandOptions {}

const logsQueryCommand = defineCliCommand({
  rawName: 'logs query [query]',
  description: '按 SLS project/logstore/query 一次性检索日志',
  options: [
    { rawName: '-p, --project <project>', description: 'SLS project；未传时自动探测当前地域默认 FC 日志项目' },
    { rawName: '-s, --store <logstore>', description: 'SLS logstore；未传时按 project 自动选择默认 logstore' },
    { rawName: '-r, --region <region>', description: 'SLS region，默认当前登录地域' },
    { rawName: '-t, --topic <topic>', description: '按 topic 过滤' },
    { rawName: '--query <query>', description: 'SLS 查询语句；也可直接作为位置参数传入' },
    { rawName: '--from <epochSeconds>', description: '起始时间（Unix 秒）' },
    { rawName: '--to <epochSeconds>', description: '结束时间（Unix 秒）' },
    { rawName: '--since <seconds>', description: '向前回看多少秒；默认 120' },
    { rawName: '--window <seconds>', description: '与 `--since` 等价，兼容旧习惯' },
    { rawName: '--lines <n>', description: '最大日志条数（默认 1000）' },
    { rawName: '--reverse', description: '按时间倒序请求日志' },
    { rawName: '--power-sql', description: '启用 SLS PowerSQL 模式' }
  ],
  descriptor: {
    title: 'Query SLS logs',
    notes: [
      '位置参数 `query` 与 `--query` 二选一；复杂查询建议整体加引号。',
      '`logs query` 不会隐式追加 `functionName` 过滤；函数日志请改用 `licell fn logs`，或直接在 query 里写 `functionName:"..."`。',
      '这是通用的一次性检索入口，适合 Agent / 自动化配合 `--output json` 使用。'
    ],
    examples: [
      'licell logs query --output json',
      'licell logs query \'level:error and requestId:abc123\' --output json',
      'licell logs query -p your-project -s your-store \'status:500\' --lines 200 --output json',
      'licell logs query -p your-project -s your-store \'functionName:\"my-app\" | select count(*) as total\' --power-sql --output json',
      'licell logs query -p your-project -s your-store --from 1710000000 --to 1710000300 --output json'
    ],
    optionInsights: {
      '--project': { whenToUse: '日志不在自动探测到的默认 FC project 时使用。' },
      '--store': { whenToUse: '日志不在自动选择的默认 logstore 时使用。' },
      '--query': { whenToUse: '要直接写 SLS 查询语法、SQL pipeline 或复杂过滤条件时使用。' },
      '--from': { whenToUse: '需要锁定历史时间范围时使用。' },
      '--to': { whenToUse: '需要锁定结束时间时使用。' },
      '--since': { whenToUse: '快速查看最近 N 秒日志，替代手动换算 `--from`。' },
      '--reverse': { whenToUse: '希望优先拿到最近日志时使用。' },
      '--power-sql': { whenToUse: '查询里带 SQL pipeline 时使用。' }
    },
    recommendedFlow: [
      { title: '先查默认日志源', command: 'licell logs query --output json', reason: '先确认自动发现到的默认 project/logstore 是否有结果。' },
      { title: '切到自定义 project/logstore', command: 'licell logs query -p <project> -s <store> --output json', reason: '确认目标日志源正确。' },
      { title: '再加筛选条件', command: 'licell logs query -p <project> -s <store> \'level:error\' --output json', reason: '逐步收敛查询条件，避免一次写太复杂。' },
      { title: '需要持续观察时再 tail', command: 'licell logs tail -p <project> -s <store> \'level:error\'', reason: '查询语句正确后，切到流式跟随。' }
    ],
    result: {
      summary: '返回一次性 SLS 查询结果。',
      outcomeKey: 'entries',
      fields: [
        { name: 'stage', description: '固定为 `logs.query`。', required: true },
        { name: 'project', description: '实际查询的 SLS project。', required: true },
        { name: 'logstore', description: '实际查询的 SLS logstore。', required: true },
        { name: 'region', description: '实际连接的地域。', required: true },
        { name: 'topic', description: 'topic 过滤条件；未设置则为 null。' },
        { name: 'query', description: '最终生效的 SLS 查询语句。', required: true },
        { name: 'from', description: '查询起始 Unix 秒。', required: true },
        { name: 'to', description: '查询结束 Unix 秒。', required: true },
        { name: 'count', description: '返回日志条数。', required: true },
        { name: 'entries', description: '原始日志数组。', required: true }
      ]
    },
    agentTips: [
      'Agent 优先使用 `licell logs query --output json`。',
      '复杂查询条件统一放进一个带引号的 `query` 字符串。'
    ],
    related: ['fn logs', 'logs tail']
  }
});

const logsTailCommand = defineCliCommand({
  rawName: 'logs tail [query]',
  description: '按 SLS project/logstore/query 持续跟随日志流',
  options: [
    { rawName: '-p, --project <project>', description: 'SLS project；未传时自动探测当前地域默认 FC 日志项目' },
    { rawName: '-s, --store <logstore>', description: 'SLS logstore；未传时按 project 自动选择默认 logstore' },
    { rawName: '-r, --region <region>', description: 'SLS region，默认当前登录地域' },
    { rawName: '-t, --topic <topic>', description: '按 topic 过滤' },
    { rawName: '--query <query>', description: 'SLS 查询语句；也可直接作为位置参数传入' },
    { rawName: '--from <epochSeconds>', description: '起始时间（Unix 秒）' },
    { rawName: '--since <seconds>', description: '起始回看多少秒；默认 60' },
    { rawName: '--window <seconds>', description: '与 `--since` 等价，兼容旧习惯' },
    { rawName: '--lines <n>', description: '每次轮询最大日志条数（默认 1000）' },
    { rawName: '--power-sql', description: '启用 SLS PowerSQL 模式' }
  ],
  descriptor: {
    title: 'Tail SLS logs',
    notes: [
      '位置参数 `query` 与 `--query` 二选一；复杂查询建议整体加引号。',
      '`logs tail` 是持续流式命令，不支持 `--output json`；需要结构化结果时请改用 `licell logs query --output json`。',
      '`logs tail` 不会隐式追加 `functionName` 过滤；函数日志请改用 `licell fn logs`，或直接在 query 里写 `functionName:"..."`。'
    ],
    examples: [
      'licell logs tail',
      'licell logs tail \'level:error and requestId:abc123\'',
      'licell logs tail -p your-project -s your-store \'status:500\'',
      'licell logs tail -p your-project -s your-store \'functionName:\"my-app\"\' --since 300'
    ],
    optionInsights: {
      '--project': { whenToUse: '日志不在自动探测到的默认 FC project 时使用。' },
      '--store': { whenToUse: '日志不在自动选择的默认 logstore 时使用。' },
      '--query': { whenToUse: '要直接写 SLS 查询语法或复杂过滤条件时使用。' },
      '--from': { whenToUse: '需要从固定历史时刻开始回放并继续跟随时使用。' },
      '--since': { whenToUse: '从最近 N 秒开始进入 tail，替代手动换算 `--from`。' },
      '--power-sql': { whenToUse: '查询里带 SQL pipeline 时使用。' }
    },
    recommendedFlow: [
      { title: '先 query 验证语句', command: 'licell logs query -p <project> -s <store> \'level:error\' --output json', reason: '先确认查询条件命中正确日志。' },
      { title: '再进入 tail', command: 'licell logs tail -p <project> -s <store> \'level:error\'', reason: '查询语句正确后，持续观察新日志。' }
    ],
    agentTips: ['Agent 不要对 `logs tail` 使用 `--output json`；改用 `logs query`。'],
    related: ['logs query', 'fn logs']
  }
});

function parseOptionalNonNegativeInt(input: unknown, flag: string) {
  const value = toOptionalString(input);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`${flag} 必须是非负整数`);
  }
  return parsed;
}

function resolveQueryInput(positionalQuery: string | undefined, optionQuery: unknown) {
  const positional = toOptionalString(positionalQuery);
  const explicit = toOptionalString(optionQuery);
  if (positional && explicit && positional !== explicit) {
    throw new Error('位置参数 query 与 --query 不能同时传入不同的值');
  }
  return positional || explicit;
}

function resolveLookbackSeconds(sinceValue: unknown, windowValue: unknown) {
  const since = parseOptionalPositiveInt(sinceValue, '--since');
  const window = parseOptionalPositiveInt(windowValue, '--window');
  if (since && window && since !== window) {
    throw new Error('--since 与 --window 不能同时传入不同的值');
  }
  return since || window;
}

function resolveCommonTargetOptions(options: LogsCommonCommandOptions) {
  return {
    project: toOptionalString(options.project),
    logstore: toOptionalString(options.store),
    region: toOptionalString(options.region) ? normalizeRegion(String(options.region)) : undefined,
    topic: toOptionalString(options.topic),
    query: undefined as string | undefined,
    from: parseOptionalNonNegativeInt(options.from, '--from'),
    sinceSeconds: resolveLookbackSeconds(options.since, options.window),
    lineLimit: parseOptionalPositiveInt(options.lines, '--lines'),
    powerSql: Boolean(options.powerSql),
    ignoreMissingTarget: !toOptionalString(options.project) && !toOptionalString(options.store)
  };
}

export function registerLogsCommand(cli: CAC) {
  registerCliCommand(cli, logsQueryCommand)
    .action(async (query: string | undefined, options: LogsQueryCommandOptions) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(logsQueryCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['logs']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 🔎 SLS Log Query ')));
          ensureAuthOrExit();

          const result = await tailSlsLogs({
            ...resolveCommonTargetOptions(options),
            query: resolveQueryInput(query, options.query),
            once: true,
            to: parseOptionalNonNegativeInt(options.to, '--to'),
            reverse: Boolean(options.reverse),
            silent: isJsonOutput()
          });

          if (isJsonOutput() && result && result.mode === 'once') {
            emitCommandResult({
              stage: 'logs.query',
              project: result.target.project,
              logstore: result.target.logstore,
              region: result.target.region,
              topic: result.target.topic || null,
              query: result.query,
              from: result.from,
              to: result.to,
              count: result.logs.length,
              entries: result.logs
            });
          }
        }
      );
    });

  registerCliCommand(cli, logsTailCommand)
    .action(async (query: string | undefined, options: LogsTailCommandOptions) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(logsTailCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['logs']
        },
        async () => {
          if (isJsonOutput()) {
            throw new Error('`licell logs tail` 为持续流式命令，不支持 --output json；请改用 `licell logs query --output json`');
          }

          showIntro(pc.bgBlue(pc.white(' 📡 SLS Log Tail ')));
          ensureAuthOrExit();

          await tailSlsLogs({
            ...resolveCommonTargetOptions(options),
            query: resolveQueryInput(query, options.query),
            once: false,
            silent: false
          });
        }
      );
    });
}

export const logsCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerLogsCommand,
  commands: [logsQueryCommand, logsTailCommand],
  namespaces: {
    logs: {
      summary: '通用 SLS 日志入口，区分一次性 query 与持续跟随 tail。',
      examples: [
        'licell logs query --output json',
        'licell logs tail \'level:error\''
      ],
      notes: ['如果你只是要看某个 FC 函数的默认日志，优先使用 `licell fn logs`。'],
      related: ['fn logs']
    }
  }
});
