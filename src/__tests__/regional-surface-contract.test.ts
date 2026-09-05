import { describe, expect, it } from 'vitest';
import { getCommandCatalog } from '../utils/command-catalog';
import { buildAgentCommandCatalog } from '../utils/command-reference';
import { buildHelpSemanticDocument } from '../utils/help';
import { getCommandDescriptor } from '../utils/command-metadata';

const catalog = getCommandCatalog();

function regionOptions(commandKey: string) {
  return catalog.commandsByKey[commandKey]?.options.filter((option) => option.flags.includes('--region')) || [];
}

describe('regional command surface contract', () => {
  it('derives all 124 invocation overrides from shared registry metadata', () => {
    const regionalCommands = catalog.commands.filter((command) => command.region);
    expect(regionalCommands).toHaveLength(124);

    for (const command of regionalCommands) {
      expect(regionOptions(command.key), command.key).toHaveLength(1);
      expect(command.regionOptionMode, command.key).toBeUndefined();
      expect(getCommandDescriptor(command.key)?.result?.fields, command.key).toContainEqual({
        name: 'callRegionId',
        description: command.key === 'deploy plan'
          ? '本次 plan 的 project-scope 调用地域；异构 workspace 中各 component 的目标地域仍以 `components[].target.region` 为准。'
          : '本次命令实际使用的阿里云地域 ID。',
        required: false
      });
    }
  });

  it('classifies all 129 region options as invocation override or explicit default configuration', () => {
    const commandsWithRegionOption = catalog.commands.filter((command) => regionOptions(command.key).length > 0);
    expect(commandsWithRegionOption).toHaveLength(129);
    expect(commandsWithRegionOption.every((command) => Boolean(command.region) !== Boolean(command.regionOptionMode))).toBe(true);

    expect(Object.fromEntries(
      commandsWithRegionOption
        .filter((command) => command.regionOptionMode)
        .map((command) => [command.key, command.regionOptionMode])
    )).toEqual({
      login: 'auth-default',
      'auth repair': 'auth-default',
      switch: 'auth-default',
      bootstrap: 'project-default',
      'workspace init': 'project-default'
    });
  });

  it('requires all 158 registered commands to declare exactly one region classification', () => {
    expect(catalog.commands).toHaveLength(158);
    expect(catalog.commands.filter((command) => command.regionExclusion)).toHaveLength(29);

    for (const command of catalog.commands) {
      expect([
        command.region,
        command.regionOptionMode,
        command.regionExclusion
      ].filter(Boolean), command.key).toHaveLength(1);
    }
  });

  it('migrates the existing OSS, ECS, logs and db info surfaces without changing raw flags', () => {
    const ossCommands = catalog.commands.filter((command) => command.rootCommand === 'oss');
    const ecsCommands = catalog.commands.filter((command) => command.rootCommand === 'ecs');
    const logsCommands = catalog.commands.filter((command) => command.rootCommand === 'logs');
    expect(ossCommands).toHaveLength(19);
    expect(ecsCommands).toHaveLength(7);
    expect(logsCommands).toHaveLength(5);
    expect([...ossCommands, ...ecsCommands, ...logsCommands].every((command) => command.region?.scope === 'auth')).toBe(true);
    expect(catalog.commandsByKey['db info']?.region).toEqual({
      scope: 'binding',
      binding: 'database',
      target: { argumentIndex: 0 }
    });
    expect(catalog.commandsByKey['db restore plan']?.region).toEqual({
      scope: 'binding',
      binding: 'database',
      target: { argumentIndex: 0 }
    });
    expect(regionOptions('logs query')[0]?.rawName).toBe('-r, --region <region>');
    expect(regionOptions('logs tail')[0]?.rawName).toBe('-r, --region <region>');
  });

  it('keeps explicitly excluded local and restore commands non-regional', () => {
    for (const key of ['auth restore', 'e2e list', 'state show', 'deploy spec', 'deploy check']) {
      const command = catalog.commandsByKey[key];
      expect(command, key).toBeDefined();
      expect(command?.region, key).toBeUndefined();
      expect(command?.regionOptionMode, key).toBeUndefined();
      expect(command?.regionExclusion, key).toBeDefined();
      expect(regionOptions(key), key).toHaveLength(0);
    }
  });

  it('exposes region semantics through structured help and the agent catalog', () => {
    const agentCatalog = buildAgentCommandCatalog(catalog);
    expect(agentCatalog.commands.find((command) => command.key === 'deploy')?.region).toEqual({
      scope: 'project'
    });
    expect(agentCatalog.commands.find((command) => command.key === 'db info')?.region).toEqual({
      scope: 'binding',
      binding: 'database',
      target: { argumentIndex: 0 }
    });
    expect(agentCatalog.commands.find((command) => command.key === 'workspace init')?.regionOptionMode).toBe('project-default');

    expect(buildHelpSemanticDocument({
      argv: ['node', 'src/cli.ts', 'logs', 'query', '--help'],
      catalog
    })?.region).toEqual({ scope: 'auth' });
    expect(buildHelpSemanticDocument({
      argv: ['node', 'src/cli.ts', 'login', '--help'],
      catalog
    })?.regionOptionMode).toBe('auth-default');
  });
});
