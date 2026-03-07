import { readFileSync } from 'fs';
import { resolve } from 'path';
import { syncGeneratedSection, syncTextFile } from './generated-docs';
import {
  FC_API_PRECHECK_WORKFLOW_TAG,
  renderTaggedCuratedWorkflowNumberedList
} from './mcp-workflow-docs';

export const SCENARIO_AI_PRECHECK_WORKFLOW_START = '<!-- BEGIN GENERATED:SCENARIO_AI_PRECHECK_WORKFLOW -->';
export const SCENARIO_AI_PRECHECK_WORKFLOW_END = '<!-- END GENERATED:SCENARIO_AI_PRECHECK_WORKFLOW -->';

export function renderAiDrivenDeploymentPrecheckWorkflow() {
  return renderTaggedCuratedWorkflowNumberedList(FC_API_PRECHECK_WORKFLOW_TAG);
}

export function syncAiDrivenDeploymentScenario(content: string) {
  return syncGeneratedSection(content, {
    startMarker: SCENARIO_AI_PRECHECK_WORKFLOW_START,
    endMarker: SCENARIO_AI_PRECHECK_WORKFLOW_END,
    generatedContent: renderAiDrivenDeploymentPrecheckWorkflow(),
    missingMarkersMessage: 'Scenario AI precheck workflow markers not found'
  });
}

export function syncAiDrivenDeploymentScenarioFile(
  filePath = resolve(process.cwd(), 'docs/scenarios/02-ai-driven-deployment.md')
) {
  const current = readFileSync(filePath, 'utf8');
  const next = syncAiDrivenDeploymentScenario(current);
  const result = syncTextFile(filePath, next);
  return { updated: result.updated, filePath };
}
