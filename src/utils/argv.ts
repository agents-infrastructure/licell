import { getCommandCatalog } from './command-catalog';

let cachedMultiWordCommands: Set<string> | null = null;

function isOptionLike(token: string | undefined) {
  return typeof token === 'string' && token.startsWith('-');
}

function buildKnownMultiWordCommands() {
  const catalog = getCommandCatalog();
  const known = new Set<string>();

  const addKey = (key: string) => {
    const normalized = key.trim();
    if (!normalized) return;
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return;
    known.add(tokens.join(' '));
    for (let index = 2; index < tokens.length; index += 1) {
      known.add(tokens.slice(0, index).join(' '));
    }
  };

  for (const command of catalog.commands) {
    addKey(command.key);
    for (const alias of command.aliases) {
      addKey(alias);
    }
  }

  return known;
}

function getKnownMultiWordCommands() {
  if (!cachedMultiWordCommands) {
    cachedMultiWordCommands = buildKnownMultiWordCommands();
  }
  return cachedMultiWordCommands;
}

export function normalizeMultiWordCommandArgv(argv: string[]) {
  if (argv.length < 4) return argv;

  let searchEnd = argv.length;
  for (let i = 2; i < argv.length; i += 1) {
    if (!isOptionLike(argv[i])) continue;
    searchEnd = i;
    break;
  }

  const knownCommands = getKnownMultiWordCommands();
  for (let i = 2; i < searchEnd; i += 1) {
    for (let width = 3; width >= 2; width -= 1) {
      if (i + width > searchEnd) continue;
      const tokens = argv.slice(i, i + width);
      if (tokens.some((token) => isOptionLike(token))) continue;
      const command = tokens.join(' ');
      if (!knownCommands.has(command)) continue;
      return [...argv.slice(0, i), command, ...argv.slice(i + width)];
    }
  }

  return argv;
}

export function normalizeCompatOptionArgv(argv: string[]) {
  const upgradeIndex = argv.findIndex((token, index) => index >= 2 && token === 'upgrade');
  if (upgradeIndex < 0) return argv;

  let changed = false;
  const normalized = [...argv];
  for (let index = upgradeIndex + 1; index < normalized.length; index += 1) {
    const token = normalized[index];
    if (token === '--version') {
      normalized[index] = '--target-version';
      changed = true;
      continue;
    }
    if (typeof token === 'string' && token.startsWith('--version=')) {
      normalized[index] = `--target-version=${token.slice('--version='.length)}`;
      changed = true;
    }
  }

  return changed ? normalized : argv;
}

export function normalizeCliArgv(argv: string[]) {
  return normalizeCompatOptionArgv(normalizeMultiWordCommandArgv(argv));
}
