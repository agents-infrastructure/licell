import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { createSpinner, showIntro, showOutro } from '../utils/cli-shared';
import { formatErrorMessage } from '../utils/errors';
import { emitCliError, emitCommandEvent, emitCommandResult, isJsonOutput } from '../utils/output';
import { LICELL_GLAB_SUBAGENT_NAME } from '../utils/onboard-scaffold';

type OnboardAgent = 'claude' | 'codex' | 'all';
type InstalledAgent = 'claude' | 'codex';

interface OnboardOptions {
  agent?: string;
  force?: boolean;
}

export interface OnboardExecutionOptions {
  agent: OnboardAgent;
  force?: boolean;
  projectRoot: string;
}

export interface OnboardExecutionResult {
  agents: InstalledAgent[];
  requestedAgent: OnboardAgent;
  subagentNames: typeof LICELL_GLAB_SUBAGENT_NAME[];
  projectRoot: string;
  writtenFiles: string[];
  skippedFiles: string[];
}

const SUPPORTED_ONBOARD_AGENTS = new Set<OnboardAgent>(['claude', 'codex', 'all']);

function resolveInstalledAgents(agent: OnboardAgent): InstalledAgent[] {
  if (agent === 'all') return ['codex', 'claude'];
  return [agent];
}

const onboardCommand = defineCliCommand({
  rawName: 'onboard',
  description: '全局安装 licell 的 Agent 接入；默认同时安装 Codex 与 Claude',
  options: [
    { rawName: '--agent <agent>', description: '安装目标：codex / claude / all（默认 all）' },
    { rawName: '--force', description: '覆盖已有文件' }
  ],
  descriptor: {
    summary: '一次性安装 licell 的全局 Agent 接入：默认同时安装 Codex 与 Claude skills；若包含 Codex，还会额外安装 `licell-glab` subagent。',
    notes: [
      '该命令会写入用户级目录，而不是当前项目目录。',
      '默认行为是 `--agent all`。',
      '`licell-glab` 仅在安装目标包含 Codex 时写入；安装完成后，可在 Codex 中直接使用 `$licell-glab ...` 驱动当前 repo 的 GitLab CI/CD 生成。'
    ],
    examples: [
      'licell onboard',
      'licell onboard --agent codex',
      'licell onboard --agent claude',
      'licell onboard --force',
      'licell onboard --output json'
    ],
    automation: {
      preferredOutput: 'json',
      notes: ['自动化执行时建议搭配 `--output json`，读取写入结果与跳过列表。']
    },
    optionInsights: {
      '--agent': {
        whenToUse: '需要只安装 Codex、只安装 Claude，或显式声明安装两者时使用。',
        cautions: ['默认值是 `all`。', '`licell-glab` 仅会随 `codex` 一起安装。']
      },
      '--force': {
        whenToUse: '已存在旧版 skills 或 subagent，需要显式覆盖时使用。',
        cautions: ['可能覆盖你在全局目录里的手工定制内容。']
      }
    },
    recommendedFlow: [
      { title: '安装默认全局 Agent 接入', command: 'licell onboard', reason: '默认一次安装 Codex + Claude skills，并给 Codex 补上 `licell-glab`。' },
      { title: '只装某一个 Agent', command: 'licell onboard --agent codex', reason: '当你只想维护单一宿主的全局接入时显式指定。' },
      { title: '让 Agent 理解 licell 命令面', command: 'licell catalog --output json', reason: '后续执行依然统一通过 catalog / help / JSON output。' },
      { title: '直接调用 subagent', reason: '在 Codex 中使用 `$licell-glab 帮我给当前 repo 构建 GitLab CI/CD 流水线`。' }
    ],
    taskHints: [
      {
        phase: 'mutate',
        title: '给当前机器安装 licell 的全局 Agent 接入',
        description: '默认把 Codex + Claude skills 都装好，并给 Codex 额外补上 `licell-glab` 子助手。',
        commands: ['licell onboard']
      }
    ],
    result: {
      summary: '返回全局 skills 与 subagent 的安装结果。',
      outcomeKey: 'writtenFiles',
      fields: [
        { name: 'stage', description: '固定为 `onboard`。', required: true },
        { name: 'requestedAgent', description: '本次请求安装的目标：`codex` / `claude` / `all`。', required: true },
        { name: 'agents[]', description: '本次实际安装的 Agent 列表。', required: true },
        { name: 'subagentNames[]', description: '本次实际安装的 subagent 列表；当前仅可能包含 `licell-glab`。', required: true },
        { name: 'projectRoot', description: '调用命令时所在的项目目录。', required: true },
        { name: 'writtenFiles', description: '实际写入的全局文件列表。', required: true },
        { name: 'skippedFiles', description: '内容相同而跳过的文件列表。', required: true }
      ]
    },
    agentTips: [
      '当安装目标包含 Codex 时，`licell-glab` 负责把自然语言需求桥接成 `.gitlab-ci.yml` / `.gitlab-ci.licell.yml` / `.licell/*` 的落地修改。',
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

  const installedAgents = resolveInstalledAgents(options.agent);
  const files = installedAgents.flatMap((agent) => getGlobalSkillFiles(agent));
  if (installedAgents.includes('codex')) {
    files.push(...getGlobalCodexSubagentFiles());
  }
  const { written, skipped } = writeSkillFiles('', files, Boolean(options.force));

  return {
    agents: installedAgents,
    requestedAgent: options.agent,
    subagentNames: installedAgents.includes('codex') ? [LICELL_GLAB_SUBAGENT_NAME] : [],
    projectRoot: options.projectRoot,
    writtenFiles: written,
    skippedFiles: skipped
  };
}

export function registerOnboardCommand(cli: CAC) {
  registerCliCommand(cli, onboardCommand)
    .action(async (options: OnboardOptions) => {
      const jsonMode = isJsonOutput();
      const requestedAgent = typeof options.agent === 'string' && options.agent.trim()
        ? options.agent.trim() as OnboardAgent
        : 'all';
      if (!jsonMode) {
        showIntro(pc.bgBlue(pc.white(' 🛠 Licell Onboard ')));
      } else {
        emitCommandEvent({ command: 'onboard', stage: 'onboard', status: 'start' });
      }

      try {
        if (!SUPPORTED_ONBOARD_AGENTS.has(requestedAgent)) {
          throw new Error(`不支持的 agent: ${requestedAgent}（支持: codex / claude / all）`);
        }

        const s = createSpinner();
        const spinnerTarget = requestedAgent === 'all' ? 'Codex + Claude' : requestedAgent;
        if (!jsonMode) {
          s.start(`正在安装全局 ${spinnerTarget} Agent 接入...`);
        }

        const result = await executeOnboard({
          agent: requestedAgent,
          force: options.force,
          projectRoot: process.cwd()
        });

        if (!jsonMode) {
          s.stop(pc.green('✅ Onboard 完成'));
          console.log(`requested: ${pc.cyan(result.requestedAgent)}`);
          console.log(`agents:    ${pc.cyan(result.agents.join(', '))}`);
          console.log(`subagent:  ${pc.cyan(result.subagentNames.join(', ') || 'none')}`);

          if (result.writtenFiles.length > 0) {
            console.log('\n已写入文件:');
            for (const file of result.writtenFiles) console.log(`  ${pc.green('+')} ${file}`);
          }
          if (result.skippedFiles.length > 0) {
            console.log('\n已跳过（内容相同）:');
            for (const file of result.skippedFiles) console.log(`  ${pc.gray('=')} ${file}`);
          }

          console.log(`\n下一步:`);
          if (result.subagentNames.length > 0) {
            console.log(`  1. 在 Codex 中执行：$${result.subagentNames[0]} 帮我给当前 repo 构建 GitLab CI/CD 流水线`);
            console.log(`  2. 需要命令发现时执行：licell catalog --output json`);
          } else {
            console.log('  1. Claude 侧已安装全局 licell skill，可直接在对话里调用 licell 能力');
            console.log('  2. 需要命令发现时执行：licell catalog --output json');
          }
          showOutro('Done.');
          return;
        }

        emitCommandResult({
          requestedAgent: result.requestedAgent,
          agents: result.agents,
          subagentNames: result.subagentNames,
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
