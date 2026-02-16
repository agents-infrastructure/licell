import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { Config } from '../../utils/config';
import { randomStrongPassword } from '../../utils/crypto';
import { type Spinner } from '../../utils/errors';
import { createRedisClient } from './client';
import { formatRedisUrl, isClassicRedisInstance } from './helpers';
import {
  getClassicInstanceById,
  resolveRedisAccountName,
  resolveTairKVCacheEndpoint,
  tryResetPasswordWithAccount,
  tryResetPasswordWithCustomApi
} from './internals';

export async function rotateRedisPassword(spinner: Spinner, explicitInstanceId?: string) {
  const auth = Config.requireAuth();
  const project = Config.getProject();
  const redisClient = createRedisClient(auth);

  const instanceId = explicitInstanceId || project.cache?.instanceId;
  if (!instanceId) throw new Error('未找到 Redis 实例 ID，请先执行 licell cache add');

  if (isClassicRedisInstance(instanceId)) {
    spinner.message('🔎 正在获取 Redis 账号...');
    const accountName = await resolveRedisAccountName(
      redisClient,
      instanceId,
      project.cache?.accountName
    );
    if (!accountName) throw new Error('未找到可用 Redis 账号，无法轮换密码');

    const newPassword = randomStrongPassword();
    spinner.message('🔐 正在轮换 Redis 密码...');
    await redisClient.resetAccountPassword(new $Kvstore.ResetAccountPasswordRequest({
      instanceId,
      accountName,
      accountPassword: newPassword
    }));

    const instance = await getClassicInstanceById(redisClient, auth, instanceId);
    const host = instance?.connectionDomain || project.cache?.host;
    const port = instance?.port || project.cache?.port || 6379;
    if (!host) throw new Error('未查询到 Redis 连接地址');

    const redisUrl = formatRedisUrl(accountName, newPassword, host, port);
    project.envs = {
      ...project.envs,
      REDIS_URL: redisUrl,
      REDIS_HOST: host,
      REDIS_PORT: String(port),
      REDIS_PASSWORD: newPassword,
      REDIS_USERNAME: accountName
    };
    project.cache = {
      ...(project.cache || { type: 'redis', instanceId }),
      type: 'redis',
      instanceId,
      host,
      port,
      accountName
    };
    Config.setProject(project);
    return redisUrl;
  }

  spinner.message('🔎 正在解析 Tair Serverless KV 连接地址...');
  let endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [instanceId, project.cache?.vkName]
  );
  if (!endpoint.host && project.cache?.host) {
    endpoint = {
      host: project.cache.host,
      port: project.cache.port || 6379,
      url: `redis://${project.cache.host}:${project.cache.port || 6379}`,
      sourceInstanceId: instanceId
    };
  }

  const newPassword = randomStrongPassword();
  spinner.message('🔐 正在轮换 Tair Serverless KV 密码...');
  const accountReset = await tryResetPasswordWithAccount(
    redisClient,
    [endpoint.sourceInstanceId, project.cache?.vkName, instanceId],
    newPassword,
    project.cache?.accountName
  );
  const accountName = accountReset?.accountName || project.cache?.accountName || '';
  if (!accountReset) {
    const customReset = await tryResetPasswordWithCustomApi(
      redisClient,
      [endpoint.sourceInstanceId, instanceId, project.cache?.vkName],
      newPassword
    );
    if (!customReset) throw new Error('轮换密码失败：当前实例不支持自动密码重置');
  }

  const redisUrl = formatRedisUrl(accountName || undefined, newPassword, endpoint.host, endpoint.port);
  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: endpoint.host,
    REDIS_PORT: String(endpoint.port),
    REDIS_PASSWORD: newPassword,
    REDIS_USERNAME: accountName
  };
  project.cache = {
    ...(project.cache || { type: 'redis', instanceId }),
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host: endpoint.host,
    port: endpoint.port,
    accountName,
    vkName: project.cache?.vkName,
    mode: 'tair-serverless-kv'
  };
  Config.setProject(project);
  return redisUrl;
}
