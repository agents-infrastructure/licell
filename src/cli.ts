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
import { buildHelpDocument, resolveHelpRequest, serializeHelpDocument, shouldRenderCustomHelp, stripArgsFromUsage, suggestCommands, type HelpDocument } from './utils/help';
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

function emitHelpDocument(help: HelpDocument, exitCode = 0): never {
  if (isJsonOutput()) {
    emitCliResult({
      stage: 'help',
      scope: help.scope,
      key: help.key,
      help: serializeHelpDocument(help)
    });
  } else {
    process.stdout.write(help.text);
  }
  process.exit(exitCode);
}

function emitRootHelp(exitCode = 0): never {
  const help = buildHelpDocument({
    argv: [argv[0] || 'node', argv[1] || 'licell'],
    version: cliVersion
  });
  if (!help) {
    process.exit(exitCode);
  }
  return emitHelpDocument(help, exitCode);
}

function renderSuggestionText(command: string) {
  const suggestions = suggestCommands(command);
  if (suggestions.length === 0) return '';
  return ['你是不是想找：', ...suggestions.map((suggestion) => `  ${suggestion}`), ''].join('\n');
}

cli.on('command:*', () => {
  const command = cli.args.join(' ');
  const suggestions = suggestCommands(command);
  if (isJsonOutput()) {
    emitCliError(new Error(`未知命令: ${command}`), {
      stage: 'parse',
      details: {
        command,
        ...(suggestions.length > 0 ? { suggestions } : {})
      }
    });
    process.exit(1);
  }
  console.error(pc.red(`未知命令: ${command}`));
  const suggestionText = renderSuggestionText(command);
  if (suggestionText) {
    process.stderr.write('\n');
    process.stderr.write(`${suggestionText}\n`);
  }
  process.stderr.write('\n');
  process.stderr.write(buildHelpDocument({
    argv: [argv[0] || 'node', argv[1] || 'licell'],
    version: cliVersion
  })?.text || '');
  process.exit(1);
});

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
    const commandKey = stripArgsFromUsage(missingArgsMatch[1]);
    const help = buildHelpDocument({
      argv: [argv[0] || 'node', argv[1] || 'licell', ...commandKey.split(/\s+/), '--help'],
      version: cliVersion
    });
    if (help) {
      process.stderr.write('\n');
      process.stderr.write(help.text);
      process.exit(1);
    }
    emitRootHelp(1);
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

const helpResolution = resolveHelpRequest(argv);
const shouldHandleHelp = shouldRenderCustomHelp(argv);
const isUpgradeCommand = argv.some((a) => a === 'upgrade');
const updateCheckPromise = (!isJsonOutput() && !isUpgradeCommand && !shouldHandleHelp && argv.length > 2)
  ? checkForUpdate(cliVersion).catch(() => null)
  : Promise.resolve(null);

void Promise.resolve()
  .then(async () => {
    if (argv.length <= 2) {
      const help = buildHelpDocument({ argv, version: cliVersion });
      if (help && (getOutputMode() === 'json' || !isInteractiveTTY() || Config.getAuth())) {
        emitHelpDocument(help, 0);
      }
      if (isInteractiveTTY() && !isJsonOutput() && !Config.getAuth()) {
        await runWelcomeSetupFlow();
      } else {
        emitRootHelp(0);
      }
      process.exit(0);
    }

    if (shouldHandleHelp) {
      const help = buildHelpDocument({ argv, version: cliVersion });
      if (help) emitHelpDocument(help, 0);
    }

    if (helpResolution.helpRequested && !shouldHandleHelp) {
      const command = helpResolution.key || 'help';
      const suggestions = suggestCommands(command);
      if (isJsonOutput()) {
        emitCliError(new Error(`未知命令: ${command}`), {
          stage: 'parse',
          details: {
            command,
            ...(suggestions.length > 0 ? { suggestions } : {})
          }
        });
        process.exit(1);
      }
      console.error(pc.red(`未知命令: ${command}`));
      const suggestionText = renderSuggestionText(command);
      if (suggestionText) {
        process.stderr.write('\n');
        process.stderr.write(`${suggestionText}\n`);
      }
      process.stderr.write('\n');
      process.stderr.write(buildHelpDocument({
        argv: [argv[0] || 'node', argv[1] || 'licell'],
        version: cliVersion
      })?.text || '');
      process.exit(1);
    }
  })
  .then(() => cli.parse(argv))
  .then(async () => {
    const result = await updateCheckPromise;
    if (result) printUpdateTip(result);
  })
  .catch(handleCliError);
