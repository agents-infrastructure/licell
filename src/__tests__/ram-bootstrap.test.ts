import { describe, expect, it } from 'vitest';
import {
  LICELL_POLICY_ACTIONS,
  buildLicellPolicyDocument,
  normalizeRamPolicyName,
  normalizeRamUserName
} from '../providers/ram';
import { resolveAuthCapabilityActions, type AuthCapability } from '../utils/auth-recovery';

describe('ram bootstrap helpers', () => {
  it('normalizes default user/policy names', () => {
    expect(normalizeRamUserName()).toBe('licell-operator');
    expect(normalizeRamPolicyName()).toBe('LicellOperatorPolicy');
  });

  it('rejects invalid user/policy names', () => {
    expect(normalizeRamUserName('')).toBe('licell-operator');
    expect(() => normalizeRamUserName('bad name')).toThrow('bootstrap RAM 用户名不合法');
    expect(() => normalizeRamPolicyName('bad name')).toThrow('bootstrap RAM 策略名不合法');
    expect(() => normalizeRamPolicyName('policy_with_underscore')).toThrow('bootstrap RAM 策略名不合法');
  });

  it('builds policy document with required actions', () => {
    const doc = JSON.parse(buildLicellPolicyDocument()) as {
      Version: string;
      Statement: Array<{ Effect: string; Action: string[]; Resource: string }>;
    };
    expect(doc.Version).toBe('1');
    expect(doc.Statement).toHaveLength(1);
    expect(doc.Statement[0].Effect).toBe('Allow');
    expect(doc.Statement[0].Resource).toBe('*');
    expect(doc.Statement[0].Action).toEqual([...LICELL_POLICY_ACTIONS].sort());
    expect(doc.Statement[0].Action).toEqual(expect.arrayContaining([
      'fc:DeleteFunction',
      'fc:DeleteTrigger',
      'fc:DeleteAlias',
      'vpc:DescribeZones',
      'vpc:CreateVpc'
    ]));
  });

  it('covers all auth capability action hints in licell policy actions', () => {
    const capabilities: AuthCapability[] = ['fc', 'dns', 'oss', 'rds', 'redis', 'cdn', 'vpc', 'cr', 'logs'];
    const hintedActions = resolveAuthCapabilityActions(capabilities);
    for (const action of hintedActions) {
      expect(LICELL_POLICY_ACTIONS).toContain(action);
    }
  });
});
