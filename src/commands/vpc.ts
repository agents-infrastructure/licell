import type { CAC } from 'cac';
import pc from 'picocolors';
import { getVpcInfo, inspectVpcTopology, listVpcNetworks } from '../providers/vpc/query';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  isInteractiveTTY,
  parseListLimit,
  toOptionalString,
  toPromptValue
} from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { INFRA_SECTION } from './sections';

const vpcListCommand = defineCliCommand({
  rawName: 'vpc list',
  description: '列出当前地域的 VPC 网络',
  region: { scope: 'auth' },
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' },
    { rawName: '--name <name>', description: '按 VPC 名称过滤' },
    { rawName: '--limit <n>', description: '返回数量，默认 20，最大 200' }
  ],
  descriptor: {
    title: 'List VPC networks',
    summary: '通过 VPC DescribeVpcs 只读 API 列出当前地域的专有网络摘要。',
    examples: [
      'licell vpc list --region cn-hangzhou --output json',
      'licell vpc list --name prod --output json'
    ],
    related: ['vpc info', 'vpc topology', 'capability search'],
    agentTips: [
      '先读取 `vpcs[].vpcId`；需要关联交换机、路由、NAT 和 EIP 时继续执行 `vpc topology`。',
      '本命令只读取 VPC，不创建或修改任何网络资源。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['--region', '--name', '--limit'] },
    safety: { level: 'safe', reason: '只调用 DescribeVpcs 读取 VPC 列表。', confirmFlags: [] },
    recommendedFlow: [
      { title: '列出 VPC', command: 'licell vpc list --output json', reason: '获取当前地域的 VPC ID、名称和网段。' },
      { title: '查看网络拓扑', command: 'licell vpc topology <vpc> --output json', reason: '聚合该 VPC 的关联网络资源。' }
    ],
    result: {
      summary: '返回当前地域的 VPC 摘要、过滤条件和截断状态。',
      outcomeKey: 'vpcs',
      fields: [
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'count', description: '本次返回 VPC 数量。', required: true },
        { name: 'totalCount', description: '云端匹配总数。', required: true },
        { name: 'truncated', description: '结果是否因 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的过滤条件。', required: true },
        { name: 'vpcs[]', description: 'VPC ID、名称、状态、网段及关联资源 ID 摘要。', required: true }
      ]
    }
  }
});

const vpcInfoCommand = defineCliCommand({
  rawName: 'vpc info <vpc>',
  description: '按 VPC ID 或唯一名称查看网络详情',
  region: { scope: 'auth' },
  options: [{ rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' }],
  descriptor: {
    title: 'Inspect one VPC',
    summary: '按完整 VPC ID 或唯一名称读取 VPC 的状态、网段和关联资源 ID。',
    examples: [
      'licell vpc info vpc-xxx --region cn-hangzhou --output json',
      'licell vpc info prod --output json'
    ],
    argumentHints: { vpc: '完整 VPC ID 或当前地域内唯一的 VPC 名称。' },
    related: ['vpc list', 'vpc topology'],
    agentTips: ['名称匹配到多个 VPC 时命令会拒绝猜测，并要求改用 VPC ID。'],
    automation: { preferredOutput: 'json', explicitInputs: ['vpc', '--region'] },
    safety: { level: 'safe', reason: '只调用 DescribeVpcs 读取单个 VPC。', confirmFlags: [] },
    recommendedFlow: [
      { title: '定位 VPC', command: 'licell vpc list --output json', reason: '先获取准确 VPC ID。' },
      { title: '读取 VPC 详情', command: 'licell vpc info <vpc> --output json', reason: '确认状态、网段和关联资源。' },
      { title: '读取完整拓扑', command: 'licell vpc topology <vpc> --output json', reason: '进一步聚合关联网络资源。' }
    ],
    result: {
      summary: '返回一个 VPC 的标准化只读详情。',
      outcomeKey: 'vpc',
      fields: [
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'vpcId', description: '解析后的 VPC ID。', required: true },
        { name: 'vpc', description: 'VPC 状态、网段、标签和关联资源 ID。', required: true }
      ]
    }
  }
});

const vpcTopologyCommand = defineCliCommand({
  rawName: 'vpc topology <vpc>',
  description: '聚合查看 VPC、交换机、路由表、NAT 网关和 EIP 拓扑',
  region: { scope: 'auth' },
  options: [{ rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' }],
  descriptor: {
    title: 'Inspect VPC topology',
    summary: '并行读取一个 VPC 下的交换机、路由表、NAT 网关和关联 EIP，并投影资源关系。',
    examples: [
      'licell vpc topology vpc-xxx --region cn-hangzhou --output json',
      'licell vpc topology prod --output json'
    ],
    argumentHints: { vpc: '完整 VPC ID 或当前地域内唯一的 VPC 名称。' },
    related: ['vpc list', 'vpc info', 'api invoke'],
    agentTips: [
      '优先读取 `counts` 判断资源规模，再读取 `relationships` 追踪关联 ID。',
      'EIP 结果只保留明确关联当前 VPC 或其 NAT 网关的地址。',
      '未封装的 VPC 能力继续通过 capability describe 的 raw API fallback 执行。'
    ],
    automation: { preferredOutput: 'json', explicitInputs: ['vpc', '--region'] },
    safety: { level: 'safe', reason: '只调用五个 VPC Describe API，不修改任何网络资源。', confirmFlags: [] },
    recommendedFlow: [
      { title: '定位 VPC', command: 'licell vpc list --output json', reason: '先获取准确 VPC ID。' },
      { title: '盘点网络拓扑', command: 'licell vpc topology <vpc> --output json', reason: '读取关联资源及关系。' }
    ],
    result: {
      summary: '返回 VPC 及其核心网络资源的统一拓扑视图。',
      outcomeKey: 'relationships',
      fields: [
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'vpc', description: '目标 VPC 摘要。', required: true },
        { name: 'counts', description: '交换机、路由表、NAT 网关和 EIP 数量。', required: true },
        { name: 'vSwitches[]', description: '交换机与可用区、网段、路由表摘要。', required: true },
        { name: 'routeTables[]', description: '路由表及关联交换机摘要。', required: true },
        { name: 'natGateways[]', description: 'NAT 网关状态和表 ID 摘要。', required: true },
        { name: 'eipAddresses[]', description: '关联当前 VPC 或 NAT 网关的 EIP 摘要。', required: true },
        { name: 'relationships', description: '从 VPC 到核心资源以及 EIP 绑定的 ID 关系。', required: true }
      ]
    }
  }
});

async function runVpcReadCommand<T extends object>(command: { rawName: string }, task: () => Promise<T>) {
  return executeWithAuthRecovery(
    {
      commandLabel: commandInvocation(command),
      interactiveTTY: isInteractiveTTY(),
      requiredCapabilities: ['vpc-read']
    },
    async () => {
      await ensureAuthOrExit();
      const result = await task();
      if (isJsonOutput()) emitCommandResult(result);
      return result;
    }
  );
}

export function registerVpcCommands(cli: CAC) {
  registerCliCommand(cli, vpcListCommand).action(async (options: {
    region?: unknown;
    name?: unknown;
    limit?: unknown;
  }) => {
    const result = await runVpcReadCommand(vpcListCommand, () => listVpcNetworks({
      regionId: toOptionalString(options.region),
      name: toOptionalString(options.name),
      limit: parseListLimit(options.limit, 20, 200)
    }));
    if (!isJsonOutput()) {
      console.log(pc.bold(`VPC networks (${result.count})`));
      for (const vpc of result.vpcs) {
        console.log(`- ${pc.cyan(vpc.vpcName || vpc.vpcId)}  ${vpc.vpcId}  ${vpc.cidrBlock || '-'}  ${vpc.status || '-'}`);
      }
    }
  });

  registerCliCommand(cli, vpcInfoCommand).action(async (vpc: string, options: { region?: unknown }) => {
    const result = await runVpcReadCommand(vpcInfoCommand, () => getVpcInfo(
      toPromptValue(vpc, 'vpc'),
      { regionId: toOptionalString(options.region) }
    ));
    if (!isJsonOutput()) {
      console.log(pc.bold(result.vpc.vpcName || result.vpc.vpcId));
      console.log(`id:       ${pc.cyan(result.vpc.vpcId)}`);
      console.log(`region:   ${pc.cyan(result.regionId)}`);
      console.log(`cidr:     ${pc.cyan(result.vpc.cidrBlock || '-')}`);
      console.log(`status:   ${pc.cyan(result.vpc.status || '-')}`);
    }
  });

  registerCliCommand(cli, vpcTopologyCommand).action(async (vpc: string, options: { region?: unknown }) => {
    const result = await runVpcReadCommand(vpcTopologyCommand, () => inspectVpcTopology(
      toPromptValue(vpc, 'vpc'),
      { regionId: toOptionalString(options.region) }
    ));
    if (!isJsonOutput()) {
      console.log(pc.bold(`${result.vpc.vpcName || result.vpc.vpcId} topology`));
      console.log(`vSwitches:    ${result.counts.vSwitches}`);
      console.log(`routeTables:  ${result.counts.routeTables}`);
      console.log(`natGateways:  ${result.counts.natGateways}`);
      console.log(`eipAddresses: ${result.counts.eipAddresses}`);
    }
  });
}

export const vpcCommandModule = defineCommandModule({
  section: INFRA_SECTION,
  register: registerVpcCommands,
  namespaces: {
    vpc: {
      title: 'VPC networks',
      summary: '只读发现专有网络，并聚合交换机、路由表、NAT 网关与 EIP 拓扑。',
      examples: [
        'licell vpc list --output json',
        'licell vpc info <vpc> --output json',
        'licell vpc topology <vpc> --output json'
      ],
      agentTips: [
        '先用 list 定位 VPC，再用 topology 获取核心网络资源关系。',
        '其他未封装的 VPC API 继续通过 capability search/describe 进入 raw fallback。'
      ]
    }
  },
  commands: [vpcListCommand, vpcInfoCommand, vpcTopologyCommand]
});
