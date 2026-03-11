import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { select, confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { createSpinner, isInteractiveTTY, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCliEvent, emitCliResult, isJsonOutput } from '../utils/output';
import { ensureMcpJsonConfig, ensureGlobalClaudeMcpConfig, ensureGlobalCodexMcpConfig } from './mcp';

type Scope = 'global' | 'project';
type AgentType = 'claude' | 'codex';

import { type SetupOptions } from './setup.options';
import { AUTOMATION_SECTION } from './sections';

const SUPPORTED_AGENTS = new Set<AgentType>(['claude', 'codex']);

const setupCommand = defineCliCommand({
  rawName: 'setup',
  description: '安装后引导：配置 AI Agent Skills 和 MCP',
  options: [
    { rawName: '--agent <agent>', description: '目标 Agent（claude / codex）' },
    { rawName: '--global', description: '全局配置（所有项目生效）' },
    { rawName: '--project-root <path>', description: '项目目录（默认当前目录）' },
    { rawName: '--force', description: '覆盖已有文件' }
  ],
  descriptor: {
    summary: '安装后的一站式引导：配置 Skills 与 MCP。',
    notes: ['交互模式下会引导选择 Agent、范围，并可选写入 MCP 配置。'],
    examples: ['licell setup', 'licell setup --agent codex --global', 'licell setup --output json'],
    interaction: {
      ttyOnly: true,
      prompts: ['未传 `--agent` 时会提示选择目标 Agent。', '交互模式下会继续询问配置范围，以及是否一并写入 MCP 配置。']
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--agent'],
      notes: ['自动化执行时建议显式传入 `--agent`，并搭配 `--output json` 跟踪写入结果。']
    },
    optionInsights: {
      '--agent': { whenToUse: '非交互模式下必须显式指定目标 Agent。', cautions: ['当前仅支持 `claude` / `codex`。'] },
      '--global': { whenToUse: '希望技能与 MCP 配置对所有项目生效时使用。', cautions: ['会写入用户级全局配置目录。'] },
      '--project-root': { whenToUse: '要为指定项目而不是当前目录生成配置时使用。' },
      '--force': { whenToUse: '目标文件已存在但需要覆盖时使用。', cautions: ['可能覆盖已有定制内容。'] }
    },
    recommendedFlow: [
      { title: '运行引导', command: 'licell setup', reason: '以交互方式一次性完成 Skills 与 MCP 初始化。' },
      { title: '必要时切到非交互', command: 'licell setup --agent codex --global --output json', reason: '在自动化或 CI 场景中稳定复用。' },
      { title: '验证 MCP', command: 'licell mcp init --output json', reason: '确认 MCP 配置文件已写入预期位置。' }
    ],
    taskHints: [
      {
        phase: 'mutate',
        title: '给当前环境快速接入 Agent',
        description: '一条 setup 引导完成 skills 与 MCP 的主流程配置。',
        commands: ['licell setup']
      },
      {
        phase: 'mutate',
        title: '在自动化里做非交互初始化',
        description: '显式指定 agent / scope，并用 JSON 结果跟踪写入状态。',
        commands: ['licell setup --agent codex --global --output json']
      }
    ],
    result: {
      summary: '返回 setup 引导的写入结果与 MCP 配置状态。',
      fields: [
        { name: 'stage', description: '固定为 `setup`。', required: true },
        { name: 'agent', description: '目标 Agent。', required: true },
        { name: 'scope', description: '`global` 或 `project`。', required: true },
        { name: 'projectRoot', description: '项目根目录。', required: true },
        { name: 'writtenFiles', description: '实际写入的文件列表。', required: true },
        { name: 'skippedFiles', description: '跳过写入的文件列表。', required: true },
        { name: 'mcpConfigured', description: '是否执行了 MCP 配置。', required: true },
        { name: 'mcpConfigPath', description: 'MCP 配置文件路径。' },
        { name: 'mcpConfigUpdated', description: 'MCP 配置文件是否发生更新。' }
      ]
    },
    agentTips: ['自动化场景优先传 `--agent`，并搭配 `--output json` 获取可追踪的写入结果。']
  }
});

export async function runInteractiveSetup(options: SetupOptions = {}) {
  const interactiveTTY = isInteractiveTTY();
  const jsonMode = isJsonOutput();

  const projectRoot = typeof options.projectRoot === 'string' && options.projectRoot.trim()
    ? options.projectRoot.trim()
    : process.cwd();
  const {
    getSkillFiles,
    getGlobalSkillFiles,
    writeSkillFiles,
    ensureAgentsMdEntry
  } = await import('../utils/skills-scaffold');

  try {
    const cancelFlow = () => {
      if (jsonMode) {
        emitCliResult({ stage: 'setup', cancelled: true });
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
}

export function registerSetupCommand(cli: CAC) {
  registerCliCommand(cli, setupCommand)
    .action(async (options: SetupOptions) => {
      const jsonMode = isJsonOutput();
      if (!jsonMode) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Setup ')));
      } else {
        emitCliEvent({ stage: 'setup', action: 'setup', status: 'start' });
      }

      await runInteractiveSetup(options);
    });
}

export const setupCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerSetupCommand,
  commands: [setupCommand]
});
