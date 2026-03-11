import { describe, expect, it, vi } from 'vitest';
import {
  LICELL_JSON_PREFIX,
  LICELL_CLI_RECORD_KIND,
  buildCliErrorRecord,
  emitCliEvent,
  emitCommandEvent,
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
    expect(record.kind).toBe(LICELL_CLI_RECORD_KIND);
    expect(record.schemaVersion).toBe('1.0');
    expect(record.type).toBe('error');
    expect(record.command).toBe('deploy');
    expect(record.error.category).toBe('permission');
    expect(record.error.code).toBe('AUTH_PERMISSION_DENIED');
    expect(record.provider.requestId).toBe('abc-123');
  });

  it('builds structured missing-args input error record', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'dns', 'records', 'list']);
    const record = buildCliErrorRecord(new Error('missing required args for command `dns records list <domain>`')) as any;
    expect(record.ok).toBe(false);
    expect(record.error.category).toBe('input');
    expect(record.error.code).toBe('CLI_MISSING_REQUIRED_ARGS');
    expect(record.remediation[0].commandTemplate).toBe('licell dns records list <domain>');
    expect(record.remediation[0].commandKey).toBe('dns records list');
    expect(record.remediation[0].priority).toBe('primary');
    expect(record.nextCommands[0].commandTemplate).toBe('licell dns records list <domain>');
    expect(record.nextCommands[0].commandKey).toBe('dns records list');
    expect(record.nextCommands[0].intent).toBe('inspect');
    expect(record.nextCommands[0].priority).toBe('primary');
    expect(record.nextActions[0].commandTemplate).toBe('licell dns records list <domain>');
    expect(record.nextActions[0].commandKey).toBe('dns records list');
    expect(record.nextActions[0].priority).toBe('primary');
    expect(record.nextActions[0].source).toBe('error-remediation');
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
    expect(record.nextCommands.map((command: any) => command.commandKey)).toEqual([
      'deploy spec',
      'deploy check'
    ]);
    expect(record.nextActions.map((action: any) => action.commandKey)).toEqual([
      'deploy spec',
      'deploy check'
    ]);
    expect(record.nextActions.every((action: any) => action.source === 'error-remediation')).toBe(true);
  });

  it('prefers login and restore guidance for missing auth state', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'deploy']);
    const record = buildCliErrorRecord(new Error('未登录，请先执行 `licell login`')) as any;

    expect(record.error.category).toBe('auth');
    expect(record.error.code).toBe('AUTH_MISSING_CREDENTIAL');
    expect(record.nextCommands.map((command: any) => command.commandKey)).toEqual([
      'login',
      'auth restore'
    ]);
    expect(record.nextCommands.map((command: any) => command.intent)).toEqual([
      'login',
      'restore'
    ]);
    expect(record.nextActions.map((action: any) => action.commandTemplate)).toEqual([
      'licell login',
      'licell auth restore <token> [passkey]'
    ]);
  });

  it('uses suggested command help for unknown-command parse errors', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'deployy']);
    const record = buildCliErrorRecord(new Error('未知命令: deployy'), {
      stage: 'parse',
      details: { command: 'deployy', suggestions: ['deploy', 'doctor'] }
    }) as any;

    expect(record.error.code).toBe('CLI_UNKNOWN_COMMAND');
    expect(record.nextCommands[0].commandTemplate).toBe('licell deploy --help');
    expect(record.nextActions[0].commandTemplate).toBe('licell deploy --help');
    expect(record.nextActions[0].source).toBe('error-remediation');
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
    expect(records[0].kind).toBeUndefined();
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
    expect(records[0].kind).toBe(LICELL_CLI_RECORD_KIND);
    expect(records[0].type).toBe('result');
    expect(records[0].recordId).toBe('123');
    expect(records[0].ok).toBe(true);

    writeSpy.mockRestore();
  });

  it('normalizes event actions and enriches lifecycle fields', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'deploy']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      emitCliEvent({
        stage: 'auth',
        action: 'auth repair',
        status: 'failed',
        message: 'permission denied'
      });

      const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
      const records = extractJsonRecordsFromOutput(raw) as any[];
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('event');
      expect(records[0].action).toBe('auth-repair');
      expect(records[0].status).toBe('failed');
      expect(records[0].source).toBe('command');
      expect(records[0].terminal).toBe(true);
      expect(records[0].ok).toBe(false);
    } finally {
      writeSpy.mockRestore();
    }
  });

  it('infers command event stage and action from command context', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'skills', 'init']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      emitCommandEvent({ status: 'start' });

      const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
      const records = extractJsonRecordsFromOutput(raw) as any[];
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('event');
      expect(records[0].stage).toBe('skills.init');
      expect(records[0].action).toBe('init');
      expect(records[0].status).toBe('start');
      expect(records[0].source).toBe('command');
      expect(records[0].terminal).toBe(false);
      expect(records[0].ok).toBeUndefined();
    } finally {
      writeSpy.mockRestore();
    }
  });

  it('marks stream events with stream source and stream metadata', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'upgrade']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      emitCommandEvent({
        stage: 'upgrade.install',
        action: 'stdout',
        status: 'info',
        source: 'stream',
        message: 'downloading...'
      });

      const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
      const records = extractJsonRecordsFromOutput(raw) as any[];
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('event');
      expect(records[0].action).toBe('stdout');
      expect(records[0].source).toBe('stream');
      expect(records[0].data.stream).toBe('stdout');
      expect(records[0].terminal).toBe(false);
    } finally {
      writeSpy.mockRestore();
    }
  });

  it('auto-infers stage and bound outcome from command context', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'domain', 'app', 'bind']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    emitCommandResult({ domain: 'api.example.com' });

    const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].kind).toBe(LICELL_CLI_RECORD_KIND);
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
    expect(records[0].kind).toBe(LICELL_CLI_RECORD_KIND);
    expect(records[0].stage).toBe('oss.domain.unbind');
    expect(records[0].unbound).toBe(false);

    writeSpy.mockRestore();
  });

  it('supports command/stage overrides for command result emission', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'help']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    emitCommandResult(
      { accountId: '1494910986361453', region: 'cn-hangzhou' },
      { command: 'switch', stage: 'auth', inferOutcome: false }
    );

    const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].stage).toBe('auth');
    expect(records[0].updated).toBeUndefined();
    expect(records[0].accountId).toBe('1494910986361453');

    writeSpy.mockRestore();
  });

  it('auto-infers created outcome for db add style commands', () => {
    initOutputContext('json', ['node', 'src/cli.ts', 'db', 'add']);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    emitCommandResult({ type: 'postgresql', connectionStringMasked: 'postgres://***' });

    const raw = writeSpy.mock.calls.map((args) => String(args[0])).join('');
    const records = extractJsonRecordsFromOutput(raw) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].stage).toBe('db.add');
    expect(records[0].created).toBe(true);
    expect(records[0].connectionStringMasked).toBe('postgres://***');

    writeSpy.mockRestore();
  });
});
