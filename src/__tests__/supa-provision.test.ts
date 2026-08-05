import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  clientMocks,
  ensureDefaultNetworkMock,
  project,
  setProjectMock,
  sleepMock
} = vi.hoisted(() => ({
  clientMocks: {
    createAppInstance: vi.fn(),
    describeAppInstanceAttribute: vi.fn(),
    describeInstanceEndpoints: vi.fn(),
    describeInstanceAuthInfo: vi.fn()
  },
  ensureDefaultNetworkMock: vi.fn(),
  project: { envs: {} as Record<string, string>, network: undefined as unknown, supabase: undefined as unknown },
  setProjectMock: vi.fn(),
  sleepMock: vi.fn(async () => {})
}));

vi.mock('../utils/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/config')>()),
  Config: {
    getProject: () => project,
    setProject: setProjectMock
  }
}));

vi.mock('../providers/supabase/client', () => ({
  createRdsAiClient: () => ({
    auth: { region: 'cn-shanghai' },
    client: clientMocks
  })
}));

vi.mock('../providers/vpc', () => ({
  ensureDefaultNetwork: ensureDefaultNetworkMock
}));

vi.mock('../utils/runtime', () => ({ sleep: sleepMock }));

import { provisionSupabase } from '../providers/supabase/provision';

describe('Supabase provision binding persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    project.envs = { KEEP_ME: '1' };
    project.network = undefined;
    project.supabase = undefined;
    ensureDefaultNetworkMock.mockResolvedValue({
      vpcId: 'vpc-demo',
      vswId: 'vsw-demo',
      sgId: 'sg-demo',
      cidrBlock: '10.0.0.0/8',
      zoneId: 'cn-shanghai-m',
      region: 'cn-shanghai'
    });
    clientMocks.createAppInstance.mockResolvedValue({ body: { instanceName: 'Demo-Supa' } });
    clientMocks.describeAppInstanceAttribute.mockResolvedValue({ body: { status: 'Running' } });
    clientMocks.describeInstanceEndpoints.mockResolvedValue({
      body: { instanceEndpoints: [{ ipType: 'public', connectionString: 'supa.example.com' }] }
    });
    clientMocks.describeInstanceAuthInfo.mockResolvedValue({
      body: { apiKeys: { anonKey: 'anon-key', serviceKey: 'service-key' } }
    });
  });

  it('persists independent Supabase and network ownership regions', async () => {
    await provisionSupabase({ message: vi.fn() } as never, { appName: 'demo' });

    expect(clientMocks.createAppInstance.mock.calls[0]?.[0]).toMatchObject({
      regionId: 'cn-shanghai',
      vSwitchId: 'vsw-demo'
    });
    expect(setProjectMock).toHaveBeenCalledWith(expect.objectContaining({
      network: expect.objectContaining({ vpcId: 'vpc-demo', region: 'cn-shanghai' }),
      supabase: { instanceName: 'Demo-Supa', region: 'cn-shanghai' },
      envs: expect.objectContaining({
        KEEP_ME: '1',
        SUPABASE_INSTANCE_NAME: 'Demo-Supa',
        SUPABASE_URL: 'http://supa.example.com'
      })
    }));
    expect(project.envs).not.toHaveProperty('SUPABASE_REGION');
  });
});
