import { formatErrorMessage } from '../utils/errors';
import { emitCommandEvent } from '../utils/output';

interface SpinnerLike {
  message: (msg?: string) => void;
}

interface DeployProgressNotification {
  stage: string;
  message: string;
  action?: string;
  data?: Record<string, unknown>;
}

interface DeployProgressStepOptions<T> extends DeployProgressNotification {
  okMessage?: string | ((result: T) => string | undefined);
  okData?: Record<string, unknown> | ((result: T) => Record<string, unknown> | undefined);
  heartbeat?:
    | false
    | {
      intervalMs?: number;
      message?: string | ((elapsedMs: number) => string | undefined);
      data?: Record<string, unknown> | ((elapsedMs: number) => Record<string, unknown> | undefined);
    };
}

function resolveValue<TInput, TValue>(
  value: TValue | ((input: TInput) => TValue | undefined) | undefined,
  input: TInput
) {
  if (typeof value === 'function') {
    return (value as (input: TInput) => TValue | undefined)(input);
  }
  return value;
}

export function notifyDeployProgress(spinner: SpinnerLike, options: DeployProgressNotification) {
  spinner.message(options.message);
  emitCommandEvent({
    stage: options.stage,
    action: options.action || 'progress',
    status: 'info',
    message: options.message,
    ...(options.data ? { data: options.data } : {})
  });
}

export async function runDeployProgressStep<T>(
  spinner: SpinnerLike,
  options: DeployProgressStepOptions<T>,
  run: () => Promise<T>
) {
  const startedAt = Date.now();
  const heartbeatConfig = options.heartbeat === undefined ? {} : options.heartbeat;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  spinner.message(options.message);
  emitCommandEvent({
    stage: options.stage,
    action: options.action || 'execute',
    status: 'start',
    message: options.message,
    ...(options.data ? { data: options.data } : {})
  });

  if (heartbeatConfig !== false) {
    const intervalMs = heartbeatConfig.intervalMs ?? 10_000;
    heartbeatTimer = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const heartbeatMessage = resolveValue(
        heartbeatConfig.message,
        elapsedMs
      ) || `仍在进行: ${options.message} (${Math.floor(elapsedMs / 1000)}s)`;
      const heartbeatData = resolveValue(heartbeatConfig.data, elapsedMs);
      emitCommandEvent({
        stage: options.stage,
        action: 'heartbeat',
        status: 'info',
        message: heartbeatMessage,
        data: {
          ...(options.data || {}),
          elapsedMs,
          heartbeat: true,
          ...(heartbeatData || {})
        }
      });
    }, intervalMs);
    if (typeof heartbeatTimer.unref === 'function') {
      heartbeatTimer.unref();
    }
  }

  try {
    const result = await run();
    const okMessage = resolveValue(options.okMessage, result);
    const okData = resolveValue(options.okData, result);
    emitCommandEvent({
      stage: options.stage,
      action: options.action || 'execute',
      status: 'ok',
      ...(okMessage ? { message: okMessage } : {}),
      ...(okData ? { data: okData } : {})
    });
    return result;
  } catch (err: unknown) {
    emitCommandEvent({
      stage: options.stage,
      action: options.action || 'execute',
      status: 'failed',
      message: formatErrorMessage(err),
      ...(options.data ? { data: options.data } : {})
    });
    throw err;
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}
