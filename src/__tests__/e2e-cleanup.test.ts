import { describe, expect, it } from 'vitest';
import {
  classifyE2eCleanupCommandResult,
  resolveE2eCleanupCommandCwd,
  resolveE2eCleanupRegion,
  type CapturedCliCommandResult
} from '../commands/e2e';
import { runWithInvocationRegion } from '../utils/region-context';

describe('e2e cleanup helpers', () => {
  it('resolves explicit override before manifest ownership and auth fallback', () => {
    expect(runWithInvocationRegion(
      { scope: 'manifest', regionId: 'cn-beijing', resolveFallbackRegion: () => 'cn-hangzhou' },
      () => resolveE2eCleanupRegion('cn-shanghai')
    )).toBe('cn-beijing');
    expect(runWithInvocationRegion(
      { scope: 'manifest', resolveFallbackRegion: () => 'cn-hangzhou' },
      () => resolveE2eCleanupRegion('cn-shanghai')
    )).toBe('cn-shanghai');
    expect(runWithInvocationRegion(
      { scope: 'manifest', resolveFallbackRegion: () => 'cn-hangzhou' },
      () => resolveE2eCleanupRegion()
    )).toBe('cn-hangzhou');
  });

  it('falls back to project root when workspace was already removed', () => {
    expect(resolveE2eCleanupCommandCwd('/tmp/missing-workspace', '/repo', () => false)).toBe('/repo');
    expect(resolveE2eCleanupCommandCwd('/tmp/existing-workspace', '/repo', (path) => path === '/tmp/existing-workspace')).toBe('/tmp/existing-workspace');
  });

  it('treats ignored not-found cleanup failures as skipped using stderr output', () => {
    const result: CapturedCliCommandResult = {
      status: 1,
      signal: null,
      stdout: '\u001b[?25l│\n\u001b[999D\u001b[J◒  正在级联清理并删除函数 demo\u001b[999D\u001b[J◇  ❌ 删除函数失败\n\u001b[?25h',
      stderr: "FunctionNotFound: code: 404, function 'demo' does not exist request id: 1-xxx"
    };

    expect(classifyE2eCleanupCommandResult(result, ['fn', 'rm', 'demo'], ['functionnotfound', 'does not exist'])).toEqual({
      outcome: 'skipped',
      message: "FunctionNotFound: code: 404, function 'demo' does not exist request id: 1-xxx"
    });
  });

  it('sanitizes stdout-only cleanup errors before storing them', () => {
    const result: CapturedCliCommandResult = {
      status: 1,
      signal: null,
      stdout: '\u001b[?25l│\n\u001b[999D\u001b[J◒  正在级联清理并删除函数 demo\u001b[999D\u001b[J◇  ❌ 删除函数失败\n\u001b[?25h',
      stderr: ''
    };

    expect(classifyE2eCleanupCommandResult(result, ['fn', 'rm', 'demo'])).toEqual({
      outcome: 'failed',
      message: '❌ 删除函数失败'
    });
  });

  it('builds a fallback failure message when the child process returns no output', () => {
    const result: CapturedCliCommandResult = {
      status: null,
      signal: null,
      stdout: '',
      stderr: ''
    };

    expect(classifyE2eCleanupCommandResult(result, ['fn', 'rm', 'demo'])).toEqual({
      outcome: 'failed',
      message: '命令失败: licell fn rm demo (exit=null)'
    });
  });
});
