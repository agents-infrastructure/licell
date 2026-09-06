import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Readable } from 'stream';

const mockPutBucketWithOptions = vi.fn();
const mockGetBucketInfoWithOptions = vi.fn();
const mockPutBucketAclWithOptions = vi.fn();
const mockGetBucketAclWithOptions = vi.fn();
const mockDeleteBucketLifecycleWithOptions = vi.fn();
const mockDeleteBucketCorsWithOptions = vi.fn();
const mockDeleteBucketEncryptionWithOptions = vi.fn();
const mockDeleteBucketWebsiteWithOptions = vi.fn();
const mockPutObjectWithOptions = vi.fn();
const mockHeadObjectWithOptions = vi.fn();
const mockExecute = vi.fn();
const mockIsConflictError = vi.fn();
const mockIsAccessDeniedError = vi.fn();
const mockIsNotFoundError = vi.fn();
const mockIsTransientError = vi.fn();
const mockOpenApiConfigInput = vi.fn();

async function readStream(stream: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

vi.mock('../utils/config', () => ({
  Config: {
    requireAuth: () => ({
      accountId: '1494123412341234',
      ak: 'test-ak',
      sk: 'test-sk',
      region: 'cn-hangzhou'
    })
  }
}));

vi.mock('@alicloud/oss20190517', () => ({
  default: class MockOssClient {
    putBucketWithOptions = mockPutBucketWithOptions;
    getBucketInfoWithOptions = mockGetBucketInfoWithOptions;
    putBucketAclWithOptions = mockPutBucketAclWithOptions;
    getBucketAclWithOptions = mockGetBucketAclWithOptions;
    deleteBucketLifecycleWithOptions = mockDeleteBucketLifecycleWithOptions;
    deleteBucketCorsWithOptions = mockDeleteBucketCorsWithOptions;
    deleteBucketEncryptionWithOptions = mockDeleteBucketEncryptionWithOptions;
    deleteBucketWebsiteWithOptions = mockDeleteBucketWebsiteWithOptions;
    putObjectWithOptions = mockPutObjectWithOptions;
    headObjectWithOptions = mockHeadObjectWithOptions;
    execute = mockExecute;
  },
  CreateBucketConfiguration: class CreateBucketConfiguration {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  PutBucketRequest: class PutBucketRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  PutBucketHeaders: class PutBucketHeaders {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  PutBucketAclHeaders: class PutBucketAclHeaders {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  PutObjectRequest: class PutObjectRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  PutObjectHeaders: class PutObjectHeaders {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  HeadObjectRequest: class HeadObjectRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  HeadObjectHeaders: class HeadObjectHeaders {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  ApplyServerSideEncryptionByDefault: class ApplyServerSideEncryptionByDefault {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  CORSConfiguration: class CORSConfiguration {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  CORSRule: class CORSRule {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleConfiguration: class LifecycleConfiguration {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRule: class LifecycleRule {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleFilter: class LifecycleRuleFilter {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleFilterNot: class LifecycleRuleFilterNot {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleLifecycleExpiration: class LifecycleRuleLifecycleExpiration {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleLifecycleTransition: class LifecycleRuleLifecycleTransition {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleLifecycleAbortMultipartUpload: class LifecycleRuleLifecycleAbortMultipartUpload {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleNoncurrentVersionExpiration: class LifecycleRuleNoncurrentVersionExpiration {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  LifecycleRuleNoncurrentVersionTransition: class LifecycleRuleNoncurrentVersionTransition {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  PutBucketLifecycleRequest: class PutBucketLifecycleRequest {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  PutBucketCorsRequest: class PutBucketCorsRequest {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  PutBucketEncryptionRequest: class PutBucketEncryptionRequest {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  ServerSideEncryptionRule: class ServerSideEncryptionRule {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  WebsiteConfiguration: class WebsiteConfiguration {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  IndexDocument: class IndexDocument {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  ErrorDocument: class ErrorDocument {
    constructor(input: unknown) { Object.assign(this, input); }
  },
  Tag: class Tag {
    constructor(input: unknown) { Object.assign(this, input); }
  }
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: unknown) {
      mockOpenApiConfigInput(input);
      Object.assign(this, input);
    }
  },
  OpenApiRequest: class OpenApiRequest {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  },
  Params: class Params {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }
}));

vi.mock('@alicloud/openapi-util', () => ({
  default: {
    query: (input: unknown) => input,
    parseToMap: (input: unknown) => input
  }
}));

vi.mock('@alicloud/tea-util', () => ({
  RuntimeOptions: class RuntimeOptions {
    constructor(input: unknown) {
      Object.assign(this, input);
    }
  }
}));

vi.mock('../utils/sdk', () => ({
  resolveSdkCtor: (ctor: unknown) => ctor
}));

vi.mock('../utils/retry', () => ({
  withRetry: async (task: () => Promise<unknown>) => task()
}));

vi.mock('../utils/alicloud-error', () => ({
  isConflictError: (err: unknown) => mockIsConflictError(err),
  isAccessDeniedError: (err: unknown) => mockIsAccessDeniedError(err),
  isNotFoundError: (err: unknown) => mockIsNotFoundError(err),
  isTransientError: (err: unknown) => mockIsTransientError(err)
}));

describe('createOssBucket', () => {
  beforeEach(() => {
    mockPutBucketWithOptions.mockReset();
    mockGetBucketInfoWithOptions.mockReset();
    mockPutBucketAclWithOptions.mockReset();
    mockGetBucketAclWithOptions.mockReset();
    mockDeleteBucketLifecycleWithOptions.mockReset();
    mockDeleteBucketCorsWithOptions.mockReset();
    mockDeleteBucketEncryptionWithOptions.mockReset();
    mockDeleteBucketWebsiteWithOptions.mockReset();
    mockPutObjectWithOptions.mockReset();
    mockHeadObjectWithOptions.mockReset();
    mockExecute.mockReset();
    mockIsConflictError.mockReset();
    mockIsAccessDeniedError.mockReset();
    mockIsNotFoundError.mockReset();
    mockIsTransientError.mockReset();
    mockOpenApiConfigInput.mockReset();

    mockPutBucketWithOptions.mockResolvedValue({});
    mockGetBucketInfoWithOptions.mockResolvedValue({
      body: {
        bucket: {
          name: 'demo-bucket',
          location: 'oss-cn-hangzhou'
        }
      }
    });
    mockPutBucketAclWithOptions.mockResolvedValue({});
    mockGetBucketAclWithOptions.mockResolvedValue({ body: { acl: 'private' } });
    mockDeleteBucketLifecycleWithOptions.mockResolvedValue({});
    mockDeleteBucketCorsWithOptions.mockResolvedValue({});
    mockDeleteBucketEncryptionWithOptions.mockResolvedValue({});
    mockDeleteBucketWebsiteWithOptions.mockResolvedValue({});
    mockPutObjectWithOptions.mockResolvedValue({ headers: { etag: '"etag-demo"' } });
    mockHeadObjectWithOptions.mockResolvedValue({ headers: { etag: '"verified-etag"' } });
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketLifecycle') {
        return { body: { LifecycleConfiguration: { Rule: [] } } };
      }
      if (params.action === 'GetBucketCors') {
        return { body: { CORSConfiguration: { CORSRule: [], ResponseVary: false } } };
      }
      if (params.action === 'GetBucketEncryption') {
        return { body: { ServerSideEncryptionRule: {} } };
      }
      if (params.action === 'GetBucketWebsite') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchWebsiteConfiguration' });
      }
      return { body: {} };
    });
    mockIsConflictError.mockReturnValue(false);
    mockIsAccessDeniedError.mockReturnValue(false);
    mockIsNotFoundError.mockReturnValue(false);
    mockIsTransientError.mockReturnValue(false);
  });

  it('omits Standard storageClass from createBucketConfiguration', async () => {
    const { createOssBucket } = await import('../providers/oss');

    await createOssBucket('demo-bucket', { storageClass: 'Standard' });

    const request = mockPutBucketWithOptions.mock.calls[0]?.[1];
    expect(request?.createBucketConfiguration).toBeUndefined();
  });

  it('uses a per-call region override for the OSS client endpoint', async () => {
    const { getOssObjectInfo } = await import('../providers/oss');

    await getOssObjectInfo('demo-bucket', 'site/index.html', { regionId: 'cn-shanghai' });

    expect(mockOpenApiConfigInput).toHaveBeenCalledWith(expect.objectContaining({
      regionId: 'cn-shanghai',
      endpoint: 'oss-cn-shanghai.aliyuncs.com'
    }));
  });

  it('uses the configured default region when no per-call override is provided', async () => {
    const { getOssObjectInfo } = await import('../providers/oss');

    await getOssObjectInfo('demo-bucket', 'site/index.html');

    expect(mockOpenApiConfigInput).toHaveBeenCalledWith(expect.objectContaining({
      regionId: 'cn-hangzhou',
      endpoint: 'oss-cn-hangzhou.aliyuncs.com'
    }));
  });

  it('projects lifecycle, CORS, encryption and website into the safe bucket config contract', async () => {
    const { inspectOssBucketConfig } = await import('../providers/oss');
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketLifecycle') return { body: {
        LifecycleConfiguration: { Rule: {
          ID: 'archive-assets',
          Status: 'Enabled',
          Prefix: 'assets/',
          Tag: { Key: 'env', Value: 'prod' },
          Expiration: { Days: 365 },
          Transition: { Days: 30, StorageClass: 'IA' },
          AbortMultipartUpload: { Days: 7 },
          NoncurrentVersionExpiration: { NoncurrentDays: 90 },
          NoncurrentVersionTransition: { NoncurrentDays: 15, StorageClass: 'IA' },
          InternalField: 'must-not-leak'
        } }
      } };
      if (params.action === 'GetBucketCors') return { body: {
        CORSConfiguration: { ResponseVary: true, CORSRule: {
          AllowedOrigin: 'https://example.com',
          AllowedMethod: ['GET', 'HEAD'],
          AllowedHeader: 'authorization',
          ExposeHeader: 'etag',
          MaxAgeSeconds: 600,
          InternalField: 'must-not-leak'
        } }
      } };
      if (params.action === 'GetBucketEncryption') return { body: {
        ServerSideEncryptionRule: { ApplyServerSideEncryptionByDefault: {
          SSEAlgorithm: 'KMS',
          KMSMasterKeyID: 'kms-key-id',
          KMSDataEncryption: 'SM4',
          InternalField: 'must-not-leak'
        } }
      } };
      if (params.action === 'GetBucketWebsite') return { body: {
        WebsiteConfiguration: {
          IndexDocument: { Suffix: 'index.html', SupportSubDir: false, Type: '1' },
          ErrorDocument: { Key: 'index.html', HttpStatus: '200' },
          RoutingRules: { RoutingRule: [{ RuleNumber: 1 }] },
          InternalField: 'must-not-leak'
        }
      } };
      return { body: {} };
    });

    const result = await inspectOssBucketConfig('demo-bucket', { regionId: 'cn-shanghai' });

    expect(result).toEqual({
      bucket: 'demo-bucket',
      regionId: 'cn-shanghai',
      lifecycle: {
        configured: true,
        ruleCount: 1,
        rules: [{
          id: 'archive-assets',
          status: 'Enabled',
          prefix: 'assets/',
          tags: [{ key: 'env', value: 'prod' }],
          filterNot: undefined,
          expiration: { createdBeforeDate: undefined, days: 365, expiredObjectDeleteMarker: undefined },
          transitions: [{
            createdBeforeDate: undefined,
            days: 30,
            storageClass: 'IA',
            isAccessTime: undefined,
            returnToStdWhenVisit: undefined,
            allowSmallFile: undefined
          }],
          abortMultipartUpload: { createdBeforeDate: undefined, days: 7 },
          noncurrentVersionExpiration: { noncurrentDays: 90 },
          noncurrentVersionTransitions: [{
            noncurrentDays: 15,
            storageClass: 'IA',
            isAccessTime: undefined,
            returnToStdWhenVisit: undefined,
            allowSmallFile: undefined
          }]
        }]
      },
      cors: {
        configured: true,
        responseVary: true,
        ruleCount: 1,
        rules: [{
          allowedOrigins: ['https://example.com'],
          allowedMethods: ['GET', 'HEAD'],
          allowedHeaders: ['authorization'],
          exposeHeaders: ['etag'],
          maxAgeSeconds: 600
        }]
      },
      encryption: {
        configured: true,
        algorithm: 'KMS',
        kmsMasterKeyId: 'kms-key-id',
        kmsDataEncryption: 'SM4'
      },
      website: {
        configured: true,
        indexDocument: { suffix: 'index.html', supportSubDir: false, type: 1 },
        errorDocument: { key: 'index.html', httpStatus: 200 },
        routingRuleCount: 1
      }
    });
  });

  it('maps only official absent-config errors to configured=false', async () => {
    const { inspectOssBucketConfig } = await import('../providers/oss');
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketLifecycle') throw Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
      if (params.action === 'GetBucketCors') throw Object.assign(new Error('missing'), { data: { Code: 'NoSuchCORSConfiguration' } });
      if (params.action === 'GetBucketEncryption') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchServerSideEncryptionRule' });
      }
      if (params.action === 'GetBucketWebsite') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchWebsiteConfiguration' });
      }
      return { body: {} };
    });

    const result = await inspectOssBucketConfig('demo-bucket');

    expect(result.lifecycle).toEqual({ configured: false, ruleCount: 0, rules: [] });
    expect(result.cors).toEqual({ configured: false, responseVary: undefined, ruleCount: 0, rules: [] });
    expect(result.encryption).toEqual({
      configured: false,
      algorithm: undefined,
      kmsMasterKeyId: undefined,
      kmsDataEncryption: undefined
    });
    expect(result.website).toEqual({
      configured: false,
      indexDocument: undefined,
      errorDocument: undefined,
      routingRuleCount: 0
    });
  });

  it('does not hide permission errors as absent bucket configuration', async () => {
    const { inspectOssBucketConfig } = await import('../providers/oss');
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketCors') throw Object.assign(new Error('AccessDenied'), { code: 'AccessDenied' });
      return { body: {} };
    });

    await expect(inspectOssBucketConfig('demo-bucket')).rejects.toMatchObject({ code: 'AccessDenied' });
  });

  it('validates OSS config desired-state and rejects typo fields', async () => {
    const { normalizeOssBucketConfigDesiredState } = await import('../providers/oss');

    expect(normalizeOssBucketConfigDesiredState({ encryption: { algorithm: 'aes256' } })).toEqual({
      encryption: { algorithm: 'AES256', kmsMasterKeyId: undefined, kmsDataEncryption: undefined }
    });
    expect(() => normalizeOssBucketConfigDesiredState({ encrypton: { algorithm: 'AES256' } }))
      .toThrow(/未知字段: encrypton/);
    expect(() => normalizeOssBucketConfigDesiredState({ lifecycle: { rules: [] } }))
      .toThrow(/数量必须在 1-1000/);
    expect(normalizeOssBucketConfigDesiredState({
      website: {
        indexDocument: { suffix: 'index.html', supportSubDir: false, type: '1' },
        errorDocument: { key: 'index.html', httpStatus: '200' }
      }
    })).toEqual({
      website: {
        indexDocument: { suffix: 'index.html', supportSubDir: false, type: 1 },
        errorDocument: { key: 'index.html', httpStatus: 200 }
      }
    });
    expect(() => normalizeOssBucketConfigDesiredState({ website: {} }))
      .toThrow(/至少需要 indexDocument 或 errorDocument/);
    expect(() => normalizeOssBucketConfigDesiredState({ website: { errorDocument: { key: 'index.html', httpStatus: 500 } } }))
      .toThrow(/仅支持 200 \/ 404/);
  });

  it('applies SPA website fallback through XML and verifies the desired state after an empty-response parser error', async () => {
    const { applyOssBucketConfig } = await import('../providers/oss');
    let websiteReadCount = 0;
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketWebsite') {
        websiteReadCount += 1;
        if (websiteReadCount === 1) {
          throw Object.assign(new Error('missing'), { code: 'NoSuchWebsiteConfiguration' });
        }
        return { body: { WebsiteConfiguration: {
          IndexDocument: { Suffix: 'index.html', SupportSubDir: false },
          ErrorDocument: { Key: 'index.html', HttpStatus: '200' }
        } } };
      }
      if (params.action === 'PutBucketWebsite') {
        throw new Error('not a valid value for parameter response');
      }
      if (params.action === 'GetBucketLifecycle') throw Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
      if (params.action === 'GetBucketCors') throw Object.assign(new Error('missing'), { code: 'NoSuchCORSConfiguration' });
      if (params.action === 'GetBucketEncryption') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchServerSideEncryptionRule' });
      }
      return { body: {} };
    });

    const desired = {
      website: {
        indexDocument: { suffix: 'index.html', supportSubDir: false },
        errorDocument: { key: 'index.html', httpStatus: 200 }
      }
    };
    const result = await applyOssBucketConfig('demo-bucket', desired);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PutBucketWebsite', pathname: '/?website', method: 'PUT' }),
      expect.objectContaining({
        body: {
          WebsiteConfiguration: expect.objectContaining({
            indexDocument: expect.objectContaining({ suffix: 'index.html', supportSubDir: false }),
            errorDocument: expect.objectContaining({ key: 'index.html', httpStatus: '200' })
          })
        }
      }),
      expect.anything()
    );
    expect(result).toMatchObject({
      plan: { changeCount: 1, willExecute: true },
      execution: { appliedSections: ['website'] },
      verify: {
        matched: true,
        config: { website: { configured: true, routingRuleCount: 0 } }
      }
    });
  });

  it('deletes website configuration when desired state is null', async () => {
    const { applyOssBucketConfig } = await import('../providers/oss');
    let websiteReadCount = 0;
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketWebsite') {
        websiteReadCount += 1;
        if (websiteReadCount === 1) {
          return { body: { WebsiteConfiguration: { IndexDocument: { Suffix: 'index.html' } } } };
        }
        throw Object.assign(new Error('missing'), { code: 'NoSuchWebsiteConfiguration' });
      }
      if (params.action === 'GetBucketLifecycle') throw Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
      if (params.action === 'GetBucketCors') throw Object.assign(new Error('missing'), { code: 'NoSuchCORSConfiguration' });
      if (params.action === 'GetBucketEncryption') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchServerSideEncryptionRule' });
      }
      return { body: {} };
    });

    const result = await applyOssBucketConfig('demo-bucket', { website: null });

    expect(mockDeleteBucketWebsiteWithOptions).toHaveBeenCalledWith('demo-bucket', {}, expect.anything());
    expect(result.execution.appliedSections).toEqual(['website']);
    expect(result.verify.config.website.configured).toBe(false);
  });

  it('does not write website configuration when the desired state already matches', async () => {
    const { applyOssBucketConfig } = await import('../providers/oss');
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketWebsite') return { body: { WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html', SupportSubDir: false, Type: '0' },
        ErrorDocument: { Key: 'index.html', HttpStatus: '200' }
      } } };
      if (params.action === 'GetBucketLifecycle') throw Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
      if (params.action === 'GetBucketCors') throw Object.assign(new Error('missing'), { code: 'NoSuchCORSConfiguration' });
      if (params.action === 'GetBucketEncryption') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchServerSideEncryptionRule' });
      }
      return { body: {} };
    });

    const result = await applyOssBucketConfig('demo-bucket', {
      website: {
        indexDocument: { suffix: 'index.html' },
        errorDocument: { key: 'index.html', httpStatus: 200 }
      }
    });

    expect(result.plan).toMatchObject({ changeCount: 0, willExecute: false });
    expect(result.execution.appliedSections).toEqual([]);
    expect(mockExecute.mock.calls.some(([params]) => params?.action === 'PutBucketWebsite')).toBe(false);
    expect(mockDeleteBucketWebsiteWithOptions).not.toHaveBeenCalled();
  });

  it('restores the original website snapshot when read-back verification fails', async () => {
    const { applyOssBucketConfig } = await import('../providers/oss');
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketWebsite') return { body: { WebsiteConfiguration: {
        IndexDocument: { Suffix: 'old.html', SupportSubDir: false, Type: '0' }
      } } };
      if (params.action === 'GetBucketLifecycle') throw Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
      if (params.action === 'GetBucketCors') throw Object.assign(new Error('missing'), { code: 'NoSuchCORSConfiguration' });
      if (params.action === 'GetBucketEncryption') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchServerSideEncryptionRule' });
      }
      return { body: {} };
    });

    await expect(applyOssBucketConfig('demo-bucket', {
      website: { indexDocument: { suffix: 'index.html' } }
    })).rejects.toThrow(/已回滚 1 个已变更配置/);

    const websiteWrites = mockExecute.mock.calls.filter(([params]) => params?.action === 'PutBucketWebsite');
    expect(websiteWrites).toHaveLength(2);
    expect(websiteWrites[1]?.[1]).toMatchObject({
      body: { WebsiteConfiguration: { IndexDocument: { Suffix: 'old.html' } } }
    });
  });

  it('plans a config change without calling mutation APIs', async () => {
    const { planOssBucketConfig } = await import('../providers/oss');

    const plan = await planOssBucketConfig('demo-bucket', { encryption: { algorithm: 'AES256' } });

    expect(plan).toMatchObject({
      bucket: 'demo-bucket',
      changeCount: 1,
      requiresConfirmation: true,
      willExecute: false,
      changes: [{ section: 'encryption', action: 'set' }]
    });
    expect(mockExecute.mock.calls.some(([params]) => params?.action === 'PutBucketEncryption')).toBe(false);
    expect(mockDeleteBucketEncryptionWithOptions).not.toHaveBeenCalled();
  });

  it('applies encryption and verifies the desired state', async () => {
    const { applyOssBucketConfig } = await import('../providers/oss');
    let encryptionReadCount = 0;
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketEncryption') {
        encryptionReadCount += 1;
        return encryptionReadCount === 1
          ? { body: { ServerSideEncryptionRule: {} } }
          : { body: { ServerSideEncryptionRule: {
              ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' }
            } } };
      }
      if (params.action === 'GetBucketLifecycle') throw Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
      if (params.action === 'GetBucketCors') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchCORSConfiguration' });
      }
      return { body: {} };
    });

    const result = await applyOssBucketConfig('demo-bucket', { encryption: { algorithm: 'AES256' } });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PutBucketEncryption', pathname: '/?encryption', method: 'PUT' }),
      expect.objectContaining({
        body: {
          ServerSideEncryptionRule: expect.anything()
        }
      }),
      expect.anything()
    );
    expect(result).toMatchObject({
      plan: { changeCount: 1, willExecute: true },
      execution: { appliedSections: ['encryption'] },
      verify: { performed: true, matched: true, config: { encryption: { configured: true, algorithm: 'AES256' } } }
    });
  });

  it('rolls back already applied sections when a later section fails', async () => {
    const { applyOssBucketConfig } = await import('../providers/oss');
    const missingLifecycle = Object.assign(new Error('missing'), { code: 'NoSuchLifecycle' });
    const missingCors = Object.assign(new Error('missing'), { code: 'NoSuchCORSConfiguration' });
    mockExecute.mockImplementation(async (params: { action?: string }) => {
      if (params.action === 'GetBucketLifecycle') throw missingLifecycle;
      if (params.action === 'GetBucketCors') throw missingCors;
      if (params.action === 'GetBucketEncryption') {
        throw Object.assign(new Error('missing'), { code: 'NoSuchServerSideEncryptionRule' });
      }
      if (params.action === 'PutBucketCors') {
        throw Object.assign(new Error('AccessDenied'), { code: 'AccessDenied' });
      }
      return { body: {} };
    });

    await expect(applyOssBucketConfig('demo-bucket', {
      lifecycle: {
        rules: [{ id: 'test', status: 'Enabled', prefix: 'licell-config-test/', expiration: { days: 365 } }]
      },
      cors: {
        rules: [{ allowedOrigins: ['https://example.com'], allowedMethods: ['GET'] }]
      }
    })).rejects.toThrow(/已回滚 1 个已变更配置/);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PutBucketLifecycle', pathname: '/?lifecycle', method: 'PUT' }),
      expect.objectContaining({
        body: {
          LifecycleConfiguration: expect.anything()
        }
      }),
      expect.anything()
    );
    expect(mockDeleteBucketLifecycleWithOptions).toHaveBeenCalledWith('demo-bucket', {}, expect.anything());
  });

  it('keeps non-default storageClass in createBucketConfiguration', async () => {
    const { createOssBucket } = await import('../providers/oss');

    await createOssBucket('demo-bucket', { storageClass: 'IA' });

    const request = mockPutBucketWithOptions.mock.calls[0]?.[1];
    expect(request?.createBucketConfiguration?.storageClass).toBe('IA');
  });

  it('uploads object content with binary body and content type', async () => {
    const { uploadOssObjectContent } = await import('../providers/oss');

    const result = await uploadOssObjectContent('demo-bucket', 'auth-transfer/demo.json', Buffer.from('hello'), {
      contentType: 'application/json'
    });

    expect(mockPutObjectWithOptions).toHaveBeenCalledTimes(1);
    const request = mockPutObjectWithOptions.mock.calls[0]?.[2];
    const headers = mockPutObjectWithOptions.mock.calls[0]?.[3];
    expect(request?.body).toBeTruthy();
    expect(headers?.commonHeaders?.['content-type']).toBe('application/json');
    expect(headers?.commonHeaders?.['content-length']).toBe('5');
    expect(result).toMatchObject({
      bucket: 'demo-bucket',
      key: 'auth-transfer/demo.json',
      contentLength: 5,
      contentType: 'application/json',
      etag: '"etag-demo"'
    });
  });

  it('treats empty xml putObject response as success after head verification', async () => {
    const { uploadOssObjectContent } = await import('../providers/oss');
    const emptyXmlError = new Error('not a valid value for parameter body');

    mockPutObjectWithOptions.mockRejectedValue(emptyXmlError);

    const result = await uploadOssObjectContent('demo-bucket', 'auth-transfer/demo.json', Buffer.from('hello'), {
      contentType: 'application/json'
    });

    expect(mockHeadObjectWithOptions).toHaveBeenCalledTimes(1);
    expect(result.etag).toBe('"verified-etag"');
  });

  it('treats empty xml putBucket response without stack as success', async () => {
    const { createOssBucket } = await import('../providers/oss');
    const emptyXmlError = new Error('not a valid value for parameter');

    mockPutBucketWithOptions.mockRejectedValue(emptyXmlError);

    const result = await createOssBucket('demo-bucket');

    expect(mockGetBucketInfoWithOptions).toHaveBeenCalled();
    expect(result.bucket).toBe('demo-bucket');
  });

  it('creates signed GET url for private object restore', async () => {
    const { createSignedOssGetUrl } = await import('../providers/oss');

    const result = createSignedOssGetUrl('demo-bucket', 'auth-transfer/demo.json', 3600);
    const url = new URL(result.url);

    expect(url.hostname).toBe('demo-bucket.oss-cn-hangzhou.aliyuncs.com');
    expect(url.pathname).toBe('/auth-transfer/demo.json');
    expect(url.searchParams.get('OSSAccessKeyId')).toBe('test-ak');
    expect(url.searchParams.get('Expires')).toBeTruthy();
    expect(url.searchParams.get('Signature')).toBeTruthy();
    expect(result.bucket).toBe('demo-bucket');
    expect(result.key).toBe('auth-transfer/demo.json');
    expect(result.expiresAt).toMatch(/T/);
  });

  it('returns a directly fetchable index.html URL for static deploys and clears public access block', async () => {
    const { deployOSS } = await import('../providers/oss');
    const root = mkdtempSync(join(tmpdir(), 'licell-oss-deploy-'));

    try {
      writeFileSync(join(root, 'index.html'), '<!doctype html><title>demo</title>\n');

      const url = await deployOSS('demo-app', root);

      expect(url).toBe('https://licell-demo-app-1494.oss-cn-hangzhou.aliyuncs.com/index.html');
      expect(mockPutBucketWithOptions).toHaveBeenCalledWith(
        'licell-demo-app-1494',
        expect.anything(),
        expect.objectContaining({ acl: 'public-read' }),
        expect.anything()
      );
      expect(mockExecute.mock.calls.some(([params]) => params?.action === 'DeleteBucketPublicAccessBlock')).toBe(true);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 0));
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps upload streams readable even after source cleanup', async () => {
    const { deployOSS } = await import('../providers/oss');
    const root = mkdtempSync(join(tmpdir(), 'licell-oss-deploy-'));
    let capturedStream: Readable | undefined;

    mockExecute.mockImplementation(async (_params: unknown, request: { stream?: Readable }) => {
      capturedStream = request.stream;
      return { body: {} };
    });

    try {
      writeFileSync(join(root, 'index.html'), '<!doctype html><title>demo</title>\n');

      await deployOSS('demo-app', root);
      rmSync(root, { recursive: true, force: true });

      expect(capturedStream).toBeTruthy();
      await expect(readStream(capturedStream!)).resolves.toContain('<title>demo</title>');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('treats inaccessible conflict bucket as unavailable name', async () => {
    const { createOssBucket } = await import('../providers/oss');
    const conflict = new Error('BucketAlreadyExists: The requested bucket name is not available.');
    (conflict as Error & { code?: string }).code = 'BucketAlreadyExists';
    const notFound = new Error('NoSuchBucket');
    (notFound as Error & { code?: string }).code = 'NoSuchBucket';

    mockPutBucketWithOptions.mockRejectedValue(conflict);
    mockGetBucketInfoWithOptions.mockRejectedValue(notFound);
    mockIsConflictError.mockReturnValue(true);
    mockIsNotFoundError.mockImplementation((err: unknown) => (err as { code?: string })?.code === 'NoSuchBucket');

    await expect(createOssBucket('demo-bucket', { allowExisting: true })).rejects.toThrow(/名称不可用/);
  });

  it('reuses accessible existing bucket when allowExisting is enabled', async () => {
    const { createOssBucket } = await import('../providers/oss');
    const conflict = new Error('BucketAlreadyExists');
    (conflict as Error & { code?: string }).code = 'BucketAlreadyExists';

    mockPutBucketWithOptions.mockRejectedValue(conflict);
    mockIsConflictError.mockReturnValue(true);

    const result = await createOssBucket('demo-bucket', { allowExisting: true });

    expect(result.created).toBe(false);
    expect(mockGetBucketInfoWithOptions).toHaveBeenCalled();
  });

  it('falls back to private bucket create when public acl is blocked', async () => {
    const { createOssBucket } = await import('../providers/oss');
    const publicAclBlocked = new Error('AccessDenied: Put public bucket acl is not allowed');
    const conflict = new Error('BucketAlreadyExists');
    (conflict as Error & { code?: string }).code = 'BucketAlreadyExists';

    mockPutBucketWithOptions
      .mockRejectedValueOnce(publicAclBlocked)
      .mockRejectedValueOnce(conflict);
    mockIsAccessDeniedError.mockImplementation((err: unknown) => String((err as Error)?.message || '').includes('AccessDenied'));
    mockIsConflictError.mockImplementation((err: unknown) => (err as { code?: string })?.code === 'BucketAlreadyExists');

    const result = await createOssBucket('demo-bucket', {
      acl: 'public-read',
      allowExisting: true,
      allowPublicAclBlockedFallback: true
    });

    expect(result.created).toBe(false);
    expect(mockPutBucketWithOptions).toHaveBeenNthCalledWith(
      1,
      'demo-bucket',
      expect.anything(),
      expect.objectContaining({ acl: 'public-read' }),
      expect.anything()
    );
    expect(mockPutBucketWithOptions).toHaveBeenNthCalledWith(
      2,
      'demo-bucket',
      expect.anything(),
      expect.objectContaining({ acl: 'private' }),
      expect.anything()
    );
    expect(mockGetBucketInfoWithOptions).toHaveBeenCalled();
  });
});
