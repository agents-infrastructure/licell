import { createHash } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getGlobalConfigMock,
  setGlobalConfigMock,
  requireAuthMock,
  getAuthMock,
  clearAuthMock,
  setConfiguredAuthTransferBucketMock,
  textPromptMock,
  passwordPromptMock,
  confirmPromptMock,
  registerCliCommandMock,
  capturedActions,
  isInteractiveTTYMock,
  executeWithAuthRecoveryMock,
  showIntroMock,
  showOutroMock,
  createOssBucketMock,
  createSignedOssGetUrlMock,
  uploadOssObjectContentMock,
  buildAuthTransferBucketCandidatesMock,
  buildAuthTransferObjectKeyMock,
  collectAuthTransferSnapshotMock,
  createEncryptedAuthTransferBundleMock,
  decodeAuthTransferTokenMock,
  decodeAuthTransferBundleMock,
  encodeAuthTransferTokenMock,
  getConfiguredAuthTransferBucketMock,
  hasExistingAuthTransferTargetsMock,
  restoreAuthTransferArchiveMock,
  emitCommandEventMock,
  emitCommandResultMock
} = vi.hoisted(() => ({
  getGlobalConfigMock: vi.fn(),
  setGlobalConfigMock: vi.fn(),
  requireAuthMock: vi.fn(),
  getAuthMock: vi.fn(),
  clearAuthMock: vi.fn(),
  setConfiguredAuthTransferBucketMock: vi.fn(),
  textPromptMock: vi.fn(),
  passwordPromptMock: vi.fn(),
  confirmPromptMock: vi.fn(),
  registerCliCommandMock: vi.fn(),
  capturedActions: {} as Record<string, (...args: unknown[]) => unknown>,
  isInteractiveTTYMock: vi.fn(() => false),
  executeWithAuthRecoveryMock: vi.fn(),
  showIntroMock: vi.fn(),
  showOutroMock: vi.fn(),
  createOssBucketMock: vi.fn(),
  createSignedOssGetUrlMock: vi.fn(),
  uploadOssObjectContentMock: vi.fn(),
  buildAuthTransferBucketCandidatesMock: vi.fn(),
  buildAuthTransferObjectKeyMock: vi.fn(),
  collectAuthTransferSnapshotMock: vi.fn(),
  createEncryptedAuthTransferBundleMock: vi.fn(),
  decodeAuthTransferTokenMock: vi.fn(),
  decodeAuthTransferBundleMock: vi.fn(),
  encodeAuthTransferTokenMock: vi.fn(),
  getConfiguredAuthTransferBucketMock: vi.fn(),
  hasExistingAuthTransferTargetsMock: vi.fn(),
  restoreAuthTransferArchiveMock: vi.fn(),
  emitCommandEventMock: vi.fn(),
  emitCommandResultMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  text: textPromptMock,
  password: passwordPromptMock,
  confirm: confirmPromptMock,
  isCancel: vi.fn(() => false)
}));

vi.mock('../commands/module', () => ({
  defineCommandModule: (input: unknown) => input,
  commandInvocation: vi.fn(() => 'auth export'),
  defineCliCommand: <T>(input: T) => input,
  registerCliCommand: registerCliCommandMock
}));

vi.mock('../utils/config', () => ({
  Config: {
    getGlobalConfig: getGlobalConfigMock,
    setGlobalConfig: setGlobalConfigMock,
    requireAuth: requireAuthMock,
    getAuth: getAuthMock,
    clearAuth: clearAuthMock
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
  executeWithAuthRecovery: executeWithAuthRecoveryMock,
  runAuthRepairFlow: vi.fn()
}));

vi.mock('../utils/cli-shared', () => ({
  toPromptValue: vi.fn((value: unknown) => String(value)),
  isInteractiveTTY: isInteractiveTTYMock,
  toOptionalString: vi.fn((value: unknown) => {
    if (value === null || value === undefined) return undefined;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : undefined;
  }),
  normalizeRegion: vi.fn((value: string) => value),
  maskAccessKeyId: vi.fn((value: string) => value),
  showIntro: showIntroMock,
  showOutro: showOutroMock
}));

vi.mock('../providers/oss', () => ({
  createOssBucket: createOssBucketMock,
  createSignedOssGetUrl: createSignedOssGetUrlMock,
  isOssBucketNameUnavailableError: vi.fn(() => false),
  uploadOssObjectContent: uploadOssObjectContentMock
}));

vi.mock('../utils/output', () => ({
  emitCliError: vi.fn(),
  emitCliEvent: vi.fn(),
  emitCommandEvent: emitCommandEventMock,
  emitCommandResult: emitCommandResultMock,
  isJsonOutput: vi.fn(() => false)
}));

vi.mock('../utils/auth-transfer', () => ({
  buildAuthTransferBucketName: vi.fn(),
  buildAuthTransferBucketCandidates: buildAuthTransferBucketCandidatesMock,
  buildAuthTransferObjectKey: buildAuthTransferObjectKeyMock,
  collectAuthTransferSnapshot: collectAuthTransferSnapshotMock,
  createEncryptedAuthTransferBundle: createEncryptedAuthTransferBundleMock,
  decodeAuthTransferBundle: decodeAuthTransferBundleMock,
  decodeAuthTransferToken: decodeAuthTransferTokenMock,
  encodeAuthTransferToken: encodeAuthTransferTokenMock,
  getConfiguredAuthTransferBucket: getConfiguredAuthTransferBucketMock,
  hasExistingAuthTransferTargets: hasExistingAuthTransferTargetsMock,
  restoreAuthTransferArchive: restoreAuthTransferArchiveMock,
  setConfiguredAuthTransferBucket: setConfiguredAuthTransferBucketMock
}));

vi.mock('../commands/sections', () => ({
  SETUP_SECTION: 'setup'
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  getGlobalConfigMock.mockReset();
  setGlobalConfigMock.mockReset();
  requireAuthMock.mockReset();
  getAuthMock.mockReset();
  clearAuthMock.mockReset();
  setConfiguredAuthTransferBucketMock.mockReset();
  textPromptMock.mockReset();
  passwordPromptMock.mockReset();
  confirmPromptMock.mockReset();
  registerCliCommandMock.mockReset();
  isInteractiveTTYMock.mockReset();
  executeWithAuthRecoveryMock.mockReset();
  showIntroMock.mockReset();
  showOutroMock.mockReset();
  createOssBucketMock.mockReset();
  createSignedOssGetUrlMock.mockReset();
  uploadOssObjectContentMock.mockReset();
  buildAuthTransferBucketCandidatesMock.mockReset();
  buildAuthTransferObjectKeyMock.mockReset();
  collectAuthTransferSnapshotMock.mockReset();
  createEncryptedAuthTransferBundleMock.mockReset();
  decodeAuthTransferTokenMock.mockReset();
  decodeAuthTransferBundleMock.mockReset();
  encodeAuthTransferTokenMock.mockReset();
  getConfiguredAuthTransferBucketMock.mockReset();
  hasExistingAuthTransferTargetsMock.mockReset();
  restoreAuthTransferArchiveMock.mockReset();
  emitCommandEventMock.mockReset();
  emitCommandResultMock.mockReset();
  Object.keys(capturedActions).forEach((key) => delete capturedActions[key]);

  registerCliCommandMock.mockImplementation((_cli, command: { rawName: string }) => ({
    action: vi.fn((handler: (...args: unknown[]) => unknown) => {
      capturedActions[command.rawName] = handler;
    })
  }));
  isInteractiveTTYMock.mockReturnValue(false);
  executeWithAuthRecoveryMock.mockImplementation(async (_context: unknown, run: () => unknown) => await run());

  getGlobalConfigMock.mockReturnValue({
    authTransferBuckets: {
      '1494910986361453@cn-hangzhou': 'licell-auth-old'
    }
  });
  requireAuthMock.mockReturnValue({
    accountId: '1494910986361453',
    region: 'cn-hangzhou'
  });
  setConfiguredAuthTransferBucketMock.mockImplementation((registry, accountId, region, bucket) => ({
    ...(registry || {}),
    [`${accountId}@${region}`]: bucket
  }));
  buildAuthTransferBucketCandidatesMock.mockReturnValue(['licell-auth-fallback']);
  buildAuthTransferObjectKeyMock.mockReturnValue('auth-transfer/demo.json');
  collectAuthTransferSnapshotMock.mockReturnValue({
    includedAuth: true,
    includedGlobalConfig: true,
    includedAcmeFiles: 1
  });
  createEncryptedAuthTransferBundleMock.mockReturnValue({
    content: Buffer.from('bundle'),
    sha256: 'demo-sha256',
    fileCount: 3
  });
  getConfiguredAuthTransferBucketMock.mockImplementation((registry, accountId, region) => registry?.[`${accountId}@${region}`]);
  createOssBucketMock.mockResolvedValue({ created: true });
  createSignedOssGetUrlMock.mockReturnValue({
    url: 'https://example.com/auth-transfer/demo.json',
    expiresAt: '2099-03-18T04:48:58.000Z'
  });
  uploadOssObjectContentMock.mockResolvedValue(undefined);
  encodeAuthTransferTokenMock.mockReturnValue('licell-auth-v1.demo-token');
});

describe('persistAuthTransferBucketPreference', () => {

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

describe('registerAuthCommands / auth export', () => {
  it('supports human-friendly expiry durations like 30d', async () => {
    const { registerAuthCommands } = await import('../commands/auth');

    registerAuthCommands({} as never);
    const exportAction = capturedActions['auth export [passkey]'];

    expect(exportAction).toBeTypeOf('function');
    await exportAction?.('123456789012', { expires: '30d' });

    expect(createSignedOssGetUrlMock).toHaveBeenCalledWith(
      'licell-auth-old',
      'auth-transfer/demo.json',
      30 * 24 * 3600
    );
    expect(uploadOssObjectContentMock).toHaveBeenCalledWith(
      'licell-auth-old',
      'auth-transfer/demo.json',
      expect.any(Buffer),
      { contentType: 'application/vnd.licell.auth-bundle+json' }
    );
  });

  it('rejects passing --expires and --expires-hours together', async () => {
    const { registerAuthCommands } = await import('../commands/auth');

    registerAuthCommands({} as never);
    const exportAction = capturedActions['auth export [passkey]'];

    await expect(exportAction?.('123456789012', {
      expires: '30d',
      expiresHours: '72'
    })).rejects.toThrow('--expires 与 --expires-hours 不能同时传入');
    expect(createSignedOssGetUrlMock).not.toHaveBeenCalled();
  });

  it('rejects invalid duration syntax for --expires', async () => {
    const { registerAuthCommands } = await import('../commands/auth');

    registerAuthCommands({} as never);
    const exportAction = capturedActions['auth export [passkey]'];

    await expect(exportAction?.('123456789012', { expires: '30x' })).rejects.toThrow(
      '--expires 格式非法，请使用如 90m、12h、30d'
    );
    expect(createSignedOssGetUrlMock).not.toHaveBeenCalled();
  });
});

describe('registerAuthCommands / auth restore', () => {
  it('keeps canonical required args while using a parser-only optional signature', async () => {
    const { registerAuthCommands } = await import('../commands/auth');

    registerAuthCommands({} as never);

    const restoreRegistration = registerCliCommandMock.mock.calls
      .map((call) => call[1] as { rawName: string; cliRawName?: string })
      .find((command) => command.rawName === 'auth restore <token> [passkey]');

    expect(restoreRegistration).toBeDefined();
    expect(restoreRegistration?.cliRawName).toBe('auth restore [token] [passkey]');
  });

  it('prompts for missing restore token and passkey in TTY mode', async () => {
    const bundleContent = Buffer.from('auth-bundle-demo');
    const objectSha256 = createHash('sha256').update(bundleContent).digest('hex');
    isInteractiveTTYMock.mockReturnValue(true);
    textPromptMock.mockResolvedValue('licell-auth-v1.demo-token');
    passwordPromptMock.mockResolvedValue('123456789012');
    decodeAuthTransferTokenMock.mockReturnValue({
      bucket: 'demo-bucket',
      key: 'auth-transfer/demo.json',
      signedGetUrl: 'https://example.com/auth-bundle',
      objectSha256,
      expiresAt: '2099-03-18T04:48:58.000Z'
    });
    decodeAuthTransferBundleMock.mockReturnValue({ files: [] });
    hasExistingAuthTransferTargetsMock.mockReturnValue([]);
    restoreAuthTransferArchiveMock.mockReturnValue({
      restoredFiles: 4,
      targetDir: '/tmp/.licell-cli'
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => bundleContent.buffer.slice(
        bundleContent.byteOffset,
        bundleContent.byteOffset + bundleContent.byteLength
      )
    })));

    const { registerAuthCommands } = await import('../commands/auth');
    registerAuthCommands({} as never);
    const restoreAction = capturedActions['auth restore <token> [passkey]'];

    expect(restoreAction).toBeTypeOf('function');
    await restoreAction?.(undefined, undefined, {});

    expect(textPromptMock).toHaveBeenCalledWith({ message: '输入 restore token:' });
    expect(passwordPromptMock).toHaveBeenCalledWith({ message: '输入 restore passkey:' });
    expect(decodeAuthTransferTokenMock).toHaveBeenCalledWith('licell-auth-v1.demo-token');
    expect(restoreAuthTransferArchiveMock).toHaveBeenCalledTimes(1);
    expect(confirmPromptMock).not.toHaveBeenCalled();
  });

  it('rejects missing restore token in non-interactive mode', async () => {
    isInteractiveTTYMock.mockReturnValue(false);
    const { registerAuthCommands } = await import('../commands/auth');
    registerAuthCommands({} as never);
    const restoreAction = capturedActions['auth restore <token> [passkey]'];

    await expect(restoreAction?.(undefined, '123456789012', {})).rejects.toThrow(
      '非交互模式下需要显式传入 restore token'
    );
    expect(textPromptMock).not.toHaveBeenCalled();
  });
});
