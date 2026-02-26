import Rds, * as $Rds from '@alicloud/rds20140815';
import { Config } from '../../utils/config';
import { randomStrongPassword } from '../../utils/crypto';
import { ignoreConflict, type Spinner } from '../../utils/errors';
import { isRoleMissingError, isAlreadyExistsRoleError, isTransientError } from '../../utils/alicloud-error';
import { sleep } from '../../utils/runtime';
import { ensureDefaultNetwork, resolveProvidedNetwork } from '../vpc';
import { createRdsClient } from './client';
import type { ProvisionDatabaseOptions } from './types';

const DB_WAIT_TIMEOUT_MS = 20 * 60 * 1000;
const DB_WAIT_INTERVAL_MS = 5000;
const DB_NETINFO_WAIT_TIMEOUT_MS = 5 * 60 * 1000;
const CREATE_DB_MAX_ATTEMPTS = 5;
const POSTPAID_PG_CLASS_FALLBACK = 'pg.n1e.1c.1m';
const POSTPAID_PG_STORAGE_FALLBACK = 20;
const POSTPAID_PG_ENGINE_VERSION = '18.0';

const SERVERLESS_DB_CLASS_FALLBACK = {
  postgres: 'pg.n2.serverless.1c',
  mysql: 'mysql.n2.serverless.1c'
} as const;
const SERVERLESS_DB_STORAGE_FALLBACK = {
  postgres: 20,
  mysql: 20
} as const;
const SERVERLESS_DB_CONFIG_FALLBACK = {
  postgres: { minCapacity: 0.5, maxCapacity: 8, autoPause: true },
  mysql: { minCapacity: 0.5, maxCapacity: 2, autoPause: true }
} as const;
const RDS_SERVICE_LINKED_ROLE_BY_DB = {
  postgres: 'AliyunServiceRoleForRdsPgsqlOnEcs',
  mysql: 'AliyunServiceRoleForRds'
} as const;

function versionMatches(expectedVersion: string, availableVersion?: string) {
  if (!availableVersion) return false;
  if (availableVersion === expectedVersion) return true;
  const expectedMajor = expectedVersion.split('.')[0];
  const availableMajor = availableVersion.split('.')[0];
  return expectedMajor.length > 0 && expectedMajor === availableMajor;
}

async function resolveServerlessZoneIds(
  rdsClient: Rds,
  regionId: string,
  engine: string,
  engineVersion: string
) {
  try {
    const directRes = await rdsClient.describeAvailableZones(new $Rds.DescribeAvailableZonesRequest({
      regionId,
      engine,
      engineVersion,
      category: 'serverless_basic'
    }));
    const zoneIds = (directRes.body?.availableZones || [])
      .map((zone) => zone.zoneId)
      .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.length > 0);
    if (zoneIds.length > 0) return [...new Set(zoneIds)];
  } catch { /* serverless_basic category query may not be supported in all regions, fall through to broader query */ }

  try {
    const fallbackRes = await rdsClient.describeAvailableZones(new $Rds.DescribeAvailableZonesRequest({
      regionId,
      engine,
      engineVersion
    }));
    const zones = fallbackRes.body?.availableZones || [];
    const matched: string[] = [];
    for (const zone of zones) {
      const zoneId = zone.zoneId;
      if (typeof zoneId !== 'string' || zoneId.length === 0) continue;
      const hasServerlessCategory = (zone.supportedEngines || []).some((supportedEngine) => {
        if ((supportedEngine.engine || '').toLowerCase() !== engine.toLowerCase()) return false;
        return (supportedEngine.supportedEngineVersions || []).some((supportedVersion) => {
          if (!versionMatches(engineVersion, supportedVersion.version)) return false;
          return (supportedVersion.supportedCategorys || []).some((category) => category.category === 'serverless_basic');
        });
      });
      if (hasServerlessCategory) matched.push(zoneId);
    }
    if (matched.length > 0) return [...new Set(matched)];

    const allZoneIds = zones
      .map((zone) => zone.zoneId)
      .filter((zoneId): zoneId is string => typeof zoneId === 'string' && zoneId.length > 0);
    return [...new Set(allZoneIds)];
  } catch { /* fallback zone query failed, return empty to let caller use defaults */
    return [];
  }
}

async function ensureRdsServiceLinkedRole(
  rdsClient: Rds,
  regionId: string,
  dbType: 'postgres' | 'mysql'
) {
  const roleNames = dbType === 'postgres'
    ? ['AliyunServiceRoleForRds', RDS_SERVICE_LINKED_ROLE_BY_DB.postgres]
    : [RDS_SERVICE_LINKED_ROLE_BY_DB.mysql];

  for (const roleName of roleNames) {
    let hasRole = false;
    try {
      const checkRes = await rdsClient.checkServiceLinkedRole(new $Rds.CheckServiceLinkedRoleRequest({
        regionId,
        serviceLinkedRole: roleName
      }));
      const checkFlag = (checkRes.body?.hasServiceLinkedRole || '').toString().toLowerCase();
      hasRole = checkFlag === 'true' || checkFlag === '1';
    } catch { /* role check may fail due to permissions, proceed to create attempt */ }

    if (hasRole) continue;
    try {
      await rdsClient.createServiceLinkedRole(new $Rds.CreateServiceLinkedRoleRequest({
        regionId,
        serviceLinkedRole: roleName
      }));
    } catch (err: unknown) {
      if (isAlreadyExistsRoleError(err)) continue;
      throw err;
    }
  }
}

async function createDbInstanceWithRetry(
  rdsClient: Rds,
  request: $Rds.CreateDBInstanceRequest,
  spinner: Spinner
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= CREATE_DB_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await rdsClient.createDBInstance(request);
    } catch (err: unknown) {
      lastError = err;
      if (!isTransientError(err) || attempt === CREATE_DB_MAX_ATTEMPTS) throw err;
      spinner.message(`🌐 RDS API 网络抖动，${attempt}/${CREATE_DB_MAX_ATTEMPTS} 次失败，正在重试...`);
      await sleep(1500 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('RDS 创建失败');
}

async function waitForPrivateDbEndpoint(
  rdsClient: Rds,
  dbInstanceId: string,
  dbType: 'postgres' | 'mysql',
  spinner: Spinner
) {
  const fallbackPort = dbType === 'postgres' ? '5432' : '3306';
  const waitStart = Date.now();
  while (true) {
    if (Date.now() - waitStart > DB_NETINFO_WAIT_TIMEOUT_MS) {
      throw new Error('数据库网络信息未就绪，等待连接地址超时');
    }
    const netInfo = await rdsClient.describeDBInstanceNetInfo(new $Rds.DescribeDBInstanceNetInfoRequest({ DBInstanceId: dbInstanceId }));
    const netInfos = netInfo.body?.DBInstanceNetInfos?.DBInstanceNetInfo || [];
    const privateEndpoint = netInfos.find((n) => n.IPType === 'Private') || netInfos[0];
    const host = privateEndpoint?.connectionString?.trim();
    const port = privateEndpoint?.port || fallbackPort;
    if (host) return { host, port };
    const endpointSummary = netInfos
      .map((item) => `${item.IPType || 'Unknown'}:${item.connectionString || '-'}`)
      .join(',') || 'pending';
    spinner.message(`☕ 数据库连接地址初始化中，请稍候... [${endpointSummary}]`);
    await sleep(DB_WAIT_INTERVAL_MS);
  }
}

export function normalizeDbUser(seed: string) {
  let user = seed.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!/^[a-z]/.test(user)) user = `a_${user}`;
  user = user.replace(/_+/g, '_').replace(/_$/, '');
  if (user.length < 2 || !/[a-z0-9]/.test(user.slice(1))) user = 'licell_user';
  return user.slice(0, 16);
}

export async function provisionDatabase(
  dbType: 'postgres' | 'mysql',
  spinner: Spinner,
  options: ProvisionDatabaseOptions = {}
) {
  const { auth, client: rdsClient } = createRdsClient();
  const project = Config.getProject();
  const databaseName = 'main';
  const dbUser = normalizeDbUser(project.appName || 'licell_app');
  const dbPassword = randomStrongPassword();
  const engine = dbType === 'postgres' ? 'PostgreSQL' : 'MySQL';
  const isPostPaidPg = dbType === 'postgres';
  const engineVersion = options.engineVersion?.trim()
    || (isPostPaidPg ? POSTPAID_PG_ENGINE_VERSION : (dbType === 'postgres' ? '18.0' : '8.0'));
  const category = isPostPaidPg
    ? (options.category?.trim() || 'Basic')
    : (options.category?.trim() || 'serverless_basic');
  const storageType = options.storageType?.trim() || 'cloud_essd';

  if (isPostPaidPg) {
    spinner.message('🔎 正在查询 RDS PostgreSQL 可用区...');
  } else {
    spinner.message('🔎 正在查询 RDS Serverless 可用区...');
  }
  let preferredZones: string[];
  if (isPostPaidPg) {
    try {
      const zoneRes = await rdsClient.describeAvailableZones(new $Rds.DescribeAvailableZonesRequest({
        regionId: auth.region, engine, engineVersion, category
      }));
      preferredZones = (zoneRes.body?.availableZones || [])
        .map((z) => z.zoneId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      preferredZones = [...new Set(preferredZones)];
    } catch {
      preferredZones = [];
    }
  } else {
    preferredZones = await resolveServerlessZoneIds(rdsClient, auth.region, engine, engineVersion);
  }
  spinner.message('🔍 正在探测/拉起专属私有网络平面 (VPC & VSwitch)...');
  const manualZoneId = options.zoneId?.trim();
  const manualVpcId = options.vpcId?.trim();
  const manualVSwitchId = options.vSwitchId?.trim();
  let net: Awaited<ReturnType<typeof ensureDefaultNetwork>>;
  if (manualVpcId || manualVSwitchId) {
    if (!manualVpcId || !manualVSwitchId) {
      throw new Error('自定义网络时需同时提供 --vpc 与 --vsw');
    }
    if (!manualZoneId) {
      throw new Error('自定义网络时需提供 --zone');
    }
    net = await resolveProvidedNetwork({
      vpcId: manualVpcId,
      vswId: manualVSwitchId,
      zoneId: manualZoneId
    });
  } else {
    const netPreferredZones = manualZoneId ? [manualZoneId] : preferredZones;
    net = await ensureDefaultNetwork({ preferredZoneIds: netPreferredZones });
  }

  let dbInstanceClass: string = options.instanceClass?.trim()
    || (isPostPaidPg ? POSTPAID_PG_CLASS_FALLBACK : SERVERLESS_DB_CLASS_FALLBACK[dbType]);
  let dbInstanceStorage: number = options.storageGb
    || (isPostPaidPg ? POSTPAID_PG_STORAGE_FALLBACK : SERVERLESS_DB_STORAGE_FALLBACK[dbType]);
  try {
    const classesRes = await rdsClient.describeAvailableClasses(new $Rds.DescribeAvailableClassesRequest({
      regionId: auth.region,
      zoneId: net.zoneId,
      engine,
      engineVersion,
      instanceChargeType: isPostPaidPg ? 'PostPaid' : 'Serverless',
      category,
      DBInstanceStorageType: storageType
    }));
    const availableClass = classesRes.body?.DBInstanceClasses?.find((item) => {
      if (typeof item.DBInstanceClass !== 'string' || item.DBInstanceClass.length === 0) return false;
      if (!options.instanceClass) return true;
      return item.DBInstanceClass === options.instanceClass;
    });
    if (!options.instanceClass && typeof availableClass?.DBInstanceClass === 'string' && availableClass.DBInstanceClass.length > 0) {
      dbInstanceClass = availableClass.DBInstanceClass;
    }
    const minStorage = availableClass?.DBInstanceStorageRange?.minValue;
    if (!options.storageGb && typeof minStorage === 'number' && Number.isFinite(minStorage) && minStorage > 0) {
      dbInstanceStorage = Math.floor(minStorage);
    }
  } catch {
    spinner.message('⚠️ 未能查询到可售规格，回退到内置默认规格继续创建...');
  }

  spinner.message('🔐 正在确保 RDS 服务关联角色已就绪...');
  await ensureRdsServiceLinkedRole(rdsClient, auth.region, dbType);

  spinner.message(isPostPaidPg
    ? `📦 正在拉起 PostgreSQL (按量付费)...`
    : `📦 正在拉起 Serverless ${dbType.toUpperCase()} (按量计费)...`);
  const createReqPayload: Record<string, unknown> = {
    engine,
    engineVersion,
    payType: isPostPaidPg ? 'Postpaid' : 'Serverless',
    category,
    regionId: auth.region,
    zoneId: net.zoneId,
    DBInstanceClass: dbInstanceClass,
    DBInstanceStorage: dbInstanceStorage,
    DBInstanceStorageType: storageType,
    securityIPList: options.securityIpList?.trim() || net.cidrBlock || '10.0.0.0/8',
    instanceNetworkType: 'VPC',
    DBInstanceNetType: 'Intranet',
    DBInstanceDescription: options.description?.trim() || `${project.appName || 'licell-app'}-${dbType}`,
    VPCId: net.vpcId,
    vSwitchId: net.vswId,
  };
  if (!isPostPaidPg) {
    createReqPayload.serverlessConfig = {
      minCapacity: options.minCapacity ?? SERVERLESS_DB_CONFIG_FALLBACK[dbType].minCapacity,
      maxCapacity: options.maxCapacity ?? SERVERLESS_DB_CONFIG_FALLBACK[dbType].maxCapacity,
      autoPause: options.autoPause ?? SERVERLESS_DB_CONFIG_FALLBACK[dbType].autoPause
    };
  }
  const zoneIdSlave1 = options.zoneIdSlave1?.trim();
  const zoneIdSlave2 = options.zoneIdSlave2?.trim();
  if (zoneIdSlave1) createReqPayload.zoneIdSlave1 = zoneIdSlave1;
  if (zoneIdSlave2) createReqPayload.zoneIdSlave2 = zoneIdSlave2;
  const createReq = new $Rds.CreateDBInstanceRequest(createReqPayload);
  let createDbRes: Awaited<ReturnType<Rds['createDBInstance']>>;
  try {
    createDbRes = await createDbInstanceWithRetry(rdsClient, createReq, spinner);
  } catch (err: unknown) {
    if (!isRoleMissingError(err)) throw err;
    spinner.message('🔐 首次使用检测到缺少服务关联角色，正在自动创建并重试...');
    await ensureRdsServiceLinkedRole(rdsClient, auth.region, dbType);
    try {
      createDbRes = await createDbInstanceWithRetry(rdsClient, createReq, spinner);
    } catch (retryErr: unknown) {
      if (isRoleMissingError(retryErr)) {
        throw new Error(
          'RDS PostgreSQL 仍提示缺少服务关联角色。请先在阿里云控制台开通 RDS PostgreSQL 服务后重试，或先创建 MySQL Serverless 实例。'
        );
      }
      throw retryErr;
    }
  }

  const dbInstanceId = createDbRes.body?.DBInstanceId;
  if (!dbInstanceId) throw new Error('RDS 创建失败：未返回 DBInstanceId');

  let status = 'Creating';
  const waitStart = Date.now();
  while (status !== 'Running') {
    if (Date.now() - waitStart > DB_WAIT_TIMEOUT_MS) {
      throw new Error(`数据库创建超时，最后状态: ${status}`);
    }
    await sleep(DB_WAIT_INTERVAL_MS);
    const statusRes = await rdsClient.describeDBInstances(new $Rds.DescribeDBInstancesRequest({ DBInstanceId: dbInstanceId }));
    status = statusRes.body?.items?.DBInstance?.[0]?.DBInstanceStatus || 'Creating';
    if (status === 'Deleted' || status === 'Failed') {
      throw new Error(`数据库创建失败，实例状态: ${status}`);
    }
    spinner.message(`☕ 数据库底层初始化中，请稍候... [${status}]`);
  }

  spinner.message('🧱 正在创建数据库与应用账号...');
  await ignoreConflict(() => rdsClient.createAccount(new $Rds.CreateAccountRequest({
    DBInstanceId: dbInstanceId,
    accountName: dbUser,
    accountPassword: dbPassword,
    accountType: 'Normal',
    accountDescription: 'licell managed account'
  })));

  await ignoreConflict(() => rdsClient.createDatabase(new $Rds.CreateDatabaseRequest({
    DBInstanceId: dbInstanceId,
    DBName: databaseName,
    characterSetName: dbType === 'postgres' ? 'UTF8' : 'utf8mb4',
    ownerAccount: dbType === 'postgres' ? dbUser : undefined
  })));

  if (dbType !== 'postgres') {
    await ignoreConflict(() => rdsClient.grantAccountPrivilege(new $Rds.GrantAccountPrivilegeRequest({
      DBInstanceId: dbInstanceId,
      DBName: databaseName,
      accountName: dbUser,
      accountPrivilege: 'ReadWrite'
    })));
  }

  const { host, port } = await waitForPrivateDbEndpoint(rdsClient, dbInstanceId, dbType, spinner);

  const protocol = dbType === 'postgres' ? 'postgresql' : 'mysql';
  const dbUrl = `${protocol}://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${host}:${port}/${databaseName}`;
  project.envs = { ...project.envs, DATABASE_URL: dbUrl };
  project.network = net;
  project.database = {
    type: dbType,
    instanceId: dbInstanceId,
    user: dbUser,
    name: databaseName
  };
  Config.setProject(project);
  spinner.message('⚠️ DATABASE_URL（含密码）已写入 .licell/project.json，请确认该目录已在 .gitignore 中');
  return dbUrl;
}
