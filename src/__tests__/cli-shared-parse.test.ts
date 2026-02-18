import { describe, expect, it } from 'vitest';
import { parseOptionalPositiveInt, parseOptionalPositiveNumber } from '../utils/cli-shared';

describe('parseOptionalPositiveNumber', () => {
  it('returns undefined for empty input', () => {
    expect(parseOptionalPositiveNumber(undefined, '--vcpu')).toBeUndefined();
    expect(parseOptionalPositiveNumber('  ', '--vcpu')).toBeUndefined();
  });

  it('parses positive number values', () => {
    expect(parseOptionalPositiveNumber('0.5', '--vcpu')).toBe(0.5);
    expect(parseOptionalPositiveNumber('2', '--vcpu')).toBe(2);
  });

  it('throws when value is invalid', () => {
    expect(() => parseOptionalPositiveNumber('0', '--vcpu')).toThrow('--vcpu 必须是正数');
    expect(() => parseOptionalPositiveNumber('-1', '--vcpu')).toThrow('--vcpu 必须是正数');
    expect(() => parseOptionalPositiveNumber('abc', '--vcpu')).toThrow('--vcpu 必须是正数');
  });
});

describe('parseOptionalPositiveInt', () => {
  it('throws when value is non-integer', () => {
    expect(() => parseOptionalPositiveInt('1.2', '--instance-concurrency')).toThrow('--instance-concurrency 必须是正整数');
  });
});
