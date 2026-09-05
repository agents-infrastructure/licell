import * as $FC from '@alicloud/fc20230330';
import { createFcClient } from './client';
import { callFcWithGuard } from './request-guard';

export async function listFunctionLayers(limit = 100, prefix?: string) {
  const client = createFcClient().client;
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  const layers: $FC.Layer[] = [];
  let nextToken: string | undefined;

  for (let page = 0; page < 50 && layers.length < safeLimit; page += 1) {
    const remaining = safeLimit - layers.length;
    const response = await callFcWithGuard<$FC.ListLayersResponse>(
      client as unknown as Record<string, unknown>,
      'listLayers',
      [new $FC.ListLayersRequest({
        limit: Math.min(100, remaining),
        nextToken,
        ...(prefix ? { prefix } : {})
      })],
      { operation: 'listLayers', profile: 'read' }
    );
    const rows = response.body?.layers || [];
    layers.push(...rows.slice(0, remaining));
    nextToken = response.body?.nextToken;
    if (!nextToken || rows.length === 0) break;
  }

  return layers;
}
