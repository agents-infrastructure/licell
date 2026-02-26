import * as $Rds from '@alicloud/rds20140815';
import { createRdsClient } from './client';
import type { Spinner } from '../../utils/errors';
import { formatErrorMessage } from '../../utils/errors';

const PUBLIC_WHITELIST_GROUP = 'licell_public';

export async function allocateDbPublicConnection(
  instanceId: string,
  spinner: Spinner
): Promise<{ host: string; port: string } | null> {
  const { client } = createRdsClient();

  // Check if public endpoint already exists
  const netInfo = await client.describeDBInstanceNetInfo(
    new $Rds.DescribeDBInstanceNetInfoRequest({ DBInstanceId: instanceId })
  );
  const endpoints = netInfo.body?.DBInstanceNetInfos?.DBInstanceNetInfo || [];
  const publicEndpoint = endpoints.find((e) => e.IPType === 'Public');
  if (publicEndpoint?.connectionString) {
    return { host: publicEndpoint.connectionString, port: publicEndpoint.port || '3306' };
  }

  // Allocate public connection
  const prefix = `${instanceId}-pub`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  try {
    await client.allocateInstancePublicConnection(
      new $Rds.AllocateInstancePublicConnectionRequest({
        DBInstanceId: instanceId,
        connectionStringPrefix: prefix,
        port: '3306'
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

  // Re-fetch to get the actual public endpoint
  const netInfo2 = await client.describeDBInstanceNetInfo(
    new $Rds.DescribeDBInstanceNetInfoRequest({ DBInstanceId: instanceId })
  );
  const endpoints2 = netInfo2.body?.DBInstanceNetInfos?.DBInstanceNetInfo || [];
  /* PLACEHOLDER_PUBLIC_ACCESS */
  const pub = endpoints2.find((e) => e.IPType === 'Public');
  if (!pub?.connectionString) return null;
  return { host: pub.connectionString, port: pub.port || '3306' };
}

export async function applyDbPublicWhitelist(
  instanceId: string,
  publicIp: string,
  spinner: Spinner
) {
  const { client } = createRdsClient();
  const cidr = `${publicIp}/32`;
  try {
    await client.modifySecurityIps(new $Rds.ModifySecurityIpsRequest({
      DBInstanceId: instanceId,
      DBInstanceIPArrayName: PUBLIC_WHITELIST_GROUP,
      securityIps: cidr,
      modifyMode: 'Cover'
    }));
  } catch (err: unknown) {
    spinner.message(`⚠️ 公网白名单设置失败: ${formatErrorMessage(err)}`);
  }
}
