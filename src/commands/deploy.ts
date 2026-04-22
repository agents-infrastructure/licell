import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { resolve } from 'path';
import { Config } from '../utils/config';
import {
  DEFAULT_FC_RUNTIME,
  getFcApiDeploySpecDocument,
  getFcApiRuntimeDeploySpec,
  runFcApiDeployPrecheck
} from '../providers/fc';
import { formatErrorMessage } from '../utils/errors';
import { runHook } from '../utils/hooks';
import { buildDeployProjectPatch } from '../utils/deploy-config';
import { buildDeployStatePatch } from '../utils/deploy-state';
import { buildDeployPlan, getDeployPlanSnapshot } from '../utils/deploy-plan';
import { parseDeployRuntimeOption } from '../utils/deploy-runtime';
import { readLicellEnv } from '../utils/env';
import {
  ensureAuthReadyForCommand,
  tryRecoverAuthForError,
  detectAuthIssue,
  ensureAuthCapabilityPreflight,
  type AuthCapability
} from '../utils/auth-recovery';
import { createSpinner, isInteractiveTTY, showIntro, showOutro, tryNormalizeFcRuntime } from '../utils/cli-shared';
import { emitCliError, emitCliEvent, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { updateLicellComponentState } from '../utils/project-state';
import { resolveDeployContext, type DeployCliOptions } from './deploy-context';
import { executeApiDeploy } from './deploy-api';
import { executeStaticDeploy } from './deploy-static';
import { executeTaskDeploy } from './deploy-task';
import { DELIVERY_SECTION } from './sections';

export { resolveDeploySslEnabled } from './deploy-context';


const deploySpecCommand = defineCliCommand({
  rawName: 'deploy spec [runtime]',
  description: '查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照）',
  options: [
    { rawName: '--all', description: '输出全部 runtime 规格' }
  ],
  descriptor: {
    title: 'Get FC API deploy spec',
    examples: ['licell deploy spec', 'licell deploy spec nodejs22', 'licell deploy spec python3.13 --output json']
  }
});

const deployCheckCommand = defineCliCommand({
  rawName: 'deploy check',
  description: '本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行）',
  options: [
    { rawName: '--runtime <runtime>', description: 'FC runtime：nodejs20/nodejs22/python3.12/python3.13/docker' },
    { rawName: '--entry <entry>', description: '入口文件路径（默认按 runtime 推断）' },
    { rawName: '--docker-daemon', description: 'runtime=docker 时额外检测本机 Docker daemon 可用性' }
  ],
  descriptor: {
    title: 'Precheck FC API deploy readiness',
    examples: ['licell deploy check', 'licell deploy check --output json']
  }
});

const deployPlanCommand = defineCliCommand({
  rawName: 'deploy plan',
  description: '基于 `.licell/project.json` 生成部署计划（不执行云端变更）',
  options: [
    { rawName: '--component <name>', description: '只生成指定 component 的 deploy plan' },
    { rawName: '--include <names>', description: '只为这些 component 生成 deploy plan（逗号分隔）' },
    { rawName: '--exclude <names>', description: '跳过这些 component，不生成对应 deploy plan（逗号分隔）' }
  ],
  descriptor: {
    title: 'Plan deployment from persisted config',
    summary: '只读取 repo 中的 licell deploy config，输出 artifact -> 阿里云目标服务 -> 访问入口 的计划与风险提示。',
    notes: [
      '默认会优先读取 `.licell/state.json` 里最近一次 batch bootstrap 记录的 selectedComponents；若不存在，再回退到当前 workspace 的全部 deployable components。',
      '传 `--component` / `--include` / `--exclude` 时，会显式覆盖默认的 bootstrap selection。'
    ],
    examples: ['licell deploy plan', 'licell deploy plan --component web --output json', 'licell deploy plan --include web,api --output json'],
    optionInsights: {
      '--component': {
        whenToUse: '只想看某一个明确 component 的部署计划时使用。',
        cautions: ['component 必须已经存在于当前 workspace config 且配置了 deployType。']
      },
      '--include': {
        whenToUse: '只想为一部分已初始化的 deploy components 生成 plan 时使用。',
        cautions: ['值为逗号分隔 component 名；会覆盖默认 bootstrap selection。']
      },
      '--exclude': {
        whenToUse: '想保留大部分 deploy components，但跳过 docs/demo/admin 等组件时使用。',
        cautions: ['值为逗号分隔 component 名；会覆盖默认 bootstrap selection。']
      }
    },
    recommendedFlow: [
      { title: '先做 bootstrap', command: 'licell bootstrap --all-discovered --apply --output json', reason: '先让 licell 知道 repo 里哪些 component 是要部署的。' },
      { title: '读取默认 deploy plan', command: 'licell deploy plan --output json', reason: '默认优先复用最近一次 batch bootstrap 的 selectedComponents。' },
      { title: '只看某部分 component', command: 'licell deploy plan --include web,api --output json', reason: '对当前需要推进的 deploy units 单独评估。' }
    ],
    result: {
      summary: '返回每个 component 的部署计划、预期入口和 issues[]。',
      fields: [
        { name: 'rootDir', description: '项目根目录。', required: true },
        { name: 'selectionSource', description: '`bootstrap` / `workspace` / `explicit-filter`，表示本次组件选择来源。', required: true },
        { name: 'selectedComponents[]', description: '本次实际生成 plan 的 component 列表。', required: true },
        { name: 'skippedComponents[]', description: '因为 bootstrap selection 或 include/exclude 被跳过的 component 列表。', required: true },
        { name: 'components[]', description: '部署计划数组。', required: true }
      ]
    }
  }
});

const deployCommand = defineCliCommand({
  rawName: 'deploy',
  description: '一键极速打包部署',
  options: [
    { rawName: '--component <name>', description: '在 workspace / monorepo 根目录显式选择要部署的 component' },
    { rawName: '--type <type>', description: '部署类型：api、static 或 task（适配 CI 非交互场景）' },
    { rawName: '--entry <entry>', description: 'FC 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py）' },
    { rawName: '--dist <dist>', description: '静态站点目录（默认 dist）' },
    { rawName: '--runtime <runtime>', description: '运行时（FC: nodejs20/nodejs22/python3.12/python3.13/docker；静态站: static/statis）' },
    { rawName: '--target <target>', description: 'FC 函数部署后自动发布并切流到该 alias（如 prod/preview）' },
    { rawName: '--preview', description: '生成预览部署（自动发版 + 绑定预览域名，不影响生产）' },
    { rawName: '--domain <domain>', description: '绑定完整自定义域名（如 api.your-domain.xyz）' },
    { rawName: '--domain-suffix <suffix>', description: '自动绑定固定子域名后缀（如 your-domain.xyz）' },
    { rawName: '--enable-cdn', description: '域名绑定后自动接入 CDN 并将 DNS CNAME 切到 CDN（API 显式开启；Static 提供域名时默认开启）' },
    { rawName: '--cdn-refresh <mode>', description: 'Static + CDN 部署后的缓存刷新策略：off / entrypoints / all（默认 entrypoints）' },
    { rawName: '--ssl', description: '启用 HTTPS（API: --domain/--enable-cdn 默认开启；Static: 提供域名时默认开启）' },
    { rawName: '--ssl-force-renew', description: '启用 HTTPS 时强制续签证书（忽略到期阈值）' },
    { rawName: '--acr-namespace <ns>', description: 'Docker 部署时使用的 ACR 命名空间（默认 licell）' },
    { rawName: '--enable-vpc', description: 'API 部署时启用 VPC 接入（默认启用）' },
    { rawName: '--disable-vpc', description: 'API 部署时禁用 VPC 接入（使用公网模式）' },
    { rawName: '--memory <mb>', description: '函数内存大小（MB，默认 512）' },
    { rawName: '--vcpu <n>', description: '函数 vCPU 核数（如 0.5 / 1 / 2，默认 0.5）' },
    { rawName: '--instance-concurrency <n>', description: '单实例并发数（默认自动，通常起始 10）' },
    { rawName: '--timeout <seconds>', description: '函数超时时间（秒，默认 30）' }
  ],
  descriptor: {
    title: 'Deploy current project',
    summary: '一键部署 API / Static / Task，并提供 spec / check 辅助子命令。',
    notes: [
      'FC 函数部署前，建议先执行 `licell deploy spec` 与 `licell deploy check`。',
      '`--type task` 成功后不会返回固定访问 URL；结果里会给出 `functionName`、`configuredQualifiers[]` 与 `invokeCommand`，后续统一通过 `licell task invoke` 发起调用。',
      '当 `--type task --target <alias>` 一起使用时，licell 会在 alias 调用入口收敛后再写入 qualifier 级 async invoke config，保证发布后可以直接验证。',
      '当 `type=static` 且绑定固定域名走 CDN 时，deploy 默认使用 `--cdn-refresh entrypoints`，避免首页与入口清单文件被旧缓存命中。'
    ],
    safety: {
      level: 'mutating',
      reason: '会创建或更新函数、域名、SSL、CDN 等云端资源。'
    },
    optionInsights: {
      '--type': {
        whenToUse: '在 CI / Agent 非交互场景下显式指定 `api`、`static` 或 `task`；其中 `task` 适合 FC 异步任务执行，不暴露固定 URL。',
        cautions: ['不指定时可能依赖当前项目上下文或交互提示。', '`--type task` 的后续验证入口是 `licell task invoke` / `task info`，不是 `fn invoke`。']
      },
      '--component': {
        whenToUse: '在 repo 根目录统一操作多个 deploy unit 时，显式指定要命中的 workspace component。',
        cautions: ['component 名称必须已经存在于 workspace `.licell/project.json` 中。']
      },
      '--entry': { whenToUse: 'FC 入口不是默认的 `src/index.ts` / `src/main.py` 时使用。', cautions: ['建议先运行 `licell deploy check` 验证入口与 runtime 约束。'] },
      '--runtime': { whenToUse: '需要强制指定运行时，例如 `nodejs22`、`python3.13`、`docker`。', cautions: ['部分 runtime 有地域限制；先查看 `licell deploy spec`。'] },
      '--preview': { whenToUse: '需要生成预览版本且不影响生产流量时使用。', cautions: ['预览版本通常还需要后续 `licell release promote` 才会进入生产。'] },
      '--domain': { whenToUse: '希望直接绑定完整自定义域名时使用。', cautions: ['可能联动 SSL / CDN / DNS 变更。'] },
      '--domain-suffix': { whenToUse: '希望按固定后缀自动生成子域名时使用。', cautions: ['适合标准化环境，不适合完全自定义主机名。'] },
      '--enable-cdn': { whenToUse: '希望流量走 CDN、获得缓存/加速能力时使用。', cautions: ['会改写 DNS CNAME 指向 CDN。'] },
      '--cdn-refresh': {
        whenToUse: '静态站点绑定固定域名并走 CDN 时，希望 deploy 后自动处理缓存一致性。',
        cautions: ['当前仅适用于 static deploy；默认 `entrypoints` 只刷新 `/`、HTML 与 manifest / service worker 等入口文件。']
      },
      '--ssl': { whenToUse: '需要 HTTPS 证书自动签发与绑定时使用。', cautions: ['依赖域名解析正确；必要时结合 `--ssl-force-renew`。'] },
      '--target': {
        whenToUse: 'API 或任务函数部署后需要自动发布到指定 alias（如 `prod` / `preview`）时使用。',
        cautions: ['会影响 alias 指向的调用入口。', '对任务函数来说，`task invoke --target <alias>` 只会命中对应 qualifier 的 async invoke config。']
      }
    },
    recommendedFlow: [
      { title: '确认部署规格', command: 'licell deploy spec', reason: '先看可用 runtime、资源约束和推荐姿势。' },
      { title: '本地预检入口', command: 'licell deploy check', reason: '避免入口文件、runtime、打包形态不匹配。' },
      { title: '执行部署', command: 'licell deploy --output json', reason: '让 Agent 拿到结构化部署结果。' },
      { title: '必要时发布预览版本', command: 'licell release promote <versionId>', reason: '预览验证通过后再切到稳定 alias。' }
    ],
    taskHints: [
      {
        phase: 'inspect',
        title: '部署前先做预检',
        description: '先跑 spec 与 check，确认 runtime、入口和项目形态都匹配。',
        commands: ['licell deploy spec', 'licell deploy check']
      },
      {
        phase: 'mutate',
        title: '让 Agent 稳定拿到部署结果',
        description: '正式执行时优先输出 JSON，方便自动化继续读取版本、域名和资源状态。',
        commands: ['licell deploy --output json']
      },
      {
        phase: 'verify',
        title: '验证任务函数可立即调用',
        description: '当 `type=task` 时，先读取结果里的 `invokeCommand` / `configuredQualifiers[]`，再提交一次异步任务并跟踪状态。',
        commands: ['licell task invoke [name] --output json', 'licell task info <taskId> [name] --output json']
      }
    ],
    examples: [
      'licell deploy spec nodejs22',
      'licell deploy check',
      'licell deploy --type api --entry src/index.ts',
      'licell deploy --type static --dist dist --domain www.example.com --cdn-refresh entrypoints --output json',
      'licell deploy --type task --entry src/worker.ts',
      'licell deploy --type task --runtime nodejs22 --target preview --output json',
      'licell deploy --output json'
    ],
    agentTips: [
      '生成或修改部署前配置时，优先调用 `deploy spec` 与 `deploy check`。',
      '当结果 `type=task` 时，优先读取 `functionName`、`configuredQualifiers[]`、`invokeCommand`，不要期待 `url`。'
    ],
    related: ['task config', 'task invoke', 'task info', 'task list', 'release promote', 'logs'],
    result: {
      summary: '返回值会随部署类型变化：API / Static 关注 URL / 域名；Task 关注函数名、启用的 qualifier 和后续调用入口。',
      fields: [
        { name: 'type', description: '部署类型：`api`、`static` 或 `task`。', required: true },
        { name: 'runtime', description: '实际使用的 runtime。', required: true },
        { name: 'releaseTarget', description: '自动发布到的 alias；未指定时为 `null`。', required: true },
        { name: 'promotedVersion', description: '自动发布后的版本号；未发布时为 `null`。', required: true },
        { name: 'healthCheckLogs[]', description: '部署后补充校验/健康检查日志数组。', required: true },
        { name: 'hint', description: '文本提示；通常给未发布 alias 或 task workflow 的下一步建议。' },
        { name: 'url', description: '当 `type=api|static` 时的访问 URL。' },
        { name: 'fixedDomain', description: '绑定后的固定域名；未配置时为 `null`。' },
        { name: 'bucketName', description: '当 `type=static` 时，实际写入的 OSS Bucket 名称。' },
        { name: 'cdnCname', description: '当启用 CDN 且已分配时，返回对应的 CDN CNAME。' },
        { name: 'cdnRefreshMode', description: '当 `type=static` 时，部署后使用的 CDN 刷新策略：`off` / `entrypoints` / `all`。' },
        { name: 'cdnRefreshTaskIds[]', description: '当 `type=static` 且触发 CDN 刷新时，返回提交到 CDN 的刷新任务 ID 列表。' },
        { name: 'functionName', description: '当 `type=task` 时返回的函数名。' },
        { name: 'asyncTaskEnabled', description: '当 `type=task` 时，异步任务能力是否已启用。' },
        { name: 'configuredQualifiers[]', description: '当 `type=task` 时，已经写入 async invoke config 的 qualifier 列表。' },
        { name: 'invokeCommand', description: '当 `type=task` 时，推荐直接复制执行的任务调用命令。' }
      ]
    }
  }
});

interface DeploySpecOptions {
  all?: boolean;
}

interface DeployCheckOptions {
  runtime?: string;
  entry?: string;
  dockerDaemon?: boolean;
}

function resolveDeployRequiredCapabilities(ctx: {
  type: 'api' | 'static' | 'task';
  cliRuntime?: string;
  projectRuntime?: string;
  envRuntime?: string;
  useVpc: boolean;
  cliDomain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
}): AuthCapability[] {
  const capabilities: AuthCapability[] = [];
  if (ctx.type === 'api' || ctx.type === 'task') {
    capabilities.push('fc');
    const runtime = (ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || '').trim().toLowerCase();
    if (runtime === 'docker') capabilities.push('cr');
    if (ctx.useVpc) capabilities.push('vpc');
  } else {
    capabilities.push('oss');
  }
  if (ctx.cliDomain || ctx.domainSuffix) capabilities.push('dns');
  if (ctx.enableCdn) capabilities.push('cdn');
  return [...new Set(capabilities)];
}

function resolveApiRuntimeForSpec(input: string | undefined) {
  if (input && input.trim()) {
    const parsed = parseDeployRuntimeOption(input);
    if (parsed.deployTypeHint === 'static') {
      throw new Error('deploy spec/check 仅适用于 FC API runtime（不要传 static/statis）');
    }
    if (parsed.runtime) return parsed.runtime;
    throw new Error(`无法解析 runtime: ${input}`);
  }
  const projectRuntime = tryNormalizeFcRuntime(Config.getProject().runtime);
  const envRuntime = tryNormalizeFcRuntime(readLicellEnv(process.env, 'FC_RUNTIME'));
  return projectRuntime || envRuntime || DEFAULT_FC_RUNTIME;
}

function printDeploySpec(runtimeInput: string | undefined, includeAll: boolean | undefined) {
  if (isJsonOutput()) {
    const payload = includeAll || !runtimeInput
      ? getFcApiDeploySpecDocument()
      : { runtime: getFcApiRuntimeDeploySpec(resolveApiRuntimeForSpec(runtimeInput)) };
    emitCommandResult(payload);
    return;
  }

  if (includeAll || !runtimeInput) {
    const doc = getFcApiDeploySpecDocument();
    console.log(`${pc.bold('FC API Deploy Spec')}`);
    console.log(`runtime: ${doc.runtimes.map((item) => item.runtime).join(', ')}`);
    console.log(
      `defaults: memory=${doc.resources.defaults.memoryMb}MB, vcpu=${doc.resources.defaults.vcpu}, ` +
      `timeout=${doc.resources.defaults.timeoutSeconds}s, instanceConcurrency=${doc.resources.defaults.instanceConcurrency}`
    );
    console.log(`constraint: ${doc.resources.constraints.memoryToVcpuRatio.expression}`);
    for (const item of doc.runtimes) {
      console.log(`\n- runtime=${pc.cyan(item.runtime)} (${item.mode})`);
      console.log(`  entry: ${item.defaultEntry || '(按 Dockerfile/项目自动推断)'}`);
      console.log(`  entryRule: ${item.entryRule}`);
      console.log(`  handlerRule: ${item.handlerRule}`);
      if (item.handlerContract.signature) {
        console.log(`  signature: ${item.handlerContract.signature}`);
      }
      console.log(`  acceptedResponse: ${item.responseSchema.acceptedForms.join(' | ')}`);
      console.log(`  example(pass): ${item.examples.minimalPassExample}`);
      console.log(`  example(fail): ${item.examples.commonFailExample}`);
      for (const note of item.notes) {
        console.log(`  note: ${note}`);
      }
    }
    return;
  }

  const runtime = resolveApiRuntimeForSpec(runtimeInput);
  const item = getFcApiRuntimeDeploySpec(runtime);
  const doc = getFcApiDeploySpecDocument();
  console.log(`${pc.bold('FC API Deploy Spec')}`);
  console.log(`runtime: ${pc.cyan(item.runtime)} (${item.mode})`);
  console.log(`entry: ${item.defaultEntry || '(按 Dockerfile/项目自动推断)'}`);
  console.log(`entryRule: ${item.entryRule}`);
  console.log(`handlerRule: ${item.handlerRule}`);
  if (item.handlerContract.signature) {
    console.log(`signature: ${item.handlerContract.signature}`);
  }
  console.log(`acceptedResponse: ${item.responseSchema.acceptedForms.join(' | ')}`);
  console.log(`example(pass): ${item.examples.minimalPassExample}`);
  console.log(`example(fail): ${item.examples.commonFailExample}`);
  for (const note of item.notes) {
    console.log(`note: ${note}`);
  }
  console.log(
    `resources: default memory=${doc.resources.defaults.memoryMb}MB, ` +
    `vcpu=${doc.resources.defaults.vcpu}, timeout=${doc.resources.defaults.timeoutSeconds}s`
  );
  console.log(`constraints: ${doc.resources.constraints.memoryToVcpuRatio.expression}`);
}

function runDeployCheck(options: DeployCheckOptions) {
  const runtime = resolveApiRuntimeForSpec(options.runtime);
  const runtimeSpec = getFcApiRuntimeDeploySpec(runtime);
  const entry = options.entry?.trim() || runtimeSpec.defaultEntry || undefined;
  const workspaceSnapshot = Config.getWorkspace();
  const projectRoot = workspaceSnapshot?.mode === 'workspace' && workspaceSnapshot.componentPath
    ? resolve(workspaceSnapshot.rootDir, workspaceSnapshot.componentPath)
    : process.cwd();
  const result = runFcApiDeployPrecheck({
    runtime,
    entry,
    projectRoot,
    checkDockerDaemon: Boolean(options.dockerDaemon)
  });

  if (isJsonOutput()) {
    emitCommandResult(result);
  } else {
    console.log(`${pc.bold('FC API Deploy Precheck')}`);
    console.log(`runtime: ${pc.cyan(result.runtime)}`);
    console.log(`entry:   ${result.entry || '-'}`);
    if (result.issues.length === 0) {
      console.log(pc.green('\n✅ 预检通过'));
    } else {
      for (const issue of result.issues) {
        const icon = issue.level === 'error' ? pc.red('✖') : pc.yellow('⚠');
        console.log(`\n${icon} [${issue.level}] ${issue.id}`);
        console.log(issue.message);
        if (issue.remediation && issue.remediation.length > 0) {
          for (const tip of issue.remediation) {
            console.log(`  - ${tip}`);
          }
        }
      }
      if (result.ok) {
        console.log(pc.yellow('\n⚠️ 预检通过（存在 warning）'));
      } else {
        console.log(pc.red('\n❌ 预检失败（存在 error）'));
      }
    }
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

function resolveDeployWorkingDirectory(component?: string) {
  const snapshot = Config.getWorkspace({ component });
  if (snapshot?.mode === 'workspace' && snapshot.componentPath) {
    return resolve(snapshot.rootDir, snapshot.componentPath);
  }
  return process.cwd();
}

async function withProcessCwd<T>(cwd: string, task: () => Promise<T>): Promise<T> {
  const previous = process.cwd();
  if (resolve(previous) === resolve(cwd)) {
    return await task();
  }
  process.chdir(cwd);
  try {
    return await task();
  } finally {
    process.chdir(previous);
  }
}

export function registerDeployCommand(cli: CAC) {
  registerCliCommand(cli, deploySpecCommand)
    .action((runtime: string | undefined, options: DeploySpecOptions) => {
      try {
        printDeploySpec(runtime, options.all);
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'deploy.spec' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, deployCheckCommand)
    .action((options: DeployCheckOptions) => {
      try {
        runDeployCheck(options);
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'deploy.check' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, deployPlanCommand)
    .action((options: { component?: string; include?: string; exclude?: string }) => {
      try {
        const snapshot = getDeployPlanSnapshot(options.component);
        const plan = buildDeployPlan(snapshot, options);
        if (isJsonOutput()) {
          emitCommandResult(plan, { stage: 'deploy.plan', inferOutcome: false });
          return;
        }
        showIntro(pc.bgBlue(pc.white(' Deploy Plan ')));
        console.log(`root: ${pc.cyan(plan.rootDir)}`);
        console.log(`selection: ${pc.cyan(plan.selectionSource)}`);
        console.log(`selected: ${pc.cyan(plan.selectedComponents.join(', '))}`);
        if (plan.skippedComponents.length > 0) {
          console.log(`skipped: ${pc.gray(plan.skippedComponents.join(', '))}`);
        }
        for (const component of plan.components) {
          console.log(`- ${pc.cyan(component.component)} type=${pc.gray(component.deployType || '?')} command=${pc.gray(component.command)}`);
          if (component.expectedUrl) {
            console.log(`  url=${pc.gray(component.expectedUrl)}`);
          }
          for (const issue of component.issues) {
            console.log(`  ${issue.level === 'warn' ? pc.yellow('warn') : pc.gray('info')}: ${issue.message}`);
          }
        }
        showOutro('Done.');
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'deploy.plan' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });

  registerCliCommand(cli, deployCommand)
    .action(async (options: DeployCliOptions) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ▲ Deploying to Aliyun ')));
      } else {
        emitCommandEvent({ command: 'deploy', status: 'start' });
      }
      const s = createSpinner();
      const interactiveTTY = isInteractiveTTY();
      try {
        await ensureAuthReadyForCommand({ commandLabel: commandInvocation(deployCommand), interactiveTTY });

        let recoveredAuth = false;
        while (true) {
          const ctx = await resolveDeployContext(options);
          const resolvedAuth = Config.getAuth();
          const authFingerprint = resolvedAuth
            ? `${resolvedAuth.accountId}|${resolvedAuth.region}|${resolvedAuth.ak}`
            : '';
          await ensureAuthCapabilityPreflight({
            commandLabel: commandInvocation(deployCommand),
            interactiveTTY,
            requiredCapabilities: resolveDeployRequiredCapabilities(ctx)
          });
          const currentAuth = Config.getAuth();
          const currentFingerprint = currentAuth
            ? `${currentAuth.accountId}|${currentAuth.region}|${currentAuth.ak}`
            : '';
          if (authFingerprint && currentFingerprint !== authFingerprint) {
            // auth preflight may rotate/update credentials; reload deploy context with latest auth.
            continue;
          }
          try {
            emitCommandEvent({
              stage: 'deploy.preflight',
              action: 'resolve-context',
              status: 'info',
              data: {
                type: ctx.type,
                component: ctx.component || null,
                runtime: ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || null,
                releaseTarget: ctx.releaseTarget || null,
                enableCdn: ctx.enableCdn,
                enableSSL: ctx.enableSSL
              }
            });
            await withProcessCwd(resolveDeployWorkingDirectory(ctx.component), async () => {
              if (ctx.project.hooks?.preDeploy) {
                s.start('执行 preDeploy hook...');
                runHook('preDeploy', ctx.project.hooks.preDeploy);
                s.stop(pc.green('✅ preDeploy hook 完成'));
              }

              let url: string | undefined;
              let functionName: string | undefined;
              let promotedVersion: string | undefined;
              let fixedDomain: string | undefined;
              let previewDomain: string | undefined;
              let previewVersion: string | undefined;
              let bucketName: string | undefined;
              let functionResourceName: string | undefined;
              let cdnCname: string | undefined;
              let cdnRefreshTaskIds: string[] = [];
              let healthCheckLogs: string[] = [];
              let asyncTaskEnabled: boolean | undefined;
              let configuredQualifiers: string[] | undefined;
              let invokeCommand: string | undefined;
              let usedRuntime: string | undefined;
              let usedEntry: string | undefined;
              let usedDist: string | undefined;

              if (ctx.type === 'api') {
                emitCommandEvent({ stage: 'deploy.api', action: 'execute', status: 'start' });
                const result = await executeApiDeploy(ctx, s);
                if (!result) return;
                emitCommandEvent({ stage: 'deploy.api', action: 'execute', status: 'ok' });
                ({
                  url,
                  runtime: usedRuntime,
                  entry: usedEntry,
                  functionName: functionResourceName,
                  cdnCname,
                  promotedVersion,
                  fixedDomain,
                  previewDomain,
                  previewVersion,
                  healthCheckLogs
                } = result);
              } else if (ctx.type === 'static') {
                emitCommandEvent({ stage: 'deploy.static', action: 'execute', status: 'start' });
                const result = await executeStaticDeploy(ctx, s);
                if (!result) return;
                emitCommandEvent({ stage: 'deploy.static', action: 'execute', status: 'ok' });
                ({
                  url,
                  dist: usedDist,
                  bucketName,
                  cdnCname,
                  cdnRefreshTaskIds,
                  fixedDomain,
                  previewDomain,
                  previewVersion,
                  healthCheckLogs
                } = result);
              } else {
                emitCommandEvent({ stage: 'deploy.task', action: 'execute', status: 'start' });
                const result = await executeTaskDeploy(ctx, s);
                if (!result) return;
                emitCommandEvent({ stage: 'deploy.task', action: 'execute', status: 'ok' });
                ({
                  functionName,
                  runtime: usedRuntime,
                  entry: usedEntry,
                  promotedVersion,
                  healthCheckLogs,
                  asyncTask: asyncTaskEnabled,
                  configuredQualifiers,
                  invokeCommand
                } = result);
                functionResourceName = result.functionName;
              }

              s.stop(pc.green('✅ 部署成功!'));
              if (ctx.type === 'task') {
                console.log(`\n🧩 Task Function: ${pc.cyan(functionName || ctx.appName)}\n`);
                if (ctx.releaseTarget && promotedVersion) {
                  console.log(`🏷️  alias=${pc.cyan(ctx.releaseTarget)} -> version=${pc.cyan(promotedVersion)}\n`);
                }
                if (invokeCommand) {
                  console.log(pc.gray(`💡 调用任务：${pc.bold(invokeCommand)}\n`));
                }
              } else if (url) {
                console.log(`\n🎉 Production URL: ${pc.cyan(pc.underline(url))}\n`);
              }
              if (previewDomain) {
                const previewDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${previewDomain}`;
                console.log(`🔍 Preview URL: ${pc.cyan(pc.underline(previewDomainUrl))}`);
                console.log(`🏷️  version=${pc.cyan(previewVersion || 'unknown')}\n`);
                console.log(pc.gray(`💡 验证后运行 ${pc.bold(`licell release promote ${previewVersion}`)} 发布到生产。\n`));
              }
              if (fixedDomain) {
                const fixedDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${fixedDomain}`;
                console.log(`🌐 Fixed Domain: ${pc.cyan(pc.underline(fixedDomainUrl))}\n`);
              }
              if (ctx.releaseTarget && promotedVersion) {
                console.log(`🏷️  alias=${pc.cyan(ctx.releaseTarget)} -> version=${pc.cyan(promotedVersion)}\n`);
              }
              if (!ctx.releaseTarget && !ctx.preview && ctx.type === 'api' && !isJsonOutput()) {
                console.log(pc.gray(`💡 代码已更新到预览环境。运行 ${pc.bold('licell release promote')} 发布到生产。\n`));
              }
              if (!ctx.releaseTarget && ctx.type === 'task' && !isJsonOutput()) {
                console.log(pc.gray(`💡 代码已更新到 ${pc.bold('LATEST')}。如需稳定入口，可运行 ${pc.bold('licell release promote')} 发布 alias。\n`));
              }
              if (healthCheckLogs.length > 0) {
                console.log(`${healthCheckLogs.join('\n')}\n`);
              }
              const projectPatch = buildDeployProjectPatch({
                deploySucceeded: true,
                deployType: ctx.type,
                appName: ctx.appName,
                runtime: usedRuntime,
                entry: usedEntry,
                dist: usedDist,
                domain: ctx.cliDomain || ctx.projectDomain,
                domainSuffix: ctx.cliDomain || ctx.projectDomain ? undefined : ctx.domainSuffix,
                target: ctx.releaseTarget,
                enableCdn: ctx.type === 'task' ? undefined : ctx.enableCdn,
                enableSSL: ctx.type === 'task' ? undefined : ctx.enableSSL,
                cdnRefresh: ctx.type === 'static' ? ctx.cdnRefreshMode : undefined,
                useVpc: ctx.type === 'static' ? undefined : ctx.useVpc,
                acrNamespace: ctx.cliAcrNamespace || ctx.project.acrNamespace,
                region: ctx.project.region || ctx.auth.region,
                bucketName,
                functionName: functionResourceName || functionName
              });
              if (Object.keys(projectPatch).length > 0) {
                Config.setProject(projectPatch, { component: ctx.component });
              }
              updateLicellComponentState(buildDeployStatePatch({
                cwd: process.cwd(),
                deployType: ctx.type,
                region: ctx.project.region || ctx.auth.region,
                appName: ctx.appName,
                bucketName,
                functionName: functionResourceName || functionName || ctx.appName,
                releaseTarget: ctx.releaseTarget,
                promotedVersion,
                url: fixedDomain ? `${ctx.enableSSL ? 'https' : 'http'}://${fixedDomain}` : url,
                fixedDomain,
                enableSSL: ctx.type === 'task' ? undefined : ctx.enableSSL,
                enableCdn: ctx.type === 'task' ? undefined : ctx.enableCdn,
                cdnCname
              }), { cwd: process.cwd(), component: ctx.component });
              if (ctx.project.hooks?.postDeploy) {
                try {
                  runHook('postDeploy', ctx.project.hooks.postDeploy);
                } catch (err: unknown) {
                  console.warn(pc.yellow(`⚠️ postDeploy hook 执行失败，已忽略: ${formatErrorMessage(err)}`));
                }
              }
              if (isJsonOutput()) {
                if (ctx.type === 'task') {
                  emitCommandResult({
                    type: ctx.type,
                    component: ctx.component || null,
                    runtime: usedRuntime || null,
                    functionName: functionName || ctx.appName,
                    releaseTarget: ctx.releaseTarget || null,
                    promotedVersion: promotedVersion || null,
                    asyncTaskEnabled: asyncTaskEnabled ?? true,
                    configuredQualifiers: configuredQualifiers || [],
                    invokeCommand: invokeCommand || null,
                    healthCheckLogs,
                    ...(!ctx.releaseTarget ? { hint: '运行 licell release promote 发布 alias；运行 licell task invoke 调用任务' } : {})
                  });
                } else {
                  emitCommandResult({
                    type: ctx.type,
                    component: ctx.component || null,
                    runtime: ctx.type === 'static' ? 'static' : (usedRuntime || null),
                    url,
                    fixedDomain: fixedDomain || null,
                    ...(ctx.type === 'static' ? { bucketName: bucketName || null } : {}),
                    ...(cdnCname !== undefined ? { cdnCname } : {}),
                    ...(ctx.type === 'static'
                      ? {
                        cdnRefreshMode: ctx.cdnRefreshMode,
                        cdnRefreshTaskIds
                      }
                      : {}),
                    releaseTarget: ctx.releaseTarget || null,
                    promotedVersion: promotedVersion || null,
                    healthCheckLogs,
                    ...(!ctx.releaseTarget && ctx.type === 'api' ? { hint: '运行 licell release promote 发布到生产' } : {})
                  });
                }
              } else {
                showOutro('Done!');
              }
            });
            return;
          } catch (err: unknown) {
            if (!recoveredAuth && detectAuthIssue(err) !== 'unknown') {
              s.stop(pc.yellow('⚠️ 检测到鉴权/权限问题，正在尝试自动修复并重试...'));
              const repaired = await tryRecoverAuthForError(err, {
                commandLabel: commandInvocation(deployCommand),
                interactiveTTY
              });
              if (repaired) {
                recoveredAuth = true;
                continue;
              }
            }
            throw err;
          }
        }
      } catch (err: unknown) {
        s.stop(pc.red('❌ 部署失败'));
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'deploy' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });
}

export const deployCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerDeployCommand,
  commands: [deployCommand, deploySpecCommand, deployCheckCommand, deployPlanCommand]
});
