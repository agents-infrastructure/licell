import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, executeWithAuthRecoveryMock, listCdnDomainsMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listCdnDomainsMock: vi.fn()
}));

vi.mock('../providers/cdn-query', () => ({ listCdnDomainsForAgent: listCdnDomainsMock }));
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

describe('CDN domain commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listCdnDomainsMock.mockReset().mockResolvedValue({
      stage: 'cdn.domains', count: 0, totalCount: 0, limit: 20, truncated: false, filters: {}, domains: []
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps CDN inventory filters to the protocol-backed provider', async () => {
    const cli = cac('licell');
    const { registerCdnCommands } = await import('../commands/cdn');
    registerCdnCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'cdn domains', '--region', 'cn-shanghai', '--domain', 'example.com', '--status', 'online', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(
      expect.objectContaining({ commandLabel: 'licell cdn domains' }),
      expect.any(Function)
    );
    expect(listCdnDomainsMock).toHaveBeenCalledWith({
      regionId: 'cn-shanghai', domainName: 'example.com', status: 'online', prefix: undefined, source: undefined, limit: 20
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'cdn.domains' }));
  }, 20_000);
});
