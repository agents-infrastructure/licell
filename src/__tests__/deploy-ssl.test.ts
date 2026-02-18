import { describe, expect, it } from 'vitest';
import { resolveDeploySslEnabled } from '../commands/deploy';

describe('resolveDeploySslEnabled', () => {
  it('enables ssl when --ssl flag is set', () => {
    expect(resolveDeploySslEnabled(true, undefined)).toBe(true);
  });

  it('enables ssl when custom domain is provided', () => {
    expect(resolveDeploySslEnabled(false, 'api.example.com')).toBe(true);
  });

  it('disables ssl when neither --ssl nor --domain is provided', () => {
    expect(resolveDeploySslEnabled(false, undefined)).toBe(false);
  });
});
