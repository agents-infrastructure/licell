import { describe, expect, it } from 'vitest';
import { listSlsLogstores } from '../providers/sls-query';

const auth = { accountId: 'account-1', ak: 'ak-test', sk: 'sk-test', region: 'cn-hangzhou' };

describe('SLS logstore query provider', () => {
  it('compiles REST host project input and projects logstore summaries', async () => {
    const calls: unknown[] = [];
    const result = await listSlsLogstores({ project: 'app-logs', limit: 2 }, {
      auth,
      execute: async (operationRef, input, context) => {
        calls.push({ operationRef, input, context });
        return {
          requestId: 'req-logstore-1',
          response: {
            count: 2,
            total: 3,
            logstores: [
              { logstoreName: 'app', mode: 'standard', telemetryType: 'None', ttl: 30, shardCount: 2 },
              'audit'
            ]
          }
        };
      }
    });

    expect(calls).toEqual([{
      operationRef: 'sls.ListLogStores',
      input: { project: 'app-logs', offset: 0, size: 2 },
      context: { region: 'cn-hangzhou', auth }
    }]);
    expect(result).toMatchObject({
      stage: 'logs.logstores', regionId: 'cn-hangzhou', project: 'app-logs', count: 2, totalCount: 3, limit: 2, truncated: true,
      requestId: 'req-logstore-1',
      logstores: [
        { logstoreName: 'app', mode: 'standard', telemetryType: 'None', ttl: 30, shardCount: 2 },
        { logstoreName: 'audit' }
      ]
    });
  });

  it('maps optional protocol filters and stable empty output', async () => {
    let input: Record<string, unknown> | undefined;
    const result = await listSlsLogstores({ project: 'app-logs', logstoreName: 'app', mode: 'standard', telemetryType: 'None', limit: 20 }, {
      auth,
      execute: async (_operationRef, request) => {
        input = request;
        return { response: { logstores: [], total: 0 } };
      }
    });

    expect(input).toEqual({ project: 'app-logs', offset: 0, size: 20, logstoreName: 'app', mode: 'standard', telemetryType: 'None' });
    expect(result).toMatchObject({ stage: 'logs.logstores', count: 0, totalCount: 0, truncated: false, logstores: [] });
  });

  it('surfaces runner failures instead of returning an empty logstore list', async () => {
    await expect(listSlsLogstores({ project: 'app-logs' }, {
      auth,
      execute: async () => ({ ok: false, exitCode: 1, stderr: 'ProjectNotExist', response: null })
    })).rejects.toThrow('sls.ListLogStores 调用失败: ProjectNotExist');
  });
});
