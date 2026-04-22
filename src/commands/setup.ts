import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { executeSkillsInit, type SkillsScope } from './skills';

type AgentType = 'claude' | 'codex';

import { type SetupOptions } from './setup.options';
import { AUTOMATION_SECTION } from './sections';

const SUPPORTED_AGENTS = new Set<AgentType>(['claude', 'codex']);

const setupCommand = defineCliCommand({
  rawName: 'setup',
  description: '安装后引导：交互式配置 AI Agent 的 licell skill contract',
  options: [
    { rawName: '--agent <agent>', description: '目标 Agent（claude / codex）' },
    { rawName: '--global', description: '全局配置（所有项目生效）' },
    { rawName: '--project-root <path>', description: '项目目录（默认当前目录）' },
    { rawName: '--force', description: '覆盖已有文件' }
  ],
  descriptor: {
    summary: '安装后的交互式包装命令；底层仍调用 `skills init`，只是补充 agent / scope 选择流程。',
    notes: [
      '交互模式下会引导选择目标 Agent 与配置范围。',
      '非交互模式下如果未传 `--global`，默认按当前项目初始化，而不是隐式写到全局。'
    ],
    examples: [
      'licell setup',
      'licell setup --agent codex',
      'licell setup --agent codex --global',
      'licell setup --agent codex --output json'
    ],
    interaction: {
      ttyOnly: true,
      prompts: ['未传 `--agent` 时会提示选择目标 Agent。', '交互模式下会继续询问配置范围。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--agent'],
      notes: ['自动化执行时建议显式传入 `--agent`，并搭配 `--output json` 跟踪写入结果。']
    },
    optionInsights: {
      '--agent': { whenToUse: '非交互模式下必须显式指定目标 Agent。', cautions: ['当前仅支持 `claude` / `codex`。'] },
      '--global': { whenToUse: '希望 licell skill contract 对所有项目生效时使用。', cautions: ['会写入用户级全局技能目录。', '未传时默认是 project scope。'] },
      '--project-root': { whenToUse: '要为指定项目而不是当前目录生成配置时使用。', cautions: ['仅 project scope 生效。'] },
      '--force': { whenToUse: '目标文件已存在但需要覆盖时使用。', cautions: ['可能覆盖已有定制内容。'] }
    },
    recommendedFlow: [
      { title: '运行引导', command: 'licell setup', reason: '以交互方式完成 licell skill contract 初始化。' },
      { title: '非交互初始化当前项目', command: 'licell setup --agent codex --output json', reason: '默认 project scope，避免误写全局目录。' },
      { title: '需要全局时显式指定', command: 'licell setup --agent codex --global --output json', reason: '只在确定要对所有项目生效时再写全局。' },
      { title: '让 Agent 发现命令目录', command: 'licell catalog --output json', reason: '后续统一走 catalog / help / JSON output。' }
    ],
    taskHints: [
      {
        phase: 'mutate',
        title: '给当前环境快速接入 Agent',
        description: '一条 setup 引导完成 licell skill contract 的主流程配置。',
        commands: ['licell setup']
      },
      {
        phase: 'mutate',
        title: '在自动化里做非交互初始化',
        description: '显式指定 agent，并在需要全局生效时加上 `--global`。',
        commands: ['licell setup --agent codex --output json', 'licell setup --agent codex --global --output json']
      }
    ],
    result: {
      summary: '返回 setup 引导的写入结果。',
      fields: [
        { name: 'stage', description: '固定为 `setup`。', required: true },
        { name: 'agent', description: '目标 Agent。', required: true },
        { name: 'scope', description: '`global` 或 `project`。', required: true },
        { name: 'projectRoot', description: '项目根目录。', required: true },
        { name: 'writtenFiles', description: '实际写入的文件列表。', required: true },
        { name: 'skippedFiles', description: '跳过写入的文件列表。', required: true },
        { name: 'agentsMdUpdated', description: '项目模式下，是否更新了 `AGENTS.md`。', required: true }
      ]
    },
    agentTips: [
      '自动化场景优先传 `--agent`，并搭配 `--output json` 获取可追踪的写入结果。',
      'setup 完成后，Agent 继续通过 `licell catalog --output json` 和 `licell <command> --help --output json` 理解命令面。',
      '`setup` 只是包装层；如果需要稳定脚本化调用，优先直接使用 `licell skills init ...`。'
    ]
  }
});

export async function runInteractiveSetup(options: SetupOptions = {}) {
  const interactiveTTY = isInteractiveTTY();
  const jsonMode = isJsonOutput();

  const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
    ? options.projectRoot.trim()
    : process.cwd();

  try {
    const cancelFlow = () => {
      if (jsonMode) {
        emitCommandResult({ cancelled: true });
      } else {
        showOutro('已取消');
      }
    };

    let agent: AgentType;
    if (options.agent && SUPPORTED_AGENTS.has(options.agent as AgentType)) {
      agent = options.agent as AgentType;
    } else if (options.agent) {
      throw new Error(`不支持的 agent: ${options.agent}（支持: claude / codex）`);
    } else if (interactiveTTY) {
      const selected = await select({
        message: '选择目标 Agent:',
        options: [
          { value: 'claude', label: 'Claude Code' },
          { value: 'codex', label: 'OpenAI Codex' }
        ]
      });
      if (isCancel(selected)) {
        cancelFlow();
        return;
      }
      agent = selected as AgentType;
    } else {
      throw new Error('非交互模式下必须指定 --agent 参数（claude / codex）');
    }

    let scope: SkillsScope;
    if (options.global) {
      scope = 'global';
    } else if (interactiveTTY) {
      const selected = await select({
        message: '配置范围:',
        options: [
          { value: 'global', label: '全局（所有项目生效）' },
          { value: 'project', label: '当前项目' }
        ]
      });
      if (isCancel(selected)) {
        cancelFlow();
        return;
      }
      scope = selected as SkillsScope;
    } else {
      scope = 'project';
    }

    const s = createSpinner();
    if (!jsonMode) {
      s.start(`正在写入${scope === 'global' ? '全局' : '项目'} skill contract...`);
    }

    const result = await executeSkillsInit({
      agent,
      scope,
      projectRoot,
      force: options.force
    });

    if (!jsonMode) {
      s.stop(pc.green('✅ Skill contract 写入完成'));
    }

    if (!jsonMode) {
      console.log(`scope:    ${pc.cyan(result.scope)}`);
    }
    if (!jsonMode && result.writtenFiles.length > 0) {
      for (const f of result.writtenFiles) console.log(`  ${pc.green('+')} ${f}`);
    }
    if (!jsonMode && result.skippedFiles.length > 0) {
      for (const f of result.skippedFiles) console.log(`  ${pc.gray('=')} ${f}（已存在）`);
    }

    if (jsonMode) {
      emitCommandResult({
        agent: result.agent,
        scope: result.scope,
        projectRoot: result.projectRoot,
        writtenFiles: result.writtenFiles,
        skippedFiles: result.skippedFiles,
        agentsMdUpdated: result.agentsMdUpdated
      });
    } else {
      showOutro('Done.');
    }
  } catch (err: unknown) {
    if (jsonMode) {
      emitCliError(err, { stage: 'setup' });
    } else {
      console.error(formatErrorMessage(err));
    }
    process.exitCode = 1;
  }
}

export function registerSetupCommand(cli: CAC) {
  registerCliCommand(cli, setupCommand)
    .action(async (options: SetupOptions) => {
      const jsonMode = isJsonOutput();
      if (!jsonMode) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Setup ')));
      } else {
        emitCommandEvent({ command: 'setup', status: 'start' });
      }

      await runInteractiveSetup(options);
    });
}

export const setupCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerSetupCommand,
  commands: [setupCommand]
});
