import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { createSpinner, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { LICELL_GLAB_SUBAGENT_NAME } from '../utils/onboard-scaffold';

interface OnboardOptions {
  force?: boolean;
}

export interface OnboardExecutionOptions {
  force?: boolean;
  projectRoot: string;
}

export interface OnboardExecutionResult {
  agent: 'codex';
  subagentName: typeof LICELL_GLAB_SUBAGENT_NAME;
  projectRoot: string;
  writtenFiles: string[];
  skippedFiles: string[];
}

const onboardCommand = defineCliCommand({
  rawName: 'onboard',
  description: '全局安装 Codex 用的 licell skills 与 licell-glab subagent',
  options: [
    { rawName: '--force', description: '覆盖已有文件' }
  ],
  descriptor: {
    summary: '为 Codex 一次性安装 licell 的全局 skills 与 `licell-glab` subagent，便于直接通过自然语言生成 GitLab CI/CD 与 licell 部署配置。',
    notes: [
      '该命令会写入用户级目录，而不是当前项目目录。',
      '`licell-glab` 安装完成后，可在 Codex 中直接使用 `$licell-glab ...` 驱动当前 repo 的 GitLab CI/CD 生成。'
    ],
    examples: [
      'licell onboard',
      'licell onboard --force',
      'licell onboard --output json'
    ],
    automation: {
      preferredOutput: 'json',
      notes: ['自动化执行时建议搭配 `--output json`，读取写入结果与跳过列表。']
    },
    optionInsights: {
      '--force': {
        whenToUse: '已存在旧版 skills 或 subagent，需要显式覆盖时使用。',
        cautions: ['可能覆盖你在全局目录里的手工定制内容。']
      }
    },
    recommendedFlow: [
      { title: '安装全局 Codex 接入', command: 'licell onboard', reason: '一次安装 licell skills 与 `licell-glab` subagent。' },
      { title: '让 Agent 理解 licell 命令面', command: 'licell catalog --output json', reason: '后续执行依然统一通过 catalog / help / JSON output。' },
      { title: '直接调用 subagent', reason: '在 Codex 中使用 `$licell-glab 帮我给当前 repo 构建 GitLab CI/CD 流水线`。' }
    ],
    taskHints: [
      {
        phase: 'mutate',
        title: '给 Codex 安装 licell GitLab CI 子助手',
        description: '把全局 skills 和 `licell-glab` 一起装好，后续可直接从自然语言生成 pipeline。',
        commands: ['licell onboard']
      }
    ],
    result: {
      summary: '返回全局 skills 与 subagent 的安装结果。',
      outcomeKey: 'writtenFiles',
      fields: [
        { name: 'stage', description: '固定为 `onboard`。', required: true },
        { name: 'agent', description: '固定为 `codex`。', required: true },
        { name: 'subagentName', description: '已安装的 subagent 名称；当前为 `licell-glab`。', required: true },
        { name: 'projectRoot', description: '调用命令时所在的项目目录。', required: true },
        { name: 'writtenFiles', description: '实际写入的全局文件列表。', required: true },
        { name: 'skippedFiles', description: '内容相同而跳过的文件列表。', required: true }
      ]
    },
    agentTips: [
      '`licell-glab` 负责把自然语言需求桥接成 `.gitlab-ci.yml` / `.gitlab-ci.licell.yml` / `.licell/*` 的落地修改。',
      '安装完成后，命令发现与实际执行仍优先使用 `licell catalog --output json`、`licell <command> --help --output json` 与 `licell ... --output json`。'
    ]
  }
});

export async function executeOnboard(options: OnboardExecutionOptions): Promise<OnboardExecutionResult> {
  const {
    getGlobalSkillFiles,
    writeSkillFiles
  } = await import('../utils/skills-scaffold');
  const { getGlobalCodexSubagentFiles } = await import('../utils/onboard-scaffold');

  const files = [
    ...getGlobalSkillFiles('codex'),
    ...getGlobalCodexSubagentFiles()
  ];
  const { written, skipped } = writeSkillFiles('', files, Boolean(options.force));

  return {
    agent: 'codex',
    subagentName: LICELL_GLAB_SUBAGENT_NAME,
    projectRoot: options.projectRoot,
    writtenFiles: written,
    skippedFiles: skipped
  };
}

export function registerOnboardCommand(cli: CAC) {
  registerCliCommand(cli, onboardCommand)
    .action(async (options: OnboardOptions) => {
      const jsonMode = isJsonOutput();
      if (!jsonMode) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Onboard ')));
      } else {
        emitCommandEvent({ command: 'onboard', stage: 'onboard', status: 'start' });
      }

      try {
        const s = createSpinner();
        if (!jsonMode) {
          s.start('正在安装全局 Codex skills 和 licell-glab subagent...');
        }

        const result = await executeOnboard({
          force: options.force,
          projectRoot: process.cwd()
        });

        if (!jsonMode) {
          s.stop(pc.green('✅ Onboard 完成'));
          console.log(`agent:    ${pc.cyan(result.agent)}`);
          console.log(`subagent: ${pc.cyan(result.subagentName)}`);

          if (result.writtenFiles.length > 0) {
            console.log('\n已写入文件:');
            for (const file of result.writtenFiles) console.log(`  ${pc.green('+')} ${file}`);
          }
          if (result.skippedFiles.length > 0) {
            console.log('\n已跳过（内容相同）:');
            for (const file of result.skippedFiles) console.log(`  ${pc.gray('=')} ${file}`);
          }

          console.log(`\n下一步:`);
          console.log(`  1. 在 Codex 中执行：$${result.subagentName} 帮我给当前 repo 构建 GitLab CI/CD 流水线`);
          console.log(`  2. 需要命令发现时执行：licell catalog --output json`);
          showOutro('Done.');
          return;
        }

        emitCommandResult({
          agent: result.agent,
          subagentName: result.subagentName,
          projectRoot: result.projectRoot,
          writtenFiles: result.writtenFiles,
          skippedFiles: result.skippedFiles
        }, { stage: 'onboard' });
      } catch (err: unknown) {
        if (jsonMode) {
          emitCliError(err, { stage: 'onboard' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });
}

export const onboardCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerOnboardCommand,
  commands: [onboardCommand]
});
