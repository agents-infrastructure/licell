export type CompletionShell = 'bash' | 'zsh';

const ROOT_OPTIONS = ['-h', '--help', '-v', '--version'];

const ROOT_COMMANDS = [
  'login',
  'logout',
  'whoami',
  'switch',
  'init',
  'deploy',
  'fn',
  'oss',
  'db',
  'cache',
  'e2e',
  'release',
  'domain',
  'dns',
  'env',
  'logs',
  'upgrade',
  'mcp',
  'auth',
  'completion'
];

const SUBCOMMANDS: Record<string, string[]> = {
  auth: ['repair'],
  fn: ['list', 'info', 'invoke', 'rm'],
  oss: ['list', 'info', 'ls', 'upload', 'bucket'],
  db: ['add', 'list', 'info', 'connect'],
  cache: ['add', 'list', 'info', 'connect', 'rotate-password'],
  e2e: ['run', 'cleanup', 'list'],
  release: ['list', 'promote', 'rollback', 'prune'],
  domain: ['add', 'rm'],
  dns: ['records'],
  env: ['list', 'set', 'rm', 'pull'],
  mcp: ['init', 'serve'],
  completion: ['bash', 'zsh']
};

const NESTED_SUBCOMMANDS: Record<string, string[]> = {
  'dns records': ['list', 'add', 'rm']
};

const COMMAND_OPTIONS: Record<string, string[]> = {
  login: ['--account-id', '--ak', '--sk', '--region', '--bootstrap-ram', '--bootstrap-user', '--bootstrap-policy'],
  'auth repair': ['--account-id', '--ak', '--sk', '--region', '--bootstrap-user', '--bootstrap-policy'],
  switch: ['--region'],
  init: ['--runtime', '--app', '--force', '--yes'],
  deploy: [
    '--type', '--entry', '--dist', '--runtime', '--target', '--domain', '--domain-suffix',
    '--enable-cdn', '--ssl', '--ssl-force-renew', '--acr-namespace', '--enable-vpc',
    '--disable-vpc', '--memory', '--vcpu', '--instance-concurrency', '--timeout'
  ],
  'fn list': ['--limit', '--prefix'],
  'fn info': ['--target'],
  'fn invoke': ['--target', '--payload', '--file'],
  'fn rm': ['--force', '--yes'],
  'oss list': ['--limit'],
  'oss ls': ['--limit'],
  'oss upload': ['--bucket', '--source-dir', '--target-dir'],
  'oss bucket': ['--bucket', '--source-dir', '--target-dir'],
  'db add': [
    '--type', '--engine-version', '--category', '--class', '--storage', '--storage-type', '--min-rcu',
    '--max-rcu', '--auto-pause', '--zone', '--zone-slave1', '--zone-slave2', '--vpc', '--vsw',
    '--security-ip-list', '--description'
  ],
  'db list': ['--limit'],
  'cache add': [
    '--type', '--instance', '--password', '--username', '--engine-version', '--class', '--node-type',
    '--capacity', '--vk-name', '--compute-unit', '--zone', '--vpc', '--vsw', '--security-ip-list'
  ],
  'cache list': ['--limit'],
  'cache rotate-password': ['--instance'],
  'e2e run': [
    '--suite', '--run-id', '--runtime', '--target', '--domain', '--domain-suffix',
    '--db-instance', '--cache-instance', '--skip-static',
    '--enable-cdn', '--cleanup', '--workspace', '--yes'
  ],
  'e2e cleanup': ['--manifest', '--keep-workspace', '--yes'],
  'release list': ['--limit'],
  'release promote': ['--target'],
  'release rollback': ['--target'],
  'release prune': ['--keep', '--apply', '--yes'],
  'domain add': ['--ssl', '--ssl-force-renew', '--target'],
  'domain rm': ['--yes'],
  'dns records list': ['--limit'],
  'dns records add': ['--rr', '--type', '--value', '--ttl', '--line'],
  'dns records rm': ['--yes'],
  'env list': ['--target', '--show-values'],
  'env rm': ['--yes'],
  'env pull': ['--target'],
  mcp: ['--project-root', '--server-name'],
  upgrade: ['--version', '--repo', '--script-url', '--skip-checksum', '--dry-run'],
  completion: ['--engine']
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function normalizeCompWords(rawWords: string | undefined) {
  if (!rawWords) return [];
  const trimmed = rawWords.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

function resolvePathFromTokens(tokensBeforeCursor: string[]) {
  const first = tokensBeforeCursor[0];
  if (!first || first.startsWith('-')) return [];

  const firstLevel = SUBCOMMANDS[first];
  if (!firstLevel) return [first];

  const second = tokensBeforeCursor[1];
  if (!second || second.startsWith('-') || !firstLevel.includes(second)) return [first];

  const key2 = `${first} ${second}`;
  const secondLevel = NESTED_SUBCOMMANDS[key2];
  if (!secondLevel) return [first, second];

  const third = tokensBeforeCursor[2];
  if (!third || third.startsWith('-') || !secondLevel.includes(third)) return [first, second];

  return [first, second, third];
}

function resolveCandidatesByPath(pathTokens: string[]) {
  if (pathTokens.length === 0) {
    return unique([...ROOT_COMMANDS, ...ROOT_OPTIONS]);
  }

  if (pathTokens.length === 1) {
    const key = pathTokens[0];
    return unique([
      ...(SUBCOMMANDS[key] || []),
      ...(COMMAND_OPTIONS[key] || []),
      ...ROOT_OPTIONS
    ]);
  }

  if (pathTokens.length === 2) {
    const key = `${pathTokens[0]} ${pathTokens[1]}`;
    return unique([
      ...(NESTED_SUBCOMMANDS[key] || []),
      ...(COMMAND_OPTIONS[key] || []),
      ...ROOT_OPTIONS
    ]);
  }

  const key = `${pathTokens[0]} ${pathTokens[1]} ${pathTokens[2]}`;
  return unique([
    ...(COMMAND_OPTIONS[key] || []),
    ...ROOT_OPTIONS
  ]);
}

export function resolveCompletionCandidates(input: {
  compWords?: string;
  compCword?: string | number;
  compCur?: string;
}) {
  const rawTokens = normalizeCompWords(input.compWords);
  let cword = Number(input.compCword);
  if (!Number.isFinite(cword)) cword = rawTokens.length - 1;

  const tokens = [...rawTokens];
  if (tokens[0] === 'licell') {
    tokens.shift();
    cword -= 1;
  }
  if (cword < 0) cword = 0;

  const current = input.compCur ?? tokens[cword] ?? '';
  const before = tokens.slice(0, Math.max(0, Math.min(cword, tokens.length)));
  const pathTokens = resolvePathFromTokens(before);
  const allCandidates = resolveCandidatesByPath(pathTokens);
  const optionOnly = current.startsWith('-');

  const filtered = allCandidates.filter((candidate) => {
    if (optionOnly && !candidate.startsWith('-')) return false;
    return candidate.startsWith(current);
  });
  return unique(filtered).sort();
}

export function normalizeCompletionShell(value: string | undefined): CompletionShell {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'bash' || normalized === 'zsh') return normalized;
  throw new Error('shell 仅支持 bash 或 zsh');
}

export function detectShellFromEnv(envShell: string | undefined): CompletionShell | undefined {
  const shell = (envShell || '').toLowerCase();
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  return undefined;
}

export function renderCompletionScript(shell: CompletionShell) {
  if (shell === 'bash') {
    return `# bash completion for licell
_licell_completion() {
  local cur
  cur="\${COMP_WORDS[COMP_CWORD]}"
  local out
  out="$(
    COMP_WORDS="\${COMP_WORDS[*]}" \
    COMP_CWORD="\${COMP_CWORD}" \
    COMP_CUR="\${cur}" \
    licell completion --engine 2>/dev/null
  )" || return 0
  COMPREPLY=()
  while IFS= read -r line; do
    [[ -n "\${line}" ]] && COMPREPLY+=("\${line}")
  done <<< "\${out}"
}
complete -F _licell_completion licell
`;
  }

  return `#compdef licell
_licell_completion() {
  local cur out
  cur="\${words[CURRENT]}"
  out="$(
    COMP_WORDS="\${words[*]}" \
    COMP_CWORD="$((CURRENT-1))" \
    COMP_CUR="\${cur}" \
    licell completion --engine 2>/dev/null
  )" || return 0
  local -a suggestions
  suggestions=("\${(@f)out}")
  (( \${#suggestions[@]} )) && compadd -a suggestions
}
compdef _licell_completion licell
`;
}
