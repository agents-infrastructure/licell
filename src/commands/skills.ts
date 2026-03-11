import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCliEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { AUTOMATION_SECTION } from './sections';

type AgentType = 'claude' | 'codex';

const SUPPORTED_AGENTS = new Set<AgentType>(['claude', 'codex']);

interface SkillsInitOptions {
  projectRoot?: string;
  force?: boolean;
}

const skillsInitCommand = defineCliCommand({
  rawName: 'skills init [agent]',
  description: '为 AI Agent 生成 licell skills（claude / codex）',
  options: [
    { rawName: '--project-root <path>', description: '目标项目目录（默认当前目录）' },
    { rawName: '--force', description: '覆盖已有文件' }
  ],
  descriptor: {
    notes: ['未传 `[agent]` 且处于交互终端时，会提示选择 `claude` 或 `codex`。'],
    examples: ['licell skills init codex', 'licell skills init claude', 'licell skills init codex --project-root .'],
    argumentHints: {
      agent: '支持 `claude` | `codex`。'
    },
    interaction: {
      ttyOnly: true,
      prompts: ['未传 `[agent]` 时会提示选择 `claude` 或 `codex`。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['[agent]'],
      notes: ['自动化执行时建议显式传入 `[agent]`，避免命令等待交互选择。']
    },
    optionInsights: {
      '--project-root': {
        whenToUse: '需要把 skills 写入其它项目目录时使用。',
        cautions: ['会写入目标项目的技能文件与 AGENTS 入口。']
      },
      '--force': {
        whenToUse: '已有目标文件且你明确希望覆盖时使用。',
        cautions: ['可能覆盖已有定制内容。']
      }
    },
    recommendedFlow: [
      { title: '选择目标 Agent', command: 'licell skills init codex', reason: '根据实际使用的 Agent 生成对应技能表面。' },
      { title: '检查写入结果', reason: '确认 skills 文件与 AGENTS 入口写入到了预期目录。' },
      { title: '必要时接入 MCP', command: 'licell mcp init', reason: '让 Agent 不仅知道命令，还能调用 licell。' }
    ],
    result: {
      summary: '返回 skills 脚手架写入结果。',
      outcomeKey: 'writtenFiles',
      fields: [
        { name: 'stage', description: '固定为 `skills`。', required: true },
        { name: 'agent', description: '目标 Agent 类型。', required: true },
        { name: 'projectRoot', description: '目标项目目录。', required: true },
        { name: 'writtenFiles', description: '实际写入的文件列表。', required: true },
        { name: 'skippedFiles', description: '内容相同而跳过的文件列表。', required: true },
        { name: 'agentsMdUpdated', description: '是否更新了 `AGENTS.md`。', required: true }
      ]
    }
  }
});

export function registerSkillsCommands(cli: CAC) {
  registerCliCommand(cli, skillsInitCommand)
    .action(async (agentInput: string | undefined, options: SkillsInitOptions) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Skills Init ')));
      } else {
        emitCliEvent({ stage: 'skills', action: 'skills init', status: 'start' });
      }

      const interactiveTTY = isInteractiveTTY();
      const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
        ? options.projectRoot.trim()
        : process.cwd();
      const { getSkillFiles, writeSkillFiles, ensureAgentsMdEntry } = await import('../utils/skills-scaffold');

      try {
        let agent: AgentType;

        if (agentInput && SUPPORTED_AGENTS.has(agentInput as AgentType)) {
          agent = agentInput as AgentType;
        } else if (agentInput) {
          throw new Error(`不支持的 agent: ${agentInput}（支持: claude / codex）`);
        } else if (interactiveTTY) {
          const selected = await select({
            message: '选择目标 Agent:',
            options: [
              { value: 'claude', label: 'Claude Code (.claude/skills/ + AGENTS.md)' },
              { value: 'codex', label: 'OpenAI Codex (codex.md + AGENTS.md)' }
            ]
          });
          if (isCancel(selected)) {
            if (isJsonOutput()) throw new Error('操作已取消');
            process.exit(0);
          }
          agent = selected as AgentType;
        } else {
          throw new Error('非交互模式下必须指定 agent 参数（claude / codex）');
        }

        const s = createSpinner();
        s.start(`正在生成 ${agent} skills...`);

        const files = getSkillFiles(agent);
        const { written, skipped } = writeSkillFiles(projectRoot, files, Boolean(options.force));
        const agentsMd = ensureAgentsMdEntry(projectRoot);

        s.stop(pc.green('✅ Skills 生成完成'));

        console.log(`agent:    ${pc.cyan(agent)}`);
        if (written.length > 0) {
          console.log(`\n已写入文件:`);
          for (const f of written) console.log(`  ${pc.green('+')} ${f}`);
        }
        if (skipped.length > 0) {
          console.log(`\n已跳过（内容相同）:`);
          for (const f of skipped) console.log(`  ${pc.gray('=')} ${f}`);
        }
        if (agentsMd.updated) {
          console.log(`  ${pc.green('+')} AGENTS.md`);
        } else {
          console.log(`  ${pc.gray('=')} AGENTS.md（已包含 licell 条目）`);
        }

        if (isJsonOutput()) {
          emitCommandResult({
            agent,
            projectRoot,
            writtenFiles: written,
            skippedFiles: skipped,
            agentsMdUpdated: agentsMd.updated
          }, { stage: 'skills' });
        } else {
          showOutro('Done.');
        }
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'skills' });
        } else {
          console.error(formatErrorMessage(err));
        }
        process.exitCode = 1;
      }
    });
}

export const skillsCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerSkillsCommands,
  namespaces: {
    skills: {
      summary: '为 Claude / Codex 生成 licell skills 与 AGENTS 接入文件。',
      examples: ['licell skills init codex', 'licell skills init claude']
    }
  },
  commands: [skillsInitCommand]
});
