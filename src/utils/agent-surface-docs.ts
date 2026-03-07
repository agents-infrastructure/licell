import { resolve } from 'path';
import { buildAgentCommandCatalog, buildCommandReferenceSections } from './command-reference';
import { syncTextFile } from './generated-docs';
import { buildMcpToolCatalog, type McpToolCatalogEntry } from '../mcp/tool-catalog';

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function escapeMarkdownCell(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.replace(/\|/g, '\\|') || '—';
}

function summarizeKeyOptions(command: ReturnType<typeof buildCommandReferenceSections>[number]['commands'][number]) {
  const flags = unique(command.options.map((option) => option.primaryFlag)).slice(0, 3);
  return flags.length > 0 ? flags.map((flag) => `\`${flag}\``).join(', ') : '—';
}

function summarizeToolInputs(tool: McpToolCatalogEntry) {
  const preferred = tool.inputNames.filter((name) => name !== 'cwd' && name !== 'timeoutMs');
  const selected = (preferred.length > 0 ? preferred : tool.inputNames).slice(0, 4);
  return selected.length > 0 ? selected.map((name) => `\`${name}\``).join(', ') : '—';
}

function renderCommandSurfaceTable() {
  const sections = buildCommandReferenceSections();
  const agentCatalog = buildAgentCommandCatalog();
  const commandByKey = new Map(agentCatalog.commands.map((command) => [command.key, command]));
  const parts: string[] = ['## CLI 命令目录', '', '> 下表直接来自共享 CLI 注册表；生成 MCP Tool 名称也从同一份目录派生。'];

  for (const section of sections) {
    parts.push('', `### ${section.title}`);
    if (section.summary) parts.push('', section.summary);
    if (section.notes.length > 0) {
      parts.push('');
      for (const note of section.notes) parts.push(`- ${note}`);
    }

    const rows = section.commands.map((command) => {
      const agentCommand = commandByKey.get(command.key);
      return `| \`licell ${command.rawName}\` | ${escapeMarkdownCell(command.description || '—')} | ${agentCommand?.generatedMcpToolName ? `\`${agentCommand.generatedMcpToolName}\`` : '—'} | ${summarizeKeyOptions(command)} |`;
    });

    parts.push(
      '',
      '| 命令 | 说明 | 生成 MCP Tool | 关键选项 |',
      '|------|------|----------------|----------|',
      ...rows
    );
  }

  return parts.join('\n');
}

function renderMcpToolTable(tools: McpToolCatalogEntry[], options?: { includeCommandSignature?: boolean }) {
  if (tools.length === 0) {
    return ['| Tool | 说明 | 关键输入 |', '|------|------|----------|', '| — | — | — |'].join('\n');
  }

  if (options?.includeCommandSignature) {
    return [
      '| Tool | 对应 CLI | 说明 | 关键输入 |',
      '|------|----------|------|----------|',
      ...tools.map((tool) => `| \`${tool.name}\` | ${tool.commandSignature ? `\`licell ${tool.commandSignature}\`` : '—'} | ${escapeMarkdownCell(tool.description)} | ${summarizeToolInputs(tool)} |`)
    ].join('\n');
  }

  return [
    '| Tool | 说明 | 关键输入 |',
    '|------|------|----------|',
    ...tools.map((tool) => `| \`${tool.name}\` | ${escapeMarkdownCell(tool.description)} | ${summarizeToolInputs(tool)} |`)
  ].join('\n');
}

export function renderSkillMcpToolReference() {
  const catalog = buildMcpToolCatalog();
  const builtinTools = catalog.sections.find((section) => section.id === 'builtin')?.tools || [];
  const curatedTools = catalog.sections.find((section) => section.id === 'curated')?.tools || [];

  return [
    '## MCP Tool Reference',
    '',
    '以下 MCP Tool 清单由 licell MCP 注册表自动生成；新增或修改 tool 后，Skills / 文档 / MCP server 会同步反映。',
    '',
    '### Builtin Tools',
    '',
    renderMcpToolTable(builtinTools),
    '',
    '### Curated Workflow Tools',
    '',
    renderMcpToolTable(curatedTools, { includeCommandSignature: true }),
    '',
    '### Generated Command Tools',
    '',
    '- 常规 CLI 命令的生成 MCP Tool 名称已在上方 Command Reference 的命令明细中标注。',
    '- 命名规则为 `licell_cmd_<command_key>`；实际名称与可用输入字段由共享 CLI 注册表实时推导。'
  ].join('\n').trim() + '\n';
}

export function renderAgentSurfaceReferenceDoc() {
  const catalog = buildMcpToolCatalog();
  const builtinTools = catalog.sections.find((section) => section.id === 'builtin')?.tools || [];
  const curatedTools = catalog.sections.find((section) => section.id === 'curated')?.tools || [];
  const generatedSections = catalog.sections.filter((section) => section.id.startsWith('generated:'));

  const parts: string[] = [
    '# Agent Surface Reference',
    '',
    '> 本文档由 licell 的共享 CLI / MCP 注册表自动生成；命令或工具变更会同步到 README / Skills / MCP / Shell Completion / 本页。',
    '',
    renderCommandSurfaceTable(),
    '',
    '## MCP 内建工具',
    '',
    '这些工具不是对单个 CLI 命令的简单映射，而是 Agent 侧的通用能力入口。',
    '',
    renderMcpToolTable(builtinTools),
    '',
    '## MCP 精选工作流工具',
    '',
    '这些工具为高频场景提供更稳定、更语义化的输入结构。',
    '',
    renderMcpToolTable(curatedTools, { includeCommandSignature: true }),
    '',
    '## 自动生成的 MCP 命令工具',
    '',
    '除 `licell mcp ...` 外，其他 CLI 命令默认都会派生出 `licell_cmd_*` Tool。下面按命令分组展示。'
  ];

  for (const section of generatedSections) {
    parts.push('', `### ${section.title.replace(/^Generated MCP Tools ·\s*/, '')}`);
    if (section.summary) parts.push('', section.summary);
    parts.push('', renderMcpToolTable(section.tools, { includeCommandSignature: true }));
  }

  parts.push(
    '',
    '## 同步机制',
    '',
    '- CLI 命令、子命令、选项：来自共享 `cac` 注册表。',
    '- Skills 命令参考、MCP 生成工具、shell completion、README 命令速查：全部从同一份命令目录派生。',
    '- MCP builtin / curated tool 文档：直接从 MCP tool 注册表派生，避免 README / Skills / server 三处重复维护。',
    '- 若新增命令或 tool，只需更新对应注册表并执行 `bun run docs:sync`。'
  );

  return `${parts.join('\n').trim()}\n`;
}

export function syncAgentSurfaceDocsFile(filePath = resolve(process.cwd(), 'docs/reference/agent-surfaces.md')) {
  return syncTextFile(filePath, renderAgentSurfaceReferenceDoc());
}
