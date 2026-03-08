import {
  getCommandCatalog,
  type CatalogArg,
  type CatalogCommand,
  type CatalogOption,
  type CommandCatalog
} from './command-catalog';
import {
  buildCommandOptionInsights,
  buildCommandResultDescriptor,
  getCommandDescriptor,
  type CommandActionHint,
  type CommandDescriptor,
  type CommandFlowStep,
  type CommandOptionInsight,
  type CommandSafetyLevel,
  type CommandSafetyMetadata,
  type ResolvedCommandResultDescriptor
} from './command-metadata';
import {
  buildCommandTasks,
  groupCommandTasks,
  type CommandTaskEntry as HelpTaskDoc,
  type CommandTaskGroup as HelpTaskGroup
} from './command-tasks';
import { buildCommandReferenceSections, type CommandReferenceSection } from './command-reference';
import {
  buildDerivedRecommendedFlow,
  deriveCommandSafety,
  deriveNamespaceSafety
} from './command-semantics';

export type HelpScope = 'root' | 'namespace' | 'command';

export type HelpActionHint = CommandActionHint;

export interface HelpArgumentDoc extends CatalogArg {
  hint?: string;
}

export interface HelpCommandEntry {
  key: string;
  rawName: string;
  invocation: string;
  description: string;
  aliases: string[];
  namespace: boolean;
}

export interface HelpSectionDoc {
  id: string;
  title: string;
  summary?: string;
  commands: HelpCommandEntry[];
}

export type { HelpTaskDoc, HelpTaskGroup };

export type HelpSafetyLevel = CommandSafetyLevel;

export type HelpSafetyDoc = CommandSafetyMetadata;

export type HelpOptionInsight = CommandOptionInsight;

export type HelpFlowStep = CommandFlowStep;

export type HelpResultDoc = ResolvedCommandResultDescriptor;

export interface HelpRow {
  label: string;
  description: string;
}

export type HelpBlock =
  | {
      kind: 'rows';
      title: string;
      rows: HelpRow[];
    }
  | {
      kind: 'items';
      title: string;
      items: string[];
    }
  | {
      kind: 'tasks';
      title: 'Common Tasks';
      tasks: HelpTaskDoc[];
    }
  | {
      kind: 'decision-guide';
      title: 'Decision Guide';
      groups: HelpTaskGroup[];
      fallbackTasks: HelpTaskDoc[];
    }
  | {
      kind: 'command-groups';
      title: 'Command Groups';
      sections: HelpSectionDoc[];
    }
  | {
      kind: 'structured-result';
      title: 'Structured Result';
      result: HelpResultDoc;
    }
  | {
      kind: 'recommended-flow';
      title: 'Recommended Flow';
      steps: HelpFlowStep[];
    };

export interface HelpDocument {
  version: string;
  scope: HelpScope;
  key: string;
  title: string;
  summary?: string;
  usage: string[];
  args: HelpArgumentDoc[];
  options: CatalogOption[];
  globalOptions: CatalogOption[];
  aliases: string[];
  subcommands: HelpCommandEntry[];
  actionHints: HelpActionHint[];
  tasks: HelpTaskDoc[];
  decisionGuide: HelpTaskGroup[];
  notes: string[];
  examples: string[];
  agentTips: string[];
  relatedCommands: HelpCommandEntry[];
  sections: HelpSectionDoc[];
  safety?: HelpSafetyDoc;
  result?: HelpResultDoc;
  optionInsights: HelpOptionInsight[];
  recommendedFlow: HelpFlowStep[];
  blocks: HelpBlock[];
  text: string;
}

interface HelpResolution {
  helpRequested: boolean;
  bareNamespaceRequested: boolean;
  scope: HelpScope | 'unknown' | null;
  key: string;
  exactCommand?: CatalogCommand;
  extraTokens: string[];
}

const DEFAULT_ROOT_SUMMARY = 'Deploy and manage Alibaba Cloud Serverless applications — FC, OSS, ACR, DNS, SSL, CDN in one CLI.';

const STATIC_GLOBAL_OPTIONS: CatalogOption[] = [
  {
    rawName: '--output <mode>',
    flags: ['--output'],
    primaryFlag: '--output',
    description: '输出格式：text|json（json 更适合 Agent/MCP 解析）',
    takesValue: true,
    valueRequired: true,
    boolean: false
  },
  {
    rawName: '-h, --help',
    flags: ['-h', '--help'],
    primaryFlag: '--help',
    description: '显示当前帮助信息',
    takesValue: false,
    valueRequired: false,
    boolean: true
  },
  {
    rawName: '-v, --version',
    flags: ['-v', '--version'],
    primaryFlag: '--version',
    description: '显示版本号',
    takesValue: false,
    valueRequired: false,
    boolean: true
  }
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function compact(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

function toInvocation(rawName: string) {
  return `licell ${rawName}`.trim();
}

function formatInvocationWithSelection(command: CatalogCommand, extraTokens: string[]) {
  const selected = extraTokens.slice(0, command.args.length);
  const prefix = command.commandTokens.join(' ');
  return selected.length > 0 ? `licell ${prefix} ${selected.join(' ')}` : toInvocation(command.rawName);
}

function sortEntries(entries: HelpCommandEntry[]) {
  return [...entries].sort((left, right) => left.key.localeCompare(right.key));
}

function toHelpEntry(command: CatalogCommand, namespace = false): HelpCommandEntry {
  return {
    key: command.key,
    rawName: command.rawName,
    invocation: toInvocation(command.rawName),
    description: command.description,
    aliases: [...command.aliases],
    namespace
  };
}

function toNamespaceEntry(key: string, description: string): HelpCommandEntry {
  return {
    key,
    rawName: key,
    invocation: `licell ${key}`,
    description,
    aliases: [],
    namespace: true
  };
}

function padRows(rows: HelpRow[]) {
  const width = Math.min(36, Math.max(0, ...rows.map((row) => row.label.length)));
  return rows.map((row) => `  ${row.label.padEnd(width)}  ${row.description}`);
}

function renderList(title: string, rows: HelpRow[]) {
  if (rows.length === 0) return [] as string[];
  return [title, ...padRows(rows), ''];
}

function renderPlainList(title: string, items: string[]) {
  if (items.length === 0) return [] as string[];
  return [title, ...items.map((item) => `  - ${item}`), ''];
}

function getSectionForRoot(rootCommand: string, sections: CommandReferenceSection[]) {
  return sections.find((section) => section.roots.includes(rootCommand));
}

function getEnhancement(key: string): CommandDescriptor {
  return getCommandDescriptor(key);
}

function getGlobalOptions(catalog: CommandCatalog) {
  const detailed = (catalog as CommandCatalog & { globalOptionDetails?: CatalogOption[] }).globalOptionDetails;
  const options = detailed && detailed.length > 0
    ? detailed.map((option) => ({ ...option, flags: [...option.flags] }))
    : STATIC_GLOBAL_OPTIONS.map((option) => ({ ...option, flags: [...option.flags] }));

  return options.map((option) => {
    if (option.primaryFlag === '--help') return { ...option, description: '显示当前帮助信息' };
    if (option.primaryFlag === '--version') return { ...option, description: '显示版本号' };
    return option;
  });
}

function normalizeSuggestKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const prev = Array.from({ length: right.length + 1 }, (_, index) => index);
  const next = new Array<number>(right.length + 1).fill(0);

  for (let i = 0; i < left.length; i += 1) {
    next[0] = i + 1;
    for (let j = 0; j < right.length; j += 1) {
      const cost = left[i] === right[j] ? 0 : 1;
      next[j + 1] = Math.min(
        next[j] + 1,
        prev[j + 1] + 1,
        prev[j] + cost
      );
    }
    for (let j = 0; j < prev.length; j += 1) prev[j] = next[j]!;
  }

  return prev[right.length]!;
}

function collectSuggestionCandidates(catalog: CommandCatalog) {
  return unique([
    ...catalog.rootCommands,
    ...Object.keys(catalog.childCommands),
    ...catalog.commands.map((command) => command.key),
    ...Object.keys(catalog.aliasToKey)
  ]);
}

export function suggestCommands(input: string, catalog: CommandCatalog = getCommandCatalog(), limit = 5) {
  const query = normalizeSuggestKey(input);
  if (!query) return [] as string[];

  const queryTokens = query.split(' ');
  const scored = collectSuggestionCandidates(catalog)
    .map((candidate) => {
      const normalizedCandidate = normalizeSuggestKey(candidate);
      let score = levenshteinDistance(query, normalizedCandidate);
      if (normalizedCandidate.startsWith(query) || query.startsWith(normalizedCandidate)) score -= 2;
      if (normalizedCandidate.includes(query)) score -= 1;
      const candidateTokens = normalizedCandidate.split(' ');
      if (queryTokens.every((token) => candidateTokens.some((candidateToken) => candidateToken.startsWith(token)))) {
        score -= 1;
      }
      return { candidate, score, normalizedCandidate };
    })
    .filter((item) => item.score <= Math.max(4, Math.ceil(Math.max(query.length, item.normalizedCandidate.length) / 2)))
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score;
      if (left.candidate.split(' ').length !== right.candidate.split(' ').length) {
        return left.candidate.split(' ').length - right.candidate.split(' ').length;
      }
      return left.candidate.localeCompare(right.candidate);
    });

  return scored.slice(0, limit).map((item) => `licell ${item.candidate}`);
}

function buildTasksBlock(tasks: HelpTaskDoc[]): HelpBlock[] {
  if (tasks.length === 0) return [] as HelpBlock[];
  return [{ kind: 'tasks', title: 'Common Tasks', tasks }];
}

function buildDecisionGuideBlock(groups: HelpTaskGroup[], fallbackTasks: HelpTaskDoc[]): HelpBlock[] {
  if (fallbackTasks.length === 0) return [] as HelpBlock[];
  return [{ kind: 'decision-guide', title: 'Decision Guide', groups, fallbackTasks }];
}

function buildNamespaceSafety(subcommands: HelpCommandEntry[]) {
  const safety = deriveNamespaceSafety(subcommands);
  if (!safety) return undefined;
  return {
    ...safety,
    confirmFlags: []
  } satisfies HelpSafetyDoc;
}

function buildCommandSafety(command: CatalogCommand, enhancement: CommandDescriptor): HelpSafetyDoc | undefined {
  if (enhancement.safety?.level && enhancement.safety.reason) {
    return {
      level: enhancement.safety.level,
      reason: enhancement.safety.reason,
      confirmFlags: [...(enhancement.safety.confirmFlags || [])]
    };
  }

  const confirmFlags = command.options
    .map((option) => option.primaryFlag)
    .filter((flag) => flag === '--yes' || flag === '--apply' || flag === '--force');
  const safety = deriveCommandSafety(command.key);

  if (!safety) return undefined;
  return {
    ...safety,
    confirmFlags
  };
}

function buildSafetyDoc(input: {
  scope: HelpScope;
  command?: CatalogCommand;
  enhancement: CommandDescriptor;
  subcommands: HelpCommandEntry[];
}) {
  if (input.scope === 'root') return undefined;
  if (input.scope === 'namespace') return buildNamespaceSafety(input.subcommands);
  if (!input.command) return undefined;
  return buildCommandSafety(input.command, input.enhancement);
}

function buildRecommendedFlow(
  scope: HelpScope,
  enhancement: CommandDescriptor,
  subcommands: HelpCommandEntry[]
) {
  if (enhancement.recommendedFlow && enhancement.recommendedFlow.length > 0) {
    return enhancement.recommendedFlow.map((step) => ({
      title: step.title,
      command: step.command,
      reason: step.reason
    }));
  }

  if (scope !== 'namespace' || subcommands.length === 0) return [] as HelpFlowStep[];
  return buildDerivedRecommendedFlow(subcommands);
}

function buildOptionGuidanceRows(insights: HelpOptionInsight[]) {
  return insights.map((insight) => ({
    label: insight.flag,
    description: insight.cautions.length > 0
      ? `${insight.whenToUse} 注意：${insight.cautions.join(' ')}`
      : insight.whenToUse
  }));
}

function buildStructuredResultItems(result: HelpResultDoc) {
  const items: string[] = [];
  if (result.summary) items.push(result.summary);
  items.push('`stage` · 命令阶段标识。');
  if (result.outcomeKey) items.push(`\`${result.outcomeKey}\` · 结果布尔态字段。`);
  for (const field of result.fields) {
    items.push(`\`${field.name}\`${field.required ? '' : '（optional）'} · ${field.description}`);
  }
  return items;
}

function collectCommandishTokens(argv: string[]) {
  const tokens: string[] = [];
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) continue;
    if (token === '--') break;
    if (token === '--help' || token === '-h') break;
    if (token === '--output') {
      index += 1;
      continue;
    }
    if (token.startsWith('--output=')) continue;
    if (token.startsWith('-')) break;
    tokens.push(token);
  }
  return tokens;
}

function hasHelpFlag(argv: string[]) {
  return argv.slice(2).some((token) => token === '--help' || token === '-h');
}

function hasNonOutputOption(argv: string[]) {
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token || token === '--help' || token === '-h') continue;
    if (token === '--output') {
      index += 1;
      continue;
    }
    if (token.startsWith('--output=')) continue;
    if (token.startsWith('-')) return true;
  }
  return false;
}

function hasNamespaceKey(key: string, catalog: CommandCatalog) {
  return Boolean(catalog.childCommands[key]) || catalog.commands.some((command) => command.key.startsWith(`${key} `));
}

function resolveHelpTarget(argv: string[], catalog: CommandCatalog = getCommandCatalog()): HelpResolution {
  const tokens = collectCommandishTokens(argv);
  const helpRequested = hasHelpFlag(argv);
  const bareNamespaceRequested = !helpRequested && !hasNonOutputOption(argv);

  if (tokens.length === 0) {
    return {
      helpRequested,
      bareNamespaceRequested: false,
      scope: 'root',
      key: 'help',
      extraTokens: []
    };
  }

  for (let length = tokens.length; length > 0; length -= 1) {
    const key = tokens.slice(0, length).join(' ');
    const exactCommand = catalog.commandsByKey[catalog.aliasToKey[key] || key];
    if (exactCommand) {
      return {
        helpRequested,
        bareNamespaceRequested,
        scope: 'command',
        key: exactCommand.key,
        exactCommand,
        extraTokens: tokens.slice(length)
      };
    }
  }

  for (let length = tokens.length; length > 0; length -= 1) {
    const key = tokens.slice(0, length).join(' ');
    if (hasNamespaceKey(key, catalog)) {
      return {
        helpRequested,
        bareNamespaceRequested,
        scope: 'namespace',
        key,
        extraTokens: tokens.slice(length)
      };
    }
  }

  return {
    helpRequested,
    bareNamespaceRequested,
    scope: 'unknown',
    key: tokens.join(' '),
    extraTokens: []
  };
}

export function shouldRenderCustomHelp(argv: string[]) {
  const resolution = resolveHelpTarget(argv);
  if (resolution.scope === 'root') return true;
  if (resolution.helpRequested) return resolution.scope === 'command' || resolution.scope === 'namespace';
  return resolution.bareNamespaceRequested && resolution.scope === 'namespace';
}

export function stripArgsFromUsage(commandUsage: string) {
  return commandUsage
    .trim()
    .split(/\s+/)
    .filter((token) => !(token.startsWith('<') && token.endsWith('>')) && !(token.startsWith('[') && token.endsWith(']')))
    .join(' ');
}

function buildRootSectionDocs(catalog: CommandCatalog, sections: CommandReferenceSection[]): HelpSectionDoc[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    summary: section.summary,
    commands: section.roots.map((root) => {
      const exact = catalog.commandsByKey[root];
      const enhancement = getEnhancement(root);
      const childNames = catalog.childCommands[root] || [];
      const summary = enhancement.summary
        || exact?.description
        || (childNames.length > 0 ? `子命令：${childNames.join(', ')}` : '');
      return exact
        ? { ...toHelpEntry(exact), description: summary || exact.description }
        : toNamespaceEntry(root, summary || `子命令：${childNames.join(', ')}`);
    })
  }));
}

function buildImmediateChildren(parentKey: string, catalog: CommandCatalog): HelpCommandEntry[] {
  const childNames = catalog.childCommands[parentKey] || [];
  return sortEntries(childNames.map((childName) => {
    const childKey = `${parentKey} ${childName}`;
    const exact = catalog.commandsByKey[childKey];
    if (exact) return toHelpEntry(exact);
    const summary = getEnhancement(childKey).summary || `子命令：${(catalog.childCommands[childKey] || []).join(', ')}`;
    return toNamespaceEntry(childKey, summary);
  }));
}

function buildRelatedCommands(
  key: string,
  rootCommand: string,
  catalog: CommandCatalog,
  enhancement: CommandDescriptor,
  subcommands: HelpCommandEntry[]
) {
  const explicit = compact((enhancement.related || []).map((relatedKey) => {
    const exact = catalog.commandsByKey[relatedKey];
    if (exact) return JSON.stringify(toHelpEntry(exact));
    if (hasNamespaceKey(relatedKey, catalog)) {
      return JSON.stringify(toNamespaceEntry(relatedKey, getEnhancement(relatedKey).summary || '命令族'));
    }
    return undefined;
  })).map((value) => JSON.parse(value) as HelpCommandEntry);
  if (explicit.length > 0) return sortEntries(explicit);

  if (subcommands.length > 0) return subcommands.slice(0, 5);

  return sortEntries(
    catalog.commands
      .filter((command) => command.rootCommand === rootCommand && command.key !== key)
      .slice(0, 5)
      .map((command) => toHelpEntry(command))
  );
}

function buildDefaultExamples(
  scope: HelpScope,
  key: string,
  command: CatalogCommand | undefined,
  subcommands: HelpCommandEntry[],
  enhancement: CommandDescriptor,
  extraTokens: string[]
) {
  if (enhancement.examples && enhancement.examples.length > 0) return [...enhancement.examples];
  if (scope === 'root') return ['licell login', 'licell init', 'licell deploy', 'licell deploy --output json'];
  if (scope === 'namespace') {
    const examples = subcommands.slice(0, 3).map((entry) => entry.invocation);
    if (subcommands.some((entry) => entry.key.endsWith(' list'))) {
      const listEntry = subcommands.find((entry) => entry.key.endsWith(' list'));
      if (listEntry) examples.unshift(`${listEntry.invocation} --output json`);
    }
    return unique(examples);
  }
  if (!command) return [];
  const examples = [formatInvocationWithSelection(command, extraTokens)];
  if (command.options.length > 0 && key !== 'mcp') {
    examples.push(`${formatInvocationWithSelection(command, extraTokens)} --output json`);
  }
  if (subcommands.length > 0) {
    examples.push(...subcommands.slice(0, 2).map((entry) => entry.invocation));
  }
  return unique(examples);
}

function buildDefaultAgentTips(
  scope: HelpScope,
  key: string,
  enhancement: CommandDescriptor,
  subcommands: HelpCommandEntry[]
) {
  const defaults: string[] = [];
  if (scope !== 'root') {
    defaults.push('自动化调用时优先追加 `--output json`，获取稳定的结构化结果。');
  }
  if (scope === 'namespace' && subcommands.length > 0) {
    defaults.push('先执行只读子命令（如 list/info/check/spec）获取现状，再执行变更命令。');
  }
  if (key === 'mcp') {
    defaults.push('真正启动 `mcp serve` 时不要传 `--output json`，否则会破坏 stdio JSON-RPC 输出。');
  }
  return unique([...(enhancement.agentTips || []), ...defaults]);
}

function buildRootHelpBlocks(doc: Omit<HelpDocument, 'blocks' | 'text'>): HelpBlock[] {
  return [
    ...(doc.examples.length > 0 ? [{ kind: 'items', title: 'Quick Start', items: doc.examples } satisfies HelpBlock] : []),
    ...buildTasksBlock(doc.tasks),
    ...(doc.sections.length > 0 ? [{ kind: 'command-groups', title: 'Command Groups', sections: doc.sections } satisfies HelpBlock] : []),
    ...(doc.globalOptions.length > 0 ? [{
      kind: 'rows',
      title: 'Global Options',
      rows: doc.globalOptions.map((option) => ({ label: option.rawName, description: option.description }))
    } satisfies HelpBlock] : []),
    ...([...[...doc.notes, ...doc.agentTips]].filter(Boolean).length > 0 ? [{
      kind: 'items',
      title: 'Tips',
      items: [...doc.notes, ...doc.agentTips]
    } satisfies HelpBlock] : [])
  ];
}

function buildCommandLikeHelpBlocks(doc: Omit<HelpDocument, 'blocks' | 'text'>): HelpBlock[] {
  return [
    ...buildDecisionGuideBlock(doc.decisionGuide, doc.tasks),
    ...(doc.args.length > 0 ? [{
      kind: 'rows',
      title: 'Arguments',
      rows: doc.args.map((arg) => ({
        label: arg.raw,
        description: arg.hint || (arg.required ? '必填参数' : '可选参数')
      }))
    } satisfies HelpBlock] : []),
    ...(doc.actionHints.length > 0 ? [{
      kind: 'rows',
      title: 'Actions',
      rows: doc.actionHints.map((hint) => ({ label: hint.name, description: hint.description }))
    } satisfies HelpBlock] : []),
    ...(doc.subcommands.length > 0 ? [{
      kind: 'rows',
      title: 'Subcommands',
      rows: doc.subcommands.map((command) => ({
        label: command.rawName.startsWith(doc.key) ? command.rawName.slice(doc.key.length).trim() || command.rawName : command.rawName,
        description: command.description
      }))
    } satisfies HelpBlock] : []),
    ...(doc.options.length > 0 ? [{
      kind: 'rows',
      title: 'Options',
      rows: doc.options.map((option) => ({ label: option.rawName, description: option.description }))
    } satisfies HelpBlock] : []),
    ...(doc.optionInsights.length > 0 ? [{
      kind: 'rows',
      title: 'Option Guidance',
      rows: buildOptionGuidanceRows(doc.optionInsights)
    } satisfies HelpBlock] : []),
    ...(doc.globalOptions.length > 0 ? [{
      kind: 'rows',
      title: 'Global Options',
      rows: doc.globalOptions.map((option) => ({ label: option.rawName, description: option.description }))
    } satisfies HelpBlock] : []),
    ...(doc.aliases.length > 0 ? [{
      kind: 'items',
      title: 'Aliases',
      items: doc.aliases.map((alias) => `licell ${alias}`)
    } satisfies HelpBlock] : []),
    ...(doc.safety ? [{
      kind: 'items',
      title: 'Safety',
      items: [
        `${doc.safety.level} · ${doc.safety.reason}`,
        ...(doc.safety.confirmFlags.length > 0 ? [`confirm flags: ${doc.safety.confirmFlags.join(', ')}`] : [])
      ]
    } satisfies HelpBlock] : []),
    ...(doc.result ? [{ kind: 'structured-result', title: 'Structured Result', result: doc.result } satisfies HelpBlock] : []),
    ...(doc.recommendedFlow.length > 0 ? [{ kind: 'recommended-flow', title: 'Recommended Flow', steps: doc.recommendedFlow } satisfies HelpBlock] : []),
    ...(doc.examples.length > 0 ? [{ kind: 'items', title: 'Examples', items: doc.examples } satisfies HelpBlock] : []),
    ...(doc.relatedCommands.length > 0 ? [{
      kind: 'items',
      title: 'Related',
      items: doc.relatedCommands.map((command) => command.invocation)
    } satisfies HelpBlock] : []),
    ...(doc.notes.length > 0 ? [{ kind: 'items', title: 'Notes', items: doc.notes } satisfies HelpBlock] : []),
    ...(doc.agentTips.length > 0 ? [{ kind: 'items', title: 'Agent Tips', items: doc.agentTips } satisfies HelpBlock] : [])
  ];
}

function renderTasksBlock(tasks: HelpTaskDoc[]) {
  const lines = ['Common Tasks:'];
  for (const task of tasks) {
    lines.push(`  - ${task.title} · ${task.description}`);
    if (task.commands.length > 0) lines.push(`    start with: ${task.commands.join(' · ')}`);
  }
  lines.push('');
  return lines;
}

function renderDecisionGuideBlock(groups: HelpTaskGroup[], fallbackTasks: HelpTaskDoc[]) {
  const hasPhasedGuide = groups.some((group) => group.phase !== 'general');
  if (!hasPhasedGuide) return renderTasksBlock(fallbackTasks);

  const lines = ['Decision Guide:'];
  for (const group of groups) {
    if (group.tasks.length === 0 || group.phase === 'general') continue;
    lines.push(`  ${group.title}:`);
    for (const task of group.tasks) {
      lines.push(`    - ${task.title} · ${task.description}`);
      if (task.commands.length > 0) lines.push(`      start with: ${task.commands.join(' · ')}`);
    }
  }
  const generalTasks = groups.find((group) => group.phase === 'general');
  if (generalTasks && generalTasks.tasks.length > 0) {
    lines.push('  General:');
    for (const task of generalTasks.tasks) {
      lines.push(`    - ${task.title} · ${task.description}`);
      if (task.commands.length > 0) lines.push(`      start with: ${task.commands.join(' · ')}`);
    }
  }
  lines.push('');
  return lines;
}

function renderCommandGroupsBlock(sections: HelpSectionDoc[]) {
  const lines = ['Command Groups:'];
  for (const section of sections) {
    lines.push(`  ${section.title}`);
    if (section.summary) lines.push(`    ${section.summary}`);
    lines.push(...padRows(section.commands.map((command) => ({
      label: command.key,
      description: command.description
    }))).map((line) => `    ${line.trimStart()}`), '');
  }
  return lines;
}

function renderStructuredResultBlock(result: HelpResultDoc) {
  return renderPlainList('Structured Result:', buildStructuredResultItems(result));
}

function renderRecommendedFlowBlock(steps: HelpFlowStep[]) {
  return renderPlainList('Recommended Flow:', steps.map((step, index) => {
    const prefix = `${index + 1}. ${step.title}`;
    const command = step.command ? ` → ${step.command}` : '';
    return `${prefix}${command} · ${step.reason}`;
  }));
}

function renderHelpBlock(block: HelpBlock) {
  switch (block.kind) {
    case 'rows':
      return renderList(`${block.title}:`, block.rows);
    case 'items':
      return renderPlainList(`${block.title}:`, block.items);
    case 'tasks':
      return renderTasksBlock(block.tasks);
    case 'decision-guide':
      return renderDecisionGuideBlock(block.groups, block.fallbackTasks);
    case 'command-groups':
      return renderCommandGroupsBlock(block.sections);
    case 'structured-result':
      return renderStructuredResultBlock(block.result);
    case 'recommended-flow':
      return renderRecommendedFlowBlock(block.steps);
  }
}

function renderHelpBlocks(blocks: HelpBlock[]) {
  return blocks.flatMap((block) => renderHelpBlock(block));
}

function renderRootHelp(doc: Omit<HelpDocument, 'text'>) {
  const lines: string[] = [
    `licell/${doc.version}`,
    '',
    doc.summary || DEFAULT_ROOT_SUMMARY,
    '',
    'Usage:',
    ...doc.usage.map((usage) => `  ${usage}`),
    ''
  ];

  lines.push(...renderHelpBlocks(doc.blocks));
  return `${lines.join('\n').trim()}\n`;
}

function renderCommandLikeHelp(doc: Omit<HelpDocument, 'text'>) {
  const lines: string[] = [
    `licell/${doc.version}`,
    '',
    doc.title,
    ''
  ];

  if (doc.summary) lines.push(doc.summary, '');
  lines.push('Usage:', ...doc.usage.map((usage) => `  ${usage}`), '');
  lines.push(...renderHelpBlocks(doc.blocks));
  return `${lines.join('\n').trim()}\n`;
}

function finalizeHelpDocument(baseDoc: Omit<HelpDocument, 'blocks' | 'text'>): HelpDocument {
  const blocks = baseDoc.scope === 'root'
    ? buildRootHelpBlocks(baseDoc)
    : buildCommandLikeHelpBlocks(baseDoc);

  const doc: Omit<HelpDocument, 'text'> = {
    ...baseDoc,
    blocks
  };

  return {
    ...doc,
    text: doc.scope === 'root' ? renderRootHelp(doc) : renderCommandLikeHelp(doc)
  };
}

export function buildHelpDocument(input: {
  argv: string[];
  version: string;
  catalog?: CommandCatalog;
}): HelpDocument | null {
  const catalog = input.catalog || getCommandCatalog();
  const sections = buildCommandReferenceSections(catalog);
  const resolution = resolveHelpTarget(input.argv, catalog);
  if (resolution.scope === 'unknown' || resolution.scope === null) return null;

  if (resolution.scope === 'root') {
    const enhancement = getEnhancement('help');
    const tasks = buildCommandTasks({
      scope: 'root',
      enhancement,
      subcommands: [],
      sectionTasks: sections.flatMap((section) => section.taskHints || [])
    });
    return finalizeHelpDocument({
      version: input.version,
      scope: 'root',
      key: 'help',
      title: 'licell',
      summary: DEFAULT_ROOT_SUMMARY,
      usage: [
        'licell <command> [options]',
        'licell <command> --help',
        'licell <command> --output json'
      ],
      args: [],
      options: [],
      globalOptions: getGlobalOptions(catalog),
      aliases: [],
      subcommands: [],
      actionHints: [],
      tasks,
      decisionGuide: groupCommandTasks(tasks),
      notes: [...(enhancement.notes || [])],
      examples: buildDefaultExamples('root', 'help', undefined, [], enhancement, []),
      agentTips: buildDefaultAgentTips('root', 'help', enhancement, []),
      relatedCommands: [],
      sections: buildRootSectionDocs(catalog, sections),
      safety: undefined,
      result: undefined,
      optionInsights: buildCommandOptionInsights([], enhancement),
      recommendedFlow: buildRecommendedFlow('root', enhancement, [])
    });
  }

  if (resolution.scope === 'namespace') {
    const enhancement = getEnhancement(resolution.key);
    const rootCommand = resolution.key.split(' ')[0] || resolution.key;
    const section = getSectionForRoot(rootCommand, sections);
    const subcommands = buildImmediateChildren(resolution.key, catalog);
    const tasks = buildCommandTasks({ scope: 'namespace', enhancement, subcommands });
    return finalizeHelpDocument({
      version: input.version,
      scope: 'namespace',
      key: resolution.key,
      title: `licell ${resolution.key}`,
      summary: enhancement.summary || section?.summary,
      usage: [
        `licell ${resolution.key} <subcommand> [options]`,
        ...subcommands.slice(0, 6).map((entry) => entry.invocation)
      ],
      args: [],
      options: [],
      globalOptions: getGlobalOptions(catalog),
      aliases: [],
      subcommands,
      actionHints: [...(enhancement.actionHints || [])],
      tasks,
      decisionGuide: groupCommandTasks(tasks),
      notes: [...(enhancement.notes || [])],
      examples: buildDefaultExamples('namespace', resolution.key, undefined, subcommands, enhancement, resolution.extraTokens),
      agentTips: buildDefaultAgentTips('namespace', resolution.key, enhancement, subcommands),
      relatedCommands: buildRelatedCommands(resolution.key, rootCommand, catalog, enhancement, subcommands),
      sections: [],
      safety: buildSafetyDoc({ scope: 'namespace', enhancement, subcommands }),
      result: undefined,
      optionInsights: buildCommandOptionInsights([], enhancement),
      recommendedFlow: buildRecommendedFlow('namespace', enhancement, subcommands)
    });
  }

  const command = resolution.exactCommand!;
  const enhancement = getEnhancement(command.key);
  const subcommands = buildImmediateChildren(command.key, catalog);
  const argumentHints = enhancement.argumentHints || {};
  const args = command.args.map((arg) => ({ ...arg, hint: argumentHints[arg.name] }));
  const tasks = buildCommandTasks({ scope: 'command', enhancement, subcommands });

  return finalizeHelpDocument({
    version: input.version,
    scope: 'command',
    key: command.key,
    title: toInvocation(command.rawName),
    summary: enhancement.summary || command.description,
    usage: unique([
      toInvocation(command.rawName),
      formatInvocationWithSelection(command, resolution.extraTokens),
      ...subcommands.slice(0, 4).map((entry) => entry.invocation)
    ]),
    args,
    options: command.options.map((option) => ({ ...option, flags: [...option.flags] })),
    globalOptions: getGlobalOptions(catalog),
    aliases: [...command.aliases],
    subcommands,
    actionHints: [...(enhancement.actionHints || [])],
    tasks,
    decisionGuide: groupCommandTasks(tasks),
    notes: [...(enhancement.notes || [])],
    examples: buildDefaultExamples('command', command.key, command, subcommands, enhancement, resolution.extraTokens),
    agentTips: buildDefaultAgentTips('command', command.key, enhancement, subcommands),
    relatedCommands: buildRelatedCommands(command.key, command.rootCommand, catalog, enhancement, subcommands),
    sections: [],
    safety: buildSafetyDoc({ scope: 'command', command, enhancement, subcommands }),
    result: buildCommandResultDescriptor(enhancement),
    optionInsights: buildCommandOptionInsights(command.options, enhancement),
    recommendedFlow: buildRecommendedFlow('command', enhancement, subcommands)
  });
}

export function renderHelpDocument(input: { argv: string[]; version: string; catalog?: CommandCatalog }) {
  return buildHelpDocument(input)?.text || '';
}

export function resolveHelpRequest(argv: string[], catalog?: CommandCatalog) {
  return resolveHelpTarget(argv, catalog);
}
