import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
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

function runCli(args: string[], cwd: string) {
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
      cwd,
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

describe('cli event e2e', () => {
  it('emits normalized start event before command result', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'licell-cli-event-'));
    try {
      const result = runCli(['init', '--yes', '--runtime', 'nodejs22', '--app', 'cli-event-demo', '--output', 'json'], cwd);
      const records = extractJsonRecordsFromOutput(result.stdout) as Array<Record<string, any>>;

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(records.length).toBeGreaterThanOrEqual(2);
      expect(records[0]?.type).toBe('event');
      expect(records[0]?.stage).toBe('init');
      expect(records[0]?.action).toBe('init');
      expect(records[0]?.status).toBe('start');
      expect(records[0]?.source).toBe('command');
      expect(records[0]?.terminal).toBe(false);
      expect(records.some((record) => record.type === 'result' && record.stage === 'init')).toBe(true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  }, 10000);
});
