import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import pc from 'picocolors';

const CACHE_DIR = join(homedir(), '.licell-cli');
const CACHE_FILE = join(CACHE_DIR, 'update-check.json');
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 2_000;
const RELEASE_API = 'https://api.github.com/repos/agents-infrastructure/licell/releases/latest';

interface UpdateCache {
  latestVersion: string;
  checkedAt: number;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

function readCache(): UpdateCache | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as Partial<UpdateCache>;
    if (typeof raw.latestVersion !== 'string' || typeof raw.checkedAt !== 'number') return null;
    return raw as UpdateCache;
  } catch {
    return null;
  }
}

function writeCache(cache: UpdateCache) {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  } catch { /* silent */ }
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(RELEASE_API, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' }
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    if (typeof data.tag_name !== 'string') return null;
    return data.tag_name.replace(/^v/, '');
  } catch {
    return null;
  }
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateCheckResult | null> {
  if (!currentVersion || currentVersion === 'dev') return null;

  const cache = readCache();
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) {
    if (compareVersions(cache.latestVersion, currentVersion) > 0) {
      return { currentVersion, latestVersion: cache.latestVersion };
    }
    return null;
  }

  const latest = await fetchLatestVersion();
  if (!latest) return null;

  writeCache({ latestVersion: latest, checkedAt: Date.now() });

  if (compareVersions(latest, currentVersion) > 0) {
    return { currentVersion, latestVersion: latest };
  }
  return null;
}

export function printUpdateTip(result: UpdateCheckResult) {
  const msg = `新版本可用: ${result.currentVersion} → ${result.latestVersion}`;
  const cmd = 'licell upgrade';
  const inner = Math.max(msg.length, cmd.length + 4);
  const pad = (s: string) => s + ' '.repeat(inner - s.length);
  console.error('');
  console.error(pc.yellow(`╭${'─'.repeat(inner + 4)}╮`));
  console.error(pc.yellow(`│  ${pad(msg)}  │`));
  console.error(pc.yellow(`│  ${pad(`运行 ${pc.bold(cmd)} 升级`)}  │`));
  console.error(pc.yellow(`╰${'─'.repeat(inner + 4)}╯`));
}
