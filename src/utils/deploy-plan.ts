import type { ProjectConfig, WorkspaceConfigSnapshot } from './config';
import { Config } from './config';
import { readLicellState } from './project-state';
import { normalizeRegionId } from './region-context';
import { normalizeComponentName } from './workspace-config';

export interface DeployPlanIssue {
  level: 'info' | 'warn';
  message: string;
}

export interface DeployPlanComponent {
  component: string;
  path?: string;
  deployType?: string;
  artifact: Record<string, string | null>;
  target: Record<string, string | boolean | null>;
  route: Record<string, string | boolean | null>;
  command: string;
  expectedUrl?: string | null;
  issues: DeployPlanIssue[];
}

export interface DeployPlanResult {
  rootDir: string;
  mode: 'single' | 'workspace';
  selectionSource: 'bootstrap' | 'workspace' | 'explicit-filter';
  selectedComponents: string[];
  skippedComponents: string[];
  components: DeployPlanComponent[];
}

interface DeployPlanSelectionInput {
  component?: string;
  include?: string;
  exclude?: string;
  region?: string;
  cwd?: string;
}

function parseComponentList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeComponentName(item));
}

function inferExpectedUrl(project: ProjectConfig) {
  if (project.route?.domain || project.domain) {
    const domain = project.route?.domain || project.domain;
    const protocol = project.route?.ssl ?? project.enableSSL ? 'https' : 'http';
    return `${protocol}://${domain}`;
  }
  if ((project.route?.domainSuffix || project.domainSuffix) && project.appName) {
    const suffix = project.route?.domainSuffix || project.domainSuffix;
    const protocol = project.route?.ssl ?? project.enableSSL ? 'https' : 'http';
    return `${protocol}://${project.appName}.${suffix}`;
  }
  return null;
}

function buildPlanForProject(
  component: string,
  project: ProjectConfig,
  path?: string,
  invocationRegion?: string
): DeployPlanComponent {
  const deployType = project.deployType || (project.deployTarget?.service === 'oss-static' ? 'static' : undefined);
  const issues: DeployPlanIssue[] = [];
  const artifact = deployType === 'static'
    ? {
      kind: project.artifact?.kind || 'directory',
      path: project.artifact?.path || project.dist || null,
      entry: null
    }
    : {
      kind: project.artifact?.kind || 'source',
      path: null,
      entry: project.artifact?.entry || project.entry || null
    };

  const target = deployType === 'static'
    ? {
      service: project.deployTarget?.service || 'oss-static',
      region: invocationRegion || project.region || null,
      bucket: project.deployTarget?.bucket || (project.appName ? `licell-${project.appName}${Config.getAuth()?.accountId ? `-${Config.getAuth()!.accountId.substring(0, 4)}` : ''}` : null),
      function: null,
      alias: null,
      runtime: null,
      vpc: null
    }
    : {
      service: project.deployTarget?.service || (deployType === 'task' ? 'fc-task' : 'fc-http'),
      region: invocationRegion || project.region || null,
      bucket: null,
      function: project.deployTarget?.function || project.appName || null,
      alias: project.deployTarget?.alias || project.target || null,
      runtime: project.deployTarget?.runtime || project.runtime || null,
      vpc: project.deployTarget?.vpc ?? project.useVpc ?? null
    };

  const route = {
    domain: project.route?.domain || project.domain || null,
    domainSuffix: project.route?.domainSuffix || project.domainSuffix || null,
    cdn: project.route?.cdn ?? project.enableCdn ?? null,
    ssl: project.route?.ssl ?? project.enableSSL ?? null
  };

  if (deployType === 'static' && !artifact.path) issues.push({ level: 'warn', message: '未声明静态产物目录；CI/Agent 需要在 deploy 前准备目录。' });
  if (deployType !== 'static' && !artifact.entry) {
    issues.push({ level: 'warn', message: '未声明函数入口文件；deploy 时可能回退到 runtime 默认入口。' });
  }
  if (deployType !== 'static' && !target.function) issues.push({ level: 'warn', message: '未声明目标 FC function 名称。' });
  if (deployType === 'static' && !target.bucket) issues.push({ level: 'warn', message: '未声明目标 OSS bucket 名称。' });
  if (!route.domain && !route.domainSuffix && deployType !== 'task') {
    issues.push({ level: 'warn', message: '未声明访问入口域名；deploy 后只会依赖云端默认地址。' });
  }

  return {
    component,
    ...(path ? { path } : {}),
    deployType,
    artifact,
    target,
    route,
    command: [
      'licell deploy',
      ...(component === 'default' ? [] : ['--component', component]),
      ...(invocationRegion ? ['--region', invocationRegion] : []),
      '--output json'
    ].join(' '),
    expectedUrl: inferExpectedUrl(project),
    issues
  };
}

function resolvePlanSelection(snapshot: WorkspaceConfigSnapshot, input: DeployPlanSelectionInput = {}) {
  const deployableComponents = snapshot.mode === 'workspace'
    ? snapshot.components
      .filter((component) => component.project.deployType === 'static' || component.project.deployType === 'api' || component.project.deployType === 'task')
    : [{
      name: snapshot.componentName || 'default',
      path: snapshot.componentPath,
      project: snapshot.project,
      matched: true,
      defaultComponent: true
    }];

  const explicitComponent = input.component ? normalizeComponentName(input.component) : undefined;
  const include = new Set(parseComponentList(input.include));
  const exclude = new Set(parseComponentList(input.exclude));
  const hasExplicitFilter = Boolean(explicitComponent) || include.size > 0 || exclude.size > 0;
  const deployableNames = new Set(deployableComponents.map((component) => component.name));
  const bootstrapSelection = readLicellState(input.cwd || process.cwd()).bootstrap?.selectedComponents || [];
  const bootstrapMatched = bootstrapSelection.length > 0
    ? deployableComponents.filter((component) => bootstrapSelection.includes(component.name))
    : [];

  if (explicitComponent && !deployableNames.has(explicitComponent)) {
    throw new Error(`--component 指定的 component 不存在或未配置 deployType: ${explicitComponent}`);
  }
  for (const name of include) {
    if (!deployableNames.has(name)) {
      throw new Error(`--include 指定的 component 不存在或未配置 deployType: ${name}`);
    }
  }
  for (const name of exclude) {
    if (!deployableNames.has(name)) {
      throw new Error(`--exclude 指定的 component 不存在或未配置 deployType: ${name}`);
    }
  }

  const baseSet = explicitComponent
    ? deployableComponents.filter((component) => component.name === explicitComponent)
    : hasExplicitFilter
      ? deployableComponents
      : bootstrapMatched.length > 0
        ? bootstrapMatched
        : deployableComponents;

  const selected = baseSet.filter((component) => {
    if (include.size > 0 && !include.has(component.name)) return false;
    if (exclude.has(component.name)) return false;
    return true;
  });

  if (selected.length === 0) {
    throw new Error('筛选后没有可生成 deploy plan 的 components；请检查 --component / --include / --exclude。');
  }

  const selectedNames = selected.map((component) => component.name);
  const skippedNames = deployableComponents
    .map((component) => component.name)
    .filter((name) => !selectedNames.includes(name));
  const selectionSource: DeployPlanResult['selectionSource'] = hasExplicitFilter
    ? 'explicit-filter'
    : bootstrapMatched.length > 0
      ? 'bootstrap'
      : 'workspace';

  return {
    selected,
    selectedNames,
    skippedNames,
    selectionSource
  };
}

export function buildDeployPlan(snapshot: WorkspaceConfigSnapshot, input: DeployPlanSelectionInput = {}): DeployPlanResult {
  const selection = resolvePlanSelection(snapshot, input);
  const invocationRegion = normalizeRegionId(input.region);
  return {
    rootDir: snapshot.rootDir,
    mode: snapshot.mode,
    selectionSource: selection.selectionSource,
    selectedComponents: selection.selectedNames,
    skippedComponents: selection.skippedNames,
    components: selection.selected.map((component) => buildPlanForProject(
      component.name,
      component.project,
      component.path,
      invocationRegion
    ))
  };
}

export function getDeployPlanSnapshot(component?: string, cwd = process.cwd()) {
  const snapshot = Config.getWorkspace({ component, cwd });
  if (!snapshot) throw new Error('当前目录未检测到 `.licell/project.json`；请先执行 licell bootstrap 或 workspace init。');
  return snapshot;
}
