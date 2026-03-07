import { cac, type CAC } from 'cac';
import { registerAuthCommands } from '../commands/auth';
import { registerInitCommand } from '../commands/init';
import { registerDeployCommand } from '../commands/deploy';
import { registerFnCommands } from '../commands/fn';
import { registerOssCommands } from '../commands/oss';
import { registerDbCommands } from '../commands/db';
import { registerCacheCommands } from '../commands/cache';
import { registerE2eCommands } from '../commands/e2e';
import { registerReleaseCommands } from '../commands/release';
import { registerDomainCommands } from '../commands/domain';
import { registerDnsCommands } from '../commands/dns';
import { registerEnvCommands } from '../commands/env';
import { registerLogsCommand } from '../commands/logs';
import { registerUpgradeCommand } from '../commands/upgrade';
import { registerMcpCommand } from '../commands/mcp';
import { registerShellCommands } from '../commands/shell';
import { registerSkillsCommands } from '../commands/skills';
import { registerSetupCommand } from '../commands/setup';
import { registerConfigCommands } from '../commands/config';
import { registerSupaCommands } from '../commands/supa';
import { resolveCliVersion } from '../utils/version';

export const LICELL_OUTPUT_OPTION = {
  rawName: '--output <mode>',
  description: '输出格式：text|json（json 更适合 Agent/MCP 解析）',
  config: { default: 'text' }
} as const;

export function registerAllLicellCommands(cli: CAC) {
  registerAuthCommands(cli);
  registerInitCommand(cli);
  registerDeployCommand(cli);
  registerFnCommands(cli);
  registerOssCommands(cli);
  registerDbCommands(cli);
  registerCacheCommands(cli);
  registerE2eCommands(cli);
  registerReleaseCommands(cli);
  registerDomainCommands(cli);
  registerDnsCommands(cli);
  registerEnvCommands(cli);
  registerLogsCommand(cli);
  registerUpgradeCommand(cli);
  registerMcpCommand(cli);
  registerShellCommands(cli);
  registerSkillsCommands(cli);
  registerSetupCommand(cli);
  registerConfigCommands(cli);
  registerSupaCommands(cli);
}

export function createLicellCliApp(options?: { name?: string; version?: string }) {
  const cli = cac(options?.name || 'licell');
  cli.version(options?.version || resolveCliVersion());
  cli.option(LICELL_OUTPUT_OPTION.rawName, LICELL_OUTPUT_OPTION.description, LICELL_OUTPUT_OPTION.config);
  registerAllLicellCommands(cli);
  cli.help();
  return cli;
}
