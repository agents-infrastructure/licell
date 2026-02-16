import * as $FC from '@alicloud/fc20230330';
import { Readable } from 'stream';
import { createFcClient } from './client';
import type { FunctionInvokeResult, FunctionSummary } from './types';

export async function pullFunctionEnvs(appName: string, qualifier?: string) {
  const { client } = createFcClient();
  const response = await client.getFunction(appName, new $FC.GetFunctionRequest({ qualifier }));
  return response.body?.environmentVariables || {};
}

function toFunctionSummary(item: $FC.Function): FunctionSummary | null {
  const functionName = item.functionName;
  if (!functionName) return null;
  return {
    functionName,
    runtime: item.runtime,
    state: item.state,
    lastModifiedTime: item.lastModifiedTime,
    description: item.description
  };
}

export async function listFunctions(limit = 100, prefix?: string): Promise<FunctionSummary[]> {
  const { client } = createFcClient();
  const results: FunctionSummary[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  let nextToken: string | undefined;

  while (results.length < safeLimit) {
    const response = await client.listFunctions(new $FC.ListFunctionsRequest({
      limit: Math.min(100, safeLimit - results.length),
      nextToken,
      prefix,
      fcVersion: 'v3'
    }));
    const rows = response.body?.functions || [];
    for (const row of rows) {
      const summary = toFunctionSummary(row);
      if (!summary) continue;
      results.push(summary);
      if (results.length >= safeLimit) break;
    }
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return results;
}

export async function getFunctionInfo(functionName: string, qualifier?: string) {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  const response = await client.getFunction(normalizedName, new $FC.GetFunctionRequest({ qualifier }));
  const fn = response.body;
  if (!fn?.functionName) throw new Error(`未找到函数: ${normalizedName}`);
  return fn;
}

export async function removeFunction(functionName: string) {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  await client.deleteFunction(normalizedName);
}

async function readInvokeBody(readable?: Readable) {
  if (!readable) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    if (Buffer.isBuffer(chunk)) chunks.push(chunk);
    else chunks.push(Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function invokeFunction(
  functionName: string,
  options: { qualifier?: string; payload?: string } = {}
): Promise<FunctionInvokeResult> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  const body = typeof options.payload === 'string' ? Readable.from([Buffer.from(options.payload)]) : undefined;
  const response = await client.invokeFunction(normalizedName, new $FC.InvokeFunctionRequest({
    qualifier: options.qualifier,
    body
  }));
  const content = await readInvokeBody(response.body);
  return {
    statusCode: response.statusCode || 0,
    headers: response.headers || {},
    body: content
  };
}

async function replaceFunctionEnvs(appName: string, envs: Record<string, string>) {
  const { client } = createFcClient();
  await client.updateFunction(appName, new $FC.UpdateFunctionRequest({
    body: new $FC.UpdateFunctionInput({
      environmentVariables: envs
    })
  }));
}

export async function setFunctionEnv(appName: string, key: string, value: string) {
  const current = await pullFunctionEnvs(appName);
  const next = { ...current, [key]: value };
  await replaceFunctionEnvs(appName, next);
  return next;
}

export async function removeFunctionEnv(appName: string, key: string) {
  const current = await pullFunctionEnvs(appName);
  if (!Object.prototype.hasOwnProperty.call(current, key)) {
    return current;
  }
  const { [key]: _removed, ...next } = current;
  await replaceFunctionEnvs(appName, next);
  return next;
}
