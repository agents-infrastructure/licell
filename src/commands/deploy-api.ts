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
import { bindCustomDomain, ensureWildcardCname } from '../providers/domain';
import { enableCdnForDomain } from '../providers/cdn';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { probeHttpHealth } from '../utils/health-check';
import { formatErrorMessage } from '../utils/errors';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import { isJsonOutput } from '../utils/output';
import type { DeployContext } from './deploy-context';

export interface ApiDeployResult {
  url: string;
  promotedVersion?: string;
  fixedDomain?: string;
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

export async function executeApiDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>
): Promise<ApiDeployResult | undefined> {
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
    Config.setProject({ acrNamespace: ctx.cliAcrNamespace });
  }

  const defaultApiEntry = getRuntime(runtime).defaultEntry;
  let entry: string;
  if (runtime === 'docker') {
    entry = ctx.cliEntry || '';
  } else if (ctx.cliEntry) {
    entry = toPromptValue(ctx.cliEntry, '入口文件路径');
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
        s.message('🌐 正在自动准备 VPC 网络...');
        try {
          const defaultNetwork = await ensureDefaultNetwork();
          Config.setProject({ network: defaultNetwork });
          ctx.project = Config.getProject();
          s.message(`✅ VPC 已就绪: ${defaultNetwork.vpcId} / ${defaultNetwork.vswId}`);
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
      const deployedUrl = await deployFC(
        ctx.appName,
        entry,
        runtime,
        Object.keys(deployOptions).length > 0 ? deployOptions : undefined
      );
      const fcOriginDomain = `${ctx.auth.accountId}.${ctx.auth.region}.fc.aliyuncs.com`;
      let nextPromotedVersion: string | undefined;
      let nextFixedDomain: string | undefined;
      let nextPreviewDomain: string | undefined;
      let nextPreviewVersion: string | undefined;

      if (ctx.preview && ctx.domainSuffix) {
        s.message('函数部署完成，正在发布预览版本...');
        nextPreviewVersion = await publishFunctionVersion(
          ctx.appName,
          `preview at ${new Date().toISOString()}`
        );
        nextPreviewDomain = `${ctx.appName}-preview-v${nextPreviewVersion}.${ctx.domainSuffix}`;

        s.message(`正在确保通配符 DNS (*.${ctx.domainSuffix}) 存在...`);
        const wildcardResult = await ensureWildcardCname(
          ctx.domainSuffix,
          fcOriginDomain,
          {
            interactiveTTY: ctx.interactiveTTY,
            onConfirm: async () => {
              const result = await confirm({
                message: `检测到尚未配置通配符 DNS (*.${ctx.domainSuffix})。\n` +
                  `创建后，所有 preview 子域名将自动解析到 FC 网关。\n` +
                  `已有的精确 DNS 记录（如 ${ctx.appName}.${ctx.domainSuffix}）不受影响。\n` +
                  `是否创建？`
              });
              if (isCancel(result)) return false;
              return result;
            }
          }
        );
        if (wildcardResult.skipped) {
          s.message(pc.yellow('⚠️ 已跳过通配符 DNS 创建，preview 域名可能无法访问'));
        } else if (wildcardResult.created) {
          s.message(`✅ 通配符 DNS 已创建: ${wildcardResult.wildcardDomain} → ${wildcardResult.targetValue}`);
        }

        s.message(`正在绑定预览域名 ${nextPreviewDomain}...`);
        await bindCustomDomain(
          nextPreviewDomain,
          fcOriginDomain,
          nextPreviewVersion,
          { skipDnsBind: true }
        );

        if (ctx.enableSSL) {
          s.message(`预览域名绑定完成，正在签发 HTTPS 证书 (${nextPreviewDomain})...`);
          await issueAndBindSSLWithArtifacts(nextPreviewDomain, s, { forceRenew: ctx.forceSslRenew });
        }
      } else if (ctx.releaseTarget) {
        s.message(`函数部署完成，正在发布版本并切流到 ${ctx.releaseTarget}...`);
        nextPromotedVersion = await publishFunctionVersion(
          ctx.appName,
          `deploy ${ctx.releaseTarget} at ${new Date().toISOString()}`
        );
        await promoteFunctionAlias(
          ctx.appName,
          ctx.releaseTarget,
          nextPromotedVersion,
          `deployed by licell at ${new Date().toISOString()}`
        );
      }
      if (ctx.domainSuffix) {
        nextFixedDomain = `${ctx.appName}.${ctx.domainSuffix}`;
        s.message(`函数部署完成，正在按固定规则绑定域名 ${nextFixedDomain}...`);
        await bindCustomDomain(
          nextFixedDomain,
          fcOriginDomain,
          ctx.releaseTarget,
          { skipDnsBind: ctx.enableCdn }
        );
        let sslArtifacts: { certificate?: string; privateKey?: string } | undefined;
        if (ctx.enableSSL) {
          s.message(`固定域名绑定完成，正在签发并挂载 HTTPS 证书 (${nextFixedDomain})...`);
          const sslResult = await issueAndBindSSLWithArtifacts(nextFixedDomain, s, { forceRenew: ctx.forceSslRenew });
          sslArtifacts = {
            certificate: sslResult.certificate,
            privateKey: sslResult.privateKey
          };
        }
        if (ctx.enableCdn) {
          s.message(`固定域名绑定完成，正在启用 CDN 加速 (${nextFixedDomain})...`);
          const cdnResult = await enableCdnForDomain(nextFixedDomain, fcOriginDomain, sslArtifacts);
          s.message(
            cdnResult.created
              ? `✅ CDN 加速已启用，CNAME=${cdnResult.cdnCname}`
              : `✅ CDN 加速已存在，已校准 DNS 到 CNAME=${cdnResult.cdnCname}`
          );
          if (ctx.enableSSL && cdnResult.httpsConfigured) {
            s.message('✅ CDN 边缘 HTTPS 已自动配置。');
          }
          if (ctx.enableSSL && !cdnResult.httpsConfigured) {
            s.message('⚠️ 未能自动配置 CDN 边缘 HTTPS（未获取到可用证书），请在 CDN 控制台补充证书。');
          }
        }
      }
      if (ctx.cliDomain) {
        nextFixedDomain = ctx.cliDomain;
        s.message(`函数部署完成，正在绑定自定义域名 ${nextFixedDomain}...`);
        await bindCustomDomain(
          nextFixedDomain,
          fcOriginDomain,
          ctx.releaseTarget,
          { skipDnsBind: ctx.enableCdn }
        );
        let sslArtifacts: { certificate?: string; privateKey?: string } | undefined;
        if (ctx.enableSSL) {
          s.message(`自定义域名绑定完成，正在签发并挂载 HTTPS 证书 (${nextFixedDomain})...`);
          const sslResult = await issueAndBindSSLWithArtifacts(nextFixedDomain, s, { forceRenew: ctx.forceSslRenew });
          sslArtifacts = {
            certificate: sslResult.certificate,
            privateKey: sslResult.privateKey
          };
        }
        if (ctx.enableCdn) {
          s.message(`自定义域名绑定完成，正在启用 CDN 加速 (${nextFixedDomain})...`);
          const cdnResult = await enableCdnForDomain(nextFixedDomain, fcOriginDomain, sslArtifacts);
          s.message(
            cdnResult.created
              ? `✅ CDN 加速已启用，CNAME=${cdnResult.cdnCname}`
              : `✅ CDN 加速已存在，已校准 DNS 到 CNAME=${cdnResult.cdnCname}`
          );
          if (ctx.enableSSL && cdnResult.httpsConfigured) {
            s.message('✅ CDN 边缘 HTTPS 已自动配置。');
          }
          if (ctx.enableSSL && !cdnResult.httpsConfigured) {
            s.message('⚠️ 未能自动配置 CDN 边缘 HTTPS（未获取到可用证书），请在 CDN 控制台补充证书。');
          }
        }
      }
      return {
        url: deployedUrl,
        promotedVersion: nextPromotedVersion,
        fixedDomain: nextFixedDomain,
        previewDomain: nextPreviewDomain,
        previewVersion: nextPreviewVersion
      };
    }
  );
  if (!apiDeployResult) return undefined;
  const { url, promotedVersion, fixedDomain, previewDomain, previewVersion } = apiDeployResult;

  s.message('🩺 部署完成，正在做可访问性检测...');
  const healthCheckLogs: string[] = [];
  const productionProbe = await probeHttpHealth(url);
  if (productionProbe.ok) {
    healthCheckLogs.push(`✅ 生产地址可访问 (${productionProbe.statusCode} ${productionProbe.checkedUrl})`);
  } else {
    healthCheckLogs.push(`⚠️ 生产地址可访问性检测未通过: ${productionProbe.error}`);
  }
  if (fixedDomain) {
    const fixedDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${fixedDomain}`;
    const fixedProbeAttempts = ctx.enableCdn ? 10 : 6;
    const fixedProbeIntervalMs = ctx.enableCdn ? 3000 : 2000;
    const fixedProbeTimeoutMs = ctx.enableCdn ? 6000 : 5000;
    const fixedProbe = await probeHttpHealth(fixedDomainUrl, {
      maxAttempts: fixedProbeAttempts,
      intervalMs: fixedProbeIntervalMs,
      timeoutMs: fixedProbeTimeoutMs
    });
    if (fixedProbe.ok) {
      healthCheckLogs.push(`✅ 固定域名可访问 (${fixedProbe.statusCode} ${fixedProbe.checkedUrl})`);
    } else {
      healthCheckLogs.push(`⚠️ 固定域名检测未通过（可能 DNS 传播中）: ${fixedProbe.error}`);
    }
  }
  if (previewDomain) {
    const previewDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${previewDomain}`;
    const previewProbe = await probeHttpHealth(previewDomainUrl, {
      maxAttempts: 8,
      intervalMs: 2000,
      timeoutMs: 5000
    });
    if (previewProbe.ok) {
      healthCheckLogs.push(`✅ 预览域名可访问 (${previewProbe.statusCode} ${previewProbe.checkedUrl})`);
    } else {
      healthCheckLogs.push(`⚠️ 预览域名检测未通过（可能 DNS 传播中）: ${previewProbe.error}`);
    }
  }

  return {
    url,
    promotedVersion,
    fixedDomain,
    previewDomain,
    previewVersion,
    healthCheckLogs
  };
}
