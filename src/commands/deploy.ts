import type { CAC } from 'cac';
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
  ensureAuthCapabilityPreflight,
  type AuthCapability
} from '../utils/auth-recovery';
import { createSpinner, isInteractiveTTY, showIntro, showOutro, tryNormalizeFcRuntime } from '../utils/cli-shared';
import { emitCliError, emitCliEvent, emitCliResult, isJsonOutput } from '../utils/output';
import { resolveDeployContext, type DeployCliOptions } from './deploy-context';
import { executeApiDeploy } from './deploy-api';
import { executeStaticDeploy } from './deploy-static';

export { resolveDeploySslEnabled } from './deploy-context';

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
    emitCliResult({
      stage: 'deploy.spec',
      ...payload
    });
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
    emitCliResult({
      stage: 'deploy.check',
      ...result
    });
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
  cli.command('deploy spec [runtime]', '查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照）')
    .option('--all', '输出全部 runtime 规格')
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

  cli.command('deploy check', '本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行）')
    .option('--runtime <runtime>', 'FC runtime：nodejs20/nodejs22/python3.12/python3.13/docker')
    .option('--entry <entry>', '入口文件路径（默认按 runtime 推断）')
    .option('--docker-daemon', 'runtime=docker 时额外检测本机 Docker daemon 可用性')
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

  cli.command('deploy', '一键极速打包部署')
    .option('--type <type>', '部署类型：api 或 static（适配 CI 非交互场景）')
    .option('--entry <entry>', 'API 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py）')
    .option('--dist <dist>', '静态站点目录（默认 dist）')
    .option('--runtime <runtime>', '运行时（API: nodejs20/nodejs22/python3.12/python3.13/docker；静态站: static/statis）')
    .option('--target <target>', 'API 部署后自动发布并切流到该 alias（如 prod/preview）')
    .option('--domain <domain>', '绑定完整自定义域名（如 api.your-domain.xyz）')
    .option('--domain-suffix <suffix>', '自动绑定固定子域名后缀（如 your-domain.xyz）')
    .option('--enable-cdn', '域名绑定后自动接入 CDN 并将 DNS CNAME 切到 CDN（API 显式开启；Static 提供域名时默认开启）')
    .option('--ssl', '启用 HTTPS（API: --domain/--enable-cdn 默认开启；Static: 提供域名时默认开启）')
    .option('--ssl-force-renew', '启用 HTTPS 时强制续签证书（忽略到期阈值）')
    .option('--acr-namespace <ns>', 'Docker 部署时使用的 ACR 命名空间（默认 licell）')
    .option('--enable-vpc', 'API 部署时启用 VPC 接入（默认启用）')
    .option('--disable-vpc', 'API 部署时禁用 VPC 接入（使用公网模式）')
    .option('--memory <mb>', '函数内存大小（MB，默认 512）')
    .option('--vcpu <n>', '函数 vCPU 核数（如 0.5 / 1 / 2，默认 0.5）')
    .option('--instance-concurrency <n>', '单实例并发数（默认自动，通常起始 10）')
    .option('--timeout <seconds>', '函数超时时间（秒，默认 30）')
    .action(async (options: DeployCliOptions) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ▲ Deploying to Aliyun ')));
      } else {
        emitCliEvent({ stage: 'deploy', action: 'deploy', status: 'start' });
      }
      const s = createSpinner();
      const interactiveTTY = isInteractiveTTY();
      try {
        await ensureAuthReadyForCommand({ commandLabel: 'licell deploy', interactiveTTY });

        let recoveredAuth = false;
        while (true) {
          const ctx = await resolveDeployContext(options);
          const resolvedAuth = Config.getAuth();
          const authFingerprint = resolvedAuth
            ? `${resolvedAuth.accountId}|${resolvedAuth.region}|${resolvedAuth.ak}`
            : '';
          await ensureAuthCapabilityPreflight({
            commandLabel: 'licell deploy',
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
            emitCliEvent({
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
            let healthCheckLogs: string[] = [];

            if (ctx.type === 'api') {
              emitCliEvent({ stage: 'deploy.api', action: 'execute', status: 'start' });
              const result = await executeApiDeploy(ctx, s);
              if (!result) return;
              emitCliEvent({ stage: 'deploy.api', action: 'execute', status: 'ok' });
              ({ url, promotedVersion, fixedDomain, healthCheckLogs } = result);
            } else {
              emitCliEvent({ stage: 'deploy.static', action: 'execute', status: 'start' });
              const result = await executeStaticDeploy(ctx, s);
              if (!result) return;
              emitCliEvent({ stage: 'deploy.static', action: 'execute', status: 'ok' });
              ({ url, fixedDomain, healthCheckLogs } = result);
            }

            s.stop(pc.green('✅ 部署成功!'));
            console.log(`\n🎉 Production URL: ${pc.cyan(pc.underline(url))}\n`);
            if (fixedDomain) {
              const fixedDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${fixedDomain}`;
              console.log(`🌐 Fixed Domain: ${pc.cyan(pc.underline(fixedDomainUrl))}\n`);
            }
            if (ctx.releaseTarget && promotedVersion) {
              console.log(`🏷️  alias=${pc.cyan(ctx.releaseTarget)} -> version=${pc.cyan(promotedVersion)}\n`);
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
              emitCliResult({
                stage: 'deploy',
                type: ctx.type,
                runtime: ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || null,
                url,
                fixedDomain: fixedDomain || null,
                releaseTarget: ctx.releaseTarget || null,
                promotedVersion: promotedVersion || null,
                healthCheckLogs
              });
            } else {
              showOutro('Done!');
            }
            return;
          } catch (err: unknown) {
            if (!recoveredAuth) {
              s.stop(pc.yellow('⚠️ 检测到鉴权/权限问题，正在尝试自动修复并重试...'));
              const repaired = await tryRecoverAuthForError(err, {
                commandLabel: 'licell deploy',
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
