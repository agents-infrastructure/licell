import { describe, expect, it } from 'vitest';
import { LICELL_COMMAND_MANIFEST } from '../commands/registry';
import { getCommandCatalog } from '../utils/command-catalog';
import { getCommandDescriptor } from '../utils/command-metadata';
import { collectCommandManifestIssues } from '../commands/module';

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

describe('LICELL_COMMAND_MANIFEST', () => {
  it('keeps root ownership unique across modules', () => {
    const roots = LICELL_COMMAND_MANIFEST.modules.flatMap((module) => module.roots);
    expect(unique(roots)).toHaveLength(roots.length);
  });

  it('keeps root help surface in manifest-owned config', () => {
    expect(LICELL_COMMAND_MANIFEST.root.descriptors.help?.examples).toContain('licell catalog --output json');
    expect(getCommandDescriptor('help').examples).toContain('licell deploy --output json');
  });

  it('keeps descriptors attached for every described module', () => {
    const modules = LICELL_COMMAND_MANIFEST.modules.filter((module) => module.descriptors);
    expect(modules.length).toBeGreaterThan(0);
    expect(modules.every((module) => Object.keys(module.descriptors).length > 0)).toBe(true);
  });


  it('keeps manifest invariant diagnostics empty', () => {
    expect(collectCommandManifestIssues(LICELL_COMMAND_MANIFEST)).toEqual([]);
  });
  it('registers catalog command in command catalog', () => {
    const catalog = getCommandCatalog();
    expect(catalog.commandsByKey['catalog']).toBeDefined();
  });

  it('registers ecs inspect and lifecycle commands in the infrastructure section only', () => {
    const catalog = getCommandCatalog();
    expect(catalog.commandsByKey['ecs list']).toBeDefined();
    expect(catalog.commandsByKey['ecs info']).toBeDefined();
    expect(catalog.commandsByKey['ecs start']).toBeDefined();
    expect(catalog.commandsByKey['ecs stop']).toBeDefined();
    expect(catalog.commandsByKey['ecs reboot']).toBeDefined();
    expect(catalog.commandsByKey['ecs delete']).toBeDefined();
    expect(catalog.commandsByKey['ecs rm']).toBeDefined();
    expect(catalog.commandsByKey['ecs run']).toBeUndefined();
    expect(catalog.commandsByKey['ecs create']).toBeUndefined();
  });
});
