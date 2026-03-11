import { describe, expect, it } from 'vitest';
import { getBuiltinMcpTools } from '../mcp/builtin-tools';

describe('getBuiltinMcpTools', () => {
  it('exposes builtin MCP tools', () => {
    const tools = getBuiltinMcpTools();
    expect(tools).toHaveProperty('licell_cli');
    expect(tools).toHaveProperty('licell_command_catalog');
    expect(tools.licell_cli.title).toBe('Deploy & manage Aliyun services (licell)');
    expect(tools.licell_cli.metadata?.licell.toolKind).toBe('builtin');
    expect(tools.licell_cli.metadata?.licell.schemas.help.kind).toBe('licell-help');
    expect(tools.licell_cli.metadata?.licell.schemas.commandCatalog.kind).toBe('licell-agent-command-catalog');
    expect(tools.licell_cli.metadata?.licell.openWorld).toBe(true);
    expect(tools.licell_cli.metadata?.licell.summary).toContain('deploy API/static services');
    expect(tools.licell_cli.metadata?.licell.description).toContain('Returns stdout/stderr');
    expect(tools.licell_cli.description).toContain('Decision guide:');
    expect(tools.licell_cli.description).toContain('licell_command_catalog');
    expect(tools.licell_command_catalog.metadata?.licell.decisionGuide.some((group) => group.phase === 'inspect')).toBe(true);
    expect(tools.licell_command_catalog.description).toContain('Decision guide:');
  });

  it('validates licell_cli argv input', () => {
    const tools = getBuiltinMcpTools();
    expect(() => tools.licell_cli.execute({ argv: [] })).toThrow('non-empty string[]');
    expect(tools.licell_cli.execute({ argv: ['deploy', '--type', 'api'] })).toEqual({
      kind: 'argv',
      argv: ['deploy', '--type', 'api']
    });
  });

  it('returns structured command catalog snapshots', () => {
    const tools = getBuiltinMcpTools();
    const result = tools.licell_command_catalog.execute({ rootCommand: 'deploy' });
    expect(result.kind).toBe('data');
    if (result.kind !== 'data') throw new Error('expected data result');
    expect(result.text).toContain('root=deploy');
    expect(result.text).toContain('schema=licell-agent-command-catalog@1.0');
    expect(result.text).toContain('help=licell-help@1.0');
    expect((result.structuredContent as { rootCommands: string[] }).rootCommands).toEqual(['deploy']);
    expect((result.structuredContent as { schemaVersion: string }).schemaVersion).toBe('1.0');
    expect((result.structuredContent as { kind: string }).kind).toBe('licell-agent-command-catalog');
  });

  it('filters structured command catalog snapshots for doctor', () => {
    const tools = getBuiltinMcpTools();
    const result = tools.licell_command_catalog.execute({ rootCommand: 'doctor' });
    expect(result.kind).toBe('data');
    if (result.kind !== 'data') throw new Error('expected data result');
    const catalog = result.structuredContent as { rootCommands: string[]; commands: Array<{ key: string }> };
    expect(catalog.rootCommands).toEqual(['doctor']);
    expect(catalog.commands.map((command) => command.key)).toEqual(['doctor']);
  });

  it('exposes mcp subcommands in the shared command catalog', () => {
    const tools = getBuiltinMcpTools();
    const result = tools.licell_command_catalog.execute({ rootCommand: 'mcp' });
    expect(result.kind).toBe('data');
    if (result.kind !== 'data') throw new Error('expected data result');
    const catalog = result.structuredContent as { commands: Array<{ key: string }> };
    expect(catalog.commands.map((command) => command.key)).toEqual(expect.arrayContaining(['mcp', 'mcp init', 'mcp serve']));
  });
});
