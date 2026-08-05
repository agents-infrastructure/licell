import type { CAC } from 'cac';
import pc from 'picocolors';
import {
  Config,
  normalizeProject,
  type ProjectArtifactConfig,
  type ProjectConfig,
  type ProjectDeployTargetConfig,
  type ProjectRouteConfig
} from '../utils/config';
import {
  normalizeDeployType,
  normalizeDomainSuffix,
  normalizeCustomDomain,
  normalizeRegion,
  showIntro,
  showOutro,
  toOptionalString
} from '../utils/cli-shared';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { emitCliError, emitCommandResult, isJsonOutput } from '../utils/output';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { SETUP_SECTION } from './sections';
import {
  deriveDefaultAppName,
  normalizeComponentName,
  normalizeWorkspacePath,
  upsertWorkspaceComponent
} from '../utils/workspace-config';
import { setLicellBootstrapSelection, updateLicellComponentState } from '../utils/project-state';
import {
  buildBootstrapRefinementsForProject,
  buildBootstrapUnresolvedForProject,
  type BootstrapRefinementSuggestion,
  type BootstrapUnresolvedItem
} from '../utils/bootstrap-analysis';
import { discoverWorkspaceComponents, type WorkspaceDiscoverProposal } from '../utils/workspace-discovery';

interface BootstrapOptions {
  component?: string;
  path?: string;
  type?: string;
  app?: string;
  artifact?: string;
  entry?: string;
  runtime?: string;
  bucket?: string;
  function?: string;
  alias?: string;
  domain?: string;
  domainSuffix?: string;
  enableCdn?: boolean;
  ssl?: boolean;
  enableVpc?: boolean;
  disableVpc?: boolean;
  default?: boolean;
  defaultComponent?: string;
  region?: string;
  apply?: boolean;
  dryRun?: boolean;
  allDiscovered?: boolean;
  include?: string;
  exclude?: string;
}

interface BootstrapQuestion {
  id: string;
  title: string;
  description: string;
  required: boolean;
  choices?: string[];
}

interface BootstrapSkippedItem {
  component: string;
  reason: 'excluded_by_user' | 'not_discovered';
}

interface BootstrapComponentResult {
  component: string;
  path: string;
  deployType: 'static' | 'api' | 'task' | null;
  project: ProjectConfig;
  refinements: BootstrapRefinementSuggestion[];
  status: 'planned' | 'initialized';
  source: 'discover' | 'explicit';
}

interface SingleBootstrapProposal {
  mode: 'single';
  rootDir: string;
  componentName: string;
  componentPath: string;
  deployType: 'static' | 'api' | 'task' | null;
  appName: string;
  project: ProjectConfig;
  questions: BootstrapQuestion[];
  unresolved: BootstrapUnresolvedItem[];
  refinements: BootstrapRefinementSuggestion[];
  discoveredComponents: WorkspaceDiscoverProposal[];
}

interface BatchBootstrapProposal {
  mode: 'batch';
  rootDir: string;
  components: BootstrapComponentResult[];
  skipped: BootstrapSkippedItem[];
  unresolved: BootstrapUnresolvedItem[];
  discoveredComponents: WorkspaceDiscoverProposal[];
  defaultComponent: string | null;
}

function deriveDefaultBucketName(appName: string) {
  const auth = Config.getAuth();
  if (auth?.accountId) return `licell-${appName}-${auth.accountId.substring(0, 4)}`.toLowerCase();
  return `licell-${appName}`.toLowerCase();
}

function parseComponentList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeComponentName(item));
}

function buildProjectFromProposal(input: {
  rootDir: string;
  componentName: string;
  componentPath: string;
  deployType: 'static' | 'api' | 'task' | null;
  appName?: string;
  proposal?: WorkspaceDiscoverProposal;
  options?: BootstrapOptions;
}): ProjectConfig {
  const { rootDir, componentName, componentPath, deployType, proposal, options } = input;
  const appName = toOptionalString(options?.app) || input.appName || deriveDefaultAppName(componentName, componentPath);
  const region = toOptionalString(options?.region) ? normalizeRegion(String(options?.region)) : undefined;

  const artifact: ProjectArtifactConfig = deployType === 'static'
    ? {
      kind: 'directory',
      path: toOptionalString(options?.artifact) || proposal?.artifact.path || 'dist'
    }
    : {
      kind: 'source',
      entry: toOptionalString(options?.entry) || proposal?.artifact.entry || (deployType === 'task' ? 'src/task.ts' : 'src/index.ts')
    };

  const deployTarget: ProjectDeployTargetConfig | undefined = !deployType
    ? undefined
    : deployType === 'static'
      ? {
        service: 'oss-static',
        ...(region ? { region } : {}),
        bucket: toOptionalString(options?.bucket) || proposal?.deployTarget.bucket || deriveDefaultBucketName(appName)
      }
      : {
        service: deployType === 'task' ? 'fc-task' : 'fc-http',
        ...(region ? { region } : {}),
        function: toOptionalString(options?.function) || proposal?.deployTarget.function || appName,
        runtime: toOptionalString(options?.runtime) || proposal?.deployTarget.runtime || 'nodejs22',
        ...(toOptionalString(options?.alias) ? { alias: normalizeReleaseTarget(String(options?.alias)) } : {}),
        ...(options?.disableVpc
          ? { vpc: false }
          : options?.enableVpc
            ? { vpc: true }
            : {})
      };

  const explicitDomain = toOptionalString(options?.domain);
  const explicitDomainSuffix = toOptionalString(options?.domainSuffix);
  const allowInferredRouteHints = Boolean(explicitDomain || explicitDomainSuffix);
  const route: ProjectRouteConfig | undefined = deployType === 'task'
    ? undefined
    : {
      ...(explicitDomain ? { domain: normalizeCustomDomain(explicitDomain) } : {}),
      ...(explicitDomainSuffix ? { domainSuffix: normalizeDomainSuffix(explicitDomainSuffix) } : {}),
      ...(options?.enableCdn ? { cdn: true } : (allowInferredRouteHints && proposal?.route.cdn) ? { cdn: true } : {}),
      ...(options?.ssl ? { ssl: true } : (allowInferredRouteHints && proposal?.route.ssl) ? { ssl: true } : {})
    };

  return normalizeProject({
    schemaVersion: 3,
    appName,
    deployType,
    runtime: deployType === 'static' ? undefined : deployTarget?.runtime,
    entry: deployType === 'static' ? undefined : artifact.entry,
    dist: deployType === 'static' ? artifact.path : undefined,
    target: deployType === 'static' ? undefined : deployTarget?.alias,
    enableCdn: deployType === 'task' ? undefined : route?.cdn,
    enableSSL: deployType === 'task' ? undefined : route?.ssl,
    useVpc: deployType === 'static' ? undefined : deployTarget?.vpc,
    region,
    artifact,
    deployTarget,
    route,
    domain: route?.domain,
    domainSuffix: route?.domainSuffix,
    envs: {}
  });
}

function validateBatchOptionUsage(options: BootstrapOptions) {
  if (!options.allDiscovered) {
    if (options.include || options.exclude || options.defaultComponent) {
      throw new Error('--include / --exclude / --default-component 仅适用于 --all-discovered 批量模式。');
    }
    return;
  }
  const invalidFlags = [
    ['component', options.component],
    ['path', options.path],
    ['type', options.type],
    ['app', options.app],
    ['artifact', options.artifact],
    ['entry', options.entry],
    ['runtime', options.runtime],
    ['bucket', options.bucket],
    ['function', options.function],
    ['alias', options.alias],
    ['domain', options.domain],
    ['domainSuffix', options.domainSuffix],
    ['enableCdn', options.enableCdn],
    ['ssl', options.ssl],
    ['enableVpc', options.enableVpc],
    ['disableVpc', options.disableVpc],
    ['default', options.default],
    ['region', options.region]
  ].filter(([, value]) => value !== undefined && value !== false);

  if (invalidFlags.length > 0) {
    throw new Error(`--all-discovered 模式不接受单组件覆盖参数：${invalidFlags.map(([flag]) => `--${flag}`).join(', ')}；请先批量初始化，再按 component 单独精修。`);
  }
}

function resolveSingleBootstrapProposal(options: BootstrapOptions): SingleBootstrapProposal {
  const rootDir = process.cwd();
  const discovery = discoverWorkspaceComponents(rootDir);
  const requestedComponent = toOptionalString(options.component) ? normalizeComponentName(String(options.component)) : undefined;
  const discoveredProposal = requestedComponent
    ? discovery.components.find((item) => item.component === requestedComponent)
    : discovery.components.length === 1
      ? discovery.components[0]
      : undefined;
  const componentName = requestedComponent || discoveredProposal?.component;
  const deployType = toOptionalString(options.type)
    ? normalizeDeployType(String(options.type))
    : discoveredProposal?.type
      || null;
  const questions: BootstrapQuestion[] = [];

  if (!componentName) {
    questions.push({
      id: 'component',
      title: '确认 component 名称',
      description: discovery.components.length > 0
        ? '检测到多个候选 component，请明确选择。'
        : '例如 web / api / worker。',
      required: true,
      ...(discovery.components.length > 0 ? { choices: discovery.components.map((item) => item.component) } : {})
    });
  }
  if (!deployType) {
    questions.push({
      id: 'type',
      title: '确认部署类型',
      description: '支持 static / api / task。',
      required: true,
      choices: ['static', 'api', 'task']
    });
  }

  const safeComponentName = componentName || 'app';
  const componentPath = normalizeWorkspacePath(
    rootDir,
    toOptionalString(options.path) || discoveredProposal?.path || safeComponentName,
    safeComponentName
  );
  const project = buildProjectFromProposal({
    rootDir,
    componentName: safeComponentName,
    componentPath,
    deployType,
    proposal: discoveredProposal,
    options
  });
  const unresolved = buildBootstrapUnresolvedForProject(safeComponentName, deployType, project);
  const refinements = buildBootstrapRefinementsForProject({
    component: safeComponentName,
    deployType,
    project
  }, {
    reviewInferredTargetNames: Boolean(discoveredProposal)
  });
  if (!questions.some((item) => item.id === 'domain')) {
    for (const item of unresolved) {
      questions.push({
        id: item.field,
        title: item.title,
        description: '如果暂时不需要自定义域名，可以稍后再补充。',
        required: false
      });
    }
  }

  return {
    mode: 'single',
    rootDir,
    componentName: safeComponentName,
    componentPath,
    deployType,
    appName: project.appName || deriveDefaultAppName(safeComponentName, componentPath),
    project,
    questions,
    unresolved,
    refinements,
    discoveredComponents: discovery.components
  };
}

function resolveBatchBootstrapProposal(options: BootstrapOptions): BatchBootstrapProposal {
  validateBatchOptionUsage(options);
  const rootDir = process.cwd();
  const discovery = discoverWorkspaceComponents(rootDir);
  if (discovery.components.length === 0) {
    throw new Error('当前 repo 未发现可初始化的 deploy components；请改用单组件 bootstrap 显式提供参数。');
  }

  const include = new Set(parseComponentList(options.include));
  const exclude = new Set(parseComponentList(options.exclude));
  const skipped: BootstrapSkippedItem[] = [];
  const selected = discovery.components.filter((proposal) => {
    if (include.size > 0 && !include.has(proposal.component)) {
      skipped.push({ component: proposal.component, reason: 'excluded_by_user' });
      return false;
    }
    if (exclude.has(proposal.component)) {
      skipped.push({ component: proposal.component, reason: 'excluded_by_user' });
      return false;
    }
    return true;
  });

  if (selected.length === 0) {
    throw new Error('筛选后没有可初始化的 discovered components；请检查 --include / --exclude。');
  }

  const explicitDefault = toOptionalString(options.defaultComponent)
    ? normalizeComponentName(String(options.defaultComponent))
    : undefined;
  if (explicitDefault && !selected.some((proposal) => proposal.component === explicitDefault)) {
    throw new Error(`--default-component ${explicitDefault} 不在本次 bootstrap 选择的 components 中。`);
  }
  const defaultComponent = explicitDefault || selected[0]?.component || null;

  const components = selected.map((proposal) => {
    const project = buildProjectFromProposal({
      rootDir,
      componentName: proposal.component,
      componentPath: proposal.path,
      deployType: proposal.type,
      proposal
    });
    return {
      component: proposal.component,
      path: proposal.path,
      deployType: proposal.type,
      project,
      refinements: buildBootstrapRefinementsForProject({
        component: proposal.component,
        deployType: proposal.type,
        project
      }, {
        reviewInferredTargetNames: true
      }),
      status: (options.apply && !options.dryRun ? 'initialized' : 'planned') as 'initialized' | 'planned',
      source: 'discover' as const
    };
  });

  const unresolved = components.flatMap((component) => buildBootstrapUnresolvedForProject(component.component, component.deployType, component.project));

  return {
    mode: 'batch',
    rootDir,
    components,
    skipped,
    unresolved,
    discoveredComponents: discovery.components,
    defaultComponent
  };
}

const bootstrapCommand = defineCliCommand({
  rawName: 'bootstrap',
  description: '把已确认的部署方案初始化到 `.licell/project.json` / `.licell/state.json`',
  regionOptionMode: 'project-default',
  options: [
    { rawName: '--component <name>', description: '单组件模式：component 名称，例如 web / api' },
    { rawName: '--path <path>', description: '单组件模式：component 相对 repo 根路径' },
    { rawName: '--type <type>', description: '单组件模式：部署类型：static / api / task' },
    { rawName: '--app <name>', description: '单组件模式：逻辑应用名；未传时按 component 推导' },
    { rawName: '--artifact <path>', description: '单组件模式：静态产物目录（例如 dist）' },
    { rawName: '--entry <entry>', description: '单组件模式：API / task 入口文件' },
    { rawName: '--runtime <runtime>', description: '单组件模式：FC runtime，例如 nodejs22 / python3.13 / docker' },
    { rawName: '--bucket <name>', description: '单组件模式：静态站目标 OSS Bucket 名称' },
    { rawName: '--function <name>', description: '单组件模式：API / task 目标 FC Function 名称' },
    { rawName: '--alias <name>', description: '单组件模式：默认 alias / release target' },
    { rawName: '--domain <domain>', description: '单组件模式：固定域名' },
    { rawName: '--domain-suffix <suffix>', description: '单组件模式：固定域名后缀' },
    { rawName: '--enable-cdn', description: '单组件模式：初始化为启用 CDN' },
    { rawName: '--ssl', description: '单组件模式：初始化为启用 HTTPS' },
    { rawName: '--enable-vpc', description: '单组件模式：初始化为启用 VPC' },
    { rawName: '--disable-vpc', description: '单组件模式：初始化为禁用 VPC' },
    { rawName: '--default', description: '单组件模式：将该 component 设为默认 component' },
    { rawName: '--region <region>', description: '单组件模式：写入项目默认 region（不是单次调用覆盖）' },
    { rawName: '--all-discovered', description: '批量模式：把 `workspace discover` 找到的所有候选 components 一次性初始化' },
    { rawName: '--include <names>', description: '批量模式：仅初始化这些 discovered components（逗号分隔）' },
    { rawName: '--exclude <names>', description: '批量模式：跳过这些 discovered components（逗号分隔）' },
    { rawName: '--default-component <name>', description: '批量模式：显式指定 workspace 默认 component' },
    { rawName: '--apply', description: '直接写入 `.licell/project.json` 与 `.licell/state.json`' },
    { rawName: '--dry-run', description: '只输出 bootstrap 结果，不写文件' }
  ],
  descriptor: {
    title: 'Bootstrap deployment config',
    summary: '把已确认的部署方案写成 licell 的声明式项目配置；既支持单组件精细初始化，也支持把 discover 提案批量落盘。',
    notes: [
      '单组件模式适合对某个 component 做精确建模；批量模式适合先把 monorepo 的 discovered components 一次性收敛进 licell workspace。',
      '`--all-discovered` 时，只允许 `--include` / `--exclude` / `--default-component` / `--apply` / `--dry-run` 这些批量参数；其它单组件覆盖参数会报错。',
      'bootstrap 会初始化 `project.json` 与版本化的 `state.json` 骨架；域名等未确认项会留在 `unresolved[]` 中，后续再用单组件 bootstrap 或 deploy/domain 命令精修。',
      '每个 component 的结果里都会附带 `refinements[]`，明确告诉 Agent 还建议补哪些 flag，以及推荐复用哪条 bootstrap 命令模板继续收敛。'
    ],
    optionInsights: {
      '--all-discovered': {
        whenToUse: '希望把 `workspace discover` 的候选 components 一次性初始化成 licell workspace 时使用。',
        cautions: ['该模式不接受 `--component` / `--path` / `--bucket` / `--function` / `--domain` 这类单组件覆盖参数。']
      },
      '--include': {
        whenToUse: '批量模式下，只想初始化部分 discovered components 时使用。',
        cautions: ['值为逗号分隔 component 名；会先于 `--exclude` 做筛选。']
      },
      '--exclude': {
        whenToUse: '批量模式下，需要跳过某些 discovered components 时使用。',
        cautions: ['值为逗号分隔 component 名；适合先全量 discover，再去掉 docs/demo/admin 等非部署单元。']
      },
      '--default-component': {
        whenToUse: '批量模式下，想明确指定 workspace 默认 component 时使用。',
        cautions: ['必须属于本次实际初始化的 component 集合。']
      },
      '--component': {
        whenToUse: '单组件模式下，显式声明要初始化哪个 deploy unit 时使用。',
        cautions: ['未传且 repo 里只发现 1 个 component 时，bootstrap 会自动复用 discover 提案。']
      },
      '--default': {
        whenToUse: '单组件模式下，需要把当前 component 设为 workspace 默认 component 时使用。',
        cautions: ['批量模式请改用 `--default-component`。']
      },
      '--dry-run': {
        whenToUse: '先让 Agent / 人确认 bootstrap 结果，而不是立即改写 repo 配置时使用。',
        cautions: ['不会写 `.licell/project.json` 或 `.licell/state.json`。']
      }
    },
    recommendedFlow: [
      { title: '先 discover repo', command: 'licell workspace discover --output json', reason: '先拿到候选 component、deploy type 提案和待确认问题。' },
      { title: '批量初始化 discovered components', command: 'licell bootstrap --all-discovered --apply --output json', reason: '先把 monorepo 里的主要 deploy units 收敛到 licell workspace。' },
      { title: '按 component 精修', command: 'licell bootstrap --component api --function my-api --domain api.example.com --apply --output json', reason: '对需要更精确的 FC function / domain / bucket 命名做二次收敛。' },
      { title: '确认部署计划', command: 'licell deploy plan --output json', reason: '在真正 deploy 前，先让 Agent / 人看到 artifact -> target -> route 的完整计划。' }
    ],
    result: {
      summary: '返回 bootstrap 结果、未解析项和是否已写入配置。',
      fields: [
        { name: 'mode', description: '`single` 或 `batch`。', required: true },
        { name: 'components[]', description: '本次规划或初始化的 component 列表。' },
        { name: 'questions[]', description: '单组件模式下建议确认的问题。' },
        { name: 'unresolved[]', description: '仍待人工确认的 deploy 字段。', required: true },
        { name: 'refinements[]', description: '单组件模式下，建议继续执行的精修动作与命令模板。' },
        { name: 'skipped[]', description: '批量模式下被 include/exclude 过滤掉的 component。' },
        { name: 'applied', description: '是否已落盘。', required: true }
      ]
    }
  }
});

export function registerBootstrapCommand(cli: CAC) {
  registerCliCommand(cli, bootstrapCommand)
    .action((options: BootstrapOptions) => {
      try {
        if (options.enableVpc && options.disableVpc) {
          throw new Error('--enable-vpc 与 --disable-vpc 不能同时使用');
        }
        if (options.domain && options.domainSuffix) {
          throw new Error('--domain 与 --domain-suffix 不能同时使用');
        }
        validateBatchOptionUsage(options);

        const shouldApply = Boolean(options.apply) && !options.dryRun;
        if (options.allDiscovered) {
          const proposal = resolveBatchBootstrapProposal(options);
          if (shouldApply) {
            for (const component of proposal.components) {
              upsertWorkspaceComponent({
                rootDir: proposal.rootDir,
                componentName: component.component,
                componentPath: component.path,
                project: component.project,
                defaultComponent: proposal.defaultComponent === component.component
              });
              updateLicellComponentState({}, { cwd: proposal.rootDir, component: component.component });
            }
            setLicellBootstrapSelection({
              mode: 'batch',
              selectedComponents: proposal.components.map((component) => component.component),
              skippedComponents: proposal.skipped.map((item) => item.component),
              defaultComponent: proposal.defaultComponent || undefined
            }, proposal.rootDir);
          }

          const payload = {
            mode: proposal.mode,
            rootDir: proposal.rootDir,
            components: proposal.components,
            skipped: proposal.skipped,
            unresolved: proposal.unresolved,
            discoveredComponents: proposal.discoveredComponents,
            defaultComponent: proposal.defaultComponent,
            applied: shouldApply,
            dryRun: Boolean(options.dryRun)
          };

          if (isJsonOutput()) {
            emitCommandResult(payload, { stage: 'bootstrap', inferOutcome: false });
            return;
          }

          showIntro(pc.bgBlue(pc.white(' Bootstrap ')));
          console.log(`mode:      ${pc.cyan('batch')}`);
          console.log(`root:      ${pc.cyan(proposal.rootDir)}`);
          console.log(`default:   ${pc.cyan(proposal.defaultComponent || '-')}`);
          for (const component of proposal.components) {
            console.log(`- ${pc.cyan(component.component)} path=${pc.gray(component.path)} type=${pc.gray(component.deployType || '?')}`);
            if (component.refinements.length > 0) {
              for (const refinement of component.refinements) {
                console.log(`  ${refinement.priority === 'primary' ? pc.yellow('refine') : pc.gray('refine')}: ${refinement.title}`);
              }
            }
          }
          showOutro(shouldApply ? 'discovered components 已批量写入 .licell/project.json / .licell/state.json' : 'batch bootstrap 结果已生成（未写文件）');
          return;
        }

        const proposal = resolveSingleBootstrapProposal(options);
        if (shouldApply && proposal.questions.some((question) => question.required)) {
          throw new Error('当前 bootstrap 仍缺少必填确认项；请先补齐 component/type 等参数，或先读取 questions[]。');
        }

        if (shouldApply) {
          upsertWorkspaceComponent({
            rootDir: proposal.rootDir,
            componentName: proposal.componentName,
            componentPath: proposal.componentPath,
            project: proposal.project,
            defaultComponent: options.default
          });
          updateLicellComponentState({}, { cwd: proposal.rootDir, component: proposal.componentName });
        }

        const payload = {
          mode: proposal.mode,
          rootDir: proposal.rootDir,
          component: proposal.componentName,
          path: proposal.componentPath,
          deployType: proposal.deployType,
          project: proposal.project,
          discoveredComponents: proposal.discoveredComponents,
          questions: proposal.questions,
          unresolved: proposal.unresolved,
          refinements: proposal.refinements,
          applied: shouldApply,
          dryRun: Boolean(options.dryRun)
        };

        if (isJsonOutput()) {
          emitCommandResult(payload, { stage: 'bootstrap', inferOutcome: false });
          return;
        }

        showIntro(pc.bgBlue(pc.white(' Bootstrap ')));
        console.log(`mode:      ${pc.cyan('single')}`);
        console.log(`root:      ${pc.cyan(proposal.rootDir)}`);
        console.log(`component: ${pc.cyan(proposal.componentName)}`);
        console.log(`path:      ${pc.cyan(proposal.componentPath)}`);
        console.log(`type:      ${pc.cyan(proposal.deployType || '?')}`);
        if (proposal.questions.length > 0) {
          console.log('\n待确认项:');
          for (const question of proposal.questions) {
            console.log(`- ${question.title}`);
          }
        }
        if (proposal.refinements.length > 0) {
          console.log('\n建议精修:');
          for (const refinement of proposal.refinements) {
            console.log(`- ${refinement.title}`);
          }
        }
        showOutro(shouldApply ? '部署配置已写入 .licell/project.json / .licell/state.json' : '提案已生成（未写文件）');
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'bootstrap' });
        } else {
          console.error(String(err instanceof Error ? err.message : err));
        }
        process.exitCode = 1;
      }
    });
}

export const bootstrapCommandModule = defineCommandModule({
  section: SETUP_SECTION,
  register: registerBootstrapCommand,
  commands: [bootstrapCommand]
});
