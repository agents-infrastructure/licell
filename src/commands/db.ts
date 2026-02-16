import type { CAC } from 'cac';
import { intro, outro, spinner, select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { maskConnectionString } from '../utils/cli-helpers';
import {
  getDatabaseInstanceDetail,
  listDatabaseInstances,
  provisionDatabase,
  resolveDatabaseConnectInfo
} from '../providers/infra';
import {
  ensureAuthOrExit,
  isInteractiveTTY,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  normalizeDbType,
  parseOptionalNumber,
  parseOptionalPositiveInt,
  normalizeAutoPause,
  withSpinner
} from '../utils/cli-shared';

export function registerDbCommands(cli: CAC) {
  cli.command('db add', '分配 Serverless 数据库')
    .option('--type <type>', '数据库类型：postgres 或 mysql（CI 场景建议显式传入）')
    .option('--engine-version <version>', '数据库引擎版本（postgres 默认 18.0，mysql 默认 8.0）')
    .option('--category <category>', 'RDS Category（默认 serverless_basic）')
    .option('--class <instanceClass>', '实例规格（如 pg.n2.serverless.1c）')
    .option('--storage <gb>', '存储空间 GB（默认 20）')
    .option('--storage-type <storageType>', '存储类型（默认 cloud_essd）')
    .option('--min-rcu <n>', 'Serverless 最小 RCU（如 0.5）')
    .option('--max-rcu <n>', 'Serverless 最大 RCU（如 8）')
    .option('--auto-pause <mode>', '自动启停：on/off')
    .option('--zone <zoneId>', '主可用区（如 cn-hangzhou-b）')
    .option('--zone-slave1 <zoneId>', '备可用区 1（多可用区部署）')
    .option('--zone-slave2 <zoneId>', '备可用区 2（多可用区部署）')
    .option('--vpc <vpcId>', '指定 VPC ID')
    .option('--vsw <vSwitchId>', '指定 VSwitch ID')
    .option('--security-ip-list <cidrs>', '白名单 CIDR（逗号分隔）')
    .option('--description <text>', '实例描述')
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
    intro(pc.bgMagenta(pc.white(' 🗄️ Database Provisioning (IaC) ')));
    ensureAuthOrExit();
    const interactiveTTY = isInteractiveTTY();
    let type: 'postgres' | 'mysql';
    const dbTypeOption = toOptionalString(options.type);
    if (dbTypeOption) {
      type = normalizeDbType(dbTypeOption);
    } else if (interactiveTTY) {
      const selected = await select({ message: '选择数据库引擎:', options: [
        { value: 'postgres', label: '🐘 RDS Serverless PostgreSQL' },
        { value: 'mysql', label: '🐬 RDS Serverless MySQL' }
      ]});
      if (isCancel(selected)) process.exit(0);
      if (selected !== 'postgres' && selected !== 'mysql') throw new Error('未知数据库类型');
      type = selected;
    } else {
      throw new Error('非交互模式下请传入 --type postgres|mysql');
    }

    const storageGb = parseOptionalPositiveInt(options.storage, 'storage');
    const minCapacity = parseOptionalNumber(options.minRcu, 'min-rcu');
    const maxCapacity = parseOptionalNumber(options.maxRcu, 'max-rcu');
    if (typeof minCapacity === 'number' && minCapacity <= 0) throw new Error('min-rcu 必须大于 0');
    if (typeof maxCapacity === 'number' && maxCapacity <= 0) throw new Error('max-rcu 必须大于 0');
    if (typeof minCapacity === 'number' && typeof maxCapacity === 'number' && minCapacity > maxCapacity) {
      throw new Error('min-rcu 不能大于 max-rcu');
    }
    const autoPause = toOptionalString(options.autoPause) ? normalizeAutoPause(options.autoPause) : undefined;

    const s = spinner();
    const dbUrl = await withSpinner(
      s,
      '正在初始化基础设施编排引擎...',
      '❌ 拉起失败',
      () => provisionDatabase(type, s, {
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
    s.stop(pc.green('✅ 数据库实例已就绪并绑定到本工程内网！'));
    console.log(`\n🔑 内网直连凭证已生成: ${pc.cyan(maskConnectionString(dbUrl))}\n`);
    outro(`下次执行 licell deploy 时，将自动作为 process.env.DATABASE_URL 注入！`);
  });

  cli.command('db list', '查看数据库实例列表')
    .option('--limit <n>', '返回数量，默认 20')
    .action(async (options: { limit?: unknown }) => {
      ensureAuthOrExit();
      const limit = parseListLimit(options.limit, 20, 200);

      const s = spinner();
      const instances = await withSpinner(
        s,
        '正在拉取数据库实例列表...',
        '❌ 获取数据库实例列表失败',
        () => listDatabaseInstances(limit)
      );
      if (!instances) return;
      s.stop(pc.green(`✅ 共获取 ${instances.length} 个实例`));
      if (instances.length === 0) {
        outro('当前地域没有数据库实例');
        return;
      }
      for (const item of instances) {
        console.log(
          `${pc.cyan(item.instanceId)}  engine=${pc.gray(`${item.engine || '-'} ${item.engineVersion || ''}`.trim())}  status=${pc.gray(item.status || '-')}  class=${pc.gray(item.instanceClass || '-')}`
        );
      }
      console.log('');
      outro('Done.');
    });

  cli.command('db info <instanceId>', '查看数据库实例详情')
    .action(async (instanceId: string) => {
      ensureAuthOrExit();
      const normalizedId = toPromptValue(instanceId, 'instanceId');
      const s = spinner();
      const detail = await withSpinner(
        s,
        `正在拉取实例 ${normalizedId} 详情...`,
        '❌ 获取数据库实例详情失败',
        () => getDatabaseInstanceDetail(normalizedId)
      );
      if (!detail) return;
      const summary = detail.summary;
      s.stop(pc.green('✅ 获取成功'));
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
      outro('Done.');
    });

  cli.command('db connect [instanceId]', '输出数据库连接信息')
    .action(async (instanceId: string | undefined) => {
      ensureAuthOrExit();
      const normalizedId = toOptionalString(instanceId);
      const s = spinner();
      const info = await withSpinner(
        s,
        '正在解析数据库连接信息...',
        '❌ 连接信息解析失败',
        () => resolveDatabaseConnectInfo(normalizedId)
      );
      if (!info) return;
      s.stop(pc.green('✅ 连接信息已生成'));
      console.log(`\ninstanceId: ${pc.cyan(info.instanceId)}`);
      console.log(`engine:     ${pc.cyan(info.engine)}`);
      console.log(`host:       ${pc.cyan(info.host)}`);
      console.log(`port:       ${pc.cyan(String(info.port))}`);
      console.log(`database:   ${pc.cyan(info.database)}`);
      console.log(`username:   ${pc.cyan(info.username)}`);
      console.log(`password:   ${pc.cyan(info.passwordKnown ? '<known in project>' : '<unknown, please provide manually>')}`);
      console.log(`url:        ${pc.cyan(info.connectionString)}`);
      console.log('');
      outro('Done.');
    });
}
