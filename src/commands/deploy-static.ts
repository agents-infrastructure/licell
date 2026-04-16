import { text, type spinner } from '@clack/prompts';
import pc from 'picocolors';
import { deployOSS, resolveOssBucketName } from '../providers/oss';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { bindStaticDomainWorkflow } from '../workflows/domain';
import { bindFunctionPreviewDomainWorkflow } from '../workflows/preview';
import { probeHttpHealth } from '../utils/health-check';
import { detectStaticDistDir } from '../utils/static-dist';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import {
  deployStaticProxyFunction,
  publishStaticProxyVersion
} from '../providers/fc/static-proxy.js';
import type { DeployContext } from './deploy-context.js';
import { confirmPreviewWildcardDns } from './deploy-preview';
import { notifyDeployProgress, runDeployProgressStep } from './deploy-progress';

export interface StaticDeployResult {
  url: string;
  dist: string;
  bucketName: string;
  cdnCname?: string;
  fixedDomain?: string;
  previewDomain?: string;
  previewVersion?: string;
  healthCheckLogs: string[];
}

function resolveStaticFixedDomain(ctx: DeployContext) {
  if (ctx.cliDomain) return ctx.cliDomain;
  if (ctx.projectDomain) return ctx.projectDomain;
  if (ctx.domainSuffix) return `${ctx.appName}.${ctx.domainSuffix}`;
  return undefined;
}

function resolveStaticBucketName(ctx: DeployContext) {
  return ctx.project?.deployTarget?.bucket || resolveOssBucketName(ctx.appName);
}


export async function executeStaticDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>
): Promise<StaticDeployResult | undefined> {
  const stagePrefix = 'deploy.static';
  const detectedDist = detectStaticDistDir();
  const dist = ctx.cliDist
    ? toPromptValue(ctx.cliDist, '构建产物目录')
    : ctx.projectDist
      ? ctx.projectDist
    : ctx.interactiveTTY
      ? toPromptValue(await text({ message: '前端构建产物目录:', initialValue: detectedDist }), '构建产物目录')
      : detectedDist;

  if (ctx.preview && ctx.domainSuffix) {
    return executeStaticPreviewDeploy(ctx, s, dist);
  }

  const fixedDomain = resolveStaticFixedDomain(ctx);
  const staticDeployResult = await withSpinner(
    s,
    '☁️ 正在递归上传静态资源到 OSS 边缘节点...',
    '❌ 部署失败',
    async () => {
      const bucketName = resolveStaticBucketName(ctx);
      const url = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.upload`,
          message: '☁️ 正在递归上传静态资源到 OSS 边缘节点...',
          okMessage: '✅ 静态资源已上传到 OSS',
          data: { dist, bucketName }
        },
        () => deployOSS(ctx.appName, dist, {
          bucketName,
          allowPrivateFallback: Boolean(fixedDomain)
        })
      );
      if (!fixedDomain) {
        return { url, dist, bucketName, fixedDomain: undefined };
      }

      let tlsArtifacts: { certificate?: string; privateKey?: string } | undefined;
      if (ctx.enableSSL) {
        const sslResult = await runDeployProgressStep(
          s,
          {
            stage: `${stagePrefix}.ssl`,
            message: `静态资源上传完成，正在签发 HTTPS 证书 (${fixedDomain})...`,
            okMessage: `✅ HTTPS 证书已就绪: ${fixedDomain}`,
            data: {
              domain: fixedDomain,
              forceRenew: ctx.forceSslRenew
            }
          },
          () => issueAndBindSSLWithArtifacts(fixedDomain, s, {
            forceRenew: ctx.forceSslRenew,
            bindToFcDomain: false
          })
        );
        tlsArtifacts = {
          certificate: sslResult.certificate,
          privateKey: sslResult.privateKey
        };
      }

      const domainResult = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.domain`,
          message: `静态资源上传完成，正在执行静态域名 workflow (${fixedDomain})...`,
          okMessage: (result) => `✅ 静态域名 workflow 已完成: ${result.domainName}`,
          data: {
            domain: fixedDomain,
            bucketName,
            enableSSL: ctx.enableSSL
          }
        },
        () => bindStaticDomainWorkflow(fixedDomain, {
          bucketName,
          tlsArtifacts,
          preferHttps: ctx.enableSSL
        })
      );
      notifyDeployProgress(s, {
        stage: `${stagePrefix}.domain.cdn`,
        message: `✅ CDN 加速已校准，CNAME=${domainResult.cdnCname}`,
        data: {
          domain: domainResult.domainName,
          cdnCname: domainResult.cdnCname
        }
      });
      if (ctx.enableSSL && domainResult.httpsConfigured) {
        notifyDeployProgress(s, {
          stage: `${stagePrefix}.domain.https`,
          message: '✅ CDN 边缘 HTTPS 已自动配置。',
          data: { domain: domainResult.domainName }
        });
      }
      if (ctx.enableSSL && !domainResult.httpsConfigured) {
        notifyDeployProgress(s, {
          stage: `${stagePrefix}.domain.https`,
          message: '⚠️ 未能自动配置 CDN 边缘 HTTPS（未获取到可用证书），请在 CDN 控制台补充证书。',
          data: { domain: domainResult.domainName, configured: false }
        });
      }
      return { url, dist, bucketName, fixedDomain: domainResult.domainName, cdnCname: domainResult.cdnCname };
    }
  );
  if (!staticDeployResult) return undefined;

  const { url } = staticDeployResult;
  const healthCheckLogs: string[] = [];
  notifyDeployProgress(s, {
    stage: `${stagePrefix}.health`,
    message: '🩺 部署完成，正在做可访问性检测...'
  });
  const productionProbe = await runDeployProgressStep(
    s,
    {
      stage: `${stagePrefix}.health.oss`,
      message: '正在探测 OSS 地址...',
      okMessage: '✅ OSS 地址探测已完成',
      data: { url }
    },
    () => probeHttpHealth(url, {
      paths: [''],
      maxAttempts: 5,
      intervalMs: 1500,
      timeoutMs: 5000,
      allowClientError: false
    })
  );
  if (productionProbe.ok) {
    healthCheckLogs.push(`✅ OSS 地址可访问 (${productionProbe.statusCode} ${productionProbe.checkedUrl})`);
  } else {
    healthCheckLogs.push(`⚠️ OSS 地址可访问性检测未通过: ${productionProbe.error}`);
  }
  if (staticDeployResult.fixedDomain) {
    const fixedDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${staticDeployResult.fixedDomain}`;
    const fixedProbe = await runDeployProgressStep(
      s,
      {
        stage: `${stagePrefix}.health.fixed-domain`,
        message: `正在探测固定域名 ${staticDeployResult.fixedDomain}...`,
        okMessage: '✅ 固定域名探测已完成',
        data: { domain: staticDeployResult.fixedDomain, url: fixedDomainUrl }
      },
      () => probeHttpHealth(fixedDomainUrl, {
        paths: ['/'],
        maxAttempts: 20,
        intervalMs: 5000,
        timeoutMs: 8000,
        allowClientError: false
      })
    );
    if (fixedProbe.ok) {
      healthCheckLogs.push(`✅ 固定域名可访问 (${fixedProbe.statusCode} ${fixedProbe.checkedUrl})`);
    } else {
      healthCheckLogs.push(`⚠️ 固定域名检测未通过（可能 DNS/CDN 传播中）: ${fixedProbe.error}`);
    }
  }

  return {
    ...staticDeployResult,
    healthCheckLogs
  };
}

async function executeStaticPreviewDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>,
  dist: string
): Promise<StaticDeployResult | undefined> {
  const stagePrefix = 'deploy.static.preview';
  const bucketName = resolveOssBucketName(ctx.appName);
  const resolvedBucketName = resolveStaticBucketName(ctx);

  const staticPreviewResult = await withSpinner(
    s,
    '☁️ 正在部署静态预览...',
    '❌ 部署失败',
    async () => {
      // Step 1: Deploy proxy function (placeholder) to get version numbering started
      const proxyFunctionName = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.proxy.bootstrap`,
          message: '正在部署静态代理函数...',
          okMessage: (functionName) => `✅ 静态代理函数已更新: ${functionName}`,
          data: { bucketName, previewPath: '_preview/pending' }
        },
            () => deployStaticProxyFunction(
          ctx.appName,
          resolvedBucketName,
          '_preview/pending',
          ctx.project.envs
        )
      );

      // Step 2: Publish to get a version number for the OSS path
      const tempVersionId = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.version.seed`,
          message: '正在分配预览版本号...',
          okMessage: (versionId) => `✅ 已分配预览版本号: ${versionId}`
        },
        () => publishStaticProxyVersion(ctx.appName)
      );

      // Step 3: Upload to OSS using the version number as path
      const previewPath = `_preview/${tempVersionId}`;
      const url = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.upload`,
            message: `正在上传静态资源到 OSS (${previewPath})...`,
            okMessage: '✅ 预览静态资源已上传到 OSS',
          data: { dist, previewPath, bucketName: resolvedBucketName }
        },
        () => deployOSS(ctx.appName, dist, {
          targetDir: previewPath,
          bucketName: resolvedBucketName,
          allowPrivateFallback: true
        })
      );

      // Step 4: Update function with correct preview path and re-publish
      await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.proxy.finalize`,
          message: '正在更新代理函数到最终预览路径...',
          okMessage: '✅ 代理函数已切到最终预览路径',
          data: { bucketName, previewPath }
        },
            () => deployStaticProxyFunction(
          ctx.appName,
          resolvedBucketName,
          previewPath,
          ctx.project.envs
        )
      );
      const versionId = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.version.final`,
          message: '正在发布最终预览版本...',
          okMessage: (nextVersionId) => `✅ 最终预览版本已发布: ${nextVersionId}`,
          data: { previewPath }
        },
        () => publishStaticProxyVersion(ctx.appName)
      );

      // Step 5: Bind preview domain through shared workflow
      const previewResult = await runDeployProgressStep(
        s,
        {
          stage: `${stagePrefix}.domain`,
          message: `正在配置预览域名 (${ctx.domainSuffix})...`,
          okMessage: (result) => `✅ 预览域名已就绪: ${result.previewDomain}`,
          data: {
            domainSuffix: ctx.domainSuffix,
            versionId,
            enableSSL: ctx.enableSSL
          }
        },
        () => bindFunctionPreviewDomainWorkflow(ctx.appName, {
          functionName: proxyFunctionName,
          qualifier: versionId,
          domainSuffix: ctx.domainSuffix!,
          interactiveTTY: ctx.interactiveTTY,
          onConfirmWildcardDns: () => confirmPreviewWildcardDns(ctx.domainSuffix!, ctx.appName),
          enableHttps: ctx.enableSSL,
          forceSslRenew: ctx.forceSslRenew,
          spinner: s
        })
      );
      if (previewResult.wildcardResult.skipped) {
        notifyDeployProgress(s, {
          stage: `${stagePrefix}.dns`,
          message: pc.yellow('⚠️ 已跳过通配符 DNS 创建，preview 域名可能无法访问'),
          data: {
            skipped: true,
            previewDomain: previewResult.previewDomain
          }
        });
      } else if (previewResult.wildcardResult.created) {
        notifyDeployProgress(s, {
          stage: `${stagePrefix}.dns`,
          message: `✅ 通配符 DNS 已创建: ${previewResult.wildcardResult.wildcardDomain} → ${previewResult.wildcardResult.targetValue}`,
          data: {
            created: true,
            wildcardDomain: previewResult.wildcardResult.wildcardDomain,
            targetValue: previewResult.wildcardResult.targetValue
          }
        });
      }

      return {
        url,
        dist,
        bucketName: resolvedBucketName,
        previewDomain: previewResult.previewDomain,
        previewVersion: versionId
      };
    }
  );

  if (!staticPreviewResult) return undefined;

  const { url, bucketName: deployedBucketName, previewDomain, previewVersion } = staticPreviewResult;
  const healthCheckLogs: string[] = [];

  notifyDeployProgress(s, {
    stage: `${stagePrefix}.health`,
    message: '🩺 部署完成，正在做可访问性检测...'
  });
  const productionProbe = await runDeployProgressStep(
    s,
    {
      stage: `${stagePrefix}.health.oss`,
      message: '正在探测 OSS 地址...',
      okMessage: '✅ OSS 地址探测已完成',
      data: { url }
    },
    () => probeHttpHealth(url, {
      paths: [''],
      maxAttempts: 5,
      intervalMs: 1500,
      timeoutMs: 5000,
      allowClientError: false
    })
  );
  if (productionProbe.ok) {
    healthCheckLogs.push(`✅ OSS 地址可访问 (${productionProbe.statusCode} ${productionProbe.checkedUrl})`);
  } else {
    healthCheckLogs.push(`⚠️ OSS 地址可访问性检测未通过: ${productionProbe.error}`);
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
    dist,
    bucketName: deployedBucketName,
    previewDomain,
    previewVersion,
    healthCheckLogs
  };
}
