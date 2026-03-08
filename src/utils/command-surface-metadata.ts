import type { CatalogCommand, CatalogOption } from './command-catalog';
import {
  buildCommandOptionInsights,
  buildCommandResultDescriptor,
  buildCommandSafetyMetadata,
  type CommandDescriptor,
  type CommandFlowStep,
  type CommandOptionInsight,
  type CommandSafetyMetadata,
  type ResolvedCommandResultDescriptor
} from './command-metadata';
import {
  buildDerivedRecommendedFlow,
  deriveCommandSafety,
  deriveNamespaceSafety
} from './command-semantics';

export type CommandSurfaceScope = 'root' | 'namespace' | 'command';

export interface CommandSurfaceEntryLike {
  key: string;
  rawName: string;
  invocation: string;
  description: string;
}

export interface CommandSurfaceMetadata {
  examples: string[];
  agentTips: string[];
  optionInsights: CommandOptionInsight[];
  recommendedFlow: CommandFlowStep[];
  result?: ResolvedCommandResultDescriptor;
  safety?: CommandSafetyMetadata;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function toLicellInvocation(rawName: string) {
  return `licell ${rawName}`;
}

export function stripArgsFromUsage(commandUsage: string) {
  return commandUsage
    .trim()
    .split(/\s+/)
    .filter((token) => !(token.startsWith('<') && token.endsWith('>')) && !(token.startsWith('[') && token.endsWith(']')))
    .join(' ');
}

export function formatInvocationWithSelection(command: Pick<CatalogCommand, 'rawName'>, extraTokens: string[]) {
  const prefix = stripArgsFromUsage(command.rawName);
  const selected = extraTokens.filter((token) => token && !token.startsWith('-'));
  return selected.length > 0 ? `licell ${prefix} ${selected.join(' ')}` : toLicellInvocation(command.rawName);
}

function collectConfirmFlags(options: Pick<CatalogOption, 'primaryFlag'>[]) {
  return options
    .map((option) => option.primaryFlag)
    .filter((flag) => flag === '--yes' || flag === '--apply' || flag === '--force');
}

export function buildResolvedRecommendedFlow(input: {
  scope: CommandSurfaceScope;
  descriptor: CommandDescriptor;
  subcommands: CommandSurfaceEntryLike[];
}) {
  if (input.descriptor.recommendedFlow && input.descriptor.recommendedFlow.length > 0) {
    return input.descriptor.recommendedFlow.map((step) => ({
      title: step.title,
      command: step.command,
      reason: step.reason
    }));
  }

  if ((input.scope === 'namespace' || input.scope === 'command') && input.subcommands.length > 0) {
    return buildDerivedRecommendedFlow(input.subcommands);
  }

  return [] as CommandFlowStep[];
}

export function buildResolvedExamples(input: {
  scope: CommandSurfaceScope;
  key: string;
  command?: CatalogCommand;
  subcommands: CommandSurfaceEntryLike[];
  descriptor: CommandDescriptor;
  extraTokens: string[];
}) {
  if (input.descriptor.examples && input.descriptor.examples.length > 0) return [...input.descriptor.examples];

  if (input.scope === 'root') {
    return ['licell login', 'licell init', 'licell deploy', 'licell deploy --output json'];
  }

  if (input.scope === 'namespace') {
    const examples = input.subcommands.slice(0, 3).map((entry) => entry.invocation);
    const listEntry = input.subcommands.find((entry) => entry.key.endsWith(' list'));
    if (listEntry) examples.unshift(`${listEntry.invocation} --output json`);
    return unique(examples);
  }

  if (!input.command) return [] as string[];

  const selectedInvocation = formatInvocationWithSelection(input.command, input.extraTokens);
  const examples = [selectedInvocation];
  if (input.command.options.length > 0 && input.key !== 'mcp') {
    examples.push(`${selectedInvocation} --output json`);
  }
  if (input.subcommands.length > 0) {
    examples.push(...input.subcommands.slice(0, 2).map((entry) => entry.invocation));
  }
  return unique(examples);
}

export function buildResolvedAgentTips(input: {
  scope: CommandSurfaceScope;
  key: string;
  descriptor: CommandDescriptor;
  subcommands: CommandSurfaceEntryLike[];
}) {
  const defaults: string[] = [];
  if (input.scope !== 'root') {
    defaults.push('自动化调用时优先追加 `--output json`，获取稳定的结构化结果。');
  }
  if ((input.scope === 'namespace' || input.scope === 'command') && input.subcommands.length > 0) {
    defaults.push('先执行只读子命令（如 list/info/check/spec）获取现状，再执行变更命令。');
  }
  if (input.key === 'mcp') {
    defaults.push('真正启动 `mcp serve` 时不要传 `--output json`，否则会破坏 stdio JSON-RPC 输出。');
  }
  return unique([...(input.descriptor.agentTips || []), ...defaults]);
}

export function buildResolvedSafety(input: {
  scope: CommandSurfaceScope;
  command?: CatalogCommand;
  descriptor: CommandDescriptor;
  subcommands: CommandSurfaceEntryLike[];
}) {
  const explicit = buildCommandSafetyMetadata(input.descriptor);
  if (explicit) return explicit;

  if (input.scope === 'namespace') {
    const safety = deriveNamespaceSafety(input.subcommands);
    if (!safety) return undefined;
    return {
      ...safety,
      confirmFlags: []
    } satisfies CommandSafetyMetadata;
  }

  if (input.scope === 'command' && input.command) {
    const safety = deriveCommandSafety(input.command.key);
    if (!safety) return undefined;
    return {
      ...safety,
      confirmFlags: collectConfirmFlags(input.command.options)
    } satisfies CommandSafetyMetadata;
  }

  return undefined;
}

export function buildResolvedCommandSurfaceMetadata(input: {
  scope: CommandSurfaceScope;
  key: string;
  command?: CatalogCommand;
  subcommands: CommandSurfaceEntryLike[];
  descriptor: CommandDescriptor;
  extraTokens?: string[];
}) {
  const extraTokens = input.extraTokens || [];
  return {
    examples: buildResolvedExamples({
      scope: input.scope,
      key: input.key,
      command: input.command,
      subcommands: input.subcommands,
      descriptor: input.descriptor,
      extraTokens
    }),
    agentTips: buildResolvedAgentTips({
      scope: input.scope,
      key: input.key,
      descriptor: input.descriptor,
      subcommands: input.subcommands
    }),
    optionInsights: buildCommandOptionInsights(input.command?.options || [], input.descriptor),
    recommendedFlow: buildResolvedRecommendedFlow({
      scope: input.scope,
      descriptor: input.descriptor,
      subcommands: input.subcommands
    }),
    result: buildCommandResultDescriptor(input.descriptor),
    safety: buildResolvedSafety({
      scope: input.scope,
      command: input.command,
      descriptor: input.descriptor,
      subcommands: input.subcommands
    })
  } satisfies CommandSurfaceMetadata;
}

export const buildCommandSurfaceMetadata = buildResolvedCommandSurfaceMetadata;
