import type { CAC } from 'cac';
import { select, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCliEvent, emitCliResult, isJsonOutput } from '../utils/output';
import {
  type AgentType,
  getSkillFiles,
  getGlobalSkillFiles,
  writeSkillFiles,
  ensureAgentsMdEntry
} from '../utils/skills-scaffold';
import { ensureMcpJsonConfig, ensureGlobalClaudeMcpConfig, ensureGlobalCodexMcpConfig } from './mcp';

type Scope = 'global' | 'project';

const SUPPORTED_AGENTS = new Set<AgentType>(['claude', 'codex']);

interface SetupOptions {
  agent?: string;
  global?: boolean;
  projectRoot?: string;
  force?: boolean;
}

export function registerSetupCommand(cli: CAC) {
  cli.command('setup', '安装后引导：配置 AI Agent Skills 和 MCP')
    .option('--agent <agent>', '目标 Agent（claude / codex）')
    .option('--global', '全局配置（所有项目生效）')
    .option('--project-root <path>', '项目目录（默认当前目录）')
    .option('--force', '覆盖已有文件')
    .action(async (options: SetupOptions) => {
      const interactiveTTY = isInteractiveTTY();
      const jsonMode = isJsonOutput();
      if (!jsonMode) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Setup ')));
      } else {
        emitCliEvent({ stage: 'setup', action: 'setup', status: 'start' });
      }

      const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
        ? options.projectRoot.trim()
        : process.cwd();

      try {
        const cancelFlow = () => {
          if (jsonMode) {
            emitCliResult({ stage: 'setup', cancelled: true });
          } else {
            showOutro('已取消');
          }
        };

        // ① Agent 选择
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

        // ② Scope 选择
        let scope: Scope;
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
          scope = selected as Scope;
        } else {
          scope = 'global';
        }

        // ③ 生成 Skills
        const s = createSpinner();
        if (!jsonMode) {
          s.start('正在生成 Skills...');
        }

        const files = scope === 'global' ? getGlobalSkillFiles(agent) : getSkillFiles(agent);
        const root = scope === 'global' ? '' : projectRoot;
        const { written, skipped } = writeSkillFiles(root, files, Boolean(options.force));

        if (scope === 'project') {
          ensureAgentsMdEntry(projectRoot);
        }

        if (!jsonMode) {
          s.stop(pc.green('✅ Skills 生成完成'));
        }

        if (!jsonMode && written.length > 0) {
          for (const f of written) console.log(`  ${pc.green('+')} ${f}`);
        }
        if (!jsonMode && skipped.length > 0) {
          for (const f of skipped) console.log(`  ${pc.gray('=')} ${f}（已存在）`);
        }

        // ④ MCP 配置
        let configureMcp = false;
        let mcpConfigPath: string | null = null;
        let mcpConfigUpdated: boolean | null = null;
        if (interactiveTTY) {
          const mcpConfirm = await confirm({ message: '是否配置 MCP（让 Agent 能调用 licell）？' });
          if (isCancel(mcpConfirm)) {
            cancelFlow();
            return;
          }
          configureMcp = mcpConfirm === true;
        }

        if (configureMcp) {
          if (scope === 'global' && agent === 'claude') {
            const { configPath, updated } = ensureGlobalClaudeMcpConfig();
            mcpConfigPath = configPath;
            mcpConfigUpdated = updated;
            if (!jsonMode) {
              console.log(`  ${updated ? pc.green('+') : pc.gray('=')} ${configPath}${updated ? '' : '（已存在）'}`);
            }
          } else if (scope === 'global' && agent === 'codex') {
            const { configPath, updated } = ensureGlobalCodexMcpConfig();
            mcpConfigPath = configPath;
            mcpConfigUpdated = updated;
            if (!jsonMode) {
              console.log(`  ${updated ? pc.green('+') : pc.gray('=')} ${configPath}${updated ? '' : '（已存在）'}`);
            }
          } else {
            const { configPath, updated } = ensureMcpJsonConfig({ projectRoot, serverName: 'licell' });
            mcpConfigPath = configPath;
            mcpConfigUpdated = updated;
            if (!jsonMode) {
              console.log(`  ${updated ? pc.green('+') : pc.gray('=')} ${configPath}${updated ? '' : '（已存在）'}`);
            }
          }
        }

        if (jsonMode) {
          emitCliResult({
            stage: 'setup',
            agent,
            scope,
            projectRoot,
            writtenFiles: written,
            skippedFiles: skipped,
            mcpConfigured: configureMcp,
            mcpConfigPath,
            mcpConfigUpdated
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
    });
}
