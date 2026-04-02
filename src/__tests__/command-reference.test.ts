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
    expect(catalog.schemas.cliRecord).toEqual({
      kind: 'licell-cli-record',
      schemaVersion: '1.0'
    });
    expect(catalog.globalOptions).toContain('--output');
    expect(catalog.rootCommands).toContain('doctor');
    expect(catalog.rootCommands).toContain('deploy');
    expect(catalog.rootCommands).toContain('task');
    expect(catalog.rootCommands).toContain('completion');
    expect(catalog.rootCommands).toContain('catalog');

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
    expect(deploy?.nextActions).toEqual(deployHelp?.nextActions);
    expect(deploy?.optionInsights.some((insight) => insight.flag.includes('--runtime'))).toBe(true);
    expect(deploy?.tasks.some((task) => task.phase === 'inspect')).toBe(true);
    expect(deploy?.decisionGuide.some((group) => group.phase === 'mutate')).toBe(true);
    expect(deploy?.examples).toContain('licell deploy --output json');
    expect(deploy?.examples).toContain('licell deploy --type task --runtime nodejs22 --target preview --output json');
    expect(deploy?.recommendedFlow[0]?.command).toBe('licell deploy spec');
    expect(deploy?.recommendedFlow).toEqual(deployHelp?.recommendedFlow);
    expect(deploy?.result?.fields.some((field) => field.name === 'invokeCommand')).toBe(true);
    expect(deploy?.result?.fields.some((field) => field.name === 'configuredQualifiers[]')).toBe(true);
    expect(deploy?.tasks.some((task) => task.phase === 'verify')).toBe(true);

    const releasePrune = catalog.commands.find((command) => command.key === 'release prune');
    expect(releasePrune?.safety?.level).toBe('destructive');

    const commandCatalog = catalog.commands.find((command) => command.key === 'catalog');
    expect(commandCatalog?.recommendedFlow[0]?.command).toBe('licell catalog --output json');
    expect(commandCatalog?.examples).toContain('licell catalog --output json');
    expect(commandCatalog?.result?.fields.some((field) => field.name === 'cliRecords.event')).toBe(true);

    const doctor = catalog.commands.find((command) => command.key === 'doctor');
    expect(doctor?.title).toBe('Diagnose local licell readiness');
    expect(doctor?.summary).toContain('诊断本机登录态');
    expect(doctor?.options.some((option) => option.primaryFlag === '--runtime')).toBe(true);
    expect(doctor?.nextActions[0]?.commandTemplate).toBe('licell doctor --output json');
    expect(doctor?.result?.outcomeKey).toBe('healthy');
    expect(doctor?.result?.fields.some((field) => field.name === 'checks[].remediation[].type')).toBe(true);
    expect(doctor?.result?.fields.some((field) => field.name === 'checks[].nextActions[].priority')).toBe(true);
    expect(doctor?.result?.fields.some((field) => field.name === 'checks[].nextCommands[].priority')).toBe(true);
    expect(doctor?.result?.fieldTree.some((field) => field.name === 'checks[]')).toBe(true);

    const domainAppBind = catalog.commands.find((command) => command.key === 'domain app bind');
    expect(domainAppBind?.result?.outcomeKey).toBe('bound');
    expect(domainAppBind?.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(domainAppBind?.result?.fieldTree.some((field) => field.name === 'finalUrl')).toBe(true);

    const authExport = catalog.commands.find((command) => command.key === 'auth export');
    expect(authExport?.options.some((option) => option.primaryFlag === '--expires')).toBe(true);
    expect(authExport?.options.some((option) => option.primaryFlag === '--expires-hours')).toBe(true);
    expect(authExport?.examples).toContain('licell auth export --expires 30d --output json');
    expect(authExport?.optionInsights.some((insight) => insight.flag.includes('--expires'))).toBe(true);

    const authInspect = catalog.commands.find((command) => command.key === 'auth inspect');
    expect(authInspect?.examples).toContain('licell auth inspect licell-auth-v1.<token> --output json');
    expect(authInspect?.automation?.explicitInputs).toEqual(expect.arrayContaining(['<token>']));
    expect(authInspect?.result?.fields.some((field) => field.name === 'signedGet.host')).toBe(true);

    const authRestore = catalog.commands.find((command) => command.key === 'auth restore');
    expect(authRestore?.interaction?.ttyOnly).toBe(true);
    expect(authRestore?.interaction?.prompts.some((item) => item.includes('restore token'))).toBe(true);
    expect(authRestore?.automation?.preferredOutput).toBe('json');
    expect(authRestore?.automation?.explicitInputs).toEqual(expect.arrayContaining(['<token>', '--yes']));

    const init = catalog.commands.find((command) => command.key === 'init');
    expect(init?.options.some((option) => option.primaryFlag === '--kind')).toBe(true);
    expect(init?.examples).toContain('licell init --runtime nodejs22 --kind task');
    expect(init?.result?.fields.some((field) => field.name === 'kind')).toBe(true);

    const taskInvoke = catalog.commands.find((command) => command.key === 'task invoke');
    expect(taskInvoke?.title).toBe('Invoke task function asynchronously');
    expect(taskInvoke?.options.some((option) => option.primaryFlag === '--task-id')).toBe(true);
    expect(taskInvoke?.result?.fields.some((field) => field.name === 'taskId')).toBe(true);

    const taskConfigSet = catalog.commands.find((command) => command.key === 'task config set');
    expect(taskConfigSet?.title).toBe('Upsert async task invoke config');
    expect(taskConfigSet?.options.some((option) => option.primaryFlag === '--max-retry-attempts')).toBe(true);
    expect(taskConfigSet?.result?.fields.some((field) => field.name === 'destinationConfig')).toBe(true);

    const taskList = catalog.commands.find((command) => command.key === 'task list');
    expect(taskList?.title).toBe('List async task executions');
    expect(taskList?.result?.fields.some((field) => field.name === 'tasks[].taskId')).toBe(true);
    expect(taskList?.recommendedFlow.some((step) => step.command === 'licell task info <taskId> [name] --output json')).toBe(true);

    const taskStop = catalog.commands.find((command) => command.key === 'task stop');
    expect(taskStop?.title).toBe('Stop async task');
    expect(taskStop?.result?.fields.some((field) => field.name === 'functionName')).toBe(true);
    expect(taskStop?.recommendedFlow.some((step) => step.command === 'licell task info <taskId> [name] --output json')).toBe(true);

    const fnLogs = catalog.commands.find((command) => command.key === 'fn logs');
    expect(fnLogs?.title).toBe('View FC function logs');
    expect(fnLogs?.examples).toContain('licell fn logs my-function --once --window 300 --output json');
    expect(fnLogs?.result?.fields.some((field) => field.name === 'functionName')).toBe(true);

    const logsQuery = catalog.commands.find((command) => command.key === 'logs query');
    expect(logsQuery?.title).toBe('Query SLS logs');
    expect(logsQuery?.examples).toContain('licell logs query -p your-project -s your-store --from 1710000000 --to 1710000300 --output json');
    expect(logsQuery?.result?.fields.some((field) => field.name === 'project')).toBe(true);

    const logsTail = catalog.commands.find((command) => command.key === 'logs tail');
    expect(logsTail?.title).toBe('Tail SLS logs');
    expect(logsTail?.examples).toContain('licell logs tail -p your-project -s your-store \'status:500\'');
    expect(logsTail?.result).toBeUndefined();

    const cacheAdd = catalog.commands.find((command) => command.key === 'cache add');
    expect(cacheAdd?.options.some((option) => option.primaryFlag === '--mode')).toBe(true);
    expect(cacheAdd?.examples).toContain('licell cache add --mode serverless --class kvcache.cu.g4b.2');
    expect(cacheAdd?.result?.fields.some((field) => field.name === 'requestedMode')).toBe(true);
    expect(cacheAdd?.summary).toContain('分配 Redis 缓存');
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
    expect(markdown).toContain('licell auth inspect <token>');
    expect(markdown).toContain('licell oss create <bucket>');
    expect(markdown).toContain('licell oss domain bind <bucket> <domain>');
    expect(markdown).toContain('licell oss object get <bucket> <key> [file]');
    expect(markdown).toContain('licell oss sync down <bucket> [prefix]');
    expect(markdown).toContain('licell fn logs [name]');
    expect(markdown).toContain('licell logs query [query]');
    expect(markdown).toContain('licell logs tail [query]');
    expect(markdown).toContain('licell cache add --mode serverless --class kvcache.cu.g4b.2');
    expect(markdown).toContain('licell task config [name]');
    expect(markdown).toContain('licell task config set [name]');
    expect(markdown).toContain('licell task invoke [name]');
    expect(markdown).toContain('licell task list [name]');
    expect(markdown).toContain('licell task stop <taskId> [name]');
    expect(markdown).toContain('licell deploy --type task');
    expect(markdown).toContain('示例命令：');
    expect(markdown).toContain('`licell deploy --output json`');
    expect(markdown).toContain('`invokeCommand`：当 `type=task` 时，推荐直接复制执行的任务调用命令。');
    expect(markdown).toContain('`tasks[]`：异步任务摘要数组。');
    expect(markdown).toContain('决策指南：');
    expect(markdown).toContain('下一步：');
    expect(markdown).toContain('`licell doctor --output json`');
    expect(markdown).toContain('Inspect：');
    expect(markdown).toContain('关键选项建议：');
    expect(markdown).toContain('结构化结果：');
    expect(markdown).toContain('`stage`：命令阶段标识。');
    expect(markdown).toContain('`finalUrl`：最终访问 URL。');
    expect(markdown).toContain('\n- `workflow`：固定为 app。');
    expect(markdown).not.toContain('`bound`：结果布尔态字段。\n  - `workflow`');
    expect(markdown).toContain('`checks[]`：逐项诊断结果数组。');
    expect(markdown).toContain('推荐流程：');
    expect(markdown).toContain('licell deploy spec');
    expect(markdown.indexOf('下一步：')).toBeLessThan(markdown.indexOf('决策指南：'));
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
