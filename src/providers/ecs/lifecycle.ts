import * as $Ecs from '@alicloud/ecs20140526';
import type { EcsLifecycleActionResult } from './types';
import { createEcsClient } from './client';

function normalizeInstanceId(instanceId: string) {
  const resolved = instanceId.trim();
  if (!resolved) throw new Error('instanceId 不能为空，输入无效');
  return resolved;
}

export async function startEcsInstance(input: { instanceId: string; regionId?: string }): Promise<EcsLifecycleActionResult> {
  const instanceId = normalizeInstanceId(input.instanceId);
  const { regionId, client } = createEcsClient(input.regionId);
  const response = await client.startInstance(new $Ecs.StartInstanceRequest({ instanceId }));
  return {
    action: 'start',
    regionId,
    instanceId,
    ...(response.body?.requestId ? { requestId: response.body.requestId } : {})
  };
}

export async function rebootEcsInstance(input: { instanceId: string; regionId?: string; forceReboot?: boolean }): Promise<EcsLifecycleActionResult> {
  const instanceId = normalizeInstanceId(input.instanceId);
  const { regionId, client } = createEcsClient(input.regionId);
  const response = await client.rebootInstance(new $Ecs.RebootInstanceRequest({
    instanceId,
    ...(input.forceReboot !== undefined ? { forceStop: input.forceReboot } : {})
  }));
  return {
    action: 'reboot',
    regionId,
    instanceId,
    ...(response.body?.requestId ? { requestId: response.body.requestId } : {})
  };
}
