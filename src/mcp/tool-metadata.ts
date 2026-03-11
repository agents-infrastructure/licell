import {
  buildAgentCommandCatalog,
  LICELL_AGENT_COMMAND_CATALOG_KIND,
  LICELL_AGENT_COMMAND_CATALOG_SCHEMA_VERSION,
  type AgentCommandCatalogEntry,
  type AgentCommandResult
} from '../utils/command-reference';
import {
  cloneResolvedCommandResultDescriptor,
  type CommandFlowStep,
  type CommandSafetyMetadata,
  type CommandTaskHint
} from '../utils/command-metadata';
import { LICELL_HELP_KIND, LICELL_HELP_SCHEMA_VERSION } from '../utils/help';
import { buildResolvedNextActions, cloneResolvedCommandNextActions, type ResolvedCommandNextAction } from '../utils/command-next-actions';
import {
  groupCommandTasks,
  normalizeCommandTasks,
  type CommandTaskEntry,
  type CommandTaskGroup
} from '../utils/command-tasks';
import {
  buildLicellToolWorkflowAttachments,
  type LicellMcpToolWorkflowAttachment,
  type LicellWorkflowRole
} from './workflow-descriptors';

export type LicellMcpToolKind = 'builtin' | 'curated' | 'generated';
export type LicellMcpToolPreferredOutput = 'json' | 'text' | 'mixed';

export interface LicellMcpToolMetadata {
  source: 'licell-mcp-tool-registry';
  toolKind: LicellMcpToolKind;
  schemas: {
    help: {
      kind: typeof LICELL_HELP_KIND;
      schemaVersion: typeof LICELL_HELP_SCHEMA_VERSION;
    };
    commandCatalog: {
      kind: typeof LICELL_AGENT_COMMAND_CATALOG_KIND;
      schemaVersion: typeof LICELL_AGENT_COMMAND_CATALOG_SCHEMA_VERSION;
    };
  };
  preferredOutput: LicellMcpToolPreferredOutput;
  supportsStructuredOutput: boolean;
  openWorld: boolean;
  title?: string;
  summary?: string;
  description?: string;
  command?: {
    key?: string;
    signature?: string;
    rootCommand?: string;
  };
  section?: {
    id: string;
    title: string;
  };
  tags: string[];
  workflows: LicellMcpToolWorkflowAttachment[];
  tasks: CommandTaskEntry[];
  decisionGuide: CommandTaskGroup[];
  nextActions: ResolvedCommandNextAction[];
  safety?: CommandSafetyMetadata;
  result?: AgentCommandResult;
}

export interface LicellMcpToolMetadataEnvelope {
  licell: LicellMcpToolMetadata;
}

export interface LicellMcpToolAnnotations {
  destructiveHint?: boolean;
  openWorldHint?: boolean;
}

interface CommandSubjectLabels {
  singular: string;
  plural: string;
}

const SUBJECT_LABELS_BY_SIGNATURE_PREFIX: Array<[string, CommandSubjectLabels]> = [
  ['dns records', { singular: 'DNS record', plural: 'DNS records' }],
  ['domain app', { singular: 'app domain', plural: 'app domains' }],
  ['domain static', { singular: 'static site domain', plural: 'static site domains' }],
  ['fn domain', { singular: 'function domain', plural: 'function domains' }],
  ['fn', { singular: 'function', plural: 'functions' }],
  ['oss domain', { singular: 'OSS domain', plural: 'OSS domains' }],
  ['oss object', { singular: 'OSS object', plural: 'OSS objects' }],
  ['oss sync', { singular: 'OSS sync task', plural: 'OSS sync tasks' }],
  ['oss', { singular: 'OSS bucket', plural: 'OSS buckets' }],
  ['supa', { singular: 'Supabase instance', plural: 'Supabase instances' }]
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function cloneTasks(tasks: CommandTaskEntry[]) {
  return tasks.map((task) => ({ ...task, commands: [...task.commands] }));
}

function cloneDecisionGuide(decisionGuide: CommandTaskGroup[]) {
  return decisionGuide.map((group) => ({
    ...group,
    tasks: cloneTasks(group.tasks)
  }));
}

function cloneNextActions(nextActions: ResolvedCommandNextAction[]) {
  return cloneResolvedCommandNextActions(nextActions);
}

function cloneSafety(safety?: CommandSafetyMetadata) {
  return safety
    ? { ...safety, confirmFlags: [...safety.confirmFlags] }
    : undefined;
}

function cloneWorkflows(workflows: LicellMcpToolWorkflowAttachment[]) {
  return workflows.map((workflow) => ({
    ...workflow,
    suggestedCommandOrder: [...workflow.suggestedCommandOrder]
  }));
}

function cloneResult(result?: AgentCommandResult) {
  return cloneResolvedCommandResultDescriptor(result);
}

function buildSafetyHint(safety?: CommandSafetyMetadata) {
  return safety ? `Safety: ${safety.level} — ${safety.reason}` : '';
}

function buildStructuredResultHint(result?: AgentCommandResult) {
  if (!result) return '';
  const resultFieldNames = result.fieldTree.length > 0
    ? result.fieldTree.map((field) => field.name)
    : result.fields.map((field) => field.name);
  const fieldNames = unique([
    'stage',
    ...(result.outcomeKey ? [result.outcomeKey] : []),
    ...resultFieldNames
  ]);
  const summary = result.summary ? ` ${result.summary}` : '';
  return `Structured JSON result:${summary} Key fields: ${fieldNames.join(', ')}.`;
}

function buildDecisionGuideHint(decisionGuide: CommandTaskGroup[]) {
  const actionableGroups = decisionGuide.filter((group) => group.phase !== 'general' && group.tasks.length > 0);
  const groups = actionableGroups.length > 0
    ? actionableGroups
    : decisionGuide.filter((group) => group.tasks.length > 0);
  if (groups.length === 0) return '';

  const segments = groups.map((group) => {
    const commands = unique(group.tasks.flatMap((task) => task.commands)).slice(0, 2);
    if (commands.length > 0) return `${group.title} → ${commands.join(' · ')}`;
    const titles = group.tasks.map((task) => task.title).slice(0, 2);
    return `${group.title} → ${titles.join(' · ')}`;
  });

  return `Decision guide: ${segments.join(' | ')}.`;
}

function buildNextActionsHint(nextActions: ResolvedCommandNextAction[]) {
  if (nextActions.length === 0) return '';
  return `Next actions: ${nextActions.slice(0, 2).map((action) => `${action.priority} → ${action.commandTemplate}`).join(' | ')}.`;
}

function buildInvocation(metadata?: LicellMcpToolMetadataEnvelope) {
  const signature = metadata?.licell.command?.signature?.trim();
  if (signature) return `licell ${signature}`;
  const rootCommand = metadata?.licell.command?.rootCommand?.trim();
  return rootCommand ? `licell ${rootCommand}` : undefined;
}

function normalizeCommandSignature(signature: string) {
  return signature
    .replace(/<[^>]+>/g, '')
    .replace(/\[[^\]]+\]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function findSubjectLabels(commandSignature: string) {
  for (const [prefix, labels] of SUBJECT_LABELS_BY_SIGNATURE_PREFIX) {
    if (commandSignature === prefix || commandSignature.startsWith(`${prefix} `)) {
      return { prefix, labels };
    }
  }
  return undefined;
}

function deriveTitleFromSignature(commandSignature?: string, rootCommand?: string) {
  const normalized = normalizeText(commandSignature ? normalizeCommandSignature(commandSignature) : undefined);

  if (normalized) {
    const subject = findSubjectLabels(normalized);
    if (subject) {
      const action = normalized.slice(subject.prefix.length).trim();
      switch (action) {
        case 'list':
          return `List ${subject.labels.plural}`;
        case 'add':
          return `Add ${subject.labels.singular}`;
        case 'info':
          return `Get ${subject.labels.singular} info`;
        case 'invoke':
          return `Invoke ${subject.labels.singular}`;
        case 'rm':
          return `Remove ${subject.labels.singular}`;
        case 'bind':
          return `Bind ${subject.labels.singular}`;
        case 'unbind':
          return `Unbind ${subject.labels.singular}`;
      }
    }
  }

  return rootCommand ? `Run licell ${rootCommand}` : undefined;
}

export function resolveLicellMcpToolSummary(
  metadata?: LicellMcpToolMetadataEnvelope,
  fallbackSummary?: string
) {
  const explicitSummary = metadata?.licell.summary || metadata?.licell.description || normalizeText(fallbackSummary);
  if (explicitSummary) return explicitSummary;

  const matchedCommand = findAgentCommandForTool(
    metadata?.licell.command?.key || metadata?.licell.command?.signature,
    metadata?.licell.command?.rootCommand
  );
  return matchedCommand?.summary || matchedCommand?.description;
}

export function resolveLicellMcpToolTitle(
  metadata?: LicellMcpToolMetadataEnvelope,
  fallbackTitle?: string
) {
  const explicitTitle = normalizeText(metadata?.licell.title) || normalizeText(fallbackTitle);
  if (explicitTitle) return explicitTitle;

  const matchedCommand = findAgentCommandForTool(
    metadata?.licell.command?.key || metadata?.licell.command?.signature,
    metadata?.licell.command?.rootCommand
  );
  if (matchedCommand?.title) return matchedCommand.title;

  const derivedTitle = deriveTitleFromSignature(
    metadata?.licell.command?.signature,
    metadata?.licell.command?.rootCommand
  );
  if (derivedTitle) return derivedTitle;
  const invocation = buildInvocation(metadata);
  return invocation ? `Run ${invocation}` : 'Run licell tool';
}

export function resolveLicellMcpToolDestructive(
  metadata?: LicellMcpToolMetadataEnvelope,
  fallback = false
) {
  return metadata?.licell.safety?.level === 'destructive' || fallback;
}

export function resolveLicellMcpToolOpenWorld(
  metadata?: LicellMcpToolMetadataEnvelope,
  fallback = false
) {
  return Boolean(metadata?.licell.openWorld) || fallback;
}

export function buildLicellMcpToolAnnotations(input: {
  metadata?: LicellMcpToolMetadataEnvelope;
  fallback?: LicellMcpToolAnnotations;
}): LicellMcpToolAnnotations | undefined {
  const destructiveHint = resolveLicellMcpToolDestructive(input.metadata, Boolean(input.fallback?.destructiveHint));
  const openWorldHint = resolveLicellMcpToolOpenWorld(input.metadata, Boolean(input.fallback?.openWorldHint));
  if (!destructiveHint && !openWorldHint) return undefined;
  return {
    ...(destructiveHint ? { destructiveHint: true } : {}),
    ...(openWorldHint ? { openWorldHint: true } : {})
  } satisfies LicellMcpToolAnnotations;
}

export function renderLicellMcpToolDescription(
  metadata?: LicellMcpToolMetadataEnvelope,
  options?: {
    fallbackSummary?: string;
    fallbackDescription?: string;
    extraHints?: string[];
    suffix?: string;
  }
) {
  const primaryText = metadata?.licell.description || resolveLicellMcpToolSummary(metadata, options?.fallbackDescription || options?.fallbackSummary) || '';
  const hints = [
    primaryText,
    buildSafetyHint(metadata?.licell.safety),
    buildStructuredResultHint(metadata?.licell.result),
    buildNextActionsHint(metadata?.licell.nextActions || []),
    buildDecisionGuideHint(metadata?.licell.decisionGuide || []),
    ...(options?.extraHints || []),
    options?.suffix || ''
  ]
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return hints.join(' ');
}

export function cloneLicellMcpToolMetadataEnvelope(metadata?: LicellMcpToolMetadataEnvelope) {
  if (!metadata) return undefined;
  return {
    licell: {
      ...metadata.licell,
      command: metadata.licell.command ? { ...metadata.licell.command } : undefined,
      section: metadata.licell.section ? { ...metadata.licell.section } : undefined,
      schemas: {
        help: { ...metadata.licell.schemas.help },
        commandCatalog: { ...metadata.licell.schemas.commandCatalog }
      },
      tags: [...metadata.licell.tags],
      workflows: cloneWorkflows(metadata.licell.workflows),
      tasks: cloneTasks(metadata.licell.tasks),
      decisionGuide: cloneDecisionGuide(metadata.licell.decisionGuide),
      nextActions: cloneNextActions(metadata.licell.nextActions),
      safety: cloneSafety(metadata.licell.safety),
      result: cloneResult(metadata.licell.result)
    }
  } satisfies LicellMcpToolMetadataEnvelope;
}

export function buildLicellMcpToolMetadata(input: {
  toolKind: LicellMcpToolKind;
  preferredOutput: LicellMcpToolPreferredOutput;
  supportsStructuredOutput: boolean;
  openWorld?: boolean;
  title?: string;
  summary?: string;
  description?: string;
  command?: LicellMcpToolMetadata['command'];
  section?: LicellMcpToolMetadata['section'];
  tags?: string[];
  workflowRoleByTag?: Record<string, LicellWorkflowRole>;
  tasks?: CommandTaskEntry[];
  taskHints?: CommandTaskHint[];
  nextActions?: ResolvedCommandNextAction[];
  recommendedFlow?: CommandFlowStep[];
  safety?: CommandSafetyMetadata;
  result?: AgentCommandResult;
}) {
  const tags = unique([...(input.tags || [])]);
  const workflows = buildLicellToolWorkflowAttachments(tags, input.workflowRoleByTag);
  const tasks = input.tasks ? cloneTasks(input.tasks) : normalizeCommandTasks(input.taskHints || []);
  const decisionGuide = groupCommandTasks(tasks);
  const nextActions = input.nextActions
    ? cloneNextActions(input.nextActions)
    : buildResolvedNextActions({ recommendedFlow: input.recommendedFlow, tasks });
  return {
    licell: {
      source: 'licell-mcp-tool-registry',
      toolKind: input.toolKind,
      schemas: {
        help: {
          kind: LICELL_HELP_KIND,
          schemaVersion: LICELL_HELP_SCHEMA_VERSION
        },
        commandCatalog: {
          kind: LICELL_AGENT_COMMAND_CATALOG_KIND,
          schemaVersion: LICELL_AGENT_COMMAND_CATALOG_SCHEMA_VERSION
        }
      },
      preferredOutput: input.preferredOutput,
      supportsStructuredOutput: input.supportsStructuredOutput,
      openWorld: Boolean(input.openWorld),
      title: normalizeText(input.title) || deriveTitleFromSignature(input.command?.signature, input.command?.rootCommand),
      summary: normalizeText(input.summary),
      description: normalizeText(input.description),
      command: input.command ? { ...input.command } : undefined,
      section: input.section ? { ...input.section } : undefined,
      tags,
      workflows,
      tasks,
      decisionGuide,
      nextActions,
      safety: cloneSafety(input.safety),
      result: cloneResult(input.result)
    }
  } satisfies LicellMcpToolMetadataEnvelope;
}

const AGENT_COMMAND_CATALOG = buildAgentCommandCatalog();
const AGENT_COMMAND_BY_KEY = new Map(AGENT_COMMAND_CATALOG.commands.map((command) => [command.key, command]));

export function findAgentCommandForTool(commandSignature?: string, rootCommand?: string) {
  if (commandSignature) {
    const exact = AGENT_COMMAND_BY_KEY.get(commandSignature);
    if (exact) return exact;

    const normalized = normalizeCommandSignature(commandSignature);
    if (normalized) {
      const normalizedMatch = AGENT_COMMAND_BY_KEY.get(normalized);
      if (normalizedMatch) return normalizedMatch;
    }
  }

  if (rootCommand) {
    const rootMatch = AGENT_COMMAND_BY_KEY.get(rootCommand);
    if (rootMatch) return rootMatch;
  }

  return undefined;
}

export function buildLicellMcpToolMetadataFromAgentCommand(
  command: AgentCommandCatalogEntry,
  options: {
    toolKind: LicellMcpToolKind;
    preferredOutput?: LicellMcpToolPreferredOutput;
    supportsStructuredOutput?: boolean;
    openWorld?: boolean;
    tags?: string[];
    commandSignature?: string;
    title?: string;
    summary?: string;
    description?: string;
    workflowRoleByTag?: Record<string, LicellWorkflowRole>;
  }
) {
  return buildLicellMcpToolMetadata({
    toolKind: options.toolKind,
    preferredOutput: options.preferredOutput || 'json',
    supportsStructuredOutput: options.supportsStructuredOutput !== false,
    openWorld: options.openWorld,
    title: options.title || command.title,
    summary: options.summary || command.summary || command.description,
    description: options.description || command.description,
    command: {
      key: command.key,
      signature: options.commandSignature || command.key,
      rootCommand: command.rootCommand
    },
    section: command.sectionId && command.sectionTitle
      ? { id: command.sectionId, title: command.sectionTitle }
      : undefined,
    tags: [...(options.tags || []), command.rootCommand],
    workflowRoleByTag: options.workflowRoleByTag,
    tasks: command.tasks,
    nextActions: command.nextActions,
    recommendedFlow: command.recommendedFlow,
    safety: command.safety,
    result: command.result
  });
}
