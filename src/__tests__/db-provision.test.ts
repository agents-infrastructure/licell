import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createRdsClientMock,
  ensureDefaultNetworkMock,
  project,
  rdsClient,
  resolveDatabaseAvailableZoneIdsMock,
  setProjectMock
} = vi.hoisted(() => ({
  createRdsClientMock: vi.fn(),
  ensureDefaultNetworkMock: vi.fn(),
  project: { appName: 'demo', envs: {} as Record<string, string>, network: undefined as unknown, database: undefined as unknown },
  rdsClient: {
    checkServiceLinkedRole: vi.fn(),
    createServiceLinkedRole: vi.fn(),
    describeAvailableClasses: vi.fn(),
    createDBInstance: vi.fn(),
    describeDBInstances: vi.fn(),
    createAccount: vi.fn(),
    createDatabase: vi.fn(),
    grantAccountPrivilege: vi.fn(),
    describeDBInstanceNetInfo: vi.fn()
  },
  resolveDatabaseAvailableZoneIdsMock: vi.fn(),
  setProjectMock: vi.fn()
}));

vi.mock('../utils/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/config')>()),
  Config: {
    getProject: () => project,
    setProject: setProjectMock
  }
}));

vi.mock('../providers/infra/client', () => ({
  createRdsClient: createRdsClientMock
}));

vi.mock('../providers/infra/zones', () => ({
  resolveDatabaseAvailableZoneIds: resolveDatabaseAvailableZoneIdsMock
}));

vi.mock('../providers/vpc', () => ({
  ensureDefaultNetwork: ensureDefaultNetworkMock,
  resolveProvidedNetwork: vi.fn()
}));

vi.mock('../utils/crypto', () => ({ randomStrongPassword: () => 'StrongPassword123!' }));
vi.mock('../utils/runtime', () => ({ sleep: vi.fn(async () => {}) }));

import { provisionDatabase } from '../providers/infra/provision';

describe('RDS provision binding persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    project.envs = { KEEP_ME: '1' };
    project.network = undefined;
    project.database = undefined;
    createRdsClientMock.mockReturnValue({
      auth: { region: 'cn-shanghai' },
      client: rdsClient
    });
    resolveDatabaseAvailableZoneIdsMock.mockResolvedValue(['cn-shanghai-m']);
    ensureDefaultNetworkMock.mockResolvedValue({
      vpcId: 'vpc-demo',
      vswId: 'vsw-demo',
      sgId: 'sg-demo',
      cidrBlock: '10.0.0.0/8',
      zoneId: 'cn-shanghai-m',
      region: 'cn-shanghai'
    });
    rdsClient.describeAvailableClasses.mockResolvedValue({
      body: {
        DBInstanceClasses: [{
          DBInstanceClass: 'pg.n2.serverless.1c',
          DBInstanceStorageRange: { minValue: 20 }
        }]
      }
    });
    rdsClient.checkServiceLinkedRole.mockResolvedValue({ body: { hasServiceLinkedRole: 'true' } });
    rdsClient.createDBInstance.mockResolvedValue({ body: { DBInstanceId: 'pgm-demo' } });
    rdsClient.describeDBInstances.mockResolvedValue({
      body: { items: { DBInstance: [{ DBInstanceStatus: 'Running' }] } }
    });
    rdsClient.createAccount.mockResolvedValue({});
    rdsClient.createDatabase.mockResolvedValue({});
    rdsClient.describeDBInstanceNetInfo.mockResolvedValue({
      body: {
        DBInstanceNetInfos: {
          DBInstanceNetInfo: [{ IPType: 'Private', connectionString: 'pgm-demo.pg.rds.aliyuncs.com', port: '5432' }]
        }
      }
    });
  });

  it('persists database and network ownership regions after creation', async () => {
    await provisionDatabase('postgres', { message: vi.fn() } as never);

    expect(rdsClient.createDBInstance.mock.calls[0]?.[0]).toMatchObject({ regionId: 'cn-shanghai' });
    expect(setProjectMock).toHaveBeenCalledWith(expect.objectContaining({
      network: expect.objectContaining({ vpcId: 'vpc-demo', region: 'cn-shanghai' }),
      database: expect.objectContaining({ instanceId: 'pgm-demo', region: 'cn-shanghai' }),
      envs: expect.objectContaining({ KEEP_ME: '1', DATABASE_URL: expect.stringContaining('@pgm-demo.pg.rds.aliyuncs.com:5432/') })
    }));
  });
});
