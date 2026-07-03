import type { CAC } from 'cac';
import pc from 'picocolors';
import {
  getEcsInstanceDetail,
  listEcsInstances,
  type EcsInstanceDetail,
  type EcsInstanceSummary,
  type EcsInstanceTagFilter,
  type EcsListInstancesOptions
} from '../providers/ecs';
import {
  createSpinner,
  ensureAuthOrExit,
  isInteractiveTTY,
  parseListLimit,
  showOutro,
  toOptionalString,
  toPromptValue,
  withSpinner
} from '../utils/cli-shared';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { INFRA_SECTION } from './sections';

const ecsListCommand = defineCliCommand({
  rawName: 'ecs list',
  description: '查看 ECS 实例列表',
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' },
    { rawName: '--limit <n>', description: '返回数量，默认 20，最大 200' },
    { rawName: '--status <status>', description: 'ECS 原生状态值，如 Running / Stopped' },
    { rawName: '--name <name>', description: '按 ECS InstanceName 过滤，支持 ECS 原生通配符' },
    { rawName: '--name-prefix <prefix>', description: '按实例名开头过滤，内部映射为 prefix*' },
    { rawName: '--instance-id <id>', description: '按实例 ID 过滤；可逗号分隔多个' },
    { rawName: '--vpc <vpcId>', description: '按 VPC ID 过滤' },
    { rawName: '--vsw <vSwitchId>', description: '按 VSwitch ID 过滤' },
    { rawName: '--zone <zoneId>', description: '按可用区过滤' },
    { rawName: '--instance-type <instanceType>', description: '按实例规格过滤' },
    { rawName: '--charge-type <chargeType>', description: '按付费类型过滤：PostPaid / PrePaid' },
    { rawName: '--tag <key=value>', description: '按标签精确过滤；可重复传入，多个 tag 为 AND' },
    { rawName: '--private-ip <ip>', description: '按私网 IP 过滤' },
    { rawName: '--public-ip <ip>', description: '按公网 IP 过滤' },
    { rawName: '--eip <ip>', description: '按 EIP 地址过滤' }
  ],
  descriptor: {
    title: 'List ECS instances',
    summary: '查看 ECS 实例列表，支持 region、实例名、网络、IP 和 tag 过滤。',
    examples: [
      'licell ecs list --output json',
      'licell ecs list --region cn-hangzhou --status Running --limit 20 --output json',
      'licell ecs list --tag env=prod --tag app=api --output json'
    ],
    related: ['doctor', 'auth repair'],
    agentTips: [
      '自动化调用优先使用 `licell ecs list --output json`，读取 result 中的 `instances[]`。',
      '`--status` 只透传 ECS 原生状态值，不做大小写或中文别名归一。',
      '多个 `--tag key=value` 会作为 AND 条件传给 ECS provider。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--region', '--limit', '--status', '--tag']
    },
    safety: {
      level: 'safe',
      reason: '只调用 ECS DescribeInstances 读取实例列表，不修改云端资源或项目状态。',
      confirmFlags: []
    },
    optionInsights: {
      '--region': {
        whenToUse: '需要查询非当前 licell auth region 的 ECS 实例时使用。',
        cautions: ['只影响本次查询，不会修改全局默认 region。']
      },
      '--limit': {
        whenToUse: '控制返回数量；默认 20，最大 200。',
        cautions: ['本命令不是全量导出工具。']
      },
      '--tag': {
        whenToUse: '按一个或多个 ECS 标签精确过滤实例。',
        cautions: ['格式必须是 key=value；重复传入表示多个标签条件同时成立。']
      },
      '--name': {
        whenToUse: '按完整实例名或 ECS 原生通配符过滤。',
        cautions: ['不能与 --name-prefix 同时使用。']
      },
      '--name-prefix': {
        whenToUse: '按实例名前缀过滤，由 provider 映射到 ECS namePrefix 语义。',
        cautions: ['不能与 --name 同时使用；命令层不做本地过滤。']
      },
      '--private-ip': {
        whenToUse: '按私网 IP 过滤。'
      },
      '--public-ip': {
        whenToUse: '按公网 IP 过滤。'
      },
      '--eip': {
        whenToUse: '按 EIP 地址过滤。'
      }
    },
    recommendedFlow: [
      { title: '列出实例', command: 'licell ecs list --output json', reason: '先读取当前 region 的 ECS 实例摘要。' },
      { title: '按标签缩小范围', command: 'licell ecs list --tag env=prod --output json', reason: '使用服务端 tag 过滤定位目标实例。' },
      { title: '修复权限', command: 'licell auth repair', reason: '若 ECS 读权限不足，补齐 bootstrap RAM policy。' }
    ],
    result: {
      summary: '返回 ECS 实例列表查询结果、分页信息、过滤回显和实例摘要数组。',
      fields: [
        { name: 'regionId', description: '实际查询的 ECS region。', required: true },
        { name: 'count', description: '本次返回的实例数量。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'totalCount', description: 'ECS 返回的匹配总数；服务未返回时可能缺失。' },
        { name: 'truncated', description: '结果是否因 limit 或 provider 分页上限被截断。', required: true },
        { name: 'filters', description: '归一化后的 provider 查询过滤条件。', required: true },
        { name: 'instances[]', description: 'ECS 实例摘要数组。', required: true }
      ]
    }
  }
});

const ecsInfoCommand = defineCliCommand({
  rawName: 'ecs info <instanceId>',
  description: '查看 ECS 实例基础详情',
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region，不跨 region 搜索' }
  ],
  descriptor: {
    title: 'Show ECS instance detail',
    summary: '查看单台 ECS 实例的基础详情；默认只查询当前 licell region。',
    examples: [
      'licell ecs info i-xxx --output json',
      'licell ecs info i-xxx --region cn-hangzhou --output json'
    ],
    related: ['ecs list', 'auth repair'],
    agentTips: [
      '自动化调用优先使用 `licell ecs info <instanceId> --output json`，读取 `detail.summary`。',
      '未传 `--region` 时只查询当前 licell auth region；查不到时先确认实例所在 region。',
      '本命令只返回基础白名单字段，不返回 raw attribute、userData、VNC 或密钥材料。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['instanceId', '--region']
    },
    safety: {
      level: 'safe',
      reason: '只调用 ECS 只读详情查询，不修改云端资源或项目状态。',
      confirmFlags: []
    },
    optionInsights: {
      '--region': {
        whenToUse: '实例不在当前 licell 默认 region 时显式指定。',
        cautions: ['不会跨 region 自动搜索；只影响本次查询，不修改全局默认 region。']
      }
    },
    recommendedFlow: [
      { title: '先列出实例', command: 'licell ecs list --output json', reason: '获取实例 ID 和实际 region。' },
      { title: '查看详情', command: 'licell ecs info <instanceId> --output json', reason: '读取单台 ECS 的基础详情。' },
      { title: '指定地域查看详情', command: 'licell ecs info <instanceId> --region cn-hangzhou --output json', reason: '实例不在默认 region 时显式查询。' }
    ],
    result: {
      summary: '返回 ECS 实例基础详情，detail.summary 仅包含白名单摘要字段。',
      fields: [
        { name: 'regionId', description: '实际查询到的 ECS region。', required: true },
        { name: 'instanceId', description: '查询到的 ECS instanceId。', required: true },
        { name: 'detail.summary', description: 'ECS 实例基础摘要。', required: true },
        { name: 'detail.summary.instanceId', description: '实例 ID。', required: true },
        { name: 'detail.summary.instanceName', description: '实例名称。' },
        { name: 'detail.summary.status', description: 'ECS 原生状态。' },
        { name: 'detail.summary.regionId', description: '实例所属 region。', required: true },
        { name: 'detail.summary.zoneId', description: '实例所属可用区。' },
        { name: 'detail.summary.instanceType', description: '实例规格。' },
        { name: 'detail.summary.osName', description: '操作系统名称。' },
        { name: 'detail.summary.chargeType', description: '付费类型。' },
        { name: 'detail.summary.vpcId', description: 'VPC ID。' },
        { name: 'detail.summary.vSwitchId', description: 'VSwitch ID。' },
        { name: 'detail.summary.privateIpAddresses[]', description: '私网 IP 列表。' },
        { name: 'detail.summary.publicIpAddresses[]', description: '公网 IP 列表。' },
        { name: 'detail.summary.eipAddress', description: 'EIP 地址。' },
        { name: 'detail.summary.securityGroupIds[]', description: '安全组 ID 列表。' },
        { name: 'detail.summary.tags[]', description: '标签列表。' },
        { name: 'detail.summary.createdAt', description: '创建时间。' },
        { name: 'detail.summary.expiredAt', description: '过期时间。' }
      ]
    }
  }
});

function normalizeCsv(value: unknown) {
  const input = toOptionalString(value);
  if (!input) return undefined;
  const items = input.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? [...new Set(items)] : undefined;
}

function normalizeRepeatableString(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeRepeatableString(item));
  }
  const input = toOptionalString(value);
  return input ? [input] : [];
}

function parseTagFilters(value: unknown): EcsInstanceTagFilter[] | undefined {
  const rawTags = normalizeRepeatableString(value);
  if (rawTags.length === 0) return undefined;

  const tags = rawTags.map((raw) => {
    const separatorIndex = raw.indexOf('=');
    if (separatorIndex < 0) {
      throw new Error('tag 过滤条件无效：请使用 key=value 格式');
    }
    const key = raw.slice(0, separatorIndex).trim();
    const tagValue = raw.slice(separatorIndex + 1).trim();
    if (!key) throw new Error('tag key 不能为空');
    if (!tagValue) throw new Error('tag value 不能为空');
    return { key, value: tagValue };
  });

  return tags;
}

export function parseEcsListOptions(options: {
  region?: unknown;
  limit?: unknown;
  status?: unknown;
  name?: unknown;
  namePrefix?: unknown;
  instanceId?: unknown;
  vpc?: unknown;
  vsw?: unknown;
  zone?: unknown;
  instanceType?: unknown;
  chargeType?: unknown;
  tag?: unknown;
  privateIp?: unknown;
  publicIp?: unknown;
  eip?: unknown;
}): EcsListInstancesOptions {
  const name = toOptionalString(options.name);
  const namePrefix = toOptionalString(options.namePrefix);
  if (name && namePrefix) {
    throw new Error('ECS list 过滤条件无效：--name 与 --name-prefix 不能同时使用');
  }
  const regionId = toOptionalString(options.region);
  const status = toOptionalString(options.status);
  const instanceIds = normalizeCsv(options.instanceId);
  const vpcId = toOptionalString(options.vpc);
  const vSwitchId = toOptionalString(options.vsw);
  const zoneId = toOptionalString(options.zone);
  const instanceType = toOptionalString(options.instanceType);
  const chargeType = toOptionalString(options.chargeType);
  const tags = parseTagFilters(options.tag);
  const privateIpAddress = toOptionalString(options.privateIp);
  const publicIpAddress = toOptionalString(options.publicIp);
  const eipAddress = toOptionalString(options.eip);

  return {
    limit: parseListLimit(options.limit, 20, 200),
    ...(regionId ? { regionId } : {}),
    ...(status ? { status } : {}),
    ...(name ? { name } : {}),
    ...(namePrefix ? { namePrefix } : {}),
    ...(instanceIds ? { instanceIds } : {}),
    ...(vpcId ? { vpcId } : {}),
    ...(vSwitchId ? { vSwitchId } : {}),
    ...(zoneId ? { zoneId } : {}),
    ...(instanceType ? { instanceType } : {}),
    ...(chargeType ? { chargeType } : {}),
    ...(tags ? { tags } : {}),
    ...(privateIpAddress ? { privateIpAddress } : {}),
    ...(publicIpAddress ? { publicIpAddress } : {}),
    ...(eipAddress ? { eipAddress } : {})
  };
}

function formatAddressList(values: string[]) {
  return values.length > 0 ? values.join(',') : '-';
}

function printEcsInstances(instances: EcsInstanceSummary[]) {
  for (const item of instances) {
    console.log(
      `${pc.cyan(item.instanceId)}  name=${pc.gray(item.instanceName || '-')}  status=${pc.gray(item.status || '-')}  type=${pc.gray(item.instanceType || '-')}  zone=${pc.gray(item.zoneId || '-')}`
      + `  privateIp=${pc.gray(formatAddressList(item.privateIpAddresses))}  publicIp=${pc.gray(formatAddressList(item.publicIpAddresses))}  eip=${pc.gray(item.eipAddress || '-')}`
    );
  }
}

function formatTagList(tags: EcsInstanceSummary['tags']) {
  return tags.length > 0
    ? tags.map((tag) => tag.value ? `${tag.key}=${tag.value}` : tag.key).join(',')
    : '-';
}

function buildEcsInfoResult(detail: EcsInstanceDetail) {
  const summary = detail.summary;
  return {
    regionId: summary.regionId,
    instanceId: summary.instanceId,
    detail: {
      summary: {
        instanceId: summary.instanceId,
        ...(summary.instanceName ? { instanceName: summary.instanceName } : {}),
        ...(summary.status ? { status: summary.status } : {}),
        regionId: summary.regionId,
        ...(summary.zoneId ? { zoneId: summary.zoneId } : {}),
        ...(summary.instanceType ? { instanceType: summary.instanceType } : {}),
        ...(summary.osName ? { osName: summary.osName } : {}),
        ...(summary.chargeType ? { chargeType: summary.chargeType } : {}),
        ...(summary.vpcId ? { vpcId: summary.vpcId } : {}),
        ...(summary.vSwitchId ? { vSwitchId: summary.vSwitchId } : {}),
        privateIpAddresses: summary.privateIpAddresses,
        publicIpAddresses: summary.publicIpAddresses,
        ...(summary.eipAddress ? { eipAddress: summary.eipAddress } : {}),
        securityGroupIds: summary.securityGroupIds,
        tags: summary.tags,
        ...(summary.createdAt ? { createdAt: summary.createdAt } : {}),
        ...(summary.expiredAt ? { expiredAt: summary.expiredAt } : {})
      }
    }
  };
}

function printEcsInstanceDetail(detail: EcsInstanceDetail) {
  const { summary } = detail;
  console.log(`\ninstanceId:     ${pc.cyan(summary.instanceId)}`);
  console.log(`name:           ${pc.cyan(summary.instanceName || '-')}`);
  console.log(`status:         ${pc.cyan(summary.status || '-')}`);
  console.log(`region/zone:    ${pc.cyan(`${summary.regionId} / ${summary.zoneId || '-'}`)}`);
  console.log(`type:           ${pc.cyan(summary.instanceType || '-')}`);
  if (summary.osName) console.log(`os:             ${pc.cyan(summary.osName)}`);
  if (summary.chargeType) console.log(`chargeType:     ${pc.cyan(summary.chargeType)}`);
  console.log(`vpc/vsw:        ${pc.cyan(`${summary.vpcId || '-'} / ${summary.vSwitchId || '-'}`)}`);
  console.log(`privateIp:      ${pc.cyan(formatAddressList(summary.privateIpAddresses))}`);
  console.log(`publicIp:       ${pc.cyan(formatAddressList(summary.publicIpAddresses))}`);
  console.log(`eip:            ${pc.cyan(summary.eipAddress || '-')}`);
  console.log(`securityGroups: ${pc.cyan(formatAddressList(summary.securityGroupIds))}`);
  console.log(`tags:           ${pc.cyan(formatTagList(summary.tags))}`);
  if (summary.createdAt) console.log(`createdAt:      ${pc.cyan(summary.createdAt)}`);
  if (summary.expiredAt) console.log(`expiredAt:      ${pc.cyan(summary.expiredAt)}`);
}

export function registerEcsCommands(cli: CAC) {
  registerCliCommand(cli, ecsListCommand)
    .action(async (options: Parameters<typeof parseEcsListOptions>[0]) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ecsListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['ecs']
        },
        async () => {
          ensureAuthOrExit();
          const queryOptions = parseEcsListOptions(options);
          const s = createSpinner();
          const result = await withSpinner(
            s,
            '正在拉取 ECS 实例列表...',
            '❌ 获取 ECS 实例列表失败',
            () => listEcsInstances(queryOptions)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共获取 ${result.count} 个实例`));
          }
          if (isJsonOutput()) {
            emitCommandResult(result);
            return;
          }
          if (result.instances.length === 0) {
            showOutro('当前地域没有匹配的 ECS 实例');
            return;
          }
          printEcsInstances(result.instances);
          if (result.truncated) {
            console.log(pc.gray(`... 结果已按 limit=${result.limit} 截断`));
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, ecsInfoCommand)
    .action(async (instanceId: string, options: { region?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ecsInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['ecs']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const regionId = toOptionalString(options.region);
          const s = createSpinner();
          const detail = await withSpinner(
            s,
            `正在拉取 ECS 实例 ${normalizedId} 详情...`,
            '❌ 获取 ECS 实例详情失败',
            () => getEcsInstanceDetail(normalizedId, regionId ? { regionId } : undefined)
          );
          if (!detail) return;
          if (isJsonOutput()) {
            emitCommandResult(buildEcsInfoResult(detail));
            return;
          }
          s.stop(pc.green('✅ 获取成功'));
          printEcsInstanceDetail(detail);
          console.log('');
          showOutro('Done.');
        }
      );
    });
}

export const ecsCommandModule = defineCommandModule({
  section: INFRA_SECTION,
  commands: [ecsListCommand, ecsInfoCommand],
  register: registerEcsCommands,
  namespaces: {
    ecs: {
      title: 'ECS instances',
      summary: '查询 ECS 云服务器实例，后续生命周期命令会按安全设计逐步开放。',
      examples: [
        'licell ecs list --output json',
        'licell ecs list --tag env=prod --output json',
        'licell ecs info <instanceId> --output json'
      ],
      agentTips: [
        '当前 ECS namespace 只开放只读 list/info 命令。',
        '需要结构化结果时使用 `licell ecs list --output json` 或 `licell ecs info <instanceId> --output json`。',
        '不要假设未出现在 catalog/help 中的 ECS 子命令已经可用。'
      ],
      recommendedFlow: [
        { title: '列出实例', command: 'licell ecs list --output json', reason: '读取当前 region ECS 实例摘要。' },
        { title: '查看详情', command: 'licell ecs info <instanceId> --output json', reason: '读取单台 ECS 的基础详情。' },
        { title: '修复权限', command: 'licell auth repair', reason: '如果 list 返回 ECS 读权限不足，补齐 RAM policy。' }
      ],
      automation: {
        preferredOutput: 'json',
        explicitInputs: ['--region', '--limit']
      },
      safety: {
        level: 'safe',
        reason: '当前 ECS namespace 只注册只读查询命令。',
        confirmFlags: []
      }
    }
  }
});
