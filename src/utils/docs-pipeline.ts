import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { renderAgentSurfaceReferenceDoc } from './agent-surface-docs';
import { normalizeTextFileContent, syncTextFile } from './generated-docs';
import { syncReadmeGeneratedSections } from './readme-docs';
import { syncAiDrivenDeploymentScenario, syncDomainAndHttpsScenario } from './scenario-docs';

export interface GeneratedDocTarget {
  id: string;
  filePath: string;
  computeNext(currentContent: string): string;
}

export interface GeneratedDocResult {
  id: string;
  filePath: string;
  updated: boolean;
}

function readCurrentContent(filePath: string) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

export function getGeneratedDocTargets(rootDir = process.cwd()): GeneratedDocTarget[] {
  return [
    {
      id: 'readme',
      filePath: resolve(rootDir, 'README.md'),
      computeNext(currentContent: string) {
        return syncReadmeGeneratedSections(currentContent);
      }
    },
    {
      id: 'agent-surfaces',
      filePath: resolve(rootDir, 'docs/reference/agent-surfaces.md'),
      computeNext() {
        return renderAgentSurfaceReferenceDoc();
      }
    },
    {
      id: 'scenario-ai-driven-deployment',
      filePath: resolve(rootDir, 'docs/scenarios/02-ai-driven-deployment.md'),
      computeNext(currentContent: string) {
        return syncAiDrivenDeploymentScenario(currentContent);
      }
    },
    {
      id: 'scenario-domain-and-https',
      filePath: resolve(rootDir, 'docs/scenarios/03-domain-and-https.md'),
      computeNext(currentContent: string) {
        return syncDomainAndHttpsScenario(currentContent);
      }
    }
  ];
}

export function syncGeneratedDocTarget(target: GeneratedDocTarget): GeneratedDocResult {
  const current = readCurrentContent(target.filePath);
  const next = target.computeNext(current);
  const result = syncTextFile(target.filePath, next);
  return {
    id: target.id,
    filePath: target.filePath,
    updated: result.updated
  };
}

export function syncAllGeneratedDocs(rootDir = process.cwd()): GeneratedDocResult[] {
  return getGeneratedDocTargets(rootDir).map((target) => syncGeneratedDocTarget(target));
}

export function checkGeneratedDocTarget(target: GeneratedDocTarget): GeneratedDocResult {
  const current = readCurrentContent(target.filePath);
  const next = normalizeTextFileContent(target.computeNext(current));
  return {
    id: target.id,
    filePath: target.filePath,
    updated: normalizeTextFileContent(current) !== next
  };
}

export function checkAllGeneratedDocs(rootDir = process.cwd()): GeneratedDocResult[] {
  return getGeneratedDocTargets(rootDir).map((target) => checkGeneratedDocTarget(target));
}
