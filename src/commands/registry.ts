import { authCommandModule } from './auth';
import { cacheCommandModule } from './cache';
import { configCommandModule } from './config';
import { dbCommandModule } from './db';
import { deployCommandModule } from './deploy';
import { dnsCommandModule } from './dns';
import { domainCommandModule } from './domain';
import { e2eCommandModule } from './e2e';
import { envCommandModule } from './env';
import { fnCommandModule } from './fn';
import { initCommandModule } from './init';
import { logsCommandModule } from './logs';
import { mcpCommandModule } from './mcp';
import { ossCommandModule } from './oss';
import { releaseCommandModule } from './release';
import { shellCommandModule } from './shell';
import { setupCommandModule } from './setup';
import { skillsCommandModule } from './skills';
import { supaCommandModule } from './supa';
import { upgradeCommandModule } from './upgrade';
import { defineCommandBundle, defineCommandManifest } from './module';

export const licellRootHelpSurface = defineCommandBundle({
  register: () => {},
  descriptors: {
    help: {
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
      ],
      taskHints: [
        {
          title: '第一次上手 licell',
          description: '先完成登录与项目初始化，再进入 deploy / domain / data 工作流。',
          commands: ['licell login', 'licell init']
        },
        {
          title: '让 AI Agent 直接操作 licell',
          description: '用 setup/skills/mcp 完成 Agent 接入，后续 help / MCP / docs 都会走同一套命令源。',
          commands: ['licell setup', 'licell skills init codex', 'licell mcp init']
        },
        {
          title: '把命令接入自动化脚本',
          description: '优先选择支持结构化结果的命令，并统一追加 --output json。',
          commands: ['licell deploy --output json', 'licell logs --once --output json']
        }
      ]
    }
  },
  roots: []
});

export const LICELL_COMMAND_MANIFEST = defineCommandManifest({
  root: licellRootHelpSurface,
  modules: [
    authCommandModule,
    initCommandModule,
    configCommandModule,
    deployCommandModule,
    releaseCommandModule,
    logsCommandModule,
    fnCommandModule,
    envCommandModule,
    domainCommandModule,
    dnsCommandModule,
    ossCommandModule,
    dbCommandModule,
    cacheCommandModule,
    supaCommandModule,
    mcpCommandModule,
    skillsCommandModule,
    setupCommandModule,
    shellCommandModule,
    upgradeCommandModule,
    e2eCommandModule
  ]
});
