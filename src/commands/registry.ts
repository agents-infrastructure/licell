import { registerAuthCommands, authCommandMetadata } from './auth';
import { registerCacheCommands, cacheCommandMetadata } from './cache';
import { registerConfigCommands, configCommandMetadata } from './config';
import { registerDbCommands, dbCommandMetadata } from './db';
import { registerDeployCommand, deployCommandMetadata } from './deploy';
import { registerDnsCommands, dnsCommandMetadata } from './dns';
import { registerDomainCommands, domainCommandMetadata } from './domain';
import { registerE2eCommands, e2eCommandMetadata } from './e2e';
import { registerEnvCommands, envCommandMetadata } from './env';
import { registerFnCommands, fnCommandMetadata } from './fn';
import { registerInitCommand } from './init';
import { registerLogsCommand, logsCommandMetadata } from './logs';
import { registerMcpCommand, mcpCommandMetadata } from './mcp';
import { registerOssCommands, ossCommandMetadata } from './oss';
import { registerReleaseCommands, releaseCommandMetadata } from './release';
import { registerShellCommands, completionCommandMetadata } from './shell';
import { registerSetupCommand, setupCommandMetadata } from './setup';
import { registerSkillsCommands, skillsCommandMetadata } from './skills';
import { registerSupaCommands, supaCommandMetadata } from './supa';
import { registerUpgradeCommand, upgradeCommandMetadata } from './upgrade';
import type { CommandMetadata, LicellCommandModule } from './module';

const SETUP_SECTION = {
  id: 'setup',
  title: 'Setup & Identity',
  summary: '认证、项目初始化与默认配置相关命令。'
} as const;

const DELIVERY_SECTION = {
  id: 'delivery',
  title: 'Delivery Workflow',
  summary: '围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。',
  notes: [
    'Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。',
    '涉及删除或清理的命令通常需要显式传入 `--yes`。'
  ]
} as const;

const DATA_SECTION = {
  id: 'data',
  title: 'Data Services',
  summary: '数据库、缓存与 Supabase 实例的创建、连接、白名单和生命周期管理。'
} as const;

const AUTOMATION_SECTION = {
  id: 'automation',
  title: 'Automation & Tooling',
  summary: '面向 Agent、开发体验与 CLI 生命周期的自动化命令。',
  notes: [
    '`licell skills init` 与 `licell mcp` 都基于同一套 CLI 命令目录生成外部表面。',
    '`licell completion` 的候选命令同样来自共享命令目录。'
  ]
} as const;


export const LICELL_ROOT_HELP_METADATA: CommandMetadata = {
  notes: [
    '帮助信息由共享 CLI 命令注册表生成；CLI / MCP / skills / docs / completion 保持同源。'
  ],
  examples: [
    'licell login',
    'licell init',
    'licell deploy',
    'licell skills init codex',
    'licell mcp init',
    'licell deploy --output json'
  ],
  agentTips: [
    '对 Agent / 自动化调用，优先追加 `--output json` 获取结构化结果。',
    '命令族同样支持帮助，例如 `licell db --help`、`licell dns records --help`、`licell skills --help`。'
  ]
};

export const LICELL_COMMAND_MODULES: LicellCommandModule[] = [
  { roots: ['login', 'auth', 'logout', 'whoami', 'switch'], register: registerAuthCommands, section: SETUP_SECTION, metadata: authCommandMetadata },
  { roots: ['init'], register: registerInitCommand, section: SETUP_SECTION },
  { roots: ['config'], register: registerConfigCommands, section: SETUP_SECTION, metadata: configCommandMetadata },
  { roots: ['deploy'], register: registerDeployCommand, section: DELIVERY_SECTION, metadata: deployCommandMetadata },
  { roots: ['release'], register: registerReleaseCommands, section: DELIVERY_SECTION, metadata: releaseCommandMetadata },
  { roots: ['logs'], register: registerLogsCommand, section: DELIVERY_SECTION, metadata: logsCommandMetadata },
  { roots: ['fn'], register: registerFnCommands, section: DELIVERY_SECTION, metadata: fnCommandMetadata },
  { roots: ['env'], register: registerEnvCommands, section: DELIVERY_SECTION, metadata: envCommandMetadata },
  { roots: ['domain'], register: registerDomainCommands, section: DELIVERY_SECTION, metadata: domainCommandMetadata },
  { roots: ['dns'], register: registerDnsCommands, section: DELIVERY_SECTION, metadata: dnsCommandMetadata },
  { roots: ['oss'], register: registerOssCommands, section: DELIVERY_SECTION, metadata: ossCommandMetadata },
  { roots: ['db'], register: registerDbCommands, section: DATA_SECTION, metadata: dbCommandMetadata },
  { roots: ['cache'], register: registerCacheCommands, section: DATA_SECTION, metadata: cacheCommandMetadata },
  { roots: ['supa'], register: registerSupaCommands, section: DATA_SECTION, metadata: supaCommandMetadata },
  { roots: ['mcp'], register: registerMcpCommand, section: AUTOMATION_SECTION, metadata: mcpCommandMetadata },
  { roots: ['skills'], register: registerSkillsCommands, section: AUTOMATION_SECTION, metadata: skillsCommandMetadata },
  { roots: ['setup'], register: registerSetupCommand, section: AUTOMATION_SECTION, metadata: setupCommandMetadata },
  { roots: ['completion'], register: registerShellCommands, section: AUTOMATION_SECTION, metadata: completionCommandMetadata },
  { roots: ['upgrade'], register: registerUpgradeCommand, section: AUTOMATION_SECTION, metadata: upgradeCommandMetadata },
  { roots: ['e2e'], register: registerE2eCommands, section: AUTOMATION_SECTION, metadata: e2eCommandMetadata }
];
