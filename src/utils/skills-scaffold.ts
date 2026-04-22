import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { homedir } from 'os';
import { renderAgentContractMarkdown } from './agent-contract-docs';

export type AgentType = 'claude' | 'codex';

export interface SkillFile {
  path: string;
  content: string;
}

const AGENTS_MD_LICELL_ENTRY =
  '- licell: Deploy and manage Alibaba Cloud Serverless applications using the licell CLI. Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, and Supabase. (file: .claude/skills/licell/SKILL.md)';

function getSkillContent(): string {
  return `---
name: licell
description: >-
  Deploy and manage Alibaba Cloud Serverless applications using the licell CLI.
  Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, and Supabase.
metadata:
  author: licell
  version: "1.0"
---

# licell CLI Skill

Use the \`licell\` CLI as a structured deployment and operations tool for Alibaba Cloud.

## Scope

- This file teaches an agent how to drive \`licell\` safely.
- It is not the canonical command reference.
- If a detail can be discovered from CLI help or catalog output, prefer the CLI over this file.

## Operating Contract

- Do not guess command names, flags, argument order, or result fields.
- Discover commands with \`licell catalog --output json\`.
- Read per-command usage with \`licell <command> --help --output json\`.
- Execute real work with \`licell <command> --output json\`.
- For streamed output, parse only lines prefixed with \`@@LICELL_JSON@@\`.
- Prefer structured fields like \`nextActions[]\`, \`result\`, \`error\`, and \`details\` over human-readable console text.
- If the task is mutating or destructive, inspect help first and follow the command's structured guidance.
- Verify \`kind\` before trusting a record shape, and then verify \`schemaVersion\`.
- Do not scrape plain-text terminal output when \`--output json\` is available.
- Do not assume one command's result shape applies to another; read the command's help contract first.

## Preconditions

- \`licell\` is installed and on PATH.
- Authentication is configured, usually via \`licell login\`.
- If the command operates on a project, run it inside the target repo or initialized workspace.

## Canonical Invocation Sequence

\`\`\`bash
licell catalog --output json
licell <command> --help --output json
licell <command> --output json
\`\`\`

Use the first command for discovery, the second for contract lookup, and the third for execution.

<!-- PLACEHOLDER_COMMAND_REFERENCE -->
`;
}

function getSkillBody() {
  return getSkillContent().replace('<!-- PLACEHOLDER_COMMAND_REFERENCE -->\n', '')
    + renderAgentContractMarkdown({ headingLevel: 2, locale: 'en' })
    + '\n';
}


export function getGlobalSkillsDir(agent: AgentType): string {
  const home = homedir();
  if (agent === 'claude') return join(home, '.claude', 'skills', 'licell');
  return join(home, '.codex', 'skills', 'licell');
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
  const plannedWrites: Array<{ fullPath: string; file: SkillFile }> = [];

  for (const file of files) {
    const fullPath = isAbsolute(file.path) ? file.path : join(projectRoot, file.path);
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

    plannedWrites.push({ fullPath, file });
  }

  for (const planned of plannedWrites) {
    const dir = dirname(planned.fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(planned.fullPath, planned.file.content, 'utf8');
    written.push(planned.file.path);
  }

  return { written, skipped };
}
