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
const ECS_FORBIDDEN_COMMANDS = ['ecs run', 'ecs create'];

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
    expect(surface.nextActions.map((action) => action.commandTemplate)).toEqual([
      'licell db list',
      'licell db add',
      'licell db info <instanceId>'
    ]);
    expect(surface.nextActions[0]?.priority).toBe('primary');
    expect(surface.automation?.preferredOutput).toBe('json');
    expect(surface.automation?.notes).toEqual([]);
  });

  it('resolves explicit recommended flow for deploy command scopes with child commands', () => {
    const deploy = catalog.commandsByKey['deploy']!;
    const subcommands = ['deploy spec', 'deploy check']
      .map((key) => catalog.commandsByKey[key]!)
      .map((command) => ({
        key: command.key,
        rawName: command.rawName,
        invocation: toLicellInvocation(command.rawName),
        description: command.description
      }));

    const surface = buildCommandSurfaceMetadata({
      scope: 'command',
      key: 'deploy',
      command: deploy,
      subcommands,
      descriptor: getCommandDescriptor('deploy'),
      extraTokens: []
    });

    expect(surface.recommendedFlow[0]?.command).toBe('licell deploy spec');
    expect(surface.nextActions.map((action) => action.commandTemplate)).toEqual(expect.arrayContaining([
      'licell deploy spec',
      'licell deploy check'
    ]));
    expect(surface.nextActions[0]?.commandTemplate).toBe('licell deploy spec');
    expect(surface.nextActions[1]?.commandTemplate).toBe('licell deploy check');
    expect(surface.agentTips.some((tip) => tip.includes('deploy spec') && tip.includes('deploy check'))).toBe(true);
  });

  it('exposes ecs list metadata for agent-safe JSON automation', () => {
    const ecsList = catalog.commandsByKey['ecs list']!;
    const surface = buildCommandSurfaceMetadata({
      scope: 'command',
      key: 'ecs list',
      command: ecsList,
      subcommands: [],
      descriptor: getCommandDescriptor('ecs list'),
      extraTokens: []
    });

    expect(surface.automation?.preferredOutput).toBe('json');
    expect(surface.safety?.level).toBe('safe');
    expect(surface.examples).toContain('licell ecs list --output json');
    expect(surface.optionInsights?.some((item) => item.flag === '--tag <key=value>')).toBe(true);
    expect(surface.optionInsights?.some((item) => item.flag === '--name-prefix <prefix>')).toBe(true);
    expect(surface.result?.fields.some((field) => field.name === 'instances[]')).toBe(true);
    expect(surface.result?.fields.some((field) => field.name === 'filters')).toBe(true);
  });

  it('exposes ecs info metadata for agent-safe JSON automation', () => {
    const ecsInfo = catalog.commandsByKey['ecs info']!;
    const surface = buildCommandSurfaceMetadata({
      scope: 'command',
      key: 'ecs info',
      command: ecsInfo,
      subcommands: [],
      descriptor: getCommandDescriptor('ecs info'),
      extraTokens: []
    });

    expect(surface.automation?.preferredOutput).toBe('json');
    expect(surface.safety?.level).toBe('safe');
    expect(surface.examples).toContain('licell ecs info i-xxx --output json');
    expect(surface.optionInsights?.some((item) => item.flag === '--region <regionId>')).toBe(true);
    expect(surface.result?.fields.some((field) => field.name === 'detail.summary')).toBe(true);
    expect(surface.result?.fields.some((field) => field.name === 'detail.summary.securityGroupIds[]')).toBe(true);
    expect(surface.result?.fields.map((field) => field.name).join(' ')).not.toMatch(/rawAttribute|userData|vncUrl|consoleOutput|password|keyPairPrivateKey/);
  });

  it('exposes ecs namespace guidance across inspect and lifecycle commands, excluding run/create', () => {
    const subcommands = ['ecs list', 'ecs info', 'ecs start', 'ecs reboot', 'ecs stop', 'ecs delete', 'ecs rm']
      .map((key) => catalog.commandsByKey[key]!)
      .map((command) => ({
        key: command.key,
        rawName: command.rawName,
        invocation: toLicellInvocation(command.rawName),
        description: command.description
      }));
    const surface = buildCommandSurfaceMetadata({
      scope: 'namespace',
      key: 'ecs',
      subcommands,
      descriptor: getCommandDescriptor('ecs'),
      extraTokens: []
    });

    expect(surface.examples).toContain('licell ecs list --output json');
    expect(surface.examples).toContain('licell ecs info <instanceId> --output json');
    expect(surface.examples).toContain('licell ecs start <instanceId> --dry-run --output json');
    const serialized = JSON.stringify(surface);
    for (const command of ECS_FORBIDDEN_COMMANDS) {
      expect(serialized).not.toContain(command);
    }
    expect(surface.recommendedFlow.map((step) => step.command)).toEqual([
      'licell ecs list --output json',
      'licell ecs info <instanceId> --output json',
      'licell ecs start <instanceId> --dry-run --output json',
      'licell ecs start <instanceId>'
    ]);
  });
});
