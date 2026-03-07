import { getCommandCatalog } from './command-catalog';

export type CompletionShell = 'bash' | 'zsh';

function unique(values: string[]) {
  return [...new Set(values)];
}

function getCompletionCatalog() {
  return getCommandCatalog();
}

function normalizeCompWords(rawWords: string | undefined) {
  if (!rawWords) return [];
  const trimmed = rawWords.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

function resolvePathFromTokens(tokensBeforeCursor: string[]) {
  const catalog = getCompletionCatalog();
  const pathTokens: string[] = [];

  for (const token of tokensBeforeCursor) {
    if (!token || token.startsWith('-')) break;
    const parentKey = pathTokens.join(' ');
    const candidates = pathTokens.length === 0
      ? catalog.rootCommands
      : (catalog.childCommands[parentKey] || []);
    if (!candidates.includes(token)) break;
    pathTokens.push(token);
  }

  return pathTokens;
}

function resolveCandidatesByPath(pathTokens: string[]) {
  const catalog = getCompletionCatalog();
  if (pathTokens.length === 0) {
    return unique([...catalog.rootCommands, ...catalog.globalOptions]);
  }

  const key = pathTokens.join(' ');
  return unique([
    ...(catalog.childCommands[key] || []),
    ...(catalog.commandOptions[key] || []),
    ...catalog.globalOptions
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
