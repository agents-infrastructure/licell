const MULTI_WORD_COMMANDS = new Set([
  'fn list',
  'fn info',
  'fn invoke',
  'fn rm',
  'oss list',
  'oss info',
  'oss ls',
  'oss upload',
  'oss bucket',
  'db add',
  'db list',
  'db info',
  'db connect',
  'cache add',
  'cache list',
  'cache info',
  'cache connect',
  'cache rotate-password',
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
  'dns records list',
  'dns records add',
  'dns records rm',
  'env list',
  'env set',
  'env rm',
  'env pull',
  'skills init',
  'deploy spec',
  'deploy check'
]);

function isOptionLike(token: string | undefined) {
  return typeof token === 'string' && token.startsWith('-');
}

export function normalizeMultiWordCommandArgv(argv: string[]) {
  if (argv.length < 4) return argv;

  // Command tokens should appear before the first option token.
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
