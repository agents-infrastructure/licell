import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getSkillFiles, writeSkillFiles, ensureAgentsMdEntry } from '../utils/skills-scaffold';

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'licell-skills-'));
}

describe('getSkillFiles', () => {
  it('returns .claude/skills/licell/SKILL.md for claude', () => {
    const files = getSkillFiles('claude');
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('.claude/skills/licell/SKILL.md');
    expect(files[0].content).toContain('# licell CLI Skill');
    expect(files[0].content).toContain('## Command Reference');
  });

  it('returns codex.md for codex', () => {
    const files = getSkillFiles('codex');
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('codex.md');
    expect(files[0].content).toContain('# licell CLI Skill');
  });

  it('content follows the shared command catalog', () => {
    const [file] = getSkillFiles('claude');
    const sections = [
      '### Setup & Identity',
      '### Delivery Workflow',
      '### Data Services',
      '### Automation & Tooling'
    ];
    for (const section of sections) {
      expect(file.content).toContain(section);
    }

    const commands = [
      'licell login',
      'licell deploy spec [runtime]',
      'licell deploy check',
      'licell mcp',
      'licell mcp init',
      'licell mcp serve',
      'licell completion [shell]',
      'licell upgrade',
      'licell auth repair',
      'licell skills init [agent]'
    ];
    for (const command of commands) {
      expect(file.content).toContain(command);
    }

    expect(file.content).toContain('follows the current installation source');
    expect(file.content).toContain('project-local `node_modules`');
    expect(file.content).toContain('`licell upgrade --dry-run`');
    expect(file.content).toContain('licell CLI 注册表自动生成');
    expect(file.content).toContain('## MCP Tool Reference');
    expect(file.content).toContain('`licell_cli`');
    expect(file.content).toContain('`licell_deploy`');
  });
});

describe('writeSkillFiles', () => {
  it('writes files to project root', () => {
    const dir = makeTmpDir();
    try {
      const files = getSkillFiles('claude');
      const { written, skipped } = writeSkillFiles(dir, files);
      expect(written).toEqual(['.claude/skills/licell/SKILL.md']);
      expect(skipped).toEqual([]);
      expect(existsSync(join(dir, '.claude/skills/licell/SKILL.md'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('skips when content is identical', () => {
    const dir = makeTmpDir();
    try {
      const files = getSkillFiles('codex');
      writeSkillFiles(dir, files);
      const { written, skipped } = writeSkillFiles(dir, files);
      expect(written).toEqual([]);
      expect(skipped).toEqual(['codex.md']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws on conflict without --force', () => {
    const dir = makeTmpDir();
    try {
      const files = getSkillFiles('codex');
      writeSkillFiles(dir, files);
      writeFileSync(join(dir, 'codex.md'), 'different content');
      expect(() => writeSkillFiles(dir, files)).toThrow('--force');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('overwrites on conflict with force=true', () => {
    const dir = makeTmpDir();
    try {
      const files = getSkillFiles('codex');
      writeSkillFiles(dir, files);
      writeFileSync(join(dir, 'codex.md'), 'different content');
      const { written } = writeSkillFiles(dir, files, true);
      expect(written).toEqual(['codex.md']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ensureAgentsMdEntry', () => {
  it('creates AGENTS.md when missing', () => {
    const dir = makeTmpDir();
    try {
      const { filePath, updated } = ensureAgentsMdEntry(dir);
      expect(updated).toBe(true);
      expect(filePath).toBe(join(dir, 'AGENTS.md'));
      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('.claude/skills/licell/SKILL.md');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('inserts entry into existing AGENTS.md with Available skills header', () => {
    const dir = makeTmpDir();
    try {
      const agentsPath = join(dir, 'AGENTS.md');
      writeFileSync(agentsPath, '# AGENTS.md\n\n### Available skills\n\n- other-skill: does stuff (file: .claude/skills/other/SKILL.md)\n');
      const { updated } = ensureAgentsMdEntry(dir);
      expect(updated).toBe(true);
      const content = readFileSync(agentsPath, 'utf8');
      expect(content).toContain('.claude/skills/licell/SKILL.md');
      expect(content).toContain('other-skill');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('is idempotent when entry already exists', () => {
    const dir = makeTmpDir();
    try {
      ensureAgentsMdEntry(dir);
      const before = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
      const { updated } = ensureAgentsMdEntry(dir);
      expect(updated).toBe(false);
      const after = readFileSync(join(dir, 'AGENTS.md'), 'utf8');
      expect(after).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('appends section when no Available skills header exists', () => {
    const dir = makeTmpDir();
    try {
      const agentsPath = join(dir, 'AGENTS.md');
      writeFileSync(agentsPath, '# My Project\n\nSome instructions.\n');
      const { updated } = ensureAgentsMdEntry(dir);
      expect(updated).toBe(true);
      const content = readFileSync(agentsPath, 'utf8');
      expect(content).toContain('## Available Skills');
      expect(content).toContain('.claude/skills/licell/SKILL.md');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
