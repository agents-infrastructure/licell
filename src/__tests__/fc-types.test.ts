import { describe, expect, it } from 'vitest';

describe('fc types module', () => {
  it('exposes supported runtimes when imported directly', async () => {
    const mod = await import(`../providers/fc/types.ts?fresh=${Date.now()}`);
    expect(mod.getSupportedFcRuntimes()).toEqual(
      expect.arrayContaining(['nodejs20', 'nodejs22', 'python3.12', 'python3.13'])
    );
  });
});
