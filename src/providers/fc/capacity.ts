import FC20230330, * as $FC from '@alicloud/fc20230330';
import { createFcClient } from './client';
import { callFcWithGuard } from './request-guard';

export interface FunctionCapacityQueryOptions {
  functionName?: string;
  limit?: number;
}

async function collectPages<T>(
  limit: number,
  fetchPage: (nextToken: string | undefined, pageLimit: number) => Promise<{ rows: T[]; nextToken?: string }>
) {
  const rows: T[] = [];
  let nextToken: string | undefined;
  for (let page = 0; page < 50 && rows.length < limit; page += 1) {
    const remaining = limit - rows.length;
    const result = await fetchPage(nextToken, Math.min(100, remaining));
    rows.push(...result.rows.slice(0, remaining));
    nextToken = result.nextToken;
    if (!nextToken || result.rows.length === 0) break;
  }
  return rows;
}

export async function listFunctionCapacity(
  options: FunctionCapacityQueryOptions = {},
  fcClient?: FC20230330
) {
  const client = fcClient ?? createFcClient().client;
  const functionName = options.functionName?.trim() || undefined;
  const limit = Math.max(1, Math.min(Math.floor(options.limit || 50), 200));

  const [concurrency, provision, scaling] = await Promise.all([
    collectPages(limit, async (nextToken, pageLimit) => {
      const response = await callFcWithGuard<$FC.ListConcurrencyConfigsResponse>(
        client as unknown as Record<string, unknown>,
        'listConcurrencyConfigs',
        [new $FC.ListConcurrencyConfigsRequest({ functionName, limit: pageLimit, nextToken })],
        { operation: 'listConcurrencyConfigs', profile: 'read' }
      );
      return { rows: response.body?.configs || [], nextToken: response.body?.nextToken };
    }),
    collectPages(limit, async (nextToken, pageLimit) => {
      const response = await callFcWithGuard<$FC.ListProvisionConfigsResponse>(
        client as unknown as Record<string, unknown>,
        'listProvisionConfigs',
        [new $FC.ListProvisionConfigsRequest({ functionName, limit: pageLimit, nextToken })],
        { operation: 'listProvisionConfigs', profile: 'read' }
      );
      return { rows: response.body?.provisionConfigs || [], nextToken: response.body?.nextToken };
    }),
    collectPages(limit, async (nextToken, pageLimit) => {
      const response = await callFcWithGuard<$FC.ListScalingConfigsResponse>(
        client as unknown as Record<string, unknown>,
        'listScalingConfigs',
        [new $FC.ListScalingConfigsRequest({ functionName, limit: pageLimit, nextToken })],
        { operation: 'listScalingConfigs', profile: 'read' }
      );
      return { rows: response.body?.scalingConfigs || [], nextToken: response.body?.nextToken };
    })
  ]);

  return { functionName, limit, concurrency, provision, scaling };
}
