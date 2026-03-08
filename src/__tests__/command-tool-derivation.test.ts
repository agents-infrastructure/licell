import { describe, expect, it } from 'vitest';
import { buildAgentCommandCatalog } from '../utils/command-reference';
import { appendDerivedBindingsToArgv, deriveCommandToolShape } from '../mcp/command-tool-derivation';

const catalog = buildAgentCommandCatalog();

describe('command tool derivation', () => {
  it('derives schema and bindings from shared agent command catalog', () => {
    const command = catalog.commands.find((entry) => entry.key === 'deploy check');
    expect(command).toBeDefined();
    if (!command) throw new Error('deploy check not found');

    const derived = deriveCommandToolShape(command, {
      includeExecutionProps: true,
      useArgumentHints: true
    });

    expect(derived.properties).toHaveProperty('runtime');
    expect(derived.properties).toHaveProperty('entry');
    expect(derived.properties).toHaveProperty('dockerDaemon');
    expect(derived.properties).toHaveProperty('cwd');
    expect(derived.properties).toHaveProperty('timeoutMs');
    expect(derived.optionBindings.find((binding) => binding.inputName === 'dockerDaemon')?.bindAs).toBe('boolean');
  });

  it('builds argv from derived bindings with required and number inputs', () => {
    const command = catalog.commands.find((entry) => entry.key === 'dns records add');
    expect(command).toBeDefined();
    if (!command) throw new Error('dns records add not found');

    const derived = deriveCommandToolShape(command, {
      includeExecutionProps: false,
      requiredInputs: ['rr', 'type', 'value'],
      inputOverrides: {
        ttl: { schema: { type: 'number', description: 'TTL seconds.' } }
      },
      useArgumentHints: true
    });

    const argv = ['dns', 'records', 'add'];
    appendDerivedBindingsToArgv(derived, {
      domain: 'example.com',
      rr: 'www',
      type: 'CNAME',
      value: 'demo.example.com',
      ttl: 600
    }, argv);

    expect(argv).toEqual([
      'dns', 'records', 'add',
      'example.com',
      '--rr', 'www',
      '--type', 'CNAME',
      '--value', 'demo.example.com',
      '--ttl', '600'
    ]);
  });
});
