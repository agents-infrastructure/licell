import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { AUTOMATION_SECTION } from './sections';

type AgentType = 'claude' | 'codex';
export type SkillsScope = 'global' | 'project';

const SUPPORTED_AGENTS = new Set<AgentType>(['claude', 'codex']);

interface SkillsInitOptions {
  projectRoot?: string;
  global?: boolean;
  force?: boolean;
}

export interface SkillsInitExecutionOptions {
  agent: AgentType;
  scope: SkillsScope;
  projectRoot: string;
  force?: boolean;
}

export interface SkillsInitExecutionResult {
  agent: AgentType;
  scope: SkillsScope;
  projectRoot: string;
  writtenFiles: string[];
  skippedFiles: string[];
  agentsMdUpdated: boolean;
}

const skillsInitCommand = defineCliCommand({
  rawName: 'skills init [agent]',
  regionExclusion: 'local',
  description: '为 AI Agent 写入 licell skill contract（claude / codex）',
  options: [
    { rawName: '--global', description: '全局配置（所有项目生效）' },
    { rawName: '--project-root <path>', description: '目标项目目录（默认当前目录）' },
    { rawName: '--force', description: '覆盖已有文件' }
  ],
  descriptor: {
    summary: '直接写入 licell 的 agent-facing skill contract 文件；默认写入当前项目，传 `--global` 时写入用户级全局技能目录。',
    notes: [
      '未传 `[agent]` 且处于交互终端时，会提示选择 `claude` 或 `codex`。',
      '`licell setup` 是它的交互式包装；真正的 skill contract 写入逻辑与结果字段保持一致。',
      '这些文件指导 Agent 从自然语言意图出发，先走 catalog/help 的领域命令，再用 capability products/search/describe 与 API invoke 兜底。'
    ],
    examples: [
      'licell skills init codex',
      'licell skills init claude',
      'licell skills init codex --project-root .',
      'licell skills init codex --global --output json'
    ],
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
      '--global': {
        whenToUse: '希望 licell skill contract 对所有项目生效时使用。',
        cautions: ['会写入用户级全局技能目录，不会更新当前项目 `AGENTS.md`。']
      },
      '--project-root': {
        whenToUse: '需要把 agent-facing skill contract 写入其它项目目录时使用。',
        cautions: ['仅 project 模式生效；会写入目标项目的技能文件与 AGENTS 入口。']
      },
      '--force': {
        whenToUse: '已有目标文件且你明确希望覆盖时使用。',
        cautions: ['可能覆盖已有定制内容。']
      }
    },
    recommendedFlow: [
      { title: '项目内写入 skill contract', command: 'licell skills init codex', reason: '默认把 agent-facing skill 文件与 AGENTS 入口写入当前项目。' },
      { title: '需要全局生效时显式指定', command: 'licell skills init codex --global', reason: '避免 project/global scope 被误判。' },
      { title: '检查写入结果', reason: '确认 skill contract 文件与 AGENTS 入口写入到了预期目录。' },
      { title: '读取共享命令目录', command: 'licell catalog --output json', reason: '让 Agent 统一通过 catalog / help / JSON output 理解 licell。' }
    ],
    result: {
      summary: '返回 agent-facing skill contract 的写入结果。',
      outcomeKey: 'writtenFiles',
      fields: [
        { name: 'stage', description: '固定为 `skills`。', required: true },
        { name: 'agent', description: '目标 Agent 类型。', required: true },
        { name: 'scope', description: '`global` 或 `project`。', required: true },
        { name: 'projectRoot', description: '目标项目目录；global 模式下用于指示当前调用上下文。', required: true },
        { name: 'writtenFiles', description: '实际写入的文件列表。', required: true },
        { name: 'skippedFiles', description: '内容相同而跳过的文件列表。', required: true },
        { name: 'agentsMdUpdated', description: '是否更新了 `AGENTS.md`；global 模式下固定为 `false`。', required: true }
      ]
    },
    agentTips: [
      'skill contract 负责注入 curated-first 路由契约；领域命令未覆盖时继续走 capability products/search/describe，并严格遵循 execution.preferred。',
      '自动化调用时，project/global scope 最好显式传清楚，不要依赖外部包装命令的默认行为。'
    ]
  }
});

export async function executeSkillsInit(options: SkillsInitExecutionOptions): Promise<SkillsInitExecutionResult> {
  const {
    getSkillFiles,
    getGlobalSkillFiles,
    writeSkillFiles,
    ensureAgentsMdEntry
  } = await import('../utils/skills-scaffold');

  const files = options.scope === 'global' ? getGlobalSkillFiles(options.agent) : getSkillFiles(options.agent);
  const root = options.scope === 'global' ? '' : options.projectRoot;
  const { written, skipped } = writeSkillFiles(root, files, Boolean(options.force));

  let agentsMdUpdated = false;
  if (options.scope === 'project') {
    agentsMdUpdated = ensureAgentsMdEntry(options.projectRoot).updated;
  }

  return {
    agent: options.agent,
    scope: options.scope,
    projectRoot: options.projectRoot,
    writtenFiles: written,
    skippedFiles: skipped,
    agentsMdUpdated
  };
}

export function registerSkillsCommands(cli: CAC) {
  registerCliCommand(cli, skillsInitCommand)
    .action(async (agentInput: string | undefined, options: SkillsInitOptions) => {
      if (!isJsonOutput()) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Skills Init ')));
      } else {
        emitCommandEvent({ command: 'skills init', stage: 'skills', status: 'start' });
      }

      const interactiveTTY = isInteractiveTTY();
      const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
        ? options.projectRoot.trim()
        : process.cwd();

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
              { value: 'claude', label: 'Claude Code (.claude/skills/licell/SKILL.md + AGENTS.md)' },
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

        const scope: SkillsScope = options.global ? 'global' : 'project';

        const s = createSpinner();
        s.start(`正在写入 ${scope === 'global' ? '全局' : '项目'} ${agent} skill contract...`);

        const result = await executeSkillsInit({
          agent,
          scope,
          projectRoot,
          force: options.force
        });

        s.stop(pc.green('✅ Skill contract 写入完成'));

        console.log(`agent:    ${pc.cyan(agent)}`);
        console.log(`scope:    ${pc.cyan(scope)}`);
        if (result.writtenFiles.length > 0) {
          console.log(`\n已写入文件:`);
          for (const f of result.writtenFiles) console.log(`  ${pc.green('+')} ${f}`);
        }
        if (result.skippedFiles.length > 0) {
          console.log(`\n已跳过（内容相同）:`);
          for (const f of result.skippedFiles) console.log(`  ${pc.gray('=')} ${f}`);
        }
        if (result.scope === 'project' && result.agentsMdUpdated) {
          console.log(`  ${pc.green('+')} AGENTS.md`);
        } else if (result.scope === 'project') {
          console.log(`  ${pc.gray('=')} AGENTS.md（已包含 licell 条目）`);
        }

        if (isJsonOutput()) {
          emitCommandResult({
            agent: result.agent,
            scope: result.scope,
            projectRoot: result.projectRoot,
            writtenFiles: result.writtenFiles,
            skippedFiles: result.skippedFiles,
            agentsMdUpdated: result.agentsMdUpdated
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
      summary: '为 Claude / Codex 写入 licell 的 agent-facing skill contract 与项目 AGENTS 入口。',
      examples: ['licell skills init codex', 'licell skills init codex --global', 'licell skills init claude']
    }
  },
  commands: [skillsInitCommand]
});
