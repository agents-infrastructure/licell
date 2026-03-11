import type { CAC } from 'cac';
import { defineCommandModule, commandInvocation, defineCliCommand, registerCliCommand } from './module';
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
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { DELIVERY_SECTION } from './sections';

const envListCommand = defineCliCommand({
  rawName: 'env list',
  description: '查看云端环境变量',
  options: [
    { rawName: '--target <target>', description: '查看指定 FC alias 的环境变量（如 prod/preview）' },
    { rawName: '--show-values', description: '显示完整变量值（默认隐藏）' }
  ]
});

const envSetCommand = defineCliCommand({
  rawName: 'env set <key> <value>',
  description: '设置云端环境变量（并同步本地 .licell/project.json）',
  descriptor: {
    examples: ['licell env set API_BASE_URL https://api.example.com', 'licell env set NODE_ENV production --output json'],
    argumentHints: {
      key: '环境变量名，例如 `API_KEY`、`NODE_ENV`。',
      value: '变量值；如包含空格，请使用引号。'
    },
    recommendedFlow: [
      { title: '先查看现状', command: 'licell env list --output json', reason: '避免覆盖已有变量或拼错 key。' },
      { title: '设置变量', command: 'licell env set <key> <value> --output json', reason: '同时更新云端与本地项目配置。' },
      { title: '必要时回拉确认', command: 'licell env pull --output json', reason: '确保云端状态与本地项目配置一致。' }
    ],
    safety: {
      level: 'mutating',
      reason: '会更新云端环境变量，并同步本地 `.licell/project.json`。'
    }
  }
});

const envRmCommand = defineCliCommand({
  rawName: 'env rm <key>',
  description: '删除云端环境变量（并同步本地 .licell/project.json）',
  options: [
    { rawName: '--yes', description: '跳过二次确认（危险）' }
  ],
  descriptor: {
    notes: ['会同时删除云端环境变量与本地 `.licell/project.json` 中对应项。'],
    examples: ['licell env rm API_KEY', 'licell env rm API_KEY --output json'],
    argumentHints: {
      key: '待删除的环境变量名。'
    },
    safety: {
      level: 'destructive',
      reason: '会删除已有环境变量，执行前建议先 `licell env list` 确认。'
    }
  }
});

const envPullCommand = defineCliCommand({
  rawName: 'env pull',
  description: '拉取云端环境变量',
  options: [
    { rawName: '--target <target>', description: '从指定 FC alias 拉取环境变量（如 prod/preview）' }
  ]
});

export function registerEnvCommands(cli: CAC) {
  registerCliCommand(cli, envListCommand)
    .action(async (options: { target?: string; showValues?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(envListCommand),
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
            emitCommandResult({
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

  registerCliCommand(cli, envSetCommand)
    .action(async (key: string, value: string) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(envSetCommand),
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
            emitCommandResult({
              key: envKey,
              updatedCount: Object.keys(envs).length
            });
          }
        }
      );
    });

  registerCliCommand(cli, envRmCommand)
    .action(async (key: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(envRmCommand),
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
            emitCommandResult({
              key: envKey,
              updatedCount: Object.keys(envs).length
            });
          }
        }
      );
    });

  registerCliCommand(cli, envPullCommand)
    .action(async (options: { target?: string }) => {
      await executeWithAuthRecovery(
        {
          commandLabel: commandInvocation(envPullCommand),
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
            try {
              writeFileSync('.env', '', { mode: 0o600 });
            } catch (e) {
              throw new Error(`写入 .env 文件失败: ${e instanceof Error ? e.message : String(e)}`);
            }
            if (!isJsonOutput()) {
              s.stop(pc.yellow('云端无环境变量，已清空本地 .env'));
            }
            emitCommandResult({
              qualifier: qualifier || null,
              count: 0,
              envFile: '.env',
              emptied: true
            });
            return;
          }
          const envContent = entries.map(([key, value]) => `${key}="${escapeEnvValue(String(value))}"`).join('\n');
          try {
            writeFileSync('.env', envContent, { mode: 0o600 });
          } catch (e) {
            throw new Error(`写入 .env 文件失败: ${e instanceof Error ? e.message : String(e)}`);
          }
          ensureEnvIgnored();
          if (!isJsonOutput()) {
            s.stop(pc.green(`✅ 已拉取 ${entries.length} 个环境变量并写入 .env`));
          }
          emitCommandResult({
            qualifier: qualifier || null,
            count: entries.length,
            envFile: '.env',
            emptied: false
          });
        }
      );
    });
}

export const envCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerEnvCommands,
  commands: [envListCommand, envSetCommand, envRmCommand, envPullCommand],
  namespaces: {
    env: {
      summary: '云端环境变量的查看、设置、删除与回拉。',
      examples: ['licell env list', 'licell env set API_KEY secret', 'licell env pull --output json']
    }
  }
});
