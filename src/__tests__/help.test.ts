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
    expect(doc?.text).toContain('licell setup');
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

  it('builds command help for mcp with real subcommands', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'mcp', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('mcp');
    expect(doc?.subcommands.map((command) => command.key)).toEqual(expect.arrayContaining(['mcp init', 'mcp serve']));
    expect(doc?.examples).toContain('licell mcp init');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.decisionGuide.map((group) => group.phase)).toEqual(expect.arrayContaining(['mutate', 'verify']));
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('Verify:');
    expect(doc?.text).toContain('Subcommands:');
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
    expect(doc?.text).toContain('Global Options:');
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

  it('builds command help for setup with explicit task hints', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'setup', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('setup');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Mutate:');
    expect(doc?.text).toContain('licell setup --agent codex --global --output json');
  });

  it('builds command help for doctor with structured result guidance', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', 'doctor', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('command');
    expect(doc?.key).toBe('doctor');
    expect(doc?.result?.outcomeKey).toBe('healthy');
    expect(doc?.optionInsights.some((insight) => insight.flag.includes('--runtime'))).toBe(true);
    expect(doc?.recommendedFlow.map((step) => step.command)).toEqual(expect.arrayContaining([
      'licell doctor --output json',
      'licell deploy spec',
      'licell deploy check'
    ]));
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`healthy` · 是否不存在 error 级阻塞项。');
    expect(doc?.text).toContain('`checks[].remediation[].type`');
    expect(doc?.text).toContain('`checks[].nextCommands[].priority`');
    expect(doc?.text).toContain('Decision Guide:');
    expect(doc?.text).toContain('Inspect:');
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
    expect(payload.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);
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
    expect(doc?.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(doc?.blocks.some((block) => block.kind === 'structured-result')).toBe(true);
    expect(doc?.text).toContain('licell domain app bind <domain>');
    expect(doc?.text).toContain('Structured Result:');
    expect(doc?.text).toContain('`stage` · 命令阶段标识。');
    expect(doc?.text).toContain('`finalUrl` · 最终访问 URL。');
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
