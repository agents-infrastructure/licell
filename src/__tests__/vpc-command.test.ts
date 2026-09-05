import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  emitCommandResultMock,
  ensureMutatingActionConfirmedMock,
  executeWithAuthRecoveryMock,
  applyVpcConfigMock,
  getVpcInfoMock,
  inspectVpcTopologyMock,
  listVpcNetworksMock,
  planVpcConfigMock
} = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  ensureMutatingActionConfirmedMock: vi.fn(async () => {}),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  applyVpcConfigMock: vi.fn(),
  getVpcInfoMock: vi.fn(),
  inspectVpcTopologyMock: vi.fn(),
  listVpcNetworksMock: vi.fn(),
  planVpcConfigMock: vi.fn()
}));

vi.mock('../providers/vpc/config', () => ({
  applyVpcConfig: applyVpcConfigMock,
  planVpcConfig: planVpcConfigMock
}));

vi.mock('../providers/vpc/query', () => ({
  getVpcInfo: getVpcInfoMock,
  inspectVpcTopology: inspectVpcTopologyMock,
  listVpcNetworks: listVpcNetworksMock
}));

vi.mock('../utils/auth-recovery', () => ({ executeWithAuthRecovery: executeWithAuthRecoveryMock }));
vi.mock('../utils/cli-shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/cli-shared')>()),
  ensureAuthOrExit: vi.fn(),
  ensureMutatingActionConfirmed: ensureMutatingActionConfirmedMock,
  isInteractiveTTY: vi.fn(() => false)
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/output')>()),
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => true)
}));

async function createCli() {
  const cli = cac('licell');
  const { registerVpcCommands } = await import('../commands/vpc');
  registerVpcCommands(cli);
  return cli;
}

describe('VPC readonly commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listVpcNetworksMock.mockReset().mockResolvedValue({ regionId: 'cn-shanghai', count: 0, vpcs: [] });
    getVpcInfoMock.mockReset().mockResolvedValue({ regionId: 'cn-shanghai', vpcId: 'vpc-a', vpc: { vpcId: 'vpc-a' } });
    inspectVpcTopologyMock.mockReset().mockResolvedValue({
      regionId: 'cn-shanghai',
      vpc: { vpcId: 'vpc-a' },
      counts: { vSwitches: 0, routeTables: 0, natGateways: 0, eipAddresses: 0 }
    });
    planVpcConfigMock.mockReset().mockResolvedValue({
      regionId: 'cn-shanghai',
      vpcId: 'vpc-a',
      current: { name: 'old', description: null },
      desiredState: { name: 'new' },
      after: { name: 'new', description: null },
      changes: [{ field: 'name', action: 'set', before: 'old', after: 'new' }],
      changeCount: 1,
      requiresConfirmation: true,
      willExecute: false
    });
    applyVpcConfigMock.mockReset().mockResolvedValue({
      plan: { vpcId: 'vpc-a', changes: [], changeCount: 1 },
      execution: { performed: true, requestId: 'request-a' },
      verify: { performed: true, matched: true, attributes: { name: 'new', description: null } }
    });
    ensureMutatingActionConfirmedMock.mockClear();
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps vpc list options and requests only read capability repair', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'vpc list', '--region', 'cn-shanghai', '--name', 'prod', '--limit', '10']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(expect.objectContaining({
      commandLabel: 'licell vpc list',
      requiredCapabilities: ['vpc-read']
    }), expect.any(Function));
    expect(listVpcNetworksMock).toHaveBeenCalledWith({ regionId: 'cn-shanghai', name: 'prod', limit: 10 });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ regionId: 'cn-shanghai', vpcs: [] }));
  });

  it.each([
    ['vpc info', getVpcInfoMock],
    ['vpc topology', inspectVpcTopologyMock]
  ])('passes a VPC ID to %s', async (command, provider) => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', command, 'vpc-a', '--region', 'cn-shanghai']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(provider).toHaveBeenCalledWith('vpc-a', { regionId: 'cn-shanghai' });
    expect(emitCommandResultMock).toHaveBeenCalled();
  });

  it('routes config dry-run through read permission and planning only', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'vpc config apply', 'vpc-a',
      '--payload', '{"name":"new"}', '--region', 'cn-shanghai', '--dry-run'
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      commandLabel: 'licell vpc config apply',
      requiredCapabilities: ['vpc-read']
    }), expect.any(Function));
    expect(planVpcConfigMock).toHaveBeenCalledWith('vpc-a', { name: 'new' }, { regionId: 'cn-shanghai' });
    expect(applyVpcConfigMock).not.toHaveBeenCalled();
    expect(ensureMutatingActionConfirmedMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      execution: { performed: false },
      verify: expect.objectContaining({ performed: false })
    }));
  });

  it('requires write permission and confirmation before applying VPC config', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'vpc config apply', 'vpc-a',
      '--payload', '{"description":null}', '--region', 'cn-shanghai', '--yes'
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      commandLabel: 'licell vpc config apply',
      requiredCapabilities: ['vpc-write']
    }), expect.any(Function));
    expect(ensureMutatingActionConfirmedMock).toHaveBeenCalledWith(
      '修改 VPC vpc-a 名称或描述',
      expect.objectContaining({ yes: true })
    );
    expect(applyVpcConfigMock).toHaveBeenCalledWith(
      'vpc-a',
      { description: null },
      { regionId: 'cn-shanghai' }
    );
  });
});
