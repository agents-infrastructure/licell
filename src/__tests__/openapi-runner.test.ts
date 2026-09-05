import { describe, expect, it, vi } from 'vitest';
import { buildAlicloudApiScaffold, executeAlicloudApi } from '../providers/openapi/runner';

describe('aliyun cli OpenAPI runner adapter', () => {
  it('builds a dry-run plan with nested repeat-list parameters', async () => {
    const result = await executeAlicloudApi('vpc.CreateVpc', {
      RegionId: 'cn-hangzhou',
      CidrBlock: '10.0.0.0/8',
      Tag: [{ Key: 'env', Value: 'test' }]
    }, { dryRun: true });

    expect(result.ok).toBe(true);
    expect(result.plan.runner).toBe('<aliyun-cli-runner>');
    expect(result.plan.args).toContain('--Tag.1.Key');
    expect(result.plan.args).toContain('env');
    expect(result.plan.args).toContain('--Tag.1.Value');
    expect(result.plan.args).toContain('test');
  });

  it('passes credentials through the child environment and normalizes JSON output', async () => {
    const spawnProcess = vi.fn(async (_command: string, args: string[], options: { env: NodeJS.ProcessEnv }) => {
      expect(args).toContain('DescribeVpcs');
      expect(args).not.toContain('--output');
      expect(options.env.ALIBABA_CLOUD_ACCESS_KEY_ID).toBe('test-ak');
      expect(options.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET).toBe('test-sk');
      return { exitCode: 0, signal: null, stdout: '{"RequestId":"req-1","Vpcs":[]}', stderr: '' };
    });

    const result = await executeAlicloudApi('vpc.DescribeVpcs', { RegionId: 'cn-hangzhou' }, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      runnerPath: process.execPath,
      spawnProcess
    });

    expect(spawnProcess).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.requestId).toBe('req-1');
    expect(result.response).toEqual({ RequestId: 'req-1', Vpcs: [] });
  });

  it('uses the aliyun-cli REST invocation shape and forwards headers', async () => {
    const spawnProcess = vi.fn(async (_command: string, args: string[]) => {
      expect(args.slice(0, 3)).toEqual(['fc', 'GET', '/2023-03-30/layers/shared/versions']);
      expect(args).not.toContain('--output');
      expect(args).toContain('--layerName');
      expect(args).toContain('shared');
      expect(args).toContain('--header');
      expect(args).toContain('X-Test=value');
      return { exitCode: 0, signal: null, stdout: '{"RequestId":"rest-1"}', stderr: '' };
    });

    const result = await executeAlicloudApi('fc.ListLayerVersions', { layerName: 'shared' }, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      headers: { 'X-Test': 'value' },
      runnerPath: process.execPath,
      spawnProcess
    });

    expect(result.ok).toBe(true);
    expect(result.requestId).toBe('rest-1');
  });

  it('uses the operation invocation shape for REST APIs with a root path', async () => {
    const spawnProcess = vi.fn(async (_command: string, args: string[]) => {
      expect(args.slice(0, 2)).toEqual(['sls', 'ListProject']);
      expect(args).not.toContain('GET');
      expect(args).not.toContain('/');
      return { exitCode: 0, signal: null, stdout: '{"count":0,"projects":[]}', stderr: '' };
    });

    const result = await executeAlicloudApi('sls.ListProject', { size: 20 }, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-shanghai' },
      runnerPath: process.execPath,
      spawnProcess
    });

    expect(result.ok).toBe(true);
  });

  it('compiles normalized aliases into encoded REST path segments', async () => {
    const result = await executeAlicloudApi('cs.DescribeClusterDetail', {
      cluster_id: 'cluster/with space'
    }, { dryRun: true, region: 'cn-hangzhou' });

    expect(result.plan.requestPath).toBe('/clusters/cluster%2Fwith%20space');
    expect(result.plan.args.slice(0, 3)).toEqual(['cs', 'GET', '/clusters/cluster%2Fwith%20space']);
    expect(result.plan.args).toContain('--ClusterId');
    expect(result.plan.args).toContain('cluster/with space');
    expect(result.plan.args).not.toContain('--cluster_id');
  });

  it('compiles every path segment from protocol metadata across products', async () => {
    const result = await executeAlicloudApi('rocketmq.GetConsumerGroupLag', {
      instance_id: 'rmq-instance',
      'consumer-group-id': 'orders/primary',
      topicName: 'orders'
    }, { dryRun: true, region: 'cn-hangzhou' });

    expect(result.plan.requestPath).toBe('/instances/rmq-instance/consumerGroups/orders%2Fprimary/lag');
    expect(result.plan.args).toContain('--topicName');
    expect(result.plan.args).toContain('orders');
    expect(result.plan.args.some((arg) => arg.includes('[instanceId]'))).toBe(false);
  });

  it('preserves protocol Path parameters that are not URL placeholders', async () => {
    const result = await executeAlicloudApi('sls.PullLogs', {
      project: 'logs-project',
      log_store: 'application',
      shard_id: 0,
      count: 100,
      cursor: 'cursor-value'
    }, { dryRun: true, region: 'cn-hangzhou' });

    expect(result.plan.requestPath).toBe('/logstores/application/shards/0?type=log');
    expect(result.plan.args).toContain('--project');
    expect(result.plan.args).toContain('logs-project');
    expect(result.plan.args).toContain('--logStore');
    expect(result.plan.args).toContain('application');
    expect(result.plan.args).toContain('--shardId');
  });

  it('validates required and unknown parameters before spawning the runner', async () => {
    await expect(executeAlicloudApi('cs.DescribeClusterDetail', {}, { dryRun: true }))
      .rejects.toThrow('缺少必填 API 参数: ClusterId');
    await expect(executeAlicloudApi('cs.DescribeClusterDetail', {
      ClusterId: 'cluster-id',
      Unknown: true
    }, { dryRun: true }))
      .rejects.toThrow('未知 API 参数: Unknown');
  });

  it('requires exact input only when protocol parameter aliases are ambiguous', async () => {
    const exact = await executeAlicloudApi('sddp.DescribeAuditLogs', {
      RuleID: 'legacy-rule',
      RuleId: 'current-rule'
    }, { dryRun: true });
    expect(exact.plan.args).toContain('--RuleID');
    expect(exact.plan.args).toContain('--RuleId');

    await expect(executeAlicloudApi('sddp.DescribeAuditLogs', {
      rule_id: 'ambiguous-rule'
    }, { dryRun: true })).rejects.toThrow('API 参数名有歧义');
  });

  it('returns a failed result when the runner exits non-zero', async () => {
    const result = await executeAlicloudApi('vpc.DescribeVpcs', {}, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      runnerPath: process.execPath,
      spawnProcess: async () => ({ exitCode: 7, signal: null, stdout: '', stderr: 'access denied' })
    });

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(7);
    expect(result.stderr).toBe('access denied');
  });

  it('redacts credentials and sensitive response fields from the result', async () => {
    const result = await executeAlicloudApi('vpc.DescribeVpcs', {}, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      runnerPath: process.execPath,
      spawnProcess: async () => ({
        exitCode: 0,
        signal: null,
        stdout: '{"RequestId":"req-2","AccessKeySecret":"test-sk","API_KEY":"api-secret","COOKIE":"session-cookie","note":"test-ak"}',
        stderr: 'secret=test-sk'
      })
    });

    expect(result.stdout).not.toContain('test-sk');
    expect(result.stderr).not.toContain('test-sk');
    expect(result.response).toMatchObject({
      AccessKeySecret: '[REDACTED]',
      API_KEY: '[REDACTED]',
      COOKIE: '[REDACTED]',
      note: '[REDACTED]'
    });
  });

  it('blocks generic raw KubeConfig access before a redacted value can be reused', async () => {
    const spawnProcess = vi.fn(async () => ({
      exitCode: 0,
      signal: null,
      stdout: '{"config":"apiVersion: v1\\nusers: []"}',
      stderr: ''
    }));
    await expect(executeAlicloudApi('cs.DescribeClusterUserKubeconfig', {
      ClusterId: 'cluster-id',
      TemporaryDurationMinutes: 15
    }, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      runnerPath: process.execPath,
      spawnProcess
    })).rejects.toMatchObject({
      name: 'SensitiveResponseAccessError',
      code: 'SENSITIVE_RESPONSE_BLOCKED',
      details: { operationRef: 'cs.DescribeClusterUserKubeconfig', safeRoute: 'k8s workloads' }
    });
    expect(spawnProcess).not.toHaveBeenCalled();
  });

  it('allows internal consumers to receive KubeConfig without exposing it in stdout', async () => {
    const result = await executeAlicloudApi('cs.DescribeClusterUserKubeconfig', {
      ClusterId: 'cluster-id',
      TemporaryDurationMinutes: 15
    }, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      runnerPath: process.execPath,
      exposeSensitiveResponse: true,
      spawnProcess: async () => ({
        exitCode: 0,
        signal: null,
        stdout: '{"config":"apiVersion: v1\\nusers: []","expiration":"2026-09-04T03:00:00Z"}',
        stderr: ''
      })
    });

    expect(result.response).toMatchObject({ config: 'apiVersion: v1\nusers: []' });
    expect(result.stdout).toBe('[REDACTED]');
  });

  it('generates a nested request template from the capability schema', () => {
    const result = buildAlicloudApiScaffold('vpc.CreateVpc');
    expect(result.template).toMatchObject({
      RegionId: null,
      Tag: [{ Key: null, Value: null }]
    });
    expect(result.invocation).toContain('--dry-run');
  });

  it('passes a body parameter as raw JSON instead of nesting it under body', async () => {
    const spawnProcess = vi.fn(async (_command: string, args: string[]) => {
      const bodyIndex = args.indexOf('--body');
      expect(bodyIndex).toBeGreaterThan(-1);
      expect(JSON.parse(args[bodyIndex + 1]!)).toEqual({ description: 'alias' });
      return { exitCode: 0, signal: null, stdout: '{}', stderr: '' };
    });

    await executeAlicloudApi('fc.CreateAlias', {
      functionName: 'hello',
      body: { description: 'alias' }
    }, {
      auth: { accountId: 'account', ak: 'test-ak', sk: 'test-sk', region: 'cn-hangzhou' },
      runnerPath: process.execPath,
      spawnProcess
    });
    expect(spawnProcess).toHaveBeenCalledOnce();
  });
});
