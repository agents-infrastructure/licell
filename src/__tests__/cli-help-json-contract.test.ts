import { beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { extractJsonRecordsFromOutput } from '../utils/output';

beforeAll(() => {
  const warmup = spawnSync('bun', ['x', 'tsx', '--version'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  if (warmup.status !== 0) {
    throw new Error(warmup.stderr || warmup.stdout || warmup.error?.message || 'tsx warmup failed');
  }
}, 30000);

function runCliHelpJson(args: string[]) {
  const result = spawnSync(
    'bun',
    [
      'x',
      'tsx',
      '--tsconfig',
      resolve(process.cwd(), 'tsconfig.json'),
      resolve(process.cwd(), 'src/cli.ts'),
      ...args,
      '--help',
      '--output',
      'json'
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' }
    }
  );

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error?.message
  };
}

describe('cli help json contract', () => {
  it('locks deploy help json contract for task-aware result schema', () => {
    const result = runCliHelpJson(['deploy']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record?.stage).toBe('help');
    expect(record?.key).toBe('deploy');
    expect(record?.help?.kind).toBe('licell-help');
    expect(record?.help?.schemaVersion).toBe('1.0');
    expect(record?.help?.scope).toBe('command');
    expect(record?.help?.schemas?.cliRecord).toEqual({
      kind: 'licell-cli-record',
      schemaVersion: '1.0'
    });
    expect(record?.help?.nextActions.map((action: { commandTemplate?: string }) => action.commandTemplate)).toEqual([
      'licell deploy spec',
      'licell deploy check',
      'licell deploy --output json',
      'licell release promote <versionId>'
    ]);
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'functionName')).toBe(true);
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'configuredQualifiers[]')).toBe(true);
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'invokeCommand')).toBe(true);
    expect(record?.help?.renderedText).toContain('Structured Result:');
    expect(record?.help?.renderedText).toContain('`invokeCommand` · 当 `type=task` 时，推荐直接复制执行的任务调用命令。');
  }, 10000);

  it('locks task list help json contract for task tracking schema', () => {
    const result = runCliHelpJson(['task', 'list']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record?.stage).toBe('help');
    expect(record?.key).toBe('task list');
    expect(record?.help?.kind).toBe('licell-help');
    expect(record?.help?.scope).toBe('command');
    expect(record?.help?.automation?.preferredOutput).toBe('json');
    expect(record?.help?.nextActions.map((action: { commandTemplate?: string }) => action.commandTemplate)).toEqual([
      'licell task list [name] --output json',
      'licell task info <taskId> [name] --output json',
      'licell task stop <taskId> [name] --output json'
    ]);
    expect(record?.help?.result?.fieldTree.some((field: { name?: string }) => field.name === 'tasks[]')).toBe(true);
    const tasksNode = record?.help?.result?.fieldTree.find((field: { name?: string }) => field.name === 'tasks[]');
    expect(tasksNode?.children.some((field: { name?: string }) => field.name === 'tasks[].taskId')).toBe(true);
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'nextToken')).toBe(true);
    expect(record?.help?.renderedText).toContain('`tasks[]` · 异步任务摘要数组。');
    expect(record?.help?.renderedText).toContain('`nextToken` · 服务端下一页游标；若为 `null` 代表没有更多结果。');
  }, 10000);

  it('locks ecs list help json contract for agent discovery', () => {
    const result = runCliHelpJson(['ecs', 'list']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record?.stage).toBe('help');
    expect(record?.key).toBe('ecs list');
    expect(record?.help?.kind).toBe('licell-help');
    expect(record?.help?.scope).toBe('command');
    expect(record?.help?.automation?.preferredOutput).toBe('json');
    expect(record?.help?.safety?.level).toBe('safe');
    expect(record?.help?.options.map((option: { rawName?: string }) => option.rawName)).toEqual(expect.arrayContaining([
      '--region <regionId>',
      '--limit <n>',
      '--tag <key=value>',
      '--name-prefix <prefix>',
      '--private-ip <ip>',
      '--public-ip <ip>',
      '--eip <ip>'
    ]));
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'instances[]')).toBe(true);
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'filters')).toBe(true);
    expect(record?.help?.renderedText).toContain('`instances[]`');
  }, 10000);

  it('locks ecs info help json contract for agent discovery', () => {
    const result = runCliHelpJson(['ecs', 'info']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record?.stage).toBe('help');
    expect(record?.key).toBe('ecs info');
    expect(record?.help?.kind).toBe('licell-help');
    expect(record?.help?.scope).toBe('command');
    expect(record?.help?.automation?.preferredOutput).toBe('json');
    expect(record?.help?.safety?.level).toBe('safe');
    expect(record?.help?.options.map((option: { rawName?: string }) => option.rawName)).toContain('--region <regionId>');
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'detail.summary')).toBe(true);
    expect(record?.help?.result?.fields.some((field: { name?: string }) => field.name === 'detail.summary.securityGroupIds[]')).toBe(true);
    expect(record?.help?.renderedText).toContain('`detail.summary`');
    expect(record?.help?.result?.fields.map((field: { name?: string }) => field.name).join(' ')).not.toMatch(/rawAttribute|userData|vncUrl|consoleOutput|password|keyPairPrivateKey/);
  }, 10000);
});
