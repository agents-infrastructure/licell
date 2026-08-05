import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { select, text, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro, toPromptValue } from '../utils/cli-shared';
import { emitCliError, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
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
  kind?: string;
  force?: boolean;
  yes?: boolean;
}

const initCommand = defineCliCommand({
  rawName: 'init',
  regionExclusion: 'local',
  description: '初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置）',
  options: [
    { rawName: '--runtime <runtime>', description: '默认 runtime：nodejs20/nodejs22/python3.12/python3.13/docker' },
    { rawName: '--kind <kind>', description: '脚手架类型：api 或 task（默认 api）' },
    { rawName: '--app <name>', description: '应用名（用于 FC functionName）' },
    { rawName: '--force', description: '在已有项目目录生成/覆盖脚手架文件' },
    { rawName: '--yes', description: '使用默认值，不进入交互' }
  ],
  descriptor: {
    title: 'Initialize licell project',
    notes: [
      '空目录下会生成脚手架；已有项目目录默认仅写入 licell 配置。',
      '若要在已有目录补齐脚手架，需要显式传 `--runtime` 与 `--force`。',
      '`--kind task` 会生成任务函数入口（Node 为 `src/task.ts`，Python 为 `src/task.py`），并把项目默认 `deployType` 写成 `task`。'
    ],
    examples: [
      'licell init',
      'licell init --runtime nodejs22 --kind task',
      'licell init --runtime docker --app my-app',
      'licell init --yes --output json'
    ],
    interaction: {
      ttyOnly: true,
      prompts: ['空目录且未传 `--runtime` 时会提示选择默认 runtime。', '空目录且未传 `--kind` 时会提示选择 API 或 task。', '未显式提供 `--app` 时会提示确认应用名。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--runtime', '--kind', '--app', '--yes'],
      notes: ['自动化初始化时建议显式传入 `--runtime`、`--kind`、`--app`，并用 `--yes --output json` 禁止交互。']
    },
    optionInsights: {
      '--runtime': { whenToUse: '需要显式指定项目模板与默认 runtime 时使用。' },
      '--kind': { whenToUse: '需要初始化 task worker 而不是 HTTP API 时使用。', cautions: ['当前 task 脚手架仅支持 nodejs20/nodejs22/python3.12/python3.13；docker task 暂未提供。'] },
      '--app': { whenToUse: '希望指定或覆盖 FC functionName 对应的应用名时使用。' },
      '--force': { whenToUse: '已有项目目录中仍需要生成或覆盖脚手架文件时使用。', cautions: ['可能覆盖已有文件内容。'] },
      '--yes': { whenToUse: '非交互或自动化场景，直接使用默认值时使用。' }
    },
    recommendedFlow: [
      { title: '初始化项目', command: 'licell init --output json', reason: '先拿到解析出的 runtime、appName 与写入结果。' },
      { title: '检查生成文件', reason: '确认脚手架或 licell 项目配置是否符合预期。' },
      { title: '继续部署', command: 'licell deploy --type api --target preview', reason: 'API 项目初始化完成后直接进入部署链路。' },
      { title: '若为 task 项目则直接触发', command: 'licell task invoke [name] --output json', reason: 'task 项目部署完成后没有固定 URL，应直接走异步任务调用。' }
    ],
    result: {
      summary: '返回初始化后的 runtime、应用名与文件写入结果。',
      fields: [
        { name: 'stage', description: '固定为 `init`。', required: true },
        { name: 'runtime', description: '解析后的默认 runtime。', required: true },
        { name: 'kind', description: '脚手架类型：`api` 或 `task`。', required: true },
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
        emitCommandEvent({ command: 'init', status: 'start' });
      }

      const interactiveTTY = isInteractiveTTY();
      const nonInteractive = options.yes || !interactiveTTY;
      const workspaceEmpty = isWorkspaceEffectivelyEmpty(process.cwd());
      const hasExplicitRuntime = typeof options.runtime === 'string' && options.runtime.trim().length > 0;
      const shouldPromptRuntime = workspaceEmpty && !hasExplicitRuntime && !nonInteractive;

      try {
        const project = Config.getProject({ localOnly: true });
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

        let kindInput = options.kind?.trim().toLowerCase() || project.deployType?.trim().toLowerCase();
        if (!kindInput && workspaceEmpty && !nonInteractive) {
          const selectedKind = await select({
            message: '选择脚手架类型:',
            options: [
              { value: 'api', label: 'api (HTTP API / Web 服务)' },
              { value: 'task', label: 'task (FC 异步任务函数)' }
            ]
          });
          if (isCancel(selectedKind)) {
            if (isJsonOutput()) throw new Error('操作已取消');
            process.exit(0);
          }
          kindInput = String(selectedKind);
        }

        if (kindInput && kindInput !== 'api' && kindInput !== 'task') {
          throw new Error('--kind 仅支持 api 或 task');
        }

        const kind = kindInput === 'task' ? 'task' : 'api';

        const resolved = runtimeInput
          ? resolveInitRuntime(runtimeInput)
          : workspaceEmpty
            ? resolveInitRuntime()
            : detectWorkspaceTemplateAndRuntime(process.cwd());
        const { template, runtime } = resolved;

        const shouldWriteScaffold = workspaceEmpty || (!workspaceEmpty && hasExplicitRuntime && Boolean(options.force));

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
          ? writeScaffoldFiles(process.cwd(), getScaffoldFiles(template, runtime, kind), Boolean(options.force))
          : { written: [] as string[], skipped: [] as string[] };
        Config.setProject({ appName, runtime, deployType: kind }, { localOnly: true });
        s.stop(pc.green(shouldWriteScaffold ? '✅ 脚手架创建完成' : '✅ 配置写入完成'));

        console.log(`runtime:  ${pc.cyan(runtime)}`);
        console.log(`kind:     ${pc.cyan(kind)}`);
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
        console.log(`- licell deploy --type ${kind} --runtime ${runtime} --target preview`);

        if (isJsonOutput()) {
          emitCommandResult({
            runtime,
            kind,
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
