import { text, type spinner } from '@clack/prompts';
import { deployOSS } from '../providers/oss';
import { enableCdnForDomain } from '../providers/cdn';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { probeHttpHealth } from '../utils/health-check';
import { detectStaticDistDir } from '../utils/static-dist';
import { toPromptValue, withSpinner } from '../utils/cli-shared';
import type { DeployContext } from './deploy-context';

export interface StaticDeployResult {
  url: string;
  fixedDomain?: string;
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
