import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPutBucketWithOptions = vi.fn();
const mockGetBucketInfoWithOptions = vi.fn();
const mockPutBucketAclWithOptions = vi.fn();
const mockGetBucketAclWithOptions = vi.fn();
const mockExecute = vi.fn();

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
  isConflictError: () => false,
  isAccessDeniedError: () => false,
  isNotFoundError: () => false,
  isTransientError: () => false
}));

describe('createOssBucket', () => {
  beforeEach(() => {
    mockPutBucketWithOptions.mockReset();
    mockGetBucketInfoWithOptions.mockReset();
    mockPutBucketAclWithOptions.mockReset();
    mockGetBucketAclWithOptions.mockReset();
    mockExecute.mockReset();

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
    mockExecute.mockResolvedValue({ body: {} });
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
});
