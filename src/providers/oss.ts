import OSSClient, * as $OSS from '@alicloud/oss20190517';
import * as $OpenApi from '@alicloud/openapi-client';
import openapiUtilModule from '@alicloud/openapi-util';

// Resolve CJS/ESM interop: bun bundler may wrap default export as { default: [class] }
const openapiUtil = (() => {
  const m = openapiUtilModule as unknown as Record<string, unknown>;
  if (typeof m?.query === 'function') return m as unknown as typeof openapiUtilModule;
  if (typeof (m?.default as Record<string, unknown>)?.query === 'function') return m.default as unknown as typeof openapiUtilModule;
  throw new Error('Cannot resolve @alicloud/openapi-util');
})();
import * as $Util from '@alicloud/tea-util';
import { createReadStream, existsSync, lstatSync, readdirSync, realpathSync, statSync } from 'fs';
import { isAbsolute, join, relative } from 'path';
import mime from 'mime-types';
import { Config } from '../utils/config';
import { isConflictError, isAccessDeniedError, isNotFoundError, isTransientError } from '../utils/alicloud-error';
import { createPool } from '../utils/concurrency';
import { withRetry } from '../utils/retry';
import { resolveSdkCtor } from '../utils/sdk';

const UPLOAD_CONCURRENCY = 10;
const OSS_CONNECT_TIMEOUT_MS = 8_000;
const OSS_READ_TIMEOUT_MS = 120_000;
const OssClientCtor = resolveSdkCtor<OSSClient>(OSSClient, '@alicloud/oss20190517');
const DEFAULT_OSS_CONTENT_TYPE = 'application/octet-stream';

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

export interface OssUploadDirectoryResult {
  bucket: string;
  targetDir?: string;
  uploadedCount: number;
  baseUrl: string;
  skippedSymlinkCount: number;
}

export interface OssBucketCleanupResult {
  bucket: string;
  deletedObjects: number;
  deletedBucket: boolean;
}

interface OssUploadCandidate {
  sourceFile: string;
  objectName: string;
}

export interface CollectOssUploadFilesResult {
  sourceRoot: string;
  files: OssUploadCandidate[];
  skippedSymlinkCount: number;
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
    connectTimeout: OSS_CONNECT_TIMEOUT_MS,
    readTimeout: OSS_READ_TIMEOUT_MS
  });
  return { auth, client, runtime };
}

function isPublicBucketAclBlockedError(err: unknown) {
  if (!isAccessDeniedError(err)) return false;
  const message = String((err as { message?: unknown })?.message || '').toLowerCase();
  return message.includes('put public bucket acl is not allowed');
}

function isOssEmptyXmlResponseError(err: unknown) {
  const message = String((err as { message?: unknown })?.message || '').toLowerCase();
  if (!message.includes('not a valid value for parameter')) return false;
  const stack = String((err as { stack?: unknown })?.stack || '').toLowerCase();
  return stack.includes('gateway-oss') || stack.includes('darabonba-map');
}

async function assertBucketAccessible(
  client: InstanceType<typeof OssClientCtor>,
  bucket: string,
  runtime: $Util.RuntimeOptions
) {
  try {
    await client.getBucketInfoWithOptions(bucket, {}, runtime);
  } catch (infoErr: unknown) {
    if (isAccessDeniedError(infoErr)) {
      throw new Error(`OSS Bucket 已被占用且当前账号无权限访问: ${bucket}，请更换 appName 后重试`);
    }
    throw infoErr;
  }
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function parseBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toOptionalStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

type OssRawBody = Record<string, unknown>;

async function listBucketsRaw(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  options: { marker?: string; maxKeys: number }
): Promise<{ rows: OssRawBody[]; nextMarker?: string; isTruncated: boolean }> {
  const request = new $OpenApi.OpenApiRequest({
    headers: {},
    query: openapiUtil.query({
      ...(options.marker ? { marker: options.marker } : {}),
      'max-keys': options.maxKeys
    })
  });
  const params = new $OpenApi.Params({
    action: 'ListBuckets',
    version: '2019-05-17',
    protocol: 'HTTPS',
    pathname: '/',
    method: 'GET',
    authType: 'AK',
    style: 'ROA',
    reqBodyType: 'xml',
    bodyType: 'xml'
  });
  const response = await client.execute(params, request, runtime) as { body?: OssRawBody };
  const body = response.body || {};
  const bucketsContainer = (body.Buckets as OssRawBody | undefined)
    || (body.buckets as OssRawBody | undefined)
    || {};
  const rows = toArray((bucketsContainer.Bucket as OssRawBody | OssRawBody[] | undefined)
    || (bucketsContainer.bucket as OssRawBody | OssRawBody[] | undefined));
  return {
    rows,
    nextMarker: toOptionalStringValue(body.NextMarker) || toOptionalStringValue(body.nextMarker),
    isTruncated: parseBool(body.IsTruncated ?? body.isTruncated)
  };
}

async function listObjectsV2Raw(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string,
  options: { prefix?: string; continuationToken?: string; maxKeys: number }
): Promise<{ rows: OssRawBody[]; nextContinuationToken?: string; isTruncated: boolean }> {
  const request = new $OpenApi.OpenApiRequest({
    hostMap: { bucket },
    headers: {},
    query: openapiUtil.query({
      ...(options.prefix ? { prefix: options.prefix } : {}),
      ...(options.continuationToken ? { 'continuation-token': options.continuationToken } : {}),
      'max-keys': options.maxKeys
    })
  });
  const params = new $OpenApi.Params({
    action: 'ListObjectsV2',
    version: '2019-05-17',
    protocol: 'HTTPS',
    pathname: '/?list-type=2',
    method: 'GET',
    authType: 'AK',
    style: 'ROA',
    reqBodyType: 'xml',
    bodyType: 'xml'
  });
  const response = await client.execute(params, request, runtime) as { body?: OssRawBody };
  const body = response.body || {};
  const rows = toArray((body.Contents as OssRawBody | OssRawBody[] | undefined)
    || (body.contents as OssRawBody | OssRawBody[] | undefined));
  return {
    rows,
    nextContinuationToken: toOptionalStringValue(body.NextContinuationToken)
      || toOptionalStringValue(body.nextContinuationToken),
    isTruncated: parseBool(body.IsTruncated ?? body.isTruncated)
  };
}

export function normalizeOssTargetDir(targetDir?: string) {
  if (!targetDir) return undefined;
  const normalized = targetDir
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');
  return normalized.length > 0 ? normalized : undefined;
}

export function buildOssObjectKey(relativeFilePath: string, targetDir?: string) {
  const normalizedPath = relativeFilePath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!normalizedPath || normalizedPath === '.') {
    throw new Error('对象路径不能为空');
  }
  const prefix = normalizeOssTargetDir(targetDir);
  return prefix ? `${prefix}/${normalizedPath}` : normalizedPath;
}

export function collectOssUploadFiles(sourceDir: string, targetDir?: string): CollectOssUploadFilesResult {
  if (!existsSync(sourceDir) || !statSync(sourceDir).isDirectory()) {
    throw new Error(`本地目录不存在或不可读: ${sourceDir}`);
  }
  const sourceRoot = realpathSync(sourceDir);
  const normalizedTargetDir = normalizeOssTargetDir(targetDir);
  const visitedDirectories = new Set<string>([sourceRoot]);
  const files: OssUploadCandidate[] = [];
  let skippedSymlinkCount = 0;

  function walk(dirPath: string) {
    for (const fileName of readdirSync(dirPath)) {
      const fullPath = join(dirPath, fileName);
      const stats = lstatSync(fullPath);

      if (stats.isSymbolicLink()) {
        skippedSymlinkCount += 1;
        continue;
      }

      if (stats.isDirectory()) {
        const realDir = realpathSync(fullPath);
        if (visitedDirectories.has(realDir)) continue;
        visitedDirectories.add(realDir);
        walk(realDir);
        continue;
      }

      if (!stats.isFile()) continue;
      const relativePath = relative(sourceRoot, fullPath).replace(/\\/g, '/');
      if (!relativePath || relativePath === '.' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
        throw new Error(`检测到越界路径，已拒绝上传: ${fullPath}`);
      }
      files.push({
        sourceFile: fullPath,
        objectName: buildOssObjectKey(relativePath, normalizedTargetDir)
      });
    }
  }

  walk(sourceRoot);
  return {
    sourceRoot,
    files,
    skippedSymlinkCount
  };
}

export function resolveOssContentType(sourceFile: string, objectName?: string) {
  const byObjectName = objectName ? mime.lookup(objectName) : false;
  const bySourceFile = mime.lookup(sourceFile);
  const detected = byObjectName || bySourceFile;
  if (!detected) return DEFAULT_OSS_CONTENT_TYPE;
  const withCharset = mime.contentType(detected);
  return withCharset ? String(withCharset) : String(detected);
}

export async function uploadDirectoryToBucket(
  bucketName: string,
  sourceDir: string,
  options?: { targetDir?: string; concurrency?: number }
): Promise<OssUploadDirectoryResult> {
  const { auth, client, runtime } = createOssClient();
  const normalizedBucket = bucketName.trim();
  if (!normalizedBucket) throw new Error('bucket 名称不能为空');
  const targetDir = normalizeOssTargetDir(options?.targetDir);
  const collected = collectOssUploadFiles(sourceDir, targetDir);
  const concurrency = Number.isFinite(options?.concurrency)
    && Number((options?.concurrency || 0)) > 0
    ? Math.floor(Number(options?.concurrency))
    : UPLOAD_CONCURRENCY;
  const pool = createPool(concurrency);
  await Promise.all(
    collected.files.map((file) => pool(async () => {
      const contentType = resolveOssContentType(file.sourceFile, file.objectName);
      await withRetry(
        () => client.putObjectWithOptions(
          normalizedBucket,
          file.objectName,
          new $OSS.PutObjectRequest({
            body: createReadStream(file.sourceFile)
          }),
          new $OSS.PutObjectHeaders({
            commonHeaders: {
              'content-type': contentType
            }
          }),
          runtime
        ),
        {
          maxAttempts: 4,
          baseDelayMs: 1000,
          shouldRetry: isTransientError
        }
      );
    }))
  );

  return {
    bucket: normalizedBucket,
    targetDir,
    uploadedCount: collected.files.length,
    baseUrl: `https://${normalizedBucket}.oss-${auth.region}.aliyuncs.com`,
    skippedSymlinkCount: collected.skippedSymlinkCount
  };
}

export async function deployOSS(appName: string, distDir: string, options?: { targetDir?: string }) {
  const { auth, client, runtime } = createOssClient();
  const bucket = `licell-${appName}-${auth.accountId.substring(0, 4)}`.toLowerCase();

  try {
    await client.putBucketWithOptions(
      bucket,
      new $OSS.PutBucketRequest({}),
      new $OSS.PutBucketHeaders({}),
      runtime
    );
  } catch (err: unknown) {
    // OSS OpenAPI currently may throw parse errors for empty XML responses even when bucket creation succeeds.
    if (!isConflictError(err) && !isOssEmptyXmlResponseError(err)) throw err;
    await assertBucketAccessible(client, bucket, runtime);
  }
  let skippedPublicAcl = false;
  try {
    await client.putBucketAclWithOptions(
      bucket,
      new $OSS.PutBucketAclHeaders({ acl: 'public-read' }),
      runtime
    );
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

  const uploadResult = await uploadDirectoryToBucket(bucket, distDir, { targetDir: options?.targetDir });
  return uploadResult.baseUrl;
}

export function resolveOssBucketName(appName: string) {
  const auth = Config.requireAuth();
  return `licell-${appName}-${auth.accountId.substring(0, 4)}`.toLowerCase();
}

export async function listOssBuckets(limit = 200): Promise<OssBucketSummary[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  const pageSize = Math.min(100, safeLimit);
  const { client, runtime } = createOssClient();
  const buckets: OssBucketSummary[] = [];
  let marker: string | undefined;
  while (buckets.length < safeLimit) {
    const response = await listBucketsRaw(client, runtime, {
      marker,
      maxKeys: pageSize
    });
    const rows = response.rows;
    for (const bucket of rows) {
      const name = toOptionalStringValue(bucket.Name)
        || toOptionalStringValue(bucket.name)
        || '';
      if (!name) continue;
      buckets.push({
        name,
        location: toOptionalStringValue(bucket.Region)
          || toOptionalStringValue(bucket.region)
          || toOptionalStringValue(bucket.Location)
          || toOptionalStringValue(bucket.location),
        creationDate: toOptionalStringValue(bucket.CreationDate)
          || toOptionalStringValue(bucket.creationDate),
        extranetEndpoint: toOptionalStringValue(bucket.ExtranetEndpoint)
          || toOptionalStringValue(bucket.extranetEndpoint),
        intranetEndpoint: toOptionalStringValue(bucket.IntranetEndpoint)
          || toOptionalStringValue(bucket.intranetEndpoint)
      });
      if (buckets.length >= safeLimit) break;
    }
    marker = response.nextMarker;
    if (!response.isTruncated || !marker || rows.length === 0) break;
  }
  return buckets;
}

export async function getOssBucketInfo(bucketName: string): Promise<OssBucketSummary> {
  const { client, runtime } = createOssClient();
  const normalized = bucketName.trim();
  if (!normalized) throw new Error('bucket 名称不能为空');
  const response = await client.getBucketInfoWithOptions(
    normalized,
    {},
    runtime
  );
  const bucket = response.body?.bucket;
  const name = bucket?.name || normalized;
  return {
    name,
    location: bucket?.location,
    creationDate: bucket?.creationDate,
    extranetEndpoint: bucket?.extranetEndpoint,
    intranetEndpoint: bucket?.intranetEndpoint
  };
}

export async function listOssObjects(bucketName: string, prefix?: string, limit = 200): Promise<OssObjectSummary[]> {
  const { client, runtime } = createOssClient();
  const normalized = bucketName.trim();
  if (!normalized) throw new Error('bucket 名称不能为空');

  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 2000));
  const pageSize = Math.min(1000, safeLimit);
  const objects: OssObjectSummary[] = [];
  let continuationToken: string | undefined;
  while (objects.length < safeLimit) {
    const response = await listObjectsV2Raw(client, runtime, normalized, {
      prefix,
      continuationToken,
      maxKeys: pageSize
    });
    const rows = response.rows;
    for (const row of rows) {
      const name = toOptionalStringValue(row.Key)
        || toOptionalStringValue(row.key);
      if (!name) continue;
      objects.push({
        name,
        size: toOptionalNumber(row.Size) ?? toOptionalNumber(row.size),
        lastModified: toOptionalStringValue(row.LastModified)
          || toOptionalStringValue(row.lastModified),
        etag: toOptionalStringValue(row.ETag)
          || toOptionalStringValue(row.etag),
        type: toOptionalStringValue(row.Type)
          || toOptionalStringValue(row.type),
        storageClass: toOptionalStringValue(row.StorageClass)
          || toOptionalStringValue(row.storageClass)
      });
      if (objects.length >= safeLimit) break;
    }
    continuationToken = response.nextContinuationToken;
    if (!response.isTruncated || !continuationToken || rows.length === 0) break;
  }
  return objects;
}

export async function deleteOssBucketRecursively(bucketName: string): Promise<OssBucketCleanupResult> {
  const { client, runtime } = createOssClient();
  const normalized = bucketName.trim();
  if (!normalized) throw new Error('bucket 名称不能为空');

  let deletedObjects = 0;
  let continuationToken: string | undefined;
  const deletePool = createPool(8);

  while (true) {
    let rows: OssRawBody[] = [];
    try {
      const response = await withRetry(
        () => listObjectsV2Raw(client, runtime, normalized, {
          continuationToken,
          maxKeys: 1000
        }),
        {
          maxAttempts: 5,
          baseDelayMs: 800,
          shouldRetry: isTransientError
        }
      );
      rows = response.rows;
      continuationToken = response.nextContinuationToken;
      const keys = rows
        .map((item) => toOptionalStringValue(item.Key) || toOptionalStringValue(item.key) || '')
        .filter((item) => item.length > 0);
      if (keys.length > 0) {
        await Promise.all(
          keys.map((key) => deletePool(async () => {
            await withRetry(
              () => client.deleteObjectWithOptions(
                normalized,
                key,
                new $OSS.DeleteObjectRequest({}),
                {},
                runtime
              ),
              {
                maxAttempts: 5,
                baseDelayMs: 500,
                shouldRetry: isTransientError
              }
            );
          }))
        );
        deletedObjects += keys.length;
      }
      if (!response.isTruncated || !continuationToken) break;
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        return {
          bucket: normalized,
          deletedObjects: 0,
          deletedBucket: false
        };
      }
      throw err;
    }
  }

  try {
    await withRetry(
      () => client.deleteBucketWithOptions(
        normalized,
        {},
        runtime
      ),
      {
        maxAttempts: 5,
        baseDelayMs: 800,
        shouldRetry: isTransientError
      }
    );
    return {
      bucket: normalized,
      deletedObjects,
      deletedBucket: true
    };
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      return {
        bucket: normalized,
        deletedObjects,
        deletedBucket: false
      };
    }
    throw err;
  }
}
