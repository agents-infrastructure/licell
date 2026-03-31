import type {
  CommandFlowStep,
  CommandSafetyLevel,
  CommandTaskPhase
} from './command-metadata';

export interface CommandSemanticLike {
  key: string;
  rawName: string;
  invocation: string;
  description: string;
}

interface CommandTextPhaseRule {
  phase: CommandTaskPhase;
  chineseKeywords: string[];
  englishTokens: string[];
}

interface CommandTaskTemplateRule {
  title: string;
  description?: string;
  suffixes: string[];
}

const TEXT_PHASE_RULES: CommandTextPhaseRule[] = [
  {
    phase: 'inspect',
    chineseKeywords: ['查看', '先看', '现状', '状态', '详情', '规格', '日志', '拉出来'],
    englishTokens: ['list', 'info', 'check', 'spec', 'status', 'whoami', 'logs', 'query', 'describe', 'get', 'pull', 'tail', 'diff']
  },
  {
    phase: 'verify',
    chineseKeywords: ['回查', '验证', '确认生效', '排查', '调试'],
    englishTokens: ['verify', 'validate', 'debug']
  },
  {
    phase: 'cleanup',
    chineseKeywords: ['解绑', '删除', '清理', '回滚', '下线', '移除'],
    englishTokens: ['unbind', 'rm', 'remove', 'delete', 'prune', 'rollback', 'stop', 'destroy']
  },
  {
    phase: 'mutate',
    chineseKeywords: ['创建', '绑定', '部署', '配置', '接入', '初始化', '升级', '启用', '设置', '写入', '开通'],
    englishTokens: ['add', 'bind', 'create', 'set', 'update', 'deploy', 'init', 'upgrade', 'promote', 'repair', 'public-access', 'rotate-password', 'reset-password', 'config', 'invoke', 'serve', 'start', 'restart', 'login']
  }
];

const PREFERRED_SUBCOMMAND_SUFFIXES: Record<CommandTaskPhase, string[]> = {
  inspect: ['list', 'info', 'check', 'spec', 'status', 'whoami', 'logs', 'query', 'describe', 'get', 'pull', 'tail'],
  mutate: ['add', 'bind', 'create', 'set', 'update', 'deploy', 'init', 'upgrade', 'promote', 'rollback', 'unbind', 'rm', 'remove', 'delete', 'prune', 'repair', 'public-access', 'rotate-password', 'reset-password', 'config', 'invoke', 'serve', 'start', 'restart'],
  verify: ['info', 'list', 'status', 'logs', 'query', 'describe', 'get', 'whoami', 'pull', 'tail'],
  cleanup: ['unbind', 'rm', 'remove', 'delete', 'prune', 'rollback', 'stop']
};

const DESTRUCTIVE_COMMAND_SUFFIXES = ['rm', 'remove', 'delete', 'unbind', 'prune', 'rollback', 'stop'];
const DESTRUCTIVE_COMMAND_TOKENS = ['public-access', 'rotate-password', 'reset-password'];
const MUTATING_COMMAND_SUFFIXES = ['deploy', 'promote', 'add', 'bind', 'create', 'init', 'repair', 'restart', 'set', 'start', 'update', 'upgrade'];
const MUTATING_COMMAND_TOKENS = ['whitelist', 'config domain', 'auth repair'];

const COMMAND_TASK_TEMPLATE_RULES: CommandTaskTemplateRule[] = [
  {
    title: '先看现状',
    description: '先确认当前资源、配置或运行状态，再继续后续动作。',
    suffixes: PREFERRED_SUBCOMMAND_SUFFIXES.inspect
  },
  {
    title: '创建或初始化',
    suffixes: ['add', 'create', 'init']
  },
  {
    title: '绑定或接入',
    suffixes: ['bind']
  },
  {
    title: '执行目标动作',
    suffixes: ['deploy', 'promote', 'set', 'update', 'config', 'public-access', 'whitelist', 'repair', 'upgrade', 'invoke', 'serve', 'start', 'restart', 'login', 'rotate-password', 'reset-password']
  },
  {
    title: '清理或回退',
    description: '在确认影响面后，再执行高影响清理或回退操作。',
    suffixes: DESTRUCTIVE_COMMAND_SUFFIXES
  }
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasPhrase(text: string, phrase: string) {
  return normalizeWhitespace(text).includes(normalizeWhitespace(phrase));
}

function hasEnglishToken(text: string, token: string) {
  const normalized = normalizeWhitespace(text);
  const pattern = new RegExp(`\\b${escapeRegex(normalizeWhitespace(token)).replace(/\s+/g, '\\s+')}\\b`);
  return pattern.test(normalized);
}

export function matchesCommandSuffix(key: string, suffix: string) {
  const normalizedKey = normalizeWhitespace(key);
  const normalizedSuffix = normalizeWhitespace(suffix);
  return normalizedKey === normalizedSuffix || normalizedKey.endsWith(` ${normalizedSuffix}`);
}

function hasAnyCommandSuffix(key: string, suffixes: string[]) {
  return suffixes.some((suffix) => matchesCommandSuffix(key, suffix));
}

function hasAnyToken(text: string, tokens: string[]) {
  return tokens.some((token) => hasEnglishToken(text, token));
}

function hasAnyChineseKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function inferCommandTaskPhaseFromText(value: string): CommandTaskPhase | undefined {
  for (const rule of TEXT_PHASE_RULES) {
    if (hasAnyChineseKeyword(value, rule.chineseKeywords)) return rule.phase;
    if (hasAnyToken(value, rule.englishTokens)) return rule.phase;
  }
  return undefined;
}

export function findPreferredSubcommandByPhase<T extends { key: string }>(
  subcommands: T[],
  phase: CommandTaskPhase,
  excludeKeys: string[] = []
) {
  const excluded = new Set(excludeKeys.map((key) => normalizeWhitespace(key)));
  for (const suffix of PREFERRED_SUBCOMMAND_SUFFIXES[phase]) {
    const match = subcommands.find((entry) => {
      const normalizedKey = normalizeWhitespace(entry.key);
      return !excluded.has(normalizedKey) && matchesCommandSuffix(entry.key, suffix);
    });
    if (match) return match;
  }
  return undefined;
}

function findCommandTaskTemplateRule(key: string) {
  return COMMAND_TASK_TEMPLATE_RULES.find((rule) => hasAnyCommandSuffix(key, rule.suffixes));
}

export function inferCommandTaskTitle(command: CommandSemanticLike) {
  return findCommandTaskTemplateRule(command.key)?.title || `使用 ${command.rawName}`;
}

export function inferCommandTaskDescription(command: CommandSemanticLike) {
  const template = findCommandTaskTemplateRule(command.key);
  return template?.description || command.description || '从这个入口开始完成当前任务。';
}

export function deriveCommandSafetyLevel(key: string): CommandSafetyLevel | undefined {
  if (hasAnyCommandSuffix(key, DESTRUCTIVE_COMMAND_SUFFIXES) || DESTRUCTIVE_COMMAND_TOKENS.some((token) => hasPhrase(key, token))) {
    return 'destructive';
  }

  if (hasAnyCommandSuffix(key, MUTATING_COMMAND_SUFFIXES)
    || MUTATING_COMMAND_TOKENS.some((token) => hasPhrase(key, token))) {
    return 'mutating';
  }

  return undefined;
}

export function deriveNamespaceSafety(subcommands: Array<{ key: string }>) {
  const hasDestructive = subcommands.some((command) => deriveCommandSafetyLevel(command.key) === 'destructive');
  if (hasDestructive) {
    return {
      level: 'destructive' as const,
      reason: '该命令族包含创建/修改/删除高影响子命令；执行前建议先用 list/info/check 获取现状。'
    };
  }

  const hasMutating = subcommands.some((command) => deriveCommandSafetyLevel(command.key) === 'mutating');
  if (hasMutating) {
    return {
      level: 'mutating' as const,
      reason: '该命令族包含会修改云端资源或本地配置的子命令。'
    };
  }

  return undefined;
}

export function deriveCommandSafety(key: string) {
  const level = deriveCommandSafetyLevel(key);
  if (!level) return undefined;

  return {
    level,
    reason: level === 'destructive'
      ? '该命令会删除、回滚、暴露公网访问或轮换关键凭证，执行前请确认影响面。'
      : '该命令会创建或修改云端资源、本地配置，建议先查看当前状态。'
  };
}

export function buildDerivedRecommendedFlow(subcommands: CommandSemanticLike[]): CommandFlowStep[] {
  if (subcommands.length === 0) return [];

  const inspect = findPreferredSubcommandByPhase(subcommands, 'inspect');
  const mutate = findPreferredSubcommandByPhase(subcommands, 'mutate');
  const verify = findPreferredSubcommandByPhase(subcommands, 'verify', inspect ? [inspect.key] : []);
  const steps: CommandFlowStep[] = [];

  if (inspect) {
    steps.push({
      title: '先获取现状',
      command: inspect.invocation,
      reason: '先确认当前资源、配置或上下文，降低误操作概率。'
    });
  }

  if (mutate) {
    steps.push({
      title: '再执行目标动作',
      command: mutate.invocation,
      reason: '在上下文明确后，再进行创建、修改或清理。'
    });
  }

  if (verify || inspect) {
    steps.push({
      title: '最后校验结果',
      command: (verify || inspect)!.invocation,
      reason: '确认结果已经生效，便于继续自动化编排。'
    });
  }

  return steps;
}
