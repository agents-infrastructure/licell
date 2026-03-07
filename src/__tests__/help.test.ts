import { describe, expect, it } from 'vitest';
import { buildHelpDocument, resolveHelpRequest, shouldRenderCustomHelp, suggestCommands } from '../utils/help';

const VERSION = '0.10.1';

describe('help utils', () => {
  it('builds grouped root help', () => {
    const doc = buildHelpDocument({
      argv: ['node', 'src/cli.ts', '--help'],
      version: VERSION
    });

    expect(doc?.scope).toBe('root');
    expect(doc?.sections.some((section) => section.title === 'Automation & Tooling')).toBe(true);
    expect(doc?.text).toContain('Command Groups:');
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
      'oss domain rm'
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
