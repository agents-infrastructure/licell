import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildAgentCommandCatalog, buildCommandReferenceSections } from './command-reference';
import { syncGeneratedSection, syncTextFile } from './generated-docs';
import { renderAgentContractMarkdown } from './agent-contract-docs';
import {
  README_UPGRADE_GUIDANCE_END,
  README_UPGRADE_GUIDANCE_START,
  renderReadmeUpgradeGuidance
} from './install-upgrade-docs';

export const README_QUICK_REFERENCE_START = '<!-- BEGIN GENERATED:README_QUICK_REFERENCE -->';
export const README_QUICK_REFERENCE_END = '<!-- END GENERATED:README_QUICK_REFERENCE -->';

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

function renderCommandTable(commands: ReturnType<typeof buildCommandReferenceSections>[number]['commands']) {
  const rows = commands.map((command) => `| \`licell ${command.rawName}\` | ${escapeMarkdownCell(command.description || '—')} | ${summarizeKeyOptions(command)} |`);
  return [
    '| 命令 | 说明 | 关键选项 |',
    '|------|------|----------|',
    ...rows
  ].join('\n');
}

export function renderReadmeQuickReference() {
  const sections = buildCommandReferenceSections();
  const parts: string[] = [
    '> 本节由 licell CLI 注册表自动生成；命令变更会同步到 README / docs/reference/agent-surfaces.md / Skills / Shell Completion。',
    '',
    '### Agent Contract',
    '',
    '- 发现命令目录：`licell catalog --output json`。',
    '- 读取单命令契约：`licell <command> --help --output json`。',
    '- 真正执行命令：`licell <command> --output json`，并过滤 `@@LICELL_JSON@@` 前缀逐行解析。',
    '- 对 `type=event` 的 record，优先读取稳定字段 `stage` / `action` / `status` / `source` / `terminal`。',
    '- 对 `type=error` 的 record，优先读取 `nextActions[]` 获取首选补救步骤。',
    '',
    renderAgentContractMarkdown({ headingLevel: 4 }),
    '',
    '### 命令总览'
  ];

  for (const section of sections) {
    parts.push('', `#### ${section.title}`);
    if (section.summary) parts.push('', section.summary);
    if (section.notes.length > 0) {
      parts.push('');
      for (const note of section.notes) parts.push(`- ${note}`);
    }
    parts.push('', renderCommandTable(section.commands));
  }

  parts.push(
    '',
    '### 常用工作流片段',
    '',
    '**Task 函数工作流**',
    '',
    '```bash',
    'licell deploy --type task --runtime nodejs22 --entry src/task.ts --target preview --output json',
    'licell task config <appName> --target preview --output json',
    'licell task invoke <appName> --target preview --payload \'{"job":"demo"}\' --output json',
    'licell task info <taskId> <appName> --target preview --output json',
    'licell task list <appName> --target preview --status Running --output json',
    '```',
    '',
    '说明：`deploy --type task` 成功后不会返回固定 URL；请读取结果里的 `invokeCommand`，或继续执行 `licell task invoke` / `task info` / `task list` 完成任务闭环。',
    '',
    '**Shell 补全（bash / zsh）**',
    '',
    '```bash',
    'mkdir -p ~/.local/share/licell/completions',
    '',
    '# 生成 bash 补全脚本',
    'licell completion bash > ~/.local/share/licell/completions/licell.bash',
    "echo '[[ -f \"$HOME/.local/share/licell/completions/licell.bash\" ]] && source \"$HOME/.local/share/licell/completions/licell.bash\"' >> ~/.bashrc",
    '',
    '# 生成 zsh 补全脚本',
    'licell completion zsh > ~/.local/share/licell/completions/_licell',
    "echo '[[ -f \"$HOME/.local/share/licell/completions/_licell\" ]] && source \"$HOME/.local/share/licell/completions/_licell\"' >> ~/.zshrc",
    '```',
    '',
    '**固定 E2E 套件（发布前建议）**',
    '',
    '```bash',
    'licell e2e run',
    'licell e2e run --suite full',
    'licell e2e run --enable-vpc',
    'licell e2e run --runtime nodejs22 --domain-suffix your-domain.xyz --enable-cdn --cleanup',
    'licell e2e list',
    'licell e2e cleanup <runId>',
    '```',
    '',
    '说明：默认 smoke 套件会覆盖 API deploy/invoke 与 task deploy/config/invoke/list/info/stop；\`licell e2e run --suite full\` 会在此基础上额外覆盖 DNS add/rm、OSS bucket/object CRUD、OSS 原生域名 token/bind/unbind、\`domain app bind/unbind\`、\`deploy --type static --domain ...\` 与 \`domain static bind/unbind\`。如需连同云上资源一起收口，建议配合 \`--cleanup\`。',
    '',
    '**删除 / 清理说明**',
    '',
    '- 涉及删除、解绑、清理的命令在非交互模式下通常需要显式传入 `--yes`。',
    '- API 部署前建议固定执行 `licell deploy spec` 与 `licell deploy check`。',
    '- `licell upgrade --dry-run` 可先查看当前安装来源与升级计划。'
  );

  return `${parts.join('\n').trim()}\n`;
}

export function syncReadmeUpgradeGuidanceSection(readmeContent: string) {
  return syncGeneratedSection(readmeContent, {
    startMarker: README_UPGRADE_GUIDANCE_START,
    endMarker: README_UPGRADE_GUIDANCE_END,
    generatedContent: renderReadmeUpgradeGuidance(),
    missingMarkersMessage: 'README upgrade guidance markers not found'
  });
}

export function syncReadmeQuickReferenceSection(readmeContent: string) {
  return syncGeneratedSection(readmeContent, {
    startMarker: README_QUICK_REFERENCE_START,
    endMarker: README_QUICK_REFERENCE_END,
    generatedContent: renderReadmeQuickReference(),
    missingMarkersMessage: 'README quick reference markers not found'
  });
}

export function syncReadmeGeneratedSections(readmeContent: string) {
  return syncReadmeQuickReferenceSection(syncReadmeUpgradeGuidanceSection(readmeContent));
}

export function syncReadmeGeneratedSection(readmeContent: string) {
  return syncReadmeGeneratedSections(readmeContent);
}

export function syncReadmeFile(readmePath = resolve(process.cwd(), 'README.md')) {
  const current = readFileSync(readmePath, 'utf8');
  const next = syncReadmeGeneratedSections(current);
  const result = syncTextFile(readmePath, next);
  return { updated: result.updated, filePath: readmePath };
}
