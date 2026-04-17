---
name: licell
description: >-
  Deploy and manage Alibaba Cloud Serverless applications using the licell CLI.
  Covers deploy, release, functions, env vars, domains, DNS, logs, OSS, database, cache, and Supabase.
metadata:
  author: licell
  version: "1.0"
---

# licell CLI Skill

Deploy and manage Alibaba Cloud Serverless (FC 3.0) applications from the command line.

## Prerequisites

- `licell` CLI installed and on PATH
- Authenticated via `licell login` (credentials stored in `~/.licell-cli/auth.json`)
- Project initialized via `licell init` (config in `.licell/project.json`)

## Install / Upgrade Notes

- `licell upgrade` follows the current installation source by default.
- If licell was installed globally via `npm` / `pnpm` / `yarn` / `bun`, `licell upgrade` will reuse that package manager automatically.
- If licell is running from project-local `node_modules` or a dev-linked checkout, default `licell upgrade` refuses global self-upgrade.
- The release installer prefers prebuilt standalone artifacts from `releases/latest`, and falls back to source install when no prebuilt asset exists for the current platform.
- Passing `--repo` or `--script-url` forces the GitHub release upgrade path.
- Use `--channel auto|release|npm|pnpm|yarn|bun` to override the upgrade channel explicitly; prefer `licell upgrade --dry-run` first to inspect the plan.

## Quick Start Workflow

```bash
licell login                                          # 配置阿里云凭证
licell init                                           # 初始化项目（脚手架 + 配置）
licell catalog --output json                          # 发现命令目录与结构化契约
licell deploy --type api --target preview             # 部署到 preview
licell release promote --target prod                  # 发布到生产
```

## Agent Usage

- 命令发现：先执行 `licell catalog --output json`。
- 单命令细节：再执行 `licell <command> --help --output json`。
- 真正执行：统一执行 `licell ... --output json`，并过滤 `@@LICELL_JSON@@` 前缀逐行解析。
- 成功结果看 `type=result`；失败看 `type=error` 的 `nextActions[]`；过程事件看 `type=event`。

### Schema Contracts

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

## Command Reference

以下命令清单由 licell CLI 注册表自动生成；新增或修改 CLI 命令后，Skills / docs/reference/agent-surfaces.md / shell completion 会同步反映。

### Setup & Identity

认证、项目初始化与默认配置相关命令。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell login` | 配置阿里云凭证 | `--account-id`, `--ak`, `--sk`, `--region` |
| `licell auth export [passkey]` | 把当前机器的 licell 全局登录状态加密备份到私有 OSS，并返回一条可跨机器 restore 的 token。 | `--bucket`, `--expires`, `--expires-hours` |
| `licell auth inspect <token>` | 本地解码 restore token，查看其 bucket/key/过期时间等元信息，不会访问网络或修改本机状态。 | — |
| `licell auth repair` | 修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用） | `--account-id`, `--ak`, `--sk`, `--region` |
| `licell auth restore <token> [passkey]` | 通过 token 下载加密 bundle，并恢复 ~/.licell-cli 下的 auth/config/acme 状态。 | `--yes` |
| `licell logout` | 清除本地凭证 | — |
| `licell whoami` | 查看当前登录身份 | — |
| `licell switch` | 切换默认 region | `--region` |
| `licell init` | 初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置） | `--runtime`, `--kind`, `--app`, `--force` |
| `licell bootstrap` | 把已确认的部署方案写成 licell 的声明式项目配置；既支持单组件精细初始化，也支持把 discover 提案批量落盘。 | `--component`, `--path`, `--type`, `--app` |
| `licell workspace discover` | 只读扫描当前 repo，输出 licell 视角的候选 component、部署类型、artifact/target/route 提案，以及建议向人确认的问题。 | — |
| `licell workspace doctor` | monorepo / multi-component 版 doctor：默认扫描整个 workspace，也可聚焦单个 component。 | `--component`, `--runtime`, `--entry`, `--docker-daemon` |
| `licell workspace init` | 在 repo 根目录把 `.licell/project.json` 切成 workspace 形态，并声明一个 deploy unit。 | `--component`, `--path`, `--type`, `--app` |
| `licell workspace list` | 输出当前目录所在 workspace 的 components，以及当前 cwd 命中的 component。 | `--component` |
| `licell workspace migrate` | 把旧单项目配置升级成“根级兼容字段 + components[<name>]”的混合格式，便于新旧 licell 共存。 | `--component`, `--path`, `--default`, `--dry-run` |
| `licell config domain [suffix]` | 查看或设置全局默认域名后缀 | `--unset` |

#### `licell login`

配置阿里云凭证

说明：
- bootstrap 模式会创建或复用 licell 专用 RAM 用户，并仅保存该专用 AccessKey。

示例命令：
- `licell login`
- `licell login --bootstrap-ram`
- `licell login --account-id <id> --ak <ak> --sk <sk> --output json`

| 选项 | 说明 |
|------|------|
| `--account-id <id>` | 阿里云 Account ID（CI 场景） |
| `--ak <accessKeyId>` | 阿里云 AccessKey ID（CI 场景） |
| `--sk <accessKeySecret>` | 阿里云 AccessKey Secret（CI 场景） |
| `--region <region>` | 默认地域，默认 cn-hangzhou |
| `--bootstrap-ram` | 使用高权限 AK/SK 自动创建 licell 专用 RAM 用户与最小权限 AK/SK（仅保存新 key） |
| `--bootstrap-user <name>` | bootstrap 模式下 RAM 用户名，默认 licell-operator |
| `--bootstrap-policy <name>` | bootstrap 模式下自定义策略名，默认 LicellOperatorPolicy |

#### `licell auth export [passkey]`

把当前机器的 licell 全局登录状态加密备份到私有 OSS，并返回一条可跨机器 restore 的 token。

参数：`[passkey]`

说明：
- 默认会一起打包 ~/.licell-cli/auth.json、~/.licell-cli/config.json、~/.licell-cli/acme/ 下的文件。
- 默认 restore token 有效期为 7 天；也可通过 `--expires 30d` / `--expires 12h` 覆盖。
- OSS 对象默认放在 private + public-access-block=on 的 Bucket 中，restore 通过时效性签名 URL 拉取。
- restore token 不包含明文 AK/SK；真正敏感内容在对象内，需 passkey 才能解密。

示例命令：
- `licell auth export`
- `licell auth export my-passphrase-123`
- `licell auth export --expires 30d --output json`
- `licell auth export --expires-hours 72 --output json`

关键选项建议：
- `--bucket <bucket>`：需要把 auth bundle 上传到指定 Bucket，而不是默认的账号级 auth Bucket 时使用。 注意：目标 Bucket 需要属于当前账号且允许 PutObject。
- `--expires <duration>`：需要用更自然的时长语法控制 restore token 有效期时使用。 注意：请使用带单位的时长，如 `90m`、`12h`、`30d`。
- `--expires-hours <hours>`：已有脚本仍按小时数传参时使用，作为 `--expires` 的兼容别名。 注意：不要与 `--expires` 同时传入。 超时后 token 将无法直接 restore，但 OSS 对象仍保留在 Bucket 中。

| 选项 | 说明 |
|------|------|
| `--bucket <bucket>` | 指定导出到哪个 OSS Bucket；默认按账号+region 推导并自动创建 |
| `--expires <duration>` | restore token 内签名下载链接的有效期（如 12h、30d；默认 7d） |
| `--expires-hours <hours>` | 兼容旧用法：按小时设置 restore token 内签名下载链接的有效期（默认 168） |

#### `licell auth inspect <token>`

本地解码 restore token，查看其 bucket/key/过期时间等元信息，不会访问网络或修改本机状态。

参数：`<token>`

说明：
- inspect 只会本地 decode token，不会下载 OSS 对象，也不会校验 passkey 是否正确。
- token 内已包含 bucket、object key、signedGetUrl 与 expiresAt；适合排查“为什么看起来没变化”。
- restore token 本身仍应按敏感信息处理，inspect 时注意不要直接贴到公共频道。

示例命令：
- `licell auth inspect licell-auth-v1.<token>`
- `licell auth inspect licell-auth-v1.<token> --output json`

结构化结果：
- 返回 token 内的原始 payload，以及基于当前时间推导的过期状态。
- `stage`：固定为 `auth.inspect`。
- `schemaVersion`：token payload schema 版本。
- `kind`：token kind，当前为 `licell-auth-restore`。
- `bucket`：restore 时要下载对象的 OSS Bucket。
- `key`：restore 时要下载对象的 OSS Object Key。
- `region`：生成 token 时使用的 region。
- `createdAt`：token 创建时间（ISO 8601）。
- `expiresAt`：token 过期时间（ISO 8601）。
- `expired`：按当前本机时间判断 token 是否已过期。
- `expiresInSeconds`：距离过期剩余秒数；过期后为负数。
- `objectSha256`：远端加密 bundle 的 SHA-256 校验值。
- `signedGetUrl`：token 内嵌的 OSS 签名下载 URL。
- `signedGet`
  - `host`：签名 URL 的 host。
  - `path`：签名 URL 的 pathname。
  - `expiresUnix`：签名 URL query 中的 `Expires` Unix 秒时间戳。

#### `licell auth repair`

修复凭证权限（推荐：用超级 AK/SK 自动补齐 licell 最小权限并继续使用）

示例命令：
- `licell auth repair`
- `licell auth repair --ak <admin-ak> --sk <admin-sk> --output json`

| 选项 | 说明 |
|------|------|
| `--account-id <id>` | 阿里云 Account ID（CI 场景） |
| `--ak <accessKeyId>` | 超级 AccessKey ID（仅用于本次修复，不会保存） |
| `--sk <accessKeySecret>` | 超级 AccessKey Secret（仅用于本次修复，不会保存） |
| `--region <region>` | 默认地域，默认 cn-hangzhou |
| `--bootstrap-user <name>` | 修复目标 RAM 用户名（默认自动识别当前 key 所属用户） |
| `--bootstrap-policy <name>` | 修复使用的自定义策略名（默认 LicellOperatorPolicy） |

#### `licell auth restore <token> [passkey]`

通过 token 下载加密 bundle，并恢复 ~/.licell-cli 下的 auth/config/acme 状态。

参数：`<token>` `[passkey]`

说明：
- restore 不依赖当前机器已登录；它通过 token 内的时效性签名 URL 从 OSS 拉取 bundle。
- 如果本地已存在 ~/.licell-cli/auth.json / config.json / acme 文件，默认会先确认再覆盖。
- 仅在 TTY 交互环境下允许省略 token / passkey 并逐步提示；非交互模式保持显式参数约束。

示例命令：
- `licell auth restore licell-auth-v1.<token>`
- `licell auth restore licell-auth-v1.<token> my-passphrase-123`
- `licell auth restore licell-auth-v1.<token> --yes`

| 选项 | 说明 |
|------|------|
| `--yes` | 检测到本地已有 ~/.licell-cli 文件时，跳过二次确认并直接覆盖 |

#### `licell switch`

切换默认 region

示例命令：
- `licell switch`
- `licell switch --output json`

| 选项 | 说明 |
|------|------|
| `--region <region>` | 目标 region（如 cn-hangzhou） |

#### `licell init`

初始化 FC 项目（空目录生成脚手架，已有项目写入 licell 配置）

说明：
- 空目录下会生成脚手架；已有项目目录默认仅写入 licell 配置。
- 若要在已有目录补齐脚手架，需要显式传 `--runtime` 与 `--force`。
- `--kind task` 会生成任务函数入口（Node 为 `src/task.ts`，Python 为 `src/task.py`），并把项目默认 `deployType` 写成 `task`。

示例命令：
- `licell init`
- `licell init --runtime nodejs22 --kind task`
- `licell init --runtime docker --app my-app`
- `licell init --yes --output json`

下一步：
- primary · `licell init --output json`：先拿到解析出的 runtime、appName 与写入结果。
- secondary · `licell deploy --type api --target preview`：API 项目初始化完成后直接进入部署链路。
- secondary · `licell task invoke [name] --output json`：task 项目部署完成后没有固定 URL，应直接走异步任务调用。

关键选项建议：
- `--runtime <runtime>`：需要显式指定项目模板与默认 runtime 时使用。
- `--kind <kind>`：需要初始化 task worker 而不是 HTTP API 时使用。 注意：当前 task 脚手架仅支持 nodejs20/nodejs22/python3.12/python3.13；docker task 暂未提供。
- `--app <name>`：希望指定或覆盖 FC functionName 对应的应用名时使用。
- `--force`：已有项目目录中仍需要生成或覆盖脚手架文件时使用。 注意：可能覆盖已有文件内容。
- `--yes`：非交互或自动化场景，直接使用默认值时使用。

结构化结果：
- 返回初始化后的 runtime、应用名与文件写入结果。
- `stage`：固定为 `init`。
- `runtime`：解析后的默认 runtime。
- `kind`：脚手架类型：`api` 或 `task`。
- `appName`：最终写入配置的应用名。
- `mode`：`scaffold+config` 或 `config-only`。
- `writtenFiles`：实际写入的文件列表。
- `skippedFiles`：跳过写入的文件列表。

推荐流程：
- 1. 初始化项目 → `licell init --output json`：先拿到解析出的 runtime、appName 与写入结果。
- 2. 检查生成文件：确认脚手架或 licell 项目配置是否符合预期。
- 3. 继续部署 → `licell deploy --type api --target preview`：API 项目初始化完成后直接进入部署链路。
- 4. 若为 task 项目则直接触发 → `licell task invoke [name] --output json`：task 项目部署完成后没有固定 URL，应直接走异步任务调用。

Agent Tips：
- Agent 在自动化初始化时优先使用 `--yes --output json`，并读取 `mode` / `writtenFiles` 决定后续动作。

| 选项 | 说明 |
|------|------|
| `--runtime <runtime>` | 默认 runtime：nodejs20/nodejs22/python3.12/python3.13/docker |
| `--kind <kind>` | 脚手架类型：api 或 task（默认 api） |
| `--app <name>` | 应用名（用于 FC functionName） |
| `--force` | 在已有项目目录生成/覆盖脚手架文件 |
| `--yes` | 使用默认值，不进入交互 |

#### `licell bootstrap`

把已确认的部署方案写成 licell 的声明式项目配置；既支持单组件精细初始化，也支持把 discover 提案批量落盘。

说明：
- 单组件模式适合对某个 component 做精确建模；批量模式适合先把 monorepo 的 discovered components 一次性收敛进 licell workspace。
- `--all-discovered` 时，只允许 `--include` / `--exclude` / `--default-component` / `--apply` / `--dry-run` 这些批量参数；其它单组件覆盖参数会报错。
- bootstrap 会初始化 `project.json` 与版本化的 `state.json` 骨架；域名等未确认项会留在 `unresolved[]` 中，后续再用单组件 bootstrap 或 deploy/domain 命令精修。
- 每个 component 的结果里都会附带 `refinements[]`，明确告诉 Agent 还建议补哪些 flag，以及推荐复用哪条 bootstrap 命令模板继续收敛。

示例命令：
- `licell bootstrap`
- `licell bootstrap --output json`

下一步：
- primary · `licell workspace discover --output json`：先拿到候选 component、deploy type 提案和待确认问题。
- secondary · `licell bootstrap --all-discovered --apply --output json`：先把 monorepo 里的主要 deploy units 收敛到 licell workspace。
- secondary · `licell bootstrap --component api --function my-api --domain api.example.com --apply --output json`：对需要更精确的 FC function / domain / bucket 命名做二次收敛。
- secondary · `licell deploy plan --output json`：在真正 deploy 前，先让 Agent / 人看到 artifact -> target -> route 的完整计划。

关键选项建议：
- `--component <name>`：单组件模式下，显式声明要初始化哪个 deploy unit 时使用。 注意：未传且 repo 里只发现 1 个 component 时，bootstrap 会自动复用 discover 提案。
- `--default`：单组件模式下，需要把当前 component 设为 workspace 默认 component 时使用。 注意：批量模式请改用 `--default-component`。
- `--all-discovered`：希望把 `workspace discover` 的候选 components 一次性初始化成 licell workspace 时使用。 注意：该模式不接受 `--component` / `--path` / `--bucket` / `--function` / `--domain` 这类单组件覆盖参数。
- `--include <names>`：批量模式下，只想初始化部分 discovered components 时使用。 注意：值为逗号分隔 component 名；会先于 `--exclude` 做筛选。
- `--exclude <names>`：批量模式下，需要跳过某些 discovered components 时使用。 注意：值为逗号分隔 component 名；适合先全量 discover，再去掉 docs/demo/admin 等非部署单元。
- `--default-component <name>`：批量模式下，想明确指定 workspace 默认 component 时使用。 注意：必须属于本次实际初始化的 component 集合。
- `--dry-run`：先让 Agent / 人确认 bootstrap 结果，而不是立即改写 repo 配置时使用。 注意：不会写 `.licell/project.json` 或 `.licell/state.json`。

结构化结果：
- 返回 bootstrap 结果、未解析项和是否已写入配置。
- `stage`：命令阶段标识。
- `mode`：`single` 或 `batch`。
- `components[]`：本次规划或初始化的 component 列表。
- `questions[]`：单组件模式下建议确认的问题。
- `unresolved[]`：仍待人工确认的 deploy 字段。
- `refinements[]`：单组件模式下，建议继续执行的精修动作与命令模板。
- `skipped[]`：批量模式下被 include/exclude 过滤掉的 component。
- `applied`：是否已落盘。

推荐流程：
- 1. 先 discover repo → `licell workspace discover --output json`：先拿到候选 component、deploy type 提案和待确认问题。
- 2. 批量初始化 discovered components → `licell bootstrap --all-discovered --apply --output json`：先把 monorepo 里的主要 deploy units 收敛到 licell workspace。
- 3. 按 component 精修 → `licell bootstrap --component api --function my-api --domain api.example.com --apply --output json`：对需要更精确的 FC function / domain / bucket 命名做二次收敛。
- 4. 确认部署计划 → `licell deploy plan --output json`：在真正 deploy 前，先让 Agent / 人看到 artifact -> target -> route 的完整计划。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 单组件模式：component 名称，例如 web / api |
| `--path <path>` | 单组件模式：component 相对 repo 根路径 |
| `--type <type>` | 单组件模式：部署类型：static / api / task |
| `--app <name>` | 单组件模式：逻辑应用名；未传时按 component 推导 |
| `--artifact <path>` | 单组件模式：静态产物目录（例如 dist） |
| `--entry <entry>` | 单组件模式：API / task 入口文件 |
| `--runtime <runtime>` | 单组件模式：FC runtime，例如 nodejs22 / python3.13 / docker |
| `--bucket <name>` | 单组件模式：静态站目标 OSS Bucket 名称 |
| `--function <name>` | 单组件模式：API / task 目标 FC Function 名称 |
| `--alias <name>` | 单组件模式：默认 alias / release target |
| `--domain <domain>` | 单组件模式：固定域名 |
| `--domain-suffix <suffix>` | 单组件模式：固定域名后缀 |
| `--enable-cdn` | 单组件模式：初始化为启用 CDN |
| `--ssl` | 单组件模式：初始化为启用 HTTPS |
| `--enable-vpc` | 单组件模式：初始化为启用 VPC |
| `--disable-vpc` | 单组件模式：初始化为禁用 VPC |
| `--default` | 单组件模式：将该 component 设为默认 component |
| `--region <region>` | 单组件模式：默认 region |
| `--all-discovered` | 批量模式：把 `workspace discover` 找到的所有候选 components 一次性初始化 |
| `--include <names>` | 批量模式：仅初始化这些 discovered components（逗号分隔） |
| `--exclude <names>` | 批量模式：跳过这些 discovered components（逗号分隔） |
| `--default-component <name>` | 批量模式：显式指定 workspace 默认 component |
| `--apply` | 直接写入 `.licell/project.json` 与 `.licell/state.json` |
| `--dry-run` | 只输出 bootstrap 结果，不写文件 |

#### `licell workspace discover`

只读扫描当前 repo，输出 licell 视角的候选 component、部署类型、artifact/target/route 提案，以及建议向人确认的问题。

示例命令：
- `licell workspace discover`
- `licell workspace discover --output json`

结构化结果：
- 返回候选 component、建议配置和 questions[]。
- `stage`：命令阶段标识。
- `rootDir`：当前扫描根目录。
- `components[]`：候选 component 提案。
- `questions[]`：建议 Agent 向人确认的部署问题。

#### `licell workspace doctor`

monorepo / multi-component 版 doctor：默认扫描整个 workspace，也可聚焦单个 component。

说明：
- 这是 `licell doctor --all-components` 的 workspace 入口别名。
- 传 `--component` 时，行为等价于 `licell doctor --component <name>`。

示例命令：
- `licell workspace doctor`
- `licell workspace doctor --component api`
- `licell workspace doctor --offline --output json`

结构化结果：
- 返回 workspace 根级共享检查与组件子报告；结构与 `licell doctor` 一致。
- `stage`：命令阶段标识。
- `healthy`：是否不存在阻塞项。
- `components[]`：workspace 中各 component 的 doctor 子报告。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 只诊断指定 component；未传时默认扫描全部 components |
| `--runtime <runtime>` | 覆盖 runtime 做 deploy 诊断（与 doctor 相同） |
| `--entry <entry>` | 覆盖 deploy 入口路径（与 doctor 相同） |
| `--docker-daemon` | runtime=docker 时附带检查本机 Docker daemon 是否可用 |
| `--offline` | 只做本地诊断，跳过云端只读探测 |

#### `licell workspace init`

在 repo 根目录把 `.licell/project.json` 切成 workspace 形态，并声明一个 deploy unit。

说明：
- 该命令面向 monorepo / multi-dir 项目。
- 如果当前目录已有单项目 `.licell/project.json`，会显式把它切到 workspace 形态，并同步默认 component 的兼容字段。

示例命令：
- `licell workspace init --component web --path apps/web --type static --dist dist --domain www.example.com --default`
- `licell workspace init --component api --path apps/api --type api --runtime nodejs22 --entry src/index.ts --target prod`

| 选项 | 说明 |
|------|------|
| `--component <name>` | component 名称，例如 web / api |
| `--path <path>` | component 相对根目录路径，例如 apps/web |
| `--type <type>` | 部署类型：api、static 或 task |
| `--app <name>` | component 对应的 appName |
| `--runtime <runtime>` | API / task 使用的 runtime |
| `--entry <entry>` | API / task 入口文件 |
| `--dist <dist>` | static 构建产物目录 |
| `--domain <domain>` | 固定完整域名 |
| `--domain-suffix <suffix>` | 固定域名后缀 |
| `--target <target>` | 默认 release target / alias |
| `--enable-cdn` | 把 component 默认配置成启用 CDN |
| `--ssl` | 把 component 默认配置成启用 HTTPS |
| `--enable-vpc` | API / task 默认启用 VPC |
| `--disable-vpc` | API / task 默认禁用 VPC |
| `--default` | 把该 component 设为 workspace 默认 component |
| `--region <region>` | component 默认 region（可选） |

#### `licell workspace list`

输出当前目录所在 workspace 的 components，以及当前 cwd 命中的 component。

示例命令：
- `licell workspace list`
- `licell workspace list --component web --output json`

结构化结果：
- 返回 workspace 根目录、当前模式与 components 列表。
- `stage`：命令阶段标识。
- `mode`：`single` 或 `workspace`；未找到配置时为 `null`。
- `rootDir`：workspace 或项目根目录。
- `componentName`：当前命中的 component 名称。
- `components[]`：workspace 中声明的 components。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 高亮或精确查看指定 component |

#### `licell workspace migrate`

把旧单项目配置升级成“根级兼容字段 + components[<name>]”的混合格式，便于新旧 licell 共存。

说明：
- 该命令不会隐式在普通 doctor/deploy 时自动执行。
- 迁移后会保留根级 appName/deployType/runtime 等字段，旧版 licell 仍可继续读取。

示例命令：
- `licell workspace migrate`
- `licell workspace migrate --component web --path .`
- `licell workspace migrate --dry-run --output json`
- `licell workspace migrate --component api --path apps/api --output json`

结构化结果：
- 返回迁移结果、默认 component 和兼容性状态。
- `stage`：命令阶段标识。
- `mode`：`migrated` 或 `already-workspace`。
- `rootDir`：项目根目录。
- `component`：默认 component 名称。
- `path`：component 相对路径。
- `defaultComponent`：迁移后生效的 defaultComponent。
- `backwardCompatible`：是否保留了旧版 licell 可读的根级字段。
- `dryRun`：本次是否仅预览、不写文件。
- `diffSummary`：迁移前后的结构化摘要。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 迁移后的默认 component 名称，默认 web |
| `--path <path>` | component 相对根目录路径，默认当前目录 `.` |
| `--default` | 显式把该 component 设为 defaultComponent（默认启用） |
| `--dry-run` | 只输出迁移摘要，不写回 `.licell/project.json` |

#### `licell config domain [suffix]`

查看或设置全局默认域名后缀

参数：`[suffix]`

说明：
- 设置后，未显式指定域名后缀的 deploy / domain 流程会优先复用该值。

示例命令：
- `licell config domain`
- `licell config domain example.com`
- `licell config domain --unset --output json`

下一步：
- primary · `licell config domain --output json`：先确认当前是否已有默认域名后缀。
- secondary · `licell config domain <suffix> --output json`：让后续域名相关流程共享同一默认后缀。
- secondary · `licell config domain --unset --output json`：当默认值不再适用时回退到显式传参。

关键选项建议：
- `--unset`：需要清除全局默认域名后缀，让后续流程重新显式传入或重新推导时使用。 注意：会影响后续未显式指定域名后缀的 deploy / domain 命令行为。

结构化结果：
- 返回当前或更新后的全局域名后缀。
- `stage`：固定为 `config.domain`。
- `domainSuffix`：当前全局域名后缀；未设置时为 `null`。
- `action`：执行了 `set` / `unset` 时返回。

推荐流程：
- 1. 查看当前值 → `licell config domain --output json`：先确认当前是否已有默认域名后缀。
- 2. 设置默认值 → `licell config domain <suffix> --output json`：让后续域名相关流程共享同一默认后缀。
- 3. 必要时清除 → `licell config domain --unset --output json`：当默认值不再适用时回退到显式传参。

| 选项 | 说明 |
|------|------|
| `--unset` | 清除已设置的全局域名后缀 |

### Delivery Workflow

围绕应用部署、发布、函数管理、环境变量、域名、DNS、日志和对象存储的交付链路。

- Agent 在 FC API 部署前，优先执行 `licell deploy spec` 与 `licell deploy check`。
- 涉及删除或清理的命令通常需要显式传入 `--yes`。
- 任务函数通过 `licell deploy --type task` 交付；部署成功后不返回固定 URL，而是继续用 `licell task invoke / info / list / stop` 完成调用与排查。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell deploy` | 一键部署 API / Static / Task，并提供 spec / check 辅助子命令。 | `--component`, `--type`, `--entry`, `--dist` |
| `licell deploy check` | 本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行） | `--runtime`, `--entry`, `--docker-daemon` |
| `licell deploy plan` | 只读取 repo 中的 licell deploy config，输出 artifact -> 阿里云目标服务 -> 访问入口 的计划与风险提示。 | `--component`, `--include`, `--exclude` |
| `licell deploy spec [runtime]` | 查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照） | `--all` |
| `licell task config [name]` | 查看任务函数的异步调用配置 | `--component`, `--target` |
| `licell task info <taskId> [name]` | 查看单个异步任务详情 | `--component`, `--target` |
| `licell task invoke [name]` | 异步调用任务函数 | `--component`, `--target`, `--payload`, `--file` |
| `licell task list [name]` | 查看任务函数的异步任务列表 | `--component`, `--target`, `--status`, `--prefix` |
| `licell task stop <taskId> [name]` | 停止正在运行的异步任务 | `--component`, `--target` |
| `licell task config rm [name]` | 删除任务函数的异步调用配置 | `--component`, `--target`, `--yes` |
| `licell task config set [name]` | 写入任务函数的异步调用配置 | `--component`, `--target`, `--enable`, `--disable` |
| `licell release list` | 查看函数版本列表 | `--component`, `--limit` |
| `licell release promote [versionId]` | 发布并切流到目标别名 | `--component`, `--target` |
| `licell release prune` | 清理历史函数版本（默认仅预览） | `--component`, `--keep`, `--apply`, `--yes` |
| `licell release rollback <versionId>` | 回滚到指定函数版本 | `--component`, `--target` |
| `licell logs query [query]` | 按 SLS project/logstore/query 一次性检索日志 | `--project`, `--store`, `--region`, `--topic` |
| `licell logs tail [query]` | 按 SLS project/logstore/query 持续跟随日志流 | `--project`, `--store`, `--region`, `--topic` |
| `licell fn info [name]` | 查看函数详情 | `--component`, `--target` |
| `licell fn invoke [name]` | 调用函数（同步） | `--component`, `--target`, `--payload`, `--file` |
| `licell fn list` | 查看函数列表 | `--limit`, `--prefix` |
| `licell fn logs [name]` | 查看函数日志（默认实时流式） | `--component`, `--once`, `--window`, `--lines` |
| `licell fn rm [name]` | 删除函数 | `--component`, `--force`, `--yes` |
| `licell fn domain bind <domain>` | 绑定或更新 FC 自定义域名路由。 | `--function`, `--component`, `--target`, `--path` |
| `licell fn domain info <domain>` | 查看 FC 自定义域名详情 | — |
| `licell fn domain list` | 查看 FC 自定义域名列表 | `--limit`, `--prefix` |
| `licell fn domain unbind <domain>` | 解绑 FC 自定义域名，可选同步清理 DNS。 | `--cleanup-dns`, `--yes` |
| `licell env list` | 查看云端环境变量 | `--component`, `--target`, `--show-values` |
| `licell env pull` | 拉取云端环境变量 | `--component`, `--target` |
| `licell env rm <key>` | 删除云端环境变量（并同步本地 .licell/project.json） | `--component`, `--yes` |
| `licell env set <key> <value>` | 设置云端环境变量（并同步本地 .licell/project.json） | `--component` |
| `licell domain app bind <domain>` | 为当前应用编排 DNS CNAME、FC custom domain，并可选自动开启 HTTPS。 | `--component`, `--ssl`, `--ssl-force-renew`, `--target` |
| `licell domain app unbind <domain>` | 解绑应用域名，并清理对应 FC custom domain / DNS CNAME。 | `--yes` |
| `licell domain static bind <domain>` | 将静态站点域名接到 CDN，并把 DNS CNAME 切到 CDN；可选自动启用 HTTPS。 | `--component`, `--bucket`, `--ssl`, `--ssl-force-renew` |
| `licell domain static unbind <domain>` | 解绑静态站点域名，并清理对应 CDN domain / DNS CNAME。 | `--yes` |
| `licell dns records add <domain>` | 添加一条 DNS 解析记录。 | `--rr`, `--type`, `--value`, `--ttl` |
| `licell dns records list [domain]` | 查看域名解析记录 | `--limit` |
| `licell dns records rm <recordId>` | 删除一条 DNS 解析记录。 | `--yes` |
| `licell oss bucket [bucket]` | 兼容命令；等同 `licell oss upload`。 | `--bucket`, `--source-dir`, `--target-dir` |
| `licell oss create <bucket>` | 创建 OSS Bucket | `--acl`, `--storage-class`, `--redundancy`, `--public-access-block` |
| `licell oss info <bucket>` | 查看 Bucket 基本信息，并补充 ACL、公共访问阻止、已绑定域名。 | — |
| `licell oss list` | 查看 OSS Bucket 列表 | `--limit` |
| `licell oss ls <bucket> [prefix]` | 列出 Bucket 中的对象，可按 prefix 过滤。 | `--limit` |
| `licell oss rm <bucket>` | 删除 OSS Bucket（默认仅删空 Bucket） | `--recursive`, `--yes` |
| `licell oss update <bucket>` | 更新 OSS Bucket 属性（ACL / 公共访问阻止） | `--acl`, `--public-access-block` |
| `licell oss upload [bucket]` | 上传本地目录到指定 Bucket / 目录前缀。 | `--bucket`, `--source-dir`, `--target-dir` |
| `licell oss domain bind <bucket> <domain>` | 为 Bucket 绑定原生 OSS 自定义域名 | — |
| `licell oss domain list <bucket>` | 查看 Bucket 已绑定的原生 OSS 域名 | — |
| `licell oss domain token <bucket> <domain>` | 为待绑定的 OSS 自定义域名生成 TXT 验证 token。 | — |
| `licell oss domain unbind <bucket> <domain>` | 解绑 Bucket 原生 OSS 自定义域名。 | `--yes` |
| `licell oss object get <bucket> <key> [file]` | 下载单个对象到本地文件。 | `--file` |
| `licell oss object info <bucket> <key>` | 查看对象元数据（长度 / Content-Type / ETag / 用户自定义 metadata）。 | — |
| `licell oss object rm <bucket> <key>` | 删除 OSS 对象 | `--yes` |
| `licell oss sync down <bucket> [prefix]` | 把 Bucket 中某个 prefix 的对象批量下载到本地目录。 | `--dest-dir` |
| `licell oss sync up [bucket]` | 同步本地目录到指定 Bucket / 目录前缀（等同 `licell oss upload`）。 | `--bucket`, `--source-dir`, `--target-dir` |

#### `licell deploy`

一键部署 API / Static / Task，并提供 spec / check 辅助子命令。

子命令：`spec`, `check`, `plan`

说明：
- FC 函数部署前，建议先执行 `licell deploy spec` 与 `licell deploy check`。
- `--type task` 成功后不会返回固定访问 URL；结果里会给出 `functionName`、`configuredQualifiers[]` 与 `invokeCommand`，后续统一通过 `licell task invoke` 发起调用。
- 当 `--type task --target <alias>` 一起使用时，licell 会在 alias 调用入口收敛后再写入 qualifier 级 async invoke config，保证发布后可以直接验证。
- 当 `type=static` 且绑定固定域名走 CDN 时，deploy 默认使用 `--cdn-refresh entrypoints`，避免首页与入口清单文件被旧缓存命中。

示例命令：
- `licell deploy spec nodejs22`
- `licell deploy check`
- `licell deploy --type api --entry src/index.ts`
- `licell deploy --type static --dist dist --domain www.example.com --cdn-refresh entrypoints --output json`
- `licell deploy --type task --entry src/worker.ts`
- `licell deploy --type task --runtime nodejs22 --target preview --output json`
- `licell deploy --output json`

下一步：
- primary · `licell deploy spec`：先看可用 runtime、资源约束和推荐姿势。
- secondary · `licell deploy check`：避免入口文件、runtime、打包形态不匹配。
- secondary · `licell deploy --output json`：让 Agent 拿到结构化部署结果。
- secondary · `licell release promote <versionId>`：预览验证通过后再切到稳定 alias。

决策指南：
- Inspect：部署前先做预检：先跑 spec 与 check，确认 runtime、入口和项目形态都匹配。 起手式：`licell deploy spec` · `licell deploy check`
- Mutate：让 Agent 稳定拿到部署结果：正式执行时优先输出 JSON，方便自动化继续读取版本、域名和资源状态。 起手式：`licell deploy --output json`
- Verify：验证任务函数可立即调用：当 `type=task` 时，先读取结果里的 `invokeCommand` / `configuredQualifiers[]`，再提交一次异步任务并跟踪状态。 起手式：`licell task invoke [name] --output json` · `licell task info <taskId> [name] --output json`

关键选项建议：
- `--component <name>`：在 repo 根目录统一操作多个 deploy unit 时，显式指定要命中的 workspace component。 注意：component 名称必须已经存在于 workspace `.licell/project.json` 中。
- `--type <type>`：在 CI / Agent 非交互场景下显式指定 `api`、`static` 或 `task`；其中 `task` 适合 FC 异步任务执行，不暴露固定 URL。 注意：不指定时可能依赖当前项目上下文或交互提示。 `--type task` 的后续验证入口是 `licell task invoke` / `task info`，不是 `fn invoke`。
- `--entry <entry>`：FC 入口不是默认的 `src/index.ts` / `src/main.py` 时使用。 注意：建议先运行 `licell deploy check` 验证入口与 runtime 约束。
- `--runtime <runtime>`：需要强制指定运行时，例如 `nodejs22`、`python3.13`、`docker`。 注意：部分 runtime 有地域限制；先查看 `licell deploy spec`。
- `--target <target>`：API 或任务函数部署后需要自动发布到指定 alias（如 `prod` / `preview`）时使用。 注意：会影响 alias 指向的调用入口。 对任务函数来说，`task invoke --target <alias>` 只会命中对应 qualifier 的 async invoke config。
- `--preview`：需要生成预览版本且不影响生产流量时使用。 注意：预览版本通常还需要后续 `licell release promote` 才会进入生产。
- `--domain <domain>`：希望直接绑定完整自定义域名时使用。 注意：可能联动 SSL / CDN / DNS 变更。
- `--domain-suffix <suffix>`：希望按固定后缀自动生成子域名时使用。 注意：适合标准化环境，不适合完全自定义主机名。
- `--enable-cdn`：希望流量走 CDN、获得缓存/加速能力时使用。 注意：会改写 DNS CNAME 指向 CDN。
- `--cdn-refresh <mode>`：静态站点绑定固定域名并走 CDN 时，希望 deploy 后自动处理缓存一致性。 注意：当前仅适用于 static deploy；默认 `entrypoints` 只刷新 `/`、HTML 与 manifest / service worker 等入口文件。
- `--ssl`：需要 HTTPS 证书自动签发与绑定时使用。 注意：依赖域名解析正确；必要时结合 `--ssl-force-renew`。

结构化结果：
- 返回值会随部署类型变化：API / Static 关注 URL / 域名；Task 关注函数名、启用的 qualifier 和后续调用入口。
- `stage`：命令阶段标识。
- `type`：部署类型：`api`、`static` 或 `task`。
- `runtime`：实际使用的 runtime。
- `releaseTarget`：自动发布到的 alias；未指定时为 `null`。
- `promotedVersion`：自动发布后的版本号；未发布时为 `null`。
- `healthCheckLogs[]`：部署后补充校验/健康检查日志数组。
- `hint`：文本提示；通常给未发布 alias 或 task workflow 的下一步建议。
- `url`：当 `type=api|static` 时的访问 URL。
- `fixedDomain`：绑定后的固定域名；未配置时为 `null`。
- `bucketName`：当 `type=static` 时，实际写入的 OSS Bucket 名称。
- `cdnCname`：当启用 CDN 且已分配时，返回对应的 CDN CNAME。
- `cdnRefreshMode`：当 `type=static` 时，部署后使用的 CDN 刷新策略：`off` / `entrypoints` / `all`。
- `cdnRefreshTaskIds[]`：当 `type=static` 且触发 CDN 刷新时，返回提交到 CDN 的刷新任务 ID 列表。
- `functionName`：当 `type=task` 时返回的函数名。
- `asyncTaskEnabled`：当 `type=task` 时，异步任务能力是否已启用。
- `configuredQualifiers[]`：当 `type=task` 时，已经写入 async invoke config 的 qualifier 列表。
- `invokeCommand`：当 `type=task` 时，推荐直接复制执行的任务调用命令。

推荐流程：
- 1. 确认部署规格 → `licell deploy spec`：先看可用 runtime、资源约束和推荐姿势。
- 2. 本地预检入口 → `licell deploy check`：避免入口文件、runtime、打包形态不匹配。
- 3. 执行部署 → `licell deploy --output json`：让 Agent 拿到结构化部署结果。
- 4. 必要时发布预览版本 → `licell release promote <versionId>`：预览验证通过后再切到稳定 alias。

Agent Tips：
- 生成或修改部署前配置时，优先调用 `deploy spec` 与 `deploy check`。
- 当结果 `type=task` 时，优先读取 `functionName`、`configuredQualifiers[]`、`invokeCommand`，不要期待 `url`。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择要部署的 component |
| `--type <type>` | 部署类型：api、static 或 task（适配 CI 非交互场景） |
| `--entry <entry>` | FC 入口文件（Node 默认 src/index.ts；Python 默认 src/main.py） |
| `--dist <dist>` | 静态站点目录（默认 dist） |
| `--runtime <runtime>` | 运行时（FC: nodejs20/nodejs22/python3.12/python3.13/docker；静态站: static/statis） |
| `--target <target>` | FC 函数部署后自动发布并切流到该 alias（如 prod/preview） |
| `--preview` | 生成预览部署（自动发版 + 绑定预览域名，不影响生产） |
| `--domain <domain>` | 绑定完整自定义域名（如 api.your-domain.xyz） |
| `--domain-suffix <suffix>` | 自动绑定固定子域名后缀（如 your-domain.xyz） |
| `--enable-cdn` | 域名绑定后自动接入 CDN 并将 DNS CNAME 切到 CDN（API 显式开启；Static 提供域名时默认开启） |
| `--cdn-refresh <mode>` | Static + CDN 部署后的缓存刷新策略：off / entrypoints / all（默认 entrypoints） |
| `--ssl` | 启用 HTTPS（API: --domain/--enable-cdn 默认开启；Static: 提供域名时默认开启） |
| `--ssl-force-renew` | 启用 HTTPS 时强制续签证书（忽略到期阈值） |
| `--acr-namespace <ns>` | Docker 部署时使用的 ACR 命名空间（默认 licell） |
| `--enable-vpc` | API 部署时启用 VPC 接入（默认启用） |
| `--disable-vpc` | API 部署时禁用 VPC 接入（使用公网模式） |
| `--memory <mb>` | 函数内存大小（MB，默认 512） |
| `--vcpu <n>` | 函数 vCPU 核数（如 0.5 / 1 / 2，默认 0.5） |
| `--instance-concurrency <n>` | 单实例并发数（默认自动，通常起始 10） |
| `--timeout <seconds>` | 函数超时时间（秒，默认 30） |

#### `licell deploy check`

本地预检 FC API 入口与 runtime 约束（建议 deploy 前执行）

示例命令：
- `licell deploy check`
- `licell deploy check --output json`

| 选项 | 说明 |
|------|------|
| `--runtime <runtime>` | FC runtime：nodejs20/nodejs22/python3.12/python3.13/docker |
| `--entry <entry>` | 入口文件路径（默认按 runtime 推断） |
| `--docker-daemon` | runtime=docker 时额外检测本机 Docker daemon 可用性 |

#### `licell deploy plan`

只读取 repo 中的 licell deploy config，输出 artifact -> 阿里云目标服务 -> 访问入口 的计划与风险提示。

说明：
- 默认会优先读取 `.licell/state.json` 里最近一次 batch bootstrap 记录的 selectedComponents；若不存在，再回退到当前 workspace 的全部 deployable components。
- 传 `--component` / `--include` / `--exclude` 时，会显式覆盖默认的 bootstrap selection。

示例命令：
- `licell deploy plan`
- `licell deploy plan --component web --output json`
- `licell deploy plan --include web,api --output json`

下一步：
- primary · `licell bootstrap --all-discovered --apply --output json`：先让 licell 知道 repo 里哪些 component 是要部署的。
- secondary · `licell deploy plan --output json`：默认优先复用最近一次 batch bootstrap 的 selectedComponents。
- secondary · `licell deploy plan --include web,api --output json`：对当前需要推进的 deploy units 单独评估。

关键选项建议：
- `--component <name>`：只想看某一个明确 component 的部署计划时使用。 注意：component 必须已经存在于当前 workspace config 且配置了 deployType。
- `--include <names>`：只想为一部分已初始化的 deploy components 生成 plan 时使用。 注意：值为逗号分隔 component 名；会覆盖默认 bootstrap selection。
- `--exclude <names>`：想保留大部分 deploy components，但跳过 docs/demo/admin 等组件时使用。 注意：值为逗号分隔 component 名；会覆盖默认 bootstrap selection。

结构化结果：
- 返回每个 component 的部署计划、预期入口和 issues[]。
- `stage`：命令阶段标识。
- `rootDir`：项目根目录。
- `selectionSource`：`bootstrap` / `workspace` / `explicit-filter`，表示本次组件选择来源。
- `selectedComponents[]`：本次实际生成 plan 的 component 列表。
- `skippedComponents[]`：因为 bootstrap selection 或 include/exclude 被跳过的 component 列表。
- `components[]`：部署计划数组。

推荐流程：
- 1. 先做 bootstrap → `licell bootstrap --all-discovered --apply --output json`：先让 licell 知道 repo 里哪些 component 是要部署的。
- 2. 读取默认 deploy plan → `licell deploy plan --output json`：默认优先复用最近一次 batch bootstrap 的 selectedComponents。
- 3. 只看某部分 component → `licell deploy plan --include web,api --output json`：对当前需要推进的 deploy units 单独评估。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 只生成指定 component 的 deploy plan |
| `--include <names>` | 只为这些 component 生成 deploy plan（逗号分隔） |
| `--exclude <names>` | 跳过这些 component，不生成对应 deploy plan（逗号分隔） |

#### `licell deploy spec [runtime]`

查看 FC API 部署规格（给 Agent/开发者在 deploy 前对照）

参数：`[runtime]`

示例命令：
- `licell deploy spec`
- `licell deploy spec nodejs22`
- `licell deploy spec python3.13 --output json`

| 选项 | 说明 |
|------|------|
| `--all` | 输出全部 runtime 规格 |

#### `licell task config [name]`

查看任务函数的异步调用配置

参数：`[name]` · 子命令：`set`, `rm`

示例命令：
- `licell task config image-worker`
- `licell task config image-worker --target prod`
- `licell task config --output json`

下一步：
- primary · `licell task config [name] --output json`：先确认 asyncTask、重试次数、事件时效与回调目的地。
- secondary · `licell task config set [name] --output json`：按任务函数的投递/回调策略写入 async invoke config。
- secondary · `licell task invoke [name] --output json`：提交一个异步任务，验证配置已经生效。
- secondary · `licell task config rm [name]`：在确认影响面后，再执行高影响清理或回退操作。

决策指南：
- Mutate：执行目标动作：写入任务函数的异步调用配置 起手式：`licell task config set [name]`
- Cleanup：清理或回退：在确认影响面后，再执行高影响清理或回退操作。 起手式：`licell task config rm [name]`

结构化结果：
- `stage`：命令阶段标识。
- `functionName`：函数名。
- `qualifier`：alias/version；未传则为 `LATEST`。
- `configured`：当前 qualifier 是否已存在 async invoke config。
- `asyncTask`：是否启用 asyncTask；未配置时为 `null`。
- `maxAsyncRetryAttempts`：最大异步重试次数；未配置时为 `null`。
- `maxAsyncEventAgeInSeconds`：异步事件最大存活秒数；未配置时为 `null`。
- `destinationConfig`：成功/失败回调目的地；未配置时为 `null`。
  - `onSuccess`：成功回调目的地 ARN。
  - `onFailure`：失败回调目的地 ARN。

推荐流程：
- 1. 查看当前配置 → `licell task config [name] --output json`：先确认 asyncTask、重试次数、事件时效与回调目的地。
- 2. 更新配置 → `licell task config set [name] --output json`：按任务函数的投递/回调策略写入 async invoke config。
- 3. 验证执行 → `licell task invoke [name] --output json`：提交一个异步任务，验证配置已经生效。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |

#### `licell task info <taskId> [name]`

查看单个异步任务详情

参数：`<taskId>` `[name]`

说明：
- `<taskId>` 通常来自 `task invoke` 的返回结果，或从 `task list` 的摘要数组里挑选。

示例命令：
- `licell task info task-123 image-worker`
- `licell task info task-123 --target prod --output json`

下一步：
- primary · `licell task invoke [name] --output json`：直接提交一个新任务，并把返回的 `taskId` 带入后续排查。
- secondary · `licell task info <taskId> [name] --output json`：查看状态、return payload、事件流和失败原因。
- secondary · `licell fn logs [name] --once --output json`：当 `taskErrorMessage` 或 `returnPayload` 仍不足以定位问题时，继续查看函数日志。

结构化结果：
- `stage`：命令阶段标识。
- `functionName`：函数名。
- `qualifier`：alias/version；未传时为 `null`。
- `taskId`：异步任务 ID。
- `status`：任务状态。
- `requestId`：FC requestId。
- `returnPayload`：任务返回内容（若 FC 提供）。
- `taskPayload`：任务原始 payload（若 FC 提供）。
- `taskErrorMessage`：失败原因（若任务失败）。
- `events[]`：任务生命周期事件数组。
  - `eventId`：事件 ID。
  - `status`：该事件对应的状态。
  - `timestamp`：事件时间戳（毫秒）。
  - `eventDetail`：事件详情；有时会携带序列化后的 return payload 或错误上下文。

推荐流程：
- 1. 先获得 taskId → `licell task invoke [name] --output json`：直接提交一个新任务，并把返回的 `taskId` 带入后续排查。
- 2. 读取任务详情 → `licell task info <taskId> [name] --output json`：查看状态、return payload、事件流和失败原因。
- 3. 必要时结合日志排查 → `licell fn logs [name] --once --output json`：当 `taskErrorMessage` 或 `returnPayload` 仍不足以定位问题时，继续查看函数日志。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |

#### `licell task invoke [name]`

异步调用任务函数

参数：`[name]`

说明：
- 调用前会先检查目标 qualifier 上是否存在 async invoke config，且 `asyncTask=true`。
- 建议缓存返回的 `taskId`；后续 `task info`、`task list`、`task stop` 都以它为追踪主键。

示例命令：
- `licell task invoke image-worker --payload '{"image":"a.png"}'`
- `licell task invoke image-worker --target prod --task-id image-a`
- `licell task invoke --file payload.json --output json`

下一步：
- primary · `licell task config [name] --output json`：避免在目标 qualifier 没有启用 asyncTask 时直接调用失败。
- secondary · `licell task invoke [name] --output json`：拿到 `taskId`，作为后续跟踪状态与止损的唯一入口。
- secondary · `licell task info <taskId> [name] --output json`：查看状态、返回值与失败原因。

关键选项建议：
- `--target <target>`：需要命中某个 alias/version 的任务入口时使用。 注意：只会使用该 qualifier 上的 async invoke config；若没有配置会直接失败。
- `--payload <text>`：payload 很短，适合直接内联传入时使用。 注意：复杂 JSON 更建议改用 `--file`，避免 shell 转义错误。
- `--task-id <id>`：需要把业务 ID 映射到 FC 异步任务，便于后续查找与幂等控制时使用。 注意：必须满足 FC taskId 的格式限制；无效字符会直接报错。

结构化结果：
- `stage`：命令阶段标识。
- `functionName`：被调用的函数名。
- `qualifier`：alias/version；未传则为 LATEST。
- `taskId`：异步任务 ID；后续可用于 task info/list/stop。
- `statusCode`：FC InvokeFunction 返回状态码。
- `invocationType`：固定为 `Async`。
- `body`：FC InvokeFunction 返回的原始 body。

推荐流程：
- 1. 先确认 async 配置 → `licell task config [name] --output json`：避免在目标 qualifier 没有启用 asyncTask 时直接调用失败。
- 2. 提交异步任务 → `licell task invoke [name] --output json`：拿到 `taskId`，作为后续跟踪状态与止损的唯一入口。
- 3. 查询任务详情 → `licell task info <taskId> [name] --output json`：查看状态、返回值与失败原因。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--payload <text>` | 传入原始 payload 文本 |
| `--file <path>` | 从文件读取 payload |
| `--task-id <id>` | 自定义业务任务 ID（便于后续查询） |

#### `licell task list [name]`

查看任务函数的异步任务列表

参数：`[name]`

说明：
- 适合按状态、前缀或时间窗扫描一批异步任务；若已知 `taskId`，优先直接用 `task info` 精确查询。
- 结果里的 `tasks[]` 是摘要视图；需要完整事件流、return payload 或错误详情时，再继续查 `task info`。

示例命令：
- `licell task list image-worker --target prod`
- `licell task list --status Running --limit 50`
- `licell task list --output json`

下一步：
- primary · `licell task list [name] --output json`：快速定位最近的任务、状态分布和可继续下钻的 `taskId`。
- secondary · `licell task info <taskId> [name] --output json`：对某个异常或已完成任务读取 return payload、事件流与失败原因。
- secondary · `licell task stop <taskId> [name] --output json`：当任务持续 Running 或需要人工止损时，直接发起停止。

关键选项建议：
- `--status <status>`：只想看某个生命周期状态，例如 `Running`、`Succeeded`、`Failed`、`Stopped` 时使用。 注意：如果排查“刚提交但尚未开始”的任务，建议不要过早加过窄的状态过滤。
- `--prefix <prefix>`：你给任务设置了稳定前缀型 `--task-id` 时使用，适合按业务批次筛选。 注意：仅按前缀匹配，不做模糊包含。
- `--limit <n>`：需要扩大扫描窗口时使用。 注意：单次最大 200；更大的历史扫描建议配合时间窗反复查询。
- `--sort <order>`：需要按时间升序/降序查看任务时使用。 注意：默认排序由 FC 服务端决定；排查最近任务时通常建议用 `desc`。

结构化结果：
- 返回任务摘要数组；适合做轮询、状态聚合与后续挑选 `taskId`。
- `stage`：命令阶段标识。
- `functionName`：函数名。
- `qualifier`：alias/version；未传则为 `null`。
- `count`：本次返回的任务数量。
- `tasks[]`：异步任务摘要数组。
  - `taskId`：异步任务 ID。
  - `status`：任务状态。
  - `startedTime`：任务开始时间（毫秒时间戳）。
  - `endTime`：任务结束时间（毫秒时间戳）。
  - `durationMs`：任务执行时长（毫秒）。
  - `alreadyRetriedTimes`：已重试次数。
  - `destinationStatus`：回调目的地投递状态。
  - `qualifier`：任务实际命中的 qualifier。
  - `requestId`：FC requestId。
  - `taskErrorMessage`：失败原因（若任务失败）。
- `nextToken`：服务端下一页游标；若为 `null` 代表没有更多结果。

推荐流程：
- 1. 先列出任务摘要 → `licell task list [name] --output json`：快速定位最近的任务、状态分布和可继续下钻的 `taskId`。
- 2. 查看单个任务详情 → `licell task info <taskId> [name] --output json`：对某个异常或已完成任务读取 return payload、事件流与失败原因。
- 3. 必要时终止运行中任务 → `licell task stop <taskId> [name] --output json`：当任务持续 Running 或需要人工止损时，直接发起停止。

Agent Tips：
- Agent 如果已经拿到明确 `taskId`，应优先调用 `task info`；`task list` 更适合扫描、补偿和兜底发现。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--status <status>` | 按任务状态过滤（如 Running/Succeeded/Failed/Stopped） |
| `--prefix <prefix>` | 按任务 ID 前缀过滤 |
| `--limit <n>` | 返回数量，默认 20，最大 200 |
| `--include-payload` | 让 FC 在列表中携带任务 payload（如服务端支持） |
| `--sort <order>` | 按时间排序：asc 或 desc |
| `--started-time-begin <ms>` | 按开始时间过滤（毫秒时间戳） |
| `--started-time-end <ms>` | 按开始时间过滤（毫秒时间戳） |

#### `licell task stop <taskId> [name]`

停止正在运行的异步任务

参数：`<taskId>` `[name]`

示例命令：
- `licell task stop task-123 image-worker`
- `licell task stop task-123 --target prod --output json`

下一步：
- primary · `licell task info <taskId> [name] --output json`：避免对已经完成或已经失败的任务重复执行 stop。
- secondary · `licell task stop <taskId> [name] --output json`：对长时间 Running 或需要人工止损的任务发起终止。

结构化结果：
- `stage`：命令阶段标识。
- `functionName`：函数名。
- `taskId`：被停止的异步任务 ID。
- `qualifier`：alias/version；未传时为 `null`。

推荐流程：
- 1. 先确认任务状态 → `licell task info <taskId> [name] --output json`：避免对已经完成或已经失败的任务重复执行 stop。
- 2. 停止任务 → `licell task stop <taskId> [name] --output json`：对长时间 Running 或需要人工止损的任务发起终止。
- 3. 回查终止结果 → `licell task info <taskId> [name] --output json`：确认状态已经进入 `Stopped` 或其他终态。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |

#### `licell task config rm [name]`

删除任务函数的异步调用配置

参数：`[name]`

说明：
- 删除后，该 qualifier 上的 `licell task invoke` 将不可用，直到重新执行 `task config set` 或 `deploy --type task`。

示例命令：
- `licell task config rm image-worker --target prod`
- `licell task config rm image-worker --yes --output json`

下一步：
- primary · `licell task config [name] --output json`：避免误删正在承接流量的 qualifier 配置。
- secondary · `licell task config rm [name] --yes --output json`：清理不再使用的 async invoke config。
- secondary · `licell task config set [name] --output json`：若后续仍需任务能力，可直接重建最小配置。

结构化结果：
- `stage`：命令阶段标识。
- `functionName`：函数名。
- `qualifier`：alias/version；未传则为 `LATEST`。
- `removed`：是否实际删除到了 async invoke config。

推荐流程：
- 1. 先确认当前配置 → `licell task config [name] --output json`：避免误删正在承接流量的 qualifier 配置。
- 2. 删除配置 → `licell task config rm [name] --yes --output json`：清理不再使用的 async invoke config。
- 3. 必要时重新写回 → `licell task config set [name] --output json`：若后续仍需任务能力，可直接重建最小配置。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--yes` | 跳过二次确认（危险） |

#### `licell task config set [name]`

写入任务函数的异步调用配置

参数：`[name]`

说明：
- 默认会先读取当前 async invoke config，再做合并写回，避免把未显式修改的字段丢掉。
- 如果目标 qualifier 还没有配置，直接执行 `task config set` 会创建最小可用配置，并默认启用 asyncTask。

示例命令：
- `licell task config set image-worker --target prod`
- `licell task config set image-worker --max-retry-attempts 0 --max-event-age 600`
- `licell task config set image-worker --on-failure acs:mns:cn-hangzhou:123:/queues/dlq/messages`

下一步：
- primary · `licell task config [name] --output json`：避免误覆盖 alias 级别的现有 async 配置。
- secondary · `licell task config set [name] --output json`：按任务执行语义配置 asyncTask、重试和回调。
- secondary · `licell task invoke [name] --output json`：确保调用能成功进入任务队列。

关键选项建议：
- `--target <target>`：需要单独调整某个 alias/version 的任务配置，而不是修改 LATEST 时使用。 注意：`task invoke --target <alias>` 只会命中对应 qualifier 的 async invoke config。
- `--max-retry-attempts <n>`：需要限制重复执行次数时使用；任务幂等性较弱时通常建议显式设为 `0` 或较小值。 注意：值越大，因瞬时错误导致的重复执行概率越高。
- `--max-event-age <seconds>`：需要限制异步事件在队列中的最长存活时间时使用。 注意：超过时效的事件会被丢弃，不会继续执行。
- `--on-success <destination>`：需要在任务成功后投递回调到另一个云资源时使用。 注意：请确保目标 ARN 存在且当前函数角色具备投递权限。
- `--on-failure <destination>`：需要把失败任务统一投递到死信/补偿链路时使用。 注意：请结合 `task info` 与目标服务日志一起排查失败原因。

结构化结果：
- `stage`：命令阶段标识。
- `functionName`：函数名。
- `qualifier`：alias/version；未传则为 `LATEST`。
- `configured`：写入后始终为 `true`。
- `asyncTask`：写入后的 asyncTask 开关。
- `maxAsyncRetryAttempts`：写入后的最大异步重试次数；未配置时为 `null`。
- `maxAsyncEventAgeInSeconds`：写入后的异步事件最大存活秒数；未配置时为 `null`。
- `destinationConfig`：写入后的成功/失败回调目的地；未配置时为 `null`。

推荐流程：
- 1. 先看当前值 → `licell task config [name] --output json`：避免误覆盖 alias 级别的现有 async 配置。
- 2. 写入配置 → `licell task config set [name] --output json`：按任务执行语义配置 asyncTask、重试和回调。
- 3. 提交一次任务验证 → `licell task invoke [name] --output json`：确保调用能成功进入任务队列。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--enable` | 显式启用 asyncTask（默认行为） |
| `--disable` | 显式关闭 asyncTask |
| `--max-retry-attempts <n>` | 设置最大异步重试次数（整数，支持 0） |
| `--max-event-age <seconds>` | 设置异步事件最大存活秒数（正整数） |
| `--on-success <destination>` | 设置成功回调目的地 ARN |
| `--on-failure <destination>` | 设置失败回调目的地 ARN |
| `--clear-on-success` | 清除成功回调目的地 |
| `--clear-on-failure` | 清除失败回调目的地 |

#### `licell release list`

查看函数版本列表

示例命令：
- `licell release list`
- `licell release list --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--limit <n>` | 返回版本数量，默认 20 |

#### `licell release promote [versionId]`

发布并切流到目标别名

参数：`[versionId]`

示例命令：
- `licell release promote [versionId]`
- `licell release promote [versionId] --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 目标别名，默认 prod |

#### `licell release prune`

清理历史函数版本（默认仅预览）

说明：
- 默认仅预览；传 `--apply` 才会真正删除。

示例命令：
- `licell release prune`
- `licell release prune --keep 5`
- `licell release prune --apply --yes`

下一步：
- primary · `licell release prune --output json`：先看待删除项，避免误删历史版本。
- secondary · `licell release prune --keep <n>`：根据回滚需求决定最小保留版本数量。
- secondary · `licell release prune --apply --yes`：在非交互场景下执行真实清理。

关键选项建议：
- `--keep <n>`：需要显式控制保留最近多少个版本时使用。 注意：数值过小可能导致缺少可回滚版本。
- `--apply`：确认预览结果后，再加上它执行真实删除。 注意：不加时仅预览；加上后会真正删除。
- `--yes`：非交互自动化场景下跳过二次确认时使用。 注意：建议仅在前一步已经做过预览时使用。
- `--preview`：你想清理预览域名绑定，而不是函数版本时使用。 注意：不要和函数版本清理目标混淆。

推荐流程：
- 1. 先预览 → `licell release prune --output json`：先看待删除项，避免误删历史版本。
- 2. 调整保留数 → `licell release prune --keep <n>`：根据回滚需求决定最小保留版本数量。
- 3. 确认后执行 → `licell release prune --apply --yes`：在非交互场景下执行真实清理。

Agent Tips：
- Agent 先执行默认预览，再决定是否加 `--apply`。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--keep <n>` | 保留最近 N 个版本，默认 10 |
| `--apply` | 执行删除，未传则仅预览 |
| `--yes` | 跳过二次确认（危险） |
| `--preview` | 清理预览域名绑定（而非函数版本） |

#### `licell release rollback <versionId>`

回滚到指定函数版本

参数：`<versionId>`

示例命令：
- `licell release rollback <versionId>`
- `licell release rollback <versionId> --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 目标别名，默认 prod |

#### `licell logs query [query]`

按 SLS project/logstore/query 一次性检索日志

参数：`[query]`

说明：
- 对日志进行查询前，目标 Logstore 需要先创建索引；字段查询是否生效也取决于对应字段的索引类型。
- 位置参数 `query` 与 `--query` 二选一；复杂查询建议整体加引号。
- `query` 会原样透传给 SLS `GetLogs.query`；licell 不会把 skill 里的写法或自定义 DSL 转换成另一套查询语法。
- SLS 官方语法里：`*` 表示无过滤条件；全文检索可用 `GET or POST`；字段检索可用 `request_method:GET`；数值字段可用 `request_time_msec>50`。
- 查询语句与分析语句可通过 `|` 分隔，例如 `request_method:GET | select count(*) as total`。
- 如果不确定目标 logstore 的字段索引 / 分词规则，先用 `*` 拉原始日志，再在本地基于 `--output json` 结果做聚合或过滤。
- `field:value` / `field:"value"` 这类过滤是否有效，取决于目标 logstore 是否已为对应字段建立索引。
- `logs query` 不会隐式追加 `functionName` 过滤；函数日志请改用 `licell fn logs`，或直接在 query 里写 `functionName:"..."`。
- 这是通用的一次性检索入口，适合 Agent / 自动化配合 `--output json` 使用。

示例命令：
- `licell logs query --output json`
- `licell logs query '*' --output json`
- `licell logs query 'GET or POST' --output json`
- `licell logs query 'request_method:GET and status:200' --output json`
- `licell logs query -p your-project -s your-store '*' --lines 200 --output json`
- `licell logs query -p your-project -s your-store 'request_method:GET | select count(*) as total' --power-sql --output json`
- `licell logs query -p your-project -s your-store --from 1710000000 --to 1710000300 --output json`

下一步：
- primary · `licell logs query --output json`：先确认自动发现到的默认 project/logstore 是否有结果。
- secondary · `licell logs query -p <project> -s <store> --output json`：确认目标日志源正确。
- secondary · `licell logs query -p <project> -s <store> '*' --output json`：先确认日志字段长什么样，再决定是否在 SLS 侧筛选。
- secondary · `licell logs query -p <project> -s <store> '<sls-query>' --output json`：确认字段已建索引后，再逐步收敛查询条件。

关键选项建议：
- `-p, --project <project>`：日志不在自动探测到的默认 FC project 时使用。
- `-s, --store <logstore>`：日志不在自动选择的默认 logstore 时使用。
- `--query <query>`：要直接写原生 SLS 查询语句、SQL pipeline 或显式传入 `*` 时使用。
- `--from <epochSeconds>`：需要锁定历史时间范围时使用。
- `--to <epochSeconds>`：需要锁定结束时间时使用。
- `--since <seconds>`：快速查看最近 N 秒日志，替代手动换算 `--from`。
- `--reverse`：希望优先拿到最近日志时使用。
- `--power-sql`：查询里带 SQL pipeline 时使用。

结构化结果：
- 返回一次性 SLS 查询结果。
- `stage`：固定为 `logs.query`。
- `project`：实际查询的 SLS project。
- `logstore`：实际查询的 SLS logstore。
- `region`：实际连接的地域。
- `topic`：topic 过滤条件；未设置则为 null。
- `query`：最终生效的 SLS 查询语句。
- `from`：查询起始 Unix 秒。
- `to`：查询结束 Unix 秒。
- `count`：返回日志条数。
- `entries`：原始日志数组。

推荐流程：
- 1. 先查默认日志源 → `licell logs query --output json`：先确认自动发现到的默认 project/logstore 是否有结果。
- 2. 切到自定义 project/logstore → `licell logs query -p <project> -s <store> --output json`：确认目标日志源正确。
- 3. 先用 * 看原始日志 → `licell logs query -p <project> -s <store> '*' --output json`：先确认日志字段长什么样，再决定是否在 SLS 侧筛选。
- 4. 再尝试 SLS 原生过滤或 SQL → `licell logs query -p <project> -s <store> '<sls-query>' --output json`：确认字段已建索引后，再逐步收敛查询条件。
- 5. 需要持续观察时再 tail → `licell logs tail -p <project> -s <store> '*'`：确认日志源与查询语句正确后，切到流式跟随。

Agent Tips：
- Agent 优先使用 `licell logs query --output json`。
- 复杂查询条件统一放进一个带引号的 `query` 字符串。
- 如果字段过滤不稳定，优先执行 `licell logs query '*' --output json`，再在本地聚合或过滤。

| 选项 | 说明 |
|------|------|
| `-p, --project <project>` | SLS project；未传时自动探测当前地域默认 FC 日志项目 |
| `-s, --store <logstore>` | SLS logstore；未传时按 project 自动选择默认 logstore |
| `-r, --region <region>` | SLS region，默认当前登录地域 |
| `-t, --topic <topic>` | 按 topic 过滤 |
| `--query <query>` | SLS 查询语句；也可直接作为位置参数传入 |
| `--from <epochSeconds>` | 起始时间（Unix 秒） |
| `--to <epochSeconds>` | 结束时间（Unix 秒） |
| `--since <seconds>` | 向前回看多少秒；默认 120 |
| `--window <seconds>` | 与 `--since` 等价，兼容旧习惯 |
| `--lines <n>` | 最大日志条数（默认 1000） |
| `--reverse` | 按时间倒序请求日志 |
| `--power-sql` | 启用 SLS PowerSQL 模式 |

#### `licell logs tail [query]`

按 SLS project/logstore/query 持续跟随日志流

参数：`[query]`

说明：
- 对日志进行查询前，目标 Logstore 需要先创建索引；字段查询是否生效也取决于对应字段的索引类型。
- 位置参数 `query` 与 `--query` 二选一；复杂查询建议整体加引号。
- `query` 会原样透传给 SLS `GetLogs.query`；licell 不会把 skill 示例或本地过滤语法翻译成 SLS 查询。
- SLS 官方语法里：`*` 表示无过滤条件；全文检索可用 `GET or POST`；字段检索可用 `request_method:GET`；数值字段可用 `request_time_msec>50`。
- `logs tail` 是持续流式命令，不支持 `--output json`；需要结构化结果时请改用 `licell logs query --output json`。
- 如果不确定字段过滤是否生效，先用 `licell logs query '*' --output json` 验证，再切回 tail。
- `logs tail` 不会隐式追加 `functionName` 过滤；函数日志请改用 `licell fn logs`，或直接在 query 里写 `functionName:"..."`。

示例命令：
- `licell logs tail`
- `licell logs tail '*'`
- `licell logs tail 'GET or POST'`
- `licell logs tail 'request_method:GET and status:200'`
- `licell logs tail -p your-project -s your-store '*'`
- `licell logs tail -p your-project -s your-store '*' --since 300`

下一步：
- primary · `licell logs query -p <project> -s <store> '*' --output json`：先确认日志源、字段与返回格式都正确。
- secondary · `licell logs tail -p <project> -s <store> '*'`：查询语句正确后，持续观察新日志。

关键选项建议：
- `-p, --project <project>`：日志不在自动探测到的默认 FC project 时使用。
- `-s, --store <logstore>`：日志不在自动选择的默认 logstore 时使用。
- `--query <query>`：要直接写原生 SLS 查询语法，或显式传入 `*` 监听全部日志时使用。
- `--from <epochSeconds>`：需要从固定历史时刻开始回放并继续跟随时使用。
- `--since <seconds>`：从最近 N 秒开始进入 tail，替代手动换算 `--from`。
- `--power-sql`：查询里带 SQL pipeline 时使用。

推荐流程：
- 1. 先 query 验证语句 → `licell logs query -p <project> -s <store> '*' --output json`：先确认日志源、字段与返回格式都正确。
- 2. 再进入 tail → `licell logs tail -p <project> -s <store> '*'`：查询语句正确后，持续观察新日志。

Agent Tips：
- Agent 不要对 `logs tail` 使用 `--output json`；改用 `logs query`。
- 如果筛选条件来源于外部 skill/文档，先在 `logs query` 里用 `*` 验证日志结构。

| 选项 | 说明 |
|------|------|
| `-p, --project <project>` | SLS project；未传时自动探测当前地域默认 FC 日志项目 |
| `-s, --store <logstore>` | SLS logstore；未传时按 project 自动选择默认 logstore |
| `-r, --region <region>` | SLS region，默认当前登录地域 |
| `-t, --topic <topic>` | 按 topic 过滤 |
| `--query <query>` | SLS 查询语句；也可直接作为位置参数传入 |
| `--from <epochSeconds>` | 起始时间（Unix 秒） |
| `--since <seconds>` | 起始回看多少秒；默认 60 |
| `--window <seconds>` | 与 `--since` 等价，兼容旧习惯 |
| `--lines <n>` | 每次轮询最大日志条数（默认 1000） |
| `--power-sql` | 启用 SLS PowerSQL 模式 |

#### `licell fn info [name]`

查看函数详情

参数：`[name]`

示例命令：
- `licell fn info [name]`
- `licell fn info [name] --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |

#### `licell fn invoke [name]`

调用函数（同步）

参数：`[name]`

示例命令：
- `licell fn invoke [name]`
- `licell fn invoke [name] --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--payload <text>` | 传入原始 payload 文本 |
| `--file <path>` | 从文件读取 payload |

#### `licell fn list`

查看函数列表

示例命令：
- `licell fn list`
- `licell fn list --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 20 |
| `--prefix <prefix>` | 按函数名前缀过滤 |

#### `licell fn logs [name]`

查看函数日志（默认实时流式）

参数：`[name]`

说明：
- 默认读取当前函数在 FC 默认 SLS project / logstore 中的日志；会自动探测 FC 2.0 / 3.0 的默认日志项目。
- 需要跨 project/logstore 或自定义 SLS 语法时，改用 `licell logs query` 或 `licell logs tail`。
- 当使用 `--output json` 时，会自动退化为一次性拉取模式，避免持续流式输出。

示例命令：
- `licell fn logs`
- `licell fn logs my-function`
- `licell fn logs my-function --once --window 300 --output json`
- `licell logs query -p your-project -s your-store '*' --output json`

下一步：
- primary · `licell fn logs [name] --once --output json`：先确认当前函数是否有日志以及日志格式。
- secondary · `licell fn logs [name] --once --window 300 --output json`：排查较早前的报错或冷启动日志。
- secondary · `licell fn logs [name]`：确认问题仍在发生时，持续观察新日志。
- secondary · `licell logs query -p <project> -s <store> --output json`：需要跨 logstore 或使用更复杂的查询条件时使用。

关键选项建议：
- `--once`：需要抓取最近一批日志并立即退出时使用。
- `--window <seconds>`：一次性抓取时需要扩大或缩小时间范围时使用。
- `--lines <n>`：希望限制单次请求返回的最大日志条数时使用。

结构化结果：
- 返回某个函数的一次性日志抓取结果。
- `stage`：固定为 `fn.logs`。
- `functionName`：实际查询的函数名。
- `once`：是否为一次性抓取模式。
- `lines`：日志行数组；流式模式下不返回。
- `count`：返回日志条数。

推荐流程：
- 1. 先单次拉取 → `licell fn logs [name] --once --output json`：先确认当前函数是否有日志以及日志格式。
- 2. 必要时扩大时间窗 → `licell fn logs [name] --once --window 300 --output json`：排查较早前的报错或冷启动日志。
- 3. 进入实时流 → `licell fn logs [name]`：确认问题仍在发生时，持续观察新日志。
- 4. 切换到通用 SLS 查询 → `licell logs query -p <project> -s <store> --output json`：需要跨 logstore 或使用更复杂的查询条件时使用。

Agent Tips：
- Agent 优先使用 `licell fn logs [name] --once --output json`。
- 如果要查询任意 SLS logstore，改用 `licell logs query --output json`。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--once` | 仅拉取一次最近日志并退出 |
| `--window <seconds>` | 一次拉取模式的时间窗（默认 120 秒） |
| `--lines <n>` | 每次请求最大日志条数（默认 1000） |

#### `licell fn rm [name]`

删除函数

参数：`[name]`

示例命令：
- `licell fn rm [name]`
- `licell fn rm [name] --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--force` | 级联删除触发器、alias、已发布版本后再删除函数 |
| `--yes` | 跳过二次确认（危险） |

#### `licell fn domain bind <domain>`

绑定或更新 FC 自定义域名路由。

参数：`<domain>`

示例命令：
- `licell fn domain bind <domain>`
- `licell fn domain bind <domain> --output json`

下一步：
- primary · `licell fn domain list --output json`：先确认该地域已存在的自定义域名，避免重复或覆盖。
- secondary · `licell fn domain bind <domain> --function <name> --target <target>`：以资源级方式创建或更新 FC custom domain。
- secondary · `licell domain app bind <domain> --ssl`：跨资源编排更适合交给 workflow 命令处理。

关键选项建议：
- `--function <name>`：当当前目录不是 licell 项目，或你要显式绑定到其他函数时使用。
- `--target <target>`：需要将域名路由到指定 alias / version 时使用，例如 prod、preview、1。
- `--ensure-dns`：希望顺手确保 DNS CNAME 指向当前账号 FC 网关时使用。 注意：该选项会写入 DNS，因此需要额外的 DNS 权限。
- `--function <name>`：当当前目录不是 licell 项目，或你要显式绑定到其他函数时使用。
- `--target <target>`：需要将域名路由到指定 alias / version 时使用，例如 prod、preview、1。
- `--ensure-dns`：希望顺手确保 DNS CNAME 指向当前账号 FC 网关时使用。 注意：该选项会写入 DNS，因此需要额外的 DNS 权限。

结构化结果：
- 结构化结果会返回 FC 自定义域名的目标函数、路由与最终状态快照。
- `stage`：命令阶段标识。
- `bound`：结果布尔态字段。
- `domain`：绑定后的 FC 自定义域名。
- `functionName`：目标函数名。
- `qualifier`（可选）：目标 alias / version。
- `path`：路由路径。
- `protocol`：接入协议。
- `ensureDns`：本次是否顺带确保了 DNS CNAME。
- `info`：FC 返回的 custom domain 状态快照。

推荐流程：
- 1. 查看现状 → `licell fn domain list --output json`：先确认该地域已存在的自定义域名，避免重复或覆盖。
- 2. 绑定 FC 域名 → `licell fn domain bind <domain> --function <name> --target <target>`：以资源级方式创建或更新 FC custom domain。
- 3. 需要 DNS / SSL 时改走 workflow → `licell domain app bind <domain> --ssl`：跨资源编排更适合交给 workflow 命令处理。

| 选项 | 说明 |
|------|------|
| `--function <name>` | 指定函数名；默认使用当前项目 appName |
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--path <path>` | 路由路径，默认 /* |
| `--protocol <protocol>` | 自定义域名协议，默认 HTTP |
| `--ensure-dns` | 同时确保 DNS CNAME 指向当前账号 FC 网关 |
| `--function <name>` | 指定函数名；默认使用当前项目 appName |
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 指定 alias/version（如 prod/preview/1） |
| `--path <path>` | 路由路径，默认 /* |
| `--protocol <protocol>` | 自定义域名协议，默认 HTTP |
| `--ensure-dns` | 同时确保 DNS CNAME 指向当前账号 FC 网关 |

#### `licell fn domain list`

查看 FC 自定义域名列表

示例命令：
- `licell fn domain list`
- `licell fn domain list --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 20 |
| `--prefix <prefix>` | 按域名前缀过滤 |

#### `licell fn domain unbind <domain>`

解绑 FC 自定义域名，可选同步清理 DNS。

参数：`<domain>`

示例命令：
- `licell fn domain unbind <domain>`
- `licell fn domain unbind <domain> --output json`

关键选项建议：
- `--cleanup-dns`：确认该域名对应的 DNS CNAME 也应一起移除时使用。 注意：会删除匹配的 DNS CNAME 记录，请先执行 `licell dns records list <domain>` 确认。

结构化结果：
- 结构化结果会返回解绑状态与 DNS 清理结果。
- `stage`：命令阶段标识。
- `unbound`：结果布尔态字段。
- `domain`：已解绑的 FC 自定义域名。
- `cleanupDns`：是否请求同步清理 DNS。
- `removedDnsRecordIds`：被清理的 DNS 记录 ID 列表。

| 选项 | 说明 |
|------|------|
| `--cleanup-dns` | 同时清理对应 DNS CNAME |
| `--yes` | 跳过二次确认（危险） |

#### `licell env list`

查看云端环境变量

示例命令：
- `licell env list`
- `licell env list --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 查看指定 FC alias 的环境变量（如 prod/preview） |
| `--show-values` | 显示完整变量值（默认隐藏） |

#### `licell env pull`

拉取云端环境变量

说明：
- 默认会把云端环境变量同步到本地 `.licell/project.json` 与 `.env`。
- 传入 `--target` 时，会把指定 alias/version 的环境变量写入 `.env`，但不会覆盖本地项目默认环境变量。

示例命令：
- `licell env pull`
- `licell env pull --output json`

关键选项建议：
- `--target <target>`：需要查看或导出某个 alias / version 的环境变量快照时使用。 注意：该模式只更新 `.env`，不会覆盖本地 `.licell/project.json` 默认 env。

结构化结果：
- 返回本次拉取的 qualifier、环境变量数量、`.env` 写入结果，以及是否同步了本地项目配置。
- `stage`：命令阶段标识。
- `qualifier`：本次拉取的 alias / version；默认函数环境时为 null。
- `count`：本次拉取到的环境变量数量。
- `envFile`：写入的本地 `.env` 文件路径。
- `emptied`：云端无环境变量时，是否已清空 `.env`。
- `projectConfigSynced`：是否已把拉取结果同步回本地 `.licell/project.json`。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--target <target>` | 从指定 FC alias 拉取环境变量（如 prod/preview） |

#### `licell env rm <key>`

删除云端环境变量（并同步本地 .licell/project.json）

参数：`<key>`

说明：
- 会同时删除云端环境变量与本地 `.licell/project.json` 中对应项。

示例命令：
- `licell env rm API_KEY`
- `licell env rm API_KEY --output json`

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--yes` | 跳过二次确认（危险） |

#### `licell env set <key> <value>`

设置云端环境变量（并同步本地 .licell/project.json）

参数：`<key>` `<value>`

示例命令：
- `licell env set API_BASE_URL https://api.example.com`
- `licell env set NODE_ENV production --output json`

下一步：
- primary · `licell env list --output json`：避免覆盖已有变量或拼错 key。
- secondary · `licell env set <key> <value> --output json`：同时更新云端与本地项目配置。
- secondary · `licell env pull --output json`：确保云端状态与本地项目配置一致。

推荐流程：
- 1. 先查看现状 → `licell env list --output json`：避免覆盖已有变量或拼错 key。
- 2. 设置变量 → `licell env set <key> <value> --output json`：同时更新云端与本地项目配置。
- 3. 必要时回拉确认 → `licell env pull --output json`：确保云端状态与本地项目配置一致。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |

#### `licell domain app bind <domain>`

为当前应用编排 DNS CNAME、FC custom domain，并可选自动开启 HTTPS。

参数：`<domain>`

示例命令：
- `licell domain app bind <domain>`
- `licell domain app bind <domain> --output json`

关键选项建议：
- `--ssl`：希望在绑定后立即具备 HTTPS 能力时使用。
- `--ssl-force-renew`：需要忽略续签阈值，强制重新签发证书时使用。 注意：必须与 `--ssl` 一起使用。
- `--target <target>`：希望把域名流量路由到指定 alias（如 prod / preview）时使用。
- `--ssl`：希望在绑定后立即具备 HTTPS 能力时使用。
- `--ssl-force-renew`：需要忽略续签阈值，强制重新签发证书时使用。 注意：必须与 `--ssl` 一起使用。
- `--target <target>`：希望把域名流量路由到指定 alias（如 prod / preview）时使用。

结构化结果：
- 结构化结果会返回域名绑定后的 alias / HTTPS 状态与最终访问地址。
- `stage`：命令阶段标识。
- `bound`：结果布尔态字段。
- `workflow`：固定为 app。
- `domain`：绑定后的自定义域名。
- `releaseTarget`（可选）：域名当前路由到的 FC alias。
- `ssl`：本次是否请求自动开启 HTTPS。
- `aliasEnsured`：是否已自动确保 alias 存在并指向版本。
- `aliasVersionId`（可选）：alias 最终对应的版本号。
- `httpsConfigured`：最终是否已可通过 HTTPS 访问。
- `finalUrl`：最终访问 URL。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--ssl` | 自动配置 Let's Encrypt 免费证书开启 HTTPS |
| `--ssl-force-renew` | 配合 --ssl 强制续签证书（忽略到期阈值） |
| `--target <target>` | 将域名路由到指定 FC alias（如 prod/preview） |
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--ssl` | 自动配置 Let's Encrypt 免费证书开启 HTTPS |
| `--ssl-force-renew` | 配合 --ssl 强制续签证书（忽略到期阈值） |
| `--target <target>` | 将域名路由到指定 FC alias（如 prod/preview） |

#### `licell domain app unbind <domain>`

解绑应用域名，并清理对应 FC custom domain / DNS CNAME。

参数：`<domain>`

示例命令：
- `licell domain app unbind <domain>`
- `licell domain app unbind <domain> --output json`

结构化结果：
- 结构化结果会返回已解绑域名，以及实际清理到的 FC / DNS 资源。
- `stage`：命令阶段标识。
- `unbound`：结果布尔态字段。
- `workflow`：固定为 app。
- `domain`：已解绑的自定义域名。
- `removedCustomDomain`：是否删除了对应 FC custom domain。
- `removedDnsRecordIds`：被清理的 DNS 记录 ID 列表。

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过二次确认（危险） |

#### `licell domain static bind <domain>`

将静态站点域名接到 CDN，并把 DNS CNAME 切到 CDN；可选自动启用 HTTPS。

参数：`<domain>`

示例命令：
- `licell domain static bind <domain>`
- `licell domain static bind <domain> --output json`

关键选项建议：
- `--bucket <bucket>`：当前目录不是 licell 项目，或需要显式指定已有 OSS Bucket 时使用。
- `--ssl`：希望在静态域名接入后立即具备 CDN HTTPS 能力时使用。
- `--ssl-force-renew`：需要忽略续签阈值，强制重新签发证书时使用。 注意：必须与 `--ssl` 一起使用。
- `--bucket <bucket>`：当前目录不是 licell 项目，或需要显式指定已有 OSS Bucket 时使用。
- `--ssl`：希望在静态域名接入后立即具备 CDN HTTPS 能力时使用。
- `--ssl-force-renew`：需要忽略续签阈值，强制重新签发证书时使用。 注意：必须与 `--ssl` 一起使用。

结构化结果：
- 结构化结果会返回静态域名接入 CDN 后的源站、CNAME 与最终访问 URL。
- `stage`：命令阶段标识。
- `bound`：结果布尔态字段。
- `workflow`：固定为 static。
- `domain`：绑定后的静态站点域名。
- `bucket`：关联的 OSS Bucket 名称。
- `originDomain`：CDN 回源使用的 OSS 域名。
- `cdnCname`：CDN 分配的 CNAME。
- `ssl`：本次是否请求自动开启 HTTPS。
- `httpsConfigured`：最终是否已可通过 HTTPS 访问。
- `finalUrl`：最终访问 URL。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--bucket <bucket>` | 指定已有 OSS Bucket；默认使用当前项目推导出的 Bucket |
| `--ssl` | 自动签发证书并配置 CDN HTTPS |
| `--ssl-force-renew` | 配合 --ssl 强制续签证书（忽略到期阈值） |
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--bucket <bucket>` | 指定已有 OSS Bucket；默认使用当前项目推导出的 Bucket |
| `--ssl` | 自动签发证书并配置 CDN HTTPS |
| `--ssl-force-renew` | 配合 --ssl 强制续签证书（忽略到期阈值） |

#### `licell domain static unbind <domain>`

解绑静态站点域名，并清理对应 CDN domain / DNS CNAME。

参数：`<domain>`

示例命令：
- `licell domain static unbind <domain>`
- `licell domain static unbind <domain> --output json`

结构化结果：
- 结构化结果会返回已解绑域名，以及实际清理到的 DNS 记录。
- `stage`：命令阶段标识。
- `unbound`：结果布尔态字段。
- `workflow`：固定为 static。
- `domain`：已解绑的静态站点域名。
- `removedDnsRecordIds`：被清理的 DNS 记录 ID 列表。

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过二次确认（危险） |

#### `licell dns records add <domain>`

添加一条 DNS 解析记录。

参数：`<domain>`

示例命令：
- `licell dns records add <domain>`
- `licell dns records add <domain> --output json`

结构化结果：
- 结构化结果会返回新建 recordId 和完整记录参数，便于后续自动化追踪。
- `stage`：命令阶段标识。
- `created`：结果布尔态字段。
- `domain`：记录所属根域名。
- `recordId`：新建后的 DNS recordId。
- `rr`：主机记录，例如 @ / www / api。
- `type`：记录类型，例如 A / CNAME / TXT。
- `value`：记录值。
- `ttl`：TTL 秒数。
- `line`：解析线路。

| 选项 | 说明 |
|------|------|
| `--rr <rr>` | 主机记录，如 @/www/api |
| `--type <type>` | 记录类型，如 A/CNAME/TXT |
| `--value <value>` | 记录值 |
| `--ttl <ttl>` | TTL 秒，默认 600 |
| `--line <line>` | 线路，默认 default |

#### `licell dns records list [domain]`

查看域名解析记录

参数：`[domain]`

示例命令：
- `licell dns records list [domain]`
- `licell dns records list [domain] --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 100 |

#### `licell dns records rm <recordId>`

删除一条 DNS 解析记录。

参数：`<recordId>`

示例命令：
- `licell dns records rm <recordId>`
- `licell dns records rm <recordId> --output json`

结构化结果：
- 结构化结果会返回被删除的 recordId。
- `stage`：命令阶段标识。
- `removed`：结果布尔态字段。
- `recordId`：被删除的 DNS recordId。

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过二次确认（危险） |

#### `licell oss bucket [bucket]`

兼容命令；等同 `licell oss upload`。

参数：`[bucket]`

示例命令：
- `licell oss bucket [bucket]`
- `licell oss bucket [bucket] --output json`

| 选项 | 说明 |
|------|------|
| `--bucket <bucket>` | Bucket 名称（可替代位置参数） |
| `--source-dir <dir>` | 本地目录（默认 dist） |
| `--target-dir <dir>` | Bucket 内目标目录前缀（如 mysite 或 mysite/v2） |

#### `licell oss create <bucket>`

创建 OSS Bucket

参数：`<bucket>`

示例命令：
- `licell oss create <bucket>`
- `licell oss create <bucket> --output json`

关键选项建议：
- `--acl <acl>`：需要显式决定 Bucket 是私有还是公共可读时使用。 注意：公共 ACL 可能被 Bucket 或账号级公共访问阻止策略拦截。
- `--storage-class <class>`：需要在创建时指定默认存储类型时使用。 注意：归档类存储适合冷数据，不适合频繁在线读取。
- `--redundancy <type>`：需要显式指定 LRS / ZRS 时使用。 注意：ZRS 通常成本更高，需按业务容灾目标选择。
- `--public-access-block <mode>`：需要在 Bucket 级别显式阻止公共 ACL 时使用。 注意：开启后不要再把 ACL 设为 public-read / public-read-write。

| 选项 | 说明 |
|------|------|
| `--acl <acl>` | Bucket ACL：private / public-read / public-read-write |
| `--storage-class <class>` | 默认存储类型：standard / ia / archive / cold-archive / deep-cold-archive |
| `--redundancy <type>` | 冗余类型：lrs / zrs |
| `--public-access-block <mode>` | Bucket 级公共访问阻止：on / off |

#### `licell oss list`

查看 OSS Bucket 列表

示例命令：
- `licell oss list`
- `licell oss list --limit 100`
- `licell oss list --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 50 |

#### `licell oss ls <bucket> [prefix]`

列出 Bucket 中的对象，可按 prefix 过滤。

参数：`<bucket>` `[prefix]`

示例命令：
- `licell oss ls my-bucket`
- `licell oss ls my-bucket assets/ --limit 200`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 100 |

#### `licell oss rm <bucket>`

删除 OSS Bucket（默认仅删空 Bucket）

参数：`<bucket>`

示例命令：
- `licell oss rm my-bucket --yes`
- `licell oss rm my-bucket --recursive --yes`

| 选项 | 说明 |
|------|------|
| `--recursive` | 先删除对象，再删除 Bucket（危险） |
| `--yes` | 跳过二次确认（危险） |

#### `licell oss update <bucket>`

更新 OSS Bucket 属性（ACL / 公共访问阻止）

参数：`<bucket>`

示例命令：
- `licell oss update my-bucket --acl private`
- `licell oss update my-bucket --public-access-block on`

| 选项 | 说明 |
|------|------|
| `--acl <acl>` | Bucket ACL：private / public-read / public-read-write |
| `--public-access-block <mode>` | Bucket 级公共访问阻止：on / off |

#### `licell oss upload [bucket]`

上传本地目录到指定 Bucket / 目录前缀。

参数：`[bucket]`

示例命令：
- `licell oss upload my-bucket --source-dir dist`
- `licell oss upload my-bucket --source-dir dist --target-dir web/v2`

| 选项 | 说明 |
|------|------|
| `--bucket <bucket>` | Bucket 名称（可替代位置参数） |
| `--source-dir <dir>` | 本地目录（默认 dist） |
| `--target-dir <dir>` | Bucket 内目标目录前缀（如 mysite 或 mysite/v2） |

#### `licell oss domain bind <bucket> <domain>`

为 Bucket 绑定原生 OSS 自定义域名

参数：`<bucket>` `<domain>`

说明：
- 如果提示域名所有权未验证，请先执行 `licell oss domain token`。

示例命令：
- `licell oss domain bind <bucket> <domain>`

结构化结果：
- 结构化结果会返回绑定的 Bucket / 域名，以及 OSS 返回的绑定状态。
- `stage`：命令阶段标识。
- `bound`：结果布尔态字段。
- `bucket`：目标 OSS Bucket 名称。
- `domain`：已绑定的自定义域名。
- `binding`：OSS 返回的域名绑定状态。

#### `licell oss domain token <bucket> <domain>`

为待绑定的 OSS 自定义域名生成 TXT 验证 token。

参数：`<bucket>` `<domain>`

示例命令：
- `licell oss domain token my-bucket static.example.com`
- `licell oss domain token my-bucket static.example.com --output json`

下一步：
- primary · `licell oss domain token <bucket> <domain> --output json`：先拿到 TXT 记录名和值。
- secondary · `licell dns records add <rootDomain> --rr <rr> --type TXT --value <token>`：完成 OSS 域名所有权验证。
- secondary · `licell oss domain bind <bucket> <domain>`：TXT 生效后正式把域名绑定到 Bucket。

结构化结果：
- 结构化结果会返回 OSS 域名验证 token，以及建议写入的 DNS TXT 记录。
- `stage`：命令阶段标识。
- `bucket`：目标 OSS Bucket 名称。
- `domain`：待验证的自定义域名。
- `token`：OSS 返回的域名验证 token。
- `dnsVerification`：推荐写入的 DNS TXT 记录信息。

推荐流程：
- 1. 生成 token → `licell oss domain token <bucket> <domain> --output json`：先拿到 TXT 记录名和值。
- 2. 补 DNS TXT → `licell dns records add <rootDomain> --rr <rr> --type TXT --value <token>`：完成 OSS 域名所有权验证。
- 3. 执行绑定 → `licell oss domain bind <bucket> <domain>`：TXT 生效后正式把域名绑定到 Bucket。

#### `licell oss domain unbind <bucket> <domain>`

解绑 Bucket 原生 OSS 自定义域名。

参数：`<bucket>` `<domain>`

示例命令：
- `licell oss domain unbind <bucket> <domain>`
- `licell oss domain unbind <bucket> <domain> --output json`

结构化结果：
- 结构化结果会返回解绑目标与最终解绑状态。
- `stage`：命令阶段标识。
- `unbound`：结果布尔态字段。
- `bucket`：目标 OSS Bucket 名称。
- `domain`：已解绑或尝试解绑的自定义域名。

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过二次确认（危险） |

#### `licell oss object get <bucket> <key> [file]`

下载单个对象到本地文件。

参数：`<bucket>` `<key>` `[file]`

示例命令：
- `licell oss object get my-bucket site/index.html ./index.html`
- `licell oss object get my-bucket site/app.js --file ./downloads/app.js`

关键选项建议：
- `--file <path>`：需要把对象保存到指定本地路径，而不是默认文件名时使用。 注意：如不指定，默认使用对象 key 的最后一个文件名。

| 选项 | 说明 |
|------|------|
| `--file <path>` | 本地文件路径（可替代位置参数） |

#### `licell oss object rm <bucket> <key>`

删除 OSS 对象

参数：`<bucket>` `<key>`

示例命令：
- `licell oss object rm my-bucket site/old.js --yes`

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过二次确认（危险） |

#### `licell oss sync down <bucket> [prefix]`

把 Bucket 中某个 prefix 的对象批量下载到本地目录。

参数：`<bucket>` `[prefix]`

示例命令：
- `licell oss sync down my-bucket --dest-dir ./downloads`
- `licell oss sync down my-bucket web --dest-dir ./downloads/web`

关键选项建议：
- `--dest-dir <dir>`：需要控制本地落盘目录时使用。 注意：对象 key 中的相对路径会映射到该目录下。

| 选项 | 说明 |
|------|------|
| `--dest-dir <dir>` | 本地目标目录（默认 oss-download/<bucket>） |

#### `licell oss sync up [bucket]`

同步本地目录到指定 Bucket / 目录前缀（等同 `licell oss upload`）。

参数：`[bucket]`

示例命令：
- `licell oss sync up [bucket]`
- `licell oss sync up [bucket] --output json`

| 选项 | 说明 |
|------|------|
| `--bucket <bucket>` | Bucket 名称（可替代位置参数） |
| `--source-dir <dir>` | 本地目录（默认 dist） |
| `--target-dir <dir>` | Bucket 内目标目录前缀（如 mysite 或 mysite/v2） |

### Data Services

数据库、缓存与 Supabase 实例的创建、连接、白名单和生命周期管理。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell db add` | 分配数据库实例 | `--type`, `--engine-version`, `--category`, `--class` |
| `licell db class [type]` | 查询数据库可用规格（给 Agent/开发者在 db add 前对照） | `--engine-version`, `--category`, `--storage-type`, `--zone` |
| `licell db connect [instanceId]` | 输出数据库连接信息 | — |
| `licell db info <instanceId>` | 查看数据库实例详情 | — |
| `licell db list` | 查看数据库实例列表 | `--limit` |
| `licell db public-access [instanceId]` | 开通数据库公网访问并添加当前 IP 到白名单 | `--ip` |
| `licell db rm <instanceId>` | 删除数据库实例 | `--yes` |
| `licell cache add` | 分配 Redis 缓存 | `--type`, `--mode`, `--instance`, `--password` |
| `licell cache class [mode]` | 查询缓存可用规格（给 Agent/开发者在 cache add 前对照） | `--zone`, `--limit` |
| `licell cache connect [instanceId]` | 输出缓存连接信息 | — |
| `licell cache info <instanceId>` | 查看缓存实例详情 | — |
| `licell cache list` | 查看缓存实例列表 | `--limit` |
| `licell cache public-access [instanceId]` | 开通 Redis 公网访问并添加当前 IP 到白名单 | `--ip` |
| `licell cache rm <instanceId>` | 删除缓存实例 | `--yes` |
| `licell cache rotate-password` | 轮换 Redis 密码 | `--instance` |
| `licell supa add` | 创建 RDS Supabase 实例 | `--name`, `--vsw`, `--class`, `--db-instance` |
| `licell supa config <instanceName>` | 查看 Supabase 实例配置（auth/storage/rag） | `--set-auth`, `--set-storage`, `--rag`, `--set-rag` |
| `licell supa connect <instanceName>` | 查看 Supabase 连接信息和 API Keys | — |
| `licell supa info <instanceName>` | 查看 Supabase 实例详情 | — |
| `licell supa list` | 查看 Supabase 实例列表 | `--limit` |
| `licell supa reset-password <instanceName>` | 重置 Supabase Dashboard 或数据库密码 | `--dashboard-password`, `--db-password` |
| `licell supa restart <instanceName>` | 重启 Supabase 实例 | — |
| `licell supa rm <instanceName>` | 删除 Supabase 实例 | `--yes` |
| `licell supa start <instanceName>` | 启动 Supabase 实例 | — |
| `licell supa stop <instanceName>` | 暂停 Supabase 实例 | — |
| `licell supa whitelist <instanceName>` | 查看/修改 Supabase IP 白名单 | `--set`, `--add`, `--remove`, `--group` |

#### `licell db add`

分配数据库实例

示例命令：
- `licell db add`
- `licell db add --output json`

| 选项 | 说明 |
|------|------|
| `--type <type>` | 数据库类型：postgresql 或 mysql（默认 serverless-postgresql，即将上线） |
| `--engine-version <version>` | 数据库引擎版本（postgres 默认 18.0，mysql 默认 8.0） |
| `--category <category>` | RDS Category（默认 serverless_basic） |
| `--class <instanceClass>` | 实例规格（如 pg.n2.serverless.1c） |
| `--storage <gb>` | 存储空间 GB（默认 20） |
| `--storage-type <storageType>` | 存储类型（默认 cloud_essd） |
| `--min-rcu <n>` | Serverless 最小 RCU（如 0.5） |
| `--max-rcu <n>` | Serverless 最大 RCU（如 8） |
| `--auto-pause <mode>` | 自动启停：on/off |
| `--zone <zoneId>` | 主可用区（如 cn-hangzhou-b） |
| `--zone-slave1 <zoneId>` | 备可用区 1（多可用区部署） |
| `--zone-slave2 <zoneId>` | 备可用区 2（多可用区部署） |
| `--vpc <vpcId>` | 指定 VPC ID |
| `--vsw <vSwitchId>` | 指定 VSwitch ID |
| `--security-ip-list <cidrs>` | 白名单 CIDR（逗号分隔） |
| `--description <text>` | 实例描述 |

#### `licell db class [type]`

查询数据库可用规格（给 Agent/开发者在 db add 前对照）

参数：`[type]`

说明：
- 查询口径与当前 `db add` 默认创建参数保持一致。
- 未传 `--zone` 且未开启 `--all-zones` 时，默认查询首个可用 zone。
- 开启 `--all-zones` 后，会同时返回 `class -> zoneIds` 和 `zone -> classes` 两种聚合视角。

示例命令：
- `licell db class`
- `licell db class postgresql --all-zones --limit 50`
- `licell db class mysql --zone cn-hangzhou-b --output json`

下一步：
- primary · `licell db class`：确认当前地域/可用区下有哪些 class 可选，再决定 `db add --class`。
- secondary · `licell db add --class <instanceClass>`：把选中的规格显式传给 db add。

推荐流程：
- 1. 先看可用规格 → `licell db class`：确认当前地域/可用区下有哪些 class 可选，再决定 `db add --class`。
- 2. 再执行创建 → `licell db add --class <instanceClass>`：把选中的规格显式传给 db add。

| 选项 | 说明 |
|------|------|
| `--engine-version <version>` | 数据库引擎版本（默认 postgresql=18.0，mysql=8.0） |
| `--category <category>` | RDS Category（默认 postgresql=Basic，mysql=serverless_basic） |
| `--storage-type <storageType>` | 存储类型（默认 cloud_essd） |
| `--zone <zoneId>` | 按可用区过滤（如 cn-hangzhou-b） |
| `--all-zones` | 聚合当前地域全部可用 zone 的 class，并标明每个 zone 有哪些规格 |
| `--limit <n>` | 输出数量，默认 20 |

#### `licell db list`

查看数据库实例列表

示例命令：
- `licell db list`
- `licell db list --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 20 |

#### `licell db public-access [instanceId]`

开通数据库公网访问并添加当前 IP 到白名单

参数：`[instanceId]`

示例命令：
- `licell db public-access [instanceId]`
- `licell db public-access [instanceId] --output json`

| 选项 | 说明 |
|------|------|
| `--ip <ip>` | 手动指定公网 IP（不传则自动获取） |

#### `licell db rm <instanceId>`

删除数据库实例

参数：`<instanceId>`

示例命令：
- `licell db rm <instanceId>`
- `licell db rm <instanceId> --output json`

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过确认 |

#### `licell cache add`

分配 Redis 缓存

说明：
- `--mode` 默认为 `classic`，因此裸执行 `licell cache add` 会创建 classic Redis。
- 显式使用 `--mode serverless` 时，只会尝试 Tair Serverless KV；若当前地域不可用会直接失败，不会自动降级。
- 绑定已有实例时，如未传 `--mode`，会按实例 ID 前缀自动识别。

示例命令：
- `licell cache add --mode classic`
- `licell cache add --mode serverless --class kvcache.cu.g4b.2`
- `licell cache add --instance r-xxxx --password <password>`
- `licell cache class --output json`

下一步：
- primary · `licell cache class --output json`：确认当前地域的 classic 可售规格与已观测的 serverless 规格。
- secondary · `licell cache add --mode <classic|serverless> --output json`：按明确模式申请资源，避免拿到非预期缓存类型。
- secondary · `licell cache connect [instanceId] --output json`：创建完成后核对 host、port 与连接串。

关键选项建议：
- `--mode <mode>`：需要明确创建 classic Redis 或 Tair Serverless KV 时使用。 注意：`serverless` 模式失败后不会自动降级到 classic。
- `--class <instanceClass>`：希望显式指定实例规格时使用。
- `--vk-name <vkName>`：serverless 模式下，需要绑定指定虚拟集群时使用。
- `--compute-unit <n>`：serverless 模式下，显式设置计算单元时使用。 注意：当前仅支持 `1`。

结构化结果：
- 返回缓存模式、实例 ID、规格与脱敏后的连接串。
- `stage`：命令阶段标识。
- `requestedMode`：请求的创建模式：`classic` 或 `serverless`。
- `mode`：实际创建或绑定后的缓存类型：`classic-redis` 或 `tair-serverless-kv`。
- `instanceId`：缓存实例 ID。
- `instanceClass`（可选）：实例规格。
- `connectionStringMasked`：脱敏后的 Redis 连接串。

推荐流程：
- 1. 先查规格 → `licell cache class --output json`：确认当前地域的 classic 可售规格与已观测的 serverless 规格。
- 2. 再创建实例 → `licell cache add --mode <classic|serverless> --output json`：按明确模式申请资源，避免拿到非预期缓存类型。
- 3. 读取连接信息 → `licell cache connect [instanceId] --output json`：创建完成后核对 host、port 与连接串。

| 选项 | 说明 |
|------|------|
| `--type <type>` | 缓存类型：redis（CI 场景建议显式传入） |
| `--mode <mode>` | 创建模式：classic 或 serverless（默认 classic） |
| `--instance <instanceId>` | 绑定已有实例 ID（tt-/tk-/r-），传入后跳过创建 |
| `--password <password>` | 绑定已有实例时的访问密码（不传则尝试自动轮换） |
| `--username <accountName>` | 绑定已有实例时指定账号名（可选） |
| `--engine-version <version>` | 兼容保留参数，当前 cache add 暂未支持 |
| `--class <instanceClass>` | 实例规格：classic 如 redis.master.small.default；serverless 如 kvcache.cu.g4b.2 |
| `--node-type <type>` | 兼容保留参数，当前 cache add 暂未支持 |
| `--capacity <mb>` | 兼容保留参数，当前 cache add 暂未支持 |
| `--vk-name <vkName>` | 仅 serverless 模式使用：指定已有虚拟集群 vkName（tk- 开头） |
| `--compute-unit <n>` | 仅 serverless 模式使用：计算单元（当前仅支持 1） |
| `--zone <zoneId>` | 可用区（如 cn-hangzhou-b） |
| `--vpc <vpcId>` | 指定 VPC ID |
| `--vsw <vSwitchId>` | 指定 VSwitch ID |
| `--security-ip-list <cidrs>` | 白名单 CIDR（逗号分隔） |

#### `licell cache class [mode]`

查询缓存可用规格（给 Agent/开发者在 cache add 前对照）

参数：`[mode]`

说明：
- Tair Serverless 目前只能稳定展示默认 class 和已存在实例观测值；classic Redis 可列出可售规格。

示例命令：
- `licell cache class`
- `licell cache class classic --limit 50`
- `licell cache class serverless --output json`

下一步：
- primary · `licell cache class`：确认当前地域有哪些 class 可选，避免盲填 --class。
- secondary · `licell cache add --class <instanceClass>`：把选中的规格显式传给 cache add。

推荐流程：
- 1. 先看可用规格 → `licell cache class`：确认当前地域有哪些 class 可选，避免盲填 --class。
- 2. 再执行创建 → `licell cache add --class <instanceClass>`：把选中的规格显式传给 cache add。

| 选项 | 说明 |
|------|------|
| `--zone <zoneId>` | 按可用区过滤 classic Redis 规格（默认查询当前地域全部可售 zone） |
| `--limit <n>` | 输出数量，默认 20 |

#### `licell cache list`

查看缓存实例列表

示例命令：
- `licell cache list`
- `licell cache list --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 20 |

#### `licell cache public-access [instanceId]`

开通 Redis 公网访问并添加当前 IP 到白名单

参数：`[instanceId]`

示例命令：
- `licell cache public-access [instanceId]`
- `licell cache public-access [instanceId] --output json`

| 选项 | 说明 |
|------|------|
| `--ip <ip>` | 手动指定公网 IP（不传则自动获取） |

#### `licell cache rm <instanceId>`

删除缓存实例

参数：`<instanceId>`

示例命令：
- `licell cache rm <instanceId>`
- `licell cache rm <instanceId> --output json`

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过确认 |

#### `licell cache rotate-password`

轮换 Redis 密码

示例命令：
- `licell cache rotate-password`
- `licell cache rotate-password --output json`

| 选项 | 说明 |
|------|------|
| `--instance <instanceId>` | 指定 Redis 实例 ID，不传则使用当前项目绑定实例 |

#### `licell supa add`

创建 RDS Supabase 实例

示例命令：
- `licell supa add`
- `licell supa add --output json`

| 选项 | 说明 |
|------|------|
| `--name <name>` | 应用名称 |
| `--vsw <vSwitchId>` | 指定 VSwitch ID |
| `--class <instanceClass>` | 实例规格（默认 rdsai.supabase.basic） |
| `--db-instance <dbInstanceName>` | 关联已有 RDS PostgreSQL 实例 ID |
| `--dashboard-user <user>` | Dashboard 用户名（默认 supabase） |
| `--dashboard-password <password>` | Dashboard 密码（自动生成） |
| `--db-password <password>` | 数据库密码（自动生成） |
| `--public-network` | 开启公网 NAT 网关 |

#### `licell supa config <instanceName>`

查看 Supabase 实例配置（auth/storage/rag）

参数：`<instanceName>`

示例命令：
- `licell supa config <instanceName>`
- `licell supa config <instanceName> --output json`

| 选项 | 说明 |
|------|------|
| `--set-auth <key=value>` | 修改 Auth 配置（如 GOTRUE_SITE_URL=http://example.com） |
| `--set-storage <key=value>` | 修改 Storage 配置（如 TENANT_ID=my-prefix） |
| `--rag <on|off>` | 开启/关闭 RAG Agent |
| `--set-rag <key=value>` | 修改 RAG 配置（如 LLM_MODEL=qwen-flash） |

#### `licell supa list`

查看 Supabase 实例列表

示例命令：
- `licell supa list`
- `licell supa list --output json`

| 选项 | 说明 |
|------|------|
| `--limit <n>` | 返回数量，默认 20 |

#### `licell supa reset-password <instanceName>`

重置 Supabase Dashboard 或数据库密码

参数：`<instanceName>`

示例命令：
- `licell supa reset-password <instanceName>`
- `licell supa reset-password <instanceName> --output json`

| 选项 | 说明 |
|------|------|
| `--dashboard-password <password>` | 新的 Dashboard 密码 |
| `--db-password <password>` | 新的数据库密码 |

#### `licell supa rm <instanceName>`

删除 Supabase 实例

参数：`<instanceName>`

说明：
- 默认会级联删除关联的 RDS PostgreSQL 实例。
- 如果实例绑定的是通过 `--db-instance` 传入的已有 PG，该实例也会一并删除。
- NAT 网关和 EIP 仍需手动删除。

示例命令：
- `licell supa rm <instanceName>`
- `licell supa rm <instanceName> --output json`

| 选项 | 说明 |
|------|------|
| `--yes` | 跳过确认 |

#### `licell supa whitelist <instanceName>`

查看/修改 Supabase IP 白名单

参数：`<instanceName>`

示例命令：
- `licell supa whitelist <instanceName>`
- `licell supa whitelist <instanceName> --output json`

| 选项 | 说明 |
|------|------|
| `--set <ips>` | 设置白名单 IP（覆盖模式，逗号分隔） |
| `--add <ips>` | 追加白名单 IP（逗号分隔） |
| `--remove <ips>` | 删除白名单 IP（逗号分隔） |
| `--group <name>` | 白名单分组名称（默认 default） |

### Automation & Tooling

面向 Agent、开发体验与 CLI 生命周期的自动化命令。

- `licell skills init`、`licell onboard`、`licell catalog`、`licell completion` 都基于同一套 CLI 命令目录生成外部表面。
- `licell onboard` 默认会同时安装 Codex + Claude 的全局 `licell` skills；当安装目标包含 Codex 时，还会额外安装 `licell-glab` subagent。
- `licell completion` 的候选命令同样来自共享命令目录。

| 命令 | 说明 | 关键选项 |
|------|------|----------|
| `licell doctor` | 诊断本机登录态、云端身份/权限/目标资源/域名入口、当前目录项目配置，以及 FC API 的 deploy precheck。 | `--component`, `--all-components`, `--runtime`, `--entry` |
| `licell catalog` | 返回 licell 共享命令目录；供 Skills、Agent 和自动化脚本发现命令、选项、help schema 与 CLI record contract。 | `--root-command`, `--command-key` |
| `licell ci init github` | 按 project/workspace deploy config 生成 GitHub Actions workflow；workflow 只调用 licell deploy，不描述 build 过程。 | `--apply`, `--force`, `--workflow`, `--include` |
| `licell ci init gitlab` | 按 project/workspace deploy config 生成 GitLab CI deploy-only pipeline；适合内部已有 `.gitlab-ci.yml` 主流程时，额外 include 一份 licell deploy 配置。 | `--apply`, `--force`, `--pipeline`, `--include` |
| `licell onboard` | 一次性安装 licell 的全局 Agent 接入：默认同时安装 Codex 与 Claude skills；若包含 Codex，还会额外安装 `licell-glab` subagent。 | `--agent`, `--force` |
| `licell skills init [agent]` | 直接生成 licell skills；默认写入当前项目，传 `--global` 时写入用户级全局技能目录。 | `--global`, `--project-root`, `--force` |
| `licell setup` | 安装后的交互式包装命令；底层仍调用 `skills init`，只是补充 agent / scope 选择流程。 | `--agent`, `--global`, `--project-root`, `--force` |
| `licell state show` | 输出 repo 中版本化保存的 deploy state，用于追查当前 live 资源与访问入口。 | `--component` |
| `licell completion [shell]` | 输出 shell 补全脚本（bash/zsh） | `--engine` |
| `licell upgrade` | 按当前安装来源执行自升级，支持 dry-run 查看计划。 | `--channel`, `--target-version`, `--repo`, `--script-url` |
| `licell e2e cleanup [runId]` | 清理指定 E2E run 产生的资源 | `--manifest`, `--keep-workspace`, `--yes` |
| `licell e2e list` | 查看本项目 e2e 运行记录 | — |
| `licell e2e run` | 执行固定 E2E 套件（默认 smoke） | `--suite`, `--run-id`, `--runtime`, `--target` |

#### `licell doctor`

诊断本机登录态、云端身份/权限/目标资源/域名入口、当前目录项目配置，以及 FC API 的 deploy precheck。

说明：
- 默认包含云端只读探测，会检查身份、权限、deploy target 与域名入口一致性，但不会创建或修改任何云端资源。
- 当前目录不是 licell 项目时，项目相关检查会以 warn/skip 呈现。
- 在 workspace / monorepo 根目录，可用 `--component` 聚焦单个 deploy unit，或用 `--all-components` 做整仓扫描。
- 如果只想排查本地文件与入口契约，可追加 `--offline`。
- `checks[].remediation[]`、`checks[].nextCommands[]` 与 `checks[].nextActions[]` 都是稳定的结构化 guidance；Agent 优先读取 `checks[].nextActions[]`。

示例命令：
- `licell doctor`
- `licell doctor --component api`
- `licell doctor --all-components --output json`
- `licell doctor --runtime nodejs22 --entry src/index.ts`
- `licell doctor --runtime docker --docker-daemon --output json`
- `licell doctor --offline`

下一步：
- primary · `licell doctor --output json`：先确定问题是在 auth、项目配置，还是 deploy 入口契约。
- secondary · `licell deploy spec`：如果问题落在 runtime/入口契约，先看规范而不是盲改。
- secondary · `licell deploy check`：修完后用 deploy check 单独验证入口与 runtime。

决策指南：
- Inspect：先判断问题在 auth 还是项目：doctor 会先看全局登录态与当前目录项目配置，再决定是否继续做 deploy precheck。 起手式：`licell doctor --output json`

关键选项建议：
- `--component <name>`：在 workspace / monorepo 根目录只想诊断某个 component 时使用。 注意：component 名称必须存在于当前 workspace 配置中。
- `--all-components`：需要一次扫描 workspace 中所有 deploy units 的 deploy intent 与云端漂移时使用。 注意：输出会包含顶层 shared 检查和每个 component 的子报告。
- `--runtime <runtime>`：当前目录项目未配置 runtime，或你想临时按另一个 runtime 做 deploy 诊断时使用。 注意：传入 static/statis 时会跳过 FC API 预检。
- `--entry <entry>`：入口文件不走默认路径，或你希望排查某个候选入口时使用。 注意：仅影响本次 doctor / deploy precheck，不会写回项目配置。
- `--docker-daemon`：runtime=docker 时，需要连同本机 Docker daemon 可用性一起诊断。 注意：只在 docker runtime 下有实际效果。
- `--offline`：当前网络受限，或你只想排查本地 auth/project/entry 文件状态时使用。 注意：会跳过云端身份、RAM 权限和 region capability probe。

结构化结果：
- 返回本机诊断汇总、计数和逐项检查结果；每个检查项都附带结构化修复建议、兼容的 nextCommands，以及统一的 nextActions。
- `stage`：固定为 `doctor`。
- `healthy`：是否不存在 error 级阻塞项。
- `checkCount`：检查项总数。
- `okCount`：ok 检查项数量。
- `warnCount`：warn 检查项数量。
- `errorCount`：error 检查项数量。
- `skipCount`：skip 检查项数量。
- `context`：当前 cwd、命中的配置文件路径，以及本次解析出的 runtime/entry/offline。
- `checks[]`：逐项诊断结果数组。
  - `id`：稳定的检查项标识，例如 `auth.credentials`、`deploy.precheck`、`domain.consistency`。
  - `status`：检查项状态：`ok` / `warn` / `error` / `skip`。
  - `summary`：面向人类的简短诊断结论。
  - `details[]`：可直接展示的补充细节。
  - `remediation[]`：结构化修复建议数组；既可给人看，也可给 Agent 解释修复意图。
    - `type`：`note` 或 `command`；`command` 表示该修复建议本身就是一条可执行命令。
    - `text`：修复建议的人类可读文案。
    - `commandTemplate`（可选）：若该建议关联命令，则提供可直接展示/填参的命令模板。
    - `commandKey`（可选）：若能匹配到 CLI 注册表，则给出稳定 command key。
    - `intent`（可选）：建议命令的语义意图，如 `repair` / `verify` / `deploy` / `bind`。
  - `nextActions[]`：统一的结构化下一步数组；把 per-check 后续动作收敛成 Agent 更容易消费的主/备路径。
    - `title`：下一步动作的简短标题。
    - `description`：为什么要执行这一步。
    - `commandTemplate`：建议执行的命令模板。
    - `commandKey`（可选）：若能匹配到 CLI 注册表，则给出稳定 command key。
    - `phase`：动作阶段，如 `inspect` / `verify` / `mutate`。
    - `priority`：`primary` 为首选下一步，`secondary` 为补充路径。
  - `nextCommands[]`：结构化后续命令提示数组；通常按优先级给出下一步。
    - `commandTemplate`：建议执行的命令模板。
    - `commandKey`（可选）：若能匹配到 CLI 注册表，则给出稳定 command key。
    - `intent`：命令的语义意图，如 `inspect` / `verify` / `repair` / `deploy`。
    - `priority`：`primary` 为首选下一步，`secondary` 为补充路径。
- `components[]`：当启用 `--all-components` 时，返回每个 component 的子报告。

推荐流程：
- 1. 先跑本地总诊断 → `licell doctor --output json`：先确定问题是在 auth、项目配置，还是 deploy 入口契约。
- 2. 查看 runtime 规格 → `licell deploy spec`：如果问题落在 runtime/入口契约，先看规范而不是盲改。
- 3. 复跑专项 precheck → `licell deploy check`：修完后用 deploy check 单独验证入口与 runtime。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 在 workspace / monorepo 根目录显式选择 component |
| `--all-components` | workspace 模式下扫描所有 components，而不是只诊断当前/默认 component |
| `--runtime <runtime>` | 覆盖项目 runtime 做 deploy 诊断（如 nodejs22 / python3.13 / docker） |
| `--entry <entry>` | 覆盖 deploy 入口文件路径（默认按项目配置与 runtime 推断） |
| `--docker-daemon` | 当 runtime=docker 时，附带检查本机 Docker daemon 是否可用 |
| `--offline` | 只做本地诊断，跳过云端只读身份/权限/capability probe |

#### `licell catalog`

返回 licell 共享命令目录；供 Skills、Agent 和自动化脚本发现命令、选项、help schema 与 CLI record contract。

说明：
- 优先用 `licell catalog --output json` 做命令发现；再用 `licell <command> --help --output json` 读取单命令细节。
- 输出里显式包含 `help` schema 和 CLI `event/result/error` record contract。

示例命令：
- `licell catalog --output json`
- `licell catalog --root-command deploy --output json`
- `licell catalog --command-key "deploy check" --output json`

下一步：
- primary · `licell catalog --output json`：拿到稳定 command key、section、schema 与 CLI record contract。
- secondary · `licell deploy --help --output json`：按 command key 继续获取参数、结果和推荐流程。
- secondary · `licell deploy --output json`：真正运行命令时统一消费 JSON records。

决策指南：
- Inspect：给 Agent 做命令发现：先过滤 root 或 command key，再决定下一条 help / execute 命令。 起手式：`licell catalog --output json`

关键选项建议：
- `--root-command <root>`：只关心某个命令族，例如 `deploy`、`oss`、`domain` 时使用。 注意：会保留该 root 下的所有命令与对应 section 元数据。
- `--command-key <key>`：只想拿一条稳定命令定义，例如 `deploy check` 或 `domain app bind` 时使用。 注意：这是精确匹配；请使用稳定 command key，而不是带参数的完整 shell 命令。

结构化结果：
- 返回共享命令目录、help schema 与 CLI record contract。
- `stage`：固定为 `catalog`。
- `source`：固定为 `licell-cli-registry`。
- `kind`：目录文档 kind；当前为 `licell-agent-command-catalog`。
- `schemaVersion`：目录文档 schema 版本；当前为 `1.0`。
- `schemas`
  - `help`
    - `kind`：help 文档 kind。
    - `schemaVersion`：help 文档 schema 版本。
  - `cliRecord`
    - `kind`：CLI record kind。
    - `schemaVersion`：CLI record schema 版本。
- `sections[]`：命令分组目录。
- `commands[]`：命令明细数组。
- `cliRecords`
  - `event`：稳定 event record 字段清单。
  - `result`：稳定 result record 公共包络字段清单。
  - `error`：稳定 error record 字段清单。

推荐流程：
- 1. 先发现命令目录 → `licell catalog --output json`：拿到稳定 command key、section、schema 与 CLI record contract。
- 2. 读取单命令 help → `licell deploy --help --output json`：按 command key 继续获取参数、结果和推荐流程。
- 3. 执行目标命令 → `licell deploy --output json`：真正运行命令时统一消费 JSON records。

Agent Tips：
- Agent 应先读 `commands[].key` / `commands[].options[]` / `commands[].nextActions[]`，不要硬编码 README 文案。
- 命令执行阶段统一过滤 `@@LICELL_JSON@@` 前缀，再按 `type=event|result|error` 消费。

| 选项 | 说明 |
|------|------|
| `--root-command <root>` | 按 root command 过滤（如 deploy / oss / domain） |
| `--command-key <key>` | 按稳定 command key 精确过滤（如 deploy check） |

#### `licell ci init github`

按 project/workspace deploy config 生成 GitHub Actions workflow；workflow 只调用 licell deploy，不描述 build 过程。

说明：
- 只会为当前 workspace 中声明了 deployType 的 components 生成 deploy jobs。
- 默认会优先读取 `.licell/state.json` 里最近一次 batch bootstrap 记录的 selectedComponents；若不存在，再回退到当前 workspace 的全部 deployable components。
- 传 `--include` / `--exclude` 时，会显式覆盖默认的 bootstrap selection。

示例命令：
- `licell ci init github --apply`
- `licell ci init github --workflow .github/workflows/deploy.yml --apply --force`
- `licell ci init github --output json`

下一步：
- primary · `licell bootstrap --all-discovered --apply --output json`：先确保 repo 里已经有 licell 可读的 deploy/workspace 配置。
- secondary · `licell ci init github --include web,api --apply --output json`：让 Agent 只为当前需要接入 CI 的 deploy units 生成 job。
- secondary · `licell ci init github --apply --output json`：只生成调用 licell 的 deploy 集成层，不混入 build 语义。

关键选项建议：
- `--workflow <path>`：需要把生成的 GitHub Actions workflow 写到自定义路径时使用。 注意：默认路径是 `.github/workflows/licell-deploy.yml`。
- `--include <names>`：只想为部分已初始化的 deploy components 生成 GitHub jobs 时使用。 注意：值为逗号分隔 component 名；必须已经存在于当前 workspace config 且配置了 deployType。
- `--exclude <names>`：想保留大部分 deploy components，但跳过 docs/demo/admin 等组件时使用。 注意：值为逗号分隔 component 名；会在生成前从 deployable component 集合中剔除。
- `--deploy-only`：向 Agent 明确声明：生成物只覆盖 deploy 集成层，不负责 build/test pipeline 时使用。 注意：当前就是默认行为；保留这个 flag 主要是为了让机器侧语义更明确。

结构化结果：
- 返回 workflow 预览、文件路径和所需 secrets。
- `stage`：命令阶段标识。
- `provider`：固定为 `github`。
- `path`：目标 workflow 文件路径。
- `selectionSource`：`bootstrap` / `workspace` / `explicit-filter`，表示本次组件选择来源。
- `selectedComponents[]`：本次实际生成 job 的 component 列表。
- `skippedComponents[]`：因为 include/exclude 被跳过的 component 列表。
- `requiredSecrets[]`：workflow 依赖的 secrets 列表。
- `applied`：是否已写入文件。

推荐流程：
- 1. 先初始化 deploy config → `licell bootstrap --all-discovered --apply --output json`：先确保 repo 里已经有 licell 可读的 deploy/workspace 配置。
- 2. 按需只生成部分 component 的 CI job → `licell ci init github --include web,api --apply --output json`：让 Agent 只为当前需要接入 CI 的 deploy units 生成 job。
- 3. 生成 GitHub deploy workflow → `licell ci init github --apply --output json`：只生成调用 licell 的 deploy 集成层，不混入 build 语义。

| 选项 | 说明 |
|------|------|
| `--apply` | 把 workflow 写入 `.github/workflows/licell-deploy.yml` |
| `--force` | 覆盖已有 workflow 文件 |
| `--workflow <path>` | 自定义 workflow 文件路径 |
| `--include <names>` | 只为这些 component 生成 CI job（逗号分隔） |
| `--exclude <names>` | 跳过这些 component，不生成对应 CI job（逗号分隔） |
| `--deploy-only` | 显式声明生成 deploy-only workflow（当前默认行为） |

#### `licell ci init gitlab`

按 project/workspace deploy config 生成 GitLab CI deploy-only pipeline；适合内部已有 `.gitlab-ci.yml` 主流程时，额外 include 一份 licell deploy 配置。

说明：
- 默认生成独立文件 `.gitlab-ci.licell.yml`，方便被现有主 `.gitlab-ci.yml` include。
- 只会为当前 workspace 中声明了 deployType 的 components 生成 deploy jobs。
- 每个 deploy job 默认是 `manual`，并支持通过 GitLab CI/CD 变量 `COMPONENT` 只触发单个 component。
- 默认会优先读取 `.licell/state.json` 里最近一次 batch bootstrap 记录的 selectedComponents；若不存在，再回退到当前 workspace 的全部 deployable components。
- 传 `--include` / `--exclude` 时，会显式覆盖默认的 bootstrap selection。

示例命令：
- `licell ci init gitlab --apply`
- `licell ci init gitlab --pipeline .gitlab/deploy/licell.yml --apply --force`
- `licell ci init gitlab --output json`

下一步：
- primary · `licell bootstrap --all-discovered --apply --output json`：先确保 repo 里已经有 licell 可读的 deploy/workspace 配置。
- secondary · `licell ci init gitlab --include web,api --apply --output json`：让 Agent 只为当前需要接入 GitLab CI 的 deploy units 生成 job。
- secondary · `licell ci init gitlab --apply --output json`：生成可 include 的 deploy-only pipeline 文件，方便接入已有 GitLab CI 主流程。

关键选项建议：
- `--pipeline <path>`：需要把生成的 GitLab deploy pipeline 放到自定义 include 文件路径时使用。 注意：默认路径是 `.gitlab-ci.licell.yml`。
- `--include <names>`：只想为部分已初始化的 deploy components 生成 GitLab deploy jobs 时使用。 注意：值为逗号分隔 component 名；必须已经存在于当前 workspace config 且配置了 deployType。
- `--exclude <names>`：想保留大部分 deploy components，但跳过 docs/demo/admin 等组件时使用。 注意：值为逗号分隔 component 名；会在生成前从 deployable component 集合中剔除。
- `--deploy-only`：向 Agent 明确声明：生成物只覆盖 deploy 集成层，不负责 build/test pipeline 时使用。 注意：当前就是默认行为；保留这个 flag 主要是为了让机器侧语义更明确。

结构化结果：
- 返回 GitLab pipeline 预览、文件路径和所需变量。
- `stage`：命令阶段标识。
- `provider`：固定为 `gitlab`。
- `path`：目标 pipeline 文件路径。
- `selectionSource`：`bootstrap` / `workspace` / `explicit-filter`，表示本次组件选择来源。
- `selectedComponents[]`：本次实际生成 deploy job 的 component 列表。
- `skippedComponents[]`：因为 include/exclude 被跳过的 component 列表。
- `requiredSecrets[]`：GitLab CI/CD 变量列表。
- `applied`：是否已写入文件。

推荐流程：
- 1. 先初始化 deploy config → `licell bootstrap --all-discovered --apply --output json`：先确保 repo 里已经有 licell 可读的 deploy/workspace 配置。
- 2. 按需只生成部分 component 的 GitLab job → `licell ci init gitlab --include web,api --apply --output json`：让 Agent 只为当前需要接入 GitLab CI 的 deploy units 生成 job。
- 3. 生成 GitLab deploy pipeline → `licell ci init gitlab --apply --output json`：生成可 include 的 deploy-only pipeline 文件，方便接入已有 GitLab CI 主流程。

| 选项 | 说明 |
|------|------|
| `--apply` | 把 pipeline 写入 `.gitlab-ci.licell.yml` |
| `--force` | 覆盖已有 pipeline 文件 |
| `--pipeline <path>` | 自定义 GitLab pipeline 文件路径 |
| `--include <names>` | 只为这些 component 生成 GitLab deploy job（逗号分隔） |
| `--exclude <names>` | 跳过这些 component，不生成对应 GitLab deploy job（逗号分隔） |
| `--deploy-only` | 显式声明生成 deploy-only pipeline（当前默认行为） |

#### `licell onboard`

一次性安装 licell 的全局 Agent 接入：默认同时安装 Codex 与 Claude skills；若包含 Codex，还会额外安装 `licell-glab` subagent。

说明：
- 该命令会写入用户级目录，而不是当前项目目录。
- 默认行为是 `--agent all`。
- `licell-glab` 仅在安装目标包含 Codex 时写入；安装完成后，可在 Codex 中直接使用 `$licell-glab ...` 驱动当前 repo 的 GitLab CI/CD 生成。

示例命令：
- `licell onboard`
- `licell onboard --agent codex`
- `licell onboard --agent claude`
- `licell onboard --force`
- `licell onboard --output json`

下一步：
- primary · `licell onboard`：默认一次安装 Codex + Claude skills，并给 Codex 补上 `licell-glab`。
- secondary · `licell onboard --agent codex`：当你只想维护单一宿主的全局接入时显式指定。
- secondary · `licell catalog --output json`：后续执行依然统一通过 catalog / help / JSON output。

决策指南：
- Mutate：给当前机器安装 licell 的全局 Agent 接入：默认把 Codex + Claude skills 都装好，并给 Codex 额外补上 `licell-glab` 子助手。 起手式：`licell onboard`

关键选项建议：
- `--agent <agent>`：需要只安装 Codex、只安装 Claude，或显式声明安装两者时使用。 注意：默认值是 `all`。 `licell-glab` 仅会随 `codex` 一起安装。
- `--force`：已存在旧版 skills 或 subagent，需要显式覆盖时使用。 注意：可能覆盖你在全局目录里的手工定制内容。

结构化结果：
- 返回全局 skills 与 subagent 的安装结果。
- `stage`：固定为 `onboard`。
- `requestedAgent`：本次请求安装的目标：`codex` / `claude` / `all`。
- `agents[]`：本次实际安装的 Agent 列表。
- `subagentNames[]`：本次实际安装的 subagent 列表；当前仅可能包含 `licell-glab`。
- `projectRoot`：调用命令时所在的项目目录。
- `writtenFiles`：实际写入的全局文件列表。
- `skippedFiles`：内容相同而跳过的文件列表。

推荐流程：
- 1. 安装默认全局 Agent 接入 → `licell onboard`：默认一次安装 Codex + Claude skills，并给 Codex 补上 `licell-glab`。
- 2. 只装某一个 Agent → `licell onboard --agent codex`：当你只想维护单一宿主的全局接入时显式指定。
- 3. 让 Agent 理解 licell 命令面 → `licell catalog --output json`：后续执行依然统一通过 catalog / help / JSON output。
- 4. 直接调用 subagent：在 Codex 中使用 `$licell-glab 帮我给当前 repo 构建 GitLab CI/CD 流水线`。

Agent Tips：
- 当安装目标包含 Codex 时，`licell-glab` 负责把自然语言需求桥接成 `.gitlab-ci.yml` / `.gitlab-ci.licell.yml` / `.licell/*` 的落地修改。
- 安装完成后，命令发现与实际执行仍优先使用 `licell catalog --output json`、`licell <command> --help --output json` 与 `licell ... --output json`。

| 选项 | 说明 |
|------|------|
| `--agent <agent>` | 安装目标：codex / claude / all（默认 all） |
| `--force` | 覆盖已有文件 |

#### `licell skills init [agent]`

直接生成 licell skills；默认写入当前项目，传 `--global` 时写入用户级全局技能目录。

参数：`[agent]`

说明：
- 未传 `[agent]` 且处于交互终端时，会提示选择 `claude` 或 `codex`。
- `licell setup` 是它的交互式包装；真正的 skills 写入逻辑与结果字段保持一致。

示例命令：
- `licell skills init codex`
- `licell skills init claude`
- `licell skills init codex --project-root .`
- `licell skills init codex --global --output json`

下一步：
- primary · `licell skills init codex`：默认把 skills 与 AGENTS 入口写入当前项目。
- secondary · `licell skills init codex --global`：避免 project/global scope 被误判。
- secondary · `licell catalog --output json`：让 Agent 统一通过 catalog / help / JSON output 理解 licell。

关键选项建议：
- `--global`：希望 skills 对所有项目生效时使用。 注意：会写入用户级全局技能目录，不会更新当前项目 `AGENTS.md`。
- `--project-root <path>`：需要把 skills 写入其它项目目录时使用。 注意：仅 project 模式生效；会写入目标项目的技能文件与 AGENTS 入口。
- `--force`：已有目标文件且你明确希望覆盖时使用。 注意：可能覆盖已有定制内容。

结构化结果：
- 返回 skills 脚手架写入结果。
- `stage`：固定为 `skills`。
- `agent`：目标 Agent 类型。
- `scope`：`global` 或 `project`。
- `projectRoot`：目标项目目录；global 模式下用于指示当前调用上下文。
- `writtenFiles`：实际写入的文件列表。
- `skippedFiles`：内容相同而跳过的文件列表。
- `agentsMdUpdated`：是否更新了 `AGENTS.md`；global 模式下固定为 `false`。

推荐流程：
- 1. 项目内初始化 skills → `licell skills init codex`：默认把 skills 与 AGENTS 入口写入当前项目。
- 2. 需要全局生效时显式指定 → `licell skills init codex --global`：避免 project/global scope 被误判。
- 3. 检查写入结果：确认 skills 文件与 AGENTS 入口写入到了预期目录。
- 4. 读取共享命令目录 → `licell catalog --output json`：让 Agent 统一通过 catalog / help / JSON output 理解 licell。

Agent Tips：
- skills 只负责把 licell 的使用模式注入给 Agent；命令发现与执行统一走 `licell catalog --output json`、`licell <command> --help --output json`、`licell ... --output json`。
- 自动化调用时，project/global scope 最好显式传清楚，不要依赖外部包装命令的默认行为。

| 选项 | 说明 |
|------|------|
| `--global` | 全局配置（所有项目生效） |
| `--project-root <path>` | 目标项目目录（默认当前目录） |
| `--force` | 覆盖已有文件 |

#### `licell setup`

安装后的交互式包装命令；底层仍调用 `skills init`，只是补充 agent / scope 选择流程。

说明：
- 交互模式下会引导选择目标 Agent 与配置范围。
- 非交互模式下如果未传 `--global`，默认按当前项目初始化，而不是隐式写到全局。

示例命令：
- `licell setup`
- `licell setup --agent codex`
- `licell setup --agent codex --global`
- `licell setup --agent codex --output json`

下一步：
- primary · `licell setup`：以交互方式完成 skills 初始化。
- secondary · `licell setup --agent codex --output json`：默认 project scope，避免误写全局目录。
- secondary · `licell setup --agent codex --global --output json`：只在确定要对所有项目生效时再写全局。
- secondary · `licell catalog --output json`：后续统一走 catalog / help / JSON output。

决策指南：
- Mutate：给当前环境快速接入 Agent：一条 setup 引导完成 skills 的主流程配置。；在自动化里做非交互初始化：显式指定 agent，并在需要全局生效时加上 `--global`。 起手式：`licell setup` · `licell setup --agent codex --output json` · `licell setup --agent codex --global --output json`

关键选项建议：
- `--agent <agent>`：非交互模式下必须显式指定目标 Agent。 注意：当前仅支持 `claude` / `codex`。
- `--global`：希望 skills 对所有项目生效时使用。 注意：会写入用户级全局技能目录。 未传时默认是 project scope。
- `--project-root <path>`：要为指定项目而不是当前目录生成配置时使用。 注意：仅 project scope 生效。
- `--force`：目标文件已存在但需要覆盖时使用。 注意：可能覆盖已有定制内容。

结构化结果：
- 返回 setup 引导的写入结果。
- `stage`：固定为 `setup`。
- `agent`：目标 Agent。
- `scope`：`global` 或 `project`。
- `projectRoot`：项目根目录。
- `writtenFiles`：实际写入的文件列表。
- `skippedFiles`：跳过写入的文件列表。
- `agentsMdUpdated`：项目模式下，是否更新了 `AGENTS.md`。

推荐流程：
- 1. 运行引导 → `licell setup`：以交互方式完成 skills 初始化。
- 2. 非交互初始化当前项目 → `licell setup --agent codex --output json`：默认 project scope，避免误写全局目录。
- 3. 需要全局时显式指定 → `licell setup --agent codex --global --output json`：只在确定要对所有项目生效时再写全局。
- 4. 让 Agent 发现命令目录 → `licell catalog --output json`：后续统一走 catalog / help / JSON output。

Agent Tips：
- 自动化场景优先传 `--agent`，并搭配 `--output json` 获取可追踪的写入结果。
- setup 完成后，Agent 继续通过 `licell catalog --output json` 和 `licell <command> --help --output json` 理解命令面。
- `setup` 只是包装层；如果需要稳定脚本化调用，优先直接使用 `licell skills init ...`。

| 选项 | 说明 |
|------|------|
| `--agent <agent>` | 目标 Agent（claude / codex） |
| `--global` | 全局配置（所有项目生效） |
| `--project-root <path>` | 项目目录（默认当前目录） |
| `--force` | 覆盖已有文件 |

#### `licell state show`

输出 repo 中版本化保存的 deploy state，用于追查当前 live 资源与访问入口。

示例命令：
- `licell state show`
- `licell state show --component web --output json`

结构化结果：
- 返回 state 文件内容。
- `stage`：命令阶段标识。
- `schemaVersion`：state schema 版本。
- `components`：component state map。

| 选项 | 说明 |
|------|------|
| `--component <name>` | 只读取指定 component 的 state |

#### `licell completion [shell]`

输出 shell 补全脚本（bash/zsh）

参数：`[shell]`

说明：
- `--engine` 是内部能力，通常由 shell completion 机制调用，普通用户一般只需要生成脚本。

示例命令：
- `licell completion bash`
- `licell completion zsh`
- `licell completion --engine --output json`

关键选项建议：
- `--engine`：需要让 shell completion 机制按当前补全上下文返回候选项时使用。 注意：通常由补全脚本自动调用，不建议手工频繁使用。

结构化结果：
- 返回 shell 补全脚本，或内部候选项列表。
- `stage`：`completion.script` 或 `completion.engine`。
- `shell`：生成脚本时解析出的 shell 类型。
- `script`：完整补全脚本。
- `candidates`：补全候选项数组。
- `count`：候选项数量。

Agent Tips：
- Agent 若要理解可用命令集合，优先读取共享命令目录而非直接依赖 completion 输出。

| 选项 | 说明 |
|------|------|
| `--engine` | 内部补全引擎（供 shell completion 调用） |

#### `licell upgrade`

按当前安装来源执行自升级，支持 dry-run 查看计划。

说明：
- 推荐先执行 `licell upgrade --dry-run` 确认升级渠道与动作。

示例命令：
- `licell upgrade --dry-run`
- `licell upgrade`
- `licell upgrade --channel release --target-version v0.10.1`

下一步：
- primary · `licell upgrade --dry-run --output json`：先确认检测到的安装来源与执行命令。
- secondary · `licell upgrade --channel <channel> --dry-run`：当 auto 检测不符合预期时再显式覆盖。
- secondary · `licell upgrade`：在 dry-run 结果符合预期后再真正修改安装。

关键选项建议：
- `--channel <channel>`：需要强制走 `release` / `npm` / `pnpm` / `yarn` / `bun` 时使用。 注意：覆盖 auto 检测可能与当前安装来源不一致。
- `--target-version <tag>`：需要锁定升级到指定 tag 时使用。 注意：建议先 dry-run 验证该版本与渠道是否匹配。
- `--repo <owner/repo>`：release 渠道需要切到其它 GitHub 仓库时使用。 注意：仅对 release 渠道生效。
- `--script-url <url>`：需要使用自定义 install.sh 地址时使用。 注意：必须配合 `--skip-checksum`，安全性由调用方承担。
- `--skip-checksum`：仅在自定义脚本地址且你明确接受风险时使用。 注意：会跳过 release 脚本 SHA256 校验。
- `--dry-run`：任何自动升级前都建议先使用。 注意：用于确认 installSource、package manager 或 release installer。

推荐流程：
- 1. 检查升级计划 → `licell upgrade --dry-run --output json`：先确认检测到的安装来源与执行命令。
- 2. 确认渠道 → `licell upgrade --channel <channel> --dry-run`：当 auto 检测不符合预期时再显式覆盖。
- 3. 执行升级 → `licell upgrade`：在 dry-run 结果符合预期后再真正修改安装。

Agent Tips：
- Agent 优先使用 `--dry-run --output json` 判断升级来源与命令。

| 选项 | 说明 |
|------|------|
| `--channel <channel>` | 升级渠道：auto/release/npm/pnpm/yarn/bun（默认 auto） |
| `--target-version <tag>` | 指定升级目标版本（release tag 如 v0.9.6；兼容旧写法：`upgrade --version <tag>`） |
| `--repo <owner/repo>` | GitHub 仓库（仅 release 渠道生效，默认 agents-infrastructure/licell） |
| `--script-url <url>` | 覆盖 install.sh 地址（仅 release 渠道，需配合 --skip-checksum） |
| `--skip-checksum` | 跳过 SHA256 完整性校验（仅 release 渠道，不推荐） |
| `--dry-run` | 只输出将执行的升级计划（脚本地址或包管理器命令） |

#### `licell e2e cleanup [runId]`

清理指定 E2E run 产生的资源

参数：`[runId]`

示例命令：
- `licell e2e cleanup [runId]`
- `licell e2e cleanup [runId] --output json`

| 选项 | 说明 |
|------|------|
| `--manifest <path>` | 直接指定 manifest 文件路径 |
| `--keep-workspace` | 保留本地 workspace 目录 |
| `--yes` | 跳过二次确认（危险） |

#### `licell e2e run`

执行固定 E2E 套件（默认 smoke）

示例命令：
- `licell e2e run`
- `licell e2e run --output json`

| 选项 | 说明 |
|------|------|
| `--suite <suite>` | 套件：smoke/full（默认 smoke） |
| `--run-id <id>` | 指定 runId（默认自动生成） |
| `--runtime <runtime>` | 部署 runtime（默认 nodejs22） |
| `--target <alias>` | 部署 target alias（默认 preview） |
| `--enable-vpc` | API 部署启用 VPC（默认关闭，便于无残留清理） |
| `--domain <domain>` | 固定完整域名（可选） |
| `--domain-suffix <suffix>` | 固定域名后缀（可选） |
| `--db-instance <instanceId>` | full 套件时附加验证 db info/connect（复用已有实例） |
| `--cache-instance <instanceId>` | full 套件时附加验证 cache info/connect（复用已有实例） |
| `--skip-static` | full 套件时跳过 static + oss upload 场景 |
| `--enable-cdn` | 部署时启用 CDN（需配合 domain/domain-suffix） |
| `--preview` | 测试 preview 部署流程（需配合 --domain-suffix） |
| `--cleanup` | 执行完后自动清理 |
| `--workspace <dir>` | 指定 E2E 工作目录（默认 .licell/e2e-work/<runId>） |
| `--yes` | 自动清理时跳过二次确认 |


## Recommended Patterns

### FC API Deploy

```bash
licell deploy spec nodejs22
licell deploy check --runtime nodejs22 --entry src/index.ts
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
```

### Static Site Deploy

```bash
licell deploy --type static --dist dist --domain-suffix example.com
# 默认会在固定域名 + CDN 场景下执行入口文件刷新
licell deploy --type static --dist dist --domain www.example.com --cdn-refresh entrypoints --output json
```

### Data + App Stack

```bash
licell db add --type postgres
licell cache add --type redis
licell deploy --type api --target preview --enable-vpc
```

### Supabase Stack

```bash
licell supa add --name my-app
licell supa connect <instanceName>
licell deploy --type api --target preview --enable-vpc
```

## SLS Query Reference

- `licell logs query` / `licell logs tail` 会把 `query` 原样透传给阿里云 SLS `GetLogs.query`；Licell 不会把别的 skill / DSL 语法自动翻译成 SLS 查询。
- 官方语法参考：<https://help.aliyun.com/zh/sls/query-syntax/>
- 开始排查时，优先用 `*` 获取原始日志，再在本地做聚合或过滤：

```bash
licell logs query '*' --output json
```

- 常见 SLS 查询语法（前提：目标 Logstore 已建立索引）：
  - 全量：`*`
  - 全文检索：`GET or POST`
  - 字段检索：`request_method:GET`
  - 数值过滤：`request_time_msec>50`
  - 查询 + 分析：`request_method:GET | select count(*) as total`
- 如果 `field:value` 看起来没生效，优先检查目标字段是否已建索引、类型是否正确；不确定时回退到 `*` + `--output json`。

## Error Handling

- 认证失败：运行 `licell login` 重新配置凭证
- 部署失败：检查 `licell fn logs --once` 查看错误日志
- 应用域名冲突：使用 `licell domain app unbind <domain>` 清理后重试
- 静态域名冲突：使用 `licell domain static unbind <domain>` 清理后重试
- 静态站重复部署但页面仍旧命中旧缓存：检查 deploy 结果里的 `cdnRefreshMode` / `cdnRefreshTaskIds[]`，必要时改用 `--cdn-refresh all`
- 版本清理：`licell release prune --keep 5 --apply` 清理旧版本
- 破坏性操作（rm/prune）需要 `--yes` 跳过确认，或在交互模式下手动确认
