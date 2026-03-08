import type {
  CommandDescriptor,
  CommandTaskHint,
  CommandTaskPhase
} from './command-metadata';
import {
  findPreferredSubcommandByPhase,
  inferCommandTaskDescription as inferSemanticCommandTaskDescription,
  inferCommandTaskPhaseFromText as inferSemanticCommandTaskPhaseFromText,
  inferCommandTaskTitle as inferSemanticCommandTaskTitle
} from './command-semantics';

export type CommandTaskEntryPhase = CommandTaskPhase | 'general';

export interface CommandTaskEntry {
  title: string;
  description: string;
  commands: string[];
  phase: CommandTaskEntryPhase;
}

export interface CommandTaskGroup {
  phase: CommandTaskEntryPhase;
  title: string;
  tasks: CommandTaskEntry[];
}

export interface CommandTaskCommandLike {
  key: string;
  rawName: string;
  invocation: string;
  description: string;
}

const TASK_PHASE_ORDER: CommandTaskEntryPhase[] = ['inspect', 'mutate', 'verify', 'cleanup', 'general'];

const TASK_PHASE_TITLES: Record<CommandTaskEntryPhase, string> = {
  inspect: 'Inspect',
  mutate: 'Mutate',
  verify: 'Verify',
  cleanup: 'Cleanup',
  general: 'General'
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function inferCommandTaskPhaseFromText(value: string): CommandTaskEntryPhase | undefined {
  return inferSemanticCommandTaskPhaseFromText(value);
}

export function inferCommandTaskPhase(task: {
  phase?: CommandTaskEntryPhase;
  title: string;
  description: string;
  commands: string[];
}): CommandTaskEntryPhase {
  if (task.phase) return task.phase;

  const commandPhase = inferCommandTaskPhaseFromText(task.commands.join(' '));
  if (commandPhase) return commandPhase;

  const titlePhase = inferCommandTaskPhaseFromText(task.title);
  if (titlePhase) return titlePhase;

  const descriptionPhase = inferCommandTaskPhaseFromText(task.description);
  if (descriptionPhase) return descriptionPhase;

  return 'general';
}

export function normalizeCommandTasks(tasks: Array<CommandTaskHint | CommandTaskEntry | undefined>) {
  const normalized = tasks
    .filter((task): task is CommandTaskHint | CommandTaskEntry => Boolean(task && task.title.trim() && task.description.trim()))
    .map((task) => {
      const commands = unique((task.commands || []).map((command) => command.trim()).filter(Boolean));
      return {
        title: task.title.trim(),
        description: task.description.trim(),
        commands,
        phase: inferCommandTaskPhase({
          phase: task.phase,
          title: task.title.trim(),
          description: task.description.trim(),
          commands
        })
      } satisfies CommandTaskEntry;
    });

  const seen = new Set<string>();
  return normalized.filter((task) => {
    const key = JSON.stringify(task);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function groupCommandTasks(tasks: CommandTaskEntry[]) {
  return TASK_PHASE_ORDER
    .map((phase) => ({
      phase,
      title: TASK_PHASE_TITLES[phase],
      tasks: tasks.filter((task) => task.phase === phase)
    }))
    .filter((group) => group.tasks.length > 0) satisfies CommandTaskGroup[];
}

export function inferCommandTaskTitle(command: CommandTaskCommandLike) {
  return inferSemanticCommandTaskTitle(command);
}

export function inferCommandTaskDescription(command: CommandTaskCommandLike) {
  return inferSemanticCommandTaskDescription(command);
}

export function deriveCommandTasksFromSubcommands(subcommands: CommandTaskCommandLike[]) {
  const inspect = findPreferredSubcommandByPhase(subcommands, 'inspect');
  const mutate = findPreferredSubcommandByPhase(subcommands, 'mutate');
  const verify = findPreferredSubcommandByPhase(subcommands, 'verify', inspect ? [inspect.key] : []);
  const cleanup = findPreferredSubcommandByPhase(subcommands, 'cleanup', mutate ? [mutate.key] : []);

  const tasks: CommandTaskEntry[] = [];
  if (inspect) {
    tasks.push({ title: inferCommandTaskTitle(inspect), description: inferCommandTaskDescription(inspect), commands: [inspect.invocation], phase: 'inspect' });
  }
  if (mutate) {
    tasks.push({ title: inferCommandTaskTitle(mutate), description: inferCommandTaskDescription(mutate), commands: [mutate.invocation], phase: 'mutate' });
  }
  if (verify) {
    tasks.push({ title: '回查结果', description: '执行完成后回拉状态，确认变更已经真正生效。', commands: [verify.invocation], phase: 'verify' });
  }
  if (cleanup) {
    tasks.push({ title: inferCommandTaskTitle(cleanup), description: inferCommandTaskDescription(cleanup), commands: [cleanup.invocation], phase: 'cleanup' });
  }

  return normalizeCommandTasks(tasks).slice(0, 4);
}

export function buildCommandTasks(input: {
  scope: 'root' | 'namespace' | 'command';
  enhancement: CommandDescriptor;
  subcommands: CommandTaskCommandLike[];
  sectionTasks?: CommandTaskHint[];
}) {
  if (input.scope === 'root') {
    return normalizeCommandTasks([
      ...(input.enhancement.taskHints || []),
      ...(input.sectionTasks || [])
    ]).slice(0, 8);
  }

  if (input.enhancement.taskHints && input.enhancement.taskHints.length > 0) {
    return normalizeCommandTasks(input.enhancement.taskHints);
  }

  if (input.subcommands.length === 0) return [] as CommandTaskEntry[];
  return deriveCommandTasksFromSubcommands(input.subcommands);
}
