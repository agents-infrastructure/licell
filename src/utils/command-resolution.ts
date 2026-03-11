import { getCommandCatalog, type CatalogCommand } from './command-catalog';

export function resolveCatalogCommandFromTemplate(commandTemplate: string): CatalogCommand | null {
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
