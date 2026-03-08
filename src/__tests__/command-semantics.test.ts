import { describe, expect, it } from 'vitest';
import {
  buildDerivedRecommendedFlow,
  deriveCommandSafety,
  findPreferredSubcommandByPhase,
  inferCommandTaskDescription,
  inferCommandTaskPhaseFromText,
  inferCommandTaskTitle
} from '../utils/command-semantics';

const sampleSubcommands = [
  {
    key: 'domain app bind',
    rawName: 'domain app bind',
    invocation: 'licell domain app bind example.com',
    description: '绑定应用域名。'
  },
  {
    key: 'domain app unbind',
    rawName: 'domain app unbind',
    invocation: 'licell domain app unbind example.com',
    description: '解绑应用域名。'
  },
  {
    key: 'domain app info',
    rawName: 'domain app info',
    invocation: 'licell domain app info example.com',
    description: '查看应用域名状态。'
  }
];

describe('command semantics', () => {
  it('infers task phases from command-like text', () => {
    expect(inferCommandTaskPhaseFromText('licell dns records list')).toBe('inspect');
    expect(inferCommandTaskPhaseFromText('创建一个新的 bucket')).toBe('mutate');
    expect(inferCommandTaskPhaseFromText('执行删除并回滚')).toBe('cleanup');
  });

  it('selects preferred subcommands by phase', () => {
    expect(findPreferredSubcommandByPhase(sampleSubcommands, 'mutate')?.key).toBe('domain app bind');
    expect(findPreferredSubcommandByPhase(sampleSubcommands, 'cleanup')?.key).toBe('domain app unbind');
    expect(findPreferredSubcommandByPhase(sampleSubcommands, 'verify', ['domain app info'])).toBeUndefined();
  });

  it('derives titles and descriptions from command semantics', () => {
    expect(inferCommandTaskTitle(sampleSubcommands[0]!)).toBe('绑定或接入');
    expect(inferCommandTaskDescription(sampleSubcommands[1]!)).toContain('高影响清理或回退');
  });

  it('derives command safety levels', () => {
    expect(deriveCommandSafety('domain app unbind')?.level).toBe('destructive');
    expect(deriveCommandSafety('deploy')?.level).toBe('mutating');
    expect(deriveCommandSafety('status')).toBeUndefined();
  });

  it('builds a recommended flow from namespace subcommands', () => {
    const steps = buildDerivedRecommendedFlow([
      {
        key: 'db list',
        rawName: 'db list',
        invocation: 'licell db list',
        description: '列出数据库。'
      },
      {
        key: 'db add',
        rawName: 'db add',
        invocation: 'licell db add demo',
        description: '创建数据库。'
      },
      {
        key: 'db info',
        rawName: 'db info',
        invocation: 'licell db info demo',
        description: '查看数据库详情。'
      }
    ]);

    expect(steps.map((step) => step.command)).toEqual([
      'licell db list',
      'licell db add demo',
      'licell db info demo'
    ]);
  });
});
