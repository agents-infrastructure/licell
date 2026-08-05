import {
  getCommandCatalog,
  type CatalogCommand,
  type CommandCatalog,
  type CatalogOption
} from './command-catalog';
import {
  buildCommandReferenceSections,
  type CommandReferenceSection
} from './command-reference-sections';
import {
  getCommandDescriptor,
  cloneResolvedCommandResultDescriptor,
  type CommandActionHint,
  type CommandFlowStep,
  type CommandOptionInsight,
  type CommandSafetyMetadata,
  type ResolvedCommandResultDescriptor
} from './command-metadata';
import { type CommandTaskEntry, type CommandTaskGroup } from './command-tasks';
import {
  type ResolvedCommandAutomationDescriptor,
  type ResolvedCommandInteractionDescriptor,
  type ResolvedCommandNextAction,
  toLicellInvocation
} from './command-surface-metadata';
import {
  buildHelpSemanticDocument,
  LICELL_HELP_KIND,
  LICELL_HELP_SCHEMA_VERSION
} from './help';
import { getCliRecordContractDocument } from './cli-record-contract';
import { renderStructuredResultLines } from './structured-result-render';

export { buildCommandReferenceSections } from './command-reference-sections';
export type { CommandReferenceSection } from './command-reference-sections';

export const LICELL_AGENT_COMMAND_CATALOG_KIND = 'licell-agent-command-catalog' as const;
export const LICELL_AGENT_COMMAND_CATALOG_SCHEMA_VERSION = '1.0' as const;

export interface AgentCommandCatalogSection {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  commandKeys: string[];
}

export type AgentCommandResult = ResolvedCommandResultDescriptor;

export interface AgentCommandCatalogEntry {
  key: string;
  rawName: string;
  invocation: string;
  title?: string;
  description: string;
  summary?: string;
  rootCommand: string;
  args: CatalogCommand['args'];
  aliases: string[];
  options: CatalogOption[];
  subcommands: string[];
  notes: string[];
  examples: string[];
  agentTips: string[];
  actionHints: CommandActionHint[];
  argumentHints: Record<string, string>;
  tasks: CommandTaskEntry[];
  decisionGuide: CommandTaskGroup[];
  nextActions: ResolvedCommandNextAction[];
  relatedCommands: string[];
  interaction?: ResolvedCommandInteractionDescriptor;
  automation?: ResolvedCommandAutomationDescriptor;
  safety?: CommandSafetyMetadata;
  optionInsights: CommandOptionInsight[];
  recommendedFlow: CommandFlowStep[];
  result?: AgentCommandResult;
  region?: CatalogCommand['region'];
  regionOptionMode?: CatalogCommand['regionOptionMode'];
  sectionId: string;
  sectionTitle: string;
}

export interface AgentCommandCatalogDocument {
  source: 'licell-cli-registry';
  kind: typeof LICELL_AGENT_COMMAND_CATALOG_KIND;
  schemaVersion: typeof LICELL_AGENT_COMMAND_CATALOG_SCHEMA_VERSION;
  schemas: {
    help: {
      kind: typeof LICELL_HELP_KIND;
      schemaVersion: typeof LICELL_HELP_SCHEMA_VERSION;
    };
    cliRecord: {
      kind: string;
      schemaVersion: string;
    };
  };
  cliRecords: ReturnType<typeof getCliRecordContractDocument>;
  globalOptions: string[];
  rootCommands: string[];
  childCommands: CommandCatalog['childCommands'];
  commandOptions: CommandCatalog['commandOptions'];
  sections: AgentCommandCatalogSection[];
  commands: AgentCommandCatalogEntry[];
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function escapeMarkdownCell(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.replace(/\|/g, '\\|') || '—';
}

function getCommandDisplayDescription(command: CatalogCommand) {
  return getCommandDescriptor(command.key).summary || command.description;
}

function summarizeKeyOptions(command: CatalogCommand) {
  const allFlags = unique(command.options.map((option) => option.primaryFlag));
  const flags = (command.region
    ? [
      ...allFlags.filter((flag) => flag === '--region'),
      ...allFlags.filter((flag) => flag !== '--region')
    ]
    : allFlags).slice(0, 4);
  return flags.length > 0 ? flags.map((flag) => `\`${flag}\``).join(', ') : '—';
}

function renderCommandTable(commands: CatalogCommand[]) {
  const rows = commands.map((command) => {
    const display = getCommandDisplayDescription(command);
    const description = display ? escapeMarkdownCell(display) : '—';
    return `| \`${toLicellInvocation(command.rawName)}\` | ${description} | ${summarizeKeyOptions(command)} |`;
  });

  return [
    '| 命令 | 说明 | 关键选项 |',
    '|------|------|----------|',
    ...rows
  ].join('\n');
}

function renderOptionTable(command: CatalogCommand) {
  if (command.options.length === 0) return '';
  const rows = command.options.map((option) => {
    const description = option.description ? escapeMarkdownCell(option.description) : '—';
    return `| \`${option.rawName}\` | ${description} |`;
  });

  return [
    '| 选项 | 说明 |',
    '|------|------|',
    ...rows
  ].join('\n');
}

function renderStructuredResultMarkdown(result: AgentCommandResult) {
  return renderStructuredResultLines(result, {
    separator: '：',
    optionalLabel: '（可选）'
  });
}

function renderDecisionGuideMarkdown(command: AgentCommandCatalogEntry) {
  if (command.tasks.length === 0) return [] as string[];

  const actionableGroups = command.decisionGuide.filter((group) => group.phase !== 'general');
  if (actionableGroups.length === 0) {
    return [
      '',
      '常用任务：',
      ...command.tasks.map((task) => {
        const commands = task.commands.length > 0 ? ` 起手式：${task.commands.map((item) => `\`${item}\``).join(' · ')}` : '';
        return `- ${task.title}：${task.description}${commands}`;
      })
    ];
  }

  const lines = ['', '决策指南：'];
  for (const group of actionableGroups) {
    const descriptions = group.tasks.map((task) => `${task.title}：${task.description}`).join('；');
    const commands = unique(group.tasks.flatMap((task) => task.commands));
    const commandText = commands.length > 0 ? ` 起手式：${commands.map((item) => `\`${item}\``).join(' · ')}` : '';
    lines.push(`- ${group.title}：${descriptions}${commandText}`);
  }
  return lines;
}

export function buildAgentCommandCatalog(catalog: CommandCatalog = getCommandCatalog()): AgentCommandCatalogDocument {
  const sections = buildCommandReferenceSections(catalog);
  const cliRecord = getCliRecordContractDocument();
  const sectionByRoot = new Map<string, CommandReferenceSection>();
  for (const section of sections) {
    for (const root of section.roots) {
      sectionByRoot.set(root, section);
    }
  }

  return {
    source: 'licell-cli-registry',
    kind: LICELL_AGENT_COMMAND_CATALOG_KIND,
    schemaVersion: LICELL_AGENT_COMMAND_CATALOG_SCHEMA_VERSION,
    schemas: {
      help: {
        kind: LICELL_HELP_KIND,
        schemaVersion: LICELL_HELP_SCHEMA_VERSION
      },
      cliRecord: {
        kind: cliRecord.kind,
        schemaVersion: cliRecord.schemaVersion
      }
    },
    cliRecords: cliRecord,
    globalOptions: [...catalog.globalOptions],
    rootCommands: [...catalog.rootCommands],
    childCommands: Object.fromEntries(
      Object.entries(catalog.childCommands).map(([key, value]) => [key, [...value]])
    ),
    commandOptions: Object.fromEntries(
      Object.entries(catalog.commandOptions).map(([key, value]) => [key, [...value]])
    ),
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      roots: [...section.roots],
      summary: section.summary,
      commandKeys: section.commands.map((command) => command.key)
    })),
    commands: sections.flatMap((section) => section.commands.map((command) => {
      const descriptor = getCommandDescriptor(command.key);
      const help = buildHelpSemanticDocument({
        argv: ['node', 'src/cli.ts', ...command.key.split(' '), '--help'],
        catalog
      });

      if (!help || help.scope !== 'command') {
        throw new Error(`failed to build semantic help for command: ${command.key}`);
      }

      return {
        key: help.key,
        rawName: command.rawName,
        invocation: toLicellInvocation(command.rawName),
        title: descriptor.title,
        description: help.summary || command.description,
        summary: help.summary,
        rootCommand: command.rootCommand,
        args: help.args.map((arg) => ({ ...arg })),
        aliases: [...help.aliases],
        options: help.options.map((option) => ({ ...option, flags: [...option.flags] })),
        subcommands: [...(catalog.childCommands[command.key] || [])],
        notes: [...help.notes],
        examples: [...help.examples],
        agentTips: [...help.agentTips],
        actionHints: help.actionHints.map((hint) => ({ ...hint })),
        argumentHints: Object.fromEntries(
          help.args
            .filter((arg) => Boolean(arg.hint))
            .map((arg) => [arg.name, arg.hint!])
        ),
        tasks: help.tasks.map((task) => ({ ...task, commands: [...task.commands] })),
        decisionGuide: help.decisionGuide.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) => ({ ...task, commands: [...task.commands] }))
        })),
        nextActions: help.nextActions.map((action) => ({ ...action })),
        relatedCommands: help.relatedCommands.map((entry) => entry.key),
        interaction: help.interaction
          ? {
              ...help.interaction,
              prompts: [...help.interaction.prompts],
              notes: [...help.interaction.notes]
            }
          : undefined,
        automation: help.automation
          ? {
              ...help.automation,
              explicitInputs: [...help.automation.explicitInputs],
              notes: [...help.automation.notes]
            }
          : undefined,
        safety: help.safety
          ? { ...help.safety, confirmFlags: [...help.safety.confirmFlags] }
          : undefined,
        optionInsights: help.optionInsights.map((insight) => ({ ...insight, cautions: [...insight.cautions] })),
        recommendedFlow: help.recommendedFlow.map((step) => ({ ...step })),
        result: cloneResolvedCommandResultDescriptor(help.result),
        region: help.region
          ? {
              ...help.region,
              target: help.region.target ? { ...help.region.target } : undefined
            }
          : undefined,
        regionOptionMode: help.regionOptionMode,
        sectionId: sectionByRoot.get(command.rootCommand)?.id || section.id,
        sectionTitle: sectionByRoot.get(command.rootCommand)?.title || section.title
      };
    }))
  };
}

export function filterAgentCommandCatalog(
  catalog: AgentCommandCatalogDocument,
  filters?: { rootCommand?: string; commandKey?: string }
): AgentCommandCatalogDocument {
  const rootCommand = filters?.rootCommand?.trim();
  const commandKey = filters?.commandKey?.trim();

  const commands = catalog.commands.filter((command) => {
    if (rootCommand && command.rootCommand !== rootCommand) return false;
    if (commandKey && command.key !== commandKey) return false;
    return true;
  }).map((command) => ({
    ...command,
    args: command.args.map((arg) => ({ ...arg })),
    aliases: [...command.aliases],
    options: command.options.map((option) => ({ ...option, flags: [...option.flags] })),
    subcommands: [...command.subcommands],
    notes: [...command.notes],
    examples: [...command.examples],
    agentTips: [...command.agentTips],
    actionHints: command.actionHints.map((hint) => ({ ...hint })),
    argumentHints: { ...command.argumentHints },
    tasks: command.tasks.map((task) => ({ ...task, commands: [...task.commands] })),
    decisionGuide: command.decisionGuide.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({ ...task, commands: [...task.commands] }))
    })),
    nextActions: command.nextActions.map((action) => ({ ...action })),
    relatedCommands: [...command.relatedCommands],
    interaction: command.interaction
      ? {
          ...command.interaction,
          prompts: [...command.interaction.prompts],
          notes: [...command.interaction.notes]
        }
      : undefined,
    automation: command.automation
      ? {
          ...command.automation,
          explicitInputs: [...command.automation.explicitInputs],
          notes: [...command.automation.notes]
        }
      : undefined,
    safety: command.safety
      ? { ...command.safety, confirmFlags: [...command.safety.confirmFlags] }
      : undefined,
    optionInsights: command.optionInsights.map((insight) => ({ ...insight, cautions: [...insight.cautions] })),
    recommendedFlow: command.recommendedFlow.map((step) => ({ ...step })),
    result: cloneResolvedCommandResultDescriptor(command.result),
    region: command.region
      ? {
          ...command.region,
          target: command.region.target ? { ...command.region.target } : undefined
        }
      : undefined
  }));

  const allowedKeys = new Set(commands.map((command) => command.key));
  const allowedRoots = new Set(commands.map((command) => command.rootCommand));

  return {
    ...catalog,
    schemas: {
      help: {
        ...catalog.schemas.help
      },
      cliRecord: {
        ...catalog.schemas.cliRecord
      }
    },
    cliRecords: getCliRecordContractDocument(),
    globalOptions: [...catalog.globalOptions],
    rootCommands: catalog.rootCommands.filter((root) => allowedRoots.has(root)),
    childCommands: Object.fromEntries(
      Object.entries(catalog.childCommands)
        .filter(([key]) => allowedKeys.has(key))
        .map(([key, value]) => [
          key,
          value.filter((child) => allowedKeys.has(`${key} ${child}`))
        ])
    ),
    commandOptions: Object.fromEntries(
      Object.entries(catalog.commandOptions)
        .filter(([key]) => allowedKeys.has(key))
        .map(([key, value]) => [key, [...value]])
    ),
    sections: catalog.sections
      .map((section) => ({
        ...section,
        roots: section.roots.filter((root) => allowedRoots.has(root)),
        commandKeys: section.commandKeys.filter((key) => allowedKeys.has(key))
      }))
      .filter((section) => section.commandKeys.length > 0),
    commands
  };
}

export function renderSkillCommandReference(catalog: CommandCatalog = getCommandCatalog()) {
  const sections = buildCommandReferenceSections(catalog);
  const agentCatalog = buildAgentCommandCatalog(catalog);
  const agentCommandByKey = new Map(agentCatalog.commands.map((command) => [command.key, command]));
  const parts: string[] = [
    '## Command Reference',
    '',
    '以下命令清单由 licell CLI 注册表自动生成；新增或修改 CLI 命令后，Skills / docs/reference/agent-surfaces.md / shell completion 会同步反映。'
  ];

  for (const section of sections) {
    parts.push('', `### ${section.title}`, '');

    if (section.summary) {
      parts.push(section.summary, '');
    }

    if (section.notes.length > 0) {
      for (const note of section.notes) {
        parts.push(`- ${note}`);
      }
      parts.push('');
    }

    parts.push(renderCommandTable(section.commands));

    const detailedCommands = section.commands.filter((command) => {
      const agentCommand = agentCommandByKey.get(command.key);
      return command.options.length > 0
        || command.aliases.length > 0
        || Boolean(agentCommand?.result)
        || Boolean(agentCommand?.notes.length)
        || Boolean(agentCommand?.tasks.length)
        || Boolean(agentCommand?.optionInsights.length)
        || Boolean(agentCommand?.recommendedFlow.length)
        || Boolean(agentCommand?.agentTips.length);
    });
    for (const command of detailedCommands) {
      const metadata: string[] = [];
      if (command.args.length > 0) {
        metadata.push(`参数：${command.args.map((arg) => `\`${arg.raw}\``).join(' ')}`);
      }
      if (command.aliases.length > 0) {
        metadata.push(`别名：${command.aliases.map((alias) => `\`${alias}\``).join(', ')}`);
      }
      if ((catalog.childCommands[command.key] || []).length > 0) {
        metadata.push(`子命令：${catalog.childCommands[command.key].map((child) => `\`${child}\``).join(', ')}`);
      }
      const agentCommand = agentCommandByKey.get(command.key);

      parts.push('', `#### \`${toLicellInvocation(command.rawName)}\``);
      if (agentCommand?.description || command.description) {
        parts.push('', agentCommand?.description || command.description);
      }
      if (metadata.length > 0) {
        parts.push('', metadata.join(' · '));
      }
      if (agentCommand?.notes.length) {
        parts.push('', '说明：');
        for (const note of agentCommand.notes) parts.push(`- ${note}`);
      }
      if (agentCommand?.examples.length) {
        parts.push('', '示例命令：');
        for (const example of agentCommand.examples) parts.push(`- \`${example}\``);
      }
      if (agentCommand?.nextActions.length) {
        parts.push('', '下一步：');
        for (const action of agentCommand.nextActions) {
          parts.push(`- ${action.priority} · \`${action.commandTemplate}\`：${action.description}`);
        }
      }
      if (agentCommand) {
        parts.push(...renderDecisionGuideMarkdown(agentCommand));
      }
      if (agentCommand?.optionInsights.length) {
        parts.push('', '关键选项建议：');
        for (const insight of agentCommand.optionInsights) {
          const caution = insight.cautions.length > 0 ? ` 注意：${insight.cautions.join(' ')}` : '';
          parts.push(`- \`${insight.flag}\`：${insight.whenToUse}${caution}`);
        }
      }
      if (agentCommand?.result) {
        parts.push('', '结构化结果：');
        parts.push(...renderStructuredResultMarkdown(agentCommand.result));
      }
      if (agentCommand?.recommendedFlow.length) {
        parts.push('', '推荐流程：');
        for (const [index, step] of agentCommand.recommendedFlow.entries()) {
          const commandText = step.command ? ` → \`${step.command}\`` : '';
          parts.push(`- ${index + 1}. ${step.title}${commandText}：${step.reason}`);
        }
      }
      if (agentCommand?.agentTips.length) {
        parts.push('', 'Agent Tips：');
        for (const tip of agentCommand.agentTips) parts.push(`- ${tip}`);
      }

      const optionTable = renderOptionTable(command);
      if (optionTable) {
        parts.push('', optionTable);
      }
    }
  }

  return `${parts.join('\n').trim()}\n`;
}
