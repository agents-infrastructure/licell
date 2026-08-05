import type { CAC } from 'cac';
import { Config, type ProjectConfig } from '../utils/config';
import {
  type CommandRegionScope,
  normalizeRegionId,
  runWithInvocationRegion
} from '../utils/region-context';

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

export interface CommandInteractionDescriptor {
  ttyOnly?: boolean;
  prompts?: string[];
  notes?: string[];
}

export interface CommandAutomationDescriptor {
  preferredOutput?: 'json' | 'text';
  explicitInputs?: string[];
  notes?: string[];
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
  interaction?: CommandInteractionDescriptor;
  automation?: CommandAutomationDescriptor;
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
  declaredCommands?: readonly DeclaredCliCommand[];
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

export type CommandRegionBinding = 'database' | 'cache' | 'supabase';

export interface CommandRegionBindingTarget {
  argumentIndex?: number;
  option?: string;
}

export interface CommandRegionMetadata {
  scope: CommandRegionScope;
  binding?: CommandRegionBinding;
  target?: CommandRegionBindingTarget;
}

export interface DeclaredCliCommand {
  rawName: string;
  /**
   * Parser-only command signature. Use sparingly when the interactive CLI may
   * prompt for omitted opaque inputs, but machine-facing surfaces (help/docs/catalog)
   * must continue to expose the canonical required arguments via `rawName`.
   */
  cliRawName?: string;
  description: string;
  aliases?: string[];
  options?: readonly DeclaredCliOption[];
  descriptor?: CommandDescriptor;
  region?: CommandRegionMetadata;
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
type RegionalizedCliCommand<T extends DeclaredCliCommand> = Omit<T, 'options' | 'descriptor'> & {
  options: readonly DeclaredCliOption[];
  descriptor: CommandDescriptor;
};

export function defineCliCommand<const T extends DeclaredCliCommand & { region: CommandRegionMetadata }>(
  command: T
): RegionalizedCliCommand<T>;
export function defineCliCommand<const T extends DeclaredCliCommand>(command: T): T;
export function defineCliCommand(command: DeclaredCliCommand): any {
  if (!command.region) return command;

  const options = [...(command.options || [])];
  if (!options.some((option) => /(?:^|[,\s])--region(?:[\s=]|$)/.test(option.rawName))) {
    options.push({
      rawName: '--region <regionId>',
      description: '覆盖本次命令使用的阿里云地域（不修改默认配置）'
    });
  }

  const descriptor = command.descriptor || {};
  const fields = [...(descriptor.result?.fields || [])];
  if (!fields.some((field) => field.name === 'callRegionId')) {
    fields.push({
      name: 'callRegionId',
      description: '本次命令实际使用的阿里云地域 ID。',
      required: false
    });
  }

  return {
    ...command,
    options,
    descriptor: {
      ...descriptor,
      optionInsights: {
        '--region': {
          whenToUse: '需要让本次命令使用不同于默认配置的阿里云地域时使用。',
          cautions: ['只影响本次命令，不修改 auth 或项目默认地域。']
        },
        ...(descriptor.optionInsights || {})
      },
      result: {
        ...(descriptor.result || {}),
        fields
      }
    }
  };
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

function toInvocationOptions(args: unknown[]) {
  const candidate = args.at(-1);
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as Record<string, unknown>
    : {};
}

function toBindingIdentity(
  project: ProjectConfig,
  binding: CommandRegionBinding
) {
  if (binding === 'database') {
    return { id: project.database?.instanceId, region: project.database?.region };
  }
  if (binding === 'cache') {
    return { id: project.cache?.instanceId, region: project.cache?.region };
  }
  return { id: project.supabase?.instanceName, region: project.supabase?.region };
}

function resolveBindingRegion(
  command: DeclaredCliCommand,
  project: ProjectConfig,
  args: unknown[],
  options: Record<string, unknown>
) {
  const binding = command.region?.binding;
  if (!binding) return undefined;
  const identity = toBindingIdentity(project, binding);
  if (!identity.id || !identity.region) return undefined;

  const target = command.region?.target;
  const targetValue = target?.option ? options[target.option] : args[target?.argumentIndex ?? 0];
  const explicitTarget = typeof targetValue === 'string' ? targetValue.trim() : '';
  if (explicitTarget && explicitTarget !== identity.id.trim()) return undefined;
  return identity.region;
}

function resolveCommandRegion(command: DeclaredCliCommand, args: unknown[]) {
  const region = command.region;
  if (!region) return undefined;
  const options = toInvocationOptions(args);
  const explicitRegion = normalizeRegionId(options.region);
  if (explicitRegion) return explicitRegion;

  if (region.scope === 'auth' || region.scope === 'manifest') return undefined;
  const component = typeof options.component === 'string' ? options.component.trim() : undefined;
  const project = Config.getProject(component ? { component } : undefined);
  if (region.scope === 'binding') {
    return normalizeRegionId(resolveBindingRegion(command, project, args, options));
  }
  if (region.scope === 'project') {
    return normalizeRegionId(project.region);
  }
  return undefined;
}

export function registerCliCommand(cli: CAC, command: DeclaredCliCommand) {
  const instance = cli.command(command.cliRawName || command.rawName, command.description);
  (instance as typeof instance & { licellDeclaredCommand?: DeclaredCliCommand }).licellDeclaredCommand = command;
  for (const alias of command.aliases || []) {
    instance.alias(alias);
  }
  for (const option of command.options || []) {
    instance.option(option.rawName, option.description);
  }
  if (command.region) {
    const action = instance.action.bind(instance);
    instance.action = ((callback: (...args: any[]) => any) => action(function (this: unknown, ...args: any[]) {
      let defaultRegionResolved = false;
      let defaultRegion: string | undefined;
      return runWithInvocationRegion(
        {
          scope: command.region!.scope,
          regionId: resolveCommandRegion(command, args),
          resolveFallbackRegion: () => {
            if (!defaultRegionResolved) {
              defaultRegion = normalizeRegionId(Config.getDefaultRegion());
              defaultRegionResolved = defaultRegion !== undefined;
            }
            return defaultRegion;
          }
        },
        () => callback.apply(this, args)
      );
    })) as typeof instance.action;
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
    declaredCommands: [
      ...(config.mergeBundles || []).flatMap((bundle) => bundle.declaredCommands || []),
      ...(config.commands || [])
    ],
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
