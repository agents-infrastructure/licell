import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { tailSlsLogs } from '../providers/logs';
import { getSlsIndex, listSlsLogstores, listSlsProjects } from '../providers/sls-query';
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

interface LogsProjectsCommandOptions {
  region?: unknown;
  project?: unknown;
  resourceGroup?: unknown;
  fetchQuota?: unknown;
  limit?: unknown;
}

interface LogsLogstoresCommandOptions {
  region?: unknown;
  name?: unknown;
  mode?: unknown;
  telemetryType?: unknown;
  limit?: unknown;
}

interface LogsIndexCommandOptions {
  region?: unknown;
}

const logsIndexCommand = defineCliCommand({
  rawName: 'logs index <project> <logstore>',
  description: '查看 SLS logstore 索引（只读）',
  region: { scope: 'auth' },
  options: [{ rawName: '-r, --region <region>', description: 'SLS region，默认当前登录地域' }],
  descriptor: {
    title: 'Describe SLS index',
    summary: '通过 SLS GetIndex 只读 API 查看指定 logstore 的字段索引定义。',
    examples: [
      'licell logs index <project> <logstore> --output json',
      'licell logs index aliyun-fc-cn-shanghai-1494910986361453 function-log --region cn-shanghai --output json'
    ],
    argumentHints: {
      project: 'SLS project 名称；先用 `licell logs projects` 获取。',
      logstore: 'SLS logstore 名称；先用 `licell logs logstores <project>` 获取。'
    },
    related: ['logs projects', 'logs logstores', 'logs query', 'api invoke', 'capability search'],
    agentTips: [
      '先读取 `index.fields[]` 判断字段查询是否有索引，再构造 `logs query` 语句。',
      '本命令只读取索引定义，不修改索引配置。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['project', 'logstore', '--region'] },
    safety: { level: 'safe', reason: '只调用 SLS GetIndex 读取 logstore 索引定义。', confirmFlags: [] },
    recommendedFlow: [
      { title: '列出日志项目', command: 'licell logs projects --output json', reason: '获取 SLS project。' },
      { title: '列出日志库', command: 'licell logs logstores <project> --output json', reason: '获取 logstore。' },
      { title: '读取索引定义', command: 'licell logs index <project> <logstore> --output json', reason: '确认可用于字段检索的索引。' },
      { title: '查询日志', command: 'licell logs query -p <project> -s <logstore> \'*\' --output json', reason: '使用已确认的日志源和索引进行查询。' }
    ],
    result: {
      summary: '返回指定 logstore 的索引模式、存储、生命周期和字段索引摘要。',
      outcomeKey: 'index',
      fields: [
        { name: 'stage', description: '固定为 `logs.index`。', required: true },
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'project', description: '实际查询的 SLS project。', required: true },
        { name: 'logstore', description: '实际查询的 SLS logstore。', required: true },
        { name: 'requestId', description: 'SLS API requestId。', required: false },
        { name: 'index', description: '索引模式、存储、生命周期、行索引和字段索引摘要。', required: true }
      ]
    }
  }
});

const logsLogstoresCommand = defineCliCommand({
  rawName: 'logs logstores <project>',
  description: '列出 SLS 项目下的 logstore（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '-r, --region <region>', description: 'SLS region，默认当前登录地域' },
    { rawName: '--name <logstore>', description: '按 logstore 名称过滤' },
    { rawName: '--mode <mode>', description: '按采集模式过滤' },
    { rawName: '--telemetry-type <type>', description: '按 telemetry 类型过滤' },
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List SLS logstores',
    summary: '通过 SLS ListLogStores 只读 API 列出指定 project 下的 logstore 摘要。',
    examples: [
      'licell logs logstores <project> --output json',
      'licell logs logstores app-logs --name access --output json'
    ],
    argumentHints: { project: 'SLS project 名称；先用 `licell logs projects` 获取。' },
    related: ['logs projects', 'logs query', 'logs tail', 'api invoke', 'capability search'],
    agentTips: [
      '先从 `logs projects` 读取 project，再读取 `logstores[].logstoreName` 交给 `logs query -p <project> -s <logstore>`。',
      '本命令只读取 logstore 元数据，不读取日志内容或索引正文。',
      '结果带 `totalCount/truncated`；出现截断时先缩小名称过滤范围。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['project', '--region', '--name', '--mode', '--telemetry-type', '--limit']
    },
    safety: {
      level: 'safe',
      reason: '只调用 SLS ListLogStores 读取 logstore 摘要，不创建或修改日志资源。',
      confirmFlags: []
    },
    recommendedFlow: [
      { title: '列出日志项目', command: 'licell logs projects --output json', reason: '获取可用的 SLS project。' },
      { title: '列出项目下的 logstore', command: 'licell logs logstores <project> --output json', reason: '获取查询日志所需的 logstore 名称。' },
      { title: '查询日志', command: 'licell logs query -p <project> -s <logstore> \'*\' --output json', reason: '读取指定 logstore 的日志内容。' }
    ],
    result: {
      summary: '返回指定 SLS project 下的 logstore 摘要、过滤条件、总数和截断状态。',
      outcomeKey: 'logstores',
      fields: [
        { name: 'stage', description: '固定为 `logs.logstores`。', required: true },
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'project', description: '实际查询的 SLS project。', required: true },
        { name: 'count', description: '本次返回 logstore 数量。', required: true },
        { name: 'totalCount', description: '云端匹配 logstore 总数。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因单页读取或 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的名称、模式和 telemetry 过滤条件。', required: true },
        { name: 'requestId', description: 'SLS API requestId。', required: false },
        { name: 'logstores[]', description: 'logstore 名称、模式、telemetry 类型和容量摘要。', required: true }
      ]
    }
  }
});

const logsProjectsCommand = defineCliCommand({
  rawName: 'logs projects',
  description: '列出 SLS 日志项目（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '-r, --region <region>', description: 'SLS region，默认当前登录地域' },
    { rawName: '-p, --project <project>', description: '按 projectName 过滤' },
    { rawName: '--resource-group <resourceGroupId>', description: '按资源组 ID 过滤' },
    { rawName: '--fetch-quota', description: '请求项目配额摘要' },
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List SLS projects',
    summary: '通过 SLS ListProject 只读 API 列出日志项目摘要，不读取日志内容。',
    examples: [
      'licell logs projects --region cn-hangzhou --output json',
      'licell logs projects --project app-logs --fetch-quota --output json'
    ],
    related: ['logs query', 'logs tail', 'api invoke', 'capability search'],
    agentTips: [
      '先读取 `projects[].projectName`，再将 project 传给 `logs query -p <project>` 查询日志。',
      '这是 SLS 项目清单，不会自动列出每个项目下的 logstore；需要完整参数时继续用 `capability describe sls.ListProject`。',
      '结果带 `totalCount/truncated`；出现截断时先缩小过滤范围。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--region', '--project', '--resource-group', '--fetch-quota', '--limit']
    },
    safety: {
      level: 'safe',
      reason: '只调用 SLS ListProject 读取项目摘要，不创建或修改日志资源。',
      confirmFlags: []
    },
    recommendedFlow: [
      { title: '列出日志项目', command: 'licell logs projects --output json', reason: '获取账号当前地域的 SLS project 清单。' },
      { title: '查询项目日志', command: 'licell logs query -p <project> -s <logstore> \'*\' --output json', reason: '使用项目和 logstore 查询日志内容。' },
      { title: '探索其他 SLS 能力', command: 'licell capability search --product sls --intent "查看日志项目下的资源" --action inspect --output json', reason: '发现 logstore、索引和日志查询等未封装的 protocol API。' }
    ],
    result: {
      summary: '返回 SLS 项目摘要、过滤条件、总数和截断状态。',
      outcomeKey: 'projects',
      fields: [
        { name: 'stage', description: '固定为 `logs.projects`。', required: true },
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'count', description: '本次返回项目数量。', required: true },
        { name: 'totalCount', description: '云端匹配项目总数。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因单页读取或 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的项目名、资源组和配额选项。', required: true },
        { name: 'requestId', description: 'SLS API requestId。', required: false },
        { name: 'projects[]', description: '项目名称、描述、地域、状态、时间和可选配额摘要。', required: true }
      ]
    }
  }
});

const logsQueryCommand = defineCliCommand({
  rawName: 'logs query [query]',
  description: '按 SLS project/logstore/query 一次性检索日志',
  region: { scope: 'auth' },
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
      '对日志进行查询前，目标 Logstore 需要先创建索引；字段查询是否生效也取决于对应字段的索引类型。',
      '位置参数 `query` 与 `--query` 二选一；复杂查询建议整体加引号。',
      '`query` 会原样透传给 SLS `GetLogs.query`；licell 不会把 skill 里的写法或自定义 DSL 转换成另一套查询语法。',
      'SLS 官方语法里：`*` 表示无过滤条件；全文检索可用 `GET or POST`；字段检索可用 `request_method:GET`；数值字段可用 `request_time_msec>50`。',
      '查询语句与分析语句可通过 `|` 分隔，例如 `request_method:GET | select count(*) as total`。',
      '如果不确定目标 logstore 的字段索引 / 分词规则，先用 `*` 拉原始日志，再在本地基于 `--output json` 结果做聚合或过滤。',
      '`field:value` / `field:"value"` 这类过滤是否有效，取决于目标 logstore 是否已为对应字段建立索引。',
      '`logs query` 不会隐式追加 `functionName` 过滤；函数日志请改用 `licell fn logs`，或直接在 query 里写 `functionName:"..."`。',
      '这是通用的一次性检索入口，适合 Agent / 自动化配合 `--output json` 使用。'
    ],
    examples: [
      'licell logs query --output json',
      'licell logs query \'*\' --output json',
      'licell logs query \'GET or POST\' --output json',
      'licell logs query \'request_method:GET and status:200\' --output json',
      'licell logs query -p your-project -s your-store \'*\' --lines 200 --output json',
      'licell logs query -p your-project -s your-store \'request_method:GET | select count(*) as total\' --power-sql --output json',
      'licell logs query -p your-project -s your-store --from 1710000000 --to 1710000300 --output json'
    ],
    optionInsights: {
      '--project': { whenToUse: '日志不在自动探测到的默认 FC project 时使用。' },
      '--store': { whenToUse: '日志不在自动选择的默认 logstore 时使用。' },
      '--query': { whenToUse: '要直接写原生 SLS 查询语句、SQL pipeline 或显式传入 `*` 时使用。' },
      '--from': { whenToUse: '需要锁定历史时间范围时使用。' },
      '--to': { whenToUse: '需要锁定结束时间时使用。' },
      '--since': { whenToUse: '快速查看最近 N 秒日志，替代手动换算 `--from`。' },
      '--reverse': { whenToUse: '希望优先拿到最近日志时使用。' },
      '--power-sql': { whenToUse: '查询里带 SQL pipeline 时使用。' }
    },
    recommendedFlow: [
      { title: '先查默认日志源', command: 'licell logs query --output json', reason: '先确认自动发现到的默认 project/logstore 是否有结果。' },
      { title: '切到自定义 project/logstore', command: 'licell logs query -p <project> -s <store> --output json', reason: '确认目标日志源正确。' },
      { title: '先用 * 看原始日志', command: 'licell logs query -p <project> -s <store> \'*\' --output json', reason: '先确认日志字段长什么样，再决定是否在 SLS 侧筛选。' },
      { title: '再尝试 SLS 原生过滤或 SQL', command: 'licell logs query -p <project> -s <store> \'<sls-query>\' --output json', reason: '确认字段已建索引后，再逐步收敛查询条件。' },
      { title: '需要持续观察时再 tail', command: 'licell logs tail -p <project> -s <store> \'*\'', reason: '确认日志源与查询语句正确后，切到流式跟随。' }
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
      '复杂查询条件统一放进一个带引号的 `query` 字符串。',
      '如果字段过滤不稳定，优先执行 `licell logs query \'*\' --output json`，再在本地聚合或过滤。'
    ],
    related: ['fn logs', 'logs tail']
  }
});

const logsTailCommand = defineCliCommand({
  rawName: 'logs tail [query]',
  description: '按 SLS project/logstore/query 持续跟随日志流',
  region: { scope: 'auth' },
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
      '对日志进行查询前，目标 Logstore 需要先创建索引；字段查询是否生效也取决于对应字段的索引类型。',
      '位置参数 `query` 与 `--query` 二选一；复杂查询建议整体加引号。',
      '`query` 会原样透传给 SLS `GetLogs.query`；licell 不会把 skill 示例或本地过滤语法翻译成 SLS 查询。',
      'SLS 官方语法里：`*` 表示无过滤条件；全文检索可用 `GET or POST`；字段检索可用 `request_method:GET`；数值字段可用 `request_time_msec>50`。',
      '`logs tail` 是持续流式命令，不支持 `--output json`；需要结构化结果时请改用 `licell logs query --output json`。',
      '如果不确定字段过滤是否生效，先用 `licell logs query \'*\' --output json` 验证，再切回 tail。',
      '`logs tail` 不会隐式追加 `functionName` 过滤；函数日志请改用 `licell fn logs`，或直接在 query 里写 `functionName:"..."`。'
    ],
    examples: [
      'licell logs tail',
      'licell logs tail \'*\'',
      'licell logs tail \'GET or POST\'',
      'licell logs tail \'request_method:GET and status:200\'',
      'licell logs tail -p your-project -s your-store \'*\'',
      'licell logs tail -p your-project -s your-store \'*\' --since 300'
    ],
    optionInsights: {
      '--project': { whenToUse: '日志不在自动探测到的默认 FC project 时使用。' },
      '--store': { whenToUse: '日志不在自动选择的默认 logstore 时使用。' },
      '--query': { whenToUse: '要直接写原生 SLS 查询语法，或显式传入 `*` 监听全部日志时使用。' },
      '--from': { whenToUse: '需要从固定历史时刻开始回放并继续跟随时使用。' },
      '--since': { whenToUse: '从最近 N 秒开始进入 tail，替代手动换算 `--from`。' },
      '--power-sql': { whenToUse: '查询里带 SQL pipeline 时使用。' }
    },
    recommendedFlow: [
      { title: '先 query 验证语句', command: 'licell logs query -p <project> -s <store> \'*\' --output json', reason: '先确认日志源、字段与返回格式都正确。' },
      { title: '再进入 tail', command: 'licell logs tail -p <project> -s <store> \'*\'', reason: '查询语句正确后，持续观察新日志。' }
    ],
    agentTips: [
      'Agent 不要对 `logs tail` 使用 `--output json`；改用 `logs query`。',
      '如果筛选条件来源于外部 skill/文档，先在 `logs query` 里用 `*` 验证日志结构。'
    ],
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
  registerCliCommand(cli, logsIndexCommand)
    .action(async (project: string, logstore: string, options: LogsIndexCommandOptions) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(logsIndexCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['logs']
        },
        async () => {
          ensureAuthOrExit();
          const result = await getSlsIndex({
            project,
            logstore,
            regionId: toOptionalString(options.region) ? normalizeRegion(String(options.region)) : undefined
          });
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`SLS index: ${result.project}/${result.logstore}`));
            console.log(`- mode: ${result.index.indexMode || '-'}  fields: ${result.index.fields.length}`);
          }
        }
      );
    });

  registerCliCommand(cli, logsLogstoresCommand)
    .action(async (project: string, options: LogsLogstoresCommandOptions) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(logsLogstoresCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['logs']
        },
        async () => {
          ensureAuthOrExit();
          const result = await listSlsLogstores({
            project,
            regionId: toOptionalString(options.region) ? normalizeRegion(String(options.region)) : undefined,
            logstoreName: toOptionalString(options.name),
            mode: toOptionalString(options.mode),
            telemetryType: toOptionalString(options.telemetryType),
            limit: parseOptionalPositiveInt(options.limit, '--limit')
          });
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`SLS logstores (${result.count})`));
            for (const logstore of result.logstores) console.log(`- ${pc.cyan(logstore.logstoreName)}  ${logstore.mode || '-'}`);
          }
        }
      );
    });

  registerCliCommand(cli, logsProjectsCommand)
    .action(async (options: LogsProjectsCommandOptions) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(logsProjectsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['logs']
        },
        async () => {
          ensureAuthOrExit();
          const result = await listSlsProjects({
            regionId: toOptionalString(options.region) ? normalizeRegion(String(options.region)) : undefined,
            projectName: toOptionalString(options.project),
            resourceGroupId: toOptionalString(options.resourceGroup),
            fetchQuota: Boolean(options.fetchQuota),
            limit: parseOptionalPositiveInt(options.limit, '--limit')
          });
          if (isJsonOutput()) emitCommandResult(result);
          if (!isJsonOutput()) {
            console.log(pc.bold(`SLS projects (${result.count})`));
            for (const project of result.projects) console.log(`- ${pc.cyan(project.projectName)}  ${project.region || '-'}  ${project.status || '-'}`);
          }
        }
      );
    });

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
  commands: [logsIndexCommand, logsLogstoresCommand, logsProjectsCommand, logsQueryCommand, logsTailCommand],
  namespaces: {
    logs: {
      summary: '通用 SLS 日志入口，区分一次性 query 与持续跟随 tail。',
      examples: [
        'licell logs logstores <project> --output json',
        'licell logs index <project> <logstore> --output json',
        'licell logs projects --output json',
        'licell logs query --output json',
        'licell logs tail \'*\''
      ],
      notes: [
        '先用 `logs projects`、`logs logstores <project>` 和 `logs index <project> <logstore>` 定位日志源，再进入 `logs query` / `logs tail`。',
        '需要先定位 SLS project 时使用 `logs projects`；需要读取日志内容时再进入 `logs query`。',
        '如果你只是要看某个 FC 函数的默认日志，优先使用 `licell fn logs`。',
        '若不确定 SLS 字段过滤是否有效，先用 `logs query \'*\' --output json` 看原始日志。'
      ],
      related: ['fn logs']
    }
  }
});
