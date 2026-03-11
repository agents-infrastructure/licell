import {
  getCommandCatalog,
  type CatalogCommand,
  type CommandCatalog
} from './command-catalog';
import {
  COMMAND_SECTION_CONFIG,
  type CommandTaskPhase
} from './command-metadata';

export interface CommandReferenceSection {
  id: string;
  title: string;
  roots: string[];
  summary?: string;
  notes: string[];
  taskHints: Array<{ title: string; description: string; commands?: string[]; phase?: CommandTaskPhase }>;
  commands: CatalogCommand[];
}

function sortCommands(commands: CatalogCommand[], roots: string[]) {
  const rootIndex = new Map(roots.map((root, index) => [root, index]));
  return [...commands].sort((left, right) => {
    const leftRootOrder = rootIndex.get(left.rootCommand) ?? Number.MAX_SAFE_INTEGER;
    const rightRootOrder = rootIndex.get(right.rootCommand) ?? Number.MAX_SAFE_INTEGER;
    if (leftRootOrder !== rightRootOrder) return leftRootOrder - rightRootOrder;

    const leftDepth = left.commandTokens.length;
    const rightDepth = right.commandTokens.length;
    if (leftDepth !== rightDepth) return leftDepth - rightDepth;

    return left.key.localeCompare(right.key);
  });
}

export function buildCommandReferenceSections(catalog: CommandCatalog = getCommandCatalog()): CommandReferenceSection[] {
  const assignedRoots = new Set<string>();
  const sections: CommandReferenceSection[] = [];

  for (const config of COMMAND_SECTION_CONFIG) {
    const roots = config.roots.filter((root) => catalog.rootCommands.includes(root));
    if (roots.length === 0) continue;

    for (const root of roots) assignedRoots.add(root);

    sections.push({
      id: config.id,
      title: config.title,
      roots,
      summary: config.summary,
      notes: [...(config.notes || [])],
      taskHints: (config.taskHints || []).map((task) => ({ ...task, commands: [...(task.commands || [])] })),
      commands: sortCommands(
        catalog.commands.filter((command) => roots.includes(command.rootCommand)),
        roots
      )
    });
  }

  const remainingRoots = catalog.rootCommands.filter((root) => !assignedRoots.has(root));
  if (remainingRoots.length > 0) {
    sections.push({
      id: 'other',
      title: 'Other Commands',
      roots: remainingRoots,
      summary: '当前尚未归类的命令。',
      notes: [],
      taskHints: [],
      commands: sortCommands(
        catalog.commands.filter((command) => remainingRoots.includes(command.rootCommand)),
        remainingRoots
      )
    });
  }

  return sections;
}
