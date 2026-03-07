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

const DEFAULT_FC_CONNECT_TIMEOUT_MS = 15_000;
const DEFAULT_FC_READ_TIMEOUT_MS = 180_000;
const FCClientCtor = resolveSdkCtor<FC>(FC, '@alicloud/fc20230330');

export function parsePositiveIntEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export interface FcTimeoutConfig {
  connectTimeoutMs: number;
  readTimeoutMs: number;
}

export function getFcTimeoutConfig(env: Record<string, string | undefined> = process.env): FcTimeoutConfig {
  return {
    connectTimeoutMs: parsePositiveIntEnv(readLicellEnv(env, 'FC_CONNECT_TIMEOUT_MS'), DEFAULT_FC_CONNECT_TIMEOUT_MS),
    readTimeoutMs: parsePositiveIntEnv(readLicellEnv(env, 'FC_READ_TIMEOUT_MS'), DEFAULT_FC_READ_TIMEOUT_MS)
  };
}

export function createSharedFcClient(auth?: AuthConfig) {
  const resolved = auth ?? Config.requireAuth();
  const { connectTimeoutMs, readTimeoutMs } = getFcTimeoutConfig();
  const client = new FCClientCtor(new $OpenApi.Config({
    accessKeyId: resolved.ak,
    accessKeySecret: resolved.sk,
    endpoint: `${resolved.accountId}.${resolved.region}.fc.aliyuncs.com`,
    connectTimeout: connectTimeoutMs,
    readTimeout: readTimeoutMs
  }));
  return { auth: resolved, client };
}
