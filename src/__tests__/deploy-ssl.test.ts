import { describe, expect, it } from 'vitest';
import { resolveDeploySslEnabled } from '../commands/deploy';

describe('resolveDeploySslEnabled', () => {
  it('enables ssl when --ssl flag is set', () => {
    expect(resolveDeploySslEnabled(true, undefined, false)).toBe(true);
  });

  it('enables ssl when custom domain is provided', () => {
    expect(resolveDeploySslEnabled(false, 'api.example.com', false)).toBe(true);
  });

  it('enables ssl when --enable-cdn is set', () => {
    expect(resolveDeploySslEnabled(false, undefined, true)).toBe(true);
  });

  it('disables ssl when neither --ssl nor --domain is provided', () => {
    expect(resolveDeploySslEnabled(false, undefined, false)).toBe(false);
  });
});
