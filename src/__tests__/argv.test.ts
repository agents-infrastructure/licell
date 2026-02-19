import { describe, expect, it } from 'vitest';
import { normalizeMultiWordCommandArgv } from '../utils/argv';

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
    const argv = ['node', 'src/cli.ts', 'deploy', '--type', 'api'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual(argv);
  });

  it('does not merge argument values after options', () => {
    const argv = ['node', 'src/cli.ts', 'deploy', '--entry', 'release', 'list'];
    expect(normalizeMultiWordCommandArgv(argv)).toEqual(argv);
  });
});
