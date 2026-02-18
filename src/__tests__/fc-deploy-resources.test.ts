import { describe, expect, it } from 'vitest';
import { resolveFunctionResources } from '../providers/fc/deploy';

describe('resolveFunctionResources', () => {
  it('uses defaults when both project and cli resources are empty', () => {
    expect(resolveFunctionResources(undefined, undefined)).toEqual({
      memorySize: 256,
      timeout: 30
    });
  });

  it('uses project resources when cli does not override', () => {
    expect(resolveFunctionResources({
      memorySize: 512,
      timeout: 90,
      cpu: 1,
      instanceConcurrency: 20
    }, {})).toEqual({
      memorySize: 512,
      timeout: 90,
      cpu: 1,
      instanceConcurrency: 20
    });
  });

  it('merges cli overrides on top of project resources', () => {
    expect(resolveFunctionResources({
      memorySize: 512,
      timeout: 90,
      cpu: 1
    }, {
      timeout: 120
    })).toEqual({
      memorySize: 512,
      timeout: 120,
      cpu: 1
    });
  });
});
