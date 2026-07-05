import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  emitCommandResultMock,
  executeWithAuthRecoveryMock,
  getEcsInstanceDetailMock,
  isJsonOutputMock,
  isInteractiveTTYMock,
  showOutroMock,
  spinnerStopMock,
  startEcsInstanceMock,
  rebootEcsInstanceMock,
  stopEcsInstanceMock,
  deleteEcsInstanceMock,
  getEcsInstanceReleaseFactsMock,
  ensureHighImpactActionConfirmedMock,
  ensureDestructiveActionConfirmedMock
} = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getEcsInstanceDetailMock: vi.fn(),
  isJsonOutputMock: vi.fn(() => true),
  isInteractiveTTYMock: vi.fn(() => false),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn(),
  startEcsInstanceMock: vi.fn(),
  rebootEcsInstanceMock: vi.fn(),
  stopEcsInstanceMock: vi.fn(),
  deleteEcsInstanceMock: vi.fn(),
  getEcsInstanceReleaseFactsMock: vi.fn(),
  ensureHighImpactActionConfirmedMock: vi.fn(),
  ensureDestructiveActionConfirmedMock: vi.fn()
}));

vi.mock('../providers/ecs', () => ({
  getEcsInstanceDetail: getEcsInstanceDetailMock,
  startEcsInstance: startEcsInstanceMock,
  rebootEcsInstance: rebootEcsInstanceMock,
  stopEcsInstance: stopEcsInstanceMock,
  deleteEcsInstance: deleteEcsInstanceMock,
  getEcsInstanceReleaseFacts: getEcsInstanceReleaseFactsMock
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
    setAuth: vi.fn()
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
    isInteractiveTTY: isInteractiveTTYMock,
    showOutro: showOutroMock,
    withSpinner: async (_s: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn(),
    ensureHighImpactActionConfirmed: ensureHighImpactActionConfirmedMock,
    ensureDestructiveActionConfirmed: ensureDestructiveActionConfirmedMock
  };
});

vi.mock('../utils/output', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/output')>();
  return {
    ...actual,
    emitCommandResult: emitCommandResultMock,
    isJsonOutput: isJsonOutputMock
  };
});

async function createCli() {
  const cli = cac('licell');
  const { registerEcsCommands } = await import('../commands/ecs');
  registerEcsCommands(cli);
  return cli;
}

describe('ecs start/reboot commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    isJsonOutputMock.mockReset();
    isJsonOutputMock.mockReturnValue(true);
    isInteractiveTTYMock.mockReturnValue(false);
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Stopped',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();
    startEcsInstanceMock.mockReset();
    startEcsInstanceMock.mockResolvedValue({
      action: 'start',
      regionId: 'cn-hangzhou',
      instanceId: 'i-abc123',
      requestId: 'req-start-1'
    });
    rebootEcsInstanceMock.mockReset();
    rebootEcsInstanceMock.mockResolvedValue({
      action: 'reboot',
      regionId: 'cn-hangzhou',
      instanceId: 'i-abc123',
      requestId: 'req-reboot-1'
    });
    stopEcsInstanceMock.mockReset();
    stopEcsInstanceMock.mockResolvedValue({
      action: 'stop',
      regionId: 'cn-hangzhou',
      instanceId: 'i-abc123',
      requestId: 'req-stop-1'
    });
    deleteEcsInstanceMock.mockReset();
    deleteEcsInstanceMock.mockResolvedValue({
      action: 'delete',
      regionId: 'cn-hangzhou',
      instanceId: 'i-abc123',
      requestId: 'req-del-1'
    });
    getEcsInstanceReleaseFactsMock.mockReset();
    getEcsInstanceReleaseFactsMock.mockResolvedValue({
      instanceId: 'i-abc123',
      regionId: 'cn-hangzhou',
      status: 'Running',
      deletionProtection: false,
      disks: [{ diskId: 'd-sys', deleteWithInstance: true, category: 'cloud_essd' }],
      releaseBehavior: 'released'
    });
    ensureHighImpactActionConfirmedMock.mockReset();
    ensureDestructiveActionConfirmedMock.mockReset();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('ecs start --dry-run emits plan with willExecute=false and does NOT call startEcsInstance', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs start', 'i-abc123', '--dry-run']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getEcsInstanceDetailMock).toHaveBeenCalledTimes(1);
    expect(startEcsInstanceMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledTimes(1);
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.willExecute).toBe(false);
    expect(result.plan?.requiresConfirmation).toBe(false);
    expect(result.plan?.action).toBe('start');
  });

  it('ecs start calls startEcsInstance without confirmation when NOT --dry-run', async () => {
    const stoppedDetail = {
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Stopped',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }]
      }
    };
    const startingDetail = { summary: { ...stoppedDetail.summary, status: 'Starting' } };
    // Plan read returns Stopped, verify polls return Starting (transitional target -> reached immediately)
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockResolvedValueOnce(stoppedDetail).mockResolvedValue(startingDetail);

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs start', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(startEcsInstanceMock).toHaveBeenCalledTimes(1);
    expect(startEcsInstanceMock).toHaveBeenCalledWith({
      instanceId: 'i-abc123',
      regionId: 'cn-hangzhou'
    });
    expect(ensureHighImpactActionConfirmedMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledTimes(1);
  });

  it('ecs start does NOT call startEcsInstance when already in Running (idempotent)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Running',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs start', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(startEcsInstanceMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledTimes(1);
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.willExecute).toBe(false);
    expect(result.verify?.reachedTarget).toBe(true);
  });

  it('ecs start throws when instance is in Starting transitional state', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Starting',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });

    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs start', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(startEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/过渡态|Starting/);
  });

  it('ecs reboot --dry-run emits plan with requiresConfirmation=true, willExecute=false, does NOT call confirm or rebootEcsInstance', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Running',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs reboot', 'i-abc123', '--dry-run']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getEcsInstanceDetailMock).toHaveBeenCalledTimes(1);
    expect(rebootEcsInstanceMock).not.toHaveBeenCalled();
    expect(ensureHighImpactActionConfirmedMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledTimes(1);
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.willExecute).toBe(false);
    expect(result.plan?.requiresConfirmation).toBe(true);
    expect(result.plan?.action).toBe('reboot');
  });

  it('ecs reboot throws without --yes in non-interactive mode', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Running',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });
    ensureHighImpactActionConfirmedMock.mockImplementationOnce(() => {
      throw new Error('非交互模式请添加 --yes 明确确认');
    });

    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs reboot', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rebootEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/--yes/);
  });

  it('ecs reboot --yes calls rebootEcsInstance after confirming', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Running',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs reboot', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rebootEcsInstanceMock).toHaveBeenCalledTimes(1);
    expect(rebootEcsInstanceMock).toHaveBeenCalledWith({
      instanceId: 'i-abc123',
      regionId: 'cn-hangzhou'
    });
    expect(ensureHighImpactActionConfirmedMock).toHaveBeenCalledWith('重启实例', expect.objectContaining({ yes: true }));
    expect(emitCommandResultMock).toHaveBeenCalledTimes(1);
  });

  it('ecs reboot throws when instance is in Stopping transitional state', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Stopping',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });

    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs reboot', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rebootEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/过渡态|Stopping/);
  });

  it('ecs reboot throws when instance is already Stopped', async () => {
    getEcsInstanceDetailMock.mockResolvedValue({
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status: 'Stopped',
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }],
        createdAt: '2026-01-01T00:00Z',
        expiredAt: '2027-01-01T00:00Z'
      }
    });

    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
      }
    });

    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs reboot', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(rebootEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/不符合重启条件|Stopped/);
  });

  it('ecs start surfaces a classifiable not_found error for a missing instance (A7)', async () => {
    const notFound = new Error('ECS instance not exist: i-missing');
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockRejectedValue(notFound);

    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'start', 'i-missing']);
        emitCliError(err, { stage: 'runtime' });
      }
    });

    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs start', 'i-missing']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caught).toBe(notFound);
    expect(startEcsInstanceMock).not.toHaveBeenCalled();
    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({
      category: 'not_found',
      code: 'RESOURCE_NOT_FOUND'
    });
    stdoutWriteSpy.mockRestore();
  });

  it('ecs reboot surfaces a classifiable not_found error for a missing instance (A7)', async () => {
    const notFound = new Error('ECS instance not exist: i-missing');
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockRejectedValue(notFound);

    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'reboot', 'i-missing']);
        emitCliError(err, { stage: 'runtime' });
      }
    });

    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs reboot', 'i-missing', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caught).toBe(notFound);
    expect(rebootEcsInstanceMock).not.toHaveBeenCalled();
    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({
      category: 'not_found',
      code: 'RESOURCE_NOT_FOUND'
    });
    stdoutWriteSpy.mockRestore();
  });

  function summaryWithStatus(status: string) {
    return {
      summary: {
        instanceId: 'i-abc123',
        instanceName: 'demo',
        status,
        regionId: 'cn-hangzhou',
        zoneId: 'cn-hangzhou-b',
        instanceType: 'ecs.g7.large',
        chargeType: 'PostPaid',
        vpcId: 'vpc-demo',
        vSwitchId: 'vsw-demo',
        privateIpAddresses: ['10.0.0.1'],
        publicIpAddresses: ['8.8.8.8'],
        securityGroupIds: ['sg-demo'],
        tags: [{ key: 'env', value: 'prod' }]
      }
    };
  }

  it('ecs stop --dry-run emits plan with requiresConfirmation=true, willExecute=false, does NOT call stopEcsInstance (S1)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Running'));
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs stop', 'i-abc123', '--dry-run']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stopEcsInstanceMock).not.toHaveBeenCalled();
    expect(ensureHighImpactActionConfirmedMock).not.toHaveBeenCalled();
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.action).toBe('stop');
    expect(result.plan?.requiresConfirmation).toBe(true);
    expect(result.plan?.willExecute).toBe(false);
  });

  it('ecs stop --yes calls stopEcsInstance after interruption confirm (S2, S4)', async () => {
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock
      .mockResolvedValueOnce(summaryWithStatus('Running'))
      .mockResolvedValue(summaryWithStatus('Stopped'));
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs stop', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureHighImpactActionConfirmedMock).toHaveBeenCalledWith('停止实例', expect.objectContaining({ yes: true, interruption: true }));
    expect(stopEcsInstanceMock).toHaveBeenCalledWith({ instanceId: 'i-abc123', regionId: 'cn-hangzhou' });
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.willExecute).toBe(true);
    expect(result.verify?.reachedTarget).toBe(true);
  });

  it('ecs stop throws without --yes in non-interactive mode (S3)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Running'));
    ensureHighImpactActionConfirmedMock.mockImplementationOnce(() => {
      throw new Error('非交互模式请添加 --yes 明确确认');
    });
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try { await task(); } catch (err) { caught = err; }
    });
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs stop', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stopEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/--yes/);
  });

  it('ecs stop is idempotent when instance is already Stopped (S5)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Stopped'));
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs stop', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stopEcsInstanceMock).not.toHaveBeenCalled();
    expect(ensureHighImpactActionConfirmedMock).not.toHaveBeenCalled();
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.willExecute).toBe(false);
    expect(result.verify?.reachedTarget).toBe(true);
  });

  it('ecs stop throws when instance is in Starting transitional state (S7 precheck)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Starting'));
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try { await task(); } catch (err) { caught = err; }
    });
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs stop', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stopEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/过渡态|Starting/);
  });

  it('ecs stop surfaces a classifiable not_found error for a missing instance (S6)', async () => {
    const notFound = new Error('ECS instance not exist: i-missing');
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockRejectedValue(notFound);
    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'stop', 'i-missing']);
        emitCliError(err, { stage: 'runtime' });
      }
    });
    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs stop', 'i-missing', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caught).toBe(notFound);
    expect(stopEcsInstanceMock).not.toHaveBeenCalled();
    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({ category: 'not_found', code: 'RESOURCE_NOT_FOUND' });
    stdoutWriteSpy.mockRestore();
  });

  it('ecs delete --dry-run emits plan with releaseFacts, willExecute=false, does NOT call deleteEcsInstance (D1)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Running'));
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-abc123', '--dry-run']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getEcsInstanceReleaseFactsMock).toHaveBeenCalledTimes(1);
    expect(deleteEcsInstanceMock).not.toHaveBeenCalled();
    expect(ensureDestructiveActionConfirmedMock).not.toHaveBeenCalled();
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.action).toBe('delete');
    expect(result.plan?.willExecute).toBe(false);
    expect(result.plan?.releaseFacts).toMatchObject({ deletionProtection: false, deleteWithDisks: true, releaseBehavior: 'released' });
  });

  it('ecs delete --yes calls deleteEcsInstance after destructive confirm, verify notFound (D2)', async () => {
    getEcsInstanceDetailMock.mockReset();
    // plan read -> Running; verify polls -> throw not-found
    getEcsInstanceDetailMock
      .mockResolvedValueOnce(summaryWithStatus('Running'))
      .mockRejectedValue(new Error('ECS instance not exist: i-abc123'));
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledWith('删除实例', expect.objectContaining({ yes: true }));
    expect(deleteEcsInstanceMock).toHaveBeenCalledWith({ instanceId: 'i-abc123', regionId: 'cn-hangzhou' });
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.willExecute).toBe(true);
    expect(result.verify?.notFound).toBe(true);
    expect(result.verify?.reachedTarget).toBe(true);
  });

  it('ecs delete throws without --yes in non-interactive mode (D3)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Running'));
    ensureDestructiveActionConfirmedMock.mockImplementationOnce(() => {
      throw new Error('删除实例 属于删除操作；非交互模式请添加 --yes 明确确认');
    });
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try { await task(); } catch (err) { caught = err; }
    });
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteEcsInstanceMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/--yes/);
  });

  it('ecs delete blocks when release facts are unreadable (D4)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Running'));
    getEcsInstanceReleaseFactsMock.mockReset();
    getEcsInstanceReleaseFactsMock.mockRejectedValue(new Error('ECS 实例释放前事实不可读：未查询到实例 i-abc123 的删除保护信息'));
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try { await task(); } catch (err) { caught = err; }
    });
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteEcsInstanceMock).not.toHaveBeenCalled();
    expect(ensureDestructiveActionConfirmedMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/事实不可读|不可读/);
  });

  it('ecs delete blocks when deletionProtection=true (D5)', async () => {
    getEcsInstanceDetailMock.mockResolvedValue(summaryWithStatus('Running'));
    getEcsInstanceReleaseFactsMock.mockReset();
    getEcsInstanceReleaseFactsMock.mockResolvedValue({
      instanceId: 'i-abc123',
      regionId: 'cn-hangzhou',
      status: 'Running',
      deletionProtection: true,
      disks: [{ diskId: 'd-sys', deleteWithInstance: true }],
      releaseBehavior: 'released'
    });
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try { await task(); } catch (err) { caught = err; }
    });
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteEcsInstanceMock).not.toHaveBeenCalled();
    expect(ensureDestructiveActionConfirmedMock).not.toHaveBeenCalled();
    expect(String(caught)).toMatch(/删除保护|deletionProtection/);
  });

  it('ecs delete via interactive double-confirm path calls deleteEcsInstance (D2b)', async () => {
    isInteractiveTTYMock.mockReturnValue(true);
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock
      .mockResolvedValueOnce(summaryWithStatus('Running'))
      .mockRejectedValue(new Error('ECS instance not exist: i-abc123'));
    // ensureDestructiveActionConfirmedMock default resolves (simulating two prompts accepted)
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-abc123']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledWith('删除实例', expect.objectContaining({ yes: false }));
    expect(deleteEcsInstanceMock).toHaveBeenCalledTimes(1);
    isInteractiveTTYMock.mockReturnValue(false);
  });

  it('ecs rm behaves identically to ecs delete (D8)', async () => {
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock
      .mockResolvedValueOnce(summaryWithStatus('Running'))
      .mockRejectedValue(new Error('ECS instance not exist: i-abc123'));
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'ecs rm', 'i-abc123', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteEcsInstanceMock).toHaveBeenCalledWith({ instanceId: 'i-abc123', regionId: 'cn-hangzhou' });
    const result = emitCommandResultMock.mock.calls[0][0];
    expect(result.plan?.action).toBe('delete');
    expect(result.verify?.notFound).toBe(true);
  });

  it('ecs delete surfaces a classifiable not_found error for a missing instance (D7)', async () => {
    const notFound = new Error('ECS instance not exist: i-missing');
    getEcsInstanceDetailMock.mockReset();
    getEcsInstanceDetailMock.mockRejectedValue(notFound);
    const {
      emitCliError,
      extractJsonRecordsFromOutput,
      initOutputContext
    } = await import('../utils/output');
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    let caught: unknown = null;
    executeWithAuthRecoveryMock.mockImplementationOnce(async (_opts: unknown, task: () => Promise<unknown>) => {
      try {
        await task();
      } catch (err) {
        caught = err;
        initOutputContext('json', ['node', 'src/cli.ts', 'ecs', 'delete', 'i-missing']);
        emitCliError(err, { stage: 'runtime' });
      }
    });
    const cli = await createCli();
    cli.parse(['node', 'src/cli.ts', 'ecs delete', 'i-missing', '--yes']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(caught).toBe(notFound);
    expect(deleteEcsInstanceMock).not.toHaveBeenCalled();
    const output = stdoutWriteSpy.mock.calls.map((call) => String(call[0])).join('');
    const records = extractJsonRecordsFromOutput(output) as Array<Record<string, any>>;
    expect(records[0]?.error).toMatchObject({ category: 'not_found', code: 'RESOURCE_NOT_FOUND' });
    stdoutWriteSpy.mockRestore();
  });
});
