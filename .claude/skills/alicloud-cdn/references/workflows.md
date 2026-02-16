# Common Workflows

## Workflow 1: Add CDN Domain and Configure

```
Step 1: addCdnDomain → add accelerated domain
Step 2: describeCdnDomainDetail → verify domain added
Step 3: verifyDomainOwner → verify ownership
Step 4: setCdnDomainSSLCertificate → enable HTTPS
Step 5: batchSetCdnDomainConfig → configure cache/headers/etc.
```

```typescript
import * as models from '@alicloud/cdn20180510/dist/models';

// Add CDN domain
await client.addCdnDomain(new models.AddCdnDomainRequest({
  domainName: 'cdn.example.com',
  cdnType: 'web',
  sources: JSON.stringify([{
    content: 'origin.example.com',
    type: 'domain',
    port: 443,
    priority: '20',
    weight: '10',
  }]),
}));

// Configure cache rules and HTTPS
await client.batchSetCdnDomainConfig(new models.BatchSetCdnDomainConfigRequest({
  domainNames: 'cdn.example.com',
  functions: JSON.stringify([
    {
      functionName: 'filetype_based_ttl_set',
      functionArgs: [
        { argName: 'ttl', argValue: '2592000' },
        { argName: 'file_type', argValue: 'jpg,png,gif,css,js' },
        { argName: 'weight', argValue: '1' },
      ],
    },
    {
      functionName: 'https_force',
      functionArgs: [{ argName: 'enable', argValue: 'on' }],
    },
  ]),
}));
```

## Workflow 2: SSL Certificate Management

```
Step 1: describeCdnCertificateList → list available certs
Step 2: setCdnDomainSSLCertificate → bind cert to domain
Step 3: describeCdnDomainCertificateInfo → verify cert status
```

```typescript
// Enable SSL with certificate
await client.setCdnDomainSSLCertificate(new models.SetCdnDomainSSLCertificateRequest({
  domainName: 'cdn.example.com',
  SSLProtocol: 'on',
  certName: 'my-cert',
  certType: 'cas',  // cas=Certificate Authority Service, upload=custom
}));

// Check certificate info
const { body } = await client.describeCdnDomainCertificateInfo(
  new models.DescribeCdnDomainCertificateInfoRequest({ domainName: 'cdn.example.com' })
);
```

## Workflow 3: Cache Refresh and Prefetch

```
Step 1: refreshObjectCaches → purge cached content
Step 2: pushObjectCache → prefetch content to edge nodes
Step 3: describeRefreshTasks → check task status
Step 4: describeRefreshQuota → check remaining quota
```

```typescript
// Refresh URLs
const { body: refresh } = await client.refreshObjectCaches(new models.RefreshObjectCachesRequest({
  objectPath: 'https://cdn.example.com/index.html\nhttps://cdn.example.com/style.css',
  objectType: 'File',  // File or Directory
}));

// Refresh by directory
await client.refreshObjectCaches(new models.RefreshObjectCachesRequest({
  objectPath: 'https://cdn.example.com/images/',
  objectType: 'Directory',
}));

// Prefetch popular content
await client.pushObjectCache(new models.PushObjectCacheRequest({
  objectPath: 'https://cdn.example.com/video/promo.mp4',
}));

// Check task status
const { body: tasks } = await client.describeRefreshTasks(new models.DescribeRefreshTasksRequest({
  taskId: refresh.refreshTaskId,
}));

// Check quota
const { body: quota } = await client.describeRefreshQuota(new models.DescribeRefreshQuotaRequest({}));
console.log(`URL refresh remaining: ${quota.urlRemain}`);
console.log(`Dir refresh remaining: ${quota.dirRemain}`);
console.log(`Prefetch remaining: ${quota.preloadRemain}`);
```

## Workflow 4: Real-Time Monitoring

```
Step 1: describeDomainRealTimeQpsData → get real-time QPS
Step 2: describeDomainRealTimeBpsData → get real-time bandwidth
Step 3: describeDomainRealTimeHttpCodeData → get HTTP status codes
Step 4: describeDomainRealTimeByteHitRateData → get cache hit rate
```

```typescript
// Real-time QPS (1-minute granularity)
const { body: qps } = await client.describeDomainRealTimeQpsData(
  new models.DescribeDomainRealTimeQpsDataRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-16T00:00:00Z',
    endTime: '2026-02-16T01:00:00Z',
  })
);

// Real-time bandwidth
const { body: bps } = await client.describeDomainRealTimeBpsData(
  new models.DescribeDomainRealTimeBpsDataRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-16T00:00:00Z',
    endTime: '2026-02-16T01:00:00Z',
  })
);

// Cache hit rate
const { body: hitRate } = await client.describeDomainRealTimeByteHitRateData(
  new models.DescribeDomainRealTimeByteHitRateDataRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-16T00:00:00Z',
    endTime: '2026-02-16T01:00:00Z',
  })
);
```

## Workflow 5: Traffic Analysis

```
Step 1: describeDomainTopUrlVisit → top visited URLs
Step 2: describeDomainTopClientIpVisit → top client IPs
Step 3: describeDomainTopReferVisit → top referrers
Step 4: describeDomainISPData → traffic by ISP
Step 5: describeDomainRegionData → traffic by region
```

```typescript
// Top URLs
const { body: topUrls } = await client.describeDomainTopUrlVisit(
  new models.DescribeDomainTopUrlVisitRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-15T00:00:00Z',
  })
);

// Top client IPs
const { body: topIps } = await client.describeDomainTopClientIpVisit(
  new models.DescribeDomainTopClientIpVisitRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-15T00:00:00Z',
  })
);
```

## Workflow 6: Log Management

```
Step 1: describeCdnDomainLogs → get log download URLs
Step 2: createRealTimeLogDelivery → set up real-time log delivery
Step 3: describeRealtimeDeliveryAcc → check delivery status
```

```typescript
// Get log download URLs
const { body: logs } = await client.describeCdnDomainLogs(
  new models.DescribeCdnDomainLogsRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-15T00:00:00Z',
    endTime: '2026-02-16T00:00:00Z',
    pageSize: 100,
  })
);

// Set up real-time log delivery to SLS
await client.createRealTimeLogDelivery(new models.CreateRealTimeLogDeliveryRequest({
  domain: 'cdn.example.com',
  project: 'cdn-log-project',
  logstore: 'cdn-log-store',
  region: 'cn-hangzhou',
}));
```

## Workflow 7: Usage and Billing

```
Step 1: describeCdnUserBillType → check billing type
Step 2: describeDomainUsageData → get usage data
Step 3: describeCdnUserQuota → check resource quota
Step 4: createUsageDetailDataExportTask → export detailed usage
```

```typescript
// Get usage data
const { body: usage } = await client.describeDomainUsageData(
  new models.DescribeDomainUsageDataRequest({
    domainName: 'cdn.example.com',
    startTime: '2026-02-01T00:00:00Z',
    endTime: '2026-02-16T00:00:00Z',
    field: 'traf',  // traf=traffic, bps=bandwidth, acc=requests
  })
);

// Check quota
const { body: quota } = await client.describeCdnUserQuota(new models.DescribeCdnUserQuotaRequest({}));
console.log(`Domain quota: ${quota.domainQuota}`);
```

## Workflow 8: IP Verification and Blocking

```
Step 1: describeIpInfo → check if IP belongs to CDN
Step 2: setCdnFullDomainsBlockIP → block malicious IPs
Step 3: describeCdnFullDomainsBlockIPHistory → check block history
```

```typescript
// Check IP
const { body: ipInfo } = await client.describeIpInfo(
  new models.DescribeIpInfoRequest({ IP: '1.2.3.4' })
);
console.log(`Is CDN IP: ${ipInfo.cdnIp}`);

// Block IP across all domains
await client.setCdnFullDomainsBlockIP(new models.SetCdnFullDomainsBlockIPRequest({
  blockInterval: 3600,
  IPList: '5.6.7.8',
  updateType: 'add',
}));
```
