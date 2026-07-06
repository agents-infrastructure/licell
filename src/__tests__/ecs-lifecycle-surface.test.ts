import { describe, expect, it } from 'vitest';
import {
  ecsStartCommand,
  ecsRebootCommand,
  ecsStopCommand,
  ecsDeleteCommand,
  ecsRmCommand,
  ecsStatusMatchesTarget
} from '../commands/ecs-lifecycle';
import type { DeclaredCliCommand } from '../commands/module';

// Cross-command surface consistency regression for the ECS lifecycle command set.
// This suite guards uniformity of the safety / confirmation / verify contract
// across start/reboot/stop/delete/rm so the surface does not drift as commands land.

interface LifecycleCommandSpec {
  key: string;
  command: DeclaredCliCommand;
  expectedLevel: 'mutating' | 'destructive';
  expectedConfirmFlags: string[];
}

const LIFECYCLE_COMMANDS: LifecycleCommandSpec[] = [
  { key: 'ecs start', command: ecsStartCommand, expectedLevel: 'mutating', expectedConfirmFlags: [] },
  { key: 'ecs reboot', command: ecsRebootCommand, expectedLevel: 'mutating', expectedConfirmFlags: ['--yes'] },
  { key: 'ecs stop', command: ecsStopCommand, expectedLevel: 'destructive', expectedConfirmFlags: ['--yes'] },
  { key: 'ecs delete', command: ecsDeleteCommand, expectedLevel: 'destructive', expectedConfirmFlags: ['--yes'] },
  { key: 'ecs rm', command: ecsRmCommand, expectedLevel: 'destructive', expectedConfirmFlags: ['--yes'] }
];

function resultFieldNames(command: DeclaredCliCommand): string[] {
  return (command.descriptor?.result?.fields || []).map((field) => field.name);
}

describe('ecs lifecycle surface consistency', () => {
  it('H5: safety level and confirmFlags matrix is consistent across all lifecycle commands', () => {
    for (const spec of LIFECYCLE_COMMANDS) {
      const safety = spec.command.descriptor?.safety;
      expect(safety?.level, `${spec.key} safety.level`).toBe(spec.expectedLevel);
      expect(safety?.confirmFlags, `${spec.key} confirmFlags`).toEqual(spec.expectedConfirmFlags);
    }
  });

  it('H4: only start executes without a confirm flag; reboot/stop/delete/rm require --yes', () => {
    const startSafety = ecsStartCommand.descriptor?.safety;
    expect(startSafety?.confirmFlags).toEqual([]);
    for (const spec of LIFECYCLE_COMMANDS.filter((s) => s.key !== 'ecs start')) {
      expect(spec.command.descriptor?.safety?.confirmFlags).toContain('--yes');
    }
  });

  it('H3: every lifecycle command exposes a --dry-run option', () => {
    for (const spec of LIFECYCLE_COMMANDS) {
      const optionNames = (spec.command.options || []).map((option) => option.rawName);
      expect(optionNames, `${spec.key} options`).toContain('--dry-run');
    }
  });

  it('H8: plan/verify result contract is field-level consistent across commands', () => {
    for (const spec of LIFECYCLE_COMMANDS) {
      const fields = resultFieldNames(spec.command);
      // Uniform plan fields
      for (const planField of ['plan.action', 'plan.regionId', 'plan.instanceId', 'plan.currentStatusClass', 'plan.requiresConfirmation', 'plan.willExecute']) {
        expect(fields, `${spec.key} ${planField}`).toContain(planField);
      }
      // Execution requestId is present but optional (dry-run omits execution)
      expect(fields, `${spec.key} execution.requestId`).toContain('execution.requestId');
      expect(fields, `${spec.key} verify.reachedTarget`).toContain('verify.reachedTarget');
    }
  });

  it('H8: state-transition commands expose statusClass/timedOut; delete exposes notFound terminal', () => {
    for (const key of ['ecs start', 'ecs reboot', 'ecs stop']) {
      const spec = LIFECYCLE_COMMANDS.find((s) => s.key === key)!;
      const fields = resultFieldNames(spec.command);
      expect(fields, `${key} verify.statusClass`).toContain('verify.statusClass');
      expect(fields, `${key} verify.timedOut`).toContain('verify.timedOut');
    }
    for (const key of ['ecs delete', 'ecs rm']) {
      const spec = LIFECYCLE_COMMANDS.find((s) => s.key === key)!;
      const fields = resultFieldNames(spec.command);
      expect(fields, `${key} verify.notFound`).toContain('verify.notFound');
      expect(fields, `${key} plan.releaseFacts`).toContain('plan.releaseFacts');
    }
  });

  it('verify target matching is action-specific and does not accept unrelated transitional statuses', () => {
    expect(ecsStatusMatchesTarget('Starting', ['Running', 'Starting'])).toBe(true);
    expect(ecsStatusMatchesTarget('Stopping', ['Running', 'Starting'])).toBe(false);
    expect(ecsStatusMatchesTarget('Rebooting', ['Running', 'Rebooting', 'Starting'])).toBe(true);
    expect(ecsStatusMatchesTarget('Stopping', ['Running', 'Rebooting', 'Starting'])).toBe(false);
    expect(ecsStatusMatchesTarget('Stopping', ['Stopped', 'Stopping'])).toBe(true);
    expect(ecsStatusMatchesTarget('Starting', ['Stopped', 'Stopping'])).toBe(false);
  });

  it('H4/H5: every lifecycle command declares a dry-run -> execute -> verify recommendedFlow', () => {
    for (const spec of LIFECYCLE_COMMANDS) {
      const flow = spec.command.descriptor?.recommendedFlow || [];
      expect(flow.length, `${spec.key} recommendedFlow`).toBeGreaterThanOrEqual(3);
      const commands = flow.map((step) => step.command || '').join(' ');
      expect(commands, `${spec.key} dry-run in flow`).toContain('--dry-run');
    }
  });

  it('does not introduce run/create lifecycle commands', () => {
    const keys = LIFECYCLE_COMMANDS.map((s) => s.key);
    expect(keys).not.toContain('ecs run');
    expect(keys).not.toContain('ecs create');
  });
});
