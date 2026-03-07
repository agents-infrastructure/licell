export const GENERATED_MCP_TOOL_PREFIX = 'licell_cmd_';

export function canExposeCommandAsGeneratedMcpTool(rootCommand: string) {
  return rootCommand !== 'mcp';
}

export function toGeneratedMcpToolName(commandKey: string) {
  return `${GENERATED_MCP_TOOL_PREFIX}${commandKey
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '_')}`;
}
