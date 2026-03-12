import * as $FC from '@alicloud/fc20230330';
import { Readable } from 'stream';
import { createFcClient } from './client';
import { isNotFoundError, isTransientError } from '../../utils/alicloud-error';
import { callFcWithGuard, waitForFcFunctionReadable } from './request-guard';
import type {
  AsyncInvokeConfigSummary,
  RemoveAsyncInvokeConfigResult,
  AsyncTaskDetail,
  AsyncTaskEventSummary,
  AsyncTaskInvokeResult,
  AsyncTaskSummary
} from './types';

function shouldRetryFcRead(err: unknown, allowNotFound = false) {
  return isTransientError(err) || (allowNotFound && isNotFoundError(err));
}

function normalizeQualifier(input?: string) {
  return input?.trim() || undefined;
}

function normalizeDestinationConfig(
  config?: $FC.DestinationConfig
): AsyncInvokeConfigSummary['destinationConfig'] | undefined {
  if (!config) return undefined;
  const onFailure = config.onFailure?.destination?.trim() || undefined;
  const onSuccess = config.onSuccess?.destination?.trim() || undefined;
  if (!onFailure && !onSuccess) return undefined;
  return {
    ...(onFailure ? { onFailure } : {}),
    ...(onSuccess ? { onSuccess } : {})
  };
}

function normalizeAsyncConfig(
  config: $FC.AsyncConfig | undefined,
  qualifier?: string
): AsyncInvokeConfigSummary | null {
  if (!config) return null;
  return {
    ...(qualifier ? { qualifier } : {}),
    asyncTask: Boolean(config.asyncTask),
    ...(config.createdTime ? { createdTime: config.createdTime } : {}),
    ...(config.functionArn ? { functionArn: config.functionArn } : {}),
    ...(config.lastModifiedTime ? { lastModifiedTime: config.lastModifiedTime } : {}),
    ...(config.maxAsyncEventAgeInSeconds !== undefined ? { maxAsyncEventAgeInSeconds: Number(config.maxAsyncEventAgeInSeconds) } : {}),
    ...(config.maxAsyncRetryAttempts !== undefined ? { maxAsyncRetryAttempts: Number(config.maxAsyncRetryAttempts) } : {}),
    ...(normalizeDestinationConfig(config.destinationConfig) ? { destinationConfig: normalizeDestinationConfig(config.destinationConfig) } : {})
  };
}

function normalizeAsyncTaskEvent(event: $FC.AsyncTaskEvent): AsyncTaskEventSummary {
  return {
    ...(event.eventId !== undefined ? { eventId: Number(event.eventId) } : {}),
    ...(event.status ? { status: event.status } : {}),
    ...(event.timestamp !== undefined ? { timestamp: Number(event.timestamp) } : {}),
    ...(event.eventDetail ? { eventDetail: event.eventDetail } : {})
  };
}

function extractReturnPayloadFromEvents(events: $FC.AsyncTaskEvent[] | undefined) {
  if (!Array.isArray(events)) return undefined;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const detail = event?.eventDetail?.trim();
    if (!detail) continue;
    try {
      const parsed = JSON.parse(detail) as { logTail?: unknown; returnPayload?: unknown };
      if (typeof parsed.returnPayload === 'string' && parsed.returnPayload.trim().length > 0) {
        return parsed.returnPayload.trim();
      }
      if (typeof parsed.logTail === 'string' && parsed.logTail.trim().length > 0) {
        return parsed.logTail.trim();
      }
    } catch {
      // ignore invalid eventDetail payloads
    }
  }
  return undefined;
}

function normalizeAsyncTask(task: $FC.AsyncTask | undefined): AsyncTaskDetail | null {
  const taskId = task?.taskId?.trim();
  if (!taskId) return null;
  const returnPayload = task?.returnPayload?.trim() || extractReturnPayloadFromEvents(task?.events);
  return {
    taskId,
    ...(task?.alreadyRetriedTimes !== undefined ? { alreadyRetriedTimes: Number(task.alreadyRetriedTimes) } : {}),
    ...(task?.destinationStatus ? { destinationStatus: task.destinationStatus } : {}),
    ...(task?.durationMs !== undefined ? { durationMs: Number(task.durationMs) } : {}),
    ...(task?.endTime !== undefined ? { endTime: Number(task.endTime) } : {}),
    ...(task?.functionArn ? { functionArn: task.functionArn } : {}),
    ...(task?.instanceId ? { instanceId: task.instanceId } : {}),
    ...(task?.qualifier ? { qualifier: task.qualifier } : {}),
    ...(task?.requestId ? { requestId: task.requestId } : {}),
    ...(returnPayload ? { returnPayload } : {}),
    ...(task?.startedTime !== undefined ? { startedTime: Number(task.startedTime) } : {}),
    ...(task?.status ? { status: task.status } : {}),
    ...(task?.taskErrorMessage ? { taskErrorMessage: task.taskErrorMessage } : {}),
    ...(task?.taskPayload ? { taskPayload: task.taskPayload } : {}),
    events: Array.isArray(task?.events) ? task.events.map(normalizeAsyncTaskEvent) : []
  };
}

function toAsyncTaskSummary(task: AsyncTaskDetail): AsyncTaskSummary {
  return {
    taskId: task.taskId,
    ...(task.alreadyRetriedTimes !== undefined ? { alreadyRetriedTimes: task.alreadyRetriedTimes } : {}),
    ...(task.destinationStatus ? { destinationStatus: task.destinationStatus } : {}),
    ...(task.durationMs !== undefined ? { durationMs: task.durationMs } : {}),
    ...(task.endTime !== undefined ? { endTime: task.endTime } : {}),
    ...(task.functionArn ? { functionArn: task.functionArn } : {}),
    ...(task.instanceId ? { instanceId: task.instanceId } : {}),
    ...(task.qualifier ? { qualifier: task.qualifier } : {}),
    ...(task.requestId ? { requestId: task.requestId } : {}),
    ...(task.startedTime !== undefined ? { startedTime: task.startedTime } : {}),
    ...(task.status ? { status: task.status } : {}),
    ...(task.taskErrorMessage ? { taskErrorMessage: task.taskErrorMessage } : {})
  };
}

function normalizeTaskInvocationId(input: string) {
  const value = input.trim();
  if (!value) throw new Error('--task-id 不能为空');
  if (value.length > 128) throw new Error('--task-id 长度不能超过 128');
  if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(value)) {
    throw new Error('--task-id 仅支持字母开头（或下划线），并包含字母、数字、下划线、短横线');
  }
  return value;
}

function readInvokeBody(readable?: Readable) {
  return (async () => {
    if (!readable) return '';
    const chunks: Buffer[] = [];
    for await (const chunk of readable) {
      if (Buffer.isBuffer(chunk)) chunks.push(chunk);
      else chunks.push(Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks).toString('utf8');
  })();
}

function pickHeaderValue(headers: Record<string, string>, name: string) {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

export async function getAsyncInvokeConfig(functionName: string, qualifier?: string): Promise<AsyncInvokeConfigSummary | null> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const normalizedQualifier = normalizeQualifier(qualifier);
  const { client } = createFcClient();
  try {
    const response = await callFcWithGuard<$FC.GetAsyncInvokeConfigResponse>(
      client as unknown as Record<string, unknown>,
      'getAsyncInvokeConfig',
      [normalizedName, new $FC.GetAsyncInvokeConfigRequest({
        ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {})
      })],
      {
        operation: `getAsyncInvokeConfig(${normalizedName}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFcRead(err, true)
      }
    );
    return normalizeAsyncConfig(response.body, normalizedQualifier);
  } catch (err: unknown) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

export async function upsertAsyncInvokeConfig(
  functionName: string,
  options: {
    qualifier?: string;
    asyncTask?: boolean;
    maxAsyncEventAgeInSeconds?: number;
    maxAsyncRetryAttempts?: number;
    destinationConfig?: { onFailure?: string; onSuccess?: string };
  } = {}
): Promise<AsyncInvokeConfigSummary> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const normalizedQualifier = normalizeQualifier(options.qualifier);
  const destinationConfig = options.destinationConfig
    ? new $FC.DestinationConfig({
      ...(options.destinationConfig.onFailure
        ? { onFailure: new $FC.Destination({ destination: options.destinationConfig.onFailure }) }
        : {}),
      ...(options.destinationConfig.onSuccess
        ? { onSuccess: new $FC.Destination({ destination: options.destinationConfig.onSuccess }) }
        : {})
    })
    : undefined;
  const { client } = createFcClient();
  await callFcWithGuard(
    client as unknown as Record<string, unknown>,
    'putAsyncInvokeConfig',
    [normalizedName, new $FC.PutAsyncInvokeConfigRequest({
      ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {}),
      body: new $FC.PutAsyncInvokeConfigInput({
        ...(options.asyncTask !== undefined ? { asyncTask: options.asyncTask } : {}),
        ...(options.maxAsyncEventAgeInSeconds !== undefined ? { maxAsyncEventAgeInSeconds: options.maxAsyncEventAgeInSeconds } : {}),
        ...(options.maxAsyncRetryAttempts !== undefined ? { maxAsyncRetryAttempts: options.maxAsyncRetryAttempts } : {}),
        ...(destinationConfig ? { destinationConfig } : {})
      })
    })],
    {
      operation: `putAsyncInvokeConfig(${normalizedName}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
      profile: 'mutation'
    }
  );
  const config = await getAsyncInvokeConfig(normalizedName, normalizedQualifier);
  if (!config) {
    throw new Error(`异步调用配置写入后未能读取到结果: ${normalizedName}`);
  }
  return config;
}

export async function removeAsyncInvokeConfig(functionName: string, qualifier?: string): Promise<RemoveAsyncInvokeConfigResult> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const normalizedQualifier = normalizeQualifier(qualifier);
  const { client } = createFcClient();
  try {
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'deleteAsyncInvokeConfig',
      [normalizedName, new $FC.DeleteAsyncInvokeConfigRequest({
        ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {})
      })],
      {
        operation: `deleteAsyncInvokeConfig(${normalizedName}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
        profile: 'mutation'
      }
    );
    return {
      functionName: normalizedName,
      ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {}),
      removed: true
    };
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      return {
        functionName: normalizedName,
        ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {}),
        removed: false
      };
    }
    throw err;
  }
}

export async function invokeFunctionAsync(
  functionName: string,
  options: { qualifier?: string; payload?: string; taskId?: string } = {}
): Promise<AsyncTaskInvokeResult> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const normalizedQualifier = normalizeQualifier(options.qualifier);
  const customTaskId = options.taskId ? normalizeTaskInvocationId(options.taskId) : undefined;
  const { client } = createFcClient();
  if (normalizedQualifier) {
    await waitForFcFunctionReadable(normalizedName, client, { qualifier: normalizedQualifier });
  }
  const response = await callFcWithGuard<$FC.InvokeFunctionResponse>(
    client as unknown as Record<string, unknown>,
    'invokeFunction',
    () => {
      const body = typeof options.payload === 'string'
        ? Readable.from([Buffer.from(options.payload)])
        : undefined;
      return [normalizedName, new $FC.InvokeFunctionRequest({
        qualifier: normalizedQualifier,
        body
      })];
    },
    {
      operation: `invokeFunctionAsync(${normalizedName}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
      headers: new $FC.InvokeFunctionHeaders({
        xFcInvocationType: 'Async',
        ...(customTaskId ? { xFcAsyncTaskId: customTaskId } : {})
      }),
      maxAttempts: 1,
      shouldRetry: () => false,
      profile: 'mutation'
    }
  );
  const headers = response.headers || {};
  return {
    statusCode: response.statusCode || 0,
    headers,
    body: await readInvokeBody(response.body),
    taskId: pickHeaderValue(headers, 'x-fc-async-task-id') || customTaskId,
    invocationType: 'Async'
  };
}

export async function listAsyncTasks(
  functionName: string,
  options: {
    qualifier?: string;
    includePayload?: boolean;
    limit?: number;
    prefix?: string;
    sortOrderByTime?: string;
    startedTimeBegin?: number;
    startedTimeEnd?: number;
    status?: string;
  } = {}
): Promise<{ tasks: AsyncTaskSummary[]; nextToken?: string }> {
  const normalizedName = functionName.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  const normalizedQualifier = normalizeQualifier(options.qualifier);
  const { client } = createFcClient();
  const safeLimit = Math.max(1, Math.min(Math.floor(options.limit ?? 20), 200));
  const tasks: AsyncTaskSummary[] = [];
  let nextToken: string | undefined;
  const MAX_PAGES = 50;

  for (let page = 0; page < MAX_PAGES && tasks.length < safeLimit; page += 1) {
    const response = await callFcWithGuard<$FC.ListAsyncTasksResponse>(
      client as unknown as Record<string, unknown>,
      'listAsyncTasks',
      [normalizedName, new $FC.ListAsyncTasksRequest({
        ...(options.includePayload !== undefined ? { includePayload: options.includePayload } : {}),
        limit: Math.min(100, safeLimit - tasks.length),
        ...(nextToken ? { nextToken } : {}),
        ...(options.prefix ? { prefix: options.prefix } : {}),
        ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {}),
        ...(options.sortOrderByTime ? { sortOrderByTime: options.sortOrderByTime } : {}),
        ...(options.startedTimeBegin !== undefined ? { startedTimeBegin: options.startedTimeBegin } : {}),
        ...(options.startedTimeEnd !== undefined ? { startedTimeEnd: options.startedTimeEnd } : {}),
        ...(options.status ? { status: options.status } : {})
      })],
      {
        operation: `listAsyncTasks(${normalizedName}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
        profile: 'read',
        shouldRetry: (err: unknown) => shouldRetryFcRead(err)
      }
    );
    const rows = response.body?.tasks || [];
    for (const row of rows) {
      const detail = normalizeAsyncTask(row);
      if (!detail) continue;
      tasks.push(toAsyncTaskSummary(detail));
      if (tasks.length >= safeLimit) break;
    }
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return { tasks, ...(nextToken ? { nextToken } : {}) };
}

export async function getAsyncTask(functionName: string, taskId: string, qualifier?: string): Promise<AsyncTaskDetail> {
  const normalizedName = functionName.trim();
  const normalizedTaskId = taskId.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  if (!normalizedTaskId) throw new Error('taskId 不能为空');
  const normalizedQualifier = normalizeQualifier(qualifier);
  const { client } = createFcClient();
  const response = await callFcWithGuard<$FC.GetAsyncTaskResponse>(
    client as unknown as Record<string, unknown>,
    'getAsyncTask',
    [normalizedName, normalizedTaskId, new $FC.GetAsyncTaskRequest({
      ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {})
    })],
    {
      operation: `getAsyncTask(${normalizedName}/${normalizedTaskId}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
      profile: 'read',
      shouldRetry: (err: unknown) => shouldRetryFcRead(err)
    }
  );
  const task = normalizeAsyncTask(response.body);
  if (!task) throw new Error(`未找到异步任务: ${normalizedTaskId}`);
  return task;
}

export async function stopAsyncTask(functionName: string, taskId: string, qualifier?: string) {
  const normalizedName = functionName.trim();
  const normalizedTaskId = taskId.trim();
  if (!normalizedName) throw new Error('functionName 不能为空');
  if (!normalizedTaskId) throw new Error('taskId 不能为空');
  const normalizedQualifier = normalizeQualifier(qualifier);
  const { client } = createFcClient();
  await callFcWithGuard(
    client as unknown as Record<string, unknown>,
    'stopAsyncTask',
    [normalizedName, normalizedTaskId, new $FC.StopAsyncTaskRequest({
      ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {})
    })],
    {
      operation: `stopAsyncTask(${normalizedName}/${normalizedTaskId}${normalizedQualifier ? `@${normalizedQualifier}` : ''})`,
      profile: 'mutation'
    }
  );
  return {
    functionName: normalizedName,
    taskId: normalizedTaskId,
    ...(normalizedQualifier ? { qualifier: normalizedQualifier } : {})
  };
}
