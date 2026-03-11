import { describe, expect, it } from 'vitest';
import { buildAgentCommandCatalog } from '../utils/command-reference';
import { toGeneratedMcpToolName } from '../utils/command-surface-ids';
import {
  buildArgvForGeneratedMcpCommandTool,
  buildGeneratedMcpCommandTools
} from '../mcp/generated-command-tools';

describe('buildGeneratedMcpCommandTools', () => {
  it('creates generated MCP tools for non-mcp CLI commands', () => {
    const tools = buildGeneratedMcpCommandTools();
    expect(tools).toHaveProperty('licell_cmd_doctor');
    expect(tools).toHaveProperty('licell_cmd_deploy');
    expect(tools).toHaveProperty('licell_cmd_deploy_check');
    expect(tools).not.toHaveProperty('licell_cmd_mcp');
  });

  it('derives schema fields from CLI args and options', () => {
    const tools = buildGeneratedMcpCommandTools();
    const deployCheck = tools.licell_cmd_deploy_check;
    const doctor = tools.licell_cmd_doctor;
    expect(deployCheck.title).toBe('Precheck FC API deploy readiness');
    expect(doctor.title).toBe('Diagnose local licell readiness');
    expect(tools.licell_cmd_fn_list.title).toBe('List functions');
    expect(deployCheck.inputSchema.properties).toHaveProperty('runtime');
    expect(doctor.inputSchema.properties).toHaveProperty('runtime');
    expect(doctor.inputSchema.properties).toHaveProperty('entry');
    expect(doctor.inputSchema.properties).toHaveProperty('dockerDaemon');
    expect(deployCheck.inputSchema.properties).toHaveProperty('entry');
    expect(deployCheck.inputSchema.properties).toHaveProperty('cwd');
    expect(deployCheck.inputSchema.properties).toHaveProperty('timeoutMs');
    expect(deployCheck.description).toContain('Auto-generated from the shared licell CLI registry.');
    expect(tools.licell_cmd_deploy.metadata?.licell.preferredOutput).toBe('json');
    expect(doctor.metadata?.licell.preferredOutput).toBe('json');
    expect(tools.licell_cmd_deploy.metadata?.licell.schemas.help.kind).toBe('licell-help');
    expect(tools.licell_cmd_deploy.metadata?.licell.schemas.commandCatalog.kind).toBe('licell-agent-command-catalog');
    expect(doctor.metadata?.licell.result?.outcomeKey).toBe('healthy');
    expect(tools.licell_cmd_deploy.metadata?.licell.decisionGuide.some((group) => group.phase === 'inspect')).toBe(true);
    expect(tools.licell_cmd_deploy.description).toContain('Decision guide:');
    expect(doctor.description).toContain('Decision guide:');
    expect(tools.licell_cmd_deploy.description).toContain('Inspect → licell deploy spec');
    expect(tools.licell_cmd_release_prune.description).toContain('Safety: destructive');
    expect(tools.licell_cmd_release_prune.annotations?.destructiveHint).toBe(true);
    expect(tools.licell_cmd_dns_records_add.description).toContain('Structured JSON result:');
    expect(tools.licell_cmd_dns_records_add.description).toContain('stage, created, domain, recordId');
  });

  it('builds argv from generated positional and option bindings', () => {
    const tools = buildGeneratedMcpCommandTools();
    const addRecord = tools.licell_cmd_dns_records_add;
    const argv = buildArgvForGeneratedMcpCommandTool(addRecord, {
      domain: 'example.com',
      rr: 'api',
      type: 'CNAME',
      value: 'demo.example.com',
      ttl: '600'
    });

    expect(argv).toEqual([
      'dns', 'records', 'add', 'example.com',
      '--rr', 'api',
      '--type', 'CNAME',
      '--value', 'demo.example.com',
      '--ttl', '600'
    ]);
  });
});

describe('generated MCP tool names in command catalog', () => {
  it('exposes generated tool names through the shared agent catalog', () => {
    const catalog = buildAgentCommandCatalog();
    const deploy = catalog.commands.find((command) => command.key === 'deploy');
    const mcp = catalog.commands.find((command) => command.key === 'mcp');

    expect(deploy?.generatedMcpToolName).toBe(toGeneratedMcpToolName('deploy'));
    expect(mcp?.generatedMcpToolName).toBeUndefined();
  });
});

describe('domain generated MCP tools', () => {
  it('generates tools for domain workflow and fn domain resource commands', () => {
    const tools = buildGeneratedMcpCommandTools();
    expect(tools).toHaveProperty('licell_cmd_domain_app_bind');
    expect(tools).toHaveProperty('licell_cmd_fn_domain_bind');
    expect(tools).toHaveProperty('licell_cmd_domain_static_bind');
    expect(tools.licell_cmd_domain_app_bind.title).toBe('Bind app domain');
    expect(tools.licell_cmd_domain_app_bind.description).toContain('DNS CNAME');
    expect(tools.licell_cmd_domain_app_bind.description).toContain('Structured JSON result:');
    expect(tools.licell_cmd_domain_app_bind.description).toContain('stage, bound, workflow, domain');
    expect(tools.licell_cmd_domain_app_bind.description).toContain('finalUrl');
    expect(tools.licell_cmd_domain_app_bind.metadata?.licell.result?.fields.some((field) => field.name === 'finalUrl')).toBe(true);
    expect(tools.licell_cmd_domain_app_bind.metadata?.licell.result?.fieldTree.some((field) => field.name === 'finalUrl')).toBe(true);
  });
});
