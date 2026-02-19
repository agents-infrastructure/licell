import { describe, it, expect } from 'vitest';
import {
  isConflictError,
  isNotFoundError,
  isTransientError,
  isInstanceClassError,
  isAccessDeniedError,
  isAuthCredentialInvalidError,
  isInvalidDomainNameError,
  isRoleMissingError,
  isAlreadyExistsRoleError,
  isCidrConflictError
} from '../utils/alicloud-error';

function makeError(code: string, message: string) {
  const err = new Error(message);
  (err as unknown as { code: string }).code = code;
  return err;
}

describe('alicloud-error unified error classification', () => {
  describe('isConflictError', () => {
    it('detects AlreadyExists code', () => {
      expect(isConflictError(makeError('AlreadyExists', ''))).toBe(true);
    });
    it('detects Conflict in message', () => {
      expect(isConflictError(makeError('', 'Resource Conflict'))).toBe(true);
    });
    it('detects DomainRecordDuplicate', () => {
      expect(isConflictError(makeError('DomainRecordDuplicate', ''))).toBe(true);
    });
    it('returns false for unrelated error', () => {
      expect(isConflictError(makeError('NotFound', 'not found'))).toBe(false);
    });
    it('does not misclassify EntityNotExist as conflict', () => {
      expect(isConflictError(makeError('EntityNotExist.User', 'user not exist'))).toBe(false);
    });
    it('handles null/undefined', () => {
      expect(isConflictError(null)).toBe(false);
      expect(isConflictError(undefined)).toBe(false);
    });
  });

  describe('isNotFoundError', () => {
    it('detects EntityNotExist code', () => {
      expect(isNotFoundError(makeError('EntityNotExist.User', ''))).toBe(true);
    });
    it('detects 404 in message', () => {
      expect(isNotFoundError(makeError('', 'HTTP 404'))).toBe(true);
    });
    it('detects "not exist" in message', () => {
      expect(isNotFoundError(makeError('', 'The user does not exist'))).toBe(true);
    });
  });

  describe('isTransientError', () => {
    it('detects throttling', () => {
      expect(isTransientError(makeError('Throttling', ''))).toBe(true);
    });
    it('detects connection timeout', () => {
      expect(isTransientError(makeError('', 'ConnectTimeout'))).toBe(true);
    });
    it('detects ECONNRESET', () => {
      expect(isTransientError(makeError('', 'ECONNRESET'))).toBe(true);
    });
    it('returns false for permanent error', () => {
      expect(isTransientError(makeError('InvalidParameter', 'bad param'))).toBe(false);
    });
  });

  describe('isAccessDeniedError', () => {
    it('detects AccessDenied', () => {
      expect(isAccessDeniedError(makeError('AccessDenied', ''))).toBe(true);
    });
    it('detects Forbidden', () => {
      expect(isAccessDeniedError(makeError('', 'Forbidden'))).toBe(true);
    });
  });

  describe('isAuthCredentialInvalidError', () => {
    it('detects invalid access key', () => {
      expect(isAuthCredentialInvalidError(makeError('InvalidAccessKeyId.NotFound', ''))).toBe(true);
    });
    it('detects signature mismatch', () => {
      expect(isAuthCredentialInvalidError(makeError('', 'SignatureDoesNotMatch'))).toBe(true);
    });
    it('returns false for access denied', () => {
      expect(isAuthCredentialInvalidError(makeError('AccessDenied', 'forbidden'))).toBe(false);
    });
  });

  describe('isRoleMissingError', () => {
    it('detects ServiceLinkedRole.NotExist', () => {
      expect(isRoleMissingError(makeError('ServiceLinkedRole.NotExist', ''))).toBe(true);
    });
  });

  describe('isCidrConflictError', () => {
    it('detects CIDR conflict', () => {
      expect(isCidrConflictError(makeError('', 'CIDR block conflict with existing'))).toBe(true);
    });
    it('detects CIDR overlap', () => {
      expect(isCidrConflictError(makeError('', 'CIDR overlap detected'))).toBe(true);
    });
    it('returns false for non-CIDR error', () => {
      expect(isCidrConflictError(makeError('', 'some other conflict'))).toBe(false);
    });
  });
});
