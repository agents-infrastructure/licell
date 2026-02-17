import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const STATIC_DIST_CANDIDATES = ['dist', 'build', 'out', 'public', 'www', 'site', '.output/public'];

function isDirectory(path: string) {
  if (!existsSync(path)) return false;
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function hasIndexHtml(dir: string) {
  const indexPath = join(dir, 'index.html');
  if (!existsSync(indexPath)) return false;
  try {
    return statSync(indexPath).isFile();
  } catch {
    return false;
  }
}

function isNonEmptyDirectory(dir: string) {
  if (!isDirectory(dir)) return false;
  try {
    return readdirSync(dir).length > 0;
  } catch {
    return false;
  }
}

export function detectStaticDistDir(rootDir: string = process.cwd()) {
  if (hasIndexHtml(rootDir)) return '.';

  for (const candidate of STATIC_DIST_CANDIDATES) {
    const absolute = join(rootDir, candidate);
    if (hasIndexHtml(absolute)) return candidate;
  }

  for (const candidate of STATIC_DIST_CANDIDATES) {
    const absolute = join(rootDir, candidate);
    if (isNonEmptyDirectory(absolute)) return candidate;
  }

  return 'dist';
}
