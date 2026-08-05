import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';

const { spawnSyncMock, executeWithAuthRecoveryMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
  executeWithAuthRecoveryMock: vi.fn()
}));

vi.mock('child_process', async (importOriginal) => ({
  ...await importOriginal<typeof import('child_process')>(),
  spawnSync: spawnSyncMock
}));
vi.mock('../utils/auth-recovery', async (importOriginal) => ({
  ...await importOriginal<typeof import('../utils/auth-recovery')>(),
  executeWithAuthRecovery: executeWithAuthRecoveryMock
}));

import { Config } from '../utils/config';
import { runWithInvocationRegion } from '../utils/region-context';
import {
  cleanupByManifest,
  executeE2eRun,
  seedE2eChildHome
} from '../commands/e2e';
import { getE2eManifestPath, type E2eManifest } from '../utils/e2e';

describe('e2e region lifecycle', () => {
  let root: string;
  let workspaceDir: string;
  let previousCwd: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'licell-e2e-region-life-'));
    workspaceDir = join(root, `workspace-${basename(root)}`);
    previousCwd = process.cwd();
    process.chdir(root);
    vi.stubEnv('HOME', root);
    spawnSyncMock.mockReset();
    executeWithAuthRecoveryMock.mockReset();
    executeWithAuthRecoveryMock.mockImplementation(async (_input: unknown, task: () => unknown) => await task());
    vi.spyOn(Config, 'getAuth').mockReturnValue({
      accountId: '1494910986361453',
      ak: 'raw-ak',
      sk: 'raw-sk',
      region: 'cn-hangzhou'
    });
    vi.spyOn(Config, 'requireAuth').mockReturnValue({
      accountId: '1494910986361453',
      ak: 'raw-ak',
      sk: 'raw-sk',
      region: 'cn-shanghai'
    });
    vi.spyOn(Config, 'getDefaultRegion').mockReturnValue('cn-hangzhou');
    vi.spyOn(Config, 'getGlobalConfig').mockReturnValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
    rmSync(join('/tmp', 'licell-e2e-tmp', basename(workspaceDir)), { recursive: true, force: true });
    rmSync(join('/tmp', 'licell-e2e-bun-cache', basename(workspaceDir)), { recursive: true, force: true });
  });

  it('prepares the run home once and preserves child auth repair across later spawns', async () => {
    const runId = `region-life-${Date.now()}`;
    let licellSpawnCount = 0;
    spawnSyncMock.mockImplementation((command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) => {
      if (command === 'bun') return { status: 0, signal: null };
      licellSpawnCount += 1;
      if (args.includes('init')) {
        mkdirSync(join(options.cwd, '.licell'), { recursive: true });
        writeFileSync(join(options.cwd, '.licell', 'project.json'), JSON.stringify({
          appName: `licell-e2e-${runId}`,
          runtime: 'nodejs22',
          envs: {}
        }));
        writeFileSync(join(options.env.HOME!, '.licell-cli', 'auth.json'), JSON.stringify({
          accountId: '1494910986361453',
          ak: 'repaired-ak',
          sk: 'repaired-sk',
          region: 'cn-shanghai'
        }));
        return { status: 0, signal: null };
      }
      return { status: 1, signal: null };
    });

    await expect(runWithInvocationRegion(
      { scope: 'auth', regionId: 'cn-shanghai', resolveFallbackRegion: () => 'cn-hangzhou' },
      () => executeE2eRun({ runId, workspace: workspaceDir, cleanup: true, yes: true })
    )).rejects.toThrow('命令失败');

    expect(licellSpawnCount).toBe(2);
    const childAuth = JSON.parse(readFileSync(
      join('/tmp', 'licell-e2e-tmp', basename(workspaceDir), 'home', '.licell-cli', 'auth.json'),
      'utf8'
    ));
    expect(childAuth).toMatchObject({ ak: 'repaired-ak', region: 'cn-shanghai' });
    const deployCall = spawnSyncMock.mock.calls.find((call) => (call[1] as string[]).includes('deploy'));
    expect(deployCall?.[1]).toEqual(expect.arrayContaining(['--region', 'cn-shanghai']));

    const manifest = JSON.parse(readFileSync(getE2eManifestPath(runId, root), 'utf8')) as E2eManifest;
    expect(manifest.region).toBe('cn-shanghai');
    expect(manifest.steps.find((step) => step.name === 'deploy-api')?.command).toContain('--region cn-shanghai');
    expect(executeWithAuthRecoveryMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes a standalone cleanup home once from raw auth and preserves existing ACME state', async () => {
    mkdirSync(workspaceDir, { recursive: true });
    const homeDir = seedE2eChildHome(workspaceDir);
    const authPath = join(homeDir, '.licell-cli', 'auth.json');
    const acmePath = join(homeDir, '.licell-cli', 'acme', 'account.json');
    mkdirSync(join(homeDir, '.licell-cli', 'acme'), { recursive: true });
    writeFileSync(acmePath, '{"kid":"child-repaired"}\n');
    writeFileSync(authPath, JSON.stringify({
      accountId: '1494910986361453',
      ak: 'stale-ak',
      sk: 'stale-sk',
      region: 'cn-beijing'
    }));
    const manifest: E2eManifest = {
      runId: 'cleanup-region-life',
      suite: 'smoke',
      status: 'failed',
      createdAt: '2026-08-05T00:00:00.000Z',
      updatedAt: '2026-08-05T00:00:00.000Z',
      projectRoot: root,
      workspaceDir,
      target: 'preview',
      runtime: 'nodejs22',
      region: 'cn-shanghai',
      resources: {},
      steps: []
    };

    await cleanupByManifest(manifest, { yes: true, keepWorkspace: true });

    expect(JSON.parse(readFileSync(authPath, 'utf8'))).toMatchObject({
      ak: 'raw-ak',
      region: 'cn-hangzhou'
    });
    expect(readFileSync(acmePath, 'utf8')).toContain('child-repaired');
    expect(executeWithAuthRecoveryMock).toHaveBeenCalledTimes(1);
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });
});
