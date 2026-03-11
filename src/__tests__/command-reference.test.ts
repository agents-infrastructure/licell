import { describe, expect, it } from 'vitest';
import {
  buildAgentCommandCatalog,
  buildCommandReferenceSections,
  filterAgentCommandCatalog,
  renderSkillCommandReference
} from '../utils/command-reference';
import { buildHelpSemanticDocument } from '../utils/help';

describe('buildCommandReferenceSections', () => {
  it('groups commands into stable sections', () => {
    const sections = buildCommandReferenceSections();
    expect(sections.map((section) => section.id)).toContain('setup');
    expect(sections.map((section) => section.id)).toContain('delivery');
    expect(sections.map((section) => section.id)).toContain('automation');

    const automation = sections.find((section) => section.id === 'automation');
    expect(automation?.commands.some((command) => command.key === 'doctor')).toBe(true);
    expect(automation?.commands.some((command) => command.key === 'completion')).toBe(true);
    expect(automation?.commands.some((command) => command.key === 'upgrade')).toBe(true);
  });
});

describe('buildAgentCommandCatalog', () => {
  it('includes command metadata shared across agent surfaces', () => {
    const catalog = buildAgentCommandCatalog();
    expect(catalog.source).toBe('licell-cli-registry');
    expect(catalog.kind).toBe('licell-agent-command-catalog');
    expect(catalog.schemaVersion).toBe('1.0');
    expect(catalog.schemas.help).toEqual({
      kind: 'licell-help',
      schemaVersion: '1.0'
    });
    expect(catalog.globalOptions).toContain('--output');
    expect(catalog.rootCommands).toContain('doctor');
    expect(catalog.rootCommands).toContain('deploy');
    expect(catalog.rootCommands).toContain('completion');

    const deploy = catalog.commands.find((command) => command.key === 'deploy');
    const deployHelp = buildHelpSemanticDocument({
      argv: ['node', 'src/cli.ts', 'deploy', '--help']
    });
    expect(deploy).toBeDefined();
    expect(deployHelp?.scope).toBe('command');
    expect(deploy?.subcommands).toContain('spec');
    expect(deploy?.subcommands).toContain('check');
    expect(deploy?.options.some((option) => option.primaryFlag === '--type')).toBe(true);
    expect(deploy?.title).toBe('Deploy current project');
    expect(deploy?.summary).toContain('一键部署 API / Static');
    expect(deploy?.summary).toBe(deployHelp?.summary);
    expect(deploy?.decisionGuide).toEqual(deployHelp?.decisionGuide);
    expect(deploy?.optionInsights.some((insight) => insight.flag.includes('--runtime'))).toBe(true);
    expect(deploy?.tasks.some((task) => task.phase === 'inspect')).toBe(true);
    expect(deploy?.decisionGuide.some((group) => group.phase === 'mutate')).toBe(true);
    expect(deploy?.examples).toContain('licell deploy --output json');
    expect(deploy?.recommendedFlow[0]?.command).toBe('licell deploy spec');
    expect(deploy?.recommendedFlow).toEqual(deployHelp?.recommendedFlow);

    const releasePrune = catalog.commands.find((command) => command.key === 'release prune');
    expect(releasePrune?.safety?.level).toBe('destructive');

    const mcp = catalog.commands.find((command) => command.key === 'mcp');
    expect(mcp?.recommendedFlow[0]?.command).toBe('licell mcp init');
    expect(mcp?.examples).toContain('licell mcp init');
    expect(mcp?.agentTips.some((tip) => tip.includes('mcp serve'))).toBe(true);

    const doctor = catalog.commands.find((command) => command.key === 'doctor');
    expect(doctor?.title).toBe('Diagnose local licell readiness');
    expect(doctor?.summary).toContain('诊断本机登录态');
    expect(doctor?.options.some((option) => option.primaryFlag === '--runtime')).toBe(true);
    expect(doctor?.result?.outcomeKey).toBe('healthy');
    expect(doctor?.result?.fields.some((field) => field.name === 'checks[].remediation[].type')).toBe(true);
    expect(doctor?.result?.fields.some((field) => field.name === 'checks[].nextCommands[].priority')).toBe(true);
    expect(doctor?.generatedMcpToolName).toBe('licell_cmd_doctor');

    const domainAppBind = catalog.commands.find((command) => command.key === 'domain app bind');
    expect(domainAppBind?.result?.outcomeKey).toBe('bound');
    expect(domainAppBind?.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);

    const authRestore = catalog.commands.find((command) => command.key === 'auth restore');
    expect(authRestore?.interaction?.ttyOnly).toBe(true);
    expect(authRestore?.interaction?.prompts.some((item) => item.includes('restore token'))).toBe(true);
    expect(authRestore?.automation?.preferredOutput).toBe('json');
    expect(authRestore?.automation?.explicitInputs).toEqual(expect.arrayContaining(['<token>', '--yes']));
  });

  it('filters by root command without hardcoded command lists', () => {
    const filtered = filterAgentCommandCatalog(buildAgentCommandCatalog(), { rootCommand: 'deploy' });
    expect(filtered.kind).toBe('licell-agent-command-catalog');
    expect(filtered.schemas.help.kind).toBe('licell-help');
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
    expect(markdown).toContain('licell doctor');
    expect(markdown).toContain('licell completion [shell]');
    expect(markdown).toContain('licell setup');
    expect(markdown).toContain('licell upgrade');
    expect(markdown).toContain('licell auth repair');
    expect(markdown).toContain('licell oss create <bucket>');
    expect(markdown).toContain('licell oss domain bind <bucket> <domain>');
    expect(markdown).toContain('licell oss object get <bucket> <key> [file]');
    expect(markdown).toContain('licell oss sync down <bucket> [prefix]');
    expect(markdown).toContain('示例命令：');
    expect(markdown).toContain('`licell deploy --output json`');
    expect(markdown).toContain('决策指南：');
    expect(markdown).toContain('Inspect：');
    expect(markdown).toContain('关键选项建议：');
    expect(markdown).toContain('结构化结果：');
    expect(markdown).toContain('`stage`：命令阶段标识。');
    expect(markdown).toContain('`finalUrl`：最终访问 URL。');
    expect(markdown).toContain('推荐流程：');
    expect(markdown).toContain('licell deploy spec');
  });
});

describe('domain command reference coverage', () => {
  it('renders domain workflow and fn domain commands from shared registry', () => {
    const markdown = renderSkillCommandReference();
    expect(markdown).toContain('licell domain app bind <domain>');
    expect(markdown).toContain('licell fn domain bind <domain>');
    expect(markdown).toContain('licell domain static bind <domain>');
  });
});
