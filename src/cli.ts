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
import { registerE2eCommands } from './commands/e2e';
import { registerReleaseCommands } from './commands/release';
import { registerDomainCommands } from './commands/domain';
import { registerDnsCommands } from './commands/dns';
import { registerEnvCommands } from './commands/env';
import { registerLogsCommand } from './commands/logs';
import { registerUpgradeCommand } from './commands/upgrade';
import { registerMcpCommand } from './commands/mcp';
import { registerShellCommands } from './commands/shell';
import { registerSkillsCommands } from './commands/skills';
import { registerSetupCommand } from './commands/setup';
import { registerConfigCommands } from './commands/config';
import { resolveCliVersion } from './utils/version';
import { checkForUpdate, printUpdateTip } from './utils/update-check';
import { formatErrorMessage } from './utils/errors';
import {
  emitCliError,
  emitCliResult,
  getOutputMode,
  hasEmittedCliError,
  hasEmittedCliResult,
  initOutputContext,
  installJsonConsoleBridge,
  isJsonOutput,
  parseGlobalOutputModeArgv
} from './utils/output';

const cliVersion = resolveCliVersion();
const cli = cac('licell');
cli.version(cliVersion);
cli.option('--output <mode>', '输出格式：text|json（json 更适合 Agent/MCP 解析）', { default: 'text' });

registerAuthCommands(cli);
registerInitCommand(cli);
registerDeployCommand(cli);
registerFnCommands(cli);
registerOssCommands(cli);
registerDbCommands(cli);
registerCacheCommands(cli);
registerE2eCommands(cli);
registerReleaseCommands(cli);
registerDomainCommands(cli);
registerDnsCommands(cli);
registerEnvCommands(cli);
registerLogsCommand(cli);
registerUpgradeCommand(cli);
registerMcpCommand(cli);
registerShellCommands(cli);
registerSkillsCommands(cli);
registerSetupCommand(cli);
registerConfigCommands(cli);

cli.help();
cli.on('command:*', () => {
  const command = cli.args.join(' ');
  if (isJsonOutput()) {
    emitCliError(new Error(`未知命令: ${command}`), {
      stage: 'parse',
      details: { command }
    });
    process.exit(1);
  }
  console.error(`未知命令: ${command}`);
  cli.outputHelp();
  process.exit(1);
});

const normalizedArgv = normalizeMultiWordCommandArgv(process.argv);
let argv = normalizedArgv;
try {
  const parsedOutput = parseGlobalOutputModeArgv(normalizedArgv);
  argv = parsedOutput.argv;
  initOutputContext(parsedOutput.mode, argv);
  installJsonConsoleBridge();
} catch (err: unknown) {
  const message = formatErrorMessage(err);
  console.error(pc.red(message));
  process.exit(1);
}

if (argv.length <= 2) {
  if (getOutputMode() === 'json') {
    emitCliResult({
      stage: 'help',
      help: '请执行 licell <command> --help 查看命令说明'
    });
    process.exit(0);
  }
  cli.outputHelp();
  process.exit(0);
}

function handleCliError(err: unknown): never {
  const message = formatErrorMessage(err);
  const missingArgsMatch = message.match(/missing required args for command `(.+?)`/);
  const isParseError = missingArgsMatch
    || (typeof err === 'object' && err !== null && 'name' in err && String((err as { name?: unknown }).name || '') === 'CACError');
  if (isJsonOutput()) {
    emitCliError(err, {
      stage: isParseError ? 'parse' : 'runtime',
      ...(missingArgsMatch ? { details: { usage: missingArgsMatch[1] } } : {})
    });
    process.exit(1);
  }
  if (missingArgsMatch) {
    console.error(pc.red('命令参数不完整。'));
    console.error(pc.gray(`用法: licell ${missingArgsMatch[1]}`));
    cli.outputHelp();
    process.exit(1);
  }
  console.error(pc.red(message));
  process.exit(1);
}

let fatalErrorHandled = false;
function handleFatalError(err: unknown, stage: 'unhandled_rejection' | 'uncaught_exception') {
  if (fatalErrorHandled) return;
  fatalErrorHandled = true;
  if (isJsonOutput()) {
    emitCliError(err, { stage });
  } else {
    console.error(pc.red(formatErrorMessage(err)));
  }
  process.exit(1);
}

process.on('unhandledRejection', (reason) => {
  handleFatalError(reason, 'unhandled_rejection');
});
process.on('uncaughtException', (err) => {
  handleFatalError(err, 'uncaught_exception');
});

process.once('beforeExit', (code) => {
  if (code !== 0) return;
  if (!isJsonOutput()) return;
  if (hasEmittedCliResult() || hasEmittedCliError()) return;
  emitCliResult({
    stage: 'runtime',
    completed: true
  });
});

const isUpgradeCommand = argv.some((a) => a === 'upgrade');
const updateCheckPromise = (!isJsonOutput() && !isUpgradeCommand)
  ? checkForUpdate(cliVersion).catch(() => null)
  : Promise.resolve(null);

void Promise.resolve()
  .then(() => cli.parse(argv))
  .then(async () => {
    const result = await updateCheckPromise;
    if (result) printUpdateTip(result);
  })
  .catch(handleCliError);
