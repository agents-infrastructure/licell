import { describe, expect, it, vi } from 'vitest';
import { ensureDestructiveActionConfirmed } from '../utils/cli-shared';

describe('ensureDestructiveActionConfirmed', () => {
  it('skips confirmation when --yes is provided', async () => {
    const confirmPrompt = vi.fn(async () => true);
    await ensureDestructiveActionConfirmed('删除函数 demo', {
      yes: true,
      interactiveTTY: false,
      confirmPrompt
    });
    expect(confirmPrompt).not.toHaveBeenCalled();
  });

  it('requires --yes in non-interactive mode', async () => {
    await expect(ensureDestructiveActionConfirmed('删除函数 demo', {
      interactiveTTY: false
    })).rejects.toThrow('非交互模式请添加 --yes');
  });

  it('cancels when first confirmation is denied', async () => {
    const confirmPrompt = vi.fn(async () => false);
    await expect(ensureDestructiveActionConfirmed('删除函数 demo', {
      interactiveTTY: true,
      confirmPrompt
    })).rejects.toThrow('操作已取消');
    expect(confirmPrompt).toHaveBeenCalledTimes(1);
  });

  it('cancels when second confirmation is denied', async () => {
    const confirmPrompt = vi
      .fn<(_message: string) => Promise<boolean>>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await expect(ensureDestructiveActionConfirmed('删除函数 demo', {
      interactiveTTY: true,
      confirmPrompt
    })).rejects.toThrow('操作已取消');
    expect(confirmPrompt).toHaveBeenCalledTimes(2);
  });

  it('passes when both confirmations are accepted', async () => {
    const confirmPrompt = vi
      .fn<(_message: string) => Promise<boolean>>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    await expect(ensureDestructiveActionConfirmed('删除函数 demo', {
      interactiveTTY: true,
      confirmPrompt
    })).resolves.toBeUndefined();
    expect(confirmPrompt).toHaveBeenCalledTimes(2);
  });
});
