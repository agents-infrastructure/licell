import { randomInt, randomUUID } from 'crypto';
import * as $RdsAi from '@alicloud/rdsai20250507';
import { Config } from '../../utils/config';
import { type Spinner } from '../../utils/errors';
import { sleep } from '../../utils/runtime';
import { ensureDefaultNetwork } from '../vpc';
import { createRdsAiClient } from './client';
import { DEFAULT_SUPABASE_CLASS, SUPABASE_WAIT_INTERVAL_MS, SUPABASE_WAIT_TIMEOUT_MS, type ProvisionSupabaseOptions } from './types';

const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL = `${LOWER}${UPPER}${DIGITS}_`;

function generateSupabasePassword(length = 20): string {
  const picks = [
    LOWER[randomInt(LOWER.length)],
    UPPER[randomInt(UPPER.length)],
    DIGITS[randomInt(DIGITS.length)],
    '_'
  ];
  while (picks.length < length) picks.push(ALL[randomInt(ALL.length)]);
  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks.join('');
}

export async function provisionSupabase(spinner: Spinner, options: ProvisionSupabaseOptions = {}) {
  const { auth, client } = createRdsAiClient();
  const project = Config.getProject();

  spinner.message('🔧 正在准备网络环境...');
  let vSwitchId = options.vSwitchId?.trim() || '';
  if (!vSwitchId) {
    const net = await ensureDefaultNetwork();
    vSwitchId = net.vswId;
  }

  const appName = options.appName?.trim() || `licell-supa-${Date.now()}`;
  const dashboardUsername = options.dashboardUsername?.trim() || 'supabase';
  const dashboardPassword = options.dashboardPassword?.trim() || generateSupabasePassword();
  const databasePassword = options.databasePassword?.trim() || generateSupabasePassword();
  const instanceClass = options.instanceClass?.trim() || DEFAULT_SUPABASE_CLASS;
  const clientToken = randomUUID();

  spinner.message('🚀 正在创建 Supabase 实例...');
  const createRes = await client.createAppInstance(new $RdsAi.CreateAppInstanceRequest({
    regionId: auth.region,
    appType: 'supabase',
    vSwitchId,
    instanceClass,
    appName,
    dashboardUsername,
    dashboardPassword,
    databasePassword,
    publicEndpointEnabled: options.publicEndpointEnabled ?? true,
    publicNetworkAccessEnabled: options.publicNetworkAccessEnabled ?? false,
    dBInstanceName: options.dbInstanceName?.trim() || undefined,
    clientToken
  }));

  const instanceName = createRes.body?.instanceName;
  if (!instanceName) throw new Error('创建 Supabase 实例失败：未返回 instanceName');

  spinner.message(`⏳ 等待实例 ${instanceName} 就绪...`);
  const deadline = Date.now() + SUPABASE_WAIT_TIMEOUT_MS;
  let status = '';
  while (Date.now() < deadline) {
    await sleep(SUPABASE_WAIT_INTERVAL_MS);
    try {
      const detail = await client.describeAppInstanceAttribute(new $RdsAi.DescribeAppInstanceAttributeRequest({
        regionId: auth.region,
        instanceName
      }));
      status = String((detail.body as Record<string, unknown>)?.Status || (detail.body as Record<string, unknown>)?.status || '');
      spinner.message(`⏳ 实例 ${instanceName} 状态: ${status}`);
      if (status === 'Running') break;
      if (status.includes('Failed') || status.includes('Error')) {
        throw new Error(`Supabase 实例创建失败，状态: ${status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Failed') || msg.includes('Error')) throw err;
    }
  }
  if (status !== 'Running') {
    throw new Error(`Supabase 实例 ${instanceName} 在 ${SUPABASE_WAIT_TIMEOUT_MS / 60000} 分钟内未就绪 (当前状态: ${status})`);
  }

  spinner.message('🔗 正在获取连接信息...');
  const endpointsRes = await client.describeInstanceEndpoints(new $RdsAi.DescribeInstanceEndpointsRequest({
    regionId: auth.region,
    instanceName
  }));
  const eb = (endpointsRes.body || {}) as Record<string, unknown>;
  const instanceEndpoints = (eb.instanceEndpoints || eb.InstanceEndpoints || []) as Record<string, unknown>[];
  const publicEndpoint = instanceEndpoints.find(e => (e.IpType || e.ipType) === 'public');
  const vpcEndpoint = instanceEndpoints.find(e => (e.IpType || e.ipType) === 'vpc');

  const supabaseUrl = publicEndpoint
    ? String(publicEndpoint.ConnectionString || publicEndpoint.connectionString || '')
    : vpcEndpoint
      ? String(vpcEndpoint.ConnectionString || vpcEndpoint.connectionString || '')
      : '';

  spinner.message('🔑 正在获取认证信息...');
  let anonKey = '';
  let serviceKey = '';
  try {
    const authRes = await client.describeInstanceAuthInfo(new $RdsAi.DescribeInstanceAuthInfoRequest({
      regionId: auth.region,
      instanceName
    }));
    const ab = (authRes.body || {}) as Record<string, unknown>;
    const apiKeys = (ab.apiKeys || ab.ApiKeys || {}) as Record<string, unknown>;
    anonKey = String(apiKeys.AnonKey || apiKeys.anonKey || '');
    serviceKey = String(apiKeys.ServiceKey || apiKeys.serviceKey || '');
  } catch {
    // auth info may not be available immediately
  }

  project.envs = {
    ...project.envs,
    SUPABASE_URL: supabaseUrl ? `http://${supabaseUrl}` : '',
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    SUPABASE_INSTANCE_NAME: instanceName,
    SUPABASE_DASHBOARD_USERNAME: dashboardUsername,
    SUPABASE_DASHBOARD_PASSWORD: dashboardPassword,
    SUPABASE_DB_PASSWORD: databasePassword
  };
  Config.setProject(project);

  return {
    instanceName,
    appName,
    supabaseUrl,
    anonKey,
    serviceKey,
    dashboardUsername,
    dashboardPassword,
    databasePassword
  };
}
