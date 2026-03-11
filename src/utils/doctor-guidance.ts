import { getCommandCatalog, type CatalogCommand } from './command-catalog';

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

function resolveDoctorCatalogCommand(commandTemplate: string): CatalogCommand | null {
  const trimmed = commandTemplate.trim();
  if (!trimmed.startsWith('licell ')) return null;
  const tokens = trimmed.split(/\s+/).slice(1);
  const catalog = getCommandCatalog();
  const candidates = [...catalog.commands].sort((left, right) => right.commandTokens.length - left.commandTokens.length);
  for (const command of candidates) {
    if (tokens.length < command.commandTokens.length) continue;
    if (command.commandTokens.every((token, index) => tokens[index] === token)) return command;
  }
  return null;
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
  const command = commandTemplate ? resolveDoctorCatalogCommand(commandTemplate) : null;
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
  const command = resolveDoctorCatalogCommand(normalizedCommandTemplate);
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
  const command = resolveDoctorCatalogCommand(normalizedCommandTemplate);
  return {
    commandTemplate: normalizedCommandTemplate,
    commandKey: command?.key || null,
    description: command?.description || null,
    intent: input.intent || inferDoctorCommandIntent(normalizedCommandTemplate, command?.key || null),
    priority: input.priority || 'secondary'
  };
}

export function normalizeDoctorRemediationItems(items: Array<string | LicellDoctorRemediation>) {
  const results = items.map((item) => typeof item === 'string' ? doctorRemediationNote(item) : item);
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = `${item.type}:${item.text}:${item.commandTemplate || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeDoctorNextCommands(items: Array<string | LicellDoctorNextCommand>) {
  const results = items.map((item, index) => {
    if (typeof item !== 'string') {
      return {
        ...item,
        priority: item.priority || (index === 0 ? 'primary' : 'secondary')
      };
    }
    return doctorNextCommand(item, {
      priority: index === 0 ? 'primary' : 'secondary'
    });
  });
  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.commandTemplate)) return false;
    seen.add(item.commandTemplate);
    return true;
  });
}
