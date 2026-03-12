import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'stream';

const {
  mockCreateFcClient,
  mockCallFcWithGuard,
  mockWaitForFcFunctionReadable
} = vi.hoisted(() => ({
  mockCreateFcClient: vi.fn(),
  mockCallFcWithGuard: vi.fn(),
  mockWaitForFcFunctionReadable: vi.fn()
}));

vi.mock('../providers/fc/client', () => ({
  createFcClient: mockCreateFcClient
}));

vi.mock('../providers/fc/request-guard', () => ({
  callFcWithGuard: mockCallFcWithGuard,
  waitForFcFunctionReadable: mockWaitForFcFunctionReadable
}));

import {
  getAsyncTask,
  invokeFunctionAsync,
  listAsyncTasks,
  removeAsyncInvokeConfig,
  upsertAsyncInvokeConfig
} from '../providers/fc/async';

describe('fc async provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFcClient.mockReturnValue({ client: {} });
  });

  it('writes async invoke config then reads back normalized config', async () => {
    mockCallFcWithGuard.mockImplementation(async (_client: unknown, methodName: string) => {
      if (methodName === 'putAsyncInvokeConfig') return { body: {} };
      if (methodName === 'getAsyncInvokeConfig') {
        return {
          body: {
            asyncTask: true,
            maxAsyncRetryAttempts: 0,
            destinationConfig: {
              onSuccess: { destination: 'acs:fc:cn-hangzhou:123:functions/success' }
            }
          }
        };
      }
      throw new Error(`unexpected method: ${methodName}`);
    });

    const result = await upsertAsyncInvokeConfig('worker', {
      qualifier: 'prod',
      asyncTask: true,
      maxAsyncRetryAttempts: 0,
      destinationConfig: {
        onSuccess: 'acs:fc:cn-hangzhou:123:functions/success'
      }
    });

    expect(mockCallFcWithGuard.mock.calls.map((call) => call[1])).toEqual([
      'putAsyncInvokeConfig',
      'getAsyncInvokeConfig'
    ]);
    expect(result).toEqual({
      qualifier: 'prod',
      asyncTask: true,
      maxAsyncRetryAttempts: 0,
      destinationConfig: {
        onSuccess: 'acs:fc:cn-hangzhou:123:functions/success'
      }
    });
  });

  it('invokes task function with async headers and returns task id', async () => {
    const client = {};
    mockCreateFcClient.mockReturnValue({ client });
    mockWaitForFcFunctionReadable.mockResolvedValue({ functionName: 'worker' });
    mockCallFcWithGuard.mockResolvedValue({
      statusCode: 202,
      headers: {
        'x-fc-async-task-id': 'job-001'
      },
      body: Readable.from([])
    });

    const result = await invokeFunctionAsync('worker', {
      qualifier: 'prod',
      payload: '{"image":"a.png"}',
      taskId: 'job_001'
    });

    expect(mockWaitForFcFunctionReadable).toHaveBeenCalledWith('worker', client, { qualifier: 'prod' });
    expect(mockCallFcWithGuard).toHaveBeenCalledTimes(1);
    expect(mockCallFcWithGuard.mock.calls[0]?.[1]).toBe('invokeFunction');
    expect(mockCallFcWithGuard.mock.calls[0]?.[3]).toMatchObject({
      maxAttempts: 1,
      profile: 'mutation'
    });
    expect((mockCallFcWithGuard.mock.calls[0]?.[3] as { headers?: { xFcInvocationType?: string; xFcAsyncTaskId?: string } }).headers)
      .toMatchObject({
        xFcInvocationType: 'Async',
        xFcAsyncTaskId: 'job_001'
      });
    expect(result.taskId).toBe('job-001');
    expect(result.invocationType).toBe('Async');
  });

  it('lists async tasks with normalized summaries', async () => {
    mockCallFcWithGuard.mockResolvedValue({
      body: {
        tasks: [
          {
            taskId: 'job-1',
            status: 'Running',
            startedTime: 1,
            durationMs: 30
          },
          {
            taskId: 'job-2',
            status: 'Succeeded',
            startedTime: 2,
            durationMs: 42
          }
        ],
        nextToken: 'next-page'
      }
    });

    const result = await listAsyncTasks('worker', { qualifier: 'prod', limit: 2 });

    expect(result.nextToken).toBe('next-page');
    expect(result.tasks).toEqual([
      {
        taskId: 'job-1',
        status: 'Running',
        startedTime: 1,
        durationMs: 30
      },
      {
        taskId: 'job-2',
        status: 'Succeeded',
        startedTime: 2,
        durationMs: 42
      }
    ]);
  });

  it('gets async task detail with lifecycle events', async () => {
    mockCallFcWithGuard.mockResolvedValue({
      body: {
        taskId: 'job-1',
        status: 'Succeeded',
        returnPayload: '{"ok":true}',
        events: [
          {
            eventId: 1,
            status: 'Running',
            timestamp: 1000,
            eventDetail: 'started'
          }
        ]
      }
    });

    const result = await getAsyncTask('worker', 'job-1', 'prod');

    expect(result).toEqual({
      taskId: 'job-1',
      status: 'Succeeded',
      returnPayload: '{"ok":true}',
      events: [
        {
          eventId: 1,
          status: 'Running',
          timestamp: 1000,
          eventDetail: 'started'
        }
      ]
    });
  });

  it('falls back to succeeded eventDetail.logTail when returnPayload is absent', async () => {
    mockCallFcWithGuard.mockResolvedValue({
      body: {
        taskId: 'job-2',
        status: 'Succeeded',
        events: [
          {
            eventId: 1,
            status: 'Succeeded',
            timestamp: 1000,
            eventDetail: '{"durationMs":9,"logTail":"{\\"ok\\":true,\\"runId\\":\\"repro\\"}"}'
          }
        ]
      }
    });

    const result = await getAsyncTask('worker', 'job-2', 'prod');

    expect(result).toEqual({
      taskId: 'job-2',
      status: 'Succeeded',
      returnPayload: '{"ok":true,"runId":"repro"}',
      events: [
        {
          eventId: 1,
          status: 'Succeeded',
          timestamp: 1000,
          eventDetail: '{"durationMs":9,"logTail":"{\\"ok\\":true,\\"runId\\":\\"repro\\"}"}'
        }
      ]
    });
  });

  it('deletes async invoke config and normalizes not-found as removed=false', async () => {
    mockCallFcWithGuard.mockRejectedValueOnce(Object.assign(new Error('ResourceNotFound'), {
      code: 'ResourceNotFound'
    }));

    const result = await removeAsyncInvokeConfig('worker', 'prod');

    expect(mockCallFcWithGuard).toHaveBeenCalledTimes(1);
    expect(mockCallFcWithGuard.mock.calls[0]?.[1]).toBe('deleteAsyncInvokeConfig');
    expect(result).toEqual({
      functionName: 'worker',
      qualifier: 'prod',
      removed: false
    });
  });
});
