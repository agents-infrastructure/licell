import * as $FC from '@alicloud/fc20230330';
import { isConflictError, isNotFoundError } from '../../utils/alicloud-error';
import { createFcClient } from './client';
import { callFcWithGuard } from './request-guard';

export type FnCustomDomainProtocol = 'HTTP' | 'HTTPS' | 'HTTP,HTTPS';

export interface FnCustomDomainRoute {
  path: string;
  functionName?: string;
  qualifier?: string;
}

export interface FnCustomDomainCertConfig {
  certName?: string;
  certificate?: string;
  privateKey?: string;
}

export interface FnCustomDomainState {
  domainName: string;
  protocol?: FnCustomDomainProtocol;
  routes: FnCustomDomainRoute[];
  certConfig?: FnCustomDomainCertConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface FnCustomDomainMutationOptions {
  functionName?: string;
  qualifier?: string;
  path?: string;
  protocol?: string;
  certConfig?: FnCustomDomainCertConfig;
}

interface FcCustomDomainRouteLike {
  path?: string;
  functionName?: string;
  qualifier?: string;
}

interface FcCustomDomainLike {
  domainName?: string;
  protocol?: string;
  routeConfig?: {
    routes?: FcCustomDomainRouteLike[];
  };
  certConfig?: FnCustomDomainCertConfig;
  createdTime?: string;
  createdAt?: string;
  lastModifiedTime?: string;
  updatedAt?: string;
}

function normalizeDomainName(domainName: string) {
  const normalized = domainName.trim().toLowerCase();
  if (!normalized) throw new Error('域名不能为空');
  return normalized;
}

export function normalizeFnCustomDomainProtocol(input?: string): FnCustomDomainProtocol | undefined {
  const normalized = input?.trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) return undefined;
  if (normalized === 'HTTP') return 'HTTP';
  if (normalized === 'HTTPS') return 'HTTPS';
  if (normalized === 'HTTP,HTTPS' || normalized === 'HTTPS,HTTP') return 'HTTP,HTTPS';
  throw new Error('--protocol 仅支持 HTTP / HTTPS / HTTP,HTTPS');
}

function normalizeRoutePath(input?: string) {
  const normalized = input?.trim();
  if (!normalized) return undefined;
  if (normalized === '*') return '/*';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function normalizeString(input?: string) {
  const normalized = input?.trim();
  return normalized ? normalized : undefined;
}

function normalizeCertConfig(certConfig?: FnCustomDomainCertConfig) {
  const certName = normalizeString(certConfig?.certName);
  const certificate = normalizeString(certConfig?.certificate);
  const privateKey = normalizeString(certConfig?.privateKey);
  if (!certName && !certificate && !privateKey) return undefined;
  return {
    ...(certName ? { certName } : {}),
    ...(certificate ? { certificate } : {}),
    ...(privateKey ? { privateKey } : {})
  } satisfies FnCustomDomainCertConfig;
}

function normalizeRoute(route: FcCustomDomainRouteLike | null | undefined): FnCustomDomainRoute | null {
  if (!route) return null;
  const path = normalizeRoutePath(route.path) || '/*';
  const functionName = normalizeString(route.functionName);
  const qualifier = normalizeString(route.qualifier);
  return {
    path,
    ...(functionName ? { functionName } : {}),
    ...(qualifier ? { qualifier } : {})
  } satisfies FnCustomDomainRoute;
}

function toFnCustomDomainState(domain: FcCustomDomainLike | null | undefined): FnCustomDomainState | null {
  if (!domain?.domainName) return null;
  const routes = (domain.routeConfig?.routes || [])
    .map((route) => normalizeRoute(route))
    .filter((route): route is FnCustomDomainRoute => Boolean(route));
  const protocol = normalizeFnCustomDomainProtocol(domain.protocol);
  const certConfig = normalizeCertConfig(domain.certConfig);

  return {
    domainName: domain.domainName.toLowerCase(),
    ...(protocol ? { protocol } : {}),
    routes,
    ...(certConfig ? { certConfig } : {}),
    ...(domain.createdTime || domain.createdAt ? { createdAt: domain.createdTime || domain.createdAt } : {}),
    ...(domain.lastModifiedTime || domain.updatedAt ? { updatedAt: domain.lastModifiedTime || domain.updatedAt } : {})
  };
}

function buildRouteConfig(
  options: FnCustomDomainMutationOptions,
  existing?: FnCustomDomainState | null
) {
  const currentRoute = existing?.routes[0];
  const functionName = normalizeString(options.functionName) || currentRoute?.functionName;
  if (!functionName) return undefined;
  const path = normalizeRoutePath(options.path) || currentRoute?.path || '/*';
  const qualifier = normalizeString(options.qualifier) || currentRoute?.qualifier;
  return {
    routes: [{
      path,
      functionName,
      ...(qualifier ? { qualifier } : {})
    }]
  };
}

async function fetchFnCustomDomain(domainName: string) {
  const normalizedDomain = normalizeDomainName(domainName);
  const { client } = createFcClient();
  try {
    const response = await callFcWithGuard<$FC.GetCustomDomainResponse>(
      client as unknown as Record<string, unknown>,
      'getCustomDomain',
      [normalizedDomain],
      {
        operation: `getCustomDomain(${normalizedDomain})`,
        profile: 'read'
      }
    );
    return toFnCustomDomainState(response.body as FcCustomDomainLike | undefined);
  } catch (err: unknown) {
    if (isNotFoundError(err)) return null;
    throw err;
  }
}

export async function getFnCustomDomain(domainName: string) {
  return await fetchFnCustomDomain(domainName);
}

export async function listFnCustomDomains(
  limit = 100,
  filters: { prefix?: string; functionName?: string } = {}
): Promise<FnCustomDomainState[]> {
  const { client } = createFcClient();
  const results: FnCustomDomainState[] = [];
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 2000));
  const prefix = normalizeString(filters.prefix)?.toLowerCase();
  const functionName = normalizeString(filters.functionName);
  let nextToken: string | undefined;

  while (results.length < safeLimit) {
    const response = await callFcWithGuard<$FC.ListCustomDomainsResponse>(
      client as unknown as Record<string, unknown>,
      'listCustomDomains',
      [new $FC.ListCustomDomainsRequest({
        limit: Math.min(100, safeLimit),
        nextToken
      })],
      {
        operation: 'listCustomDomains',
        profile: 'read'
      }
    );

    const rows = response.body?.customDomains || [];
    for (const row of rows) {
      const state = toFnCustomDomainState(row as FcCustomDomainLike | undefined);
      if (!state) continue;
      if (prefix && !state.domainName.startsWith(prefix)) continue;
      if (functionName && !state.routes.some((route) => route.functionName === functionName)) continue;
      results.push(state);
      if (results.length >= safeLimit) break;
    }

    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return results;
}

export async function createFnCustomDomain(domainName: string, options: FnCustomDomainMutationOptions) {
  const normalizedDomain = normalizeDomainName(domainName);
  const routeConfig = buildRouteConfig(options);
  if (!routeConfig) throw new Error('创建函数域名需要提供 functionName（或由上层传入默认函数名）');

  const { client } = createFcClient();
  const protocol = normalizeFnCustomDomainProtocol(options.protocol) || 'HTTP';
  const certConfig = normalizeCertConfig(options.certConfig);
  const payload: Record<string, unknown> = {
    domainName: normalizedDomain,
    protocol,
    routeConfig,
    ...(certConfig ? { certConfig } : {})
  };

  await callFcWithGuard(
    client as unknown as Record<string, unknown>,
    'createCustomDomain',
    [new $FC.CreateCustomDomainRequest({
      body: new $FC.CreateCustomDomainInput(payload as any)
    })],
    {
      operation: `createCustomDomain(${normalizedDomain})`,
      profile: 'mutation'
    }
  );

  const created = await fetchFnCustomDomain(normalizedDomain);
  if (!created) throw new Error(`创建函数域名成功，但未能读取结果: ${normalizedDomain}`);
  return created;
}

export async function updateFnCustomDomain(domainName: string, options: FnCustomDomainMutationOptions) {
  const normalizedDomain = normalizeDomainName(domainName);
  const existing = await fetchFnCustomDomain(normalizedDomain);
  if (!existing) throw new Error(`未找到函数域名: ${normalizedDomain}`);

  const { client } = createFcClient();
  const routeConfig = buildRouteConfig(options, existing);
  const protocol = normalizeFnCustomDomainProtocol(options.protocol) || existing.protocol;
  const certConfig = options.certConfig
    ? normalizeCertConfig({
      ...existing.certConfig,
      ...options.certConfig
    })
    : undefined;

  const payload: Record<string, unknown> = {
    ...(protocol ? { protocol } : {}),
    ...(routeConfig ? { routeConfig } : {}),
    ...(certConfig ? { certConfig } : {})
  };

  if (Object.keys(payload).length === 0) {
    throw new Error('未提供任何可更新字段');
  }

  await callFcWithGuard(
    client as unknown as Record<string, unknown>,
    'updateCustomDomain',
    [
      normalizedDomain,
      new $FC.UpdateCustomDomainRequest({
        body: new $FC.UpdateCustomDomainInput(payload as any)
      })
    ],
    {
      operation: `updateCustomDomain(${normalizedDomain})`,
      profile: 'mutation'
    }
  );

  const updated = await fetchFnCustomDomain(normalizedDomain);
  if (!updated) throw new Error(`更新函数域名成功，但未能读取结果: ${normalizedDomain}`);
  return updated;
}

export async function upsertFnCustomDomain(domainName: string, options: FnCustomDomainMutationOptions) {
  try {
    return await createFnCustomDomain(domainName, options);
  } catch (err: unknown) {
    if (!isConflictError(err)) throw err;
    return await updateFnCustomDomain(domainName, options);
  }
}

export async function removeFnCustomDomain(domainName: string) {
  const normalizedDomain = normalizeDomainName(domainName);
  const { client } = createFcClient();
  try {
    await callFcWithGuard(
      client as unknown as Record<string, unknown>,
      'deleteCustomDomain',
      [normalizedDomain],
      {
        operation: `deleteCustomDomain(${normalizedDomain})`,
        profile: 'mutation'
      }
    );
    return true;
  } catch (err: unknown) {
    if (isNotFoundError(err)) return false;
    throw err;
  }
}

export type BindFnCustomDomainOptions = FnCustomDomainMutationOptions;
export type FnCustomDomainSummary = FnCustomDomainState;
export type FnCustomDomainInfo = FnCustomDomainState;
export type FnCustomDomainRouteSummary = FnCustomDomainRoute;

export function resolveDefaultFcGatewayDomain() {
  const { auth } = createFcClient();
  return `${auth.accountId}.${auth.region}.fc.aliyuncs.com`;
}

export async function bindFnCustomDomain(domainName: string, options: FnCustomDomainMutationOptions) {
  return await upsertFnCustomDomain(domainName, options);
}
