import type { CAC } from 'cac';
import pc from 'picocolors';
import { writeFileSync } from 'fs';
import { escapeEnvValue, normalizeReleaseTarget } from '../utils/cli-helpers';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { pullFunctionEnvs, setFunctionEnv, removeFunctionEnv } from '../providers/fc';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  createSpinner,
  requireAppName,
  isInteractiveTTY,
  showOutro,
  toPromptValue,
  normalizeEnvKey,
  ensureEnvIgnored,
  withSpinner
} from '../utils/cli-shared';
import { Config } from '../utils/config';
import { emitCliResult, isJsonOutput } from '../utils/output';

export function registerEnvCommands(cli: CAC) {
  cli.command('env list', '查看云端环境变量')
    .option('--target <target>', '查看指定 FC alias 的环境变量（如 prod/preview）')
    .option('--show-values', '显示完整变量值（默认隐藏）')
    .action(async (options: { target?: string; showValues?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell env list',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);
          const qualifier = options.target ? normalizeReleaseTarget(options.target) : undefined;

          const s = createSpinner();
          const envs = await withSpinner(
            s,
            qualifier ? `正在拉取 alias=${qualifier} 的环境变量...` : '正在拉取云端环境变量...',
            '❌ 获取环境变量失败',
            () => pullFunctionEnvs(project.appName, qualifier)
          );
          if (!envs) return;
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 共 ${Object.keys(envs).length} 个环境变量`));
          }
          const entries = Object.entries(envs).sort(([a], [b]) => a.localeCompare(b));
          const showValues = Boolean(options.showValues);
          if (isJsonOutput()) {
            const renderedEnvs = showValues
              ? Object.fromEntries(entries)
              : Object.fromEntries(entries.map(([key, value]) => [key, `<hidden:${String(value).length} chars>`]));
            emitCliResult({
              stage: 'env.list',
              qualifier: qualifier || null,
              count: entries.length,
              showValues,
              envs: renderedEnvs
            });
            return;
          }
          if (entries.length === 0) {
            showOutro('云端当前无环境变量');
            return;
          }
          for (const [key, value] of entries) {
            const renderedValue = showValues ? value : `<hidden:${String(value).length} chars>`;
            console.log(`${pc.cyan(key)}=${renderedValue}`);
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  cli.command('env set <key> <value>', '设置云端环境变量（并同步本地 .licell/project.json）')
    .action(async (key: string, value: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell env set',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);
          const envKey = normalizeEnvKey(toPromptValue(key, '环境变量名'));
          const envValue = toPromptValue(value, '环境变量值');

          const s = createSpinner();
          const envs = await withSpinner(
            s,
            `正在写入环境变量 ${envKey}...`,
            '❌ 环境变量写入失败',
            () => setFunctionEnv(project.appName, envKey, envValue)
          );
          if (!envs) return;
          Config.setProject({ envs }, { replaceEnvs: true });
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 环境变量已写入云端并同步到本地配置'));
            showOutro('Done.');
          } else {
            emitCliResult({
              stage: 'env.set',
              key: envKey,
              updatedCount: Object.keys(envs).length
            });
          }
        }
      );
    });

  cli.command('env rm <key>', '删除云端环境变量（并同步本地 .licell/project.json）')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (key: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell env rm',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);
          const envKey = normalizeEnvKey(toPromptValue(key, '环境变量名'));
          await ensureDestructiveActionConfirmed(`删除环境变量 ${envKey}`, { yes: Boolean(options.yes) });

          const s = createSpinner();
          const envs = await withSpinner(
            s,
            `正在删除环境变量 ${envKey}...`,
            '❌ 环境变量删除失败',
            () => removeFunctionEnv(project.appName, envKey)
          );
          if (!envs) return;
          Config.setProject({ envs }, { replaceEnvs: true });
          if (!isJsonOutput()) {
            s.stop(pc.green('✅ 环境变量已从云端移除（若存在）并同步本地配置'));
            showOutro('Done.');
          } else {
            emitCliResult({
              stage: 'env.rm',
              key: envKey,
              updatedCount: Object.keys(envs).length
            });
          }
        }
      );
    });

  cli.command('env pull', '拉取云端环境变量')
    .option('--target <target>', '从指定 FC alias 拉取环境变量（如 prod/preview）')
    .action(async (options: { target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: 'licell env pull',
          interactiveTTY: isInteractiveTTY(),
          requiredCapabilities: ['fc']
        },
        async () => {
          ensureAuthOrExit();
          const project = Config.getProject();
          requireAppName(project);
          const qualifier = options.target ? normalizeReleaseTarget(options.target) : undefined;

          const s = createSpinner();
          const envs = await withSpinner(
            s,
            qualifier ? `正在拉取 alias=${qualifier} 的环境变量...` : '正在拉取云端环境变量...',
            '❌ 环境变量拉取失败',
            () => pullFunctionEnvs(project.appName, qualifier)
          );
          if (!envs) return;
          Config.setProject({ envs }, { replaceEnvs: true });
          const entries = Object.entries(envs);
          if (entries.length === 0) {
            try { writeFileSync('.env', '', { mode: 0o600 }); } catch (e) {
              throw new Error(`写入 .env 文件失败: ${e instanceof Error ? e.message : String(e)}`);
            }
            if (!isJsonOutput()) {
              s.stop(pc.yellow('云端无环境变量，已清空本地 .env'));
            }
            emitCliResult({
              stage: 'env.pull',
              qualifier: qualifier || null,
              count: 0,
              envFile: '.env',
              emptied: true
            });
            return;
          }
          const envContent = entries.map(([k, v]) => `${k}="${escapeEnvValue(String(v))}"`).join('\n');
          try { writeFileSync('.env', envContent, { mode: 0o600 }); } catch (e) {
            throw new Error(`写入 .env 文件失败: ${e instanceof Error ? e.message : String(e)}`);
          }
          ensureEnvIgnored();
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 已拉取 ${entries.length} 个环境变量并写入 .env`));
          }
          emitCliResult({
            stage: 'env.pull',
            qualifier: qualifier || null,
            count: entries.length,
            envFile: '.env',
            emptied: false
          });
        }
      );
    });
}
