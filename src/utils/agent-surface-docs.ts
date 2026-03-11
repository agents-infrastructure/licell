import { resolve } from 'path';
import { buildAgentCommandCatalog, buildCommandReferenceSections } from './command-reference';
import { syncTextFile } from './generated-docs';
import { renderAgentContractMarkdown } from './agent-contract-docs';

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

function renderCommandSurfaceTable() {
  const sections = buildCommandReferenceSections();
  const parts: string[] = ['## CLI 命令目录', '', '> 下表直接来自共享 CLI 注册表；Skills、catalog、help、shell completion 与文档都从同一份目录派生。'];

  for (const section of sections) {
    parts.push('', `### ${section.title}`);
    if (section.summary) parts.push('', section.summary);
    if (section.notes.length > 0) {
      parts.push('');
      for (const note of section.notes) parts.push(`- ${note}`);
    }

    const rows = section.commands.map((command) => {
      return `| \`licell ${command.rawName}\` | ${escapeMarkdownCell(command.description || '—')} | ${summarizeKeyOptions(command)} |`;
    });

    parts.push(
      '',
      '| 命令 | 说明 | 关键选项 |',
      '|------|------|----------|',
      ...rows
    );
  }

  return parts.join('\n');
}

export function renderSkillAgentUsageGuide() {
  return [
    '## Agent Usage',
    '',
    '- 命令发现：先执行 `licell catalog --output json`。',
    '- 单命令细节：再执行 `licell <command> --help --output json`。',
    '- 真正执行：统一执行 `licell ... --output json`，并过滤 `@@LICELL_JSON@@` 前缀逐行解析。',
    '- 成功结果看 `type=result`；失败看 `type=error` 的 `nextActions[]`；过程事件看 `type=event`。',
    '',
    renderAgentContractMarkdown({ headingLevel: 3 })
  ].join('\n').trim() + '\n';
}

export function renderAgentSurfaceReferenceDoc() {
  const parts: string[] = [
    '# Agent Surface Reference',
    '',
    '> 本文档由 licell 的共享 CLI 注册表自动生成；命令变更会同步到 README / Skills / shell completion / 本页。',
    '',
    '## Recommended Agent Flow',
    '',
    '- 发现命令目录：`licell catalog --output json`。',
    '- 读取命令 help：`licell <command> --help --output json`。',
    '- 执行命令：`licell <command> --output json`。',
    '- 对于流式输出：过滤 `@@LICELL_JSON@@` 前缀，再按 `type=event|result|error` 消费。',
    '',
    renderAgentContractMarkdown(),
    '',
    renderCommandSurfaceTable(),
  ];

  parts.push(
    '',
    '## 同步机制',
    '',
    '- CLI 命令、子命令、选项：来自共享 `cac` 注册表。',
    '- Skills 使用说明、`licell catalog`、`--help --output json`、shell completion、README 命令速查：全部从同一份命令目录派生。',
    '- 若新增命令或 tool，只需更新对应注册表并执行 `bun run docs:sync`。'
  );

  return `${parts.join('\n').trim()}\n`;
}

export function syncAgentSurfaceDocsFile(filePath = resolve(process.cwd(), 'docs/reference/agent-surfaces.md')) {
  return syncTextFile(filePath, renderAgentSurfaceReferenceDoc());
}
