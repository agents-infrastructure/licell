import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, executeWithAuthRecoveryMock, listFunctionAliasesMock, listFunctionTriggersMock, listFunctionLayersMock, listFunctionCapacityMock, listFunctionInstancesMock, listFunctionSessionsMock, listFunctionVpcBindingsMock, listFunctionTagsMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listFunctionAliasesMock: vi.fn(),
  listFunctionTriggersMock: vi.fn(),
  listFunctionLayersMock: vi.fn(),
  listFunctionCapacityMock: vi.fn(),
  listFunctionInstancesMock: vi.fn(),
  listFunctionSessionsMock: vi.fn(),
  listFunctionVpcBindingsMock: vi.fn(),
  listFunctionTagsMock: vi.fn()
}));

vi.mock('../providers/fc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../providers/fc')>()),
  listFunctionAliases: listFunctionAliasesMock,
  listFunctionTriggers: listFunctionTriggersMock,
  listFunctionLayers: listFunctionLayersMock,
  listFunctionCapacity: listFunctionCapacityMock,
  listFunctionInstances: listFunctionInstancesMock,
  listFunctionSessions: listFunctionSessionsMock,
  listFunctionVpcBindings: listFunctionVpcBindingsMock,
  listFunctionTags: listFunctionTagsMock
}));
vi.mock('../utils/auth-recovery', () => ({ executeWithAuthRecovery: executeWithAuthRecoveryMock }));
vi.mock('../utils/cli-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/cli-shared')>()),
  ensureAuthOrExit: vi.fn(),
  isInteractiveTTY: vi.fn(() => false)
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/output')>()),
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

describe('FC aliases command', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listFunctionAliasesMock.mockReset().mockResolvedValue([
      { aliasName: 'prod', versionId: '2', description: 'production', additionalVersionWeight: { '3': 0.1 } },
      { aliasName: 'preview', versionId: '3' }
    ]);
    listFunctionTriggersMock.mockReset().mockResolvedValue([
      { triggerName: 'http', triggerType: 'http', status: 'Active', qualifier: 'prod', triggerConfig: '{"secret":"hidden"}' }
    ]);
    listFunctionLayersMock.mockReset().mockResolvedValue([
      { layerName: 'common', version: 3, acl: '0', compatibleRuntime: ['nodejs20'], codeSize: 1024, layerVersionArn: 'acs:fc:layer/common/versions/3' }
    ]);
    listFunctionCapacityMock.mockReset().mockResolvedValue({
      functionName: 'demo-fn', limit: 20,
      concurrency: [{ functionArn: 'fn/demo-fn', reservedConcurrency: 10 }],
      provision: [{ functionArn: 'fn/demo-fn/prod', current: 2, target: 3, scheduledActions: [{ name: 'peak' }] }],
      scaling: [{ functionArn: 'fn/demo-fn/prod', currentInstances: 2, targetInstances: 4, horizontalScalingPolicies: [{}] }]
    });
    listFunctionInstancesMock.mockReset().mockResolvedValue({
      functionName: 'demo-fn', limit: 20, requestId: 'req-i',
      instances: [{ instanceId: 'i-1', status: 'Running', qualifier: 'prod', versionId: '3' }]
    });
    listFunctionSessionsMock.mockReset().mockResolvedValue({
      functionName: 'demo-fn', limit: 20,
      sessions: [{ sessionId: 's-1', sessionStatus: 'Active', qualifier: 'prod', sessionTTLInSeconds: 3600, nasConfig: { mountPoints: [{ serverAddr: 'hidden' }] } }]
    });
    listFunctionVpcBindingsMock.mockReset().mockResolvedValue({ functionName: 'demo-fn', vpcIds: ['vpc-a'] });
    listFunctionTagsMock.mockReset().mockResolvedValue({
      functionName: 'demo-fn', resourceType: 'ALIYUN::FC::FUNCTION', limit: 20, scannedCount: 1, truncated: false,
      tagResources: [{ resourceId: 'acs:fc:cn-shanghai:123:functions/demo-fn', resourceType: 'ALIYUN::FC::FUNCTION', tagKey: 'env', tagValue: 'prod' }]
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps function name and prefix filter to the FC alias provider', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn aliases', 'demo-fn', '--limit', '20', '--prefix', 'prod']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionAliasesMock).toHaveBeenCalledWith('demo-fn', 20);
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'fn.aliases', functionName: 'demo-fn', count: 1, limit: 20, truncated: false, filters: { prefix: 'prod' },
      aliases: [expect.objectContaining({ aliasName: 'prod', versionId: '2', description: 'production', additionalVersionWeight: { '3': 0.1 } })]
    }));
  }, 20_000);

  it('maps function name and prefix filter to the trigger provider without exposing triggerConfig', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn triggers', 'demo-fn', '--limit', '20', '--prefix', 'http']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionTriggersMock).toHaveBeenCalledWith('demo-fn', 20, 'http');
    const result = emitCommandResultMock.mock.calls.at(-1)?.[0];
    expect(result).toMatchObject({
      stage: 'fn.triggers', functionName: 'demo-fn', count: 1, filters: { prefix: 'http' },
      triggers: [expect.objectContaining({ triggerName: 'http', triggerType: 'http', status: 'Active', qualifier: 'prod' })]
    });
    expect(JSON.stringify(result)).not.toContain('hidden');
  }, 20_000);

  it('maps layer filters to the account-level layer provider', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn layers', '--limit', '20', '--prefix', 'common']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionLayersMock).toHaveBeenCalledWith(20, 'common');
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'fn.layers', count: 1, filters: { prefix: 'common' },
      layers: [expect.objectContaining({ layerName: 'common', version: 3, compatibleRuntime: ['nodejs20'] })]
    }));
  }, 20_000);

  it('combines function capacity configs into a safe Agent summary', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn capacity', 'demo-fn', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionCapacityMock).toHaveBeenCalledWith({ functionName: 'demo-fn', limit: 20 });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'fn.capacity', functionName: 'demo-fn',
      counts: { concurrency: 1, provision: 1, scaling: 1 },
      truncated: { concurrency: false, provision: false, scaling: false },
      capacity: expect.objectContaining({
        concurrency: [{ functionArn: 'fn/demo-fn', reservedConcurrency: 10 }],
        provision: [expect.objectContaining({ current: 2, target: 3, scheduledActionCount: 1 })],
        scaling: [expect.objectContaining({ currentInstances: 2, targetInstances: 4, horizontalPolicyCount: 1 })]
      })
    }));
  }, 20_000);

  it('maps instance filters and emits runtime instance summaries', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn instances', 'demo-fn', '--qualifier', 'prod', '--status', 'Running', '--all-active', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionInstancesMock).toHaveBeenCalledWith({
      functionName: 'demo-fn', qualifier: 'prod', status: 'Running', withAllActive: true, limit: 20
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'fn.instances', functionName: 'demo-fn', count: 1,
      instances: [expect.objectContaining({ instanceId: 'i-1', status: 'Running', versionId: '3' })]
    }));
  }, 20_000);

  it('maps session filters without exposing mounted storage configuration', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn sessions', 'demo-fn', '--qualifier', 'prod', '--status', 'Active', '--session', 's-1', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionSessionsMock).toHaveBeenCalledWith({
      functionName: 'demo-fn', qualifier: 'prod', status: 'Active', sessionId: 's-1', limit: 20
    });
    const result = emitCommandResultMock.mock.calls.at(-1)?.[0];
    expect(result).toMatchObject({
      stage: 'fn.sessions', functionName: 'demo-fn', count: 1,
      sessions: [expect.objectContaining({ sessionId: 's-1', sessionStatus: 'Active', sessionTTLInSeconds: 3600 })]
    });
    expect(JSON.stringify(result)).not.toContain('hidden');
    expect(JSON.stringify(result)).not.toContain('nasConfig');
  }, 20_000);

  it('emits VPC binding IDs without raw provider response fields', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn vpc-bindings', 'demo-fn']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionVpcBindingsMock).toHaveBeenCalledWith('demo-fn');
    expect(emitCommandResultMock).toHaveBeenCalledWith({
      stage: 'fn.vpc-bindings', functionName: 'demo-fn', count: 1, vpcIds: ['vpc-a']
    });
  }, 20_000);

  it('maps repeatable tag filters and emits safe function tag rows', async () => {
    const cli = cac('licell');
    const { registerFnCommands } = await import('../commands/fn');
    registerFnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'fn tags', 'demo-fn', '--tag', 'env=prod', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listFunctionTagsMock).toHaveBeenCalledWith({
      functionName: 'demo-fn', tags: [{ key: 'env', value: 'prod' }], limit: 20
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'fn.tags', functionName: 'demo-fn', count: 1, scannedCount: 1,
      filters: { functionName: 'demo-fn', tags: [{ key: 'env', value: 'prod' }] },
      tagResources: [expect.objectContaining({ functionName: 'demo-fn', tagKey: 'env', tagValue: 'prod' })]
    }));
  }, 20_000);
});
