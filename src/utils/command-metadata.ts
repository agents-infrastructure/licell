import type { CatalogOption } from './command-catalog';
import { LICELL_COMMAND_MANIFEST } from '../commands/registry';
import type {
  CommandActionHint,
  CommandTaskPhase,
  CommandTaskHint,
  CommandDescriptor,
  CommandDescriptorMap,
  CommandFlowStep,
  CommandInteractionDescriptor,
  CommandOptionInsight,
  CommandResultDescriptor,
  CommandResultFieldDescriptor,
  CommandSafetyLevel,
  CommandSafetyMetadata,
  CommandSectionConfig,
  CommandAutomationDescriptor
} from '../commands/module';

export type {
  CommandActionHint,
  CommandTaskPhase,
  CommandTaskHint,
  CommandDescriptor,
  CommandDescriptorMap,
  CommandFlowStep,
  CommandInteractionDescriptor,
  CommandOptionInsight,
  CommandResultDescriptor,
  CommandResultFieldDescriptor,
  CommandSafetyLevel,
  CommandSafetyMetadata,
  CommandSectionConfig,
  CommandAutomationDescriptor
} from '../commands/module';

export interface ResolvedCommandResultFieldDescriptor {
  name: string;
  description: string;
  required: boolean;
}

export interface ResolvedCommandResultDescriptor {
  summary?: string;
  outcomeKey?: string;
  fields: ResolvedCommandResultFieldDescriptor[];
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function buildCommandSectionConfig(): CommandSectionConfig[] {
  const sections: CommandSectionConfig[] = [];
  const indexById = new Map<string, number>();

  for (const module of LICELL_COMMAND_MANIFEST.modules) {
    const existingIndex = indexById.get(module.section.id);
    if (existingIndex === undefined) {
      indexById.set(module.section.id, sections.length);
      sections.push({
        id: module.section.id,
        title: module.section.title,
        roots: [...module.roots],
        summary: module.section.summary,
        notes: [...(module.section.notes || [])],
        taskHints: (module.section.taskHints || []).map((task) => ({ ...task, commands: [...(task.commands || [])] }))
      });
      continue;
    }

    const current = sections[existingIndex]!;
    current.roots = unique([...current.roots, ...module.roots]);
  }

  return sections;
}

export const COMMAND_SECTION_CONFIG: CommandSectionConfig[] = buildCommandSectionConfig();

const REGISTRY_COMMAND_DESCRIPTORS: Record<string, CommandDescriptor> = Object.assign(
  {},
  ...LICELL_COMMAND_MANIFEST.modules
    .map((module) => module.descriptors)
);

const RESOLVED_COMMAND_DESCRIPTORS: Record<string, CommandDescriptor> = {
  ...LICELL_COMMAND_MANIFEST.root.descriptors,
  ...REGISTRY_COMMAND_DESCRIPTORS
};

const EMPTY_COMMAND_DESCRIPTOR: CommandDescriptor = {};

export function getCommandDescriptor(key: string): CommandDescriptor {
  return RESOLVED_COMMAND_DESCRIPTORS[key] || EMPTY_COMMAND_DESCRIPTOR;
}

export function buildCommandResultDescriptor(descriptor: CommandDescriptor): ResolvedCommandResultDescriptor | undefined {
  if (!descriptor.result) return undefined;
  return {
    summary: descriptor.result.summary,
    outcomeKey: descriptor.result.outcomeKey,
    fields: (descriptor.result.fields || []).map((field) => ({
      name: field.name,
      description: field.description,
      required: field.required !== false
    }))
  };
}

export function buildCommandOptionInsights(options: Pick<CatalogOption, 'rawName' | 'flags'>[], descriptor: CommandDescriptor) {
  const configured = descriptor.optionInsights || {};
  const configuredFlags = Object.keys(configured);
  if (configuredFlags.length === 0) return [] as CommandOptionInsight[];

  const insights: CommandOptionInsight[] = [];
  const seen = new Set<string>();

  for (const option of options) {
    const matchedFlag = option.flags.find((flag) => configured[flag]);
    if (!matchedFlag) continue;
    const meta = configured[matchedFlag]!;
    insights.push({
      flag: option.rawName,
      whenToUse: meta.whenToUse,
      cautions: [...(meta.cautions || [])]
    });
    seen.add(matchedFlag);
  }

  for (const flag of configuredFlags) {
    if (seen.has(flag)) continue;
    const meta = configured[flag]!;
    insights.push({
      flag,
      whenToUse: meta.whenToUse,
      cautions: [...(meta.cautions || [])]
    });
  }

  return insights;
}

export function buildExplicitRecommendedFlow(descriptor: CommandDescriptor) {
  return (descriptor.recommendedFlow || []).map((step) => ({
    title: step.title,
    command: step.command,
    reason: step.reason
  }));
}

export function buildCommandSafetyMetadata(descriptor: CommandDescriptor) {
  if (!descriptor.safety?.level || !descriptor.safety.reason) return undefined;
  return {
    level: descriptor.safety.level,
    reason: descriptor.safety.reason,
    confirmFlags: [...(descriptor.safety.confirmFlags || [])]
  } satisfies CommandSafetyMetadata;
}
