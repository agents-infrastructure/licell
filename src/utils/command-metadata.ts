import type { CatalogOption } from './command-catalog';
import { LICELL_COMMAND_MODULES, LICELL_ROOT_HELP_METADATA } from '../commands/registry';
import type {
  CommandActionHint,
  CommandFlowStep,
  CommandMetadata,
  CommandOptionInsight,
  CommandSafetyLevel,
  CommandSafetyMetadata,
  CommandSectionConfig
} from '../commands/module';

export type {
  CommandActionHint,
  CommandFlowStep,
  CommandMetadata,
  CommandOptionInsight,
  CommandSafetyLevel,
  CommandSafetyMetadata,
  CommandSectionConfig
} from '../commands/module';

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function buildCommandSectionConfig(): CommandSectionConfig[] {
  const sections: CommandSectionConfig[] = [];
  const indexById = new Map<string, number>();

  for (const module of LICELL_COMMAND_MODULES) {
    const existingIndex = indexById.get(module.section.id);
    if (existingIndex === undefined) {
      indexById.set(module.section.id, sections.length);
      sections.push({
        id: module.section.id,
        title: module.section.title,
        roots: [...module.roots],
        summary: module.section.summary,
        notes: [...(module.section.notes || [])]
      });
      continue;
    }

    const current = sections[existingIndex]!;
    current.roots = unique([...current.roots, ...module.roots]);
  }

  return sections;
}

export const COMMAND_SECTION_CONFIG: CommandSectionConfig[] = buildCommandSectionConfig();

const REGISTRY_COMMAND_METADATA: Record<string, CommandMetadata> = Object.assign(
  {},
  ...LICELL_COMMAND_MODULES
    .map((module) => module.metadata || {})
);

const RESOLVED_COMMAND_METADATA: Record<string, CommandMetadata> = {
  help: LICELL_ROOT_HELP_METADATA,
  ...REGISTRY_COMMAND_METADATA
};

const EMPTY_COMMAND_METADATA: CommandMetadata = {};

export function getCommandMetadata(key: string): CommandMetadata {
  return RESOLVED_COMMAND_METADATA[key] || EMPTY_COMMAND_METADATA;
}

export function buildCommandOptionInsights(options: Pick<CatalogOption, 'rawName' | 'flags'>[], metadata: CommandMetadata) {
  const configured = metadata.optionInsights || {};
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

export function buildExplicitRecommendedFlow(metadata: CommandMetadata) {
  return (metadata.recommendedFlow || []).map((step) => ({
    title: step.title,
    command: step.command,
    reason: step.reason
  }));
}

export function buildCommandSafetyMetadata(metadata: CommandMetadata) {
  if (!metadata.safety?.level || !metadata.safety.reason) return undefined;
  return {
    level: metadata.safety.level,
    reason: metadata.safety.reason,
    confirmFlags: [...(metadata.safety.confirmFlags || [])]
  } satisfies CommandSafetyMetadata;
}
