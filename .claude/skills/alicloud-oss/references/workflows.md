# Common Workflows

## Workflow 1: Create Bucket and Upload Object

```
Step 1: putBucket → create bucket
Step 2: putObject → upload file
Step 3: listObjects → verify upload
```

```typescript
import Client, {
  PutBucketRequest, CreateBucketConfiguration,
  PutObjectRequest, ListObjectsRequest,
} from '@alicloud/oss20190517';
import { Readable } from 'stream';

// Create bucket
await client.putBucket('my-bucket', new PutBucketRequest({
  createBucketConfiguration: new CreateBucketConfiguration({
    storageClass: 'Standard',
  }),
}));

// Upload object
const content = Buffer.from('Hello, OSS!');
await client.putObject('my-bucket', 'hello.txt', new PutObjectRequest({
  body: Readable.from(content),
  contentType: 'text/plain',
}));

// List objects
const { body } = await client.listObjects('my-bucket', new ListObjectsRequest({
  maxKeys: 100,
}));
console.log('Objects:', body.contents?.map(o => o.key));
```

## Workflow 2: Multipart Upload for Large Files

```
Step 1: initiateMultipartUpload → get uploadId
Step 2: uploadPart (repeat) → upload each part
Step 3: completeMultipartUpload → finalize upload
```

```typescript
import Client, {
  InitiateMultipartUploadRequest, UploadPartRequest,
  CompleteMultipartUploadRequest, CompleteMultipartUpload, CompleteMultipartUploadRequestPart,
} from '@alicloud/oss20190517';
import * as fs from 'fs';

const bucket = 'my-bucket';
const key = 'large-file.zip';

// Initiate
const { body: init } = await client.initiateMultipartUpload(bucket, key,
  new InitiateMultipartUploadRequest({})
);
const uploadId = init.uploadId!;

// Upload parts (5MB each minimum)
const partSize = 5 * 1024 * 1024;
const fileSize = fs.statSync('/path/to/large-file.zip').size;
const parts: CompleteMultipartUploadRequestPart[] = [];

for (let i = 0; i < Math.ceil(fileSize / partSize); i++) {
  const start = i * partSize;
  const end = Math.min(start + partSize, fileSize);
  const stream = fs.createReadStream('/path/to/large-file.zip', { start, end: end - 1 });
  
  const { body: part } = await client.uploadPart(bucket, key, new UploadPartRequest({
    body: stream,
    partNumber: i + 1,
    uploadId,
  }));
  parts.push(new CompleteMultipartUploadRequestPart({
    partNumber: i + 1,
    ETag: part.etag,
  }));
}

// Complete
await client.completeMultipartUpload(bucket, key, new CompleteMultipartUploadRequest({
  uploadId,
  completeMultipartUpload: new CompleteMultipartUpload({ part: parts }),
}));
```

## Workflow 3: Configure Bucket Lifecycle Rules

```
Step 1: putBucketLifecycle → set lifecycle rules
Step 2: getBucketLifecycle → verify rules
```

```typescript
import Client, {
  PutBucketLifecycleRequest, LifecycleConfiguration, LifecycleRule,
  LifecycleRuleLifecycleExpiration,
} from '@alicloud/oss20190517';

await client.putBucketLifecycle('my-bucket', new PutBucketLifecycleRequest({
  lifecycleConfiguration: new LifecycleConfiguration({
    rule: [new LifecycleRule({
      id: 'delete-old-logs',
      prefix: 'logs/',
      status: 'Enabled',
      expiration: new LifecycleRuleLifecycleExpiration({ days: 30 }),
    })],
  }),
}));
```

## Workflow 4: Enable Cross-Region Replication

```
Step 1: getBucketReplicationLocation → check available targets
Step 2: putBucketReplication → configure replication
Step 3: getBucketReplicationProgress → monitor progress
```

```typescript
import Client, {
  PutBucketReplicationRequest, ReplicationConfiguration, ReplicationRule,
  ReplicationRuleDestination,
} from '@alicloud/oss20190517';

await client.putBucketReplication('my-bucket', new PutBucketReplicationRequest({
  replicationConfiguration: new ReplicationConfiguration({
    rule: new ReplicationRule({
      destination: new ReplicationRuleDestination({
        bucket: 'my-backup-bucket',
        location: 'oss-cn-shanghai',
      }),
      historicalObjectReplication: 'enabled',
    }),
  }),
}));
```

## Workflow 5: Static Website Hosting

```
Step 1: putBucketWebsite → configure website
Step 2: putBucketAcl → set public read
Step 3: putObject → upload index.html
```

```typescript
import Client, {
  PutBucketWebsiteRequest, WebsiteConfiguration,
  WebsiteConfigurationIndexDocument, WebsiteConfigurationErrorDocument,
} from '@alicloud/oss20190517';

await client.putBucketWebsite('my-website-bucket', new PutBucketWebsiteRequest({
  websiteConfiguration: new WebsiteConfiguration({
    indexDocument: new WebsiteConfigurationIndexDocument({ suffix: 'index.html' }),
    errorDocument: new WebsiteConfigurationErrorDocument({ key: '404.html' }),
  }),
}));

await client.putBucketAcl('my-website-bucket');
```

## Workflow 6: WORM Compliance Retention

```
Step 1: initiateBucketWorm → create WORM policy (unlocked)
Step 2: completeBucketWorm → lock the policy (irreversible)
Step 3: extendBucketWorm → extend retention days
```

```typescript
import Client, {
  InitiateBucketWormRequest, InitiateWormConfiguration,
  CompleteBucketWormRequest, ExtendBucketWormRequest, ExtendWormConfiguration,
} from '@alicloud/oss20190517';

// Create WORM policy (24h to lock)
const { body: worm } = await client.initiateBucketWorm('my-bucket',
  new InitiateBucketWormRequest({
    initiateWormConfiguration: new InitiateWormConfiguration({
      retentionPeriodInDays: 365,
    }),
  })
);

// Lock (irreversible!)
await client.completeBucketWorm('my-bucket', new CompleteBucketWormRequest({
  wormId: worm.wormId,
}));
```

## Workflow 7: Restore Archive Objects

```
Step 1: headObject → check storage class
Step 2: restoreObject → initiate restore
Step 3: headObject (poll) → wait for restore completion
Step 4: getObject → download restored object
```

```typescript
import Client, { RestoreObjectRequest, RestoreRequest } from '@alicloud/oss20190517';

// Restore archive object
await client.restoreObject('my-bucket', 'archived-file.zip',
  new RestoreObjectRequest({
    restoreRequest: new RestoreRequest({ days: 7 }),
  })
);

// Poll until restored
while (true) {
  const { headers } = await client.headObject('my-bucket', 'archived-file.zip',
    new (await import('@alicloud/oss20190517')).HeadObjectRequest({})
  );
  if (headers?.['x-oss-restore']?.includes('ongoing-request="false"')) break;
  await new Promise(r => setTimeout(r, 60000));
}
```

## Workflow 8: Server-Side Encryption

```
Step 1: putBucketEncryption → enable default encryption
Step 2: putObject → objects auto-encrypted
```

```typescript
import Client, {
  PutBucketEncryptionRequest, ServerSideEncryptionRule,
  ApplyServerSideEncryptionByDefault,
} from '@alicloud/oss20190517';

await client.putBucketEncryption('my-bucket', new PutBucketEncryptionRequest({
  serverSideEncryptionRule: new ServerSideEncryptionRule({
    applyServerSideEncryptionByDefault: new ApplyServerSideEncryptionByDefault({
      SSEAlgorithm: 'AES256',
    }),
  }),
}));
```
