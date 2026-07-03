import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  emitCommandResultMock,
  executeWithAuthRecoveryMock,
  isJsonOutputMock,
  listEcsInstancesMock,
  setProjectMock,
  showOutroMock,
  spinnerStopMock
} = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  isJsonOutputMock: vi.fn(() => true),
  listEcsInstancesMock: vi.fn(),
  setProjectMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn()
}));

vi.mock('../providers/ecs', () => ({
  listEcsInstances: listEcsInstancesMock
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getAuth: vi.fn(() => ({
      accountId: '1494910986361453',
      ak: 'demo-ak',
      sk: 'demo-sk',
      region: 'cn-hangzhou'
    })),
    setProject: setProjectMock
  }
}));

vi.mock('../utils/cli-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/cli-shared')>();
  return {
    ...actual,
    ensureAuthOrExit: vi.fn(),
    createSpinner: () => ({
      start: vi.fn(),
      stop: spinnerStopMock,
      message: vi.fn()
    }),
    isInteractiveTTY: vi.fn(() => false),
    showOutro: showOutroMock,
    withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
  };
});

vi.mock('../utils/output', () => ({
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: isJsonOutputMock
}));

async function createCli() {
  const cli = cac('licell');
  const { registerEcsCommands } = await import('../commands/ecs');
  registerEcsCommands(cli);
  return cli;
}

describe('ecs commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    isJsonOutputMock.mockReset();
    isJsonOutputMock.mockReturnValue(true);
    listEcsInstancesMock.mockReset();
    listEcsInstancesMock.mockResolvedValue({
      regionId: 'cn-hangzhou',
      filters: {},
      totalCount: 1,
      count: 1,
      limit: 20,
      truncated: false,
      instances: [
        {
          instanceId: 'i-demo',
          instanceName: 'api-1',
          status: 'Running',
          regionId: 'cn-hangzhou',
          zoneId: 'cn-hangzhou-b',
          instanceType: 'ecs.g7.large',
          chargeType: 'PostPaid',
          vpcId: 'vpc-demo',
          vSwitchId: 'vsw-demo',
          privateIpAddresses: ['10.0.0.1'],
          publicIpAddresses: ['8.8.8.8'],
          eipAddress: '47.1.1.1',
          securityGroupIds: ['sg-demo'],
          tags: [{ key: 'env', value: 'prod' }]
        }
      ]
    });
    setProjectMock.mockReset();
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('maps ecs list filters to provider options and emits JSON result', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'ecs list',
      '--region',
      'cn-shanghai',
      '--limit',
      '500',
      '--status',
      'Running',
      '--name-prefix',
      'prod-',
      '--instance-id',
      'i-a, i-b',
      '--vpc',
      'vpc-123',
      '--vsw',
      'vsw-123',
      '--zone',
      'cn-shanghai-a',
      '--instance-type',
      'ecs.g7.large',
      '--charge-type',
      'PostPaid',
      '--tag',
      'env=prod',
      '--tag',
      'app=api',
      '--private-ip',
      '10.0.0.8',
      '--public-ip',
      '8.8.8.8',
      '--eip',
      '47.1.1.1'
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(expect.objectContaining({
      commandLabel: 'licell ecs list',
      requiredCapabilities: ['ecs']
    }), expect.any(Function));
    expect(listEcsInstancesMock).toHaveBeenCalledWith({
      regionId: 'cn-shanghai',
      limit: 200,
      status: 'Running',
      namePrefix: 'prod-',
      instanceIds: ['i-a', 'i-b'],
      vpcId: 'vpc-123',
      vSwitchId: 'vsw-123',
      zoneId: 'cn-shanghai-a',
      instanceType: 'ecs.g7.large',
      chargeType: 'PostPaid',
      tags: [
        { key: 'env', value: 'prod' },
        { key: 'app', value: 'api' }
      ],
      privateIpAddress: '10.0.0.8',
      publicIpAddress: '8.8.8.8',
      eipAddress: '47.1.1.1'
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      regionId: 'cn-hangzhou',
      count: 1,
      limit: 20,
      totalCount: 1,
      truncated: false,
      instances: expect.arrayContaining([expect.objectContaining({ instanceId: 'i-demo' })])
    }));
    expect(setProjectMock).not.toHaveBeenCalled();
  });

  it('rejects mutually exclusive name filters before calling provider', async () => {
    const { parseEcsListOptions } = await import('../commands/ecs');
    expect(() => parseEcsListOptions({ name: 'prod-api', namePrefix: 'prod-' })).toThrow(/无效|invalid/i);
    expect(listEcsInstancesMock).not.toHaveBeenCalled();
  });

  it('rejects invalid tag filters before calling provider', async () => {
    const { parseEcsListOptions } = await import('../commands/ecs');
    expect(() => parseEcsListOptions({ tag: 'missing-separator' })).toThrow(/无效|invalid/i);
    expect(() => parseEcsListOptions({ tag: 'env=' })).toThrow(/不能为空|empty/i);
    expect(listEcsInstancesMock).not.toHaveBeenCalled();
  });

  it('routes invalid tag filters through command parsing without calling provider', async () => {
    let caughtError: unknown;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_options: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caughtError = err;
      }
    });
    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs list', '--tag', 'env=']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caughtError).toEqual(expect.objectContaining({ message: expect.stringMatching(/不能为空|empty/i) }));
    expect(listEcsInstancesMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).not.toHaveBeenCalled();
  });

  it('prints a compact text list in non-json mode', async () => {
    isJsonOutputMock.mockReturnValue(false);
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs list']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emitCommandResultMock).not.toHaveBeenCalled();
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('共获取 1 个实例'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('i-demo'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('zone=cn-hangzhou-b'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('publicIp=8.8.8.8'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('eip=47.1.1.1'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });

  it('prints an empty state in non-json mode', async () => {
    isJsonOutputMock.mockReturnValue(false);
    listEcsInstancesMock.mockResolvedValue({
      regionId: 'cn-hangzhou',
      filters: {},
      count: 0,
      limit: 20,
      truncated: false,
      instances: []
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs list']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emitCommandResultMock).not.toHaveBeenCalled();
    expect(showOutroMock).toHaveBeenCalledWith('当前地域没有匹配的 ECS 实例');
  });
});
