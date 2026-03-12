import { describe, expect, it } from 'vitest';
import { buildE2eApiDeployArgs, buildE2eTaskDeployArgs } from '../commands/e2e';

describe('buildE2eApiDeployArgs', () => {
  it('injects runtime default entry for nodejs smoke deploys', () => {
    expect(buildE2eApiDeployArgs({
      runtime: 'nodejs22',
      target: 'preview',
      useVpc: false,
      enableCdn: false
    })).toEqual([
      'deploy',
      '--type', 'api',
      '--runtime', 'nodejs22',
      '--target', 'preview',
      '--entry', 'src/index.ts',
      '--disable-vpc'
    ]);
  });

  it('omits entry when runtime has no default entry', () => {
    expect(buildE2eApiDeployArgs({
      runtime: 'docker',
      target: 'preview',
      useVpc: true,
      enableCdn: false
    })).toEqual([
      'deploy',
      '--type', 'api',
      '--runtime', 'docker',
      '--target', 'preview',
      '--enable-vpc'
    ]);
  });

  it('supports fixed-domain preview deploys', () => {
    expect(buildE2eApiDeployArgs({
      runtime: 'nodejs22',
      useVpc: false,
      domainSuffix: 'bazhuayu.xyz',
      enableCdn: false,
      preview: true
    })).toEqual([
      'deploy',
      '--type', 'api',
      '--runtime', 'nodejs22',
      '--preview',
      '--entry', 'src/index.ts',
      '--disable-vpc',
      '--domain-suffix', 'bazhuayu.xyz'
    ]);
  });

  it('builds task deploy args for node runtimes', () => {
    expect(buildE2eTaskDeployArgs({
      runtime: 'nodejs22',
      target: 'preview',
      useVpc: false
    })).toEqual([
      'deploy',
      '--type', 'task',
      '--runtime', 'nodejs22',
      '--target', 'preview',
      '--entry', 'src/task.ts',
      '--disable-vpc'
    ]);
  });

  it('builds task deploy args for python runtimes', () => {
    expect(buildE2eTaskDeployArgs({
      runtime: 'python3.13',
      target: 'preview',
      useVpc: true
    })).toEqual([
      'deploy',
      '--type', 'task',
      '--runtime', 'python3.13',
      '--target', 'preview',
      '--entry', 'src/task.py',
      '--enable-vpc'
    ]);
  });
});
