import { describe, it, expect } from 'vitest';
import {
  appendSlsSearchCondition,
  buildFunctionLogQuery,
  resolveDefaultFcSlsProject,
  resolveSlsTailTarget,
  resolveSlsTimeRange,
  sanitizeQueryValue
} from '../providers/logs';

describe('sanitizeQueryValue', () => {
  it('returns normal string unchanged', () => {
    expect(sanitizeQueryValue('my-app-name')).toBe('my-app-name');
  });

  it('strips single quotes', () => {
    expect(sanitizeQueryValue("app'name")).toBe('appname');
  });

  it('strips double quotes', () => {
    expect(sanitizeQueryValue('app"name')).toBe('appname');
  });

  it('strips backslashes', () => {
    expect(sanitizeQueryValue('app\\name')).toBe('appname');
  });

  it('strips wildcards', () => {
    expect(sanitizeQueryValue('app*')).toBe('app');
    expect(sanitizeQueryValue('app?')).toBe('app');
  });

  it('strips colons', () => {
    expect(sanitizeQueryValue('key:value')).toBe('keyvalue');
  });

  it('strips pipes', () => {
    expect(sanitizeQueryValue('a|b')).toBe('ab');
  });

  it('strips brackets', () => {
    expect(sanitizeQueryValue('a[0]')).toBe('a0');
    expect(sanitizeQueryValue('a{b}')).toBe('ab');
    expect(sanitizeQueryValue('a(b)')).toBe('ab');
  });

  it('strips boolean operators', () => {
    expect(sanitizeQueryValue('a&b')).toBe('ab');
    expect(sanitizeQueryValue('!admin')).toBe('admin');
    expect(sanitizeQueryValue('a^b')).toBe('ab');
    expect(sanitizeQueryValue('~approx')).toBe('approx');
  });

  it('handles SLS injection attempt', () => {
    const malicious = '* | select count(*) as total';
    const sanitized = sanitizeQueryValue(malicious);
    expect(sanitized).not.toContain('|');
    expect(sanitized).not.toContain('*');
    expect(sanitized).not.toContain('(');
    expect(sanitized).not.toContain(')');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeQueryValue('my-app_v2')).toBe('my-app_v2');
  });

  it('preserves digits', () => {
    expect(sanitizeQueryValue('app123')).toBe('app123');
  });

  it('preserves dots', () => {
    expect(sanitizeQueryValue('api.v2.service')).toBe('api.v2.service');
  });

  it('handles empty string', () => {
    expect(sanitizeQueryValue('')).toBe('');
  });

  it('handles string with only special chars', () => {
    expect(sanitizeQueryValue('*?:!&|')).toBe('');
  });
});

describe('appendSlsSearchCondition', () => {
  it('uses condition when query is empty', () => {
    expect(appendSlsSearchCondition(undefined, 'level:error')).toBe('level:error');
    expect(appendSlsSearchCondition('*', 'level:error')).toBe('level:error');
  });

  it('appends condition before sql pipeline', () => {
    expect(appendSlsSearchCondition('* | select count(*) as total', 'functionName: "demo"'))
      .toBe('functionName: "demo" | select count(*) as total');
  });

  it('joins regular search expressions with and', () => {
    expect(appendSlsSearchCondition('level:error', 'functionName: "demo"'))
      .toBe('level:error and functionName: "demo"');
  });
});

describe('buildFunctionLogQuery', () => {
  it('returns raw query when function name is absent', () => {
    expect(buildFunctionLogQuery(undefined, 'level:error')).toBe('level:error');
  });

  it('injects sanitized functionName filter', () => {
    expect(buildFunctionLogQuery('demo"|*', 'level:error'))
      .toBe('level:error and functionName: "demo"');
  });

  it('supports sql pipeline query', () => {
    expect(buildFunctionLogQuery('demo', '* | select count(*) as total'))
      .toBe('functionName: "demo" | select count(*) as total');
  });
});

describe('resolveSlsTimeRange', () => {
  it('uses once default window when not specified', () => {
    expect(resolveSlsTimeRange({ once: true }, 1_700_000_000)).toEqual({
      from: 1_699_999_880,
      to: 1_700_000_000
    });
  });

  it('uses stream default lookback when not specified', () => {
    expect(resolveSlsTimeRange({}, 1_700_000_000)).toEqual({
      from: 1_699_999_940,
      to: 1_700_000_000
    });
  });

  it('prefers explicit from and to', () => {
    expect(resolveSlsTimeRange({ from: 100, to: 200, sinceSeconds: 10 }, 999)).toEqual({
      from: 100,
      to: 200
    });
  });

  it('clamps from when it exceeds to', () => {
    expect(resolveSlsTimeRange({ from: 300, to: 200 }, 999)).toEqual({
      from: 200,
      to: 200
    });
  });
});

describe('resolveSlsTailTarget', () => {
  it('uses fc defaults', () => {
    expect(resolveSlsTailTarget(
      { accountId: '123456', region: 'cn-hangzhou' },
      {}
    )).toEqual({
      region: 'cn-hangzhou',
      project: 'aliyun-fc-cn-hangzhou-123456',
      logstore: 'function-log',
      topic: undefined
    });
  });

  it('uses default-logs for explicit serverless project', () => {
    expect(resolveSlsTailTarget(
      { accountId: '123456', region: 'cn-hangzhou' },
      { project: 'serverless-cn-hangzhou-abcdef' }
    )).toEqual({
      region: 'cn-hangzhou',
      project: 'serverless-cn-hangzhou-abcdef',
      logstore: 'default-logs',
      topic: undefined
    });
  });

  it('applies explicit target overrides', () => {
    expect(resolveSlsTailTarget(
      { accountId: '123456', region: 'cn-hangzhou' },
      { region: 'cn-shanghai', project: 'custom-project', logstore: 'custom-store', topic: 'demo' }
    )).toEqual({
      region: 'cn-shanghai',
      project: 'custom-project',
      logstore: 'custom-store',
      topic: 'demo'
    });
  });
});

describe('resolveDefaultFcSlsProject', () => {
  it('formats project name from region and account id', () => {
    expect(resolveDefaultFcSlsProject({ accountId: '123456', region: 'cn-hangzhou' }))
      .toBe('aliyun-fc-cn-hangzhou-123456');
  });
});
