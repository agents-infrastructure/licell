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
    expect(tools).toHaveProperty('licell_cmd_deploy');
    expect(tools).toHaveProperty('licell_cmd_deploy_check');
    expect(tools).not.toHaveProperty('licell_cmd_mcp');
  });

  it('derives schema fields from CLI args and options', () => {
    const tools = buildGeneratedMcpCommandTools();
    const deployCheck = tools.licell_cmd_deploy_check;
    expect(deployCheck.inputSchema.properties).toHaveProperty('runtime');
    expect(deployCheck.inputSchema.properties).toHaveProperty('entry');
    expect(deployCheck.inputSchema.properties).toHaveProperty('cwd');
    expect(deployCheck.inputSchema.properties).toHaveProperty('timeoutMs');
    expect(deployCheck.description).toContain('Auto-generated from the shared licell CLI registry.');
    expect(tools.licell_cmd_release_prune.description).toContain('Safety: destructive');
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
