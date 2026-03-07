import { describe, expect, it } from 'vitest';
import {
  buildAgentCommandCatalog,
  buildCommandReferenceSections,
  filterAgentCommandCatalog,
  renderSkillCommandReference
} from '../utils/command-reference';

describe('buildCommandReferenceSections', () => {
  it('groups commands into stable sections', () => {
    const sections = buildCommandReferenceSections();
    expect(sections.map((section) => section.id)).toContain('setup');
    expect(sections.map((section) => section.id)).toContain('delivery');
    expect(sections.map((section) => section.id)).toContain('automation');

    const automation = sections.find((section) => section.id === 'automation');
    expect(automation?.commands.some((command) => command.key === 'completion')).toBe(true);
    expect(automation?.commands.some((command) => command.key === 'upgrade')).toBe(true);
  });
});

describe('buildAgentCommandCatalog', () => {
  it('includes command metadata shared across agent surfaces', () => {
    const catalog = buildAgentCommandCatalog();
    expect(catalog.source).toBe('licell-cli-registry');
    expect(catalog.globalOptions).toContain('--output');
    expect(catalog.rootCommands).toContain('deploy');
    expect(catalog.rootCommands).toContain('completion');

    const deploy = catalog.commands.find((command) => command.key === 'deploy');
    expect(deploy).toBeDefined();
    expect(deploy?.subcommands).toContain('spec');
    expect(deploy?.subcommands).toContain('check');
    expect(deploy?.options.some((option) => option.primaryFlag === '--type')).toBe(true);
  });

  it('filters by root command without hardcoded command lists', () => {
    const filtered = filterAgentCommandCatalog(buildAgentCommandCatalog(), { rootCommand: 'deploy' });
    expect(filtered.rootCommands).toEqual(['deploy']);
    expect(filtered.sections).toHaveLength(1);
    expect(filtered.commands.length).toBeGreaterThan(1);
    expect(filtered.commands.every((command) => command.rootCommand === 'deploy')).toBe(true);
    expect(filtered.commands.map((command) => command.key)).toEqual(
      expect.arrayContaining(['deploy', 'deploy spec', 'deploy check'])
    );
  });
});

describe('renderSkillCommandReference', () => {
  it('renders the auto-generated command reference with new tooling commands', () => {
    const markdown = renderSkillCommandReference();
    expect(markdown).toContain('以下命令清单由 licell CLI 注册表自动生成');
    expect(markdown).toContain('### Automation & Tooling');
    expect(markdown).toContain('licell completion [shell]');
    expect(markdown).toContain('licell setup');
    expect(markdown).toContain('licell upgrade');
    expect(markdown).toContain('licell auth repair');
  });
});
