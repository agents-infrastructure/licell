import OSS from 'ali-oss';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import mime from 'mime-types';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { isConflictError, isAccessDeniedError } from '../utils/alicloud-error';
import { createPool } from '../utils/concurrency';

const UPLOAD_CONCURRENCY = 10;

export interface OssBucketSummary {
  name: string;
  location?: string;
  creationDate?: string;
  extranetEndpoint?: string;
  intranetEndpoint?: string;
}

export interface OssObjectSummary {
  name: string;
  size?: number;
  lastModified?: string;
  etag?: string;
  type?: string;
  storageClass?: string;
}

function createOssClient() {
  const auth = Config.requireAuth();
  const client = new OSS({
    region: `oss-${auth.region}`,
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk
  });
  return { auth, client };
}

function isPublicBucketAclBlockedError(err: unknown) {
  if (!isAccessDeniedError(err)) return false;
  const message = String((err as { message?: unknown })?.message || '').toLowerCase();
  return message.includes('put public bucket acl is not allowed');
}

export async function deployOSS(appName: string, distDir: string) {
  const { auth, client } = createOssClient();
  if (!existsSync(distDir) || !statSync(distDir).isDirectory()) {
    throw new Error(`静态产物目录不存在或不可读: ${distDir}`);
  }
  const bucket = `licell-${appName}-${auth.accountId.substring(0, 4)}`.toLowerCase();

  try {
    await client.putBucket(bucket);
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    try {
      await client.getBucketInfo(bucket);
    } catch (infoErr: unknown) {
      if (isAccessDeniedError(infoErr)) {
        throw new Error(`OSS Bucket 已被占用且当前账号无权限访问: ${bucket}，请更换 appName 后重试`);
      }
      throw infoErr;
    }
  }
  let skippedPublicAcl = false;
  try {
    await client.putBucketACL(bucket, 'public-read');
  } catch (err: unknown) {
    if (isPublicBucketAclBlockedError(err)) {
      // Some accounts enforce "block public access". Keep bucket private and rely on CDN-origin access.
      // Static deploy with custom domain can still work via CDN source type=oss.
      skippedPublicAcl = true;
    }
    if (!skippedPublicAcl && isAccessDeniedError(err)) {
      throw new Error(`OSS Bucket 无权限修改 ACL: ${bucket}，请确认该 Bucket 属于当前账号并可写`);
    }
    if (!skippedPublicAcl) throw err;
  }

  client.useBucket(bucket);
  const pool = createPool(UPLOAD_CONCURRENCY);

  async function uploadDir(dir: string) {
    const promises: Promise<unknown>[] = [];
    for (const file of readdirSync(dir)) {
      const fullPath = join(dir, file);
      if (statSync(fullPath).isDirectory()) {
        promises.push(uploadDir(fullPath));
      } else {
        const objectName = relative(distDir, fullPath).replace(/\\/g, '/');
        const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
        promises.push(pool(() => client.put(objectName, fullPath, { headers: { 'Content-Type': mimeType } })));
      }
    }
    await Promise.all(promises);
  }

  await uploadDir(distDir);
  return `https://${bucket}.oss-${auth.region}.aliyuncs.com`;
}

export async function listOssBuckets(limit = 200): Promise<OssBucketSummary[]> {
  const { client } = createOssClient();
  const raw = await client.listBuckets({});
  const buckets = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { buckets?: unknown }).buckets)
      ? (raw as { buckets: OSS.Bucket[] }).buckets
      : [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  return buckets.slice(0, safeLimit).map((bucket) => ({
    name: bucket.name,
    location: bucket.region,
    creationDate: bucket.creationDate,
    extranetEndpoint: undefined,
    intranetEndpoint: undefined
  })).filter((bucket) => bucket.name.length > 0);
}

export async function getOssBucketInfo(bucketName: string): Promise<OssBucketSummary> {
  const { client } = createOssClient();
  const normalized = bucketName.trim();
  if (!normalized) throw new Error('bucket 名称不能为空');
  const response = await client.getBucketInfo(normalized);
  const bucket = (response?.bucket || {}) as Record<string, unknown>;
  const name = typeof bucket.name === 'string'
    ? bucket.name
    : typeof bucket.Name === 'string'
      ? bucket.Name
      : normalized;
  return {
    name,
    location: typeof bucket.location === 'string'
      ? bucket.location
      : typeof bucket.Location === 'string'
        ? bucket.Location
        : undefined,
    creationDate: typeof bucket.creationDate === 'string'
      ? bucket.creationDate
      : typeof bucket.CreationDate === 'string'
        ? bucket.CreationDate
        : undefined,
    extranetEndpoint: typeof bucket.extranetEndpoint === 'string'
      ? bucket.extranetEndpoint
      : typeof bucket.ExtranetEndpoint === 'string'
        ? bucket.ExtranetEndpoint
        : undefined,
    intranetEndpoint: typeof bucket.intranetEndpoint === 'string'
      ? bucket.intranetEndpoint
      : typeof bucket.IntranetEndpoint === 'string'
        ? bucket.IntranetEndpoint
        : undefined
  };
}

export async function listOssObjects(bucketName: string, prefix?: string, limit = 200): Promise<OssObjectSummary[]> {
  const { client } = createOssClient();
  const normalized = bucketName.trim();
  if (!normalized) throw new Error('bucket 名称不能为空');
  client.useBucket(normalized);

  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 2000));
  const pageSize = Math.min(1000, safeLimit);
  const objects: OssObjectSummary[] = [];
  let marker: string | undefined;
  while (objects.length < safeLimit) {
    const response = await client.list({
      prefix,
      marker,
      'max-keys': pageSize
    }, {});
    const rows = response.objects || [];
    for (const row of rows) {
      const name = row.name;
      if (!name) continue;
      objects.push({
        name,
        size: row.size,
        lastModified: row.lastModified,
        etag: row.etag,
        type: row.type,
        storageClass: row.storageClass
      });
      if (objects.length >= safeLimit) break;
    }
    marker = response.nextMarker;
    if (!marker || rows.length === 0) break;
  }
  return objects;
}
