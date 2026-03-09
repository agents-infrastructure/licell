import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { extractJsonRecordsFromOutput } from '../utils/output';

const NPM_CACHE_DIR = mkdtempSync(join(tmpdir(), 'licell-help-e2e-'));

afterAll(() => {
  rmSync(NPM_CACHE_DIR, { recursive: true, force: true });
});

beforeAll(() => {
  const warmup = spawnSync('npx', ['--yes', 'tsx', '--version'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: NPM_CACHE_DIR,
      FORCE_COLOR: '0'
    }
  });

  if (warmup.status !== 0) {
    throw new Error(warmup.stderr || warmup.stdout || warmup.error?.message || 'tsx warmup failed');
  }
}, 20000);

function runCliHelp(args: string[]) {
  const result = spawnSync(
    'npx',
    [
      '--yes',
      'tsx',
      '--tsconfig',
      resolve(process.cwd(), 'tsconfig.json'),
      resolve(process.cwd(), 'src/cli.ts'),
      ...args
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: NPM_CACHE_DIR,
        FORCE_COLOR: '0'
      }
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


  it('prints version instead of root help for global version flags', () => {
    const longFlag = runCliHelp(['--version']);
    const shortFlag = runCliHelp(['-v']);

    for (const result of [longFlag, shortFlag]) {
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim()).toMatch(/^licell\/[0-9A-Za-z.+-]+(?:\s+.+)?$/);
      expect(result.stdout).not.toContain('Usage:');
      expect(result.stdout).not.toContain('Command Groups:');
    }
  }, 10000);

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
    expect(records[0]?.type).toBe('result');
    expect(records[0]?.stage).toBe('help');
    expect(records[0]?.scope).toBe('command');
    expect(records[0]?.key).toBe('domain app bind');
    expect(records[0]?.help?.title).toBe('licell domain app bind <domain>');
    expect(records[0]?.help?.blocks.some((block: { kind?: string }) => block.kind === 'structured-result')).toBe(true);
    expect(records[0]?.help?.text).toContain('Structured Result:');
    expect(records[0]?.help?.text).toContain('`finalUrl` · 最终访问 URL。');
  }, 10000);
});
