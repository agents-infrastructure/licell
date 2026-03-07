import type { CAC } from 'cac';

export interface CommandActionHint {
  name: string;
  description: string;
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

export interface CommandMetadata {
  summary?: string;
  notes?: string[];
  examples?: string[];
  agentTips?: string[];
  actionHints?: CommandActionHint[];
  argumentHints?: Record<string, string>;
  related?: string[];
  safety?: Partial<CommandSafetyMetadata>;
  optionInsights?: Record<string, { whenToUse: string; cautions?: string[] }>;
  recommendedFlow?: CommandFlowStep[];
}

export type CommandMetadataMap = Record<string, CommandMetadata>;

export interface CommandSectionMembership {
  id: string;
  title: string;
  summary?: string;
  notes?: readonly string[];
}

export interface CommandSectionConfig {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  notes?: string[];
}

export interface LicellCommandModule {
  roots: string[];
  register(cli: CAC): void;
  section: CommandSectionMembership;
  metadata?: CommandMetadataMap;
}
