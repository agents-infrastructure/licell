import { cac } from 'cac';
import { normalizeMultiWordCommandArgv } from './utils/argv';
import { registerAuthCommands } from './commands/auth';
import { registerDeployCommand } from './commands/deploy';
import { registerFnCommands } from './commands/fn';
import { registerOssCommands } from './commands/oss';
import { registerDbCommands } from './commands/db';
import { registerCacheCommands } from './commands/cache';
import { registerReleaseCommands } from './commands/release';
import { registerDomainCommands } from './commands/domain';
import { registerDnsCommands } from './commands/dns';
import { registerEnvCommands } from './commands/env';
import { registerLogsCommand } from './commands/logs';

const cli = cac('licell');

registerAuthCommands(cli);
registerDeployCommand(cli);
registerFnCommands(cli);
registerOssCommands(cli);
registerDbCommands(cli);
registerCacheCommands(cli);
registerReleaseCommands(cli);
registerDomainCommands(cli);
registerDnsCommands(cli);
registerEnvCommands(cli);
registerLogsCommand(cli);

cli.help();
cli.on('command:*', () => {
  const command = cli.args.join(' ');
  console.error(`未知命令: ${command}`);
  cli.outputHelp();
  process.exit(1);
});

const argv = normalizeMultiWordCommandArgv(process.argv);
if (argv.length <= 2) {
  cli.outputHelp();
  process.exit(0);
}

cli.parse(argv);
