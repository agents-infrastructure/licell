import { describe, expect, it } from 'vitest';
import { getCuratedMcpCommandTools } from '../mcp/curated-command-tools';

describe('getCuratedMcpCommandTools', () => {
  it('exposes curated tools with stable names and metadata', () => {
    const tools = getCuratedMcpCommandTools();
    expect(tools).toHaveProperty('licell_deploy');
    expect(tools).toHaveProperty('licell_release_prune');
    expect(tools).toHaveProperty('licell_supa_rm');
    expect(tools).toHaveProperty('licell_domain_static_bind');
    expect(tools).toHaveProperty('licell_domain_static_unbind');
    expect(tools.licell_deploy.title).toBe('Deploy current project');
    expect(tools.licell_fc_deploy_spec.title).toBe('Get FC API deploy spec');
    expect(tools.licell_supa_lifecycle.title).toBe('Manage Supabase instance lifecycle');
    expect(tools.licell_deploy.metadata?.licell.title).toBe('Deploy current project');
    expect(tools.licell_deploy.metadata?.licell.toolKind).toBe('curated');
    expect(tools.licell_deploy.metadata?.licell.command?.key).toBe('deploy');
    expect(tools.licell_deploy.metadata?.licell.summary).toContain('正式部署');
    expect(tools.licell_deploy.metadata?.licell.workflows.map((workflow) => workflow.tag)).toContain('fc-api-deploy-workflow');
    expect(tools.licell_deploy.metadata?.licell.workflows.find((workflow) => workflow.tag === 'fc-api-deploy-workflow')?.role).toBe('entry');
    expect(tools.licell_domain_app_bind.metadata?.licell.workflows.find((workflow) => workflow.tag === 'domain-app-bind-workflow')?.role).toBe('entry');
    expect(tools.licell_domain_app_unbind.metadata?.licell.workflows.find((workflow) => workflow.tag === 'domain-app-unbind-workflow')?.role).toBe('entry');
    expect(tools.licell_domain_static_bind.metadata?.licell.workflows.find((workflow) => workflow.tag === 'domain-static-bind-workflow')?.role).toBe('entry');
    expect(tools.licell_domain_static_unbind.metadata?.licell.workflows.find((workflow) => workflow.tag === 'domain-static-unbind-workflow')?.role).toBe('entry');
    expect(tools.licell_domain_static_unbind.annotations?.destructiveHint).toBe(true);
    expect(tools.licell_deploy.metadata?.licell.description).toContain('Deploy current project');
    expect(tools.licell_domain_app_bind.metadata?.licell.summary).toContain('绑定自定义域名');
    expect(tools.licell_domain_app_unbind.metadata?.licell.summary).toContain('解绑当前应用域名');
    expect(tools.licell_domain_static_bind.metadata?.licell.summary).toContain('静态站点');
    expect(tools.licell_domain_static_unbind.metadata?.licell.summary).toContain('解绑静态站点域名');
    expect(tools.licell_release_prune.description).toContain('Safety: destructive');
    expect(tools.licell_supa_lifecycle.metadata?.licell.command?.rootCommand).toBe('supa');
  });

  it('builds deploy argv from derived schema and validates type', () => {
    const tools = getCuratedMcpCommandTools();
    const argv = tools.licell_deploy.buildArgv({
      type: 'api',
      entry: 'src/index.ts',
      runtime: 'nodejs22',
      target: 'preview',
      preview: true,
      enableVpc: true,
      memory: 1024
    });

    expect(argv).toEqual([
      'deploy',
      '--type', 'api',
      '--entry', 'src/index.ts',
      '--runtime', 'nodejs22',
      '--target', 'preview',
      '--preview',
      '--enable-vpc',
      '--memory', '1024'
    ]);
    expect(() => tools.licell_deploy.buildArgv({ type: 'worker' })).toThrow('type must be "api" or "static"');
  });

  it('defaults init to non-interactive yes mode', () => {
    const tools = getCuratedMcpCommandTools();
    expect(tools.licell_init.buildArgv({ runtime: 'nodejs22', app: 'demo' })).toEqual([
      'init', '--runtime', 'nodejs22', '--app', 'demo', '--yes'
    ]);
    expect(tools.licell_init.buildArgv({ yes: false, runtime: 'nodejs22' })).toEqual([
      'init', '--runtime', 'nodejs22'
    ]);
  });

  it('guards destructive prune with explicit yes while still exposing preview', () => {
    const tools = getCuratedMcpCommandTools();
    expect(() => tools.licell_release_prune.buildArgv({ apply: true })).toThrow('yes=true');
    expect(tools.licell_release_prune.buildArgv({ yes: true })).toEqual(['release', 'prune']);
    expect(tools.licell_release_prune.buildArgv({ apply: true, yes: true, keep: 5, preview: true })).toEqual([
      'release', 'prune', '--keep', '5', '--apply', '--preview', '--yes'
    ]);
  });

  it('builds derived wrapper argv for dns add and destructive wrappers', () => {
    const tools = getCuratedMcpCommandTools();
    expect(tools.licell_dns_records_add.buildArgv({
      domain: 'example.com',
      rr: 'api',
      type: 'CNAME',
      value: 'origin.example.com',
      ttl: 600
    })).toEqual([
      'dns', 'records', 'add',
      'example.com',
      '--rr', 'api',
      '--type', 'CNAME',
      '--value', 'origin.example.com',
      '--ttl', '600'
    ]);

    expect(tools.licell_domain_app_unbind.buildArgv({ domain: 'api.example.com', yes: true })).toEqual([
      'domain', 'app', 'unbind', 'api.example.com', '--yes'
    ]);
  });

  it('supports init/fn invoke/supa lifecycle derived customizations', () => {
    const tools = getCuratedMcpCommandTools();

    expect(tools.licell_fn_invoke.buildArgv({
      name: 'hello-world',
      payloadJson: { ok: true }
    })).toEqual([
      'fn', 'invoke', 'hello-world', '--payload', '{"ok":true}'
    ]);

    expect(tools.licell_fn_invoke.buildArgv({
      name: 'hello-world',
      file: 'payload.json'
    })).toEqual([
      'fn', 'invoke', 'hello-world', '--file', 'payload.json'
    ]);

    expect(tools.licell_supa_lifecycle.buildArgv({
      action: 'stop',
      instanceName: 'demo-supa'
    })).toEqual([
      'supa', 'stop', 'demo-supa'
    ]);
  });

  it('rejects conflicting fn invoke payload inputs', () => {
    const tools = getCuratedMcpCommandTools();
    expect(() => tools.licell_fn_invoke.buildArgv({
      payload: 'x',
      payloadJson: { ok: true }
    })).toThrow('Provide only one');
    expect(() => tools.licell_fn_invoke.buildArgv({
      file: 'payload.json',
      payloadJson: { ok: true }
    })).toThrow('Provide only one');
  });
});
