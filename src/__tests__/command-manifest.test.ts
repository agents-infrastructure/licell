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
});
