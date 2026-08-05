import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { Config, withProjectBindingRegion } from '../../utils/config';
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

  const instanceId = (explicitInstanceId || project.cache?.instanceId || '').trim();
  if (!instanceId) throw new Error('未找到 Redis 实例 ID，请先执行 licell cache add');
  const matchesProjectBinding = project.cache?.instanceId.trim() === instanceId;
  const persistProjectBinding = !explicitInstanceId || matchesProjectBinding;

  if (isClassicRedisInstance(instanceId)) {
    const instance = await getClassicInstanceById(redisClient, auth, instanceId);
    if (!instance) throw new Error(`当前地域 ${auth.region} 未查询到 Redis 实例: ${instanceId}`);

    spinner.message('🔎 正在获取 Redis 账号...');
    const accountName = await resolveRedisAccountName(
      redisClient,
      instanceId,
      matchesProjectBinding ? project.cache?.accountName : undefined
    );
    if (!accountName) throw new Error('未找到可用 Redis 账号，无法轮换密码');

    const host = instance.connectionDomain || (matchesProjectBinding ? project.cache?.host : undefined);
    const port = instance.port || (matchesProjectBinding ? project.cache?.port : undefined) || 6379;
    if (!host) throw new Error('未查询到 Redis 连接地址');

    const newPassword = randomStrongPassword();
    spinner.message('🔐 正在轮换 Redis 密码...');
    await redisClient.resetAccountPassword(new $Kvstore.ResetAccountPasswordRequest({
      instanceId,
      accountName,
      accountPassword: newPassword
    }));

    const redisUrl = formatRedisUrl(accountName, newPassword, host, port);
    if (persistProjectBinding) {
      project.envs = {
        ...project.envs,
        REDIS_URL: redisUrl,
        REDIS_HOST: host,
        REDIS_PORT: String(port),
        REDIS_PASSWORD: newPassword,
        REDIS_USERNAME: accountName
      };
      project.cache = withProjectBindingRegion({
        ...(project.cache || { type: 'redis', instanceId }),
        type: 'redis',
        instanceId,
        host,
        port,
        accountName
      }, auth.region);
      Config.setProject(project);
    }
    return { instanceId, redisUrl, persisted: persistProjectBinding };
  }

  const boundVkName = matchesProjectBinding ? project.cache?.vkName : undefined;
  spinner.message('🔎 正在解析 Tair Serverless KV 连接地址...');
  let endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [instanceId, boundVkName]
  );
  if (!endpoint.host && matchesProjectBinding && project.cache?.host) {
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
    [endpoint.sourceInstanceId, boundVkName, instanceId],
    newPassword,
    matchesProjectBinding ? project.cache?.accountName : undefined
  );
  const accountName = accountReset?.accountName || (matchesProjectBinding ? project.cache?.accountName : undefined) || '';
  if (!accountReset) {
    const customReset = await tryResetPasswordWithCustomApi(
      redisClient,
      [endpoint.sourceInstanceId, instanceId, boundVkName],
      newPassword
    );
    if (!customReset) throw new Error('轮换密码失败：当前实例不支持自动密码重置');
  }

  const redisUrl = formatRedisUrl(accountName || undefined, newPassword, endpoint.host, endpoint.port);
  if (persistProjectBinding) {
    project.envs = {
      ...project.envs,
      REDIS_URL: redisUrl,
      REDIS_HOST: endpoint.host,
      REDIS_PORT: String(endpoint.port),
      REDIS_PASSWORD: newPassword,
      REDIS_USERNAME: accountName
    };
    project.cache = withProjectBindingRegion({
      ...(project.cache || { type: 'redis', instanceId }),
      type: 'redis',
      instanceId: endpoint.sourceInstanceId,
      host: endpoint.host,
      port: endpoint.port,
      accountName,
      vkName: boundVkName,
      mode: 'tair-serverless-kv'
    }, auth.region);
    Config.setProject(project);
  }
  return { instanceId: endpoint.sourceInstanceId, redisUrl, persisted: persistProjectBinding };
}
