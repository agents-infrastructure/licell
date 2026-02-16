import * as $FC from '@alicloud/fc20230330';
import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, rmSync, statSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';
import { Config } from '../../utils/config';
import { isConflictError } from '../../utils/errors';
import { withRetry } from '../../utils/retry';
import { createFcClient } from './client';
import { ensureFunctionHttpUrl } from './http';
import {
  buildUnsupportedRuntimeMessage,
  isInvalidRuntimeValueError,
  isRuntimeChangeNotSupportedError,
  prepareBootFile,
  resolveFunctionVpcConfig,
  resolveRuntimeConfig
} from './runtime';
import { DEFAULT_FC_RUNTIME, type FcRuntime } from './types';

export async function deployFC(appName: string, entryFile: string, runtime: FcRuntime = DEFAULT_FC_RUNTIME) {
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
    const zip = new AdmZip();
    zip.addLocalFolder(outdir);
    code = { zipFile: zip.toBuffer().toString('base64') };
  }

  const createBody: Record<string, unknown> = {
    functionName: appName,
    runtime: runtimeConfig.runtime,
    handler: runtimeConfig.handler,
    memorySize: 256,
    timeout: 30,
    environmentVariables,
    vpcConfig
  };
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
        environmentVariables,
        vpcConfig
      };
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
