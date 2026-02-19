import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cac } from 'cac';
import { registerOssCommands } from '../commands/oss';

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
    getOssBucketInfo: vi.fn(),
    listOssBuckets: vi.fn(),
    listOssObjects: vi.fn(),
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
    isInteractiveTTY: vi.fn(() => false),
    toPromptValue: (value: unknown) => String(value),
    toOptionalString,
    parseListLimit: (_input: unknown, fallback: number) => fallback,
    withSpinner: async (_spinner: unknown, _startMsg: string, _failMsg: string, fn: () => Promise<unknown>) => fn()
  };
});

import { uploadDirectoryToBucket } from '../providers/oss';

const uploadDirectoryToBucketMock = uploadDirectoryToBucket as unknown as ReturnType<typeof vi.fn>;

function createCli() {
  const cli = cac('licell');
  registerOssCommands(cli);
  return cli;
}

describe('oss upload command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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

  it('maps `oss upload` args to provider call', async () => {
    const cli = createCli();
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

  it('maps `oss bucket` alias args and defaults source-dir to dist', async () => {
    const cli = createCli();
    await cli.parse([
      'node',
      'src/cli.ts',
      'oss bucket',
      '--bucket',
      'demo-bucket'
    ]);

    expect(uploadDirectoryToBucketMock).toHaveBeenCalledTimes(1);
    expect(uploadDirectoryToBucketMock).toHaveBeenCalledWith('demo-bucket', 'dist', { targetDir: undefined });
  });
});
