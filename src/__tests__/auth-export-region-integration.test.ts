import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const {
  createOssBucketMock,
  createSignedOssGetUrlMock,
  uploadOssObjectContentMock,
  executeWithAuthRecoveryMock,
  emitCommandResultMock
} = vi.hoisted(() => ({
  createOssBucketMock: vi.fn(),
  createSignedOssGetUrlMock: vi.fn(),
  uploadOssObjectContentMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn(),
  emitCommandResultMock: vi.fn()
}));

vi.mock('../providers/oss', async (importOriginal) => ({
  ...await importOriginal<typeof import('../providers/oss')>(),
  createOssBucket: createOssBucketMock,
  createSignedOssGetUrl: createSignedOssGetUrlMock,
  uploadOssObjectContent: uploadOssObjectContentMock
}));
vi.mock('../utils/auth-recovery', async (importOriginal) => ({
  ...await importOriginal<typeof import('../utils/auth-recovery')>(),
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));
vi.mock('../utils/output', async (importOriginal) => ({
  ...await importOriginal<typeof import('../utils/output')>(),
  isJsonOutput: () => true,
  emitCommandResult: emitCommandResultMock
}));

describe('auth export invocation region integration', () => {
  let home: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'licell-auth-export-region-'));
    vi.stubEnv('HOME', home);
    vi.resetModules();
    createOssBucketMock.mockReset();
    createSignedOssGetUrlMock.mockReset();
    uploadOssObjectContentMock.mockReset();
    executeWithAuthRecoveryMock.mockReset();
    emitCommandResultMock.mockReset();
    createOssBucketMock.mockResolvedValue({ bucket: 'demo', created: true });
    createSignedOssGetUrlMock.mockReturnValue({
      url: 'https://example.com/auth-transfer.json',
      expiresAt: '2099-08-05T00:00:00.000Z'
    });
    executeWithAuthRecoveryMock.mockImplementation(async (_input: unknown, task: () => unknown) => await task());
    mkdirSync(join(home, '.licell-cli'), { recursive: true });
    writeFileSync(join(home, '.licell-cli', 'auth.json'), JSON.stringify({
      accountId: '1494910986361453',
      ak: 'raw-ak',
      sk: 'raw-sk',
      region: 'cn-hangzhou'
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(home, { recursive: true, force: true });
  });

  it('uses the CAC override for OSS/token while the encrypted auth file remains raw', async () => {
    const { registerAuthCommands } = await import('../commands/auth');
    const {
      decodeAuthTransferBundle,
      decodeAuthTransferToken
    } = await import('../utils/auth-transfer');
    const { Config } = await import('../utils/config');
    const cli = cac('licell');
    registerAuthCommands(cli);
    const command = cli.commands.find((candidate) => candidate.name === 'auth export');
    if (!command?.commandAction) throw new Error('auth export command action missing');

    await command.commandAction.call(cli, '123456789012', { region: 'cn-shanghai' });

    const result = emitCommandResultMock.mock.calls.at(-1)?.[0] as { token: string; bucket: string };
    const token = decodeAuthTransferToken(result.token);
    expect(token.region).toBe('cn-shanghai');
    expect(result.bucket).toContain('cn-shanghai');
    expect(Config.getGlobalConfig().authTransferBuckets).toMatchObject({
      '1494910986361453@cn-shanghai': result.bucket
    });

    const uploadedContent = uploadOssObjectContentMock.mock.calls[0]?.[2] as Buffer;
    const archive = decodeAuthTransferBundle(uploadedContent, '123456789012');
    const authFile = archive.files.find((file) => file.path === 'auth.json');
    expect(authFile).toBeDefined();
    expect(JSON.parse(Buffer.from(authFile!.contentBase64, 'base64').toString('utf8'))).toMatchObject({
      region: 'cn-hangzhou'
    });
    expect(Config.getAuth()?.region).toBe('cn-hangzhou');
  });
});
