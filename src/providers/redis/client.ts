import Kvstore from '@alicloud/r-kvstore20150101';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { type AuthConfig } from '../../utils/config';
import { resolveSdkCtor } from '../../utils/sdk';

const RedisClientCtor = resolveSdkCtor<Kvstore>(Kvstore, '@alicloud/r-kvstore20150101');
const RpcClientCtor = resolveSdkCtor<$OpenApi.default>($OpenApi.default, '@alicloud/openapi-client');

export function createRedisClient(auth: AuthConfig) {
  return new RedisClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region
  }));
}

function createKvstoreRpcClient(auth: AuthConfig) {
  return new RpcClientCtor(new $OpenApi.Config({
    accessKeyId: auth.ak,
    accessKeySecret: auth.sk,
    regionId: auth.region,
    endpoint: 'r-kvstore.aliyuncs.com'
  }));
}

function toRpcQueryValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function toRpcQuery(query: Record<string, unknown>) {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const normalized = toRpcQueryValue(value);
    if (normalized === undefined) continue;
    output[key] = normalized;
  }
  return output;
}

export async function callKvstoreRpc(
  auth: AuthConfig,
  action: string,
  query: Record<string, unknown>
) {
  const client = createKvstoreRpcClient(auth);
  const params = new $OpenApi.Params({
    action,
    version: '2015-01-01',
    protocol: 'HTTPS',
    pathname: '/',
    method: 'POST',
    authType: 'AK',
    style: 'RPC',
    reqBodyType: 'formData',
    bodyType: 'json'
  });
  const request = new $OpenApi.OpenApiRequest({
    query: toRpcQuery(query)
  });
  return client.callApi(
    params,
    request,
    new $Util.RuntimeOptions({ readTimeout: 20_000, connectTimeout: 8_000 })
  );
}
