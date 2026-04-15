import type { CAC } from 'cac';
import pc from 'picocolors';
import { defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { AUTOMATION_SECTION } from './sections';
import { emitCliError, emitCommandResult, isJsonOutput } from '../utils/output';
import { readLicellState, resolveStateComponentName } from '../utils/project-state';
import { normalizeComponentName } from '../utils/workspace-config';

interface StateShowOptions {
  component?: string;
}

const stateShowCommand = defineCliCommand({
  rawName: 'state show',
  description: '查看当前 repo 的 `.licell/state.json`',
  options: [
    { rawName: '--component <name>', description: '只读取指定 component 的 state' }
  ],
  descriptor: {
    title: 'Show persisted deploy state',
    summary: '输出 repo 中版本化保存的 deploy state，用于追查当前 live 资源与访问入口。',
    examples: ['licell state show', 'licell state show --component web --output json'],
    result: {
      summary: '返回 state 文件内容。',
      fields: [
        { name: 'schemaVersion', description: 'state schema 版本。', required: true },
        { name: 'components', description: 'component state map。', required: true }
      ]
    }
  }
});

export function registerStateCommands(cli: CAC) {
  registerCliCommand(cli, stateShowCommand)
    .action((options: StateShowOptions) => {
      try {
        const component = options.component ? normalizeComponentName(options.component) : undefined;
        const state = readLicellState(process.cwd());
        if (isJsonOutput()) {
          if (component) {
            emitCommandResult({
              schemaVersion: state.schemaVersion,
              component,
              state: state.components[resolveStateComponentName({ cwd: process.cwd(), component })] || null
            }, { stage: 'state.show', inferOutcome: false });
            return;
          }
          emitCommandResult(state, { stage: 'state.show', inferOutcome: false });
          return;
        }

        if (component) {
          const resolved = resolveStateComponentName({ cwd: process.cwd(), component });
          console.log(`${pc.bold('component')}: ${pc.cyan(resolved)}`);
          console.log(JSON.stringify(state.components[resolved] || {}, null, 2));
          return;
        }
        console.log(JSON.stringify(state, null, 2));
      } catch (err: unknown) {
        if (isJsonOutput()) {
          emitCliError(err, { stage: 'state.show' });
        } else {
          console.error(String(err instanceof Error ? err.message : err));
        }
        process.exitCode = 1;
      }
    });
}

export const stateCommandModule = defineCommandModule({
  section: AUTOMATION_SECTION,
  register: registerStateCommands,
  namespaces: {
    state: {
      summary: '查看 repo 内版本化的部署状态。',
      examples: ['licell state show', 'licell state show --component web']
    }
  },
  commands: [stateShowCommand]
});
