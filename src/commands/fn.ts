import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { Config } from '../utils/config';
import {
  getFunctionInfo,
  invokeFunction,
  listFunctions,
  removeFunction
} from '../providers/fc';
import { tailLogs } from '../providers/logs';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  toOptionalString,
  parseListLimit,
  parseOptionalPositiveInt,
  createSpinner,
  showIntro,
  showOutro,
  withSpinner
} from '../utils/cli-shared';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { resolveOptionalPayloadInput } from '../utils/payload-input';
import { fnDomainCommandBundle } from './fn-domain';
import { DELIVERY_SECTION } from './sections';

const fnListCommand = defineCliCommand({
  rawName: 'fn list',
  description: '查看函数列表',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 20' },
    { rawName: '--prefix <prefix>', description: '按函数名前缀过滤' }
  ]
});

const fnInfoCommand = defineCliCommand({
  rawName: 'fn info [name]',
  description: '查看函数详情',
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' }
  ]
});

const fnInvokeCommand = defineCliCommand({
  rawName: 'fn invoke [name]',
  description: '调用函数（同步）',
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' },
    { rawName: '--payload <text>', description: '传入原始 payload 文本' },
    { rawName: '--file <path>', description: '从文件读取 payload' }
  ]
});

const fnRmCommand = defineCliCommand({
  rawName: 'fn rm [name]',
  description: '删除函数',
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--force', description: '级联删除触发器、alias、已发布版本后再删除函数' },
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ]
});

const fnLogsCommand = defineCliCommand({
  rawName: 'fn logs [name]',
  description: '查看函数日志（默认实时流式）',
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择 component' },
    { rawName: '--once', description: '仅拉取一次最近日志并退出' },
    { rawName: '--window <seconds>', description: '一次拉取模式的时间窗（默认 120 秒）' },
    { rawName: '--lines <n>', description: '每次请求最大日志条数（默认 1000）' }
  ],
  descriptor: {
    title: 'View FC function logs',
    notes: [
      '默认读取当前函数在 FC 默认 SLS project / logstore 中的日志；会自动探测 FC 2.0 / 3.0 的默认日志项目。',
      '需要跨 project/logstore 或自定义 SLS 语法时，改用 `licell logs query` 或 `licell logs tail`。',
      '当使用 `--output json` 时，会自动退化为一次性拉取模式，避免持续流式输出。'
    ],
    examples: [
      'licell fn logs',
      'licell fn logs my-function',
      'licell fn logs my-function --once --window 300 --output json',
      'licell logs query -p your-project -s your-store \'*\' --output json'
    ],
    optionInsights: {
      '--once': { whenToUse: '需要抓取最近一批日志并立即退出时使用。' },
      '--window': { whenToUse: '一次性抓取时需要扩大或缩小时间范围时使用。' },
      '--lines': { whenToUse: '希望限制单次请求返回的最大日志条数时使用。' }
    },
    recommendedFlow: [
      { title: '先单次拉取', command: 'licell fn logs [name] --once --output json', reason: '先确认当前函数是否有日志以及日志格式。' },
      { title: '必要时扩大时间窗', command: 'licell fn logs [name] --once --window 300 --output json', reason: '排查较早前的报错或冷启动日志。' },
      { title: '进入实时流', command: 'licell fn logs [name]', reason: '确认问题仍在发生时，持续观察新日志。' },
      { title: '切换到通用 SLS 查询', command: 'licell logs query -p <project> -s <store> --output json', reason: '需要跨 logstore 或使用更复杂的查询条件时使用。' }
    ],
    result: {
      summary: '返回某个函数的一次性日志抓取结果。',
      outcomeKey: 'lines',
      fields: [
        { name: 'stage', description: '固定为 `fn.logs`。', required: true },
        { name: 'functionName', description: '实际查询的函数名。', required: true },
        { name: 'once', description: '是否为一次性抓取模式。', required: true },
        { name: 'lines', description: '日志行数组；流式模式下不返回。', required: true },
        { name: 'count', description: '返回日志条数。', required: true }
      ]
    },
    agentTips: [
      'Agent 优先使用 `licell fn logs [name] --once --output json`。',
      '如果要查询任意 SLS logstore，改用 `licell logs query --output json`。'
    ],
    related: ['logs query', 'logs tail', 'fn info', 'task info']
  }
});

export function registerFnCommands(cli: CAC) {
  fnDomainCommandBundle.register(cli);

  registerCliCommand(cli, fnListCommand)
    .action(async (options: { limit?: unknown; prefix?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);
          const prefix = toOptionalString(options.prefix);

          const s = createSpinner();
          const functions = await withSpinner(
            s,
            '正在拉取函数列表...',
            '❌ 获取函数列表失败',
            () => listFunctions(limit, prefix)
          );
          if (!functions) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${functions.length} 个函数`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              count: functions.length,
              functions
            });
            return;
          }
          if (functions.length === 0) {
            showOutro('当前地域没有函数');
            return;
          }
          for (const fn of functions) {
            console.log(
              `${pc.cyan(fn.functionName)}  runtime=${pc.gray(fn.runtime || '-')}  state=${pc.gray(fn.state || '-')}  updated=${pc.gray(fn.lastModifiedTime || '-')}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnInfoCommand)
    .action(async (name: string | undefined, options: { component?: unknown; target?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }
          const qualifier = toOptionalString(options.target);

          const s = createSpinner();
          const fn = await withSpinner(
            s,
            `正在拉取函数 ${functionName} 详情...`,
            '❌ 获取函数详情失败',
            () => getFunctionInfo(functionName, qualifier || undefined)
          );
          if (!fn) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCommandResult({
              component: component || null,
              functionName: fn.functionName || functionName,
              qualifier: qualifier || null,
              runtime: fn.runtime || null,
              handler: fn.handler || null,
              state: fn.state || null,
              memorySize: fn.memorySize ?? null,
              cpu: (fn as { cpu?: unknown }).cpu ?? null,
              instanceConcurrency: (fn as { instanceConcurrency?: unknown }).instanceConcurrency ?? null,
              timeout: fn.timeout ?? null,
              vpcConfig: (fn as { vpcConfig?: unknown }).vpcConfig ?? null,
              updatedAt: fn.lastModifiedTime || null,
              envCount: Object.keys(fn.environmentVariables || {}).length
            });
            return;
          }
          console.log(`\nfunction: ${pc.cyan(fn.functionName || functionName)}`);
          if (qualifier) console.log(`qualifier: ${pc.cyan(qualifier)}`);
          console.log(`runtime:   ${pc.cyan(fn.runtime || '-')}`);
          console.log(`handler:   ${pc.cyan(fn.handler || '-')}`);
          console.log(`state:     ${pc.cyan(fn.state || '-')}`);
          console.log(`memory:    ${pc.cyan(String(fn.memorySize || '-'))}`);
          console.log(`vcpu:      ${pc.cyan(String((fn as { cpu?: unknown }).cpu ?? '-'))}`);
          console.log(`concur:    ${pc.cyan(String((fn as { instanceConcurrency?: unknown }).instanceConcurrency ?? '-'))}`);
          console.log(`timeout:   ${pc.cyan(String(fn.timeout || '-'))}`);
          const vpcConfig = (fn as { vpcConfig?: { vpcId?: string; vSwitchIds?: string[]; securityGroupId?: string } }).vpcConfig;
          if (vpcConfig?.vpcId) {
            console.log(`vpc:       ${pc.cyan(`${vpcConfig.vpcId} / ${(vpcConfig.vSwitchIds || []).join(',') || '-'} / ${vpcConfig.securityGroupId || '-'}`)}`);
          } else {
            console.log(`vpc:       ${pc.cyan('-')}`);
          }
          console.log(`updated:   ${pc.cyan(fn.lastModifiedTime || '-')}`);
          console.log(`envCount:  ${pc.cyan(String(Object.keys(fn.environmentVariables || {}).length))}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnInvokeCommand)
    .action(async (name: string | undefined, options: { component?: unknown; target?: unknown; payload?: unknown; file?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnInvokeCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }
          const qualifier = toOptionalString(options.target);
          const payload = resolveOptionalPayloadInput({ payload: options.payload, file: options.file });

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在调用函数 ${functionName}...`,
            '❌ 函数调用失败',
            () => invokeFunction(functionName, { qualifier: qualifier || undefined, payload: payload || undefined })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 调用完成 (status=${result.statusCode})`));
          }
          const responseBody = result.body && result.body.trim().length > 0 ? result.body : '';
          if (isJsonOutput()) {
            emitCommandResult({
              component: component || null,
              functionName,
              qualifier: qualifier || null,
              statusCode: result.statusCode,
              body: responseBody
            });
            return;
          }
          console.log('');
          if (responseBody) {
            console.log(responseBody);
          } else {
            console.log('<empty response>');
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnRmCommand)
    .action(async (name: string | undefined, options: { component?: unknown; force?: boolean; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }
          await ensureDestructiveActionConfirmed(
            options.force ? `删除函数 ${functionName}（含触发器/alias/版本）` : `删除函数 ${functionName}`,
            { yes: Boolean(options.yes) }
          );

          const s = createSpinner();
          const deleted = await withSpinner(
            s,
            options.force
              ? `正在级联清理并删除函数 ${functionName}...`
              : `正在删除函数 ${functionName}...`,
            '❌ 删除函数失败',
            () => removeFunction(functionName, { force: Boolean(options.force) })
          );
          if (!deleted) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 函数已删除'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              component: component || null,
              functionName,
              force: Boolean(options.force),
              forced: deleted.forced,
              deletedTriggers: deleted.deletedTriggers,
              deletedAliases: deleted.deletedAliases,
              deletedVersions: deleted.deletedVersions
            });
            return;
          }
          if (deleted.forced) {
            console.log(`\ncleanup: triggers=${deleted.deletedTriggers.length} aliases=${deleted.deletedAliases.length} versions=${deleted.deletedVersions.length}`);
          }
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, fnLogsCommand)
    .action(async (name: string | undefined, options: { component?: unknown; once?: unknown; window?: unknown; lines?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(fnLogsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'logs']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 📡 Function Log Stream ')));
          ensureAuthOrExit();
          const component = toOptionalString(options.component);
          const project = Config.getProject({ component });
          const functionName = toOptionalString(name) || project.appName;
          if (!functionName) {
            throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
          }

          const once = isJsonOutput() ? true : Boolean(options.once);
          const result = await tailLogs(functionName, {
            once,
            windowSeconds: parseOptionalPositiveInt(options.window, '--window'),
            lineLimit: parseOptionalPositiveInt(options.lines, '--lines'),
            silent: isJsonOutput()
          });

          if (isJsonOutput()) {
            emitCommandResult({
              stage: 'fn.logs',
              component: component || null,
              functionName,
              once,
              lines: result && 'lines' in result ? result.lines : [],
              count: result && 'logs' in result ? result.logs.length : 0
            });
          }
        }
      );
    });
}

export const fnCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerFnCommands,
  commands: [fnListCommand, fnInfoCommand, fnInvokeCommand, fnRmCommand, fnLogsCommand],
  namespaces: {
    fn: {
      summary: '函数、函数日志与 FC 自定义域名的查看、详情、调用与删除。',
      examples: ['licell fn list', 'licell fn info hello-world', 'licell fn logs hello-world --once --output json', 'licell fn domain list', 'licell fn invoke hello-world --output json']
    }
  },
  mergeBundles: [fnDomainCommandBundle]
});
