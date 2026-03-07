import type { CAC } from 'cac';
import { select, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCliEvent, emitCliResult, isJsonOutput } from '../utils/output';

type AgentType = 'claude' | 'codex';

const SUPPORTED_AGENTS = new Set<AgentType>(['claude', 'codex']);

interface SkillsInitOptions {
  projectRoot?: string;
  force?: boolean;
}

export function registerSkillsCommands(cli: CAC) {
  cli.command('skills init [agent]', '为 AI Agent 生成 licell skills（claude / codex）')
    .option('--project-root <path>', '目标项目目录（默认当前目录）')
    .option('--force', '覆盖已有文件')
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
          emitCliResult({
            stage: 'skills',
            agent,
            projectRoot,
            writtenFiles: written,
            skippedFiles: skipped,
            agentsMdUpdated: agentsMd.updated
          });
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
