import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { emitCliError, emitCommandResult, isJsonOutput } from '../utils/output';
import { Config } from '../utils/config';
import { readLicellState } from '../utils/project-state';
import { normalizeComponentName } from '../utils/workspace-config';
import {
  GITHUB_WORKFLOW_DEFAULT_PATH,
  GITLAB_PIPELINE_DEFAULT_PATH,
  getDeployableComponents,
  renderGithubDeployWorkflow,
  renderGitlabDeployPipeline,
  REQUIRED_CI_SECRETS,
  writeGeneratedCiFile
} from '../utils/ci-scaffold';

interface CiInitOptions {
  apply?: boolean;
  force?: boolean;
  workflow?: string;
  pipeline?: string;
  deployOnly?: boolean;
  include?: string;
  exclude?: string;
}

type CiSelectionSource = 'bootstrap' | 'workspace' | 'explicit-filter';

function resolveWorkspaceSnapshot() {
  const snapshot = Config.getWorkspace();
  if (!snapshot) {
    throw new Error('当前目录未检测到 `.licell/project.json`；请先执行 licell bootstrap 或 workspace init。');
  }
  return snapshot;
}

function parseComponentList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeComponentName(item));
}

function resolveSelectedComponents(snapshot: ReturnType<typeof resolveWorkspaceSnapshot>, options: CiInitOptions) {
  const deployableComponents = getDeployableComponents(snapshot);
  const deployableNames = new Set(deployableComponents.map((component) => component.name));
  const include = new Set(parseComponentList(options.include));
  const exclude = new Set(parseComponentList(options.exclude));
  const hasExplicitFilter = include.size > 0 || exclude.size > 0;
  const bootstrapSelection = readLicellState(process.cwd()).bootstrap?.selectedComponents || [];
  const bootstrapMatched = bootstrapSelection.length > 0
    ? deployableComponents.filter((component) => bootstrapSelection.includes(component.name))
    : [];

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

  const baseSet = hasExplicitFilter
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
    throw new Error('筛选后没有可生成 CI 的 deploy components；请检查 --include / --exclude。');
  }

  const selectedNames = selected.map((component) => component.name);
  const skippedNames = deployableComponents
    .map((component) => component.name)
    .filter((name) => !selectedNames.includes(name));

  const selectionSource: CiSelectionSource = hasExplicitFilter
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

function buildCiPayload(input: {
  provider: 'github' | 'gitlab';
  path: string;
  content: string;
  apply: boolean;
  force: boolean;
  selectedComponents: string[];
  skippedComponents: string[];
  selectionSource: CiSelectionSource;
}) {
  let applied = false;
  let skipped = false;
  if (input.apply) {
    const result = writeGeneratedCiFile({ path: input.path, content: input.content }, input.force);
    applied = result.written;
    skipped = result.skipped;
  }
  return {
    provider: input.provider,
    path: input.path,
    applied,
    skipped,
    selectedComponents: input.selectedComponents,
    skippedComponents: input.skippedComponents,
    selectionSource: input.selectionSource,
    requiredSecrets: [...REQUIRED_CI_SECRETS],
    content: input.content
  };
}

const ciInitGithubCommand = defineCliCommand({
  rawName: 'ci init github',
  regionExclusion: 'local',
  description: '生成 GitHub Actions 的 deploy-only workflow（只调用 licell，不负责编译）',
  options: [
    { rawName: '--apply', description: `把 workflow 写入 \`${GITHUB_WORKFLOW_DEFAULT_PATH}\`` },
    { rawName: '--force', description: '覆盖已有 workflow 文件' },
    { rawName: '--workflow <path>', description: '自定义 workflow 文件路径' },
    { rawName: '--include <names>', description: '只为这些 component 生成 CI job（逗号分隔）' },
    { rawName: '--exclude <names>', description: '跳过这些 component，不生成对应 CI job（逗号分隔）' },
    { rawName: '--deploy-only', description: '显式声明生成 deploy-only workflow（当前默认行为）' }
  ],
  descriptor: {
    title: 'Init GitHub deploy workflow',
    summary: '按 project/workspace deploy config 生成 GitHub Actions workflow；workflow 只调用 licell deploy，不描述 build 过程。',
    notes: [
      '只会为当前 workspace 中声明了 deployType 的 components 生成 deploy jobs。',
      '默认会优先读取 `.licell/state.json` 里最近一次 batch bootstrap 记录的 selectedComponents；若不存在，再回退到当前 workspace 的全部 deployable components。',
      '传 `--include` / `--exclude` 时，会显式覆盖默认的 bootstrap selection。'
    ],
    examples: [
      'licell ci init github --apply',
      'licell ci init github --workflow .github/workflows/deploy.yml --apply --force',
      'licell ci init github --output json'
    ],
    optionInsights: {
      '--workflow': {
        whenToUse: '需要把生成的 GitHub Actions workflow 写到自定义路径时使用。',
        cautions: ['默认路径是 `.github/workflows/licell-deploy.yml`。']
      },
      '--include': {
        whenToUse: '只想为部分已初始化的 deploy components 生成 GitHub jobs 时使用。',
        cautions: ['值为逗号分隔 component 名；必须已经存在于当前 workspace config 且配置了 deployType。']
      },
      '--exclude': {
        whenToUse: '想保留大部分 deploy components，但跳过 docs/demo/admin 等组件时使用。',
        cautions: ['值为逗号分隔 component 名；会在生成前从 deployable component 集合中剔除。']
      },
      '--deploy-only': {
        whenToUse: '向 Agent 明确声明：生成物只覆盖 deploy 集成层，不负责 build/test pipeline 时使用。',
        cautions: ['当前就是默认行为；保留这个 flag 主要是为了让机器侧语义更明确。']
      }
    },
    recommendedFlow: [
      { title: '先初始化 deploy config', command: 'licell bootstrap --all-discovered --apply --output json', reason: '先确保 repo 里已经有 licell 可读的 deploy/workspace 配置。' },
      { title: '按需只生成部分 component 的 CI job', command: 'licell ci init github --include web,api --apply --output json', reason: '让 Agent 只为当前需要接入 CI 的 deploy units 生成 job。' },
      { title: '生成 GitHub deploy workflow', command: 'licell ci init github --apply --output json', reason: '只生成调用 licell 的 deploy 集成层，不混入 build 语义。' }
    ],
    result: {
      summary: '返回 workflow 预览、文件路径和所需 secrets。',
      fields: [
        { name: 'provider', description: '固定为 `github`。', required: true },
        { name: 'path', description: '目标 workflow 文件路径。', required: true },
        { name: 'selectionSource', description: '`bootstrap` / `workspace` / `explicit-filter`，表示本次组件选择来源。', required: true },
        { name: 'selectedComponents[]', description: '本次实际生成 job 的 component 列表。', required: true },
        { name: 'skippedComponents[]', description: '因为 include/exclude 被跳过的 component 列表。', required: true },
        { name: 'requiredSecrets[]', description: 'workflow 依赖的 secrets 列表。', required: true },
        { name: 'applied', description: '是否已写入文件。', required: true }
      ]
    }
  }
});

const ciInitGitlabCommand = defineCliCommand({
  rawName: 'ci init gitlab',
  regionExclusion: 'local',
  description: '生成 GitLab CI 的 deploy-only pipeline（只调用 licell，不负责编译）',
  options: [
    { rawName: '--apply', description: `把 pipeline 写入 \`${GITLAB_PIPELINE_DEFAULT_PATH}\`` },
    { rawName: '--force', description: '覆盖已有 pipeline 文件' },
    { rawName: '--pipeline <path>', description: '自定义 GitLab pipeline 文件路径' },
    { rawName: '--include <names>', description: '只为这些 component 生成 GitLab deploy job（逗号分隔）' },
    { rawName: '--exclude <names>', description: '跳过这些 component，不生成对应 GitLab deploy job（逗号分隔）' },
    { rawName: '--deploy-only', description: '显式声明生成 deploy-only pipeline（当前默认行为）' }
  ],
  descriptor: {
    title: 'Init GitLab deploy pipeline',
    summary: '按 project/workspace deploy config 生成 GitLab CI deploy-only pipeline；适合内部已有 `.gitlab-ci.yml` 主流程时，额外 include 一份 licell deploy 配置。',
    notes: [
      `默认生成独立文件 \`${GITLAB_PIPELINE_DEFAULT_PATH}\`，方便被现有主 \`.gitlab-ci.yml\` include。`,
      '只会为当前 workspace 中声明了 deployType 的 components 生成 deploy jobs。',
      '每个 deploy job 默认是 `manual`，并支持通过 GitLab CI/CD 变量 `COMPONENT` 只触发单个 component。',
      '`licell deploy --runtime docker` 依赖真实 Docker daemon；这不是纯 control-plane deploy。',
      '在 GitLab CI 中，优先挂载宿主机 Docker socket，而不是默认切到 Docker-in-Docker。',
      '如果必须使用嵌套 Docker / Docker-in-Docker，请确认 runner 已开启 `privileged = true`。',
      '默认会优先读取 `.licell/state.json` 里最近一次 batch bootstrap 记录的 selectedComponents；若不存在，再回退到当前 workspace 的全部 deployable components。',
      '传 `--include` / `--exclude` 时，会显式覆盖默认的 bootstrap selection。'
    ],
    examples: [
      'licell ci init gitlab --apply',
      'licell ci init gitlab --pipeline .gitlab/deploy/licell.yml --apply --force',
      'licell ci init gitlab --output json'
    ],
    optionInsights: {
      '--pipeline': {
        whenToUse: '需要把生成的 GitLab deploy pipeline 放到自定义 include 文件路径时使用。',
        cautions: [`默认路径是 \`${GITLAB_PIPELINE_DEFAULT_PATH}\`。`]
      },
      '--include': {
        whenToUse: '只想为部分已初始化的 deploy components 生成 GitLab deploy jobs 时使用。',
        cautions: ['值为逗号分隔 component 名；必须已经存在于当前 workspace config 且配置了 deployType。']
      },
      '--exclude': {
        whenToUse: '想保留大部分 deploy components，但跳过 docs/demo/admin 等组件时使用。',
        cautions: ['值为逗号分隔 component 名；会在生成前从 deployable component 集合中剔除。']
      },
      '--deploy-only': {
        whenToUse: '向 Agent 明确声明：生成物只覆盖 deploy 集成层，不负责 build/test pipeline 时使用。',
        cautions: ['当前就是默认行为；保留这个 flag 主要是为了让机器侧语义更明确。']
      }
    },
    recommendedFlow: [
      { title: '先初始化 deploy config', command: 'licell bootstrap --all-discovered --apply --output json', reason: '先确保 repo 里已经有 licell 可读的 deploy/workspace 配置。' },
      { title: '按需只生成部分 component 的 GitLab job', command: 'licell ci init gitlab --include web,api --apply --output json', reason: '让 Agent 只为当前需要接入 GitLab CI 的 deploy units 生成 job。' },
      { title: '生成 GitLab deploy pipeline', command: 'licell ci init gitlab --apply --output json', reason: '生成可 include 的 deploy-only pipeline 文件，方便接入已有 GitLab CI 主流程。' }
    ],
    result: {
      summary: '返回 GitLab pipeline 预览、文件路径和所需变量。',
      fields: [
        { name: 'provider', description: '固定为 `gitlab`。', required: true },
        { name: 'path', description: '目标 pipeline 文件路径。', required: true },
        { name: 'selectionSource', description: '`bootstrap` / `workspace` / `explicit-filter`，表示本次组件选择来源。', required: true },
        { name: 'selectedComponents[]', description: '本次实际生成 deploy job 的 component 列表。', required: true },
        { name: 'skippedComponents[]', description: '因为 include/exclude 被跳过的 component 列表。', required: true },
        { name: 'requiredSecrets[]', description: 'GitLab CI/CD 变量列表。', required: true },
        { name: 'applied', description: '是否已写入文件。', required: true }
      ]
    }
  }
});

export function registerCiCommands(cli: CAC) {
  registerCliCommand(cli, ciInitGithubCommand)
    .action((options: CiInitOptions) => {
      try {
        const snapshot = resolveWorkspaceSnapshot();
        const selection = resolveSelectedComponents(snapshot, options);
        const filePath = options.workflow || GITHUB_WORKFLOW_DEFAULT_PATH;
        const payload = buildCiPayload({
          provider: 'github',
          path: filePath,
          content: renderGithubDeployWorkflow(snapshot, selection.selected),
          apply: Boolean(options.apply),
          force: Boolean(options.force),
          selectedComponents: selection.selectedNames,
          skippedComponents: selection.skippedNames,
          selectionSource: selection.selectionSource
        });

        if (isJsonOutput()) {
          emitCommandResult(payload, { stage: 'ci.init.github', inferOutcome: false });
          return;
        }

        console.log(`provider: ${pc.cyan('github')}`);
        console.log(`path: ${pc.cyan(filePath)}`);
        console.log(`selection: ${pc.cyan(payload.selectionSource)}`);
        console.log(`selected: ${pc.cyan(payload.selectedComponents.join(', '))}`);
        if (payload.skippedComponents.length > 0) {
          console.log(`skipped: ${pc.gray(payload.skippedComponents.join(', '))}`);
        }
        console.log(`required secrets: ${pc.cyan(REQUIRED_CI_SECRETS.join(', '))}`);
        if (options.apply) {
          console.log(payload.applied ? pc.green('workflow 已写入') : pc.gray('workflow 内容未变化，已跳过'));
        } else {
          console.log(pc.gray('未写文件；追加 --apply 可落盘。'));
        }
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'ci.init.github' });
        } else {
          console.error(String(err instanceof Error ? err.message : err));
        }
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, ciInitGitlabCommand)
    .action((options: CiInitOptions) => {
      try {
        const snapshot = resolveWorkspaceSnapshot();
        const selection = resolveSelectedComponents(snapshot, options);
        const filePath = options.pipeline || GITLAB_PIPELINE_DEFAULT_PATH;
        const payload = buildCiPayload({
          provider: 'gitlab',
          path: filePath,
          content: renderGitlabDeployPipeline(snapshot, selection.selected),
          apply: Boolean(options.apply),
          force: Boolean(options.force),
          selectedComponents: selection.selectedNames,
          skippedComponents: selection.skippedNames,
          selectionSource: selection.selectionSource
        });

        if (isJsonOutput()) {
          emitCommandResult(payload, { stage: 'ci.init.gitlab', inferOutcome: false });
          return;
        }

        console.log(`provider: ${pc.cyan('gitlab')}`);
        console.log(`path: ${pc.cyan(filePath)}`);
        console.log(`selection: ${pc.cyan(payload.selectionSource)}`);
        console.log(`selected: ${pc.cyan(payload.selectedComponents.join(', '))}`);
        if (payload.skippedComponents.length > 0) {
          console.log(`skipped: ${pc.gray(payload.skippedComponents.join(', '))}`);
        }
        console.log(`required variables: ${pc.cyan(REQUIRED_CI_SECRETS.join(', '))}`);
        if (options.apply) {
          console.log(payload.applied ? pc.green('pipeline 已写入') : pc.gray('pipeline 内容未变化，已跳过'));
        } else {
          console.log(pc.gray('未写文件；追加 --apply 可落盘。'));
        }
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'ci.init.gitlab' });
        } else {
          console.error(String(err instanceof Error ? err.message : err));
        }
        process.exitCode = 1;
      }
    });
}

export const ciCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerCiCommands,
  namespaces: {
    ci: {
      summary: '生成调用 licell 的 CI 集成层。',
      examples: ['licell ci init github --apply', 'licell ci init gitlab --apply']
    }
  },
  commands: [ciInitGithubCommand, ciInitGitlabCommand]
});
