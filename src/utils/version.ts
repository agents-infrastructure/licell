import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const BUNDLED_VERSION = process.env.LICELL_VERSION;

function normalizeVersion(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readPackageVersion(): string | null {
  const candidates: string[] = [];
  if (typeof __dirname === 'string' && __dirname.length > 0) {
    candidates.push(resolve(__dirname, '../../package.json'));
    candidates.push(resolve(__dirname, '../package.json'));
  }
  candidates.push(resolve(process.cwd(), 'package.json'));

  for (const packagePath of candidates) {
    if (!existsSync(packagePath)) continue;
    try {
      const raw = JSON.parse(readFileSync(packagePath, 'utf-8')) as { version?: unknown };
      const version = normalizeVersion(typeof raw.version === 'string' ? raw.version : null);
      if (version) return version;
    } catch {
      // ignore and fallback to next candidate
    }
  }

  return null;
}

export function resolveCliVersion(options?: {
  env?: NodeJS.ProcessEnv;
  bundledVersion?: string;
  packageVersion?: string | null;
}) {
  const env = options?.env ?? process.env;

  const explicit = normalizeVersion(env.LICELL_VERSION);
  if (explicit) return explicit;

  const bundled = normalizeVersion(options?.bundledVersion ?? BUNDLED_VERSION);
  if (bundled) return bundled;

  const npmScriptVersion = normalizeVersion(env.npm_package_version);
  if (npmScriptVersion) return npmScriptVersion;

  const hasProvidedPackageVersion = Object.prototype.hasOwnProperty.call(options ?? {}, 'packageVersion');
  const packageVersion = hasProvidedPackageVersion ? options?.packageVersion ?? null : readPackageVersion();
  const diskVersion = normalizeVersion(packageVersion);
  if (diskVersion) return diskVersion;

  return 'dev';
}
