import type { CAC } from 'cac';
import pc from 'picocolors';
import {
  getEcsInstanceDetail,
  startEcsInstance,
  rebootEcsInstance,
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
  ensureHighImpactActionConfirmed
} from '../utils/cli-shared';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, registerCliCommand } from './module';

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Bounded polling: re-reads instance detail up to MAX_VERIFY_POLLS times until a
// target status class is observed, otherwise returns timedOut=true (not a failure).
export async function pollForVerify(
  instanceId: string,
  regionId: string | undefined,
  targetClasses: EcsStatusClass[]
): Promise<{
  status?: string;
  statusClass?: EcsStatusClass;
  reachedTarget: boolean;
  timedOut: boolean;
}> {
  let lastStatus: string | undefined;
  let lastStatusClass: EcsStatusClass | undefined;

  for (let i = 0; i < MAX_VERIFY_POLLS; i++) {
    try {
      const detail = await getEcsInstanceDetail(instanceId, regionId ? { regionId } : undefined);
      lastStatus = detail.summary.status;
      lastStatusClass = classifyEcsStatus(lastStatus);
      if (targetClasses.includes(lastStatusClass)) {
        return { status: lastStatus, statusClass: lastStatusClass, reachedTarget: true, timedOut: false };
      }
      if (i < MAX_VERIFY_POLLS - 1) {
        await sleep(VERIFY_POLL_INTERVAL_MS);
      }
    } catch {
      // Best effort poll; swallow errors and keep trying.
      if (i < MAX_VERIFY_POLLS - 1) {
        await sleep(VERIFY_POLL_INTERVAL_MS);
      }
    }
  }

  return {
    status: lastStatus,
    statusClass: lastStatusClass,
    reachedTarget: lastStatusClass ? targetClasses.includes(lastStatusClass) : false,
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
        { name: 'verify.reachedTarget', description: '是否到达目标状态类别（Running/Starting）。', required: true },
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
        { name: 'verify.reachedTarget', description: '是否到达目标状态类别（Running/Rebooting/Starting）。', required: true },
        { name: 'verify.timedOut', description: '验证是否因为过渡态超时而未确认到达目标。' }
      ]
    }
  }
});

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
            () => pollForVerify(plan.instanceId, plan.regionId, ['running-like', 'transitional'])
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
            () => pollForVerify(plan.instanceId, plan.regionId, ['running-like', 'transitional'])
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
}
