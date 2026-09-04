import { describe, expect, it } from 'vitest';
import { LICELL_COMMAND_MANIFEST } from '../commands/registry';
import {
  assertCommandManifest,
  collectCommandManifestIssues,
  type LicellCommandManifest
} from '../commands/module';

describe('command manifest invariants', () => {
  it('keeps the real manifest diagnostics-free', () => {
    expect(collectCommandManifestIssues(LICELL_COMMAND_MANIFEST)).toEqual([]);
  });

  it('reports structural issues for malformed manifests', () => {
    const invalidManifest: LicellCommandManifest = {
      root: {
        roots: ['help'],
        register: () => {},
        descriptors: {}
      },
      modules: [
        {
          roots: ['deploy', 'deploy'],
          register: () => {},
          descriptors: {
            config: { summary: 'wrong root key' }
          },
          section: {
            id: 'delivery',
            title: 'Delivery Workflow'
          }
        },
        {
          roots: ['deploy'],
          register: () => {},
          descriptors: {
            config: { summary: 'duplicate descriptor key' }
          },
          section: {
            id: 'delivery',
            title: 'Another Delivery Title'
          }
        }
      ]
    };

    const codes = collectCommandManifestIssues(invalidManifest).map((issue) => issue.code);

    expect(codes).toEqual(expect.arrayContaining([
      'root_roots_not_empty',
      'root_help_missing',
      'module_root_duplicate',
      'descriptor_key_root_mismatch',
      'descriptor_key_duplicate',
      'section_inconsistent'
    ]));
  });

  it('throws with a readable error when manifest assertion fails', () => {
    const invalidManifest: LicellCommandManifest = {
      root: {
        roots: [],
        register: () => {},
        descriptors: {}
      },
      modules: []
    };

    expect(() => assertCommandManifest(invalidManifest)).toThrow(/Invalid command manifest:/);
    expect(() => assertCommandManifest(invalidManifest)).toThrow(/root_help_missing/);
  });

  it('rejects unclassified, conflicting, or missing region options', () => {
    const invalidManifest: LicellCommandManifest = {
      root: {
        roots: [],
        register: () => {},
        descriptors: { help: {} }
      },
      modules: [
        {
          roots: ['demo'],
          register: () => {},
          descriptors: {
            'demo unclassified': {},
            'demo conflict': {},
            'demo missing': {}
          },
          declaredCommands: [
            {
              rawName: 'demo unclassified',
              description: 'unclassified',
              options: [{ rawName: '--region <region>', description: 'region' }]
            },
            {
              rawName: 'demo conflict',
              description: 'conflict',
              region: { scope: 'auth' },
              regionOptionMode: 'auth-default',
              options: [{ rawName: '--region <region>', description: 'region' }]
            },
            {
              rawName: 'demo missing',
              description: 'missing',
              region: { scope: 'auth' },
              options: []
            }
          ],
          section: {
            id: 'demo',
            title: 'Demo'
          }
        }
      ]
    };

    expect(collectCommandManifestIssues(invalidManifest).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'command_region_option_unclassified',
      'command_region_metadata_conflict',
      'command_region_option_count_invalid'
    ]));
  });

  it('rejects incomplete binding metadata and unknown target options', () => {
    const invalidManifest: LicellCommandManifest = {
      root: {
        roots: [],
        register: () => {},
        descriptors: { help: {} }
      },
      modules: [
        {
          roots: ['demo'],
          register: () => {},
          descriptors: {
            'demo missing-binding': {},
            'demo unknown-target': {}
          },
          declaredCommands: [
            {
              rawName: 'demo missing-binding',
              description: 'missing binding',
              region: { scope: 'binding' },
              options: [{ rawName: '--region <region>', description: 'region' }]
            },
            {
              rawName: 'demo unknown-target',
              description: 'unknown target',
              region: {
                scope: 'binding',
                binding: 'cache',
                target: { option: 'instance' }
              },
              options: [{ rawName: '--region <region>', description: 'region' }]
            }
          ],
          section: {
            id: 'demo',
            title: 'Demo'
          }
        }
      ]
    };

    expect(collectCommandManifestIssues(invalidManifest).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'command_region_binding_missing',
      'command_region_target_unknown'
    ]));
  });

  it('places ecs module after supa and before doctor', () => {
    const roots = LICELL_COMMAND_MANIFEST.modules.map((module) => module.roots[0]);
    expect(roots.indexOf('ecs')).toBeGreaterThan(roots.indexOf('supa'));
    expect(roots.indexOf('ecs')).toBeLessThan(roots.indexOf('doctor'));

    const ecsModule = LICELL_COMMAND_MANIFEST.modules.find((module) => module.roots.includes('ecs'));
    expect(ecsModule?.section).toMatchObject({
      id: 'infra',
      title: 'Cloud Infrastructure'
    });
    expect(ecsModule?.declaredCommands?.map((command) => command.rawName)).toEqual([
      'ecs list',
      'ecs info <instanceId>',
      'ecs start <instanceId>',
      'ecs reboot <instanceId>',
      'ecs stop <instanceId>',
      'ecs delete <instanceId>',
      'ecs rm <instanceId>'
    ]);
  });

  it('places the VPC readonly module after Kubernetes and before doctor', () => {
    const roots = LICELL_COMMAND_MANIFEST.modules.map((module) => module.roots[0]);
    expect(roots.indexOf('vpc')).toBeGreaterThan(roots.indexOf('k8s'));
    expect(roots.indexOf('vpc')).toBeLessThan(roots.indexOf('doctor'));

    const vpcModule = LICELL_COMMAND_MANIFEST.modules.find((module) => module.roots.includes('vpc'));
    expect(vpcModule?.section).toMatchObject({ id: 'infra', title: 'Cloud Infrastructure' });
    expect(vpcModule?.declaredCommands?.map((command) => command.rawName)).toEqual([
      'vpc list',
      'vpc info <vpc>',
      'vpc topology <vpc>'
    ]);
  });
});
