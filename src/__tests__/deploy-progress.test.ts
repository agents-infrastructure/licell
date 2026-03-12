import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEmitCommandEvent } = vi.hoisted(() => ({
  mockEmitCommandEvent: vi.fn()
}));

vi.mock('../utils/output', () => ({
  emitCommandEvent: mockEmitCommandEvent
}));

vi.mock('../utils/errors', () => ({
  formatErrorMessage: (err: unknown) => String(err)
}));

import { runDeployProgressStep } from '../commands/deploy-progress';

describe('deploy progress heartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEmitCommandEvent.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits heartbeat events while a long-running step is still in progress', async () => {
    const spinner = { message: vi.fn() };
    let resolveStep: ((value: string) => void) | undefined;

    const promise = runDeployProgressStep(
      spinner,
      {
        stage: 'deploy.api.function',
        message: '正在推送函数代码...',
        okMessage: '✅ 已完成'
      },
      () => new Promise<string>((resolve) => {
        resolveStep = resolve;
      })
    );

    expect(mockEmitCommandEvent).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'deploy.api.function',
      action: 'execute',
      status: 'start'
    }));

    await vi.advanceTimersByTimeAsync(10_000);

    expect(mockEmitCommandEvent).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'deploy.api.function',
      action: 'heartbeat',
      status: 'info',
      data: expect.objectContaining({
        heartbeat: true,
        elapsedMs: 10_000
      })
    }));

    resolveStep?.('done');
    await promise;

    expect(mockEmitCommandEvent).toHaveBeenLastCalledWith(expect.objectContaining({
      stage: 'deploy.api.function',
      action: 'execute',
      status: 'ok',
      message: '✅ 已完成'
    }));
  });
});
