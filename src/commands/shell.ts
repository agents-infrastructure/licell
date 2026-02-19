import type { CAC } from 'cac';
import {
  detectShellFromEnv,
  normalizeCompletionShell,
  renderCompletionScript,
  resolveCompletionCandidates
} from '../utils/shell-completion';
import { emitCliResult, isJsonOutput } from '../utils/output';

interface CompletionOptions {
  engine?: boolean;
}

export function registerShellCommands(cli: CAC) {
  cli.command('completion [shell]', '输出 shell 补全脚本（bash/zsh）')
    .option('--engine', '内部补全引擎（供 shell completion 调用）')
    .action((shell: string | undefined, options: CompletionOptions) => {
      if (options.engine) {
        const candidates = resolveCompletionCandidates({
          compWords: process.env.COMP_WORDS,
          compCword: process.env.COMP_CWORD,
          compCur: process.env.COMP_CUR
        });
        if (isJsonOutput()) {
          emitCliResult({
            stage: 'completion.engine',
            count: candidates.length,
            candidates
          });
          return;
        }
        if (candidates.length > 0) {
          process.stdout.write(`${candidates.join('\n')}\n`);
        }
        return;
      }

      const detected = detectShellFromEnv(process.env.SHELL);
      const resolvedShell = normalizeCompletionShell(shell || detected || 'bash');
      const script = renderCompletionScript(resolvedShell);
      if (isJsonOutput()) {
        emitCliResult({
          stage: 'completion.script',
          shell: resolvedShell,
          script
        });
      } else {
        process.stdout.write(script);
      }
    });
}
