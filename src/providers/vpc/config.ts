import Vpc, * as $Vpc from '@alicloud/vpc20160428';
import * as $OpenApi from '@alicloud/openapi-client';
import { isTransientError } from '../../utils/alicloud-error';
import { Config, type AuthConfig } from '../../utils/config';
import { withRetry } from '../../utils/retry';
import { resolveSdkCtor } from '../../utils/sdk';
import { getVpcInfo, type VpcQueryClient, type VpcSummary } from './query';

const VpcClientCtor = resolveSdkCtor<Vpc>(Vpc, '@alicloud/vpc20160428');

export interface VpcConfigDesiredState {
  name?: string;
  description?: string | null;
}

export interface VpcMutableAttributes {
  name: string | null;
  description: string | null;
}

export interface VpcConfigChange {
  field: keyof VpcMutableAttributes;
  action: 'set' | 'clear' | 'noop';
  before: string | null;
  after: string | null;
}

export interface VpcConfigPlan {
  regionId: string;
  vpcId: string;
  current: VpcMutableAttributes;
  desiredState: VpcConfigDesiredState;
  after: VpcMutableAttributes;
  changes: VpcConfigChange[];
  changeCount: number;
  requiresConfirmation: true;
  willExecute: boolean;
}

export interface VpcConfigApplyResult {
  plan: VpcConfigPlan;
  execution: { performed: boolean; requestId?: string };
  verify: { performed: true; matched: true; attributes: VpcMutableAttributes };
}

export interface VpcConfigClient extends VpcQueryClient {
  modifyVpcAttribute(request: $Vpc.ModifyVpcAttributeRequest): Promise<{ body: { requestId?: string } }>;
}

export interface VpcConfigDependencies {
  auth?: AuthConfig;
  client?: VpcConfigClient;
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('VPC config desired-state 必须是 JSON object');
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} 必须是非空字符串`);
  return value.trim();
}

export function normalizeVpcConfigDesiredState(input: unknown): VpcConfigDesiredState {
  const record = requireRecord(input);
  const allowed = ['name', 'description'];
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) throw new Error(`VPC config desired-state 包含未知字段: ${unknown.join(', ')}`);
  if (!allowed.some((key) => Object.prototype.hasOwnProperty.call(record, key))) {
    throw new Error('VPC config desired-state 至少需要 name 或 description 之一');
  }

  const desired: VpcConfigDesiredState = {};
  if (Object.prototype.hasOwnProperty.call(record, 'name')) {
    desired.name = requireNonEmptyString(record.name, 'name');
  }
  if (Object.prototype.hasOwnProperty.call(record, 'description')) {
    desired.description = record.description === null
      ? null
      : requireNonEmptyString(record.description, 'description');
  }
  return desired;
}

function mutableAttributes(vpc: VpcSummary): VpcMutableAttributes {
  return { name: vpc.vpcName || null, description: vpc.description || null };
}

function buildPlan(
  regionId: string,
  vpcId: string,
  current: VpcMutableAttributes,
  desiredState: VpcConfigDesiredState,
  execute: boolean
): VpcConfigPlan {
  const after = { ...current };
  const changes: VpcConfigChange[] = [];
  for (const field of ['name', 'description'] as const) {
    if (!Object.prototype.hasOwnProperty.call(desiredState, field)) continue;
    const desired = desiredState[field] ?? null;
    after[field] = desired;
    changes.push({
      field,
      action: current[field] === desired ? 'noop' : desired === null ? 'clear' : 'set',
      before: current[field],
      after: desired
    });
  }
  const changeCount = changes.filter((change) => change.action !== 'noop').length;
  return {
    regionId,
    vpcId,
    current,
    desiredState,
    after,
    changes,
    changeCount,
    requiresConfirmation: true,
    willExecute: execute && changeCount > 0
  };
}

function resolveContext(regionOverride: string | undefined, dependencies: VpcConfigDependencies) {
  const auth = dependencies.auth || Config.requireAuth();
  const regionId = regionOverride?.trim() || auth.region;
  const client = dependencies.client || new VpcClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId,
    endpoint: `vpc.${regionId}.aliyuncs.com`
  })) as VpcConfigClient;
  return { auth, regionId, client };
}

async function readTarget(identifier: string, regionId: string, auth: AuthConfig, client: VpcConfigClient) {
  return getVpcInfo(identifier, { regionId }, { auth, client });
}

export async function planVpcConfig(
  identifier: string,
  desiredInput: unknown,
  options: { regionId?: string } = {},
  dependencies: VpcConfigDependencies = {}
) {
  const desiredState = normalizeVpcConfigDesiredState(desiredInput);
  const context = resolveContext(options.regionId, dependencies);
  const detail = await readTarget(identifier, context.regionId, context.auth, context.client);
  return buildPlan(detail.regionId, detail.vpcId, mutableAttributes(detail.vpc), desiredState, false);
}

function attributesMatch(actual: VpcMutableAttributes, expected: VpcMutableAttributes) {
  return actual.name === expected.name && actual.description === expected.description;
}

async function verifyAttributes(
  vpcId: string,
  expected: VpcMutableAttributes,
  regionId: string,
  auth: AuthConfig,
  client: VpcConfigClient
) {
  return withRetry(async () => {
    const detail = await readTarget(vpcId, regionId, auth, client);
    const actual = mutableAttributes(detail.vpc);
    if (!attributesMatch(actual, expected)) {
      const pending = new Error('VPC 属性写入后状态尚未收敛') as Error & { code?: string };
      pending.code = 'VpcConfigVerificationPending';
      throw pending;
    }
    return actual;
  }, {
    maxAttempts: 4,
    baseDelayMs: 300,
    shouldRetry: (err) => (err as { code?: unknown })?.code === 'VpcConfigVerificationPending' || isTransientError(err)
  });
}

function mutationRequest(plan: VpcConfigPlan, attributes: VpcMutableAttributes) {
  const changedFields = new Set(
    plan.changes.filter((change) => change.action !== 'noop').map((change) => change.field)
  );
  return new $Vpc.ModifyVpcAttributeRequest({
    regionId: plan.regionId,
    vpcId: plan.vpcId,
    vpcName: changedFields.has('name') ? attributes.name || '' : undefined,
    description: changedFields.has('description') ? attributes.description || '' : undefined
  });
}

export async function applyVpcConfig(
  identifier: string,
  desiredInput: unknown,
  options: { regionId?: string } = {},
  dependencies: VpcConfigDependencies = {}
): Promise<VpcConfigApplyResult> {
  const desiredState = normalizeVpcConfigDesiredState(desiredInput);
  const context = resolveContext(options.regionId, dependencies);
  const detail = await readTarget(identifier, context.regionId, context.auth, context.client);
  const current = mutableAttributes(detail.vpc);
  const plan = buildPlan(detail.regionId, detail.vpcId, current, desiredState, true);

  if (plan.changeCount === 0) {
    return {
      plan,
      execution: { performed: false },
      verify: { performed: true, matched: true, attributes: current }
    };
  }

  const response = await context.client.modifyVpcAttribute(mutationRequest(plan, plan.after));
  try {
    const attributes = await verifyAttributes(plan.vpcId, plan.after, plan.regionId, context.auth, context.client);
    return {
      plan,
      execution: { performed: true, requestId: response.body.requestId },
      verify: { performed: true, matched: true, attributes }
    };
  } catch (err: unknown) {
    throw new Error(
      `VPC config 写入请求 ${response.body.requestId || '(unknown)'} 已被接受，但读回验证未完成。` +
      `请勿立即重复调用 ModifyVpcAttribute；稍后执行 licell vpc info ${plan.vpcId} --region ${plan.regionId} --output json 复查。` +
      `原因: ${String((err as Error)?.message || err)}`
    );
  }
}
