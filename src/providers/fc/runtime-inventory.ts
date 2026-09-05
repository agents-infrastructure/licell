import FC20230330, * as $FC from '@alicloud/fc20230330';
import { createFcClient } from './client';
import { callFcWithGuard } from './request-guard';

export interface FunctionInstanceQueryOptions {
  functionName: string;
  qualifier?: string;
  status?: string;
  withAllActive?: boolean;
  limit?: number;
}

export interface FunctionSessionQueryOptions {
  functionName: string;
  qualifier?: string;
  status?: string;
  sessionId?: string;
  limit?: number;
}

function normalizeName(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} 不能为空`);
  return normalized;
}

function normalizeLimit(value: number | undefined) {
  return Math.max(1, Math.min(Math.floor(value || 50), 200));
}

export async function listFunctionInstances(
  options: FunctionInstanceQueryOptions,
  fcClient?: FC20230330
) {
  const client = fcClient ?? createFcClient().client;
  const functionName = normalizeName(options.functionName, 'functionName');
  const limit = normalizeLimit(options.limit);
  const response = await callFcWithGuard<$FC.ListInstancesResponse>(
    client as unknown as Record<string, unknown>,
    'listInstances',
    [functionName, new $FC.ListInstancesRequest({
      limit: String(limit),
      qualifier: options.qualifier?.trim() || undefined,
      instanceStatus: options.status?.trim() ? [options.status.trim()] : undefined,
      withAllActive: options.withAllActive || undefined
    })],
    { operation: `listInstances(${functionName})`, profile: 'read' }
  );
  return { functionName, limit, requestId: response.body?.requestId, instances: response.body?.instances || [] };
}

export async function listFunctionSessions(
  options: FunctionSessionQueryOptions,
  fcClient?: FC20230330
) {
  const client = fcClient ?? createFcClient().client;
  const functionName = normalizeName(options.functionName, 'functionName');
  const limit = normalizeLimit(options.limit);
  const sessions: $FC.Session[] = [];
  let nextToken: string | undefined;

  for (let page = 0; page < 50 && sessions.length < limit; page += 1) {
    const remaining = limit - sessions.length;
    const response = await callFcWithGuard<$FC.ListSessionsResponse>(
      client as unknown as Record<string, unknown>,
      'listSessions',
      [functionName, new $FC.ListSessionsRequest({
        limit: Math.min(100, remaining),
        nextToken,
        qualifier: options.qualifier?.trim() || undefined,
        sessionStatus: options.status?.trim() || undefined,
        sessionId: options.sessionId?.trim() || undefined
      })],
      { operation: `listSessions(${functionName})`, profile: 'read' }
    );
    const rows = response.body?.sessions || [];
    sessions.push(...rows.slice(0, remaining));
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return { functionName, limit, sessions };
}
