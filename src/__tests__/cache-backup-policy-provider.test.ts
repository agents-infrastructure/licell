import { describe, expect, it, vi } from 'vitest';
import {
  applyCacheBackupPolicy,
  normalizeCacheBackupPolicyDesiredState,
  planCacheBackupPolicy,
  type CacheBackupPolicyClient
} from '../providers/redis/backup-policy';

const auth = {
  accountId: 'account',
  ak: 'test-ak',
  sk: 'test-sk',
  region: 'cn-shanghai'
};

function policyResponse(overrides: Record<string, unknown> = {}) {
  return {
    body: {
      backupRetentionPeriod: '7',
      preferredBackupPeriod: 'Monday,Wednesday,Friday',
      preferredBackupTime: '02:00Z-03:00Z',
      enableBackupLog: 0,
      ...overrides
    }
  };
}

function createClient(
  describeBackupPolicy: CacheBackupPolicyClient['describeBackupPolicy'],
  modifyBackupPolicy: CacheBackupPolicyClient['modifyBackupPolicy'] = vi.fn(async () => ({
    body: { requestId: 'request-a' }
  }))
): CacheBackupPolicyClient {
  return { describeBackupPolicy, modifyBackupPolicy };
}

describe('Redis/Tair backup policy desired-state provider', () => {
  it('normalizes supported fields and rejects invalid desired state', () => {
    expect(normalizeCacheBackupPolicyDesiredState({
      preferredPeriod: ['Friday', 'Monday', 'Friday'],
      preferredTime: ' 05:00Z-06:00Z ',
      retentionDays: 30,
      incrementalBackupEnabled: true
    })).toEqual({
      preferredPeriod: 'Monday,Friday',
      preferredTime: '05:00Z-06:00Z',
      retentionDays: 30,
      incrementalBackupEnabled: true
    });
    expect(() => normalizeCacheBackupPolicyDesiredState({})).toThrow(/至少需要/);
    expect(() => normalizeCacheBackupPolicyDesiredState({ day: 'Monday' })).toThrow(/未知字段/);
    expect(() => normalizeCacheBackupPolicyDesiredState({ preferredPeriod: ['Funday'] })).toThrow(/星期/);
    expect(() => normalizeCacheBackupPolicyDesiredState({ preferredTime: '02:30Z-03:30Z' })).toThrow(/整点/);
    expect(() => normalizeCacheBackupPolicyDesiredState({ retentionDays: 6 })).toThrow(/7 到 730/);
    expect(() => normalizeCacheBackupPolicyDesiredState({ incrementalBackupEnabled: 1 })).toThrow(/boolean/);
  });

  it('plans field-level changes without mutation and preserves omitted fields', async () => {
    const modifyBackupPolicy = vi.fn(async () => ({ body: {} }));
    const client = createClient(vi.fn(async () => policyResponse()), modifyBackupPolicy);

    const plan = await planCacheBackupPolicy(
      'r-1',
      { preferredPeriod: ['Monday', 'Friday'], retentionDays: 30 },
      {},
      { auth, client }
    );

    expect(plan).toMatchObject({
      regionId: 'cn-shanghai',
      instanceId: 'r-1',
      current: {
        preferredPeriod: 'Monday,Wednesday,Friday',
        preferredTime: '02:00Z-03:00Z',
        retentionDays: 7,
        incrementalBackupEnabled: false
      },
      after: {
        preferredPeriod: 'Monday,Friday',
        preferredTime: '02:00Z-03:00Z',
        retentionDays: 30,
        incrementalBackupEnabled: false
      },
      changes: [
        { field: 'preferredPeriod', action: 'set', before: 'Monday,Wednesday,Friday', after: 'Monday,Friday' },
        { field: 'retentionDays', action: 'set', before: 7, after: 30 }
      ],
      changeCount: 2,
      willExecute: false
    });
    expect(modifyBackupPolicy).not.toHaveBeenCalled();
  });

  it('applies the merged policy once and verifies the read-back state', async () => {
    const describeBackupPolicy = vi.fn()
      .mockResolvedValueOnce(policyResponse())
      .mockResolvedValueOnce(policyResponse({
        backupRetentionPeriod: '30',
        preferredBackupPeriod: 'Monday,Friday',
        preferredBackupTime: '05:00Z-06:00Z',
        enableBackupLog: 1
      }));
    const modifyBackupPolicy = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client = createClient(describeBackupPolicy, modifyBackupPolicy);

    const result = await applyCacheBackupPolicy(
      'r-1',
      {
        preferredPeriod: 'Friday,Monday',
        preferredTime: '05:00Z-06:00Z',
        retentionDays: 30,
        incrementalBackupEnabled: true
      },
      {},
      { auth, client }
    );

    expect(modifyBackupPolicy).toHaveBeenCalledTimes(1);
    expect(modifyBackupPolicy).toHaveBeenCalledWith(expect.objectContaining({
      instanceId: 'r-1',
      preferredBackupPeriod: 'Monday,Friday',
      preferredBackupTime: '05:00Z-06:00Z',
      backupRetentionPeriod: 30,
      enableBackupLog: 1
    }));
    expect(result).toMatchObject({
      execution: { performed: true, requestId: 'request-a' },
      verify: {
        performed: true,
        matched: true,
        policy: {
          preferredPeriod: 'Monday,Friday',
          preferredTime: '05:00Z-06:00Z',
          retentionDays: 30,
          incrementalBackupEnabled: true
        }
      }
    });
  });

  it('omits optional API fields that were not present in desired state', async () => {
    const describeBackupPolicy = vi.fn()
      .mockResolvedValueOnce(policyResponse())
      .mockResolvedValueOnce(policyResponse({ backupRetentionPeriod: '30' }));
    const modifyBackupPolicy = vi.fn(async (_request: unknown) => ({ body: { requestId: 'request-a' } }));
    const client = createClient(describeBackupPolicy, modifyBackupPolicy);

    await applyCacheBackupPolicy(
      'r-1',
      { retentionDays: 30 },
      {},
      { auth, client }
    );

    expect(modifyBackupPolicy).toHaveBeenCalledWith(expect.objectContaining({
      instanceId: 'r-1',
      preferredBackupPeriod: 'Monday,Wednesday,Friday',
      preferredBackupTime: '02:00Z-03:00Z',
      backupRetentionPeriod: 30
    }));
    expect(modifyBackupPolicy.mock.calls[0]?.[0]).not.toHaveProperty('enableBackupLog');
  });

  it('does not call ModifyBackupPolicy when desired state already matches', async () => {
    const modifyBackupPolicy = vi.fn(async () => ({ body: {} }));
    const client = createClient(vi.fn(async () => policyResponse()), modifyBackupPolicy);

    const result = await applyCacheBackupPolicy(
      'r-1',
      { preferredPeriod: ['Friday', 'Wednesday', 'Monday'] },
      {},
      { auth, client }
    );

    expect(modifyBackupPolicy).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      plan: { changeCount: 0, willExecute: false },
      execution: { performed: false },
      verify: { performed: true, matched: true }
    });
  });

  it('does not issue a second write when read-back verification fails', async () => {
    const denied = Object.assign(new Error('not authorized to describe backup policy'), { code: 'Forbidden.RAM' });
    const describeBackupPolicy = vi.fn()
      .mockResolvedValueOnce(policyResponse())
      .mockRejectedValueOnce(denied);
    const modifyBackupPolicy = vi.fn(async () => ({ body: { requestId: 'request-a' } }));
    const client = createClient(describeBackupPolicy, modifyBackupPolicy);

    await expect(applyCacheBackupPolicy(
      'r-1',
      { retentionDays: 30 },
      {},
      { auth, client }
    )).rejects.toThrow(/已被接受，但读回验证未完成/);

    expect(modifyBackupPolicy).toHaveBeenCalledTimes(1);
  });
});
