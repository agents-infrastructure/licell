import type { CAC } from 'cac';

export interface CommandActionHint {
  name: string;
  description: string;
}

export type CommandTaskPhase = 'inspect' | 'mutate' | 'verify' | 'cleanup';

export interface CommandTaskHint {
  title: string;
  description: string;
  commands?: string[];
  phase?: CommandTaskPhase;
}

export type CommandSafetyLevel = 'safe' | 'mutating' | 'destructive';

export interface CommandSafetyMetadata {
  level: CommandSafetyLevel;
  reason: string;
  confirmFlags: string[];
}

export interface CommandOptionInsight {
  flag: string;
  whenToUse: string;
  cautions: string[];
}

export interface CommandFlowStep {
  title: string;
  command?: string;
  reason: string;
}

export interface CommandResultFieldDescriptor {
  name: string;
  description: string;
  required?: boolean;
}

export interface CommandResultDescriptor {
  summary?: string;
  outcomeKey?: string;
  fields?: CommandResultFieldDescriptor[];
}

export interface CommandDescriptor {
  title?: string;
  summary?: string;
  notes?: string[];
  examples?: string[];
  agentTips?: string[];
  actionHints?: CommandActionHint[];
  taskHints?: CommandTaskHint[];
  argumentHints?: Record<string, string>;
  related?: string[];
  safety?: Partial<CommandSafetyMetadata>;
  optionInsights?: Record<string, { whenToUse: string; cautions?: string[] }>;
  recommendedFlow?: CommandFlowStep[];
  result?: CommandResultDescriptor;
}

export type CommandDescriptorMap = Record<string, CommandDescriptor>;

export interface CommandSectionMembership {
  id: string;
  title: string;
  summary?: string;
  notes?: readonly string[];
  taskHints?: readonly CommandTaskHint[];
}

export interface CommandSectionConfig {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  notes?: string[];
  taskHints?: CommandTaskHint[];
}

export interface LicellCommandSurface {
  roots: string[];
  register(cli: CAC): void;
  descriptors: CommandDescriptorMap;
}

export interface LicellCommandBundle extends LicellCommandSurface {}

export interface LicellCommandModule extends LicellCommandSurface {
  section: CommandSectionMembership;
}

export interface LicellCommandManifest {
  root: LicellCommandSurface;
  modules: readonly LicellCommandModule[];
}

export type CommandManifestIssueCode =
  | 'root_help_missing'
  | 'root_roots_not_empty'
  | 'surface_register_invalid'
  | 'module_roots_empty'
  | 'module_root_duplicate'
  | 'module_descriptors_empty'
  | 'descriptor_key_invalid'
  | 'descriptor_key_duplicate'
  | 'descriptor_key_root_mismatch'
  | 'section_invalid'
  | 'section_inconsistent';

export interface CommandManifestIssue {
  code: CommandManifestIssueCode;
  subject: string;
  message: string;
}

function defineCommandDescriptors<const T extends CommandDescriptorMap>(descriptors: T) {
  return descriptors;
}

export interface DeclaredCliOption {
  rawName: string;
  description: string;
}

export interface DeclaredCliCommand {
  rawName: string;
  description: string;
  aliases?: string[];
  options?: readonly DeclaredCliOption[];
  descriptor?: CommandDescriptor;
}

function normalizeDescriptorKey(key: string) {
  return key.trim().replace(/\s+/g, ' ');
}

function descriptorRootKey(key: string) {
  return normalizeDescriptorKey(key).split(/\s+/).filter(Boolean)[0] || '';
}

function sectionSignature(section: CommandSectionMembership) {
  return JSON.stringify({
    title: section.title,
    summary: section.summary || '',
    notes: [...(section.notes || [])],
    taskHints: (section.taskHints || []).map((task) => ({
      title: task.title,
      description: task.description,
      commands: [...(task.commands || [])],
      phase: task.phase
    }))
  });
}

export function collectCommandManifestIssues(manifest: LicellCommandManifest): CommandManifestIssue[] {
  const issues: CommandManifestIssue[] = [];
  const descriptorOwners = new Map<string, string>();
  const sectionById = new Map<string, string>();
  const rootOwners = new Map<string, string>();

  const pushIssue = (issue: CommandManifestIssue) => {
    issues.push(issue);
  };

  const validateSurface = (surface: LicellCommandSurface, owner: string, kind: 'root' | 'module') => {
    if (typeof surface.register !== 'function') {
      pushIssue({ code: 'surface_register_invalid', subject: owner, message: `${owner} must provide a register(cli) function.` });
    }

    const uniqueRoots = [...new Set(surface.roots)];
    if (uniqueRoots.length !== surface.roots.length) {
      pushIssue({ code: 'module_root_duplicate', subject: owner, message: `${owner} declares duplicate roots: ${surface.roots.join(', ')}.` });
    }

    if (kind === 'root') {
      if (surface.roots.length > 0) {
        pushIssue({ code: 'root_roots_not_empty', subject: owner, message: `${owner} should not own command roots.` });
      }
      if (!surface.descriptors.help) {
        pushIssue({ code: 'root_help_missing', subject: owner, message: `${owner} must provide a \`help\` descriptor.` });
      }
    } else if (surface.roots.length === 0) {
      pushIssue({ code: 'module_roots_empty', subject: owner, message: `${owner} must expose at least one root command.` });
    }

    const descriptorKeys = Object.keys(surface.descriptors);
    if (kind === 'module' && descriptorKeys.length === 0) {
      pushIssue({ code: 'module_descriptors_empty', subject: owner, message: `${owner} must expose at least one descriptor.` });
    }

    for (const root of surface.roots) {
      const normalizedRoot = root.trim();
      if (!normalizedRoot) {
        pushIssue({ code: 'module_roots_empty', subject: owner, message: `${owner} contains an empty root entry.` });
        continue;
      }
      const existingRootOwner = rootOwners.get(normalizedRoot);
      if (existingRootOwner && existingRootOwner !== owner) {
        pushIssue({ code: 'module_root_duplicate', subject: normalizedRoot, message: `Root \`${normalizedRoot}\` is owned by both ${existingRootOwner} and ${owner}.` });
      } else {
        rootOwners.set(normalizedRoot, owner);
      }
    }

    for (const key of descriptorKeys) {
      const normalizedKey = normalizeDescriptorKey(key);
      if (!normalizedKey || normalizedKey !== key) {
        pushIssue({ code: 'descriptor_key_invalid', subject: `${owner}:${key}`, message: `${owner} has an invalid descriptor key: ${JSON.stringify(key)}.` });
        continue;
      }

      const existingOwner = descriptorOwners.get(normalizedKey);
      if (existingOwner && existingOwner !== owner) {
        pushIssue({ code: 'descriptor_key_duplicate', subject: normalizedKey, message: `Descriptor \`${normalizedKey}\` is declared by both ${existingOwner} and ${owner}.` });
      } else {
        descriptorOwners.set(normalizedKey, owner);
      }

      if (kind === 'module') {
        const rootKey = descriptorRootKey(normalizedKey);
        if (rootKey && !surface.roots.includes(rootKey)) {
          pushIssue({ code: 'descriptor_key_root_mismatch', subject: normalizedKey, message: `${owner} declares descriptor \`${normalizedKey}\` outside its roots [${surface.roots.join(', ')}].` });
        }
      }
    }
  };

  validateSurface(manifest.root, 'manifest.root', 'root');

  for (const module of manifest.modules) {
    if (!module.section.id.trim() || !module.section.title.trim()) {
      pushIssue({ code: 'section_invalid', subject: module.section.id || '(empty)', message: `Module section metadata must include non-empty id and title.` });
    }

    const signature = sectionSignature(module.section);
    const existingSignature = sectionById.get(module.section.id);
    if (existingSignature && existingSignature !== signature) {
      pushIssue({ code: 'section_inconsistent', subject: module.section.id, message: `Section \`${module.section.id}\` is declared with inconsistent title/summary/notes across modules.` });
    } else {
      sectionById.set(module.section.id, signature);
    }

    validateSurface(module, `module:${module.section.id}:${module.roots.join('|') || '(empty)'}`, 'module');
  }

  return issues;
}

export function assertCommandManifest<T extends LicellCommandManifest>(manifest: T): T {
  const issues = collectCommandManifestIssues(manifest);
  if (issues.length === 0) return manifest;
  const lines = issues.map((issue) => `- [${issue.code}] ${issue.message}`);
  throw new Error(`Invalid command manifest:
${lines.join('\n')}`);
}

export function defineCommandManifest<const T extends LicellCommandManifest>(manifest: T) {
  return assertCommandManifest(manifest);
}
export function defineCliCommand<const T extends DeclaredCliCommand>(command: T) {
  return command;
}

function toCommandKey(rawName: string) {
  return rawName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !((token.startsWith('<') && token.endsWith('>')) || (token.startsWith('[') && token.endsWith(']'))))
    .join(' ');
}

export function commandInvocation(command: Pick<DeclaredCliCommand, 'rawName'>) {
  const key = toCommandKey(command.rawName);
  return key ? `licell ${key}` : 'licell';
}

export function registerCliCommand(cli: CAC, command: DeclaredCliCommand) {
  const instance = cli.command(command.rawName, command.description);
  for (const alias of command.aliases || []) {
    instance.alias(alias);
  }
  for (const option of command.options || []) {
    instance.option(option.rawName, option.description);
  }
  return instance;
}

export function buildCommandDescriptors(input: {
  commands: readonly DeclaredCliCommand[];
  namespaces?: CommandDescriptorMap;
}) {
  const descriptors: CommandDescriptorMap = {
    ...(input.namespaces || {})
  };

  for (const command of input.commands) {
    const key = toCommandKey(command.rawName);
    if (!key) continue;
    descriptors[key] = {
      ...(command.description.trim() ? { summary: command.description.trim() } : {}),
      ...(command.descriptor || {})
    };
  }

  return defineCommandDescriptors(descriptors);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function toRootKey(value: string) {
  const normalized = toCommandKey(value);
  return normalized.split(/\s+/).filter(Boolean)[0] || '';
}

function inferRootsFromCommands(commands: readonly DeclaredCliCommand[]) {
  return uniqueStrings(
    commands.flatMap((command) => [command.rawName, ...(command.aliases || [])])
      .map((value) => toRootKey(value))
      .filter(Boolean)
  );
}

function inferRootsFromDescriptors(descriptors: CommandDescriptorMap) {
  return uniqueStrings(
    Object.keys(descriptors)
      .map((key) => key.trim().split(/\s+/).filter(Boolean)[0] || '')
      .filter(Boolean)
  );
}

interface DeclaredCommandSurfaceConfig {
  register: (cli: CAC) => void;
  commands?: readonly DeclaredCliCommand[];
  namespaces?: CommandDescriptorMap;
  descriptors?: CommandDescriptorMap;
  mergeBundles?: readonly LicellCommandSurface[];
  roots?: string[];
}

function defineCommandSurface(config: DeclaredCommandSurfaceConfig): LicellCommandSurface {
  const baseDescriptors = config.descriptors || buildCommandDescriptors({
    commands: config.commands || [],
    namespaces: config.namespaces
  });
  const descriptors = defineCommandDescriptors(Object.assign(
    {},
    ...(config.mergeBundles || []).map((bundle) => bundle.descriptors),
    baseDescriptors
  ));
  const roots = uniqueStrings(
    ((config.roots !== undefined
      ? config.roots
      : [
        ...(config.mergeBundles || []).flatMap((bundle) => bundle.roots),
        ...inferRootsFromCommands(config.commands || []),
        ...inferRootsFromDescriptors(descriptors)
      ])
      .filter(Boolean))
  );

  return {
    roots,
    register: config.register,
    descriptors
  };
}

export function defineCommandBundle(config: DeclaredCommandSurfaceConfig): LicellCommandBundle {
  return defineCommandSurface(config);
}

export function defineCommandModule(config: DeclaredCommandSurfaceConfig & {
  section: CommandSectionMembership;
}): LicellCommandModule {
  const surface = defineCommandSurface(config);
  return {
    ...surface,
    section: config.section
  };
}
