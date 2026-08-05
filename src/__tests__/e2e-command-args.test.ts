import { describe, expect, it } from 'vitest';
import {
  appendE2eCommandRegion,
  buildE2eApiDeployArgs,
  buildE2eTaskDeployArgs
} from '../commands/e2e';
import { getCommandCatalog } from '../utils/command-catalog';

const commandCatalog = getCommandCatalog();

describe('appendE2eCommandRegion', () => {
  it('appends the effective region only to regional registry commands', () => {
    expect(appendE2eCommandRegion(['deploy', '--type', 'api'], 'cn-shanghai', commandCatalog)).toEqual([
      'deploy', '--type', 'api', '--region', 'cn-shanghai'
    ]);
    expect(appendE2eCommandRegion(['db', 'info', 'pgm-demo'], 'cn-shanghai', commandCatalog)).toEqual([
      'db', 'info', 'pgm-demo', '--region', 'cn-shanghai'
    ]);
  });

  it('leaves non-regional child commands unchanged', () => {
    expect(appendE2eCommandRegion(['init', '--yes'], 'cn-shanghai', commandCatalog)).toEqual(['init', '--yes']);
    expect(appendE2eCommandRegion(['dns', 'records', 'list', 'example.com'], 'cn-shanghai', commandCatalog)).toEqual([
      'dns', 'records', 'list', 'example.com'
    ]);
  });

  it('preserves an existing explicit region and handles missing effective region', () => {
    expect(appendE2eCommandRegion([
      'deploy', '--type', 'api', '--region=cn-beijing'
    ], 'cn-shanghai', commandCatalog)).toEqual(['deploy', '--type', 'api', '--region=cn-beijing']);
    expect(appendE2eCommandRegion(['deploy', '--region', 'cn-beijing'], 'cn-shanghai', commandCatalog)).toEqual([
      'deploy', '--region', 'cn-beijing'
    ]);
    expect(appendE2eCommandRegion(['logs', 'tail', '-r', 'cn-beijing'], 'cn-shanghai', commandCatalog)).toEqual([
      'logs', 'tail', '-r', 'cn-beijing'
    ]);
    expect(appendE2eCommandRegion(['deploy'], undefined, commandCatalog)).toEqual(['deploy']);
  });
});

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
