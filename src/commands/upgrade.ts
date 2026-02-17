import type { CAC } from 'cac';
import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { spawnSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { toOptionalString } from '../utils/cli-shared';

const DEFAULT_UPGRADE_REPO = 'dafang/licell';
const REPO_SLUG_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function resolveUpgradeScriptUrl(input: { repo?: string; version?: string; scriptUrl?: string }) {
  if (input.scriptUrl) return input.scriptUrl;
  const repo = input.repo || DEFAULT_UPGRADE_REPO;
  if (!REPO_SLUG_RE.test(repo)) throw new Error('无效的仓库格式，必须是 owner/repo');
  if (input.version) return `https://github.com/${repo}/releases/download/${input.version}/install.sh`;
  return `https://github.com/${repo}/releases/latest/download/install.sh`;
}

function downloadInstallScript(scriptUrl: string) {
  const result = spawnSync('curl', ['-fsSL', scriptUrl], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.status !== 0 || !result.stdout) {
    const stderr = (result.stderr || '').trim();
    throw new Error(stderr ? `下载安装脚本失败: ${stderr}` : '下载安装脚本失败');
  }
  return result.stdout;
}

export function registerUpgradeCommand(cli: CAC) {
  cli.command('upgrade', '升级到最新 release 版本')
    .option('--version <tag>', '指定版本（如 v0.9.6）')
    .option('--repo <owner/repo>', `GitHub 仓库（默认 ${DEFAULT_UPGRADE_REPO}）`)
    .option('--script-url <url>', '覆盖 install.sh 地址（调试用途）')
    .option('--dry-run', '只输出将使用的安装脚本地址')
    .action(async (options: { version?: unknown; repo?: unknown; scriptUrl?: unknown; dryRun?: unknown }) => {
      intro(pc.bgBlue(pc.white(' ⬆ Licell Upgrade ')));

      const version = toOptionalString(options.version);
      const repo = toOptionalString(options.repo) || DEFAULT_UPGRADE_REPO;
      const scriptUrl = resolveUpgradeScriptUrl({
        repo,
        version,
        scriptUrl: toOptionalString(options.scriptUrl)
      });

      if (Boolean(options.dryRun)) {
        console.log(scriptUrl);
        outro('Done.');
        return;
      }

      const s = spinner();
      s.start('正在下载升级脚本...');

      const installScript = downloadInstallScript(scriptUrl);
      const tempDir = mkdtempSync(join(tmpdir(), 'licell-upgrade-'));
      const tempScriptPath = join(tempDir, 'install.sh');

      try {
        writeFileSync(tempScriptPath, installScript, { mode: 0o700 });
        s.stop(pc.green('✅ 脚本下载完成，开始安装'));

        const install = spawnSync('bash', [tempScriptPath], {
          stdio: 'inherit',
          env: { ...process.env, LICELL_SKIP_RUN_CHECK: '1' }
        });

        if (install.status !== 0) {
          throw new Error(`升级安装失败（exit=${install.status ?? 'unknown'}）`);
        }

        outro(pc.green('✅ 升级完成'));
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
}
