import * as $Ecs from '@alicloud/ecs20140526';
import type { EcsLifecycleActionResult, EcsInstanceReleaseFacts } from './types';
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

export async function stopEcsInstance(input: {
  instanceId: string;
  regionId?: string;
  forceStop?: boolean;
  stoppedMode?: 'StopCharging' | 'KeepCharging';
}): Promise<EcsLifecycleActionResult> {
  const instanceId = normalizeInstanceId(input.instanceId);
  const { regionId, client } = createEcsClient(input.regionId);
  const response = await client.stopInstance(new $Ecs.StopInstanceRequest({
    instanceId,
    ...(input.forceStop !== undefined ? { forceStop: input.forceStop } : {}),
    ...(input.stoppedMode ? { stoppedMode: input.stoppedMode } : {})
  }));
  return {
    action: 'stop',
    regionId,
    instanceId,
    ...(response.body?.requestId ? { requestId: response.body.requestId } : {})
  };
}

export async function deleteEcsInstance(input: {
  instanceId: string;
  regionId?: string;
  force?: boolean;
}): Promise<EcsLifecycleActionResult> {
  const instanceId = normalizeInstanceId(input.instanceId);
  const { regionId, client } = createEcsClient(input.regionId);
  const response = await client.deleteInstance(new $Ecs.DeleteInstanceRequest({
    instanceId,
    ...(input.force !== undefined ? { force: input.force } : {})
  }));
  return {
    action: 'delete',
    regionId,
    instanceId,
    ...(response.body?.requestId ? { requestId: response.body.requestId } : {})
  };
}

function deriveReleaseBehavior(disks: Array<{ deleteWithInstance?: boolean }>): 'released' | 'retained' | 'unknown' {
  if (disks.length === 0) return 'unknown';
  if (disks.some((disk) => disk.deleteWithInstance === true)) return 'released';
  if (disks.every((disk) => disk.deleteWithInstance === false)) return 'retained';
  return 'unknown';
}

// Read-only pre-release facts (deletion protection, disk release behavior). Any
// read failure surfaces as a classifiable error so the delete harness blocks
// rather than proceeding on missing information (RMR-001).
export async function getEcsInstanceReleaseFacts(input: {
  instanceId: string;
  regionId?: string;
}): Promise<EcsInstanceReleaseFacts> {
  const instanceId = normalizeInstanceId(input.instanceId);
  const { regionId, client } = createEcsClient(input.regionId);

  const instanceResponse = await client.describeInstances(new $Ecs.DescribeInstancesRequest({
    regionId,
    instanceIds: JSON.stringify([instanceId]),
    pageNumber: 1,
    pageSize: 1
  }));
  const row = instanceResponse.body?.instances?.instance?.[0];
  if (!row || !row.instanceId) {
    throw new Error(`ECS 实例释放前事实不可读：未查询到实例 ${instanceId} 的删除保护信息`);
  }

  const disksResponse = await client.describeDisks(new $Ecs.DescribeDisksRequest({
    regionId,
    instanceId,
    pageNumber: 1,
    pageSize: 100
  }));
  const diskRows = disksResponse.body?.disks?.disk || [];
  const disks = diskRows
    .filter((disk): disk is typeof disk & { diskId: string } => Boolean(disk.diskId))
    .map((disk) => ({
      diskId: disk.diskId,
      ...(disk.deleteWithInstance !== undefined ? { deleteWithInstance: disk.deleteWithInstance } : {}),
      ...(disk.category ? { category: disk.category } : {})
    }));

  return {
    instanceId,
    regionId,
    ...(row.status ? { status: row.status } : {}),
    ...(row.deletionProtection !== undefined ? { deletionProtection: row.deletionProtection } : {}),
    disks,
    releaseBehavior: deriveReleaseBehavior(disks)
  };
}
