import type { CAC } from 'cac';
import { emitCliResult, isJsonOutput } from '../utils/output';

interface CompletionOptions {
  engine?: boolean;
}

export function registerShellCommands(cli: CAC) {
  cli.command('completion [shell]', '输出 shell 补全脚本（bash/zsh）')
    .option('--engine', '内部补全引擎（供 shell completion 调用）')
    .action(async (shell: string | undefined, options: CompletionOptions) => {
      const completion = await import('../utils/shell-completion');
      if (options.engine) {
        const candidates = completion.resolveCompletionCandidates({
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

      const detected = completion.detectShellFromEnv(process.env.SHELL);
      const resolvedShell = completion.normalizeCompletionShell(shell || detected || 'bash');
      const script = completion.renderCompletionScript(resolvedShell);
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
