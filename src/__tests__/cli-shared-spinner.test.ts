import { beforeEach, describe, expect, it, vi } from 'vitest';

const { spinnerStartMock, spinnerStopMock, spinnerMessageMock } = vi.hoisted(() => ({
  spinnerStartMock: vi.fn(),
  spinnerStopMock: vi.fn(),
  spinnerMessageMock: vi.fn()
}));

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  intro: vi.fn(),
  outro: vi.fn(),
  isCancel: vi.fn(() => false),
  spinner: () => ({
    start: spinnerStartMock,
    stop: spinnerStopMock,
    message: spinnerMessageMock
  })
}));

vi.mock('../utils/output', () => ({
  isJsonOutput: vi.fn(() => false)
}));

import { createSpinner } from '../utils/cli-shared';

describe('createSpinner', () => {
  beforeEach(() => {
    spinnerStartMock.mockClear();
    spinnerStopMock.mockClear();
    spinnerMessageMock.mockClear();
  });

  it('does not start a second spinner when one is already active', () => {
    const spinner = createSpinner();

    spinner.start('first');
    spinner.start('second');
    spinner.stop('done');

    expect(spinnerStartMock).toHaveBeenCalledTimes(1);
    expect(spinnerStartMock).toHaveBeenCalledWith('first');
    expect(spinnerMessageMock).toHaveBeenCalledTimes(1);
    expect(spinnerMessageMock).toHaveBeenCalledWith('second');
    expect(spinnerStopMock).toHaveBeenCalledTimes(1);
    expect(spinnerStopMock).toHaveBeenCalledWith('done');
  });
});
