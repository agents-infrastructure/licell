import { describe, expect, it, vi } from 'vitest';
import { listCacheAccounts, listCacheBackups, listCacheParameters, listCacheTopology } from '../providers/redis/inventory';

describe('Redis/Tair inventory provider', () => {
  it('projects backups and policy without download URLs', async () => {
    const client = {
      describeBackups: vi.fn(async () => ({ body: {
        totalCount: 1,
        backups: { backup: [{ backupId: 12, backupStatus: 'Success', backupType: 'FullBackup', backupSize: 2048, backupDownloadURL: 'signed-secret' }] }
      } })),
      describeBackupPolicy: vi.fn(async () => ({ body: { backupRetentionPeriod: '7', preferredBackupTime: '02:00Z-03:00Z', enableBackupLog: 1 } }))
    };

    const result = await listCacheBackups('r-1', { regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result.backups).toEqual([expect.objectContaining({ backupId: 12, status: 'Success', sizeBytes: 2048 })]);
    expect(result.policy).toMatchObject({ retentionDays: '7', preferredTime: '02:00Z-03:00Z', incrementalBackupEnabled: true });
    expect(JSON.stringify(result)).not.toContain('signed-secret');
    expect(JSON.stringify(result)).not.toContain('DownloadURL');
  });

  it('uses classic parameters and applies prefix filtering', async () => {
    const client = { describeParameters: vi.fn(async () => ({ body: {
      engine: 'redis', engineVersion: '7.0',
      runningParameters: { parameter: [{ parameterName: 'maxmemory-policy', parameterValue: 'volatile-lru', forceRestart: 'False' }, { parameterName: 'timeout', parameterValue: '0' }] },
      configParameters: { parameter: [{ parameterName: 'maxmemory-policy', parameterValue: 'allkeys-lru', modifiableStatus: true }] }
    } })) };

    const result = await listCacheParameters('r-1', { regionId: 'cn-shanghai', prefix: 'max', limit: 20 }, client as never);

    expect(result.source).toBe('DescribeParameters');
    expect(result.running).toEqual([expect.objectContaining({ name: 'maxmemory-policy', value: 'volatile-lru', restartRequired: false })]);
    expect(result.configured).toEqual([expect.objectContaining({ name: 'maxmemory-policy', value: 'allkeys-lru', modifiable: true })]);
  });

  it('falls back to structured cloud-native config', async () => {
    const classicError = new Error('not supported');
    const client = {
      describeParameters: vi.fn(async () => { throw classicError; }),
      describeInstanceConfig: vi.fn(async () => ({ body: { config: JSON.stringify({ EvictionPolicy: 'volatile-lru', timeout: 0 }) } }))
    };

    const result = await listCacheParameters('tk-1', { regionId: 'cn-shanghai', prefix: 'eviction', limit: 20 }, client as never);

    expect(result.source).toBe('DescribeInstanceConfig');
    expect(result.running).toEqual([{ name: 'EvictionPolicy', value: 'volatile-lru' }]);
  });

  it('projects accounts and topology without user or resource-group identifiers', async () => {
    const accountsClient = { describeAccounts: vi.fn(async () => ({ body: { accounts: { account: [{ accountName: 'app', accountStatus: 'Available', accountType: 'Normal', databasePrivileges: { databasePrivilege: [{ accountPrivilege: 'RoleReadWrite' }] } }] } } })) };
    const topologyClient = { describeClusterMemberInfo: vi.fn(async () => ({ body: { clusterChildren: [{ name: 'r-1-db-0', service: 'redis', serviceVersion: '7.0', classCode: 'redis.shard.small.ce', userId: 'secret-user', resourceGroupName: 'internal' }] } })) };

    const accounts = await listCacheAccounts('r-1', { regionId: 'cn-shanghai', limit: 20 }, accountsClient as never);
    const topology = await listCacheTopology('r-1', { regionId: 'cn-shanghai', limit: 20 }, topologyClient as never);

    expect(accounts.accounts).toEqual([expect.objectContaining({ name: 'app', privileges: ['RoleReadWrite'] })]);
    expect(topology.members).toEqual([expect.objectContaining({ name: 'r-1-db-0', service: 'redis', version: '7.0' })]);
    expect(JSON.stringify(topology)).not.toContain('secret-user');
    expect(JSON.stringify(topology)).not.toContain('resourceGroup');
  });
});
