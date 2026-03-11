# Licell CLI (`licell`)

[English README](./README.en.md)

Licell 是一个面向阿里云的部署与运维 CLI，同时兼顾人类用户与 AI Agent。

它不是把一堆云资源命令简单堆在一起，而是围绕一条主线工作流来设计：

- 一个主入口：`deploy`
- 一份项目状态：`.licell/project.json`
- 一套可组合的资源原子命令：`fn` / `oss` / `dns` / `domain`
- 一套面向 Agent 的统一表面：`--help` / `--output json` / `mcp` / `skills`

默认地域为 `cn-hangzhou`。用于 Agent 自动化时，建议使用独立测试账号或独立地域，不要直接共用生产环境。团队协作下，推荐采用后文的“团队授权分发”模式。

---

## 这是什么

如果你把 Vercel CLI 的“单主线体验”搬到阿里云，大致就是 Licell 想做的事情：

- **人类友好**：`init -> deploy -> release -> rollback`
- **Agent 友好**：命令自描述、结构化帮助、结构化输出、MCP、skills
- **架构清晰**：workflow 命令负责“得到结果”，原子命令负责“精确控制资源”

Licell 当前覆盖的核心能力包括：

- FC API 部署与发布
- OSS 静态站部署
- 自定义域名、HTTPS、CDN、DNS
- ACR / Docker 镜像部署
- Serverless 数据库与缓存辅助能力
- 面向 Agent 的 MCP / Skills / JSON 输出 / 文档共源生成

---

## 核心设计

### 1. 主线 workflow 优先

大多数场景，先用面向结果的命令：

- `licell deploy --type api`
- `licell deploy --type static`
- `licell domain app bind`
- `licell domain static bind`
- `licell release promote`
- `licell release rollback`

这些命令的目标是让你更少思考底层资源编排。

### 2. 原子资源命令兜底

当你需要精确控制某个资源时，再用资源级命令：

- `licell fn domain ...`
- `licell oss domain ...`
- `licell dns records ...`
- `licell oss ...`
- `licell fn ...`

这层命令更适合：

- 做精细化排障
- 写定制化自动化脚本
- 让 Agent 逐步拆解复杂任务

### 3. 一份命令元数据，多处复用

Licell 最新架构里，命令不再只是“能执行”，还要“能自我描述”。

同一套命令注册表会驱动：

- CLI `--help`
- 结构化 help
- MCP tool catalog
- skills 脚手架
- README 生成区块
- Agent surface 文档
- shell completion

也就是说：**命令面变了，帮助、MCP、skills、文档会跟着一起收敛**。

---

## 安装

### 推荐：安装脚本

```bash
curl -fsSL https://github.com/agents-infrastructure/licell/releases/latest/download/install.sh | bash
```

安装完成后，可直接运行：

```bash
licell
```

裸执行 `licell` 会进入首次引导流程。

### 安装后下一步：先完成授权

安装完成后，先完成授权即可开始使用。

持有 AK/SK 时，可直接执行：

```bash
licell login --bootstrap-ram
```

如果由 SRE / 平台团队统一分发授权，可直接执行：

```bash
licell auth restore '<token>' '<passkey>' --yes
```

团队协作场景，可参考下方的[团队授权分发（推荐）](#团队授权分发推荐)。

### 其他安装方式与升级

- 也支持 npm 全局安装和 GitHub Release 二进制分发
- 升级时直接运行 `licell upgrade`
- 如需了解升级来源或升级渠道，再看下面这份说明

<details>
<summary>安装与升级的详细说明</summary>

<!-- BEGIN GENERATED:README_UPGRADE_GUIDANCE -->
- `licell upgrade` 会优先按“当前正在执行的安装来源”升级
- 如果当前是 `npm` / `pnpm` / `yarn` / `bun` 全局安装，会调用对应包管理器执行全局升级
- 如果当前是项目内依赖、`node_modules/.bin/licell` 或开发链接，默认不会自动做全局升级
- 安装脚本和二进制都来自同一个 `releases/latest`，优先下载预构建单文件可执行；若当前平台暂无预构建资产，自动回退源码安装
- 如显式传入 `--repo` 或 `--script-url`，则强制走 GitHub release 升级渠道
- 可通过 `--channel auto|release|npm|pnpm|yarn|bun` 显式覆盖升级渠道；推荐先用 `licell upgrade --dry-run` 预览计划
<!-- END GENERATED:README_UPGRADE_GUIDANCE -->

</details>

---

## 3 分钟上手

### 给人类用户

```bash
licell login --region cn-hangzhou
licell init --runtime nodejs22
licell deploy --type api --target preview
```

### 给 Agent / 自动化调用方

推荐固定顺序：

```bash
licell deploy spec nodejs22 --output json
licell deploy check --runtime nodejs22 --entry src/index.ts --output json
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview --output json
```

这样可以避免“部署成功但运行失败”的无效操作。

---

## 配置与状态模型

Licell 有三类核心状态：

| 类型 | 默认位置 | 说明 |
|------|----------|------|
| 全局认证 | `~/.licell-cli/auth.json` | 阿里云凭证与默认 region |
| 项目状态 | `<project>/.licell/project.json` | appName、环境变量、网络、部署状态 |
| MCP 项目配置 | `<project>/.mcp.json` | 供 Claude / Codex / Cursor 发现 licell MCP server |

兼容性说明：

- Licell 仍兼容历史上的 `~/.ali-cli/auth.json` 等旧路径
- 当前主路径以 `~/.licell-cli/*` 为准

## 团队授权分发（推荐）

当团队中只有少数人直接持有高权限 AK/SK 时，可以把“授权”和“使用”分开：

- SRE / 平台团队在受控机器上执行一次 `licell login`
- 然后执行 `licell auth export <passkey>`
- 把导出的 restore token 分发给团队成员
- 把 `passkey` 通过另一条通道单独发送，不要和 token 放在同一条消息里
- 其他机器直接执行 `licell auth restore <token> <passkey>`，不需要再次 `login`

示例流程：

```bash
# SRE 机器
licell login --region cn-hangzhou
licell auth export 'Team-Shared-Passkey'

# 成员机器
licell auth restore 'licell-auth-v1....' 'Team-Shared-Passkey' --yes
```

适用场景：

- 团队内部批量分发已授权的 `licell` 使用环境
- 让不直接持有高权限凭证的成员快速开始使用
- 给临时机器、CI 调试机、协作设备快速恢复环境

使用与安全建议：

- `token` 和 `passkey` 应分开发送，不要放在同一条消息里
- `restore token` 虽然不是明文凭证，但仍应按敏感信息处理
- `passkey` 至少 12 位，建议通过密码管理器或单独 IM 通道发送
- 若需要失效某次分发，可删除对应导出对象，或重新导出新的 token
- 若团队凭证轮换，应重新执行 `login` / `auth export`，不要继续分发旧 token

---

## 面向 Agent 的接口

## 1) 结构化帮助

Licell 的帮助信息不只是给人看，也要给 Agent 读。

```bash
licell --help
licell domain app --help
licell deploy spec --help
licell domain app bind --help --output json
```

建议：

- 人类交互时用普通 `--help`
- Agent 自动化时优先用 `--help --output json`

## 2) 结构化输出 `--output json`

除 `licell mcp serve` 外，几乎所有命令都支持结构化 JSON 结果：

```bash
licell deploy --type api --output json
licell domain app bind api.example.com --output json
licell oss info my-bucket --output json
```

典型字段包括：

- `stage`
- `type`（`event` / `result` / `error`）
- `error.code`
- `error.category`
- `retryable`
- `provider.requestId`

## 3) MCP

如果你希望 Claude Code、Codex、Cursor 等 Agent 直接把 `licell` 当作工具调用，用 MCP 是最自然的方式。

### 推荐：先跑 setup

```bash
licell setup
licell setup --agent codex --global
licell setup --agent claude --global
```

### 项目内初始化 MCP

```bash
licell mcp init
```

默认会生成：

```json
{
  "mcpServers": {
    "licell": {
      "command": "licell",
      "args": ["mcp", "serve"]
    }
  }
}
```

### 手动启动 MCP server

```bash
licell mcp serve
```

注意：`mcp serve` 走的是 stdio JSON-RPC 协议，**不要**加 `--output json`。

## 4) Skills

如果你希望 Agent 在项目里拥有一份更偏“执行说明书”的上下文，可以生成 skills：

```bash
licell skills init codex
licell skills init claude
```

Skills 与 MCP、help、README 共享同一套命令描述体系，所以更容易保持一致。

---

## 推荐工作流

## API 部署（FC）

```bash
licell deploy spec nodejs22
licell deploy check --runtime nodejs22 --entry src/index.ts
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
```

常见增强参数：

```bash
licell deploy --type api \
  --runtime nodejs22 \
  --entry src/index.ts \
  --target preview \
  --memory 1024 \
  --vcpu 1 \
  --timeout 60
```

常见域名方式：

```bash
# 自动生成 <appName>.<suffix>
licell deploy --type api --runtime nodejs22 --entry src/index.ts --domain-suffix your-domain.xyz --ssl

# 指定完整域名
licell deploy --type api --runtime nodejs22 --entry src/index.ts --domain api.your-domain.xyz --ssl
```

### Agent 建议顺序

1. `deploy spec`
2. `deploy check`
3. `deploy`
4. 必要时再 `release promote` / `rollback`

运行时说明：

- `nodejs22` / `python3.13` 当前都部署为 `custom.debian12`
- 启动时优先使用 FC 托管运行时：`/var/fc/lang/nodejs22/bin/node`、`/var/fc/lang/python3.13/bin/python3.13`
- 默认不再把大体积 fallback runtime 打进代码包，避免放大 FC 上传体积
- 如需额外打包 fallback runtime，可显式设置 `LICELL_FC_INCLUDE_RUNTIME_FALLBACK=1`

<!-- BEGIN GENERATED:README_MCP_FC_API_WORKFLOW -->
`licell mcp` 已提供这组 FC API 部署工作流工具（由共享 MCP 注册表自动生成）：

| Tool | 对应 CLI | 用途 |
|------|----------|------|
| `licell_fc_deploy_spec` | `licell deploy spec` | 读取 FC API runtime 的 entry / handler / 资源约束，帮助 Agent 先理解限制与签名模板。 |
| `licell_fc_deploy_check` | `licell deploy check` | 只读预检当前项目，提前发现 handler、入口文件或 Docker 环境问题，并给出可执行修复建议。 |
| `licell_deploy` | `licell deploy` | 在前两步通过后执行正式部署，将当前项目发布到阿里云。 |

- Workflow：标准 FC API 部署链路：先读取部署规格，再做本地预检，最后执行正式部署。

- 建议顺序：`licell_fc_deploy_spec` → `licell_fc_deploy_check` → `licell_deploy`
<!-- END GENERATED:README_MCP_FC_API_WORKFLOW -->

## 静态站部署（OSS）

```bash
licell deploy --type static --dist dist
```

如果提供域名，Licell 会自动走“静态域名 workflow”：

```bash
licell deploy --type static --dist dist --domain-suffix your-domain.xyz
# 或
licell deploy --type static --dist dist --domain static.your-domain.xyz
```

这条 workflow 会串起：

- OSS 上传
- CDN 接入
- DNS CNAME 收敛
- HTTPS 证书签发与 CDN 边缘证书配置

### HTTPS / ACME 说明

- 默认优先使用 `Let's Encrypt` 通过 `DNS-01` 自动签发证书
- 当 `Let's Encrypt` 命中 ACME rate limit 时，会自动 fallback 到 `ZeroSSL ACME` 继续签发
- ZeroSSL fallback 默认会基于 ACME 账户邮箱自动获取 EAB；也可显式提供 `LICELL_SSL_ZEROSSL_EAB_KID` / `LICELL_SSL_ZEROSSL_EAB_HMAC_KEY`
- 如需走显式 API key 路径，也可设置 `LICELL_SSL_ZEROSSL_ACCESS_KEY`
- ZeroSSL 的 EAB 凭据会安全缓存到 `~/.licell-cli/acme/zerossl-eab.json`，后续签发可复用

## 发布、回滚、环境

```bash
licell release list
licell release promote --from preview --to prod
licell rollback
```

如果你把预览 / 生产环境都托管给 Agent，建议把 `release` 层放在部署成功之后再执行，而不是直接让 Agent 每次都改 `prod`。

---

## 域名能力如何理解

这是现在最容易让人一眼看上去“有点多”的部分，但分层其实很清晰。

## workflow 层：面向结果

| 命令 | 适合谁 | 作用 |
|------|--------|------|
| `licell domain app bind` | 人类 / Agent | 给 FC 应用绑定域名，必要时串 DNS / SSL / CDN |
| `licell domain static bind` | 人类 / Agent | 给静态站绑定域名，必要时串 CDN / DNS / SSL |
| `licell deploy --type static --domain ...` | 人类 / Agent | 直接得到“可访问的静态域名结果” |

## 原子层：面向资源

| 命令 | 作用 |
|------|------|
| `licell fn domain ...` | 管理 FC 自定义域名绑定 |
| `licell oss domain token/bind/unbind` | 管理 OSS 原生域名验证与绑定 |
| `licell dns records ...` | 精确管理 DNS 记录 |

推荐理解方式：

- **想要结果**：先用 `domain app/static` 或 `deploy`
- **要精细控制**：再落到 `fn domain` / `oss domain` / `dns records`

<!-- BEGIN GENERATED:README_MCP_DOMAIN_WORKFLOWS -->
`licell mcp` 也提供共享的域名编排 workflow 工具：

#### 应用域名绑定

通过一个入口同时编排 DNS、FC custom domain 与可选 HTTPS。

| Tool | 对应 CLI | 用途 |
|------|----------|------|
| `licell_domain_app_bind` | `licell domain app bind` | 为当前应用绑定自定义域名，编排 DNS、FC custom domain 与可选 HTTPS。 |

- Workflow：应用域名接入链路：绑定 FC custom domain、对齐 DNS，并可选自动签发 HTTPS。

- 建议顺序：`licell_domain_app_bind`

#### 静态站点域名绑定

通过一个入口同时编排 CDN、DNS 与可选 HTTPS。

| Tool | 对应 CLI | 用途 |
|------|----------|------|
| `licell_domain_static_bind` | `licell domain static bind` | 为静态站点绑定自定义域名，编排 CDN、DNS 与可选 HTTPS。 |

- Workflow：静态站点域名接入链路：把域名接到 CDN、对齐 DNS，并可选自动启用 HTTPS。

- 建议顺序：`licell_domain_static_bind`

#### 应用域名解绑

通过一个入口下线应用域名，并清理 FC custom domain / DNS。

| Tool | 对应 CLI | 用途 |
|------|----------|------|
| `licell_domain_app_unbind` | `licell domain app unbind` | 解绑当前应用域名，并清理 FC custom domain / DNS CNAME。 |

- Workflow：应用域名下线链路：解绑 FC custom domain，并清理对应 DNS CNAME。

- 建议顺序：`licell_domain_app_unbind`

#### 静态站点域名解绑

通过一个入口下线静态站点域名，并清理 CDN / DNS。

| Tool | 对应 CLI | 用途 |
|------|----------|------|
| `licell_domain_static_unbind` | `licell domain static unbind` | 解绑静态站点域名，并清理 CDN domain / DNS CNAME。 |

- Workflow：静态站点域名下线链路：移除 CDN domain，并清理对应 DNS CNAME。

- 建议顺序：`licell_domain_static_unbind`
<!-- END GENERATED:README_MCP_DOMAIN_WORKFLOWS -->

---

## 示例与教程

### 场景教程

1. [**5 分钟上线第一个应用**](./docs/scenarios/01-quick-start.md)
2. [**让 AI Agent 驱动部署**](./docs/scenarios/02-ai-driven-deployment.md)
3. [**域名、HTTPS 与 CDN**](./docs/scenarios/03-domain-and-https.md)
4. [**数据库与缓存**](./docs/scenarios/04-database-and-cache.md)
5. [**Preview / Prod 环境管理**](./docs/scenarios/05-environments-and-releases.md)

### 示例项目

- `examples/node22-express-api`
- `examples/python313-flask-api`
- `examples/docker-bun-hono-api`
- `examples/static-oss-site`

---

## 测试、CI 与真实验证

Licell 当前把验证拆成三层：

### 1. 默认 CI

GitHub Actions 默认跑：

- `typecheck`
- 文档同步校验
- 稳定单元 / 集成内核测试

默认 **不跑真实云资源 e2e**，也 **不跑慢的 CLI 进程级集成测试**。

### 2. 本地集成测试

本地如果要验证真实 CLI 帮助、参数、结构化输出这类进程级行为：

```bash
bun run test:integration
```

### 3. 云上真实验证

在需要发布前做一轮真实阿里云回归时：

```bash
licell e2e run
licell e2e run --suite full
licell e2e list
licell e2e cleanup <runId>
```

说明：

- `e2e run --suite full` 会覆盖更完整的资源 CRUD 与 workflow 链路
- 这类验证默认不放进 GitHub Actions，因为它依赖真实云环境、域名、证书与外部收敛时间

---

## 命令速查

<!-- BEGIN GENERATED:README_QUICK_REFERENCE -->
> 本节由 licell CLI 注册表自动生成；命令变更会同步到 README / docs/reference/agent-surfaces.md / Skills / MCP / Shell Completion。

### Agent Contract

- 原始 CLI JSON 流：过滤前缀 `@@LICELL_JSON@@`，再按 `kind=licell-cli-record` / `schemaVersion=1.0` / `type=event|result|error` 解析。
- `licell <command> --help --output json`：先读取 `help.kind` / `help.schemaVersion`；当前为 `licell-help@1.0`。
- `licell_command_catalog`：先读取 `kind` / `schemaVersion`；当前为 `licell-agent-command-catalog@1.0`。
- MCP tools 的 `metadata.licell` 会显式声明 `schemas.help` / `schemas.commandCatalog`；当前为 `licell-help@1.0` / `licell-agent-command-catalog@1.0`。

### 命令总览

#### Setup & Identity

认证、项目初始化与默认配置相关命令。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell login` | 配置阿里云凭证 | `--account-id`, `--ak`, `--sk` |
| `licell auth export [passkey]` | 加密打包当前 licell 全局凭证状态到私有 OSS，并生成 restore token | `--bucket`, `--expires-hours` |
| `licell auth repair` | 修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用） | `--account-id`, `--ak`, `--sk` |
| `licell auth restore <token> [passkey]` | 使用 restore token + passkey 一键恢复 licell 全局凭证状态 | `--yes` |
| `licell logout` | 清除本地凭证 | — |
| `licell whoami` | 查看当前登录身份 | — |
| `licell switch` | 切换默认 region | `--region` |
| `licell init` | 初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置） | `--runtime`, `--app`, `--force` |
| `licell config domain [suffix]` | 查看或设置全局默认域名后缀 | `--unset` |

#### Delivery Workflow

围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。

- Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。
- 涉及删除或清理的命令通常需要显式传入 `--yes`。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell deploy` | 一键极速打包部署 | `--type`, `--entry`, `--dist` |
| `licell deploy check` | 本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行） | `--runtime`, `--entry`, `--docker-daemon` |
| `licell deploy spec [runtime]` | 查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照） | `--all` |
| `licell release list` | 查看函数版本列表 | `--limit` |
| `licell release promote [versionId]` | 发布并切流到目标别名 | `--target` |
| `licell release prune` | 清理历史函数版本（默认仅预览） | `--keep`, `--apply`, `--yes` |
| `licell release rollback <versionId>` | 回滚到指定函数版本 | `--target` |
| `licell logs` | 查看云端日志（默认实时流式） | `--once`, `--window`, `--lines` |
| `licell fn info [name]` | 查看函数详情 | `--target` |
| `licell fn invoke [name]` | 调用函数（同步） | `--target`, `--payload`, `--file` |
| `licell fn list` | 查看函数列表 | `--limit`, `--prefix` |
| `licell fn rm [name]` | 删除函数 | `--force`, `--yes` |
| `licell fn domain bind <domain>` | 绑定或更新 FC 自定义域名（资源级，不默认改 DNS） | `--function`, `--target`, `--path` |
| `licell fn domain info <domain>` | 查看 FC 自定义域名详情 | — |
| `licell fn domain list` | 查看 FC 自定义域名列表 | `--limit`, `--prefix` |
| `licell fn domain unbind <domain>` | 解绑 FC 自定义域名 | `--cleanup-dns`, `--yes` |
| `licell env list` | 查看云端环境变量 | `--target`, `--show-values` |
| `licell env pull` | 拉取云端环境变量 | `--target` |
| `licell env rm <key>` | 删除云端环境变量（并同步本地 .licell/project.json） | `--yes` |
| `licell env set <key> <value>` | 设置云端环境变量（并同步本地 .licell/project.json） | — |
| `licell domain app bind <domain>` | 为当前应用编排 DNS、函数域名与可选 SSL | `--ssl`, `--ssl-force-renew`, `--target` |
| `licell domain app unbind <domain>` | 解绑当前应用域名，并清理 FC custom domain / DNS CNAME | `--yes` |
| `licell domain static bind <domain>` | 为静态站点编排 CDN、DNS 与可选 HTTPS | `--bucket`, `--ssl`, `--ssl-force-renew` |
| `licell domain static unbind <domain>` | 解绑静态站点域名，并清理 CDN / DNS | `--yes` |
| `licell dns records add <domain>` | 添加域名解析记录 | `--rr`, `--type`, `--value` |
| `licell dns records list [domain]` | 查看域名解析记录 | `--limit` |
| `licell dns records rm <recordId>` | 删除域名解析记录 | `--yes` |
| `licell oss bucket [bucket]` | 上传本地目录到 OSS Bucket 指定目录（兼容命令，等同 oss upload） | `--bucket`, `--source-dir`, `--target-dir` |
| `licell oss create <bucket>` | 创建 OSS Bucket | `--acl`, `--storage-class`, `--redundancy` |
| `licell oss info <bucket>` | 查看 OSS Bucket 详情（含 ACL / 公共访问阻止 / 域名） | — |
| `licell oss list` | 查看 OSS Bucket 列表 | `--limit` |
| `licell oss ls <bucket> [prefix]` | 列出 Bucket 对象 | `--limit` |
| `licell oss rm <bucket>` | 删除 OSS Bucket（默认仅删空 Bucket） | `--recursive`, `--yes` |
| `licell oss update <bucket>` | 更新 OSS Bucket 属性（ACL / 公共访问阻止） | `--acl`, `--public-access-block` |
| `licell oss upload [bucket]` | 上传本地目录到 OSS Bucket 指定目录 | `--bucket`, `--source-dir`, `--target-dir` |
| `licell oss domain bind <bucket> <domain>` | 为 Bucket 绑定原生 OSS 自定义域名 | — |
| `licell oss domain list <bucket>` | 查看 Bucket 已绑定的原生 OSS 域名 | — |
| `licell oss domain token <bucket> <domain>` | 为 Bucket 自定义域名生成 TXT 验证 token | — |
| `licell oss domain unbind <bucket> <domain>` | 解绑 Bucket 原生 OSS 自定义域名 | `--yes` |
| `licell oss object get <bucket> <key> [file]` | 下载 OSS 对象到本地文件 | `--file` |
| `licell oss object info <bucket> <key>` | 查看 OSS 对象元数据 | — |
| `licell oss object rm <bucket> <key>` | 删除 OSS 对象 | `--yes` |
| `licell oss sync down <bucket> [prefix]` | 批量下载 Bucket 对象到本地目录 | `--dest-dir` |
| `licell oss sync up [bucket]` | 同步本地目录到 OSS Bucket（等同 oss upload） | `--bucket`, `--source-dir`, `--target-dir` |

#### Data Services

数据库、缓存与 Supabase 实例的创建、连接、白名单和生命周期管理。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell db add` | 分配数据库实例 | `--type`, `--engine-version`, `--category` |
| `licell db connect [instanceId]` | 输出数据库连接信息 | — |
| `licell db info <instanceId>` | 查看数据库实例详情 | — |
| `licell db list` | 查看数据库实例列表 | `--limit` |
| `licell db public-access [instanceId]` | 开通数据库公网访问并添加当前 IP 到白名单 | `--ip` |
| `licell db rm <instanceId>` | 删除数据库实例 | `--yes` |
| `licell cache add` | 分配 Redis 缓存 | `--type`, `--instance`, `--password` |
| `licell cache connect [instanceId]` | 输出缓存连接信息 | — |
| `licell cache info <instanceId>` | 查看缓存实例详情 | — |
| `licell cache list` | 查看缓存实例列表 | `--limit` |
| `licell cache public-access [instanceId]` | 开通 Redis 公网访问并添加当前 IP 到白名单 | `--ip` |
| `licell cache rm <instanceId>` | 删除缓存实例 | `--yes` |
| `licell cache rotate-password` | 轮换 Redis 密码 | `--instance` |
| `licell supa add` | 创建 RDS Supabase 实例 | `--name`, `--vsw`, `--class` |
| `licell supa config <instanceName>` | 查看 Supabase 实例配置（auth/storage/rag） | `--set-auth`, `--set-storage`, `--rag` |
| `licell supa connect <instanceName>` | 查看 Supabase 连接信息和 API Keys | — |
| `licell supa info <instanceName>` | 查看 Supabase 实例详情 | — |
| `licell supa list` | 查看 Supabase 实例列表 | `--limit` |
| `licell supa reset-password <instanceName>` | 重置 Supabase Dashboard 或数据库密码 | `--dashboard-password`, `--db-password` |
| `licell supa restart <instanceName>` | 重启 Supabase 实例 | — |
| `licell supa rm <instanceName>` | 删除 Supabase 实例 | `--yes` |
| `licell supa start <instanceName>` | 启动 Supabase 实例 | — |
| `licell supa stop <instanceName>` | 暂停 Supabase 实例 | — |
| `licell supa whitelist <instanceName>` | 查看/修改 Supabase IP 白名单 | `--set`, `--add`, `--remove` |

#### Automation & Tooling

面向 Agent、开发体验与 CLI 生命周期的自动化命令。

- `licell skills init` 与 `licell mcp` 都基于同一套 CLI 命令目录生成外部表面。
- `licell completion` 的候选命令同样来自共享命令目录。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell doctor` | 诊断本机 licell 登录态、云端权限/目标资源/域名入口、项目配置与部署前置条件 | `--runtime`, `--entry`, `--docker-daemon` |
| `licell mcp` | MCP：让 Agent 通过 licell 执行部署/发布/运维（默认先初始化，再启动 stdio server） | `--project-root`, `--server-name` |
| `licell mcp init` | 写入/更新项目内 `.mcp.json` 配置 | `--project-root`, `--server-name` |
| `licell mcp serve` | 以 stdio 方式启动 licell MCP server | `--project-root` |
| `licell skills init [agent]` | 为 AI Agent 生成 licell skills（claude / codex） | `--project-root`, `--force` |
| `licell setup` | 安装后引导：配置 AI Agent Skills 和 MCP | `--agent`, `--global`, `--project-root` |
| `licell completion [shell]` | 输出 shell 补全脚本（bash/zsh） | `--engine` |
| `licell upgrade` | 按当前安装来源升级 licell | `--channel`, `--target-version`, `--repo` |
| `licell e2e cleanup [runId]` | 清理指定 E2E run 产生的资源 | `--manifest`, `--keep-workspace`, `--yes` |
| `licell e2e list` | 查看本项目 e2e 运行记录 | — |
| `licell e2e run` | 执行固定 E2E 套件（默认 smoke） | `--suite`, `--run-id`, `--runtime` |

### 常用工作流片段

**Shell 补全（bash / zsh）**

```bash
mkdir -p ~/.local/share/licell/completions

# 生成 bash 补全脚本
licell completion bash > ~/.local/share/licell/completions/licell.bash
echo '[[ -f "$HOME/.local/share/licell/completions/licell.bash" ]] && source "$HOME/.local/share/licell/completions/licell.bash"' >> ~/.bashrc

# 生成 zsh 补全脚本
licell completion zsh > ~/.local/share/licell/completions/_licell
echo '[[ -f "$HOME/.local/share/licell/completions/_licell" ]] && source "$HOME/.local/share/licell/completions/_licell"' >> ~/.zshrc
```

**固定 E2E 套件（发布前建议）**

```bash
licell e2e run
licell e2e run --suite full
licell e2e run --enable-vpc
licell e2e run --runtime nodejs22 --domain-suffix your-domain.xyz --enable-cdn --cleanup
licell e2e list
licell e2e cleanup <runId>
```

说明：`licell e2e run --suite full` 现在会额外覆盖 DNS add/rm、OSS bucket/object CRUD、OSS 原生域名 token/bind/unbind、`domain app bind/unbind`、`deploy --type static --domain ...` 与 `domain static bind/unbind`。如需连同云上资源一起收口，建议配合 `--cleanup`。

**删除 / 清理说明**

- 涉及删除、解绑、清理的命令在非交互模式下通常需要显式传入 `--yes`。
- API 部署前建议固定执行 `licell deploy spec` 与 `licell deploy check`。
- `licell upgrade --dry-run` 可先查看当前安装来源与升级计划。
<!-- END GENERATED:README_QUICK_REFERENCE -->

---

## 什么时候该用什么

### 我只想尽快上线

```bash
licell login
licell init --runtime nodejs22
licell deploy --type api --target preview
```

### 我希望 Agent 自动、安全地部署

```bash
licell setup --agent codex --global
licell mcp init
licell deploy spec nodejs22 --output json
licell deploy check --runtime nodejs22 --entry src/index.ts --output json
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview --output json
```

### 我需要精细控制域名、DNS、OSS

```bash
licell dns records list bazhuayu.xyz
licell oss domain token my-bucket static.example.com
licell fn domain list
```

### 我准备正式发布前做真实校验

```bash
licell e2e run --suite full --cleanup
```

---

## 相关文档

- Agent surface 参考：`docs/reference/agent-surfaces.md`
- 场景教程：`docs/scenarios/`
- 示例项目：`examples/`

如果你把 Licell 当作“阿里云上的 Agent-first deployment runtime”，会更容易理解它现在的架构：

- workflow 优先
- 原子命令兜底
- 命令自描述
- MCP / skills / docs 共源收敛
