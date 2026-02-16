# Common Workflows

## Workflow 1: Create and Deploy a Function

```
Step 1: createFunction → create function with code, runtime, handler
Step 2: invokeFunction → test the function
Step 3: publishFunctionVersion → publish a stable version
Step 4: createAlias → create alias pointing to the version
```

```typescript
// 1. Create function
await client.createFunction({
  body: {
    functionName: 'hello-world',
    runtime: 'nodejs18',
    handler: 'index.handler',
    memorySize: 256,
    timeout: 30,
    cpu: 0.35,
    diskSize: 512,
    code: { zipFile: base64EncodedZip },
  },
});

// 2. Invoke function
const { body: invokeResult } = await client.invokeFunction('hello-world', {
  body: Buffer.from(JSON.stringify({ key: 'value' })),
});

// 3. Publish version
const { body: version } = await client.publishFunctionVersion('hello-world', {
  body: { description: 'v1 release' },
});

// 4. Create alias
await client.createAlias('hello-world', {
  body: {
    aliasName: 'prod',
    versionId: version.versionId,
  },
});
```

## Workflow 2: Set Up Event-Driven Trigger

```
Step 1: createFunction → create the function
Step 2: createTrigger → attach trigger (OSS, Timer, HTTP, etc.)
Step 3: listTriggers → verify trigger created
```

```typescript
// Timer trigger (runs every 5 minutes)
await client.createTrigger('my-function', {
  body: {
    triggerName: 'timer-trigger',
    triggerType: 'timer',
    triggerConfig: JSON.stringify({
      cronExpression: '0 */5 * * * *',
      enable: true,
      payload: '{}',
    }),
    qualifier: 'LATEST',
  },
});

// HTTP trigger
await client.createTrigger('my-function', {
  body: {
    triggerName: 'http-trigger',
    triggerType: 'http',
    triggerConfig: JSON.stringify({
      methods: ['GET', 'POST'],
      authType: 'anonymous',
    }),
    qualifier: 'LATEST',
  },
});

// OSS trigger
await client.createTrigger('my-function', {
  body: {
    triggerName: 'oss-trigger',
    triggerType: 'oss',
    triggerConfig: JSON.stringify({
      events: ['oss:ObjectCreated:PutObject'],
      filter: { key: { prefix: 'uploads/', suffix: '.jpg' } },
    }),
    sourceArn: 'acs:oss:cn-hangzhou:123456:my-bucket',
    invocationRole: 'acs:ram::123456:role/fc-oss-role',
    qualifier: 'LATEST',
  },
});
```

## Workflow 3: Configure Async Invocation with DLQ

```
Step 1: putAsyncInvokeConfig → set retry, DLQ, and destination
Step 2: invokeFunction (async) → invoke with Async header
Step 3: listAsyncTasks → monitor async task status
Step 4: getAsyncTask → get task details
```

```typescript
// Configure async invocation
await client.putAsyncInvokeConfig('my-function', {
  body: {
    maxAsyncEventAgeInSeconds: 3600,
    maxAsyncRetryAttempts: 2,
    destinationConfig: {
      onSuccess: { destination: 'acs:fc:cn-hangzhou:123456:functions/on-success' },
      onFailure: { destination: 'acs:mns:cn-hangzhou:123456:/queues/dlq' },
    },
  },
});
```

## Workflow 4: Blue-Green Deployment with Aliases

```
Step 1: updateFunction → deploy new code
Step 2: publishFunctionVersion → publish new version
Step 3: updateAlias → shift traffic gradually
```

```typescript
// Update function code
await client.updateFunction('my-function', {
  body: { code: { zipFile: newBase64Zip } },
});

// Publish new version
const { body: newVer } = await client.publishFunctionVersion('my-function', {
  body: { description: 'v2 release' },
});

// Canary: 90% old version, 10% new version
await client.updateAlias('my-function', 'prod', {
  body: {
    versionId: oldVersionId,
    additionalVersionWeight: { [newVer.versionId!]: 0.1 },
  },
});

// Full rollout
await client.updateAlias('my-function', 'prod', {
  body: { versionId: newVer.versionId },
});
```

## Workflow 5: Provisioned Instances for Low Latency

```
Step 1: putProvisionConfig → set provisioned instances
Step 2: getProvisionConfig → check provisioning status
Step 3: listInstances → verify running instances
```

```typescript
// Set 5 provisioned instances for prod alias
await client.putProvisionConfig('my-function', {
  qualifier: 'prod',
  body: { target: 5, alwaysAllocateCPU: true },
});

// Check status
const { body: provision } = await client.getProvisionConfig('my-function', {
  qualifier: 'prod',
});
console.log(`Current: ${provision.current}, Target: ${provision.target}`);
```

## Workflow 6: Custom Domain with HTTPS

```
Step 1: createCustomDomain → bind domain with routes
Step 2: getCustomDomain → verify configuration
Step 3: updateCustomDomain → update routes or cert
```

```typescript
await client.createCustomDomain({
  body: {
    domainName: 'api.example.com',
    protocol: 'HTTPS',
    routeConfig: {
      routes: [{
        path: '/*',
        functionName: 'my-api',
        qualifier: 'prod',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      }],
    },
    certConfig: {
      certName: 'my-cert',
      certificate: '-----BEGIN CERTIFICATE-----...',
      privateKey: '-----BEGIN PRIVATE KEY-----...',
    },
  },
});
```

## Workflow 7: Layer Management

```
Step 1: createLayerVersion → upload shared code/dependencies
Step 2: listLayers → list available layers
Step 3: createFunction / updateFunction → attach layer to function
```

```typescript
// Create a layer with shared dependencies
const { body: layer } = await client.createLayerVersion('my-utils-layer', {
  body: {
    code: { zipFile: layerBase64Zip },
    compatibleRuntime: ['nodejs18', 'nodejs16'],
    description: 'Shared utility functions',
  },
});

// Use layer in function
await client.updateFunction('my-function', {
  body: {
    layers: [layer.layerVersionArn],
  },
});
```

## Workflow 8: Scaling Configuration

```
Step 1: putScalingConfig → set scaling policies
Step 2: putConcurrencyConfig → set concurrency limits
Step 3: getScalingConfig → verify settings
```

```typescript
// Set scaling config
await client.putScalingConfig('my-function', {
  body: {
    maximumInstanceCount: 100,
    minimumInstanceCount: 0,
  },
});

// Set concurrency config
await client.putConcurrencyConfig('my-function', {
  body: { reservedConcurrency: 50 },
});
```
