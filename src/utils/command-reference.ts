import {
  getCommandCatalog,
  type CatalogCommand,
  type CommandCatalog,
  type CatalogOption
} from './command-catalog';
import { canExposeCommandAsGeneratedMcpTool, toGeneratedMcpToolName } from './command-surface-ids';

interface CommandSectionConfig {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  notes?: string[];
}

export interface CommandReferenceSection {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  notes: string[];
  commands: CatalogCommand[];
}

export interface AgentCommandCatalogSection {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  commandKeys: string[];
}

export interface AgentCommandCatalogEntry {
  key: string;
  rawName: string;
  invocation: string;
  description: string;
  rootCommand: string;
  args: CatalogCommand['args'];
  aliases: string[];
  options: CatalogOption[];
  subcommands: string[];
  sectionId: string;
  sectionTitle: string;
  generatedMcpToolName?: string;
}

export interface AgentCommandCatalogDocument {
  source: 'licell-cli-registry';
  globalOptions: string[];
  rootCommands: string[];
  childCommands: CommandCatalog['childCommands'];
  commandOptions: CommandCatalog['commandOptions'];
  sections: AgentCommandCatalogSection[];
  commands: AgentCommandCatalogEntry[];
}

const COMMAND_SECTION_CONFIG: CommandSectionConfig[] = [
  {
    id: 'setup',
    title: 'Setup & Identity',
    roots: ['login', 'auth', 'logout', 'whoami', 'switch', 'init', 'config'],
    summary: '认证、项目初始化与默认配置相关命令。'
  },
  {
    id: 'delivery',
    title: 'Delivery Workflow',
    roots: ['deploy', 'release', 'logs', 'fn', 'env', 'domain', 'dns', 'oss'],
    summary: '围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。',
    notes: [
      'Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。',
      '涉及删除或清理的命令通常需要显式传入 `--yes`。'
    ]
  },
  {
    id: 'data',
    title: 'Data Services',
    roots: ['db', 'cache', 'supa'],
    summary: '数据库、缓存与 Supabase 实例的创建、连接、白名单和生命周期管理。'
  },
  {
    id: 'automation',
    title: 'Automation & Tooling',
    roots: ['mcp', 'skills', 'setup', 'completion', 'upgrade', 'e2e'],
    summary: '面向 Agent、开发体验与 CLI 生命周期的自动化命令。',
    notes: [
      '`licell skills init` 与 `licell mcp` 都基于同一套 CLI 命令目录生成外部表面。',
      '`licell completion` 的候选命令同样来自共享命令目录。'
    ]
  }
];

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function escapeMarkdownCell(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.replace(/\|/g, '\\|') || '—';
}

function toInvocation(command: CatalogCommand) {
  return `licell ${command.rawName}`;
}

function summarizeKeyOptions(command: CatalogCommand) {
  const flags = unique(command.options.map((option) => option.primaryFlag)).slice(0, 4);
  return flags.length > 0 ? flags.map((flag) => `\`${flag}\``).join(', ') : '—';
}

function sortCommands(commands: CatalogCommand[], roots: string[]) {
  const rootIndex = new Map(roots.map((root, index) => [root, index]));
  return [...commands].sort((left, right) => {
    const leftRootOrder = rootIndex.get(left.rootCommand) ?? Number.MAX_SAFE_INTEGER;
    const rightRootOrder = rootIndex.get(right.rootCommand) ?? Number.MAX_SAFE_INTEGER;
    if (leftRootOrder !== rightRootOrder) return leftRootOrder - rightRootOrder;

    const leftDepth = left.commandTokens.length;
    const rightDepth = right.commandTokens.length;
    if (leftDepth !== rightDepth) return leftDepth - rightDepth;

    return left.key.localeCompare(right.key);
  });
}

function renderCommandTable(commands: CatalogCommand[]) {
  const rows = commands.map((command) => {
    const description = command.description ? escapeMarkdownCell(command.description) : '—';
    return `| \`${toInvocation(command)}\` | ${description} | ${summarizeKeyOptions(command)} |`;
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

export function buildCommandReferenceSections(catalog: CommandCatalog = getCommandCatalog()): CommandReferenceSection[] {
  const assignedRoots = new Set<string>();
  const sections: CommandReferenceSection[] = [];

  for (const config of COMMAND_SECTION_CONFIG) {
    const roots = config.roots.filter((root) => catalog.rootCommands.includes(root));
    if (roots.length === 0) continue;

    for (const root of roots) assignedRoots.add(root);

    sections.push({
      id: config.id,
      title: config.title,
      roots,
      summary: config.summary,
      notes: [...(config.notes || [])],
      commands: sortCommands(
        catalog.commands.filter((command) => roots.includes(command.rootCommand)),
        roots
      )
    });
  }

  const remainingRoots = catalog.rootCommands.filter((root) => !assignedRoots.has(root));
  if (remainingRoots.length > 0) {
    sections.push({
      id: 'other',
      title: 'Other Commands',
      roots: remainingRoots,
      summary: '当前尚未归类的命令。',
      notes: [],
      commands: sortCommands(
        catalog.commands.filter((command) => remainingRoots.includes(command.rootCommand)),
        remainingRoots
      )
    });
  }

  return sections;
}

export function buildAgentCommandCatalog(catalog: CommandCatalog = getCommandCatalog()): AgentCommandCatalogDocument {
  const sections = buildCommandReferenceSections(catalog);
  const sectionByRoot = new Map<string, CommandReferenceSection>();
  for (const section of sections) {
    for (const root of section.roots) {
      sectionByRoot.set(root, section);
    }
  }

  return {
    source: 'licell-cli-registry',
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
    commands: sections.flatMap((section) => section.commands.map((command) => ({
      key: command.key,
      rawName: command.rawName,
      invocation: toInvocation(command),
      description: command.description,
      rootCommand: command.rootCommand,
      args: command.args.map((arg) => ({ ...arg })),
      aliases: [...command.aliases],
      options: command.options.map((option) => ({ ...option, flags: [...option.flags] })),
      subcommands: [...(catalog.childCommands[command.key] || [])],
      sectionId: sectionByRoot.get(command.rootCommand)?.id || section.id,
      sectionTitle: sectionByRoot.get(command.rootCommand)?.title || section.title,
      generatedMcpToolName: canExposeCommandAsGeneratedMcpTool(command.rootCommand)
        ? toGeneratedMcpToolName(command.key)
        : undefined
    })))
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
    subcommands: [...command.subcommands]
  }));

  const allowedKeys = new Set(commands.map((command) => command.key));
  const allowedRoots = new Set(commands.map((command) => command.rootCommand));

  return {
    ...catalog,
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
    '以下命令清单由 licell CLI 注册表自动生成；新增或修改 CLI 命令后，Skills / docs/reference/agent-surfaces.md / MCP / shell completion 会同步反映。'
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

    const detailedCommands = section.commands.filter((command) => command.options.length > 0 || command.aliases.length > 0);
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
      const generatedMcpToolName = agentCommandByKey.get(command.key)?.generatedMcpToolName;
      if (generatedMcpToolName) {
        metadata.push(`生成 MCP Tool：\`${generatedMcpToolName}\``);
      }

      parts.push('', `#### \`${toInvocation(command)}\``);
      if (command.description) {
        parts.push('', command.description);
      }
      if (metadata.length > 0) {
        parts.push('', metadata.join(' · '));
      }

      const optionTable = renderOptionTable(command);
      if (optionTable) {
        parts.push('', optionTable);
      }
    }
  }

  return `${parts.join('\n').trim()}\n`;
}
