import { describe, expect, it } from 'vitest';
import { AUTH_CAPABILITY_LABELS, detectAuthIssue, resolveAuthCapabilityActions } from '../utils/auth-recovery';

const ECS_MUTATING_ACTIONS = [
  'ecs:StartInstance',
  'ecs:StopInstance',
  'ecs:RebootInstance',
  'ecs:DeleteInstance',
  'ecs:RunInstances'
];

function withCode(message: string, code?: string) {
  const err = new Error(message);
  if (code) (err as unknown as { code: string }).code = code;
  return err;
}

describe('detectAuthIssue', () => {
  it('detects missing auth', () => {
    expect(detectAuthIssue(withCode('未登录，请先执行 `licell login`'))).toBe('missing_auth');
  });

  it('detects access denied', () => {
    expect(detectAuthIssue(withCode('forbidden', 'AccessDenied'))).toBe('access_denied');
  });

  it('detects invalid credentials', () => {
    expect(detectAuthIssue(withCode('SignatureDoesNotMatch', 'InvalidAccessKeyId.NotFound'))).toBe('invalid_credentials');
  });

  it('returns unknown for unrelated errors', () => {
    expect(detectAuthIssue(withCode('something else', 'InvalidParameter'))).toBe('unknown');
  });
});

describe('resolveAuthCapabilityActions', () => {
  it('returns sorted unique action hints for capabilities', () => {
    const actions = resolveAuthCapabilityActions(['dns', 'fc', 'dns']);
    expect(actions).toEqual([
      'alidns:AddDomainRecord',
      'alidns:DeleteDomainRecord',
      'alidns:DescribeDomainRecords',
      'fc:GetFunction',
      'fc:ListFunctions',
      'fc:UpdateFunction'
    ]);
  });

  it('exposes ECS read-only action hints only', () => {
    expect(AUTH_CAPABILITY_LABELS.ecs).toBe('ECS');
    const actions = resolveAuthCapabilityActions(['ecs']);
    expect(actions).toEqual([
      'ecs:DescribeInstanceAttribute',
      'ecs:DescribeInstances'
    ]);
    for (const action of ECS_MUTATING_ACTIONS) {
      expect(actions).not.toContain(action);
    }
  });
});
