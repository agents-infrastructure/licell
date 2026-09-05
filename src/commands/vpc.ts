import type { CAC } from 'cac';
import pc from 'picocolors';
import { applyVpcConfig, planVpcConfig } from '../providers/vpc/config';
import { getVpcInfo, inspectVpcTopology, listVpcNetworks } from '../providers/vpc/query';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  ensureAuthOrExit,
  ensureMutatingActionConfirmed,
  isInteractiveTTY,
  parseListLimit,
  toOptionalString,
  toPromptValue
} from '../utils/cli-shared';
import { resolveOptionalPayloadInput } from '../utils/payload-input';
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

const vpcConfigApplyCommand = defineCliCommand({
  rawName: 'vpc config apply <vpc>',
  description: '按 desired-state 设置 VPC 名称和描述',
  region: { scope: 'auth' },
  options: [
    { rawName: '--region <regionId>', description: 'VPC 所在地域；不传则使用当前 licell 默认 region' },
    { rawName: '--dry-run', description: '只读取现状并生成差异计划，不修改 VPC' },
    { rawName: '--yes', description: '确认执行 VPC 属性修改' },
    { rawName: '--payload <json>', description: '内联 JSON desired-state' },
    { rawName: '--file <path>', description: '从当前工作目录内的文件读取 JSON desired-state' }
  ],
  descriptor: {
    title: 'Apply VPC mutable attributes',
    summary: '用可验证的 desired-state workflow 管理 VPC 名称和描述。',
    examples: [
      `licell vpc config apply vpc-xxx --payload '{"name":"prod-network"}' --dry-run --output json`,
      `licell vpc config apply vpc-xxx --payload '{"description":null}' --yes --output json`,
      'licell vpc config apply vpc-xxx --file ./vpc-config.json --dry-run --output json'
    ],
    argumentHints: { vpc: '完整 VPC ID 或当前地域内唯一的 VPC 名称；执行时会固定解析为 VPC ID。' },
    related: ['vpc list', 'vpc info', 'vpc topology'],
    agentTips: [
      'desired-state 仅支持 name 和 description；省略字段表示保持不变，description=null 表示清空描述。',
      'Agent 必须先用 --dry-run 检查 changes[].before/after，再用相同 payload 加 --yes 执行。',
      '命令只调用一次 ModifyVpcAttribute，随后用 DescribeVpcs 重试读回验证。',
      '阿里云限制短时间内重复修改 VPC 名称和描述；验证失败时不会立即自动回滚，而会要求稍后用 vpc info 复查。',
      'CIDR、IPv6、路由、交换机和网关不属于本命令范围，继续通过各自 workflow 或受控 raw fallback 管理。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['vpc', '--region', '--dry-run', '--yes', '--payload', '--file']
    },
    safety: {
      level: 'mutating',
      reason: '会修改 VPC 名称或描述；要求先 dry-run，并用 --yes 明确确认。',
      confirmFlags: ['--yes']
    },
    optionInsights: {
      '--dry-run': { whenToUse: '所有 Agent 和自动化调用都应先使用。', cautions: ['只生成计划，不执行 ModifyVpcAttribute。'] },
      '--yes': { whenToUse: '确认 dry-run 结果后执行。', cautions: ['必须与已审查的 payload 保持一致。'] },
      '--payload': { whenToUse: '只修改一两个短字段时使用。', cautions: ['不要与 --file 同时使用。'] },
      '--file': { whenToUse: '希望把 desired-state 纳入项目审查时使用。', cautions: ['文件必须位于当前工作目录内。'] }
    },
    recommendedFlow: [
      { title: '定位 VPC', command: 'licell vpc list --output json', reason: '获取准确 VPC ID。' },
      { title: '生成变更计划', command: 'licell vpc config apply <vpc> --file <path> --dry-run --output json', reason: '检查字段级 before/after。' },
      { title: '应用并验证', command: 'licell vpc config apply <vpc> --file <path> --yes --output json', reason: '写入后自动读回验证。' },
      { title: '复查拓扑', command: 'licell vpc topology <vpc> --output json', reason: '确认关联网络资源未发生变化。' }
    ],
    result: {
      summary: '返回字段级计划、执行信息和读回验证结果。',
      fields: [
        { name: 'plan.vpcId', description: '解析后的目标 VPC ID。', required: true },
        { name: 'plan.changes[]', description: 'name/description 的 before、after 和 set/clear/noop 动作。', required: true },
        { name: 'plan.willExecute', description: '是否会实际执行写入；dry-run 固定为 false。', required: true },
        { name: 'execution.performed', description: '是否实际调用 ModifyVpcAttribute。', required: true },
        { name: 'execution.requestId', description: '阿里云写 API requestId，仅实际变更时存在。' },
        { name: 'verify.performed', description: '是否执行写入后读回验证；dry-run 固定为 false。', required: true },
        { name: 'verify.matched', description: '读回属性是否与 desired-state 一致。' },
        { name: 'verify.attributes', description: '读回的名称和描述；dry-run 时为当前属性。', required: true }
      ]
    }
  }
});

function parseVpcDesiredState(payload: unknown, file: unknown) {
  const raw = resolveOptionalPayloadInput({ payload, file });
  if (!raw) throw new Error('vpc config apply 需要 --payload 或 --file');
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error('VPC config desired-state 不是有效 JSON');
  }
}

function printVpcConfigPlan(plan: Awaited<ReturnType<typeof planVpcConfig>>) {
  console.log(pc.bold(`VPC ${plan.vpcId} config plan`));
  console.log(`region:  ${pc.cyan(plan.regionId)}`);
  for (const change of plan.changes) {
    console.log(`- ${change.field}: ${String(change.before ?? '(empty)')} -> ${String(change.after ?? '(empty)')} [${change.action}]`);
  }
}

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

  registerCliCommand(cli, vpcConfigApplyCommand).action(async (vpc: string, options: {
    region?: unknown;
    dryRun?: unknown;
    yes?: unknown;
    payload?: unknown;
    file?: unknown;
  }) => {
    const dryRun = Boolean(options.dryRun);
    await executeWithAuthRecovery(
      {
        commandLabel: commandInvocation(vpcConfigApplyCommand),
        interactiveTTY: isInteractiveTTY(),
        requiredCapabilities: dryRun ? ['vpc-read'] : ['vpc-write']
      },
      async () => {
        await ensureAuthOrExit();
        const identifier = toPromptValue(vpc, 'vpc');
        const desiredState = parseVpcDesiredState(options.payload, options.file);
        const lookup = { regionId: toOptionalString(options.region) };
        if (dryRun) {
          const plan = await planVpcConfig(identifier, desiredState, lookup);
          const result = {
            plan,
            execution: { performed: false },
            verify: { performed: false, attributes: plan.current }
          };
          if (isJsonOutput()) emitCommandResult(result);
          else printVpcConfigPlan(plan);
          return result;
        }
        await ensureMutatingActionConfirmed(`修改 VPC ${identifier} 名称或描述`, {
          yes: Boolean(options.yes),
          interactiveTTY: isInteractiveTTY()
        });
        const result = await applyVpcConfig(identifier, desiredState, lookup);
        if (isJsonOutput()) emitCommandResult(result);
        else printVpcConfigPlan(result.plan);
        return result;
      }
    );
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
      summary: '发现专有网络、聚合核心拓扑，并通过 desired-state 安全管理 VPC 名称和描述。',
      examples: [
        'licell vpc list --output json',
        'licell vpc info <vpc> --output json',
        'licell vpc topology <vpc> --output json',
        'licell vpc config apply <vpc> --file <path> --dry-run --output json'
      ],
      agentTips: [
        '先用 list 定位 VPC，再用 topology 获取核心网络资源关系。',
        '修改 VPC 名称或描述时，先执行 config apply --dry-run，再用 --yes 应用并读回验证。',
        '其他未封装的 VPC API 继续通过 capability search/describe 进入 raw fallback。'
      ]
    }
  },
  commands: [vpcListCommand, vpcInfoCommand, vpcTopologyCommand, vpcConfigApplyCommand]
});
