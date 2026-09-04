import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getGlobalSkillFiles, getSkillFiles, writeSkillFiles, ensureAgentsMdEntry } from '../utils/skills-scaffold';
import { LICELL_GLAB_SUBAGENT_NAME, getGlobalCodexSubagentFiles } from '../utils/onboard-scaffold';

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'licell-skills-'));
}

describe('getSkillFiles', () => {
  it('returns .claude/skills/licell/SKILL.md for claude', () => {
    const files = getSkillFiles('claude');
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('.claude/skills/licell/SKILL.md');
    expect(files[0].content).toContain('# licell CLI Skill');
    expect(files[0].content).toContain('## Operating Contract');
  });

  it('returns codex.md for codex', () => {
    const files = getSkillFiles('codex');
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('codex.md');
    expect(files[0].content).toContain('# licell CLI Skill');
  });

  it('content is contract-first and points agents back to CLI help', () => {
    const [file] = getSkillFiles('claude');
    expect(file.content).toContain('all protocol-covered Alibaba Cloud APIs');
    expect(file.content).toContain('## Scope');
    expect(file.content).toContain('## Operating Contract');
    expect(file.content).toContain('## Canonical Invocation Sequence');
    expect(file.content).toContain('Do not guess command names, flags, argument order, or result fields.');
    expect(file.content).toContain('`licell catalog --output json`');
    expect(file.content).toContain('`licell <command> --help --output json`');
    expect(file.content).toContain('`licell <command> --output json`');
    expect(file.content).toContain('## Natural-Language Intent Routing');
    expect(file.content).toContain('Do not conclude that Licell cannot handle an Alibaba Cloud request');
    expect(file.content).toContain('`licell capability products <service> --output json`');
    expect(file.content).toContain('`licell capability search --product <code> --intent "<action resource>" --action <action> --output json`');
    expect(file.content).toContain('Follow `execution.preferred`; do not infer execution from prose or API names.');
    expect(file.content).toContain('raw write operations require `--dry-run` review and explicit `--yes`');
    expect(file.content).toContain('## Schema Contracts');
    expect(file.content).toContain('licell-help@1.0');
    expect(file.content).toContain('CLI Event Record');
    expect(file.content).not.toContain('## Command Reference');
    expect(file.content).not.toContain('### Delivery Workflow');
    expect(file.content).not.toContain('## Recommended Patterns');
    expect(file.content).not.toContain('## SLS Query Reference');
    expect(file.content).not.toContain('## What Not To Do');
    expect(file.content).not.toContain('## Agent Usage');
  });

  it('keeps committed claude skill synced with scaffold output', () => {
    const [file] = getSkillFiles('claude');
    expect(readFileSync(file.path, 'utf8')).toBe(file.content);
  });
});

describe('getGlobalSkillFiles', () => {
  it('returns ~/.codex/skills/licell/SKILL.md for codex', () => {
    const files = getGlobalSkillFiles('codex');
    expect(files).toHaveLength(1);
    expect(files[0].path).toMatch(/\.codex\/skills\/licell\/SKILL\.md$/);
    expect(files[0].content).toContain('# licell CLI Skill');
  });
});

describe('getGlobalCodexSubagentFiles', () => {
  it('returns ~/.codex/agents/licell-glab.toml for codex onboard', () => {
    const files = getGlobalCodexSubagentFiles();
    expect(files).toHaveLength(1);
    expect(files[0].path).toMatch(/\.codex\/agents\/licell-glab\.toml$/);
    expect(files[0].content).toContain(`name = "${LICELL_GLAB_SUBAGENT_NAME}"`);
    expect(files[0].content).toContain('GitLab CI/CD');
    expect(files[0].content).toContain('API_KEY');
    expect(files[0].content).toContain('bazhuayu.xyz');
    expect(files[0].content).toContain('real Docker daemon');
    expect(files[0].content).toContain('host Docker socket');
    expect(files[0].content).toContain('`privileged = true`');
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

  it('does not partially write when a later file conflicts', () => {
    const dir = makeTmpDir();
    try {
      const files = [
        { path: 'new-file.txt', content: 'new content' },
        { path: 'conflict.txt', content: 'expected content' }
      ];
      writeFileSync(join(dir, 'conflict.txt'), 'different content');

      expect(() => writeSkillFiles(dir, files)).toThrow('--force');
      expect(existsSync(join(dir, 'new-file.txt'))).toBe(false);
      expect(readFileSync(join(dir, 'conflict.txt'), 'utf8')).toBe('different content');
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
      expect(content).toContain('protocol-covered Alibaba Cloud APIs');
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
