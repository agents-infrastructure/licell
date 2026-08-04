import { beforeEach, describe, expect, it, vi } from 'vitest';

const { client, createRdsClientMock } = vi.hoisted(() => {
  const client = {
    describeDBInstanceAttribute: vi.fn(),
    describeDBInstanceNetInfo: vi.fn(),
    describeDatabases: vi.fn(),
    describeAccounts: vi.fn(),
    describeDBInstanceIPArrayList: vi.fn(),
    describeSecurityGroupConfiguration: vi.fn()
  };
  return {
    client,
    createRdsClientMock: vi.fn()
  };
});

vi.mock('../providers/infra/client', () => ({
  createRdsClient: createRdsClientMock
}));

import { getDatabaseInstanceDetail } from '../providers/infra/query';

describe('RDS instance detail query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createRdsClientMock.mockReturnValue({
      auth: { region: 'cn-hangzhou' },
      regionId: 'cn-shanghai',
      client
    });
    client.describeDBInstanceAttribute.mockResolvedValue({
      body: {
        items: {
          DBInstanceAttribute: [{
            DBInstanceId: 'pgm-demo',
            DBInstanceDescription: 'demo postgres',
            regionId: 'cn-shanghai',
            zoneId: 'cn-shanghai-m',
            slaveZones: { slaveZone: [{ zoneId: 'cn-shanghai-n' }] },
            vpcId: 'vpc-demo',
            vSwitchId: 'vsw-demo',
            instanceNetworkType: 'VPC',
            connectionMode: 'Standard',
            engine: 'PostgreSQL',
            engineVersion: '16.0',
            DBInstanceStatus: 'Running',
            DBInstanceClass: 'pg.n2.medium.2c',
            DBInstanceClassType: 'x',
            DBInstanceType: 'Primary',
            DBInstanceCPU: '2',
            DBInstanceMemory: 4096,
            DBInstanceStorage: 100,
            DBInstanceStorageType: 'cloud_essd',
            DBInstanceDiskUsed: '20',
            maxConnections: 2000,
            maxIOPS: 10000,
            maxIOMBPS: 500,
            payType: 'Postpaid',
            category: 'HighAvailability',
            creationTime: '2026-08-01T00:00:00Z',
            maintainTime: '02:00Z-03:00Z',
            resourceGroupId: 'rg-demo',
            deletionProtection: true,
            securityIPMode: 'normal',
            serverlessConfig: { autoPause: true, scaleMin: 0.5, scaleMax: 8 }
          }]
        }
      }
    });
    client.describeDBInstanceNetInfo.mockResolvedValue({
      body: {
        DBInstanceNetInfos: {
          DBInstanceNetInfo: [{
            connectionStringType: 'Normal',
            IPType: 'Private',
            connectionString: 'pgm-demo.pg.rds.aliyuncs.com',
            port: '5432',
            VPCId: 'vpc-demo',
            vSwitchId: 'vsw-demo'
          }]
        }
      }
    });
    client.describeDatabases.mockResolvedValue({
      body: { databases: { database: [{ DBName: 'app' }] } }
    });
    client.describeAccounts.mockResolvedValue({
      body: { accounts: { DBInstanceAccount: [{ accountName: 'app_user' }] } }
    });
    client.describeDBInstanceIPArrayList.mockResolvedValue({
      body: {
        items: {
          DBInstanceIPArray: [{
            DBInstanceIPArrayName: 'default',
            DBInstanceIPArrayAttribute: 'normal',
            securityIPType: 'IPv4',
            securityIPList: '10.0.0.0/8, 192.168.1.0/24'
          }]
        }
      }
    });
    client.describeSecurityGroupConfiguration.mockResolvedValue({
      body: {
        items: {
          ecsSecurityGroupRelation: [{
            securityGroupId: 'sg-demo',
            securityGroupName: 'rds-access',
            networkType: 'VPC',
            regionId: 'cn-shanghai'
          }]
        }
      }
    });
  });

  it('aggregates attributes, network and security data with a per-call region', async () => {
    const detail = await getDatabaseInstanceDetail(' pgm-demo ', { regionId: 'cn-shanghai' });

    expect(createRdsClientMock).toHaveBeenCalledWith('cn-shanghai');
    expect(client.describeDBInstanceAttribute).toHaveBeenCalledWith(expect.objectContaining({ DBInstanceId: 'pgm-demo' }));
    expect(detail.summary).toMatchObject({
      instanceId: 'pgm-demo',
      regionId: 'cn-shanghai',
      zoneId: 'cn-shanghai-m',
      vpcId: 'vpc-demo',
      vSwitchId: 'vsw-demo'
    });
    expect(detail.attributes).toMatchObject({
      cpu: '2',
      memoryMb: 4096,
      storageGb: 100,
      storageType: 'cloud_essd',
      deletionProtection: true,
      serverless: { autoPause: true, scaleMin: 0.5, scaleMax: 8 }
    });
    expect(detail.network).toEqual(expect.objectContaining({
      regionId: 'cn-shanghai',
      zoneId: 'cn-shanghai-m',
      slaveZoneIds: ['cn-shanghai-n'],
      networkType: 'VPC'
    }));
    expect(detail.security.whitelists).toEqual([expect.objectContaining({
      name: 'default',
      ips: ['10.0.0.0/8', '192.168.1.0/24']
    })]);
    expect(detail.security.securityGroups).toEqual([expect.objectContaining({ id: 'sg-demo' })]);
    expect(detail.endpoints).toEqual([expect.objectContaining({ ipType: 'Private', port: '5432' })]);
    expect(detail.databases).toEqual(['app']);
    expect(detail.accounts).toEqual(['app_user']);
    expect(detail.inspectionWarnings).toEqual([]);
  });

  it('keeps core detail available when optional security inspections fail', async () => {
    client.describeDBInstanceIPArrayList.mockRejectedValueOnce(new Error('whitelist unavailable'));
    client.describeSecurityGroupConfiguration.mockRejectedValueOnce(new Error('security group unsupported'));

    const detail = await getDatabaseInstanceDetail('pgm-demo');

    expect(createRdsClientMock).toHaveBeenCalledWith(undefined);
    expect(detail.security.whitelists).toEqual([]);
    expect(detail.security.securityGroups).toEqual([]);
    expect(detail.inspectionWarnings).toEqual([
      { source: 'whitelists', message: 'whitelist unavailable' },
      { source: 'securityGroups', message: 'security group unsupported' }
    ]);
  });

});
