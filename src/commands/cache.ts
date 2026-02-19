import type { CAC } from 'cac';
import { intro, outro, spinner, select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { maskConnectionString } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  getCacheInstanceDetail,
  listCacheInstances,
  provisionRedis,
  resolveCacheConnectInfo,
  rotateRedisPassword
} from '../providers/redis';
import {
  ensureAuthOrExit,
  isInteractiveTTY,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  parseOptionalPositiveInt,
  withSpinner
} from '../utils/cli-shared';

export function registerCacheCommands(cli: CAC) {
  cli.command('cache add', '分配 Redis 缓存')
    .option('--type <type>', '缓存类型：redis（CI 场景建议显式传入）')
    .option('--instance <instanceId>', '绑定已有实例 ID（tt-/tk-/r-），传入后跳过创建')
    .option('--password <password>', '绑定已有实例时的访问密码（不传则尝试自动轮换）')
    .option('--username <accountName>', '绑定已有实例时指定账号名（可选）')
    .option('--engine-version <version>', '旧版 Redis 参数（Tair Serverless KV 模式下不支持）')
    .option('--class <instanceClass>', 'Tair Serverless KV 规格（如 kvcache.cu.g4b.2）')
    .option('--node-type <type>', '旧版 Redis 参数（Tair Serverless KV 模式下不支持）')
    .option('--capacity <mb>', '旧版 Redis 参数（Tair Serverless KV 模式下不支持）')
    .option('--vk-name <vkName>', 'Tair KV 回退模式使用的 vkName（tk- 开头，不传则自动探测）')
    .option('--compute-unit <n>', 'Tair Serverless KV 计算单元（当前仅支持 1）')
    .option('--zone <zoneId>', '可用区（如 cn-hangzhou-b）')
    .option('--vpc <vpcId>', '指定 VPC ID')
    .option('--vsw <vSwitchId>', '指定 VSwitch ID')
    .option('--security-ip-list <cidrs>', '白名单 CIDR（逗号分隔）')
    .action(async (options: {
      type?: unknown;
      instance?: unknown;
      password?: unknown;
      username?: unknown;
      engineVersion?: unknown;
      class?: unknown;
      nodeType?: unknown;
      capacity?: unknown;
      vkName?: unknown;
      computeUnit?: unknown;
      zone?: unknown;
      vpc?: unknown;
      vsw?: unknown;
      securityIpList?: unknown;
    }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell cache add',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis', 'vpc']
        },
        async () => {
          intro(pc.bgGreen(pc.black(' 🧠 Cache Provisioning (Redis) ')));
          ensureAuthOrExit();
          const interactiveTTY = isInteractiveTTY();
          let type = toOptionalString(options.type)?.toLowerCase();
          if (!type) {
            if (!interactiveTTY) throw new Error('非交互模式下请传入 --type redis');
            const selected = await select({
              message: '选择缓存引擎:',
              options: [{ value: 'redis', label: '🟥 Tair/Redis (VPC 内网)' }]
            });
            if (isCancel(selected)) process.exit(0);
            type = toPromptValue(selected, '缓存类型').toLowerCase();
          }
          if (type !== 'redis') throw new Error('--type 目前仅支持 redis');

          const capacityMb = parseOptionalPositiveInt(options.capacity, 'capacity');
          const computeUnitNum = parseOptionalPositiveInt(options.computeUnit, 'compute-unit');

          const s = spinner();
          const redisUrl = await withSpinner(
            s,
            '正在初始化缓存资源编排...',
            '❌ 缓存拉起失败',
            () => provisionRedis(s, {
              instanceId: toOptionalString(options.instance),
              existingPassword: toOptionalString(options.password),
              accountName: toOptionalString(options.username),
              engineVersion: toOptionalString(options.engineVersion),
              instanceClass: toOptionalString(options.class),
              nodeType: toOptionalString(options.nodeType),
              capacityMb,
              vkName: toOptionalString(options.vkName),
              computeUnitNum,
              zoneId: toOptionalString(options.zone),
              vpcId: toOptionalString(options.vpc),
              vSwitchId: toOptionalString(options.vsw),
              securityIpList: toOptionalString(options.securityIpList)
            })
          );
          if (!redisUrl) return;
          s.stop(pc.green('✅ Redis 缓存已就绪并绑定到本工程内网！'));
          console.log(`\n🔑 缓存连接串已生成: ${pc.cyan(maskConnectionString(redisUrl))}\n`);
          outro('下次执行 licell deploy 时，将自动作为 process.env.REDIS_URL 注入！');
        }
      );
  });

  cli.command('cache list', '查看缓存实例列表')
    .option('--limit <n>', '返回数量，默认 20')
    .action(async (options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell cache list',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);
          const s = spinner();
          const instances = await withSpinner(
            s,
            '正在拉取缓存实例列表...',
            '❌ 获取缓存实例列表失败',
            () => listCacheInstances(limit)
          );
          if (!instances) return;
          s.stop(pc.green(`✅ 共获取 ${instances.length} 个实例`));
          if (instances.length === 0) {
            outro('当前地域没有缓存实例');
            return;
          }
          for (const item of instances) {
            console.log(
              `${pc.cyan(item.instanceId)}  mode=${pc.gray(item.mode)}  status=${pc.gray(item.status || '-')}  class=${pc.gray(item.instanceClass || '-')}`
            );
          }
          console.log('');
          outro('Done.');
        }
      );
    });

  cli.command('cache info <instanceId>', '查看缓存实例详情')
    .action(async (instanceId: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell cache info',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const s = spinner();
          const detail = await withSpinner(
            s,
            `正在拉取实例 ${normalizedId} 详情...`,
            '❌ 获取缓存实例详情失败',
            () => getCacheInstanceDetail(normalizedId)
          );
          if (!detail) return;
          const summary = detail.summary;
          s.stop(pc.green('✅ 获取成功'));
          console.log(`\ninstanceId: ${pc.cyan(summary.instanceId)}`);
          console.log(`mode:       ${pc.cyan(summary.mode)}`);
          console.log(`status:     ${pc.cyan(summary.status || '-')}`);
          console.log(`class:      ${pc.cyan(summary.instanceClass || '-')}`);
          if (summary.engineVersion) console.log(`engine:     ${pc.cyan(summary.engineVersion)}`);
          if (summary.host) console.log(`endpoint:   ${pc.cyan(`${summary.host}:${summary.port || 6379}`)}`);
          console.log(`network:    ${pc.cyan(`${summary.vpcId || '-'} / ${summary.vSwitchId || '-'} / ${summary.zoneId || '-'}`)}`);
          if (detail.accountNames.length > 0) console.log(`accounts:   ${pc.cyan(detail.accountNames.join(', '))}`);
          console.log('');
          outro('Done.');
        }
      );
    });

  cli.command('cache connect [instanceId]', '输出缓存连接信息')
    .action(async (instanceId: string | undefined) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell cache connect',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toOptionalString(instanceId);
          const s = spinner();
          const info = await withSpinner(
            s,
            '正在解析缓存连接信息...',
            '❌ 连接信息解析失败',
            () => resolveCacheConnectInfo(normalizedId)
          );
          if (!info) return;
          s.stop(pc.green('✅ 连接信息已生成'));
          console.log(`\ninstanceId: ${pc.cyan(info.instanceId)}`);
          console.log(`mode:       ${pc.cyan(info.mode)}`);
          console.log(`host:       ${pc.cyan(info.host)}`);
          console.log(`port:       ${pc.cyan(String(info.port))}`);
          console.log(`username:   ${pc.cyan(info.username || '<none>')}`);
          console.log(`password:   ${pc.cyan(info.passwordKnown ? '<known in project>' : '<unknown, please provide manually>')}`);
          console.log(`url:        ${pc.cyan(info.connectionString)}`);
          console.log('');
          outro('Done.');
        }
      );
    });

  cli.command('cache rotate-password', '轮换 Redis 密码')
    .option('--instance <instanceId>', '指定 Redis 实例 ID，不传则使用当前项目绑定实例')
    .action(async (options: { instance?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell cache rotate-password',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          intro(pc.bgGreen(pc.black(' 🔐 Rotate Redis Password ')));
          ensureAuthOrExit();
          const instanceId = options.instance ? toPromptValue(options.instance, '实例 ID') : undefined;

          const s = spinner();
          const redisUrl = await withSpinner(
            s,
            '正在执行 Redis 密钥轮换...',
            '❌ Redis 密钥轮换失败',
            () => rotateRedisPassword(s, instanceId)
          );
          if (!redisUrl) return;
          s.stop(pc.green('✅ Redis 密钥轮换完成'));
          console.log(`\n🔑 新连接串: ${pc.cyan(maskConnectionString(redisUrl))}\n`);
          outro('已同步更新 .licell/project.json 的 REDIS_* 环境变量');
        }
      );
    });
}
