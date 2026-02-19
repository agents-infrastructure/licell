import type { CAC } from 'cac';
import { intro } from '@clack/prompts';
import pc from 'picocolors';
import { tailLogs } from '../providers/logs';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { ensureAuthOrExit, requireAppName, isInteractiveTTY, parseOptionalPositiveInt } from '../utils/cli-shared';
import { Config } from '../utils/config';

interface LogsCommandOptions {
  once?: unknown;
  window?: unknown;
  lines?: unknown;
}

export function registerLogsCommand(cli: CAC) {
  cli.command('logs', '查看云端日志（默认实时流式）')
    .option('--once', '仅拉取一次最近日志并退出')
    .option('--window <seconds>', '一次拉取模式的时间窗（默认 120 秒）')
    .option('--lines <n>', '每次请求最大日志条数（默认 1000）')
    .action(async (options: LogsCommandOptions) => {
    await executeWithAuthRecovery(
      {
        commandLabel: 'licell logs',
        interactiveTTY: isInteractiveTTY(),
        requiredCapabilities: ['fc', 'logs']
      },
      async () => {
        intro(pc.bgBlue(pc.white(' 📡 Serverless Log Stream ')));
        ensureAuthOrExit();
        const project = Config.getProject();
        requireAppName(project, '当前目录下没有找到绑定的云端项目');
        await tailLogs(project.appName, {
          once: Boolean(options.once),
          windowSeconds: parseOptionalPositiveInt(options.window, '--window'),
          lineLimit: parseOptionalPositiveInt(options.lines, '--lines')
        });
      }
    );
  });
}
