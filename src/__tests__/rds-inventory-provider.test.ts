import { describe, expect, it, vi } from 'vitest';
import { listDatabaseAccounts, listDatabaseBackups, listDatabaseParameters, listDatabases } from '../providers/infra/inventory';
import { planDatabaseRestore } from '../providers/infra/restore-plan';

describe('RDS inventory provider', () => {
  it('projects backups and policy without download credentials', async () => {
    const client = {
      describeBackups: vi.fn(async () => ({ body: {
        totalRecordCount: '1',
        items: { backup: [{ backupId: 'b-1', backupStatus: 'Success', backupType: 'FullBackup', backupSize: 123, backupDownloadURL: 'signed-secret' }] }
      } })),
      describeBackupPolicy: vi.fn(async () => ({ body: { backupRetentionPeriod: 7, preferredBackupTime: '02:00Z-03:00Z', enablePitrProtection: true } }))
    };

    const result = await listDatabaseBackups('rm-1', { regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result.backups).toEqual([expect.objectContaining({ backupId: 'b-1', status: 'Success', sizeBytes: 123 })]);
    expect(result.policy).toMatchObject({ backupRetentionDays: 7, preferredTime: '02:00Z-03:00Z', pitrEnabled: true });
    expect(JSON.stringify(result)).not.toContain('signed-secret');
    expect(JSON.stringify(result)).not.toContain('backupDownloadURL');
  });

  it('separates running and configured parameters and applies prefix filtering', async () => {
    const client = { describeParameters: vi.fn(async () => ({ body: {
      engine: 'PostgreSQL', engineVersion: '16',
      runningParameters: { DBInstanceParameter: [{ parameterName: 'max_connections', parameterValue: '100' }, { parameterName: 'timezone', parameterValue: 'UTC' }] },
      configParameters: { DBInstanceParameter: [{ parameterName: 'max_connections', parameterValue: '200' }] }
    } })) };

    const result = await listDatabaseParameters('rm-1', { regionId: 'cn-shanghai', prefix: 'max_', limit: 20 }, client as never);

    expect(result.running).toEqual([{ name: 'max_connections', value: '100', description: undefined }]);
    expect(result.configured).toEqual([{ name: 'max_connections', value: '200', description: undefined }]);
  });

  it('paginates account summaries and retains database privileges', async () => {
    const client = { describeAccounts: vi.fn(async () => ({ body: {
      totalRecordCount: 1,
      accounts: { DBInstanceAccount: [{ accountName: 'app', accountStatus: 'Available', accountType: 'Normal', databasePrivileges: { databasePrivilege: [{ DBName: 'appdb', accountPrivilege: 'ReadWrite' }] } }] }
    } })) };

    const result = await listDatabaseAccounts('rm-1', { regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result.accounts).toEqual([expect.objectContaining({ name: 'app', privileges: [{ database: 'appdb', privilege: 'ReadWrite', detail: undefined }] })]);
  });

  it('projects database metadata without untyped advanced/runtime properties', async () => {
    const client = { describeDatabases: vi.fn(async () => ({ body: {
      databases: { database: [{ DBName: 'appdb', DBStatus: 'Running', characterSetName: 'UTF8', advancedInfo: { advancedDbProperty: [{ password: 'hidden' }] } }] }
    } })) };

    const result = await listDatabases('rm-1', { regionId: 'cn-shanghai', limit: 20 }, client as never);

    expect(result.databases).toEqual([expect.objectContaining({ name: 'appdb', status: 'Running', characterSet: 'UTF8' })]);
    expect(JSON.stringify(result)).not.toContain('hidden');
    expect(JSON.stringify(result)).not.toContain('advancedInfo');
  });

  it('inspects restore sources without exposing backup download credentials or mutating', async () => {
    const client = {
      describeDBInstanceAttribute: vi.fn(async () => ({ body: { items: { DBInstanceAttribute: [{
        DBInstanceId: 'rm-1', engine: 'MySQL', engineVersion: '8.0', DBInstanceStatus: 'Running',
        DBInstanceClass: 'mysql.n2.small.2c', DBInstanceStorage: 40, DBInstanceStorageType: 'cloud_essd',
        zoneId: 'cn-shanghai-e', vpcId: 'vpc-1', vSwitchId: 'vsw-1'
      }] } } })),
      describeBackups: vi.fn(async () => ({ body: { totalRecordCount: 45, items: { backup: [{
        backupId: 'b-1', backupStatus: 'Success', backupType: 'FullBackup', backupDownloadURL: 'signed-secret'
      }] } } })),
      describeLocalAvailableRecoveryTime: vi.fn(async () => ({ body: {
        recoveryBeginTime: '2026-09-01T00:00:00Z', recoveryEndTime: '2026-09-05T00:00:00Z'
      } }))
    };

    const result = await planDatabaseRestore('rm-1', { regionId: 'cn-shanghai' }, client as never);

    expect(result.mode).toBe('inspect');
    expect(result.validation.blockers).toContainEqual(expect.objectContaining({ code: 'RESTORE_SOURCE_REQUIRED' }));
    expect(result.execution).toMatchObject({ supported: false, performed: false });
    expect(result.availability).toMatchObject({ backupTotalCount: 45, backupsTruncated: true });
    expect(JSON.stringify(result)).not.toContain('signed-secret');
    expect(JSON.stringify(result)).not.toContain('backupDownloadURL');
  });

  it('validates a successful backup and builds a non-executed CloneDBInstance draft', async () => {
    const client = {
      describeDBInstanceAttribute: vi.fn(async () => ({ body: { items: { DBInstanceAttribute: [{ DBInstanceId: 'rm-1', engine: 'PostgreSQL', DBInstanceStatus: 'Running' }] } } })),
      describeBackups: vi.fn(async () => ({ body: { items: { backup: [{ backupId: 'b-1', backupStatus: 'Success' }] } } })),
      describeLocalAvailableRecoveryTime: vi.fn(async () => ({ body: { recoveryBeginTime: '2026-09-01T00:00:00Z', recoveryEndTime: '2026-09-05T00:00:00Z' } }))
    };

    const result = await planDatabaseRestore('rm-1', { regionId: 'cn-shanghai', backupId: 'b-1', payType: 'Postpaid' }, client as never);

    expect(result.validation).toMatchObject({ valid: true, blockers: [] });
    expect(result.requestDraft).toEqual({ DBInstanceId: 'rm-1', RegionId: 'cn-shanghai', PayType: 'Postpaid', BackupId: 'b-1' });
    expect(client.describeBackups).toHaveBeenCalledWith(expect.objectContaining({ backupId: 'b-1' }));
  });

  it('blocks a point-in-time request outside the available recovery window', async () => {
    const client = {
      describeDBInstanceAttribute: vi.fn(async () => ({ body: { items: { DBInstanceAttribute: [{ DBInstanceId: 'rm-1', engine: 'MySQL', DBInstanceStatus: 'Running' }] } } })),
      describeBackups: vi.fn(async () => ({ body: { items: { backup: [] } } })),
      describeLocalAvailableRecoveryTime: vi.fn(async () => ({ body: { recoveryBeginTime: '2026-09-01T00:00:00Z', recoveryEndTime: '2026-09-05T00:00:00Z' } }))
    };

    const result = await planDatabaseRestore('rm-1', { regionId: 'cn-shanghai', restoreTime: '2026-08-31T23:59:59Z' }, client as never);

    expect(result.validation.valid).toBe(false);
    expect(result.validation.blockers).toContainEqual(expect.objectContaining({ code: 'RESTORE_TIME_OUT_OF_RANGE' }));
  });

  it('rejects mutually exclusive restore sources before cloud reads', async () => {
    await expect(planDatabaseRestore('rm-1', { backupId: 'b-1', restoreTime: '2026-09-01T00:00:00Z' }, {} as never))
      .rejects.toThrow('backup-id 与 restore-time 不能同时使用');
  });

  it('rethrows PITR read failures when a restore time was explicitly requested', async () => {
    const denied = Object.assign(new Error('forbidden'), { code: 'Forbidden.RAM' });
    const client = {
      describeDBInstanceAttribute: vi.fn(async () => ({ body: { items: { DBInstanceAttribute: [{ DBInstanceId: 'rm-1', engine: 'MySQL', DBInstanceStatus: 'Running' }] } } })),
      describeBackups: vi.fn(async () => ({ body: { items: { backup: [] } } })),
      describeLocalAvailableRecoveryTime: vi.fn(async () => { throw denied; })
    };

    await expect(planDatabaseRestore('rm-1', { restoreTime: '2026-09-01T00:00:00Z' }, client as never))
      .rejects.toBe(denied);
  });
});
