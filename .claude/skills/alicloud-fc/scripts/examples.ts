/**
 * Alibaba Cloud Function Compute 3.0 - Common Operation Examples
 *
 * Copy and adapt these snippets for your use case.
 */

import Client from '@alicloud/fc20230330';
import { Config } from '@alicloud/openapi-core';

function createClient(): Client {
  const region = process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou';
  const config = new Config({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET!,
    regionId: region,
    endpoint: `${region}.fc.aliyuncs.com`,
  });
  return new Client(config);
}

// --- Function Operations ---

async function createFunction(client: Client) {
  const { body } = await client.createFunction({
    body: {
      functionName: 'hello-world',
      runtime: 'nodejs18',
      handler: 'index.handler',
      memorySize: 256,
      cpu: 0.35,
      diskSize: 512,
      timeout: 30,
      code: { zipFile: '<base64-encoded-zip>' },
    },
  });
  return body;
}

async function listFunctions(client: Client) {
  let nextToken: string | undefined;
  const allFunctions: any[] = [];
  do {
    const { body } = await client.listFunctions({ limit: 100, nextToken });
    allFunctions.push(...(body.functions || []));
    nextToken = body.nextToken;
  } while (nextToken);
  return allFunctions;
}

async function invokeFunction(client: Client, functionName: string, payload: any) {
  const { body } = await client.invokeFunction(functionName, {
    body: Buffer.from(JSON.stringify(payload)),
  });
  return body;
}

// --- Version & Alias Operations ---

async function publishVersion(client: Client, functionName: string, description: string) {
  const { body } = await client.publishFunctionVersion(functionName, {
    body: { description },
  });
  return body;
}

async function createAlias(
  client: Client,
  functionName: string,
  aliasName: string,
  versionId: string
) {
  const { body } = await client.createAlias(functionName, {
    body: { aliasName, versionId },
  });
  return body;
}

async function canaryDeploy(
  client: Client,
  functionName: string,
  aliasName: string,
  oldVersion: string,
  newVersion: string,
  weight: number
) {
  const { body } = await client.updateAlias(functionName, aliasName, {
    body: {
      versionId: oldVersion,
      additionalVersionWeight: { [newVersion]: weight },
    },
  });
  return body;
}

// --- Trigger Operations ---

async function createHttpTrigger(client: Client, functionName: string) {
  const { body } = await client.createTrigger(functionName, {
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
  return body;
}

async function createTimerTrigger(client: Client, functionName: string, cron: string) {
  const { body } = await client.createTrigger(functionName, {
    body: {
      triggerName: 'timer-trigger',
      triggerType: 'timer',
      triggerConfig: JSON.stringify({
        cronExpression: cron,
        enable: true,
        payload: '{}',
      }),
      qualifier: 'LATEST',
    },
  });
  return body;
}

// --- Async Invocation ---

async function configureAsync(client: Client, functionName: string) {
  const { body } = await client.putAsyncInvokeConfig(functionName, {
    body: {
      maxAsyncEventAgeInSeconds: 3600,
      maxAsyncRetryAttempts: 2,
    },
  });
  return body;
}

// --- Provisioned Instances ---

async function setProvision(client: Client, functionName: string, target: number) {
  const { body } = await client.putProvisionConfig(functionName, {
    qualifier: 'prod',
    body: { target, alwaysAllocateCPU: true },
  });
  return body;
}

// --- Layer Operations ---

async function createLayer(client: Client, layerName: string, zipBase64: string) {
  const { body } = await client.createLayerVersion(layerName, {
    body: {
      code: { zipFile: zipBase64 },
      compatibleRuntime: ['nodejs18', 'python3.10'],
      description: 'Shared dependencies layer',
    },
  });
  return body;
}

async function listLayers(client: Client) {
  const { body } = await client.listLayers({ limit: 100 });
  return body.layers;
}

// --- Custom Domain ---

async function createDomain(client: Client, domainName: string, functionName: string) {
  const { body } = await client.createCustomDomain({
    body: {
      domainName,
      protocol: 'HTTP',
    },
  });
  return body;
}

// --- Scaling & Concurrency ---

async function setScaling(client: Client, functionName: string) {
  await client.putScalingConfig(functionName, {
    body: { maximumInstanceCount: 100 },
  });
  await client.putConcurrencyConfig(functionName, {
    body: { reservedConcurrency: 50 },
  });
}

export {
  createClient,
  createFunction,
  listFunctions,
  invokeFunction,
  publishVersion,
  createAlias,
  canaryDeploy,
  createHttpTrigger,
  createTimerTrigger,
  configureAsync,
  setProvision,
  createLayer,
  listLayers,
  createDomain,
  setScaling,
};
