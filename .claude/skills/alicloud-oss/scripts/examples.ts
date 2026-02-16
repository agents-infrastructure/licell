/**
 * Alibaba Cloud OSS SDK - Common Operation Examples
 *
 * Prerequisites:
 *   npm install @alicloud/oss20190517 @alicloud/openapi-client @alicloud/gateway-oss \
 *     @alicloud/gateway-spi @alicloud/tea-util @alicloud/openapi-util @alicloud/tea-typescript
 *
 *   export ALIBABA_CLOUD_ACCESS_KEY_ID="..."
 *   export ALIBABA_CLOUD_ACCESS_KEY_SECRET="..."
 */

import Client, {
  PutBucketRequest, CreateBucketConfiguration,
  ListObjectsRequest, ListObjectsV2Request,
  PutObjectRequest, GetObjectRequest, DeleteObjectRequest,
  DeleteMultipleObjectsRequest, Delete, DeleteObjectsRequestObject,
  HeadObjectRequest,
  CopyObjectRequest,
  InitiateMultipartUploadRequest, UploadPartRequest,
  CompleteMultipartUploadRequest, CompleteMultipartUpload,
  ListMultipartUploadsRequest, AbortMultipartUploadRequest,
  PutBucketLifecycleRequest, LifecycleConfiguration, LifecycleRule,
  LifecycleRuleLifecycleExpiration,
  PutBucketCorsRequest, CORSConfiguration, CORSRule,
  PutBucketLoggingRequest, BucketLoggingStatus, LoggingEnabled,
  PutBucketTagsRequest, Tagging, TagSet, Tag,
  GetObjectTaggingRequest, PutObjectTaggingRequest,
  RestoreObjectRequest, RestoreRequest,
  PutSymlinkRequest, GetSymlinkRequest,
} from '@alicloud/oss20190517';
import { Config } from '@alicloud/openapi-client';
import { Readable } from 'stream';
import * as fs from 'fs';

function createClient(regionId: string = 'cn-hangzhou'): Client {
  return new Client(new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId,
  }));
}

// ─── Bucket Operations ──────────────────────────────────────────

async function createBucket(client: Client, bucket: string, storageClass: string = 'Standard') {
  const result = await client.putBucket(bucket, new PutBucketRequest({
    createBucketConfiguration: new CreateBucketConfiguration({ storageClass }),
  }));
  console.log(`Bucket ${bucket} created`);
  return result;
}

async function listAllBuckets(client: Client) {
  const { body } = await client.listBuckets(new (await import('@alicloud/oss20190517')).ListBucketsRequest({}));
  console.log(`Found ${body.buckets?.bucket?.length || 0} buckets`);
  return body.buckets?.bucket || [];
}

async function getBucketInfo(client: Client, bucket: string) {
  const { body } = await client.getBucketInfo(bucket);
  console.log(`Bucket: ${body.bucketInfo?.bucket?.name}, Region: ${body.bucketInfo?.bucket?.location}`);
  return body.bucketInfo;
}

// ─── Object Operations ──────────────────────────────────────────

async function uploadString(client: Client, bucket: string, key: string, content: string) {
  await client.putObject(bucket, key, new PutObjectRequest({
    body: Readable.from(Buffer.from(content)),
    contentType: 'text/plain',
  }));
  console.log(`Uploaded ${key}`);
}

async function uploadFile(client: Client, bucket: string, key: string, filePath: string) {
  const stream = fs.createReadStream(filePath);
  await client.putObject(bucket, key, new PutObjectRequest({
    body: stream,
  }));
  console.log(`Uploaded ${key} from ${filePath}`);
}

async function downloadObject(client: Client, bucket: string, key: string): Promise<Buffer> {
  const { body: result } = await client.getObject(bucket, key, new GetObjectRequest({}));
  const chunks: Buffer[] = [];
  for await (const chunk of result.body as Readable) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function deleteObject(client: Client, bucket: string, key: string) {
  await client.deleteObject(bucket, key, new DeleteObjectRequest({}));
  console.log(`Deleted ${key}`);
}

async function deleteMultipleObjects(client: Client, bucket: string, keys: string[]) {
  await client.deleteMultipleObjects(bucket, new DeleteMultipleObjectsRequest({
    delete: new Delete({
      object: keys.map(k => new DeleteObjectsRequestObject({ key: k })),
      quiet: true,
    }),
  }));
  console.log(`Deleted ${keys.length} objects`);
}

async function headObject(client: Client, bucket: string, key: string) {
  const { body, headers } = await client.headObject(bucket, key, new HeadObjectRequest({}));
  console.log(`${key}: size=${headers?.['content-length']}, type=${headers?.['content-type']}`);
  return headers;
}

// ─── List Objects ───────────────────────────────────────────────

async function listObjectsV2(client: Client, bucket: string, prefix?: string) {
  const allObjects: any[] = [];
  let continuationToken: string | undefined;

  do {
    const { body } = await client.listObjectsV2(bucket, new ListObjectsV2Request({
      maxKeys: 1000,
      prefix,
      continuationToken,
    }));
    allObjects.push(...(body.contents || []));
    continuationToken = body.isTruncated ? body.nextContinuationToken || undefined : undefined;
  } while (continuationToken);

  console.log(`Found ${allObjects.length} objects with prefix "${prefix || ''}"`);
  return allObjects;
}

// ─── Multipart Upload ───────────────────────────────────────────

async function multipartUpload(client: Client, bucket: string, key: string, filePath: string) {
  const partSize = 5 * 1024 * 1024; // 5MB minimum
  const fileSize = fs.statSync(filePath).size;

  // Initiate
  const { body: init } = await client.initiateMultipartUpload(bucket, key,
    new InitiateMultipartUploadRequest({}));
  const uploadId = init.uploadId!;
  console.log(`Initiated multipart upload: ${uploadId}`);

  // Upload parts
  const parts: any[] = [];
  for (let i = 0; i < Math.ceil(fileSize / partSize); i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, fileSize);
    const stream = fs.createReadStream(filePath, { start, end: end - 1 });

    const { headers } = await client.uploadPart(bucket, key, new UploadPartRequest({
      body: stream,
      partNumber: i + 1,
      uploadId,
    }));
    parts.push({ partNumber: i + 1, ETag: headers?.['etag'] });
    console.log(`  Part ${i + 1} uploaded`);
  }

  // Complete
  await client.completeMultipartUpload(bucket, key, new CompleteMultipartUploadRequest({
    uploadId,
    completeMultipartUpload: new CompleteMultipartUpload({
      part: parts,
    }),
  }));
  console.log(`Multipart upload completed: ${key}`);
}

// ─── Bucket Configuration ───────────────────────────────────────

async function setLifecycleRule(client: Client, bucket: string, prefix: string, days: number) {
  await client.putBucketLifecycle(bucket, new PutBucketLifecycleRequest({
    lifecycleConfiguration: new LifecycleConfiguration({
      rule: [new LifecycleRule({
        id: `expire-${prefix.replace(/\//g, '-')}-${days}d`,
        prefix,
        status: 'Enabled',
        expiration: new LifecycleRuleLifecycleExpiration({ days }),
      })],
    }),
  }));
  console.log(`Lifecycle rule set: ${prefix} expires in ${days} days`);
}

async function setCorsRules(client: Client, bucket: string) {
  await client.putBucketCors(bucket, new PutBucketCorsRequest({
    CORSConfiguration: new CORSConfiguration({
      CORSRule: [new CORSRule({
        allowedOrigin: ['*'],
        allowedMethod: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowedHeader: ['*'],
        maxAgeSeconds: 3600,
      })],
    }),
  }));
  console.log('CORS rules configured');
}

async function setBucketTags(client: Client, bucket: string, tags: Record<string, string>) {
  await client.putBucketTags(bucket, new PutBucketTagsRequest({
    tagging: new Tagging({
      tagSet: new TagSet({
        tag: Object.entries(tags).map(([k, v]) => new Tag({ key: k, value: v })),
      }),
    }),
  }));
  console.log(`Bucket tags set: ${JSON.stringify(tags)}`);
}

// ─── Symlink & Restore ─────────────────────────────────────────

async function createSymlink(client: Client, bucket: string, symlinkKey: string, targetKey: string) {
  await client.putSymlink(bucket, symlinkKey);
  console.log(`Symlink ${symlinkKey} -> ${targetKey}`);
}

async function restoreArchiveObject(client: Client, bucket: string, key: string, days: number = 7) {
  await client.restoreObject(bucket, key, new RestoreObjectRequest({
    restoreRequest: new RestoreRequest({ days }),
  }));
  console.log(`Restore initiated for ${key}, available for ${days} days after completion`);
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const client = createClient('cn-hangzhou');
  const bucket = 'my-test-bucket';

  // List buckets
  await listAllBuckets(client);

  // Upload and download
  await uploadString(client, bucket, 'test.txt', 'Hello, OSS!');
  const content = await downloadObject(client, bucket, 'test.txt');
  console.log('Downloaded:', content.toString());

  // List objects
  await listObjectsV2(client, bucket, 'test');

  // Clean up
  await deleteObject(client, bucket, 'test.txt');
}

main().catch(console.error);
