# Licell CLI (`licell`)

[English README](./README.en.md)

Licell 是一个面向阿里云的部署与运维 CLI，同时兼顾人类用户与 AI Agent。

它不是把一堆云资源命令简单堆在一起，而是围绕一条主线工作流来设计：

- 一个主入口：`deploy`
- 一份项目状态：`.licell/project.json`
- 一套可组合的资源原子命令：`fn` / `oss` / `dns` / `domain`
- 一套面向 Agent 的统一表面：`catalog` / `--help` / `--output json` / `skills`

默认地域为 `cn-hangzhou`。用于 Agent 自动化时，建议使用独立测试账号或独立地域，不要直接共用生产环境。团队协作下，推荐采用后文的“团队授权分发”模式。

---

## 这是什么

如果你把 Vercel CLI 的“单主线体验”搬到阿里云，大致就是 Licell 想做的事情：

- **人类友好**：`init -> deploy -> release -> rollback`
- **Agent 友好**：命令自描述、结构化帮助、结构化输出、catalog、skills
- **架构清晰**：workflow 命令负责“得到结果”，原子命令负责“精确控制资源”

Licell 当前覆盖的核心能力包括：

- FC API 部署与发布
- FC Task 部署、异步触发与任务追踪
- OSS 静态站部署
- 自定义域名、HTTPS、CDN、DNS
- ACR / Docker 镜像部署
- Serverless 数据库与缓存辅助能力
- 面向 Agent 的 Skills / catalog / JSON 输出 / 文档共源生成

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

- CLI `catalog`
- CLI `--help`
- 结构化 help
- skills 脚手架
- README 生成区块
- Agent surface 文档
- shell completion

也就是说：**命令面变了，catalog、帮助、skills、文档会跟着一起收敛**。

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

### 给 Task 项目

```bash
licell login --region cn-hangzhou
licell init --runtime nodejs22 --kind task
licell deploy --type task --target preview
licell task invoke <appName> --target preview --payload '{"job":"demo"}'
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
| 项目状态 | `<project>/.licell/project.json` | appName、环境变量、网络、部署状态；也可在 repo 根切换为 workspace 形式管理多个 component |

兼容性说明：

- Licell 仍兼容历史上的 `~/.ali-cli/auth.json` 等旧路径
- 当前主路径以 `~/.licell-cli/*` 为准

### Workspace / Monorepo

当同一个 repo 里有多个可部署目录（例如 `apps/web` 静态站 + `apps/api` FC API）时，
推荐在 repo 根维护一份 workspace 形态的 `.licell/project.json`：

```json
{
  "defaultComponent": "api",
  "components": {
    "web": {
      "path": "apps/web",
      "appName": "demo-web",
      "deployType": "static",
      "dist": "dist",
      "domain": "www.example.com"
    },
    "api": {
      "path": "apps/api",
      "appName": "demo-api",
      "deployType": "api",
      "runtime": "nodejs22",
      "entry": "src/index.ts",
      "target": "prod"
    }
  }
}
```

- 在 `apps/web` 目录执行 `licell deploy` 时，会自动解析到 `web` component。
- 在 `apps/api` 目录执行 `licell deploy` 时，会自动解析到 `api` component。
- deploy 成功后，Licell 会把稳定重跑所需的 deploy intent（如 `domain` / `domainSuffix` / `entry` / `dist` / `target` / `enableCdn` / `enableSSL` / `useVpc`）回写到对应 component，而不是只写少量字段。

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

几乎所有命令都支持结构化 JSON 结果：

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

## 3) 命令目录 `catalog`

如果你希望 Claude Code、Codex、Cursor 等 Agent 直接驱动 `licell`，推荐走这条固定链路：

```bash
licell catalog --output json
licell deploy --help --output json
licell deploy --type api --output json
```

含义分别是：

- `catalog`：发现稳定 command key、选项、schema 与 CLI record contract
- `--help --output json`：读取单命令的参数、结果、推荐流程与下一步
- `--output json`：真正执行命令，并消费 `event / result / error` records

## 4) Skills

如果你希望 Agent 在项目里拥有一份更偏“执行说明书”的上下文，可以生成 skills：

```bash
licell skills init codex
licell skills init claude
licell skills init codex --global
```

默认会把 skills 写入当前项目；只有显式传 `--global` 时，才会写到用户级全局技能目录。

`licell setup` 是交互式包装命令，底层仍然复用同一套 skills 写入逻辑。

Skills 与 catalog、help、README 共享同一套命令描述体系，所以更容易保持一致。

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
- `examples/node22-task-worker`
- `examples/python313-task-worker`
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
> 本节由 licell CLI 注册表自动生成；命令变更会同步到 README / docs/reference/agent-surfaces.md / Skills / Shell Completion。

### Agent Contract

- 发现命令目录：`licell catalog --output json`。
- 读取单命令契约：`licell <command> --help --output json`。
- 真正执行命令：`licell <command> --output json`，并过滤 `@@LICELL_JSON@@` 前缀逐行解析。
- 对 `type=event` 的 record，优先读取稳定字段 `stage` / `action` / `status` / `source` / `terminal`。
- 对 `type=error` 的 record，优先读取 `nextActions[]` 获取首选补救步骤。

#### Schema Contracts

- 原始 CLI JSON 流会使用前缀 `@@LICELL_JSON@@` 输出逐行 JSON record；每条 record 当前都满足 `licell-cli-record@1.0`，再通过 `type=event|result|error` 区分记录类型。
- `licell <command> --help --output json`：读取 `help.kind` / `help.schemaVersion`；当前为 `licell-help@1.0`。
- `licell catalog --output json`：读取 `kind` / `schemaVersion`；当前为 `licell-agent-command-catalog@1.0`。
- `licell catalog --output json` 还会显式声明 help schema 与 CLI record schema：`licell-help@1.0` / `licell-cli-record@1.0`。
- Agent 优先读取 `nextActions[]` 作为稳定下一步入口；`recommendedFlow` / `decisionGuide` / `remediation[]` 作为补充语义层。
- 命令自己的业务结果字段继续读取对应命令 help / catalog 里的 `result`；下面三组 contract 只描述公共 CLI record 包络。

### CLI Event Record · licell-cli-record@1.0

- CLI 流式事件 record；适合驱动 Agent 的进度感知、日志桥接和阶段判断。
- `kind`：固定为 `licell-cli-record`。
- `schemaVersion`：CLI record schema 版本；当前为 `1.0`。
- `type`：固定为 `event`。
- `ts`：事件发出时间（ISO 8601）。
- `command`：当前命令 key，例如 `deploy`、`oss upload`。
- `stage`：稳定阶段标识，例如 `deploy`、`deploy.api`、`auth.restore`。
- `action`：稳定动作标识，例如 `run`、`execute`、`stdout`。
- `status`：`start` / `ok` / `failed` / `skipped` / `info`。
- `source`：`command` / `console` / `stream`。
- `terminal`：该事件是否代表当前动作进入终态。
- `ok`（可选）：仅在终态成功/失败事件中出现；`true` 表示成功，`false` 表示失败。
- `message`（可选）：面向人类的补充消息。
- `data`（可选）：附加结构化上下文对象。
  - `stream`（可选）：当 `action=stdout|stderr` 时给出流类型。

### CLI Result Record Envelope

- CLI 成功结果 record；公共包络固定，命令自定义 payload 字段请继续读取对应命令 help/catalog 中的 `result`。
- `kind`：固定为 `licell-cli-record`。
- `schemaVersion`：CLI record schema 版本；当前为 `1.0`。
- `type`：固定为 `result`。
- `ts`：结果发出时间（ISO 8601）。
- `command`：当前命令 key。
- `stage`：命令阶段标识；通常与命令 key 或子阶段一致。
- `ok`：固定为 `true`。

### CLI Error Record

- CLI 错误结果 record；同时提供兼容层 remediation/nextCommands 和首选的 nextActions。
- `kind`：固定为 `licell-cli-record`。
- `schemaVersion`：CLI record schema 版本；当前为 `1.0`。
- `type`：固定为 `error`。
- `ts`：错误发出时间（ISO 8601）。
- `command`：当前命令 key。
- `stage`：错误阶段，例如 `parse`、`runtime`、`deploy`。
- `ok`：固定为 `false`。
- `error`：稳定错误对象。
  - `code`：稳定错误码，例如 `CLI_INVALID_INPUT`、`AUTH_MISSING_CREDENTIAL`。
  - `category`：`auth` / `permission` / `input` / `network` / `quota` / `conflict` / `not_found` / `internal`。
  - `message`：错误主消息。
  - `retryable`：该错误是否适合直接重试。
- `provider`（可选）：阿里云 provider 侧上下文。
  - `service`（可选）：云产品名，例如 `fc`、`oss`、`alidns`。
  - `action`（可选）：云 API 动作名。
  - `code`（可选）：云侧原始错误码。
  - `requestId`（可选）：云侧 requestId。
  - `httpStatus`（可选）：云侧 HTTP 状态码。
  - `endpoint`（可选）：命中的云 API endpoint。
- `details`（可选）：额外结构化错误上下文。
- `remediation[]`：兼容层修复建议数组。
  - `type`：建议类型，例如 `note` / `command`。
  - `title`：修复建议标题。
  - `reason`：为什么建议这样做。
  - `commandTemplate`：建议命令模板。
  - `commandKey`（可选）：若可匹配 CLI 注册表，则给出稳定 command key。
  - `commandDescription`（可选）：匹配到的命令说明。
  - `phase`：修复阶段，例如 `inspect` / `mutate` / `verify`。
  - `priority`：`primary` / `secondary`。
  - `order`：稳定排序值。
- `nextCommands[]`：兼容层命令建议数组。
  - `commandTemplate`：建议命令模板。
  - `commandKey`（可选）：若可匹配 CLI 注册表，则给出稳定 command key。
  - `description`（可选）：命令建议说明。
  - `intent`：命令意图，例如 `inspect` / `repair` / `bind`。
  - `priority`：`primary` / `secondary`。
- `nextActions[]`：推荐优先消费的统一下一步数组。
  - `title`：下一步动作标题。
  - `description`：为什么建议执行这一步。
  - `commandTemplate`：建议命令模板。
  - `commandKey`（可选）：若可匹配 CLI 注册表，则给出稳定 command key。
  - `phase`：动作阶段，例如 `inspect` / `verify` / `mutate`。
  - `priority`：`primary` / `secondary`。
  - `source`：动作来源，例如 `error-remediation`。

- Agent 侧做强约束解析时，先匹配 `kind`，再检查 `schemaVersion`；未知更高版本应走兼容分支或降级为文本解析。

### 命令总览

#### Setup & Identity

认证、项目初始化与默认配置相关命令。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell login` | 配置阿里云凭证 | `--account-id`, `--ak`, `--sk` |
| `licell auth export [passkey]` | 加密打包当前 licell 全局凭证状态到私有 OSS，并生成 restore token | `--bucket`, `--expires`, `--expires-hours` |
| `licell auth inspect <token>` | 解析并查看 restore token 的内容与有效期 | — |
| `licell auth repair` | 修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用） | `--account-id`, `--ak`, `--sk` |
| `licell auth restore <token> [passkey]` | 使用 restore token + passkey 一键恢复 licell 全局凭证状态 | `--yes` |
| `licell logout` | 清除本地凭证 | — |
| `licell whoami` | 查看当前登录身份 | — |
| `licell switch` | 切换默认 region | `--region` |
| `licell init` | 初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置） | `--runtime`, `--kind`, `--app` |
| `licell bootstrap` | 把已确认的部署方案初始化到 `.licell/project.json` / `.licell/state.json` | `--component`, `--path`, `--type` |
| `licell workspace discover` | 扫描 repo，给出候选 components 与部署提案 | — |
| `licell workspace doctor` | 在 workspace / monorepo 根目录诊断全部或指定 component | `--component`, `--runtime`, `--entry` |
| `licell workspace init` | 在 repo 根目录创建或更新 licell workspace component | `--component`, `--path`, `--type` |
| `licell workspace list` | 列出当前 repo / workspace 中可部署的 components | `--component` |
| `licell workspace migrate` | 把旧单项目 `.licell/project.json` 升级成兼容旧版的 workspace/component 格式 | `--component`, `--path`, `--default` |
| `licell config domain [suffix]` | 查看或设置全局默认域名后缀 | `--unset` |

#### Delivery Workflow

围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。

- Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。
- 涉及删除或清理的命令通常需要显式传入 `--yes`。
- 任务函数通过 `licell deploy --type task` 交付；部署成功后不返回固定 URL，而是继续用 `licell task invoke / info / list / stop` 完成调用与排查。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell deploy` | 一键极速打包部署 | `--component`, `--type`, `--entry` |
| `licell deploy check` | 本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行） | `--runtime`, `--entry`, `--docker-daemon` |
| `licell deploy plan` | 基于 `.licell/project.json` 生成部署计划（不执行云端变更） | `--component`, `--include`, `--exclude` |
| `licell deploy spec [runtime]` | 查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照） | `--all` |
| `licell task config [name]` | 查看任务函数的异步调用配置 | `--component`, `--target` |
| `licell task info <taskId> [name]` | 查看单个异步任务详情 | `--component`, `--target` |
| `licell task invoke [name]` | 异步调用任务函数 | `--component`, `--target`, `--payload` |
| `licell task list [name]` | 查看任务函数的异步任务列表 | `--component`, `--target`, `--status` |
| `licell task stop <taskId> [name]` | 停止正在运行的异步任务 | `--component`, `--target` |
| `licell task config rm [name]` | 删除任务函数的异步调用配置 | `--component`, `--target`, `--yes` |
| `licell task config set [name]` | 写入任务函数的异步调用配置 | `--component`, `--target`, `--enable` |
| `licell release list` | 查看函数版本列表 | `--component`, `--limit` |
| `licell release promote [versionId]` | 发布并切流到目标别名 | `--component`, `--target` |
| `licell release prune` | 清理历史函数版本（默认仅预览） | `--component`, `--keep`, `--apply` |
| `licell release rollback <versionId>` | 回滚到指定函数版本 | `--component`, `--target` |
| `licell logs query [query]` | 按 SLS project/logstore/query 一次性检索日志 | `--project`, `--store`, `--region` |
| `licell logs tail [query]` | 按 SLS project/logstore/query 持续跟随日志流 | `--project`, `--store`, `--region` |
| `licell fn info [name]` | 查看函数详情 | `--component`, `--target` |
| `licell fn invoke [name]` | 调用函数（同步） | `--component`, `--target`, `--payload` |
| `licell fn list` | 查看函数列表 | `--limit`, `--prefix` |
| `licell fn logs [name]` | 查看函数日志（默认实时流式） | `--component`, `--once`, `--window` |
| `licell fn rm [name]` | 删除函数 | `--component`, `--force`, `--yes` |
| `licell fn domain bind <domain>` | 绑定或更新 FC 自定义域名（资源级，不默认改 DNS） | `--function`, `--component`, `--target` |
| `licell fn domain info <domain>` | 查看 FC 自定义域名详情 | — |
| `licell fn domain list` | 查看 FC 自定义域名列表 | `--limit`, `--prefix` |
| `licell fn domain unbind <domain>` | 解绑 FC 自定义域名 | `--cleanup-dns`, `--yes` |
| `licell env list` | 查看云端环境变量 | `--component`, `--target`, `--show-values` |
| `licell env pull` | 拉取云端环境变量 | `--component`, `--target` |
| `licell env rm <key>` | 删除云端环境变量（并同步本地 .licell/project.json） | `--component`, `--yes` |
| `licell env set <key> <value>` | 设置云端环境变量（并同步本地 .licell/project.json） | `--component` |
| `licell domain app bind <domain>` | 为当前应用编排 DNS、函数域名与可选 SSL | `--component`, `--ssl`, `--ssl-force-renew` |
| `licell domain app unbind <domain>` | 解绑当前应用域名，并清理 FC custom domain / DNS CNAME | `--yes` |
| `licell domain static bind <domain>` | 为静态站点编排 CDN、DNS 与可选 HTTPS | `--component`, `--bucket`, `--ssl` |
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
| `licell db class [type]` | 查询数据库可用规格（给 Agent/开发者在 db add 前对照） | `--engine-version`, `--category`, `--storage-type` |
| `licell db connect [instanceId]` | 输出数据库连接信息 | — |
| `licell db info <instanceId>` | 查看数据库实例详情 | — |
| `licell db list` | 查看数据库实例列表 | `--limit` |
| `licell db public-access [instanceId]` | 开通数据库公网访问并添加当前 IP 到白名单 | `--ip` |
| `licell db rm <instanceId>` | 删除数据库实例 | `--yes` |
| `licell cache add` | 分配 Redis 缓存 | `--type`, `--mode`, `--instance` |
| `licell cache class [mode]` | 查询缓存可用规格（给 Agent/开发者在 cache add 前对照） | `--zone`, `--limit` |
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

- `licell skills init`、`licell catalog`、`licell completion` 都基于同一套 CLI 命令目录生成外部表面。
- `licell completion` 的候选命令同样来自共享命令目录。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell doctor` | 诊断本机 licell 登录态、云端权限/目标资源/域名入口、项目配置与部署前置条件 | `--component`, `--all-components`, `--runtime` |
| `licell catalog` | 输出共享 CLI 命令目录，供 Agent / 自动化发现命令、选项和结构化契约 | `--root-command`, `--command-key` |
| `licell ci init github` | 生成 GitHub Actions 的 deploy-only workflow（只调用 licell，不负责编译） | `--apply`, `--force`, `--workflow` |
| `licell ci init gitlab` | 生成 GitLab CI 的 deploy-only pipeline（只调用 licell，不负责编译） | `--apply`, `--force`, `--pipeline` |
| `licell skills init [agent]` | 为 AI Agent 生成 licell skills（claude / codex） | `--global`, `--project-root`, `--force` |
| `licell setup` | 安装后引导：交互式配置 AI Agent skills | `--agent`, `--global`, `--project-root` |
| `licell state show` | 查看当前 repo 的 `.licell/state.json` | `--component` |
| `licell completion [shell]` | 输出 shell 补全脚本（bash/zsh） | `--engine` |
| `licell upgrade` | 按当前安装来源升级 licell | `--channel`, `--target-version`, `--repo` |
| `licell e2e cleanup [runId]` | 清理指定 E2E run 产生的资源 | `--manifest`, `--keep-workspace`, `--yes` |
| `licell e2e list` | 查看本项目 e2e 运行记录 | — |
| `licell e2e run` | 执行固定 E2E 套件（默认 smoke） | `--suite`, `--run-id`, `--runtime` |

### 常用工作流片段

**Task 函数工作流**

```bash
licell deploy --type task --runtime nodejs22 --entry src/task.ts --target preview --output json
licell task config <appName> --target preview --output json
licell task invoke <appName> --target preview --payload '{"job":"demo"}' --output json
licell task info <taskId> <appName> --target preview --output json
licell task list <appName> --target preview --status Running --output json
```

说明：`deploy --type task` 成功后不会返回固定 URL；请读取结果里的 `invokeCommand`，或继续执行 `licell task invoke` / `task info` / `task list` 完成任务闭环。

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

说明：默认 smoke 套件会覆盖 API deploy/invoke 与 task deploy/config/invoke/list/info/stop；`licell e2e run --suite full` 会在此基础上额外覆盖 DNS add/rm、OSS bucket/object CRUD、OSS 原生域名 token/bind/unbind、`domain app bind/unbind`、`deploy --type static --domain ...` 与 `domain static bind/unbind`。如需连同云上资源一起收口，建议配合 `--cleanup`。

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
licell setup --agent codex
licell catalog --output json
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
- catalog / skills / docs 共源收敛
