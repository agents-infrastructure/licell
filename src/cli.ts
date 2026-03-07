// Suppress DEP0169 (url.parse) from Alibaba Cloud SDK dependency chain (httpx)
// See: https://github.com/JacksonTian/httpx — unfixed upstream
const _emit = process.emit;
// @ts-ignore -- overriding emit signature for warning filtering
process.emit = function (event: string, ...args: unknown[]) {
  if (event === 'warning' && (args[0] as { code?: string })?.code === 'DEP0169') return false;
  return _emit.apply(this, [event, ...args] as Parameters<typeof _emit>);
};

import pc from 'picocolors';
import { createLicellCliApp } from './cli/app';
import { normalizeCliArgv } from './utils/argv';
import { resolveCliVersion } from './utils/version';
import { checkForUpdate, printUpdateTip } from './utils/update-check';
import { formatErrorMessage } from './utils/errors';
import { Config } from './utils/config';
import { isInteractiveTTY } from './utils/cli-shared';
import { runWelcomeSetupFlow } from './utils/first-run';
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
const cli = createLicellCliApp({ name: 'licell', version: cliVersion });
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

const normalizedArgv = normalizeCliArgv(process.argv);
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
  .then(async () => {
    if (argv.length <= 2) {
      if (getOutputMode() === 'json') {
        emitCliResult({
          stage: 'help',
          help: '请执行 licell <command> --help 查看命令说明'
        });
        process.exit(0);
      }
      if (isInteractiveTTY() && !isJsonOutput() && !Config.getAuth()) {
        await runWelcomeSetupFlow();
      } else {
        cli.outputHelp();
      }
      process.exit(0);
    }
  })
  .then(() => cli.parse(argv))
  .then(async () => {
    const result = await updateCheckPromise;
    if (result) printUpdateTip(result);
  })
  .catch(handleCliError);
