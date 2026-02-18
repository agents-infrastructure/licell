import * as $FC from '@alicloud/fc20230330';
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { isAbsolute, join, relative, resolve } from 'path';
import { spawnSync } from 'child_process';
import { Config, type ProjectResourcesConfig } from '../../utils/config';
import { isConflictError } from '../../utils/errors';
import { withRetry } from '../../utils/retry';
import { createFcClient } from './client';
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
import { DEFAULT_FC_RUNTIME, type FcRuntime } from './types';

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

const DEFAULT_MEMORY_SIZE = 256;
const DEFAULT_TIMEOUT = 30;

export interface DeployFCOptions {
  resources?: ProjectResourcesConfig;
}

export interface ResolvedFunctionResources {
  memorySize: number;
  timeout: number;
  cpu?: number;
  instanceConcurrency?: number;
}

export function resolveFunctionResources(
  projectResources?: ProjectResourcesConfig,
  overrideResources?: ProjectResourcesConfig
): ResolvedFunctionResources {
  const resources = { ...(projectResources || {}), ...(overrideResources || {}) };
  return {
    memorySize: resources.memorySize ?? DEFAULT_MEMORY_SIZE,
    timeout: resources.timeout ?? DEFAULT_TIMEOUT,
    ...(resources.cpu !== undefined ? { cpu: resources.cpu } : {}),
    ...(resources.instanceConcurrency !== undefined ? { instanceConcurrency: resources.instanceConcurrency } : {})
  };
}

export async function deployFC(appName: string, entryFile: string, runtime: FcRuntime = DEFAULT_FC_RUNTIME, options: DeployFCOptions = {}) {
  const { client } = createFcClient();
  const project = Config.getProject();

  const outdir = './.licell/dist';
  rmSync(outdir, { recursive: true, force: true });
  mkdirSync(outdir, { recursive: true });

  const isDocker = runtime === 'docker';

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
  const bootFile = await prepareBootFile(entryRelative, outdir, runtime);
  const runtimeConfig = await resolveRuntimeConfig(runtime, outdir, bootFile);

  const environmentVariables: Record<string, string> = { NODE_ENV: 'production' };
  for (const [key, value] of Object.entries(project.envs)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`环境变量键名不合法: "${key}"（仅允许字母、数字、下划线，且不能以数字开头）`);
    }
    environmentVariables[key] = value;
  }
  const vpcConfig = await resolveFunctionVpcConfig(project.network);

  let code: { zipFile: string } | undefined;
  if (!runtimeConfig.skipCodePackaging) {
    code = { zipFile: packageCodeAsBase64(outdir) };
  }

  const resources = resolveFunctionResources(project.resources, options.resources);
  const memorySize = resources.memorySize;
  const timeout = resources.timeout;

  const createBody: Record<string, unknown> = {
    functionName: appName,
    runtime: runtimeConfig.runtime,
    handler: runtimeConfig.handler,
    memorySize,
    timeout,
    environmentVariables,
    vpcConfig
  };
  if (resources.cpu !== undefined) createBody.cpu = resources.cpu;
  if (resources.instanceConcurrency !== undefined) createBody.instanceConcurrency = resources.instanceConcurrency;
  if (code) createBody.code = code;
  if (runtimeConfig.customRuntimeConfig) createBody.customRuntimeConfig = runtimeConfig.customRuntimeConfig;
  if (runtimeConfig.customContainerConfig) createBody.customContainerConfig = runtimeConfig.customContainerConfig;

  const req = new $FC.CreateFunctionRequest({
    body: new $FC.CreateFunctionInput(createBody)
  });

  try {
    await withRetry(() => client.createFunction(req));
  } catch (err: unknown) {
    if (isConflictError(err)) {
      const updateBody: Record<string, unknown> = {
        runtime: runtimeConfig.runtime,
        handler: runtimeConfig.handler,
        memorySize,
        timeout,
        environmentVariables,
        vpcConfig
      };
      if (resources.cpu !== undefined) updateBody.cpu = resources.cpu;
      if (resources.instanceConcurrency !== undefined) updateBody.instanceConcurrency = resources.instanceConcurrency;
      if (code) updateBody.code = code;
      if (runtimeConfig.customRuntimeConfig) updateBody.customRuntimeConfig = runtimeConfig.customRuntimeConfig;
      if (runtimeConfig.customContainerConfig) updateBody.customContainerConfig = runtimeConfig.customContainerConfig;

      try {
        await withRetry(() => client.updateFunction(appName, new $FC.UpdateFunctionRequest({
          body: new $FC.UpdateFunctionInput(updateBody)
        })));
      } catch (updateErr: unknown) {
        if (isInvalidRuntimeValueError(updateErr)) {
          throw new Error(buildUnsupportedRuntimeMessage(runtime));
        }
        if (isRuntimeChangeNotSupportedError(updateErr)) {
          throw new Error(`当前函数运行时无法原地切换到 ${runtime}。请更换 appName 重新部署，或先手动删除原函数后再重试。`);
        }
        throw updateErr;
      }
    } else {
      if (isInvalidRuntimeValueError(err)) {
        throw new Error(buildUnsupportedRuntimeMessage(runtime));
      }
      throw err;
    }
  }
  return ensureFunctionHttpUrl(appName, client);
}
