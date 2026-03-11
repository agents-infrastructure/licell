import OSSClient, * as $OSS from '@alicloud/oss20190517';
import * as $OpenApi from '@alicloud/openapi-client';
import openapiUtilModule from '@alicloud/openapi-util';
import { createHmac } from 'crypto';

// Resolve CJS/ESM interop: bun bundler may wrap default export as { default: [class] }
const openapiUtil = (() => {
  const m = openapiUtilModule as unknown as Record<string, unknown>;
  if (typeof m?.query === 'function') return m as unknown as typeof openapiUtilModule;
  if (typeof (m?.default as Record<string, unknown>)?.query === 'function') return m.default as unknown as typeof openapiUtilModule;
  throw new Error('Cannot resolve @alicloud/openapi-util');
})();
import * as $Util from '@alicloud/tea-util';
import { createReadStream, createWriteStream, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync, statSync } from 'fs';
import { basename, dirname, isAbsolute, join, relative } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import mime from 'mime-types';
import { Config } from '../utils/config';
import { isConflictError, isAccessDeniedError, isNotFoundError, isTransientError } from '../utils/alicloud-error';
import { createPool } from '../utils/concurrency';
import { withRetry } from '../utils/retry';
import { resolveSdkCtor } from '../utils/sdk';

const UPLOAD_CONCURRENCY = 10;
const DOWNLOAD_CONCURRENCY = 6;
const DEFAULT_OSS_DOWNLOAD_DIR = 'oss-download';
const OSS_CONNECT_TIMEOUT_MS = 8_000;
const OSS_READ_TIMEOUT_MS = 120_000;
const OssClientCtor = resolveSdkCtor<OSSClient>(OSSClient, '@alicloud/oss20190517');
const DEFAULT_OSS_CONTENT_TYPE = 'application/octet-stream';

export type OssBucketAcl = 'private' | 'public-read' | 'public-read-write';
export type OssBucketStorageClass = 'Standard' | 'IA' | 'Archive' | 'ColdArchive' | 'DeepColdArchive';
export type OssBucketDataRedundancyType = 'LRS' | 'ZRS';

export interface OssBucketDomainCertificate {
  certId?: string;
  creationDate?: string;
  fingerprint?: string;
  status?: string;
  type?: string;
  validEndDate?: string;
  validStartDate?: string;
}

export interface OssBucketDomainSummary {
  domain: string;
  status?: string;
  lastModified?: string;
  certificate?: OssBucketDomainCertificate;
}

export interface OssBucketSummary {
  name: string;
  location?: string;
  creationDate?: string;
  extranetEndpoint?: string;
  intranetEndpoint?: string;
  acl?: OssBucketAcl;
  publicAccessBlock?: boolean;
  domains?: OssBucketDomainSummary[];
}

export interface OssObjectSummary {
  name: string;
  size?: number;
  lastModified?: string;
  etag?: string;
  type?: string;
  storageClass?: string;
}

export interface OssObjectInfo extends OssObjectSummary {
  bucket: string;
  key: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentLength?: number;
  contentType?: string;
  expires?: string;
  metadata: Record<string, string>;
}

export interface OssDownloadObjectResult {
  bucket: string;
  key: string;
  filePath: string;
  contentLength?: number;
  contentType?: string;
  etag?: string;
}

export interface OssPutObjectContentResult {
  bucket: string;
  key: string;
  contentLength: number;
  contentType: string;
  etag?: string;
}

export interface OssSignedGetUrlResult {
  bucket: string;
  key: string;
  url: string;
  expiresAt: string;
}

export interface OssDeleteObjectResult {
  bucket: string;
  key: string;
  deleted: boolean;
}

export interface OssDownloadDirectoryResult {
  bucket: string;
  prefix?: string;
  destinationDir: string;
  downloadedCount: number;
  skippedPlaceholderCount: number;
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
  if (stack.includes('gateway-oss') || stack.includes('darabonba-map')) return true;
  const code = String((err as { code?: unknown })?.code || '').toLowerCase();
  const statusCode = String((err as { statusCode?: unknown })?.statusCode || '').toLowerCase();
  return !code && !statusCode;
}

export function isOssBucketNameUnavailableError(err: unknown) {
  const code = String((err as { code?: unknown })?.code || '').toLowerCase();
  const message = String((err as { message?: unknown })?.message || '').toLowerCase();
  return code === 'bucketalreadyexists'
    || code === 'ossbucketnameunavailable'
    || message.includes('bucket name is not available')
    || message.includes('bucket namespace is shared')
    || message.includes('bucket 名称不可用');
}

async function assertBucketAccessible(
  client: InstanceType<typeof OssClientCtor>,
  bucket: string,
  runtime: $Util.RuntimeOptions
) {
  await withRetry(
    async () => {
      try {
        await client.getBucketInfoWithOptions(bucket, {}, runtime);
      } catch (infoErr: unknown) {
        if (isAccessDeniedError(infoErr)) {
          throw new Error(`OSS Bucket 已被占用且当前账号无权限访问: ${bucket}，请更换 appName 后重试`);
        }
        throw infoErr;
      }
    },
    {
      maxAttempts: 5,
      baseDelayMs: 800,
      shouldRetry: isEventuallyConsistentOssError
    }
  );
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

function getHeaderValue(headers: Record<string, string> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const direct = headers[name];
  if (typeof direct === 'string' && direct.length > 0) return direct;
  const normalizedName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== normalizedName) continue;
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
  return undefined;
}

function collectOssUserMetadata(headers: Record<string, string> | undefined) {
  const metadata: Record<string, string> = {};
  if (!headers) return metadata;
  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();
    if (!normalizedKey.startsWith('x-oss-meta-')) continue;
    const metaValue = toOptionalStringValue(value);
    if (!metaValue) continue;
    metadata[normalizedKey.slice('x-oss-meta-'.length)] = metaValue;
  }
  return metadata;
}

type OssRawBody = Record<string, unknown>;

export interface CreateOssBucketOptions {
  acl?: OssBucketAcl;
  storageClass?: OssBucketStorageClass;
  dataRedundancyType?: OssBucketDataRedundancyType;
  allowExisting?: boolean;
  publicAccessBlock?: boolean;
  allowPublicAclBlockedFallback?: boolean;
}

export interface CreateOssBucketResult {
  bucket: string;
  created: boolean;
  info: OssBucketSummary;
}

export interface UpdateOssBucketOptions {
  acl?: OssBucketAcl;
  publicAccessBlock?: boolean;
}

export interface OssBucketDomainTokenResult {
  bucket?: string;
  cname: string;
  token: string;
  expireTime?: string;
}

interface ExecuteOssXmlOptions {
  action: string;
  bucket?: string;
  pathname: string;
  method: 'GET' | 'PUT' | 'POST' | 'DELETE';
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

function toOptionalBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value == 0) return false;
    return undefined;
  }
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'on', 'enable', 'enabled', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'off', 'disable', 'disabled', 'no'].includes(normalized)) return false;
  return undefined;
}

function normalizeBucketName(bucketName: string) {
  const normalized = bucketName.trim();
  if (!normalized) throw new Error('bucket 名称不能为空');
  return normalized;
}

export function normalizeOssObjectKey(objectKey: string) {
  const normalized = objectKey
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized === '/') {
    throw new Error('object key 不能为空');
  }
  return normalized;
}

function normalizeSignedUrlExpirySeconds(expiresSeconds: number) {
  if (!Number.isFinite(expiresSeconds) || expiresSeconds <= 0) {
    throw new Error('签名 URL 过期时间必须大于 0 秒');
  }
  return Math.max(1, Math.floor(expiresSeconds));
}

function toSafeLocalPathSegments(relativeObjectKey: string) {
  const normalized = normalizeOssObjectKey(relativeObjectKey);
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('对象 key 不能为空');
  }
  for (const segment of segments) {
    if (segment === '.' || segment === '..') {
      throw new Error(`对象 key 包含不安全路径段: ${relativeObjectKey}`);
    }
  }
  return segments;
}

export function resolveDefaultOssDownloadFilePath(objectKey: string) {
  const fileName = basename(normalizeOssObjectKey(objectKey));
  if (!fileName || fileName === '.' || fileName === '..') {
    throw new Error('无法推导本地文件名，请通过 --file 指定输出路径');
  }
  return fileName;
}

export function resolveDefaultOssDownloadDir(bucketName: string) {
  return join(DEFAULT_OSS_DOWNLOAD_DIR, normalizeBucketName(bucketName));
}

export function buildOssDownloadPath(destinationDir: string, objectKey: string, prefix?: string) {
  const normalizedDestinationDir = destinationDir.trim();
  if (!normalizedDestinationDir) throw new Error('本地目标目录不能为空');

  const normalizedObjectKey = normalizeOssObjectKey(objectKey);
  if (normalizedObjectKey.endsWith('/')) {
    throw new Error('目录占位对象不能直接下载为文件');
  }

  const normalizedPrefix = normalizeOssTargetDir(prefix);
  let relativeObjectKey = normalizedObjectKey;
  if (normalizedPrefix && normalizedObjectKey.startsWith(`${normalizedPrefix}/`)) {
    relativeObjectKey = normalizedObjectKey.slice(normalizedPrefix.length + 1);
  }

  const segments = toSafeLocalPathSegments(relativeObjectKey);
  return join(normalizedDestinationDir, ...segments);
}

export function normalizeOssBucketAcl(input: string): OssBucketAcl {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'private') return 'private';
  if (normalized === 'public-read' || normalized === 'publicread') return 'public-read';
  if (normalized === 'public-read-write' || normalized === 'publicreadwrite') return 'public-read-write';
  throw new Error('--acl 仅支持 private / public-read / public-read-write');
}

export function normalizeOssBucketStorageClass(input: string): OssBucketStorageClass {
  const normalized = input.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized === 'standard') return 'Standard';
  if (normalized === 'ia' || normalized === 'infrequentaccess') return 'IA';
  if (normalized === 'archive') return 'Archive';
  if (normalized === 'coldarchive') return 'ColdArchive';
  if (normalized === 'deepcoldarchive') return 'DeepColdArchive';
  throw new Error('--storage-class 仅支持 standard / ia / archive / cold-archive / deep-cold-archive');
}

export function normalizeOssBucketDataRedundancyType(input: string): OssBucketDataRedundancyType {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'lrs') return 'LRS';
  if (normalized === 'zrs') return 'ZRS';
  throw new Error('--redundancy 仅支持 lrs / zrs');
}

function isPublicAcl(acl: OssBucketAcl | undefined) {
  return acl === 'public-read' || acl === 'public-read-write';
}

function isBucketNotEmptyError(err: unknown) {
  const text = `${String((err as { code?: unknown })?.code || '')} ${String((err as { message?: unknown })?.message || '')}`.toLowerCase();
  return text.includes('bucketnotempty') || (text.includes('bucket') && text.includes('not empty'));
}

function isEventuallyConsistentOssError(err: unknown) {
  return isTransientError(err) || isNotFoundError(err);
}

function isDomainVerificationRequiredError(err: unknown) {
  const text = `${String((err as { code?: unknown })?.code || '')} ${String((err as { message?: unknown })?.message || '')}`.toLowerCase();
  return text.includes('verify') || text.includes('ownership') || text.includes('token') || text.includes('cnameowner');
}

function collectRawBodiesWithStringField(value: unknown, keys: string[], rows: OssRawBody[], depth = 0): void {
  if (depth > 8) return;
  if (Array.isArray(value)) {
    for (const item of value) collectRawBodiesWithStringField(item, keys, rows, depth + 1);
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  const body = value as OssRawBody;
  if (keys.some((key) => toOptionalStringValue(body[key]) !== undefined) && !rows.includes(body)) {
    rows.push(body);
  }
  for (const nested of Object.values(body)) {
    collectRawBodiesWithStringField(nested, keys, rows, depth + 1);
  }
}

function findNestedStringField(value: unknown, keys: string[], depth = 0): string | undefined {
  if (depth > 8) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedStringField(item, keys, depth + 1);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const body = value as OssRawBody;
  for (const key of keys) {
    const found = toOptionalStringValue(body[key]);
    if (found) return found;
  }
  for (const nested of Object.values(body)) {
    const found = findNestedStringField(nested, keys, depth + 1);
    if (found) return found;
  }
  return undefined;
}

function findNestedBooleanField(value: unknown, keys: string[], depth = 0): boolean | undefined {
  if (depth > 8) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedBooleanField(item, keys, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const body = value as OssRawBody;
  for (const key of keys) {
    const found = toOptionalBooleanValue(body[key]);
    if (found !== undefined) return found;
  }
  for (const nested of Object.values(body)) {
    const found = findNestedBooleanField(nested, keys, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
}

function toDomainCertificate(value: unknown): OssBucketDomainCertificate | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const body = value as OssRawBody;
  const fingerprint = toOptionalStringValue(body.Fingerprint) || toOptionalStringValue(body.fingerprint);
  const certId = toOptionalStringValue(body.CertId) || toOptionalStringValue(body.certId);
  const creationDate = toOptionalStringValue(body.CreationDate) || toOptionalStringValue(body.creationDate);
  const status = toOptionalStringValue(body.Status) || toOptionalStringValue(body.status);
  const type = toOptionalStringValue(body.Type) || toOptionalStringValue(body.type);
  const validStartDate = toOptionalStringValue(body.ValidStartDate) || toOptionalStringValue(body.validStartDate);
  const validEndDate = toOptionalStringValue(body.ValidEndDate) || toOptionalStringValue(body.validEndDate);
  if (!fingerprint && !certId && !creationDate && !status && !type && !validStartDate && !validEndDate) return undefined;
  return { certId, creationDate, fingerprint, status, type, validStartDate, validEndDate };
}

function parseOssBucketDomains(body: OssRawBody): OssBucketDomainSummary[] {
  const rows: OssRawBody[] = [];
  collectRawBodiesWithStringField(body, ['Domain', 'domain'], rows);
  const seen = new Set<string>();
  const domains: OssBucketDomainSummary[] = [];
  for (const row of rows) {
    const domain = toOptionalStringValue(row.Domain) || toOptionalStringValue(row.domain);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    domains.push({
      domain,
      status: toOptionalStringValue(row.Status) || toOptionalStringValue(row.status),
      lastModified: toOptionalStringValue(row.LastModified) || toOptionalStringValue(row.lastModified),
      certificate: toDomainCertificate(row.Certificate || row.certificate)
    });
  }
  return domains.sort((a, b) => a.domain.localeCompare(b.domain));
}

async function executeOssXml(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  options: ExecuteOssXmlOptions
): Promise<OssRawBody> {
  const request = new $OpenApi.OpenApiRequest({
    ...(options.bucket ? { hostMap: { bucket: options.bucket } } : {}),
    headers: {},
    ...(options.query && Object.keys(options.query).length > 0 ? { query: openapiUtil.query(options.query) } : {}),
    ...(options.body ? { body: options.body } : {})
  });
  const params = new $OpenApi.Params({
    action: options.action,
    version: '2019-05-17',
    protocol: 'HTTPS',
    pathname: options.pathname,
    method: options.method,
    authType: 'AK',
    style: 'ROA',
    reqBodyType: 'xml',
    bodyType: 'xml'
  });
  const response = await client.execute(params, request, runtime) as { body?: OssRawBody };
  return response.body || {};
}

async function setOssBucketAclInternal(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string,
  acl: OssBucketAcl,
  options: { allowPublicAclBlockedFallback?: boolean } = {}
): Promise<OssBucketAcl> {
  let skippedPublicAcl = false;
  try {
    await client.putBucketAclWithOptions(bucket, new $OSS.PutBucketAclHeaders({ acl }), runtime);
  } catch (err: unknown) {
    if (isOssEmptyXmlResponseError(err)) {
      return acl;
    }
    if (isPublicAcl(acl) && options.allowPublicAclBlockedFallback && isPublicBucketAclBlockedError(err)) {
      skippedPublicAcl = true;
    }
    if (!skippedPublicAcl && isAccessDeniedError(err)) {
      throw new Error(`OSS Bucket 无权限修改 ACL: ${bucket}，请确认该 Bucket 属于当前账号并可写`);
    }
    if (!skippedPublicAcl) throw err;
  }
  return skippedPublicAcl ? 'private' : acl;
}

async function getOssBucketAclInternal(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string
): Promise<OssBucketAcl | undefined> {
  const response = await client.getBucketAclWithOptions(bucket, {}, runtime);
  const grant = response.body?.accessControlList?.grant;
  return grant ? normalizeOssBucketAcl(grant) : undefined;
}

async function getOssBucketPublicAccessBlockInternal(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string
): Promise<boolean> {
  try {
    const body = await executeOssXml(client, runtime, {
      action: 'GetBucketPublicAccessBlock',
      bucket,
      pathname: '/?publicAccessBlock',
      method: 'GET'
    });
    return findNestedBooleanField(body, ['BlockPublicAccess', 'blockPublicAccess']) ?? false;
  } catch (err: unknown) {
    if (isNotFoundError(err)) return false;
    throw err;
  }
}

async function setOssBucketPublicAccessBlockInternal(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string,
  enabled: boolean
): Promise<boolean> {
  if (enabled) {
    try {
      await executeOssXml(client, runtime, {
        action: 'PutBucketPublicAccessBlock',
        bucket,
        pathname: '/?publicAccessBlock',
        method: 'PUT',
        body: {
          PublicAccessBlockConfiguration: {
            BlockPublicAccess: true
          }
        }
      });
    } catch (err: unknown) {
      if (!isOssEmptyXmlResponseError(err)) throw err;
    }
    return true;
  }
  try {
    await executeOssXml(client, runtime, {
      action: 'DeleteBucketPublicAccessBlock',
      bucket,
      pathname: '/?publicAccessBlock',
      method: 'DELETE'
    });
  } catch (err: unknown) {
    if (!isNotFoundError(err) && !isOssEmptyXmlResponseError(err)) throw err;
  }
  return false;
}

async function listOssBucketDomainsInternal(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string
): Promise<OssBucketDomainSummary[]> {
  const body = await executeOssXml(client, runtime, {
    action: 'ListCname',
    bucket,
    pathname: '/?cname',
    method: 'GET'
  });
  return parseOssBucketDomains(body);
}

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

function toOssObjectInfo(bucket: string, key: string, headers: Record<string, string> | undefined): OssObjectInfo {
  const contentLength = toOptionalNumber(getHeaderValue(headers, 'content-length'));
  return {
    bucket,
    key,
    name: key,
    size: contentLength,
    contentLength,
    lastModified: getHeaderValue(headers, 'last-modified'),
    etag: getHeaderValue(headers, 'etag'),
    type: getHeaderValue(headers, 'x-oss-object-type'),
    storageClass: getHeaderValue(headers, 'x-oss-storage-class'),
    cacheControl: getHeaderValue(headers, 'cache-control'),
    contentDisposition: getHeaderValue(headers, 'content-disposition'),
    contentEncoding: getHeaderValue(headers, 'content-encoding'),
    contentLanguage: getHeaderValue(headers, 'content-language'),
    contentType: getHeaderValue(headers, 'content-type'),
    expires: getHeaderValue(headers, 'expires'),
    metadata: collectOssUserMetadata(headers)
  };
}

async function putOssObjectWithContentType(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string,
  key: string,
  sourceFile: string,
  contentType: string
) {
  try {
    const request = new $OpenApi.OpenApiRequest({
      hostMap: { bucket },
      headers: {
        'content-type': contentType
      },
      stream: createReadStream(sourceFile)
    });
    const params = new $OpenApi.Params({
      action: 'PutObject',
      version: '2019-05-17',
      protocol: 'HTTPS',
      pathname: `/${key}`,
      method: 'PUT',
      authType: 'AK',
      style: 'ROA',
      reqBodyType: 'binary',
      bodyType: 'binary'
    });
    await client.execute(params, request, runtime);
  } catch (err: unknown) {
    if (!isOssEmptyXmlResponseError(err)) throw err;
    await client.headObjectWithOptions(
      bucket,
      key,
      new $OSS.HeadObjectRequest({}),
      new $OSS.HeadObjectHeaders({}),
      runtime
    );
  }
}

async function putOssObjectContentInternal(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string,
  key: string,
  content: Buffer,
  contentType: string
): Promise<OssPutObjectContentResult> {
  let response: Awaited<ReturnType<InstanceType<typeof OssClientCtor>['putObjectWithOptions']>> | undefined;
  try {
    response = await withRetry(
      () => client.putObjectWithOptions(
        bucket,
        key,
        new $OSS.PutObjectRequest({
          body: Readable.from(content)
        }),
        new $OSS.PutObjectHeaders({
          commonHeaders: {
            'content-type': contentType,
            'content-length': String(content.length)
          }
        }),
        runtime
      ),
      {
        maxAttempts: 4,
        baseDelayMs: 800,
        shouldRetry: isEventuallyConsistentOssError
      }
    );
  } catch (err: unknown) {
    if (!isOssEmptyXmlResponseError(err)) throw err;
    response = await withRetry(
      () => client.headObjectWithOptions(
        bucket,
        key,
        new $OSS.HeadObjectRequest({}),
        new $OSS.HeadObjectHeaders({}),
        runtime
      ),
      {
        maxAttempts: 4,
        baseDelayMs: 800,
        shouldRetry: isEventuallyConsistentOssError
      }
    );
  }

  return {
    bucket,
    key,
    contentLength: content.length,
    contentType,
    etag: getHeaderValue(response?.headers, 'etag')
  };
}

async function downloadOssObjectToFile(
  client: InstanceType<typeof OssClientCtor>,
  runtime: $Util.RuntimeOptions,
  bucket: string,
  key: string,
  filePath: string
): Promise<OssDownloadObjectResult> {
  const response = await withRetry(
    () => client.getObjectWithOptions(
      bucket,
      key,
      new $OSS.GetObjectRequest({}),
      new $OSS.GetObjectHeaders({}),
      runtime
    ),
    {
      maxAttempts: 4,
      baseDelayMs: 800,
      shouldRetry: isTransientError
    }
  );

  mkdirSync(dirname(filePath), { recursive: true });
  try {
    await pipeline(response.body as NodeJS.ReadableStream, createWriteStream(filePath));
  } catch (err: unknown) {
    rmSync(filePath, { force: true });
    throw err;
  }

  return {
    bucket,
    key,
    filePath,
    contentLength: toOptionalNumber(getHeaderValue(response.headers, 'content-length')),
    contentType: getHeaderValue(response.headers, 'content-type'),
    etag: getHeaderValue(response.headers, 'etag')
  };
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
        () => putOssObjectWithContentType(
          client,
          runtime,
          normalizedBucket,
          file.objectName,
          file.sourceFile,
          contentType
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
  const { auth } = createOssClient();
  const bucket = `licell-${appName}-${auth.accountId.substring(0, 4)}`.toLowerCase();

  try {
    await getOssBucketInfo(bucket);
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
    await createOssBucket(bucket, {
      acl: 'public-read',
      allowExisting: true,
      allowPublicAclBlockedFallback: true
    });
  }

  const uploadResult = await uploadDirectoryToBucket(bucket, distDir, { targetDir: options?.targetDir });
  return uploadResult.baseUrl;
}

export function resolveOssBucketName(appName: string) {
  const auth = Config.requireAuth();
  return `licell-${appName}-${auth.accountId.substring(0, 4)}`.toLowerCase();
}

export async function createOssBucket(bucketName: string, options: CreateOssBucketOptions = {}): Promise<CreateOssBucketResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const acl = options.acl || 'private';
  const publicAccessBlock = options.publicAccessBlock;

  if (publicAccessBlock === true && isPublicAcl(acl)) {
    throw new Error('开启 public access block 时，ACL 不能设为 public-read / public-read-write');
  }

  let created = true;
  const normalizedStorageClass = options.storageClass === 'Standard' ? undefined : options.storageClass;
  const createBucketConfiguration = normalizedStorageClass || options.dataRedundancyType
    ? new $OSS.CreateBucketConfiguration({
      ...(normalizedStorageClass ? { storageClass: normalizedStorageClass } : {}),
      ...(options.dataRedundancyType ? { dataRedundancyType: options.dataRedundancyType } : {})
    })
    : undefined;

  try {
    await client.putBucketWithOptions(
      bucket,
      new $OSS.PutBucketRequest({
        ...(createBucketConfiguration ? { createBucketConfiguration } : {})
      }),
      new $OSS.PutBucketHeaders({ acl }),
      runtime
    );
  } catch (err: unknown) {
    if (isOssEmptyXmlResponseError(err)) {
      await assertBucketAccessible(client, bucket, runtime);
    } else if (isConflictError(err) || isOssBucketNameUnavailableError(err)) {
      try {
        await assertBucketAccessible(client, bucket, runtime);
      } catch (infoErr: unknown) {
        if (isNotFoundError(infoErr) || isOssEmptyXmlResponseError(infoErr)) {
          const tagged = new Error(`OSS Bucket 名称不可用: ${bucket}（可能被其他账号占用，或刚删除尚未释放）`) as Error & { code?: string };
          tagged.code = 'OssBucketNameUnavailable';
          throw tagged;
        }
        throw infoErr;
      }
      if (!options.allowExisting) {
        throw new Error(`OSS Bucket 已存在: ${bucket}`);
      }
      created = false;
    } else {
      throw err;
    }
  }

  if (options.allowExisting || created) {
    if (acl !== 'private' || options.allowPublicAclBlockedFallback) {
      await withRetry(
        () => setOssBucketAclInternal(client, runtime, bucket, acl, {
          allowPublicAclBlockedFallback: options.allowPublicAclBlockedFallback
        }),
        {
          maxAttempts: 5,
          baseDelayMs: 800,
          shouldRetry: isEventuallyConsistentOssError
        }
      );
    }
    if (publicAccessBlock !== undefined) {
      await withRetry(
        () => setOssBucketPublicAccessBlockInternal(client, runtime, bucket, publicAccessBlock),
        {
          maxAttempts: 5,
          baseDelayMs: 800,
          shouldRetry: isEventuallyConsistentOssError
        }
      );
    }
  }

  return {
    bucket,
    created,
    info: await withRetry(
      () => getOssBucketInfo(bucket),
      {
        maxAttempts: 5,
        baseDelayMs: 800,
        shouldRetry: isEventuallyConsistentOssError
      }
    )
  };
}

export async function getOssBucketAcl(bucketName: string): Promise<OssBucketAcl | undefined> {
  const { client, runtime } = createOssClient();
  return getOssBucketAclInternal(client, runtime, normalizeBucketName(bucketName));
}

export async function setOssBucketAcl(bucketName: string, acl: OssBucketAcl, options: { allowPublicAclBlockedFallback?: boolean } = {}): Promise<OssBucketAcl> {
  const { client, runtime } = createOssClient();
  return setOssBucketAclInternal(client, runtime, normalizeBucketName(bucketName), acl, options);
}

export async function getOssBucketPublicAccessBlock(bucketName: string): Promise<boolean> {
  const { client, runtime } = createOssClient();
  return getOssBucketPublicAccessBlockInternal(client, runtime, normalizeBucketName(bucketName));
}

export async function setOssBucketPublicAccessBlock(bucketName: string, enabled: boolean): Promise<boolean> {
  const { client, runtime } = createOssClient();
  return setOssBucketPublicAccessBlockInternal(client, runtime, normalizeBucketName(bucketName), enabled);
}

export async function listOssBucketDomains(bucketName: string): Promise<OssBucketDomainSummary[]> {
  const { client, runtime } = createOssClient();
  return listOssBucketDomainsInternal(client, runtime, normalizeBucketName(bucketName));
}

export async function createOssBucketDomainToken(bucketName: string, domain: string): Promise<OssBucketDomainTokenResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');
  const body = await executeOssXml(client, runtime, {
    action: 'CreateCnameToken',
    bucket,
    pathname: '/?cname&comp=token',
    method: 'POST',
    body: {
      BucketCnameConfiguration: {
        Cname: {
          Domain: normalizedDomain
        }
      }
    }
  });
  const token = findNestedStringField(body, ['Token', 'token']);
  if (!token) {
    throw new Error('OSS 返回了空的域名验证 token');
  }
  return {
    bucket: findNestedStringField(body, ['Bucket', 'bucket']) || bucket,
    cname: findNestedStringField(body, ['Cname', 'cname']) || normalizedDomain,
    token,
    expireTime: findNestedStringField(body, ['ExpireTime', 'expireTime'])
  };
}

export async function bindOssBucketDomain(bucketName: string, domain: string): Promise<OssBucketDomainSummary> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  try {
    await executeOssXml(client, runtime, {
      action: 'PutCname',
      bucket,
      pathname: '/?cname&comp=add',
      method: 'POST',
      body: {
        BucketCnameConfiguration: {
          Cname: {
            Domain: normalizedDomain
          }
        }
      }
    });
  } catch (err: unknown) {
    if (isOssEmptyXmlResponseError(err)) {
      // OSS may return an empty XML body on success and the SDK surfaces it as a parse error.
    } else if (isDomainVerificationRequiredError(err)) {
      throw new Error(`Bucket 域名所有权验证未完成：${normalizedDomain}。请先执行 \`licell oss domain token ${bucket} ${normalizedDomain}\` 并补充 TXT 记录后重试`);
    } else {
      throw err;
    }
  }

  const domains = await listOssBucketDomainsInternal(client, runtime, bucket);
  return domains.find((item) => item.domain === normalizedDomain) || { domain: normalizedDomain };
}

export async function removeOssBucketDomain(bucketName: string, domain: string): Promise<boolean> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) throw new Error('域名不能为空');

  try {
    await executeOssXml(client, runtime, {
      action: 'DeleteCname',
      bucket,
      pathname: '/?cname&comp=delete',
      method: 'POST',
      body: {
        BucketCnameConfiguration: {
          Cname: {
            Domain: normalizedDomain
          }
        }
      }
    });
    return true;
  } catch (err: unknown) {
    if (isOssEmptyXmlResponseError(err)) return true;
    if (isNotFoundError(err)) return false;
    throw err;
  }
}

export async function updateOssBucket(bucketName: string, options: UpdateOssBucketOptions): Promise<OssBucketSummary> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);

  if (!options.acl && options.publicAccessBlock === undefined) {
    throw new Error('Bucket 未指定任何可更新属性');
  }
  if (options.publicAccessBlock === true && isPublicAcl(options.acl)) {
    throw new Error('开启 public access block 时，ACL 不能设为 public-read / public-read-write');
  }

  if (options.publicAccessBlock === false) {
    await setOssBucketPublicAccessBlockInternal(client, runtime, bucket, false);
  }
  if (options.acl) {
    await setOssBucketAclInternal(client, runtime, bucket, options.acl);
  }
  if (options.publicAccessBlock === true) {
    await setOssBucketPublicAccessBlockInternal(client, runtime, bucket, true);
  }

  return getOssBucketInfo(bucket);
}

export async function deleteOssBucket(bucketName: string): Promise<OssBucketCleanupResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  try {
    await withRetry(
      () => client.deleteBucketWithOptions(bucket, {}, runtime),
      {
        maxAttempts: 4,
        baseDelayMs: 600,
        shouldRetry: isTransientError
      }
    );
    return {
      bucket,
      deletedObjects: 0,
      deletedBucket: true
    };
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      return {
        bucket,
        deletedObjects: 0,
        deletedBucket: false
      };
    }
    if (isBucketNotEmptyError(err)) {
      throw new Error(`OSS Bucket 非空，无法直接删除：${bucket}。如需连同对象一起删除，请改用 \`licell oss rm ${bucket} --recursive --yes\``);
    }
    throw err;
  }
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
  const normalized = normalizeBucketName(bucketName);
  const response = await client.getBucketInfoWithOptions(normalized, {}, runtime);
  const bucket = response.body?.bucket;
  const name = bucket?.name || normalized;

  const [aclResult, publicAccessBlockResult, domainsResult] = await Promise.allSettled([
    getOssBucketAclInternal(client, runtime, normalized),
    getOssBucketPublicAccessBlockInternal(client, runtime, normalized),
    listOssBucketDomainsInternal(client, runtime, normalized)
  ]);

  return {
    name,
    location: bucket?.location,
    creationDate: bucket?.creationDate,
    extranetEndpoint: bucket?.extranetEndpoint,
    intranetEndpoint: bucket?.intranetEndpoint,
    acl: aclResult.status === 'fulfilled' ? aclResult.value : undefined,
    publicAccessBlock: publicAccessBlockResult.status === 'fulfilled' ? publicAccessBlockResult.value : undefined,
    domains: domainsResult.status === 'fulfilled' ? domainsResult.value : undefined
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

export async function getOssObjectInfo(bucketName: string, objectKey: string): Promise<OssObjectInfo> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const key = normalizeOssObjectKey(objectKey);
  const response = await withRetry(
    () => client.headObjectWithOptions(
      bucket,
      key,
      new $OSS.HeadObjectRequest({}),
      new $OSS.HeadObjectHeaders({}),
      runtime
    ),
    {
      maxAttempts: 4,
      baseDelayMs: 800,
      shouldRetry: isTransientError
    }
  );
  return toOssObjectInfo(bucket, key, response.headers);
}

export async function downloadOssObject(bucketName: string, objectKey: string, filePath: string): Promise<OssDownloadObjectResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const key = normalizeOssObjectKey(objectKey);
  const normalizedFilePath = filePath.trim();
  if (!normalizedFilePath) throw new Error('本地文件路径不能为空');
  return downloadOssObjectToFile(client, runtime, bucket, key, normalizedFilePath);
}

export async function uploadOssObjectContent(
  bucketName: string,
  objectKey: string,
  content: Buffer | string,
  options: { contentType?: string } = {}
): Promise<OssPutObjectContentResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const key = normalizeOssObjectKey(objectKey);
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const contentType = options.contentType?.trim() || DEFAULT_OSS_CONTENT_TYPE;
  return putOssObjectContentInternal(client, runtime, bucket, key, buffer, contentType);
}

export function createSignedOssGetUrl(
  bucketName: string,
  objectKey: string,
  expiresSeconds: number
): OssSignedGetUrlResult {
  const { auth } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const key = normalizeOssObjectKey(objectKey);
  const safeExpiresSeconds = normalizeSignedUrlExpirySeconds(expiresSeconds);
  const expiresUnix = Math.floor(Date.now() / 1000) + safeExpiresSeconds;
  const canonicalResource = `/${bucket}/${key}`;
  const signature = createHmac('sha1', auth.sk)
    .update(`GET\n\n\n${expiresUnix}\n${canonicalResource}`, 'utf8')
    .digest('base64');
  const pathname = key.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  const query = new URLSearchParams({
    OSSAccessKeyId: auth.ak,
    Expires: String(expiresUnix),
    Signature: signature
  });

  return {
    bucket,
    key,
    url: `https://${bucket}.oss-${auth.region}.aliyuncs.com/${pathname}?${query.toString()}`,
    expiresAt: new Date(expiresUnix * 1000).toISOString()
  };
}

export async function deleteOssObject(bucketName: string, objectKey: string): Promise<OssDeleteObjectResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const key = normalizeOssObjectKey(objectKey);
  try {
    await withRetry(
      () => client.deleteObjectWithOptions(
        bucket,
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
    return { bucket, key, deleted: true };
  } catch (err: unknown) {
    if (isNotFoundError(err)) return { bucket, key, deleted: false };
    throw err;
  }
}

export async function downloadOssObjectsToDirectory(
  bucketName: string,
  destinationDir: string,
  options?: { prefix?: string; concurrency?: number }
): Promise<OssDownloadDirectoryResult> {
  const { client, runtime } = createOssClient();
  const bucket = normalizeBucketName(bucketName);
  const normalizedDestinationDir = destinationDir.trim();
  if (!normalizedDestinationDir) throw new Error('本地目标目录不能为空');
  const normalizedPrefix = normalizeOssTargetDir(options?.prefix);
  const concurrency = Number.isFinite(options?.concurrency)
    && Number((options?.concurrency || 0)) > 0
    ? Math.floor(Number(options?.concurrency))
    : DOWNLOAD_CONCURRENCY;
  const pool = createPool(concurrency);

  let downloadedCount = 0;
  let skippedPlaceholderCount = 0;
  let continuationToken: string | undefined;

  while (true) {
    const response = await withRetry(
      () => listObjectsV2Raw(client, runtime, bucket, {
        ...(normalizedPrefix ? { prefix: normalizedPrefix } : {}),
        continuationToken,
        maxKeys: 1000
      }),
      {
        maxAttempts: 5,
        baseDelayMs: 800,
        shouldRetry: isTransientError
      }
    );

    await Promise.all(response.rows.map((row) => pool(async () => {
      const key = toOptionalStringValue(row.Key) || toOptionalStringValue(row.key);
      if (!key) return;
      const normalizedKey = normalizeOssObjectKey(key);
      if (normalizedKey.endsWith('/')) {
        skippedPlaceholderCount += 1;
        return;
      }
      const filePath = buildOssDownloadPath(normalizedDestinationDir, normalizedKey, normalizedPrefix);
      await downloadOssObjectToFile(client, runtime, bucket, normalizedKey, filePath);
      downloadedCount += 1;
    })));

    continuationToken = response.nextContinuationToken;
    if (!response.isTruncated || !continuationToken || response.rows.length === 0) break;
  }

  return {
    bucket,
    prefix: normalizedPrefix,
    destinationDir: normalizedDestinationDir,
    downloadedCount,
    skippedPlaceholderCount
  };
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
