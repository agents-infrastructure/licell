import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { select, text, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro, toPromptValue } from '../utils/cli-shared';
import { emitCliError, emitCliEvent, emitCliResult, isJsonOutput } from '../utils/output';
import {
  detectWorkspaceTemplateAndRuntime,
  deriveDefaultAppName,
  getScaffoldFiles,
  isWorkspaceEffectivelyEmpty,
  resolveInitRuntime,
  validateAppName,
  writeScaffoldFiles
} from '../utils/init-scaffold';
import { SETUP_SECTION } from './sections';

interface InitOptions {
  runtime?: string;
  app?: string;
  force?: boolean;
  yes?: boolean;
}

const initCommand = defineCliCommand({
  rawName: 'init',
  description: '初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置）',
  options: [
    { rawName: '--runtime <runtime>', description: '默认 runtime：nodejs20/nodejs22/python3.12/python3.13/docker' },
    { rawName: '--app <name>', description: '应用名（用于 FC functionName）' },
    { rawName: '--force', description: '在已有项目目录生成/覆盖脚手架文件' },
    { rawName: '--yes', description: '使用默认值，不进入交互' }
  ],
  descriptor: {
    title: 'Initialize licell project',
    notes: ['空目录下会生成脚手架；已有项目目录默认仅写入 licell 配置。', '若要在已有目录补齐脚手架，需要显式传 `--runtime` 与 `--force`。'],
    examples: ['licell init', 'licell init --runtime docker --app my-app', 'licell init --yes --output json'],
    interaction: {
      ttyOnly: true,
      prompts: ['空目录且未传 `--runtime` 时会提示选择默认 runtime。', '未显式提供 `--app` 时会提示确认应用名。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--runtime', '--app', '--yes'],
      notes: ['自动化初始化时建议显式传入 `--runtime`、`--app`，并用 `--yes --output json` 禁止交互。']
    },
    optionInsights: {
      '--runtime': { whenToUse: '需要显式指定项目模板与默认 runtime 时使用。' },
      '--app': { whenToUse: '希望指定或覆盖 FC functionName 对应的应用名时使用。' },
      '--force': { whenToUse: '已有项目目录中仍需要生成或覆盖脚手架文件时使用。', cautions: ['可能覆盖已有文件内容。'] },
      '--yes': { whenToUse: '非交互或自动化场景，直接使用默认值时使用。' }
    },
    recommendedFlow: [
      { title: '初始化项目', command: 'licell init --output json', reason: '先拿到解析出的 runtime、appName 与写入结果。' },
      { title: '检查生成文件', reason: '确认脚手架或 licell 项目配置是否符合预期。' },
      { title: '继续部署', command: 'licell deploy --type api --target preview', reason: '初始化完成后直接进入部署链路。' }
    ],
    result: {
      summary: '返回初始化后的 runtime、应用名与文件写入结果。',
      fields: [
        { name: 'stage', description: '固定为 `init`。', required: true },
        { name: 'runtime', description: '解析后的默认 runtime。', required: true },
        { name: 'appName', description: '最终写入配置的应用名。', required: true },
        { name: 'mode', description: '`scaffold+config` 或 `config-only`。', required: true },
        { name: 'writtenFiles', description: '实际写入的文件列表。', required: true },
        { name: 'skippedFiles', description: '跳过写入的文件列表。', required: true }
      ]
    },
    agentTips: ['Agent 在自动化初始化时优先使用 `--yes --output json`，并读取 `mode` / `writtenFiles` 决定后续动作。']
  }
});

export function registerInitCommand(cli: CAC) {
  registerCliCommand(cli, initCommand)
    .action(async (options: InitOptions) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' ⚡ Licell Project Init ')));
      } else {
        emitCliEvent({ stage: 'init', action: 'init', status: 'start' });
      }

      const interactiveTTY = isInteractiveTTY();
      const nonInteractive = options.yes || !interactiveTTY;
      const workspaceEmpty = isWorkspaceEffectivelyEmpty(process.cwd());
      const hasExplicitRuntime = typeof options.runtime === 'string' && options.runtime.trim().length > 0;
      const shouldPromptRuntime = workspaceEmpty && !hasExplicitRuntime && !nonInteractive;

      try {
        let runtimeInput = options.runtime;
        if (!runtimeInput && shouldPromptRuntime) {
          const selected = await select({
            message: '选择默认 runtime:',
            options: [
              { value: 'nodejs20', label: 'nodejs20 (Node TypeScript)' },
              { value: 'nodejs22', label: 'nodejs22 (Node 22 Custom Runtime)' },
              { value: 'python3.12', label: 'python3.12 (Python Built-in Runtime)' },
              { value: 'python3.13', label: 'python3.13 (Python 3.13 Custom Runtime)' },
              { value: 'docker', label: 'docker (Bun + TypeScript + Hono)' }
            ]
          });
          if (isCancel(selected)) {
            if (isJsonOutput()) throw new Error('操作已取消');
            process.exit(0);
          }
          runtimeInput = String(selected);
        }

        const resolved = runtimeInput
          ? resolveInitRuntime(runtimeInput)
          : workspaceEmpty
            ? resolveInitRuntime()
            : detectWorkspaceTemplateAndRuntime(process.cwd());
        const { template, runtime } = resolved;

        const shouldWriteScaffold = workspaceEmpty || (!workspaceEmpty && hasExplicitRuntime && Boolean(options.force));
        const project = Config.getProject();

        let appNameInput = options.app || project.appName || deriveDefaultAppName();
        if (!options.app && !nonInteractive) {
          appNameInput = toPromptValue(await text({
            message: '应用名（用于 FC functionName）:',
            initialValue: appNameInput
          }), '应用名');
        }
        const appName = validateAppName(appNameInput);

        const s = createSpinner();
        s.start(shouldWriteScaffold ? '正在生成项目脚手架...' : '正在写入 licell 项目配置...');
        const { written, skipped } = shouldWriteScaffold
          ? writeScaffoldFiles(process.cwd(), getScaffoldFiles(template, runtime), Boolean(options.force))
          : { written: [] as string[], skipped: [] as string[] };
        Config.setProject({ appName, runtime });
        s.stop(pc.green(shouldWriteScaffold ? '✅ 脚手架创建完成' : '✅ 配置写入完成'));

        console.log(`runtime:  ${pc.cyan(runtime)}`);
        console.log(`appName:  ${pc.cyan(appName)}`);
        console.log(`mode:     ${pc.cyan(shouldWriteScaffold ? 'scaffold+config' : 'config-only')}`);
        if (!shouldWriteScaffold) {
          console.log('\n检测到当前目录已有项目文件，已跳过脚手架生成。');
          console.log('如需在已有目录生成脚手架，请显式指定 --runtime <runtime> --force。');
        }
        if (written.length > 0) {
          console.log(`\n已写入文件:`);
          for (const file of written) console.log(`- ${file}`);
        }
        if (skipped.length > 0) {
          console.log(`\n已跳过（内容相同）:`);
          for (const file of skipped) console.log(`- ${file}`);
        }
        console.log('\n下一步可直接执行:');
        console.log(`- licell deploy --type api --runtime ${runtime} --target preview`);

        if (isJsonOutput()) {
          emitCliResult({
            stage: 'init',
            runtime,
            appName,
            mode: shouldWriteScaffold ? 'scaffold+config' : 'config-only',
            writtenFiles: written,
            skippedFiles: skipped
          });
        } else {
          showOutro('Done.');
        }
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'init' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });
}

export const initCommandModule = defineCommandModule({
  section: SETUP_SECTION,
  register: registerInitCommand,
  commands: [initCommand]
});
