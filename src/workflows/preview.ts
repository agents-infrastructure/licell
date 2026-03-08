import OSSClient, * as $OSS from '@alicloud/oss20190517';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { Config } from '../utils/config';
import type { Spinner } from '../utils/errors';
import { isNotFoundError } from '../utils/alicloud-error';
import { withRetry } from '../utils/retry';
import { resolveSdkCtor } from '../utils/sdk';
import { ensureWildcardCname, type WildcardCnameResult } from '../providers/dns';
import { listOssObjects, resolveOssBucketName } from '../providers/oss';
import { listFnCustomDomains, removeFnCustomDomain, resolveDefaultFcGatewayDomain } from '../providers/fc';
import { issueAndBindSSLWithArtifacts } from '../providers/ssl';
import { bindCustomDomain } from './domain';
import { buildPreviewDomain, extractPreviewVersionFromDomain } from '../utils/preview-domain';

const OssClientCtor = resolveSdkCtor<OSSClient>(OSSClient, '@alicloud/oss20190517');

const NOOP_SPINNER: Spinner = {
  start() {},
  stop() {},
  message() {}
};

function resolveWorkflowSpinner(spinner?: Spinner) {
  return spinner || NOOP_SPINNER;
}

function createOssClient() {
  const auth = Config.requireAuth();
  const client = new OssClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region,
    endpoint: `oss-${auth.region}.aliyuncs.com`
  }));
  const runtime = new $Util.RuntimeOptions({
    connectTimeout: 8000,
    readTimeout: 120000
  });
  return { client, runtime };
}

export interface BindFunctionPreviewDomainWorkflowOptions {
  functionName: string;
  qualifier: string;
  domainSuffix: string;
  interactiveTTY: boolean;
  onConfirmWildcardDns?: () => Promise<boolean>;
  skipWildcardConfirm?: boolean;
  enableHttps?: boolean;
  forceSslRenew?: boolean;
  spinner?: Spinner;
  path?: string;
  protocol?: string;
}

export interface BindFunctionPreviewDomainWorkflowResult {
  previewDomain: string;
  functionName: string;
  qualifier: string;
  targetFcDomain: string;
  wildcardResult: WildcardCnameResult;
  httpsConfigured: boolean;
  finalUrl: string;
}

export interface PreviewPruneResult {
  keep: number;
  totalPreviewDomains: number;
  candidates: string[];
  deletedDomains: string[];
  deletedOssPaths: string[];
  failed: Array<{ domain: string; reason: string }>;
}

async function listPreviewCustomDomains(appName: string): Promise<string[]> {
  const domains = await listFnCustomDomains(2000);
  return domains
    .map((domain) => domain.domainName)
    .filter((domainName) => extractPreviewVersionFromDomain(domainName, appName) !== null);
}

async function deleteOssPreviewPath(bucketName: string, previewPath: string): Promise<number> {
  const { client, runtime } = createOssClient();
  const objects = await listOssObjects(bucketName, previewPath, 1000);
  let deletedCount = 0;

  for (const obj of objects) {
    try {
      await withRetry(() => client.deleteObjectWithOptions(
        bucketName,
        obj.name,
        new $OSS.DeleteObjectRequest({}),
        {},
        runtime
      ));
      deletedCount += 1;
    } catch (err: unknown) {
      if (!isNotFoundError(err)) throw err;
    }
  }

  return deletedCount;
}

export async function bindFunctionPreviewDomainWorkflow(
  appName: string,
  options: BindFunctionPreviewDomainWorkflowOptions
): Promise<BindFunctionPreviewDomainWorkflowResult> {
  const spinner = resolveWorkflowSpinner(options.spinner);
  const previewDomain = buildPreviewDomain(appName, options.qualifier, options.domainSuffix);
  const targetFcDomain = resolveDefaultFcGatewayDomain();

  const wildcardResult = await ensureWildcardCname(options.domainSuffix, targetFcDomain, {
    interactiveTTY: options.interactiveTTY,
    skipConfirm: Boolean(options.skipWildcardConfirm),
    onConfirm: options.onConfirmWildcardDns
  });

  await bindCustomDomain(previewDomain, targetFcDomain, options.qualifier, {
    functionName: options.functionName,
    skipDnsBind: true,
    path: options.path,
    protocol: options.protocol
  });

  let httpsConfigured = false;
  if (options.enableHttps) {
    spinner.message(`预览域名绑定完成，正在签发 HTTPS 证书 (${previewDomain})...`);
    await issueAndBindSSLWithArtifacts(previewDomain, spinner, { forceRenew: Boolean(options.forceSslRenew) });
    httpsConfigured = true;
  }

  return {
    previewDomain,
    functionName: options.functionName,
    qualifier: options.qualifier,
    targetFcDomain,
    wildcardResult,
    httpsConfigured,
    finalUrl: `${httpsConfigured ? 'https' : 'http'}://${previewDomain}`
  };
}

export async function prunePreviewDomainsWorkflow(
  appName: string,
  keep: number,
  apply: boolean
): Promise<PreviewPruneResult> {
  const previewDomains = await listPreviewCustomDomains(appName);

  const sortedDomains = previewDomains
    .map((domain) => ({
      domain,
      version: extractPreviewVersionFromDomain(domain, appName)
    }))
    .filter((item): item is { domain: string; version: number } => item.version !== null)
    .sort((a, b) => b.version - a.version);

  const toDelete = sortedDomains.slice(keep);

  const result: PreviewPruneResult = {
    keep,
    totalPreviewDomains: previewDomains.length,
    candidates: toDelete.map((item) => item.domain),
    deletedDomains: [],
    deletedOssPaths: [],
    failed: []
  };

  if (!apply) {
    return result;
  }

  const bucketName = resolveOssBucketName(appName);

  for (const item of toDelete) {
    try {
      await removeFnCustomDomain(item.domain);
      result.deletedDomains.push(item.domain);

      for (const version of [item.version, item.version - 1]) {
        if (version <= 0) continue;
        const previewPath = `_preview/${version}/`;
        try {
          const deletedCount = await deleteOssPreviewPath(bucketName, previewPath);
          if (deletedCount > 0) {
            result.deletedOssPaths.push(previewPath);
          }
        } catch {
          // OSS cleanup is best-effort.
        }
      }
    } catch (err: unknown) {
      result.failed.push({
        domain: item.domain,
        reason: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return result;
}
