import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  SCENARIO_AI_PRECHECK_WORKFLOW_END,
  SCENARIO_AI_PRECHECK_WORKFLOW_START,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START,
  renderAiDrivenDeploymentPrecheckWorkflow,
  renderDomainAppBindWorkflow,
  renderDomainAppUnbindWorkflow,
  renderDomainStaticBindWorkflow,
  renderDomainStaticUnbindWorkflow,
  syncAiDrivenDeploymentScenario,
  syncDomainAndHttpsScenario
} from '../utils/scenario-docs';

describe('syncAiDrivenDeploymentScenario', () => {
  it('replaces content between scenario workflow markers', () => {
    const input = [
      '# Title',
      '',
      SCENARIO_AI_PRECHECK_WORKFLOW_START,
      'old content',
      SCENARIO_AI_PRECHECK_WORKFLOW_END,
      ''
    ].join('\n');

    const output = syncAiDrivenDeploymentScenario(input);
    expect(output).toContain(SCENARIO_AI_PRECHECK_WORKFLOW_START);
    expect(output).toContain(SCENARIO_AI_PRECHECK_WORKFLOW_END);
    expect(output).toContain('`licell_fc_deploy_spec`');
    expect(output).toContain('`licell_fc_deploy_check`');
    expect(output).not.toContain('old content');
  });

  it('keeps scenario doc generated block in sync with renderer', () => {
    const scenario = readFileSync('docs/scenarios/02-ai-driven-deployment.md', 'utf8');
    const synced = syncAiDrivenDeploymentScenario(scenario);
    expect(synced).toBe(scenario);
    expect(scenario).toContain(renderAiDrivenDeploymentPrecheckWorkflow().trim());
  });
});

describe('syncDomainAndHttpsScenario', () => {
  it('replaces content between domain bind and cleanup markers', () => {
    const input = [
      '# Title',
      '',
      SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START,
      'old app bind',
      SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END,
      '',
      SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START,
      'old static bind',
      SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END,
      '',
      SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START,
      'old app cleanup',
      SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END,
      '',
      SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START,
      'old static cleanup',
      SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END,
      ''
    ].join('\n');

    const output = syncDomainAndHttpsScenario(input);
    expect(output).toContain('`licell_domain_app_bind`');
    expect(output).toContain('`licell_domain_static_bind`');
    expect(output).toContain('`licell_domain_app_unbind`');
    expect(output).toContain('`licell_domain_static_unbind`');
    expect(output).not.toContain('old app bind');
    expect(output).not.toContain('old static bind');
    expect(output).not.toContain('old app cleanup');
    expect(output).not.toContain('old static cleanup');
  });

  it('keeps domain scenario generated blocks in sync with renderers', () => {
    const scenario = readFileSync('docs/scenarios/03-domain-and-https.md', 'utf8');
    const synced = syncDomainAndHttpsScenario(scenario);
    expect(synced).toBe(scenario);
    expect(scenario).toContain(renderDomainAppBindWorkflow().trim());
    expect(scenario).toContain(renderDomainStaticBindWorkflow().trim());
    expect(scenario).toContain(renderDomainAppUnbindWorkflow().trim());
    expect(scenario).toContain(renderDomainStaticUnbindWorkflow().trim());
  });
});
