import { describe, expect, it } from 'vitest';
import { getSlsIndex, listSlsProjects } from '../providers/sls-query';

const auth = { accountId: 'account-1', ak: 'ak-test', sk: 'sk-test', region: 'cn-hangzhou' };

describe('SLS project query provider', () => {
  it('invokes protocol-backed ListProject and projects safe project metadata', async () => {
    const calls: unknown[] = [];
    const result = await listSlsProjects({ limit: 2, fetchQuota: true }, {
      auth,
      execute: async (operationRef, input, context) => {
        calls.push({ operationRef, input, context });
        return {
          requestId: 'req-sls-1',
          response: {
            count: 2,
            total: 3,
            projects: [
              {
                projectName: 'serverless-cn-hangzhou-account-1',
                description: 'FC logs',
                region: 'cn-hangzhou',
                status: 'Normal',
                createTime: '2026-01-01T00:00:00Z',
                lastModifyTime: '2026-01-02T00:00:00Z',
                quota: { logstore: 10 },
                accessKeySecret: 'should-not-escape'
              },
              { projectName: 'app-logs', region: 'cn-shanghai' }
            ]
          }
        };
      }
    });

    expect(calls).toEqual([{
      operationRef: 'sls.ListProject',
      input: { offset: 0, size: 2, fetchQuota: true },
      context: { region: 'cn-hangzhou', auth }
    }]);
    expect(result).toMatchObject({
      stage: 'logs.projects', regionId: 'cn-hangzhou', count: 2, totalCount: 3, limit: 2, truncated: true,
      requestId: 'req-sls-1',
      projects: [
        { projectName: 'serverless-cn-hangzhou-account-1', description: 'FC logs', region: 'cn-hangzhou', status: 'Normal', createTime: '2026-01-01T00:00:00Z', lastModifyTime: '2026-01-02T00:00:00Z', quota: { logstore: 10 } },
        { projectName: 'app-logs', region: 'cn-shanghai' }
      ]
    });
    expect(JSON.stringify(result)).not.toContain('should-not-escape');
  });

  it('maps project and resource group filters while keeping an empty result stable', async () => {
    let input: Record<string, unknown> | undefined;
    const result = await listSlsProjects({ projectName: 'app-logs', resourceGroupId: 'rg-1', limit: 20 }, {
      auth,
      execute: async (_operationRef, request) => {
        input = request;
        return { response: { projects: [], total: 0 } };
      }
    });

    expect(input).toEqual({ offset: 0, size: 20, projectName: 'app-logs', resourceGroupId: 'rg-1' });
    expect(result).toMatchObject({ stage: 'logs.projects', count: 0, totalCount: 0, truncated: false, projects: [] });
  });

  it('surfaces runner failures instead of returning an empty project list', async () => {
    await expect(listSlsProjects({}, {
      auth,
      execute: async () => ({ ok: false, exitCode: 3, stderr: 'too broad path', response: null })
    })).rejects.toThrow('sls.ListProject 调用失败: too broad path');
  });

  it('projects a safe SLS index definition for Agent query planning', async () => {
    const result = await getSlsIndex({ project: 'app-logs', logstore: 'access' }, {
      auth,
      execute: async (operationRef, input, context) => {
        expect(operationRef).toBe('sls.GetIndex');
        expect(input).toEqual({ project: 'app-logs', logstore: 'access' });
        expect(context.region).toBe('cn-hangzhou');
        return {
          requestId: 'req-index-1',
          response: {
            index_mode: 'v2', storage: 'pg', ttl: 30,
            keys: { message: { type: 'text', token: [' '], doc_value: true } },
            line: { caseSensitive: false, token: [' '] },
            accessKeySecret: 'should-not-escape'
          }
        };
      }
    });

    expect(result).toMatchObject({
      stage: 'logs.index', project: 'app-logs', logstore: 'access', requestId: 'req-index-1',
      index: { indexMode: 'v2', storage: 'pg', ttl: 30, fields: [{ name: 'message', type: 'text', docValue: true }] }
    });
    expect(JSON.stringify(result)).not.toContain('should-not-escape');
  });
});
