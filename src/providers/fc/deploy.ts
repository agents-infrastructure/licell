import * as $FC from '@alicloud/fc20230330';
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { isAbsolute, join, relative, resolve } from 'path';
import { spawnSync } from 'child_process';
import { Config, type ProjectConfig, type ProjectNetworkConfig, type ProjectResourcesConfig } from '../../utils/config';
import { isConflictError, isNotFoundError, isTransientError } from '../../utils/alicloud-error';
import { formatErrorMessage } from '../../utils/errors';
import { createFcClient } from './client';
import { ensureDefaultFcSlsLogConfig } from '../logs';
import { computeDeploymentMarker, LICELL_INTERNAL_DEPLOY_MARKER_ENV } from './deployment-probe';
import { ensureFunctionHttpUrl } from './http';
import { validateRuntimeEntrypoint } from './runtime-utils';
import {
  buildUnsupportedRuntimeMessage,
  isInvalidRuntimeValueError,
  isRuntimeChangeNotSupportedError,
  prepareBootFile,
  resolveFunctionVpcConfig,
  resolveRuntimeConfig
} from './runtime';
import {
  callFcWithGuard,
  isFcOperationTimeoutError,
  waitForFcFunctionReadable,
  type FcReadableProfile
} from './request-guard';
import { DEFAULT_FC_RUNTIME, type FcRuntime } from './types';
import {
  FC_DEFAULT_DISK_SIZE_MB,
  FC_DEFAULT_INSTANCE_CONCURRENCY,
  FC_DEFAULT_MEMORY_MB,
  FC_DEFAULT_TIMEOUT_SECONDS,
  FC_DEFAULT_VCPU,
  FC_SUPPORTED_DISK_SIZE_MB
} from './resources';

export function packageCodeAsBase64(outdir: string) {
  const zipPath = join(tmpdir(), `licell-code-${Date.now()}-${process.pid}.zip`);
  try {
    const result = spawnSync('zip', ['-q', '-r', '-y', zipPath, '.'], {
      cwd: outdir,
      encoding: 'utf8'
    });
    if (result.status === 0) {
      return readFileSync(zipPath).toString('base64');
    }
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') {
      const zip = new AdmZip();
      zip.addLocalFolder(outdir);
      return zip.toBuffer().toString('base64');
    }
    throw new Error(stderr || stdout || result.error?.message || 'unknown zip error');
  } finally {
    rmSync(zipPath, { force: true });
  }
}

const ALLOWED_DISK_SIZES = new Set<number>(FC_SUPPORTED_DISK_SIZE_MB);

function validateCpuMemoryRatio(memorySizeMb: number, cpu: number) {
  if (!Number.isFinite(memorySizeMb) || memorySizeMb <= 0) {
    throw new Error(`无效的 memorySize: ${String(memorySizeMb)}`);
  }
  if (!Number.isFinite(cpu) || cpu <= 0) {
    throw new Error(`无效的 vCPU: ${String(cpu)}`);
  }
  const minMb = Math.ceil(cpu * 1024);
  const maxMb = Math.floor(cpu * 4096);
  if (memorySizeMb < minMb || memorySizeMb > maxMb) {
    throw new Error(
      `FC 资源规格要求：memory 与 vCPU 需满足 1:1~4:1（memoryGB/vCPU ∈ [1,4]）。\n` +
      `当前：memory=${memorySizeMb}MB, vCPU=${cpu}\n` +
      `请调整为：memory ∈ [${minMb}, ${maxMb}] MB（或调整 vCPU）。`
    );
  }
}

function validateDiskSize(diskSizeMb: number) {
  if (!Number.isFinite(diskSizeMb) || !Number.isInteger(diskSizeMb)) {
    throw new Error(`无效的 diskSize: ${String(diskSizeMb)}`);
  }
  if (!ALLOWED_DISK_SIZES.has(diskSizeMb)) {
    throw new Error('FC 磁盘规格仅支持 512MB 或 10240MB。请调整 resources.diskSize 或 --disk-size。');
  }
}

export interface DeployFCOptions {
  resources?: ProjectResourcesConfig;
  network?: ProjectNetworkConfig | null;
  ensureHttpUrl?: boolean;
  project?: ProjectConfig;
}

export interface DeployFCResult {
  url?: string;
  deploymentMarker: string;
}

export interface ResolvedFunctionResources {
  memorySize: number;
  diskSize: number;
  timeout: number;
  cpu?: number;
  instanceConcurrency?: number;
}

type FunctionResourceKey = keyof ResolvedFunctionResources;
type ExpectedFunctionResourceState = Partial<Record<FunctionResourceKey, number>>;
const FUNCTION_RESOURCE_KEYS: FunctionResourceKey[] = ['memorySize', 'diskSize', 'timeout', 'cpu', 'instanceConcurrency'];

export function resolveFunctionResources(
  projectResources?: ProjectResourcesConfig,
  overrideResources?: ProjectResourcesConfig
): ResolvedFunctionResources {
  const resources = { ...(projectResources || {}), ...(overrideResources || {}) };
  const memorySize = resources.memorySize ?? FC_DEFAULT_MEMORY_MB;
  const diskSize = resources.diskSize ?? FC_DEFAULT_DISK_SIZE_MB;
  const timeout = resources.timeout ?? FC_DEFAULT_TIMEOUT_SECONDS;
  const cpu = resources.cpu;
  validateDiskSize(diskSize);
  const inferredInstanceConcurrency = (() => {
    if (cpu !== undefined) return Math.max(1, Math.min(100, Math.round(cpu * 10)));
    if (memorySize >= 2048) return 40;
    if (memorySize >= 1024) return 20;
    return FC_DEFAULT_INSTANCE_CONCURRENCY;
  })();
  return {
    memorySize,
    diskSize,
    timeout,
    ...(cpu !== undefined ? { cpu } : {}),
    instanceConcurrency: resources.instanceConcurrency ?? inferredInstanceConcurrency
  };
}

function hasOwnDefinedResource(
  resources: ProjectResourcesConfig | undefined,
  key: keyof ProjectResourcesConfig
) {
  return Boolean(
    resources
      && Object.prototype.hasOwnProperty.call(resources, key)
      && resources[key] !== undefined
  );
}

function isFunctionResourceExplicitlyConfigured(
  key: FunctionResourceKey,
  projectResources?: ProjectResourcesConfig,
  overrideResources?: ProjectResourcesConfig
) {
  return hasOwnDefinedResource(projectResources, key) || hasOwnDefinedResource(overrideResources, key);
}

function buildExpectedExplicitFunctionResourceState(
  resources: ResolvedFunctionResources,
  projectResources?: ProjectResourcesConfig,
  overrideResources?: ProjectResourcesConfig
): ExpectedFunctionResourceState {
  const expected: ExpectedFunctionResourceState = {};
  for (const key of FUNCTION_RESOURCE_KEYS) {
    if (isFunctionResourceExplicitlyConfigured(key, projectResources, overrideResources)) {
      const value = resources[key];
      if (value !== undefined) expected[key] = value;
    }
  }
  return expected;
}

function assertFunctionResourcesConverged(
  fn: $FC.Function,
  expected: ExpectedFunctionResourceState,
  operation: string
) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const observedRaw = (fn as Record<string, unknown>)[key];
    const observedValue = observedRaw === undefined ? undefined : Number(observedRaw);
    if (observedValue !== expectedValue) {
      throw new Error(
        `FC 函数资源未收敛: ${operation} ${key} expected=${expectedValue}, observed=${observedRaw === undefined ? 'undefined' : observedValue}`
      );
    }
  }
}

function normalizeStringRecord(input: unknown) {
  const entries = Object.entries((input || {}) as Record<string, unknown>)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

function normalizeVpcConfig(input: unknown) {
  const vpc = input as { vpcId?: unknown; vSwitchIds?: unknown; securityGroupId?: unknown } | null | undefined;
  return {
    vpcId: typeof vpc?.vpcId === 'string' ? vpc.vpcId : undefined,
    vSwitchIds: Array.isArray(vpc?.vSwitchIds) ? [...vpc.vSwitchIds].map(String).sort() : [],
    securityGroupId: typeof vpc?.securityGroupId === 'string' ? vpc.securityGroupId : undefined
  };
}

function normalizeCustomRuntimeConfig(input: unknown) {
  const config = input as { command?: unknown; args?: unknown; port?: unknown } | null | undefined;
  return {
    command: Array.isArray(config?.command) ? config.command.map(String) : [],
    args: Array.isArray(config?.args) ? config.args.map(String) : [],
    port: config?.port === undefined || config?.port === null ? undefined : Number(config.port)
  };
}

function normalizeCustomContainerConfig(input: unknown) {
  const config = input as { image?: unknown; command?: unknown; args?: unknown } | null | undefined;
  return {
    image: typeof config?.image === 'string' ? config.image : undefined,
    command: Array.isArray(config?.command) ? config.command.map(String) : [],
    args: Array.isArray(config?.args) ? config.args.map(String) : []
  };
}

function normalizeLogConfig(input: unknown) {
  const config = input as {
    project?: unknown;
    logstore?: unknown;
    enableRequestMetrics?: unknown;
    enableInstanceMetrics?: unknown;
  } | null | undefined;
  return {
    project: typeof config?.project === 'string' ? config.project : undefined,
    logstore: typeof config?.logstore === 'string' ? config.logstore : undefined,
    enableRequestMetrics: typeof config?.enableRequestMetrics === 'boolean' ? config.enableRequestMetrics : undefined,
    enableInstanceMetrics: typeof config?.enableInstanceMetrics === 'boolean' ? config.enableInstanceMetrics : undefined
  };
}

function buildComparableFunctionState(body: Record<string, unknown>) {
  const hasOwn = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  const state: Record<string, unknown> = {};
  if (hasOwn('runtime')) state.runtime = typeof body.runtime === 'string' ? body.runtime : undefined;
  if (hasOwn('handler')) state.handler = typeof body.handler === 'string' ? body.handler : undefined;
  if (hasOwn('memorySize')) state.memorySize = typeof body.memorySize === 'number' ? body.memorySize : Number(body.memorySize);
  if (hasOwn('diskSize')) state.diskSize = typeof body.diskSize === 'number' ? body.diskSize : Number(body.diskSize);
  if (hasOwn('timeout')) state.timeout = typeof body.timeout === 'number' ? body.timeout : Number(body.timeout);
  if (hasOwn('cpu')) state.cpu = body.cpu === undefined ? undefined : Number(body.cpu);
  if (hasOwn('instanceConcurrency')) {
    state.instanceConcurrency = body.instanceConcurrency === undefined ? undefined : Number(body.instanceConcurrency);
  }
  if (hasOwn('environmentVariables')) state.environmentVariables = normalizeStringRecord(body.environmentVariables);
  if (hasOwn('vpcConfig')) state.vpcConfig = normalizeVpcConfig(body.vpcConfig);
  if (hasOwn('customRuntimeConfig')) state.customRuntimeConfig = normalizeCustomRuntimeConfig(body.customRuntimeConfig);
  if (hasOwn('customContainerConfig')) state.customContainerConfig = normalizeCustomContainerConfig(body.customContainerConfig);
  if (hasOwn('logConfig')) state.logConfig = normalizeLogConfig(body.logConfig);
  return state;
}

function buildObservedFunctionState(fn: $FC.Function) {
  return {
    runtime: fn.runtime || undefined,
    handler: fn.handler || undefined,
    memorySize: fn.memorySize === undefined ? undefined : Number(fn.memorySize),
    diskSize: fn.diskSize === undefined ? undefined : Number(fn.diskSize),
    timeout: fn.timeout === undefined ? undefined : Number(fn.timeout),
    cpu: (fn as { cpu?: unknown }).cpu === undefined ? undefined : Number((fn as { cpu?: unknown }).cpu),
    instanceConcurrency: (fn as { instanceConcurrency?: unknown }).instanceConcurrency === undefined
      ? undefined
      : Number((fn as { instanceConcurrency?: unknown }).instanceConcurrency),
    environmentVariables: normalizeStringRecord(fn.environmentVariables),
    vpcConfig: normalizeVpcConfig((fn as { vpcConfig?: unknown }).vpcConfig),
    customRuntimeConfig: normalizeCustomRuntimeConfig((fn as { customRuntimeConfig?: unknown }).customRuntimeConfig),
    customContainerConfig: normalizeCustomContainerConfig((fn as { customContainerConfig?: unknown }).customContainerConfig),
    logConfig: normalizeLogConfig((fn as { logConfig?: unknown }).logConfig)
  };
}

function functionStateMatches(fn: $FC.Function, expectedBody: Record<string, unknown>) {
  const expectedState = buildComparableFunctionState(expectedBody);
  const observedState = buildObservedFunctionState(fn) as Record<string, unknown>;
  const comparableObservedState = Object.fromEntries(
    Object.keys(expectedState).map((key) => [key, observedState[key]])
  );
  return JSON.stringify(comparableObservedState) === JSON.stringify(expectedState);
}

function shouldRetryFunctionRead(err: unknown) {
  return isTransientError(err) || isFcOperationTimeoutError(err);
}

type CreateFunctionOutcome = 'created' | 'existing';

async function getFunctionIfExists(
  appName: string,
  client: ReturnType<typeof createFcClient>['client']
): Promise<$FC.Function | null> {
  try {
    const response = await callFcWithGuard<$FC.GetFunctionResponse>(
      client as unknown as Record<string, unknown>,
      'getFunction',
      [appName, new $FC.GetFunctionRequest({})],
      {
        operation: `getFunction(${appName})`,
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFunctionRead(err)
      }
    );
    const fn = response.body;
    return fn?.functionName ? fn : null;
  } catch (err: unknown) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

async function waitForFunctionIfExists(
  appName: string,
  client: ReturnType<typeof createFcClient>['client'],
  profile: FcReadableProfile = 'read',
  timeoutMs?: number
): Promise<$FC.Function | null> {
  try {
    return await waitForFcFunctionReadable(appName, client, { profile, timeoutMs });
  } catch (err: unknown) {
    if (isFcReadableTimeoutError(err) || isNotFoundError(err)) return null;
    throw err;
  }
}

function isFcReadableTimeoutError(err: unknown) {
  return formatErrorMessage(err).includes('等待函数就绪超时:');
}

function isRecoverableFunctionMutationError(err: unknown) {
  return isTransientError(err) || isFcOperationTimeoutError(err) || isFcReadableTimeoutError(err);
}

async function callCreateFunction(
  appName: string,
  client: ReturnType<typeof createFcClient>['client'],
  request: $FC.CreateFunctionRequest,
  expectedBody: Record<string, unknown>,
  expectedResources: ExpectedFunctionResourceState
): Promise<CreateFunctionOutcome> {
  const recoverCreateOutcome = async () => {
    const observed = await waitForFunctionIfExists(appName, client, 'mutation', 60_000);
    if (!observed) return null;
    return functionStateMatches(observed, expectedBody) ? 'created' : 'existing';
  };

  try {
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'createFunction',
      [request],
      {
        operation: `createFunction(${appName})`,
        profile: 'mutation'
      }
    );
    const observed = await waitForFcFunctionReadable(appName, client, { profile: 'mutation' });
    assertFunctionResourcesConverged(observed, expectedResources, `createFunction(${appName})`);
    return 'created';
  } catch (err: unknown) {
    if (isConflictError(err)) return 'existing';
    if (isRecoverableFunctionMutationError(err)) {
      const recovered = await recoverCreateOutcome();
      if (recovered) return recovered;
      try {
        await callFcWithGuard(
          client as unknown as Record<string, unknown>,
          'createFunction',
          [request],
          {
            operation: `createFunction(${appName})#retry`,
            profile: 'mutation'
          }
        );
        const observed = await waitForFcFunctionReadable(appName, client, { profile: 'mutation' });
        assertFunctionResourcesConverged(observed, expectedResources, `createFunction(${appName})#retry`);
        return 'created';
      } catch (retryErr: unknown) {
        if (isConflictError(retryErr)) return 'existing';
        if (!isRecoverableFunctionMutationError(retryErr)) throw retryErr;
      }
      const recoveredAfterRetry = await recoverCreateOutcome();
      if (recoveredAfterRetry) return recoveredAfterRetry;
      throw new Error(`创建函数失败，且云端状态未收敛到期望配置: ${formatErrorMessage(err)}`);
    }
    throw err;
  }
}

async function callUpdateFunction(
  appName: string,
  client: ReturnType<typeof createFcClient>['client'],
  request: $FC.UpdateFunctionRequest,
  expectedBody: Record<string, unknown>,
  expectedResources: ExpectedFunctionResourceState
) {
  const before = await getFunctionIfExists(appName, client);
  const recoverUpdateOutcome = async () => {
    const after = await waitForFcFunctionReadable(appName, client, { profile: 'mutation' });
    const changed = after.lastModifiedTime && before?.lastModifiedTime
      ? after.lastModifiedTime !== before.lastModifiedTime
      : true;
    return changed && functionStateMatches(after, expectedBody);
  };
  try {
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'updateFunction',
      [appName, request],
      {
        operation: `updateFunction(${appName})`,
        profile: 'mutation'
      }
    );
    const observed = await waitForFcFunctionReadable(appName, client, { profile: 'mutation' });
    assertFunctionResourcesConverged(observed, expectedResources, `updateFunction(${appName})`);
    return;
  } catch (err: unknown) {
    if (isRecoverableFunctionMutationError(err)) {
      if (await recoverUpdateOutcome()) {
        return;
      }
      try {
        await callFcWithGuard(
          client as unknown as Record<string, unknown>,
          'updateFunction',
          [appName, request],
          {
            operation: `updateFunction(${appName})#retry`,
            profile: 'mutation'
          }
        );
        if (await recoverUpdateOutcome()) {
          return;
        }
      } catch (retryErr: unknown) {
        if (!isRecoverableFunctionMutationError(retryErr)) throw retryErr;
        if (await recoverUpdateOutcome()) {
          return;
        }
        throw new Error(`更新函数失败，且云端状态未收敛到期望配置: ${formatErrorMessage(retryErr)}`);
      }
      throw new Error(`更新函数失败，且云端状态未收敛到期望配置: ${formatErrorMessage(err)}`);
    }
    throw err;
  }
}

export async function deployFC(appName: string, entryFile: string, runtime: FcRuntime = DEFAULT_FC_RUNTIME, options: DeployFCOptions = {}): Promise<DeployFCResult> {
  const { client } = createFcClient();
  const project = options.project || Config.getProject();

  const outdir = './.licell/dist';
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });

  const isDocker = runtime === 'docker';
  const isPrebuilt = project.artifact?.kind === 'prebuilt';

  if (!isDocker) {
    const resolvedEntry = resolve(entryFile);
    const entryRelativeToCwd = relative(process.cwd(), resolvedEntry);
    if (entryRelativeToCwd.startsWith('..') || isAbsolute(entryRelativeToCwd)) {
      throw new Error(`入口文件必须在项目目录内: ${entryFile}`);
    }
    if (!existsSync(resolvedEntry)) throw new Error(`入口文件不存在: ${entryFile}`);
    if (!statSync(resolvedEntry).isFile()) throw new Error(`入口文件不是有效文件: ${entryFile}`);
    validateRuntimeEntrypoint(resolvedEntry, runtime);
  }

  const entryRelative = isDocker ? entryFile : relative(process.cwd(), resolve(entryFile)).replace(/\\/g, '/');

  let bootFile: string;
  let runtimeConfig: Awaited<ReturnType<typeof resolveRuntimeConfig>>;

  if (isPrebuilt) {
    const prebuiltDir = project.artifact?.prebuiltDir;
    if (!prebuiltDir) throw new Error('artifact.kind=prebuilt 需要指定 artifact.prebuiltDir');
    const resolvedPrebuiltDir = resolve(prebuiltDir);
    if (!existsSync(resolvedPrebuiltDir)) throw new Error(`artifact.prebuiltDir 不存在: ${prebuiltDir}`);

    // Copy prebuilt directory contents into outdir
    const { cpSync } = await import('fs');
    cpSync(resolvedPrebuiltDir, outdir, { recursive: true });

    // Strip the prebuiltDir prefix from entryRelative so the path is relative to outdir.
    // e.g. entryRelative=".output/server/index.mjs", prebuiltDir=".output" → "server/index.mjs"
    const prebuiltDirRelative = relative(process.cwd(), resolvedPrebuiltDir).replace(/\\/g, '/');
    const entryInOutdir = entryRelative.startsWith(prebuiltDirRelative + '/')
      ? entryRelative.slice(prebuiltDirRelative.length + 1)
      : entryRelative;

    bootFile = await prepareBootFile(entryInOutdir, outdir, runtime, project);
    runtimeConfig = await resolveRuntimeConfig(runtime, outdir, bootFile, project);
  } else {
    bootFile = await prepareBootFile(entryRelative, outdir, runtime, project);
    runtimeConfig = await resolveRuntimeConfig(runtime, outdir, bootFile, project);
  }

  const environmentVariables: Record<string, string> = { NODE_ENV: 'production' };
  for (const [key, value] of Object.entries(project.envs)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`环境变量键名不合法: "${key}"（仅允许字母、数字、下划线，且不能以数字开头）`);
    }
    environmentVariables[key] = value;
  }
  const targetNetwork = options.network === undefined ? project.network : options.network || undefined;
  const vpcConfig = await resolveFunctionVpcConfig(targetNetwork);
  const logConfig = await ensureDefaultFcSlsLogConfig();

  let code: { zipFile: string } | undefined;
  if (!runtimeConfig.skipCodePackaging) {
    code = { zipFile: packageCodeAsBase64(outdir) };
  }
  const deploymentMarker = computeDeploymentMarker(
    code?.zipFile
      || JSON.stringify({
        runtime: runtimeConfig.runtime,
        handler: runtimeConfig.handler,
        customRuntimeConfig: runtimeConfig.customRuntimeConfig || null,
        customContainerConfig: runtimeConfig.customContainerConfig || null
      })
  );
  environmentVariables[LICELL_INTERNAL_DEPLOY_MARKER_ENV] = deploymentMarker;

  const resources = resolveFunctionResources(project.resources, options.resources);
  const expectedExplicitResources = buildExpectedExplicitFunctionResourceState(
    resources,
    project.resources,
    options.resources
  );
  const memorySize = resources.memorySize;
  const diskSize = resources.diskSize;
  const timeout = resources.timeout;
  const cpu = resources.cpu ?? FC_DEFAULT_VCPU;
  validateCpuMemoryRatio(memorySize, cpu);

  const updateBody: Record<string, unknown> = {
    runtime: runtimeConfig.runtime,
    handler: runtimeConfig.handler,
    memorySize,
    timeout,
    environmentVariables,
    vpcConfig,
    logConfig
  };
  // Updating an existing function with an implicit default would reset manually
  // enlarged disks back to 512MB. Only send diskSize on update when the user
  // configured it through project resources or CLI overrides.
  if (isFunctionResourceExplicitlyConfigured('diskSize', project.resources, options.resources)) {
    updateBody.diskSize = diskSize;
  }
  updateBody.cpu = cpu;
  if (resources.instanceConcurrency !== undefined) updateBody.instanceConcurrency = resources.instanceConcurrency;
  if (code) updateBody.code = code;
  if (runtimeConfig.customRuntimeConfig) updateBody.customRuntimeConfig = runtimeConfig.customRuntimeConfig;
  if (runtimeConfig.customContainerConfig) updateBody.customContainerConfig = runtimeConfig.customContainerConfig;

  const createBody: Record<string, unknown> = {
    functionName: appName,
    ...updateBody,
    diskSize
  };

  const req = new $FC.CreateFunctionRequest({
    body: new $FC.CreateFunctionInput(createBody)
  });

  const existingFunction = await getFunctionIfExists(appName, client);
  const shouldUpdate = existingFunction
    ? true
    : await (async () => {
        try {
          const createOutcome = await callCreateFunction(appName, client, req, createBody, expectedExplicitResources);
          return createOutcome === 'existing';
        } catch (err: unknown) {
          if (isInvalidRuntimeValueError(err)) {
            throw new Error(buildUnsupportedRuntimeMessage(runtime));
          }
          throw err;
        }
      })();

  if (shouldUpdate) {
    try {
      await callUpdateFunction(appName, client, new $FC.UpdateFunctionRequest({
        body: new $FC.UpdateFunctionInput(updateBody)
      }), updateBody, expectedExplicitResources);
    } catch (updateErr: unknown) {
      if (isInvalidRuntimeValueError(updateErr)) {
        throw new Error(buildUnsupportedRuntimeMessage(runtime));
      }
      if (isRuntimeChangeNotSupportedError(updateErr)) {
        throw new Error(`当前函数运行时无法原地切换到 ${runtime}。请更换 appName 重新部署，或先手动删除原函数后再重试。`);
      }
      throw updateErr;
    }
  }
  if (options.ensureHttpUrl === false) {
    return { deploymentMarker };
  }
  return {
    url: await ensureFunctionHttpUrl(appName, client),
    deploymentMarker
  };
}
