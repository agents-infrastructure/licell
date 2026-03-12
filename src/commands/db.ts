import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import { select, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { maskConnectionString } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { Config } from '../utils/config';
import {
  getDatabaseInstanceDetail,
  listDatabaseClasses,
  listDatabaseInstances,
  provisionDatabase,
  resolveDatabaseConnectInfo,
  deleteDatabaseInstance,
  allocateDbPublicConnection,
  applyDbPublicWhitelist
} from '../providers/infra';
import {
  ensureAuthOrExit,
  createSpinner,
  isInteractiveTTY,
  showIntro,
  showOutro,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  normalizeDbType,
  parseOptionalNumber,
  parseOptionalPositiveInt,
  normalizeAutoPause,
  withSpinner,
  type DbTypeInput
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { DATA_SECTION } from './sections';

const DATABASE_PROJECT_ENV_KEYS = ['DATABASE_URL'] as const;

const dbAddOptions = [
  { rawName: '--type <type>', description: '数据库类型：postgresql 或 mysql（默认 serverless-postgresql，即将上线）' },
  { rawName: '--engine-version <version>', description: '数据库引擎版本（postgres 默认 18.0，mysql 默认 8.0）' },
  { rawName: '--category <category>', description: 'RDS Category（默认 serverless_basic）' },
  { rawName: '--class <instanceClass>', description: '实例规格（如 pg.n2.serverless.1c）' },
  { rawName: '--storage <gb>', description: '存储空间 GB（默认 20）' },
  { rawName: '--storage-type <storageType>', description: '存储类型（默认 cloud_essd）' },
  { rawName: '--min-rcu <n>', description: 'Serverless 最小 RCU（如 0.5）' },
  { rawName: '--max-rcu <n>', description: 'Serverless 最大 RCU（如 8）' },
  { rawName: '--auto-pause <mode>', description: '自动启停：on/off' },
  { rawName: '--zone <zoneId>', description: '主可用区（如 cn-hangzhou-b）' },
  { rawName: '--zone-slave1 <zoneId>', description: '备可用区 1（多可用区部署）' },
  { rawName: '--zone-slave2 <zoneId>', description: '备可用区 2（多可用区部署）' },
  { rawName: '--vpc <vpcId>', description: '指定 VPC ID' },
  { rawName: '--vsw <vSwitchId>', description: '指定 VSwitch ID' },
  { rawName: '--security-ip-list <cidrs>', description: '白名单 CIDR（逗号分隔）' },
  { rawName: '--description <text>', description: '实例描述' }
] as const;

const dbAddCommand = defineCliCommand({
  rawName: 'db add',
  description: '分配数据库实例',
  options: dbAddOptions
});

const dbListCommand = defineCliCommand({
  rawName: 'db list',
  description: '查看数据库实例列表',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 20' }
  ]
});

const dbClassCommand = defineCliCommand({
  rawName: 'db class [type]',
  description: '查询数据库可用规格（给 Agent/开发者在 db add 前对照）',
  options: [
    { rawName: '--engine-version <version>', description: '数据库引擎版本（默认 postgresql=18.0，mysql=8.0）' },
    { rawName: '--category <category>', description: 'RDS Category（默认 postgresql=Basic，mysql=serverless_basic）' },
    { rawName: '--storage-type <storageType>', description: '存储类型（默认 cloud_essd）' },
    { rawName: '--zone <zoneId>', description: '按可用区过滤（如 cn-hangzhou-b）' },
    { rawName: '--all-zones', description: '聚合当前地域全部可用 zone 的 class，并标明每个 zone 有哪些规格' },
    { rawName: '--limit <n>', description: '输出数量，默认 20' }
  ],
  descriptor: {
    title: 'List database instance classes',
    notes: ['查询口径与当前 `db add` 默认创建参数保持一致。', '未传 `--zone` 且未开启 `--all-zones` 时，默认查询首个可用 zone。', '开启 `--all-zones` 后，会同时返回 `class -> zoneIds` 和 `zone -> classes` 两种聚合视角。'],
    examples: ['licell db class', 'licell db class postgresql --all-zones --limit 50', 'licell db class mysql --zone cn-hangzhou-b --output json'],
    related: ['db add', 'db list'],
    recommendedFlow: [
      { title: '先看可用规格', command: 'licell db class', reason: '确认当前地域/可用区下有哪些 class 可选，再决定 `db add --class`。' },
      { title: '再执行创建', command: 'licell db add --class <instanceClass>', reason: '把选中的规格显式传给 db add。' }
    ]
  }
});

const dbInfoCommand = defineCliCommand({
  rawName: 'db info <instanceId>',
  description: '查看数据库实例详情'
});

const dbConnectCommand = defineCliCommand({
  rawName: 'db connect [instanceId]',
  description: '输出数据库连接信息'
});

const dbPublicAccessCommand = defineCliCommand({
  rawName: 'db public-access [instanceId]',
  description: '开通数据库公网访问并添加当前 IP 到白名单',
  options: [
    { rawName: '--ip <ip>', description: '手动指定公网 IP（不传则自动获取）' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会开启数据库公网访问并修改白名单。'
    }
  }
});

const dbRmCommand = defineCliCommand({
  rawName: 'db rm <instanceId>',
  description: '删除数据库实例',
  options: [
    { rawName: '--yes', description: '跳过确认' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会删除数据库实例，请确认实例 ID 与备份策略。'
    }
  }
});

type DbClassMode = 'all' | 'postgres' | 'mysql';

function normalizeDbClassMode(input: string | undefined): DbClassMode {
  const value = (input || '').trim().toLowerCase();
  if (!value || value === 'all') return 'all';
  if (value === 'postgres' || value === 'postgresql') return 'postgres';
  if (value === 'mysql') return 'mysql';
  throw new Error('db class [type] 仅支持 postgresql / mysql / all');
}

function printDatabaseClassCatalog(
  title: string,
  catalog: Awaited<ReturnType<typeof listDatabaseClasses>>,
  limit: number
) {
  const shown = catalog.classes.slice(0, limit);
  console.log(pc.bold(title));
  console.log(`engine:       ${pc.cyan(`${catalog.engine} ${catalog.engineVersion}`)}`);
  console.log(`chargeType:   ${pc.cyan(catalog.chargeType)}`);
  console.log(`category:     ${pc.cyan(catalog.category)}`);
  console.log(`storageType:  ${pc.cyan(catalog.storageType)}`);
  console.log(`queriedZones: ${pc.cyan(catalog.zoneIds.join(', ') || catalog.zoneId || '-')}`);
  if (catalog.queriedAllZones) {
    console.log(`matchedZones: ${pc.cyan(catalog.zones.map((zone) => zone.zoneId).join(', ') || '-')}`);
  }
  console.log(`defaultClass: ${pc.cyan(catalog.defaultClass)}`);
  console.log(`count:        ${pc.cyan(String(catalog.classes.length))}`);
  for (const item of shown) {
    const storageRange = item.storageRange?.minGb
      ? `${item.storageRange.minGb}-${item.storageRange.maxGb || item.storageRange.minGb}GB${item.storageRange.stepGb ? ` step=${item.storageRange.stepGb}` : ''}`
      : '-';
    const zones = item.zoneIds.length > 0 ? item.zoneIds.join(',') : '-';
    console.log(`${pc.cyan(item.instanceClass)}  storage=${pc.gray(storageRange)}  zones=${pc.gray(zones)}`);
  }
  if (catalog.classes.length > shown.length) {
    console.log(pc.gray(`... 仅展示前 ${shown.length} 条，可通过 --limit 查看更多`));
  }
  if (catalog.queriedAllZones && catalog.zones.length > 0) {
    console.log('');
    console.log(pc.bold('Zone Breakdown'));
    for (const zone of catalog.zones) {
      const shownClasses = zone.classes.slice(0, limit);
      console.log(`${pc.cyan(zone.zoneId)}  count=${pc.gray(String(zone.classCount))}`);
      console.log(`  classes=${pc.gray(shownClasses.join(', ') || '-')}`);
      if (zone.classes.length > shownClasses.length) {
        console.log(pc.gray(`  ... 仅展示前 ${shownClasses.length} 条，可通过 --limit 查看更多`));
      }
    }
  }
}

function clearProjectDatabaseBinding(instanceId: string) {
  const project = Config.getProject();
  if (project.database?.instanceId !== instanceId) return;

  const nextEnvs = { ...project.envs };
  for (const key of DATABASE_PROJECT_ENV_KEYS) {
    delete nextEnvs[key];
  }

  Config.setProject({
    database: undefined,
    envs: nextEnvs
  }, { replaceEnvs: true });
}

export function registerDbCommands(cli: CAC) {
  registerCliCommand(cli, dbAddCommand)
    .action(async (options: {
      type?: unknown;
      engineVersion?: unknown;
      category?: unknown;
      class?: unknown;
      storage?: unknown;
      storageType?: unknown;
      minRcu?: unknown;
      maxRcu?: unknown;
      autoPause?: unknown;
      zone?: unknown;
      zoneSlave1?: unknown;
      zoneSlave2?: unknown;
      vpc?: unknown;
      vsw?: unknown;
      securityIpList?: unknown;
      description?: unknown;
    }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbAddCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          showIntro(pc.bgMagenta(pc.white(' 🗄️ Database Provisioning (IaC) ')));
          ensureAuthOrExit();
          const interactiveTTY = isInteractiveTTY();
          let type: DbTypeInput;
          const dbTypeOption = toOptionalString(options.type);
          if (dbTypeOption) {
            type = normalizeDbType(dbTypeOption);
          } else if (interactiveTTY) {
            const selected = await select({ message: '选择数据库引擎:', options: [
              { value: 'postgres' as const, label: '🐘 RDS PostgreSQL（按量付费）' },
              { value: 'mysql' as const, label: '🐬 RDS Serverless MySQL' },
              { value: 'serverless-postgresql' as const, label: '🐘 RDS Serverless PostgreSQL（即将上线）' }
            ]});
            if (isCancel(selected)) process.exit(0);
            type = selected as DbTypeInput;
          } else {
            throw new Error('非交互模式下请传入 --type postgresql|mysql');
          }

          if (type === 'serverless-postgresql') {
            console.log(pc.yellow('⏳ Serverless PostgreSQL 即将上线，敬请期待。'));
            console.log(pc.gray(`当前支持的类型：${pc.bold('postgresql')}（按量付费）和 ${pc.bold('mysql')}（Serverless）`));
            showOutro('');
            return;
          }

          const dbType = type as 'postgres' | 'mysql';

          const storageGb = parseOptionalPositiveInt(options.storage, 'storage');
          const minCapacity = parseOptionalNumber(options.minRcu, 'min-rcu');
          const maxCapacity = parseOptionalNumber(options.maxRcu, 'max-rcu');
          if (typeof minCapacity === 'number' && minCapacity <= 0) throw new Error('min-rcu 必须大于 0');
          if (typeof maxCapacity === 'number' && maxCapacity <= 0) throw new Error('max-rcu 必须大于 0');
          if (typeof minCapacity === 'number' && typeof maxCapacity === 'number' && minCapacity > maxCapacity) {
            throw new Error('min-rcu 不能大于 max-rcu');
          }
          const autoPause = toOptionalString(options.autoPause) ? normalizeAutoPause(options.autoPause) : undefined;

          const s = createSpinner();
          const dbUrl = await withSpinner(
            s,
            '正在初始化基础设施编排引擎...',
            '❌ 拉起失败',
            () => provisionDatabase(dbType, s, {
              engineVersion: toOptionalString(options.engineVersion),
              category: toOptionalString(options.category),
              instanceClass: toOptionalString(options.class),
              storageGb,
              storageType: toOptionalString(options.storageType),
              minCapacity,
              maxCapacity,
              autoPause,
              zoneId: toOptionalString(options.zone),
              zoneIdSlave1: toOptionalString(options.zoneSlave1),
              zoneIdSlave2: toOptionalString(options.zoneSlave2),
              vpcId: toOptionalString(options.vpc),
              vSwitchId: toOptionalString(options.vsw),
              securityIpList: toOptionalString(options.securityIpList),
              description: toOptionalString(options.description)
            })
          );
          if (!dbUrl) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 数据库实例已就绪并绑定到本工程内网！'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              type,
              connectionStringMasked: maskConnectionString(dbUrl)
            });
            return;
          }
          console.log(`\n🔑 内网直连凭证已生成: ${pc.cyan(maskConnectionString(dbUrl))}\n`);
          showOutro('下次执行 licell deploy 时，将自动作为 process.env.DATABASE_URL 注入！');
        }
      );
    });

  registerCliCommand(cli, dbListCommand)
    .action(async (options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);

          const s = createSpinner();
          const instances = await withSpinner(
            s,
            '正在拉取数据库实例列表...',
            '❌ 获取数据库实例列表失败',
            () => listDatabaseInstances(limit)
          );
          if (!instances) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${instances.length} 个实例`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              count: instances.length,
              instances
            });
            return;
          }
          if (instances.length === 0) {
            showOutro('当前地域没有数据库实例');
            return;
          }
          for (const item of instances) {
            console.log(
              `${pc.cyan(item.instanceId)}  engine=${pc.gray(`${item.engine || '-'} ${item.engineVersion || ''}`.trim())}  status=${pc.gray(item.status || '-')}  class=${pc.gray(item.instanceClass || '-')}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dbClassCommand)
    .action(async (typeInput: string | undefined, options: {
      engineVersion?: unknown;
      category?: unknown;
      storageType?: unknown;
      zone?: unknown;
      allZones?: unknown;
      limit?: unknown;
    }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbClassCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          ensureAuthOrExit();
          const mode = normalizeDbClassMode(toOptionalString(typeInput));
          const limit = parseListLimit(options.limit, 20, 500);
          const queryOptions = {
            engineVersion: toOptionalString(options.engineVersion),
            category: toOptionalString(options.category),
            storageType: toOptionalString(options.storageType),
            zoneId: toOptionalString(options.zone),
            allZones: Boolean(options.allZones)
          };
          const s = createSpinner();
          const result = await withSpinner(
            s,
            '正在查询数据库规格...',
            '❌ 获取数据库规格失败',
            async () => {
              if (mode === 'all') {
                const postgres = await listDatabaseClasses('postgres', queryOptions);
                const mysql = await listDatabaseClasses('mysql', queryOptions);
                return { postgres, mysql };
              }
              const catalog = await listDatabaseClasses(mode, queryOptions);
              return { [mode]: catalog } as { postgres?: typeof catalog; mysql?: typeof catalog };
            }
          );
          if (!result) return;
          const postgres = result.postgres || null;
          const mysql = result.mysql || null;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 数据库规格已返回'));
          } else {
            emitCommandResult({
              mode,
              allZones: queryOptions.allZones,
              zoneId: queryOptions.zoneId || null,
              postgres: postgres ? {
                ...postgres,
                matchedZoneIds: postgres.zones.map((zone) => zone.zoneId),
                totalCount: postgres.classes.length,
                shownCount: Math.min(limit, postgres.classes.length),
                truncated: postgres.classes.length > limit,
                classes: postgres.classes.slice(0, limit),
                zones: postgres.zones.map((zone) => ({
                  ...zone,
                  shownCount: Math.min(limit, zone.classes.length),
                  truncated: zone.classes.length > limit,
                  classes: zone.classes.slice(0, limit)
                }))
              } : null,
              mysql: mysql ? {
                ...mysql,
                matchedZoneIds: mysql.zones.map((zone) => zone.zoneId),
                totalCount: mysql.classes.length,
                shownCount: Math.min(limit, mysql.classes.length),
                truncated: mysql.classes.length > limit,
                classes: mysql.classes.slice(0, limit),
                zones: mysql.zones.map((zone) => ({
                  ...zone,
                  shownCount: Math.min(limit, zone.classes.length),
                  truncated: zone.classes.length > limit,
                  classes: zone.classes.slice(0, limit)
                }))
              } : null
            });
            return;
          }
          if (postgres) {
            printDatabaseClassCatalog('PostgreSQL', postgres, limit);
          }
          if (postgres && mysql) console.log('');
          if (mysql) {
            printDatabaseClassCatalog('MySQL', mysql, limit);
          }
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dbInfoCommand)
    .action(async (instanceId: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const s = createSpinner();
          const detail = await withSpinner(
            s,
            `正在拉取实例 ${normalizedId} 详情...`,
            '❌ 获取数据库实例详情失败',
            () => getDatabaseInstanceDetail(normalizedId)
          );
          if (!detail) return;
          const summary = detail.summary;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 获取成功'));
          } else {
            emitCommandResult({
              instanceId: normalizedId,
              detail
            });
            return;
          }
          console.log(`\ninstanceId: ${pc.cyan(summary.instanceId)}`);
          console.log(`engine:     ${pc.cyan(`${summary.engine || '-'} ${summary.engineVersion || ''}`.trim())}`);
          console.log(`status:     ${pc.cyan(summary.status || '-')}`);
          console.log(`class:      ${pc.cyan(summary.instanceClass || '-')}`);
          console.log(`payType:    ${pc.cyan(summary.payType || '-')}`);
          console.log(`vpc/vsw:    ${pc.cyan(`${summary.vpcId || '-'} / ${summary.vSwitchId || '-'}`)}`);
          console.log(`zone:       ${pc.cyan(summary.zoneId || '-')}`);
          if (detail.endpoints.length > 0) {
            console.log(`endpoints:  ${pc.cyan(detail.endpoints.map((item) => `${item.ipType || item.type || '-'}:${item.host || '-'}:${item.port || '-'}`).join(', '))}`);
          }
          if (detail.databases.length > 0) console.log(`databases:  ${pc.cyan(detail.databases.join(', '))}`);
          if (detail.accounts.length > 0) console.log(`accounts:   ${pc.cyan(detail.accounts.join(', '))}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dbConnectCommand)
    .action(async (instanceId: string | undefined) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbConnectCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toOptionalString(instanceId);
          const s = createSpinner();
          const info = await withSpinner(
            s,
            '正在解析数据库连接信息...',
            '❌ 连接信息解析失败',
            () => resolveDatabaseConnectInfo(normalizedId)
          );
          if (!info) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 连接信息已生成'));
          } else {
            emitCommandResult({
              instanceId: info.instanceId,
              connection: info
            });
            return;
          }
          console.log(`\ninstanceId: ${pc.cyan(info.instanceId)}`);
          console.log(`engine:     ${pc.cyan(info.engine)}`);
          console.log(`host:       ${pc.cyan(info.host)}`);
          console.log(`port:       ${pc.cyan(String(info.port))}`);
          console.log(`database:   ${pc.cyan(info.database)}`);
          console.log(`username:   ${pc.cyan(info.username)}`);
          console.log(`password:   ${pc.cyan(info.passwordKnown ? '<known in project>' : '<unknown, please provide manually>')}`);
          console.log(`url:        ${pc.cyan(info.connectionString)}`);
          if (info.publicHost) {
            console.log('');
            console.log(pc.yellow('── 公网访问 ──'));
            console.log(`public host: ${pc.cyan(info.publicHost)}`);
            console.log(`public port: ${pc.cyan(String(info.publicPort))}`);
            console.log(`public url:  ${pc.cyan(info.publicConnectionString!)}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dbPublicAccessCommand)
    .action(async (instanceId: string | undefined, options: { ip?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbPublicAccessCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          const { resolvePublicIp } = await import('../utils/public-ip');
          showIntro(pc.bgMagenta(pc.white(' 🌐 DB Public Access ')));
          ensureAuthOrExit();
          const resolvedId = toOptionalString(instanceId);
          const s = createSpinner();

          s.start('正在获取公网 IP...');
          const publicIp = options.ip?.trim() || await resolvePublicIp();
          s.stop(`公网 IP: ${pc.cyan(publicIp)}`);

          const info = await withSpinner(
            s,
            '正在解析数据库连接信息...',
            '❌ 连接信息解析失败',
            () => resolveDatabaseConnectInfo(resolvedId)
          );
          if (!info) return;

          await withSpinner(
            s,
            `正在将 ${publicIp}/32 添加到白名单 (licell_public)...`,
            '❌ 白名单设置失败',
            () => applyDbPublicWhitelist(info.instanceId, publicIp, s)
          );

          const pub = await withSpinner(
            s,
            '正在开通公网访问...',
            '❌ 公网访问开通失败',
            () => allocateDbPublicConnection(info.instanceId, s)
          );

          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 公网访问已开通'));
          } else {
            emitCommandResult({
              instanceId: info.instanceId,
              publicIp,
              publicHost: pub?.host || null,
              publicPort: pub?.port || null
            });
            return;
          }

          console.log('');
          console.log(pc.yellow('── 内网访问 ──'));
          console.log(`host: ${pc.cyan(info.host)}`);
          console.log(`port: ${pc.cyan(String(info.port))}`);
          console.log(`url:  ${pc.cyan(info.connectionString)}`);
          if (pub) {
            console.log('');
            console.log(pc.yellow('── 公网访问 ──'));
            console.log(`host: ${pc.cyan(pub.host)}`);
            console.log(`port: ${pc.cyan(pub.port)}`);
            const protocol = info.engine;
            const renderedUser = info.username === '<username>' ? info.username : encodeURIComponent(info.username);
            const renderedPassword = info.passwordKnown ? '<password>' : '<password>';
            console.log(`url:  ${pc.cyan(`${protocol}://${renderedUser}:${renderedPassword}@${pub.host}:${pub.port}/${info.database}`)}`);
          } else {
            console.log(pc.yellow('\n⚠️ 公网地址尚未就绪，请稍后通过 db connect 查看'));
          }
          console.log(`\n白名单 IP: ${pc.cyan(`${publicIp}/32`)} (分组: licell_public)`);
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, dbRmCommand)
    .action(async (instanceId: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(dbRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['rds']
        },
        async () => {
          showIntro(pc.bgRed(pc.white(' 🗑️ Delete Database ')));
          ensureAuthOrExit();
          const id = instanceId.trim();
          if (!id) throw new Error('请提供 instanceId');

          if (!options.yes && isInteractiveTTY()) {
            const ok = await confirm({ message: `确认删除数据库实例 ${pc.red(id)}？此操作不可恢复。` });
            if (isCancel(ok) || !ok) {
              showOutro('已取消');
              return;
            }
          }

          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在删除实例 ${id}...`,
            '❌ 删除失败',
            async () => {
              await deleteDatabaseInstance(id);
              clearProjectDatabaseBinding(id);
              return { instanceId: id };
            }
          );
          if (!result) return;

          if (isJsonOutput()) {
            emitCommandResult(result);
            return;
          }
          s.stop(pc.green(`✅ 实例 ${id} 已删除`));
          showOutro('Done.');
        }
      );
    });
}

export const dbCommandModule = defineCommandModule({
  section: DATA_SECTION,
  register: registerDbCommands,
  namespaces: {
    db: {
      summary: 'RDS 数据库实例的创建、查看、连接、公网访问与删除。',
      notes: ['公网访问与删除属于高影响操作，自动化执行前应先确认。'],
      examples: ['licell db list', 'licell db info <instanceId>', 'licell db connect <instanceId> --output json'],
      agentTips: ['优先从 `licell db list --output json` 获取实例，再执行 connect / public-access / rm。']
    }
  },
  commands: [dbAddCommand, dbClassCommand, dbListCommand, dbInfoCommand, dbConnectCommand, dbPublicAccessCommand, dbRmCommand]
});
