import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockExecuteSkillsInit,
  mockEmitCommandResult,
  mockEmitCliError,
  mockIsInteractiveTTY,
  mockShowOutro
} = vi.hoisted(() => ({
  mockExecuteSkillsInit: vi.fn(),
  mockEmitCommandResult: vi.fn(),
  mockEmitCliError: vi.fn(),
  mockIsInteractiveTTY: vi.fn(),
  mockShowOutro: vi.fn()
}));

vi.mock('../commands/skills', () => ({
  executeSkillsInit: mockExecuteSkillsInit
}));

vi.mock('../utils/output', () => ({
  emitCommandResult: mockEmitCommandResult,
  emitCliError: mockEmitCliError,
  emitCommandEvent: vi.fn(),
  isJsonOutput: () => true
}));

vi.mock('../utils/cli-shared', () => ({
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  isInteractiveTTY: mockIsInteractiveTTY,
  showIntro: vi.fn(),
  showOutro: mockShowOutro
}));

vi.mock('../utils/errors', () => ({
  formatErrorMessage: (err: unknown) => String(err)
}));

import { runInteractiveSetup } from '../commands/setup';

describe('runInteractiveSetup', () => {
  beforeEach(() => {
    mockExecuteSkillsInit.mockReset();
    mockEmitCommandResult.mockReset();
    mockEmitCliError.mockReset();
    mockIsInteractiveTTY.mockReset();
    mockShowOutro.mockReset();
    mockIsInteractiveTTY.mockReturnValue(false);
    mockExecuteSkillsInit.mockResolvedValue({
      agent: 'codex',
      scope: 'project',
      projectRoot: '/tmp/demo-project',
      writtenFiles: ['codex.md'],
      skippedFiles: [],
      agentsMdUpdated: true
    });
  });

  it('defaults to project scope in non-interactive mode', async () => {
    await runInteractiveSetup({
      agent: 'codex',
      projectRoot: '/tmp/demo-project'
    });

    expect(mockExecuteSkillsInit).toHaveBeenCalledWith({
      agent: 'codex',
      scope: 'project',
      projectRoot: '/tmp/demo-project',
      force: undefined
    });
    expect(mockEmitCommandResult).toHaveBeenCalledWith(expect.objectContaining({
      agent: 'codex',
      scope: 'project',
      projectRoot: '/tmp/demo-project'
    }));
  });

  it('uses global scope when --global is provided', async () => {
    mockExecuteSkillsInit.mockResolvedValue({
      agent: 'codex',
      scope: 'global',
      projectRoot: '/tmp/demo-project',
      writtenFiles: ['/Users/demo/.agents/skills/licell/SKILL.md'],
      skippedFiles: [],
      agentsMdUpdated: false
    });

    await runInteractiveSetup({
      agent: 'codex',
      global: true,
      projectRoot: '/tmp/demo-project'
    });

    expect(mockExecuteSkillsInit).toHaveBeenCalledWith({
      agent: 'codex',
      scope: 'global',
      projectRoot: '/tmp/demo-project',
      force: undefined
    });
    expect(mockEmitCommandResult).toHaveBeenCalledWith(expect.objectContaining({
      agent: 'codex',
      scope: 'global',
      projectRoot: '/tmp/demo-project'
    }));
  });
});
