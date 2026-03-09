import { describe, expect, it, vi } from 'vitest';
import {
  LICELL_JSON_PREFIX,
  buildCliErrorRecord,
  emitCommandResult,
  extractJsonRecordsFromOutput,
  initOutputContext,
  parseGlobalOutputModeArgv
} from '../utils/output';

describe('output utils', () => {
  it('parses and strips global --output option', () => {
    const parsed = parseGlobalOutputModeArgv([
      'node',
      'src/cli.ts',
      'deploy',
      '--type',
      'api',
      '--output',
      'json'
    ]);
    expect(parsed.mode).toBe('json');
    expect(parsed.argv).toEqual([
      'node',
      'src/cli.ts',
      'deploy',
      '--type',
      'api'
    ]);
  });

  it('rejects invalid output mode', () => {
    expect(() =>
      parseGlobalOutputModeArgv(['node', 'src/cli.ts', 'deploy', '--output', 'yaml'])
    ).toThrow('--output 仅支持 text 或 json');
  });

  it('builds structured permission error record', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'deploy']);
    const record = buildCliErrorRecord({
      code: 'AccessDenied',
      message: 'Forbidden: no permission',
      data: { RequestId: 'abc-123' }
    }) as any;
    expect(record.type).toBe('error');
    expect(record.command).toBe('deploy');
    expect(record.error.category).toBe('permission');
    expect(record.error.code).toBe('AUTH_PERMISSION_DENIED');
    expect(record.provider.requestId).toBe('abc-123');
  });

  it('builds structured missing-args input error record', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'dns', 'records', 'list']);
    const record = buildCliErrorRecord(new Error('missing required args for command `dns records list <domain>`')) as any;
    expect(record.error.category).toBe('input');
    expect(record.error.code).toBe('CLI_MISSING_REQUIRED_ARGS');
    expect(record.remediation[0].commandTemplate).toBe('licell dns records list <domain>');
  });

  it('builds structured deploy precheck error with details', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'deploy']);
    const error = Object.assign(new Error('部署前预检失败（入口/运行时不满足 FC 要求）'), {
      code: 'DEPLOY_PRECHECK_FAILED',
      details: {
        runtime: 'python3.13',
        entry: 'src/main.py',
        issues: [{ id: 'entry.runtime_contract', level: 'error', message: 'missing handler' }]
      }
    });
    const record = buildCliErrorRecord(error) as any;
    expect(record.error.category).toBe('input');
    expect(record.error.code).toBe('CLI_DEPLOY_PRECHECK_FAILED');
    expect(record.details.runtime).toBe('python3.13');
    expect(record.details.entry).toBe('src/main.py');
    expect(record.remediation.some((tip: any) => tip.type === 'read_spec')).toBe(true);
    expect(record.remediation.some((tip: any) => tip.type === 'run_precheck')).toBe(true);
  });

  it('extracts json records from mixed output', () => {
    const raw = [
      'normal text line',
      `${LICELL_JSON_PREFIX}${JSON.stringify({ type: 'event', stage: 'deploy', ok: true })}`,
      `${LICELL_JSON_PREFIX}${JSON.stringify({ type: 'result', ok: true })}`,
      'another line'
    ].join('\n');

    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(2);
    expect(records[0].type).toBe('event');
    expect(records[1].type).toBe('result');
  });


  it('keeps result record metadata even when payload has a type field', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'dns', 'records', 'add']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    emitCommandResult({ domain: 'bazhuayu.xyz', type: 'TXT', recordId: '123' });

    const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].type).toBe('result');
    expect(records[0].recordId).toBe('123');
    expect(records[0].ok).toBe(true);

    writeSpy.mockRestore();
  });
  it('auto-infers stage and bound outcome from command context', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'domain', 'app', 'bind']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    emitCommandResult({ domain: 'api.example.com' });

    const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].stage).toBe('domain.app.bind');
    expect(records[0].bound).toBe(true);
    expect(records[0].domain).toBe('api.example.com');

    writeSpy.mockRestore();
  });

  it('preserves explicit outcome fields when emitting command result', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'oss', 'domain', 'unbind']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    emitCommandResult({ bucket: 'demo-bucket', domain: 'static.example.com', unbound: false });

    const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].stage).toBe('oss.domain.unbind');
    expect(records[0].unbound).toBe(false);

    writeSpy.mockRestore();
  });
});
