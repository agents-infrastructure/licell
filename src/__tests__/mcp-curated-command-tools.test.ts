import { describe, expect, it } from 'vitest';
import { getCuratedMcpCommandTools } from '../mcp/curated-command-tools';

describe('getCuratedMcpCommandTools', () => {
  it('exposes curated tools with stable names', () => {
    const tools = getCuratedMcpCommandTools();
    expect(tools).toHaveProperty('licell_deploy');
    expect(tools).toHaveProperty('licell_release_prune');
    expect(tools).toHaveProperty('licell_supa_rm');
  });

  it('builds deploy argv from structured input', () => {
    const tools = getCuratedMcpCommandTools();
    const argv = tools.licell_deploy.buildArgv({
      type: 'api',
      runtime: 'nodejs22',
      entry: 'src/index.ts',
      target: 'preview',
      enableVpc: true,
      memory: 1024
    });

    expect(argv).toEqual([
      'deploy', '--type', 'api',
      '--runtime', 'nodejs22',
      '--entry', 'src/index.ts',
      '--target', 'preview',
      '--enable-vpc',
      '--memory', '1024'
    ]);
  });

  it('guards destructive prune with explicit yes', () => {
    const tools = getCuratedMcpCommandTools();
    expect(() => tools.licell_release_prune.buildArgv({ apply: true })).toThrow('yes=true');
    expect(tools.licell_release_prune.buildArgv({ apply: true, yes: true, keep: 5 })).toEqual([
      'release', 'prune', '--keep', '5', '--apply', '--yes'
    ]);
  });

  it('rejects conflicting fn invoke payload inputs', () => {
    const tools = getCuratedMcpCommandTools();
    expect(() => tools.licell_fn_invoke.buildArgv({
      payload: 'x',
      payloadJson: { ok: true }
    })).toThrow('Provide only one');
  });
});
