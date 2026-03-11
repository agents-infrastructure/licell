import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import { select, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { maskConnectionString } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  getCacheInstanceDetail,
  listCacheInstances,
  provisionRedis,
  resolveCacheConnectInfo,
  rotateRedisPassword,
  deleteCacheInstance,
  allocateCachePublicConnection,
  applyCachePublicWhitelist
} from '../providers/redis';
import {
  ensureAuthOrExit,
  createSpinner,
  isInteractiveTTY,
  showIntro,
  showOutro,
  toPromptValue,
  toOptionalString,
  parseListLimit,
  parseOptionalPositiveInt,
  withSpinner
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { DATA_SECTION } from './sections';

const cacheAddOptions = [
  { rawName: '--type <type>', description: '缓存类型：redis（CI 场景建议显式传入）' },
  { rawName: '--instance <instanceId>', description: '绑定已有实例 ID（tt-/tk-/r-），传入后跳过创建' },
  { rawName: '--password <password>', description: '绑定已有实例时的访问密码（不传则尝试自动轮换）' },
  { rawName: '--username <accountName>', description: '绑定已有实例时指定账号名（可选）' },
  { rawName: '--engine-version <version>', description: '旧版 Redis 参数（Tair Serverless KV 模式下不支持）' },
  { rawName: '--class <instanceClass>', description: 'Tair Serverless KV 规格（如 kvcache.cu.g4b.2）' },
  { rawName: '--node-type <type>', description: '旧版 Redis 参数（Tair Serverless KV 模式下不支持）' },
  { rawName: '--capacity <mb>', description: '旧版 Redis 参数（Tair Serverless KV 模式下不支持）' },
  { rawName: '--vk-name <vkName>', description: 'Tair KV 回退模式使用的 vkName（tk- 开头，不传则自动探测）' },
  { rawName: '--compute-unit <n>', description: 'Tair Serverless KV 计算单元（当前仅支持 1）' },
  { rawName: '--zone <zoneId>', description: '可用区（如 cn-hangzhou-b）' },
  { rawName: '--vpc <vpcId>', description: '指定 VPC ID' },
  { rawName: '--vsw <vSwitchId>', description: '指定 VSwitch ID' },
  { rawName: '--security-ip-list <cidrs>', description: '白名单 CIDR（逗号分隔）' }
] as const;

const cacheAddCommand = defineCliCommand({
  rawName: 'cache add',
  description: '分配 Redis 缓存',
  options: cacheAddOptions
});

const cacheListCommand = defineCliCommand({
  rawName: 'cache list',
  description: '查看缓存实例列表',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 20' }
  ]
});

const cacheInfoCommand = defineCliCommand({
  rawName: 'cache info <instanceId>',
  description: '查看缓存实例详情'
});

const cacheConnectCommand = defineCliCommand({
  rawName: 'cache connect [instanceId]',
  description: '输出缓存连接信息'
});

const cacheRotatePasswordCommand = defineCliCommand({
  rawName: 'cache rotate-password',
  description: '轮换 Redis 密码',
  options: [
    { rawName: '--instance <instanceId>', description: '指定 Redis 实例 ID，不传则使用当前项目绑定实例' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会轮换 Redis 密码，现有连接配置可能立即失效。'
    }
  }
});

const cachePublicAccessCommand = defineCliCommand({
  rawName: 'cache public-access [instanceId]',
  description: '开通 Redis 公网访问并添加当前 IP 到白名单',
  options: [
    { rawName: '--ip <ip>', description: '手动指定公网 IP（不传则自动获取）' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会开启缓存公网访问并修改白名单。'
    }
  }
});

const cacheRmCommand = defineCliCommand({
  rawName: 'cache rm <instanceId>',
  description: '删除缓存实例',
  options: [
    { rawName: '--yes', description: '跳过确认' }
  ],
  descriptor: {
    safety: {
      level: 'destructive',
      reason: '会删除缓存实例，请确认实例 ID。'
    }
  }
});

export function registerCacheCommands(cli: CAC) {
  registerCliCommand(cli, cacheAddCommand)
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
          commandLabel: commandInvocation(cacheAddCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis', 'vpc']
        },
        async () => {
          showIntro(pc.bgGreen(pc.black(' 🧠 Cache Provisioning (Redis) ')));
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

          const s = createSpinner();
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
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ Redis 缓存已就绪并绑定到本工程内网！'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              type,
              connectionStringMasked: maskConnectionString(redisUrl)
            });
            return;
          }
          console.log(`\n🔑 缓存连接串已生成: ${pc.cyan(maskConnectionString(redisUrl))}\n`);
          showOutro('下次执行 licell deploy 时，将自动作为 process.env.REDIS_URL 注入！');
        }
      );
    });

  registerCliCommand(cli, cacheListCommand)
    .action(async (options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cacheListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);
          const s = createSpinner();
          const instances = await withSpinner(
            s,
            '正在拉取缓存实例列表...',
            '❌ 获取缓存实例列表失败',
            () => listCacheInstances(limit)
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
            showOutro('当前地域没有缓存实例');
            return;
          }
          for (const item of instances) {
            console.log(
              `${pc.cyan(item.instanceId)}  mode=${pc.gray(item.mode)}  status=${pc.gray(item.status || '-')}  class=${pc.gray(item.instanceClass || '-')}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, cacheInfoCommand)
    .action(async (instanceId: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cacheInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const s = createSpinner();
          const detail = await withSpinner(
            s,
            `正在拉取实例 ${normalizedId} 详情...`,
            '❌ 获取缓存实例详情失败',
            () => getCacheInstanceDetail(normalizedId)
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
          console.log(`mode:       ${pc.cyan(summary.mode)}`);
          console.log(`status:     ${pc.cyan(summary.status || '-')}`);
          console.log(`class:      ${pc.cyan(summary.instanceClass || '-')}`);
          if (summary.engineVersion) console.log(`engine:     ${pc.cyan(summary.engineVersion)}`);
          if (summary.host) console.log(`endpoint:   ${pc.cyan(`${summary.host}:${summary.port || 6379}`)}`);
          console.log(`network:    ${pc.cyan(`${summary.vpcId || '-'} / ${summary.vSwitchId || '-'} / ${summary.zoneId || '-'}`)}`);
          if (detail.accountNames.length > 0) console.log(`accounts:   ${pc.cyan(detail.accountNames.join(', '))}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, cacheConnectCommand)
    .action(async (instanceId: string | undefined) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cacheConnectCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toOptionalString(instanceId);
          const s = createSpinner();
          const info = await withSpinner(
            s,
            '正在解析缓存连接信息...',
            '❌ 连接信息解析失败',
            () => resolveCacheConnectInfo(normalizedId)
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
          console.log(`mode:       ${pc.cyan(info.mode)}`);
          console.log(`host:       ${pc.cyan(info.host)}`);
          console.log(`port:       ${pc.cyan(String(info.port))}`);
          console.log(`username:   ${pc.cyan(info.username || '<none>')}`);
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

  registerCliCommand(cli, cacheRotatePasswordCommand)
    .action(async (options: { instance?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cacheRotatePasswordCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          showIntro(pc.bgGreen(pc.black(' 🔐 Rotate Redis Password ')));
          ensureAuthOrExit();
          const instanceId = options.instance ? toPromptValue(options.instance, '实例 ID') : undefined;

          const s = createSpinner();
          const redisUrl = await withSpinner(
            s,
            '正在执行 Redis 密钥轮换...',
            '❌ Redis 密钥轮换失败',
            () => rotateRedisPassword(s, instanceId)
          );
          if (!redisUrl) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ Redis 密钥轮换完成'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              instanceId: instanceId || null,
              connectionStringMasked: maskConnectionString(redisUrl)
            });
            return;
          }
          console.log(`\n🔑 新连接串: ${pc.cyan(maskConnectionString(redisUrl))}\n`);
          showOutro('已同步更新 .licell/project.json 的 REDIS_* 环境变量');
        }
      );
    });

  registerCliCommand(cli, cachePublicAccessCommand)
    .action(async (instanceId: string | undefined, options: { ip?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cachePublicAccessCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          const { resolvePublicIp } = await import('../utils/public-ip');
          showIntro(pc.bgGreen(pc.black(' 🌐 Cache Public Access ')));
          ensureAuthOrExit();
          const resolvedId = toOptionalString(instanceId);
          const s = createSpinner();

          s.start('正在获取公网 IP...');
          const publicIp = options.ip?.trim() || await resolvePublicIp();
          s.stop(`公网 IP: ${pc.cyan(publicIp)}`);

          const info = await withSpinner(
            s,
            '正在解析缓存连接信息...',
            '❌ 连接信息解析失败',
            () => resolveCacheConnectInfo(resolvedId)
          );
          if (!info) return;

          await withSpinner(
            s,
            `正在将 ${publicIp}/32 添加到白名单 (licell_public)...`,
            '❌ 白名单设置失败',
            () => applyCachePublicWhitelist(info.instanceId, publicIp, s)
          );

          const pub = await withSpinner(
            s,
            '正在开通公网访问...',
            '❌ 公网访问开通失败',
            () => allocateCachePublicConnection(info.instanceId, s)
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
            console.log(`port: ${pc.cyan(String(pub.port))}`);
            const password = info.passwordKnown ? '<password>' : '<password>';
            const userPart = info.username ? `${info.username}:${password}@` : '';
            console.log(`url:  ${pc.cyan(`redis://${userPart}${pub.host}:${pub.port}`)}`);
          } else {
            console.log(pc.yellow('\n⚠️ 公网地址尚未就绪，请稍后通过 cache connect 查看'));
          }
          console.log(`\n白名单 IP: ${pc.cyan(`${publicIp}/32`)} (分组: licell_public)`);
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, cacheRmCommand)
    .action(async (instanceId: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cacheRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          showIntro(pc.bgRed(pc.white(' 🗑️ Delete Cache ')));
          ensureAuthOrExit();
          const id = instanceId.trim();
          if (!id) throw new Error('请提供 instanceId');

          if (!options.yes && isInteractiveTTY()) {
            const ok = await confirm({ message: `确认删除缓存实例 ${pc.red(id)}？此操作不可恢复。` });
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
            () => deleteCacheInstance(id)
          );

          if (isJsonOutput()) {
            emitCommandResult({ instanceId: id });
            return;
          }
          showOutro(`实例 ${id} 已删除`);
        }
      );
    });
}

export const cacheCommandModule = defineCommandModule({
  section: DATA_SECTION,
  register: registerCacheCommands,
  namespaces: {
    cache: {
      summary: 'Redis 缓存实例的创建、查看、连接、密码轮换、公网访问与删除。',
      examples: ['licell cache list', 'licell cache connect <instanceId>', 'licell cache rotate-password --output json'],
      agentTips: ['执行公网访问、密码轮换、删除前，先向用户确认影响面。']
    }
  },
  commands: [
    cacheAddCommand,
    cacheListCommand,
    cacheInfoCommand,
    cacheConnectCommand,
    cacheRotatePasswordCommand,
    cachePublicAccessCommand,
    cacheRmCommand
  ]
});
