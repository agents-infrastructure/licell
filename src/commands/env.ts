import type { CAC } from 'cac';
import { outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { writeFileSync } from 'fs';
import { escapeEnvValue, normalizeReleaseTarget } from '../utils/cli-helpers';
import { pullFunctionEnvs, setFunctionEnv, removeFunctionEnv } from '../providers/fc';
import {
  ensureAuthOrExit,
  requireAppName,
  toPromptValue,
  normalizeEnvKey,
  ensureEnvIgnored,
  withSpinner
} from '../utils/cli-shared';
import { Config } from '../utils/config';

export function registerEnvCommands(cli: CAC) {
  cli.command('env list', '查看云端环境变量')
    .option('--target <target>', '查看指定 FC alias 的环境变量（如 prod/preview）')
    .option('--show-values', '显示完整变量值（默认隐藏）')
    .action(async (options: { target?: string; showValues?: boolean }) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);
      const qualifier = options.target ? normalizeReleaseTarget(options.target) : undefined;

      const s = spinner();
      const envs = await withSpinner(
        s,
        qualifier ? `正在拉取 alias=${qualifier} 的环境变量...` : '正在拉取云端环境变量...',
        '❌ 获取环境变量失败',
        () => pullFunctionEnvs(project.appName, qualifier)
      );
      if (!envs) return;
      s.stop(pc.green(`✅ 共 ${Object.keys(envs).length} 个环境变量`));
      const entries = Object.entries(envs).sort(([a], [b]) => a.localeCompare(b));
      if (entries.length === 0) {
        outro('云端当前无环境变量');
        return;
      }
      const showValues = Boolean(options.showValues);
      for (const [key, value] of entries) {
        const renderedValue = showValues ? value : `<hidden:${String(value).length} chars>`;
        console.log(`${pc.cyan(key)}=${renderedValue}`);
      }
      console.log('');
      outro('Done.');
    });

  cli.command('env set <key> <value>', '设置云端环境变量（并同步本地 .licell/project.json）')
    .action(async (key: string, value: string) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);
      const envKey = normalizeEnvKey(toPromptValue(key, '环境变量名'));
      const envValue = toPromptValue(value, '环境变量值');

      const s = spinner();
      const envs = await withSpinner(
        s,
        `正在写入环境变量 ${envKey}...`,
        '❌ 环境变量写入失败',
        () => setFunctionEnv(project.appName, envKey, envValue)
      );
      if (!envs) return;
      Config.setProject({ envs }, { replaceEnvs: true });
      s.stop(pc.green('✅ 环境变量已写入云端并同步到本地配置'));
      outro('Done.');
    });

  cli.command('env rm <key>', '删除云端环境变量（并同步本地 .licell/project.json）')
    .action(async (key: string) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);
      const envKey = normalizeEnvKey(toPromptValue(key, '环境变量名'));

      const s = spinner();
      const envs = await withSpinner(
        s,
        `正在删除环境变量 ${envKey}...`,
        '❌ 环境变量删除失败',
        () => removeFunctionEnv(project.appName, envKey)
      );
      if (!envs) return;
      Config.setProject({ envs }, { replaceEnvs: true });
      s.stop(pc.green('✅ 环境变量已从云端移除（若存在）并同步本地配置'));
      outro('Done.');
    });

  cli.command('env pull', '拉取云端环境变量')
    .option('--target <target>', '从指定 FC alias 拉取环境变量（如 prod/preview）')
    .action(async (options: { target?: string }) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      requireAppName(project);
      const qualifier = options.target ? normalizeReleaseTarget(options.target) : undefined;

      const s = spinner();
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
        writeFileSync('.env', '', { mode: 0o600 });
        s.stop(pc.yellow('云端无环境变量，已清空本地 .env'));
        return;
      }
      const envContent = entries.map(([k, v]) => `${k}="${escapeEnvValue(String(v))}"`).join('\n');
      writeFileSync('.env', envContent, { mode: 0o600 });
      ensureEnvIgnored();
      s.stop(pc.green(`✅ 已拉取 ${entries.length} 个环境变量并写入 .env`));
    });
}
