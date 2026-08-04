import Rds from '@alicloud/rds20140815';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config } from '../../utils/config';
import { resolveSdkCtor } from '../../utils/sdk';

const RDS_CONNECT_TIMEOUT_MS = 60_000;
const RDS_READ_TIMEOUT_MS = 120_000;
const RdsClientCtor = resolveSdkCtor<Rds>(Rds, '@alicloud/rds20140815');

export function createRdsClient(regionId?: string) {
  const auth = Config.requireAuth();
  const resolvedRegion = regionId?.trim() || auth.region;
  const client = new RdsClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: resolvedRegion,
    endpoint: `rds.${resolvedRegion}.aliyuncs.com`,
    connectTimeout: RDS_CONNECT_TIMEOUT_MS,
    readTimeout: RDS_READ_TIMEOUT_MS
  }));
  return { auth, regionId: resolvedRegion, client };
}
