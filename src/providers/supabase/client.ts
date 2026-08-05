import RdsAi from '@alicloud/rdsai20250507';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config } from '../../utils/config';
import { resolveSdkCtor } from '../../utils/sdk';

const RDSAI_CONNECT_TIMEOUT_MS = 60_000;
const RDSAI_READ_TIMEOUT_MS = 120_000;
const RdsAiClientCtor = resolveSdkCtor<RdsAi>(RdsAi, '@alicloud/rdsai20250507');

const REGION_SPECIFIC_ENDPOINTS: Record<string, string> = {
  'cn-chengdu': 'rdsai.cn-chengdu.aliyuncs.com',
  'cn-hongkong': 'rdsai.cn-hongkong.aliyuncs.com',
  'ap-northeast-1': 'rdsai.ap-northeast-1.aliyuncs.com',
  'ap-southeast-1': 'rdsai.ap-southeast-1.aliyuncs.com',
  'ap-southeast-3': 'rdsai.ap-southeast-3.aliyuncs.com',
  'ap-southeast-5': 'rdsai.ap-southeast-5.aliyuncs.com',
  'us-west-1': 'rdsai.us-west-1.aliyuncs.com',
  'eu-central-1': 'rdsai.eu-central-1.aliyuncs.com'
};

function resolveEndpoint(region: string): string {
  return REGION_SPECIFIC_ENDPOINTS[region] || 'rdsai.aliyuncs.com';
}

export function createRdsAiClient() {
  const auth = Config.requireAuth();
  const client = new RdsAiClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region,
    endpoint: resolveEndpoint(auth.region),
    connectTimeout: RDSAI_CONNECT_TIMEOUT_MS,
    readTimeout: RDSAI_READ_TIMEOUT_MS
  }));
  return { auth, client };
}
