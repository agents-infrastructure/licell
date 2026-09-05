import { describe, expect, it, vi } from 'vitest';
import { listDatabaseAccounts, listDatabaseBackups, listDatabaseParameters, listDatabases } from '../providers/infra/inventory';

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
});
