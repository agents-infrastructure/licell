import { describe, expect, it } from 'vitest';
import { buildE2eApiDeployArgs } from '../commands/e2e';

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
});
