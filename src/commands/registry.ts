import { authCommandModule } from './auth';
import { apiCommandModule } from './api';
import { bootstrapCommandModule } from './bootstrap';
import { cacheCommandModule } from './cache';
import { capabilityCommandModule } from './capability';
import { catalogCommandModule } from './catalog';
import { ciCommandModule } from './ci';
import { configCommandModule } from './config';
import { dbCommandModule } from './db';
import { deployCommandModule } from './deploy';
import { doctorCommandModule } from './doctor';
import { dnsCommandModule } from './dns';
import { domainCommandModule } from './domain';
import { e2eCommandModule } from './e2e';
import { envCommandModule } from './env';
import { ecsCommandModule } from './ecs';
import { fnCommandModule } from './fn';
import { initCommandModule } from './init';
import { logsCommandModule } from './logs';
import { onboardCommandModule } from './onboard';
import { ossCommandModule } from './oss';
import { releaseCommandModule } from './release';
import { shellCommandModule } from './shell';
import { setupCommandModule } from './setup';
import { skillsCommandModule } from './skills';
import { stateCommandModule } from './state';
import { supaCommandModule } from './supa';
import { taskCommandModule } from './task';
import { upgradeCommandModule } from './upgrade';
import { workspaceCommandModule } from './workspace';
import { defineCommandBundle, defineCommandManifest } from './module';

export const licellRootHelpSurface = defineCommandBundle({
  register: () => {},
  descriptors: {
    help: {
      notes: [
        '帮助信息由共享 CLI 命令注册表生成；CLI / help / catalog / skills / docs / completion 保持同源。'
      ],
      examples: [
        'licell login',
        'licell init',
        'licell doctor',
        'licell onboard',
        'licell deploy',
        'licell catalog --output json',
        'licell skills init codex',
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
          description: '优先用 onboard 一次装好全局 Codex + Claude 接入；若包含 Codex，还会补上 GitLab CI subagent。',
          commands: ['licell onboard', 'licell catalog --output json']
        },
        {
          title: '把命令接入自动化脚本',
          description: '优先选择支持结构化结果的命令，并统一追加 --output json。',
          commands: ['licell deploy --output json', 'licell fn logs --once --output json']
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
    bootstrapCommandModule,
    workspaceCommandModule,
    configCommandModule,
    deployCommandModule,
    taskCommandModule,
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
    ecsCommandModule,
    doctorCommandModule,
    catalogCommandModule,
    apiCommandModule,
    capabilityCommandModule,
    ciCommandModule,
    onboardCommandModule,
    skillsCommandModule,
    setupCommandModule,
    stateCommandModule,
    shellCommandModule,
    upgradeCommandModule,
    e2eCommandModule
  ]
});
