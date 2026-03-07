import { describe, expect, it } from 'vitest';
import { normalizeCliArgv, normalizeCompatOptionArgv, normalizeMultiWordCommandArgv } from '../utils/argv';

describe('normalizeMultiWordCommandArgv', () => {
  it('merges a standard multi-word command', () => {
    const argv = ['node', 'src/cli.ts', 'release', 'list', '--limit', '3'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'release list',
      '--limit',
      '3'
    ]);
  });

  it('supports wrappers that inject command-like prefixes', () => {
    const argv = ['node', 'bootstrap.js', 'runner', 'cache', 'add', '--type', 'redis'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'bootstrap.js',
      'runner',
      'cache add',
      '--type',
      'redis'
    ]);
  });

  it('merges newly added multi-word commands', () => {
    const argv = ['node', 'src/cli.ts', 'fn', 'list', '--limit', '5'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'fn list',
      '--limit',
      '5'
    ]);
  });

  it('merges oss upload command', () => {
    const argv = ['node', 'src/cli.ts', 'oss', 'upload', '--bucket', 'my-bucket'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'oss upload',
      '--bucket',
      'my-bucket'
    ]);
  });

  it('merges oss bucket alias command', () => {
    const argv = ['node', 'src/cli.ts', 'oss', 'bucket', '--bucket', 'my-bucket'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'oss bucket',
      '--bucket',
      'my-bucket'
    ]);
  });

  it('merges auth repair command', () => {
    const argv = ['node', 'src/cli.ts', 'auth', 'repair', '--region', 'cn-hangzhou'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'auth repair',
      '--region',
      'cn-hangzhou'
    ]);
  });

  it('merges e2e run command', () => {
    const argv = ['node', 'src/cli.ts', 'e2e', 'run', '--suite', 'smoke'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'e2e run',
      '--suite',
      'smoke'
    ]);
  });

  it('merges deploy spec command', () => {
    const argv = ['node', 'src/cli.ts', 'deploy', 'spec', 'nodejs22'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'deploy spec',
      'nodejs22'
    ]);
  });

  it('merges deploy check command', () => {
    const argv = ['node', 'src/cli.ts', 'deploy', 'check', '--runtime', 'python3.13'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'deploy check',
      '--runtime',
      'python3.13'
    ]);
  });

  it('merges multi-word commands when command is last token', () => {
    const argv = ['node', 'src/cli.ts', 'fn', 'list'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'fn list'
    ]);
  });

  it('merges three-word commands like dns records list', () => {
    const argv = ['node', 'src/cli.ts', 'dns', 'records', 'list', 'example.com'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual([
      'node',
      'src/cli.ts',
      'dns records list',
      'example.com'
    ]);
  });

  it('does not touch single-word commands', () => {
    const argv = ['node', 'src/cli.ts', 'deploy', '--entry', 'src/index.ts'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual(argv);
  });

  it('does not merge argument values after options', () => {
    const argv = ['node', 'src/cli.ts', 'deploy', '--entry', 'release', 'list'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual(argv);
  });
});

describe('normalizeCompatOptionArgv', () => {
  it('rewrites legacy upgrade --version flag', () => {
    expect(normalizeCompatOptionArgv([
      'node',
      'src/cli.ts',
      'upgrade',
      '--version',
      'v1.2.3'
    ])).toEqual([
      'node',
      'src/cli.ts',
      'upgrade',
      '--target-version',
      'v1.2.3'
    ]);
  });

  it('rewrites legacy upgrade --version=value form', () => {
    expect(normalizeCompatOptionArgv([
      'node',
      'src/cli.ts',
      'upgrade',
      '--version=v1.2.3',
      '--dry-run'
    ])).toEqual([
      'node',
      'src/cli.ts',
      'upgrade',
      '--target-version=v1.2.3',
      '--dry-run'
    ]);
  });

  it('does not rewrite root version flag', () => {
    const argv = ['node', 'src/cli.ts', '--version'];
    expect(normalizeCompatOptionArgv(argv)).toEqual(argv);
  });
});

describe('normalizeCliArgv', () => {
  it('combines multi-word normalization and compatibility rewrites', () => {
    expect(normalizeCliArgv([
      'node',
      'bootstrap.js',
      'upgrade',
      '--version',
      'v1.2.3'
    ])).toEqual([
      'node',
      'bootstrap.js',
      'upgrade',
      '--target-version',
      'v1.2.3'
    ]);
  });
});
