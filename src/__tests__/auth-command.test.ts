import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getGlobalConfigMock,
  setGlobalConfigMock,
  setConfiguredAuthTransferBucketMock
} = vi.hoisted(() => ({
  getGlobalConfigMock: vi.fn(),
  setGlobalConfigMock: vi.fn(),
  setConfiguredAuthTransferBucketMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  password: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false)
}));

vi.mock('../commands/module', () => ({
  defineCommandModule: (input: unknown) => input,
  commandInvocation: vi.fn(() => 'auth export'),
  defineCliCommand: <T>(input: T) => input,
  registerCliCommand: vi.fn(() => ({
    action: vi.fn(() => undefined)
  }))
}));

vi.mock('../utils/config', () => ({
  Config: {
    getGlobalConfig: getGlobalConfigMock,
    setGlobalConfig: setGlobalConfigMock
  },
  DEFAULT_ALI_REGION: 'cn-hangzhou'
}));

vi.mock('../utils/env', () => ({
  readEnvWithFallback: vi.fn()
}));

vi.mock('../providers/ram', () => ({
  bootstrapLicellRamAccess: vi.fn()
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: vi.fn(),
  runAuthRepairFlow: vi.fn()
}));

vi.mock('../utils/cli-shared', () => ({
  toPromptValue: vi.fn((value: unknown) => String(value)),
  isInteractiveTTY: vi.fn(() => false),
  toOptionalString: vi.fn((value: unknown) => {
    if (value === null || value === undefined) return undefined;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : undefined;
  }),
  normalizeRegion: vi.fn((value: string) => value),
  maskAccessKeyId: vi.fn((value: string) => value),
  showIntro: vi.fn(),
  showOutro: vi.fn()
}));

vi.mock('../providers/oss', () => ({
  createOssBucket: vi.fn(),
  createSignedOssGetUrl: vi.fn(),
  isOssBucketNameUnavailableError: vi.fn(() => false),
  uploadOssObjectContent: vi.fn()
}));

vi.mock('../utils/output', () => ({
  emitCliError: vi.fn(),
  emitCliEvent: vi.fn(),
  emitCliResult: vi.fn(),
  isJsonOutput: vi.fn(() => false)
}));

vi.mock('../utils/auth-transfer', () => ({
  buildAuthTransferBucketName: vi.fn(),
  buildAuthTransferBucketCandidates: vi.fn(),
  buildAuthTransferObjectKey: vi.fn(),
  collectAuthTransferSnapshot: vi.fn(),
  createEncryptedAuthTransferBundle: vi.fn(),
  decodeAuthTransferBundle: vi.fn(),
  decodeAuthTransferToken: vi.fn(),
  encodeAuthTransferToken: vi.fn(),
  getConfiguredAuthTransferBucket: vi.fn(),
  hasExistingAuthTransferTargets: vi.fn(),
  restoreAuthTransferArchive: vi.fn(),
  setConfiguredAuthTransferBucket: setConfiguredAuthTransferBucketMock
}));

vi.mock('../commands/sections', () => ({
  SETUP_SECTION: 'setup'
}));

describe('persistAuthTransferBucketPreference', () => {
  beforeEach(() => {
    getGlobalConfigMock.mockReset();
    setGlobalConfigMock.mockReset();
    setConfiguredAuthTransferBucketMock.mockReset();

    getGlobalConfigMock.mockReturnValue({
      authTransferBuckets: {
        '1494910986361453@cn-hangzhou': 'licell-auth-old'
      }
    });
    setConfiguredAuthTransferBucketMock.mockImplementation((registry, accountId, region, bucket) => ({
      ...(registry || {}),
      [`${accountId}@${region}`]: bucket
    }));
  });

  it('writes updated auth transfer bucket preference', async () => {
    const { persistAuthTransferBucketPreference } = await import('../commands/auth');

    const ok = persistAuthTransferBucketPreference(
      '1494910986361453',
      'cn-hangzhou',
      'licell-auth-new'
    );

    expect(ok).toBe(true);
    expect(setConfiguredAuthTransferBucketMock).toHaveBeenCalledWith(
      { '1494910986361453@cn-hangzhou': 'licell-auth-old' },
      '1494910986361453',
      'cn-hangzhou',
      'licell-auth-new'
    );
    expect(setGlobalConfigMock).toHaveBeenCalledWith({
      authTransferBuckets: {
        '1494910986361453@cn-hangzhou': 'licell-auth-new'
      }
    });
  });

  it('swallows local config write failures', async () => {
    const { persistAuthTransferBucketPreference } = await import('../commands/auth');
    setGlobalConfigMock.mockImplementation(() => {
      throw new Error('EPERM: operation not permitted');
    });

    const ok = persistAuthTransferBucketPreference(
      '1494910986361453',
      'cn-hangzhou',
      'licell-auth-new'
    );

    expect(ok).toBe(false);
    expect(setGlobalConfigMock).toHaveBeenCalledTimes(1);
  });
});

describe('buildAuthExportHumanOutput', () => {
  it('focuses on restore action instead of internal storage details', async () => {
    const { buildAuthExportHumanOutput } = await import('../commands/auth');

    const output = buildAuthExportHumanOutput({
      token: 'licell-auth-v1.demo-token',
      expiresAt: '2026-03-18T04:48:58.000Z',
      fileCount: 4,
      revokeCommand: 'licell oss object rm demo-bucket demo-key --yes',
      bucketPreferenceSaved: false
    });

    expect(output).toContain('目标机器执行：');
    expect(output).toContain("licell auth restore '<restore-token>' '<passkey>' --yes");
    expect(output).toContain('restore token（复制下面整行）：');
    expect(output).toContain('licell-auth-v1.demo-token');
    expect(output).toContain('安全提醒：');
    expect(output).toContain('如需撤销：');
    expect(output).not.toContain('bucket:');
    expect(output).not.toContain('object:');
  });
});
