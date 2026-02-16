import type { CAC } from 'cac';
import { intro, outro, select, text, spinner, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { formatErrorMessage } from '../utils/errors';
import { isInteractiveTTY, toPromptValue } from '../utils/cli-shared';
import {
  deriveDefaultAppName,
  getScaffoldFiles,
  resolveInitTemplateAndRuntime,
  validateAppName,
  writeScaffoldFiles
} from '../utils/init-scaffold';

interface InitOptions {
  template?: string;
  runtime?: string;
  app?: string;
  force?: boolean;
  yes?: boolean;
}

export function registerInitCommand(cli: CAC) {
  cli.command('init', '初始化 FC 项目脚手架（Node 或 Python）')
    .option('--template <template>', '脚手架类型：node 或 python')
    .option('--runtime <runtime>', '默认 runtime：nodejs20/nodejs22/python3.12/python3.13')
    .option('--app <name>', '应用名（用于 FC functionName）')
    .option('--force', '覆盖已存在且内容不同的脚手架文件')
    .option('--yes', '使用默认值，不进入交互')
    .action(async (options: InitOptions) => {
      intro(pc.bgBlue(pc.white(' ⚡ Licell Project Init ')));

      const interactiveTTY = isInteractiveTTY();
      const nonInteractive = options.yes || !interactiveTTY;

      try {
        let templateInput = options.template;
        if (!templateInput && !nonInteractive) {
          const selected = await select({
            message: '选择项目模板:',
            options: [
              { value: 'node', label: 'Node (TypeScript) FC API' },
              { value: 'python', label: 'Python FC API' }
            ]
          });
          if (isCancel(selected)) process.exit(0);
          templateInput = String(selected);
        }

        const { template, runtime } = resolveInitTemplateAndRuntime(templateInput, options.runtime);
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
        s.start('正在生成项目脚手架...');
        const files = getScaffoldFiles(template);
        const { written, skipped } = writeScaffoldFiles(process.cwd(), files, Boolean(options.force));
        Config.setProject({ appName, runtime });
        s.stop(pc.green('✅ 脚手架创建完成'));

        console.log(`template: ${pc.cyan(template)}`);
        console.log(`runtime:  ${pc.cyan(runtime)}`);
        console.log(`appName:  ${pc.cyan(appName)}`);
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
