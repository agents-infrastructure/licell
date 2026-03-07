import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { homedir } from 'os';
import { renderSkillCommandReference } from './command-reference';
import { renderSkillMcpToolReference } from './agent-surface-docs';
import { renderSkillUpgradeNotes } from './install-upgrade-docs';

export type AgentType = 'claude' | 'codex';

export interface SkillFile {
  path: string;
  content: string;
}

const AGENTS_MD_LICELL_ENTRY =
  '- licell: Deploy and manage Alibaba Cloud Serverless applications using the licell CLI. Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, Supabase, and MCP. (file: .claude/skills/licell/SKILL.md)';

function getSkillContent(): string {
  return `---
name: licell
description: >-
  Deploy and manage Alibaba Cloud Serverless applications using the licell CLI.
  Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, Supabase, and MCP.
metadata:
  author: licell
  version: "1.0"
---

# licell CLI Skill

Deploy and manage Alibaba Cloud Serverless (FC 3.0) applications from the command line.

## Prerequisites

- \`licell\` CLI installed and on PATH
- Authenticated via \`licell login\` (credentials stored in \`~/.licell-cli/auth.json\`)
- Project initialized via \`licell init\` (config in \`.licell/project.json\`)

## Install / Upgrade Notes

${renderSkillUpgradeNotes().trim()}

## Quick Start Workflow

\`\`\`bash
licell login                                          # 配置阿里云凭证
licell init                                           # 初始化项目（脚手架 + 配置）
licell deploy --type api --target preview             # 部署到 preview
licell release promote --target prod                  # 发布到生产
\`\`\`

<!-- PLACEHOLDER_COMMAND_REFERENCE -->
`;
}

function getWorkflowAppendix(): string {
  return `
## Recommended Patterns

### FC API Deploy

\`\`\`bash
licell deploy spec nodejs22
licell deploy check --runtime nodejs22 --entry src/index.ts
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
\`\`\`

### Static Site Deploy

\`\`\`bash
licell deploy --type static --dist dist --domain-suffix example.com
\`\`\`

### Data + App Stack

\`\`\`bash
licell db add --type postgres
licell cache add --type redis
licell deploy --type api --target preview --enable-vpc
\`\`\`

### Supabase Stack

\`\`\`bash
licell supa add --name my-app
licell supa connect <instanceName>
licell deploy --type api --target preview --enable-vpc
\`\`\`

## Error Handling

- 认证失败：运行 \`licell login\` 重新配置凭证
- 部署失败：检查 \`licell logs --once\` 查看错误日志
- 域名冲突：使用 \`licell domain rm <domain>\` 清理后重试
- 版本清理：\`licell release prune --keep 5 --apply\` 清理旧版本
- 破坏性操作（rm/prune）需要 \`--yes\` 跳过确认，或在交互模式下手动确认
`;
}

function getSkillBody() {
  return getSkillContent().replace('<!-- PLACEHOLDER_COMMAND_REFERENCE -->\n', '')
    + renderSkillCommandReference()
    + '\n'
    + renderSkillMcpToolReference()
    + getWorkflowAppendix();
}


export function getGlobalSkillsDir(agent: AgentType): string {
  const home = homedir();
  if (agent === 'claude') return join(home, '.claude', 'skills', 'licell');
  return join(home, '.agents', 'skills', 'licell');
}

export function getSkillFiles(agent: AgentType): SkillFile[] {
  const body = getSkillBody();

  if (agent === 'claude') {
    return [{ path: '.claude/skills/licell/SKILL.md', content: body }];
  }

  return [{ path: 'codex.md', content: body }];
}

export function getGlobalSkillFiles(agent: AgentType): SkillFile[] {
  const body = getSkillBody();
  const dir = getGlobalSkillsDir(agent);
  return [{ path: join(dir, 'SKILL.md'), content: body }];
}

export function ensureAgentsMdEntry(projectRoot: string): { filePath: string; updated: boolean } {
  const filePath = join(projectRoot, 'AGENTS.md');

  if (!existsSync(filePath)) {
    const content = `# AGENTS.md\n\n## Available Skills\n\n${AGENTS_MD_LICELL_ENTRY}\n`;
    writeFileSync(filePath, content, 'utf8');
    return { filePath, updated: true };
  }

  const existing = readFileSync(filePath, 'utf8');
  if (existing.includes('.claude/skills/licell/SKILL.md')) {
    return { filePath, updated: false };
  }

  const headerPattern = /^(#{2,3}\s+Available\s+[Ss]kills\s*)$/m;
  const match = headerPattern.exec(existing);
  if (match && match.index !== undefined) {
    const insertPos = match.index + match[0].length;
    const updated = `${existing.slice(0, insertPos)}\n${AGENTS_MD_LICELL_ENTRY}${existing.slice(insertPos)}`;
    writeFileSync(filePath, updated, 'utf8');
    return { filePath, updated: true };
  }

  const updated = `${existing.trimEnd()}\n\n## Available Skills\n\n${AGENTS_MD_LICELL_ENTRY}\n`;
  writeFileSync(filePath, updated, 'utf8');
  return { filePath, updated: true };
}

export function writeSkillFiles(
  projectRoot: string,
  files: SkillFile[],
  force = false
): { written: string[]; skipped: string[] } {
  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const fullPath = isAbsolute(file.path) ? file.path : join(projectRoot, file.path);
    const dir = dirname(fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    if (existsSync(fullPath)) {
      const current = readFileSync(fullPath, 'utf8');
      if (current === file.content) {
        skipped.push(file.path);
        continue;
      }
      if (!force) {
        throw new Error(`文件已存在且内容不同: ${file.path}（使用 --force 覆盖）`);
      }
    }

    writeFileSync(fullPath, file.content, 'utf8');
    written.push(file.path);
  }

  return { written, skipped };
}
