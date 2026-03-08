import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { tailLogs } from '../providers/logs';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  requireAppName,
  isInteractiveTTY,
  parseOptionalPositiveInt,
  showIntro
} from '../utils/cli-shared';
import { Config } from '../utils/config';
import { emitCliResult, isJsonOutput } from '../utils/output';
import { DELIVERY_SECTION } from './sections';

interface LogsCommandOptions {
  once?: unknown;
  window?: unknown;
  lines?: unknown;
}

const logsCommand = defineCliCommand({
  rawName: 'logs',
  description: '查看云端日志（默认实时流式）',
  options: [
    { rawName: '--once', description: '仅拉取一次最近日志并退出' },
    { rawName: '--window <seconds>', description: '一次拉取模式的时间窗（默认 120 秒）' },
    { rawName: '--lines <n>', description: '每次请求最大日志条数（默认 1000）' }
  ],
  descriptor: {
    notes: ['当使用 `--output json` 时，会自动退化为一次性拉取模式，避免持续流式输出。'],
    examples: ['licell logs', 'licell logs --once --window 300', 'licell logs --output json'],
    optionInsights: {
      '--once': { whenToUse: '需要抓取最近一批日志并立即退出时使用。' },
      '--window': { whenToUse: '一次性抓取时需要扩大或缩小时间范围时使用。' },
      '--lines': { whenToUse: '希望限制单次请求返回的最大日志条数时使用。' }
    },
    recommendedFlow: [
      { title: '先单次拉取', command: 'licell logs --once --output json', reason: '先确认当前函数是否有日志以及日志格式。' },
      { title: '必要时扩大时间窗', command: 'licell logs --once --window 300 --output json', reason: '排查较早前的报错或冷启动日志。' },
      { title: '进入实时流', command: 'licell logs', reason: '确认问题仍在发生时，持续观察新日志。' }
    ],
    result: {
      summary: '返回当前应用的一次性日志抓取结果。',
      outcomeKey: 'lines',
      fields: [
        { name: 'stage', description: '固定为 `logs`。', required: true },
        { name: 'appName', description: '当前项目绑定的应用名。', required: true },
        { name: 'once', description: '是否为一次性抓取模式。', required: true },
        { name: 'lines', description: '日志行数组；流式模式下不返回。', required: true },
        { name: 'count', description: '返回日志条数。', required: true }
      ]
    },
    agentTips: ['Agent 优先使用 `licell logs --once --output json`，避免流式输出阻塞自动化流程。']
  }
});

export function registerLogsCommand(cli: CAC) {
  registerCliCommand(cli, logsCommand)
    .action(async (options: LogsCommandOptions) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(logsCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc', 'logs']
        },
        async () => {
          showIntro(pc.bgBlue(pc.white(' 📡 Serverless Log Stream ')));
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project, '当前目录下没有找到绑定的云端项目');
          const once = isJsonOutput() ? true : Boolean(options.once);
          const result = await tailLogs(project.appName, {
            once,
            windowSeconds: parseOptionalPositiveInt(options.window, '--window'),
            lineLimit: parseOptionalPositiveInt(options.lines, '--lines'),
            silent: isJsonOutput()
          });
          if (isJsonOutput()) {
            emitCliResult({
              stage: 'logs',
              appName: project.appName,
              once,
              lines: result && 'lines' in result ? result.lines : [],
              count: result && 'logs' in result ? result.logs.length : 0
            });
          }
        }
      );
    });
}

export const logsCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerLogsCommand,
  commands: [logsCommand]
});
