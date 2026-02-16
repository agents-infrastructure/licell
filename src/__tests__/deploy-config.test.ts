import { describe, expect, it } from 'vitest';
import { buildDeployProjectPatch } from '../utils/deploy-config';

describe('buildDeployProjectPatch', () => {
  it('returns empty patch when deploy did not succeed', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: false,
      cliDomainSuffix: 'example.xyz',
      projectDomainSuffix: 'example.com',
      cliRuntime: 'nodejs22',
      projectRuntime: 'nodejs20'
    })).toEqual({});
  });

  it('returns empty patch when overrides are unchanged', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      cliDomainSuffix: 'example.xyz',
      projectDomainSuffix: 'example.xyz',
      cliRuntime: 'nodejs22',
      projectRuntime: 'nodejs22'
    })).toEqual({});
  });

  it('returns domain suffix patch when changed', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      cliDomainSuffix: 'example.xyz',
      projectDomainSuffix: 'example.com'
    })).toEqual({
      domainSuffix: 'example.xyz'
    });
  });

  it('returns runtime patch when changed', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      cliRuntime: 'nodejs22',
      projectRuntime: 'nodejs20'
    })).toEqual({
      runtime: 'nodejs22'
    });
  });

  it('returns both runtime and domain suffix patches when both changed', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      cliDomainSuffix: 'example.xyz',
      projectDomainSuffix: 'example.com',
      cliRuntime: 'nodejs22',
      projectRuntime: 'nodejs20'
    })).toEqual({
      domainSuffix: 'example.xyz',
      runtime: 'nodejs22'
    });
  });
});
