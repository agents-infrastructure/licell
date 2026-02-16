import { describe, it, expect } from 'vitest';
import { isConflictError, isInstanceClassError, ignoreConflict, formatErrorMessage } from '../utils/errors';

describe('isConflictError', () => {
  it('returns true for AlreadyExists code', () => {
    expect(isConflictError({ code: 'FunctionAlreadyExists' })).toBe(true);
  });

  it('returns true for Conflict code', () => {
    expect(isConflictError({ code: 'Conflict' })).toBe(true);
  });

  it('returns true for Duplicate in message', () => {
    expect(isConflictError({ message: 'DomainRecordDuplicate' })).toBe(true);
  });

  it('returns true for Exist in code', () => {
    expect(isConflictError({ code: 'BucketAlreadyExists' })).toBe(true);
  });

  it('returns false for unrelated error', () => {
    expect(isConflictError({ code: 'InvalidParameter', message: 'bad input' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isConflictError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isConflictError(undefined)).toBe(false);
  });

  it('returns false for string', () => {
    expect(isConflictError('AlreadyExists')).toBe(false);
  });

  it('returns false for number', () => {
    expect(isConflictError(409)).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(isConflictError({})).toBe(false);
  });

  it('handles error with only message', () => {
    expect(isConflictError({ message: 'Resource AlreadyExists' })).toBe(true);
  });

  it('handles error with only code', () => {
    expect(isConflictError({ code: 'DomainRecordDuplicate' })).toBe(true);
  });
});

describe('isInstanceClassError', () => {
  it('returns true for SoldOut', () => {
    expect(isInstanceClassError({ code: 'SoldOut' })).toBe(true);
  });

  it('returns true for OutOfStock', () => {
    expect(isInstanceClassError({ message: 'OutOfStock in this zone' })).toBe(true);
  });

  it('returns true for InstanceClass in message', () => {
    expect(isInstanceClassError({ message: 'Invalid InstanceClass' })).toBe(true);
  });

  it('returns true for Unsupported', () => {
    expect(isInstanceClassError({ code: 'Unsupported' })).toBe(true);
  });

  it('returns false for unrelated error', () => {
    expect(isInstanceClassError({ code: 'AuthFailed' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isInstanceClassError(null)).toBe(false);
  });

  it('returns false for primitive', () => {
    expect(isInstanceClassError(42)).toBe(false);
  });
});

describe('ignoreConflict', () => {
  it('does nothing when task succeeds', async () => {
    let called = false;
    await ignoreConflict(async () => { called = true; });
    expect(called).toBe(true);
  });

  it('ignores conflict errors', async () => {
    await expect(
      ignoreConflict(async () => { throw { code: 'AlreadyExists' }; })
    ).resolves.toBeUndefined();
  });

  it('rethrows non-conflict errors', async () => {
    await expect(
      ignoreConflict(async () => { throw new Error('NetworkError'); })
    ).rejects.toThrow('NetworkError');
  });
});

describe('formatErrorMessage', () => {
  it('extracts message from Error object', () => {
    expect(formatErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('extracts message from plain object', () => {
    expect(formatErrorMessage({ message: 'custom error' })).toBe('custom error');
  });

  it('converts string to string', () => {
    expect(formatErrorMessage('raw string')).toBe('raw string');
  });

  it('converts number to string', () => {
    expect(formatErrorMessage(42)).toBe('42');
  });

  it('converts null to string', () => {
    expect(formatErrorMessage(null)).toBe('null');
  });

  it('converts undefined to string', () => {
    expect(formatErrorMessage(undefined)).toBe('undefined');
  });

  it('handles object with non-string message', () => {
    expect(formatErrorMessage({ message: 123 })).toBe('123');
  });
});
