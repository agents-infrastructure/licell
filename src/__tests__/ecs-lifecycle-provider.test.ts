import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  startInstanceMock,
  rebootInstanceMock,
  createdConfigs
} = vi.hoisted(() => ({
  startInstanceMock: vi.fn(),
  rebootInstanceMock: vi.fn(),
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
    const { startEcsInstance, rebootEcsInstance } = await import('../providers/ecs');

    await expect(startEcsInstance({ instanceId: '' })).rejects.toThrow(/不能为空|invalid/);
    await expect(rebootEcsInstance({ instanceId: '' })).rejects.toThrow(/不能为空|invalid/);
    expect(startInstanceMock).not.toHaveBeenCalled();
    expect(rebootInstanceMock).not.toHaveBeenCalled();
  });
});
