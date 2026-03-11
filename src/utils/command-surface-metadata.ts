import type { CatalogCommand, CatalogOption } from './command-catalog';
import { buildResolvedNextActions, type ResolvedCommandNextAction } from './command-next-actions';
import {
  type CommandAutomationDescriptor,
  buildCommandOptionInsights,
  buildCommandResultDescriptor,
  buildCommandSafetyMetadata,
  type CommandDescriptor,
  type CommandFlowStep,
  type CommandInteractionDescriptor,
  type CommandOptionInsight,
  type CommandSafetyMetadata,
  type ResolvedCommandResultDescriptor
} from './command-metadata';
import {
  buildDerivedRecommendedFlow,
  deriveCommandSafety,
  deriveNamespaceSafety
} from './command-semantics';
import type { CommandTaskEntry } from './command-tasks';

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
  nextActions: ResolvedCommandNextAction[];
  interaction?: ResolvedCommandInteractionDescriptor;
  automation?: ResolvedCommandAutomationDescriptor;
  result?: ResolvedCommandResultDescriptor;
  safety?: CommandSafetyMetadata;
}

export interface ResolvedCommandInteractionDescriptor {
  ttyOnly: boolean;
  prompts: string[];
  notes: string[];
}

export interface ResolvedCommandAutomationDescriptor {
  preferredOutput: 'json' | 'text';
  explicitInputs: string[];
  notes: string[];
}

export type { ResolvedCommandNextAction } from './command-next-actions';

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function compact(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
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
  if (input.command.options.length > 0) {
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
  return unique([...(input.descriptor.agentTips || [])]);
}

function cloneInteractionDescriptor(descriptor?: CommandInteractionDescriptor) {
  if (!descriptor) return undefined;
  const prompts = unique(compact(descriptor.prompts || []));
  const notes = unique(compact(descriptor.notes || []));
  if (prompts.length === 0 && notes.length === 0) return undefined;
  return {
    ttyOnly: descriptor.ttyOnly !== false,
    prompts,
    notes
  } satisfies ResolvedCommandInteractionDescriptor;
}

function buildResolvedInteraction(input: {
  descriptor: CommandDescriptor;
}) {
  return cloneInteractionDescriptor(input.descriptor.interaction);
}

function buildResolvedAutomation(input: {
  scope: CommandSurfaceScope;
  command?: CatalogCommand;
  descriptor: CommandDescriptor;
  safety?: CommandSafetyMetadata;
}) {
  const configured = input.descriptor.automation || {} as CommandAutomationDescriptor;
  const preferredOutput = configured.preferredOutput || (input.scope === 'root' ? 'text' : 'json');
  const explicitInputs = unique(compact([
    ...(configured.explicitInputs || []),
    ...((input.command?.args || []).filter((arg) => arg.required).map((arg) => arg.raw)),
    ...((input.safety?.confirmFlags || []))
  ]));

  const notes = unique(compact(configured.notes || []));

  if (input.scope === 'root' && notes.length === 0 && configured.preferredOutput === undefined) {
    return undefined;
  }

  return {
    preferredOutput,
    explicitInputs,
    notes
  } satisfies ResolvedCommandAutomationDescriptor;
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
  tasks?: CommandTaskEntry[];
  extraTokens?: string[];
}) {
  const extraTokens = input.extraTokens || [];
  const recommendedFlow = buildResolvedRecommendedFlow({
    scope: input.scope,
    descriptor: input.descriptor,
    subcommands: input.subcommands
  });
  const safety = buildResolvedSafety({
    scope: input.scope,
    command: input.command,
    descriptor: input.descriptor,
    subcommands: input.subcommands
  });
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
    recommendedFlow,
    nextActions: buildResolvedNextActions({
      recommendedFlow,
      tasks: input.tasks || []
    }),
    interaction: buildResolvedInteraction({
      descriptor: input.descriptor
    }),
    automation: buildResolvedAutomation({
      scope: input.scope,
      command: input.command,
      descriptor: input.descriptor,
      safety
    }),
    result: buildCommandResultDescriptor(input.descriptor),
    safety
  } satisfies CommandSurfaceMetadata;
}

export const buildCommandSurfaceMetadata = buildResolvedCommandSurfaceMetadata;
