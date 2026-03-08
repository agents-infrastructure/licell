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
    expect(LICELL_COMMAND_MANIFEST.root.descriptors.help?.examples).toContain('licell mcp init');
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
  it('registers real mcp subcommands in command catalog', () => {
    const catalog = getCommandCatalog();
    expect(catalog.commandsByKey['mcp']).toBeDefined();
    expect(catalog.commandsByKey['mcp init']).toBeDefined();
    expect(catalog.commandsByKey['mcp serve']).toBeDefined();
    expect(catalog.childCommands['mcp']).toEqual(expect.arrayContaining(['init', 'serve']));
  });
});
