import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  emitCommandResultMock,
  executeWithAuthRecoveryMock,
  getEcsInstanceDetailMock,
  isJsonOutputMock,
  listEcsInstancesMock,
  setProjectMock,
  showOutroMock,
  spinnerStopMock
} = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getEcsInstanceDetailMock: vi.fn(),
  isJsonOutputMock: vi.fn(() => true),
  listEcsInstancesMock: vi.fn(),
  setProjectMock: vi.fn(),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn()
}));

vi.mock('../providers/ecs', () => ({
  getEcsInstanceDetail: getEcsInstanceDetailMock,
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
    getDefaultRegion: vi.fn(() => 'cn-hangzhou'),
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

vi.mock('../utils/output', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/output')>();
  return {
    ...actual,
    emitCommandResult: (result: object, options?: Parameters<typeof actual.emitCommandResult>[1]) => {
      if (options === undefined) emitCommandResultMock(result);
      else emitCommandResultMock(result, options);
      return actual.emitCommandResult(result, options);
    },
    isJsonOutput: isJsonOutputMock
  };
});

import { initOutputContext, LICELL_JSON_PREFIX } from '../utils/output';

async function createCli() {
  const cli = cac('licell');
  const { registerEcsCommands } = await import('../commands/ecs');
  registerEcsCommands(cli);
  return cli;
}

function stripAnsi(value: string) {
  return value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

describe('ecs commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initOutputContext('text', ['node', 'src/cli.ts']);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    isJsonOutputMock.mockReset();
    isJsonOutputMock.mockReturnValue(true);
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-demo',
        instanceName: 'api-1',
        status: 'Running',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        osName: 'Alibaba Cloud Linux',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        eipAddress: '47.1.1.1',
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-07-03T00:00:00Z',
        expiredAt: '2027-07-03T00:00:00Z'
      }
    });
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
    initOutputContext('text', ['node', 'src/cli.ts']);
    stdoutWriteSpy.mockRestore();
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
      filters: {},
      instances: expect.arrayContaining([expect.objectContaining({ instanceId: 'i-demo' })])
    }));
    expect(Object.keys(emitCommandResultMock.mock.calls[0]?.[0] || {})).toEqual(expect.arrayContaining([
      'regionId',
      'filters',
      'totalCount',
      'count',
      'limit',
      'truncated',
      'instances'
    ]));
    expect(setProjectMock).not.toHaveBeenCalled();
  });

  it('preserves ecs list status casing and exact name in provider options', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'ecs list',
      '--status',
      'rUnNiNg',
      '--name',
      'Prod-API-01'
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listEcsInstancesMock).toHaveBeenCalledWith(expect.objectContaining({
      status: 'rUnNiNg',
      name: 'Prod-API-01'
    }));
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
    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    let caughtError: unknown;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_options: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caughtError = err;
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'list', '--tag', 'env=']);
        emitCliError(err, { stage: 'ecs.list' });
      }
    });
    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs list', '--tag', 'env=']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caughtError).toEqual(expect.objectContaining({ message: expect.stringMatching(/不能为空|empty/i) }));
    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({
      category: 'input',
      code: 'CLI_INVALID_INPUT'
    });
    expect(listEcsInstancesMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).not.toHaveBeenCalled();
    stdoutWriteSpy.mockRestore();
  });

  it('routes mutually exclusive list name filters to input JSON error category', async () => {
    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_options: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'list']);
        emitCliError(err, { stage: 'ecs.list' });
      }
    });

    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs list', '--name', 'prod-api', '--name-prefix', 'prod-']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({
      category: 'input',
      code: 'CLI_INVALID_INPUT'
    });
    expect(listEcsInstancesMock).not.toHaveBeenCalled();
    stdoutWriteSpy.mockRestore();
  });

  it('prints a compact text list in non-json mode', async () => {
    isJsonOutputMock.mockReturnValue(false);
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs list']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emitCommandResultMock).not.toHaveBeenCalled();
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('共获取 1 个实例'));
    const textOutput = stripAnsi(consoleLogSpy.mock.calls.map((call: unknown[]) => String(call[0])).join('\n'));
    expect(textOutput).toContain('i-demo');
    expect(textOutput).toContain('zone=cn-hangzhou-b');
    expect(textOutput).toContain('publicIp=8.8.8.8');
    expect(textOutput).toContain('eip=47.1.1.1');
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

  it('gets ecs info by instance id and emits whitelisted JSON result', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-demo',
        instanceName: 'api-1',
        status: 'Running',
        regionId: 'cn-shanghai',
        zoneId: 'cn-shanghai-a',
        instanceType: 'ecs.g7.large',
        osName: 'Alibaba Cloud Linux',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: [],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        rawAttribute: 'secret',
        userData: 'secret',
        vncUrl: 'secret',
        consoleOutput: 'secret',
        password: 'secret',
        keyPairPrivateKey: 'secret'
      }
    });

    initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'info', 'i-demo', '--region', 'cn-shanghai']);
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs info', ' i-demo ', '--region', 'cn-shanghai']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(expect.objectContaining({
      commandLabel: 'licell ecs info',
      requiredCapabilities: ['ecs']
    }), expect.any(Function));
    expect(getEcsInstanceDetailMock).toHaveBeenCalledWith('i-demo', { regionId: 'cn-shanghai' });
    expect(emitCommandResultMock).toHaveBeenCalledWith({
      regionId: 'cn-shanghai',
      instanceId: 'i-demo',
      detail: {
        summary: expect.objectContaining({
          instanceId: 'i-demo',
          regionId: 'cn-shanghai'
        })
      }
    });
    expect(JSON.stringify(emitCommandResultMock.mock.calls[0]?.[0])).not.toMatch(/rawAttribute|userData|vncUrl|consoleOutput|password|keyPairPrivateKey/);
    const structuredResult = (stdoutWriteSpy.mock.calls as unknown[][])
      .flatMap((call) => String(call[0]).split('\n'))
      .filter((line) => line.startsWith(LICELL_JSON_PREFIX))
      .map((line) => JSON.parse(line.slice(LICELL_JSON_PREFIX.length)) as Record<string, unknown>)
      .find((record) => record.type === 'result');
    expect(structuredResult).toMatchObject({
      type: 'result',
      instanceId: 'i-demo',
      callRegionId: 'cn-shanghai'
    });
    expect(setProjectMock).not.toHaveBeenCalled();
  });

  it('gets ecs info without region override and prints a compact text detail', async () => {
    isJsonOutputMock.mockReturnValue(false);
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs info', 'i-demo']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getEcsInstanceDetailMock).toHaveBeenCalledWith('i-demo', undefined);
    expect(emitCommandResultMock).not.toHaveBeenCalled();
    expect(spinnerStopMock).toHaveBeenCalledWith(expect.stringContaining('获取成功'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('instanceId:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('region/zone:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('securityGroups:'));
    expect(showOutroMock).toHaveBeenCalledWith('Done.');
  });

  it('rejects empty ecs info instance id before calling provider', async () => {
    let caughtError: unknown;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_options: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caughtError = err;
      }
    });
    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs info', '   ']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caughtError).toEqual(expect.objectContaining({ message: expect.stringMatching(/不能为空|empty/i) }));
    expect(getEcsInstanceDetailMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).not.toHaveBeenCalled();
  });

  it('keeps ecs info provider not-found errors classifiable', async () => {
    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const notFound = new Error('ECS instance not exist: i-missing');
    getEcsInstanceDetailMock.mockRejectedValue(notFound);
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    let caughtError: unknown;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_options: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caughtError = err;
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'info', 'i-missing']);
        emitCliError(err, { stage: 'runtime' });
      }
    });
    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs info', 'i-missing']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caughtError).toBe(notFound);
    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({
      category: 'not_found',
      code: 'RESOURCE_NOT_FOUND'
    });
    expect(records[0]?.stage).toBe('runtime');
    stdoutWriteSpy.mockRestore();
  });
});
