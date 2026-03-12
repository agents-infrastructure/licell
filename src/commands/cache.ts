import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import { confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { maskConnectionString } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { Config } from '../utils/config';
import {
  getCacheInstanceDetail,
  listCacheClasses,
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

const CACHE_PROJECT_ENV_KEYS = ['REDIS_URL', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD', 'REDIS_USERNAME'] as const;

const cacheAddOptions = [
  { rawName: '--type <type>', description: '缓存类型：redis（CI 场景建议显式传入）' },
  { rawName: '--mode <mode>', description: '创建模式：classic 或 serverless（默认 classic）' },
  { rawName: '--instance <instanceId>', description: '绑定已有实例 ID（tt-/tk-/r-），传入后跳过创建' },
  { rawName: '--password <password>', description: '绑定已有实例时的访问密码（不传则尝试自动轮换）' },
  { rawName: '--username <accountName>', description: '绑定已有实例时指定账号名（可选）' },
  { rawName: '--engine-version <version>', description: '兼容保留参数，当前 cache add 暂未支持' },
  { rawName: '--class <instanceClass>', description: '实例规格：classic 如 redis.master.small.default；serverless 如 kvcache.cu.g4b.2' },
  { rawName: '--node-type <type>', description: '兼容保留参数，当前 cache add 暂未支持' },
  { rawName: '--capacity <mb>', description: '兼容保留参数，当前 cache add 暂未支持' },
  { rawName: '--vk-name <vkName>', description: '仅 serverless 模式使用：指定已有虚拟集群 vkName（tk- 开头）' },
  { rawName: '--compute-unit <n>', description: '仅 serverless 模式使用：计算单元（当前仅支持 1）' },
  { rawName: '--zone <zoneId>', description: '可用区（如 cn-hangzhou-b）' },
  { rawName: '--vpc <vpcId>', description: '指定 VPC ID' },
  { rawName: '--vsw <vSwitchId>', description: '指定 VSwitch ID' },
  { rawName: '--security-ip-list <cidrs>', description: '白名单 CIDR（逗号分隔）' }
] as const;

const cacheAddCommand = defineCliCommand({
  rawName: 'cache add',
  description: '分配 Redis 缓存',
  options: cacheAddOptions,
  descriptor: {
    title: 'Provision Redis cache',
    notes: [
      '`--mode` 默认为 `classic`，因此裸执行 `licell cache add` 会创建 classic Redis。',
      '显式使用 `--mode serverless` 时，只会尝试 Tair Serverless KV；若当前地域不可用会直接失败，不会自动降级。',
      '绑定已有实例时，如未传 `--mode`，会按实例 ID 前缀自动识别。'
    ],
    examples: [
      'licell cache add --mode classic',
      'licell cache add --mode serverless --class kvcache.cu.g4b.2',
      'licell cache add --instance r-xxxx --password <password>',
      'licell cache class --output json'
    ],
    related: ['cache class', 'cache list', 'cache connect'],
    optionInsights: {
      '--mode': {
        whenToUse: '需要明确创建 classic Redis 或 Tair Serverless KV 时使用。',
        cautions: ['`serverless` 模式失败后不会自动降级到 classic。']
      },
      '--class': {
        whenToUse: '希望显式指定实例规格时使用。'
      },
      '--vk-name': {
        whenToUse: 'serverless 模式下，需要绑定指定虚拟集群时使用。'
      },
      '--compute-unit': {
        whenToUse: 'serverless 模式下，显式设置计算单元时使用。',
        cautions: ['当前仅支持 `1`。']
      }
    },
    recommendedFlow: [
      { title: '先查规格', command: 'licell cache class --output json', reason: '确认当前地域的 classic 可售规格与已观测的 serverless 规格。' },
      { title: '再创建实例', command: 'licell cache add --mode <classic|serverless> --output json', reason: '按明确模式申请资源，避免拿到非预期缓存类型。' },
      { title: '读取连接信息', command: 'licell cache connect [instanceId] --output json', reason: '创建完成后核对 host、port 与连接串。' }
    ],
    result: {
      summary: '返回缓存模式、实例 ID、规格与脱敏后的连接串。',
      fields: [
        { name: 'requestedMode', description: '请求的创建模式：`classic` 或 `serverless`。', required: true },
        { name: 'mode', description: '实际创建或绑定后的缓存类型：`classic-redis` 或 `tair-serverless-kv`。', required: true },
        { name: 'instanceId', description: '缓存实例 ID。', required: true },
        { name: 'instanceClass', description: '实例规格。', required: false },
        { name: 'connectionStringMasked', description: '脱敏后的 Redis 连接串。', required: true }
      ]
    }
  }
});

const cacheListCommand = defineCliCommand({
  rawName: 'cache list',
  description: '查看缓存实例列表',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 20' }
  ]
});

const cacheClassCommand = defineCliCommand({
  rawName: 'cache class [mode]',
  description: '查询缓存可用规格（给 Agent/开发者在 cache add 前对照）',
  options: [
    { rawName: '--zone <zoneId>', description: '按可用区过滤 classic Redis 规格（默认查询当前地域全部可售 zone）' },
    { rawName: '--limit <n>', description: '输出数量，默认 20' }
  ],
  descriptor: {
    title: 'List cache instance classes',
    notes: ['Tair Serverless 目前只能稳定展示默认 class 和已存在实例观测值；classic Redis 可列出可售规格。'],
    examples: ['licell cache class', 'licell cache class classic --limit 50', 'licell cache class serverless --output json'],
    related: ['cache add', 'cache list'],
    recommendedFlow: [
      { title: '先看可用规格', command: 'licell cache class', reason: '确认当前地域有哪些 class 可选，避免盲填 --class。' },
      { title: '再执行创建', command: 'licell cache add --class <instanceClass>', reason: '把选中的规格显式传给 cache add。' }
    ]
  }
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

type CacheClassMode = 'all' | 'classic' | 'serverless';
type CacheAddMode = 'classic' | 'serverless';

function normalizeCacheClassMode(input: string | undefined): CacheClassMode {
  const value = (input || '').trim().toLowerCase();
  if (!value || value === 'all') return 'all';
  if (value === 'classic' || value === 'redis') return 'classic';
  if (value === 'serverless' || value === 'tair') return 'serverless';
  throw new Error('cache class [mode] 仅支持 classic / serverless / all');
}

function inferCacheAddModeFromInstanceId(instanceId: string | undefined): CacheAddMode | undefined {
  const value = (instanceId || '').trim();
  if (!value) return undefined;
  if (value.startsWith('tt-') || value.startsWith('tk-')) return 'serverless';
  if (value.startsWith('r-')) return 'classic';
  return undefined;
}

function normalizeCacheAddMode(input: string | undefined, instanceId: string | undefined): CacheAddMode {
  const value = (input || '').trim().toLowerCase();
  if (!value) return inferCacheAddModeFromInstanceId(instanceId) || 'classic';
  if (value === 'classic' || value === 'redis') return 'classic';
  if (value === 'serverless' || value === 'tair') return 'serverless';
  throw new Error('cache add --mode 仅支持 classic / serverless');
}

function printCacheClassList(
  mode: CacheClassMode,
  catalog: Awaited<ReturnType<typeof listCacheClasses>>,
  limit: number
) {
  if (mode === 'all' || mode === 'serverless') {
    console.log(pc.bold('Tair Serverless KV'));
    console.log(`default: ${pc.cyan(catalog.serverless.defaultClass)}`);
    for (const note of catalog.serverless.notes) {
      console.log(`note:    ${pc.gray(note)}`);
    }
    if (catalog.serverless.observedClasses.length === 0) {
      console.log(`observed: ${pc.gray('(当前账号/地域暂无可观测实例)')}`);
    } else {
      console.log(`observed: ${pc.cyan(String(catalog.serverless.observedClasses.length))}`);
      for (const item of catalog.serverless.observedClasses.slice(0, limit)) {
        const zoneText = item.zoneIds.length > 0 ? item.zoneIds.join(',') : '-';
        console.log(`  ${pc.cyan(item.instanceClass)}  zones=${pc.gray(zoneText)}`);
      }
    }
    if (mode === 'all') console.log('');
  }

  if (mode === 'all' || mode === 'classic') {
    const shown = catalog.classic.classes.slice(0, limit);
    console.log(pc.bold('Classic Redis'));
    console.log(`zones:  ${pc.cyan(catalog.classic.zoneIds.join(', ') || '-')}`);
    console.log(`count:  ${pc.cyan(String(catalog.classic.classes.length))}`);
    for (const item of shown) {
      const remark = item.remark ? `  ${pc.gray(item.remark)}` : '';
      const zones = item.zoneIds.length > 0 ? item.zoneIds.join(',') : '-';
      console.log(`${pc.cyan(item.instanceClass)}  zones=${pc.gray(zones)}${remark}`);
    }
    if (catalog.classic.classes.length > shown.length) {
      console.log(pc.gray(`... 仅展示前 ${shown.length} 条，可通过 --limit 查看更多`));
    }
  }
}

function clearProjectCacheBinding(instanceId: string) {
  const project = Config.getProject();
  if (project.cache?.instanceId !== instanceId) return;

  const nextEnvs = { ...project.envs };
  for (const key of CACHE_PROJECT_ENV_KEYS) {
    delete nextEnvs[key];
  }

  Config.setProject({
    cache: undefined,
    envs: nextEnvs
  }, { replaceEnvs: true });
}

export function registerCacheCommands(cli: CAC) {
  registerCliCommand(cli, cacheAddCommand)
    .action(async (options: {
      type?: unknown;
      mode?: unknown;
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
          const type = toOptionalString(options.type)?.toLowerCase() || 'redis';
          if (type !== 'redis') throw new Error('--type 目前仅支持 redis');
          const instanceId = toOptionalString(options.instance);
          const mode = normalizeCacheAddMode(toOptionalString(options.mode), instanceId);

          const capacityMb = parseOptionalPositiveInt(options.capacity, 'capacity');
          const computeUnitNum = parseOptionalPositiveInt(options.computeUnit, 'compute-unit');

          const s = createSpinner();
          const result = await withSpinner(
            s,
            '正在初始化缓存资源编排...',
            '❌ 缓存拉起失败',
            () => provisionRedis(s, {
              instanceId,
              mode,
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
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(
              result.mode === 'tair-serverless-kv'
                ? pc.green('✅ Tair Serverless KV 已就绪并绑定到本工程内网！')
                : pc.green('✅ Redis 缓存已就绪并绑定到本工程内网！')
            );
          }
          if (isJsonOutput()) {
            emitCommandResult({
              requestedMode: mode,
              type,
              mode: result.mode,
              instanceId: result.instanceId,
              instanceClass: result.instanceClass || null,
              connectionStringMasked: maskConnectionString(result.redisUrl)
            });
            return;
          }
          console.log(`\n🔑 缓存连接串已生成: ${pc.cyan(maskConnectionString(result.redisUrl))}\n`);
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

  registerCliCommand(cli, cacheClassCommand)
    .action(async (modeInput: string | undefined, options: { zone?: unknown; limit?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(cacheClassCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['redis']
        },
        async () => {
          ensureAuthOrExit();
          const mode = normalizeCacheClassMode(toOptionalString(modeInput));
          const limit = parseListLimit(options.limit, 20, 500);
          const zoneId = toOptionalString(options.zone);
          const s = createSpinner();
          const catalog = await withSpinner(
            s,
            '正在查询缓存规格...',
            '❌ 获取缓存规格失败',
            () => listCacheClasses({ zoneId })
          );
          if (!catalog) return;
          const classicClasses = catalog.classic.classes.slice(0, limit);
          const serverlessObservedClasses = catalog.serverless.observedClasses.slice(0, limit);
          const payload = {
            regionId: catalog.regionId,
            mode,
            zoneId: zoneId || null,
            classic: {
              zoneIds: catalog.classic.zoneIds,
              totalCount: catalog.classic.classes.length,
              shownCount: classicClasses.length,
              truncated: catalog.classic.classes.length > classicClasses.length,
              classes: classicClasses
            },
            serverless: {
              querySupported: catalog.serverless.querySupported,
              defaultClass: catalog.serverless.defaultClass,
              notes: catalog.serverless.notes,
              totalObservedCount: catalog.serverless.observedClasses.length,
              shownObservedCount: serverlessObservedClasses.length,
              truncated: catalog.serverless.observedClasses.length > serverlessObservedClasses.length,
              observedClasses: serverlessObservedClasses
            }
          };
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 缓存规格已返回'));
          } else {
            emitCommandResult(payload);
            return;
          }
          printCacheClassList(mode, catalog, limit);
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
          const result = await withSpinner(
            s,
            `正在删除实例 ${id}...`,
            '❌ 删除失败',
            async () => {
              await deleteCacheInstance(id);
              clearProjectCacheBinding(id);
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
    cacheClassCommand,
    cacheListCommand,
    cacheInfoCommand,
    cacheConnectCommand,
    cacheRotatePasswordCommand,
    cachePublicAccessCommand,
    cacheRmCommand
  ]
});
