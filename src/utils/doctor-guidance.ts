import { buildResolvedNextActionsFromSeeds, type ResolvedCommandNextAction } from './command-next-actions';
import type { CommandTaskEntryPhase } from './command-tasks';
import { resolveCatalogCommandFromTemplate } from './command-resolution';

export type LicellDoctorCommandIntent = 'inspect' | 'verify' | 'login' | 'restore' | 'repair' | 'configure' | 'deploy' | 'bind' | 'release';

export interface LicellDoctorRemediation {
  type: 'note' | 'command';
  text: string;
  commandTemplate?: string;
  commandKey?: string | null;
  description?: string | null;
  intent?: LicellDoctorCommandIntent;
}

export interface LicellDoctorNextCommand {
  commandTemplate: string;
  commandKey: string | null;
  description: string | null;
  intent: LicellDoctorCommandIntent;
  priority: 'primary' | 'secondary';
}

function inferDoctorCommandIntent(commandTemplate: string, commandKey: string | null): LicellDoctorCommandIntent {
  const key = (commandKey || '').trim();
  if (key === 'login') return 'login';
  if (key === 'auth restore') return 'restore';
  if (key === 'auth repair') return 'repair';
  if (key === 'doctor' || key === 'deploy check') return 'verify';
  if (
    key === 'whoami'
    || key === 'deploy spec'
    || key.endsWith(' list')
    || key.endsWith(' info')
    || key === 'logs'
    || key.startsWith('dns records list')
  ) {
    return 'inspect';
  }
  if (
    key === 'init'
    || key === 'switch'
    || key.startsWith('config ')
    || key.startsWith('env set')
  ) {
    return 'configure';
  }
  if (key.startsWith('domain ') || key.startsWith('fn domain ') || key.startsWith('oss domain ')) {
    return 'bind';
  }
  if (key.startsWith('release ')) return 'release';
  if (key === 'deploy' || key.startsWith('oss upload') || key.startsWith('oss sync up')) return 'deploy';
  return commandTemplate.includes('doctor') ? 'verify' : 'inspect';
}

export function doctorRemediationNote(
  text: string,
  input: {
    commandTemplate?: string;
    intent?: LicellDoctorCommandIntent;
  } = {}
): LicellDoctorRemediation {
  const normalizedText = text.trim();
  const commandTemplate = input.commandTemplate?.trim();
  const command = commandTemplate ? resolveCatalogCommandFromTemplate(commandTemplate) : null;
  return {
    type: 'note',
    text: normalizedText,
    ...(commandTemplate ? { commandTemplate } : {}),
    ...(commandTemplate ? { commandKey: command?.key || null } : {}),
    ...(commandTemplate ? { description: command?.description || null } : {}),
    ...(commandTemplate ? { intent: input.intent || inferDoctorCommandIntent(commandTemplate, command?.key || null) } : {})
  };
}

export function doctorRemediationCommand(
  commandTemplate: string,
  input: {
    text?: string;
    intent?: LicellDoctorCommandIntent;
  } = {}
): LicellDoctorRemediation {
  const normalizedCommandTemplate = commandTemplate.trim();
  const command = resolveCatalogCommandFromTemplate(normalizedCommandTemplate);
  return {
    type: 'command',
    text: (input.text || normalizedCommandTemplate).trim(),
    commandTemplate: normalizedCommandTemplate,
    commandKey: command?.key || null,
    description: command?.description || null,
    intent: input.intent || inferDoctorCommandIntent(normalizedCommandTemplate, command?.key || null)
  };
}

export function doctorNextCommand(
  commandTemplate: string,
  input: {
    priority?: 'primary' | 'secondary';
    intent?: LicellDoctorCommandIntent;
  } = {}
): LicellDoctorNextCommand {
  const normalizedCommandTemplate = commandTemplate.trim();
  const command = resolveCatalogCommandFromTemplate(normalizedCommandTemplate);
  return {
    commandTemplate: normalizedCommandTemplate,
    commandKey: command?.key || null,
    description: command?.description || null,
    intent: input.intent || inferDoctorCommandIntent(normalizedCommandTemplate, command?.key || null),
    priority: input.priority || 'secondary'
  };
}

export function doctorNextCommands(...commandTemplates: string[]) {
  return commandTemplates.map((commandTemplate, index) => doctorNextCommand(commandTemplate, {
    priority: index === 0 ? 'primary' : 'secondary'
  }));
}

export function normalizeDoctorRemediationItems(items: LicellDoctorRemediation[]) {
  const results = [...items];
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = `${item.type}:${item.text}:${item.commandTemplate || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeDoctorNextCommands(items: LicellDoctorNextCommand[]) {
  const results = items.map((item, index) => ({
    ...item,
    priority: item.priority || (index === 0 ? 'primary' : 'secondary')
  }));
  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.commandTemplate)) return false;
    seen.add(item.commandTemplate);
    return true;
  });
}

function mapDoctorIntentToPhase(intent: LicellDoctorCommandIntent): CommandTaskEntryPhase {
  if (intent === 'inspect') return 'inspect';
  if (intent === 'verify') return 'verify';
  return 'mutate';
}

export function buildDoctorNextActions(items: LicellDoctorNextCommand[]) {
  return buildResolvedNextActionsFromSeeds({
    actions: items.map((item) => ({
      title: item.description || item.commandTemplate,
      description: item.description || item.commandTemplate,
      commandTemplate: item.commandTemplate,
      phase: mapDoctorIntentToPhase(item.intent),
      source: 'doctor-next-command'
    })),
    limit: items.length || 4
  }).map((action, index) => ({
    ...action,
    priority: items[index]?.priority || action.priority
  })) satisfies ResolvedCommandNextAction[];
}
