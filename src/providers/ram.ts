import RAM, * as $RAM from '@alicloud/ram20150501';
import OpenApiClient, * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import type { AuthConfig } from '../utils/config';
import { resolveSdkCtor } from '../utils/sdk';
import { isNotFoundError } from '../utils/alicloud-error';

const RamClientCtor = resolveSdkCtor<RAM>(RAM, '@alicloud/ram20150501');
const OpenApiCtor = resolveSdkCtor<OpenApiClient>(OpenApiClient, '@alicloud/openapi-client');

export const DEFAULT_BOOTSTRAP_USER = 'licell-operator';
export const DEFAULT_BOOTSTRAP_POLICY = 'LicellOperatorPolicy';
const RAM_USER_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const RAM_POLICY_PATTERN = /^[A-Za-z0-9-]{1,128}$/;

export const LICELL_POLICY_ACTIONS = [
  // FC (Function Compute)
  'fc:CreateFunction',
  'fc:UpdateFunction',
  'fc:GetFunction',
  'fc:ListFunctions',
  'fc:InvokeFunction',
  'fc:CreateTrigger',
  'fc:UpdateTrigger',
  'fc:ListTriggers',
  'fc:CreateCustomDomain',
  'fc:UpdateCustomDomain',
  'fc:DeleteCustomDomain',
  'fc:GetCustomDomain',
  'fc:PublishFunctionVersion',
  'fc:ListFunctionVersions',
  'fc:DeleteFunctionVersion',
  'fc:CreateAlias',
  'fc:UpdateAlias',
  'fc:ListAliases',
  'fc:DeleteAlias',
  'fc:DeleteTrigger',
  'fc:DeleteFunction',
  // RDS
  'rds:DescribeAvailableZones',
  'rds:DescribeAvailableClasses',
  'rds:DescribeDBInstances',
  'rds:CreateDBInstance',
  'rds:DescribeDBInstanceNetInfo',
  'rds:CreateAccount',
  'rds:CreateDatabase',
  'rds:DeleteDBInstance',
  'rds:GrantAccountPrivilege',
  'rds:CheckServiceLinkedRole',
  'rds:CreateServiceLinkedRole',
  // RDS AI (Supabase)
  'rdsai:CreateAppInstance',
  'rdsai:DeleteAppInstance',
  'rdsai:DescribeAppInstances',
  'rdsai:DescribeAppInstanceAttribute',
  'rdsai:DescribeInstanceEndpoints',
  'rdsai:DescribeInstanceAuthInfo',
  'rdsai:ModifyInstanceAuthConfig',
  'rdsai:ModifyInstanceStorageConfig',
  'rdsai:ModifyInstanceRAGConfig',
  'rdsai:ModifyInstanceIpWhitelist',
  'rdsai:ModifyInstanceConfig',
  'rdsai:ModifyInstanceSSL',
  'rdsai:DescribeInstanceIpWhitelist',
  'rdsai:DescribeInstanceSSL',
  'rdsai:DescribeInstanceStorageConfig',
  'rdsai:DescribeInstanceRAGConfig',
  'rdsai:ResetInstancePassword',
  'rdsai:RestartInstance',
  'rdsai:StopInstance',
  'rdsai:StartInstance',
  // KVStore (Redis/Tair)
  'kvstore:DescribeInstances',
  'kvstore:DescribeAccounts',
  'kvstore:DescribeServiceLinkedRoleExists',
  'kvstore:InitializeKvstorePermission',
  'kvstore:DescribeAvailableResource',
  'kvstore:DescribeTairKVCacheInferInstances',
  'kvstore:DescribeTairKVCacheInferInstanceAttribute',
  'kvstore:CreateTairKVCacheVNode',
  'kvstore:ResetAccountPassword',
  'kvstore:ResetTairKVCacheCustomInstancePassword',
  'kvstore:ModifySecurityIps',
  // OSS
  'oss:PutBucket',
  'oss:DeleteBucket',
  'oss:GetBucketInfo',
  'oss:GetBucketAcl',
  'oss:PutBucketACL',
  'oss:PutBucketPublicAccessBlock',
  'oss:GetBucketPublicAccessBlock',
  'oss:DeleteBucketPublicAccessBlock',
  'oss:GetObject',
  'oss:PutObject',
  'oss:DeleteObject',
  'oss:ListBuckets',
  'oss:ListObjects',
  'oss:ListCname',
  'oss:CreateCnameToken',
  'oss:PutCname',
  'oss:DeleteCname',
  // Alidns
  'alidns:DescribeSubDomainRecords',
  'alidns:DescribeDomainRecords',
  'alidns:AddDomainRecord',
  'alidns:UpdateDomainRecord',
  'alidns:DeleteDomainRecord',
  // CDN
  'cdn:DescribeUserDomains',
  'cdn:AddCdnDomain',
  'cdn:BatchSetCdnDomainConfig',
  'cdn:DeleteCdnDomain',
  'cdn:DeleteUserCdnDomain',
  'cdn:SetCdnDomainSSLCertificate',
  // VPC (read + managed VSwitch creation)
  'vpc:DescribeVpcs',
  'vpc:DescribeZones',
  'vpc:DescribeVSwitchAttributes',
  'vpc:DescribeVSwitches',
  'vpc:CreateVpc',
  'vpc:CreateVSwitch',
  // ECS (security group only)
  'ecs:DescribeSecurityGroups',
  'ecs:CreateSecurityGroup',
  // CR (Container Registry)
  'cr:ListInstance',
  'cr:CreateNamespace',
  'cr:CreateRepository',
  'cr:GetAuthorizationToken',
  // SLS (Log Service)
  'log:ListProject',
  'log:ListLogStores',
  'log:CreateProject',
  'log:CreateLogStore',
  'log:CreateIndex',
  'log:GetLogs',
  // RAM (pass role to FC for service role + SLR creation)
  'ram:GetUser',
  'ram:GetPolicy',
  'ram:GetPolicyVersion',
  'ram:ListAccessKeys',
  'ram:PassRole',
  'ram:GetRole',
  'ram:CreateServiceLinkedRole'
] as const;

export interface BootstrapRamAccessInput {
  adminAuth: AuthConfig;
  userName?: string;
  policyName?: string;
}

export interface BootstrapRamAccessResult {
  userName: string;
  policyName: string;
  accessKeyId: string;
  accessKeySecret: string;
  createdUser: boolean;
  createdPolicy: boolean;
  updatedPolicy?: boolean;
}

export interface RepairRamAccessInput {
  adminAuth: AuthConfig;
  currentAuth?: AuthConfig | null;
  userName?: string;
  policyName?: string;
  forceRotateKey?: boolean;
}

export interface RepairRamAccessResult extends BootstrapRamAccessResult {
  mode: 'updated-existing-key' | 'rotated-new-key';
}

export interface LicellRamAccessInspection {
  userName: string;
  policyName: string;
  userExists: boolean;
  policyExists: boolean;
  currentAccessKeyId?: string;
  currentAccessKeyBound: boolean;
  currentAccessKeyStatus?: string;
  missingActions: string[];
}

export function normalizeRamUserName(input?: string) {
  const value = (input || DEFAULT_BOOTSTRAP_USER).trim();
  if (!RAM_USER_PATTERN.test(value)) {
    throw new Error('bootstrap RAM 用户名不合法：仅支持字母、数字、点、短横线、下划线，长度 1-64');
  }
  return value;
}

export function normalizeRamPolicyName(input?: string) {
  const value = (input || DEFAULT_BOOTSTRAP_POLICY).trim();
  if (!RAM_POLICY_PATTERN.test(value)) {
    throw new Error('bootstrap RAM 策略名不合法：仅支持字母、数字、短横线，长度 1-128');
  }
  return value;
}

export function buildLicellPolicyDocument() {
  return buildLicellPolicyDocumentFromActions([...LICELL_POLICY_ACTIONS]);
}

function buildLicellPolicyDocumentFromActions(actions: string[]) {
  const normalized = [...new Set(actions)].sort();
  return JSON.stringify({
    Version: '1',
    Statement: [
      {
        Effect: 'Allow',
        Action: normalized,
        Resource: '*'
      }
    ]
  });
}

function listMissingActions(policyDocumentRaw: string | undefined, requiredActions: string[]) {
  const policyDoc = parsePolicyDocument(policyDocumentRaw);
  if (!policyDoc || typeof policyDoc !== 'object') {
    return [...new Set(requiredActions)].sort();
  }

  const statementsRaw = policyDoc.Statement;
  const statements = Array.isArray(statementsRaw)
    ? statementsRaw
    : statementsRaw && typeof statementsRaw === 'object'
      ? [statementsRaw]
      : [];

  const allowedActions = new Set<string>();
  for (const statement of statements) {
    if (!statement || typeof statement !== 'object') continue;
    const effect = String((statement as { Effect?: unknown }).Effect || '').toLowerCase();
    if (effect !== 'allow') continue;
    for (const action of toActionList((statement as { Action?: unknown }).Action)) {
      allowedActions.add(action);
    }
  }

  return [...new Set(requiredActions)].filter((action) => !allowedActions.has(action)).sort();
}

function createRamClient(adminAuth: AuthConfig) {
  return new RamClientCtor(new $OpenApi.Config({
    accessKeyId: adminAuth.ak,
    accessKeySecret: adminAuth.sk,
    endpoint: 'ram.aliyuncs.com'
  }));
}

async function ensureRamUser(client: RAM, userName: string) {
  try {
    await client.getUser(new $RAM.GetUserRequest({ userName }));
    return { created: false };
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
  }

  await client.createUser(new $RAM.CreateUserRequest({
    userName,
    displayName: userName,
    comments: 'Managed by licell bootstrap login'
  }));
  return { created: true };
}

async function ensureCustomPolicy(client: RAM, policyName: string) {
  try {
    await client.getPolicy(new $RAM.GetPolicyRequest({ policyType: 'Custom', policyName }));
    return { created: false };
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
  }

  await client.createPolicy(new $RAM.CreatePolicyRequest({
    policyName,
    description: 'Least-privilege policy generated by licell bootstrap login',
    policyDocument: buildLicellPolicyDocument()
  }));
  return { created: true };
}

function toActionList(value: unknown): string[] {
  if (typeof value === 'string') return [value].map((item) => item.trim()).filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === 'string' ? item.trim() : '')
    .filter(Boolean);
}

function parsePolicyDocument(raw: string | undefined) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function ensurePolicyActions(policyDocumentRaw: string | undefined, requiredActions: string[]) {
  const policyDoc = parsePolicyDocument(policyDocumentRaw);
  if (!policyDoc || typeof policyDoc !== 'object') {
    return {
      changed: true,
      policyDocument: buildLicellPolicyDocumentFromActions(requiredActions)
    };
  }

  const statementsRaw = policyDoc.Statement;
  const statements = Array.isArray(statementsRaw)
    ? [...statementsRaw]
    : statementsRaw && typeof statementsRaw === 'object'
      ? [statementsRaw]
      : [];

  let targetIndex = -1;
  for (let i = 0; i < statements.length; i += 1) {
    const stmt = statements[i];
    if (!stmt || typeof stmt !== 'object') continue;
    const effect = String((stmt as { Effect?: unknown }).Effect || '').toLowerCase();
    if (effect === 'allow') {
      targetIndex = i;
      break;
    }
  }

  const required = [...new Set(requiredActions)].sort();
  let changed = false;

  if (targetIndex === -1) {
    statements.push({
      Effect: 'Allow',
      Action: required,
      Resource: '*'
    });
    changed = true;
  } else {
    const target = statements[targetIndex];
    if (!target || typeof target !== 'object') throw new Error('策略文档格式错误');
    const currentActions = toActionList((target as { Action?: unknown }).Action);
    const merged = [...new Set([...currentActions, ...required])].sort();
    const currentSorted = [...new Set(currentActions)].sort();
    if (merged.join('|') !== currentSorted.join('|')) {
      changed = true;
    }
    (target as { Action?: unknown }).Action = merged;
    if ((target as { Resource?: unknown }).Resource === undefined) {
      (target as { Resource?: unknown }).Resource = '*';
      changed = true;
    }
  }

  const nextDoc = {
    ...policyDoc,
    Version: typeof policyDoc.Version === 'string' && policyDoc.Version ? policyDoc.Version : '1',
    Statement: statements
  };
  return {
    changed,
    policyDocument: JSON.stringify(nextDoc)
  };
}

async function ensureCustomPolicyWithActions(client: RAM, policyName: string, requiredActions: string[]) {
  const policyResult = await ensureCustomPolicy(client, policyName);
  if (policyResult.created) return { created: true, updated: false };

  const policy = await client.getPolicy(new $RAM.GetPolicyRequest({ policyType: 'Custom', policyName }));
  const versionId = policy.body?.defaultPolicyVersion?.versionId;
  if (!versionId) return { created: false, updated: false };

  const version = await client.getPolicyVersion(new $RAM.GetPolicyVersionRequest({
    policyType: 'Custom',
    policyName,
    versionId
  }));
  const currentDoc = version.body?.policyVersion?.policyDocument;
  const merged = ensurePolicyActions(currentDoc, requiredActions);
  if (!merged.changed) return { created: false, updated: false };

  await client.createPolicyVersion(new $RAM.CreatePolicyVersionRequest({
    policyName,
    policyDocument: merged.policyDocument,
    setAsDefault: true,
    rotateStrategy: 'DeleteOldestNonDefaultVersionWhenLimitExceeded'
  }));
  return { created: false, updated: true };
}

async function ensurePolicyAttachedToUser(client: RAM, policyName: string, userName: string) {
  try {
    await client.attachPolicyToUser(new $RAM.AttachPolicyToUserRequest({
      policyType: 'Custom',
      policyName,
      userName
    }));
  } catch (err: unknown) {
    const text = `${String((err as { code?: unknown })?.code || '')} ${String((err as { message?: unknown })?.message || '')}`.toLowerCase();
    if (text.includes('entityalreadyexists') || text.includes('already attached') || text.includes('attached already')) {
      return;
    }
    throw err;
  }
}

async function createRamAccessKey(client: RAM, userName: string) {
  const listed = await client.listAccessKeys(new $RAM.ListAccessKeysRequest({ userName }));
  const keys = listed.body?.accessKeys?.accessKey || [];
  const activeCount = keys.filter((key) => key.status === 'Active').length;
  if (activeCount >= 2) {
    throw new Error(`RAM 用户 ${userName} 的 AccessKey 已达到上限（2 个）。请先在控制台删除旧 key 后重试。`);
  }

  const created = await client.createAccessKey(new $RAM.CreateAccessKeyRequest({ userName }));
  const accessKeyId = created.body?.accessKey?.accessKeyId;
  const accessKeySecret = created.body?.accessKey?.accessKeySecret;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('创建 RAM AccessKey 成功但返回字段不完整，请重试');
  }
  return { accessKeyId, accessKeySecret };
}

async function findUserNameByAccessKeyId(client: RAM, accessKeyId: string) {
  const normalizedKeyId = accessKeyId.trim();
  if (!normalizedKeyId) return undefined;

  const maxPages = 20;
  let marker: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const listedUsers = await client.listUsers(new $RAM.ListUsersRequest({
      marker,
      maxItems: 100
    }));
    const users = listedUsers.body?.users?.user || [];
    for (const user of users) {
      const userName = user.userName;
      if (!userName) continue;
      const listedKeys = await client.listAccessKeys(new $RAM.ListAccessKeysRequest({ userName }));
      const keys = listedKeys.body?.accessKeys?.accessKey || [];
      if (keys.some((key) => key.accessKeyId === normalizedKeyId)) {
        return userName;
      }
    }
    if (!listedUsers.body?.isTruncated || !listedUsers.body.marker) break;
    marker = listedUsers.body.marker;
  }
  return undefined;
}

export async function inspectLicellRamAccess(
  adminAuth: AuthConfig,
  options: {
    userName?: string;
    policyName?: string;
    accessKeyId?: string;
  } = {}
): Promise<LicellRamAccessInspection> {
  const userName = normalizeRamUserName(options.userName);
  const policyName = normalizeRamPolicyName(options.policyName);
  const client = createRamClient(adminAuth);

  let userExists = true;
  try {
    await client.getUser(new $RAM.GetUserRequest({ userName }));
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
    userExists = false;
  }

  let policyExists = true;
  let missingActions: string[] = [...LICELL_POLICY_ACTIONS];
  try {
    const policy = await client.getPolicy(new $RAM.GetPolicyRequest({ policyType: 'Custom', policyName }));
    const versionId = policy.body?.defaultPolicyVersion?.versionId;
    if (versionId) {
      const version = await client.getPolicyVersion(new $RAM.GetPolicyVersionRequest({
        policyType: 'Custom',
        policyName,
        versionId
      }));
      missingActions = listMissingActions(version.body?.policyVersion?.policyDocument, [...LICELL_POLICY_ACTIONS]);
    }
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
    policyExists = false;
  }

  const currentAccessKeyId = options.accessKeyId?.trim() || undefined;
  let currentAccessKeyBound = false;
  let currentAccessKeyStatus: string | undefined;
  if (userExists && currentAccessKeyId) {
    const listedKeys = await client.listAccessKeys(new $RAM.ListAccessKeysRequest({ userName }));
    const keys = listedKeys.body?.accessKeys?.accessKey || [];
    const matched = keys.find((key) => key.accessKeyId === currentAccessKeyId);
    if (matched) {
      currentAccessKeyBound = true;
      currentAccessKeyStatus = matched.status;
    }
  }

  return {
    userName,
    policyName,
    userExists,
    policyExists,
    currentAccessKeyId,
    currentAccessKeyBound,
    currentAccessKeyStatus,
    missingActions
  };
}

export async function bootstrapLicellRamAccess(input: BootstrapRamAccessInput): Promise<BootstrapRamAccessResult> {
  const userName = normalizeRamUserName(input.userName);
  const policyName = normalizeRamPolicyName(input.policyName);
  const client = createRamClient(input.adminAuth);

  const userResult = await ensureRamUser(client, userName);
  const policyResult = await ensureCustomPolicyWithActions(client, policyName, [...LICELL_POLICY_ACTIONS]);
  await ensurePolicyAttachedToUser(client, policyName, userName);
  const key = await createRamAccessKey(client, userName);

  // Ensure FC service role exists for static preview proxy
  try { await ensureFcServiceRole(input.adminAuth); } catch { /* best-effort */ }
  // Ensure Supabase service linked role exists
  try { await ensureSupabaseServiceLinkedRole(input.adminAuth); } catch { /* best-effort */ }

  return {
    userName,
    policyName,
    accessKeyId: key.accessKeyId,
    accessKeySecret: key.accessKeySecret,
    createdUser: userResult.created,
    createdPolicy: policyResult.created,
    updatedPolicy: policyResult.updated
  };
}

export async function repairLicellRamAccess(input: RepairRamAccessInput): Promise<RepairRamAccessResult> {
  const currentAuth = input.currentAuth || null;
  const policyName = normalizeRamPolicyName(input.policyName || currentAuth?.ramPolicy);
  const client = createRamClient(input.adminAuth);

  // Ensure FC service role exists for static preview proxy
  try { await ensureFcServiceRole(input.adminAuth); } catch { /* best-effort */ }
  // Ensure Supabase service linked role exists
  try { await ensureSupabaseServiceLinkedRole(input.adminAuth); } catch { /* best-effort */ }

  let targetUserName = input.userName
    ? normalizeRamUserName(input.userName)
    : currentAuth?.ramUser
      ? normalizeRamUserName(currentAuth.ramUser)
      : undefined;

  if (!targetUserName && currentAuth?.ak) {
    targetUserName = await findUserNameByAccessKeyId(client, currentAuth.ak);
  }

  if (!input.forceRotateKey && targetUserName && currentAuth?.ak && currentAuth.sk) {
    const policyResult = await ensureCustomPolicyWithActions(client, policyName, [...LICELL_POLICY_ACTIONS]);
    await ensurePolicyAttachedToUser(client, policyName, targetUserName);
    return {
      mode: 'updated-existing-key',
      userName: targetUserName,
      policyName,
      accessKeyId: currentAuth.ak,
      accessKeySecret: currentAuth.sk,
      createdUser: false,
      createdPolicy: policyResult.created,
      updatedPolicy: policyResult.updated
    };
  }

  const userName = targetUserName || normalizeRamUserName(input.userName || currentAuth?.ramUser);
  const userResult = await ensureRamUser(client, userName);
  const policyResult = await ensureCustomPolicyWithActions(client, policyName, [...LICELL_POLICY_ACTIONS]);
  await ensurePolicyAttachedToUser(client, policyName, userName);
  const key = await createRamAccessKey(client, userName);

  return {
    mode: 'rotated-new-key',
    userName,
    policyName,
    accessKeyId: key.accessKeyId,
    accessKeySecret: key.accessKeySecret,
    createdUser: userResult.created,
    createdPolicy: policyResult.created,
    updatedPolicy: policyResult.updated
  };
}

const FC_SERVICE_ROLE_NAME = 'AliyunFCDefaultRole';
const FC_ASSUME_ROLE_POLICY = JSON.stringify({
  Statement: [{
    Action: 'sts:AssumeRole',
    Effect: 'Allow',
    Principal: { Service: ['fc.aliyuncs.com'] }
  }],
  Version: '1'
});
const FC_ROLE_OSS_POLICIES = [
  'AliyunOSSFullAccess'
];

export async function ensureFcServiceRole(adminAuth: AuthConfig): Promise<{ created: boolean }> {
  const client = createRamClient(adminAuth);

  // Check if role exists
  try {
    await client.getRole(new $RAM.GetRoleRequest({ roleName: FC_SERVICE_ROLE_NAME }));
    return { created: false };
  } catch (err: unknown) {
    if (!isNotFoundError(err)) throw err;
  }

  // Create role
  await client.createRole(new $RAM.CreateRoleRequest({
    roleName: FC_SERVICE_ROLE_NAME,
    assumeRolePolicyDocument: FC_ASSUME_ROLE_POLICY,
    description: 'FC default service role for accessing OSS and other Alibaba Cloud services'
  }));

  // Attach OSS access policy
  for (const policyName of FC_ROLE_OSS_POLICIES) {
    try {
      await client.attachPolicyToRole(new $RAM.AttachPolicyToRoleRequest({
        policyType: 'System',
        policyName,
        roleName: FC_SERVICE_ROLE_NAME
      }));
    } catch {
      // Policy may already be attached
    }
  }

  return { created: true };
}

const SUPABASE_SLR_SERVICE_NAME = 'supabase.rdsai.aliyuncs.com';

export async function ensureSupabaseServiceLinkedRole(adminAuth: AuthConfig): Promise<{ created: boolean }> {
  const client = new OpenApiCtor(new $OpenApi.Config({
    accessKeyId: adminAuth.ak,
    accessKeySecret: adminAuth.sk,
    endpoint: 'resourcemanager.aliyuncs.com'
  }));
  const params = new $OpenApi.Params({
    action: 'CreateServiceLinkedRole',
    version: '2020-03-31',
    protocol: 'HTTPS',
    pathname: '/',
    method: 'POST',
    authType: 'AK',
    style: 'RPC',
    reqBodyType: 'formData',
    bodyType: 'json'
  });
  const request = new $OpenApi.OpenApiRequest({
    query: { ServiceName: SUPABASE_SLR_SERVICE_NAME }
  });
  try {
    await client.callApi(params, request, new $Util.RuntimeOptions({ readTimeout: 15_000, connectTimeout: 8_000 }));
    return { created: true };
  } catch (err: unknown) {
    const code = String((err as { code?: unknown })?.code || '');
    if (code === 'AlreadyExists' || code.includes('AlreadyExists')) return { created: false };
    throw err;
  }
}
