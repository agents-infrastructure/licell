import { describe, expect, it } from 'vitest';
import { buildHelpDocument, resolveHelpRequest, serializeHelpDocument, shouldRenderCustomHelp, suggestCommands } from '../utils/help';

const VERSION = '0.10.1';

describe('help utils', () => {
  it('builds grouped root help', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('root');
    expect(doc?.sections.some((section) => section.title === 'Automation & Tooling')).toBe(true);
    expect(doc?.blocks.some((block) => block.kind === 'command-groups')).toBe(true);
    expect(doc?.text).toContain('Command Groups:');
    expect(doc?.text).toContain('Automation:');
    expect(doc?.text).toContain('Common Tasks:');
    expect(doc?.text).toContain('第一次上手 licell');
    expect(doc?.text).toContain('licell doctor');
    expect(doc?.text).toContain('licell onboard');
    expect(doc?.text).toContain('licell skills init codex');
    expect(doc?.text).toContain('licell deploy --output json');
  });

  it('builds namespace help for db', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'db', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('db');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'db add',
      'db list',
      'db connect',
      'db public-access'
    ]));
    expect(doc?.text).toContain('licell db <subcommand> [options]');
    expect(doc?.blocks.some((block) => block.kind === 'decision-guide')).toBe(true);
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Inspect:');
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('Verify:');
    expect(doc?.text).toContain('Subcommands:');
  });

  it('builds nested namespace help for dns records', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'dns', 'records', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('dns records');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'dns records list',
      'dns records add',
      'dns records rm'
    ]));
    expect(doc?.text).toContain('DNS 解析记录的查看、添加与删除');
  });

  it('builds namespace help for task with deploy-task workflow guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'task', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('task');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'task config',
      'task invoke',
      'task info',
      'task list',
      'task stop'
    ]));
    expect(doc?.text).toContain('围绕 `deploy --type task` 交付结果');
    expect(doc?.text).toContain('任务函数没有固定访问 URL');
    expect(doc?.text).toContain('licell deploy --type task --output json');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('Verify:');
  });


  it('builds namespace help for oss with bucket lifecycle commands', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'oss', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('oss');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'oss create',
      'oss update',
      'oss rm',
      'oss object',
      'oss domain',
      'oss upload',
      'oss sync'
    ]));
    expect(doc?.text).toContain('OSS Bucket 的创建、属性配置、原生域名绑定与对象上传/下载/删除/同步');
    expect(doc?.text).toContain('Subcommands:');
    expect(doc?.text).toContain('Inspect:');
    expect(doc?.text).toContain('Mutate:');
  });

  it('builds command help for cache add with explicit mode semantics', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'cache', 'add', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('cache add');
    expect(doc?.options.some((option) => option.primaryFlag === '--mode')).toBe(true);
    expect(doc?.examples).toContain('licell cache add --mode serverless --class kvcache.cu.g4b.2');
    expect(doc?.text).toContain('`--mode` 默认为 `classic`');
    expect(doc?.text).toContain('不会自动降级');
    expect(doc?.result?.fields.some((field) => field.name === 'requestedMode')).toBe(true);
    expect(doc?.text).toContain('\n  - `requestedMode` · 请求的创建模式：`classic` 或 `serverless`。');
  });

  it('builds nested namespace help for oss object', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'oss', 'object', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('oss object');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'oss object info',
      'oss object get',
      'oss object rm'
    ]));
    expect(doc?.text).toContain('单个 OSS 对象的查看、下载与删除');
  });

  it('builds nested namespace help for oss sync', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'oss', 'sync', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('oss sync');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'oss sync up',
      'oss sync down'
    ]));
    expect(doc?.text).toContain('目录级 OSS 同步');
  });

  it('builds nested namespace help for oss domain', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'oss', 'domain', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('oss domain');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'oss domain list',
      'oss domain token',
      'oss domain bind',
      'oss domain unbind'
    ]));
    expect(doc?.text).toContain('OSS Bucket 原生自定义域名');
  });

  it('builds command help for catalog with explicit automation guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'catalog', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('catalog');
    expect(doc?.examples).toContain('licell catalog --output json');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Next Actions:');
    expect(doc?.nextActions.map((action) => action.commandTemplate)).toEqual([
      'licell catalog --output json',
      'licell deploy --help --output json',
      'licell deploy --output json'
    ]);
    expect(doc?.decisionGuide.map((group) => group.phase)).toEqual(expect.arrayContaining(['inspect']));
    expect(doc?.text).toContain('Inspect:');
    expect(doc?.text).toContain('Automation:');
  });

  it('builds command help for logs query with pass-through SLS guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'logs', 'query', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('logs query');
    expect(doc?.examples).toContain("licell logs query '*' --output json");
    expect(doc?.examples).toContain("licell logs query -p your-project -s your-store 'request_method:GET | select count(*) as total' --power-sql --output json");
    expect(doc?.text).toContain('原样透传给 SLS `GetLogs.query`');
    expect(doc?.text).toContain('先用 `*` 拉原始日志');
    expect(doc?.text).toContain('字段索引');
  });


  it('adds safety metadata for destructive commands', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'release', 'prune', '--help'],
      version: VERSION
    });

    expect(doc?.safety?.level).toBe('destructive');
    expect(doc?.safety?.confirmFlags).toEqual(expect.arrayContaining(['--apply', '--yes']));
    expect(doc?.text).toContain('Safety:');
  });

  it('adds safety metadata for mutating commands', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'deploy', '--help'],
      version: VERSION
    });

    expect(doc?.safety?.level).toBe('mutating');
    expect(doc?.text).toContain('创建或更新函数');
    expect(doc?.result?.fields.some((field) => field.name === 'invokeCommand')).toBe(true);
    expect(doc?.result?.fields.some((field) => field.name === 'configuredQualifiers[]')).toBe(true);
    expect(doc?.result?.fields.some((field) => field.name === 'bucketName')).toBe(true);
    expect(doc?.result?.fields.some((field) => field.name === 'cdnCname')).toBe(true);
    expect(doc?.result?.fields.some((field) => field.name === 'cdnRefreshMode')).toBe(true);
    expect(doc?.result?.fields.some((field) => field.name === 'cdnRefreshTaskIds[]')).toBe(true);
    expect(doc?.text).toContain('`--type task` 成功后不会返回固定访问 URL');
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`invokeCommand` · 当 `type=task` 时，推荐直接复制执行的任务调用命令。');
    expect(doc?.text).toContain('`configuredQualifiers[]` · 当 `type=task` 时，已经写入 async invoke config 的 qualifier 列表。');
  });

  it('builds command help for skills init with argument hints', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'skills', 'init', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('skills init');
    expect(doc?.args[0]?.raw).toBe('[agent]');
    expect(doc?.args[0]?.hint).toContain('claude');
    expect(doc?.examples).toContain('licell skills init codex');
    expect(doc?.examples).toContain('licell skills init codex --global --output json');
    expect(doc?.text).toContain('`--global`');
    expect(doc?.text).toContain('`licell setup` 是它的交互式包装');
    expect(doc?.text).toContain('Global Options:');
  });

  it('builds command help for init with task scaffold guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'init', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('init');
    expect(doc?.options.some((option) => option.primaryFlag === '--kind')).toBe(true);
    expect(doc?.examples).toContain('licell init --runtime nodejs22 --kind task');
    expect(doc?.text).toContain('`--kind task` 会生成任务函数入口');
    expect(doc?.result?.fields.some((field) => field.name === 'kind')).toBe(true);
    expect(doc?.recommendedFlow.some((step) => step.command === 'licell task invoke [name] --output json')).toBe(true);
  });

  it('builds command help for auth export with duration guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'auth', 'export', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('auth export');
    expect(doc?.options.some((option) => option.primaryFlag === '--expires')).toBe(true);
    expect(doc?.options.some((option) => option.primaryFlag === '--expires-hours')).toBe(true);
    expect(doc?.examples).toContain('licell auth export --expires 30d --output json');
    expect(doc?.text).toContain('默认 restore token 有效期为 7 天');
    expect(doc?.text).toContain('90m');
    expect(doc?.text).toContain('不要与 `--expires` 同时传入');
  });

  it('builds command help for auth inspect with token decode guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'auth', 'inspect', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('auth inspect');
    expect(doc?.args[0]?.raw).toBe('<token>');
    expect(doc?.args[0]?.hint).toContain('TTY 交互环境下可省略并提示输入');
    expect(doc?.examples).toContain('licell auth inspect licell-auth-v1.<token> --output json');
    expect(doc?.text).toContain('不会访问网络');
    expect(doc?.text).toContain('签名下载 URL');
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.result?.fields.some((field) => field.name === 'signedGet.host')).toBe(true);
  });

  it('builds command help for auth restore with explicit TTY prompting hints', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'auth', 'restore', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('auth restore');
    expect(doc?.args[0]?.raw).toBe('<token>');
    expect(doc?.args[0]?.hint).toContain('TTY 交互环境下可省略并提示输入');
    expect(doc?.args[1]?.raw).toBe('[passkey]');
    expect(doc?.args[1]?.hint).toContain('自动化 / Agent 调用请显式传入');
    expect(doc?.text).toContain('TTY Interaction:');
    expect(doc?.text).toContain('Automation:');
    expect(doc?.text).toContain('显式输入：<token>, [passkey], --yes。');
    expect(doc?.text).toContain('仅在 TTY 交互环境下允许省略 token / passkey');
  });

  it('builds command help for env pull with alias-safe sync guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'env', 'pull', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('env pull');
    expect(doc?.text).toContain('默认会把云端环境变量同步到本地 `.licell/project.json` 与 `.env`。');
    expect(doc?.text).toContain('该模式只更新 `.env`，不会覆盖本地 `.licell/project.json` 默认 env。');
    expect(doc?.text).toContain('`projectConfigSynced` · 是否已把拉取结果同步回本地 `.licell/project.json`。');
  });

  it('builds command help for setup with explicit task hints', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'setup', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('setup');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('默认按当前项目初始化');
    expect(doc?.text).toContain('licell setup --agent codex --output json');
    expect(doc?.text).toContain('licell setup --agent codex --global --output json');
  });

  it('builds command help for onboard with subagent guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'onboard', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('onboard');
    expect(doc?.examples).toContain('licell onboard');
    expect(doc?.text).toContain('licell-glab');
    expect(doc?.text).toContain('$licell-glab');
    expect(doc?.text).toContain('Global Options:');
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.result?.fields.some((field) => field.name === 'subagentName')).toBe(true);
  });

  it('builds command help for doctor with structured result guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'doctor', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('doctor');
    expect(doc?.result?.outcomeKey).toBe('healthy');
    expect(doc?.nextActions[0]?.commandTemplate).toBe('licell doctor --output json');
    expect(doc?.nextActions[0]?.priority).toBe('primary');
    expect(doc?.result?.fieldTree.some((field) => field.name === 'checks[]')).toBe(true);
    const checksNode = doc?.result?.fieldTree.find((field) => field.name === 'checks[]');
    expect(checksNode?.children.some((field) => field.name === 'checks[].remediation[]')).toBe(true);
    expect(checksNode?.children.some((field) => field.name === 'checks[].nextActions[]')).toBe(true);
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--runtime'))).toBe(true);
    expect(doc?.recommendedFlow.map((step) => step.command)).toEqual(expect.arrayContaining([
      'licell doctor --output json',
      'licell deploy spec',
      'licell deploy check'
    ]));
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`healthy` · 是否不存在 error 级阻塞项。');
    expect(doc?.text).not.toContain('`healthy` · 结果布尔态字段。');
    expect(doc?.text).toContain('Next Actions:');
    expect(doc?.text).toContain('command: licell doctor --output json');
    expect(doc?.text).toContain('`checks[]` · 逐项诊断结果数组。');
    expect(doc?.text).toContain('`remediation[]` · 结构化修复建议数组；既可给人看，也可给 Agent 解释修复意图。');
    expect(doc?.text).toContain('`nextActions[]` · 统一的结构化下一步数组；把 per-check 后续动作收敛成 Agent 更容易消费的主/备路径。');
    expect(doc?.text).toContain('`priority` · `primary` 为首选下一步，`secondary` 为补充路径。');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Inspect:');
  });

  it('builds command help for task list with structured result guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'task', 'list', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('task list');
    expect(doc?.result?.fields.some((field) => field.name === 'tasks[].taskId')).toBe(true);
    expect(doc?.result?.fields.some((field) => field.name === 'nextToken')).toBe(true);
    expect(doc?.recommendedFlow.map((step) => step.command)).toEqual(expect.arrayContaining([
      'licell task list [name] --output json',
      'licell task info <taskId> [name] --output json',
      'licell task stop <taskId> [name] --output json'
    ]));
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`tasks[]` · 异步任务摘要数组。');
  });

  it('treats bare namespace as custom help target', () => {
    expect(shouldRenderCustomHelp(['node', 'src/cli.ts', 'db'])).toBe(true);
    expect(resolveHelpRequest(['node', 'src/cli.ts', 'db']).scope).toBe('namespace');
  });

  it('suggests nearby commands for typos', () => {
    expect(suggestCommands('domian')).toContain('licell domain');
    expect(suggestCommands('dns recrods')).toContain('licell dns records');
  });


  it('adds option guidance and recommended flow for deploy', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'deploy', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('deploy');
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--preview'))).toBe(true);
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--runtime'))).toBe(true);
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--cdn-refresh'))).toBe(true);
    expect(doc?.recommendedFlow.map((step) => step.command)).toEqual(expect.arrayContaining([
      'licell deploy spec',
      'licell deploy check',
      'licell deploy --output json'
    ]));
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.decisionGuide.map((group) => group.phase)).toEqual(expect.arrayContaining(['inspect', 'mutate']));
    expect(doc?.text).toContain('Inspect:');
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('licell deploy check');
    expect(doc?.text).toContain('Option Guidance:');
    expect(doc?.text).toContain('Recommended Flow:');
    expect(doc!.text.indexOf('Next Actions:')).toBeLessThan(doc!.text.indexOf('Decision Guide:'));
  });

  it('adds option guidance and recommended flow for upgrade', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'upgrade', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('upgrade');
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--dry-run'))).toBe(true);
    expect(doc?.recommendedFlow[0]?.command).toBe('licell upgrade --dry-run --output json');
    expect(doc?.text).toContain('Option Guidance:');
    expect(doc?.text).toContain('Recommended Flow:');
  });

  it('explains single vs batch semantics for bootstrap', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'bootstrap', '--help'],
      version: VERSION
    });

    expect(doc?.key).toBe('bootstrap');
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--all-discovered'))).toBe(true);
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--include'))).toBe(true);
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--default-component'))).toBe(true);
    expect(doc?.recommendedFlow.some((step) => step.command === 'licell workspace discover --output json')).toBe(true);
    expect(doc?.recommendedFlow.some((step) => step.command === 'licell bootstrap --all-discovered --apply --output json')).toBe(true);
    expect(doc?.text).toContain('单组件模式');
    expect(doc?.text).toContain('批量模式');
  });

  it('explains bootstrap-aware selection semantics for deploy plan', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'deploy', 'plan', '--help'],
      version: VERSION
    });

    expect(doc?.key).toBe('deploy plan');
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--include'))).toBe(true);
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--exclude'))).toBe(true);
    expect(doc?.recommendedFlow.some((step) => step.command === 'licell bootstrap --all-discovered --apply --output json')).toBe(true);
    expect(doc?.recommendedFlow.some((step) => step.command === 'licell deploy plan --include web,api --output json')).toBe(true);
    expect(doc?.text).toContain('bootstrap selection');
  });

  it('serializes help into a stable machine-facing schema', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'domain', 'app', 'bind', '--help'],
      version: VERSION
    });

    const payload = serializeHelpDocument(doc!);

    expect(payload.schemaVersion).toBe('1.0');
    expect(payload.kind).toBe('licell-help');
    expect(payload.scope).toBe('command');
    expect(payload.key).toBe('domain app bind');
    expect(payload.result?.outcomeKey).toBe('bound');
    expect(payload.nextActions).toEqual([]);
    expect(payload.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(payload.result?.fieldTree.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(payload.renderedText).toContain('Structured Result:');
    expect('blocks' in payload).toBe(false);
    expect('text' in payload).toBe(false);
  });

  it('derives a generic recommended flow for namespaces', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'db', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.recommendedFlow[0]?.command).toContain('licell db list');
    expect(doc?.recommendedFlow.some((step) => step.command?.startsWith('licell db add'))).toBe(true);
    expect(doc?.recommendedFlow.some((step) => step.command?.startsWith('licell db info'))).toBe(true);
    expect(doc?.text).toContain('Recommended Flow:');
  });

});

describe('domain help', () => {
  it('builds canonical help for domain app bind', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'domain', 'app', 'bind', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('domain app bind');
    expect(doc?.aliases).toEqual([]);
    expect(doc?.result?.outcomeKey).toBe('bound');
    expect(doc?.nextActions).toEqual([]);
    expect(doc?.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(doc?.result?.fieldTree.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(doc?.blocks.some((block) => block.kind === 'structured-result')).toBe(true);
    expect(doc?.text).toContain('licell domain app bind <domain>');
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`stage` · 命令阶段标识。');
    expect(doc?.text).toContain('`finalUrl` · 最终访问 URL。');
    expect(doc?.text).toContain('\n  - `workflow` · 固定为 app。');
    expect(doc?.text).not.toContain('`bound` · 结果布尔态字段。\n    - `workflow`');
    expect(doc?.text).not.toContain('Aliases:');
  });

  it('builds namespace help for domain app', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'domain', 'app', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('domain app');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'domain app bind',
      'domain app unbind'
    ]));
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('Cleanup:');
    expect(doc?.text).toContain('licell domain app bind api.example.com --target prod --ssl');
  });

  it('builds namespace help for domain static', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'domain', 'static', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('domain static');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'domain static bind',
      'domain static unbind'
    ]));
  });

  it('builds namespace help for fn domain', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'fn', 'domain', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('fn domain');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'fn domain list',
      'fn domain info',
      'fn domain bind',
      'fn domain unbind'
    ]));
  });

  it('builds namespace help for task', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'task', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('namespace');
    expect(doc?.key).toBe('task');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining([
      'task config',
      'task invoke',
      'task list',
      'task info',
      'task stop'
    ]));
    expect(doc?.text).toContain('任务函数的异步配置、调用、任务列表、详情查询与终止');
    expect(doc?.text).toContain('licell deploy --type task');
    expect(doc?.text).toContain('licell task config set');
    expect(doc?.text).toContain('licell task invoke');
  });

  it('builds command help for task config set', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'task', 'config', 'set', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('task config set');
    expect(doc?.result?.outcomeKey).toBe('configured');
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--max-retry-attempts'))).toBe(true);
    expect(doc?.recommendedFlow[0]?.command).toBe('licell task config [name] --output json');
    expect(doc?.text).toContain('`configured` · 写入后始终为 `true`。');
    expect(doc?.text).not.toContain('`configured` · 结果布尔态字段。');
    expect(doc?.text).toContain('licell task invoke [name] --output json');
  });

  it('builds structured result help for fn domain unbind', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'fn', 'domain', 'unbind', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('fn domain unbind');
    expect(doc?.result?.outcomeKey).toBe('unbound');
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`unbound` · 结果布尔态字段。');
    expect(doc?.text).toContain('`removedDnsRecordIds` · 被清理的 DNS 记录 ID 列表。');
  });
});
