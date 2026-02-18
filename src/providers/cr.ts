import CR, * as $CR from '@alicloud/cr20181201';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { Config, type AuthConfig } from '../utils/config';
import { resolveSdkCtor } from '../utils/sdk';
import { isConflictError } from '../utils/errors';
import { randomStrongPassword } from '../utils/crypto';

const CRClientCtor = resolveSdkCtor<CR>(CR, '@alicloud/cr20181201');

export interface AcrInfo {
  instanceId: string | null;
  registryEndpoint: string;
  vpcRegistryEndpoint: string;
  namespace: string;
  repoName: string;
}

export interface DockerCredentials {
  endpoint: string;
  userName: string;
  password: string;
}

const DEFAULT_ACR_NAMESPACE = 'licell';
const ACR_NAMESPACE_MAX_LENGTH = 120;
const ACR_NAMESPACE_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const LEGACY_CR_API_VERSION = '2016-06-07';
const LEGACY_CR_USER_PATH = '/users';
const LEGACY_CR_NAMESPACE_PATH = '/namespace';

export function normalizeAcrNamespace(input: string): string {
  const value = input.trim().toLowerCase();
  if (!value) throw new Error('ACR namespace 不能为空');
  if (value.length < 2 || value.length > ACR_NAMESPACE_MAX_LENGTH) {
    throw new Error(`ACR namespace 长度需在 2-${ACR_NAMESPACE_MAX_LENGTH} 之间`);
  }
  if (!ACR_NAMESPACE_PATTERN.test(value)) {
    throw new Error('ACR namespace 仅支持小写字母、数字、点、短横线、下划线，且分隔符不能在首尾');
  }
  return value;
}

function createCrClient(auth?: AuthConfig) {
  const resolved = auth ?? Config.requireAuth();
  return new CRClientCtor(new $OpenApi.Config({
    accessKeyId: resolved.ak,
    accessKeySecret: resolved.sk,
    regionId: resolved.region,
    endpoint: `cr.${resolved.region}.aliyuncs.com`
  }));
}

async function findEnterpriseInstance(client: CR): Promise<{ instanceId: string; instanceName: string } | null> {
  const resp = await client.listInstance(new $CR.ListInstanceRequest({ instanceStatus: 'RUNNING', pageNo: 1, pageSize: 30 }));
  const instances = resp.body?.instances || [];
  if (instances.length === 0) return null;
  const inst = instances[0];
  if (!inst.instanceId || !inst.instanceName) return null;
  return { instanceId: inst.instanceId, instanceName: inst.instanceName };
}

async function ensureNamespace(client: CR, instanceId: string, namespaceName: string) {
  try {
    await client.createNamespace(new $CR.CreateNamespaceRequest({ instanceId, namespaceName, autoCreateRepo: true, defaultRepoType: 'PRIVATE' }));
  } catch (err) {
    if (!isConflictError(err) && !isNamespaceExistsError(err)) throw err;
  }
}

async function ensureRepository(client: CR, instanceId: string, namespaceName: string, repoName: string) {
  try {
    await client.createRepository(new $CR.CreateRepositoryRequest({
      instanceId,
      repoNamespaceName: namespaceName,
      repoName,
      repoType: 'PRIVATE',
      summary: `licell deploy: ${repoName}`
    }));
  } catch (err) {
    if (!isConflictError(err) && !isRepoExistsError(err)) throw err;
  }
}

function isNamespaceExistsError(err: unknown): boolean {
  return isCodeError(err, 'NAMESPACE_EXIST') || isCodeError(err, 'NAMESPACE_ALREADY_EXIST');
}

function isRepoExistsError(err: unknown): boolean {
  return isCodeError(err, 'REPO_EXIST') || isCodeError(err, 'REPO_ALREADY_EXIST');
}

function isPersonalUserNotRegisteredError(err: unknown): boolean {
  return isCodeError(err, 'USER_NOT_REGISTERED') || isCodeError(err, 'USER_NOT_EXIST');
}

function isPersonalUserAlreadyExistsError(err: unknown): boolean {
  return isCodeError(err, 'USER_ALREADY_EXIST') || isCodeError(err, 'USER_EXIST');
}

function isCodeError(err: unknown, code: string): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const errCode = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const errMsg = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return errCode === code || errMsg.includes(code);
}

export function buildAcrPersonalUserPayload(password = randomStrongPassword(20)) {
  return {
    user: {
      password
    }
  };
}

async function doLegacyRoaRequest(client: CR, action: string, method: string, path: string, request?: $OpenApi.OpenApiRequest) {
  return client.doROARequest(
    action,
    LEGACY_CR_API_VERSION,
    'HTTPS',
    method,
    'AK',
    path,
    'json',
    request || new $OpenApi.OpenApiRequest({}),
    new $Util.RuntimeOptions({})
  );
}

async function registerPersonalUserForAcr(client: CR) {
  const createRequest = new $OpenApi.OpenApiRequest({ body: buildAcrPersonalUserPayload() });
  try {
    await doLegacyRoaRequest(client, 'CreateUserInfo', 'PUT', LEGACY_CR_USER_PATH, createRequest);
    return;
  } catch (err) {
    if (!isPersonalUserAlreadyExistsError(err)) throw err;
  }

  const updateRequest = new $OpenApi.OpenApiRequest({ body: buildAcrPersonalUserPayload() });
  await doLegacyRoaRequest(client, 'UpdateUserInfo', 'POST', LEGACY_CR_USER_PATH, updateRequest);
}

async function listPersonalNamespaces(client: CR): Promise<string[]> {
  const resp = await doLegacyRoaRequest(client, 'GetNamespaceList', 'GET', LEGACY_CR_NAMESPACE_PATH) as {
    body?: { data?: { namespaces?: Array<{ namespace?: string }> } };
  };
  return (resp.body?.data?.namespaces || []).map(ns => ns.namespace || '').filter(Boolean);
}

async function listPersonalNamespacesWithRegistration(client: CR): Promise<string[]> {
  try {
    return await listPersonalNamespaces(client);
  } catch (err) {
    if (!isPersonalUserNotRegisteredError(err)) throw err;
  }

  await registerPersonalUserForAcr(client);
  return await listPersonalNamespaces(client);
}

export class NamespaceLimitError extends Error {
  existing: string[];
  constructor(existing: string[], desired: string) {
    super(
      `ACR 个人版命名空间数量已达上限（当前: ${existing.join(', ')}）。\n` +
      `请前往阿里云控制台删除不需要的命名空间，或手动创建 "${desired}"。\n` +
      `也可以使用已有命名空间：licell deploy --runtime docker --acr-namespace <name>`
    );
    this.existing = existing;
  }
}

async function ensurePersonalNamespace(client: CR, namespaceName: string) {
  const existing = await listPersonalNamespacesWithRegistration(client);
  if (existing.includes(namespaceName)) return;
  try {
    await doLegacyRoaRequest(
      client,
      'CreateNamespace',
      'PUT',
      LEGACY_CR_NAMESPACE_PATH,
      new $OpenApi.OpenApiRequest({ body: { Namespace: { Namespace: namespaceName } } })
    );
  } catch (err) {
    if (isConflictError(err) || isNamespaceExistsError(err)) return;
    if (isCodeError(err, 'NAMESPACE_LIMIT_EXCEED')) {
      throw new NamespaceLimitError(existing, namespaceName);
    }
    throw err;
  }
}

async function ensurePersonalRepository(client: CR, namespaceName: string, repoName: string) {
  try {
    await doLegacyRoaRequest(
      client,
      'CreateRepo',
      'PUT',
      '/repos',
      new $OpenApi.OpenApiRequest({
        body: { Repo: { RepoNamespace: namespaceName, RepoName: repoName, RepoType: 'PRIVATE', Summary: `licell deploy: ${repoName}` } }
      })
    );
  } catch (err) {
    if (!isConflictError(err) && !isRepoExistsError(err)) throw err;
  }
}

export async function ensureAcrReady(appName: string, region: string, auth?: AuthConfig, acrNamespace?: string): Promise<AcrInfo> {
  const client = createCrClient(auth);
  const namespace = normalizeAcrNamespace(acrNamespace || DEFAULT_ACR_NAMESPACE);
  const repoName = appName;

  const enterprise = await findEnterpriseInstance(client);

  if (enterprise) {
    await ensureNamespace(client, enterprise.instanceId, namespace);
    await ensureRepository(client, enterprise.instanceId, namespace, repoName);
    const registryEndpoint = `${enterprise.instanceName}-registry.${region}.cr.aliyuncs.com`;
    const vpcRegistryEndpoint = `${enterprise.instanceName}-registry-vpc.${region}.cr.aliyuncs.com`;
    return { instanceId: enterprise.instanceId, registryEndpoint, vpcRegistryEndpoint, namespace, repoName };
  }

  await ensurePersonalNamespace(client, namespace);
  await ensurePersonalRepository(client, namespace, repoName);

  const registryEndpoint = `registry.${region}.aliyuncs.com`;
  const vpcRegistryEndpoint = `registry-vpc.${region}.aliyuncs.com`;
  return { instanceId: null, registryEndpoint, vpcRegistryEndpoint, namespace, repoName };
}

export async function getDockerLoginCredentials(acrInfo: AcrInfo, auth?: AuthConfig): Promise<DockerCredentials> {
  const resolved = auth ?? Config.requireAuth();

  if (acrInfo.instanceId) {
    const client = createCrClient(resolved);
    const resp = await client.getAuthorizationToken(new $CR.GetAuthorizationTokenRequest({ instanceId: acrInfo.instanceId }));
    if (!resp.body?.tempUsername || !resp.body?.authorizationToken) {
      throw new Error('获取 ACR 企业版临时凭证失败，请检查实例状态');
    }
    return {
      endpoint: acrInfo.registryEndpoint,
      userName: resp.body.tempUsername,
      password: resp.body.authorizationToken
    };
  }

  const client = createCrClient(resolved);
  const resp = await doLegacyRoaRequest(
    client,
    'GetAuthorizationToken',
    'GET',
    '/tokens'
  ) as { body?: { data?: { tempUserName?: string; authorizationToken?: string } } };
  const token = resp.body?.data;
  if (!token?.tempUserName || !token?.authorizationToken) {
    throw new Error('获取 ACR 个人版临时凭证失败');
  }
  return {
    endpoint: acrInfo.registryEndpoint,
    userName: token.tempUserName,
    password: token.authorizationToken
  };
}

export function buildImageUri(acrInfo: AcrInfo, tag: string, useVpc = false): string {
  const endpoint = useVpc ? acrInfo.vpcRegistryEndpoint : acrInfo.registryEndpoint;
  return `${endpoint}/${acrInfo.namespace}/${acrInfo.repoName}:${tag}`;
}

export function formatTimestampTag(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
