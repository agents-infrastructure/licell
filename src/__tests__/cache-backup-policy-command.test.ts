import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const {
  applyCacheBackupPolicyMock,
  emitCommandResultMock,
  ensureMutatingActionConfirmedMock,
  executeWithAuthRecoveryMock,
  planCacheBackupPolicyMock
} = vi.hoisted(() => ({
  applyCacheBackupPolicyMock: vi.fn(),
  emitCommandResultMock: vi.fn(),
  ensureMutatingActionConfirmedMock: vi.fn(async () => {}),
  executeWithAuthRecoveryMock: vi.fn(async (_options: unknown, task: () => Promise<unknown>) => task()),
  planCacheBackupPolicyMock: vi.fn()
}));

vi.mock('../providers/redis', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../providers/redis')>()),
  applyCacheBackupPolicy: applyCacheBackupPolicyMock,
  planCacheBackupPolicy: planCacheBackupPolicyMock
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
  const { registerCacheCommands } = await import('../commands/cache');
  registerCacheCommands(cli);
  return cli;
}

describe('Redis/Tair backup policy command', () => {
  beforeEach(() => {
    emitCommandResultMock.mockReset();
    ensureMutatingActionConfirmedMock.mockClear();
    executeWithAuthRecoveryMock.mockClear();
    planCacheBackupPolicyMock.mockReset().mockResolvedValue({
      regionId: 'cn-shanghai',
      instanceId: 'r-1',
      current: { preferredPeriod: 'Monday', preferredTime: '02:00Z-03:00Z', retentionDays: 7, incrementalBackupEnabled: false },
      desiredState: { retentionDays: 30 },
      after: { preferredPeriod: 'Monday', preferredTime: '02:00Z-03:00Z', retentionDays: 30, incrementalBackupEnabled: false },
      changes: [{ field: 'retentionDays', action: 'set', before: 7, after: 30 }],
      changeCount: 1,
      requiresConfirmation: true,
      willExecute: false
    });
    applyCacheBackupPolicyMock.mockReset().mockResolvedValue({
      plan: { instanceId: 'r-1', changes: [], changeCount: 1 },
      execution: { performed: true, requestId: 'request-a' },
      verify: { performed: true, matched: true, policy: { retentionDays: 30 } }
    });
  });

  it('routes dry-run through read permission and planning only', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'cache backup-policy apply', 'r-1',
      '--payload', '{"retentionDays":30}', '--dry-run'
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      commandLabel: 'licell cache backup-policy apply',
      requiredCapabilities: ['redis-backup-read']
    }), expect.any(Function));
    expect(planCacheBackupPolicyMock).toHaveBeenCalledWith('r-1', { retentionDays: 30 });
    expect(applyCacheBackupPolicyMock).not.toHaveBeenCalled();
    expect(ensureMutatingActionConfirmedMock).not.toHaveBeenCalled();
    expect(emitCommandResultMock).toHaveBeenCalledWith(expect.objectContaining({
      execution: { performed: false },
      verify: expect.objectContaining({ performed: false })
    }));
  });

  it('requires write permission and confirmation before applying the policy', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'cache backup-policy apply', 'r-1',
      '--payload', '{"preferredPeriod":["Monday","Friday"],"preferredTime":"05:00Z-06:00Z"}', '--yes'
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(executeWithAuthRecoveryMock).toHaveBeenLastCalledWith(expect.objectContaining({
      commandLabel: 'licell cache backup-policy apply',
      requiredCapabilities: ['redis-backup-write']
    }), expect.any(Function));
    expect(ensureMutatingActionConfirmedMock).toHaveBeenCalledWith(
      '修改 Redis/Tair r-1 自动备份策略',
      expect.objectContaining({ yes: true })
    );
    expect(applyCacheBackupPolicyMock).toHaveBeenCalledWith('r-1', {
      preferredPeriod: ['Monday', 'Friday'],
      preferredTime: '05:00Z-06:00Z'
    });
  });
});
