import type { CAC } from 'cac';
import pc from 'picocolors';
import { Config, normalizeProject } from '../utils/config';
import {
  defineCliCommand,
  defineCommandModule,
  registerCliCommand
} from './module';
import { SETUP_SECTION } from './sections';
import {
  normalizeCustomDomain,
  normalizeDeployType,
  normalizeDomainSuffix,
  normalizeRegion,
  showIntro,
  showOutro,
  toOptionalString
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { normalizeReleaseTarget } from '../utils/cli-helpers';
import { renderLicellDoctorReport, runLicellDoctor } from '../utils/doctor';
import { discoverWorkspaceComponents } from '../utils/workspace-discovery';
import {
  deriveDefaultAppName,
  normalizeComponentName,
  normalizeWorkspacePath,
  readProjectFile,
  readWorkspaceFile,
  type WorkspaceFileShape,
  upsertWorkspaceComponent,
  writeWorkspaceFile
} from '../utils/workspace-config';

interface WorkspaceListOptions {
  component?: string;
}

interface WorkspaceInitOptions {
  component?: string;
  path?: string;
  type?: string;
  app?: string;
  runtime?: string;
  entry?: string;
  dist?: string;
  domain?: string;
  domainSuffix?: string;
  target?: string;
  enableCdn?: boolean;
  ssl?: boolean;
  enableVpc?: boolean;
  disableVpc?: boolean;
  default?: boolean;
  region?: string;
}

interface WorkspaceDoctorOptions {
  component?: string;
  runtime?: string;
  entry?: string;
  dockerDaemon?: boolean;
  offline?: boolean;
}

interface WorkspaceDiscoverOptions {}

interface WorkspaceMigrateOptions {
  component?: string;
  path?: string;
  default?: boolean;
  dryRun?: boolean;
}

function renderWorkspaceList(snapshot: ReturnType<typeof Config.getWorkspace>) {
  if (!snapshot) {
    return `${pc.gray('当前目录及上级目录未找到 workspace 配置。')}\n`;
  }
  if (snapshot.mode === 'single') {
    return [
      `${pc.bold('workspace')}: ${pc.gray('single-project mode')}`,
      `root: ${pc.cyan(snapshot.rootDir)}`,
      `appName: ${pc.cyan(snapshot.project.appName || '-')}`
    ].join('\n') + '\n';
  }

  const lines = [
    `${pc.bold('workspace')}: ${pc.cyan(snapshot.rootDir)}`,
    `default: ${pc.cyan(snapshot.defaultComponent || '-')}`,
    `components: ${pc.cyan(String(snapshot.components.length))}`,
    ''
  ];
  for (const component of snapshot.components) {
    const badges = [
      component.matched ? 'current' : '',
      component.defaultComponent ? 'default' : ''
    ].filter(Boolean);
    lines.push(
      `- ${pc.cyan(component.name)}${badges.length > 0 ? ` ${pc.gray(`[${badges.join(', ')}]`)}` : ''}`
      + `  path=${pc.gray(component.path || '.')}`
      + `  type=${pc.gray(component.project.deployType || '-')}`
      + `  app=${pc.gray(component.project.appName || '-')}`
    );
  }
  return `${lines.join('\n')}\n`;
}

const workspaceListCommand = defineCliCommand({
  rawName: 'workspace list',
  description: '列出当前 repo / workspace 中可部署的 components',
  options: [
    { rawName: '--component <name>', description: '高亮或精确查看指定 component' }
  ],
  descriptor: {
    title: 'List workspace components',
    summary: '输出当前目录所在 workspace 的 components，以及当前 cwd 命中的 component。',
    examples: ['licell workspace list', 'licell workspace list --component web --output json'],
    result: {
      summary: '返回 workspace 根目录、当前模式与 components 列表。',
      fields: [
        { name: 'mode', description: '`single` 或 `workspace`；未找到配置时为 `null`。', required: true },
        { name: 'rootDir', description: 'workspace 或项目根目录。' },
        { name: 'componentName', description: '当前命中的 component 名称。' },
        { name: 'components[]', description: 'workspace 中声明的 components。', required: true }
      ]
    }
  }
});

const workspaceInitCommand = defineCliCommand({
  rawName: 'workspace init',
  description: '在 repo 根目录创建或更新 licell workspace component',
  options: [
    { rawName: '--component <name>', description: 'component 名称，例如 web / api' },
    { rawName: '--path <path>', description: 'component 相对根目录路径，例如 apps/web' },
    { rawName: '--type <type>', description: '部署类型：api、static 或 task' },
    { rawName: '--app <name>', description: 'component 对应的 appName' },
    { rawName: '--runtime <runtime>', description: 'API / task 使用的 runtime' },
    { rawName: '--entry <entry>', description: 'API / task 入口文件' },
    { rawName: '--dist <dist>', description: 'static 构建产物目录' },
    { rawName: '--domain <domain>', description: '固定完整域名' },
    { rawName: '--domain-suffix <suffix>', description: '固定域名后缀' },
    { rawName: '--target <target>', description: '默认 release target / alias' },
    { rawName: '--enable-cdn', description: '把 component 默认配置成启用 CDN' },
    { rawName: '--ssl', description: '把 component 默认配置成启用 HTTPS' },
    { rawName: '--enable-vpc', description: 'API / task 默认启用 VPC' },
    { rawName: '--disable-vpc', description: 'API / task 默认禁用 VPC' },
    { rawName: '--default', description: '把该 component 设为 workspace 默认 component' },
    { rawName: '--region <region>', description: 'component 默认 region（可选）' }
  ],
  descriptor: {
    title: 'Create or update a workspace component',
    summary: '在 repo 根目录把 `.licell/project.json` 切成 workspace 形态，并声明一个 deploy unit。',
    notes: [
      '该命令面向 monorepo / multi-dir 项目。',
      '如果当前目录已有单项目 `.licell/project.json`，会显式把它切到 workspace 形态，并同步默认 component 的兼容字段。'
    ],
    examples: [
      'licell workspace init --component web --path apps/web --type static --dist dist --domain www.example.com --default',
      'licell workspace init --component api --path apps/api --type api --runtime nodejs22 --entry src/index.ts --target prod'
    ]
  }
});

const workspaceDiscoverCommand = defineCliCommand({
  rawName: 'workspace discover',
  description: '扫描 repo，给出候选 components 与部署提案',
  descriptor: {
    title: 'Discover deployable workspace components',
    summary: '只读扫描当前 repo，输出 licell 视角的候选 component、部署类型、artifact/target/route 提案，以及建议向人确认的问题。',
    examples: [
      'licell workspace discover',
      'licell workspace discover --output json'
    ],
    result: {
      summary: '返回候选 component、建议配置和 questions[]。',
      fields: [
        { name: 'rootDir', description: '当前扫描根目录。', required: true },
        { name: 'components[]', description: '候选 component 提案。', required: true },
        { name: 'questions[]', description: '建议 Agent 向人确认的部署问题。', required: true }
      ]
    }
  }
});

const workspaceDoctorCommand = defineCliCommand({
  rawName: 'workspace doctor',
  description: '在 workspace / monorepo 根目录诊断全部或指定 component',
  options: [
    { rawName: '--component <name>', description: '只诊断指定 component；未传时默认扫描全部 components' },
    { rawName: '--runtime <runtime>', description: '覆盖 runtime 做 deploy 诊断（与 doctor 相同）' },
    { rawName: '--entry <entry>', description: '覆盖 deploy 入口路径（与 doctor 相同）' },
    { rawName: '--docker-daemon', description: 'runtime=docker 时附带检查本机 Docker daemon 是否可用' },
    { rawName: '--offline', description: '只做本地诊断，跳过云端只读探测' }
  ],
  descriptor: {
    title: 'Diagnose a workspace',
    summary: 'monorepo / multi-component 版 doctor：默认扫描整个 workspace，也可聚焦单个 component。',
    notes: [
      '这是 `licell doctor --all-components` 的 workspace 入口别名。',
      '传 `--component` 时，行为等价于 `licell doctor --component <name>`。'
    ],
    examples: [
      'licell workspace doctor',
      'licell workspace doctor --component api',
      'licell workspace doctor --offline --output json'
    ],
    result: {
      summary: '返回 workspace 根级共享检查与组件子报告；结构与 `licell doctor` 一致。',
      fields: [
        { name: 'healthy', description: '是否不存在阻塞项。', required: true },
        { name: 'components[]', description: 'workspace 中各 component 的 doctor 子报告。' }
      ]
    }
  }
});

const workspaceMigrateCommand = defineCliCommand({
  rawName: 'workspace migrate',
  description: '把旧单项目 `.licell/project.json` 升级成兼容旧版的 workspace/component 格式',
  options: [
    { rawName: '--component <name>', description: '迁移后的默认 component 名称，默认 web' },
    { rawName: '--path <path>', description: 'component 相对根目录路径，默认当前目录 `.`' },
    { rawName: '--default', description: '显式把该 component 设为 defaultComponent（默认启用）' },
    { rawName: '--dry-run', description: '只输出迁移摘要，不写回 `.licell/project.json`' }
  ],
  descriptor: {
    title: 'Migrate legacy project config to workspace format',
    summary: '把旧单项目配置升级成“根级兼容字段 + components[<name>]”的混合格式，便于新旧 licell 共存。',
    notes: [
      '该命令不会隐式在普通 doctor/deploy 时自动执行。',
      '迁移后会保留根级 appName/deployType/runtime 等字段，旧版 licell 仍可继续读取。'
    ],
    examples: [
      'licell workspace migrate',
      'licell workspace migrate --component web --path .',
      'licell workspace migrate --dry-run --output json',
      'licell workspace migrate --component api --path apps/api --output json'
    ],
    result: {
      summary: '返回迁移结果、默认 component 和兼容性状态。',
      fields: [
        { name: 'mode', description: '`migrated` 或 `already-workspace`。', required: true },
        { name: 'rootDir', description: '项目根目录。', required: true },
        { name: 'component', description: '默认 component 名称。', required: true },
        { name: 'path', description: 'component 相对路径。', required: true },
        { name: 'defaultComponent', description: '迁移后生效的 defaultComponent。', required: true },
        { name: 'backwardCompatible', description: '是否保留了旧版 licell 可读的根级字段。', required: true },
        { name: 'dryRun', description: '本次是否仅预览、不写文件。', required: true },
        { name: 'diffSummary', description: '迁移前后的结构化摘要。', required: true }
      ]
    }
  }
});

function buildWorkspaceMigrationDiffSummary(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  component: string,
  path: string
) {
  const beforeComponents = before.components && typeof before.components === 'object' && !Array.isArray(before.components)
    ? Object.keys(before.components as Record<string, unknown>)
    : [];
  const afterComponents = after.components && typeof after.components === 'object' && !Array.isArray(after.components)
    ? Object.keys(after.components as Record<string, unknown>)
    : [];
  return {
    before: {
      workspace: beforeComponents.length > 0,
      componentCount: beforeComponents.length,
      defaultComponent: typeof before.defaultComponent === 'string' ? before.defaultComponent : null
    },
    after: {
      workspace: afterComponents.length > 0,
      componentCount: afterComponents.length,
      defaultComponent: typeof after.defaultComponent === 'string' ? after.defaultComponent : null
    },
    addedTopLevelKeys: Object.keys(after).filter((key) => !(key in before)).sort(),
    createdComponent: component,
    componentPath: path,
    preservedRootKeys: Object.keys(before).filter((key) => key !== 'components' && key !== 'defaultComponent').sort()
  };
}

function renderWorkspaceMigrationSummary(result: {
  mode: 'migrated' | 'already-workspace';
  rootDir: string;
  component: string;
  path: string;
  defaultComponent: string;
  backwardCompatible: boolean;
  dryRun: boolean;
  diffSummary: ReturnType<typeof buildWorkspaceMigrationDiffSummary>;
}) {
  const lines = [
    `root:      ${pc.cyan(result.rootDir)}`,
    `mode:      ${pc.cyan(result.mode)}`,
    `component: ${pc.cyan(result.component)}`,
    `path:      ${pc.cyan(result.path)}`,
    `default:   ${pc.cyan(result.defaultComponent)}`,
    `dryRun:    ${pc.cyan(String(result.dryRun))}`,
    `compat:    ${pc.cyan(result.backwardCompatible ? 'backward-compatible' : 'no')}`,
    '',
    `before: workspace=${pc.gray(String(result.diffSummary.before.workspace))} components=${pc.gray(String(result.diffSummary.before.componentCount))} default=${pc.gray(result.diffSummary.before.defaultComponent || '-')}`,
    `after:  workspace=${pc.gray(String(result.diffSummary.after.workspace))} components=${pc.gray(String(result.diffSummary.after.componentCount))} default=${pc.gray(result.diffSummary.after.defaultComponent || '-')}`
  ];
  if (result.diffSummary.addedTopLevelKeys.length > 0) {
    lines.push(`added:     ${pc.cyan(result.diffSummary.addedTopLevelKeys.join(', '))}`);
  }
  return `${lines.join('\n')}\n`;
}

export function registerWorkspaceCommands(cli: CAC) {
  registerCliCommand(cli, workspaceListCommand)
    .action((options: WorkspaceListOptions) => {
      const component = options.component ? normalizeComponentName(options.component) : undefined;
      const snapshot = Config.getWorkspace({ component });
      if (isJsonOutput()) {
        emitCommandResult({
          mode: snapshot?.mode || null,
          rootDir: snapshot?.rootDir || null,
          componentName: snapshot?.componentName || null,
          defaultComponent: snapshot?.defaultComponent || null,
          components: snapshot?.components.map((item) => ({
            name: item.name,
            path: item.path || null,
            matched: item.matched,
            defaultComponent: item.defaultComponent,
            deployType: item.project.deployType || null,
            appName: item.project.appName || null
          })) || []
        }, { stage: 'workspace.list', inferOutcome: false });
        return;
      }

      process.stdout.write(renderWorkspaceList(snapshot));
    });

  registerCliCommand(cli, workspaceDiscoverCommand)
    .action((_options: WorkspaceDiscoverOptions) => {
      const result = discoverWorkspaceComponents(process.cwd());
      if (isJsonOutput()) {
        emitCommandResult(result, { stage: 'workspace.discover', inferOutcome: false });
        return;
      }

      showIntro(pc.bgBlue(pc.white(' Workspace Discover ')));
      console.log(`root: ${pc.cyan(result.rootDir)}`);
      if (result.components.length === 0) {
        console.log(pc.yellow('未发现明显的可部署 component；请显式提供 bootstrap 参数。'));
      } else {
        for (const component of result.components) {
          console.log(`- ${pc.cyan(component.component)} path=${pc.gray(component.path)} type=${pc.gray(component.type)} confidence=${pc.gray(component.confidence.toFixed(2))}`);
        }
      }
      if (result.questions.length > 0) {
        console.log('\n建议确认的问题:');
        for (const question of result.questions) {
          console.log(`- ${question.title}`);
        }
      }
      showOutro('Done.');
    });

  registerCliCommand(cli, workspaceInitCommand)
    .action((options: WorkspaceInitOptions) => {
      const componentName = normalizeComponentName(toOptionalString(options.component) || '');
      const rootDir = process.cwd();
      const existingSnapshot = Config.getWorkspace();
      if (existingSnapshot && existingSnapshot.rootDir !== rootDir) {
        throw new Error(`当前目录位于上级 workspace 中: ${existingSnapshot.rootDir}；请切到目标 repo 根目录后再执行 workspace init`);
      }

      const localWorkspace = readWorkspaceFile(rootDir) || { schemaVersion: 3, components: {} };
      if (options.enableVpc && options.disableVpc) {
        throw new Error('--enable-vpc 与 --disable-vpc 不能同时使用');
      }
      if (options.domain && options.domainSuffix) {
        throw new Error('--domain 与 --domain-suffix 不能同时使用');
      }

      const existingComponentRaw = localWorkspace.components[componentName] || {};
      const { path: existingPath, ...existingProjectRaw } = existingComponentRaw;
      const existingProject = normalizeProject(existingProjectRaw);
      const deployType = options.type
        ? normalizeDeployType(options.type)
        : existingProject.deployType
          ? normalizeDeployType(existingProject.deployType)
          : (options.dist ? 'static' : 'api');
      const componentPath = normalizeWorkspacePath(
        rootDir,
        toOptionalString(options.path) || (typeof existingPath === 'string' ? existingPath : undefined),
        componentName
      );
      const appName = toOptionalString(options.app) || existingProject.appName || deriveDefaultAppName(componentName, componentPath);

      const mergedProject = normalizeProject({
        ...existingProject,
        appName,
        deployType,
        runtime: deployType === 'static' ? undefined : (toOptionalString(options.runtime) || existingProject.runtime),
        entry: deployType === 'static' ? undefined : (toOptionalString(options.entry) || existingProject.entry),
        dist: deployType === 'static' ? (toOptionalString(options.dist) || existingProject.dist || 'dist') : undefined,
        domain: options.domain ? normalizeCustomDomain(options.domain) : (options.domainSuffix ? undefined : existingProject.domain),
        domainSuffix: options.domainSuffix
          ? normalizeDomainSuffix(options.domainSuffix)
          : (options.domain ? undefined : existingProject.domainSuffix),
        target: deployType === 'static'
          ? undefined
          : (options.target ? normalizeReleaseTarget(options.target) : existingProject.target),
        enableCdn: options.enableCdn ? true : existingProject.enableCdn,
        enableSSL: options.ssl ? true : existingProject.enableSSL,
        useVpc: deployType === 'static'
          ? undefined
          : options.disableVpc
            ? false
            : options.enableVpc
              ? true
              : existingProject.useVpc,
        region: options.region ? normalizeRegion(options.region) : existingProject.region,
        envs: existingProject.envs
      });

      const nextWorkspace = upsertWorkspaceComponent({
        rootDir,
        componentName,
        componentPath,
        project: mergedProject,
        defaultComponent: options.default
      });

      if (isJsonOutput()) {
        emitCommandResult({
          rootDir,
          component: componentName,
          path: componentPath,
          deployType,
          appName,
          defaultComponent: nextWorkspace.defaultComponent || null,
          componentCount: Object.keys(nextWorkspace.components).length
        }, { stage: 'workspace.init', inferOutcome: false });
        return;
      }

      showIntro(pc.bgBlue(pc.white(' Workspace ')));
      console.log(`root:      ${pc.cyan(rootDir)}`);
      console.log(`component: ${pc.cyan(componentName)}`);
      console.log(`path:      ${pc.cyan(componentPath)}`);
      console.log(`type:      ${pc.cyan(deployType)}`);
      console.log(`appName:   ${pc.cyan(appName)}`);
      if (nextWorkspace.defaultComponent) {
        console.log(`default:   ${pc.cyan(nextWorkspace.defaultComponent)}`);
      }
      showOutro('workspace component 已写入 .licell/project.json');
    });

  registerCliCommand(cli, workspaceDoctorCommand)
    .action(async (options: WorkspaceDoctorOptions) => {
      const component = options.component ? normalizeComponentName(options.component) : undefined;
      const report = await runLicellDoctor({
        ...(component ? { component } : { allComponents: true }),
        runtime: options.runtime,
        entry: options.entry,
        checkDockerDaemon: options.dockerDaemon,
        offline: options.offline
      });

      if (isJsonOutput()) {
        emitCommandResult(report, { stage: 'workspace.doctor', inferOutcome: false });
        return;
      }

      showIntro(pc.bgBlue(pc.white(' Workspace Doctor ')));
      process.stdout.write(`${renderLicellDoctorReport(report)}\n`);
      showOutro(
        report.healthy
          ? pc.green(`无阻塞项。warn=${report.warnCount} skip=${report.skipCount}`)
          : pc.red(`发现 ${report.errorCount} 个阻塞项。warn=${report.warnCount} skip=${report.skipCount}`)
      );
      if (!report.healthy) {
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, workspaceMigrateCommand)
    .action((options: WorkspaceMigrateOptions) => {
      const rootDir = process.cwd();
      const raw = readProjectFile(rootDir);
      if (!raw) {
        throw new Error('当前目录未检测到 `.licell/project.json`；请先执行 `licell init` 或准备旧项目配置。');
      }

      const componentName = normalizeComponentName(toOptionalString(options.component) || 'web');
      const componentPath = normalizeWorkspacePath(rootDir, toOptionalString(options.path) || '.', componentName);
      const dryRun = Boolean(options.dryRun);
      const existingSnapshot = Config.getWorkspace();

      if (existingSnapshot && existingSnapshot.rootDir !== rootDir) {
        throw new Error(`当前目录位于上级 workspace 中: ${existingSnapshot.rootDir}；请切到目标 repo 根目录后再执行 workspace migrate`);
      }

      if (raw.components && typeof raw.components === 'object' && !Array.isArray(raw.components)) {
        const snapshot = Config.getWorkspace({ component: componentName });
        const currentDefault = snapshot?.defaultComponent || componentName;
        const diffSummary = buildWorkspaceMigrationDiffSummary(raw, raw, snapshot?.componentName || componentName, snapshot?.componentPath || componentPath);
        if (isJsonOutput()) {
          emitCommandResult({
            mode: 'already-workspace',
            rootDir,
            component: snapshot?.componentName || componentName,
            path: snapshot?.componentPath || componentPath,
            defaultComponent: currentDefault,
            backwardCompatible: Boolean(snapshot?.project),
            dryRun,
            diffSummary
          }, { stage: 'workspace.migrate', inferOutcome: false });
          return;
        }
        showIntro(pc.bgBlue(pc.white(' Workspace Migrate ')));
        process.stdout.write(renderWorkspaceMigrationSummary({
          mode: 'already-workspace',
          rootDir,
          component: snapshot?.componentName || componentName,
          path: snapshot?.componentPath || componentPath,
          defaultComponent: currentDefault,
          backwardCompatible: Boolean(snapshot?.project),
          dryRun,
          diffSummary
        }));
        showOutro('当前项目已是 workspace 配置，无需重复迁移');
        return;
      }

      const legacyProject = normalizeProject(raw);
      const nextProject = {
        ...raw,
        schemaVersion: 3,
        defaultComponent: options.default === false ? (typeof raw.defaultComponent === 'string' ? raw.defaultComponent : componentName) : componentName,
        components: {
          [componentName]: {
            path: componentPath,
            ...legacyProject
          }
        }
      };
      const diffSummary = buildWorkspaceMigrationDiffSummary(raw, nextProject, componentName, componentPath);
      if (!dryRun) {
        writeWorkspaceFile(rootDir, nextProject as WorkspaceFileShape, Object.fromEntries(Object.entries(raw).filter(([key]) => key !== 'components' && key !== 'defaultComponent')));
      }

      if (isJsonOutput()) {
        emitCommandResult({
          mode: 'migrated',
          rootDir,
          component: componentName,
          path: componentPath,
          defaultComponent: componentName,
          backwardCompatible: true,
          dryRun,
          diffSummary
        }, { stage: 'workspace.migrate', inferOutcome: false });
        return;
      }

      showIntro(pc.bgBlue(pc.white(' Workspace Migrate ')));
      process.stdout.write(renderWorkspaceMigrationSummary({
        mode: 'migrated',
        rootDir,
        component: componentName,
        path: componentPath,
        defaultComponent: componentName,
        backwardCompatible: true,
        dryRun,
        diffSummary
      }));
      showOutro(dryRun ? 'dry-run 完成；未写入 `.licell/project.json`' : '已迁移为兼容旧版的 workspace/component 混合配置');
    });
}

export const workspaceCommandModule = defineCommandModule({
  section: SETUP_SECTION,
  register: registerWorkspaceCommands,
  namespaces: {
    workspace: {
      summary: 'monorepo / multi-component workspace 管理。',
      examples: ['licell workspace list', 'licell workspace discover', 'licell workspace init --component web --path apps/web --type static', 'licell workspace doctor', 'licell workspace migrate'],
      related: ['doctor']
    }
  },
  commands: [workspaceListCommand, workspaceDiscoverCommand, workspaceInitCommand, workspaceDoctorCommand, workspaceMigrateCommand]
});
