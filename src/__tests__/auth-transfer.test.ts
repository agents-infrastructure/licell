import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('auth transfer utils', () => {
  let homeDir = '';

  beforeEach(() => {
    homeDir = mkdtempSync(join(tmpdir(), 'licell-auth-transfer-'));
    vi.resetModules();
    vi.doMock('os', async () => {
      const actual = await vi.importActual<typeof import('os')>('os');
      return {
        ...actual,
        homedir: () => homeDir
      };
    });
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('os');
    rmSync(homeDir, { recursive: true, force: true });
  });

  it('collects, encrypts and decrypts current licell global state', async () => {
    const globalDir = join(homeDir, '.licell-cli');
    mkdirSync(join(globalDir, 'acme'), { recursive: true });
    writeFileSync(join(globalDir, 'auth.json'), JSON.stringify({
      accountId: '1494123412341234',
      ak: 'demo-ak',
      sk: 'demo-sk',
      region: 'cn-hangzhou'
    }, null, 2));
    writeFileSync(join(globalDir, 'config.json'), JSON.stringify({ domainSuffix: 'example.com' }, null, 2));
    writeFileSync(join(globalDir, 'acme', 'account-zerossl-production.pem'), 'pem-content');

    const {
      collectAuthTransferSnapshot,
      createEncryptedAuthTransferBundle,
      decodeAuthTransferBundle
    } = await import('../utils/auth-transfer');

    const snapshot = collectAuthTransferSnapshot();
    expect(snapshot.includedAuth).toBe(true);
    expect(snapshot.includedGlobalConfig).toBe(true);
    expect(snapshot.includedAcmeFiles).toBe(1);
    expect(snapshot.files.map((file) => file.path)).toEqual([
      'acme/account-zerossl-production.pem',
      'auth.json',
      'config.json'
    ]);

    const bundle = createEncryptedAuthTransferBundle('correct horse battery', snapshot);
    const archive = decodeAuthTransferBundle(bundle.content, 'correct horse battery');

    expect(archive.kind).toBe('licell-auth-archive');
    expect(archive.files).toHaveLength(3);
    expect(archive.files.map((file) => file.path)).toContain('auth.json');
  });

  it('restores bundle files into ~/.licell-cli', async () => {
    const {
      restoreAuthTransferArchive
    } = await import('../utils/auth-transfer');

    const archive = {
      schemaVersion: '1.0',
      kind: 'licell-auth-archive' as const,
      createdAt: '2026-03-11T00:00:00.000Z',
      files: [
        {
          path: 'auth.json',
          contentBase64: Buffer.from(JSON.stringify({
            accountId: '1494123412341234',
            ak: 'demo-ak',
            sk: 'demo-sk',
            region: 'cn-hangzhou'
          }), 'utf8').toString('base64')
        },
        {
          path: 'config.json',
          contentBase64: Buffer.from(JSON.stringify({ domainSuffix: 'example.com' }), 'utf8').toString('base64')
        },
        {
          path: 'acme/zerossl-eab.json',
          contentBase64: Buffer.from('{"kid":"kid","hmacKey":"secret"}', 'utf8').toString('base64')
        }
      ]
    };

    const result = restoreAuthTransferArchive(archive);
    expect(result.restoredFiles).toBe(3);

    const globalDir = join(homeDir, '.licell-cli');
    expect(JSON.parse(readFileSync(join(globalDir, 'auth.json'), 'utf8'))).toMatchObject({
      accountId: '1494123412341234',
      ak: 'demo-ak'
    });
    expect(JSON.parse(readFileSync(join(globalDir, 'config.json'), 'utf8'))).toMatchObject({
      domainSuffix: 'example.com'
    });
    expect(readFileSync(join(globalDir, 'acme', 'zerossl-eab.json'), 'utf8')).toContain('"kid":"kid"');
  });

  it('encodes and decodes restore token payload', async () => {
    const {
      encodeAuthTransferToken,
      decodeAuthTransferToken
    } = await import('../utils/auth-transfer');

    const token = encodeAuthTransferToken({
      schemaVersion: '1.0',
      kind: 'licell-auth-restore',
      bucket: 'licell-auth-1494123412341234-cn-hangzhou',
      key: 'auth-transfer/2026/03/11/demo.json',
      region: 'cn-hangzhou',
      signedGetUrl: 'https://example.com/demo',
      expiresAt: '2026-03-18T00:00:00.000Z',
      objectSha256: 'abc123',
      createdAt: '2026-03-11T00:00:00.000Z'
    });

    expect(token.startsWith('licell-auth-v1.')).toBe(true);
    expect(decodeAuthTransferToken(token)).toMatchObject({
      bucket: 'licell-auth-1494123412341234-cn-hangzhou',
      key: 'auth-transfer/2026/03/11/demo.json'
    });
  });

  it('normalizes persisted auth transfer bucket registry', async () => {
    const {
      buildAuthTransferBucketCandidates,
      buildAuthTransferBucketScope,
      getConfiguredAuthTransferBucket,
      setConfiguredAuthTransferBucket
    } = await import('../utils/auth-transfer');

    const scope = buildAuthTransferBucketScope('1494123412341234', 'cn-hangzhou');
    const registry = setConfiguredAuthTransferBucket(
      { ' 1494123412341234@cn-hangzhou ': ' LICELL-AUTH-1494123412341234-cn-hangzhou-abc123 ' },
      '1494123412341234',
      'cn-hangzhou',
      'licell-auth-1494123412341234-cn-hangzhou-def456'
    );

    expect(scope).toBe('1494123412341234@cn-hangzhou');
    expect(getConfiguredAuthTransferBucket(registry, '1494123412341234', 'cn-hangzhou')).toBe(
      'licell-auth-1494123412341234-cn-hangzhou-def456'
    );

    const candidates = buildAuthTransferBucketCandidates('1494123412341234', 'cn-hangzhou', 3);
    expect(candidates[0]).toBe('licell-auth-1494123412341234-cn-hangzhou');
    expect(candidates).toHaveLength(4);
    expect(new Set(candidates).size).toBe(candidates.length);
    expect(candidates.every((bucket) => bucket.length <= 63)).toBe(true);
  });

  it('rejects traversal paths during restore', async () => {
    const {
      restoreAuthTransferArchive
    } = await import('../utils/auth-transfer');

    expect(() => restoreAuthTransferArchive({
      schemaVersion: '1.0',
      kind: 'licell-auth-archive',
      createdAt: '2026-03-11T00:00:00.000Z',
      files: [
        {
          path: 'auth.json',
          contentBase64: Buffer.from(JSON.stringify({
            accountId: '1494123412341234',
            ak: 'demo-ak',
            sk: 'demo-sk',
            region: 'cn-hangzhou'
          }), 'utf8').toString('base64')
        },
        {
          path: '../escape.txt',
          contentBase64: Buffer.from('nope', 'utf8').toString('base64')
        }
      ]
    })).toThrow(/bundle 目标路径越界|bundle 文件路径非法/);
  });
});
