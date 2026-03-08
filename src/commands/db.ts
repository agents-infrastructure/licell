import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import { select, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { maskConnectionString } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  getDatabaseInstanceDetail,
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
import { emitCliResult, isJsonOutput } from '../utils/output';
import { DATA_SECTION } from './sections';

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
            emitCliResult({
              stage: 'db.add',
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
            emitCliResult({
              stage: 'db.list',
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
            emitCliResult({
              stage: 'db.info',
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
            emitCliResult({
              stage: 'db.connect',
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
            emitCliResult({
              stage: 'db.public-access',
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
          await withSpinner(
            s,
            `正在删除实例 ${id}...`,
            '❌ 删除失败',
            () => deleteDatabaseInstance(id)
          );

          if (isJsonOutput()) {
            emitCliResult({ stage: 'db.rm', instanceId: id });
            return;
          }
          showOutro(`实例 ${id} 已删除`);
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
  commands: [dbAddCommand, dbListCommand, dbInfoCommand, dbConnectCommand, dbPublicAccessCommand, dbRmCommand]
});
