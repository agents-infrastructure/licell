import RAM, * as $RAM from '@alicloud/ram20150501';
import * as $OpenApi from '@alicloud/openapi-client';
import type { AuthConfig } from '../utils/config';
import { resolveSdkCtor } from '../utils/sdk';
import { isNotFoundError } from '../utils/alicloud-error';

const RamClientCtor = resolveSdkCtor<RAM>(RAM, '@alicloud/ram20150501');

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
  'rds:GrantAccountPrivilege',
  'rds:CheckServiceLinkedRole',
  'rds:CreateServiceLinkedRole',
  // KVStore (Redis/Tair)
  'kvstore:DescribeInstances',
  'kvstore:DescribeAccounts',
  'kvstore:DescribeServiceLinkedRoleExists',
  'kvstore:InitializeKvstorePermission',
  'kvstore:DescribeTairKVCacheInferInstances',
  'kvstore:DescribeTairKVCacheInferInstanceAttribute',
  'kvstore:CreateTairKVCacheVNode',
  'kvstore:ResetAccountPassword',
  'kvstore:ResetTairKVCacheCustomInstancePassword',
  'kvstore:ModifySecurityIps',
  // OSS
  'oss:PutBucket',
  'oss:GetBucketInfo',
  'oss:PutBucketACL',
  'oss:PutObject',
  'oss:ListBuckets',
  'oss:ListObjects',
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
  // SLS (Log Service, read-only)
  'log:GetLogs'
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

export async function bootstrapLicellRamAccess(input: BootstrapRamAccessInput): Promise<BootstrapRamAccessResult> {
  const userName = normalizeRamUserName(input.userName);
  const policyName = normalizeRamPolicyName(input.policyName);
  const client = createRamClient(input.adminAuth);

  const userResult = await ensureRamUser(client, userName);
  const policyResult = await ensureCustomPolicyWithActions(client, policyName, [...LICELL_POLICY_ACTIONS]);
  await ensurePolicyAttachedToUser(client, policyName, userName);
  const key = await createRamAccessKey(client, userName);

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
