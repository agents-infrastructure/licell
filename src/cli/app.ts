import { cac, type CAC } from 'cac';
import { LICELL_COMMAND_MANIFEST } from '../commands/registry';
import { resolveCliVersion } from '../utils/version';

export const LICELL_OUTPUT_OPTION = {
  rawName: '--output <mode>',
  description: '输出格式：text|json（json 更适合 Agent / 自动化解析）',
  config: { default: 'text' }
} as const;

export function registerAllLicellCommands(cli: CAC) {
  for (const commandModule of LICELL_COMMAND_MANIFEST.modules) {
    commandModule.register(cli);
  }
}

export function createLicellCliApp(options?: { name?: string; version?: string }) {
  const cli = cac(options?.name || 'licell');
  cli.version(options?.version || resolveCliVersion());
  cli.option(LICELL_OUTPUT_OPTION.rawName, LICELL_OUTPUT_OPTION.description, LICELL_OUTPUT_OPTION.config);
  registerAllLicellCommands(cli);
  cli.help();
  return cli;
}
