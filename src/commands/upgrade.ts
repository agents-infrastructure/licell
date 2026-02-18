import type { CAC } from 'cac';
import { intro, outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { createHash } from 'crypto';
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
  cli.command('upgrade', '升级到最新 release 版本')
    .option('--version <tag>', '指定版本（如 v0.9.6）')
    .option('--repo <owner/repo>', `GitHub 仓库（默认 ${DEFAULT_UPGRADE_REPO}）`)
    .option('--script-url <url>', '覆盖 install.sh 地址（调试用途，需配合 --skip-checksum）')
    .option('--skip-checksum', '跳过 SHA256 完整性校验（不推荐）')
    .option('--dry-run', '只输出将使用的安装脚本地址')
    .action(async (options: { version?: unknown; repo?: unknown; scriptUrl?: unknown; skipChecksum?: unknown; dryRun?: unknown }) => {
      intro(pc.bgBlue(pc.white(' ⬆ Licell Upgrade ')));

      const version = toOptionalString(options.version);
      const repo = toOptionalString(options.repo) || DEFAULT_UPGRADE_REPO;
      const customScriptUrl = toOptionalString(options.scriptUrl);
      const skipChecksum = Boolean(options.skipChecksum);

      if (customScriptUrl && !skipChecksum) {
        throw new Error('使用 --script-url 时必须同时指定 --skip-checksum 以确认跳过完整性校验');
      }

      const scriptUrl = resolveUpgradeScriptUrl({
        repo,
        version,
        scriptUrl: customScriptUrl
      });

      if (Boolean(options.dryRun)) {
        console.log(scriptUrl);
        outro('Done.');
        return;
      }

      const s = spinner();
      s.start('正在下载升级脚本...');

      const installScript = downloadText(scriptUrl, '安装脚本');

      if (!skipChecksum) {
        const checksumUrl = resolveChecksumUrl(scriptUrl);
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
              console.error(pc.yellow('⚠️ SHA256SUMS 中未找到 install.sh 条目，跳过校验'));
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('SHA256 校验失败')) throw err;
            console.error(pc.yellow('⚠️ 无法下载 SHA256SUMS 校验文件，跳过校验'));
          }
        }
      }

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
