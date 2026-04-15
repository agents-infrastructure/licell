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

function runCli(args: string[]) {
  const result = spawnSync(
    'bun',
    [
      'x',
      'tsx',
      '--tsconfig',
      resolve(process.cwd(), 'tsconfig.json'),
      resolve(process.cwd(), 'src/cli.ts'),
      ...args
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

describe('cli error e2e', () => {
  it('emits structured unknown-command errors with next actions', () => {
    const result = runCli(['deployy', '--output', 'json']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);
    expect(records[0]?.type).toBe('error');
    expect(records[0]?.ok).toBe(false);
    expect(records[0]?.stage).toBe('parse');
    expect(records[0]?.error?.code).toBe('CLI_UNKNOWN_COMMAND');
    expect(records[0]?.nextCommands?.[0]?.commandTemplate).toContain('--help');
    expect(records[0]?.nextActions?.[0]?.commandTemplate).toContain('--help');
    expect(records[0]?.nextActions?.[0]?.source).toBe('error-remediation');
  }, 15000);

  it('emits structured missing-args errors with compatibility nextCommands', () => {
    const result = runCli(['dns', 'records', 'add', '--output', 'json']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);
    expect(records[0]?.type).toBe('error');
    expect(records[0]?.ok).toBe(false);
    expect(records[0]?.error?.code).toBe('CLI_MISSING_REQUIRED_ARGS');
    expect(records[0]?.nextCommands?.[0]?.commandKey).toBe('dns records add');
    expect(records[0]?.nextActions?.[0]?.commandKey).toBe('dns records add');
    expect(records[0]?.nextActions?.[0]?.source).toBe('error-remediation');
  }, 10000);
});
