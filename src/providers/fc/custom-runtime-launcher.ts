import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { readLicellEnv } from '../../utils/env';

interface ManagedPreferredLauncherOptions {
  outdir: string;
  launcherPath: string;
  managedExecutablePath: string;
  fallbackExecutablePath?: string;
  args: string[];
}

function quoteForShell(value: string) {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function buildExecLine(executablePath: string, args: string[]) {
  const argv = [executablePath, ...args].map(quoteForShell).join(' ');
  return `exec ${argv}`;
}

function isTruthy(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function shouldIncludeManagedRuntimeFallback(env: NodeJS.ProcessEnv = process.env) {
  return isTruthy(readLicellEnv(env, 'FC_INCLUDE_RUNTIME_FALLBACK'));
}

export function createManagedPreferredLauncher(options: ManagedPreferredLauncherOptions) {
  const launcherFullPath = join(options.outdir, options.launcherPath);
  mkdirSync(dirname(launcherFullPath), { recursive: true });
  const managedPath = quoteForShell(options.managedExecutablePath);
  const fallbackPath = options.fallbackExecutablePath ? quoteForShell(options.fallbackExecutablePath) : null;
  const fallbackBlock = fallbackPath
    ? `
if [ -x ${fallbackPath} ]; then
  ${buildExecLine(options.fallbackExecutablePath!, options.args)}
fi
`
    : '';
  const missingMessage = options.fallbackExecutablePath
    ? `[licell] runtime executable not found: ${options.managedExecutablePath} or ${options.fallbackExecutablePath}`
    : `[licell] runtime executable not found: ${options.managedExecutablePath}`;
  const source = `#!/bin/sh
set -eu

if [ -x ${managedPath} ]; then
  ${buildExecLine(options.managedExecutablePath, options.args)}
fi
${fallbackBlock}

echo >&2 "${missingMessage}"
exit 127
`;
  writeFileSync(launcherFullPath, source, 'utf8');
  chmodSync(launcherFullPath, 0o755);
  return options.launcherPath.replace(/\\/g, '/');
}
