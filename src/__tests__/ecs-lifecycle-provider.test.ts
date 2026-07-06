import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  startInstanceMock,
  rebootInstanceMock,
  stopInstanceMock,
  deleteInstanceMock,
  describeInstancesMock,
  describeDisksMock,
  createdConfigs
} = vi.hoisted(() => ({
  startInstanceMock: vi.fn(),
  rebootInstanceMock: vi.fn(),
  stopInstanceMock: vi.fn(),
  deleteInstanceMock: vi.fn(),
  describeInstancesMock: vi.fn(),
  describeDisksMock: vi.fn(),
  createdConfigs: [] as Array<Record<string, unknown>>
}));

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({
      accountId: '1494910986361453',
      ak: 'test-ak',
      sk: 'test-sk',
      region: 'cn-hangzhou'
    })
  }
}));

vi.mock('@alicloud/ecs20140526', () => ({
  default: class MockEcsClient {
    startInstance = startInstanceMock;
    rebootInstance = rebootInstanceMock;
    stopInstance = stopInstanceMock;
    deleteInstance = deleteInstanceMock;
    describeInstances = describeInstancesMock;
    describeDisks = describeDisksMock;
  },
  StartInstanceRequest: class StartInstanceRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  RebootInstanceRequest: class RebootInstanceRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  StopInstanceRequest: class StopInstanceRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  DeleteInstanceRequest: class DeleteInstanceRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  DescribeInstancesRequest: class DescribeInstancesRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  DescribeDisksRequest: class DescribeDisksRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: Record<string, unknown>) {
      Object.assign(this, input);
      createdConfigs.push(input);
    }
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: (ctor: unknown) => ctor
}));

describe('ecs lifecycle provider wrapper', () => {
  beforeEach(() => {
    startInstanceMock.mockReset();
    rebootInstanceMock.mockReset();
    stopInstanceMock.mockReset();
    deleteInstanceMock.mockReset();
    describeInstancesMock.mockReset();
    describeDisksMock.mockReset();
    createdConfigs.length = 0;
  });

  it('startEcsInstance sends StartInstance request and returns EcsLifecycleActionResult', async () => {
    startInstanceMock.mockResolvedValueOnce({
      body: { requestId: 'req-123' }
    });

    const { startEcsInstance } = await import('../providers/ecs');
    const result = await startEcsInstance({
      instanceId: 'i-abc123',
      regionId: 'cn-shanghai'
    });

    expect(startInstanceMock).toHaveBeenCalledTimes(1);
    expect(startInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      instanceId: 'i-abc123'
    }));
    expect(result.action).toBe('start');
    expect(result.regionId).toBe('cn-shanghai');
    expect(result.instanceId).toBe('i-abc123');
    expect(result.requestId).toBe('req-123');
  });

  it('startEcsInstance uses auth default region when region not provided', async () => {
    startInstanceMock.mockResolvedValueOnce({
      body: { requestId: 'req-123' }
    });

    const { startEcsInstance } = await import('../providers/ecs');
    const result = await startEcsInstance({
      instanceId: 'i-abc123'
    });

    expect(result.regionId).toBe('cn-hangzhou');
  });

  it('startEcsInstance returns without requestId when response lacks it', async () => {
    startInstanceMock.mockResolvedValueOnce({
      body: {}
    });

    const { startEcsInstance } = await import('../providers/ecs');
    const result = await startEcsInstance({
      instanceId: 'i-abc123'
    });

    expect('requestId' in result).toBe(false);
  });

  it('rebootEcsInstance sends RebootInstance request and returns EcsLifecycleActionResult', async () => {
    rebootInstanceMock.mockResolvedValueOnce({
      body: { requestId: 'req-456' }
    });

    const { rebootEcsInstance } = await import('../providers/ecs');
    const result = await rebootEcsInstance({
      instanceId: 'i-abc123',
      regionId: 'cn-shanghai'
    });

    expect(rebootInstanceMock).toHaveBeenCalledTimes(1);
    expect(rebootInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      instanceId: 'i-abc123'
    }));
    expect(result.action).toBe('reboot');
    expect(result.regionId).toBe('cn-shanghai');
    expect(result.instanceId).toBe('i-abc123');
    expect(result.requestId).toBe('req-456');
  });

  it('rebootEcsInstance passes forceReboot as forceStop parameter', async () => {
    rebootInstanceMock.mockResolvedValueOnce({
      body: { requestId: 'req-456' }
    });

    const { rebootEcsInstance } = await import('../providers/ecs');
    await rebootEcsInstance({
      instanceId: 'i-abc123',
      forceReboot: true
    });

    expect(rebootInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      forceStop: true
    }));
  });

  it('rejects empty instanceId before calling provider', async () => {
    const { startEcsInstance, rebootEcsInstance, stopEcsInstance } = await import('../providers/ecs');

    await expect(startEcsInstance({ instanceId: '' })).rejects.toThrow(/不能为空|invalid/);
    await expect(rebootEcsInstance({ instanceId: '' })).rejects.toThrow(/不能为空|invalid/);
    await expect(stopEcsInstance({ instanceId: '' })).rejects.toThrow(/不能为空|invalid/);
    expect(startInstanceMock).not.toHaveBeenCalled();
    expect(rebootInstanceMock).not.toHaveBeenCalled();
    expect(stopInstanceMock).not.toHaveBeenCalled();
  });

  it('stopEcsInstance sends StopInstance request and returns EcsLifecycleActionResult', async () => {
    stopInstanceMock.mockResolvedValueOnce({ body: { requestId: 'req-stop-1' } });

    const { stopEcsInstance } = await import('../providers/ecs');
    const result = await stopEcsInstance({ instanceId: 'i-abc123', regionId: 'cn-shanghai' });

    expect(stopInstanceMock).toHaveBeenCalledTimes(1);
    expect(stopInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({ instanceId: 'i-abc123' }));
    expect(result).toEqual({
      action: 'stop',
      regionId: 'cn-shanghai',
      instanceId: 'i-abc123',
      requestId: 'req-stop-1'
    });
    expect(startInstanceMock).not.toHaveBeenCalled();
    expect(rebootInstanceMock).not.toHaveBeenCalled();
  });

  it('stopEcsInstance passes forceStop and stoppedMode through to the request', async () => {
    stopInstanceMock.mockResolvedValueOnce({ body: { requestId: 'req-stop-2' } });

    const { stopEcsInstance } = await import('../providers/ecs');
    await stopEcsInstance({ instanceId: 'i-abc123', forceStop: true, stoppedMode: 'StopCharging' });

    expect(stopInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      instanceId: 'i-abc123',
      forceStop: true,
      stoppedMode: 'StopCharging'
    }));
  });

  it('deleteEcsInstance sends DeleteInstance request and returns EcsLifecycleActionResult', async () => {
    deleteInstanceMock.mockResolvedValueOnce({ body: { requestId: 'req-del-1' } });

    const { deleteEcsInstance } = await import('../providers/ecs');
    const result = await deleteEcsInstance({ instanceId: 'i-abc123', regionId: 'cn-shanghai' });

    expect(deleteInstanceMock).toHaveBeenCalledTimes(1);
    expect(deleteInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({ instanceId: 'i-abc123' }));
    expect(result).toEqual({
      action: 'delete',
      regionId: 'cn-shanghai',
      instanceId: 'i-abc123',
      requestId: 'req-del-1'
    });
  });

  it('deleteEcsInstance passes force flag through to the request', async () => {
    deleteInstanceMock.mockResolvedValueOnce({ body: { requestId: 'req-del-2' } });

    const { deleteEcsInstance } = await import('../providers/ecs');
    await deleteEcsInstance({ instanceId: 'i-abc123', force: true });

    expect(deleteInstanceMock.mock.calls[0][0]).toEqual(expect.objectContaining({ instanceId: 'i-abc123', force: true }));
  });

  it('getEcsInstanceReleaseFacts reads deletion protection and disk release behavior', async () => {
    describeInstancesMock.mockResolvedValueOnce({
      body: { instances: { instance: [{ instanceId: 'i-abc123', status: 'Running', deletionProtection: false }] } }
    });
    describeDisksMock.mockResolvedValueOnce({
      body: { disks: { disk: [
        { diskId: 'd-sys', deleteWithInstance: true, category: 'cloud_essd' },
        { diskId: 'd-data', deleteWithInstance: false, category: 'cloud_essd' }
      ] } }
    });

    const { getEcsInstanceReleaseFacts } = await import('../providers/ecs');
    const facts = await getEcsInstanceReleaseFacts({ instanceId: 'i-abc123', regionId: 'cn-hangzhou' });

    expect(facts).toMatchObject({
      instanceId: 'i-abc123',
      regionId: 'cn-hangzhou',
      status: 'Running',
      deletionProtection: false,
      releaseBehavior: 'released'
    });
    expect(facts.disks).toEqual([
      { diskId: 'd-sys', deleteWithInstance: true, category: 'cloud_essd' },
      { diskId: 'd-data', deleteWithInstance: false, category: 'cloud_essd' }
    ]);
    expect(deleteInstanceMock).not.toHaveBeenCalled();
  });

  it('getEcsInstanceReleaseFacts derives retained when no disk is released with the instance', async () => {
    describeInstancesMock.mockResolvedValueOnce({
      body: { instances: { instance: [{ instanceId: 'i-abc123', status: 'Stopped', deletionProtection: true }] } }
    });
    describeDisksMock.mockResolvedValueOnce({
      body: { disks: { disk: [{ diskId: 'd-data', deleteWithInstance: false }] } }
    });

    const { getEcsInstanceReleaseFacts } = await import('../providers/ecs');
    const facts = await getEcsInstanceReleaseFacts({ instanceId: 'i-abc123' });

    expect(facts.deletionProtection).toBe(true);
    expect(facts.releaseBehavior).toBe('retained');
  });

  it('getEcsInstanceReleaseFacts throws a classifiable not-readable error when instance not found', async () => {
    describeInstancesMock.mockResolvedValueOnce({ body: { instances: { instance: [] } } });

    const { getEcsInstanceReleaseFacts } = await import('../providers/ecs');
    await expect(getEcsInstanceReleaseFacts({ instanceId: 'i-missing' })).rejects.toThrow(/事实不可读|不可读/);
    expect(describeDisksMock).not.toHaveBeenCalled();
  });

  it('getEcsInstanceReleaseFacts derives unknown release behavior when no disks are returned', async () => {
    describeInstancesMock.mockResolvedValueOnce({
      body: { instances: { instance: [{ instanceId: 'i-abc123', status: 'Running', deletionProtection: false }] } }
    });
    describeDisksMock.mockResolvedValueOnce({ body: { disks: { disk: [] } } });

    const { getEcsInstanceReleaseFacts } = await import('../providers/ecs');
    const facts = await getEcsInstanceReleaseFacts({ instanceId: 'i-abc123' });

    expect(facts.disks).toEqual([]);
    expect(facts.releaseBehavior).toBe('unknown');
  });
});
