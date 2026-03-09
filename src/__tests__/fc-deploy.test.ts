import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const {
  mockGetProject,
  mockCreateFcClient,
  mockEnsureFunctionHttpUrl,
  mockValidateRuntimeEntrypoint,
  mockPrepareBootFile,
  mockResolveFunctionVpcConfig,
  mockResolveRuntimeConfig,
  mockCallFcWithGuard,
  mockWaitForFcFunctionReadable
} = vi.hoisted(() => ({
  mockGetProject: vi.fn(),
  mockCreateFcClient: vi.fn(),
  mockEnsureFunctionHttpUrl: vi.fn(),
  mockValidateRuntimeEntrypoint: vi.fn(),
  mockPrepareBootFile: vi.fn(),
  mockResolveFunctionVpcConfig: vi.fn(),
  mockResolveRuntimeConfig: vi.fn(),
  mockCallFcWithGuard: vi.fn(),
  mockWaitForFcFunctionReadable: vi.fn()
}));

vi.mock('../utils/config', () => ({
  Config: {
    getProject: mockGetProject
  }
}));

vi.mock('../providers/fc/client', () => ({
  createFcClient: mockCreateFcClient
}));

vi.mock('../providers/fc/http', () => ({
  ensureFunctionHttpUrl: mockEnsureFunctionHttpUrl
}));

vi.mock('../providers/fc/runtime-utils', () => ({
  validateRuntimeEntrypoint: mockValidateRuntimeEntrypoint
}));

vi.mock('../providers/fc/runtime', () => ({
  buildUnsupportedRuntimeMessage: (runtime: string) => `unsupported:${runtime}`,
  isInvalidRuntimeValueError: () => false,
  isRuntimeChangeNotSupportedError: () => false,
  prepareBootFile: mockPrepareBootFile,
  resolveFunctionVpcConfig: mockResolveFunctionVpcConfig,
  resolveRuntimeConfig: mockResolveRuntimeConfig
}));

vi.mock('../providers/fc/request-guard', () => ({
  callFcWithGuard: mockCallFcWithGuard,
  isFcOperationTimeoutError: (err: unknown) => Boolean(err && typeof err === 'object' && (err as { name?: unknown }).name === 'FcOperationTimeoutError'),
  waitForFcFunctionReadable: mockWaitForFcFunctionReadable
}));

import { deployFC } from '../providers/fc/deploy';

describe('deployFC', () => {
  let originalCwd = '';
  let workdir = '';

  beforeEach(() => {
    vi.clearAllMocks();
    originalCwd = process.cwd();
    workdir = mkdtempSync(join(tmpdir(), 'licell-fc-deploy-test-'));
    mkdirSync(join(workdir, 'src'), { recursive: true });
    writeFileSync(join(workdir, 'src/index.ts'), 'export const handler = () => ({ ok: true });\n');
    process.chdir(workdir);

    mockGetProject.mockReturnValue({ envs: {}, resources: {}, network: undefined });
    mockCreateFcClient.mockReturnValue({ client: {} });
    mockEnsureFunctionHttpUrl.mockResolvedValue('https://demo-app.fcapp.run');
    mockValidateRuntimeEntrypoint.mockReturnValue(undefined);
    mockPrepareBootFile.mockResolvedValue(join(workdir, '.licell/dist/index.mjs'));
    mockResolveFunctionVpcConfig.mockResolvedValue(undefined);
    mockResolveRuntimeConfig.mockResolvedValue({
      runtime: 'nodejs22',
      handler: 'index.handler',
      skipCodePackaging: true
    });
    mockWaitForFcFunctionReadable.mockResolvedValue({
      functionName: 'demo-app',
      lastModifiedTime: '2'
    });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (workdir) rmSync(workdir, { recursive: true, force: true });
  });

  it('updates an existing function instead of creating it again', async () => {
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string) => {
      if (methodName === 'getFunction') {
        return {
          body: {
            functionName: 'demo-app',
            lastModifiedTime: '1'
          }
        };
      }
      if (methodName === 'updateFunction') {
        return { body: {} };
      }
      throw new Error(`unexpected method: ${methodName}`);
    });

    const url = await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(url).toBe('https://demo-app.fcapp.run');
    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual(['getFunction', 'updateFunction']);
    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledTimes(2);
  });

  it('creates a function when it does not exist yet', async () => {
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string) => {
      if (methodName === 'getFunction') {
        const err = new Error('function missing');
        (err as Error & { code?: string }).code = 'FunctionNotFound';
        throw err;
      }
      if (methodName === 'createFunction') {
        return { body: {} };
      }
      throw new Error(`unexpected method: ${methodName}`);
    });

    const url = await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(url).toBe('https://demo-app.fcapp.run');
    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual(['getFunction', 'createFunction']);
    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledTimes(1);
  });
});
