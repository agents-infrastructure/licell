import { describe, expect, it } from 'vitest';
import {
  buildCommandSurfaceMetadata,
  formatInvocationWithSelection,
  stripArgsFromUsage,
  toLicellInvocation
} from '../utils/command-surface-metadata';
import { getCommandCatalog } from '../utils/command-catalog';
import { getCommandDescriptor } from '../utils/command-metadata';

const catalog = getCommandCatalog();

describe('command surface metadata', () => {
  it('shares invocation helpers across surfaces', () => {
    expect(toLicellInvocation('deploy check')).toBe('licell deploy check');
    expect(stripArgsFromUsage('deploy spec [runtime]')).toBe('deploy spec');

    const deploySpec = catalog.commandsByKey['deploy spec']!;
    expect(formatInvocationWithSelection(deploySpec, ['nodejs22'])).toBe('licell deploy spec nodejs22');
  });

  it('builds derived command metadata when descriptor is sparse', () => {
    const releasePrune = catalog.commandsByKey['release prune']!;
    const subcommands: Array<{ key: string; rawName: string; invocation: string; description: string }> = [];
    const surface = buildCommandSurfaceMetadata({
      scope: 'command',
      key: releasePrune.key,
      command: releasePrune,
      subcommands,
      descriptor: {},
      extraTokens: []
    });

    expect(surface.safety?.level).toBe('destructive');
    expect(surface.examples).toContain('licell release prune');
    expect(surface.examples).toContain('licell release prune --output json');
  });

  it('builds derived namespace guidance from subcommands', () => {
    const descriptor = {};
    const subcommands = ['db list', 'db add', 'db info']
      .map((key) => catalog.commandsByKey[key]!)
      .map((command) => ({
        key: command.key,
        rawName: command.rawName,
        invocation: toLicellInvocation(command.rawName),
        description: command.description
      }));

    const surface = buildCommandSurfaceMetadata({
      scope: 'namespace',
      key: 'db',
      subcommands,
      descriptor,
      extraTokens: []
    });

    expect(surface.examples[0]).toBe('licell db list --output json');
    expect(surface.recommendedFlow.map((step) => step.command)).toEqual([
      'licell db list',
      'licell db add',
      'licell db info <instanceId>'
    ]);
    expect(surface.agentTips).toContain('自动化调用时优先追加 `--output json`，获取稳定的结构化结果。');
  });

  it('derives recommended flow for command scopes with child commands', () => {
    const mcp = catalog.commandsByKey['mcp']!;
    const subcommands = ['mcp init', 'mcp serve']
      .map((key) => catalog.commandsByKey[key]!)
      .map((command) => ({
        key: command.key,
        rawName: command.rawName,
        invocation: toLicellInvocation(command.rawName),
        description: command.description
      }));

    const surface = buildCommandSurfaceMetadata({
      scope: 'command',
      key: 'mcp',
      command: mcp,
      subcommands,
      descriptor: getCommandDescriptor('mcp'),
      extraTokens: []
    });

    expect(surface.recommendedFlow[0]?.command).toBe('licell mcp init');
    expect(surface.agentTips.some((tip) => tip.includes('mcp serve'))).toBe(true);
  });
});
