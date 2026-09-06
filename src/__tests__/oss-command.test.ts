import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { initOutputContext, LICELL_JSON_PREFIX } from '../utils/output';

const { ensureDestructiveActionConfirmedMock, ensureMutatingActionConfirmedMock, showOutroMock, spinnerStopMock } = vi.hoisted(() => ({
  ensureDestructiveActionConfirmedMock: vi.fn(async () => {}),
  ensureMutatingActionConfirmedMock: vi.fn(async () => {}),
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
    applyOssBucketConfig: vi.fn(),
    createOssBucket: vi.fn(),
    createOssBucketDomainToken: vi.fn(),
    deleteOssBucket: vi.fn(),
    deleteOssBucketRecursively: vi.fn(),
    deleteOssObject: vi.fn(),
    downloadOssObject: vi.fn(),
    downloadOssObjectsToDirectory: vi.fn(),
    getOssBucketInfo: vi.fn(),
    getOssObjectInfo: vi.fn(),
    inspectOssBucketConfig: vi.fn(),
    listOssBucketDomains: vi.fn(),
    listOssBuckets: vi.fn(),
    listOssObjects: vi.fn(),
    normalizeOssBucketAcl: vi.fn((value: string) => value),
    normalizeOssBucketDataRedundancyType: vi.fn((value: string) => value.toUpperCase()),
    normalizeOssBucketStorageClass: vi.fn((value: string) => value),
    planOssBucketConfig: vi.fn(),
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
    ensureMutatingActionConfirmed: ensureMutatingActionConfirmedMock,
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
  applyOssBucketConfig,
  bindOssBucketDomain,
  createOssBucket,
  createOssBucketDomainToken,
  deleteOssBucket,
  deleteOssBucketRecursively,
  deleteOssObject,
  downloadOssObject,
  downloadOssObjectsToDirectory,
  getOssBucketInfo,
  getOssObjectInfo,
  inspectOssBucketConfig,
  listOssBucketDomains,
  listOssBuckets,
  listOssObjects,
  planOssBucketConfig,
  removeOssBucketDomain,
  updateOssBucket,
  uploadDirectoryToBucket
} from '../providers/oss';

const createOssBucketMock = createOssBucket as unknown as ReturnType<typeof vi.fn>;
const applyOssBucketConfigMock = applyOssBucketConfig as unknown as ReturnType<typeof vi.fn>;
const deleteOssBucketMock = deleteOssBucket as unknown as ReturnType<typeof vi.fn>;
const updateOssBucketMock = updateOssBucket as unknown as ReturnType<typeof vi.fn>;
const deleteOssBucketRecursivelyMock = deleteOssBucketRecursively as unknown as ReturnType<typeof vi.fn>;
const deleteOssObjectMock = deleteOssObject as unknown as ReturnType<typeof vi.fn>;
const downloadOssObjectMock = downloadOssObject as unknown as ReturnType<typeof vi.fn>;
const downloadOssObjectsToDirectoryMock = downloadOssObjectsToDirectory as unknown as ReturnType<typeof vi.fn>;
const getOssBucketInfoMock = getOssBucketInfo as unknown as ReturnType<typeof vi.fn>;
const getOssObjectInfoMock = getOssObjectInfo as unknown as ReturnType<typeof vi.fn>;
const inspectOssBucketConfigMock = inspectOssBucketConfig as unknown as ReturnType<typeof vi.fn>;
const planOssBucketConfigMock = planOssBucketConfig as unknown as ReturnType<typeof vi.fn>;
const listOssBucketDomainsMock = listOssBucketDomains as unknown as ReturnType<typeof vi.fn>;
const listOssBucketsMock = listOssBuckets as unknown as ReturnType<typeof vi.fn>;
const listOssObjectsMock = listOssObjects as unknown as ReturnType<typeof vi.fn>;
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
    ensureMutatingActionConfirmedMock.mockClear();
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

    deleteOssBucketMock.mockReset();
    deleteOssBucketMock.mockResolvedValue({
      bucket: 'demo-bucket',
      deletedObjects: 0,
      deletedBucket: true
    });

    getOssBucketInfoMock.mockReset();
    getOssBucketInfoMock.mockResolvedValue({
      name: 'demo-bucket',
      location: 'cn-hangzhou',
      acl: 'private',
      publicAccessBlock: false,
      domains: []
    });

    inspectOssBucketConfigMock.mockReset();
    inspectOssBucketConfigMock.mockResolvedValue({
      bucket: 'demo-bucket',
      regionId: 'cn-shanghai',
      lifecycle: { configured: false, ruleCount: 0, rules: [] },
      cors: { configured: false, ruleCount: 0, rules: [] },
      encryption: { configured: false },
      website: { configured: false, routingRuleCount: 0 }
    });

    const configPlan = {
      bucket: 'demo-bucket',
      regionId: 'cn-shanghai',
      current: {
        bucket: 'demo-bucket',
        regionId: 'cn-shanghai',
        lifecycle: { configured: false, ruleCount: 0, rules: [] },
        cors: { configured: false, ruleCount: 0, rules: [] },
        encryption: { configured: false },
        website: { configured: false, routingRuleCount: 0 }
      },
      desiredState: { encryption: { algorithm: 'AES256' } },
      changes: [{
        section: 'encryption',
        action: 'set',
        before: { configured: false },
        after: { configured: true, algorithm: 'AES256' }
      }],
      changeCount: 1,
      requiresConfirmation: true,
      willExecute: false
    };
    planOssBucketConfigMock.mockReset();
    planOssBucketConfigMock.mockResolvedValue(configPlan);
    applyOssBucketConfigMock.mockReset();
    applyOssBucketConfigMock.mockResolvedValue({
      plan: { ...configPlan, willExecute: true },
      execution: { appliedSections: ['encryption'] },
      verify: {
        performed: true,
        matched: true,
        config: { ...configPlan.current, encryption: { configured: true, algorithm: 'AES256' } }
      }
    });

    listOssBucketsMock.mockReset();
    listOssBucketsMock.mockResolvedValue([]);

    listOssObjectsMock.mockReset();
    listOssObjectsMock.mockResolvedValue([]);

    listOssBucketDomainsMock.mockReset();
    listOssBucketDomainsMock.mockResolvedValue([]);

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
    initOutputContext('text', ['node', 'src/cli.ts']);
    consoleLogSpy.mockRestore();
  });

  it('declares a per-command region override on every OSS leaf command', async () => {
    const { ossCommandModule } = await import('../commands/oss');

    expect(ossCommandModule.declaredCommands).toHaveLength(19);
    for (const command of ossCommandModule.declaredCommands || []) {
      expect(command.options, command.rawName).toContainEqual({
        rawName: '--region <regionId>',
        description: 'OSS 地域；仅覆盖当前命令，不传则使用 licell 默认 region'
      });
    }
  });

  it('routes `oss list --region` to the provider and structured result', async () => {
    const argv = ['node', 'src/cli.ts', 'oss', 'list', '--region', 'cn-shanghai'];
    initOutputContext('json', argv);
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const cli = await createCli();
      await cli.parse(['node', 'src/cli.ts', 'oss list', '--region', 'cn-shanghai']);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(listOssBucketsMock).toHaveBeenCalledWith(50, { regionId: 'cn-shanghai' });
      const result = stdoutWriteSpy.mock.calls
        .flatMap(([chunk]) => String(chunk).split('\n'))
        .filter((line) => line.startsWith(LICELL_JSON_PREFIX))
        .map((line) => JSON.parse(line.slice(LICELL_JSON_PREFIX.length)) as Record<string, unknown>)
        .find((record) => record.type === 'result');
      expect(result).toMatchObject({
        type: 'result',
        callRegionId: 'cn-shanghai'
      });
    } finally {
      stdoutWriteSpy.mockRestore();
    }
  });

  it('passes `oss info --region` to the provider', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'oss info', 'demo-bucket', '--region', 'cn-shanghai']);

    expect(getOssBucketInfoMock).toHaveBeenCalledWith('demo-bucket', { regionId: 'cn-shanghai' });
  });

  it('routes `oss config --region` to the provider and emits its structured inspection', async () => {
    const argv = ['node', 'src/cli.ts', 'oss', 'config', 'demo-bucket', '--region', 'cn-shanghai'];
    initOutputContext('json', argv);
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const cli = await createCli();
      await cli.parse(['node', 'src/cli.ts', 'oss config', 'demo-bucket', '--region', 'cn-shanghai']);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(inspectOssBucketConfigMock).toHaveBeenCalledWith('demo-bucket', { regionId: 'cn-shanghai' });
      const result = stdoutWriteSpy.mock.calls
        .flatMap(([chunk]) => String(chunk).split('\n'))
        .filter((line) => line.startsWith(LICELL_JSON_PREFIX))
        .map((line) => JSON.parse(line.slice(LICELL_JSON_PREFIX.length)) as Record<string, unknown>)
        .find((record) => record.type === 'result');
      expect(result).toMatchObject({
        type: 'result',
        bucket: 'demo-bucket',
        regionId: 'cn-shanghai',
        lifecycle: { configured: false },
        cors: { configured: false },
        encryption: { configured: false },
        website: { configured: false, routingRuleCount: 0 }
      });
    } finally {
      stdoutWriteSpy.mockRestore();
    }
  });

  it('routes `oss config apply --dry-run` to planning without mutation or confirmation', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'oss config apply', 'demo-bucket',
      '--payload', '{"encryption":{"algorithm":"AES256"}}',
      '--region', 'cn-shanghai', '--dry-run'
    ]);

    expect(planOssBucketConfigMock).toHaveBeenCalledWith(
      'demo-bucket',
      { encryption: { algorithm: 'AES256' } },
      { regionId: 'cn-shanghai' }
    );
    expect(applyOssBucketConfigMock).not.toHaveBeenCalled();
    expect(ensureMutatingActionConfirmedMock).not.toHaveBeenCalled();
  });

  it('routes a SPA website desired-state through `oss config apply --dry-run`', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'oss config apply', 'demo-bucket',
      '--payload', '{"website":{"indexDocument":{"suffix":"index.html"},"errorDocument":{"key":"index.html","httpStatus":200}}}',
      '--region', 'cn-hangzhou', '--dry-run'
    ]);

    expect(planOssBucketConfigMock).toHaveBeenCalledWith(
      'demo-bucket',
      {
        website: {
          indexDocument: { suffix: 'index.html' },
          errorDocument: { key: 'index.html', httpStatus: 200 }
        }
      },
      { regionId: 'cn-hangzhou' }
    );
    expect(applyOssBucketConfigMock).not.toHaveBeenCalled();
  });

  it('confirms, applies and verifies `oss config apply --yes`', async () => {
    const cli = await createCli();
    await cli.parse([
      'node', 'src/cli.ts', 'oss config apply', 'demo-bucket',
      '--payload', '{"encryption":{"algorithm":"AES256"}}',
      '--region', 'cn-shanghai', '--yes'
    ]);

    expect(ensureMutatingActionConfirmedMock).toHaveBeenCalledWith(
      '应用 Bucket demo-bucket 高级配置',
      expect.objectContaining({ yes: true })
    );
    expect(applyOssBucketConfigMock).toHaveBeenCalledWith(
      'demo-bucket',
      { encryption: { algorithm: 'AES256' } },
      { regionId: 'cn-shanghai' }
    );
  });

  it('passes `oss ls --region` to the provider', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'oss ls', 'demo-bucket', '--region', 'cn-shanghai']);

    expect(listOssObjectsMock).toHaveBeenCalledWith(
      'demo-bucket',
      undefined,
      100,
      { regionId: 'cn-shanghai' }
    );
  });

  it('passes `oss domain list --region` to the provider', async () => {
    const cli = await createCli();
    await cli.parse(['node', 'src/cli.ts', 'oss domain list', 'demo-bucket', '--region', 'cn-shanghai']);

    expect(listOssBucketDomainsMock).toHaveBeenCalledWith('demo-bucket', { regionId: 'cn-shanghai' });
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
      'off',
      '--region',
      'cn-shanghai'
    ]);

    expect(createOssBucketMock).toHaveBeenCalledTimes(1);
    expect(createOssBucketMock).toHaveBeenCalledWith('demo-bucket', {
      acl: 'public-read',
      storageClass: 'ia',
      dataRedundancyType: 'ZRS',
      publicAccessBlock: false,
      regionId: 'cn-shanghai'
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
      'off',
      '--region',
      'cn-shanghai'
    ]);

    expect(updateOssBucketMock).toHaveBeenCalledTimes(1);
    expect(updateOssBucketMock).toHaveBeenCalledWith('demo-bucket', {
      acl: 'public-read',
      publicAccessBlock: false,
      regionId: 'cn-shanghai'
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
      '--region',
      'cn-shanghai',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(deleteOssBucketRecursivelyMock).toHaveBeenCalledTimes(1);
    expect(deleteOssBucketRecursivelyMock).toHaveBeenCalledWith('demo-bucket', { regionId: 'cn-shanghai' });
  });

  it('maps `oss domain token` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss domain token',
      'demo-bucket',
      'static.example.com',
      '--region',
      'cn-shanghai'
    ]);

    expect(createOssBucketDomainTokenMock).toHaveBeenCalledTimes(1);
    expect(createOssBucketDomainTokenMock).toHaveBeenCalledWith('demo-bucket', 'static.example.com', { regionId: 'cn-shanghai' });
  });

  it('maps `oss domain bind` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss domain bind',
      'demo-bucket',
      'static.example.com',
      '--region',
      'cn-shanghai'
    ]);

    expect(bindOssBucketDomainMock).toHaveBeenCalledTimes(1);
    expect(bindOssBucketDomainMock).toHaveBeenCalledWith('demo-bucket', 'static.example.com', { regionId: 'cn-shanghai' });
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
      '--region',
      'cn-shanghai',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(removeOssBucketDomainMock).toHaveBeenCalledTimes(1);
    expect(removeOssBucketDomainMock).toHaveBeenCalledWith('demo-bucket', 'static.example.com', { regionId: 'cn-shanghai' });
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
      'mysite',
      '--region',
      'cn-shanghai'
    ]);

    expect(uploadDirectoryToBucketMock).toHaveBeenCalledTimes(1);
    expect(uploadDirectoryToBucketMock).toHaveBeenCalledWith('demo-bucket', 'dist', {
      regionId: 'cn-shanghai',
      targetDir: 'mysite'
    });
  });

  it('passes `oss bucket --region` to the upload provider', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss bucket',
      'demo-bucket',
      '--source-dir',
      'dist',
      '--region',
      'cn-shanghai'
    ]);

    expect(uploadDirectoryToBucketMock).toHaveBeenCalledWith('demo-bucket', 'dist', {
      regionId: 'cn-shanghai',
      targetDir: undefined
    });
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
    expect(getOssObjectInfoMock).toHaveBeenCalledWith('demo-bucket', 'site/index.html', undefined);
  });

  it('passes `oss object info --region` to the provider without changing global config', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss object info',
      'demo-bucket',
      'site/index.html',
      '--region',
      'cn-shanghai'
    ]);

    expect(getOssObjectInfoMock).toHaveBeenCalledWith(
      'demo-bucket',
      'site/index.html',
      { regionId: 'cn-shanghai' }
    );
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
    expect(downloadOssObjectMock).toHaveBeenCalledWith('demo-bucket', 'site/index.html', './index.html', undefined);
  });

  it('passes `oss object get --region` to the provider', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss object get',
      'demo-bucket',
      'site/index.html',
      './index.html',
      '--region',
      'cn-shanghai'
    ]);

    expect(downloadOssObjectMock).toHaveBeenCalledWith(
      'demo-bucket',
      'site/index.html',
      './index.html',
      { regionId: 'cn-shanghai' }
    );
  });

  it('maps `oss object rm --yes` args to provider call', async () => {
    const cli = await createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss object rm',
      'demo-bucket',
      'site/old.js',
      '--region',
      'cn-shanghai',
      '--yes'
    ]);

    expect(ensureDestructiveActionConfirmedMock).toHaveBeenCalledTimes(1);
    expect(deleteOssObjectMock).toHaveBeenCalledTimes(1);
    expect(deleteOssObjectMock).toHaveBeenCalledWith('demo-bucket', 'site/old.js', { regionId: 'cn-shanghai' });
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
      './downloads/site',
      '--region',
      'cn-shanghai'
    ]);

    expect(downloadOssObjectsToDirectoryMock).toHaveBeenCalledTimes(1);
    expect(downloadOssObjectsToDirectoryMock).toHaveBeenCalledWith('demo-bucket', './downloads/site', {
      regionId: 'cn-shanghai',
      prefix: 'site'
    });
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
      'site',
      '--region',
      'cn-shanghai'
    ]);

    expect(uploadDirectoryToBucketMock).toHaveBeenCalledTimes(1);
    expect(uploadDirectoryToBucketMock).toHaveBeenCalledWith('demo-bucket', 'dist', {
      regionId: 'cn-shanghai',
      targetDir: 'site'
    });
  });
});
