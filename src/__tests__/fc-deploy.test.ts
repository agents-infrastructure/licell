import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { computeDeploymentMarker, LICELL_INTERNAL_DEPLOY_MARKER_ENV } from '../providers/fc/deployment-probe';

const {
  mockGetProject,
  mockCreateFcClient,
  mockEnsureFunctionHttpUrl,
  mockValidateRuntimeEntrypoint,
  mockPrepareBootFile,
  mockResolveFunctionVpcConfig,
  mockResolveRuntimeConfig,
  mockEnsureDefaultFcSlsLogConfig,
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
  mockEnsureDefaultFcSlsLogConfig: vi.fn(),
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

vi.mock('../providers/logs', () => ({
  ensureDefaultFcSlsLogConfig: mockEnsureDefaultFcSlsLogConfig
}));

vi.mock('../providers/fc/request-guard', () => ({
  callFcWithGuard: mockCallFcWithGuard,
  isFcOperationTimeoutError: (err: unknown) => Boolean(err && typeof err === 'object' && (err as { name?: unknown }).name === 'FcOperationTimeoutError'),
  waitForFcFunctionReadable: mockWaitForFcFunctionReadable
}));

import { deployFC } from '../providers/fc/deploy';

const expectedDeploymentMarker = computeDeploymentMarker(JSON.stringify({
  runtime: 'nodejs22',
  handler: 'index.handler',
  customRuntimeConfig: null,
  customContainerConfig: null
}));
const expectedLogConfig = {
  project: 'aliyun-fc-cn-hangzhou-123456',
  logstore: 'function-log',
  enableRequestMetrics: true,
  enableInstanceMetrics: true
};

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
    mockEnsureDefaultFcSlsLogConfig.mockResolvedValue(expectedLogConfig);
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

    const result = await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(result.url).toBe('https://demo-app.fcapp.run');
    expect(result.deploymentMarker).toMatch(/^[a-f0-9]{24}$/);
    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual(['getFunction', 'getFunction', 'updateFunction']);
    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledTimes(1);
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

    const result = await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(result.url).toBe('https://demo-app.fcapp.run');
    expect(result.deploymentMarker).toMatch(/^[a-f0-9]{24}$/);
    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual(['getFunction', 'createFunction']);
    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledTimes(1);
  });

  it('enables default FC SLS logs when creating a function', async () => {
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string, args: any[]) => {
      if (methodName === 'getFunction') {
        const err = new Error('function missing');
        (err as Error & { code?: string }).code = 'FunctionNotFound';
        throw err;
      }
      if (methodName === 'createFunction') {
        const createBody = args[0]?.body as Record<string, unknown>;
        expect(createBody.logConfig).toEqual(expectedLogConfig);
        return { body: {} };
      }
      throw new Error(`unexpected method: ${methodName}`);
    });

    await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(mockEnsureDefaultFcSlsLogConfig).toHaveBeenCalledTimes(1);
  });

  it('keeps default FC SLS logs enabled when updating a function', async () => {
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string, args: any[]) => {
      if (methodName === 'getFunction') {
        return {
          body: {
            functionName: 'demo-app',
            lastModifiedTime: '1'
          }
        };
      }
      if (methodName === 'updateFunction') {
        const updateBody = args[1]?.body as Record<string, unknown>;
        expect(updateBody.logConfig).toEqual(expectedLogConfig);
        return { body: {} };
      }
      throw new Error(`unexpected method: ${methodName}`);
    });

    await deployFC('demo-app', 'src/index.ts', 'nodejs22');
  });

  it('uses configured FC disk size in function updates', async () => {
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string, args: any[]) => {
      if (methodName === 'getFunction') {
        return {
          body: {
            functionName: 'demo-app',
            lastModifiedTime: '1'
          }
        };
      }
      if (methodName === 'updateFunction') {
        const updateBody = args[1]?.body as Record<string, unknown>;
        expect(updateBody.diskSize).toBe(10240);
        return { body: {} };
      }
      throw new Error(`unexpected method: ${methodName}`);
    });

    await deployFC('demo-app', 'src/index.ts', 'nodejs22', {
      resources: { diskSize: 10240 }
    });
  });

  it('recovers createFunction EPIPE by reading converged function state', async () => {
    let readableCalls = 0;
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string) => {
      if (methodName === 'getFunction') {
        const err = new Error('function missing');
        (err as Error & { code?: string }).code = 'FunctionNotFound';
        throw err;
      }
      if (methodName === 'createFunction') {
        const err = new Error('write EPIPE');
        (err as Error & { code?: string }).code = 'EPIPE';
        throw err;
      }
      throw new Error(`unexpected method: ${methodName}`);
    });
    mockWaitForFcFunctionReadable.mockImplementation(async () => {
      readableCalls += 1;
      if (readableCalls === 1) {
        return {
          functionName: 'demo-app',
          runtime: 'nodejs22',
          handler: 'index.handler',
          memorySize: 512,
          diskSize: 512,
          timeout: 30,
          cpu: 0.5,
          instanceConcurrency: 10,
          environmentVariables: {
            NODE_ENV: 'production',
            [LICELL_INTERNAL_DEPLOY_MARKER_ENV]: expectedDeploymentMarker
          },
          logConfig: expectedLogConfig
        };
      }
      return {
        functionName: 'demo-app',
        lastModifiedTime: '2'
      };
    });

    const result = await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(result.url).toBe('https://demo-app.fcapp.run');
    expect(result.deploymentMarker).toMatch(/^[a-f0-9]{24}$/);
    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual(['getFunction', 'createFunction']);
  });

  it('recovers updateFunction EPIPE by reading converged function state', async () => {
    let readableCalls = 0;
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
        const err = new Error('write EPIPE');
        (err as Error & { code?: string }).code = 'EPIPE';
        throw err;
      }
      throw new Error(`unexpected method: ${methodName}`);
    });
    mockWaitForFcFunctionReadable.mockImplementation(async () => {
      readableCalls += 1;
      if (readableCalls === 1) {
        return {
        functionName: 'demo-app',
        lastModifiedTime: '1',
        runtime: 'nodejs22',
        handler: 'index.handler',
          memorySize: 512,
          diskSize: 512,
          timeout: 30,
          cpu: 0.5,
          instanceConcurrency: 10,
        environmentVariables: {
          NODE_ENV: 'production',
          [LICELL_INTERNAL_DEPLOY_MARKER_ENV]: expectedDeploymentMarker
        },
        logConfig: expectedLogConfig
      };
    }
    return {
      functionName: 'demo-app',
        lastModifiedTime: '2',
        runtime: 'nodejs22',
        handler: 'index.handler',
        memorySize: 512,
        diskSize: 512,
        timeout: 30,
        cpu: 0.5,
        instanceConcurrency: 10,
        environmentVariables: {
          NODE_ENV: 'production',
          [LICELL_INTERNAL_DEPLOY_MARKER_ENV]: expectedDeploymentMarker
        },
        logConfig: expectedLogConfig
      };
    });

    const result = await deployFC('demo-app', 'src/index.ts', 'nodejs22');

    expect(result.url).toBe('https://demo-app.fcapp.run');
    expect(result.deploymentMarker).toMatch(/^[a-f0-9]{24}$/);
    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual([
      'getFunction',
      'getFunction',
      'updateFunction',
      'updateFunction'
    ]);
    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledTimes(2);
    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledWith(
      'demo-app',
      {},
      { profile: 'mutation' }
    );
  });

  it('skips HTTP url provisioning when ensureHttpUrl is disabled', async () => {
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

    const result = await deployFC('demo-app', 'src/index.ts', 'nodejs22', { ensureHttpUrl: false });

    expect(result.url).toBeUndefined();
    expect(result.deploymentMarker).toMatch(/^[a-f0-9]{24}$/);
    expect(mockEnsureFunctionHttpUrl).not.toHaveBeenCalled();
  });
});
