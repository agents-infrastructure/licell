import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { emitCommandResultMock, executeWithAuthRecoveryMock, listCasCertificatesMock } = vi.hoisted(() => ({
  emitCommandResultMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  listCasCertificatesMock: vi.fn()
}));

vi.mock('../providers/cas-query', () => ({ listCasCertificates: listCasCertificatesMock }));
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

describe('CAS certificate commands', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    executeWithAuthRecoveryMock.mockClear();
    listCasCertificatesMock.mockReset().mockResolvedValue({
      stage: 'cas.certificates', count: 0, totalCount: 0, limit: 20, truncated: false, filters: {}, certificates: []
    });
  });

  afterEach(() => {
    process.exitCode = undefined;
  });

  it('maps certificate filters to the protocol-backed query provider', async () => {
    const cli = cac('licell');
    const { registerCertCommands } = await import('../commands/cert');
    registerCertCommands(cli);
    await cli.parse(['node', 'src/cli.ts', 'cert list', '--region', 'cn-shanghai', '--keyword', 'example.com', '--status', 'ISSUE', '--limit', '20']);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenCalledWith(
      expect.objectContaining({ commandLabel: 'licell cert list' }),
      expect.any(Function)
    );
    expect(listCasCertificatesMock).toHaveBeenCalledWith({
      regionId: 'cn-shanghai', keyword: 'example.com', status: 'ISSUE', limit: 20,
      certType: undefined, sourceType: undefined
    });
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({ stage: 'cas.certificates' }));
  }, 20_000);
});
