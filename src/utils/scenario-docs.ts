import { readFileSync } from 'fs';
import { resolve } from 'path';
import { syncTextFile } from './generated-docs';
import {
  SCENARIO_AI_PRECHECK_WORKFLOW_END,
  SCENARIO_AI_PRECHECK_WORKFLOW_SECTION,
  SCENARIO_AI_PRECHECK_WORKFLOW_START,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_SECTION,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_SECTION,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_SECTION,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_SECTION,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START,
  renderWorkflowDocGeneratedSection,
  syncWorkflowDocGeneratedSection
} from './workflow-doc-sections';

export {
  SCENARIO_AI_PRECHECK_WORKFLOW_END,
  SCENARIO_AI_PRECHECK_WORKFLOW_START,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_END,
  SCENARIO_DOMAIN_APP_BIND_WORKFLOW_START,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_END,
  SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_START,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_END,
  SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_START,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_END,
  SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_START
} from './workflow-doc-sections';

export function renderAiDrivenDeploymentPrecheckWorkflow() {
  return renderWorkflowDocGeneratedSection(SCENARIO_AI_PRECHECK_WORKFLOW_SECTION);
}

export function renderDomainAppBindWorkflow() {
  return renderWorkflowDocGeneratedSection(SCENARIO_DOMAIN_APP_BIND_WORKFLOW_SECTION);
}

export function renderDomainStaticBindWorkflow() {
  return renderWorkflowDocGeneratedSection(SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_SECTION);
}

export function renderDomainAppUnbindWorkflow() {
  return renderWorkflowDocGeneratedSection(SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_SECTION);
}

export function renderDomainStaticUnbindWorkflow() {
  return renderWorkflowDocGeneratedSection(SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_SECTION);
}

export function syncAiDrivenDeploymentScenario(content: string) {
  return syncWorkflowDocGeneratedSection(content, SCENARIO_AI_PRECHECK_WORKFLOW_SECTION);
}

export function syncDomainAndHttpsScenario(content: string) {
  return syncWorkflowDocGeneratedSection(
    syncWorkflowDocGeneratedSection(
      syncWorkflowDocGeneratedSection(
        syncWorkflowDocGeneratedSection(content, SCENARIO_DOMAIN_APP_BIND_WORKFLOW_SECTION),
        SCENARIO_DOMAIN_STATIC_BIND_WORKFLOW_SECTION
      ),
      SCENARIO_DOMAIN_APP_UNBIND_WORKFLOW_SECTION
    ),
    SCENARIO_DOMAIN_STATIC_UNBIND_WORKFLOW_SECTION
  );
}

export function syncAiDrivenDeploymentScenarioFile(
  filePath = resolve(process.cwd(), 'docs/scenarios/02-ai-driven-deployment.md')
) {
  const current = readFileSync(filePath, 'utf8');
  const next = syncAiDrivenDeploymentScenario(current);
  const result = syncTextFile(filePath, next);
  return { updated: result.updated, filePath };
}

export function syncDomainAndHttpsScenarioFile(
  filePath = resolve(process.cwd(), 'docs/scenarios/03-domain-and-https.md')
) {
  const current = readFileSync(filePath, 'utf8');
  const next = syncDomainAndHttpsScenario(current);
  const result = syncTextFile(filePath, next);
  return { updated: result.updated, filePath };
}
