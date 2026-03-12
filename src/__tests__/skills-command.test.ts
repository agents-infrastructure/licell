import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetSkillFiles,
  mockGetGlobalSkillFiles,
  mockWriteSkillFiles,
  mockEnsureAgentsMdEntry
} = vi.hoisted(() => ({
  mockGetSkillFiles: vi.fn(),
  mockGetGlobalSkillFiles: vi.fn(),
  mockWriteSkillFiles: vi.fn(),
  mockEnsureAgentsMdEntry: vi.fn()
}));

vi.mock('../utils/skills-scaffold', () => ({
  getSkillFiles: mockGetSkillFiles,
  getGlobalSkillFiles: mockGetGlobalSkillFiles,
  writeSkillFiles: mockWriteSkillFiles,
  ensureAgentsMdEntry: mockEnsureAgentsMdEntry
}));

import { executeSkillsInit } from '../commands/skills';

describe('executeSkillsInit', () => {
  beforeEach(() => {
    mockGetSkillFiles.mockReset();
    mockGetGlobalSkillFiles.mockReset();
    mockWriteSkillFiles.mockReset();
    mockEnsureAgentsMdEntry.mockReset();
  });

  it('writes project-scoped skills and updates AGENTS.md', async () => {
    mockGetSkillFiles.mockReturnValue([{ path: 'codex.md', content: 'body' }]);
    mockWriteSkillFiles.mockReturnValue({ written: ['codex.md'], skipped: [] });
    mockEnsureAgentsMdEntry.mockReturnValue({ updated: true });

    const result = await executeSkillsInit({
      agent: 'codex',
      scope: 'project',
      projectRoot: '/tmp/demo-project'
    });

    expect(mockGetSkillFiles).toHaveBeenCalledWith('codex');
    expect(mockGetGlobalSkillFiles).not.toHaveBeenCalled();
    expect(mockWriteSkillFiles).toHaveBeenCalledWith('/tmp/demo-project', [{ path: 'codex.md', content: 'body' }], false);
    expect(mockEnsureAgentsMdEntry).toHaveBeenCalledWith('/tmp/demo-project');
    expect(result).toEqual({
      agent: 'codex',
      scope: 'project',
      projectRoot: '/tmp/demo-project',
      writtenFiles: ['codex.md'],
      skippedFiles: [],
      agentsMdUpdated: true
    });
  });

  it('writes global-scoped skills without updating AGENTS.md', async () => {
    mockGetGlobalSkillFiles.mockReturnValue([{ path: '/Users/demo/.agents/skills/licell/SKILL.md', content: 'body' }]);
    mockWriteSkillFiles.mockReturnValue({ written: ['/Users/demo/.agents/skills/licell/SKILL.md'], skipped: [] });

    const result = await executeSkillsInit({
      agent: 'codex',
      scope: 'global',
      projectRoot: '/tmp/demo-project',
      force: true
    });

    expect(mockGetGlobalSkillFiles).toHaveBeenCalledWith('codex');
    expect(mockGetSkillFiles).not.toHaveBeenCalled();
    expect(mockWriteSkillFiles).toHaveBeenCalledWith('', [{ path: '/Users/demo/.agents/skills/licell/SKILL.md', content: 'body' }], true);
    expect(mockEnsureAgentsMdEntry).not.toHaveBeenCalled();
    expect(result).toEqual({
      agent: 'codex',
      scope: 'global',
      projectRoot: '/tmp/demo-project',
      writtenFiles: ['/Users/demo/.agents/skills/licell/SKILL.md'],
      skippedFiles: [],
      agentsMdUpdated: false
    });
  });
});
