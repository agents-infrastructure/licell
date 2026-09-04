import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'fs';
import { delimiter, dirname, join, resolve } from 'path';
import { tmpdir } from 'os';
import { createSpinner, showIntro, showOutro, toOptionalString } from '../utils/cli-shared';
import { emitCliEvent, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { AUTOMATION_SECTION } from './sections';

const DEFAULT_UPGRADE_REPO = 'team-harness/licell';
const DEFAULT_PACKAGE_NAME = 'licell';
const REPO_SLUG_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const UPGRADE_CHANNELS = ['auto', 'release', 'npm', 'pnpm', 'yarn', 'bun'] as const;

const upgradeCommand = defineCliCommand({
  rawName: 'upgrade',
  regionExclusion: 'region-agnostic',
  description: '按当前安装来源升级 licell',
  options: [
    { rawName: '--channel <channel>', description: `升级渠道：${UPGRADE_CHANNELS.join('/')}（默认 auto）` },
    { rawName: '--target-version <tag>', description: '指定升级目标版本（release tag 如 v0.9.6；兼容旧写法：`upgrade --version <tag>`）' },
    { rawName: '--repo <owner/repo>', description: `GitHub 仓库（仅 release 渠道生效，默认 ${DEFAULT_UPGRADE_REPO}）` },
    { rawName: '--script-url <url>', description: '覆盖 install.sh 地址（仅 release 渠道，需配合 --skip-checksum）' },
    { rawName: '--skip-checksum', description: '跳过 SHA256 完整性校验（仅 release 渠道，不推荐）' },
    { rawName: '--dry-run', description: '只输出将执行的升级计划（脚本地址或包管理器命令）' }
  ],
  descriptor: {
    summary: '按当前安装来源执行自升级，支持 dry-run 查看计划。',
    notes: [
      '推荐先执行 `licell upgrade --dry-run` 确认升级渠道与动作。',
      '不要同时保留多个全局安装来源；PATH 中排在最前的 licell 会遮蔽其它版本。'
    ],
    safety: {
      level: 'mutating',
      reason: '会修改本机 licell 安装，建议先 dry-run 再执行。'
    },
    optionInsights: {
      '--dry-run': { whenToUse: '任何自动升级前都建议先使用。', cautions: ['用于确认 installSource、package manager 或 release installer。'] },
      '--channel': { whenToUse: '需要强制走 `release` / `npm` / `pnpm` / `yarn` / `bun` 时使用。', cautions: ['覆盖 auto 检测可能与当前安装来源不一致。'] },
      '--target-version': { whenToUse: '需要锁定升级到指定 tag 时使用。', cautions: ['建议先 dry-run 验证该版本与渠道是否匹配。'] },
      '--repo': { whenToUse: 'release 渠道需要切到其它 GitHub 仓库时使用。', cautions: ['仅对 release 渠道生效。'] },
      '--script-url': { whenToUse: '需要使用自定义 install.sh 地址时使用。', cautions: ['必须配合 `--skip-checksum`，安全性由调用方承担。'] },
      '--skip-checksum': { whenToUse: '仅在自定义脚本地址且你明确接受风险时使用。', cautions: ['会跳过 release 脚本 SHA256 校验。'] }
    },
    recommendedFlow: [
      { title: '检查升级计划', command: 'licell upgrade --dry-run --output json', reason: '先确认检测到的安装来源与执行命令。' },
      { title: '确认渠道', command: 'licell upgrade --channel <channel> --dry-run', reason: '当 auto 检测不符合预期时再显式覆盖。' },
      { title: '执行升级', command: 'licell upgrade', reason: '在 dry-run 结果符合预期后再真正修改安装。' }
    ],
    examples: ['licell upgrade --dry-run', 'licell upgrade', 'licell upgrade --channel release --target-version v0.10.1'],
    agentTips: [
      'Agent 优先使用 `--dry-run --output json` 判断升级来源与命令。',
      '读取 `pathResolution.hasConflict`；为 true 时先向用户报告 activeExecutable 与 shadowedExecutables。'
    ],
    result: {
      summary: '返回升级计划或执行结果，并报告 PATH 实际命中与被遮蔽的 licell 安装。',
      fields: [
        { name: 'dryRun', description: '是否仅预览升级计划。', required: true },
        { name: 'channel', description: '请求的升级渠道。', required: true },
        { name: 'mode', description: '实际使用 release 或 package-manager。', required: true },
        { name: 'installSource', description: '当前进程检测到的安装来源。', required: false },
        { name: 'pathResolution.activeExecutable', description: '当前 PATH 中实际优先命中的 licell 入口。', required: true },
        { name: 'pathResolution.shadowedExecutables[]', description: '被优先入口遮蔽的其它 licell 安装。', required: true },
        { name: 'pathResolution.hasConflict', description: 'PATH 中是否存在多个不同的 licell 安装。', required: true }
      ]
    }
  }
});

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type UpgradeChannel = typeof UPGRADE_CHANNELS[number];

export interface InstallSourceInfo {
  kind: 'release' | 'package-manager' | 'project' | 'unknown';
  packageManager?: PackageManagerName;
  runtimePath: string | null;
  execPath: string;
}

export interface LicellPathResolution {
  activeExecutable: string | null;
  shadowedExecutables: string[];
  hasConflict: boolean;
}

export type UpgradePlan =
  | {
    mode: 'release';
    scriptUrl: string;
  }
  | {
    mode: 'package-manager';
    packageManager: PackageManagerName;
    command: string;
    args: string[];
    displayCommand: string;
  };

export function formatInstallSourceDisplay(source: InstallSourceInfo) {
  switch (source.kind) {
    case 'package-manager':
      return source.packageManager ? `package-manager (${source.packageManager})` : 'package-manager';
    case 'project':
      return source.packageManager ? `project (${source.packageManager})` : 'project';
    case 'release':
      return 'release';
    default:
      return 'unknown';
  }
}

export function formatUpgradeDryRunText(input: {
  installSource: InstallSourceInfo;
  channel: UpgradeChannel;
  plan: UpgradePlan;
  pathResolution?: LicellPathResolution;
}) {
  const lines = [
    `detected install source: ${formatInstallSourceDisplay(input.installSource)}`,
    `requested channel: ${input.channel}`
  ];

  if (input.plan.mode === 'release') {
    lines.push(`release installer: ${input.plan.scriptUrl}`);
  } else {
    lines.push(`package manager command: ${input.plan.displayCommand}`);
  }

  if (input.pathResolution?.activeExecutable) {
    lines.push(`active executable: ${input.pathResolution.activeExecutable}`);
  }
  if (input.pathResolution?.shadowedExecutables.length) {
    lines.push(`shadowed executables: ${input.pathResolution.shadowedExecutables.join(', ')}`);
  }

  return lines.join('\n');
}

function normalizePathForMatch(value: string | null | undefined) {
  if (typeof value !== 'string' || value.length === 0) return '';
  return value.replace(/\\/g, '/').toLowerCase();
}

export function findLicellExecutablesOnPath(input: {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
} = {}) {
  const env = input.env || process.env;
  const platform = input.platform || process.platform;
  const names = platform === 'win32' ? ['licell.exe', 'licell.cmd', 'licell'] : ['licell'];
  const seenRealPaths = new Set<string>();
  const executables: string[] = [];

  for (const directory of (env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const candidate = join(directory, name);
      try {
        if (!statSync(candidate).isFile()) continue;
        const realPath = realpathSync(candidate);
        const key = normalizePathForMatch(realPath);
        if (seenRealPaths.has(key)) continue;
        seenRealPaths.add(key);
        executables.push(candidate);
      } catch {
        // Continue searching PATH.
      }
    }
  }

  return executables;
}

export function resolveLicellPathResolution(env: NodeJS.ProcessEnv = process.env): LicellPathResolution {
  const executables = findLicellExecutablesOnPath({ env });
  return {
    activeExecutable: executables[0] || null,
    shadowedExecutables: executables.slice(1),
    hasConflict: executables.length > 1
  };
}

function getRuntimePath(argv: string[]) {
  const candidate = argv[1];
  if (typeof candidate !== 'string' || candidate.length === 0) return null;
  if (candidate.endsWith('.js') || candidate.includes('/') || candidate.includes('\\')) return candidate;
  return null;
}

function resolveRuntimePath(runtimePath: string | null) {
  if (!runtimePath || !existsSync(runtimePath)) return runtimePath;
  try {
    return realpathSync(runtimePath);
  } catch {
    return runtimePath;
  }
}

function inferPackageManagerFromPath(runtimePathNormalized: string): PackageManagerName {
  if (runtimePathNormalized.includes('/.pnpm/') || runtimePathNormalized.includes('/pnpm/global/')) return 'pnpm';
  if (
    runtimePathNormalized.includes('/.config/yarn/global/')
    || runtimePathNormalized.includes('/yarn/global/')
    || runtimePathNormalized.includes('/.yarn/')
  ) return 'yarn';
  if (runtimePathNormalized.includes('/.bun/install/global/')) return 'bun';
  return 'npm';
}

function isGlobalPackageManagerRuntimePath(runtimePathNormalized: string) {
  return runtimePathNormalized.includes('/usr/local/lib/node_modules/')
    || runtimePathNormalized.includes('/usr/lib/node_modules/')
    || runtimePathNormalized.includes('/opt/homebrew/lib/node_modules/')
    || runtimePathNormalized.includes('/lib/node_modules/')
    || runtimePathNormalized.includes('/pnpm/global/')
    || runtimePathNormalized.includes('/.config/yarn/global/')
    || runtimePathNormalized.includes('/.bun/install/global/')
    || runtimePathNormalized.includes('/appdata/roaming/npm/node_modules/');
}

function readPackageNameNearRuntime(runtimePath: string | null) {
  if (!runtimePath) return null;
  const packagePath = resolve(dirname(runtimePath), '..', 'package.json');
  if (!existsSync(packagePath)) return null;
  try {
    const raw = JSON.parse(readFileSync(packagePath, 'utf-8')) as { name?: unknown };
    return typeof raw.name === 'string' ? raw.name.trim() : null;
  } catch {
    return null;
  }
}

function normalizeUpgradeChannel(value: string | undefined): UpgradeChannel {
  const normalized = value?.trim().toLowerCase() || 'auto';
  if ((UPGRADE_CHANNELS as readonly string[]).includes(normalized)) return normalized as UpgradeChannel;
  throw new Error(`无效的升级渠道: ${value || ''}（支持: ${UPGRADE_CHANNELS.join('/')})`);
}

function isPackageManagerChannel(channel: UpgradeChannel): channel is PackageManagerName {
  return channel === 'npm' || channel === 'pnpm' || channel === 'yarn' || channel === 'bun';
}

function resolveProjectInstallMessage(packageManager?: PackageManagerName) {
  const forceCommand = packageManager
    ? `licell upgrade --channel ${packageManager}`
    : 'licell upgrade --channel npm';
  return '检测到当前 licell 来自项目内依赖或开发链接，默认不会自动执行全局升级。'
    + '请在当前项目中更新依赖，'
    + `或显式执行 \`${forceCommand}\` / \`licell upgrade --channel release\`。`;
}

export function detectInstallSource(input?: {
  argv?: string[];
  execPath?: string;
}) : InstallSourceInfo {
  const argv = input?.argv ?? process.argv;
  const execPath = input?.execPath ?? process.execPath;
  const runtimePath = getRuntimePath(argv);
  const resolvedRuntimePath = resolveRuntimePath(runtimePath);
  const runtimePathForDetection = resolvedRuntimePath ?? runtimePath;
  const runtimePathNormalized = normalizePathForMatch(runtimePathForDetection);
  const execPathNormalized = normalizePathForMatch(execPath);
  const packageManager = inferPackageManagerFromPath(runtimePathNormalized);

  if (runtimePathNormalized.includes('/.local/share/licell/')) {
    return { kind: 'release', runtimePath: runtimePathForDetection, execPath };
  }

  if (runtimePathNormalized.includes('/node_modules/licell/')) {
    if (isGlobalPackageManagerRuntimePath(runtimePathNormalized)) {
      return {
        kind: 'package-manager',
        packageManager,
        runtimePath: runtimePathForDetection,
        execPath
      };
    }
    return {
      kind: 'project',
      packageManager,
      runtimePath: runtimePathForDetection,
      execPath
    };
  }

  if (runtimePathNormalized.endsWith('/dist/licell.js')) {
    return {
      kind: 'project',
      packageManager,
      runtimePath: runtimePathForDetection,
      execPath
    };
  }

  if (execPathNormalized.includes('/node_modules/.bin/licell')) {
    return {
      kind: 'project',
      packageManager,
      runtimePath: runtimePathForDetection,
      execPath
    };
  }

  if (readPackageNameNearRuntime(runtimePathForDetection) === DEFAULT_PACKAGE_NAME) {
    return {
      kind: 'project',
      packageManager,
      runtimePath: runtimePathForDetection,
      execPath
    };
  }

  if (/(^|\/)(licell|ali)(\.exe)?$/.test(execPathNormalized)) {
    return { kind: 'release', runtimePath: runtimePathForDetection, execPath };
  }

  return { kind: 'unknown', runtimePath: runtimePathForDetection, execPath };
}

function normalizePackageVersion(version: string | undefined) {
  const trimmed = version?.trim();
  if (!trimmed) return 'latest';
  return trimmed.replace(/^v(?=\d)/i, '');
}

function quoteShellArg(value: string) {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function buildPackageManagerUpgradeCommand(input: {
  packageManager: PackageManagerName;
  version?: string;
}) {
  const version = normalizePackageVersion(input.version);
  const packageSpec = `${DEFAULT_PACKAGE_NAME}@${version}`;

  switch (input.packageManager) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['add', '-g', packageSpec],
        displayCommand: `pnpm add -g ${quoteShellArg(packageSpec)}`
      };
    case 'yarn':
      return {
        command: 'yarn',
        args: ['global', 'add', packageSpec],
        displayCommand: `yarn global add ${quoteShellArg(packageSpec)}`
      };
    case 'bun':
      return {
        command: 'bun',
        args: ['add', '-g', packageSpec],
        displayCommand: `bun add -g ${quoteShellArg(packageSpec)}`
      };
    case 'npm':
    default:
      return {
        command: 'npm',
        args: ['install', '-g', packageSpec],
        displayCommand: `npm install -g ${quoteShellArg(packageSpec)}`
      };
  }
}

export function resolveUpgradePlan(input: {
  repo?: string;
  version?: string;
  scriptUrl?: string;
  channel?: UpgradeChannel;
  installSource?: InstallSourceInfo;
}): UpgradePlan {
  const installSource = input.installSource ?? detectInstallSource();
  const channel = input.channel ?? 'auto';

  if (channel === 'release') {
    return {
      mode: 'release',
      scriptUrl: resolveUpgradeScriptUrl(input)
    };
  }

  if (isPackageManagerChannel(channel)) {
    const command = buildPackageManagerUpgradeCommand({
      packageManager: channel,
      version: input.version
    });
    return {
      mode: 'package-manager',
      packageManager: channel,
      ...command
    };
  }

  const releaseOverride = Boolean(input.scriptUrl) || (Boolean(input.repo) && input.repo !== DEFAULT_UPGRADE_REPO);

  if (!releaseOverride && installSource.kind === 'package-manager' && installSource.packageManager) {
    const command = buildPackageManagerUpgradeCommand({
      packageManager: installSource.packageManager,
      version: input.version
    });
    return {
      mode: 'package-manager',
      packageManager: installSource.packageManager,
      ...command
    };
  }

  if (!releaseOverride && installSource.kind === 'project') {
    throw new Error(resolveProjectInstallMessage(installSource.packageManager));
  }

  return {
    mode: 'release',
    scriptUrl: resolveUpgradeScriptUrl(input)
  };
}

export function resolveUpgradeScriptUrl(input: { repo?: string; version?: string; scriptUrl?: string }) {
  if (input.scriptUrl) return input.scriptUrl;
  const repo = input.repo || DEFAULT_UPGRADE_REPO;
  if (!REPO_SLUG_RE.test(repo)) throw new Error('无效的仓库格式，必须是 owner/repo');
  if (input.version) return `https://github.com/${repo}/releases/download/${input.version}/install.sh`;
  return `https://github.com/${repo}/releases/latest/download/install.sh`;
}

export function resolveChecksumUrl(scriptUrl: string) {
  const idx = scriptUrl.lastIndexOf('/');
  if (idx < 0) return null;
  return `${scriptUrl.substring(0, idx)}/SHA256SUMS.txt`;
}

export function parseChecksumForFile(checksumText: string, fileName: string) {
  for (const line of checksumText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([a-f0-9]{64})\s+(.+)$/);
    if (match && match[2].trim() === fileName) return match[1];
  }
  return null;
}

export function verifySha256(content: string, expectedHash: string) {
  const actual = createHash('sha256').update(content, 'utf8').digest('hex');
  return actual === expectedHash;
}

function downloadText(url: string, label: string) {
  const result = spawnSync('curl', ['-fsSL', url], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.status !== 0 || !result.stdout) {
    const stderr = (result.stderr || '').trim();
    throw new Error(stderr ? `下载${label}失败: ${stderr}` : `下载${label}失败`);
  }
  return result.stdout;
}

export function registerUpgradeCommand(cli: CAC) {
  registerCliCommand(cli, upgradeCommand)
    .action(async (options: { channel?: unknown; targetVersion?: unknown; repo?: unknown; scriptUrl?: unknown; skipChecksum?: unknown; dryRun?: unknown }) => {
      showIntro(pc.bgBlue(pc.white(' ⬆ Licell Upgrade ')));

      const channel = normalizeUpgradeChannel(toOptionalString(options.channel));
      const version = toOptionalString(options.targetVersion);
      const repo = toOptionalString(options.repo) || DEFAULT_UPGRADE_REPO;
      const customScriptUrl = toOptionalString(options.scriptUrl);
      const skipChecksum = Boolean(options.skipChecksum);

      if (isPackageManagerChannel(channel) && (customScriptUrl || repo !== DEFAULT_UPGRADE_REPO || skipChecksum)) {
        throw new Error(`--channel ${channel} 不支持 --repo / --script-url / --skip-checksum；这些选项仅适用于 release 渠道`);
      }

      if ((channel === 'auto' || channel === 'release') && customScriptUrl && !skipChecksum) {
        throw new Error('使用 --script-url 时必须同时指定 --skip-checksum 以确认跳过完整性校验');
      }

      const installSource = detectInstallSource();
      const pathResolution = resolveLicellPathResolution();
      const plan = resolveUpgradePlan({
        channel,
        repo,
        version,
        scriptUrl: customScriptUrl,
        installSource
      });

        if (Boolean(options.dryRun)) {
          if (isJsonOutput()) {
            emitCommandResult({
              dryRun: true,
              channel,
              installSource: installSource.kind,
              pathResolution,
              mode: plan.mode,
              ...(plan.mode === 'release'
                ? { scriptUrl: plan.scriptUrl }
                : {
                  packageManager: plan.packageManager,
                  command: plan.displayCommand
                })
            });
        } else {
          console.log(formatUpgradeDryRunText({
            installSource,
            channel,
            plan,
            pathResolution
          }));
          showOutro('Done.');
        }
        return;
      }

      const s = createSpinner();
      if (plan.mode === 'package-manager') {
        s.start(`正在通过 ${plan.packageManager} 执行升级...`);
        if (!isJsonOutput()) {
          s.stop(pc.green(`✅ 已检测到 ${plan.packageManager} 安装，开始执行升级`));
        }

        const install = spawnSync(plan.command, plan.args, {
          stdio: isJsonOutput() ? 'pipe' : 'inherit',
          encoding: 'utf8',
          env: process.env
        });

        if (isJsonOutput()) {
          const stdout = typeof install.stdout === 'string' ? install.stdout.trim() : '';
          const stderr = typeof install.stderr === 'string' ? install.stderr.trim() : '';
          if (stdout) {
            emitCommandEvent({
              stage: 'upgrade.install',
              action: 'stdout',
              status: 'info',
              source: 'stream',
              message: stdout
            });
          }
          if (stderr) {
            emitCommandEvent({
              stage: 'upgrade.install',
              action: 'stderr',
              status: 'info',
              source: 'stream',
              message: stderr
            });
          }
        }

        if (install.error) {
          throw new Error(`执行 ${plan.command} 失败: ${install.error.message}`);
        }
        if (install.status !== 0) {
          throw new Error(`升级安装失败（command=${plan.command}, exit=${install.status ?? 'unknown'}）`);
        }

        if (isJsonOutput()) {
          emitCommandResult({
            dryRun: false,
            channel,
            mode: plan.mode,
            packageManager: plan.packageManager,
            command: plan.displayCommand,
            pathResolution: resolveLicellPathResolution()
          });
        } else {
          showOutro(pc.green(`✅ 升级完成（${plan.packageManager}）`));
        }
        return;
      }

      s.start('正在下载升级脚本...');

      const installScript = downloadText(plan.scriptUrl, '安装脚本');

      if (!skipChecksum) {
        const checksumUrl = resolveChecksumUrl(plan.scriptUrl);
        if (checksumUrl) {
          s.message('正在校验脚本完整性...');
          try {
            const checksumText = downloadText(checksumUrl, 'SHA256SUMS');
            const expected = parseChecksumForFile(checksumText, 'install.sh');
            if (expected) {
              if (!verifySha256(installScript, expected)) {
                throw new Error('install.sh SHA256 校验失败，脚本可能被篡改。如需跳过校验请使用 --skip-checksum');
              }
            } else {
              if (isJsonOutput()) {
                emitCommandEvent({
                  stage: 'upgrade',
                  action: 'checksum',
                  status: 'info',
                  message: 'SHA256SUMS 未包含 install.sh，已跳过校验'
                });
              } else {
                console.error(pc.yellow('⚠️ SHA256SUMS 中未找到 install.sh 条目，跳过校验'));
              }
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('SHA256 校验失败')) throw err;
            if (isJsonOutput()) {
              emitCommandEvent({
                stage: 'upgrade',
                action: 'checksum',
                status: 'info',
                message: '无法下载 SHA256SUMS，已跳过校验'
              });
            } else {
              console.error(pc.yellow('⚠️ 无法下载 SHA256SUMS 校验文件，跳过校验'));
            }
          }
        }
      }

      const tempDir = mkdtempSync(join(tmpdir(), 'licell-upgrade-'));
      const tempScriptPath = join(tempDir, 'install.sh');

      try {
        writeFileSync(tempScriptPath, installScript, { mode: 0o700 });
        if (!isJsonOutput()) {
          s.stop(pc.green('✅ 脚本下载完成，开始安装'));
        }

        const install = spawnSync('bash', [tempScriptPath], {
          stdio: isJsonOutput() ? 'pipe' : 'inherit',
          encoding: 'utf8',
          env: { ...process.env, LICELL_SKIP_RUN_CHECK: '1' }
        });
        if (isJsonOutput()) {
          const stdout = typeof install.stdout === 'string' ? install.stdout.trim() : '';
          const stderr = typeof install.stderr === 'string' ? install.stderr.trim() : '';
          if (stdout) {
            emitCommandEvent({
              stage: 'upgrade.install',
              action: 'stdout',
              status: 'info',
              source: 'stream',
              message: stdout
            });
          }
          if (stderr) {
            emitCommandEvent({
              stage: 'upgrade.install',
              action: 'stderr',
              status: 'info',
              source: 'stream',
              message: stderr
            });
          }
        }

        if (install.error) {
          throw new Error(`执行 bash 安装脚本失败: ${install.error.message}`);
        }
        if (install.status !== 0) {
          throw new Error(`升级安装失败（exit=${install.status ?? 'unknown'}）`);
        }

        if (isJsonOutput()) {
          emitCommandResult({
            dryRun: false,
            channel,
            mode: plan.mode,
            scriptUrl: plan.scriptUrl,
            checksumSkipped: skipChecksum,
            installSource: installSource.kind,
            pathResolution: resolveLicellPathResolution()
          });
        } else {
          showOutro(pc.green('✅ 升级完成'));
        }
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
}

export const upgradeCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerUpgradeCommand,
  commands: [upgradeCommand]
});
