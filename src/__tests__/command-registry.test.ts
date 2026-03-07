import { describe, expect, it } from 'vitest';
import { LICELL_COMMAND_MODULES, LICELL_ROOT_HELP_METADATA } from '../commands/registry';
import { getCommandCatalog } from '../utils/command-catalog';
import { getCommandMetadata } from '../utils/command-metadata';

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

describe('LICELL_COMMAND_MODULES', () => {
  it('keeps root ownership unique across modules', () => {
    const roots = LICELL_COMMAND_MODULES.flatMap((module) => module.roots);
    expect(unique(roots)).toHaveLength(roots.length);
  });

  it('keeps root help metadata in registry-owned config', () => {
    expect(LICELL_ROOT_HELP_METADATA.examples).toContain('licell mcp init');
    expect(getCommandMetadata('help').examples).toContain('licell deploy --output json');
  });

  it('registers real mcp subcommands in command catalog', () => {
    const catalog = getCommandCatalog();
    expect(catalog.commandsByKey['mcp']).toBeDefined();
    expect(catalog.commandsByKey['mcp init']).toBeDefined();
    expect(catalog.commandsByKey['mcp serve']).toBeDefined();
    expect(catalog.childCommands['mcp']).toEqual(expect.arrayContaining(['init', 'serve']));
  });
});
