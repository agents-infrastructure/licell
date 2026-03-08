import { describe, expect, it } from 'vitest';
import { buildMcpToolCatalog } from '../mcp/tool-catalog';

describe('buildMcpToolCatalog', () => {
  it('collects builtin, curated, and generated MCP tools from shared registries', () => {
    const catalog = buildMcpToolCatalog();
    expect(catalog.source).toBe('licell-mcp-tool-registry');
    expect(catalog.tools.find((tool) => tool.name === 'licell_cli')?.kind).toBe('builtin');
    expect(catalog.tools.find((tool) => tool.name === 'licell_deploy')?.kind).toBe('curated');
    expect(catalog.tools.find((tool) => tool.name === 'licell_cmd_deploy_check')?.kind).toBe('generated');
    expect(catalog.tools.find((tool) => tool.name === 'licell_domain_static_bind')?.kind).toBe('curated');
    expect(catalog.tools.find((tool) => tool.name === 'licell_domain_static_unbind')?.kind).toBe('curated');
  });

  it('attaches CLI section metadata and structured summary to MCP tools', () => {
    const catalog = buildMcpToolCatalog();
    const builtinCli = catalog.tools.find((tool) => tool.name === 'licell_cli');
    const curatedDeploy = catalog.tools.find((tool) => tool.name === 'licell_deploy');
    const curatedDomainAppBind = catalog.tools.find((tool) => tool.name === 'licell_domain_app_bind');
    const curatedDomainAppUnbind = catalog.tools.find((tool) => tool.name === 'licell_domain_app_unbind');
    const curatedDomainStaticBind = catalog.tools.find((tool) => tool.name === 'licell_domain_static_bind');
    const curatedDomainStaticUnbind = catalog.tools.find((tool) => tool.name === 'licell_domain_static_unbind');
    const generatedDeployCheck = catalog.tools.find((tool) => tool.name === 'licell_cmd_deploy_check');

    expect(builtinCli?.metadata?.licell.toolKind).toBe('builtin');
    expect(builtinCli?.metadata?.licell.openWorld).toBe(true);
    expect(builtinCli?.summary).toContain('deploy API/static services');
    expect(curatedDeploy?.title).toBe('Deploy current project');
    expect(curatedDeploy?.commandSignature).toBe('deploy');
    expect(curatedDeploy?.sectionTitle).toBe('Delivery Workflow');
    expect(curatedDeploy?.tags).toContain('fc-api-deploy-workflow');
    expect(curatedDeploy?.summary).toContain('正式部署');
    expect(curatedDeploy?.metadata?.licell.workflows.find((workflow) => workflow.tag === 'fc-api-deploy-workflow')?.role).toBe('entry');
    expect(curatedDomainAppBind?.tags).toContain('domain-app-bind-workflow');
    expect(curatedDomainAppBind?.summary).toContain('绑定自定义域名');
    expect(curatedDomainAppUnbind?.tags).toContain('domain-app-unbind-workflow');
    expect(curatedDomainAppUnbind?.summary).toContain('解绑当前应用域名');
    expect(curatedDomainStaticBind?.tags).toContain('domain-static-bind-workflow');
    expect(curatedDomainStaticBind?.summary).toContain('静态站点');
    expect(curatedDomainStaticUnbind?.tags).toContain('domain-static-unbind-workflow');
    expect(curatedDomainStaticUnbind?.summary).toContain('解绑静态站点域名');
    expect(generatedDeployCheck?.title).toBe('Precheck FC API deploy readiness');
    expect(generatedDeployCheck?.commandKey).toBe('deploy check');
    expect(generatedDeployCheck?.sectionTitle).toBe('Delivery Workflow');
    expect(generatedDeployCheck?.summary).toContain('预检');
    expect(generatedDeployCheck?.metadata?.licell.preferredOutput).toBe('json');
    expect(generatedDeployCheck?.metadata?.licell.command?.key).toBe('deploy check');
    expect(generatedDeployCheck?.tags).toEqual([]);
  });
});
