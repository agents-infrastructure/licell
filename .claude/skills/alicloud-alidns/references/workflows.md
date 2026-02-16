# Common Workflows

## Workflow 1: Add Domain and Configure DNS Records

```
Step 1: addDomain → add domain to Alidns
Step 2: describeDomainInfo → verify domain added
Step 3: addDomainRecord → add A/CNAME/MX records
Step 4: describeDomainRecords → verify records
```

```typescript
import * as models from '@alicloud/alidns20150109/dist/models';

// Add domain
await client.addDomain(new models.AddDomainRequest({
  domainName: 'example.com',
}));

// Add A record
await client.addDomainRecord(new models.AddDomainRecordRequest({
  domainName: 'example.com',
  RR: 'www',
  type: 'A',
  value: '1.2.3.4',
  TTL: 600,
}));

// Add CNAME record
await client.addDomainRecord(new models.AddDomainRecordRequest({
  domainName: 'example.com',
  RR: 'cdn',
  type: 'CNAME',
  value: 'cdn.example.com.w.cdngslb.com',
  TTL: 600,
}));

// Add MX record
await client.addDomainRecord(new models.AddDomainRecordRequest({
  domainName: 'example.com',
  RR: '@',
  type: 'MX',
  value: 'mail.example.com',
  priority: 10,
  TTL: 600,
}));
```

## Workflow 2: Manage DNS Records (Update & Delete)

```
Step 1: describeDomainRecords → list all records
Step 2: updateDomainRecord → modify record value
Step 3: setDomainRecordStatus → enable/disable record
Step 4: deleteDomainRecord → remove record
```

```typescript
// List all records
const { body } = await client.describeDomainRecords(new models.DescribeDomainRecordsRequest({
  domainName: 'example.com',
  pageSize: 500,
}));

// Update a record
await client.updateDomainRecord(new models.UpdateDomainRecordRequest({
  recordId: 'record-id-xxx',
  RR: 'www',
  type: 'A',
  value: '5.6.7.8',
  TTL: 300,
}));

// Disable a record
await client.setDomainRecordStatus(new models.SetDomainRecordStatusRequest({
  recordId: 'record-id-xxx',
  status: 'Disable',
}));

// Delete a record
await client.deleteDomainRecord(new models.DeleteDomainRecordRequest({
  recordId: 'record-id-xxx',
}));
```

## Workflow 3: DNS Load Balancing (DNSSLB)

```
Step 1: addDomainRecord → add multiple A records for same subdomain
Step 2: setDNSSLBStatus → enable DNSSLB
Step 3: updateDNSSLBWeight → set weights
Step 4: describeDNSSLBSubDomains → verify
```

```typescript
// Add multiple A records for www
await client.addDomainRecord(new models.AddDomainRecordRequest({
  domainName: 'example.com', RR: 'www', type: 'A', value: '1.1.1.1',
}));
await client.addDomainRecord(new models.AddDomainRecordRequest({
  domainName: 'example.com', RR: 'www', type: 'A', value: '2.2.2.2',
}));

// Enable DNSSLB
await client.setDNSSLBStatus(new models.SetDNSSLBStatusRequest({
  domainName: 'example.com',
  subDomain: 'www.example.com',
  open: true,
}));

// Set weights
await client.updateDNSSLBWeight(new models.UpdateDNSSLBWeightRequest({
  recordId: 'record-id-1',
  weight: 3,
}));
```

## Workflow 4: Domain Group Management

```
Step 1: addDomainGroup → create group
Step 2: changeDomainGroup → move domain to group
Step 3: describeDomainGroups → list groups
Step 4: describeDomains (with groupId) → list domains in group
```

```typescript
// Create group
const { body: group } = await client.addDomainGroup(new models.AddDomainGroupRequest({
  groupName: 'Production',
}));

// Move domain to group
await client.changeDomainGroup(new models.ChangeDomainGroupRequest({
  domainName: 'example.com',
  groupId: group.groupId,
}));
```

## Workflow 5: Enable DNSSEC

```
Step 1: setDomainDnssecStatus → enable DNSSEC
Step 2: describeDomainDnssecInfo → get DS record info
Step 3: Add DS record at registrar manually
```

```typescript
// Enable DNSSEC
await client.setDomainDnssecStatus(new models.SetDomainDnssecStatusRequest({
  domainName: 'example.com',
  status: 'ON',
}));

// Get DS record info
const { body: dnssec } = await client.describeDomainDnssecInfo(
  new models.DescribeDomainDnssecInfoRequest({ domainName: 'example.com' })
);
console.log('DS Record:', dnssec.dsRecord);
console.log('Digest:', dnssec.digest);
```

## Workflow 6: Custom Resolution Lines

```
Step 1: addCustomLine → create custom line with IP ranges
Step 2: addDomainRecord (with line) → add record using custom line
Step 3: describeCustomLines → list custom lines
```

```typescript
// Create custom line for office network
const { body: line } = await client.addCustomLine(new models.AddCustomLineRequest({
  domainName: 'example.com',
  lineName: 'Office-Network',
  ipSegment: [{ startIp: '10.0.0.0', endIp: '10.0.255.255' }],
}));

// Add record using custom line
await client.addDomainRecord(new models.AddDomainRecordRequest({
  domainName: 'example.com',
  RR: 'internal',
  type: 'A',
  value: '192.168.1.1',
  line: line.lineCode,
}));
```

## Workflow 7: Batch Domain Operations

```
Step 1: operateBatchDomain → submit batch task
Step 2: describeBatchResultCount → check task status
Step 3: describeBatchResultDetail → get detailed results
```

```typescript
// Batch add records
await client.operateBatchDomain(new models.OperateBatchDomainRequest({
  type: 'RR_ADD',
  domainRecordInfo: [
    { domain: 'example.com', RR: 'app1', type: 'A', value: '1.1.1.1' },
    { domain: 'example.com', RR: 'app2', type: 'A', value: '2.2.2.2' },
    { domain: 'example.com', RR: 'app3', type: 'CNAME', value: 'cdn.example.com' },
  ],
}));
```

## Workflow 8: DNS Statistics and Monitoring

```
Step 1: describeDomainStatistics → get domain query stats
Step 2: describeRecordStatistics → get per-record stats
Step 3: describeDomainLogs → get operation logs
Step 4: describeRecordLogs → get record change logs
```

```typescript
// Get domain statistics for last 7 days
const { body: stats } = await client.describeDomainStatistics(
  new models.DescribeDomainStatisticsRequest({
    domainName: 'example.com',
    startDate: '2026-02-09',
    endDate: '2026-02-16',
  })
);

// Get record-level statistics
const { body: recStats } = await client.describeRecordStatistics(
  new models.DescribeRecordStatisticsRequest({
    domainName: 'example.com',
    RR: 'www',
    startDate: '2026-02-09',
    endDate: '2026-02-16',
  })
);
```

## Workflow 9: ISP Cache Flush

```
Step 1: describeIspFlushCacheRemainQuota → check remaining quota
Step 2: submitIspFlushCacheTask → submit flush task
Step 3: describeIspFlushCacheTasks → check task status
```

```typescript
// Check quota
const { body: quota } = await client.describeIspFlushCacheRemainQuota(
  new models.DescribeIspFlushCacheRemainQuotaRequest({})
);
console.log('Remaining:', quota.telephoneCount);

// Submit flush task
await client.submitIspFlushCacheTask(new models.SubmitIspFlushCacheTaskRequest({
  domainName: 'www.example.com',
}));
```
