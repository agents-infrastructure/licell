import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  renderAgentSurfaceReferenceDoc,
  renderSkillMcpToolReference
} from '../utils/agent-surface-docs';

describe('renderSkillMcpToolReference', () => {
  it('renders builtin and curated MCP tool sections from shared registry', () => {
    const output = renderSkillMcpToolReference();
    expect(output).toContain('## MCP Tool Reference');
    expect(output).toContain('### Schema Contracts');
    expect(output).toContain('@@LICELL_JSON@@');
    expect(output).toContain('licell-cli-record@1.0');
    expect(output).toContain('licell-help@1.0');
    expect(output).toContain('licell-agent-command-catalog@1.0');
    expect(output).toContain('### Builtin Tools');
    expect(output).toContain('`licell_cli`');
    expect(output).toContain('### Curated Workflow Tools');
    expect(output).toContain('`licell_deploy`');
    expect(output).toContain('licell_cmd_<command_key>');
  });
});

describe('renderAgentSurfaceReferenceDoc', () => {
  it('renders CLI, builtin MCP, curated MCP, and generated MCP sections', () => {
    const output = renderAgentSurfaceReferenceDoc();
    expect(output).toContain('# Agent Surface Reference');
    expect(output).toContain('## Schema Contracts');
    expect(output).toContain('@@LICELL_JSON@@');
    expect(output).toContain('先匹配 `kind`，再检查 `schemaVersion`');
    expect(output).toContain('## CLI 命令目录');
    expect(output).toContain('`licell_cli`');
    expect(output).toContain('`licell_fc_deploy_spec`');
    expect(output).toContain('`licell_cmd_deploy_check`');
    expect(output).toContain('metadata.licell');
    expect(output).toContain('builtin / curated / generated MCP tools');
  });

  it('keeps generated docs file in sync with renderer', () => {
    const current = readFileSync('docs/reference/agent-surfaces.md', 'utf8');
    expect(current).toBe(renderAgentSurfaceReferenceDoc());
  });
});
