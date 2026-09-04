import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cachedAlicloudRunnerPath,
  ensureAlicloudRunner,
  findExecutableOnPath
} from '../providers/openapi/runner-manager';
import type { AlicloudRunnerArtifact } from '../providers/openapi/runner-manifest';
import { resolveAlicloudRunner } from '../providers/openapi/runner';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'licell-runner-test-'));
  roots.push(root);
  return root;
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function fixtureArtifact(archive: string, binary: string): AlicloudRunnerArtifact {
  return {
    platform: 'linux-x64',
    url: 'https://example.test/aliyun.tgz',
    archiveSha256: hash(archive),
    binarySha256: hash(binary)
  };
}

describe('aliyun cli runner manager', () => {
  it('downloads, verifies, installs, and then reuses the cached runner', async () => {
    const root = tempRoot();
    const archive = 'fixture archive';
    const binary = '#!/bin/sh\necho 3.4.11\n';
    const artifact = fixtureArtifact(archive, binary);
    const fetchImpl = vi.fn(async () => new Response(archive)) as unknown as typeof fetch;
    const extractArchive = vi.fn(async (_archivePath: string, targetDir: string) => {
      writeFileSync(join(targetDir, 'aliyun'), binary);
    });

    const first = await ensureAlicloudRunner({
      installRoot: root,
      artifact,
      version: 'test',
      fetchImpl,
      extractArchive
    });
    const second = await ensureAlicloudRunner({
      installRoot: root,
      artifact,
      version: 'test',
      fetchImpl,
      extractArchive
    });

    expect(first).toBe(cachedAlicloudRunnerPath({ installRoot: root, artifact, version: 'test' }));
    expect(second).toBe(first);
    expect(existsSync(first)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(extractArchive).toHaveBeenCalledOnce();
  });

  it('rejects an archive whose checksum differs from the manifest', async () => {
    const root = tempRoot();
    const artifact = fixtureArtifact('expected archive', 'runner');

    await expect(ensureAlicloudRunner({
      installRoot: root,
      artifact,
      version: 'test',
      fetchImpl: (async () => new Response('tampered archive')) as unknown as typeof fetch,
      extractArchive: async () => undefined
    })).rejects.toThrow('压缩包 SHA-256 校验失败');

    expect(existsSync(cachedAlicloudRunnerPath({ installRoot: root, artifact, version: 'test' }))).toBe(false);
  });

  it('shares one installation across concurrent callers', async () => {
    const root = tempRoot();
    const archive = 'fixture archive';
    const binary = '#!/bin/sh\necho runner\n';
    const artifact = fixtureArtifact(archive, binary);
    const fetchImpl = vi.fn(async () => {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 20));
      return new Response(archive);
    }) as unknown as typeof fetch;
    const extractArchive = async (_archivePath: string, targetDir: string) => {
      writeFileSync(join(targetDir, 'aliyun'), binary);
    };

    const options = { installRoot: root, artifact, version: 'test', fetchImpl, extractArchive };
    const [first, second] = await Promise.all([
      ensureAlicloudRunner(options),
      ensureAlicloudRunner(options)
    ]);

    expect(second).toBe(first);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('finds an executable already installed on PATH', async () => {
    const root = tempRoot();
    const executable = join(root, 'aliyun');
    writeFileSync(executable, '#!/bin/sh\n');
    chmodSync(executable, 0o755);

    await expect(findExecutableOnPath('aliyun', { PATH: root })).resolves.toBe(executable);
  });

  it('prefers a globally installed aliyun before the managed cache', async () => {
    const root = tempRoot();
    const executable = join(root, 'aliyun');
    writeFileSync(executable, '#!/bin/sh\n');
    chmodSync(executable, 0o755);
    const previousPath = process.env.PATH;
    process.env.PATH = root;
    try {
      await expect(resolveAlicloudRunner()).resolves.toBe(executable);
    } finally {
      process.env.PATH = previousPath;
    }
  });

  it('uses the configured runner before PATH discovery', async () => {
    const root = tempRoot();
    const configured = join(root, 'configured-aliyun');
    writeFileSync(configured, '#!/bin/sh\n');
    chmodSync(configured, 0o755);

    await expect(resolveAlicloudRunner(undefined, {
      env: { PATH: '', LICELL_ALIYUN_BIN: configured },
      ensureRunner: vi.fn(async () => join(root, 'managed-aliyun'))
    })).resolves.toBe(configured);
  });

  it('falls back to the managed runner when PATH has no aliyun executable', async () => {
    const root = tempRoot();
    const managed = join(root, 'managed-aliyun');
    const ensureRunner = vi.fn(async () => managed);

    await expect(resolveAlicloudRunner(undefined, {
      env: { PATH: '' },
      ensureRunner
    })).resolves.toBe(managed);
    expect(ensureRunner).toHaveBeenCalledOnce();
  });
});
