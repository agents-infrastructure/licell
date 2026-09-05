import * as $FC from '@alicloud/fc20230330';
import { Readable } from 'stream';
import { createFcClient } from './client';
import { isNotFoundError, isTransientError } from '../../utils/alicloud-error';
import {
  callFcWithGuard,
  waitForFcFunctionReadable
} from './request-guard';
import type { FunctionInvokeResult, FunctionSummary, RemoveFunctionResult } from './types';

function shouldRetryFcRead(err: unknown, allowNotFound = false) {
  return isTransientError(err) || (allowNotFound && isNotFoundError(err));
}

export async function pullFunctionEnvs(appName: string, qualifier?: string) {
  const normalizedQualifier = qualifier?.trim() || undefined;
  const { client } = createFcClient();
  if (normalizedQualifier) {
    const fn = await waitForFcFunctionReadable(appName, client, { qualifier: normalizedQualifier });
    return fn.environmentVariables || {};
  }
  const response = await callFcWithGuard<$FC.GetFunctionResponse>(
    client as unknown as Record<string, unknown>,
    'getFunction',
    [appName, new $FC.GetFunctionRequest({})],
    {
      operation: `getFunction(${appName})`,
      profile: 'read',
      shouldRetry: (err: unknown) => shouldRetryFcRead(err)
    }
  );
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
    const response = await callFcWithGuard<$FC.ListFunctionsResponse>(
      client as unknown as Record<string, unknown>,
      'listFunctions',
      [new $FC.ListFunctionsRequest({
        limit: Math.min(100, safeLimit - results.length),
        nextToken,
        prefix,
        fcVersion: 'v3'
      })],
      {
        operation: 'listFunctions',
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFcRead(err)
      }
    );
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
  const normalizedQualifier = qualifier?.trim() || undefined;
  const { client } = createFcClient();
  if (normalizedQualifier) {
    const fn = await waitForFcFunctionReadable(normalizedName, client, { qualifier: normalizedQualifier });
    if (!fn.functionName) throw new Error(`未找到函数: ${normalizedName}`);
    return fn;
  }
  const response = await callFcWithGuard<$FC.GetFunctionResponse>(
    client as unknown as Record<string, unknown>,
    'getFunction',
    [normalizedName, new $FC.GetFunctionRequest({})],
    {
      operation: `getFunction(${normalizedName})`,
      profile: 'read',
      shouldRetry: (err: unknown) => shouldRetryFcRead(err)
    }
  );
  const fn = response.body;
  if (!fn?.functionName) throw new Error(`未找到函数: ${normalizedName}`);
  return fn;
}

async function listAllTriggers(
  functionName: string,
  client: ReturnType<typeof createFcClient>['client'],
  limit = Number.MAX_SAFE_INTEGER,
  prefix?: string
) {
  const triggers: $FC.Trigger[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await callFcWithGuard<$FC.ListTriggersResponse>(
      client as unknown as Record<string, unknown>,
      'listTriggers',
      [functionName, new $FC.ListTriggersRequest({
        limit: 100,
        nextToken
      })],
      {
        operation: `listTriggers(${functionName})`,
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFcRead(err)
      }
    );
    const rows = response.body?.triggers || [];
    for (const row of rows) {
      if (prefix && !(row.triggerName || '').toLowerCase().startsWith(prefix)) continue;
      triggers.push(row);
      if (triggers.length >= limit) break;
    }
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0 || triggers.length >= limit) break;
  }

  return triggers;
}

export async function listFunctionTriggers(appName: string, limit = 100, prefix?: string) {
  const client = createFcClient().client;
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  return listAllTriggers(appName.trim(), client, safeLimit, prefix?.trim().toLowerCase() || undefined);
}

async function listAllAliases(functionName: string, client: ReturnType<typeof createFcClient>['client']) {
  const aliases: $FC.Alias[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await callFcWithGuard<$FC.ListAliasesResponse>(
      client as unknown as Record<string, unknown>,
      'listAliases',
      [functionName, new $FC.ListAliasesRequest({
        limit: 100,
        nextToken
      })],
      {
        operation: `listAliases(${functionName})`,
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFcRead(err)
      }
    );
    const rows = response.body?.aliases || [];
    aliases.push(...rows);
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return aliases;
}

async function listAllFunctionVersions(functionName: string, client: ReturnType<typeof createFcClient>['client']) {
  const versions: $FC.Version[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await callFcWithGuard<$FC.ListFunctionVersionsResponse>(
      client as unknown as Record<string, unknown>,
      'listFunctionVersions',
      [functionName, new $FC.ListFunctionVersionsRequest({
        direction: 'BACKWARD',
        limit: 100,
        nextToken
      })],
      {
        operation: `listFunctionVersions(${functionName})`,
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFcRead(err)
      }
    );
    const rows = response.body?.versions || [];
    versions.push(...rows);
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return versions;
}

export async function removeFunction(
  functionName: string,
  options: { force?: boolean } = {}
): Promise<RemoveFunctionResult> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const { client } = createFcClient();
  if (!options.force) {
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'deleteFunction',
      [normalizedName],
      {
        operation: `deleteFunction(${normalizedName})`,
        profile: 'mutation'
      }
    );
    return {
      forced: false,
      deletedTriggers: [],
      deletedAliases: [],
      deletedVersions: []
    };
  }

  const deletedTriggers: string[] = [];
  const deletedAliases: string[] = [];
  const deletedVersions: string[] = [];

  const triggers = await listAllTriggers(normalizedName, client);
  for (const trigger of triggers) {
    const triggerName = trigger.triggerName;
    if (!triggerName) continue;
    try {
      await callFcWithGuard(
        client as unknown as Record<string, unknown>,
        'deleteTrigger',
        [normalizedName, triggerName],
        {
          operation: `deleteTrigger(${normalizedName}/${triggerName})`,
          profile: 'mutation'
        }
      );
      deletedTriggers.push(triggerName);
    } catch (err: unknown) {
      if (!isNotFoundError(err)) throw err;
    }
  }

  const aliases = await listAllAliases(normalizedName, client);
  for (const alias of aliases) {
    const aliasName = alias.aliasName;
    if (!aliasName) continue;
    try {
      await callFcWithGuard(
        client as unknown as Record<string, unknown>,
        'deleteAlias',
        [normalizedName, aliasName],
        {
          operation: `deleteAlias(${normalizedName}/${aliasName})`,
          profile: 'mutation'
        }
      );
      deletedAliases.push(aliasName);
    } catch (err: unknown) {
      if (!isNotFoundError(err)) throw err;
    }
  }

  const versions = await listAllFunctionVersions(normalizedName, client);
  for (const version of versions) {
    const versionId = version.versionId || '';
    if (!/^\d+$/.test(versionId)) continue;
    try {
      await callFcWithGuard(
        client as unknown as Record<string, unknown>,
        'deleteFunctionVersion',
        [normalizedName, versionId],
        {
          operation: `deleteFunctionVersion(${normalizedName}/${versionId})`,
          profile: 'mutation'
        }
      );
      deletedVersions.push(versionId);
    } catch (err: unknown) {
      if (!isNotFoundError(err)) throw err;
    }
  }

  await callFcWithGuard(
    client as unknown as Record<string, unknown>,
    'deleteFunction',
    [normalizedName],
    {
      operation: `deleteFunction(${normalizedName})`,
      profile: 'mutation'
    }
  );
  return {
    forced: true,
    deletedTriggers,
    deletedAliases,
    deletedVersions
  };
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
  const qualifier = options.qualifier?.trim() || undefined;
  if (qualifier) {
    await waitForFcFunctionReadable(normalizedName, client, { qualifier });
  }
  const response = await callFcWithGuard<$FC.InvokeFunctionResponse>(
    client as unknown as Record<string, unknown>,
    'invokeFunction',
    () => {
      const body = typeof options.payload === 'string'
        ? Readable.from([Buffer.from(options.payload)])
        : undefined;
      return [normalizedName, new $FC.InvokeFunctionRequest({
        qualifier,
        body
      })];
    },
    {
      operation: `invokeFunction(${normalizedName}${qualifier ? `@${qualifier}` : ''})`,
      headers: new $FC.InvokeFunctionHeaders({}),
      profile: 'read',
      shouldRetry: (err: unknown) => shouldRetryFcRead(err, Boolean(qualifier))
    }
  );
  const content = await readInvokeBody(response.body);
  return {
    statusCode: response.statusCode || 0,
    headers: response.headers || {},
    body: content
  };
}

async function replaceFunctionEnvs(appName: string, envs: Record<string, string>) {
  const { client } = createFcClient();
  await callFcWithGuard(
    client as unknown as Record<string, unknown>,
    'updateFunction',
    [appName, new $FC.UpdateFunctionRequest({
      body: new $FC.UpdateFunctionInput({
        environmentVariables: envs
      })
    })],
    {
      operation: `updateFunctionEnvs(${appName})`,
      profile: 'mutation',
      shouldRetry: (err: unknown) => shouldRetryFcRead(err)
    }
  );
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
