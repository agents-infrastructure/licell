import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
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
import { resolveDeployContext, type DeployCliOptions } from './deploy-context';
import { executeApiDeploy } from './deploy-api';
import { executeStaticDeploy } from './deploy-static';
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

const deployCommand = defineCliCommand({
  rawName: 'deploy',
  description: '一键极速打包部署',
  options: [
    { rawName: '--type <type>', description: '部署类型：api 或 static（适配 CI 非交互场景）' },
    { rawName: '--entry <entry>', description: 'API 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py）' },
    { rawName: '--dist <dist>', description: '静态站点目录（默认 dist）' },
    { rawName: '--runtime <runtime>', description: '运行时（API: nodejs20/nodejs22/python3.12/python3.13/docker；静态站: static/statis）' },
    { rawName: '--target <target>', description: 'API 部署后自动发布并切流到该 alias（如 prod/preview）' },
    { rawName: '--preview', description: '生成预览部署（自动发版 + 绑定预览域名，不影响生产）' },
    { rawName: '--domain <domain>', description: '绑定完整自定义域名（如 api.your-domain.xyz）' },
    { rawName: '--domain-suffix <suffix>', description: '自动绑定固定子域名后缀（如 your-domain.xyz）' },
    { rawName: '--enable-cdn', description: '域名绑定后自动接入 CDN 并将 DNS CNAME 切到 CDN（API 显式开启；Static 提供域名时默认开启）' },
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
    summary: '一键部署 API / Static，并提供 spec / check 辅助子命令。',
    notes: ['FC API 部署前，建议先执行 `licell deploy spec` 与 `licell deploy check`。'],
    safety: {
      level: 'mutating',
      reason: '会创建或更新函数、域名、SSL、CDN 等云端资源。'
    },
    optionInsights: {
      '--type': { whenToUse: '在 CI / Agent 非交互场景下显式指定 `api` 或 `static`。', cautions: ['不指定时可能依赖当前项目上下文或交互提示。'] },
      '--entry': { whenToUse: 'API 入口不是默认的 `src/index.ts` / `src/main.py` 时使用。', cautions: ['建议先运行 `licell deploy check` 验证入口与 runtime 约束。'] },
      '--runtime': { whenToUse: '需要强制指定运行时，例如 `nodejs22`、`python3.13`、`docker`。', cautions: ['部分 runtime 有地域限制；先查看 `licell deploy spec`。'] },
      '--preview': { whenToUse: '需要生成预览版本且不影响生产流量时使用。', cautions: ['预览版本通常还需要后续 `licell release promote` 才会进入生产。'] },
      '--domain': { whenToUse: '希望直接绑定完整自定义域名时使用。', cautions: ['可能联动 SSL / CDN / DNS 变更。'] },
      '--domain-suffix': { whenToUse: '希望按固定后缀自动生成子域名时使用。', cautions: ['适合标准化环境，不适合完全自定义主机名。'] },
      '--enable-cdn': { whenToUse: '希望流量走 CDN、获得缓存/加速能力时使用。', cautions: ['会改写 DNS CNAME 指向 CDN。'] },
      '--ssl': { whenToUse: '需要 HTTPS 证书自动签发与绑定时使用。', cautions: ['依赖域名解析正确；必要时结合 `--ssl-force-renew`。'] },
      '--target': { whenToUse: 'API 部署后需要自动发布到指定 alias（如 `prod` / `preview`）时使用。', cautions: ['会影响 alias 指向的流量入口。'] }
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
      }
    ],
    examples: [
      'licell deploy spec nodejs22',
      'licell deploy check',
      'licell deploy --type api --entry src/index.ts',
      'licell deploy --output json'
    ],
    agentTips: ['生成或修改部署前配置时，优先调用 `deploy spec` 与 `deploy check`。'],
    related: ['release promote', 'logs']
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
  type: 'api' | 'static';
  cliRuntime?: string;
  projectRuntime?: string;
  envRuntime?: string;
  useVpc: boolean;
  cliDomain?: string;
  domainSuffix?: string;
  enableCdn: boolean;
}): AuthCapability[] {
  const capabilities: AuthCapability[] = [];
  if (ctx.type === 'api') {
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
  const result = runFcApiDeployPrecheck({
    runtime,
    entry,
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
                runtime: ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || null,
                releaseTarget: ctx.releaseTarget || null,
                enableCdn: ctx.enableCdn,
                enableSSL: ctx.enableSSL
              }
            });
            if (ctx.project.hooks?.preDeploy) {
              s.start('执行 preDeploy hook...');
              runHook('preDeploy', ctx.project.hooks.preDeploy);
              s.stop(pc.green('✅ preDeploy hook 完成'));
            }

            let url: string;
            let promotedVersion: string | undefined;
            let fixedDomain: string | undefined;
            let previewDomain: string | undefined;
            let previewVersion: string | undefined;
            let healthCheckLogs: string[] = [];

            if (ctx.type === 'api') {
              emitCommandEvent({ stage: 'deploy.api', action: 'execute', status: 'start' });
              const result = await executeApiDeploy(ctx, s);
              if (!result) return;
              emitCommandEvent({ stage: 'deploy.api', action: 'execute', status: 'ok' });
              ({ url, promotedVersion, fixedDomain, previewDomain, previewVersion, healthCheckLogs } = result);
            } else {
              emitCommandEvent({ stage: 'deploy.static', action: 'execute', status: 'start' });
              const result = await executeStaticDeploy(ctx, s);
              if (!result) return;
              emitCommandEvent({ stage: 'deploy.static', action: 'execute', status: 'ok' });
              ({ url, fixedDomain, previewDomain, previewVersion, healthCheckLogs } = result);
            }

            s.stop(pc.green('✅ 部署成功!'));
            console.log(`\n🎉 Production URL: ${pc.cyan(pc.underline(url))}\n`);
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
            if (healthCheckLogs.length > 0) {
              console.log(`${healthCheckLogs.join('\n')}\n`);
            }
            const projectPatch = buildDeployProjectPatch({
              deploySucceeded: true,
              cliDomainSuffix: ctx.cliDomainSuffix,
              projectDomainSuffix: ctx.projectDomainSuffix,
              cliRuntime: ctx.cliRuntime,
              projectRuntime: ctx.projectRuntime
            });
            if (Object.keys(projectPatch).length > 0) {
              Config.setProject(projectPatch);
            }
            if (ctx.project.hooks?.postDeploy) {
              try {
                runHook('postDeploy', ctx.project.hooks.postDeploy);
              } catch (err: unknown) {
                console.warn(pc.yellow(`⚠️ postDeploy hook 执行失败，已忽略: ${formatErrorMessage(err)}`));
              }
            }
            if (isJsonOutput()) {
              emitCommandResult({
                type: ctx.type,
                runtime: ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || null,
                url,
                fixedDomain: fixedDomain || null,
                releaseTarget: ctx.releaseTarget || null,
                promotedVersion: promotedVersion || null,
                healthCheckLogs,
                ...(!ctx.releaseTarget && ctx.type === 'api' ? { hint: '运行 licell release promote 发布到生产' } : {})
              });
            } else {
              showOutro('Done!');
            }
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
  commands: [deployCommand, deploySpecCommand, deployCheckCommand]
});
