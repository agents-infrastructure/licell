import { describe, expect, it } from 'vitest';
import {
  LICELL_POLICY_ACTIONS,
  buildLicellPolicyDocument,
  normalizeRamPolicyName,
  normalizeRamUserName
} from '../providers/ram';
import { resolveAuthCapabilityActions, type AuthCapability } from '../utils/auth-recovery';

const ECS_LIFECYCLE_ALLOWED_ACTIONS = [
  'ecs:StartInstance',
  'ecs:RebootInstance',
  'ecs:StopInstance',
  'ecs:DeleteInstance'
];

const ECS_LIFECYCLE_FORBIDDEN_ACTIONS = [
  'ecs:RunInstances'
];

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
      'vpc:CreateVpc',
      'log:CreateProject',
      'log:CreateLogStore',
      'log:CreateIndex',
      'log:ListProject',
      'log:ListLogStores',
      'log:GetLogs',
      'rds:DescribeDBInstanceAttribute',
      'rds:DescribeDBInstanceNetInfo',
      'rds:DescribeDatabases',
      'rds:DescribeAccounts',
      'rds:DescribeBackups',
      'rds:DescribeBackupPolicy',
      'rds:DescribeParameters',
      'rds:DescribeDBInstanceIPArrayList',
      'rds:DescribeSecurityGroupConfiguration',
      'ecs:DescribeSecurityGroups',
      'ecs:CreateSecurityGroup',
      'ecs:DescribeInstanceAttribute',
      'ecs:DescribeInstances',
      'ecs:DescribeDisks',
      'ecs:StartInstance',
      'ecs:RebootInstance',
      'ecs:StopInstance',
      'ecs:DeleteInstance',
      'kvstore:DescribeBackups',
      'kvstore:DescribeBackupPolicy',
      'kvstore:DescribeParameters',
      'kvstore:DescribeInstanceConfig',
      'kvstore:DescribeClusterMemberInfo',
      'cr:ListNamespace',
      'cr:ListRepository',
      'cr:ListRepoTag'
    ]));
    for (const action of ECS_LIFECYCLE_ALLOWED_ACTIONS) {
      expect(doc.Statement[0].Action).toContain(action);
      expect(LICELL_POLICY_ACTIONS).toContain(action);
    }
    for (const action of ECS_LIFECYCLE_FORBIDDEN_ACTIONS) {
      expect(doc.Statement[0].Action).not.toContain(action);
    }
    for (const action of ECS_LIFECYCLE_FORBIDDEN_ACTIONS) {
      expect(LICELL_POLICY_ACTIONS).not.toContain(action);
    }
  });

  it('covers all auth capability action hints in licell policy actions', () => {
    const capabilities: AuthCapability[] = ['fc', 'dns', 'oss', 'rds', 'redis', 'cdn', 'vpc', 'cr', 'logs', 'ecs'];
    const hintedActions = resolveAuthCapabilityActions(capabilities);
    for (const action of hintedActions) {
      expect(LICELL_POLICY_ACTIONS).toContain(action);
    }
  });
});
