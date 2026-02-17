import type { CAC } from 'cac';
import { intro, outro, select, text, spinner, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { isInteractiveTTY, toPromptValue } from '../utils/cli-shared';
import {
  detectWorkspaceTemplateAndRuntime,
  deriveDefaultAppName,
  getScaffoldFiles,
  isWorkspaceEffectivelyEmpty,
  resolveInitRuntime,
  validateAppName,
  writeScaffoldFiles
} from '../utils/init-scaffold';

interface InitOptions {
  runtime?: string;
  app?: string;
  force?: boolean;
  yes?: boolean;
}

export function registerInitCommand(cli: CAC) {
  cli.command('init', '初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置）')
    .option('--runtime <runtime>', '默认 runtime：nodejs20/nodejs22/python3.12/python3.13/docker')
    .option('--app <name>', '应用名（用于 FC functionName）')
    .option('--force', '在已有项目目录生成/覆盖脚手架文件')
    .option('--yes', '使用默认值，不进入交互')
    .action(async (options: InitOptions) => {
      intro(pc.bgBlue(pc.white(' ⚡ Licell Project Init ')));

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
          if (isCancel(selected)) process.exit(0);
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

        const s = spinner();
        s.start(shouldWriteScaffold ? '正在生成项目脚手架...' : '正在写入 licell 项目配置...');
        const { written, skipped } = shouldWriteScaffold
          ? writeScaffoldFiles(process.cwd(), getScaffoldFiles(template), Boolean(options.force))
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

        outro('Done.');
      } catch (err: unknown) {
        console.error(formatErrorMessage(err));
        process.exitCode = 1;
      }
    });
}
