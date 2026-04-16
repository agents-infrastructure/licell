import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const mockPutBucketWithOptions = vi.fn();
const mockGetBucketInfoWithOptions = vi.fn();
const mockPutBucketAclWithOptions = vi.fn();
const mockGetBucketAclWithOptions = vi.fn();
const mockPutObjectWithOptions = vi.fn();
const mockHeadObjectWithOptions = vi.fn();
const mockExecute = vi.fn();
const mockIsConflictError = vi.fn();
const mockIsAccessDeniedError = vi.fn();
const mockIsNotFoundError = vi.fn();
const mockIsTransientError = vi.fn();

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
  }
}));

vi.mock('@alicloud/openapi-client', () => ({
  Config: class MockOpenApiConfig {
    constructor(input: unknown) {
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
    query: (input: unknown) => input
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
    mockPutObjectWithOptions.mockReset();
    mockHeadObjectWithOptions.mockReset();
    mockExecute.mockReset();
    mockIsConflictError.mockReset();
    mockIsAccessDeniedError.mockReset();
    mockIsNotFoundError.mockReset();
    mockIsTransientError.mockReset();

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
    mockPutObjectWithOptions.mockResolvedValue({ headers: { etag: '"etag-demo"' } });
    mockHeadObjectWithOptions.mockResolvedValue({ headers: { etag: '"verified-etag"' } });
    mockExecute.mockResolvedValue({ body: {} });
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
});
