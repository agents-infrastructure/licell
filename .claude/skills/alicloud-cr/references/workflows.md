# Common Workflows

## Workflow 1: Set Up a New Image Repository

Create a complete image repository with namespace, repository, build rules, and sync rules.

```
Step 1: listInstance → get instanceId
Step 2: createNamespace → create namespace in instance
Step 3: createRepository → create repo in namespace
Step 4: createRepoSourceCodeRepo → bind source code repo (optional)
Step 5: createRepoBuildRule → set up auto-build rules (optional)
Step 6: createRepoTrigger → set up triggers (optional)
```

```typescript
// 1. Get instance
const { body: instBody } = await client.listInstance({ pageNo: 1, pageSize: 10 });
const instanceId = instBody.instances![0].instanceId!;

// 2. Create namespace
await client.createNamespace({
  instanceId,
  namespaceName: 'my-project',
  autoCreateRepo: true,
  defaultRepoType: 'PRIVATE',
});

// 3. Create repository
await client.createRepository({
  instanceId,
  repoNamespaceName: 'my-project',
  repoName: 'my-app',
  repoType: 'PRIVATE',
  summary: 'My application image',
});
```

## Workflow 2: Cross-Region Image Sync

Set up image synchronization between two regions.

```
Step 1: listInstance → get source and target instance IDs
Step 2: createRepoSyncRule → create sync rule
Step 3: createRepoSyncTask → trigger manual sync (or wait for auto sync)
Step 4: getRepoSyncTask / listRepoSyncTask → monitor sync status
```

```typescript
// Create sync rule from cn-hangzhou to cn-shanghai
await client.createRepoSyncRule({
  instanceId: sourceInstanceId,
  namespaceName: 'my-project',
  targetInstanceId: targetInstanceId,
  targetRegionId: 'cn-shanghai',
  targetNamespaceName: 'my-project',
  syncTrigger: 'PASSIVE',  // PASSIVE=manual, INITIATIVE=auto on push
  syncScope: 'NAMESPACE',
  tagFilter: '.*',
});
```

## Workflow 3: Security Scan an Image

Scan an image for vulnerabilities and review results.

```
Step 1: createRepoTagScanTask → trigger scan
Step 2: getRepoTagScanStatus → poll until scan completes
Step 3: getRepoTagScanSummary → get summary
Step 4: listRepoTagScanResult → get detailed vulnerabilities
```

```typescript
// 1. Trigger scan
await client.createRepoTagScanTask({
  instanceId,
  repoId,
  tag: 'latest',
  scanType: 'DEFAULT',
});

// 2. Poll status
let status = 'SCANNING';
while (status === 'SCANNING') {
  await new Promise(r => setTimeout(r, 5000));
  const { body } = await client.getRepoTagScanStatus({ instanceId, repoId, tag: 'latest' });
  status = body.status!;
}

// 3. Get results
const { body: results } = await client.listRepoTagScanResult({
  instanceId, repoId, tag: 'latest',
  pageNo: 1, pageSize: 100,
});
console.log('Vulnerabilities:', results.vulnerabilities);
```

## Workflow 4: Set Up Delivery Chain

Create a delivery chain for automated CI/CD pipeline.

```
Step 1: listInstance → get instanceId
Step 2: createChain → create delivery chain with node configuration
Step 3: listChain → verify chain created
Step 4: listChainInstance → monitor chain execution
```

## Workflow 5: Manage Helm Charts

Work with Helm chart repositories.

```
Step 1: createChartNamespace → create chart namespace
Step 2: createChartRepository → create chart repo
Step 3: listChartRelease → list chart versions
Step 4: deleteChartRelease → clean up old versions
```

## Workflow 6: Image Lifecycle Management

Set up artifact lifecycle rules to automatically clean up old images.

```
Step 1: createArtifactLifecycleRule → define retention policy
Step 2: listArtifactLifecycleRule → verify rules
Step 3: getArtifactLifecycleRule → check rule details
Step 4: updateArtifactLifecycleRule → modify as needed
```

## Workflow 7: Event Monitoring

Set up event notifications for registry activities.

```
Step 1: listEventCenterRuleName → list available event rules
Step 2: updateEventCenterRule → configure notification rules
Step 3: listEventCenterRecord → query event history
```
