import { confirm, text, isCancel, type spinner } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { deployOSS, resolveOssBucketName } from '../providers/oss';
import { enableCdnForDomain } from '../providers/cdn';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { probeHttpHealth } from '../utils/health-check';
import { detectStaticDistDir } from '../utils/static-dist';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import { ensureWildcardCname } from '../providers/domain';
import {
  deployStaticProxyFunction,
  publishStaticProxyVersion,
  resolveStaticProxyFunctionName
} from '../providers/fc/static-proxy';
import type { DeployContext } from './deploy-context';

export interface StaticDeployResult {
  url: string;
  fixedDomain?: string;
  previewDomain?: string;
  previewVersion?: string;
  healthCheckLogs: string[];
}

function resolveStaticFixedDomain(ctx: DeployContext) {
  if (ctx.cliDomain) return ctx.cliDomain;
  if (ctx.domainSuffix) return `${ctx.appName}.${ctx.domainSuffix}`;
  return undefined;
}

function resolveOriginDomain(url: string) {
  try {
    return new URL(url).host;
  } catch {
    throw new Error(`无法解析 OSS 源站域名: ${url}`);
  }
}

export async function executeStaticDeploy(
  ctx: DeployContext,
  s: ReturnType<typeof spinner>
): Promise<StaticDeployResult | undefined> {
  const detectedDist = detectStaticDistDir();
  const dist = ctx.cliDist
    ? toPromptValue(ctx.cliDist, '构建产物目录')
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
      const url = await deployOSS(ctx.appName, dist);
      if (!fixedDomain) {
        return { url, fixedDomain: undefined };
      }

      const originDomain = resolveOriginDomain(url);
      let sslArtifacts: { certificate?: string; privateKey?: string } | undefined;
      if (ctx.enableSSL) {
        s.message(`静态资源上传完成，正在签发 HTTPS 证书 (${fixedDomain})...`);
        const sslResult = await issueAndBindSSLWithArtifacts(fixedDomain, s, {
          forceRenew: ctx.forceSslRenew,
          bindToFcDomain: false
        });
        sslArtifacts = {
          certificate: sslResult.certificate,
          privateKey: sslResult.privateKey
        };
      }

      s.message(`静态资源上传完成，正在接入 CDN 并回源 OSS (${fixedDomain})...`);
      const cdnResult = await enableCdnForDomain(fixedDomain, originDomain, {
        ...sslArtifacts,
        sourceType: 'oss'
      });
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
      return { url, fixedDomain };
    }
  );
  if (!staticDeployResult) return undefined;

  const { url } = staticDeployResult;
  const healthCheckLogs: string[] = [];
  s.message('🩺 部署完成，正在做可访问性检测...');
  const productionProbe = await probeHttpHealth(url, {
    paths: ['/'],
    maxAttempts: 5,
    intervalMs: 1500,
    timeoutMs: 5000,
    allowClientError: false
  });
  if (productionProbe.ok) {
    healthCheckLogs.push(`✅ OSS 地址可访问 (${productionProbe.statusCode} ${productionProbe.checkedUrl})`);
  } else {
    healthCheckLogs.push(`⚠️ OSS 地址可访问性检测未通过: ${productionProbe.error}`);
  }
  if (staticDeployResult.fixedDomain) {
    const fixedDomainUrl = `${ctx.enableSSL ? 'https' : 'http'}://${staticDeployResult.fixedDomain}`;
    const fixedProbe = await probeHttpHealth(fixedDomainUrl, {
      paths: ['/'],
      maxAttempts: ctx.enableCdn ? 10 : 6,
      intervalMs: ctx.enableCdn ? 3000 : 2000,
      timeoutMs: ctx.enableCdn ? 6000 : 5000,
      allowClientError: false
    });
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
  const auth = Config.requireAuth();
  const bucketName = resolveOssBucketName(ctx.appName);
  const fcOriginDomain = `${auth.accountId}.${auth.region}.fc.aliyuncs.com`;

  const staticPreviewResult = await withSpinner(
    s,
    '☁️ 正在部署静态预览...',
    '❌ 部署失败',
    async () => {
      // Step 1: Deploy proxy function (placeholder) to get version numbering started
      s.message('正在部署静态代理函数...');
      const proxyFunctionName = await deployStaticProxyFunction(
        ctx.appName,
        bucketName,
        '_preview/pending'
      );

      // Step 2: Publish to get a version number for the OSS path
      s.message('正在分配预览版本号...');
      const tempVersionId = await publishStaticProxyVersion(ctx.appName);

      // Step 3: Upload to OSS using the version number as path
      const previewPath = `_preview/${tempVersionId}`;
      s.message(`正在上传静态资源到 OSS (${previewPath})...`);
      const url = await deployOSS(ctx.appName, dist, { targetDir: previewPath });

      // Step 4: Update function with correct preview path and re-publish
      s.message('正在更新代理函数并发布最终版本...');
      await deployStaticProxyFunction(
        ctx.appName,
        bucketName,
        previewPath
      );
      const versionId = await publishStaticProxyVersion(ctx.appName);

      // Step 5: Generate preview domain
      const previewDomain = `${ctx.appName}-preview-v${versionId}.${ctx.domainSuffix}`;

      // Step 6: Ensure wildcard DNS
      s.message(`正在确保通配符 DNS (*.${ctx.domainSuffix}) 存在...`);
      const wildcardResult = await ensureWildcardCname(
        ctx.domainSuffix!,
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

      // Step 7: Bind custom domain for static proxy
      s.message(`正在绑定预览域名 ${previewDomain}...`);
      await bindCustomDomainForStaticProxy(
        previewDomain,
        fcOriginDomain,
        proxyFunctionName,
        versionId
      );

      // Step 8: Issue SSL if enabled
      if (ctx.enableSSL) {
        s.message(`预览域名绑定完成，正在签发 HTTPS 证书 (${previewDomain})...`);
        await issueAndBindSSLWithArtifacts(previewDomain, s, { forceRenew: ctx.forceSslRenew });
      }

      return {
        url,
        previewDomain,
        previewVersion: versionId
      };
    }
  );

  if (!staticPreviewResult) return undefined;

  const { url, previewDomain, previewVersion } = staticPreviewResult;
  const healthCheckLogs: string[] = [];

  s.message('🩺 部署完成，正在做可访问性检测...');
  const productionProbe = await probeHttpHealth(url, {
    paths: ['/'],
    maxAttempts: 5,
    intervalMs: 1500,
    timeoutMs: 5000,
    allowClientError: false
  });
  if (productionProbe.ok) {
    healthCheckLogs.push(`✅ OSS 地址可访问 (${productionProbe.statusCode} ${productionProbe.checkedUrl})`);
  } else {
    healthCheckLogs.push(`⚠️ OSS 地址可访问性检测未通过: ${productionProbe.error}`);
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
    previewDomain,
    previewVersion,
    healthCheckLogs
  };
}

async function bindCustomDomainForStaticProxy(
  domainName: string,
  targetFcDomain: string,
  functionName: string,
  versionId: string
) {
  const { createSharedFcClient } = await import('../utils/sdk');
  const $FC = await import('@alicloud/fc20230330');
  const { isConflictError } = await import('../utils/alicloud-error');

  const { client: fcClient } = createSharedFcClient();

  const routeConfig = {
    routes: [{
      path: '/*',
      functionName,
      qualifier: versionId
    }]
  };

  const domainInput = new $FC.CreateCustomDomainInput({
    domainName,
    protocol: 'HTTP',
    routeConfig
  });

  try {
    await fcClient.createCustomDomain(new $FC.CreateCustomDomainRequest({
      body: domainInput
    }));
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    await fcClient.updateCustomDomain(domainName, new $FC.UpdateCustomDomainRequest({
      body: new $FC.UpdateCustomDomainInput({ routeConfig })
    }));
  }
}
