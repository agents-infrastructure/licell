import { describe, expect, it } from 'vitest';
import { DEFAULT_FC_RUNTIME, getSupportedFcRuntimes, normalizeFcRuntime } from '../providers/fc';

describe('fc runtime normalize', () => {
  it('supports all configured runtimes', () => {
    for (const runtime of getSupportedFcRuntimes()) {
      expect(normalizeFcRuntime(runtime)).toBe(runtime);
    }
  });

  it('normalizes case and whitespace', () => {
    expect(normalizeFcRuntime(' PYTHON3.13 ')).toBe('python3.13');
  });

  it('rejects unsupported runtime', () => {
    expect(() => normalizeFcRuntime('python3.11')).toThrow('函数运行时仅支持');
  });

  it('keeps default runtime stable', () => {
    expect(DEFAULT_FC_RUNTIME).toBe('nodejs20');
  });
});
