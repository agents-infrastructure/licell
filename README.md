# Licell CLI (`licell`)

面向阿里云的一体化部署 CLI，目标是把部署体验做成接近 Vercel CLI 的单主线工作流：

- 一个入口命令：`deploy`
- 一套项目配置：`.licell/project.json`
- 一条从开发到发布的路径：`init -> deploy -> release -> rollback`

默认面向中国区生产环境，默认地域 `cn-hangzhou`
（建议结合Agent使用的时候可以用一个独立的区域，不和生产放在同一个地域）。

---

### 🌟 核心亮点与最佳实践

1. **🚀 一键安装，开箱即用**：拒绝繁琐配置，极简的初始化与部署流程，最快 3
   行命令完成代码上线。
2. **🔌 原生支持 MCP 与 Skills**：内置 MCP (Model Context Protocol)
   Server，并支持为 Agent 生成专属的结构化指令文档 (Skills)。
3. **🪄 推荐使用 AI Coding Agent 托管部署**：强烈推荐在 **Cursor**、**Claude
   Code** 或 **Codex** 等 AI Coding Agent 中结合使用！利用 `licell mcp` 和
   `licell skills`，赋予 AI 操作阿里云环境的能力，让 AI
   帮你自动规划、执行并接管整个部署工作流。

---

## 安装

```bash
# 脚本一键安装
curl -fsSL https://github.com/agents-infrastructure/licell/releases/latest/download/install.sh | bash
```

## 你可以先看这 3 行（或直接敲 `licell`）

```bash
# 方式 A：直接运行 licell，将自动进入交互式的新手引导（登录 + Agent 设置）
licell

# 方式 B：手动执行
licell login --region cn-hangzhou
licell init --runtime nodejs22 && licell deploy --type api --target preview
```

## 📖 场景实战教程 (Tutorials)

如果您想全方位发掘 Licell 的能力，我们提供了 5
篇从零入门到高阶架构的场景实战系列：

1. [**[入门] 5分钟极速上线：从零部署你的第一个应用**](./docs/scenarios/01-quick-start.md)
2. [**[核心] 让 AI 为你打工：结合 Cursor / Claude 实现全自动运维**](./docs/scenarios/02-ai-driven-deployment.md)
3. [**[网络] 告别繁琐控制台：一行命令搞定自定义域名与 HTTPS**](./docs/scenarios/03-domain-and-https.md)
4. [**[数据] 告别工单：一键创建 Serverless 数据库与缓存**](./docs/scenarios/04-database-and-cache.md)
5. [**[进阶] 环境与隔离：像 Vercel 一样管理 Preview 与 Prod**](./docs/scenarios/05-environments-and-releases.md)

## MCP（让 Agent 驱动 licell）

Licell 内置 MCP（Model Context Protocol）stdio server，方便 Claude Code 等 Agent
直接调用 `licell` 执行部署/发布/查询/清理（默认仍以 `deploy` 为主线）。

### 一键 setup（推荐）

如果你刚安装完成，建议先跑一次：

```bash
# 交互式：选择 agent、作用域，并可选配置 MCP
licell setup

# 非交互示例：
licell setup --agent codex
licell setup --agent codex --global
licell setup --agent claude --global
```

`setup` 配置 MCP 时，按 Agent 写入对应配置文件：

- Claude 全局：`~/.claude/settings.local.json`
- Codex 全局：`~/.codex/config.toml`
- 项目级（Claude/Codex 通用）：`<project>/.mcp.json`

在你的业务项目根目录执行：

```bash
licell mcp init
```

会生成/更新项目内的 `.mcp.json`，默认内容类似：

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

调试时也可以手动启动 stdio server（会阻塞等待输入，这是正常的）：

```bash
licell mcp serve
```

### Agent 部署前置（FC API Spec / Check）

为了避免“部署成功但运行失败”（如 Python 缺少 `handler`），建议 Agent 在调用
`deploy` 前固定执行两步：

```bash
# 1) 读取 runtime 规格（entry / handler / 资源约束）
licell deploy spec nodejs22
# 或查看全部
licell deploy spec --all

# 2) 预检当前项目是否满足要求（会给出可执行修复建议）
licell deploy check --runtime nodejs22 --entry src/index.ts
```

说明：`deploy check` 仅做只读检测，不会自动修改项目文件。

`deploy spec --output json` 会返回适合 Agent 解析的字段：

- `handlerContract`（导出要求、签名、容器端口约束）
- `eventSchema` / `responseSchema`（请求事件与返回格式）
- `examples`（最小可通过示例、常见失败示例、修复提示）
- `validationRules`（对应预检规则 ID）

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

### Agent 可读输出（`--output json`）

为便于 Agent 自动诊断与修复，licell 支持结构化输出：

```bash
licell deploy --type api --output json
```

当启用该模式时，stdout 会输出带前缀的 JSON 记录（便于在混合日志中提取）：

- 前缀：`@@LICELL_JSON@@`
- 记录类型：`event` / `result` / `error`
- 字段：`schemaVersion`、`stage`、`error.code`、`error.category`、`retryable`、`provider.requestId`
  等
- 覆盖范围：除 `licell mcp serve`（stdio 协议保留原样）外，所有命令均支持
  `--output json`
- 安全默认：涉及凭证/环境变量时，默认输出脱敏值；仅在显式参数下返回完整值（如
  `env list --show-values`）

`licell mcp` 在调用 CLI 时会默认附加 `--output json`，并在 MCP 的
`structuredContent.records` 返回这些结构化记录。

### Agent Skills（让 Agent 了解 licell 命令）

MCP 让 Agent 能"调用" licell，而 Skills 让 Agent 能"理解" licell ——
生成一份结构化的命令参考文档，Agent 可以据此规划和执行部署任务。

```bash
# Claude Code
licell skills init claude
# → .claude/skills/licell/SKILL.md + AGENTS.md

# OpenAI Codex
licell skills init codex
# → codex.md + AGENTS.md
```

支持 `--force` 覆盖已有文件，重复执行会自动跳过内容相同的文件。

## 目录

- [Licell CLI (`licell`)](#licell-cli-licell)
  - [你可以先看这 3 行](#你可以先看这-3-行)
  - [MCP（让 Agent 驱动 licell）](#mcp让-agent-驱动-licell)
    - [一键 setup（推荐）](#一键-setup推荐)
    - [Agent 部署前置（FC API Spec / Check）](#agent-部署前置fc-api-spec--check)
    - [Agent 可读输出（`--output json`）](#agent-可读输出--output-json)
    - [Agent Skills（让 Agent 了解 licell 命令）](#agent-skills让-agent-了解-licell-命令)
  - [目录](#目录)
  - [1. 安装与升级（最快路径）](#1-安装与升级最快路径)
  - [2. 第一次部署（5 分钟）](#2-第一次部署5-分钟)
    - [2.1 在业务目录初始化](#21-在业务目录初始化)
    - [2.2 登录阿里云](#22-登录阿里云)
    - [2.3 部署 API（FC）](#23-部署-apifc)
    - [2.4 绑定固定域名 + HTTPS（可选）](#24-绑定固定域名--https可选)
  - [3. `init` 模板（与 `examples` 同级）](#3-init-模板与-examples-同级)
  - [4. 示例工程（推荐先跑通）](#4-示例工程推荐先跑通)
  - [5. 部署模型（API / Static）](#5-部署模型api--static)
    - [5.1 API 部署（FC）](#51-api-部署fc)
    - [5.2 静态站部署（OSS）](#52-静态站部署oss)
    - [5.3 在哪个目录执行命令](#53-在哪个目录执行命令)
  - [6. 日常命令速查](#6-日常命令速查)
  - [7. 进阶：运行时细节](#7-进阶运行时细节)
    - [7.1 Node 22 (`nodejs22`)](#71-node-22-nodejs22)
    - [7.2 Python 3.13 (`python3.13`)](#72-python-313-python313)
    - [7.3 Docker runtime](#73-docker-runtime)
  - [8. 进阶：固定域名与 HTTPS](#8-进阶固定域名与-https)
  - [9. 进阶：数据库与缓存](#9-进阶数据库与缓存)
    - [9.1 Serverless 数据库（RDS）](#91-serverless-数据库rds)
    - [9.2 Serverless 缓存（Tair/Redis）](#92-serverless-缓存tairredis)
  - [10. 进阶：发布、回滚、清理](#10-进阶发布回滚清理)
  - [11. CI/CD（非交互）](#11-cicd非交互)
  - [12. 常用环境变量](#12-常用环境变量)
  - [13. 开发者与维护者](#13-开发者与维护者)
    - [13.1 从源码开发](#131-从源码开发)
    - [13.2 构建发布资产](#132-构建发布资产)
    - [13.3 GitHub Release 自动流程](#133-github-release-自动流程)
  - [14. 常见问题](#14-常见问题)

## 1. 安装与升级（最快路径）

一键安装（默认安装到 `~/.local/bin/licell`）：

```bash
curl -fsSL https://github.com/agents-infrastructure/licell/releases/latest/download/install.sh | bash
```

安装脚本会尝试把 `~/.local/bin` 写入当前 shell 的启动文件；当前这个终端会话仍需重新打开，或手动执行：

```bash
export PATH="$HOME/.local/bin:$PATH"
licell --version
```

升级：

```bash
licell upgrade
# 或指定版本
licell upgrade --target-version vX.Y.Z
# 或显式指定升级渠道
licell upgrade --channel release
```

安装逻辑说明：

<!-- BEGIN GENERATED:README_UPGRADE_GUIDANCE -->
- `licell upgrade` 会优先按“当前正在执行的安装来源”升级
- 如果当前是 `npm` / `pnpm` / `yarn` / `bun` 全局安装，会调用对应包管理器执行全局升级
- 如果当前是项目内依赖、`node_modules/.bin/licell` 或开发链接，默认不会自动做全局升级
- 安装脚本和二进制都来自同一个 `releases/latest`，优先下载预构建单文件可执行；若当前平台暂无预构建资产，自动回退源码安装
- 如显式传入 `--repo` 或 `--script-url`，则强制走 GitHub release 升级渠道
- 可通过 `--channel auto|release|npm|pnpm|yarn|bun` 显式覆盖升级渠道；推荐先用 `licell upgrade --dry-run` 预览计划
<!-- END GENERATED:README_UPGRADE_GUIDANCE -->

开发调试可用（不建议生产）：

```bash
curl -fsSL https://raw.githubusercontent.com/agents-infrastructure/licell/main/install.sh | bash
```

## 2. 第一次部署（5 分钟）

### 2.1 在业务目录初始化

```bash
mkdir my-licell-app && cd my-licell-app
licell init --runtime nodejs22
```

### 2.2 登录阿里云

```bash
licell login --region cn-hangzhou
```

如果你不想手工配置 RAM 权限，推荐 bootstrap 模式：

```bash
licell login \
  --account-id <accountId> \
  --ak <super-ak> \
  --sk <super-sk> \
  --region cn-hangzhou \
  --bootstrap-ram
```

说明：

- `--bootstrap-ram` 会用你提供的高权限 AK/SK 自动创建 licell 专用 RAM
  用户、策略和 AccessKey
- 本地只保存新创建的 licell 专用 key，不保存输入的高权限 key
- bootstrap 成功后即完成登录，不需要再执行一次 `licell login`
- 高权限（超级）AK/SK 可在 `https://ram.console.aliyun.com/profile/access-keys`
  获取
- Docker 部署遇到 ACR 个人版未注册场景时，licell 会自动为当前 RAM 用户初始化 ACR
  用户信息再继续部署
- 如需自定义命名：`--bootstrap-user <name>` `--bootstrap-policy <name>`

### 2.3 部署 API（FC）

建议在第一次 deploy 前先做一轮规格读取与预检：

```bash
licell deploy spec nodejs22
licell deploy check --runtime nodejs22 --entry src/index.ts
```

```bash
licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview
```

部署成功会输出：

- `*.fcapp.run` 访问地址
- alias 切流结果（例如 `preview -> version`）

### 2.4 绑定固定域名 + HTTPS（可选）

```bash
licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain-suffix your-domain.xyz \
  --ssl
```

也可以直接指定完整域名（不走 `<appName>.suffix` 规则）：

```bash
licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain api.your-domain.xyz
```

域名绑定后启用 CDN 加速：

```bash
licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain-suffix your-domain.xyz \
  --enable-cdn
```

## 3. `init` 模板（与 `examples` 同级）

`init` 现在生成的是“可直接展示能力”的完整模板，不是 hello world。

| runtime                     | 模板       | 主要内容                                                  |
| --------------------------- | ---------- | --------------------------------------------------------- |
| `nodejs20` / `nodejs22`     | Express    | `/healthz` `/meta` `/todos` `/math/sum` + FC handler 适配 |
| `python3.12` / `python3.13` | Flask      | 同等 API + FC handler 适配                                |
| `docker`                    | Bun + Hono | 同等 API + Dockerfile                                     |

常用初始化方式：

```bash
# 默认 nodejs20
licell init

# Node 22
licell init --runtime nodejs22

# Python 3.13
licell init --runtime python3.13

# Docker (Bun + Hono)
licell init --runtime docker
```

行为规则：

- 空目录：生成脚手架 + 写入 `.licell/project.json`
- 已有项目目录：默认仅写配置，不改业务代码
- 已有目录强制覆盖模板：`licell init --runtime <runtime> --force`

## 4. 示例工程（推荐先跑通）

在仓库中有 4 个对齐示例：

- `examples/node22-express-api`
- `examples/python313-flask-api`
- `examples/docker-bun-hono-api`
- `examples/static-oss-site`

示例说明见 `examples/README.md`。

快速试跑（API 示例，任选其一）：

```bash
cd examples/node22-express-api
licell login
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
```

快速试跑（静态站示例）：

```bash
cd examples/static-oss-site
licell login
licell deploy --type static
```

## 5. 部署模型（API / Static）

### 5.1 API 部署（FC）

```bash
licell deploy --type api --entry src/index.ts --runtime nodejs20
licell deploy --type api --entry src/main.py --runtime python3.13
licell deploy --type api --runtime docker --target preview
```

常见资源参数：

```bash
licell deploy --type api --runtime nodejs22 \
  --memory 1024 \
  --vcpu 1 \
  --instance-concurrency 20 \
  --timeout 60
```

默认值：

- `--memory` 默认 `512`
- `--vcpu` 默认 `0.5`
- `--instance-concurrency` 默认自动（通常起始 `10`）
- `--timeout` 默认 `30`

网络参数：

- API 部署默认启用 VPC（会自动创建/复用 `licell-vpc` 与 `licell-vsw` 并写入
  `.licell/project.json`）
- 如需公网模式可显式关闭：`licell deploy --type api --disable-vpc`

支持运行时：

- `nodejs20`
- `nodejs22`
- `python3.12`
- `python3.13`
- `docker`

### 5.2 静态站部署（OSS）

```bash
licell deploy --type static --dist dist
# 等价写法：
licell deploy --runtime static --dist dist
# 兼容别名：statis
licell deploy --runtime statis --dist dist
```

静态站绑定域名（自动 CDN + 默认 HTTPS）：

```bash
# 固定子域名
licell deploy --type static --domain-suffix your-domain.xyz

# 完整域名
licell deploy --type static --domain static.your-domain.xyz
```

说明：`static` 模式下只要提供 `--domain` 或 `--domain-suffix`，会自动接入
CDN，并回源到 OSS 地址，同时默认启用 HTTPS 证书签发与 CDN 证书配置。

`--dist` 省略时自动探测：

- 当前目录有 `index.html` -> 用当前目录 `.`
- 否则按常见目录探测：`dist` `build` `out` `public` `www` `site`
  `.output/public`
- 未命中时回退 `dist`

### 5.3 在哪个目录执行命令

`licell` 的项目状态基于当前目录：

- 项目配置：`<project>/.licell/project.json`
- 全局认证：`~/.licell-cli/auth.json`

## 6. 日常命令速查

<!-- BEGIN GENERATED:README_QUICK_REFERENCE -->
> 本节由 licell CLI 注册表自动生成；命令变更会同步到 README / docs/reference/agent-surfaces.md / Skills / MCP / Shell Completion。

### 命令总览

#### Setup & Identity

认证、项目初始化与默认配置相关命令。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell login` | 配置阿里云凭证 | `--account-id`, `--ak`, `--sk` |
| `licell auth repair` | 修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用） | `--account-id`, `--ak`, `--sk` |
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

**删除 / 清理说明**

- 涉及删除、解绑、清理的命令在非交互模式下通常需要显式传入 `--yes`。
- API 部署前建议固定执行 `licell deploy spec` 与 `licell deploy check`。
- `licell upgrade --dry-run` 可先查看当前安装来源与升级计划。
<!-- END GENERATED:README_QUICK_REFERENCE -->

## 7. 进阶：运行时细节

### 7.1 Node 22 (`nodejs22`)

- 映射到 FC `custom.debian12`
- 自动下载并缓存 Node22 Linux x64 运行时到：`~/.licell-cli/runtimes/node22`
- 部署时随代码包上传 runtime + bootstrap

可用环境变量：

- `LICELL_NODE22_SHASUMS_URL`
- `LICELL_RUNTIME_CACHE_DIR`

### 7.2 Python 3.13 (`python3.13`)

- 映射到 FC `custom.debian12`
- 自动下载并缓存 Python3.13 Linux x64
  运行时到：`~/.licell-cli/runtimes/python313`
- 入口必须是 `.py` 且包含 `handler(event, context)`

可用环境变量：

- `LICELL_PYTHON313_RELEASE_API_URL`
- `LICELL_PYTHON313_TARBALL_URL`
- `LICELL_PYTHON313_SHA256`
- `LICELL_RUNTIME_CACHE_DIR`

### 7.3 Docker runtime

- 使用本地 Docker 构建镜像并推送到 ACR
- 若 ACR 个人版 namespace 达上限，显式使用已有 namespace：

```bash
licell deploy --type api --runtime docker --acr-namespace <existing-namespace>
```

## 8. 进阶：固定域名与 HTTPS

固定域名（按 `appName` + suffix 自动生成）：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz
```

会绑定为：`<appName>.your-domain.xyz`

完整自定义域名（手动指定）：

```bash
licell deploy --type api --target preview --domain api.your-domain.xyz
```

HTTPS：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz --ssl
# 强制续签
licell deploy --type api --target preview --domain-suffix your-domain.xyz --ssl --ssl-force-renew
```

或完整域名：

```bash
licell deploy --type api --target preview --domain api.your-domain.xyz
```

说明：

- `--domain` 与 `--domain-suffix` 不能同时使用
- API 部署：使用 `--domain` 或 `--enable-cdn` 时默认自动开启
  HTTPS（`--domain-suffix` 需配合 `--ssl` 或 `--enable-cdn`）
- Static 部署：提供 `--domain` 或 `--domain-suffix` 时，默认自动开启
  HTTPS，并自动接入 CDN 回源 OSS
- `--enable-cdn` 在 API 场景下表示显式开启；Static 提供域名时默认开启
- 默认续签阈值 30 天
- 域名需托管在阿里云 DNS

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

## 9. 进阶：数据库与缓存

### 9.1 Serverless 数据库（RDS）

```bash
licell db add --type postgres
licell db list
licell db info <instanceId>
licell db connect [instanceId]
```

进阶参数示例：

```bash
licell db add \
  --type postgres \
  --engine-version 18.0 \
  --category serverless_basic \
  --class pg.n2.serverless.1c \
  --storage 20 \
  --storage-type cloud_essd \
  --min-rcu 0.5 \
  --max-rcu 8 \
  --auto-pause on \
  --zone cn-hangzhou-b
```

成功后会把连接串写入项目环境变量 `DATABASE_URL`。

### 9.2 Serverless 缓存（Tair/Redis）

```bash
licell cache add --type redis
licell cache list
licell cache info <instanceId>
licell cache connect [instanceId]
licell cache rotate-password --instance <instanceId>
```

指定规格示例：

```bash
licell cache add --type redis --class kvcache.cu.g4b.2 --compute-unit 1
```

成功后会写入：

- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_USERNAME`

## 10. 进阶：发布、回滚、清理

推荐发布流：

1. `deploy --target preview`
2. 验证 preview
3. `release promote --target prod`
4. 异常时 `release rollback <versionId> --target prod`

历史版本清理：

```bash
licell release prune --keep 10       # 预览
licell release prune --keep 10 --apply
```

## 11. CI/CD（非交互）

```bash
export LICELL_ACCOUNT_ID=xxxxxxxxxxxx
export LICELL_ACCESS_KEY_ID=xxxxxxxxxxxx
export LICELL_ACCESS_KEY_SECRET=xxxxxxxxxxxx
export LICELL_REGION=cn-hangzhou

cd /path/to/your-app

licell login \
  --account-id "$LICELL_ACCOUNT_ID" \
  --ak "$LICELL_ACCESS_KEY_ID" \
  --sk "$LICELL_ACCESS_KEY_SECRET" \
  --region "$LICELL_REGION"

licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain api.your-domain.xyz
```

## 12. 常用环境变量

| 变量                               | 作用                                    | 默认值                   |
| ---------------------------------- | --------------------------------------- | ------------------------ |
| `LICELL_ACCOUNT_ID`                | 非交互登录 Account ID                   | -                        |
| `LICELL_ACCESS_KEY_ID`             | 非交互登录 AK                           | -                        |
| `LICELL_ACCESS_KEY_SECRET`         | 非交互登录 SK                           | -                        |
| `LICELL_REGION`                    | 默认地域                                | `cn-hangzhou`            |
| `LICELL_DOMAIN_SUFFIX`             | 默认固定域名后缀                        | -                        |
| `LICELL_FC_RUNTIME`                | 默认 FC runtime                         | `nodejs20`               |
| `LICELL_BINARY_URL`                | 安装脚本指定二进制地址                  | latest release 资产      |
| `LICELL_ARCHIVE_URL`               | 安装脚本源码回退地址                    | repo main tarball        |
| `LICELL_GITHUB_TOKEN`              | 安装脚本访问私有源 token                | -                        |
| `LICELL_FC_CONNECT_TIMEOUT_MS`     | FC API 连接超时                         | `60000`                  |
| `LICELL_FC_READ_TIMEOUT_MS`        | FC API 读超时                           | `600000`                 |
| `LICELL_SSL_RENEW_BEFORE_DAYS`     | SSL 续签阈值天数                        | `30`                     |
| `LICELL_SSL_DNS_READY_TIMEOUT_MS`  | DNS TXT 生效等待超时                    | `180000`                 |
| `LICELL_SSL_SKIP_CHALLENGE_VERIFY` | 设为 `0` 启用本地 challenge verify      | `1`                      |
| `LICELL_RUNTIME_CACHE_DIR`         | 自定义运行时缓存目录                    | `~/.licell-cli/runtimes` |
| `LICELL_PYTHON_REQUIREMENTS`       | 指定 Python 依赖文件                    | 自动探测                 |
| `LICELL_PYTHON_PIP`                | 指定 pip 对应解释器                     | `python3`                |
| `LICELL_PYTHON_ALLOW_SOURCE`       | wheel 失败后允许源码安装                | `0`                      |
| `LICELL_PYTHON_SKIP_VENDOR`        | 跳过 Python 依赖自动打包                | `0`                      |
| `LICELL_NODE22_SHASUMS_URL`        | Node22 SHASUMS 覆盖地址                 | 官方+镜像                |
| `LICELL_PYTHON313_RELEASE_API_URL` | Python3.13 runtime release API 覆盖地址 | 官方地址                 |
| `LICELL_PYTHON313_TARBALL_URL`     | Python3.13 runtime 包地址               | -                        |
| `LICELL_PYTHON313_SHA256`          | Python3.13 runtime 包校验               | -                        |

兼容性：仍兼容读取旧前缀 `ALI_*`，建议迁移到 `LICELL_*`。

## 13. 开发者与维护者

### 13.1 从源码开发

```bash
cd <licell-repo-dir>
bun install
bun run build:bin
./licell --help
```

本地质量检查：

```bash
bun run typecheck
bun run test
bun run build
```

### 13.2 构建发布资产

```bash
bun run build:standalone
```

说明：

- standalone 产物基于 Node 官方 SEA（Single Executable Applications）链路构建
- 兼容新链路：优先 `node --build-sea`，低版本 Node 自动回退
  `--experimental-sea-config + postject`
- 本地构建需 Node >= 20

产物：

- `dist/licell-<os>-<arch>`
- `dist/licell-<os>-<arch>.tar.gz`

### 13.3 GitHub Release 自动流程

工作流：`.github/workflows/release.yml`

- `push v*` tag：自动 `typecheck + test`，构建多平台资产并发布 release
- `workflow_dispatch`：手动指定 `tag` 和 `ref`

常规发布：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 14. 常见问题

`zsh: command not found: licell`

- 重新执行安装脚本
- 安装脚本会尝试写入 shell 启动文件，但不会修改当前父 shell 的环境变量
- 重新打开终端，或执行 `export PATH="$HOME/.local/bin:$PATH"`

`licell login` 在哪执行？

- 任意目录都可以（写入 `~/.licell-cli/auth.json`）
- 但建议在业务目录执行后直接 `deploy`

不熟悉 RAM 权限怎么配？

- 可以直接使用 `licell login --bootstrap-ram`
- licell 会自动创建专用 RAM 用户和策略，并切换到新 key
- 需要你提供一次可创建 RAM 资源的高权限
  AK/SK（获取地址：`https://ram.console.aliyun.com/profile/access-keys`）
- licell 不会保存你输入的高权限 key，只保存新创建的 licell 专用 key
- bootstrap 完成后无需再次 `login`

`--help` 看不到某些子命令？

- 通常是本地版本过旧
- 执行：

```bash
licell upgrade
licell --help
```

`nodejs22` / `python3.13` 报地域不支持？

- 这两个 runtime 依赖 FC `custom.debian12`
- 可切回 `nodejs20` 或换支持地域
