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

function runCliHelp(args: string[]) {
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

describe('cli help e2e', () => {
  it('prints root help text through the real CLI entry', () => {
    const result = runCliHelp(['--help']);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Command Groups:');
    expect(result.stdout).toContain('Common Tasks:');
    expect(result.stdout).toContain('Global Options:');
    expect(result.stdout).toContain('licell <command> --output json');
  }, 10000);


  it.each(['--version', '-v'])('prints version instead of root help for %s', (flag) => {
    const result = runCliHelp([flag]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.trim()).toMatch(/^licell\/[0-9A-Za-z.+-]+(?:\s+.+)?$/);
    expect(result.stdout).not.toContain('Usage:');
    expect(result.stdout).not.toContain('Command Groups:');
  }, 15000);

  it('prints namespace help text through the real CLI entry', () => {
    const result = runCliHelp(['domain', 'app', '--help']);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('licell domain app');
    expect(result.stdout).toContain('Decision Guide:');
    expect(result.stdout).toContain('Subcommands:');
    expect(result.stdout).toContain('domain app bind');
    expect(result.stdout).toContain('domain app unbind');
    expect(result.stdout).toContain('Recommended Flow:');
  }, 10000);

  it('emits structured JSON help records through the real CLI entry', () => {
    const result = runCliHelp(['domain', 'app', 'bind', '--help', '--output', 'json']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);
    expect(records[0]?.kind).toBe('licell-cli-record');
    expect(records[0]?.schemaVersion).toBe('1.0');
    expect(records[0]?.type).toBe('result');
    expect(records[0]?.stage).toBe('help');
    expect(records[0]?.scope).toBe('command');
    expect(records[0]?.key).toBe('domain app bind');
    expect(records[0]?.help?.schemaVersion).toBe('1.0');
    expect(records[0]?.help?.kind).toBe('licell-help');
    expect(records[0]?.help?.title).toBe('licell domain app bind <domain>');
    expect(records[0]?.help?.result?.outcomeKey).toBe('bound');
    expect(records[0]?.help?.result?.fields.some((field: { name?: string }) => field.name === 'finalUrl')).toBe(true);
    expect(records[0]?.help?.result?.fieldTree.some((field: { name?: string }) => field.name === 'finalUrl')).toBe(true);
    expect(records[0]?.help?.renderedText).toContain('Structured Result:');
    expect(records[0]?.help?.renderedText).toContain('`finalUrl` · 最终访问 URL。');
    expect(records[0]?.help?.blocks).toBeUndefined();
  }, 10000);

  it('emits structured JSON help for doctor through the real CLI entry', () => {
    const result = runCliHelp(['doctor', '--help', '--output', 'json']);
    const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(records).toHaveLength(1);
    expect(records[0]?.stage).toBe('help');
    expect(records[0]?.key).toBe('doctor');
    expect(records[0]?.help?.title).toBe('licell doctor');
    expect(records[0]?.help?.result?.outcomeKey).toBe('healthy');
    expect(records[0]?.help?.result?.fields.some((field: { name?: string }) => field.name === 'checks')).toBe(true);
    expect(records[0]?.help?.result?.fieldTree.some((field: { name?: string }) => field.name === 'checks[]')).toBe(true);
  }, 10000);
});
