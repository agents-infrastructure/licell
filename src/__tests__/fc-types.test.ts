import { describe, expect, it } from 'vitest';
import { getSupportedFcRuntimes } from '../providers/fc/types';

describe('fc types module', () => {
  it('exposes supported runtimes when imported directly', () => {
    expect(getSupportedFcRuntimes()).toEqual(
      expect.arrayContaining(['nodejs20', 'nodejs22', 'python3.12', 'python3.13'])
    );
  });
});
