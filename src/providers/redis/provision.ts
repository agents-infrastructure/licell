import Kvstore, * as $Kvstore from '@alicloud/r-kvstore20150101';
import { randomUUID } from 'crypto';
import { type AuthConfig, Config } from '../../utils/config';
import { randomStrongPassword } from '../../utils/crypto';
import { formatErrorMessage, type Spinner } from '../../utils/errors';
import { ensureDefaultNetwork, resolveProvidedNetwork } from '../vpc';
import { createRedisClient } from './client';
import {
  formatInferCreateErrorWithCode,
  ensureKvstoreServiceLinkedRole,
  listTairKVCacheInstances,
  resolveRedisAccountName,
  resolveTairKVCacheEndpoint,
  selectVkName,
  tryApplySecurityIps,
  tryCreateInferInstance,
  tryResetPasswordWithAccount,
  tryResetPasswordWithCustomApi
} from './internals';
import {
  formatRedisUrl,
  isClassicRedisInstance,
  isTairServerlessInstance,
  mergeProjectNetwork
} from './helpers';
import {
  DEFAULT_TAIR_KVCACHE_CLASS,
  DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT,
  REDIS_BIND_WAIT_TIMEOUT_MS,
  type ProvisionRedisOptions
} from './types';

async function bindExistingClassicRedisInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  auth: AuthConfig,
  project: ReturnType<typeof Config.getProject>,
  options: ProvisionRedisOptions,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string }
) {
  const instanceId = options.instanceId?.trim() || '';
  spinner.message(`🔗 正在绑定已有 Redis 实例 (${instanceId})...`);

  const instanceRes = await redisClient.describeInstances(new $Kvstore.DescribeInstancesRequest({
    regionId: auth.region,
    instanceIds: instanceId,
    pageNumber: 1,
    pageSize: 30
  }));
  const instance = instanceRes.body?.instances?.KVStoreInstance?.find((item) => item.instanceId === instanceId);
  const host = instance?.connectionDomain || project.cache?.host;
  const port = instance?.port || project.cache?.port || 6379;
  if (!host) throw new Error(`未查询到 Redis 连接地址，请确认实例 ${instanceId} 可用`);

  let accountName = options.accountName?.trim() || project.cache?.accountName || '';
  if (!accountName) {
    accountName = await resolveRedisAccountName(redisClient, instanceId, project.cache?.accountName);
  }

  let redisPassword = options.existingPassword?.trim() || '';
  if (!redisPassword) {
    if (!accountName) {
      throw new Error('未查询到 Redis 账号，请使用 --username 指定实例账号，或使用 --password 直接绑定');
    }
    const newPassword = randomStrongPassword();
    await redisClient.resetAccountPassword(new $Kvstore.ResetAccountPasswordRequest({
      instanceId,
      accountName,
      accountPassword: newPassword
    }));
    redisPassword = newPassword;
  }

  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  spinner.message('🔐 正在配置 Redis 内网白名单...');
  await tryApplySecurityIps(redisClient, instanceId, securityIps, spinner);

  const redisUrl = formatRedisUrl(accountName || undefined, redisPassword, host, port);
  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: host,
    REDIS_PORT: String(port),
    REDIS_PASSWORD: redisPassword,
    REDIS_USERNAME: accountName
  };
  project.network = mergeProjectNetwork(project.network, net);
  project.cache = {
    type: 'redis',
    instanceId,
    host,
    port,
    accountName,
    mode: 'classic-redis'
  };
  Config.setProject(project);
  return redisUrl;
}

async function bindExistingTairInstance(
  spinner: Spinner,
  redisClient: Kvstore,
  project: ReturnType<typeof Config.getProject>,
  options: ProvisionRedisOptions,
  net: { vpcId: string; vswId: string; zoneId?: string; cidrBlock?: string }
) {
  const instanceId = options.instanceId?.trim() || '';
  spinner.message(`🔗 正在绑定已有 Tair Serverless KV 实例 (${instanceId})...`);
  let endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [instanceId, options.vkName, project.cache?.vkName],
    { waitTimeoutMs: REDIS_BIND_WAIT_TIMEOUT_MS }
  );
  if (!endpoint.host && project.cache?.host) {
    endpoint = {
      host: project.cache.host,
      port: project.cache.port || 6379,
      url: `redis://${project.cache.host}:${project.cache.port || 6379}`,
      sourceInstanceId: instanceId
    };
  }

  let accountName = options.accountName?.trim() || endpoint.accountName || project.cache?.accountName || '';
  let redisPassword = options.existingPassword?.trim() || endpoint.password || '';
  if (!redisPassword) {
    spinner.message('🔐 未传入 --password，正在自动轮换实例密码...');
    const desiredPassword = randomStrongPassword();
    const accountReset = await tryResetPasswordWithAccount(
      redisClient,
      [endpoint.sourceInstanceId, options.vkName, instanceId],
      desiredPassword,
      accountName
    );
    if (accountReset) {
      accountName = accountReset.accountName;
      redisPassword = desiredPassword;
    } else {
      const customReset = await tryResetPasswordWithCustomApi(
        redisClient,
        [endpoint.sourceInstanceId, instanceId, options.vkName],
        desiredPassword
      );
      if (!customReset) {
        throw new Error(
          '未能自动重置已存在实例密码。请使用 --password 传入控制台已设置密码，或先执行 `licell cache rotate-password --instance <id>` 再重试'
        );
      }
      redisPassword = desiredPassword;
    }
  }

  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  spinner.message('🔐 正在配置 Redis 内网白名单...');
  await tryApplySecurityIps(redisClient, endpoint.sourceInstanceId, securityIps, spinner);

  const redisUrl = formatRedisUrl(accountName || undefined, redisPassword, endpoint.host, endpoint.port);
  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: endpoint.host,
    REDIS_PORT: String(endpoint.port),
    REDIS_PASSWORD: redisPassword,
    REDIS_USERNAME: accountName
  };
  project.network = mergeProjectNetwork(project.network, net);
  project.cache = {
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host: endpoint.host,
    port: endpoint.port,
    accountName,
    vkName: options.vkName?.trim() || project.cache?.vkName || (endpoint.sourceInstanceId.startsWith('tk-') ? endpoint.sourceInstanceId : undefined),
    mode: 'tair-serverless-kv'
  };
  Config.setProject(project);
  return redisUrl;
}

export async function provisionRedis(spinner: Spinner, options: ProvisionRedisOptions = {}) {
  const auth = Config.requireAuth();
  const project = Config.getProject();

  if (options.engineVersion || options.nodeType || options.capacityMb) {
    throw new Error('Tair Serverless KV 不支持 --engine-version/--node-type/--capacity 参数');
  }

  const manualZoneId = options.zoneId?.trim();
  const manualVpcId = options.vpcId?.trim();
  const manualVSwitchId = options.vSwitchId?.trim();
  const net = await ((manualVpcId || manualVSwitchId)
    ? (() => {
        if (!manualVpcId || !manualVSwitchId) {
          throw new Error('自定义网络时需同时提供 --vpc 与 --vsw');
        }
        if (!manualZoneId) {
          throw new Error('自定义网络时需提供 --zone');
        }
        return resolveProvidedNetwork({
          vpcId: manualVpcId,
          vswId: manualVSwitchId,
          zoneId: manualZoneId
        });
      })()
    : ensureDefaultNetwork({ preferredZoneIds: manualZoneId ? [manualZoneId] : undefined }));

  const redisClient = createRedisClient(auth);
  await ensureKvstoreServiceLinkedRole(redisClient, auth.region, spinner);

  const existingInstanceId = options.instanceId?.trim();
  if (existingInstanceId) {
    if (isTairServerlessInstance(existingInstanceId)) {
      return bindExistingTairInstance(spinner, redisClient, project, options, net);
    }
    if (isClassicRedisInstance(existingInstanceId)) {
      return bindExistingClassicRedisInstance(spinner, redisClient, auth, project, options, net);
    }
    throw new Error('--instance 仅支持 tt-/tk-（Tair）或 r-（经典 Redis）开头的实例 ID');
  }

  let inferCreateError: unknown;
  try {
    spinner.message('⚡ 正在通过直连 API 创建 Tair Serverless KV...');
    const inferResult = await tryCreateInferInstance(auth, spinner, net, options, project.appName);
    if (inferResult) {
      const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
      spinner.message('🔐 正在配置 Redis 内网白名单...');
      await tryApplySecurityIps(redisClient, inferResult.instanceId, securityIps, spinner);

      project.envs = {
        ...project.envs,
        REDIS_URL: inferResult.redisUrl,
        REDIS_HOST: inferResult.host,
        REDIS_PORT: String(inferResult.port),
        REDIS_PASSWORD: inferResult.password,
        REDIS_USERNAME: inferResult.accountName || ''
      };
      project.network = mergeProjectNetwork(project.network, net);
      project.cache = {
        type: 'redis',
        instanceId: inferResult.instanceId,
        host: inferResult.host,
        port: inferResult.port,
        accountName: inferResult.accountName,
        mode: 'tair-serverless-kv'
      };
      Config.setProject(project);
      return inferResult.redisUrl;
    }
  } catch (err: unknown) {
    inferCreateError = err;
    spinner.message(formatInferCreateErrorWithCode(err));
  }

  spinner.message('🔎 正在查询可用的 Tair Serverless KV 虚拟集群...');
  const inferInstances = await listTairKVCacheInstances(redisClient, auth.region);
  const vkName = selectVkName(inferInstances, net, options.vkName);
  if (!vkName) {
    if (inferCreateError) {
      throw new Error(
        `OpenAPI 直连创建失败（${formatErrorMessage(inferCreateError)}），且当前账号下未找到可用 vkName。` +
        '请先在控制台创建一个 Tair Serverless KV 实例后重试，或执行 `licell cache add --type redis --instance <tt-或tk-实例ID> --password <实例密码>` 直接绑定。'
      );
    }
    throw new Error('未找到可用 vkName。请先在阿里云控制台创建 Tair Serverless KV 实例，并通过 --instance <tt-或tk-实例ID> 直接绑定');
  }

  const instanceClass = options.instanceClass?.trim() || DEFAULT_TAIR_KVCACHE_CLASS;
  const computeUnitNum = options.computeUnitNum || DEFAULT_TAIR_KVCACHE_COMPUTE_UNIT;
  if (!Number.isInteger(computeUnitNum) || computeUnitNum <= 0) {
    throw new Error('--compute-unit 必须是正整数');
  }
  if (computeUnitNum !== 1) {
    throw new Error('当前阿里云 CreateTairKVCacheVNode 仅支持 --compute-unit 1');
  }

  const instanceName = `${project.appName || 'licell-app'}-redis`;
  spinner.message(`⚡ 正在创建 Tair Serverless KV: class=${instanceClass}, cu=${computeUnitNum}, vk=${vkName}`);
  const createRes = await redisClient.createTairKVCacheVNode(new $Kvstore.CreateTairKVCacheVNodeRequest({
    regionId: auth.region,
    instanceName,
    instanceClass,
    computeUnitNum,
    zoneId: net.zoneId || manualZoneId,
    vSwitchId: net.vswId,
    vkName,
    clientToken: randomUUID()
  }));

  const vnodeInstanceId = createRes.body?.instanceId;
  const returnedVkName = createRes.body?.vkName || vkName;
  if (!vnodeInstanceId) throw new Error('Tair Serverless KV 创建失败：未返回 instanceId');

  const endpoint = await resolveTairKVCacheEndpoint(
    redisClient,
    spinner,
    [returnedVkName, vnodeInstanceId]
  );

  const host = endpoint.host;
  const port = endpoint.port;
  let accountName = endpoint.accountName || project.cache?.accountName || '';
  let redisPassword = endpoint.password || '';
  let redisUrl = endpoint.url;

  if (!redisPassword) {
    spinner.message('🔐 正在设置 Redis 密码...');
    const desiredPassword = randomStrongPassword();
    const accountReset = await tryResetPasswordWithAccount(
      redisClient,
      [endpoint.sourceInstanceId, returnedVkName, vnodeInstanceId],
      desiredPassword,
      accountName
    );
    if (accountReset) {
      accountName = accountReset.accountName;
      redisPassword = desiredPassword;
      redisUrl = formatRedisUrl(accountName, redisPassword, host, port);
    } else {
      const customReset = await tryResetPasswordWithCustomApi(
        redisClient,
        [endpoint.sourceInstanceId, vnodeInstanceId, returnedVkName],
        desiredPassword
      );
      if (!customReset) {
        throw new Error('未能自动设置 Tair Serverless KV 密码，请在控制台手动设置后重试');
      }
      redisPassword = desiredPassword;
      redisUrl = formatRedisUrl(accountName || undefined, redisPassword, host, port);
    }
  }

  const securityIps = options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8';
  spinner.message('🔐 正在配置 Redis 内网白名单...');
  await tryApplySecurityIps(redisClient, endpoint.sourceInstanceId, securityIps, spinner);

  project.envs = {
    ...project.envs,
    REDIS_URL: redisUrl,
    REDIS_HOST: host,
    REDIS_PORT: String(port),
    REDIS_PASSWORD: redisPassword,
    REDIS_USERNAME: accountName
  };
  project.network = mergeProjectNetwork(project.network, net);
  project.cache = {
    type: 'redis',
    instanceId: endpoint.sourceInstanceId,
    host,
    port,
    accountName,
    vkName: returnedVkName,
    mode: 'tair-serverless-kv'
  };
  Config.setProject(project);
  return redisUrl;
}
