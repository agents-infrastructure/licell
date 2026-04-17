import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetGlobalSkillFiles,
  mockGetGlobalCodexSubagentFiles,
  mockWriteSkillFiles
} = vi.hoisted(() => ({
  mockGetGlobalSkillFiles: vi.fn(),
  mockGetGlobalCodexSubagentFiles: vi.fn(),
  mockWriteSkillFiles: vi.fn()
}));

vi.mock('../utils/skills-scaffold', () => ({
  getGlobalSkillFiles: mockGetGlobalSkillFiles,
  writeSkillFiles: mockWriteSkillFiles
}));

vi.mock('../utils/onboard-scaffold', async () => {
  const actual = await vi.importActual<typeof import('../utils/onboard-scaffold')>('../utils/onboard-scaffold');
  return {
    ...actual,
    getGlobalCodexSubagentFiles: mockGetGlobalCodexSubagentFiles
  };
});

import { executeOnboard } from '../commands/onboard';

describe('executeOnboard', () => {
  beforeEach(() => {
    mockGetGlobalSkillFiles.mockReset();
    mockGetGlobalCodexSubagentFiles.mockReset();
    mockWriteSkillFiles.mockReset();
  });

  it('installs global codex and claude skills by default, plus licell-glab for codex', async () => {
    mockGetGlobalSkillFiles.mockImplementation((agent: string) => {
      if (agent === 'codex') return [{ path: '/Users/demo/.codex/skills/licell/SKILL.md', content: 'codex skill body' }];
      if (agent === 'claude') return [{ path: '/Users/demo/.claude/skills/licell/SKILL.md', content: 'claude skill body' }];
      return [];
    });
    mockGetGlobalCodexSubagentFiles.mockReturnValue([{ path: '/Users/demo/.codex/agents/licell-glab.toml', content: 'agent body' }]);
    mockWriteSkillFiles.mockReturnValue({
      written: [
        '/Users/demo/.codex/skills/licell/SKILL.md',
        '/Users/demo/.claude/skills/licell/SKILL.md',
        '/Users/demo/.codex/agents/licell-glab.toml'
      ],
      skipped: []
    });

    const result = await executeOnboard({
      agent: 'all',
      projectRoot: '/tmp/demo-project'
    });

    expect(mockGetGlobalSkillFiles).toHaveBeenCalledWith('codex');
    expect(mockGetGlobalSkillFiles).toHaveBeenCalledWith('claude');
    expect(mockGetGlobalCodexSubagentFiles).toHaveBeenCalledWith();
    expect(mockWriteSkillFiles).toHaveBeenCalledWith('', [
      { path: '/Users/demo/.codex/skills/licell/SKILL.md', content: 'codex skill body' },
      { path: '/Users/demo/.claude/skills/licell/SKILL.md', content: 'claude skill body' },
      { path: '/Users/demo/.codex/agents/licell-glab.toml', content: 'agent body' }
    ], false);
    expect(result).toEqual({
      agents: ['codex', 'claude'],
      requestedAgent: 'all',
      subagentNames: ['licell-glab'],
      projectRoot: '/tmp/demo-project',
      writtenFiles: [
        '/Users/demo/.codex/skills/licell/SKILL.md',
        '/Users/demo/.claude/skills/licell/SKILL.md',
        '/Users/demo/.codex/agents/licell-glab.toml'
      ],
      skippedFiles: []
    });
  });

  it('passes force through to shared file writer', async () => {
    mockGetGlobalSkillFiles.mockReturnValue([{ path: '/Users/demo/.codex/skills/licell/SKILL.md', content: 'skill body' }]);
    mockGetGlobalCodexSubagentFiles.mockReturnValue([{ path: '/Users/demo/.codex/agents/licell-glab.toml', content: 'agent body' }]);
    mockWriteSkillFiles.mockReturnValue({ written: [], skipped: ['/Users/demo/.codex/skills/licell/SKILL.md'] });

    await executeOnboard({
      agent: 'codex',
      projectRoot: '/tmp/demo-project',
      force: true
    });

    expect(mockWriteSkillFiles).toHaveBeenCalledWith('', expect.any(Array), true);
  });

  it('installs claude skill only when requested', async () => {
    mockGetGlobalSkillFiles.mockImplementation((agent: string) => {
      if (agent === 'claude') return [{ path: '/Users/demo/.claude/skills/licell/SKILL.md', content: 'claude skill body' }];
      return [];
    });
    mockWriteSkillFiles.mockReturnValue({
      written: ['/Users/demo/.claude/skills/licell/SKILL.md'],
      skipped: []
    });

    const result = await executeOnboard({
      agent: 'claude',
      projectRoot: '/tmp/demo-project'
    });

    expect(mockGetGlobalSkillFiles).toHaveBeenCalledTimes(1);
    expect(mockGetGlobalSkillFiles).toHaveBeenCalledWith('claude');
    expect(mockGetGlobalCodexSubagentFiles).not.toHaveBeenCalled();
    expect(result).toEqual({
      agents: ['claude'],
      requestedAgent: 'claude',
      subagentNames: [],
      projectRoot: '/tmp/demo-project',
      writtenFiles: ['/Users/demo/.claude/skills/licell/SKILL.md'],
      skippedFiles: []
    });
  });
});
