import { describe, expect, it } from 'vitest';
import { resolveFunctionResources } from '../providers/fc/deploy';

describe('resolveFunctionResources', () => {
  it('uses defaults when both project and cli resources are empty', () => {
    expect(resolveFunctionResources(undefined, undefined)).toEqual({
      memorySize: 512,
      timeout: 30,
      instanceConcurrency: 10
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
      cpu: 1,
      instanceConcurrency: 10
    });
  });

  it('infers instance concurrency by memory when cpu is not set', () => {
    expect(resolveFunctionResources({
      memorySize: 1024
    }, {})).toEqual({
      memorySize: 1024,
      timeout: 30,
      instanceConcurrency: 20
    });
  });

  it('infers instance concurrency by cpu when cpu is set', () => {
    expect(resolveFunctionResources({
      memorySize: 512,
      cpu: 1.5
    }, {})).toEqual({
      memorySize: 512,
      timeout: 30,
      cpu: 1.5,
      instanceConcurrency: 15
    });
  });
});
