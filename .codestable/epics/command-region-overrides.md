---
status: active
created: 2026-08-05
work: ../work/epic-command-region-overrides.md
---

# 命令级 Region 覆盖全覆盖

## 起点

Licell 把全局默认地域保存在 `~/.licell-cli/auth.json`，项目配置也允许声明 `region` / `deployTarget.region`。当前 OSS、ECS、SLS 日志与 `db info` 已支持 `--region`，但其余地域相关命令仍直接使用全局 auth region。审计确认有 59 个云端命令入口缺少单次调用覆盖；设计审查又确认 `deploy plan` 也必须预览同一有效 region，因此本 Epic 最终补齐 60 个命令表面。

既有 ECS 路线和实现已经验证一条可复用约束：显式 region 只改变本次调用，不改写 auth 或项目默认地域，也不跨 region 自动搜索。项目绑定和 `.licell/state.json` 中保存的 region 属于资源归属事实，不属于默认地域。

## 目标

让所有地域相关 Licell 命令都能通过 `--region <regionId>` 覆盖本次调用地域，并统一命令、provider、结构化帮助、JSON 输出、生成文档、shell completion、诊断和 E2E 清理的 region 契约。

## 范围

- 新增统一的调用级 region 上下文、命令元数据和解析入口。
- 为 59 个云端命令和 `deploy plan` 增加 `--region`，让实际 SDK client / request 或部署计划使用有效 region。
- 把已有 27 个 regional 命令迁入同一合同，同时保持现有 option raw name、`logs -r` 短参数和行为兼容。
- 收敛项目 `region` / `deployTarget.region` 的冲突语义，修复 Deploy plan、执行路由和 state 记录不一致。
- 为项目绑定的 database、cache、Supabase 和 network 保存资源归属 region，避免单次覆盖创建后续被错误地域访问；Supabase 使用独立结构化 binding，不把归属信息塞入凭证 env。
- 让 JSON 成功结果以 `callRegionId` 暴露本次调用地域，并同步 result descriptor、help、catalog 和 docs。
- E2E manifest 记录运行地域；runner 只给 registry 标记为 regional 的子命令显式追加 `--region`，cleanup 默认复用原运行地域，同时允许显式覆盖。

### 命令覆盖清单

| 命令组 | 数量 | 命令 |
|---|---:|---|
| RDS | 6 | `db add`、`db class`、`db connect`、`db list`、`db public-access`、`db rm` |
| Redis / Cache | 8 | `cache add`、`cache class`、`cache connect`、`cache info`、`cache list`、`cache public-access`、`cache rm`、`cache rotate-password` |
| Supabase | 11 | `supa add/config/connect/info/list/reset-password/restart/rm/start/stop/whitelist` |
| Deploy | 2 | `deploy`、`deploy plan` |
| Task | 7 | `task config/info/invoke/list/stop`、`task config rm/set` |
| Release | 4 | `release list/promote/prune/rollback` |
| Function | 9 | `fn info/invoke/list/logs/rm`、`fn domain bind/info/list/unbind` |
| Env | 4 | `env list/pull/rm/set` |
| Domain workflow | 4 | `domain app bind/unbind`、`domain static bind/unbind` |
| 诊断与自动化 | 5 | `auth export`、`doctor`、`workspace doctor`、`e2e run`、`e2e cleanup` |

### Region scope 对照

| Scope | 命令 |
|---|---|
| `auth` | `db add/class/list`；`cache add/class/list`；`supa add/list`；`fn list`；`auth export`；`doctor`；`workspace doctor`；`e2e run`；`oss list/info/create/update/rm/ls/upload/bucket`；`oss object info/get/rm`；`oss domain list/token/bind/unbind`；`oss sync up/down`；`ecs list/info/start/reboot/stop/delete/rm`；`logs query/tail` |
| `binding` | `db info/connect/public-access/rm`；`cache info/connect/public-access/rm/rotate-password`；`supa config/connect/info/reset-password/restart/rm/start/stop/whitelist` |
| `project` | `deploy`；`deploy plan`；`task config/info/invoke/list/stop`；`task config rm/set`；`release list/promote/prune/rollback`；`fn info/invoke/logs/rm`；`fn domain bind/info/list/unbind`；`env list/pull/rm/set`；`domain app bind/unbind`；`domain static bind/unbind` |
| `manifest` | `e2e cleanup` |

### RDS AI endpoint 对照

| Region ID | Endpoint |
|---|---|
| `cn-beijing` | `rdsai.aliyuncs.com` |
| `cn-wulanchabu` | `rdsai.aliyuncs.com` |
| `cn-hangzhou` | `rdsai.aliyuncs.com` |
| `cn-shanghai` | `rdsai.aliyuncs.com` |
| `cn-shenzhen` | `rdsai.aliyuncs.com` |
| `cn-guangzhou` | `rdsai.aliyuncs.com` |
| `cn-chengdu` | `rdsai.cn-chengdu.aliyuncs.com` |
| `cn-hongkong` | `rdsai.cn-hongkong.aliyuncs.com` |
| `ap-northeast-1` | `rdsai.ap-northeast-1.aliyuncs.com` |
| `ap-southeast-1` | `rdsai.ap-southeast-1.aliyuncs.com` |
| `ap-southeast-3` | `rdsai.ap-southeast-3.aliyuncs.com` |
| `ap-southeast-5` | `rdsai.ap-southeast-5.aliyuncs.com` |
| `eu-central-1` | `rdsai.eu-central-1.aliyuncs.com` |
| `us-west-1` | `rdsai.us-west-1.aliyuncs.com` |

## 非目标

- 不实现跨 region 自动搜索、批量多 region 执行或实例 ID 到 region 的反向发现。
- 不把 `--region` 加到纯本地命令、全局型 DNS/RAM 命令或与地域无关的 catalog/setup/CI scaffold 命令；`workspace init --region` 继续表示写入 component 默认地域，不得标成调用级 regional metadata。
- 明确排除 `auth restore/repair`、`e2e list`、`state show`、`deploy spec/check`：它们分别从签名 URL 恢复、维护默认 auth、只读本地记录或只做本地规格检查，不发起可覆盖地域的云端调用。
- 不通过临时 `Config.setAuth()`、修改用户 auth 文件、修改项目默认 region 或进程级可变全局值实现单次覆盖。旧冲突项目配置在下一次任意 `Config.setProject()` 时把 canonical 顶层 region 镜像到 `deployTarget.region`，属于明确的格式归一化迁移，不属于调用覆盖写回。
- 允许写入两类预期状态：资源绑定/运行 manifest 的归属 region，以及 `auth export` 按 `accountId:region` 隔离的 bucket registry；它们都不能改写默认 region。
- 不改变云资源创建规格、生命周期语义、安全确认、权限集合或返回的业务字段含义。
- 不在本 Epic 内发布版本、创建 GitHub Release 或升级本机安装；版本控制和远端发布严格遵循 work 游标中经 owner 确认的策略。

## 验收标准

1. 清单中的 60 个缺口和已有 27 个 regional 命令都由共享 regional metadata 标记，并在 catalog、文本 help、JSON help 和 shell completion 暴露兼容的 `--region`；`logs -r` 保留。
2. 有效地域优先级由上表 regional metadata scope 唯一决定：`auth` 为 `--region > auth.region`；`binding` 为 `--region > matching binding.region > auth.region`；`project` 为 `--region > canonical project.region > auth.region`；`manifest` 为 `--region > manifest.region > auth.region`。binding scope 没有显式目标时，先从项目 binding 解析目标并命中其 region；只有 binding 不存在、显式目标与 binding 不匹配或旧 binding 无 region 时才跳过 binding 层。显式 provider 工厂参数始终高于调用上下文改写后的 `auth.region`。E2E 子进程通过显式 `--region` 进入同一优先级，不存在额外 inherited/env 层。
3. `canonical project.region` 来自归一化后的顶层 `project.region`：仅有旧 `deployTarget.region` 时回填顶层；顶层值存在时始终把 normalized `deployTarget.region` 镜像为同一值，包括补齐缺失值和收敛冲突值。冲突时保持既有 Deploy execute 行为，以顶层值为准。`deploy plan` 改为读取该规范值；这是对既有 plan/execute 漂移的有意修复，不改变无 flag 的 execute 路由。因为 `Config.setProject()` 总是写归一化结果，任意后续项目写操作都会把该镜像 materialize 到磁盘，这是预期的一次性迁移。
4. 覆盖仅在当前异步调用链生效；并发调用互不串扰，`Config.getAuth()`、用户 auth 文件、项目默认 region 保持原值，auth repair 重试后仍沿用本次覆盖。`LICELL_BOOTSTRAP_REGION` / `LICELL_REGION` / `ALI_REGION` 只参与 auth bootstrap/repair 默认值选择，不高于当前显式调用覆盖。
5. FC、RDS、Redis、RDS AI、OSS、CDN、VPC、CR、SLS/日志相关真实 client 或 request 使用有效 region。RDS AI client 同时设置 config `regionId` 与 request `regionId`，endpoint 严格按上表解析；未知 region 保留 SDK 的中心 endpoint fallback，但 request/config 仍携带原值并原样暴露服务端错误，绝不改写成 auth 默认地域。官方来源：https://help.aliyun.com/zh/rds/developer-reference/api-rdsai-2025-05-07-endpoint 。
6. Deploy 把“配置默认值”和“本次执行值”分开：`buildDeployProjectPatch` 只能保留 canonical project/auth 默认值，不能持久化 `--region`；provider、JSON 结果和 `.licell/state.json` 资源归属必须记录有效调用值。state region 仅用于展示、审计和显式清理，不参与任何 scope 解析，避免旧 state 静默覆盖后来修改的项目默认值；显式覆盖与默认值不同时，结果/help 明确提示后续命令需继续传同一 `--region`，或正式更新项目 region。
7. `db add`、`cache add`、`supa add` 成功后分别持久化 database/cache/supabase binding 的 `region`；network binding 也记录 region。新增 `ProjectSupabaseConfig { instanceName: string; region?: string }` 和 `ProjectConfig.supabase?`：既有 `SUPABASE_*` env 继续承载运行时 URL/密钥，不能新增 `SUPABASE_REGION`；Supabase binding 不复用 `database`，只有 API 明确返回关联 RDS ID 时才更新 database binding。删除时按 instanceName 同时清理 supabase binding 与既有 env。`normalizeProject` 必须显式解析并白名单保留 network/cache/database/supabase 的 `region`，统一 trim/lowercase；任意无关 `Config.setProject()` 往返都不得丢字段。后续命令仅在目标 ID/name 与 binding 匹配时使用 binding region；无显式目标时先解析项目 binding，只有不匹配或旧 binding 无 region 时才按验收 2 跳过 binding 层。复用旧 network 前必须在有效 region describe 验证 VSwitch/VPC，成功后回填 region，失败则重新解析网络；其他旧 binding 不自动声称已知归属。
8. 所有 regional 命令的 JSON 成功 result 以 `callRegionId` 表示调用地域；API 返回的资源归属 `regionId` 保持原语义。`callRegionId` 同步进入 result descriptor/catalog/help/docs，已有命令显式返回的同名字段不被覆盖。
9. E2E 新 manifest 保存 region。runner 从共享 registry metadata 判定子命令是否 regional，仅对这些 argv 显式追加 `--region <effective>`，已有显式 flag 不重复；`init`、DNS 等非 regional 子命令保持原 argv。隔离 home 只在每次 `e2e run` 或独立 `e2e cleanup` 开始时用 `Config.getAuth()` 的 raw 当前值准备一次，不能在每个 spawn 前重写；同一次 run 内子进程 auth repair 的写入必须保留。cleanup 使用 `--region > manifest.region > auth.region`，旧 manifest 无 region 时兼容回退当前 auth。
10. 除验收 2 明示的 project-scope delivery 命令开始消费 canonical project region、验收 3 的 plan 漂移修复/冲突配置 materialization，以及 RDS AI endpoint 表补全外，未传 `--region` 的既有行为保持兼容；默认 `cn-hangzhou`、`cn-shanghai` 的 Supabase 调用继续使用中心 endpoint，现有 provider 测试不得因 region 合同失效。相关 provider/command/contract 测试、`bun run typecheck`、`bun run test:ci`、`bun run test:integration`、`bun run docs:sync`、`bun run docs:check`、`bun run build` 全部通过。

## 关键决策

- **DEC-1 · 规范项目 Region**：项目工作流只消费 normalized `project.region`。旧配置只写 `deployTarget.region` 时仍兼容回填；顶层值存在时始终镜像到 normalized `deployTarget.region`，既补齐缺失值也收敛冲突值。冲突配置以顶层值为准，保持既有 Deploy execute 路由，同时把 plan 修正到一致。任意后续 `Config.setProject()` 会把镜像写回磁盘，作为一次性格式迁移。
- **DEC-2 · 调用级上下文**：使用 `AsyncLocalStorage` 保存不可变的 region 调用上下文，由 regional command 注册入口建立；provider 通过有效 auth/client 工厂读取。上下文不跨进程，E2E 使用 DEC-7 基于 registry 的显式 `--region` 传播，不引入隐藏环境变量。
- **DEC-3 · 原始 auth 与有效 auth 分离**：`Config.getAuth()` 始终返回磁盘默认值，供 auth repair/persistence 和 doctor 配置展示使用；`Config.requireAuth()` 和 `ensureAuthOrExit()` 在调用上下文中返回只改写 `region` 的克隆。auth repair 保存默认值，provider retry 自动重新套用当前调用覆盖。工厂显式 `regionId` 参数优先于克隆后的 auth fallback。
- **DEC-4 · 命令元数据共源且兼容**：regional metadata 统一声明 `auth | binding | project | manifest` scope、option guidance 和 result `callRegionId`，scope 到命令的固定分配以验收 2 为准；若命令已有 region option，则保留 raw name/alias 并只接入解析合同。registry 以 metadata 机械校验 regional 与明确排除的命令集合。
- **DEC-5 · 调用地域与资源地域分离**：运行时统一补充 `callRegionId`，不复用 API 业务字段 `regionId`。descriptor 也由 regional metadata 注入，避免运行时结果超出 agent contract。
- **DEC-6 · 默认配置与资源归属分离**：`--region` 不写回 auth 或 project 默认地域；database/cache/supabase/network binding 在目标匹配时参与 `binding` scope；`.licell/state.json` 只作展示/审计，E2E manifest 只作 cleanup ownership，两者不进入普通命令解析。`ProjectConfig.supabase` 是独立 binding，既有 `SUPABASE_*` env 只保留运行时连接/密钥职责。
- **DEC-7 · E2E 跨进程传播**：runner 使用共享 registry metadata 识别 regional argv 并显式追加 `--region`；非 regional argv 不变。隔离 home 在每个顶层 run/cleanup 开始时只准备一次，之后允许子进程 auth repair 在该 run 内持续生效；cleanup 优先使用 manifest ownership region。
- **DEC-8 · RDS AI endpoint 路由**：以阿里云官方 RDS AI 2025-05-07 endpoint 表为基准补齐中心与 regional endpoint；client config 与 request body 都携带同一有效 region。表外 region 使用 SDK 中心 endpoint fallback，并把服务端错误原样返回，不做 region 改写或跨地域重试。
- **DEC-9 · Regional surface 定义**：regional command 包括发起地域相关云调用的命令，以及唯一需要预览目标地域的本地命令 `deploy plan`；`deploy spec/check` 不选择或输出远端目标地域，继续排除。SSL/CAS 与 Alidns 调用本身 region-agnostic，虽然共享 auth clone 会携带 region，但不得把它用于 endpoint/request 路由。

## 子项契约

- **ITEM-1 · 共享调用级 Region 合同**（owning skill: `cs-feat`）
  - 交付：regional metadata、调用级 context、资源/项目作用域解析、canonical project region、有效 auth 克隆、JSON/descriptor `callRegionId` 注入和核心合同测试。
  - 依赖：无。
  - 验收：验收 2 的唯一优先级链、旧/冲突项目配置归一化与 materialization、无调用覆盖写回、并发隔离、auth recovery retry、显式工厂参数优先、已有 `callRegionId` 不被覆盖均有 red -> green 测试。
  - 约束：不让 command registration 读取或保存凭证；不把 AsyncLocalStorage 暴露成 provider 业务 API；真实 CAC register/dispatch 测试必须覆盖 wrapper，不能只测 mock registration。

- **ITEM-2 · 数据服务与绑定 Region 全覆盖**（owning skill: `cs-feat`）
  - 交付：RDS 6 个、Cache 8 个、Supabase 11 个命令接入 regional contract；database/cache/network binding 增加 region，新增独立 `ProjectSupabaseConfig`；所有 binding 写路径通过共享 normalize/merge helper 保留 region；provider client/request 使用有效 region；RDS AI endpoint 表与官方文档一致。
  - 依赖：ITEM-1。
  - 验收：25 个新增命令加既有 `db info` 的 catalog/help 清单锁定；RDS/Redis/RDS AI provider tests 分别证明 endpoint/config/request region；杭州/上海中心 endpoint、成都 regional endpoint、表外 SDK fallback 均有测试；创建后四类 binding、Supabase env/binding 分工、删除清理、无参命令命中 binding region、显式匹配/不匹配/旧 binding 回退、所有 Redis binding 重写路径保留 region、写入 binding region 后执行无关项目写操作仍保留字段、旧 network 验证后复用或重建均有测试。
  - 约束：`db info` 现有 option/result contract 保持兼容；不做跨地域实例发现；旧 binding 无 region 时不得假装已知资源归属。

- **ITEM-3 · 交付工作流 Region 全覆盖**（owning skill: `cs-feat`）
  - 交付：Deploy/Deploy Plan、Task、Release、Function、Function Domain、Env、App/Static Domain 共 30 个命令接入 project-aware regional contract；FC/OSS/CDN/VPC/CR 编排使用同一有效 region。
  - 依赖：ITEM-1。
  - 验收：`--region` 与 canonical project region 都能改变 project-scope 命令的实际 provider client；Deploy project patch 不持久化调用覆盖，state/JSON 记录实际 region但 state 不参与后续解析，plan 与 execute 一致；覆盖部署后的 help guidance 提示继续显式传 region 或更新项目默认；`fn list` 保持 auth scope；现有 component/workspace 行为不回退。
  - 约束：不改变部署目标、资源命名、发布别名、DNS、SSL 或证书业务语义。

- **ITEM-4 · 诊断、授权导出与 E2E Region 全覆盖**（owning skill: `cs-feat`）
  - 交付：`auth export`、`doctor`、`workspace doctor`、`e2e run/cleanup` 接入 region contract；doctor 配置展示与 cloud probes 分离；E2E manifest、registry-aware argv 注入和隔离 home 生命周期按 DEC-7 实现。
  - 依赖：ITEM-1、ITEM-2、ITEM-3。
  - 验收：auth export token/bucket region、doctor raw default 与 probe region、regional/non-regional child argv、顶层 run/cleanup 各刷新一次 home、同一 run 内 auth repair 不被覆盖、manifest/cleanup 与旧 manifest fallback 均有测试。
  - 约束：auth export 不修改导出的默认 auth 内容；按 `accountId:region` 写 bucket registry 是预期持久化；cleanup 继续遵守现有 destructive confirmation。

- **ITEM-5 · 既有迁移、命令表面与集成验收**（owning skill: `cs-feat`）
  - 交付：已有 OSS 17、ECS 7、logs 2、`db info` 迁入共享 metadata；精确 region 支持/排除矩阵守卫；catalog/help/completion/skills/docs 同步、全量回归与构建证据。
  - 依赖：ITEM-1、ITEM-2、ITEM-3、ITEM-4。
  - 验收：60 个缺口清零、87 个 regional 命令全部受共享合同约束；`logs -r` 等原始 surface 不变；明确排除命令没有被误加 option；生成文档无 drift；完整验证命令全部通过。
  - 约束：命令 region scope 由 registry metadata 机械读取；测试不得另造一份与 registry 无关联的地域命令目录。

## 第一轮设计审查修订

审查目标 SHA-256：`97e328c0990ce1fffd38c655960ee4abf25811ac1a2c40707665033bf07436ac`。Paseo reviewer `2002dedf-90b4-4b9e-a5a2-c80e382b4160` 使用 `claude/claude-opus-5`、plan 模式、只读且无子 agent，结论为 `needs changes`。

- B1：以 normalized 顶层 `project.region` 作为唯一规范值，旧 `deployTarget.region` 兼容回填，冲突时保持既有 execute 的顶层优先并修正 plan。
- B2：拆分 project default patch 与 invocation/state region；显式覆盖不写回项目默认值。
- B3：database/cache/supabase/network binding 新增资源归属 region，并规定仅匹配目标时回退。
- B4：RDS AI region allowlist fail fast，client config、endpoint 和 request 一致。
- B5：E2E 用私有环境变量跨进程传播，每次刷新隔离 home 的 raw auth/config。
- I1-I6：保留已有 option raw names/aliases；改用 `callRegionId` 并注入 descriptor；纳入 `deploy plan`；doctor 分离 raw 展示与 probe region；显式工厂参数优先。
- N1-N4：明确 bootstrap env 边界、排除矩阵、auth export registry 例外，并补 `bun run test:integration`。

## 第二轮设计审查修订

审查目标 SHA-256：`2d05a89b5ecfbfe47ab281e8b6db4487dea28244d410a8ff37120f81fd2ca78f`。同一 Paseo reviewer、同一 lineage 复审，结论仍为 `needs changes`；60/87 计数及 B1、B2、I1-I6、N1-N4 已通过，剩余 NB-1 至 NB-3、NI-1 至 NI-3。

- NB-1：明确新增 `ProjectSupabaseConfig { instanceName, region? }`；与 `SUPABASE_*` env、database binding 的职责和删除迁移规则分离。
- NB-2：核对官方 RDS AI endpoint 文档后撤销错误的全量 fail-fast；补齐 14 个已发布地域，其中杭州/上海/北京等使用中心 endpoint，client/request 仍显式携带 region，表外沿用 SDK fallback。
- NB-3：引入 `auth` / `binding` / `project` / `manifest` 四种 metadata scope 并固定命令分配；binding scope 为 `--region > matching binding.region > auth.region`，不匹配或旧 binding 无 region 都只跳过 binding 层。
- NI-1、NI-2：删除 `LICELL_CALL_REGION` 设计，改为 registry-aware 子命令 argv 注入；隔离 home 每个顶层 run/cleanup 只准备一次。
- NI-3：明确 normalized region 镜像会在任意后续 `Config.setProject()` 时 materialize，属于格式迁移例外。
- N-1 至 N-4：cleanup 不再有 inherited 层；SSL/CAS 声明为 region-agnostic；binding 写路径共用 helper；`deploy plan` 定义为 regional preview surface。

## 第三轮审查后裁决候选

审查目标 SHA-256：`a8fdceefd51477a9c692ee7e3a1a72c079d905437c4c0e5855e13c28d6d071f6`。同一 reviewer 第三轮结论 `needs changes`；NB-1、NB-2、NI-1 至 NI-3 已核销，剩余 TB-1、TB-2 与 TI-1。该 design review 阶段已达到三轮终态报告上限，不再追加第四轮；以下修订须由 owner 在首次 gate 显式裁决。

- TB-1：修正为“无显式目标时先解析并命中项目 binding”；仅 binding 不存在、显式目标不匹配或旧 binding 无 region 时跳过 binding，并新增无参命令路由测试。
- TB-2：要求 `normalizeProject` 显式白名单、trim/lowercase 并保留 network/cache/database/supabase region；增加无关项目写操作往返不丢字段的回归。
- TI-1：选择 state 不参与解析。它只展示/审计本次资源归属；一次性覆盖部署后的后续命令必须继续显式传 region，或由用户更新项目默认 region，避免旧 state 静默覆盖新配置。
- 官方事实核验：主流程已访问阿里云 RDS AI 2025-05-07 官方 endpoint 页面并核对 14 个 regionId；本地 `@alicloud/rdsai20250507` 生成 client 在未指定 endpoint 时也使用中心 `rdsai.aliyuncs.com`，与表外 fallback 决策一致。

## 最终交付索引

待执行完成后填写。

## 整体验收

待全部子项完成后，由 fresh reviewer 按本文件验收标准执行 final acceptance review，并由 owner 最终确认。

## 遗留风险

- Alibaba Cloud 各 SDK 对 `regionId` 与 endpoint 的要求不完全一致；实现必须在 provider seam 通过 request/client capture 验证，不能只验证 CLI options。
- 调用级上下文属于基础设施能力，任何遗漏的 `Config.getAuth()` 或显式 raw auth 传递都可能绕过覆盖；ITEM-5 需要静态扫描和代表性端到端测试共同兜底。
- 部分旧 project binding、`.licell/state.json` 和 E2E manifest 不含 region，只能按对应 metadata scope 回退 project/auth 默认值；旧格式无法凭实例 ID 恢复未知地域，这是不做跨地域发现的兼容限制。
