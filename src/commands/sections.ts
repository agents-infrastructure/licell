import type { CommandSectionMembership } from './module';

export const SETUP_SECTION: CommandSectionMembership = {
  id: 'setup',
  title: 'Setup & Identity',
  summary: '认证、项目初始化与默认配置相关命令。',
  taskHints: [
    {
      title: '配置凭证并初始化项目',
      description: '先完成 AK/SK 登录，再在项目目录生成 licell 配置或脚手架。',
      commands: ['licell login', 'licell init']
    }
  ]
};

export const DELIVERY_SECTION: CommandSectionMembership = {
  id: 'delivery',
  title: 'Delivery Workflow',
  summary: '围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。',
  notes: [
    'Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。',
    '涉及删除或清理的命令通常需要显式传入 `--yes`。',
    '任务函数通过 `licell deploy --type task` 交付；部署成功后不返回固定 URL，而是继续用 `licell task invoke / info / list / stop` 完成调用与排查。'
  ],
  taskHints: [
    {
      title: '部署服务并拿到可访问地址',
      description: '用 deploy 完成 API 或静态站点发布，必要时继续绑定域名和 HTTPS。',
      commands: ['licell deploy --type api --target preview', 'licell domain app bind api.example.com --ssl']
    },
    {
      phase: 'mutate',
      title: '部署任务函数并验证异步调用',
      description: '用 deploy task 发布函数并启用 asyncTask，再通过 invoke / info 验证任务链路。',
      commands: ['licell deploy --type task --target preview', 'licell task invoke <name> --target preview --output json']
    }
  ]
};

export const DATA_SECTION: CommandSectionMembership = {
  id: 'data',
  title: 'Data Services',
  summary: '数据库、缓存与 Supabase 实例的创建、连接、白名单和生命周期管理。',
  taskHints: [
    {
      title: '开通数据库或缓存实例',
      description: '先查看现有资源，再创建新实例并获取连接信息。',
      commands: ['licell db list --output json', 'licell cache add']
    }
  ]
};

export const AUTOMATION_SECTION: CommandSectionMembership = {
  id: 'automation',
  title: 'Automation & Tooling',
  summary: '面向 Agent、开发体验与 CLI 生命周期的自动化命令。',
  notes: [
    '`licell skills init`、`licell onboard`、`licell catalog`、`licell completion` 都基于同一套 CLI 命令目录生成外部表面。',
    '`licell onboard` 会为 Codex 全局安装 `licell` skills 与 `licell-glab` subagent。',
    '`licell completion` 的候选命令同样来自共享命令目录。'
  ],
  taskHints: [
    {
      title: '先做本机 readiness 诊断',
      description: '排查授权、项目配置和 deploy precheck 时，先运行 doctor 汇总阻塞项。',
      commands: ['licell doctor', 'licell doctor --output json']
    },
    {
      title: '把 licell 接入 AI Agent',
      description: '优先用 onboard 安装全局 Codex 接入；后续让 Agent 通过 catalog/help/json output 直接驱动 licell CLI。',
      commands: ['licell onboard', 'licell catalog --output json']
    }
  ]
};
