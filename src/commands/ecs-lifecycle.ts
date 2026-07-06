import type { CAC } from 'cac';
import pc from 'picocolors';
import {
  getEcsInstanceDetail,
  startEcsInstance,
  rebootEcsInstance,
  stopEcsInstance,
  deleteEcsInstance,
  getEcsInstanceReleaseFacts,
  type EcsStatusClass
} from '../providers/ecs';
import {
  createSpinner,
  ensureAuthOrExit,
  isInteractiveTTY,
  showOutro,
  toOptionalString,
  toPromptValue,
  withSpinner,
  ensureHighImpactActionConfirmed,
  ensureDestructiveActionConfirmed
} from '../utils/cli-shared';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, registerCliCommand, type CommandDescriptor, type DeclaredCliCommand } from './module';

// Normalizes an ECS native status string into a coarse lifecycle class.
export function classifyEcsStatus(status?: string): EcsStatusClass {
  const s = (status || '').trim().toLowerCase();
  if (!s) return 'unknown';
  if (['running'].includes(s)) return 'running-like';
  if (['stopped'].includes(s)) return 'stopped-like';
  if (['starting', 'stopping', 'rebooting', 'pending', 'migrating'].includes(s)) return 'transitional';
  return 'unknown';
}

const MAX_VERIFY_POLLS = 6;
const VERIFY_POLL_INTERVAL_MS = 5000;

function normalizeNativeStatus(status?: string): string {
  return (status || '').trim().toLowerCase();
}

export function ecsStatusMatchesTarget(status: string | undefined, targetStatuses: readonly string[]): boolean {
  const normalized = normalizeNativeStatus(status);
  return Boolean(normalized && targetStatuses.some((target) => normalizeNativeStatus(target) === normalized));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Bounded polling: re-reads instance detail until an action-specific native ECS
// target status is observed, otherwise returns timedOut=true (not a failure).
export async function pollForVerify(
  instanceId: string,
  regionId: string | undefined,
  targetStatuses: readonly string[],
  options: { maxPolls?: number; pollIntervalMs?: number } = {}
): Promise<{
  status?: string;
  statusClass?: EcsStatusClass;
  reachedTarget: boolean;
  timedOut: boolean;
}> {
  let lastStatus: string | undefined;
  let lastStatusClass: EcsStatusClass | undefined;
  const maxPolls = Math.max(1, options.maxPolls ?? MAX_VERIFY_POLLS);
  const pollIntervalMs = Math.max(0, options.pollIntervalMs ?? VERIFY_POLL_INTERVAL_MS);

  for (let i = 0; i < maxPolls; i++) {
    try {
      const detail = await getEcsInstanceDetail(instanceId, regionId ? { regionId } : undefined);
      lastStatus = detail.summary.status;
      lastStatusClass = classifyEcsStatus(lastStatus);
      if (ecsStatusMatchesTarget(lastStatus, targetStatuses)) {
        return { status: lastStatus, statusClass: lastStatusClass, reachedTarget: true, timedOut: false };
      }
      if (i < maxPolls - 1 && pollIntervalMs > 0) {
        await sleep(pollIntervalMs);
      }
    } catch {
      // Best effort poll; swallow errors and keep trying.
      if (i < maxPolls - 1 && pollIntervalMs > 0) {
        await sleep(pollIntervalMs);
      }
    }
  }

  return {
    status: lastStatus,
    statusClass: lastStatusClass,
    reachedTarget: ecsStatusMatchesTarget(lastStatus, targetStatuses),
    timedOut: true
  };
}

function isNotFoundReadError(err: unknown): boolean {
  const text = `${String((err as { message?: unknown })?.message || err || '')}`;
  return /not exist|not found|notfound|不存在|未找到/i.test(text);
}

// Bounded polling for delete: re-reads instance detail until it is no longer
// found (the terminal success state for a release), otherwise timedOut=true.
async function pollForDeleteVerify(
  instanceId: string,
  regionId: string | undefined
): Promise<{
  status?: string;
  statusClass?: EcsStatusClass;
  reachedTarget: boolean;
  notFound?: boolean;
  timedOut: boolean;
}> {
  let lastStatus: string | undefined;
  let lastStatusClass: EcsStatusClass | undefined;

  for (let i = 0; i < MAX_VERIFY_POLLS; i++) {
    try {
      const detail = await getEcsInstanceDetail(instanceId, regionId ? { regionId } : undefined);
      lastStatus = detail.summary.status;
      lastStatusClass = classifyEcsStatus(lastStatus);
    } catch (err) {
      if (isNotFoundReadError(err)) {
        return { reachedTarget: true, notFound: true, timedOut: false };
      }
      // Other read errors: keep trying within the bounded window.
    }
    if (i < MAX_VERIFY_POLLS - 1) {
      await sleep(VERIFY_POLL_INTERVAL_MS);
    }
  }

  return {
    status: lastStatus,
    statusClass: lastStatusClass,
    reachedTarget: false,
    notFound: false,
    timedOut: true
  };
}

function printLifecycleResult(
  result: {
    plan: { instanceId: string; regionId: string; currentStatus?: string };
    verify: { status?: string; timedOut?: boolean; reachedTarget: boolean };
    execution?: { requestId?: string };
  },
  actionName: string
) {
  const { plan, verify } = result;
  console.log('');
  console.log(pc.cyan(`ECS ${actionName}结果`));
  console.log(pc.gray('  实例ID: ') + pc.white(plan.instanceId));
  console.log(pc.gray('  地域: ') + pc.white(plan.regionId));
  if (plan.currentStatus) {
    console.log(pc.gray('  操作前状态: ') + pc.white(plan.currentStatus));
  }
  if (verify.status) {
    console.log(pc.gray('  最后观测状态: ') + pc.white(verify.status));
  }
  if (result.execution?.requestId) {
    console.log(pc.gray('  请求ID: ') + pc.white(result.execution.requestId));
  }
  if (verify.timedOut) {
    console.log(pc.yellow('  ⚠ 操作已下发，但因为实例处于过渡态，暂未确认到达目标状态'));
  } else if (verify.reachedTarget) {
    console.log(pc.green('  ✓ 已确认到达目标状态'));
  }
  console.log('');
}

export const ecsStartCommand = defineCliCommand({
  rawName: 'ecs start <instanceId>',
  description: '启动 ECS 实例',
  options: [
    { rawName: '--region <regionId>', description: '实例所在地域；不传则使用当前 licell 默认 region' },
    { rawName: '--dry-run', description: '只构造计划，不实际执行操作' }
  ],
  descriptor: {
    title: 'Start ECS Instance',
    summary: '启动处于 Stopped 状态的 ECS 实例。当前处于 Running 时幂等跳过；处于 Starting/Stopping/Rebooting 过渡态时提示稍后重试。',
    examples: [
      'licell ecs start i-abc123 --dry-run --output json',
      'licell ecs start i-abc123',
      'licell ecs start i-abc123 --region cn-shanghai'
    ],
    related: ['ecs info', 'ecs list', 'ecs reboot'],
    agentTips: [
      '机器调用优先使用 --dry-run 确认计划后再执行。',
      '幂等处理：已处于 Running 时不重复发送 StartInstance API。',
      '过渡态（Starting/Stopping/Rebooting）下不允许操作，提示稍后重试。',
      'Start 免确认直接执行；Start 不支持 Force 参数。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['instanceId', '--region', '--dry-run']
    },
    safety: {
      level: 'mutating',
      reason: '会调用 ECS StartInstance API 启动实例，可能产生费用。建议先 --dry-run 确认。',
      confirmFlags: []
    },
    optionInsights: {
      '--region': {
        whenToUse: '实例不在当前 licell 默认 region 时显式指定。',
        cautions: ['不会跨 region 自动搜索；只影响本次查询，不修改全局默认 region。']
      },
      '--dry-run': {
        whenToUse: '先确认操作计划与前置条件，不实际执行。'
      }
    },
    recommendedFlow: [
      { title: '先查看实例状态', command: 'licell ecs info <instanceId> --output json', reason: '确认当前实例状态是否符合启动条件。' },
      { title: 'Dry run 确认计划', command: 'licell ecs start <instanceId> --dry-run --output json', reason: '查看计划，确认 requiresConfirmation=false 且 willExecute=false。' },
      { title: '执行启动', command: 'licell ecs start <instanceId>', reason: '实际发起启动请求，并轮询确认到达目标状态。' }
    ],
    result: {
      summary: '返回操作计划、执行请求ID（若执行）和最终验证状态。dry-run 时 execution 缺省。',
      fields: [
        { name: 'plan.action', description: '操作类型，值为 start。', required: true },
        { name: 'plan.regionId', description: '实例所在地域。', required: true },
        { name: 'plan.instanceId', description: '实例 ID。', required: true },
        { name: 'plan.currentStatus', description: '操作前 ECS 原生状态。' },
        { name: 'plan.currentStatusClass', description: '操作前归一化状态类别。', required: true },
        { name: 'plan.requiresConfirmation', description: '该操作是否需要确认，start 为 false。', required: true },
        { name: 'plan.willExecute', description: '是否实际执行，--dry-run 时为 false。', required: true },
        { name: 'execution.requestId', description: 'ECS API 返回的 requestId，仅实际执行时存在。' },
        { name: 'verify.status', description: '验证时最后观测到的 ECS 原生状态。' },
        { name: 'verify.statusClass', description: '验证时最后观测到的归一化状态类别。' },
        { name: 'verify.reachedTarget', description: '是否到达目标 ECS 状态（Running/Starting）。', required: true },
        { name: 'verify.timedOut', description: '验证是否因为过渡态超时而未确认到达目标。' }
      ]
    }
  }
});

export const ecsRebootCommand = defineCliCommand({
  rawName: 'ecs reboot <instanceId>',
  description: '重启 ECS 实例',
  options: [
    { rawName: '--region <regionId>', description: '实例所在地域；不传则使用当前 licell 默认 region' },
    { rawName: '--dry-run', description: '只构造计划，不实际执行操作' },
    { rawName: '--yes', description: '跳过交互式确认（非交互模式必须显式提供）' }
  ],
  descriptor: {
    title: 'Reboot ECS Instance',
    summary: '重启处于 Running 状态的 ECS 实例。这是中断操作，会重启实例操作系统；非交互模式必须显式提供 --yes。',
    examples: [
      'licell ecs reboot i-abc123 --dry-run --output json',
      'licell ecs reboot i-abc123 --yes',
      'licell ecs reboot i-abc123 --region cn-shanghai --yes'
    ],
    related: ['ecs info', 'ecs list', 'ecs start'],
    agentTips: [
      '非交互模式必须显式 --yes 才能执行。',
      '过渡态（Starting/Stopping/Rebooting）下不允许操作，提示稍后重试。',
      'Reboot 需要确认；建议先 --dry-run 查看计划，其中 requiresConfirmation=true。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['instanceId', '--region', '--dry-run', '--yes']
    },
    safety: {
      level: 'mutating',
      reason: '会中断实例运行；非交互模式必须显式 --yes 确认。',
      confirmFlags: ['--yes']
    },
    optionInsights: {
      '--region': {
        whenToUse: '实例不在当前 licell 默认 region 时显式指定。',
        cautions: ['不会跨 region 自动搜索；只影响本次查询，不修改全局默认 region。']
      },
      '--dry-run': {
        whenToUse: '先确认操作计划与前置条件，不实际执行。'
      },
      '--yes': {
        whenToUse: '非交互模式下显式确认，跳过交互式确认。'
      }
    },
    recommendedFlow: [
      { title: '先查看实例状态', command: 'licell ecs info <instanceId> --output json', reason: '确认当前实例状态是否符合重启条件。' },
      { title: 'Dry run 确认计划', command: 'licell ecs reboot <instanceId> --dry-run --output json', reason: '查看计划，确认 requiresConfirmation=true 且 willExecute=false。' },
      { title: '执行重启', command: 'licell ecs reboot <instanceId> --yes', reason: '实际发起重启请求，并轮询确认到达目标状态。' }
    ],
    result: {
      summary: '返回操作计划、执行请求ID（若执行）和最终验证状态。dry-run 时 execution 缺省。',
      fields: [
        { name: 'plan.action', description: '操作类型，值为 reboot。', required: true },
        { name: 'plan.regionId', description: '实例所在地域。', required: true },
        { name: 'plan.instanceId', description: '实例 ID。', required: true },
        { name: 'plan.currentStatus', description: '操作前 ECS 原生状态。' },
        { name: 'plan.currentStatusClass', description: '操作前归一化状态类别。', required: true },
        { name: 'plan.requiresConfirmation', description: '该操作是否需要确认，reboot 为 true。', required: true },
        { name: 'plan.willExecute', description: '是否实际执行，--dry-run 时为 false。', required: true },
        { name: 'execution.requestId', description: 'ECS API 返回的 requestId，仅实际执行时存在。' },
        { name: 'verify.status', description: '验证时最后观测到的 ECS 原生状态。' },
        { name: 'verify.statusClass', description: '验证时最后观测到的归一化状态类别。' },
        { name: 'verify.reachedTarget', description: '是否到达目标 ECS 状态（Running/Rebooting/Starting）。', required: true },
        { name: 'verify.timedOut', description: '验证是否因为过渡态超时而未确认到达目标。' }
      ]
    }
  }
});

export const ecsStopCommand = defineCliCommand({
  rawName: 'ecs stop <instanceId>',
  description: '停止 ECS 实例',
  options: [
    { rawName: '--region <regionId>', description: '实例所在地域；不传则使用当前 licell 默认 region' },
    { rawName: '--dry-run', description: '只构造计划，不实际执行操作' },
    { rawName: '--yes', description: '跳过交互式确认（非交互模式必须显式提供）' }
  ],
  descriptor: {
    title: 'Stop ECS Instance',
    summary: '停止处于 Running 状态的 ECS 实例。停止会中断实例上的业务；非交互模式必须显式提供 --yes。当前已 Stopped 时幂等跳过。',
    examples: [
      'licell ecs stop i-abc123 --dry-run --output json',
      'licell ecs stop i-abc123 --yes',
      'licell ecs stop i-abc123 --region cn-shanghai --yes'
    ],
    related: ['ecs info', 'ecs list', 'ecs start', 'ecs reboot'],
    agentTips: [
      '非交互模式必须显式 --yes 才能执行。',
      '停止会中断实例业务；建议先 --dry-run 查看计划，其中 requiresConfirmation=true。',
      '过渡态（Starting/Stopping/Rebooting）下不允许操作，提示稍后重试。',
      '已 Stopped 时幂等跳过，不重复发送 StopInstance API。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['instanceId', '--region', '--dry-run', '--yes']
    },
    safety: {
      level: 'destructive',
      reason: '停止会中断实例上运行的业务；非交互模式必须显式 --yes 确认。',
      confirmFlags: ['--yes']
    },
    optionInsights: {
      '--region': {
        whenToUse: '实例不在当前 licell 默认 region 时显式指定。',
        cautions: ['不会跨 region 自动搜索；只影响本次查询，不修改全局默认 region。']
      },
      '--dry-run': {
        whenToUse: '先确认操作计划与前置条件，不实际执行。'
      },
      '--yes': {
        whenToUse: '非交互模式下显式确认，跳过交互式确认。'
      }
    },
    recommendedFlow: [
      { title: '先查看实例状态', command: 'licell ecs info <instanceId> --output json', reason: '确认当前实例状态是否符合停止条件。' },
      { title: 'Dry run 确认计划', command: 'licell ecs stop <instanceId> --dry-run --output json', reason: '查看计划，确认 requiresConfirmation=true 且 willExecute=false。' },
      { title: '执行停止', command: 'licell ecs stop <instanceId> --yes', reason: '实际发起停止请求，并轮询确认到达 Stopped。' }
    ],
    result: {
      summary: '返回操作计划、执行请求ID（若执行）和最终验证状态。dry-run 时 execution 缺省。',
      fields: [
        { name: 'plan.action', description: '操作类型，值为 stop。', required: true },
        { name: 'plan.regionId', description: '实例所在地域。', required: true },
        { name: 'plan.instanceId', description: '实例 ID。', required: true },
        { name: 'plan.currentStatus', description: '操作前 ECS 原生状态。' },
        { name: 'plan.currentStatusClass', description: '操作前归一化状态类别。', required: true },
        { name: 'plan.requiresConfirmation', description: '该操作是否需要确认，stop 为 true。', required: true },
        { name: 'plan.willExecute', description: '是否实际执行，--dry-run 时为 false。', required: true },
        { name: 'execution.requestId', description: 'ECS API 返回的 requestId，仅实际执行时存在。' },
        { name: 'verify.status', description: '验证时最后观测到的 ECS 原生状态。' },
        { name: 'verify.statusClass', description: '验证时最后观测到的归一化状态类别。' },
        { name: 'verify.reachedTarget', description: '是否到达目标 ECS 状态（Stopped/Stopping）。', required: true },
        { name: 'verify.timedOut', description: '验证是否因为过渡态超时而未确认到达目标。' }
      ]
    }
  }
});

function buildDeleteDescriptor(primary: 'delete' | 'rm'): CommandDescriptor {
  const other = primary === 'delete' ? 'rm' : 'delete';
  return {
    title: primary === 'delete' ? 'Delete (release) ECS Instance' : 'Remove (release) ECS Instance',
    summary: `释放（删除）Stopped 状态的 ECS 实例，操作不可逆。会先读取删除保护与磁盘释放事实：实例未停止、事实不可读或删除保护开启时阻断执行。ecs ${primary} 与 ecs ${other} 是同一操作的别名。`,
    examples: [
      `licell ecs ${primary} i-abc123 --dry-run --output json`,
      `licell ecs ${primary} i-abc123 --yes`,
      `licell ecs ${primary} i-abc123 --region cn-shanghai --yes`
    ],
    related: ['ecs info', 'ecs list', 'ecs stop', `ecs ${other}`],
    agentTips: [
      '删除不可逆；非交互模式必须显式 --yes 才能执行。',
      '仅释放 Stopped 实例；Running 实例请先执行 ecs stop 后再删除。',
      '释放前事实（删除保护、磁盘随实例释放）不可读时阻断执行，不默认放行。',
      '删除保护开启（deletionProtection=true）时阻断并提示先关保护，命令不代关。',
      `ecs ${primary} 与 ecs ${other} 行为完全一致。`
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['instanceId', '--region', '--dry-run', '--yes']
    },
    safety: {
      level: 'destructive' as const,
      reason: '会释放（删除）ECS 实例，操作不可逆；非交互模式必须显式 --yes 确认。',
      confirmFlags: ['--yes']
    },
    optionInsights: {
      '--region': {
        whenToUse: '实例不在当前 licell 默认 region 时显式指定。',
        cautions: ['不会跨 region 自动搜索；只影响本次查询，不修改全局默认 region。']
      },
      '--dry-run': {
        whenToUse: '先确认操作计划与释放前事实，不实际执行。'
      },
      '--yes': {
        whenToUse: '非交互模式下显式确认；交互模式下跳过两次确认 prompt。'
      }
    },
    recommendedFlow: [
      { title: '先查看实例状态', command: 'licell ecs info <instanceId> --output json', reason: '确认要删除的实例正确，且当前状态为 Stopped。' },
      { title: '必要时先停止实例', command: 'licell ecs stop <instanceId> --yes', reason: 'delete/rm 只释放已停止实例，不对 Running 实例执行强制释放。' },
      { title: 'Dry run 确认计划与释放事实', command: `licell ecs ${primary} <instanceId> --dry-run --output json`, reason: '查看 plan.releaseFacts 与 willExecute=false。' },
      { title: '执行删除', command: `licell ecs ${primary} <instanceId> --yes`, reason: '实际释放实例，并轮询确认 not-found 终态。' }
    ],
    result: {
      summary: '返回操作计划（含 releaseFacts）、执行请求ID（若执行）和最终验证状态。dry-run 时 execution 缺省。',
      fields: [
        { name: 'plan.action', description: '操作类型，值为 delete。', required: true },
        { name: 'plan.regionId', description: '实例所在地域。', required: true },
        { name: 'plan.instanceId', description: '实例 ID。', required: true },
        { name: 'plan.currentStatus', description: '操作前 ECS 原生状态。' },
        { name: 'plan.currentStatusClass', description: '操作前归一化状态类别。', required: true },
        { name: 'plan.requiresConfirmation', description: '该操作是否需要确认，delete 为 true。', required: true },
        { name: 'plan.willExecute', description: '是否实际执行，--dry-run 时为 false。', required: true },
        { name: 'plan.releaseFacts', description: '释放前事实：deletionProtection / deleteWithDisks / releaseBehavior。', required: true },
        { name: 'execution.requestId', description: 'ECS API 返回的 requestId，仅实际执行时存在。' },
        { name: 'verify.notFound', description: '删除后实例是否已不可查询（true 表示释放终态成功）。', required: true },
        { name: 'verify.reachedTarget', description: '是否到达删除终态（not-found）。', required: true },
        { name: 'verify.timedOut', description: '验证是否超时仍能查询到实例。' }
      ]
    }
  };
}

export const ecsDeleteCommand = defineCliCommand({
  rawName: 'ecs delete <instanceId>',
  description: '删除（释放）ECS 实例',
  options: [
    { rawName: '--region <regionId>', description: '实例所在地域；不传则使用当前 licell 默认 region' },
    { rawName: '--dry-run', description: '只构造计划并读取释放前事实，不实际执行操作' },
    { rawName: '--yes', description: '跳过交互式确认（非交互模式必须显式提供）' }
  ],
  descriptor: buildDeleteDescriptor('delete')
});

export const ecsRmCommand = defineCliCommand({
  rawName: 'ecs rm <instanceId>',
  description: '删除（释放）ECS 实例（delete 的别名）',
  options: [
    { rawName: '--region <regionId>', description: '实例所在地域；不传则使用当前 licell 默认 region' },
    { rawName: '--dry-run', description: '只构造计划并读取释放前事实，不实际执行操作' },
    { rawName: '--yes', description: '跳过交互式确认（非交互模式必须显式提供）' }
  ],
  descriptor: buildDeleteDescriptor('rm')
});

// Shared delete action used by both `ecs delete` and `ecs rm`.
function registerEcsDeleteAction(cli: CAC, command: DeclaredCliCommand) {
  registerCliCommand(cli, command)
    .action(async (instanceId: string, options: { region?: unknown; dryRun?: unknown; yes?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(command),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['ecs']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const regionId = toOptionalString(options.region);
          const dryRun = Boolean(options.dryRun);
          const yes = Boolean(options.yes);
          const s = createSpinner();

          const detail = await withSpinner(
            s,
            '正在检查实例状态...',
            '构造计划失败',
            () => getEcsInstanceDetail(normalizedId, regionId ? { regionId } : undefined)
          );
          if (!detail) return;

          const currentStatus = detail.summary.status;
          const currentStatusClass = classifyEcsStatus(currentStatus);
          const resolvedRegion = detail.summary.regionId || regionId || '';
          const resolvedId = detail.summary.instanceId;

          if (currentStatusClass !== 'stopped-like') {
            if (currentStatusClass === 'transitional') {
              throw new Error('实例当前处于过渡态（' + currentStatus + '），请稍后重试删除');
            }
            if (currentStatusClass === 'running-like') {
              throw new Error('实例当前状态（' + currentStatus + '）不符合删除条件；请先执行 licell ecs stop ' + resolvedId + ' --yes 将实例停止后再删除');
            }
            throw new Error('实例当前状态（' + currentStatus + '）不符合删除条件，请先确认实例为 Stopped');
          }

          // Read pre-release facts; unreadable => block (RMR-001).
          const facts = await withSpinner(
            s,
            '正在读取释放前事实...',
            '释放前事实读取失败',
            () => getEcsInstanceReleaseFacts({ instanceId: resolvedId, regionId: resolvedRegion || undefined })
          );
          if (!facts) return;

          const releaseFacts = {
            ...(facts.deletionProtection !== undefined ? { deletionProtection: facts.deletionProtection } : {}),
            deleteWithDisks: (facts.disks || []).some((disk) => disk.deleteWithInstance === true),
            ...(facts.releaseBehavior ? { releaseBehavior: facts.releaseBehavior } : {})
          };

          // Deletion protection => block (do not disable it on the user's behalf).
          if (facts.deletionProtection === true) {
            throw new Error('实例已开启删除保护（deletionProtection=true），已阻断删除；请先在控制台关闭删除保护后重试');
          }

          const plan = {
            action: 'delete' as const,
            regionId: resolvedRegion,
            instanceId: resolvedId,
            currentStatus,
            currentStatusClass,
            plannedRequest: { instanceId: resolvedId, regionId: resolvedRegion || regionId },
            requiredCapabilities: ['ecs'] as const,
            requiresConfirmation: true,
            willExecute: !dryRun,
            releaseFacts
          };

          if (dryRun) {
            const result = {
              plan: { ...plan, willExecute: false },
              verify: { reachedTarget: false, notFound: false }
            };
            if (isJsonOutput()) {
              emitCommandResult(result);
            } else {
              s.stop(pc.green('构造计划成功'));
              console.log(pc.gray('  实例ID: ') + pc.white(plan.instanceId));
              console.log(pc.gray('  地域: ') + pc.white(plan.regionId));
              console.log(pc.gray('  当前状态: ') + pc.white(currentStatus || 'unknown'));
              console.log(pc.gray('  删除保护: ') + pc.white(String(facts.deletionProtection ?? 'unknown')));
              console.log(pc.gray('  磁盘随实例释放: ') + pc.white(String(releaseFacts.deleteWithDisks)));
              console.log(pc.gray('  释放行为: ') + pc.white(facts.releaseBehavior || 'unknown'));
              console.log(pc.cyan('  --dry-run 模式，不会实际执行'));
              console.log('');
              showOutro('Done (dry-run)');
            }
            return;
          }

          // Double confirmation (delete semantics): --yes skips; interactive => two prompts; non-interactive no --yes => throws.
          await ensureDestructiveActionConfirmed('删除实例', {
            yes,
            interactiveTTY: isInteractiveTTY()
          });

          const execution = await withSpinner(
            s,
            '正在发送删除请求...',
            '删除请求失败',
            () => deleteEcsInstance({ instanceId: plan.instanceId, regionId: plan.regionId })
          );
          if (!execution) return;

          const verify = await withSpinner(
            s,
            '正在等待实例释放...',
            '状态验证失败',
            () => pollForDeleteVerify(plan.instanceId, plan.regionId)
          );
          if (!verify) return;

          const result = { plan, execution, verify };
          if (isJsonOutput()) {
            emitCommandResult(result);
          } else {
            s.stop(pc.green('删除操作完成'));
            console.log('');
            console.log(pc.cyan('ECS 删除结果'));
            console.log(pc.gray('  实例ID: ') + pc.white(plan.instanceId));
            console.log(pc.gray('  地域: ') + pc.white(plan.regionId));
            if (execution.requestId) console.log(pc.gray('  请求ID: ') + pc.white(execution.requestId));
            if (verify.notFound) {
              console.log(pc.green('  ✓ 实例已释放（not-found 终态）'));
            } else if (verify.timedOut) {
              console.log(pc.yellow('  ⚠ 删除已下发，但暂未确认实例完全释放'));
            }
            console.log('');
            showOutro('Done.');
          }
        }
      );
    });
}

export function registerEcsLifecycleCommands(cli: CAC) {
  registerCliCommand(cli, ecsStartCommand)
    .action(async (instanceId: string, options: { region?: unknown; dryRun?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ecsStartCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['ecs']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const regionId = toOptionalString(options.region);
          const dryRun = Boolean(options.dryRun);
          const s = createSpinner();

          const detail = await withSpinner(
            s,
            '正在检查实例状态...',
            '构造计划失败',
            () => getEcsInstanceDetail(normalizedId, regionId ? { regionId } : undefined)
          );
          if (!detail) return;

          const currentStatus = detail.summary.status;
          const currentStatusClass = classifyEcsStatus(currentStatus);
          const plan = {
            action: 'start' as const,
            regionId: detail.summary.regionId || regionId || '',
            instanceId: detail.summary.instanceId,
            currentStatus,
            currentStatusClass,
            plannedRequest: {
              instanceId: detail.summary.instanceId,
              regionId: detail.summary.regionId || regionId
            },
            requiredCapabilities: ['ecs'] as const,
            requiresConfirmation: false,
            willExecute: !dryRun
          };

          // Idempotent: already running-like.
          if (currentStatusClass === 'running-like') {
            const result = {
              plan: { ...plan, willExecute: false },
              verify: { status: currentStatus, statusClass: currentStatusClass, reachedTarget: true }
            };
            if (isJsonOutput()) {
              emitCommandResult(result);
            } else {
              s.stop(pc.yellow('实例当前状态已为 ' + currentStatus + '，无需重复启动'));
              printLifecycleResult(result, '启动');
              showOutro('Done (idempotent)');
            }
            return;
          }

          // Precheck: start requires stopped-like source.
          if (currentStatusClass !== 'stopped-like') {
            if (currentStatusClass === 'transitional') {
              throw new Error('实例当前处于过渡态（' + currentStatus + '），请稍后重试');
            }
            throw new Error('实例当前状态（' + currentStatus + '）不符合启动条件，请先确认实例为 Stopped');
          }

          if (dryRun) {
            const result = {
              plan: { ...plan, willExecute: false },
              verify: { status: currentStatus, statusClass: currentStatusClass, reachedTarget: false }
            };
            if (isJsonOutput()) {
              emitCommandResult(result);
            } else {
              s.stop(pc.green('构造计划成功'));
              console.log(pc.gray('  实例ID: ') + pc.white(plan.instanceId));
              console.log(pc.gray('  地域: ') + pc.white(plan.regionId));
              console.log(pc.gray('  当前状态: ') + pc.white(currentStatus || 'unknown'));
              console.log(pc.cyan('  --dry-run 模式，不会实际执行'));
              console.log('');
              showOutro('Done (dry-run)');
            }
            return;
          }

          const execution = await withSpinner(
            s,
            '正在发送启动请求...',
            '启动请求失败',
            () => startEcsInstance({ instanceId: plan.instanceId, regionId: plan.regionId })
          );
          if (!execution) return;

          const verify = await withSpinner(
            s,
            '正在等待实例到达目标状态...',
            '状态验证失败',
            () => pollForVerify(plan.instanceId, plan.regionId, ['Running', 'Starting'])
          );
          if (!verify) return;

          const result = { plan, execution, verify };
          if (isJsonOutput()) {
            emitCommandResult(result);
          } else {
            s.stop(pc.green('启动操作完成'));
            printLifecycleResult(result, '启动');
            showOutro('Done.');
          }
        }
      );
    });

  registerCliCommand(cli, ecsRebootCommand)
    .action(async (instanceId: string, options: { region?: unknown; dryRun?: unknown; yes?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ecsRebootCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['ecs']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const regionId = toOptionalString(options.region);
          const dryRun = Boolean(options.dryRun);
          const yes = Boolean(options.yes);
          const s = createSpinner();

          const detail = await withSpinner(
            s,
            '正在检查实例状态...',
            '构造计划失败',
            () => getEcsInstanceDetail(normalizedId, regionId ? { regionId } : undefined)
          );
          if (!detail) return;

          const currentStatus = detail.summary.status;
          const currentStatusClass = classifyEcsStatus(currentStatus);
          const plan = {
            action: 'reboot' as const,
            regionId: detail.summary.regionId || regionId || '',
            instanceId: detail.summary.instanceId,
            currentStatus,
            currentStatusClass,
            plannedRequest: {
              instanceId: detail.summary.instanceId,
              regionId: detail.summary.regionId || regionId
            },
            requiredCapabilities: ['ecs'] as const,
            requiresConfirmation: true,
            willExecute: !dryRun
          };

          // Precheck: reboot requires running-like source (executable, not idempotent).
          if (currentStatusClass !== 'running-like') {
            if (currentStatusClass === 'transitional') {
              throw new Error('实例当前处于过渡态（' + currentStatus + '），请稍后重试');
            }
            throw new Error('实例当前状态（' + currentStatus + '）不符合重启条件，请先确认实例为 Running');
          }

          if (dryRun) {
            const result = {
              plan: { ...plan, willExecute: false },
              verify: { status: currentStatus, statusClass: currentStatusClass, reachedTarget: false }
            };
            if (isJsonOutput()) {
              emitCommandResult(result);
            } else {
              s.stop(pc.green('构造计划成功'));
              console.log(pc.gray('  实例ID: ') + pc.white(plan.instanceId));
              console.log(pc.gray('  地域: ') + pc.white(plan.regionId));
              console.log(pc.gray('  当前状态: ') + pc.white(currentStatus || 'unknown'));
              console.log(pc.cyan('  --dry-run 模式，不会实际执行'));
              console.log('');
              showOutro('Done (dry-run)');
            }
            return;
          }

          await ensureHighImpactActionConfirmed('重启实例', {
            yes,
            interactiveTTY: isInteractiveTTY()
          });

          const execution = await withSpinner(
            s,
            '正在发送重启请求...',
            '重启请求失败',
            () => rebootEcsInstance({ instanceId: plan.instanceId, regionId: plan.regionId })
          );
          if (!execution) return;

          const verify = await withSpinner(
            s,
            '正在等待实例到达目标状态...',
            '状态验证失败',
            () => pollForVerify(plan.instanceId, plan.regionId, ['Running', 'Rebooting', 'Starting'])
          );
          if (!verify) return;

          const result = { plan, execution, verify };
          if (isJsonOutput()) {
            emitCommandResult(result);
          } else {
            s.stop(pc.green('重启操作完成'));
            printLifecycleResult(result, '重启');
            showOutro('Done.');
          }
        }
      );
    });

  registerCliCommand(cli, ecsStopCommand)
    .action(async (instanceId: string, options: { region?: unknown; dryRun?: unknown; yes?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(ecsStopCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['ecs']
        },
        async () => {
          ensureAuthOrExit();
          const normalizedId = toPromptValue(instanceId, 'instanceId');
          const regionId = toOptionalString(options.region);
          const dryRun = Boolean(options.dryRun);
          const yes = Boolean(options.yes);
          const s = createSpinner();

          const detail = await withSpinner(
            s,
            '正在检查实例状态...',
            '构造计划失败',
            () => getEcsInstanceDetail(normalizedId, regionId ? { regionId } : undefined)
          );
          if (!detail) return;

          const currentStatus = detail.summary.status;
          const currentStatusClass = classifyEcsStatus(currentStatus);
          const plan = {
            action: 'stop' as const,
            regionId: detail.summary.regionId || regionId || '',
            instanceId: detail.summary.instanceId,
            currentStatus,
            currentStatusClass,
            plannedRequest: {
              instanceId: detail.summary.instanceId,
              regionId: detail.summary.regionId || regionId
            },
            requiredCapabilities: ['ecs'] as const,
            requiresConfirmation: true,
            willExecute: !dryRun
          };

          // Idempotent: already stopped-like.
          if (currentStatusClass === 'stopped-like') {
            const result = {
              plan: { ...plan, willExecute: false },
              verify: { status: currentStatus, statusClass: currentStatusClass, reachedTarget: true }
            };
            if (isJsonOutput()) {
              emitCommandResult(result);
            } else {
              s.stop(pc.yellow('实例当前状态已为 ' + currentStatus + '，无需重复停止'));
              printLifecycleResult(result, '停止');
              showOutro('Done (idempotent)');
            }
            return;
          }

          // Precheck: stop requires running-like source.
          if (currentStatusClass !== 'running-like') {
            if (currentStatusClass === 'transitional') {
              throw new Error('实例当前处于过渡态（' + currentStatus + '），请稍后重试');
            }
            throw new Error('实例当前状态（' + currentStatus + '）不符合停止条件，请先确认实例为 Running');
          }

          if (dryRun) {
            const result = {
              plan: { ...plan, willExecute: false },
              verify: { status: currentStatus, statusClass: currentStatusClass, reachedTarget: false }
            };
            if (isJsonOutput()) {
              emitCommandResult(result);
            } else {
              s.stop(pc.green('构造计划成功'));
              console.log(pc.gray('  实例ID: ') + pc.white(plan.instanceId));
              console.log(pc.gray('  地域: ') + pc.white(plan.regionId));
              console.log(pc.gray('  当前状态: ') + pc.white(currentStatus || 'unknown'));
              console.log(pc.cyan('  --dry-run 模式，不会实际执行'));
              console.log('');
              showOutro('Done (dry-run)');
            }
            return;
          }

          await ensureHighImpactActionConfirmed('停止实例', {
            yes,
            interruption: true,
            interactiveTTY: isInteractiveTTY()
          });

          const execution = await withSpinner(
            s,
            '正在发送停止请求...',
            '停止请求失败',
            () => stopEcsInstance({ instanceId: plan.instanceId, regionId: plan.regionId })
          );
          if (!execution) return;

          const verify = await withSpinner(
            s,
            '正在等待实例到达目标状态...',
            '状态验证失败',
            () => pollForVerify(plan.instanceId, plan.regionId, ['Stopped', 'Stopping'])
          );
          if (!verify) return;

          const result = { plan, execution, verify };
          if (isJsonOutput()) {
            emitCommandResult(result);
          } else {
            s.stop(pc.green('停止操作完成'));
            printLifecycleResult(result, '停止');
            showOutro('Done.');
          }
        }
      );
    });

  registerEcsDeleteAction(cli, ecsDeleteCommand);
  registerEcsDeleteAction(cli, ecsRmCommand);
}
