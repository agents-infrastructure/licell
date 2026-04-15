import { confirm, text, isCancel, type spinner } from '@clack/prompts';
import { existsSync } from 'fs';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { getRuntime } from '../providers/fc/runtime-handler';
import { ensureDefaultNetwork } from '../providers/vpc';
import {
  DEFAULT_FC_RUNTIME,
  createFcApiDeployPrecheckError,
  deployFC,
  runFcApiDeployPrecheck,
  publishFunctionVersion,
  promoteFunctionAlias
} from '../providers/fc';
import { bindAppDomainWorkflow } from '../workflows/domain';
import { bindFunctionPreviewDomainWorkflow } from '../workflows/preview';
import { confirmPreviewWildcardDns } from './deploy-preview';
import { probeHttpHealth } from '../utils/health-check';
import { formatErrorMessage } from '../utils/errors';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import { isJsonOutput } from '../utils/output';
import type { DeployContext } from './deploy-context';
import { notifyDeployProgress, runDeployProgressStep } from './deploy-progress';

export interface ApiDeployResult {
  url: string;
  runtime: string;
  entry: string;
  functionName: string;
  cdnCname?: string;
  promotedVersion?: string;
  fixedDomain?: string;
  fixedDomainUrl?: string;
  previewDomain?: string;
  previewVersion?: string;
  healthCheckLogs: string[];
}

function formatPrecheckIssueLines(issues: Array<{ id: string; level: 'error' | 'warning'; message: string; remediation?: string[] }>) {
  const lines: string[] = [];
  for (const issue of issues) {
    const prefix = issue.level === 'error' ? 'ERROR' : 'WARN';
    lines.push(`[${prefix}] ${issue.id}`);
    lines.push(issue.message);
    if (issue.remediation && issue.remediation.length > 0) {
      for (const tip of issue.remediation) {
        lines.push(`- ${tip}`);
      }
    }
  }
  return lines;
}

function resolveApiFixedDomain(ctx: DeployContext) {
  if (ctx.cliDomain) return ctx.cliDomain;
  if (ctx.projectDomain) return ctx.projectDomain;
  if (ctx.domainSuffix) return `${ctx.appName}.${ctx.domainSuffix}`;
  return undefined;
}

function describeApiFixedDomain(ctx: DeployContext) {
  return ctx.cliDomain ? '自定义域名' : '固定规则域名';
}

export async function executeApiDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>
): Promise<ApiDeployResult | undefined> {
  const stagePrefix = 'deploy.api';
  let runtime = ctx.cliRuntime || ctx.projectRuntime || ctx.envRuntime || DEFAULT_FC_RUNTIME;
  if (runtime !== 'docker' && !ctx.cliRuntime && existsSync('Dockerfile') && ctx.interactiveTTY) {
    const useDocker = await confirm({ message: '检测到 Dockerfile，是否使用 Docker 容器部署？' });
    if (isCancel(useDocker)) {
      if (isJsonOutput()) throw new Error('操作已取消');
      process.exit(0);
    }
    if (useDocker) runtime = 'docker';
  }
  if (ctx.cliAcrNamespace && runtime !== 'docker') {
    throw new Error('--acr-namespace 仅适用于 --runtime docker');
  }
  if (runtime === 'docker' && ctx.cliAcrNamespace) {
    Config.setProject({ acrNamespace: ctx.cliAcrNamespace }, { component: ctx.component });
  }

  const defaultApiEntry = getRuntime(runtime).defaultEntry;
  let entry: string;
  if (runtime === 'docker') {
    entry = ctx.cliEntry || '';
  } else if (ctx.cliEntry) {
    entry = toPromptValue(ctx.cliEntry, '入口文件路径');
  } else if (ctx.projectEntry) {
    entry = ctx.projectEntry;
  } else if (ctx.interactiveTTY) {
    entry = toPromptValue(await text({
      message: runtime.startsWith('python')
        ? '入口文件路径 (Python 需包含 handler 函数):'
        : '入口文件路径 (需导出 handler):',
      initialValue: defaultApiEntry
    }), '入口文件路径');
  } else {
    entry = defaultApiEntry;
  }

  const precheck = runFcApiDeployPrecheck({
    runtime,
    entry,
    checkDockerDaemon: runtime === 'docker'
  });
  const precheckWarnings = precheck.issues.filter((item) => item.level === 'warning');
  if (!precheck.ok) {
    const lines = formatPrecheckIssueLines(precheck.issues);
    const err = createFcApiDeployPrecheckError(precheck) as Error & { message?: string };
    err.message = `${err.message}\n${lines.join('\n')}`;
    throw err;
  }
  if (precheckWarnings.length > 0) {
    const warnings = formatPrecheckIssueLines(precheckWarnings);
    s.message(`⚠️ 部署前预检通过（含 warning）:\n${warnings.join('\n')}`);
  }

  let spinnerMsg = '🔨 正在使用 Bun 极速剥离依赖打包，并推送至云端...';
  if (runtime === 'docker') {
    spinnerMsg = '🐳 正在构建 Docker 镜像并推送至 ACR...';
  } else if (runtime.startsWith('python')) {
    spinnerMsg = '🐍 正在打包 Python 源码并推送至云端...';
  }

  const apiDeployResult = await withSpinner(
    s,
    spinnerMsg,
    '❌ 部署失败',
    async () => {
      if (ctx.useVpc && !ctx.project.network) {
        try {
          const defaultNetwork = await runDeployProgressStep(
            s,
            {
              stage: `${stagePrefix}.vpc`,
              message: '🌐 正在自动准备 VPC 网络...',
              okMessage: (network) => `✅ VPC 已就绪: ${network.vpcId} / ${network.vswId}`,
              okData: (network) => ({
                vpcId: network.vpcId,
                vswId: network.vswId,
                securityGroupId: network.sgId
              })
            },
            () => ensureDefaultNetwork()
          );
          Config.setProject({ network: defaultNetwork }, { component: ctx.component });
          ctx.project = Config.getProject({ component: ctx.component });
        } catch (err: unknown) {
          console.warn(pc.yellow(`⚠️ VPC 自动接入失败，回退公网模式: ${formatErrorMessage(err)}`));
        }
      }

      const deployNetwork = ctx.useVpc
        ? ctx.project.network
        : null;
      const deployOptions = {
        ...(ctx.cliResources ? { resources: ctx.cliResources } : {}),
        ...(deployNetwork !== undefined ? { network: deployNetwork } : {})
      };
      const deployResult = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.function`,
          message: spinnerMsg,
          okMessage: '✅ 函数代码已推送到云端',
          data: {
            runtime,
            entry,
            useVpc: ctx.useVpc
          }
        },
        () => deployFC(
          ctx.appName,
          entry,
          runtime,
          {
            ...(Object.keys(deployOptions).length > 0 ? deployOptions : {}),
            project: ctx.project
          }
        )
      );
      const deployedUrl = deployResult.url;
      if (!deployedUrl) {
        throw new Error('API 部署后未获取到函数访问地址');
      }
      let nextPromotedVersion: string | undefined;
      let nextFixedDomain: string | undefined;
      let nextFixedDomainUrl: string | undefined;
      let nextPreviewDomain: string | undefined;
      let nextPreviewVersion: string | undefined;
      let nextCdnCname: string | undefined;

      if (ctx.preview && ctx.domainSuffix) {
        const previewDomainSuffix = ctx.domainSuffix;
        const previewVersionId = await runDeployProgressStep(
          s,
          {
            stage: `${stagePrefix}.preview.version`,
            message: '函数部署完成，正在发布预览版本...',
            okMessage: (versionId) => `✅ 预览版本已创建: ${versionId}`,
            data: { domainSuffix: previewDomainSuffix }
          },
          () => publishFunctionVersion(
            ctx.appName,
            `preview at ${new Date().toISOString()}`
          )
        );
        nextPreviewVersion = previewVersionId;

        const previewResult = await runDeployProgressStep(
          s,
          {
            stage: `${stagePrefix}.preview.domain`,
            message: `正在配置预览域名 (${previewDomainSuffix})...`,
            okMessage: (result) => `✅ 预览域名已就绪: ${result.previewDomain}`,
            data: {
              domainSuffix: previewDomainSuffix,
              enableSSL: ctx.enableSSL
            }
          },
          () => bindFunctionPreviewDomainWorkflow(ctx.appName, {
            functionName: ctx.appName,
            qualifier: previewVersionId,
            domainSuffix: previewDomainSuffix,
            interactiveTTY: ctx.interactiveTTY,
            onConfirmWildcardDns: () => confirmPreviewWildcardDns(previewDomainSuffix, ctx.appName),
            enableHttps: ctx.enableSSL,
            forceSslRenew: ctx.forceSslRenew,
            spinner: s
          })
        );
        nextPreviewDomain = previewResult.previewDomain;
        if (previewResult.wildcardResult.skipped) {
          notifyDeployProgress(s, {
            stage: `${stagePrefix}.preview.dns`,
            message: pc.yellow('⚠️ 已跳过通配符 DNS 创建，preview 域名可能无法访问'),
            data: {
              skipped: true,
              previewDomain: nextPreviewDomain
            }
          });
        } else if (previewResult.wildcardResult.created) {
          notifyDeployProgress(s, {
            stage: `${stagePrefix}.preview.dns`,
            message: `✅ 通配符 DNS 已创建: ${previewResult.wildcardResult.wildcardDomain} → ${previewResult.wildcardResult.targetValue}`,
            data: {
              created: true,
              wildcardDomain: previewResult.wildcardResult.wildcardDomain,
              targetValue: previewResult.wildcardResult.targetValue
            }
          });
        }
      } else if (ctx.releaseTarget) {
        const releaseTarget = ctx.releaseTarget;
        const promotedVersion = await runDeployProgressStep(
          s,
          {
            stage: `${stagePrefix}.release.version`,
            message: '函数部署完成，正在发布版本...',
            okMessage: (versionId) => `✅ 已生成发布版本: ${versionId}`,
            data: { releaseTarget }
          },
          () => publishFunctionVersion(
            ctx.appName,
            `deploy ${releaseTarget} at ${new Date().toISOString()}`
          )
        );
        nextPromotedVersion = promotedVersion;
        await runDeployProgressStep(
          s,
          {
            stage: `${stagePrefix}.release.alias`,
            message: `正在切流到 ${releaseTarget}...`,
            okMessage: `✅ alias 已切到 ${releaseTarget}`,
            data: {
              releaseTarget,
              versionId: promotedVersion
            }
          },
          () => promoteFunctionAlias(
            ctx.appName,
            releaseTarget,
            promotedVersion,
            `deployed by licell at ${new Date().toISOString()}`
          )
        );
      }
      const resolvedFixedDomain = resolveApiFixedDomain(ctx);
      if (resolvedFixedDomain) {
        nextFixedDomain = resolvedFixedDomain;
        const domainResult = await runDeployProgressStep(
          s,
          {
            stage: `${stagePrefix}.domain`,
            message: `函数部署完成，正在配置${describeApiFixedDomain(ctx)} ${resolvedFixedDomain}...`,
            okMessage: (result) => `✅ 域名 workflow 已完成: ${result.domainName}`,
            data: {
              domain: resolvedFixedDomain,
              enableCdn: ctx.enableCdn,
              enableSSL: ctx.enableSSL
            }
          },
          () => bindAppDomainWorkflow(resolvedFixedDomain, {
            functionName: ctx.appName,
            releaseTarget: ctx.releaseTarget,
            ensureAlias: false,
            enableCdn: ctx.enableCdn,
            enableHttps: ctx.enableSSL,
            forceSslRenew: ctx.forceSslRenew,
            spinner: s
          })
        );
        nextFixedDomain = domainResult.domainName;
        nextFixedDomainUrl = domainResult.finalUrl;
        if (ctx.enableCdn && domainResult.cdnCname) {
          nextCdnCname = domainResult.cdnCname;
          notifyDeployProgress(s, {
            stage: `${stagePrefix}.domain.cdn`,
            message: `✅ CDN 加速已校准，CNAME=${domainResult.cdnCname}`,
            data: {
              domain: domainResult.domainName,
              cdnCname: domainResult.cdnCname
            }
          });
        }
        if (ctx.enableSSL && ctx.enableCdn && domainResult.edgeHttpsConfigured) {
          notifyDeployProgress(s, {
            stage: `${stagePrefix}.domain.https`,
            message: '✅ CDN 边缘 HTTPS 已自动配置。',
            data: { domain: domainResult.domainName, mode: 'cdn-edge' }
          });
        }
        if (ctx.enableSSL && ctx.enableCdn && !domainResult.edgeHttpsConfigured) {
          notifyDeployProgress(s, {
            stage: `${stagePrefix}.domain.https`,
            message: '⚠️ 未能自动配置 CDN 边缘 HTTPS（未获取到可用证书），请在 CDN 控制台补充证书。',
            data: { domain: domainResult.domainName, mode: 'cdn-edge', configured: false }
          });
        }
        if (ctx.enableSSL && !ctx.enableCdn && domainResult.domainHttpsConfigured) {
          notifyDeployProgress(s, {
            stage: `${stagePrefix}.domain.https`,
            message: '✅ 域名 HTTPS 已自动配置。',
            data: { domain: domainResult.domainName, mode: 'domain-gateway' }
          });
        }
      }
      return {
        url: deployedUrl,
        runtime,
        entry,
        functionName: ctx.appName,
        cdnCname: nextCdnCname,
        promotedVersion: nextPromotedVersion,
        fixedDomain: nextFixedDomain,
        fixedDomainUrl: nextFixedDomainUrl,
        previewDomain: nextPreviewDomain,
        previewVersion: nextPreviewVersion
      };
    }
  );
  if (!apiDeployResult) return undefined;
  const {
    url,
    runtime: resolvedRuntime,
    entry: resolvedEntry,
    functionName,
    cdnCname,
    promotedVersion,
    fixedDomain,
    fixedDomainUrl,
    previewDomain,
    previewVersion
  } = apiDeployResult;

  notifyDeployProgress(s, {
    stage: `${stagePrefix}.health`,
    message: '🩺 部署完成，正在做可访问性检测...'
  });
  const healthCheckLogs: string[] = [];
  const productionProbe = await runDeployProgressStep(
    s,
    {
      stage: `${stagePrefix}.health.production`,
      message: '正在探测生产地址...',
      okMessage: '✅ 生产地址探测已完成',
      data: { url }
    },
    () => probeHttpHealth(url)
  );
  if (productionProbe.ok) {
    healthCheckLogs.push(`✅ 生产地址可访问 (${productionProbe.statusCode} ${productionProbe.checkedUrl})`);
  } else {
    healthCheckLogs.push(`⚠️ 生产地址可访问性检测未通过: ${productionProbe.error}`);
  }
  if (fixedDomain) {
    const fixedProbeUrl = fixedDomainUrl || `${ctx.enableSSL ? 'https' : 'http'}://${fixedDomain}`;
    const fixedProbeAttempts = ctx.enableCdn ? 10 : 6;
    const fixedProbeIntervalMs = ctx.enableCdn ? 3000 : 2000;
    const fixedProbeTimeoutMs = ctx.enableCdn ? 6000 : 5000;
    const fixedProbe = await runDeployProgressStep(
      s,
      {
        stage: `${stagePrefix}.health.fixed-domain`,
        message: `正在探测固定域名 ${fixedDomain}...`,
        okMessage: '✅ 固定域名探测已完成',
        data: { domain: fixedDomain, url: fixedProbeUrl }
      },
      () => probeHttpHealth(fixedProbeUrl, {
        maxAttempts: fixedProbeAttempts,
        intervalMs: fixedProbeIntervalMs,
        timeoutMs: fixedProbeTimeoutMs
      })
    );
    if (fixedProbe.ok) {
      healthCheckLogs.push(`✅ 固定域名可访问 (${fixedProbe.statusCode} ${fixedProbe.checkedUrl})`);
    } else {
      healthCheckLogs.push(`⚠️ 固定域名检测未通过（可能 DNS 传播中）: ${fixedProbe.error}`);
    }
  }
  if (previewDomain) {
    const previewDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${previewDomain}`;
    const previewProbe = await runDeployProgressStep(
      s,
      {
        stage: `${stagePrefix}.health.preview-domain`,
        message: `正在探测预览域名 ${previewDomain}...`,
        okMessage: '✅ 预览域名探测已完成',
        data: { domain: previewDomain, url: previewDomainUrl }
      },
      () => probeHttpHealth(previewDomainUrl, {
        maxAttempts: 8,
        intervalMs: 2000,
        timeoutMs: 5000
      })
    );
    if (previewProbe.ok) {
      healthCheckLogs.push(`✅ 预览域名可访问 (${previewProbe.statusCode} ${previewProbe.checkedUrl})`);
    } else {
      healthCheckLogs.push(`⚠️ 预览域名检测未通过（可能 DNS 传播中）: ${previewProbe.error}`);
    }
  }

  return {
    url,
    runtime: resolvedRuntime,
    entry: resolvedEntry,
    functionName,
    cdnCname,
    promotedVersion,
    fixedDomain,
    previewDomain,
    previewVersion,
    healthCheckLogs
  };
}
