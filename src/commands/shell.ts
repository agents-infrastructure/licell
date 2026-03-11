import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { AUTOMATION_SECTION } from './sections';

interface CompletionOptions {
  engine?: boolean;
}

const completionCommand = defineCliCommand({
  rawName: 'completion [shell]',
  description: '输出 shell 补全脚本（bash/zsh）',
  options: [
    { rawName: '--engine', description: '内部补全引擎（供 shell completion 调用）' }
  ],
  descriptor: {
    notes: ['`--engine` 是内部能力，通常由 shell completion 机制调用，普通用户一般只需要生成脚本。'],
    examples: ['licell completion bash', 'licell completion zsh', 'licell completion --engine --output json'],
    argumentHints: {
      shell: '支持 `bash` / `zsh`；未传时会优先从当前环境推断。'
    },
    optionInsights: {
      '--engine': {
        whenToUse: '需要让 shell completion 机制按当前补全上下文返回候选项时使用。',
        cautions: ['通常由补全脚本自动调用，不建议手工频繁使用。']
      }
    },
    result: {
      summary: '返回 shell 补全脚本，或内部候选项列表。',
      fields: [
        { name: 'stage', description: '`completion.script` 或 `completion.engine`。', required: true },
        { name: 'shell', description: '生成脚本时解析出的 shell 类型。' },
        { name: 'script', description: '完整补全脚本。' },
        { name: 'candidates', description: '补全候选项数组。' },
        { name: 'count', description: '候选项数量。' }
      ]
    },
    agentTips: ['Agent 若要理解可用命令集合，优先读取共享命令目录而非直接依赖 completion 输出。']
  }
});

export function registerShellCommands(cli: CAC) {
  registerCliCommand(cli, completionCommand)
    .action(async (shell: string | undefined, options: CompletionOptions) => {
      const completion = await import('../utils/shell-completion');
      if (options.engine) {
        const candidates = completion.resolveCompletionCandidates({
          compWords: process.env.COMP_WORDS,
          compCword: process.env.COMP_CWORD,
          compCur: process.env.COMP_CUR
        });
        if (isJsonOutput()) {
          emitCommandResult({
            count: candidates.length,
            candidates
          }, { stage: 'completion.engine' });
          return;
        }
        if (candidates.length > 0) {
          process.stdout.write(`${candidates.join('\n')}\n`);
        }
        return;
      }

      const detected = completion.detectShellFromEnv(process.env.SHELL);
      const resolvedShell = completion.normalizeCompletionShell(shell || detected || 'bash');
      const script = completion.renderCompletionScript(resolvedShell);
      if (isJsonOutput()) {
        emitCommandResult({
          shell: resolvedShell,
          script
        }, { stage: 'completion.script' });
      } else {
        process.stdout.write(script);
      }
    });
}

export const shellCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerShellCommands,
  commands: [completionCommand]
});
