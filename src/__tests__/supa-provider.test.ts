import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createRdsAiClientMock, deleteDatabaseInstanceMock, sleepMock } = vi.hoisted(() => ({
  createRdsAiClientMock: vi.fn(),
  deleteDatabaseInstanceMock: vi.fn(),
  sleepMock: vi.fn(async () => {})
}));

vi.mock('../providers/supabase/client', () => ({
  createRdsAiClient: createRdsAiClientMock
}));

vi.mock('../providers/infra', () => ({
  deleteDatabaseInstance: deleteDatabaseInstanceMock
}));

vi.mock('../utils/runtime', () => ({
  sleep: sleepMock
}));

import { deleteSupabaseInstanceCascade } from '../providers/supabase/query';

describe('deleteSupabaseInstanceCascade', () => {
  const describeAppInstanceAttributeMock = vi.fn();
  const deleteAppInstanceMock = vi.fn();

  beforeEach(() => {
    describeAppInstanceAttributeMock.mockReset();
    deleteAppInstanceMock.mockReset();
    deleteDatabaseInstanceMock.mockReset();
    sleepMock.mockClear();

    createRdsAiClientMock.mockReturnValue({
      auth: { region: 'cn-hangzhou' },
      client: {
        describeAppInstanceAttribute: describeAppInstanceAttributeMock,
        deleteAppInstance: deleteAppInstanceMock
      }
    });

    deleteAppInstanceMock.mockResolvedValue({});
    deleteDatabaseInstanceMock.mockResolvedValue(undefined);
  });

  it('deletes the associated postgres instance after the supabase app is gone', async () => {
    describeAppInstanceAttributeMock
      .mockResolvedValueOnce({
        body: {
          InstanceName: 'ra-supabase-demo',
          DBInstanceName: 'pgm-demo',
          Status: 'Running'
        }
      })
      .mockResolvedValueOnce({
        body: {
          InstanceName: 'ra-supabase-demo',
          Status: 'Deleting'
        }
      })
      .mockRejectedValueOnce({ code: 'EntityNotExist', message: 'not found' });

    const progress: string[] = [];
    const result = await deleteSupabaseInstanceCascade('  ra-supabase-demo  ', {
      intervalMs: 1,
      timeoutMs: 10,
      onProgress: (message) => progress.push(message)
    });

    expect(deleteAppInstanceMock).toHaveBeenCalledTimes(1);
    expect(deleteAppInstanceMock.mock.calls[0]?.[0]).toMatchObject({
      regionId: 'cn-hangzhou',
      instanceName: 'ra-supabase-demo'
    });
    expect(deleteDatabaseInstanceMock).toHaveBeenCalledWith('pgm-demo');
    expect(deleteAppInstanceMock.mock.invocationCallOrder[0]).toBeLessThan(deleteDatabaseInstanceMock.mock.invocationCallOrder[0]);
    expect(progress).toEqual(expect.arrayContaining([
      '🔎 正在查询实例 ra-supabase-demo 的关联资源...',
      '🗑️ 正在删除 Supabase 实例 ra-supabase-demo...',
      '🗑️ 正在删除关联 PG 实例 pgm-demo...'
    ]));
    expect(result).toEqual({
      instanceName: 'ra-supabase-demo',
      dbInstanceId: 'pgm-demo',
      deletedDatabase: true
    });
  });

  it('skips postgres deletion when no associated database is returned', async () => {
    describeAppInstanceAttributeMock
      .mockResolvedValueOnce({
        body: {
          InstanceName: 'ra-supabase-demo',
          Status: 'Running'
        }
      })
      .mockRejectedValueOnce({ code: 'EntityNotExist', message: 'not found' });

    const result = await deleteSupabaseInstanceCascade('ra-supabase-demo', {
      intervalMs: 1,
      timeoutMs: 10
    });

    expect(deleteDatabaseInstanceMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      instanceName: 'ra-supabase-demo',
      dbInstanceId: undefined,
      deletedDatabase: false
    });
  });
});
