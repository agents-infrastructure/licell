import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { Config } from '../utils/config';
import {
  getAsyncTask,
  getAsyncInvokeConfig,
  invokeFunctionAsync,
  listAsyncTasks,
  removeAsyncInvokeConfig,
  stopAsyncTask,
  upsertAsyncInvokeConfig,
  type AsyncInvokeConfigSummary
} from '../providers/fc';
import {
  createSpinner,
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  isInteractiveTTY,
  parseListLimit,
  showOutro,
  toOptionalString,
  withSpinner
} from '../utils/cli-shared';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { resolveOptionalPayloadInput } from '../utils/payload-input';
import { DELIVERY_SECTION } from './sections';

const taskConfigCommand = defineCliCommand({
  rawName: 'task config [name]',
  description: '查看任务函数的异步调用配置',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' }
  ],
  descriptor: {
    title: 'Inspect async task invoke config',
    examples: [
      'licell task config image-worker',
      'licell task config image-worker --target prod',
      'licell task config --output json'
    ],
    recommendedFlow: [
      { title: '查看当前配置', command: 'licell task config [name] --output json', reason: '先确认 asyncTask、重试次数、事件时效与回调目的地。' },
      { title: '更新配置', command: 'licell task config set [name] --output json', reason: '按任务函数的投递/回调策略写入 async invoke config。' },
      { title: '验证执行', command: 'licell task invoke [name] --output json', reason: '提交一个异步任务，验证配置已经生效。' }
    ],
    result: {
      outcomeKey: 'configured',
      fields: [
        { name: 'functionName', description: '函数名。', required: true },
        { name: 'qualifier', description: 'alias/version；未传则为 `LATEST`。', required: true },
        { name: 'configured', description: '当前 qualifier 是否已存在 async invoke config。', required: true },
        { name: 'asyncTask', description: '是否启用 asyncTask；未配置时为 `null`。', required: true },
        { name: 'maxAsyncRetryAttempts', description: '最大异步重试次数；未配置时为 `null`。', required: true },
        { name: 'maxAsyncEventAgeInSeconds', description: '异步事件最大存活秒数；未配置时为 `null`。', required: true },
        { name: 'destinationConfig', description: '成功/失败回调目的地；未配置时为 `null`。', required: true },
        { name: 'destinationConfig.onSuccess', description: '成功回调目的地 ARN。' },
        { name: 'destinationConfig.onFailure', description: '失败回调目的地 ARN。' }
      ]
    }
  }
});

const taskConfigSetCommand = defineCliCommand({
  rawName: 'task config set [name]',
  description: '写入任务函数的异步调用配置',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' },
    { rawName: '--enable', description: '显式启用 asyncTask（默认行为）' },
    { rawName: '--disable', description: '显式关闭 asyncTask' },
    { rawName: '--max-retry-attempts <n>', description: '设置最大异步重试次数（整数，支持 0）' },
    { rawName: '--max-event-age <seconds>', description: '设置异步事件最大存活秒数（正整数）' },
    { rawName: '--on-success <destination>', description: '设置成功回调目的地 ARN' },
    { rawName: '--on-failure <destination>', description: '设置失败回调目的地 ARN' },
    { rawName: '--clear-on-success', description: '清除成功回调目的地' },
    { rawName: '--clear-on-failure', description: '清除失败回调目的地' }
  ],
  descriptor: {
    title: 'Upsert async task invoke config',
    notes: [
      '默认会先读取当前 async invoke config，再做合并写回，避免把未显式修改的字段丢掉。',
      '如果目标 qualifier 还没有配置，直接执行 `task config set` 会创建最小可用配置，并默认启用 asyncTask。'
    ],
    examples: [
      'licell task config set image-worker --target prod',
      'licell task config set image-worker --max-retry-attempts 0 --max-event-age 600',
      'licell task config set image-worker --on-failure acs:mns:cn-hangzhou:123:/queues/dlq/messages'
    ],
    optionInsights: {
      '--target': {
        whenToUse: '需要单独调整某个 alias/version 的任务配置，而不是修改 LATEST 时使用。',
        cautions: ['`task invoke --target <alias>` 只会命中对应 qualifier 的 async invoke config。']
      },
      '--max-retry-attempts': {
        whenToUse: '需要限制重复执行次数时使用；任务幂等性较弱时通常建议显式设为 `0` 或较小值。',
        cautions: ['值越大，因瞬时错误导致的重复执行概率越高。']
      },
      '--max-event-age': {
        whenToUse: '需要限制异步事件在队列中的最长存活时间时使用。',
        cautions: ['超过时效的事件会被丢弃，不会继续执行。']
      },
      '--on-success': {
        whenToUse: '需要在任务成功后投递回调到另一个云资源时使用。',
        cautions: ['请确保目标 ARN 存在且当前函数角色具备投递权限。']
      },
      '--on-failure': {
        whenToUse: '需要把失败任务统一投递到死信/补偿链路时使用。',
        cautions: ['请结合 `task info` 与目标服务日志一起排查失败原因。']
      }
    },
    recommendedFlow: [
      { title: '先看当前值', command: 'licell task config [name] --output json', reason: '避免误覆盖 alias 级别的现有 async 配置。' },
      { title: '写入配置', command: 'licell task config set [name] --output json', reason: '按任务执行语义配置 asyncTask、重试和回调。' },
      { title: '提交一次任务验证', command: 'licell task invoke [name] --output json', reason: '确保调用能成功进入任务队列。' }
    ],
    safety: {
      level: 'mutating',
      reason: '会修改函数或 alias/version 上的 async invoke config。'
    },
    result: {
      outcomeKey: 'configured',
      fields: [
        { name: 'functionName', description: '函数名。', required: true },
        { name: 'qualifier', description: 'alias/version；未传则为 `LATEST`。', required: true },
        { name: 'configured', description: '写入后始终为 `true`。', required: true },
        { name: 'asyncTask', description: '写入后的 asyncTask 开关。', required: true },
        { name: 'maxAsyncRetryAttempts', description: '写入后的最大异步重试次数；未配置时为 `null`。', required: true },
        { name: 'maxAsyncEventAgeInSeconds', description: '写入后的异步事件最大存活秒数；未配置时为 `null`。', required: true },
        { name: 'destinationConfig', description: '写入后的成功/失败回调目的地；未配置时为 `null`。', required: true }
      ]
    }
  }
});

const taskConfigRmCommand = defineCliCommand({
  rawName: 'task config rm [name]',
  description: '删除任务函数的异步调用配置',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' },
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ],
  descriptor: {
    title: 'Delete async task invoke config',
    notes: ['删除后，该 qualifier 上的 `licell task invoke` 将不可用，直到重新执行 `task config set` 或 `deploy --type task`。'],
    examples: [
      'licell task config rm image-worker --target prod',
      'licell task config rm image-worker --yes --output json'
    ],
    safety: {
      level: 'destructive',
      reason: '会删除函数或 alias/version 上的 async invoke config，并让该 qualifier 失去任务调用能力。',
      confirmFlags: ['--yes']
    },
    recommendedFlow: [
      { title: '先确认当前配置', command: 'licell task config [name] --output json', reason: '避免误删正在承接流量的 qualifier 配置。' },
      { title: '删除配置', command: 'licell task config rm [name] --yes --output json', reason: '清理不再使用的 async invoke config。' },
      { title: '必要时重新写回', command: 'licell task config set [name] --output json', reason: '若后续仍需任务能力，可直接重建最小配置。' }
    ],
    result: {
      outcomeKey: 'removed',
      fields: [
        { name: 'functionName', description: '函数名。', required: true },
        { name: 'qualifier', description: 'alias/version；未传则为 `LATEST`。', required: true },
        { name: 'removed', description: '是否实际删除到了 async invoke config。', required: true }
      ]
    }
  }
});

const taskInvokeCommand = defineCliCommand({
  rawName: 'task invoke [name]',
  description: '异步调用任务函数',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' },
    { rawName: '--payload <text>', description: '传入原始 payload 文本' },
    { rawName: '--file <path>', description: '从文件读取 payload' },
    { rawName: '--task-id <id>', description: '自定义业务任务 ID（便于后续查询）' }
  ],
  descriptor: {
    title: 'Invoke task function asynchronously',
    notes: [
      '调用前会先检查目标 qualifier 上是否存在 async invoke config，且 `asyncTask=true`。',
      '建议缓存返回的 `taskId`；后续 `task info`、`task list`、`task stop` 都以它为追踪主键。'
    ],
    examples: [
      'licell task invoke image-worker --payload \'{"image":"a.png"}\'',
      'licell task invoke image-worker --target prod --task-id image-a',
      'licell task invoke --file payload.json --output json'
    ],
    optionInsights: {
      '--target': {
        whenToUse: '需要命中某个 alias/version 的任务入口时使用。',
        cautions: ['只会使用该 qualifier 上的 async invoke config；若没有配置会直接失败。']
      },
      '--payload': {
        whenToUse: 'payload 很短，适合直接内联传入时使用。',
        cautions: ['复杂 JSON 更建议改用 `--file`，避免 shell 转义错误。']
      },
      '--task-id': {
        whenToUse: '需要把业务 ID 映射到 FC 异步任务，便于后续查找与幂等控制时使用。',
        cautions: ['必须满足 FC taskId 的格式限制；无效字符会直接报错。']
      }
    },
    recommendedFlow: [
      { title: '先确认 async 配置', command: 'licell task config [name] --output json', reason: '避免在目标 qualifier 没有启用 asyncTask 时直接调用失败。' },
      { title: '提交异步任务', command: 'licell task invoke [name] --output json', reason: '拿到 `taskId`，作为后续跟踪状态与止损的唯一入口。' },
      { title: '查询任务详情', command: 'licell task info <taskId> [name] --output json', reason: '查看状态、返回值与失败原因。' }
    ],
    result: {
      outcomeKey: 'taskId',
      fields: [
        { name: 'functionName', description: '被调用的函数名。', required: true },
        { name: 'qualifier', description: 'alias/version；未传则为 LATEST。' },
        { name: 'taskId', description: '异步任务 ID；后续可用于 task info/list/stop。' },
        { name: 'statusCode', description: 'FC InvokeFunction 返回状态码。', required: true },
        { name: 'invocationType', description: '固定为 `Async`。', required: true },
        { name: 'body', description: 'FC InvokeFunction 返回的原始 body。', required: true }
      ]
    }
  }
});

const taskListCommand = defineCliCommand({
  rawName: 'task list [name]',
  description: '查看任务函数的异步任务列表',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' },
    { rawName: '--status <status>', description: '按任务状态过滤（如 Running/Succeeded/Failed/Stopped）' },
    { rawName: '--prefix <prefix>', description: '按任务 ID 前缀过滤' },
    { rawName: '--limit <n>', description: '返回数量，默认 20，最大 200' },
    { rawName: '--include-payload', description: '让 FC 在列表中携带任务 payload（如服务端支持）' },
    { rawName: '--sort <order>', description: '按时间排序：asc 或 desc' },
    { rawName: '--started-time-begin <ms>', description: '按开始时间过滤（毫秒时间戳）' },
    { rawName: '--started-time-end <ms>', description: '按开始时间过滤（毫秒时间戳）' }
  ],
  descriptor: {
    title: 'List async task executions',
    notes: [
      '适合按状态、前缀或时间窗扫描一批异步任务；若已知 `taskId`，优先直接用 `task info` 精确查询。',
      '结果里的 `tasks[]` 是摘要视图；需要完整事件流、return payload 或错误详情时，再继续查 `task info`。'
    ],
    examples: [
      'licell task list image-worker --target prod',
      'licell task list --status Running --limit 50',
      'licell task list --output json'
    ],
    optionInsights: {
      '--status': {
        whenToUse: '只想看某个生命周期状态，例如 `Running`、`Succeeded`、`Failed`、`Stopped` 时使用。',
        cautions: ['如果排查“刚提交但尚未开始”的任务，建议不要过早加过窄的状态过滤。']
      },
      '--prefix': {
        whenToUse: '你给任务设置了稳定前缀型 `--task-id` 时使用，适合按业务批次筛选。',
        cautions: ['仅按前缀匹配，不做模糊包含。']
      },
      '--limit': {
        whenToUse: '需要扩大扫描窗口时使用。',
        cautions: ['单次最大 200；更大的历史扫描建议配合时间窗反复查询。']
      },
      '--sort': {
        whenToUse: '需要按时间升序/降序查看任务时使用。',
        cautions: ['默认排序由 FC 服务端决定；排查最近任务时通常建议用 `desc`。']
      }
    },
    recommendedFlow: [
      { title: '先列出任务摘要', command: 'licell task list [name] --output json', reason: '快速定位最近的任务、状态分布和可继续下钻的 `taskId`。' },
      { title: '查看单个任务详情', command: 'licell task info <taskId> [name] --output json', reason: '对某个异常或已完成任务读取 return payload、事件流与失败原因。' },
      { title: '必要时终止运行中任务', command: 'licell task stop <taskId> [name] --output json', reason: '当任务持续 Running 或需要人工止损时，直接发起停止。' }
    ],
    agentTips: ['Agent 如果已经拿到明确 `taskId`，应优先调用 `task info`；`task list` 更适合扫描、补偿和兜底发现。'],
    result: {
      summary: '返回任务摘要数组；适合做轮询、状态聚合与后续挑选 `taskId`。',
      fields: [
        { name: 'functionName', description: '函数名。', required: true },
        { name: 'qualifier', description: 'alias/version；未传则为 `null`。', required: true },
        { name: 'count', description: '本次返回的任务数量。', required: true },
        { name: 'tasks[]', description: '异步任务摘要数组。', required: true },
        { name: 'tasks[].taskId', description: '异步任务 ID。', required: true },
        { name: 'tasks[].status', description: '任务状态。' },
        { name: 'tasks[].startedTime', description: '任务开始时间（毫秒时间戳）。' },
        { name: 'tasks[].endTime', description: '任务结束时间（毫秒时间戳）。' },
        { name: 'tasks[].durationMs', description: '任务执行时长（毫秒）。' },
        { name: 'tasks[].alreadyRetriedTimes', description: '已重试次数。' },
        { name: 'tasks[].destinationStatus', description: '回调目的地投递状态。' },
        { name: 'tasks[].qualifier', description: '任务实际命中的 qualifier。' },
        { name: 'tasks[].requestId', description: 'FC requestId。' },
        { name: 'tasks[].taskErrorMessage', description: '失败原因（若任务失败）。' },
        { name: 'nextToken', description: '服务端下一页游标；若为 `null` 代表没有更多结果。', required: true }
      ]
    }
  }
});

const taskInfoCommand = defineCliCommand({
  rawName: 'task info <taskId> [name]',
  description: '查看单个异步任务详情',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' }
  ],
  descriptor: {
    title: 'Get async task detail',
    notes: ['`<taskId>` 通常来自 `task invoke` 的返回结果，或从 `task list` 的摘要数组里挑选。'],
    examples: [
      'licell task info task-123 image-worker',
      'licell task info task-123 --target prod --output json'
    ],
    argumentHints: {
      taskId: '来自 `licell task invoke` 的返回值，或先通过 `licell task list` 扫描获得。'
    },
    recommendedFlow: [
      { title: '先获得 taskId', command: 'licell task invoke [name] --output json', reason: '直接提交一个新任务，并把返回的 `taskId` 带入后续排查。' },
      { title: '读取任务详情', command: 'licell task info <taskId> [name] --output json', reason: '查看状态、return payload、事件流和失败原因。' },
      { title: '必要时结合日志排查', command: 'licell fn logs [name] --once --output json', reason: '当 `taskErrorMessage` 或 `returnPayload` 仍不足以定位问题时，继续查看函数日志。' }
    ],
    result: {
      outcomeKey: 'taskId',
      fields: [
        { name: 'functionName', description: '函数名。', required: true },
        { name: 'qualifier', description: 'alias/version；未传时为 `null`。', required: true },
        { name: 'taskId', description: '异步任务 ID。', required: true },
        { name: 'status', description: '任务状态。' },
        { name: 'requestId', description: 'FC requestId。' },
        { name: 'returnPayload', description: '任务返回内容（若 FC 提供）。' },
        { name: 'taskPayload', description: '任务原始 payload（若 FC 提供）。' },
        { name: 'taskErrorMessage', description: '失败原因（若任务失败）。' },
        { name: 'events[]', description: '任务生命周期事件数组。', required: true },
        { name: 'events[].eventId', description: '事件 ID。' },
        { name: 'events[].status', description: '该事件对应的状态。' },
        { name: 'events[].timestamp', description: '事件时间戳（毫秒）。' },
        { name: 'events[].eventDetail', description: '事件详情；有时会携带序列化后的 return payload 或错误上下文。' }
      ]
    }
  }
});

const taskStopCommand = defineCliCommand({
  rawName: 'task stop <taskId> [name]',
  description: '停止正在运行的异步任务',
  options: [
    { rawName: '--target <target>', description: '指定 alias/version（如 prod/preview/1）' }
  ],
  descriptor: {
    title: 'Stop async task',
    safety: {
      level: 'mutating',
      reason: '会主动终止正在运行的异步任务。'
    },
    examples: [
      'licell task stop task-123 image-worker',
      'licell task stop task-123 --target prod --output json'
    ],
    argumentHints: {
      taskId: '应来自仍处于 Running 等可终止状态的任务；通常先通过 `task info` 或 `task list` 确认。'
    },
    recommendedFlow: [
      { title: '先确认任务状态', command: 'licell task info <taskId> [name] --output json', reason: '避免对已经完成或已经失败的任务重复执行 stop。' },
      { title: '停止任务', command: 'licell task stop <taskId> [name] --output json', reason: '对长时间 Running 或需要人工止损的任务发起终止。' },
      { title: '回查终止结果', command: 'licell task info <taskId> [name] --output json', reason: '确认状态已经进入 `Stopped` 或其他终态。' }
    ],
    result: {
      outcomeKey: 'taskId',
      fields: [
        { name: 'functionName', description: '函数名。', required: true },
        { name: 'taskId', description: '被停止的异步任务 ID。', required: true },
        { name: 'qualifier', description: 'alias/version；未传时为 `null`。', required: true }
      ]
    }
  }
});

function requireFunctionName(name: string | undefined) {
  const project = Config.getProject();
  const functionName = toOptionalString(name) || project.appName;
  if (!functionName) {
    throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
  }
  return functionName;
}

function parseOptionalEpochMs(input: unknown, flag: string) {
  const value = toOptionalString(input);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`${flag} 需要毫秒时间戳整数`);
  }
  return parsed;
}

function parseOptionalNonNegativeInteger(input: unknown, flag: string) {
  const value = toOptionalString(input);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`${flag} 需要大于等于 0 的整数`);
  }
  return parsed;
}

function parseOptionalPositiveInteger(input: unknown, flag: string) {
  const value = toOptionalString(input);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(`${flag} 需要大于 0 的整数`);
  }
  return parsed;
}

function normalizeSortOrder(input: unknown) {
  const value = toOptionalString(input);
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized !== 'asc' && normalized !== 'desc') {
    throw new Error('--sort 仅支持 asc 或 desc');
  }
  return normalized;
}

function toTaskConfigResult(functionName: string, qualifier: string | undefined, config: AsyncInvokeConfigSummary | null, extra: Record<string, unknown> = {}) {
  return {
    functionName,
    qualifier: qualifier || config?.qualifier || 'LATEST',
    configured: Boolean(config),
    asyncTask: config?.asyncTask ?? null,
    maxAsyncRetryAttempts: config?.maxAsyncRetryAttempts ?? null,
    maxAsyncEventAgeInSeconds: config?.maxAsyncEventAgeInSeconds ?? null,
    destinationConfig: config?.destinationConfig ?? null,
    ...extra
  };
}

function printTaskConfigSummary(functionName: string, qualifier: string | undefined, config: AsyncInvokeConfigSummary | null) {
  console.log('');
  console.log(`function:    ${pc.cyan(functionName)}`);
  console.log(`qualifier:   ${pc.cyan(qualifier || config?.qualifier || 'LATEST')}`);
  console.log(`configured:  ${pc.cyan(config ? 'yes' : 'no')}`);
  console.log(`asyncTask:   ${pc.cyan(config ? String(config.asyncTask) : '-')}`);
  console.log(`retry:       ${pc.cyan(config?.maxAsyncRetryAttempts !== undefined ? String(config.maxAsyncRetryAttempts) : '-')}`);
  console.log(`eventAge:    ${pc.cyan(config?.maxAsyncEventAgeInSeconds !== undefined ? String(config.maxAsyncEventAgeInSeconds) : '-')}`);
  console.log(`onSuccess:   ${pc.cyan(config?.destinationConfig?.onSuccess || '-')}`);
  console.log(`onFailure:   ${pc.cyan(config?.destinationConfig?.onFailure || '-')}`);
}

export function buildNextAsyncInvokeConfig(
  current: AsyncInvokeConfigSummary | null,
  qualifier: string | undefined,
  options: {
    enable?: boolean;
    disable?: boolean;
    maxRetryAttempts?: unknown;
    maxEventAge?: unknown;
    onSuccess?: unknown;
    onFailure?: unknown;
    clearOnSuccess?: boolean;
    clearOnFailure?: boolean;
  }
) {
  if (options.enable && options.disable) {
    throw new Error('--enable 与 --disable 不能同时使用');
  }

  const nextAsyncTask = options.disable ? false : (options.enable ? true : (current?.asyncTask ?? true));
  const nextMaxRetryAttempts = parseOptionalNonNegativeInteger(options.maxRetryAttempts, '--max-retry-attempts')
    ?? current?.maxAsyncRetryAttempts;
  const nextMaxEventAgeInSeconds = parseOptionalPositiveInteger(options.maxEventAge, '--max-event-age')
    ?? current?.maxAsyncEventAgeInSeconds;
  const nextOnSuccess = options.clearOnSuccess
    ? undefined
    : (toOptionalString(options.onSuccess) ?? current?.destinationConfig?.onSuccess);
  const nextOnFailure = options.clearOnFailure
    ? undefined
    : (toOptionalString(options.onFailure) ?? current?.destinationConfig?.onFailure);
  const shouldIncludeDestinationConfig = Boolean(
    current?.destinationConfig
    || options.clearOnSuccess
    || options.clearOnFailure
    || toOptionalString(options.onSuccess)
    || toOptionalString(options.onFailure)
  );

  return {
    qualifier,
    asyncTask: nextAsyncTask,
    ...(nextMaxRetryAttempts !== undefined ? { maxAsyncRetryAttempts: nextMaxRetryAttempts } : {}),
    ...(nextMaxEventAgeInSeconds !== undefined ? { maxAsyncEventAgeInSeconds: nextMaxEventAgeInSeconds } : {}),
    ...(shouldIncludeDestinationConfig
      ? {
          destinationConfig: {
            ...(nextOnSuccess ? { onSuccess: nextOnSuccess } : {}),
            ...(nextOnFailure ? { onFailure: nextOnFailure } : {})
          }
        }
      : {})
  };
}

export function registerTaskCommands(cli: CAC) {
  registerCliCommand(cli, taskConfigCommand)
    .action(async (name: string | undefined, options: { target?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskConfigCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          const s = createSpinner();
          const config = (await withSpinner(
            s,
            `正在读取 ${functionName} 的异步调用配置...`,
            '❌ 读取异步调用配置失败',
            () => getAsyncInvokeConfig(functionName, qualifier || undefined)
          )) ?? null;
          if (!isJsonOutput()) {
            s.stop(pc.green(config ? '✅ 已读取异步调用配置' : '✅ 当前未配置异步调用'));
          }
          if (isJsonOutput()) {
            emitCommandResult(toTaskConfigResult(functionName, qualifier || undefined, config));
            return;
          }
          printTaskConfigSummary(functionName, qualifier || undefined, config);
          console.log('');
          showOutro(
            config
              ? 'Done.'
              : '当前 qualifier 未配置 async invoke config；可执行 `licell task config set` 或 `licell deploy --type task`。'
          );
        }
      );
    });

  registerCliCommand(cli, taskConfigSetCommand)
    .action(async (name: string | undefined, options: {
      target?: unknown;
      enable?: boolean;
      disable?: boolean;
      maxRetryAttempts?: unknown;
      maxEventAge?: unknown;
      onSuccess?: unknown;
      onFailure?: unknown;
      clearOnSuccess?: boolean;
      clearOnFailure?: boolean;
    }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskConfigSetCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          const s = createSpinner();
          const current = (await withSpinner(
            s,
            `正在读取 ${functionName} 的当前异步调用配置...`,
            '❌ 读取异步调用配置失败',
            () => getAsyncInvokeConfig(functionName, qualifier || undefined)
          )) ?? null;
          const nextConfig = buildNextAsyncInvokeConfig(current, qualifier || undefined, options);
          const result = await withSpinner(
            s,
            `正在写入 ${functionName} 的异步调用配置...`,
            '❌ 写入异步调用配置失败',
            () => upsertAsyncInvokeConfig(functionName, nextConfig)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 异步调用配置已更新'));
          }
          if (isJsonOutput()) {
            emitCommandResult(toTaskConfigResult(functionName, qualifier || undefined, result));
            return;
          }
          printTaskConfigSummary(functionName, qualifier || undefined, result);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, taskConfigRmCommand)
    .action(async (name: string | undefined, options: { target?: unknown; yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskConfigRmCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          await ensureDestructiveActionConfirmed(
            `删除 ${functionName}${qualifier ? `@${qualifier}` : '@LATEST'} 的异步调用配置`,
            { yes: Boolean(options.yes) }
          );
          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在删除 ${functionName} 的异步调用配置...`,
            '❌ 删除异步调用配置失败',
            () => removeAsyncInvokeConfig(functionName, qualifier || undefined)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(result.removed ? pc.green('✅ 异步调用配置已删除') : pc.yellow('⚠️ 当前 qualifier 没有可删除的异步调用配置'));
          }
          if (isJsonOutput()) {
            emitCommandResult(toTaskConfigResult(functionName, qualifier || undefined, null, { removed: result.removed }));
            return;
          }
          console.log('');
          console.log(`function:   ${pc.cyan(result.functionName)}`);
          console.log(`qualifier:  ${pc.cyan(result.qualifier || qualifier || 'LATEST')}`);
          console.log(`removed:    ${pc.cyan(String(result.removed))}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, taskInvokeCommand)
    .action(async (name: string | undefined, options: { target?: unknown; payload?: unknown; file?: unknown; taskId?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskInvokeCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          const payload = resolveOptionalPayloadInput({ payload: options.payload, file: options.file });
          const taskId = toOptionalString(options.taskId);

          const s = createSpinner();
          const asyncConfig = await withSpinner(
            s,
            `正在检查 ${functionName} 的异步任务配置...`,
            '❌ 读取异步任务配置失败',
            () => getAsyncInvokeConfig(functionName, qualifier || undefined)
          );
          if (!asyncConfig) {
            throw new Error(`函数 ${functionName}${qualifier ? `@${qualifier}` : ''} 尚未配置异步调用；请先执行 licell deploy --type task 或 licell task config set`);
          }
          if (!asyncConfig.asyncTask) {
            throw new Error(`函数 ${functionName}${qualifier ? `@${qualifier}` : ''} 尚未启用 asyncTask；请先执行 licell task config set --enable 或 licell deploy --type task`);
          }

          const result = await withSpinner(
            s,
            `正在异步调用任务函数 ${functionName}...`,
            '❌ 任务调用失败',
            () => invokeFunctionAsync(functionName, {
              qualifier: qualifier || undefined,
              payload: payload || undefined,
              taskId: taskId || undefined
            })
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 任务已提交 (status=${result.statusCode})`));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              functionName,
              qualifier: qualifier || null,
              taskId: result.taskId || null,
              statusCode: result.statusCode,
              body: result.body || '',
              invocationType: result.invocationType
            });
            return;
          }
          console.log('');
          console.log(`taskId:    ${pc.cyan(result.taskId || '<unknown>')}`);
          console.log(`qualifier: ${pc.cyan(qualifier || 'LATEST')}`);
          if (result.body.trim()) {
            console.log(`body:      ${pc.cyan(result.body.trim())}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, taskListCommand)
    .action(async (name: string | undefined, options: {
      target?: unknown;
      status?: unknown;
      prefix?: unknown;
      limit?: unknown;
      includePayload?: boolean;
      sort?: unknown;
      startedTimeBegin?: unknown;
      startedTimeEnd?: unknown;
    }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskListCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          const limit = parseListLimit(options.limit, 20, 200);
          const result = await listAsyncTasks(functionName, {
            qualifier: qualifier || undefined,
            includePayload: Boolean(options.includePayload),
            limit,
            prefix: toOptionalString(options.prefix),
            sortOrderByTime: normalizeSortOrder(options.sort),
            startedTimeBegin: parseOptionalEpochMs(options.startedTimeBegin, '--started-time-begin'),
            startedTimeEnd: parseOptionalEpochMs(options.startedTimeEnd, '--started-time-end'),
            status: toOptionalString(options.status)
          });

          if (isJsonOutput()) {
            emitCommandResult({
              functionName,
              qualifier: qualifier || null,
              count: result.tasks.length,
              tasks: result.tasks,
              nextToken: result.nextToken || null
            });
            return;
          }

          if (result.tasks.length === 0) {
            showOutro('当前没有匹配的异步任务');
            return;
          }

          for (const task of result.tasks) {
            console.log(
              `${pc.cyan(task.taskId)}  status=${pc.gray(task.status || '-')}  started=${pc.gray(String(task.startedTime || '-'))}  durationMs=${pc.gray(String(task.durationMs || '-'))}`
            );
          }
          if (result.nextToken) {
            console.log(`\nnextToken: ${pc.gray(result.nextToken)}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, taskInfoCommand)
    .action(async (taskId: string, name: string | undefined, options: { target?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskInfoCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          const detail = await getAsyncTask(functionName, taskId, qualifier || undefined);

          if (isJsonOutput()) {
            emitCommandResult({
              functionName,
              qualifier: qualifier || null,
              ...detail
            });
            return;
          }

          console.log(`\ntaskId:    ${pc.cyan(detail.taskId)}`);
          console.log(`status:    ${pc.cyan(detail.status || '-')}`);
          console.log(`qualifier: ${pc.cyan(detail.qualifier || qualifier || 'LATEST')}`);
          console.log(`started:   ${pc.cyan(String(detail.startedTime || '-'))}`);
          console.log(`ended:     ${pc.cyan(String(detail.endTime || '-'))}`);
          console.log(`duration:  ${pc.cyan(String(detail.durationMs || '-'))}`);
          console.log(`requestId: ${pc.cyan(detail.requestId || '-')}`);
          if (detail.taskErrorMessage) {
            console.log(`error:     ${pc.red(detail.taskErrorMessage)}`);
          }
          if (detail.returnPayload) {
            console.log(`return:    ${pc.cyan(detail.returnPayload)}`);
          }
          if (detail.events.length > 0) {
            console.log('\nevents:');
            for (const event of detail.events) {
              console.log(`- [${event.status || '-'}] ${event.timestamp || '-'}  ${event.eventDetail || ''}`.trimEnd());
            }
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  registerCliCommand(cli, taskStopCommand)
    .action(async (taskId: string, name: string | undefined, options: { target?: unknown }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(taskStopCommand),
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const functionName = requireFunctionName(name);
          const qualifier = toOptionalString(options.target);
          const s = createSpinner();
          const result = await withSpinner(
            s,
            `正在停止异步任务 ${taskId}...`,
            '❌ 停止异步任务失败',
            () => stopAsyncTask(functionName, taskId, qualifier || undefined)
          );
          if (!result) return;
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 任务已停止'));
          }
          if (isJsonOutput()) {
            emitCommandResult({
              ...result
            });
            return;
          }
          console.log(`\ntaskId:    ${pc.cyan(result.taskId)}`);
          console.log(`function:  ${pc.cyan(result.functionName)}`);
          console.log(`qualifier: ${pc.cyan(result.qualifier || qualifier || 'LATEST')}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });
}

export const taskCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerTaskCommands,
  commands: [
    taskConfigCommand,
    taskConfigSetCommand,
    taskConfigRmCommand,
    taskInvokeCommand,
    taskListCommand,
    taskInfoCommand,
    taskStopCommand
  ],
  namespaces: {
    task: {
      summary: '围绕 `deploy --type task` 交付结果，统一管理任务函数的异步配置、调用、任务列表、详情查询与终止。',
      notes: [
        '`licell deploy --type task` 会复用 FC 打包/发布骨架，并自动开启 asyncTask；若带 `--target`，还会把对应 alias 也配置成可立即提交异步任务。',
        '任务函数没有固定访问 URL；请通过 `licell task invoke` 发起调用。',
        '如需单独调参，可用 `licell task config set` 管理重试、事件时效与成功/失败回调目的地。',
        '典型链路是：`deploy --type task` → `task config` → `task invoke` → `task info/list` → `task stop`（如需止损）。'
      ],
      examples: [
        'licell deploy --type task --entry src/worker.ts',
        'licell deploy --type task --runtime nodejs22 --target preview --output json',
        'licell task config set image-worker --max-retry-attempts 0',
        'licell task invoke image-worker --payload \'{"image":"a.png"}\'',
        'licell task info task-123 image-worker --target preview --output json',
        'licell task list image-worker --target prod --output json'
      ],
      related: ['deploy', 'fn info', 'release promote'],
      agentTips: [
        'Agent 应缓存 `task invoke` 返回的 `taskId`；后续 `task info`、`task stop` 都依赖它。',
        '若 `deploy --type task` 的结果里已给出 `invokeCommand`，优先直接复用这条命令继续执行。'
      ],
      recommendedFlow: [
        { title: '部署任务函数', command: 'licell deploy --type task --output json', reason: '先创建/更新函数，并让 licell 自动打开任务调用所需的 asyncTask 配置。' },
        { title: '确认或调整配置', command: 'licell task config [name] --output json', reason: '检查 qualifier 上的 asyncTask、重试次数、事件时效与回调目的地。' },
        { title: '提交异步任务', command: 'licell task invoke [name] --output json', reason: '拿到 `taskId`，作为后续状态跟踪与止损入口。' },
        { title: '查询任务详情', command: 'licell task info <taskId> [name] --output json', reason: '查看状态、返回值、失败原因与事件流。' }
      ],
      taskHints: [
        {
          phase: 'mutate',
          title: '部署任务函数并启用异步任务',
          description: '先用 deploy task 发布函数，再按需用 task config set 调整异步配置。',
          commands: ['licell deploy --type task', 'licell task config set']
        },
        {
          phase: 'inspect',
          title: '排查任务执行状态',
          description: '用 config/list/info 查看异步配置、运行状态、返回值和失败原因。',
          commands: ['licell task config --output json', 'licell task list --output json', 'licell task info <taskId> --output json']
        },
        {
          phase: 'verify',
          title: '验证任务链路是否打通',
          description: '提交一条任务，确认拿到 taskId，并继续轮询到终态或主动 stop。',
          commands: ['licell task invoke [name] --output json', 'licell task stop <taskId> [name] --output json']
        }
      ]
    }
  }
});
