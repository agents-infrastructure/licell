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

  const resolvedEntry = resolve(entryFile);
  const entryRelativeToCwd = relative(process.cwd(), resolvedEntry);
  if (entryRelativeToCwd.startsWith('..') || isAbsolute(entryRelativeToCwd)) {
    throw new Error(`入口文件必须在项目目录内: ${entryFile}`);
  }
  if (!existsSync(resolvedEntry)) throw new Error(`入口文件不存在: ${entryFile}`);
  if (!statSync(resolvedEntry).isFile()) throw new Error(`入口文件不是有效文件: ${entryFile}`);

  const entryRelative = entryRelativeToCwd.replace(/\\/g, '/');
  const bootFile = await prepareBootFile(entryRelative, outdir, runtime);
  const runtimeConfig = await resolveRuntimeConfig(runtime, outdir, bootFile);

  const zip = new AdmZip();
  zip.addLocalFolder(outdir);
  const zipBase64 = zip.toBuffer().toString('base64');
  const environmentVariables = { NODE_ENV: 'production', ...project.envs };
  const vpcConfig = await resolveFunctionVpcConfig(project.network);

  const req = new $FC.CreateFunctionRequest({
    body: new $FC.CreateFunctionInput({
      functionName: appName,
      runtime: runtimeConfig.runtime,
      handler: runtimeConfig.handler,
      memorySize: 256,
      timeout: 30,
      code: { zipFile: zipBase64 },
      environmentVariables,
      vpcConfig,
      customRuntimeConfig: runtimeConfig.customRuntimeConfig
    })
  });

  try {
    await withRetry(() => client.createFunction(req));
  } catch (err: unknown) {
    if (isConflictError(err)) {
      try {
        await withRetry(() => client.updateFunction(appName, new $FC.UpdateFunctionRequest({
          body: new $FC.UpdateFunctionInput({
            code: { zipFile: zipBase64 },
            runtime: runtimeConfig.runtime,
            handler: runtimeConfig.handler,
            environmentVariables,
            vpcConfig,
            customRuntimeConfig: runtimeConfig.customRuntimeConfig
          })
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
