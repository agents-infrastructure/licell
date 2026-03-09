import { describe, expect, it } from 'vitest';
import { isInteractiveTTY } from '../utils/cli-shared';

describe('isInteractiveTTY', () => {
  it('honors LICELL_INTERACTIVE=0 override', () => {
    expect(isInteractiveTTY({ LICELL_INTERACTIVE: '0' })).toBe(false);
    expect(isInteractiveTTY({ LICELL_INTERACTIVE: 'false' })).toBe(false);
  });

  it('honors LICELL_INTERACTIVE=1 override', () => {
    expect(isInteractiveTTY({ LICELL_INTERACTIVE: '1' })).toBe(true);
    expect(isInteractiveTTY({ LICELL_INTERACTIVE: 'true' })).toBe(true);
  });
});
