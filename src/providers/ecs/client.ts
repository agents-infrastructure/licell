import Ecs from '@alicloud/ecs20140526';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config } from '../../utils/config';
import { resolveSdkCtor } from '../../utils/sdk';
import type { EcsClientContext } from './types';

const ECS_CONNECT_TIMEOUT_MS = 30_000;
const ECS_READ_TIMEOUT_MS = 60_000;
const EcsClientCtor = resolveSdkCtor<Ecs>(Ecs, '@alicloud/ecs20140526');

export function createEcsClient(regionId?: string): EcsClientContext {
  const auth = Config.requireAuth();
  const resolvedRegion = regionId?.trim() || auth.region;
  const client = new EcsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: resolvedRegion,
    endpoint: `ecs.${resolvedRegion}.aliyuncs.com`,
    connectTimeout: ECS_CONNECT_TIMEOUT_MS,
    readTimeout: ECS_READ_TIMEOUT_MS
  }));
  return { regionId: resolvedRegion, client };
}
