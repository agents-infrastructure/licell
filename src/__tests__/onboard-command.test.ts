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

  it('installs global codex skills and licell-glab subagent together', async () => {
    mockGetGlobalSkillFiles.mockReturnValue([{ path: '/Users/demo/.codex/skills/licell/SKILL.md', content: 'skill body' }]);
    mockGetGlobalCodexSubagentFiles.mockReturnValue([{ path: '/Users/demo/.codex/agents/licell-glab.toml', content: 'agent body' }]);
    mockWriteSkillFiles.mockReturnValue({
      written: ['/Users/demo/.codex/skills/licell/SKILL.md', '/Users/demo/.codex/agents/licell-glab.toml'],
      skipped: []
    });

    const result = await executeOnboard({
      projectRoot: '/tmp/demo-project'
    });

    expect(mockGetGlobalSkillFiles).toHaveBeenCalledWith('codex');
    expect(mockGetGlobalCodexSubagentFiles).toHaveBeenCalledWith();
    expect(mockWriteSkillFiles).toHaveBeenCalledWith('', [
      { path: '/Users/demo/.codex/skills/licell/SKILL.md', content: 'skill body' },
      { path: '/Users/demo/.codex/agents/licell-glab.toml', content: 'agent body' }
    ], false);
    expect(result).toEqual({
      agent: 'codex',
      subagentName: 'licell-glab',
      projectRoot: '/tmp/demo-project',
      writtenFiles: ['/Users/demo/.codex/skills/licell/SKILL.md', '/Users/demo/.codex/agents/licell-glab.toml'],
      skippedFiles: []
    });
  });

  it('passes force through to shared file writer', async () => {
    mockGetGlobalSkillFiles.mockReturnValue([{ path: '/Users/demo/.codex/skills/licell/SKILL.md', content: 'skill body' }]);
    mockGetGlobalCodexSubagentFiles.mockReturnValue([{ path: '/Users/demo/.codex/agents/licell-glab.toml', content: 'agent body' }]);
    mockWriteSkillFiles.mockReturnValue({ written: [], skipped: ['/Users/demo/.codex/skills/licell/SKILL.md'] });

    await executeOnboard({
      projectRoot: '/tmp/demo-project',
      force: true
    });

    expect(mockWriteSkillFiles).toHaveBeenCalledWith('', expect.any(Array), true);
  });
});
