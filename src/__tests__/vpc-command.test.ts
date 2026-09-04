import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  emitCommandResultMock,
  executeWithAuthRecoveryMock,
  getVpcInfoMock,
  inspectVpcTopologyMock,
  listVpcNetworksMock
} = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  getVpcInfoMock: vi.fn(),
  inspectVpcTopologyMock: vi.fn(),
  listVpcNetworksMock: vi.fn()
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
});
