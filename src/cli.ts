import { cac } from 'cac';
import pc from 'picocolors';
import { normalizeMultiWordCommandArgv } from './utils/argv';
import { registerAuthCommands } from './commands/auth';
import { registerInitCommand } from './commands/init';
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
import { registerUpgradeCommand } from './commands/upgrade';
import { registerMcpCommand } from './commands/mcp';
import { registerShellCommands } from './commands/shell';
import { resolveCliVersion } from './utils/version';
import { formatErrorMessage } from './utils/errors';

const cli = cac('licell');
cli.version(resolveCliVersion());

registerAuthCommands(cli);
registerInitCommand(cli);
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
registerUpgradeCommand(cli);
registerMcpCommand(cli);
registerShellCommands(cli);

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

function handleCliError(err: unknown): never {
  const message = formatErrorMessage(err);
  const missingArgsMatch = message.match(/missing required args for command `(.+?)`/);
  if (missingArgsMatch) {
    console.error(pc.red('命令参数不完整。'));
    console.error(pc.gray(`用法: licell ${missingArgsMatch[1]}`));
    cli.outputHelp();
    process.exit(1);
  }
  console.error(pc.red(message));
  process.exit(1);
}

void Promise.resolve()
  .then(() => cli.parse(argv))
  .catch(handleCliError);
