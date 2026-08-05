import { createLicellCliApp } from '../cli/app';
import type { DeclaredCliCommand } from '../commands/module';

export interface CatalogArg {
  raw: string;
  name: string;
  required: boolean;
  variadic: boolean;
}

export interface CatalogOption {
  rawName: string;
  flags: string[];
  primaryFlag: string;
  description: string;
  takesValue: boolean;
  valueRequired: boolean;
  boolean: boolean;
}

export interface CatalogCommand {
  key: string;
  rawName: string;
  description: string;
  commandTokens: string[];
  args: CatalogArg[];
  options: CatalogOption[];
  aliases: string[];
  rootCommand: string;
  region?: DeclaredCliCommand['region'];
  regionOptionMode?: DeclaredCliCommand['regionOptionMode'];
  regionExclusion?: DeclaredCliCommand['regionExclusion'];
}

export interface CommandCatalog {
  commands: CatalogCommand[];
  commandsByKey: Record<string, CatalogCommand>;
  aliasToKey: Record<string, string>;
  rootCommands: string[];
  childCommands: Record<string, string[]>;
  commandOptions: Record<string, string[]>;
  globalOptions: string[];
  globalOptionDetails: CatalogOption[];
}

const STATIC_GLOBAL_OPTIONS = ['-h', '--help', '-v', '--version'];
let cachedCatalog: CommandCatalog | null = null;

function unique(values: string[]) {
  return [...new Set(values)];
}

function parseCommandRawName(rawName: string) {
  const tokens = rawName.trim().split(/\s+/).filter(Boolean);
  const commandTokens: string[] = [];
  const args: CatalogArg[] = [];

  for (const token of tokens) {
    if ((token.startsWith('<') && token.endsWith('>')) || (token.startsWith('[') && token.endsWith(']'))) {
      const inner = token.slice(1, -1);
      args.push({
        raw: token,
        name: inner.replace(/\.\.\.$/, ''),
        required: token.startsWith('<'),
        variadic: inner.endsWith('...')
      });
      continue;
    }
    commandTokens.push(token);
  }

  return { commandTokens, args };
}

function parseOption(rawName: string, description: string): CatalogOption | null {
  const flags = rawName.match(/--[A-Za-z0-9-]+|-[A-Za-z]/g) || [];
  if (flags.length === 0) return null;
  const longFlag = flags.find((flag) => flag.startsWith('--'));
  return {
    rawName,
    flags,
    primaryFlag: longFlag || flags[0]!,
    description,
    takesValue: rawName.includes('<') || rawName.includes('['),
    valueRequired: rawName.includes('<'),
    boolean: !rawName.includes('<') && !rawName.includes('[')
  };
}

function buildCommandCatalog(): CommandCatalog {
  const cli = createLicellCliApp({ name: 'licell' });
  const commands = cli.commands.map((command) => {
    const declared = (command as typeof command & { licellDeclaredCommand?: DeclaredCliCommand }).licellDeclaredCommand;
    const rawName = declared?.rawName || command.rawName;
    const { commandTokens, args } = parseCommandRawName(rawName);
    const key = commandTokens.join(' ');
    const options = (command.options || [])
      .map((option) => parseOption(option.rawName, option.description || ''))
      .filter((option): option is CatalogOption => Boolean(option));

    return {
      key,
      rawName,
      description: command.description || '',
      commandTokens,
      args,
      options,
      aliases: [...(command.aliasNames || [])],
      rootCommand: commandTokens[0] || '',
      region: declared?.region,
      regionOptionMode: declared?.regionOptionMode,
      regionExclusion: declared?.regionExclusion
    } satisfies CatalogCommand;
  }).filter((command) => command.commandTokens.length > 0);

  const commandsByKey = Object.fromEntries(commands.map((command) => [command.key, command]));
  const aliasToKey = Object.fromEntries(
    commands.flatMap((command) => command.aliases.map((alias) => [alias, command.key] as const))
  );
  const rootCommands = unique(commands.map((command) => command.rootCommand).filter(Boolean));

  const childCommands: Record<string, string[]> = {};
  const commandOptions: Record<string, string[]> = {};
  for (const command of commands) {
    commandOptions[command.key] = unique(command.options.flatMap((option) => option.flags.filter((flag) => flag.startsWith('--'))));

    for (let index = 1; index < command.commandTokens.length; index += 1) {
      const parentKey = command.commandTokens.slice(0, index).join(' ');
      const childName = command.commandTokens[index];
      childCommands[parentKey] = unique([...(childCommands[parentKey] || []), childName]);
    }
  }

  const globalOptionDetails = unique((cli.globalCommand?.options || [])
    .map((option) => parseOption(option.rawName, option.description || ''))
    .filter((option): option is CatalogOption => Boolean(option))
    .map((option) => option.primaryFlag)).map((flag) => {
      return (cli.globalCommand?.options || [])
        .map((option) => parseOption(option.rawName, option.description || ''))
        .filter((option): option is CatalogOption => Boolean(option))
        .find((option) => option.primaryFlag === flag)!;
    });

  const globalOptions = unique([
    ...STATIC_GLOBAL_OPTIONS,
    ...globalOptionDetails.flatMap((option) => option.flags)
  ]);

  return {
    commands,
    commandsByKey,
    aliasToKey,
    rootCommands,
    childCommands,
    commandOptions,
    globalOptions,
    globalOptionDetails
  };
}

export function getCommandCatalog() {
  if (!cachedCatalog) {
    cachedCatalog = buildCommandCatalog();
  }
  return cachedCatalog;
}

export function resetCommandCatalogCache() {
  cachedCatalog = null;
}

export function listCatalogCommandsByRoot(rootCommand: string) {
  return getCommandCatalog().commands.filter((command) => command.rootCommand === rootCommand);
}
