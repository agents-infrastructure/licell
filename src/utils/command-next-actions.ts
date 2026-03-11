import type { CommandFlowStep } from './command-metadata';
import { resolveCatalogCommandFromTemplate } from './command-resolution';
import { inferCommandTaskPhaseFromText, type CommandTaskEntry, type CommandTaskEntryPhase } from './command-tasks';

export interface ResolvedCommandNextAction {
  title: string;
  description: string;
  commandTemplate: string;
  commandKey: string | null;
  commandDescription: string | null;
  phase: CommandTaskEntryPhase;
  priority: 'primary' | 'secondary';
  order: number;
  source: 'recommended-flow' | 'task' | 'error-remediation';
}

export interface CommandNextActionSeed {
  title: string;
  description: string;
  commandTemplate: string;
  phase?: CommandTaskEntryPhase;
  source: ResolvedCommandNextAction['source'];
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function inferNextActionPhase(input: {
  title: string;
  description: string;
  commandTemplate: string;
  commandKey: string | null;
  fallbackPhase?: CommandTaskEntryPhase;
}) {
  return input.fallbackPhase
    || inferCommandTaskPhaseFromText([input.commandKey, input.commandTemplate, input.title, input.description].filter(Boolean).join(' '))
    || 'general';
}

function normalizeNextActions(items: Omit<ResolvedCommandNextAction, 'priority' | 'order'>[], limit = 4) {
  const results: ResolvedCommandNextAction[] = [];
  const seenCommandTemplates = new Set<string>();
  const seenTaskKeys = new Set<string>();

  for (const item of items) {
    const commandTemplate = item.commandTemplate.trim();
    if (!commandTemplate) continue;

    const dedupeKey = [item.source, item.phase, commandTemplate, item.title.trim()].join('::');
    if (seenCommandTemplates.has(commandTemplate) || seenTaskKeys.has(dedupeKey)) continue;

    seenCommandTemplates.add(commandTemplate);
    seenTaskKeys.add(dedupeKey);
    results.push({
      ...item,
      commandTemplate,
      priority: results.length === 0 ? 'primary' : 'secondary',
      order: results.length + 1
    });

    if (results.length >= limit) break;
  }

  return results;
}

export function cloneResolvedCommandNextActions(nextActions: ResolvedCommandNextAction[]) {
  return nextActions.map((action) => ({ ...action }));
}

export function buildResolvedNextActionsFromSeeds(input: {
  actions: CommandNextActionSeed[];
  limit?: number;
}) {
  const items = input.actions.flatMap((action) => {
    const commandTemplate = action.commandTemplate.trim();
    if (!commandTemplate) return [];
    const command = resolveCatalogCommandFromTemplate(commandTemplate);
    return [{
      title: action.title.trim(),
      description: action.description.trim(),
      commandTemplate,
      commandKey: command?.key || null,
      commandDescription: command?.description || null,
      phase: inferNextActionPhase({
        title: action.title,
        description: action.description,
        commandTemplate,
        commandKey: command?.key || null,
        fallbackPhase: action.phase
      }),
      source: action.source
    }];
  });

  return normalizeNextActions(items, input.limit);
}

export function buildResolvedNextActions(input: {
  recommendedFlow?: CommandFlowStep[];
  tasks?: CommandTaskEntry[];
  limit?: number;
}) {
  const preferred: CommandNextActionSeed[] = (input.recommendedFlow || []).flatMap((step) => {
    const commandTemplate = step.command?.trim();
    if (!commandTemplate) return [];
    return [{
      title: step.title.trim(),
      description: step.reason.trim(),
      commandTemplate,
      source: 'recommended-flow' as const
    }];
  });

  const preferredPhases = new Set(buildResolvedNextActionsFromSeeds({ actions: preferred }).map((item) => item.phase));
  const fallback: CommandNextActionSeed[] = unique(input.tasks || []).flatMap((task) => {
    const commandTemplate = task.commands.find((command) => command.trim())?.trim();
    if (!commandTemplate) return [];
    if (preferred.length > 0 && preferredPhases.has(task.phase)) return [];

    return [{
      title: task.title.trim(),
      description: task.description.trim(),
      commandTemplate,
      phase: task.phase,
      source: 'task' as const
    }];
  });

  return buildResolvedNextActionsFromSeeds({
    actions: [...preferred, ...fallback],
    limit: input.limit
  });
}
