import type { ProjectConfig } from './config';

export interface BootstrapRefinementSuggestion {
  component: string;
  priority: 'primary' | 'secondary';
  reason: 'configure_domain' | 'configure_alias' | 'review_bucket' | 'review_function';
  title: string;
  description: string;
  fields: string[];
  flags: string[];
  commandTemplate: string;
}

export interface BootstrapUnresolvedItem {
  component: string;
  field: string;
  reason: 'needs_confirmation';
  title: string;
  flags: string[];
  commandTemplate: string;
}

interface BuildBootstrapRefinementsInput {
  component: string;
  deployType: 'static' | 'api' | 'task' | null;
  project: ProjectConfig;
}

interface BuildBootstrapRefinementsOptions {
  reviewInferredTargetNames?: boolean;
}

function buildBootstrapCommandTemplate(component: string, flag: string, value: string) {
  return `licell bootstrap --component ${component} ${flag} ${value} --apply --output json`;
}

export function buildBootstrapUnresolvedForProject(
  component: string,
  deployType: 'static' | 'api' | 'task' | null,
  project: ProjectConfig
): BootstrapUnresolvedItem[] {
  if (!deployType || deployType === 'task') return [];
  if (project.route?.domain || project.route?.domainSuffix || project.domain || project.domainSuffix) return [];
  return [{
    component,
    field: 'route.domain',
    reason: 'needs_confirmation',
    title: `确认 ${component} 的访问域名（或明确回答 NONE）`,
    flags: ['--domain'],
    commandTemplate: buildBootstrapCommandTemplate(component, '--domain', '<domain>')
  }];
}

export function buildBootstrapRefinementsForProject(
  input: BuildBootstrapRefinementsInput,
  options: BuildBootstrapRefinementsOptions = {}
): BootstrapRefinementSuggestion[] {
  const { component, deployType, project } = input;
  const reviewInferredTargetNames = Boolean(options.reviewInferredTargetNames);
  if (!deployType) return [];

  const refinements: BootstrapRefinementSuggestion[] = [];
  // Domain confirmation is already surfaced via unresolved[].
  // Avoid duplicating the same guidance in refinements[].

  if (reviewInferredTargetNames && deployType === 'static' && project.deployTarget?.bucket) {
    refinements.push({
      component,
      priority: 'secondary',
      reason: 'review_bucket',
      title: `复核 ${component} 的 OSS Bucket 命名`,
      description: '当前 bucket 名称来自 discover 推断；如果团队已有固定命名约定，请改成正式 Bucket 名后再执行。',
      fields: ['deployTarget.bucket'],
      flags: ['--bucket'],
      commandTemplate: buildBootstrapCommandTemplate(component, '--bucket', project.deployTarget.bucket)
    });
  }

  if (reviewInferredTargetNames && deployType !== 'static' && project.deployTarget?.function) {
    refinements.push({
      component,
      priority: 'secondary',
      reason: 'review_function',
      title: `复核 ${component} 的 FC Function 命名`,
      description: '当前 function 名称来自 discover 推断；如果线上已有固定函数名，请改成正式名称后再执行。',
      fields: ['deployTarget.function'],
      flags: ['--function'],
      commandTemplate: buildBootstrapCommandTemplate(component, '--function', project.deployTarget.function)
    });
  }

  if (!project.deployTarget?.alias && deployType !== 'static') {
    refinements.push({
      component,
      priority: 'secondary',
      reason: 'configure_alias',
      title: `为 ${component} 规划稳定 alias`,
      description: '当前还没有默认 alias / release target。若后续希望 CI 和团队统一指向稳定入口，建议补齐 `--alias`。',
      fields: ['deployTarget.alias'],
      flags: ['--alias'],
      commandTemplate: buildBootstrapCommandTemplate(component, '--alias', '<alias>')
    });
  }

  return refinements;
}
