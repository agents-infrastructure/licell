import * as $Kvstore from '@alicloud/r-kvstore20150101';
import { Config } from '../../utils/config';
import { createRedisClient } from './client';
import { formatErrorMessage, type Spinner } from '../../utils/errors';
import { isClassicRedisInstance } from './helpers';

const PUBLIC_WHITELIST_GROUP = 'licell_public';

export async function allocateCachePublicConnection(
  instanceId: string,
  spinner: Spinner
): Promise<{ host: string; port: number } | null> {
  const auth = Config.requireAuth();
  const client = createRedisClient(auth);

  // Check existing net info
  const netRes = await client.describeDBInstanceNetInfo(
    new $Kvstore.DescribeDBInstanceNetInfoRequest({ instanceId })
  );
  const infos = netRes.body?.netInfoItems?.instanceNetInfo || [];
  const publicInfo = infos.find((i) => i.IPType === 'Public');
  if (publicInfo?.connectionString) {
    return { host: publicInfo.connectionString, port: Number(publicInfo.port) || 6379 };
  }

  // Allocate
  const prefix = `${instanceId}-pub`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  try {
    await client.allocateInstancePublicConnection(
      new $Kvstore.AllocateInstancePublicConnectionRequest({
        instanceId,
        connectionStringPrefix: prefix,
        port: '6379'
      })
    );
  } catch (err: unknown) {
    const msg = formatErrorMessage(err);
    if (msg.includes('NetTypeExists') || msg.includes('already exists')) {
      spinner.message('公网地址已存在，正在获取...');
    } else {
      throw err;
    }
  }

  // Re-fetch
  const netRes2 = await client.describeDBInstanceNetInfo(
    new $Kvstore.DescribeDBInstanceNetInfoRequest({ instanceId })
  );
  const infos2 = netRes2.body?.netInfoItems?.instanceNetInfo || [];
  const pub = infos2.find((i) => i.IPType === 'Public');
  if (!pub?.connectionString) return null;
  return { host: pub.connectionString, port: Number(pub.port) || 6379 };
}

export async function applyCachePublicWhitelist(
  instanceId: string,
  publicIp: string,
  spinner: Spinner
) {
  const auth = Config.requireAuth();
  const client = createRedisClient(auth);
  const cidr = `${publicIp}/32`;
  try {
    await client.modifySecurityIps(new $Kvstore.ModifySecurityIpsRequest({
      instanceId,
      securityIpGroupName: PUBLIC_WHITELIST_GROUP,
      securityIps: cidr,
      modifyMode: 'Cover'
    }));
  } catch (err: unknown) {
    spinner.message(`⚠️ 公网白名单设置失败: ${formatErrorMessage(err)}`);
  }
}
