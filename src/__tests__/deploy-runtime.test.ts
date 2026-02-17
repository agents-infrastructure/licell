import { describe, expect, it } from 'vitest';
import { parseDeployRuntimeOption } from '../utils/deploy-runtime';

describe('parseDeployRuntimeOption', () => {
  it('returns empty selection when runtime is omitted', () => {
    expect(parseDeployRuntimeOption(undefined)).toEqual({});
    expect(parseDeployRuntimeOption('   ')).toEqual({});
  });

  it('parses api runtimes', () => {
    expect(parseDeployRuntimeOption('python3.12')).toEqual({
      deployTypeHint: 'api',
      runtime: 'python3.12'
    });
    expect(parseDeployRuntimeOption('Docker')).toEqual({
      deployTypeHint: 'api',
      runtime: 'docker'
    });
  });

  it('parses static runtime aliases', () => {
    expect(parseDeployRuntimeOption('static')).toEqual({ deployTypeHint: 'static' });
    expect(parseDeployRuntimeOption('statis')).toEqual({ deployTypeHint: 'static' });
    expect(parseDeployRuntimeOption('oss')).toEqual({ deployTypeHint: 'static' });
    expect(parseDeployRuntimeOption('static-site')).toEqual({ deployTypeHint: 'static' });
  });

  it('rejects unsupported runtime values', () => {
    expect(() => parseDeployRuntimeOption('python')).toThrow('函数运行时仅支持');
  });
});
