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
  const allFlags = unique(command.options.map((option) => option.primaryFlag));
  const flags = (command.region
    ? [
      ...allFlags.filter((flag) => flag === '--region'),
      ...allFlags.filter((flag) => flag !== '--region')
    ]
    : allFlags).slice(0, 3);
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
    '- Discovery: run `licell catalog --output json` first.',
    '- If a curated command matches, inspect it with `licell <command> --help --output json`, then execute it.',
    '- If no curated command matches, use `licell capability products/search/describe --output json` and follow `execution.preferred` to the raw API fallback.',
    '- For raw writes, review `--dry-run`, require explicit `--yes`, and follow `nextActions[]` for read-back verification.',
    '- Parse real execution output only from lines prefixed with `@@LICELL_JSON@@`.',
    '- Successful outcomes should be read from `type=result`; failures should be read from `type=error` and especially `nextActions[]`; progress signals come from `type=event`.',
    '',
    renderAgentContractMarkdown({ headingLevel: 3, locale: 'en' })
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
    '- 始终先发现领域命令：`licell catalog --output json`。',
    '- 命中领域命令：读取 `licell <command> --help --output json`，再执行该命令。',
    '- 未命中领域命令：依次执行 `capability products/search/describe --output json`，并读取 `execution.preferred`。',
    '- raw 读操作可在参数明确后执行；raw 写操作必须先 `--dry-run`，再显式 `--yes`，最后按 `nextActions[]` 回读验证。',
    '- 领域命令与 raw capability 都未命中后，才可判定当前请求不受支持。',
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
