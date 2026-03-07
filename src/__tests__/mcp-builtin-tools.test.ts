import { describe, expect, it } from 'vitest';
import { getBuiltinMcpTools } from '../mcp/builtin-tools';

describe('getBuiltinMcpTools', () => {
  it('exposes builtin MCP tools', () => {
    const tools = getBuiltinMcpTools();
    expect(tools).toHaveProperty('licell_cli');
    expect(tools).toHaveProperty('licell_command_catalog');
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
    expect((result.structuredContent as { rootCommands: string[] }).rootCommands).toEqual(['deploy']);
  });
});
