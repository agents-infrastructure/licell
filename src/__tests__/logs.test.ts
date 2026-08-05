import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cac } from 'cac';
import { initOutputContext, LICELL_JSON_PREFIX } from '../utils/output';

const mocks = vi.hoisted(() => ({
  getFunctionInfo: vi.fn()
}));
import {
  appendSlsSearchCondition,
  buildFunctionLogQuery,
  resolveDefaultFcSlsProject,
  resolveSlsTailTarget,
  resolveSlsTimeRange,
  sanitizeQueryValue
} from '../providers/logs';

vi.mock('../providers/fc/function-ops', () => ({
  getFunctionInfo: mocks.getFunctionInfo
}));

vi.mock('../utils/auth-recovery', () => ({
  executeWithAuthRecovery: async (_options: unknown, task: () => Promise<unknown>) => task()
}));

vi.mock('../utils/cli-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/cli-shared')>();
  return {
    ...actual,
    ensureAuthOrExit: vi.fn(),
    isInteractiveTTY: vi.fn(() => false),
    showIntro: vi.fn()
  };
});

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: vi.fn(() => ({
      accountId: '123456',
      ak: 'ak',
      sk: 'sk',
      region: 'cn-hangzhou'
    }))
  }
}));

vi.mock('@alicloud/sls20201230', () => {
  class ConfigValue {
    constructor(input?: Record<string, unknown>) {
      Object.assign(this, input || {});
    }
  }

  class MockSlsClient {
    static getLogsMock = vi.fn();
    static createProjectMock = vi.fn();
    static createLogStoreMock = vi.fn();
    static createIndexMock = vi.fn();
    static updateIndexMock = vi.fn();
    static configs: Array<Record<string, unknown>> = [];

    constructor(config?: Record<string, unknown>) {
      MockSlsClient.configs.push(config || {});
    }

    getLogs(project: string, logstore: string, request: { query?: string }) {
      return MockSlsClient.getLogsMock(project, logstore, request);
    }

    createProject(request: unknown) {
      return MockSlsClient.createProjectMock(request);
    }

    createLogStore(project: string, request: unknown) {
      return MockSlsClient.createLogStoreMock(project, request);
    }

    createIndex(project: string, logstore: string, request: unknown) {
      return MockSlsClient.createIndexMock(project, logstore, request);
    }

    updateIndex(project: string, logstore: string, request: unknown) {
      return MockSlsClient.updateIndexMock(project, logstore, request);
    }
  }

  return {
    default: MockSlsClient,
    ListLogStoresRequest: ConfigValue,
    ListProjectRequest: ConfigValue,
    CreateProjectRequest: ConfigValue,
    CreateLogStoreRequest: ConfigValue,
    CreateIndexRequest: ConfigValue,
    CreateIndexRequestLine: ConfigValue,
    UpdateIndexRequest: ConfigValue,
    UpdateIndexRequestLine: ConfigValue,
    GetLogsRequest: ConfigValue,
    KeysValue: ConfigValue
  };
});

beforeEach(async () => {
  mocks.getFunctionInfo.mockReset();
  const sls = await import('@alicloud/sls20201230');
  const mockSls = sls.default as unknown as {
    getLogsMock: ReturnType<typeof vi.fn>;
    createProjectMock: ReturnType<typeof vi.fn>;
    createLogStoreMock: ReturnType<typeof vi.fn>;
    createIndexMock: ReturnType<typeof vi.fn>;
    updateIndexMock: ReturnType<typeof vi.fn>;
    configs: Array<Record<string, unknown>>;
  };
  mockSls.getLogsMock.mockReset();
  mockSls.createProjectMock.mockReset();
  mockSls.createProjectMock.mockResolvedValue({});
  mockSls.createLogStoreMock.mockReset();
  mockSls.createLogStoreMock.mockResolvedValue({});
  mockSls.createIndexMock.mockReset();
  mockSls.createIndexMock.mockResolvedValue({});
  mockSls.updateIndexMock.mockReset();
  mockSls.updateIndexMock.mockResolvedValue({});
  mockSls.configs.length = 0;
  initOutputContext('text', ['node', 'src/cli.ts']);
});

describe('sanitizeQueryValue', () => {
  it('returns normal string unchanged', () => {
    expect(sanitizeQueryValue('my-app-name')).toBe('my-app-name');
  });

  it('strips single quotes', () => {
    expect(sanitizeQueryValue("app'name")).toBe('appname');
  });

  it('strips double quotes', () => {
    expect(sanitizeQueryValue('app"name')).toBe('appname');
  });

  it('strips backslashes', () => {
    expect(sanitizeQueryValue('app\\name')).toBe('appname');
  });

  it('strips wildcards', () => {
    expect(sanitizeQueryValue('app*')).toBe('app');
    expect(sanitizeQueryValue('app?')).toBe('app');
  });

  it('strips colons', () => {
    expect(sanitizeQueryValue('key:value')).toBe('keyvalue');
  });

  it('strips pipes', () => {
    expect(sanitizeQueryValue('a|b')).toBe('ab');
  });

  it('strips brackets', () => {
    expect(sanitizeQueryValue('a[0]')).toBe('a0');
    expect(sanitizeQueryValue('a{b}')).toBe('ab');
    expect(sanitizeQueryValue('a(b)')).toBe('ab');
  });

  it('strips boolean operators', () => {
    expect(sanitizeQueryValue('a&b')).toBe('ab');
    expect(sanitizeQueryValue('!admin')).toBe('admin');
    expect(sanitizeQueryValue('a^b')).toBe('ab');
    expect(sanitizeQueryValue('~approx')).toBe('approx');
  });

  it('handles SLS injection attempt', () => {
    const malicious = '* | select count(*) as total';
    const sanitized = sanitizeQueryValue(malicious);
    expect(sanitized).not.toContain('|');
    expect(sanitized).not.toContain('*');
    expect(sanitized).not.toContain('(');
    expect(sanitized).not.toContain(')');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeQueryValue('my-app_v2')).toBe('my-app_v2');
  });

  it('preserves digits', () => {
    expect(sanitizeQueryValue('app123')).toBe('app123');
  });

  it('preserves dots', () => {
    expect(sanitizeQueryValue('api.v2.service')).toBe('api.v2.service');
  });

  it('handles empty string', () => {
    expect(sanitizeQueryValue('')).toBe('');
  });

  it('handles string with only special chars', () => {
    expect(sanitizeQueryValue('*?:!&|')).toBe('');
  });
});

describe('appendSlsSearchCondition', () => {
  it('uses condition when query is empty', () => {
    expect(appendSlsSearchCondition(undefined, 'level:error')).toBe('level:error');
    expect(appendSlsSearchCondition('*', 'level:error')).toBe('level:error');
  });

  it('appends condition before sql pipeline', () => {
    expect(appendSlsSearchCondition('* | select count(*) as total', 'functionName: "demo"'))
      .toBe('functionName: "demo" | select count(*) as total');
  });

  it('joins regular search expressions with and', () => {
    expect(appendSlsSearchCondition('level:error', 'functionName: "demo"'))
      .toBe('level:error and functionName: "demo"');
  });
});

describe('buildFunctionLogQuery', () => {
  it('returns raw query when function name is absent', () => {
    expect(buildFunctionLogQuery(undefined, 'level:error')).toBe('level:error');
  });

  it('injects sanitized functionName filter', () => {
    expect(buildFunctionLogQuery('demo"|*', 'level:error'))
      .toBe('level:error and functionName: "demo"');
  });

  it('supports sql pipeline query', () => {
    expect(buildFunctionLogQuery('demo', '* | select count(*) as total'))
      .toBe('functionName: "demo" | select count(*) as total');
  });
});

describe('resolveSlsTimeRange', () => {
  it('uses once default window when not specified', () => {
    expect(resolveSlsTimeRange({ once: true }, 1_700_000_000)).toEqual({
      from: 1_699_999_880,
      to: 1_700_000_000
    });
  });

  it('uses stream default lookback when not specified', () => {
    expect(resolveSlsTimeRange({}, 1_700_000_000)).toEqual({
      from: 1_699_999_940,
      to: 1_700_000_000
    });
  });

  it('prefers explicit from and to', () => {
    expect(resolveSlsTimeRange({ from: 100, to: 200, sinceSeconds: 10 }, 999)).toEqual({
      from: 100,
      to: 200
    });
  });

  it('clamps from when it exceeds to', () => {
    expect(resolveSlsTimeRange({ from: 300, to: 200 }, 999)).toEqual({
      from: 200,
      to: 200
    });
  });
});

describe('resolveSlsTailTarget', () => {
  it('uses fc defaults', () => {
    expect(resolveSlsTailTarget(
      { accountId: '123456', region: 'cn-hangzhou' },
      {}
    )).toEqual({
      region: 'cn-hangzhou',
      project: 'aliyun-fc-cn-hangzhou-123456',
      logstore: 'function-log',
      topic: undefined
    });
  });

  it('uses default-logs for explicit serverless project', () => {
    expect(resolveSlsTailTarget(
      { accountId: '123456', region: 'cn-hangzhou' },
      { project: 'serverless-cn-hangzhou-abcdef' }
    )).toEqual({
      region: 'cn-hangzhou',
      project: 'serverless-cn-hangzhou-abcdef',
      logstore: 'default-logs',
      topic: undefined
    });
  });

  it('applies explicit target overrides', () => {
    expect(resolveSlsTailTarget(
      { accountId: '123456', region: 'cn-hangzhou' },
      { region: 'cn-shanghai', project: 'custom-project', logstore: 'custom-store', topic: 'demo' }
    )).toEqual({
      region: 'cn-shanghai',
      project: 'custom-project',
      logstore: 'custom-store',
      topic: 'demo'
    });
  });
});

describe('resolveDefaultFcSlsProject', () => {
  it('formats project name from region and account id', () => {
    expect(resolveDefaultFcSlsProject({ accountId: '123456', region: 'cn-hangzhou' }))
      .toBe('aliyun-fc-cn-hangzhou-123456');
  });
});

describe('tailLogs', () => {
  it('updates the default FC SLS index when it already exists', async () => {
    const sls = await import('@alicloud/sls20201230');
    const mockSls = sls.default as unknown as {
      createIndexMock: ReturnType<typeof vi.fn>;
      updateIndexMock: ReturnType<typeof vi.fn>;
    };
    const conflict = new Error('index already exists');
    (conflict as Error & { code?: string }).code = 'Conflict';
    mockSls.createIndexMock.mockRejectedValue(conflict);

    const { ensureDefaultFcSlsLogConfig } = await import('../providers/logs');
    await expect(ensureDefaultFcSlsLogConfig()).resolves.toMatchObject({
      project: 'aliyun-fc-cn-hangzhou-123456',
      logstore: 'function-log'
    });

    expect(mockSls.updateIndexMock).toHaveBeenCalledWith(
      'aliyun-fc-cn-hangzhou-123456',
      'function-log',
      expect.objectContaining({
        keys: expect.objectContaining({
          functionName: expect.any(Object),
          requestId: expect.any(Object),
          message: expect.any(Object)
        }),
        line: expect.any(Object)
      })
    );
  });

  it('repairs invalid SLS index config and retries one-shot log queries', async () => {
    mocks.getFunctionInfo.mockResolvedValue({
      functionName: 'demo-api',
      logConfig: {
        project: 'aliyun-fc-cn-hangzhou-123456',
        logstore: 'function-log'
      }
    });
    const sls = await import('@alicloud/sls20201230');
    const mockSls = sls.default as unknown as {
      getLogsMock: ReturnType<typeof vi.fn>;
      createIndexMock: ReturnType<typeof vi.fn>;
      updateIndexMock: ReturnType<typeof vi.fn>;
    };
    const invalidIndex = new Error('logStore config is invalid');
    (invalidIndex as Error & { code?: string }).code = 'InvalidLogStoreIndexConfig';
    const conflict = new Error('index already exists');
    (conflict as Error & { code?: string }).code = 'Conflict';
    mockSls.createIndexMock.mockRejectedValue(conflict);
    mockSls.getLogsMock
      .mockRejectedValueOnce(invalidIndex)
      .mockResolvedValueOnce({
        body: [
          { __time__: '1700000000', message: 'hello', functionName: 'demo-api' }
        ]
      });

    const { tailLogs } = await import('../providers/logs');
    const result = await tailLogs('demo-api', { once: true, silent: true, windowSeconds: 10 });

    expect(mockSls.updateIndexMock).toHaveBeenCalledWith(
      'aliyun-fc-cn-hangzhou-123456',
      'function-log',
      expect.any(Object)
    );
    expect(mockSls.getLogsMock).toHaveBeenCalledTimes(2);
    expect(result && 'logs' in result ? result.logs : []).toHaveLength(1);
  });

  it('queries the function configured logConfig before default discovery', async () => {
    mocks.getFunctionInfo.mockResolvedValue({
      functionName: 'demo-api',
      logConfig: {
        project: 'aliyun-fc-cn-hangzhou-123456',
        logstore: 'function-log'
      }
    });
    const sls = await import('@alicloud/sls20201230');
    const getLogsMock = (sls.default as unknown as { getLogsMock: ReturnType<typeof vi.fn> }).getLogsMock;
    getLogsMock.mockResolvedValue({
      body: [
        { __time__: '1700000000', message: 'hello', functionName: 'demo-api' }
      ]
    });

    const { tailLogs } = await import('../providers/logs');
    const result = await tailLogs('demo-api', { once: true, silent: true, windowSeconds: 10 });

    expect(getLogsMock).toHaveBeenCalledWith(
      'aliyun-fc-cn-hangzhou-123456',
      'function-log',
      expect.objectContaining({ query: 'functionName: "demo-api"' })
    );
    expect(result && 'logs' in result ? result.logs : []).toHaveLength(1);
  });
});

describe('logs command region override', () => {
  it('routes logs query to the selected SLS endpoint and structured result', async () => {
    const sls = await import('@alicloud/sls20201230');
    const mockSls = sls.default as unknown as {
      getLogsMock: ReturnType<typeof vi.fn>;
      configs: Array<Record<string, unknown>>;
    };
    mockSls.getLogsMock.mockResolvedValue({
      body: [{ __time__: '1700000000', message: 'hello' }]
    });

    const argv = ['node', 'src/cli.ts', 'logs', 'query', '*', '--region', 'cn-shanghai'];
    initOutputContext('json', argv);
    const stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const cli = cac('licell');
      const { registerLogsCommand } = await import('../commands/logs');
      registerLogsCommand(cli);
      await cli.parse([
        'node',
        'src/cli.ts',
        'logs query',
        '*',
        '--project',
        'demo-project',
        '--store',
        'demo-store',
        '--region',
        'cn-shanghai'
      ]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSls.configs).toContainEqual(expect.objectContaining({
        endpoint: 'cn-shanghai.log.aliyuncs.com'
      }));
      const result = stdoutWriteSpy.mock.calls
        .flatMap(([chunk]) => String(chunk).split('\n'))
        .filter((line) => line.startsWith(LICELL_JSON_PREFIX))
        .map((line) => JSON.parse(line.slice(LICELL_JSON_PREFIX.length)) as Record<string, unknown>)
        .find((record) => record.type === 'result');
      expect(result).toMatchObject({
        type: 'result',
        stage: 'logs.query',
        region: 'cn-shanghai',
        callRegionId: 'cn-shanghai'
      });
    } finally {
      stdoutWriteSpy.mockRestore();
      initOutputContext('text', ['node', 'src/cli.ts']);
    }
  });
});
