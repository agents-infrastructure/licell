#!/usr/bin/env node
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const installScriptPath = join(repoRoot, 'install.sh');
const workspaceCliPath = join(repoRoot, 'src/cli.ts');
const tempRoot = mkdtempSync(join(tmpdir(), 'licell-install-upgrade-matrix-'));
const keepTemp = process.env.LICELL_KEEP_MATRIX_TMP === '1';
let failed = false;

function log(message) {
  console.log(`[install-upgrade-matrix] ${message}`);
}

function cleanup() {
  if (keepTemp || failed) {
    log(`keeping temp root: ${tempRoot}`);
    return;
  }
  rmSync(tempRoot, { recursive: true, force: true });
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  failed = true;
  process.exit(1);
});
process.on('SIGTERM', () => {
  failed = true;
  process.exit(1);
});

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options
  });
  return result;
}

function formatResult(result) {
  const stdout = typeof result.stdout === 'string' ? result.stdout.trim() : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : '';
  return { stdout, stderr, status: result.status, error: result.error?.message };
}

function runOk(command, args, options = {}) {
  const result = run(command, args, options);
  if (result.error || result.status !== 0) {
    const detail = formatResult(result);
    throw new Error(
      [
        `command failed: ${command} ${args.join(' ')}`,
        `status=${String(detail.status)}`,
        detail.error ? `error=${detail.error}` : '',
        detail.stdout ? `stdout:\n${detail.stdout}` : '',
        detail.stderr ? `stderr:\n${detail.stderr}` : ''
      ].filter(Boolean).join('\n\n')
    );
  }
  return result;
}

function commandPathOptional(name) {
  const result = run('bash', ['-lc', `command -v ${name}`], { cwd: tempRoot });
  if (result.status !== 0) return null;
  const resolved = String(result.stdout || '').trim();
  return resolved.length > 0 ? resolved : null;
}

function commandPath(name) {
  const resolved = commandPathOptional(name);
  if (!resolved) {
    throw new Error(`required command not found: ${name}`);
  }
  return resolved;
}

function writeExecutable(path, content) {
  writeFileSync(path, content, { mode: 0o755 });
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
  return path;
}

function createPackageTemplate() {
  const templateDir = join(tempRoot, 'template');
  ensureDir(join(templateDir, 'dist'));

  writeFileSync(join(templateDir, 'package.json'), JSON.stringify({
    name: 'licell',
    version: '0.0.0-template',
    type: 'commonjs',
    bin: {
      licell: 'dist/licell.js'
    },
    bundledDependencies: ['tsx']
  }, null, 2));

  writeExecutable(join(templateDir, 'dist', 'licell.js'), `#!/usr/bin/env node
require('tsx/cjs');
require(${JSON.stringify(workspaceCliPath)});
`);

  writeExecutable(join(templateDir, 'licell'), `#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/dist/licell.js" "$@"
`);

  const npmCache = ensureDir(join(tempRoot, 'npm-cache'));
  log('installing tsx into local matrix package template');
  runOk('npm', ['install', 'tsx'], {
    cwd: templateDir,
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: npmCache
    }
  });
  return templateDir;
}

function cloneVersionedPackage(templateDir, version) {
  const targetDir = join(tempRoot, `pkg-${version}`);
  cpSync(templateDir, targetDir, { recursive: true });
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  return targetDir;
}

function createTarballFromDir(sourceDir, outFile, packageRootName = '.') {
  if (packageRootName === '.') {
    runOk('tar', ['-czf', outFile, '-C', sourceDir, '.']);
    return outFile;
  }

  const stagingDir = ensureDir(join(tempRoot, `stage-${packageRootName}-${Date.now()}`));
  const packageDir = join(stagingDir, packageRootName);
  cpSync(sourceDir, packageDir, { recursive: true });
  runOk('tar', ['-czf', outFile, '-C', stagingDir, packageRootName]);
  return outFile;
}

function findFirst(rootDir, relativePath) {
  const direct = join(rootDir, relativePath);
  if (existsSync(direct)) return direct;
  for (const entry of readdirSync(rootDir)) {
    const candidate = join(rootDir, entry, relativePath);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`unable to find ${relativePath} under ${rootDir}`);
}

function parseJsonMessages(output) {
  return output
    .split('\n')
    .filter((line) => line.startsWith('@@LICELL_JSON@@'))
    .map((line) => JSON.parse(line.slice('@@LICELL_JSON@@'.length)));
}

function parseSingleResult(output) {
  const messages = parseJsonMessages(output);
  const result = [...messages].reverse().find((message) => message.type === 'result');
  if (!result) {
    throw new Error(`no licell JSON result found in output:\n${output}`);
  }
  return result;
}

function readInstalledReleaseVersion(homeDir) {
  const installRoot = join(homeDir, '.local', 'share', 'licell');
  const packageJsonPath = findFirst(installRoot, 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
}

function readInstalledNpmVersion(prefixDir) {
  const packageJsonPath = findFirst(prefixDir, join('lib', 'node_modules', 'licell', 'package.json'));
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
}

function resolvePreferredShell() {
  return commandPathOptional('zsh') || commandPath('bash');
}

function resolveShellRcPath(homeDir, shellPath) {
  const shellName = shellPath.split('/').pop() || shellPath;
  if (shellName === 'zsh') return join(homeDir, '.zshrc');
  if (shellName === 'bash') return join(homeDir, process.platform === 'darwin' ? '.bash_profile' : '.bashrc');
  throw new Error(`unsupported shell for matrix test: ${shellName}`);
}

function assertPathPersistence(homeDir, shellPath) {
  const rcPath = resolveShellRcPath(homeDir, shellPath);
  const rcContent = readFileSync(rcPath, 'utf8');
  if (!rcContent.includes('# >>> licell PATH >>>')) {
    throw new Error(`PATH marker missing in ${rcPath}`);
  }
  if (!rcContent.includes(join(homeDir, '.local', 'bin'))) {
    throw new Error(`PATH export missing licell bin dir in ${rcPath}`);
  }

  const shellCheck = runOk(shellPath, ['-lc', `source ${JSON.stringify(rcPath)} >/dev/null 2>&1 || true; command -v licell`], {
    cwd: homeDir,
    env: {
      ...process.env,
      HOME: homeDir,
      ZDOTDIR: homeDir,
      SHELL: shellPath,
      PATH: process.env.PATH || ''
    }
  });
  const resolved = String(shellCheck.stdout || '').trim();
  if (resolved !== join(homeDir, '.local', 'bin', 'licell')) {
    throw new Error(`unexpected shell-resolved licell path: ${resolved}`);
  }
}

function createFakeNpm(prefixDir, upgradeTarball, logPath) {
  const fakeBinDir = ensureDir(join(tempRoot, 'fake-bin'));
  const realNpm = commandPath('npm');
  writeExecutable(join(fakeBinDir, 'npm'), `#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "\$*" >> ${JSON.stringify(logPath)}
if [[ "\${1:-}" == "install" && "\${2:-}" == "-g" && "\${3:-}" == licell@0.0.2-test ]]; then
  exec ${JSON.stringify(realNpm)} install -g ${JSON.stringify(upgradeTarball)}
fi
printf 'unexpected npm args: %s\n' "\$*" >&2
exit 99
`);
  return fakeBinDir;
}

function runReleaseFlow(releaseV1Archive, releaseV2Archive) {
  log('running release install + release upgrade flow');
  const homeDir = ensureDir(join(tempRoot, 'home-release'));
  const shellPath = resolvePreferredShell();
  const baseEnv = {
    ...process.env,
    HOME: homeDir,
    ZDOTDIR: homeDir,
    SHELL: shellPath,
    LICELL_SKIP_RUN_CHECK: '1'
  };

  runOk('bash', [installScriptPath], {
    env: {
      ...baseEnv,
      LICELL_BINARY_URL: `file://${releaseV1Archive}`
    }
  });

  assertPathPersistence(homeDir, shellPath);
  const initialVersion = readInstalledReleaseVersion(homeDir);
  if (initialVersion !== '0.0.1-test') {
    throw new Error(`unexpected initial release version: ${initialVersion}`);
  }

  const dryRun = runOk(join(homeDir, '.local', 'bin', 'licell'), ['upgrade', '--dry-run', '--output', 'json'], {
    env: baseEnv
  });
  const dryRunResult = parseSingleResult(String(dryRun.stdout || ''));
  if (dryRunResult.installSource !== 'release' || dryRunResult.mode !== 'release') {
    throw new Error(`unexpected release dry-run result: ${JSON.stringify(dryRunResult)}`);
  }

  const upgrade = runOk(join(homeDir, '.local', 'bin', 'licell'), [
    'upgrade',
    '--channel',
    'release',
    '--target-version',
    'v0.0.2-test',
    '--script-url',
    `file://${installScriptPath}`,
    '--skip-checksum',
    '--output',
    'json'
  ], {
    env: {
      ...baseEnv,
      LICELL_BINARY_URL: `file://${releaseV2Archive}`
    }
  });

  const upgradeResult = parseSingleResult(String(upgrade.stdout || ''));
  if (upgradeResult.mode !== 'release') {
    throw new Error(`unexpected release upgrade result: ${JSON.stringify(upgradeResult)}`);
  }

  const upgradedVersion = readInstalledReleaseVersion(homeDir);
  if (upgradedVersion !== '0.0.2-test') {
    throw new Error(`unexpected upgraded release version: ${upgradedVersion}`);
  }

  return {
    installSource: dryRunResult.installSource,
    mode: upgradeResult.mode,
    versionBefore: initialVersion,
    versionAfter: upgradedVersion,
    homeDir
  };
}

function runPackageManagerFlow(npmV1Tarball, npmV2Tarball) {
  log('running npm global install + npm upgrade flow');
  const prefixDir = ensureDir(join(tempRoot, 'npm-prefix'));
  const npmCache = ensureDir(join(tempRoot, 'npm-prefix-cache'));
  const baseEnv = {
    ...process.env,
    NPM_CONFIG_PREFIX: prefixDir,
    NPM_CONFIG_CACHE: npmCache
  };

  runOk('npm', ['install', '-g', npmV1Tarball], { env: baseEnv });

  const initialVersion = readInstalledNpmVersion(prefixDir);
  if (initialVersion !== '0.0.1-test') {
    throw new Error(`unexpected initial npm version: ${initialVersion}`);
  }

  const dryRun = runOk(join(prefixDir, 'bin', 'licell'), ['upgrade', '--dry-run', '--output', 'json'], {
    env: {
      ...baseEnv,
      PATH: `${join(prefixDir, 'bin')}:${process.env.PATH || ''}`
    }
  });
  const dryRunResult = parseSingleResult(String(dryRun.stdout || ''));
  if (dryRunResult.installSource !== 'package-manager' || dryRunResult.mode !== 'package-manager' || dryRunResult.packageManager !== 'npm') {
    throw new Error(`unexpected npm dry-run result: ${JSON.stringify(dryRunResult)}`);
  }

  const npmLogPath = join(tempRoot, 'fake-npm.log');
  const fakeBinDir = createFakeNpm(prefixDir, npmV2Tarball, npmLogPath);
  const upgrade = runOk(join(prefixDir, 'bin', 'licell'), [
    'upgrade',
    '--version',
    'v0.0.2-test',
    '--output',
    'json'
  ], {
    env: {
      ...baseEnv,
      PATH: `${fakeBinDir}:${join(prefixDir, 'bin')}:${process.env.PATH || ''}`
    }
  });

  const upgradeResult = parseSingleResult(String(upgrade.stdout || ''));
  if (upgradeResult.mode !== 'package-manager' || upgradeResult.packageManager !== 'npm') {
    throw new Error(`unexpected npm upgrade result: ${JSON.stringify(upgradeResult)}`);
  }

  const npmLog = existsSync(npmLogPath) ? readFileSync(npmLogPath, 'utf8').trim() : '';
  if (!npmLog.includes('install -g licell@0.0.2-test')) {
    throw new Error(`fake npm did not observe expected upgrade command: ${npmLog}`);
  }

  const upgradedVersion = readInstalledNpmVersion(prefixDir);
  if (upgradedVersion !== '0.0.2-test') {
    throw new Error(`unexpected upgraded npm version: ${upgradedVersion}`);
  }

  return {
    installSource: dryRunResult.installSource,
    mode: upgradeResult.mode,
    packageManager: upgradeResult.packageManager,
    versionBefore: initialVersion,
    versionAfter: upgradedVersion,
    prefixDir
  };
}

function main() {
  log(`temp root: ${tempRoot}`);
  if (!existsSync(installScriptPath)) {
    throw new Error(`install.sh not found: ${installScriptPath}`);
  }
  if (!existsSync(workspaceCliPath)) {
    throw new Error(`src/cli.ts not found: ${workspaceCliPath}`);
  }

  const templateDir = createPackageTemplate();
  const pkgV1Dir = cloneVersionedPackage(templateDir, '0.0.1-test');
  const pkgV2Dir = cloneVersionedPackage(templateDir, '0.0.2-test');

  const releaseV1Archive = createTarballFromDir(pkgV1Dir, join(tempRoot, 'licell-release-v1.tar.gz'));
  const releaseV2Archive = createTarballFromDir(pkgV2Dir, join(tempRoot, 'licell-release-v2.tar.gz'));
  const npmV1Tarball = createTarballFromDir(pkgV1Dir, join(tempRoot, 'licell-npm-v1.tgz'), 'package');
  const npmV2Tarball = createTarballFromDir(pkgV2Dir, join(tempRoot, 'licell-npm-v2.tgz'), 'package');

  const release = runReleaseFlow(releaseV1Archive, releaseV2Archive);
  const npm = runPackageManagerFlow(npmV1Tarball, npmV2Tarball);

  const summary = {
    tempRoot,
    release,
    npm
  };
  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (err) {
  failed = true;
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
}
