import { describe, expect, it } from 'vitest';
import {
  DOMAIN_APP_BIND_WORKFLOW_TAG,
  DOMAIN_APP_UNBIND_WORKFLOW_TAG,
  DOMAIN_STATIC_BIND_WORKFLOW_TAG,
  DOMAIN_STATIC_UNBIND_WORKFLOW_TAG,
  FC_API_DEPLOY_WORKFLOW_TAG,
  FC_API_PRECHECK_WORKFLOW_TAG,
  listTaggedCuratedWorkflowTools,
  renderTaggedCuratedWorkflowNumberedList,
  renderTaggedCuratedWorkflowTable
} from '../utils/mcp-workflow-docs';

describe('listTaggedCuratedWorkflowTools', () => {
  it('returns deploy workflow tools in declared order', () => {
    const tools = listTaggedCuratedWorkflowTools(FC_API_DEPLOY_WORKFLOW_TAG);
    expect(tools.map((tool) => tool.name)).toEqual([
      'licell_fc_deploy_spec',
      'licell_fc_deploy_check',
      'licell_deploy'
    ]);
  });

  it('supports narrower workflow tags', () => {
    const tools = listTaggedCuratedWorkflowTools(FC_API_PRECHECK_WORKFLOW_TAG);
    expect(tools.map((tool) => tool.name)).toEqual([
      'licell_fc_deploy_spec',
      'licell_fc_deploy_check'
    ]);
  });

  it('supports domain bind and cleanup workflow entry tools', () => {
    expect(listTaggedCuratedWorkflowTools(DOMAIN_APP_BIND_WORKFLOW_TAG).map((tool) => tool.name)).toEqual([
      'licell_domain_app_bind'
    ]);
    expect(listTaggedCuratedWorkflowTools(DOMAIN_STATIC_BIND_WORKFLOW_TAG).map((tool) => tool.name)).toEqual([
      'licell_domain_static_bind'
    ]);
    expect(listTaggedCuratedWorkflowTools(DOMAIN_APP_UNBIND_WORKFLOW_TAG).map((tool) => tool.name)).toEqual([
      'licell_domain_app_unbind'
    ]);
    expect(listTaggedCuratedWorkflowTools(DOMAIN_STATIC_UNBIND_WORKFLOW_TAG).map((tool) => tool.name)).toEqual([
      'licell_domain_static_unbind'
    ]);
  });
});

describe('workflow renderers', () => {
  it('renders markdown table from shared workflow metadata', () => {
    const output = renderTaggedCuratedWorkflowTable(FC_API_DEPLOY_WORKFLOW_TAG, {
      intro: 'workflow intro'
    });
    expect(output).toContain('workflow intro');
    expect(output).toContain('`licell_fc_deploy_spec`');
    expect(output).toContain('读取 FC API runtime');
    expect(output).toContain('建议顺序');
  });

  it('renders numbered list from shared workflow metadata', () => {
    const output = renderTaggedCuratedWorkflowNumberedList(FC_API_PRECHECK_WORKFLOW_TAG);
    expect(output).toContain('1. `licell_fc_deploy_spec`');
    expect(output).toContain('2. `licell_fc_deploy_check`');
    expect(output).not.toContain('`licell_deploy`');
  });

  it('renders domain cleanup workflow summaries from shared metadata', () => {
    const output = renderTaggedCuratedWorkflowTable(DOMAIN_APP_UNBIND_WORKFLOW_TAG, {
      intro: 'cleanup workflow intro'
    });
    expect(output).toContain('cleanup workflow intro');
    expect(output).toContain('`licell_domain_app_unbind`');
    expect(output).toContain('应用域名下线链路');
  });
});
