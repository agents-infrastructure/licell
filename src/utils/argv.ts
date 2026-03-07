const MULTI_WORD_COMMANDS = new Set([
  'fn list',
  'fn info',
  'fn invoke',
  'fn rm',
  'oss list',
  'oss info',
  'oss create',
  'oss update',
  'oss rm',
  'oss ls',
  'oss upload',
  'oss bucket',
  'oss domain list',
  'oss domain token',
  'oss domain bind',
  'oss domain rm',
  'db add',
  'db list',
  'db info',
  'db connect',
  'db public-access',
  'db rm',
  'cache add',
  'cache list',
  'cache info',
  'cache connect',
  'cache rotate-password',
  'cache public-access',
  'cache rm',
  'e2e run',
  'e2e cleanup',
  'e2e list',
  'release list',
  'release promote',
  'release rollback',
  'release prune',
  'domain add',
  'domain rm',
  'auth repair',
  'config domain',
  'dns records list',
  'dns records add',
  'dns records rm',
  'env list',
  'env set',
  'env rm',
  'env pull',
  'skills init',
  'deploy spec',
  'deploy check',
  'supa add',
  'supa list',
  'supa info',
  'supa connect',
  'supa config',
  'supa whitelist',
  'supa reset-password',
  'supa restart',
  'supa stop',
  'supa start',
  'supa rm'
]);

function isOptionLike(token: string | undefined) {
  return typeof token === 'string' && token.startsWith('-');
}

export function normalizeMultiWordCommandArgv(argv: string[]) {
  if (argv.length < 4) return argv;

  let searchEnd = argv.length;
  for (let i = 2; i < argv.length; i += 1) {
    if (!isOptionLike(argv[i])) continue;
    searchEnd = i;
    break;
  }

  for (let i = 2; i < searchEnd; i += 1) {
    for (let width = 3; width >= 2; width -= 1) {
      if (i + width > searchEnd) continue;
      const tokens = argv.slice(i, i + width);
      if (tokens.some((token) => isOptionLike(token))) continue;
      const command = tokens.join(' ');
      if (!MULTI_WORD_COMMANDS.has(command)) continue;
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
