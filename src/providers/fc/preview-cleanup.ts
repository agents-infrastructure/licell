import * as $FC from '@alicloud/fc20230330';
import { Config } from '../../utils/config';
import { isNotFoundError } from '../../utils/alicloud-error';
import { withRetry } from '../../utils/retry';
import { createFcClient } from './client';
import { resolveOssBucketName, listOssObjects } from '../oss';
import OSSClient, * as $OSS from '@alicloud/oss20190517';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { resolveSdkCtor } from '../../utils/sdk';

const OssClientCtor = resolveSdkCtor<OSSClient>(OSSClient, '@alicloud/oss20190517');

export interface PreviewPruneResult {
  keep: number;
  totalPreviewDomains: number;
  candidates: string[];
  deletedDomains: string[];
  deletedOssPaths: string[];
  failed: Array<{ domain: string; reason: string }>;
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
  return { auth, client, runtime };
}

async function listPreviewCustomDomains(appName: string): Promise<string[]> {
  const { client: fcClient } = createFcClient();
  const previewDomains: string[] = [];
  const previewPattern = new RegExp(`^${appName}-preview-v\\d+\\.`);

  let nextToken: string | undefined;
  while (true) {
    const response = await withRetry(() => fcClient.listCustomDomains(new $FC.ListCustomDomainsRequest({
      limit: 100,
      nextToken
    })));

    const domains = response.body?.customDomains || [];
    for (const domain of domains) {
      const domainName = domain.domainName;
      if (domainName && previewPattern.test(domainName)) {
        previewDomains.push(domainName);
      }
    }

    nextToken = response.body?.nextToken;
    if (!nextToken || domains.length === 0) break;
  }

  return previewDomains;
}

function extractVersionFromPreviewDomain(domain: string, appName: string): number | null {
  const match = domain.match(new RegExp(`^${appName}-preview-v(\\d+)\\.`));
  if (!match) return null;
  return parseInt(match[1], 10);
}

async function deleteCustomDomain(fcClient: any, domainName: string): Promise<void> {
  try {
    await withRetry(() => fcClient.deleteCustomDomain(domainName));
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
  }
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
      deletedCount++;
    } catch (err: unknown) {
      if (!isNotFoundError(err)) throw err;
    }
  }

  return deletedCount;
}

export async function prunePreviewDomains(
  appName: string,
  keep: number,
  apply: boolean
): Promise<PreviewPruneResult> {
  const previewDomains = await listPreviewCustomDomains(appName);

  // Sort by version number descending (newest first)
  const sortedDomains = previewDomains
    .map(domain => ({
      domain,
      version: extractVersionFromPreviewDomain(domain, appName)
    }))
    .filter(item => item.version !== null)
    .sort((a, b) => (b.version || 0) - (a.version || 0));

  const toKeep = sortedDomains.slice(0, keep);
  const toDelete = sortedDomains.slice(keep);

  const result: PreviewPruneResult = {
    keep,
    totalPreviewDomains: previewDomains.length,
    candidates: toDelete.map(item => item.domain),
    deletedDomains: [],
    deletedOssPaths: [],
    failed: []
  };

  if (!apply) {
    return result;
  }

  const bucketName = resolveOssBucketName(appName);
  const { client: fcClient } = createFcClient();

  for (const item of toDelete) {
    try {
      // Delete FC custom domain
      await deleteCustomDomain(fcClient, item.domain);
      result.deletedDomains.push(item.domain);

      // Delete OSS preview path if exists
      // The OSS path uses version N-1 (first publish), while domain uses version N (second publish)
      // Try both the version and version-1 to handle the two-publish flow
      if (item.version !== null) {
        for (const v of [item.version, item.version - 1]) {
          if (v <= 0) continue;
          const previewPath = `_preview/${v}/`;
          try {
            const deletedCount = await deleteOssPreviewPath(bucketName, previewPath);
            if (deletedCount > 0) {
              result.deletedOssPaths.push(previewPath);
            }
          } catch {
            // OSS cleanup is best-effort
          }
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
