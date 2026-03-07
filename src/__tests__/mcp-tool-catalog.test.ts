import { describe, expect, it } from 'vitest';
import { buildMcpToolCatalog } from '../mcp/tool-catalog';

describe('buildMcpToolCatalog', () => {
  it('collects builtin, curated, and generated MCP tools from shared registries', () => {
    const catalog = buildMcpToolCatalog();
    expect(catalog.source).toBe('licell-mcp-tool-registry');
    expect(catalog.tools.find((tool) => tool.name === 'licell_cli')?.kind).toBe('builtin');
    expect(catalog.tools.find((tool) => tool.name === 'licell_deploy')?.kind).toBe('curated');
    expect(catalog.tools.find((tool) => tool.name === 'licell_cmd_deploy_check')?.kind).toBe('generated');
  });

  it('attaches CLI section metadata to curated and generated tools when available', () => {
    const catalog = buildMcpToolCatalog();
    const curatedDeploy = catalog.tools.find((tool) => tool.name === 'licell_deploy');
    const generatedDeployCheck = catalog.tools.find((tool) => tool.name === 'licell_cmd_deploy_check');

    expect(curatedDeploy?.commandSignature).toBe('deploy');
    expect(curatedDeploy?.sectionTitle).toBe('Delivery Workflow');
    expect(curatedDeploy?.tags).toContain('fc-api-deploy-workflow');
    expect(curatedDeploy?.docsSummary).toContain('正式部署');
    expect(generatedDeployCheck?.commandKey).toBe('deploy check');
    expect(generatedDeployCheck?.sectionTitle).toBe('Delivery Workflow');
    expect(generatedDeployCheck?.tags).toEqual([]);
  });
});
