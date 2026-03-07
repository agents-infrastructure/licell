import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  SCENARIO_AI_PRECHECK_WORKFLOW_END,
  SCENARIO_AI_PRECHECK_WORKFLOW_START,
  renderAiDrivenDeploymentPrecheckWorkflow,
  syncAiDrivenDeploymentScenario
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
