import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSpawnSync } = vi.hoisted(() => ({
  mockSpawnSync: vi.fn()
}));

vi.mock('child_process', () => ({
  spawnSync: mockSpawnSync
}));

import { dockerBuild, dockerLogin, dockerPush, setDockerRetrySleepForTest } from '../utils/docker';

describe('docker utils retry behavior', () => {
  afterEach(() => {
    vi.clearAllMocks();
    setDockerRetrySleepForTest(null);
  });

  it('disables build attestations for FC-compatible amd64 images', () => {
    mockSpawnSync.mockReturnValueOnce({ status: 0 });

    dockerBuild('registry.cn-hangzhou.aliyuncs.com/licell/demo:tag', '/tmp/demo', '/tmp/demo/Dockerfile');

    expect(mockSpawnSync).toHaveBeenCalledWith(
      'docker',
      [
        'build',
        '--platform',
        'linux/amd64',
        '--provenance=false',
        '--sbom=false',
        '-f',
        '/tmp/demo/Dockerfile',
        '-t',
        'registry.cn-hangzhou.aliyuncs.com/licell/demo:tag',
        '/tmp/demo'
      ],
      {
        stdio: 'inherit',
        timeout: 600_000
      }
    );
  });

  it('retries docker login before failing the deploy', () => {
    const sleeps: number[] = [];
    setDockerRetrySleepForTest((ms) => { sleeps.push(ms); });
    mockSpawnSync
      .mockReturnValueOnce({ status: 1, stderr: Buffer.from('socket hang up') })
      .mockReturnValueOnce({ status: 0, stderr: Buffer.from('') });

    dockerLogin('registry.cn-hangzhou.aliyuncs.com', 'user', 'pass');

    expect(mockSpawnSync).toHaveBeenCalledTimes(2);
    expect(sleeps).toEqual([1000]);
  });

  it('retries docker push before failing the deploy', () => {
    const sleeps: number[] = [];
    setDockerRetrySleepForTest((ms) => { sleeps.push(ms); });
    mockSpawnSync
      .mockReturnValueOnce({ status: 1 })
      .mockReturnValueOnce({ status: 1 })
      .mockReturnValueOnce({ status: 0 });

    dockerPush('registry.cn-hangzhou.aliyuncs.com/licell/demo:tag');

    expect(mockSpawnSync).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([1000, 2000]);
  });
});
