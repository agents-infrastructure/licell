import type { CAC } from 'cac';
import { intro } from '@clack/prompts';
import pc from 'picocolors';
import { tailLogs } from '../providers/logs';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { ensureAuthOrExit, requireAppName, isInteractiveTTY } from '../utils/cli-shared';
import { Config } from '../utils/config';

export function registerLogsCommand(cli: CAC) {
  cli.command('logs', '实时查看云端日志').action(async () => {
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
        await tailLogs(project.appName);
      }
    );
  });
}
