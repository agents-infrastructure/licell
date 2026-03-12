import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { seedE2eChildHome } from '../commands/e2e';

describe('seedE2eChildHome', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('copies auth, strips domainSuffix, and reuses acme state', () => {
    const workspaceDir = mkdtempSync(join(tmpdir(), 'licell-e2e-env-'));
    const acmeSourceDir = join(workspaceDir, 'source-acme');
    tempDirs.push(workspaceDir);

    mkdirSync(acmeSourceDir, { recursive: true });
    writeFileSync(join(acmeSourceDir, 'account.json'), '{"kid":"test"}\n');

    const homeDir = seedE2eChildHome(workspaceDir, {
      auth: {
        accountId: '1494910986361453',
        ak: 'test-ak',
        sk: 'test-sk',
        region: 'cn-hangzhou'
      },
      globalConfig: {
        domainSuffix: 'bazhuayu.xyz',
        authTransferBuckets: {
          '1494910986361453:cn-hangzhou': 'licell-auth-bucket'
        }
      },
      sourceAcmeDir: acmeSourceDir
    });

    const auth = JSON.parse(readFileSync(join(homeDir, '.licell-cli', 'auth.json'), 'utf8')) as Record<string, unknown>;
    const config = JSON.parse(readFileSync(join(homeDir, '.licell-cli', 'config.json'), 'utf8')) as Record<string, unknown>;

    expect(auth.accountId).toBe('1494910986361453');
    expect(config).toEqual({
      authTransferBuckets: {
        '1494910986361453:cn-hangzhou': 'licell-auth-bucket'
      }
    });
    expect(existsSync(join(homeDir, '.licell-cli', 'acme', 'account.json'))).toBe(true);
  });
});
