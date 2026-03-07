# Agent Surface Reference

> 本文档由 licell 的共享 CLI / MCP 注册表自动生成；命令或工具变更会同步到 README / Skills / MCP / Shell Completion / 本页。

## CLI 命令目录

> 下表直接来自共享 CLI 注册表；生成 MCP Tool 名称也从同一份目录派生。

### Setup & Identity

认证、项目初始化与默认配置相关命令。

| 命令 | 说明 | 生成 MCP Tool | 关键选项 |
|------|------|----------------|----------|
| `licell login` | 配置阿里云凭证 | `licell_cmd_login` | `--account-id`, `--ak`, `--sk` |
| `licell auth repair` | 修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用） | `licell_cmd_auth_repair` | `--account-id`, `--ak`, `--sk` |
| `licell logout` | 清除本地凭证 | `licell_cmd_logout` | — |
| `licell whoami` | 查看当前登录身份 | `licell_cmd_whoami` | — |
| `licell switch` | 切换默认 region | `licell_cmd_switch` | `--region` |
| `licell init` | 初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置） | `licell_cmd_init` | `--runtime`, `--app`, `--force` |
| `licell config domain [suffix]` | 查看或设置全局默认域名后缀 | `licell_cmd_config_domain` | `--unset` |

### Delivery Workflow

围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。

- Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。
- 涉及删除或清理的命令通常需要显式传入 `--yes`。

| 命令 | 说明 | 生成 MCP Tool | 关键选项 |
|------|------|----------------|----------|
| `licell deploy` | 一键极速打包部署 | `licell_cmd_deploy` | `--type`, `--entry`, `--dist` |
| `licell deploy check` | 本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行） | `licell_cmd_deploy_check` | `--runtime`, `--entry`, `--docker-daemon` |
| `licell deploy spec [runtime]` | 查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照） | `licell_cmd_deploy_spec` | `--all` |
| `licell release list` | 查看函数版本列表 | `licell_cmd_release_list` | `--limit` |
| `licell release promote [versionId]` | 发布并切流到目标别名 | `licell_cmd_release_promote` | `--target` |
| `licell release prune` | 清理历史函数版本（默认仅预览） | `licell_cmd_release_prune` | `--keep`, `--apply`, `--yes` |
| `licell release rollback <versionId>` | 回滚到指定函数版本 | `licell_cmd_release_rollback` | `--target` |
| `licell logs` | 查看云端日志（默认实时流式） | `licell_cmd_logs` | `--once`, `--window`, `--lines` |
| `licell fn info [name]` | 查看函数详情 | `licell_cmd_fn_info` | `--target` |
| `licell fn invoke [name]` | 调用函数（同步） | `licell_cmd_fn_invoke` | `--target`, `--payload`, `--file` |
| `licell fn list` | 查看函数列表 | `licell_cmd_fn_list` | `--limit`, `--prefix` |
| `licell fn rm [name]` | 删除函数 | `licell_cmd_fn_rm` | `--force`, `--yes` |
| `licell env list` | 查看云端环境变量 | `licell_cmd_env_list` | `--target`, `--show-values` |
| `licell env pull` | 拉取云端环境变量 | `licell_cmd_env_pull` | `--target` |
| `licell env rm <key>` | 删除云端环境变量（并同步本地 .licell/project.json） | `licell_cmd_env_rm` | `--yes` |
| `licell env set <key> <value>` | 设置云端环境变量（并同步本地 .licell/project.json） | `licell_cmd_env_set` | — |
| `licell domain add <domain>` | 绑定自定义域名 | `licell_cmd_domain_add` | `--ssl`, `--ssl-force-renew`, `--target` |
| `licell domain rm <domain>` | 解绑自定义域名并清理 DNS CNAME | `licell_cmd_domain_rm` | `--yes` |
| `licell dns records add <domain>` | 添加域名解析记录 | `licell_cmd_dns_records_add` | `--rr`, `--type`, `--value` |
| `licell dns records list [domain]` | 查看域名解析记录 | `licell_cmd_dns_records_list` | `--limit` |
| `licell dns records rm <recordId>` | 删除域名解析记录 | `licell_cmd_dns_records_rm` | `--yes` |
| `licell oss bucket [bucket]` | 上传本地目录到 OSS Bucket 指定目录（兼容命令，等同 oss upload） | `licell_cmd_oss_bucket` | `--bucket`, `--source-dir`, `--target-dir` |
| `licell oss create <bucket>` | 创建 OSS Bucket | `licell_cmd_oss_create` | `--acl`, `--storage-class`, `--redundancy` |
| `licell oss info <bucket>` | 查看 OSS Bucket 详情（含 ACL / 公共访问阻止 / 域名） | `licell_cmd_oss_info` | — |
| `licell oss list` | 查看 OSS Bucket 列表 | `licell_cmd_oss_list` | `--limit` |
| `licell oss ls <bucket> [prefix]` | 列出 Bucket 对象 | `licell_cmd_oss_ls` | `--limit` |
| `licell oss rm <bucket>` | 删除 OSS Bucket（默认仅删空 Bucket） | `licell_cmd_oss_rm` | `--recursive`, `--yes` |
| `licell oss update <bucket>` | 更新 OSS Bucket 属性（ACL / 公共访问阻止） | `licell_cmd_oss_update` | `--acl`, `--public-access-block` |
| `licell oss upload [bucket]` | 上传本地目录到 OSS Bucket 指定目录 | `licell_cmd_oss_upload` | `--bucket`, `--source-dir`, `--target-dir` |
| `licell oss domain bind <bucket> <domain>` | 为 Bucket 绑定原生 OSS 自定义域名 | `licell_cmd_oss_domain_bind` | — |
| `licell oss domain list <bucket>` | 查看 Bucket 已绑定的原生 OSS 域名 | `licell_cmd_oss_domain_list` | — |
| `licell oss domain rm <bucket> <domain>` | 解绑 Bucket 原生 OSS 自定义域名 | `licell_cmd_oss_domain_rm` | `--yes` |
| `licell oss domain token <bucket> <domain>` | 为 Bucket 自定义域名生成 TXT 验证 token | `licell_cmd_oss_domain_token` | — |

### Data Services

数据库、缓存与 Supabase 实例的创建、连接、白名单和生命周期管理。

| 命令 | 说明 | 生成 MCP Tool | 关键选项 |
|------|------|----------------|----------|
| `licell db add` | 分配数据库实例 | `licell_cmd_db_add` | `--type`, `--engine-version`, `--category` |
| `licell db connect [instanceId]` | 输出数据库连接信息 | `licell_cmd_db_connect` | — |
| `licell db info <instanceId>` | 查看数据库实例详情 | `licell_cmd_db_info` | — |
| `licell db list` | 查看数据库实例列表 | `licell_cmd_db_list` | `--limit` |
| `licell db public-access [instanceId]` | 开通数据库公网访问并添加当前 IP 到白名单 | `licell_cmd_db_public_access` | `--ip` |
| `licell db rm <instanceId>` | 删除数据库实例 | `licell_cmd_db_rm` | `--yes` |
| `licell cache add` | 分配 Redis 缓存 | `licell_cmd_cache_add` | `--type`, `--instance`, `--password` |
| `licell cache connect [instanceId]` | 输出缓存连接信息 | `licell_cmd_cache_connect` | — |
| `licell cache info <instanceId>` | 查看缓存实例详情 | `licell_cmd_cache_info` | — |
| `licell cache list` | 查看缓存实例列表 | `licell_cmd_cache_list` | `--limit` |
| `licell cache public-access [instanceId]` | 开通 Redis 公网访问并添加当前 IP 到白名单 | `licell_cmd_cache_public_access` | `--ip` |
| `licell cache rm <instanceId>` | 删除缓存实例 | `licell_cmd_cache_rm` | `--yes` |
| `licell cache rotate-password` | 轮换 Redis 密码 | `licell_cmd_cache_rotate_password` | `--instance` |
| `licell supa add` | 创建 RDS Supabase 实例 | `licell_cmd_supa_add` | `--name`, `--vsw`, `--class` |
| `licell supa config <instanceName>` | 查看 Supabase 实例配置（auth/storage/rag） | `licell_cmd_supa_config` | `--set-auth`, `--set-storage`, `--rag` |
| `licell supa connect <instanceName>` | 查看 Supabase 连接信息和 API Keys | `licell_cmd_supa_connect` | — |
| `licell supa info <instanceName>` | 查看 Supabase 实例详情 | `licell_cmd_supa_info` | — |
| `licell supa list` | 查看 Supabase 实例列表 | `licell_cmd_supa_list` | `--limit` |
| `licell supa reset-password <instanceName>` | 重置 Supabase Dashboard 或数据库密码 | `licell_cmd_supa_reset_password` | `--dashboard-password`, `--db-password` |
| `licell supa restart <instanceName>` | 重启 Supabase 实例 | `licell_cmd_supa_restart` | — |
| `licell supa rm <instanceName>` | 删除 Supabase 实例 | `licell_cmd_supa_rm` | `--yes` |
| `licell supa start <instanceName>` | 启动 Supabase 实例 | `licell_cmd_supa_start` | — |
| `licell supa stop <instanceName>` | 暂停 Supabase 实例 | `licell_cmd_supa_stop` | — |
| `licell supa whitelist <instanceName>` | 查看/修改 Supabase IP 白名单 | `licell_cmd_supa_whitelist` | `--set`, `--add`, `--remove` |

### Automation & Tooling

面向 Agent、开发体验与 CLI 生命周期的自动化命令。

- `licell skills init` 与 `licell mcp` 都基于同一套 CLI 命令目录生成外部表面。
- `licell completion` 的候选命令同样来自共享命令目录。

| 命令 | 说明 | 生成 MCP Tool | 关键选项 |
|------|------|----------------|----------|
| `licell mcp` | MCP：让 Agent 通过 licell 执行部署/发布/运维（默认先初始化，再启动 stdio server） | — | `--project-root`, `--server-name` |
| `licell mcp init` | 写入/更新项目内 `.mcp.json` 配置 | — | `--project-root`, `--server-name` |
| `licell mcp serve` | 以 stdio 方式启动 licell MCP server | — | `--project-root` |
| `licell skills init [agent]` | 为 AI Agent 生成 licell skills（claude / codex） | `licell_cmd_skills_init` | `--project-root`, `--force` |
| `licell setup` | 安装后引导：配置 AI Agent Skills 和 MCP | `licell_cmd_setup` | `--agent`, `--global`, `--project-root` |
| `licell completion [shell]` | 输出 shell 补全脚本（bash/zsh） | `licell_cmd_completion` | `--engine` |
| `licell upgrade` | 按当前安装来源升级 licell | `licell_cmd_upgrade` | `--channel`, `--target-version`, `--repo` |
| `licell e2e cleanup [runId]` | 清理指定 E2E run 产生的资源 | `licell_cmd_e2e_cleanup` | `--manifest`, `--keep-workspace`, `--yes` |
| `licell e2e list` | 查看本项目 e2e 运行记录 | `licell_cmd_e2e_list` | — |
| `licell e2e run` | 执行固定 E2E 套件（默认 smoke） | `licell_cmd_e2e_run` | `--suite`, `--run-id`, `--runtime` |

## MCP 内建工具

这些工具不是对单个 CLI 命令的简单映射，而是 Agent 侧的通用能力入口。

| Tool | 说明 | 关键输入 |
|------|------|----------|
| `licell_cli` | Use licell CLI to deploy API/static services to Alibaba Cloud and manage related resources (FC, custom domains, SSL, DNS, CDN, logs, etc.). Returns stdout/stderr. For self-upgrade, prefer `licell upgrade --dry-run` first; project-local installs require explicit `--channel`. | `argv` |
| `licell_command_catalog` | Return the shared licell command catalog used by Skills, shell completion, and MCP discovery. Useful when the agent wants up-to-date command/option metadata without hardcoded docs. | `rootCommand`, `commandKey` |

## MCP 精选工作流工具

这些工具为高频场景提供更稳定、更语义化的输入结构。

| Tool | 对应 CLI | 说明 | 关键输入 |
|------|----------|------|----------|
| `licell_deploy` | `licell deploy` | Deploy current project. API deploys to Function Compute (FC 3.0); Static deploys to OSS hosting. For API, Agent should call licell_fc_deploy_spec + licell_fc_deploy_check before deploy. | `type`, `runtime`, `entry`, `dist` |
| `licell_dns_records_add` | `licell dns records add` | Add a DNS record (Alidns). | `domain`, `rr`, `type`, `value` |
| `licell_dns_records_list` | `licell dns records list` | List DNS records for a domain (Alidns). | `domain`, `limit` |
| `licell_dns_records_rm` | `licell dns records rm` | Remove a DNS record by recordId. Destructive (requires yes=true). | `recordId`, `yes` |
| `licell_domain_add` | `licell domain add` | Bind a custom domain to current FC app and optionally enable HTTPS. | `domain`, `ssl`, `sslForceRenew`, `target` |
| `licell_domain_rm` | `licell domain rm` | Unbind custom domain and cleanup DNS record. Destructive (requires yes=true). | `domain`, `yes` |
| `licell_fc_deploy_check` | `licell deploy check` | Read-only validation before FC API deployment. Returns actionable issues (missing handler, wrong entry, Docker prerequisites, etc.) and does not modify project files. | `runtime`, `entry`, `dockerDaemon` |
| `licell_fc_deploy_spec` | `licell deploy spec` | Return machine-readable FC API runtime specs (handlerContract/eventSchema/responseSchema/examples/validationRules and resource constraints) for agent planning. | `runtime`, `all` |
| `licell_fn_info` | `licell fn info` | Get FC function details. | `name`, `target` |
| `licell_fn_invoke` | `licell fn invoke` | Invoke FC function synchronously with an optional payload. | `name`, `target`, `payload`, `payloadJson` |
| `licell_fn_list` | `licell fn list` | List FC functions in current region. | `limit`, `prefix` |
| `licell_fn_rm` | `licell fn rm` | Delete FC function. Destructive (requires yes=true). | `name`, `force`, `yes` |
| `licell_init` | `licell init` | Initialize current directory: write .licell/project.json, and optionally generate scaffold files for supported runtimes. | `runtime`, `app`, `force`, `yes` |
| `licell_release_promote` | `licell release promote` | Publish (if needed) and switch an FC alias (e.g. prod/preview) to a version. | `versionId`, `target` |
| `licell_release_prune` | `licell release prune` | Preview or delete old FC published versions. Destructive when apply=true (requires yes=true). | `keep`, `apply`, `yes` |
| `licell_release_rollback` | `licell release rollback` | Switch an FC alias to a specific versionId. | `versionId`, `target` |
| `licell_supa_add` | `licell supa add` | Provision a new RDS Supabase instance (creates PG, waits until Running, saves env vars). Long-running (~5-10 min). | `name`, `vsw`, `class`, `dbInstance` |
| `licell_supa_config` | `licell supa config` | View or modify Supabase instance configuration (auth/storage/RAG). Without modification flags, shows current config. | `instanceName`, `setAuth`, `setStorage`, `rag` |
| `licell_supa_connect` | `licell supa connect` | Get Supabase endpoints, DB endpoints, and API keys (anon key, service key, JWT secret). | `instanceName` |
| `licell_supa_info` | `licell supa info` | Get detailed attributes of a Supabase instance. | `instanceName` |
| `licell_supa_lifecycle` | `licell supa <action>` | Manage Supabase instance lifecycle: restart, stop, or start. | `instanceName`, `action` |
| `licell_supa_list` | `licell supa list` | List RDS Supabase instances in current region. | `limit` |
| `licell_supa_reset_password` | `licell supa reset-password` | Reset Supabase dashboard or database password. | `instanceName`, `dashboardPassword`, `dbPassword` |
| `licell_supa_rm` | `licell supa rm` | Delete a Supabase instance. Destructive and irreversible (requires yes=true). Associated PG instance and NAT gateway need manual cleanup. | `instanceName`, `yes` |
| `licell_supa_whitelist` | `licell supa whitelist` | View or modify Supabase instance IP whitelist. Without modification flags, shows current whitelist. | `instanceName`, `set`, `add`, `remove` |

## 自动生成的 MCP 命令工具

除 `licell mcp ...` 外，其他 CLI 命令默认都会派生出 `licell_cmd_*` Tool。下面按命令分组展示。

### Setup & Identity

由 CLI 注册表自动派生的 Setup & Identity 命令工具。

| Tool | 对应 CLI | 说明 | 关键输入 |
|------|----------|------|----------|
| `licell_cmd_auth_repair` | `licell auth repair` | 修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用） Auto-generated from the shared licell CLI registry. | `accountId`, `ak`, `sk`, `region` |
| `licell_cmd_config_domain` | `licell config domain` | 查看或设置全局默认域名后缀 Auto-generated from the shared licell CLI registry. | `suffix`, `unset` |
| `licell_cmd_init` | `licell init` | 初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置） Auto-generated from the shared licell CLI registry. | `runtime`, `app`, `force`, `yes` |
| `licell_cmd_login` | `licell login` | 配置阿里云凭证 Auto-generated from the shared licell CLI registry. | `accountId`, `ak`, `sk`, `region` |
| `licell_cmd_logout` | `licell logout` | 清除本地凭证 Auto-generated from the shared licell CLI registry. | `cwd`, `timeoutMs` |
| `licell_cmd_switch` | `licell switch` | 切换默认 region Auto-generated from the shared licell CLI registry. | `region` |
| `licell_cmd_whoami` | `licell whoami` | 查看当前登录身份 Auto-generated from the shared licell CLI registry. | `cwd`, `timeoutMs` |

### Delivery Workflow

由 CLI 注册表自动派生的 Delivery Workflow 命令工具。

| Tool | 对应 CLI | 说明 | 关键输入 |
|------|----------|------|----------|
| `licell_cmd_deploy` | `licell deploy` | 一键部署 API / Static，并提供 spec / check 辅助子命令。 Safety: mutating — 会创建或更新函数、域名、SSL、CDN 等云端资源。 Auto-generated from the shared licell CLI registry. | `type`, `entry`, `dist`, `runtime` |
| `licell_cmd_deploy_check` | `licell deploy check` | 本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行） Auto-generated from the shared licell CLI registry. | `runtime`, `entry`, `dockerDaemon` |
| `licell_cmd_deploy_spec` | `licell deploy spec` | 查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照） Auto-generated from the shared licell CLI registry. | `runtime`, `all` |
| `licell_cmd_dns_records_add` | `licell dns records add` | 添加域名解析记录 Auto-generated from the shared licell CLI registry. | `domain`, `rr`, `type`, `value` |
| `licell_cmd_dns_records_list` | `licell dns records list` | 查看域名解析记录 Auto-generated from the shared licell CLI registry. | `domain`, `limit` |
| `licell_cmd_dns_records_rm` | `licell dns records rm` | 删除域名解析记录 Auto-generated from the shared licell CLI registry. | `recordId`, `yes` |
| `licell_cmd_domain_add` | `licell domain add` | 绑定自定义域名 Auto-generated from the shared licell CLI registry. | `domain`, `ssl`, `sslForceRenew`, `target` |
| `licell_cmd_domain_rm` | `licell domain rm` | 解绑自定义域名并清理 DNS CNAME Safety: destructive — 会解绑域名并清理对应 DNS CNAME。 Auto-generated from the shared licell CLI registry. | `domain`, `yes` |
| `licell_cmd_env_list` | `licell env list` | 查看云端环境变量 Auto-generated from the shared licell CLI registry. | `target`, `showValues` |
| `licell_cmd_env_pull` | `licell env pull` | 拉取云端环境变量 Auto-generated from the shared licell CLI registry. | `target` |
| `licell_cmd_env_rm` | `licell env rm` | 删除云端环境变量（并同步本地 .licell/project.json） Safety: destructive — 会删除已有环境变量，执行前建议先 `licell env list` 确认。 Auto-generated from the shared licell CLI registry. | `key`, `yes` |
| `licell_cmd_env_set` | `licell env set` | 设置云端环境变量（并同步本地 .licell/project.json） Safety: mutating — 会更新云端环境变量，并同步本地 `.licell/project.json`。 Auto-generated from the shared licell CLI registry. | `key`, `value` |
| `licell_cmd_fn_info` | `licell fn info` | 查看函数详情 Auto-generated from the shared licell CLI registry. | `name`, `target` |
| `licell_cmd_fn_invoke` | `licell fn invoke` | 调用函数（同步） Auto-generated from the shared licell CLI registry. | `name`, `target`, `payload`, `file` |
| `licell_cmd_fn_list` | `licell fn list` | 查看函数列表 Auto-generated from the shared licell CLI registry. | `limit`, `prefix` |
| `licell_cmd_fn_rm` | `licell fn rm` | 删除函数 Auto-generated from the shared licell CLI registry. | `name`, `force`, `yes` |
| `licell_cmd_logs` | `licell logs` | 查看云端实时或历史日志。 Auto-generated from the shared licell CLI registry. | `once`, `window`, `lines` |
| `licell_cmd_oss_bucket` | `licell oss bucket` | 兼容命令；等同 `licell oss upload`。 Auto-generated from the shared licell CLI registry. | `bucket`, `bucket2`, `sourceDir`, `targetDir` |
| `licell_cmd_oss_create` | `licell oss create` | 创建 OSS Bucket Safety: mutating — 会创建新的 OSS Bucket，并可能设置 ACL / 冗余 / 存储类型。 Auto-generated from the shared licell CLI registry. | `bucket`, `acl`, `storageClass`, `redundancy` |
| `licell_cmd_oss_domain_bind` | `licell oss domain bind` | 为 Bucket 绑定原生 OSS 自定义域名 Safety: mutating — 会把自定义域名绑定到 OSS Bucket。 Auto-generated from the shared licell CLI registry. | `bucket`, `domain` |
| `licell_cmd_oss_domain_list` | `licell oss domain list` | 查看 Bucket 已绑定的原生 OSS 域名 Auto-generated from the shared licell CLI registry. | `bucket` |
| `licell_cmd_oss_domain_rm` | `licell oss domain rm` | 解绑 Bucket 原生 OSS 自定义域名 Safety: destructive — 会解除 OSS Bucket 与自定义域名的绑定。 Auto-generated from the shared licell CLI registry. | `bucket`, `domain`, `yes` |
| `licell_cmd_oss_domain_token` | `licell oss domain token` | 为待绑定的 OSS 自定义域名生成 TXT 验证 token。 Auto-generated from the shared licell CLI registry. | `bucket`, `domain` |
| `licell_cmd_oss_info` | `licell oss info` | 查看 Bucket 基本信息，并补充 ACL、公共访问阻止、已绑定域名。 Auto-generated from the shared licell CLI registry. | `bucket` |
| `licell_cmd_oss_list` | `licell oss list` | 查看 OSS Bucket 列表 Auto-generated from the shared licell CLI registry. | `limit` |
| `licell_cmd_oss_ls` | `licell oss ls` | 列出 Bucket 中的对象，可按 prefix 过滤。 Auto-generated from the shared licell CLI registry. | `bucket`, `prefix`, `limit` |
| `licell_cmd_oss_rm` | `licell oss rm` | 删除 OSS Bucket（默认仅删空 Bucket） Safety: destructive — 会删除 Bucket；加 `--recursive` 时还会删除其中对象。 Auto-generated from the shared licell CLI registry. | `bucket`, `recursive`, `yes` |
| `licell_cmd_oss_update` | `licell oss update` | 更新 OSS Bucket 属性（ACL / 公共访问阻止） Safety: mutating — 会更新 Bucket ACL 或公共访问阻止状态。 Auto-generated from the shared licell CLI registry. | `bucket`, `acl`, `publicAccessBlock` |
| `licell_cmd_oss_upload` | `licell oss upload` | 上传本地目录到指定 Bucket / 目录前缀。 Auto-generated from the shared licell CLI registry. | `bucket`, `bucket2`, `sourceDir`, `targetDir` |
| `licell_cmd_release_list` | `licell release list` | 查看函数版本列表 Auto-generated from the shared licell CLI registry. | `limit` |
| `licell_cmd_release_promote` | `licell release promote` | 发布并切流到目标别名 Safety: mutating — 会切换 alias 指向的线上版本。 Auto-generated from the shared licell CLI registry. | `versionId`, `target` |
| `licell_cmd_release_prune` | `licell release prune` | 清理历史函数版本（默认仅预览） Safety: destructive — 可能删除历史函数版本或预览域名绑定，建议先预览并确认保留策略。 Auto-generated from the shared licell CLI registry. | `keep`, `apply`, `yes`, `preview` |
| `licell_cmd_release_rollback` | `licell release rollback` | 回滚到指定函数版本 Safety: destructive — 会将线上流量回滚到旧版本，执行前请确认目标版本。 Auto-generated from the shared licell CLI registry. | `versionId`, `target` |

### Data Services

由 CLI 注册表自动派生的 Data Services 命令工具。

| Tool | 对应 CLI | 说明 | 关键输入 |
|------|----------|------|----------|
| `licell_cmd_cache_add` | `licell cache add` | 分配 Redis 缓存 Auto-generated from the shared licell CLI registry. | `type`, `instance`, `password`, `username` |
| `licell_cmd_cache_connect` | `licell cache connect` | 输出缓存连接信息 Auto-generated from the shared licell CLI registry. | `instanceId` |
| `licell_cmd_cache_info` | `licell cache info` | 查看缓存实例详情 Auto-generated from the shared licell CLI registry. | `instanceId` |
| `licell_cmd_cache_list` | `licell cache list` | 查看缓存实例列表 Auto-generated from the shared licell CLI registry. | `limit` |
| `licell_cmd_cache_public_access` | `licell cache public-access` | 开通 Redis 公网访问并添加当前 IP 到白名单 Safety: destructive — 会开启缓存公网访问并修改白名单。 Auto-generated from the shared licell CLI registry. | `instanceId`, `ip` |
| `licell_cmd_cache_rm` | `licell cache rm` | 删除缓存实例 Safety: destructive — 会删除缓存实例，请确认实例 ID。 Auto-generated from the shared licell CLI registry. | `instanceId`, `yes` |
| `licell_cmd_cache_rotate_password` | `licell cache rotate-password` | 轮换 Redis 密码 Safety: destructive — 会轮换 Redis 密码，现有连接配置可能立即失效。 Auto-generated from the shared licell CLI registry. | `instance` |
| `licell_cmd_db_add` | `licell db add` | 分配数据库实例 Auto-generated from the shared licell CLI registry. | `type`, `engineVersion`, `category`, `class` |
| `licell_cmd_db_connect` | `licell db connect` | 输出数据库连接信息 Auto-generated from the shared licell CLI registry. | `instanceId` |
| `licell_cmd_db_info` | `licell db info` | 查看数据库实例详情 Auto-generated from the shared licell CLI registry. | `instanceId` |
| `licell_cmd_db_list` | `licell db list` | 查看数据库实例列表 Auto-generated from the shared licell CLI registry. | `limit` |
| `licell_cmd_db_public_access` | `licell db public-access` | 开通数据库公网访问并添加当前 IP 到白名单 Safety: destructive — 会开启数据库公网访问并修改白名单。 Auto-generated from the shared licell CLI registry. | `instanceId`, `ip` |
| `licell_cmd_db_rm` | `licell db rm` | 删除数据库实例 Safety: destructive — 会删除数据库实例，请确认实例 ID 与备份策略。 Auto-generated from the shared licell CLI registry. | `instanceId`, `yes` |
| `licell_cmd_supa_add` | `licell supa add` | 创建 RDS Supabase 实例 Auto-generated from the shared licell CLI registry. | `name`, `vsw`, `class`, `dbInstance` |
| `licell_cmd_supa_config` | `licell supa config` | 查看 Supabase 实例配置（auth/storage/rag） Auto-generated from the shared licell CLI registry. | `instanceName`, `setAuth`, `setStorage`, `rag` |
| `licell_cmd_supa_connect` | `licell supa connect` | 查看 Supabase 连接信息和 API Keys Auto-generated from the shared licell CLI registry. | `instanceName` |
| `licell_cmd_supa_info` | `licell supa info` | 查看 Supabase 实例详情 Auto-generated from the shared licell CLI registry. | `instanceName` |
| `licell_cmd_supa_list` | `licell supa list` | 查看 Supabase 实例列表 Auto-generated from the shared licell CLI registry. | `limit` |
| `licell_cmd_supa_reset_password` | `licell supa reset-password` | 重置 Supabase Dashboard 或数据库密码 Auto-generated from the shared licell CLI registry. | `instanceName`, `dashboardPassword`, `dbPassword` |
| `licell_cmd_supa_restart` | `licell supa restart` | 重启 Supabase 实例 Auto-generated from the shared licell CLI registry. | `instanceName` |
| `licell_cmd_supa_rm` | `licell supa rm` | 删除 Supabase 实例 Safety: destructive — 会删除 Supabase 实例及其相关配置。 Auto-generated from the shared licell CLI registry. | `instanceName`, `yes` |
| `licell_cmd_supa_start` | `licell supa start` | 启动 Supabase 实例 Auto-generated from the shared licell CLI registry. | `instanceName` |
| `licell_cmd_supa_stop` | `licell supa stop` | 暂停 Supabase 实例 Auto-generated from the shared licell CLI registry. | `instanceName` |
| `licell_cmd_supa_whitelist` | `licell supa whitelist` | 查看/修改 Supabase IP 白名单 Auto-generated from the shared licell CLI registry. | `instanceName`, `set`, `add`, `remove` |

### Automation & Tooling

由 CLI 注册表自动派生的 Automation & Tooling 命令工具。

| Tool | 对应 CLI | 说明 | 关键输入 |
|------|----------|------|----------|
| `licell_cmd_completion` | `licell completion` | 生成 shell 补全脚本，或调用内部补全引擎。 Auto-generated from the shared licell CLI registry. | `shell`, `engine` |
| `licell_cmd_e2e_cleanup` | `licell e2e cleanup` | 清理指定 E2E run 产生的资源 Auto-generated from the shared licell CLI registry. | `runId`, `manifest`, `keepWorkspace`, `yes` |
| `licell_cmd_e2e_list` | `licell e2e list` | 查看本项目 e2e 运行记录 Auto-generated from the shared licell CLI registry. | `cwd`, `timeoutMs` |
| `licell_cmd_e2e_run` | `licell e2e run` | 执行固定 E2E 套件（默认 smoke） Auto-generated from the shared licell CLI registry. | `suite`, `runId`, `runtime`, `target` |
| `licell_cmd_setup` | `licell setup` | 安装后的一站式引导：配置 Skills 与 MCP。 Auto-generated from the shared licell CLI registry. | `agent`, `global`, `projectRoot`, `force` |
| `licell_cmd_skills_init` | `licell skills init` | 为 AI Agent 生成 licell skills（claude / codex） Auto-generated from the shared licell CLI registry. | `agent`, `projectRoot`, `force` |
| `licell_cmd_upgrade` | `licell upgrade` | 按当前安装来源执行自升级，支持 dry-run 查看计划。 Safety: mutating — 会修改本机 licell 安装，建议先 dry-run 再执行。 Auto-generated from the shared licell CLI registry. | `channel`, `targetVersion`, `repo`, `scriptUrl` |

## 同步机制

- CLI 命令、子命令、选项：来自共享 `cac` 注册表。
- Skills 命令参考、MCP 生成工具、shell completion、README 命令速查：全部从同一份命令目录派生。
- MCP builtin / curated tool 文档：直接从 MCP tool 注册表派生，避免 README / Skills / server 三处重复维护。
- 若新增命令或 tool，只需更新对应注册表并执行 `bun run docs:sync`。
