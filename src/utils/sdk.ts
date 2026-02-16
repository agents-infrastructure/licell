import FC from '@alicloud/fc20230330';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config, type AuthConfig } from './config';
import { readLicellEnv } from './env';

export type SdkCtor<T> = new (...args: any[]) => T;

export function resolveSdkCtor<T>(sdkModule: unknown, packageName: string): SdkCtor<T> {
  const moduleAny = sdkModule as { default?: unknown };
  const ctor =
    typeof sdkModule === 'function'
      ? sdkModule
      : typeof moduleAny?.default === 'function'
        ? moduleAny.default
        : typeof (moduleAny?.default as { default?: unknown } | undefined)?.default === 'function'
          ? (moduleAny?.default as { default: unknown }).default
          : null;

  if (!ctor) {
    throw new Error(`无法加载 ${packageName} SDK 构造器，请检查依赖安装和运行时模块格式`);
  }
  return ctor as SdkCtor<T>;
}

const FC_CONNECT_TIMEOUT_MS = 60_000;
const FC_READ_TIMEOUT_MS = 600_000;
const FCClientCtor = resolveSdkCtor<FC>(FC, '@alicloud/fc20230330');

function parsePositiveIntEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export function createSharedFcClient(auth?: AuthConfig) {
  const resolved = auth ?? Config.requireAuth();
  const connectTimeout = parsePositiveIntEnv(readLicellEnv(process.env, 'FC_CONNECT_TIMEOUT_MS'), FC_CONNECT_TIMEOUT_MS);
  const readTimeout = parsePositiveIntEnv(readLicellEnv(process.env, 'FC_READ_TIMEOUT_MS'), FC_READ_TIMEOUT_MS);
  const client = new FCClientCtor(new $OpenApi.Config({
    accessKeyId: resolved.ak,
    accessKeySecret: resolved.sk,
    endpoint: `${resolved.accountId}.${resolved.region}.fc.aliyuncs.com`,
    connectTimeout,
    readTimeout
  }));
  return { auth: resolved, client };
}
