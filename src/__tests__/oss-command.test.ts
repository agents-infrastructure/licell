import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';

const { ensureDestructiveActionConfirmedMock, showOutroMock, spinnerStopMock } = vi.hoisted(() => ({
  ensureDestructiveActionConfirmedMock: vi.fn(async () => {}),
  showOutroMock: vi.fn(),
  spinnerStopMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn()
  })
}));

vi.mock('../providers/oss', async () => {
  return {
    bindOssBucketDomain: vi.fn(),
    createOssBucket: vi.fn(),
    createOssBucketDomainToken: vi.fn(),
    deleteOssBucket: vi.fn(),
    deleteOssBucketRecursively: vi.fn(),
    deleteOssObject: vi.fn(),
    downloadOssObject: vi.fn(),
    downloadOssObjectsToDirectory: vi.fn(),
    getOssBucketInfo: vi.fn(),
    getOssObjectInfo: vi.fn(),
    listOssBucketDomains: vi.fn(),
    listOssBuckets: vi.fn(),
    listOssObjects: vi.fn(),
    normalizeOssBucketAcl: vi.fn((value: string) => value),
    normalizeOssBucketDataRedundancyType: vi.fn((value: string) => value.toUpperCase()),
    normalizeOssBucketStorageClass: vi.fn((value: string) => value),
    removeOssBucketDomain: vi.fn(),
    resolveDefaultOssDownloadDir: vi.fn((bucket: string) => `oss-download/${bucket}`),
    resolveDefaultOssDownloadFilePath: vi.fn(() => 'index.html'),
    updateOssBucket: vi.fn(),
    uploadDirectoryToBucket: vi.fn()
  };
});

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: async (_options: unknown, task: () => Promise<unknown>) => task()
}));


vi.mock('../utils/cli-shared', () => {
  const toOptionalString = (input: unknown) => {
    if (input === null || input === undefined) return undefined;
    const value = String(input).trim();
    return value.length > 0 ? value : undefined;
  };
  return {
    ensureAuthOrExit: vi.fn(),
    ensureDestructiveActionConfirmed: ensureDestructiveActionConfirmedMock,
    normalizeCustomDomain: (value: string) => value.trim().toLowerCase(),
    createSpinner: () => ({
      start: vi.fn(),
      stop: spinnerStopMock,
      message: vi.fn()
    }),
    isInteractiveTTY: vi.fn(() => false),
    showOutro: showOutroMock,
    toPromptValue: (value: unknown) => String(value),
    toOptionalString,
    parseListLimit: (_input: unknown, fallback: number) => fallback,
    withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
  };
});

import {
  bindOssBucketDomain,
  createOssBucket,
  createOssBucketDomainToken,
  deleteOssBucketRecursively,
  deleteOssObject,
  downloadOssObject,
  downloadOssObjectsToDirectory,
  getOssObjectInfo,
  removeOssBucketDomain,
  updateOssBucket,
  uploadDirectoryToBucket
} from '../providers/oss';

const createOssBucketMock = createOssBucket as unknown as ReturnType<typeof vi.fn>;
const updateOssBucketMock = updateOssBucket as unknown as ReturnType<typeof vi.fn>;
const deleteOssBucketRecursivelyMock = deleteOssBucketRecursively as unknown as ReturnType<typeof vi.fn>;
const deleteOssObjectMock = deleteOssObject as unknown as ReturnType<typeof vi.fn>;
const downloadOssObjectMock = downloadOssObject as unknown as ReturnType<typeof vi.fn>;
const downloadOssObjectsToDirectoryMock = downloadOssObjectsToDirectory as unknown as ReturnType<typeof vi.fn>;
const getOssObjectInfoMock = getOssObjectInfo as unknown as ReturnType<typeof vi.fn>;
const createOssBucketDomainTokenMock = createOssBucketDomainToken as unknown as ReturnType<typeof vi.fn>;
const bindOssBucketDomainMock = bindOssBucketDomain as unknown as ReturnType<typeof vi.fn>;
const removeOssBucketDomainMock = removeOssBucketDomain as unknown as ReturnType<typeof vi.fn>;
const uploadDirectoryToBucketMock = uploadDirectoryToBucket as unknown as ReturnType<typeof vi.fn>;

async function createCli() {
  const cli = cac('licell');
  const { registerOssCommands } = await import('../commands/oss');
  registerOssCommands(cli);
  return cli;
}

describe('oss commands', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    ensureDestructiveActionConfirmedMock.mockClear();
    showOutroMock.mockClear();
    spinnerStopMock.mockClear();

    createOssBucketMock.mockReset();
    createOssBucketMock.mockResolvedValue({
      bucket: 'demo-bucket',
      created: true,
      info: {
        name: 'demo-bucket',
        location: 'cn-hangzhou',
        acl: 'private',
        publicAccessBlock: false,
        domains: []
      }
    });

    updateOssBucketMock.mockReset();
    updateOssBucketMock.mockResolvedValue({
      name: 'demo-bucket',
      location: 'cn-hangzhou',
      acl: 'public-read',
      publicAccessBlock: false,
      domains: []
    });

    deleteOssBucketRecursivelyMock.mockReset();
    deleteOssBucketRecursivelyMock.mockResolvedValue({
      bucket: 'demo-bucket',
      deletedObjects: 3,
      deletedBucket: true
    });

    createOssBucketDomainTokenMock.mockReset();
    createOssBucketDomainTokenMock.mockResolvedValue({
      bucket: 'demo-bucket',
      cname: 'static.example.com',
      token: 'verify-token',
      expireTime: '2026-03-08T00:00:00Z'
    });

    bindOssBucketDomainMock.mockReset();
    bindOssBucketDomainMock.mockResolvedValue({
      domain: 'static.example.com',
      status: 'Enabled',
      lastModified: '2026-03-07T10:00:00Z'
    });

    removeOssBucketDomainMock.mockReset();
    removeOssBucketDomainMock.mockResolvedValue(true);

    getOssObjectInfoMock.mockReset();
    getOssObjectInfoMock.mockResolvedValue({
      bucket: 'demo-bucket',
      key: 'site/index.html',
      name: 'site/index.html',
      size: 128,
      contentLength: 128,
      contentType: 'text/html; charset=utf-8',
      etag: 'etag-demo',
      lastModified: '2026-03-07T10:00:00Z',
      storageClass: 'Standard',
      metadata: {}
    });

    downloadOssObjectMock.mockReset();
    downloadOssObjectMock.mockResolvedValue({
      bucket: 'demo-bucket',
      key: 'site/index.html',
      filePath: './index.html',
      contentLength: 128,
      contentType: 'text/html; charset=utf-8',
      etag: 'etag-demo'
    });

    deleteOssObjectMock.mockReset();
    deleteOssObjectMock.mockResolvedValue({
      bucket: 'demo-bucket',
      key: 'site/old.js',
      deleted: true
    });

    downloadOssObjectsToDirectoryMock.mockReset();
    downloadOssObjectsToDirectoryMock.mockResolvedValue({
      bucket: 'demo-bucket',
      prefix: 'site',
      destinationDir: './downloads/site',
      downloadedCount: 2,
      skippedPlaceholderCount: 0
    });

    uploadDirectoryToBucketMock.mockReset();
    uploadDirectoryToBucketMock.mockResolvedValue({
      bucket: 'demo-bucket',
      targetDir: undefined,
      uploadedCount: 2,
      baseUrl: 'https://demo-bucket.oss-cn-hangzhou.aliyuncs.com',
      skippedSymlinkCount: 0
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('maps `oss create` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss create',
      'demo-bucket',
      '--acl',
      'public-read',
      '--storage-class',
      'ia',
      '--redundancy',
      'zrs',
      '--public-access-block',
      'off'
    ]);

    expect(createOssBucketMock).toHaveBeenCalledTimes(1);
    expect(createOssBucketMock).toHaveBeenCalledWith('demo-bucket', {
      acl: 'public-read',
      storageClass: 'ia',
      dataRedundancyType: 'ZRS',
      publicAccessBlock: false
    });
  });

  it('maps `oss update` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss update',
      'demo-bucket',
      '--acl',
      'public-read',
      '--public-access-block',
      'off'
    ]);

    expect(updateOssBucketMock).toHaveBeenCalledTimes(1);
    expect(updateOssBucketMock).toHaveBeenCalledWith('demo-bucket', {
      acl: 'public-read',
      publicAccessBlock: false
    });
  });

  it('maps `oss rm --recursive --yes` to recursive delete flow', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss rm',
      'demo-bucket',
      '--recursive',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(deleteOssBucketRecursivelyMock).toHaveBeenCalledTimes(1);
    expect(deleteOssBucketRecursivelyMock).toHaveBeenCalledWith('demo-bucket');
  });

  it('maps `oss domain token` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss domain token',
      'demo-bucket',
      'static.example.com'
    ]);

    expect(createOssBucketDomainTokenMock).toHaveBeenCalledTimes(1);
    expect(createOssBucketDomainTokenMock).toHaveBeenCalledWith('demo-bucket', 'static.example.com');
  });

  it('maps `oss domain bind` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss domain bind',
      'demo-bucket',
      'static.example.com'
    ]);

    expect(bindOssBucketDomainMock).toHaveBeenCalledTimes(1);
    expect(bindOssBucketDomainMock).toHaveBeenCalledWith('demo-bucket', 'static.example.com');
  });


  it('accepts `oss domain unbind` when domain binding is already absent', async () => {
    removeOssBucketDomainMock.mockResolvedValue(false);
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss domain unbind',
      'demo-bucket',
      'static.example.com',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(removeOssBucketDomainMock).toHaveBeenCalledTimes(1);
    expect(removeOssBucketDomainMock).toHaveBeenCalledWith('demo-bucket', 'static.example.com');
  });

  it('maps `oss upload` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss upload',
      'demo-bucket',
      '--source-dir',
      'dist',
      '--target-dir',
      'mysite'
    ]);

    expect(uploadDirectoryToBucketMock).toHaveBeenCalledTimes(1);
    expect(uploadDirectoryToBucketMock).toHaveBeenCalledWith('demo-bucket', 'dist', { targetDir: 'mysite' });
  });

  it('maps `oss object info` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss object info',
      'demo-bucket',
      'site/index.html'
    ]);

    expect(getOssObjectInfoMock).toHaveBeenCalledTimes(1);
    expect(getOssObjectInfoMock).toHaveBeenCalledWith('demo-bucket', 'site/index.html');
  });

  it('maps `oss object get` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss object get',
      'demo-bucket',
      'site/index.html',
      './index.html'
    ]);

    expect(downloadOssObjectMock).toHaveBeenCalledTimes(1);
    expect(downloadOssObjectMock).toHaveBeenCalledWith('demo-bucket', 'site/index.html', './index.html');
  });

  it('maps `oss object rm --yes` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss object rm',
      'demo-bucket',
      'site/old.js',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(deleteOssObjectMock).toHaveBeenCalledTimes(1);
    expect(deleteOssObjectMock).toHaveBeenCalledWith('demo-bucket', 'site/old.js');
  });

  it('maps `oss sync down` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss sync down',
      'demo-bucket',
      'site',
      '--dest-dir',
      './downloads/site'
    ]);

    expect(downloadOssObjectsToDirectoryMock).toHaveBeenCalledTimes(1);
    expect(downloadOssObjectsToDirectoryMock).toHaveBeenCalledWith('demo-bucket', './downloads/site', { prefix: 'site' });
  });

  it('maps `oss sync up` args to upload provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss sync up',
      'demo-bucket',
      '--source-dir',
      'dist',
      '--target-dir',
      'site'
    ]);

    expect(uploadDirectoryToBucketMock).toHaveBeenCalledTimes(1);
    expect(uploadDirectoryToBucketMock).toHaveBeenCalledWith('demo-bucket', 'dist', { targetDir: 'site' });
  });
});
