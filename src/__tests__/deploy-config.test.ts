import { describe, expect, it } from 'vitest';
import { buildDeployProjectPatch } from '../utils/deploy-config';

describe('buildDeployProjectPatch', () => {
  it('returns empty patch when deploy did not succeed', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: false,
      deployType: 'api',
      runtime: 'nodejs22'
    })).toEqual({});
  });

  it('builds a stable static deploy patch', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      deployType: 'static',
      dist: 'apps/web/dist',
      domainSuffix: 'example.com',
      enableCdn: true,
      enableSSL: true,
      cdnRefresh: 'entrypoints'
    })).toEqual({
      deployType: 'static',
      runtime: undefined,
      entry: undefined,
      dist: 'apps/web/dist',
      target: undefined,
      useVpc: undefined,
      domain: undefined,
      domainSuffix: 'example.com',
      enableCdn: true,
      enableSSL: true,
      cdnRefresh: 'entrypoints',
      artifact: {
        kind: 'directory',
        path: 'apps/web/dist'
      },
      deployTarget: {
        service: 'oss-static'
      },
      route: {
        domainSuffix: 'example.com',
        cdn: true,
        ssl: true,
        cdnRefresh: 'entrypoints'
      }
    });
  });

  it('prefers a fixed domain over domain suffix for api deploys', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      deployType: 'api',
      runtime: 'nodejs22',
      entry: 'src/index.ts',
      domain: 'api.example.com',
      domainSuffix: 'example.com',
      target: 'prod',
      enableCdn: false,
      enableSSL: true,
      useVpc: true
    })).toEqual({
      deployType: 'api',
      runtime: 'nodejs22',
      entry: 'src/index.ts',
      dist: undefined,
      target: 'prod',
      useVpc: true,
      domain: 'api.example.com',
      domainSuffix: undefined,
      enableCdn: false,
      enableSSL: true,
      artifact: {
        kind: 'source',
        entry: 'src/index.ts'
      },
      deployTarget: {
        service: 'fc-http',
        runtime: 'nodejs22',
        alias: 'prod',
        vpc: true
      },
      route: {
        domain: 'api.example.com',
        cdn: false,
        ssl: true
      }
    });
  });

  it('clears domain workflow fields for task deploys', () => {
    expect(buildDeployProjectPatch({
      deploySucceeded: true,
      deployType: 'task',
      runtime: 'nodejs22',
      entry: 'src/task.ts',
      target: 'preview',
      useVpc: false
    })).toEqual({
      deployType: 'task',
      runtime: 'nodejs22',
      entry: 'src/task.ts',
      dist: undefined,
      target: 'preview',
      useVpc: false,
      domain: undefined,
      domainSuffix: undefined,
      enableCdn: undefined,
      enableSSL: undefined,
      artifact: {
        kind: 'source',
        entry: 'src/task.ts'
      },
      deployTarget: {
        service: 'fc-task',
        runtime: 'nodejs22',
        alias: 'preview',
        vpc: false
      },
      route: undefined
    });
  });
});
