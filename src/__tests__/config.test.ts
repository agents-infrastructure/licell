import { describe, it, expect } from 'vitest';
import { normalizeProject, normalizeAuth } from '../utils/config';

describe('normalizeAuth', () => {
  it('returns valid auth from correct input', () => {
    const result = normalizeAuth({
      accountId: '123456',
      ak: 'LTAI_xxx',
      sk: 'secret',
      region: 'cn-hangzhou'
    });
    expect(result).toEqual({
      accountId: '123456',
      ak: 'LTAI_xxx',
      sk: 'secret',
      region: 'cn-hangzhou'
    });
  });

  it('trims whitespace from all fields', () => {
    const result = normalizeAuth({
      accountId: '  123  ',
      ak: '  ak  ',
      sk: '  sk  ',
      region: '  cn-hangzhou  '
    });
    expect(result).toEqual({
      accountId: '123',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    });
  });

  it('returns null for null input', () => {
    expect(normalizeAuth(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(normalizeAuth(undefined)).toBeNull();
  });

  it('returns null for array', () => {
    expect(normalizeAuth([1, 2, 3])).toBeNull();
  });

  it('returns null for string', () => {
    expect(normalizeAuth('not an object')).toBeNull();
  });

  it('returns null when accountId is missing', () => {
    expect(normalizeAuth({ ak: 'a', sk: 'b', region: 'c' })).toBeNull();
  });

  it('returns null when ak is missing', () => {
    expect(normalizeAuth({ accountId: 'a', sk: 'b', region: 'c' })).toBeNull();
  });

  it('returns null when sk is missing', () => {
    expect(normalizeAuth({ accountId: 'a', ak: 'b', region: 'c' })).toBeNull();
  });

  it('falls back to cn-hangzhou when region is missing', () => {
    expect(normalizeAuth({ accountId: 'a', ak: 'b', sk: 'c' })).toEqual({
      accountId: 'a',
      ak: 'b',
      sk: 'c',
      region: 'cn-hangzhou'
    });
  });

  it('returns null when accountId is number', () => {
    expect(normalizeAuth({ accountId: 123, ak: 'a', sk: 'b', region: 'c' })).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(normalizeAuth({})).toBeNull();
  });
});

describe('normalizeProject', () => {
  it('returns default for null', () => {
    const result = normalizeProject(null);
    expect(result).toEqual({ envs: {} });
  });

  it('returns default for undefined', () => {
    const result = normalizeProject(undefined);
    expect(result).toEqual({ envs: {} });
  });

  it('returns default for array', () => {
    const result = normalizeProject([1, 2, 3]);
    expect(result).toEqual({ envs: {} });
  });

  it('returns default for string', () => {
    const result = normalizeProject('hello');
    expect(result).toEqual({ envs: {} });
  });

  it('preserves valid appName', () => {
    const result = normalizeProject({ appName: 'my-app' });
    expect(result.appName).toBe('my-app');
  });

  it('trims appName', () => {
    const result = normalizeProject({ appName: '  my-app  ' });
    expect(result.appName).toBe('my-app');
  });

  it('drops empty appName', () => {
    const result = normalizeProject({ appName: '' });
    expect(result.appName).toBeUndefined();
  });

  it('drops whitespace-only appName', () => {
    const result = normalizeProject({ appName: '   ' });
    expect(result.appName).toBeUndefined();
  });

  it('drops non-string appName', () => {
    const result = normalizeProject({ appName: 123 });
    expect(result.appName).toBeUndefined();
  });

  it('preserves valid envs', () => {
    const result = normalizeProject({ envs: { FOO: 'bar', BAZ: 'qux' } });
    expect(result.envs).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('filters out non-string env values', () => {
    const result = normalizeProject({ envs: { FOO: 'bar', BAD: 123, NULL: null } });
    expect(result.envs).toEqual({ FOO: 'bar' });
  });

  it('returns empty envs when envs is not an object', () => {
    const result = normalizeProject({ envs: 'not-an-object' });
    expect(result.envs).toEqual({});
  });

  it('returns empty envs when envs is array', () => {
    const result = normalizeProject({ envs: ['a', 'b'] });
    expect(result.envs).toEqual({});
  });

  it('preserves valid network config', () => {
    const result = normalizeProject({
      network: { vpcId: 'vpc-123', vswId: 'vsw-456', sgId: 'sg-789' }
    });
    expect(result.network).toEqual({
      vpcId: 'vpc-123',
      vswId: 'vsw-456',
      sgId: 'sg-789',
      cidrBlock: undefined
    });
  });

  it('drops network when vpcId is missing', () => {
    const result = normalizeProject({ network: { vswId: 'vsw-456' } });
    expect(result.network).toBeUndefined();
  });

  it('drops network when vswId is missing', () => {
    const result = normalizeProject({ network: { vpcId: 'vpc-123' } });
    expect(result.network).toBeUndefined();
  });

  it('drops network when not an object', () => {
    const result = normalizeProject({ network: 'invalid' });
    expect(result.network).toBeUndefined();
  });

  it('preserves valid cache config', () => {
    const result = normalizeProject({
      cache: { type: 'redis', instanceId: 'r-123', host: 'localhost', port: 6379, accountName: 'admin' }
    });
    expect(result.cache).toEqual({
      type: 'redis',
      instanceId: 'r-123',
      host: 'localhost',
      port: 6379,
      accountName: 'admin'
    });
  });

  it('drops cache when type is missing', () => {
    const result = normalizeProject({ cache: { instanceId: 'r-123' } });
    expect(result.cache).toBeUndefined();
  });

  it('drops cache when instanceId is missing', () => {
    const result = normalizeProject({ cache: { type: 'redis' } });
    expect(result.cache).toBeUndefined();
  });

  it('handles cache with non-number port', () => {
    const result = normalizeProject({
      cache: { type: 'redis', instanceId: 'r-123', port: '6379' }
    });
    expect(result.cache?.port).toBeUndefined();
  });

  it('preserves tair cache metadata', () => {
    const result = normalizeProject({
      cache: { type: 'redis', instanceId: 'tk-123', vkName: 'tk-123', mode: 'tair-serverless-kv' }
    });
    expect(result.cache).toEqual({
      type: 'redis',
      instanceId: 'tk-123',
      host: undefined,
      port: undefined,
      accountName: undefined,
      vkName: 'tk-123',
      mode: 'tair-serverless-kv'
    });
  });

  it('normalizes resources and hooks fields', () => {
    const result = normalizeProject({
      resources: {
        memorySize: '512',
        timeout: 60,
        cpu: '1.5',
        instanceConcurrency: '10'
      },
      hooks: {
        preDeploy: ' npm run pre ',
        postDeploy: ' npm run post '
      }
    });
    expect(result.resources).toEqual({
      memorySize: 512,
      timeout: 60,
      cpu: 1.5,
      instanceConcurrency: 10
    });
    expect(result.hooks).toEqual({
      preDeploy: 'npm run pre',
      postDeploy: 'npm run post'
    });
  });

  it('drops invalid resources and empty hooks', () => {
    const result = normalizeProject({
      resources: {
        memorySize: 0,
        timeout: 'NaN',
        cpu: -1,
        instanceConcurrency: 'abc'
      },
      hooks: {
        preDeploy: '   ',
        postDeploy: 123
      }
    });
    expect(result.resources).toBeUndefined();
    expect(result.hooks).toBeUndefined();
  });

  it('preserves unknown top-level keys', () => {
    const result = normalizeProject({ appName: 'test', customField: 'value', envs: {} });
    expect((result as any).customField).toBe('value');
  });

  it('handles deeply nested invalid data gracefully', () => {
    const result = normalizeProject({
      network: { vpcId: 123, vswId: null },
      cache: { type: true, instanceId: [] },
      envs: { valid: 'yes', invalid: { nested: true } }
    });
    expect(result.network).toBeUndefined();
    expect(result.cache).toBeUndefined();
    expect(result.envs).toEqual({ valid: 'yes' });
  });
});
