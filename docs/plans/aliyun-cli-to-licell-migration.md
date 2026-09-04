# aliyun-cli -> Licell 能力对比与迁移方案

> 调研快照：2026-09-03。源码目录：`/Users/wyattfang/work/aliyun-cli`；Licell：`/Users/wyattfang/work/licell`。
> aliyun-cli 当前 HEAD：`eadd68d9a13dd0734a2236e2c70e38f4888ae65f`（v3.4.11 代码线）；OpenAPI 子模块：`2563691c22229a0b493606e11166b95896707095`。
> 统计基于本地子模块，不依赖网络实时产品目录。阿里云 API 与产品元数据会变化，发布前应重新生成统计。

本方案的协议源采用仓库内快照：将 `aliyun-openapi-meta` 的协议文件复制到
`protocol/alicloud-openapi/`，由 Git 记录版本和变更。运行时、生成器和 Agent
命令不直接读取 `~/work/aliyun-cli`，也不依赖运行时联网同步；上游变化由维护者
人工升级快照并提交审查。

## 1. 结论先行

1. **最大能力差距是通用 OpenAPI 调用层**：aliyun-cli 通过 `aliyun <product> <ApiName>` 覆盖 323 个产品、156 个有 API 元数据的产品、16,242 个 API；Licell 只有面向少数工作流的强类型命令，没有任意 RPC/REST API 入口。
2. **Licell 已覆盖的核心产品是“部分工作流覆盖”而非产品 API 全覆盖**：FC、OSS、Alidns、CDN、ACR、ECS、RDS、Redis/Tair、RAM、SLS、VPC 等已有 provider/命令，但每个产品只实现了部署、查询或域名等选定路径。
3. **P0 不应是面向 Agent 的万能 `api call`**：裸 API 转发接口浅且泄漏云厂商复杂度；P0 应建设内部 OpenAPI runtime、仓库内 protocol 快照、脚手架生成和人工维护的 capability overlay。
4. **迁移策略应分三层**：
   - P0：protocol 快照与生成基础设施，外加受控的 `api invoke` 诊断逃生口。
   - P1/P2：把高频且需要工作流语义的产品逐个“深度化”，每个产品增加 Licell 原生命令、状态模型、幂等与测试。
   - P3：外部 CLI/plugin 兼容层。
4. **不要把 aliyun-cli 的插件/外部二进制直接搬进 Licell 核心**：它们的实现是下载并透传子进程，应该先做兼容 wrapper 或独立 package，等需求稳定后再抽象成 Licell provider。

## 2. 两套 CLI 的架构

| 维度 | aliyun-cli | Licell | 迁移含义 |
|---|---|---|---|
| 主入口 | `aliyun <product> <operation>` | workflow-first：`deploy`，资源命令兜底 | 先提供通用 API escape hatch，再做结果导向 workflow |
| API 路由 | 元数据驱动，RPC + RESTful | 每个 provider 手写 SDK 调用 | 复用 OpenAPI 元数据与签名/错误规范，避免为 16k API 手写 |
| 产品发现 | `aliyun help`、插件索引 | `licell catalog` / `--help --output json` | 新 API 命令必须进入共享 registry 与 catalog |
| 输出 | JSON、JMESPath table、pager、waiter | 统一 `licell-cli-record@1.0`，命令自定义 JSON result | API 命令返回 envelope，并保留原始 payload |
| 安全 | `--force`、安全策略、`--yes` | 命令 descriptor safety、危险操作显式 `--yes` | 将确认、dry-run、审计字段做成 descriptor 契约 |
| 认证 | 多 profile、AK/RamRole/STS/OIDC/External/Credentials URI/CloudSSO/OAuth/Bearer | `~/.licell-cli` auth，AK/SK/restore/bootstrap RAM | 先兼容 profile 读取或导入，再逐步扩展认证模式 |
| 扩展 | plugin manager + 外部 CLI 下载器 | 当前无通用插件运行时 | 兼容层可复用下载/透传模式，但不污染核心 provider |

## 3. aliyun-cli 的完整命令面

### 3.1 通用 OpenAPI 命令（323 个产品，16,242 个 API）

命令语法：

```bash
aliyun <product-code> <ApiName> [--parameter value ...]
aliyun <product-code> GET|POST|PUT|DELETE <PathPattern> [--body ...]
```

核心实现与参考代码：

| 能力 | aliyun-cli 文件 | 关键符号/参考点 |
|---|---|---|
| 根命令与所有内置入口 | `main/main.go:109-188` | `newRootCommand`；`rootCmd.AddSubCommand` |
| 产品/API 路由、插件判定 | `openapi/commando.go:154-430` | `Commando.main`；RPC/REST 分流 |
| 产品/API 帮助 | `openapi/commando_help.go:82-405` | `printProducts`、`printProductUsage`、`printApiUsage` |
| 产品/API 元数据查找 | `meta/repository.go:60-120`、`meta/reader.go:15-35` | `LoadRepository`、`GetApi`；读取嵌入式 JSON |
| SDK/OpenAPI 调用抽象 | `openapi/invoker.go:1-220` | `Invoker`、`BasicInvoker` |
| RPC 签名/调用 | `openapi/rpc.go` | `RpcInvoker`、Query 参数编码 |
| RESTful 调用 | `openapi/restful.go` | Path 参数、Body、HTTP method |
| HTTP 上下文、endpoint、超时 | `openapi/http_context.go` | `NewHttpContext`、TLS/代理/重试 |
| 输出与 JMESPath 表格 | `openapi/output_filter.go:31-180` | `NewTableOutputFilter` |
| 分页 | `openapi/pager.go` | `Pager` |
| waiter 轮询 | `openapi/waiter.go:20-120` | `Waiter.CallWith` |
| 价格估算 | `openapi/estimate_cost.go`、`estimate_cost_oss.go` | `--estimate-cost` |
| 支持价格估算 API 清单 | `openapi/list_supported_pricing_apis.go:83-160` | `list-supported-pricing-apis` |

全局 OpenAPI 选项（迁移 API 命令必须设计）：

`--version`、`--endpoint`、`--endpoint-type`、`--force`、`--secure/--insecure`、`--header`、`--body/--body-file`、`--output`、`--query`、`--waiter`、`--pager`、`--dry-run`、`--estimate-cost`、`--yes`。

API 级参考文件规则：

- 产品清单：`aliyun-openapi-meta/metadatas/products.json`。
- 单个 API：`aliyun-openapi-meta/metadatas/<product-code>/<ApiName>.json`，例如 `metadatas/ecs/DescribeInstances.json`、`metadatas/fc/InvokeFunction.json`。
- 因此 `aliyun ecs DescribeInstances` 与 `aliyun fc InvokeFunction` 不各自拥有 Go 命令文件；它们由同一套 `Commando + Library + Invoker` 动态执行。

### 3.2 根级内置命令与源码映射

| aliyun 命令 | 当前行为 | 代码入口 |
|---|---|---|
| `configure` 及 `configure get/set/list/switch/delete/ai-mode/plugin-settings/safety-policy` | profile、认证模式、插件/安全策略配置 | `config/configure.go`、`config/configure_*.go` |
| `list-supported-pricing-apis` | 列出支持价格估算的 API | `openapi/list_supported_pricing_apis.go` |
| `oss <legacy-command>` | 旧 OSS 文件/桶工具 + OpenAPI quote bridge | `oss/lib/cli_bridge.go`、`oss/lib/command.go` |
| `version` | CLI 版本 | `cli/version.go` |
| `auto-completion` | bash/zsh 补全安装 | `cli/completion_installer.go` |
| `mcp-proxy` | 把 OpenAPI/插件能力暴露成 MCP | `mcpproxy/command.go`、`mcpproxy/mcp_server.go` |
| `go-migrate <path> --yes` | Go SDK v1 -> v2 迁移 | `go-migrate/go_migrate.go` |
| `ossutil <subcommand>` | 新版 OSS 工具，外部二进制透传 | `cliext/ossutil/main.go`、`ossutil/ossutil2.go` |
| `agentbay <subcommand>` | AgentBay 外部 CLI | `cliext/agentbay/main.go`、`agentbay/agentbay.go` |
| `otsutil <subcommand>` | Tablestore 外部 CLI | `cliext/otsutil/main.go`、`otsutil/otsutil.go` |
| `spark-submit [options]` | EMR Serverless Spark 工具 | `cliext/sparksubmit/main.go`、`sparksubmit/sparksubmit.go` |
| `kmscli ...` | KMS secret/openclaw 工具 | `cliext/kmscli/main.go`、`kmscli/kmscli.go` |
| `lindorm <subcommand>` | Lindorm Open API CLI | `cliext/lindormcli/main.go`、`lindormcli/lindormcli.go` |
| `mseutil <subcommand>` | MSE Nacos/Zookeeper/网络诊断 | `cliext/mseutil/main.go`、`mseutil/mseutil.go` |
| `acrutil skill/diagnosis` | ACR Skill 与实例诊断外部工具 | `cliext/acrutil/main.go`、`acrutil/skill/skill.go`、`acrutil/diagnosis/diagnosis.go` |
| `codeup-cli <subcommand>` | Codeup 仓库迁移工具 | `cliext/codeup/main.go`、`codeup/codeup.go` |
| `saectl <subcommand>` | SAE CLI | `cliext/saectl/main.go`、`saectl/saectl.go` |
| `appmanager <subcommand>` | AppManager CLI（Python 子进程） | `cliext/appmanagerutil/main.go`、`appmanagerutil/appmanager.go` |
| `computenest-cli <subcommand>` | ComputeNest CLI（Python 子进程） | `cliext/computenestutil/main.go`、`computenestutil/computenest.go` |
| `ecctl <subcommand>` | 弹性计算控制 CLI | `cliext/ecctl/main.go`、`ecctl/ecctl.go` |
| `esa-cli <subcommand>` | ESA Routine CLI | `cliext/esacli/main.go`、`esacli/esacli.go` |
| `flow-cli <subcommand>` | 云效 Flow CLI | `cliext/flowcli/main.go`、`flowcli/flowcli.go` |
| `cms2 <subcommand>` | 云监控集成 CLI | `cliext/cms2/main.go`、`cms2/cms2.go` |
| `maxc <subcommand>` | MaxCompute agent CLI | `cliext/maxc/main.go`、`maxc/maxc.go` |
| `iact3 test/upgrade` | IaC 模板验证/升级 | `cliext/iact3/main.go`、`iact3/iact3.go` |
| `rostran convert/upgrade` | ROS 模板转换/升级 | `cliext/rostran/main.go`、`rostran/rostran.go` |
| `plugin list/list-remote/search/show/install/install-all/uninstall/update` | 插件索引、安装、更新、卸载 | `cli/plugin/command.go:44-400` |
| `upgrade` | aliyun-cli 自升级 | `cli/upgrade/upgrade.go` |
| `mock` | API mock/回放 | `sysconfig/mock`、`mock/command.go` |

### 3.3 外部扩展的已证实子命令

这些命令由子进程提供完整 help；下面的子命令来自 wrapper 的 usage、源码注释或测试调用，迁移时应以对应子工具版本的 `--help` 再锁定：

| 父命令 | 子命令/命令组 | 证据与实现 |
|---|---|---|
| `ossutil` | `help config mb ls rm stat set-acl set-meta cp restore create-symlink read-symlink sign hash update probe mkdir cors logging referer listpart getallpartsize appendfromfile cat bucket-tagging bucket-encryption cors-options style lifecycle website bucket-qos user-qos versioning du bucket-policy request-payment object-tagging inventory revert-versioning sync worm lrb replication bucket-cname lcb access-monitor resource-group` | 47 个命令由 `oss/lib/command.go:867-918` 的 `GetAllCommands` 注册；每个实现见 `oss/lib/<command>.go`。Licell 已覆盖 create/list/info/ls/rm/upload/object get/info/rm 的子集，其余是迁移候选。 |
| `acrutil` | `skill <child-command>`、`diagnosis [domain]` | `cliext/acrutil/main.go:61-69`；子二进制安装/执行见 `cliext/acrutil/binmgr/binmgr.go`。 |
| `agentbay` | `session list`、`image list`（测试覆盖；完整树由 child help 提供） | `cliext/agentbay/agentbay_test.go:209-316`、`agentbay/agentbay.go:74-130`。 |
| `maxc` | `query`、`job`、`meta`、`data`、`auth`、`session`、`cache`、`agent` | `cliext/maxc/main.go:44-80`；安装/执行见 `maxc/maxc.go`。 |
| `mseutil` | `zookeeper ... inspect`、`nacos inspect`、`net ...` | `cliext/mseutil/mseutil_test.go:155-266`。 |
| `kmscli` | `secret getsecret <secretName>`、`openclaw getsecret` | `cliext/kmscli/main.go:12-16`。 |
| `lindorm` | `help` 与 child API 命令 | `cliext/lindormcli/main.go`、`lindormcli/lindormcli.go`。 |
| `otsutil` | Tablestore child command tree | `cliext/otsutil/main.go`、`otsutil/otsutil.go`。 |
| `esa-cli` | `deploy`（源码注释显示 `dev` 尚未落地） | `cliext/esacli/esacli.go:460-475`。 |
| `flow-cli` | `step list`（测试覆盖） | `cliext/flowcli/flowcli_test.go:294-295`。 |
| `cms2` | `integration-policy list`、`version`（测试覆盖） | `cliext/cms2/cms2_test.go:759-822`。 |
| `iact3` | `test --template <path>`、`upgrade` | `cliext/iact3/main.go:12-16`、`iact3/iact3_test.go:377-438`。 |
| `rostran` | `convert`、`upgrade` | `cliext/rostran/main.go:12-16`、`rostran/rostran_test.go:569`。 |
| `spark-submit` | Spark-submit 原生命令参数 | `cliext/sparksubmit/main.go`、`sparksubmit/sparksubmit.go`。 |
| `codeup-cli`、`saectl`、`appmanager`、`computenest-cli`、`ecctl` | 外部 child 的完整命令树 | 各自 `main.go` 仅做参数透传；安装、版本、环境注入逻辑在同名 `*.go`。 |

## 4. Licell 当前能力快照

### 4.1 命令面

`licell catalog --output json`（本地 v1.0.5）返回：

- 32 个 root commands；
- 116 个 concrete command entries；
- 统一 `licell-help@1.0` / `licell-cli-record@1.0`；
- 命令注册源：`src/commands/registry.ts`；描述器/区域/安全元数据：`src/commands/module.ts`。

主要命令族：

| 命令族 | 当前命令 | 源码 |
|---|---|---|
| Setup/Identity | `login auth logout whoami switch init bootstrap workspace config` | `src/commands/auth.ts`、`init.ts`、`workspace.ts`、`config.ts` |
| Delivery/FC | `deploy task release logs fn env` | `src/commands/deploy.ts`、`task.ts`、`release.ts`、`logs.ts`、`fn.ts`、`env.ts` |
| Domain/Network | `domain dns` | `src/commands/domain-app.ts`、`domain-static.ts`、`dns.ts` |
| OSS | `oss`（19 entries） | `src/commands/oss.ts` |
| Data | `db cache supa` | `src/commands/db.ts`、`cache.ts`、`supa.ts` |
| ECS | `ecs list/info/start/reboot/stop/delete/rm` | `src/commands/ecs.ts`、`ecs-lifecycle.ts` |
| Automation | `doctor catalog ci onboard skills setup state completion upgrade e2e` | 对应 `src/commands/*.ts` |

### 4.2 Provider 覆盖边界

| 服务/产品 | Licell 当前状态 | 主要实现 |
|---|---|---|
| FC / FC-Open | 部署、函数 CRUD/调用、版本/alias、异步任务、custom domain、VPC binding、部分配置 | `src/providers/fc/**` |
| OSS | Bucket CRUD/属性、对象 list/get/rm、上传/同步、原生域名 | `src/providers/oss.ts`；命令 `src/commands/oss.ts` |
| Alidns | 记录 list/add/rm，域名工作流编排 | `src/providers/dns.ts` |
| CDN | 静态域名接入、刷新等部署联动；无完整 CDN 资源命令组 | `src/providers/cdn.ts` |
| ACR（cr） | 镜像部署/实例查询等部署链路能力；无完整 registry/repository 命令组 | `src/providers/cr.ts` |
| ECS | list/info 与 start/reboot/stop/delete 生命周期 | `src/providers/ecs/**`、`src/commands/ecs*.ts` |
| RDS | 数据库实例创建/查询/连接/公网白名单/删除；Supabase 依赖 RDS | `src/providers/infra/**`、`src/commands/db.ts` |
| Redis/Tair（R-kvstore） | classic/serverless 创建、查询、连接、密码轮换、公网白名单 | `src/providers/redis/**`、`src/commands/cache.ts` |
| RAM | 仅 bootstrap policy/权限修复与认证辅助，不是 RAM 管理 CLI | `src/providers/ram.ts`、`src/utils/auth-recovery.ts` |
| SLS | 日志 query/tail 与 FC 日志桥接，无完整 project/logstore/仪表盘管理 | `src/providers/logs.ts`、`src/commands/logs.ts` |
| VPC | 作为 FC/RDS/Redis 基础设施依赖，能发现/创建部分 VPC/NAT/EIP/安全配置；无 `vpc` 命令族 | `src/providers/vpc.ts`、`src/providers/infra/**` |
| SSL | Let’s Encrypt ACME 证书签发/续签，非阿里云 CAS 全功能 | `src/providers/ssl.ts` |
| CMS | 仅 doctor capability probe，不提供云监控资源管理命令 | `src/providers/doctor-cloud.ts` |

## 5. 能力差异与迁移优先级

状态定义：P0=能力编译与同步基础设施；P1=高频生产能力；P2=专业/长尾能力；P3=外部工具兼容。

| 优先级 | Licell 目标命令/服务 | aliyun-cli 对应命令 | 当前差距 | 参考实现 | Licell 落点 |
|---|---|---|---|---|---|
| P0 | OpenAPI runtime（内部 module） | `aliyun <product> <ApiName>`、REST path | 完全缺失；不作为 Agent 主命令暴露 | `openapi/commando.go`、`invoker.go`、`rpc.go`、`restful.go`、`http_context.go` | 新增 `src/providers/openapi/**`；以 `execute(operationRef, input, context)` 为小接口，隐藏签名/重试/endpoint 复杂度 |
| P0 | protocol snapshot + scaffold | `aliyun-openapi-meta`、`aliyun help <product> [ApiName]` | Licell 没有仓库内、可审查的 API schema 快照与生成链 | `meta/repository.go`、`meta/reader.go`、`openapi/commando_help.go`、`aliyun-openapi-meta/metadatas/**` | `protocol/alicloud-openapi/**`、`scripts/update-alicloud-protocol.ts`、`scripts/generate-openapi.ts`、`licell api scaffold`；人工升级快照，CI 只校验一致性 |
| P0 | capability registry / Agent surface | aliyun 产品/API 列表 | 原始 API 元数据没有意图、风险、前置条件和 nextActions | `openapi/commando_help.go`、`src/commands/module.ts`、`src/utils/command-metadata.ts` | `capability search/describe`；生成 schema 与人工 overlay 合并后才进入 catalog |
| P0 | `api invoke`（受控逃生口） | `aliyun <product> <ApiName>`、REST path | 仅用于未封装能力/诊断；不能替代 workflow | `openapi/commando.go`、`invoker.go`、`waiter.go`、`output_filter.go` | 新增低优先级命令，标记 `maturity=raw`；写操作默认 dry-run + yes，脱敏并提示无 workflow 语义 |
| P0 | 认证 profile 兼容 | `configure --mode ...` | Licell 不支持多 profile/多种链式凭证 | `config/configure*.go`、`config/profile.go` | `src/utils/auth/**` 增加 profile 解析与显式 `--profile`；安全地映射到 SDK credential |
| P1 | OSS 完整资源命令 | `ossutil` 47 命令 | set-meta、CORS、生命周期、版本、复制、WORM、加密、策略、QOS、符号链接、multipart 等缺失 | `oss/lib/<command>.go`；注册表 `oss/lib/command.go:867-918` | 扩展 `src/commands/oss.ts` + `src/providers/oss.ts`，按对象/桶配置分组 |
| P1 | VPC 网络资源 | `aliyun vpc <ApiName>`（404 APIs） | 无用户可调用 `vpc` 命令；当前只被工作流内部调用 | `metadatas/vpc/*.json`、通用 invoker | `src/commands/vpc.ts`、`src/providers/vpc/**`；先 query，再 mutate |
| P1 | RAM/IAM | `aliyun ram <ApiName>`、`resourcemanager` | 仅权限 bootstrap | `metadatas/ram/*.json`、`src/providers/ram.ts` | `ram user/role/policy/attach`；所有写操作带 safety + dry-run |
| P1 | CAS/证书 | `aliyun cas <ApiName>` | 只有 ACME，不支持证书订单、上传、部署、撤销 | `metadatas/cas/*.json`、`openapi/commando.go` | `cert list/import/issue/renew/revoke/deploy`；与现有 `ssl.ts` 分离 |
| P1 | CDN 全生命周期 | `aliyun cdn <ApiName>`、`dcdn` | 只有域名 workflow/刷新联动 | `metadatas/cdn/*.json`、`src/providers/cdn.ts` | `cdn domain/cache/https/refresh/quota`；长任务用 waiter |
| P1 | SLS 管理 | `aliyun sls <ApiName>`（221 APIs） | 只能查日志/跟随日志 | `metadatas/sls/*.json`、`src/providers/logs.ts` | `logs project/store/index/query/tail`；保留原始查询响应 |
| P1 | FC 高级资源 | `aliyun fc <ApiName>`、`fc-open` | 已覆盖主线，但 layers、provision、concurrency、trigger/session/tag 等不完整 | `metadatas/fc/*.json`、`src/providers/fc/**` | `fn trigger/layer/provision/concurrency/tag`；优先补只读和回滚 |
| P1 | RDS 全生命周期 | `aliyun rds <ApiName>`（364 APIs） | Licell 只覆盖 serverless/连接/白名单等路径 | `metadatas/rds/*.json`、`src/providers/infra/**` | `db backup/restore/param/account/database/readonly/maintain` |
| P1 | Redis/Tair 全生命周期 | `aliyun r-kvstore <ApiName>`（146 APIs） | 当前创建/查询/密码/公网白名单为主 | `metadatas/r-kvstore/*.json`、`src/providers/redis/**` | `cache backup/restore/parameter/replication/upgrade` |
| P1 | ACR registry | `aliyun cr <ApiName>`（115 APIs） + `acrutil` | 只有镜像部署辅助，缺少实例/repository/image/tag/scan | `metadatas/cr/*.json`、`cliext/acrutil/**` | `acr instance/repo/image/tag/scan`；复用 CR SDK |
| P2 | Tablestore | `otsutil` / `aliyun ots` | 完全缺失 | `cliext/otsutil/otsutil.go`、`metadatas/ots/*.json` | 先 wrapper，再原生 `table/row/index/backup` |
| P2 | KMS | `kmscli`、`aliyun kms <ApiName>` | 完全缺失 | `cliext/kmscli/kmscli.go`、`metadatas/kms/*.json` | `kms secret/key/cert`；严禁把 secret 写入日志 |
| P2 | MaxCompute | `maxc`、`aliyun maxcompute <ApiName>` | 完全缺失 | `cliext/maxc/main.go`、`maxc/maxc.go` | 独立 package；优先 query/job/meta |
| P2 | MSE | `mseutil`、`aliyun mse <ApiName>` | 完全缺失 | `cliext/mseutil/mseutil.go`、`metadatas/mse/*.json` | `mse nacos/zookeeper/instance/network` |
| P2 | SAE | `saectl`、`aliyun sae <ApiName>` | 完全缺失 | `cliext/saectl/saectl.go`、`metadatas/sae/*.json` | `sae app/deploy/scale/log` |
| P2 | 云监控 | `cms2`、`aliyun cms <ApiName>` | 只有 doctor probe | `cliext/cms2/cms2.go`、`metadatas/cms/*.json` | `monitor alarm/metric/integration` |
| P2 | ROS/IaC | `rostran`、`iact3`、`aliyun ros <ApiName>` | 完全缺失 | `cliext/rostran/rostran.go`、`cliext/iact3/iact3.go` | `iac validate/convert/plan/apply`，先只读 |
| P2 | Codeup/Flow | `codeup-cli`、`flow-cli`、`aliyun devops <ApiName>` | 完全缺失 | `cliext/codeup/codeup.go`、`cliext/flowcli/flowcli.go`、`metadatas/devops/*.json` | 独立 workflow，避免混入 deploy |
| P3 | 外部工具兼容 | 所有 `cliext/*` | Licell 无插件/子进程兼容面 | 各 `cliext/*/main.go` + downloader | 新增 `licell plugin` 只做签名下载、版本锁定、参数透传、JSON passthrough |

## 6. P0 详细设计：能力编译与同步基础设施

### 6.1 模块与 seam

P0 的外部 seam 不应是“把每个阿里云 API 暴露成一个 Licell 命令”，而应分成四个模块：

1. **OpenAPI runtime module**：深模块，外部只知道 `operationRef + input + context`；内部处理 RPC/REST、签名、endpoint、重试、分页和错误归一化。
2. **Generated transport module**：由固定版本的 metadata 生成请求/响应类型、参数 schema 和基础 adapter；不手工编辑。
3. **Curated capability overlay**：人工补充意图、资源关系、风险、幂等性、状态转换、验证动作和 `nextActions`。
4. **Agent-facing command module**：只注册经过 overlay 审核的命令；继续复用 Licell 的 `descriptor`、`catalog`、`help` 和 JSON envelope。

删除测试：如果删除 runtime 后复杂度只是散落到每个 service command，它是有 leverage 的深模块；如果 `api invoke` 只是拼参数后转发，它不应成为主产品接口。

### 6.2 用户接口

建议公开的接口是 capability 和 scaffold；raw invoke 明确降级：

```bash
licell catalog --output json
licell capability products kubernetes --output json
licell capability search --intent "创建 VPC" --output json
licell capability describe vpc.CreateVpc --output json
licell api scaffold vpc.CreateVpc --output json
bun run protocol:check
licell api invoke vpc.DescribeVpcs --params-file request.json --output json
```

Agent 主路径是 `catalog -> capability products/search -> capability describe -> execution.preferred`。`describe.execution.strategy` 明确返回 `curated-command` 或 `raw-api-fallback`；不要求 Agent 从描述文本猜测。`api invoke` 只在没有经过人工确认的领域命令覆盖时使用。

参数设计：

- raw invoke 使用稳定的 `product.Operation` / `alicloud:product:Operation` ref，并支持 `--region`、`--endpoint`、`--endpoint-type`；
- `--param key=value` 可重复，另提供 `--params-file JSON`；
- 参数名按 protocol schema 匹配，兼容 CamelCase、kebab-case、snake_case；发生规范化重名时要求精确名称；
- REST 的 method/path 来自 protocol，Path 段统一 URL 编码替换；Query/Header/Body/Host 按 metadata position 编译；
- `--header` 支持调用上下文附加 header；`--body-file` 尚未实现；
- `--force` 只跳过本地 metadata 校验，不跳过云端鉴权；仅 raw invoke 可用；
- JMESPath query/table、pager 和 waiter 仍是后续 runtime 共享能力；
- `--dry-run` 只解析、签名计划与权限提示，不发请求；
- 结果保留 `requestId`、`provider.service`、`provider.action`、原始响应和分页信息；raw invoke 额外返回 `maturity=raw` 与 capability 缺失提示。

### 6.3 实现拆分

1. `src/providers/openapi/runner.ts`：只暴露 `execute(operationRef, input, context)`；通过固定版本的 aliyun-cli runner 执行，依赖可注入进程执行器与 credential adapter。
2. `protocol/alicloud-openapi/**`：仓库内协议快照，包含 `products.json`、API metadata 和 `manifest.json`；只通过人工升级流程修改，不手工改单个 API 文件。
3. `src/generated/alicloud-capability-index.ts`：由 protocol 快照生成并嵌入 bundle，不手工编辑。
4. `src/providers/openapi/overlay.ts`：人工维护已确认的 operation -> Licell command 覆盖关系；未命中时明确降级到 raw fallback。
5. `scripts/update-alicloud-protocol.ts`：从指定的 aliyun-cli checkout 复制快照，校验来源 commit 和文件清单，输出 additive/breaking/removal diff。
6. `scripts/generate-alicloud-capabilities.ts`：生成可审查的 `capabilities.json` 和供 CLI 延迟解压读取的嵌入索引。
7. `src/providers/openapi/runner-manifest.ts`：固定官方 CDN runner 版本、上游 commit、平台 URL、压缩包与二进制 SHA-256。
8. `src/providers/openapi/runner-manager.ts`：优先复用 PATH 中的全局 aliyun；缺失时按需下载到 `~/.licell/bin/aliyun/<version>/<os>-<arch>/aliyun`，使用安装锁、双重哈希校验和原子替换。
9. `src/commands/capability.ts`：`products/search/describe`，覆盖全部快照产品与 raw capability，并输出机器可读执行决策。
10. `src/commands/api.ts`：`scaffold/invoke`；`invoke` 不进入推荐 workflow。
11. `src/commands/registry.ts`：注册 capability 与 api 命令，并让 catalog 显示 maturity/source。
12. `src/__tests__/alicloud-*.test.ts`、`openapi-*.test.ts`：索引、metadata diff、runner argv、dry-run、错误 envelope、敏感参数脱敏。

### 6.4 人工跟进 API 升级

- `protocol/alicloud-openapi/manifest.json` 固定上游仓库 URL、aliyun-cli commit、openapi metadata 子模块 commit、快照时间、生成器版本和复制范围。
- 上游发布后由维护者在本地更新 aliyun-cli 子模块，再运行 `scripts/update-alicloud-protocol.ts --source ~/work/aliyun-cli`；更新协议快照、manifest 和生成结果后提交一个普通 PR。
- CI 不联网拉取上游，只执行 `protocol:check`、schema 校验、capability 索引一致性、重复生成稳定性检查和生成 diff 检查；协议变更必须随生成产物和 fixture 一起审查。
- diff 分为 additive、parameter-breaking、removed、endpoint/version、behavior-unknown 五类。
- additive 只生成 scaffold；breaking/removal 阻断合并并要求维护者处理 overlay 与 fixture。
- 只有通过 typecheck、metadata schema、mock contract、文档同步和人工 review，能力才从 generated 晋级 curated。

### 6.5 协议快照范围与仓库体积

- 复制 `aliyun-openapi-meta/metadatas/` 和 `products.json`，不复制 aliyun-cli 的 Go 源码、插件二进制、下载缓存或 Git 历史。
- 默认复制完整 `metadatas/`：当前为 16,243 个 JSON 文件、约 12.1MiB 原始内容；323 个产品索引全部保留，其中 156 个产品存在 API 文件，共 16,242 个 API。
- 不复制体积更大的 `zh-CN/`、`en-US/`、Git 历史和其他上游源码；若 metadata 未来显著膨胀，再评估按产品快照或独立 protocol artifact 仓库。
- `package.json#files` 继续只发布 `dist/licell.js`；protocol capability 索引编译进 bundle，平台 runner 不进入 npm 或 Git。首次 raw invoke 在没有全局 aliyun 时按需下载固定版本，离线环境使用 `LICELL_ALIYUN_BIN`。
- `manifest.json` 记录 `scope`（`selected-products` 或 `full`）、每个产品及整棵快照的 SHA-256，使人工同步可复现、可审查、可回滚。

### 6.6 关键风险

- **签名不要从 Go 字符串拼接照抄**：优先复用阿里云 TypeScript OpenAPI SDK；只有 SDK 不支持的 generic endpoint 才实现签名。
- **runner 版本漂移**：runner manifest 记录官方 release tag commit，protocol manifest 记录同步时的 aliyun-cli commit；两者必须锁定同一 metadata commit，并校验压缩包与二进制 SHA-256。
- **分发平台差异**：官方安装源当前覆盖 macOS universal、Linux x64/arm64；Windows 暂不自动下载，必须使用 `LICELL_ALIYUN_BIN`。
- **下载供应链**：不执行远程 `install.sh`，只下载固定 URL；压缩包和二进制必须同时匹配仓库内 manifest 的 SHA-256。
- **runner 进程安全**：AK/SK 不进入 argv；通过环境变量或 0600 临时配置传递，stdout/stderr 必须经过 Licell envelope 和敏感字段脱敏。
- **API 元数据版本漂移**：锁定子模块/生成包版本，CI 检测 products.json 与 API 文件变更。
- **危险 API**：`--dry-run` 只是一层保护；删除/释放/购买类 API 必须 descriptor 标记 destructive，并要求 `--yes`。
- **响应体大小**：支持 `--output json` 原样保存，但对日志/二进制做上限与文件输出。
- **兼容认证**：不要直接读取明文 `~/.aliyun/config.json`；实现显式导入/转换并写入 Licell auth store。

## 7. 分阶段落地计划

### Phase 0：能力编译基础（已完成）

- 固化统计脚本和快照（产品数、API 数、Licell catalog 数）。
- 建立 runtime、generated、overlay 三个内部目录和生成器。
- 创建 `protocol/alicloud-openapi/` 快照目录和 `manifest.json`，完成 schema 校验、文件哈希和 diff 输出。
- 生成全量 raw capability 索引并提供 `capability products/search/describe`；不发云请求，协议升级由 `scripts/update-alicloud-protocol.ts` 人工执行。
- 提供 `api scaffold` 开发者接口，并把索引嵌入 npm bundle。

验收：重复生成结果稳定；未知 schema 明确降级；生成 diff 能区分新增与破坏性变化。

### Phase 1：受控 raw invoke 与 capability registry（核心完成，共享增强待办）

- 固定 aliyun-cli runner 版本与 SHA-256；优先全局安装，缺失时按需下载到 `~/.licell/bin`，增加平台解析和 runner manifest 校验。
- 实现 runner adapter 的 RPC/REST 参数文件、Body、endpoint、headers、输出 envelope 转换，以及全量 protocol 驱动的 Path 编译和参数校验。
- 加入 fake runner，覆盖 argv 构造、环境变量凭证传递、错误归一化和 runner 缺失提示；不在 Licell 重写签名。
- 实现 raw invoke 的 `--force`、`--dry-run`、敏感字段脱敏和危险操作阻断。
- 实现 `capability products/search/describe` 与 `execution.strategy`，但不把 16,000 个原始 API 全量塞入推荐 catalog。

验收：RPC/REST、多段 Path、metadata 异常和命名冲突 fixture 通过；真实账号已通过 VPC/FC/ECS 只读调用，并通过 CS `DescribeClusters`、`DescribeClusterDetail` 验证集合查询与 Path API。剩余项为 pager、JMESPath query/table 和 waiter。

### Phase 2：语义 overlay 与首批领域命令（每个产品 3-7 天）

- 为一个产品补齐资源模型、风险、幂等性、nextActions、结果投影和状态验证。
- 通过 `api scaffold` 生成 transport；人工维护 overlay；命令进入 registry/catalog。
- 首批建议 VPC、RAM、CAS、CDN、SLS；优先只读和 plan，再做 mutate。
- pager、JMESPath query/table、waiter 和 profile 兼容作为 runtime 共享能力，不作为领域命令的公开复杂度。

验收：Agent 能从 `capability search` 找到领域命令，并通过 `nextActions` 完成 inspect -> mutate -> verify；凭证不出现在日志/错误里。

### Phase 3：P1 高频资源原生化（每个产品 3-7 天）

推荐顺序：OSS -> VPC -> RAM -> CAS -> CDN -> SLS -> FC advanced -> RDS -> Redis -> ACR。

每个产品统一模板：

1. 选 5-10 个只读 API，先做 `list/info/describe`。
2. 选 2-5 个写 API，补 plan/dry-run/confirm。
3. 把多 API 编排成 workflow，写 state 与 rollback。
4. 在 `src/commands/<service>.ts` 注册 descriptor、示例、result fields。
5. 加 provider mock、命令 contract、integration smoke 与 docs sync。

### Phase 4：P2 专业服务与 P3 扩展兼容（按需求）

- P2：Tablestore、KMS、MaxCompute、MSE、SAE、CMS、ROS/IaC、Codeup/Flow。
- P3：通用 plugin runtime，支持版本锁、checksum、exec path、环境注入、JSON passthrough；不得默认自动下载未验证二进制。

## 8. 命令/源码/测试交付模板

新增任何迁移命令时必须同时提交：

| 交付物 | 路径 |
|---|---|
| 命令注册与 descriptor | `src/commands/<service>.ts`、`src/commands/registry.ts` |
| provider/API 调用 | `src/providers/<service>/**` |
| 单元测试 | `src/__tests__/<service>-*.test.ts` |
| 命令契约测试 | catalog/help/output JSON contract |
| 文档同步 | `bun run docs:sync && bun run docs:check` |
| 真实 API smoke | 独立测试账号/地域，记录 requestId，不提交凭证 |

## 9. 可重复的调研与差异生成命令

```bash
# aliyun-cli 产品/API 数量
jq '[.products[].apis|length] | {total_api:add, products_with_apis:(map(select(.>0))|length), products_zero:(map(select(.==0))|length)}' \
  ~/work/aliyun-cli/aliyun-openapi-meta/metadatas/products.json

# 从本地 aliyun-cli 更新协议快照（人工升级）
bun run protocol:update --source ~/work/aliyun-cli

# 校验仓库内协议快照与生成产物
bun run protocol:check

# 某产品所有 API 文件（上游对照）
find ~/work/aliyun-cli/aliyun-openapi-meta/metadatas/ecs -maxdepth 1 -type f -name '*.json' -print | sort

# Licell 命令清单
licell catalog --output json | sed -n 's/^@@LICELL_JSON@@//p' | jq '{roots:.rootCommands, count:(.commands|length), commands:[.commands[].key]}'

# 指定 API 的参数/位置
jq '{name,method,pathPattern,parameters}' \
  ~/work/aliyun-cli/aliyun-openapi-meta/metadatas/ecs/DescribeInstances.json
```

## 10. 323 产品元数据附录

状态仅表示 Licell 是否存在对应 provider/工作流入口，不代表 API 级别完全兼容：

- `部分支持`：有 provider 或工作流，但没有完整产品 API 面；
- `仅诊断探测`：仅 doctor/capability probe；
- `缺失`：当前没有 Licell 产品入口；可通过 P0 raw invoke 诊断，但只有完成 capability overlay 后才算正式覆盖。

| 产品代码 | 默认版本 | 风格 | API 数 | Licell 状态 |
|---|---|---:|---:|---|
| ADBAI | 2025-08-12 | rpc | 0 | 缺失 |
| AIMath | 2024-11-14 | rpc | 0 | 缺失 |
| AIPodcast | 2025-02-28 | restful | 0 | 缺失 |
| AIWorkSpace | 2021-02-04 | restful | 116 | 缺失 |
| APIG | 2024-03-27 | restful | 107 | 缺失 |
| ARMS | 2019-08-08 | rpc | 249 | 缺失 |
| AccountCenter | 2024-12-09 | rpc | 0 | 缺失 |
| Actiontrail | 2020-07-06 | rpc | 46 | 缺失 |
| Advisor | 2018-01-20 | rpc | 0 | 缺失 |
| Agency | 2022-12-16 | rpc | 0 | 缺失 |
| AgentExplorer | 2026-03-17 | restful | 0 | 缺失 |
| AgentRun | 2025-09-10 | restful | 0 | 缺失 |
| AiMiaoBi | 2023-08-01 | rpc | 0 | 缺失 |
| Airec | 2020-11-26 | restful | 0 | 缺失 |
| Alb | 2020-06-16 | rpc | 85 | 缺失 |
| Alidns | 2015-01-09 | rpc | 237 | 部分支持 |
| AnyTrans | 2025-07-07 | restful | 0 | 缺失 |
| BDRC | 2023-08-08 | restful | 30 | 缺失 |
| BPStudio | 2021-09-31 | rpc | 0 | 缺失 |
| Baas | 2018-12-21 | rpc | 0 | 缺失 |
| BailianVoiceBot | 2025-01-01 | rpc | 0 | 缺失 |
| BssOpenApi | 2017-12-14 | rpc | 94 | 缺失 |
| CC5G | 2022-03-14 | rpc | 0 | 缺失 |
| CCC | 2017-07-05 | rpc | 104 | 缺失 |
| CGCS | 2021-11-11 | rpc | 0 | 缺失 |
| CS | 2015-12-15 | restful | 139 | 缺失 |
| CarbonFootprint | 2023-07-11 | rpc | 0 | 缺失 |
| Cassandra | 2019-01-01 | rpc | 0 | 缺失 |
| Cbn | 2017-09-12 | rpc | 150 | 缺失 |
| Cdn | 2018-05-10 | rpc | 168 | 部分支持 |
| Chatbot | 2017-10-11 | rpc | 71 | 缺失 |
| CloudAPI | 2016-07-14 | rpc | 215 | 缺失 |
| Cloudauth | 2019-03-07 | rpc | 100 | 缺失 |
| Cloudauth-intl | 2022-08-09 | rpc | 0 | 缺失 |
| Cloudfw | 2017-12-07 | rpc | 273 | 缺失 |
| Cms | 2019-01-01 | rpc | 164 | 仅诊断探测 |
| ComputeNest | 2021-06-01 | rpc | 49 | 缺失 |
| ComputeNestSupplier | 2021-05-21 | rpc | 84 | 缺失 |
| Config | 2019-01-08 | rpc | 25 | 缺失 |
| ContactCenterAI | 2024-06-03 | restful | 0 | 缺失 |
| DAS | 2020-01-16 | rpc | 110 | 缺失 |
| DBFS | 2020-04-18 | rpc | 0 | 缺失 |
| DFS | 2018-06-20 | rpc | 0 | 缺失 |
| DataAnalysisGBI | 2024-08-23 | restful | 0 | 缺失 |
| DataLake | 2020-07-10 | restful | 0 | 缺失 |
| Dbs | 2019-03-06 | rpc | 36 | 缺失 |
| Ddi | 2020-06-17 | rpc | 0 | 缺失 |
| DdosDiversion | 2023-07-01 | rpc | 3 | 缺失 |
| Dds | 2015-12-01 | rpc | 131 | 缺失 |
| Devs | 2023-07-14 | restful | 0 | 缺失 |
| DianJin | 2024-06-28 | restful | 0 | 缺失 |
| DlfNext | 2025-03-10 | restful | 0 | 缺失 |
| Dm | 2015-11-23 | rpc | 69 | 缺失 |
| Dms | 2025-04-14 | rpc | 0 | 缺失 |
| DocumentParseService | 2026-04-14 | rpc | 0 | 缺失 |
| Domain | 2016-05-11 | rpc | 17 | 缺失 |
| Drds | 2019-01-23 | rpc | 106 | 缺失 |
| Dts | 2020-01-01 | rpc | 124 | 缺失 |
| Dyplsapi | 2017-05-25 | rpc | 0 | 缺失 |
| Dypnsapi | 2017-05-25 | rpc | 0 | 缺失 |
| Dypnsapi-intl | 2017-07-25 | rpc | 0 | 缺失 |
| Dysmsapi | 2017-05-25 | rpc | 0 | 缺失 |
| Dytnsapi | 2020-02-17 | rpc | 0 | 缺失 |
| Dyvmsapi | 2017-05-25 | rpc | 0 | 缺失 |
| Dyvmsapi-intl | 2021-10-15 | rpc | 0 | 缺失 |
| EHPC | 2018-04-12 | rpc | 102 | 缺失 |
| ESA | 2024-09-10 | rpc | 393 | 缺失 |
| EasyGene | 2021-03-15 | rpc | 0 | 缺失 |
| Eci | 2018-08-08 | rpc | 36 | 缺失 |
| Ecs | 2014-05-26 | rpc | 366 | 部分支持 |
| Edas | 2017-08-01 | restful | 160 | 缺失 |
| EduInterpreting | 2024-08-28 | rpc | 0 | 缺失 |
| EduTutor | 2025-07-07 | restful | 0 | 缺失 |
| EhpcInstant | 2023-07-01 | rpc | 31 | 缺失 |
| Eiam | 2021-12-01 | rpc | 344 | 缺失 |
| Eiam-developerapi | 2022-02-25 | restful | 0 | 缺失 |
| Eipanycast | 2020-03-09 | rpc | 15 | 缺失 |
| Emr | 2021-03-20 | rpc | 74 | 缺失 |
| EmrStudio | 2024-04-30 | restful | 0 | 缺失 |
| Ens | 2017-11-10 | rpc | 319 | 缺失 |
| Ess | 2014-08-28 | rpc | 89 | 缺失 |
| ExpressConnectRouter | 2023-09-01 | rpc | 38 | 缺失 |
| FC | 2023-03-30 | restful | 69 | 部分支持 |
| FC-Open | 2021-04-06 | restful | 65 | 部分支持 |
| FaRui | 2024-06-28 | restful | 0 | 缺失 |
| GEMP | 2021-04-13 | restful | 0 | 缺失 |
| Ga | 2019-11-20 | rpc | 160 | 缺失 |
| Green | 2022-03-02 | rpc | 25 | 缺失 |
| Gwlb | 2024-04-15 | rpc | 25 | 缺失 |
| HBase | 2019-01-01 | rpc | 103 | 缺失 |
| Httpdns | 2016-02-01 | rpc | 8 | 缺失 |
| ICE | 2020-11-09 | rpc | 0 | 缺失 |
| IQS | 2024-11-11 | restful | 12 | 缺失 |
| IaCService | 2021-08-06 | restful | 98 | 缺失 |
| ImageSearch | 2019-03-25 | restful | 0 | 缺失 |
| Ims | 2019-08-15 | rpc | 98 | 缺失 |
| IoTCC | 2021-05-13 | rpc | 0 | 缺失 |
| Iot | 2018-01-20 | rpc | 423 | 缺失 |
| Kms | 2016-01-20 | rpc | 85 | 缺失 |
| LingMou | 2025-05-27 | restful | 0 | 缺失 |
| LinkWAN | 2019-03-01 | rpc | 0 | 缺失 |
| Linkcard | 2021-05-20 | rpc | 0 | 缺失 |
| Linkvisual | 2018-01-20 | rpc | 0 | 缺失 |
| MPServerless | 2019-06-15 | rpc | 0 | 缺失 |
| MaaS | 2026-03-18 | restful | 0 | 缺失 |
| Market | 2015-11-01 | rpc | 0 | 缺失 |
| MaxCompute | 2022-01-04 | restful | 111 | 缺失 |
| Mhub | 2017-08-25 | rpc | 0 | 缺失 |
| Mns-open | 2022-01-19 | rpc | 0 | 缺失 |
| ModelStudio | 2026-02-10 | restful | 0 | 缺失 |
| Mts | 2014-06-18 | rpc | 97 | 缺失 |
| MultimodalDialog | 2025-09-03 | restful | 0 | 缺失 |
| NAS | 2017-06-26 | rpc | 125 | 缺失 |
| Nlb | 2022-04-30 | rpc | 50 | 缺失 |
| Notifications | 2024-12-25 | rpc | 0 | 缺失 |
| OceanBasePro | 2019-09-01 | rpc | 140 | 缺失 |
| Ons | 2019-02-14 | rpc | 40 | 缺失 |
| OnsMqtt | 2020-04-20 | rpc | 50 | 缺失 |
| OpenAPIExplorer | 2024-11-30 | restful | 17 | 缺失 |
| OpenITag | 2022-06-16 | restful | 38 | 缺失 |
| OpenSearch | 2017-12-25 | restful | 0 | 缺失 |
| Oss | 2019-05-17 | restful | 0 | 部分支持 |
| OssAdmin | 2019-04-22 | rpc | 1 | 缺失 |
| OssSddp | 2024-02-22 | rpc | 0 | 缺失 |
| OutboundBot | 2019-12-26 | rpc | 0 | 缺失 |
| PAICopilot | 2025-07-31 | restful | 0 | 缺失 |
| PAIElasticDatasetAccelerator | 2022-08-01 | restful | 27 | 缺失 |
| PAIFlow | 2021-02-02 | restful | 18 | 缺失 |
| PAILangStudio | 2024-07-10 | restful | 0 | 缺失 |
| PAIModelGallery | 2025-06-30 | restful | 0 | 缺失 |
| PAIPlugin | 2022-01-12 | restful | 36 | 缺失 |
| PTS | 2020-10-20 | rpc | 0 | 缺失 |
| PaiFeatureStore | 2023-06-21 | restful | 60 | 缺失 |
| PaiLLMTrace | 2024-03-11 | restful | 14 | 缺失 |
| PaiRecService | 2022-12-13 | restful | 0 | 缺失 |
| PaiStudio | 2022-01-12 | restful | 56 | 缺失 |
| Pcdn | 2017-04-11 | rpc | 0 | 缺失 |
| Privatelink | 2020-04-15 | rpc | 39 | 缺失 |
| Push | 2016-08-01 | rpc | 33 | 缺失 |
| Qualitycheck | 2016-08-01 | rpc | 0 | 缺失 |
| QuanMiaoLightApp | 2024-08-01 | restful | 0 | 缺失 |
| R-kvstore | 2015-01-01 | rpc | 146 | 部分支持 |
| RAI | 2024-07-01 | rpc | 35 | 缺失 |
| ROS | 2019-09-10 | rpc | 90 | 缺失 |
| Ram | 2015-05-01 | rpc | 66 | 部分支持 |
| Rds | 2014-08-15 | rpc | 364 | 部分支持 |
| RdsAi | 2025-05-07 | rpc | 0 | 部分支持 |
| ResourceCenter | 2022-12-01 | rpc | 48 | 缺失 |
| ResourceDirectoryMaster | 2022-04-19 | rpc | 74 | 缺失 |
| ResourceManager | 2020-03-31 | rpc | 114 | 缺失 |
| ResourceSharing | 2020-01-10 | rpc | 25 | 缺失 |
| RocketMQ | 2022-08-01 | restful | 69 | 缺失 |
| SOFA | 2019-08-15 | rpc | 0 | 缺失 |
| SWAS-OPEN | 2020-06-01 | rpc | 0 | 缺失 |
| Sas | 2018-12-03 | rpc | 929 | 缺失 |
| SasRasp | 2024-07-27 | rpc | 0 | 缺失 |
| SchedulerX3 | 2024-06-24 | rpc | 0 | 缺失 |
| Sddp | 2019-01-03 | rpc | 53 | 缺失 |
| Searchplat | 2024-04-01 | restful | 0 | 缺失 |
| Slb | 2014-05-15 | rpc | 93 | 缺失 |
| Sls | 2020-12-30 | restful | 221 | 部分支持 |
| Smartag | 2018-03-13 | rpc | 0 | 缺失 |
| Status | 2020-01-17 | rpc | 0 | 缺失 |
| Sts | 2015-04-01 | rpc | 4 | 缺失 |
| SuperappNlp | 2024-09-30 | rpc | 0 | 缺失 |
| SysOM | 2023-12-30 | restful | 0 | 缺失 |
| Tablestore | 2020-12-09 | restful | 0 | 缺失 |
| Tag | 2018-08-28 | rpc | 33 | 缺失 |
| TrafficFxOpen | 2024-08-15 | restful | 0 | 缺失 |
| VoiceNavigator | 2018-06-12 | rpc | 0 | 缺失 |
| Vpc | 2016-04-28 | rpc | 404 | 部分支持 |
| VpcIpam | 2023-02-28 | rpc | 40 | 缺失 |
| VpcPeer | 2022-01-01 | rpc | 11 | 缺失 |
| WebPlus | 2019-03-20 | restful | 0 | 缺失 |
| WebsiteBuild | 2025-04-29 | rpc | 0 | 缺失 |
| Workorder | 2021-06-10 | rpc | 0 | 缺失 |
| Yike | 2026-03-19 | rpc | 0 | 缺失 |
| Yundun-bastionhost | 2019-12-09 | rpc | 153 | 缺失 |
| acc | 2024-04-02 | rpc | 0 | 缺失 |
| acm | 2020-02-06 | restful | 0 | 缺失 |
| adb | 2019-03-15 | rpc | 144 | 缺失 |
| adcp | 2022-01-01 | rpc | 23 | 缺失 |
| address-purification | 2019-11-18 | rpc | 0 | 缺失 |
| ahas-openapi | 2019-09-01 | rpc | 0 | 缺失 |
| aiccs | 2023-05-16 | rpc | 0 | 缺失 |
| aigen | 2024-01-11 | rpc | 0 | 缺失 |
| airticketOpen | 2023-01-17 | restful | 0 | 缺失 |
| alikafka | 2019-09-16 | rpc | 54 | 缺失 |
| alimt | 2018-10-12 | rpc | 0 | 缺失 |
| amqp-open | 2019-12-12 | rpc | 25 | 缺失 |
| antiddos-public | 2017-05-18 | rpc | 0 | 缺失 |
| appflow | 2023-09-04 | rpc | 0 | 缺失 |
| appstream-center | 2021-09-01 | rpc | 0 | 缺失 |
| avatar | 2022-01-30 | rpc | 0 | 缺失 |
| bailian | 2023-12-29 | restful | 0 | 缺失 |
| brain-industrial | 2020-09-20 | rpc | 0 | 缺失 |
| cams | 2020-06-06 | rpc | 0 | 缺失 |
| captcha | 2023-03-05 | rpc | 0 | 缺失 |
| cas | 2020-04-07 | rpc | 68 | 缺失 |
| cddc | 2020-03-20 | rpc | 0 | 缺失 |
| clickhouse | 2023-05-22 | rpc | 49 | 缺失 |
| cloud-siem | 2022-06-16 | rpc | 87 | 缺失 |
| cloudcontrol | 2022-08-30 | restful | 0 | 缺失 |
| cloudesl | 2020-02-01 | rpc | 0 | 缺失 |
| cloudphone | 2020-12-30 | rpc | 0 | 缺失 |
| cloudsso | 2021-05-15 | rpc | 85 | 缺失 |
| cms-export | 2021-11-01 | rpc | 0 | 缺失 |
| companyreg | 2020-03-06 | rpc | 0 | 缺失 |
| composer | 2018-12-12 | rpc | 0 | 缺失 |
| cr | 2018-12-01 | rpc | 115 | 部分支持 |
| csas | 2023-01-20 | rpc | 115 | 缺失 |
| datahub | 2024-06-20 | rpc | 0 | 缺失 |
| dataphin-public | 2023-06-30 | rpc | 0 | 缺失 |
| dataworks-public | 2024-05-18 | rpc | 269 | 缺失 |
| dcdn | 2018-01-15 | rpc | 227 | 缺失 |
| ddosbgp | 2018-07-20 | rpc | 39 | 缺失 |
| ddoscoo | 2020-01-01 | rpc | 187 | 缺失 |
| devops | 2021-06-25 | restful | 241 | 缺失 |
| dms-dg | 2023-09-14 | rpc | 20 | 缺失 |
| dms-enterprise | 2018-11-01 | rpc | 307 | 缺失 |
| documentAutoml | 2022-12-29 | rpc | 0 | 缺失 |
| eais | 2019-06-24 | rpc | 23 | 缺失 |
| eas | 2021-07-01 | restful | 108 | 缺失 |
| ebs | 2021-07-30 | rpc | 65 | 缺失 |
| ecd | 2020-09-30 | rpc | 0 | 缺失 |
| ecs-workbench | 2022-02-20 | rpc | 0 | 缺失 |
| eds-aic | 2023-09-30 | rpc | 0 | 缺失 |
| eds-user | 2021-03-08 | rpc | 0 | 缺失 |
| eflo | 2022-05-30 | rpc | 77 | 缺失 |
| eflo-cnp | 2023-08-28 | rpc | 26 | 缺失 |
| eflo-controller | 2022-12-15 | rpc | 58 | 缺失 |
| elasticsearch | 2017-06-13 | restful | 205 | 缺失 |
| emas-appmonitor | 2019-06-11 | rpc | 0 | 缺失 |
| emr-serverless-spark | 2023-08-08 | restful | 0 | 缺失 |
| energyExpertExternal | 2022-09-23 | restful | 59 | 缺失 |
| es-serverless | 2023-06-27 | restful | 0 | 缺失 |
| eventbridge | 2020-04-01 | rpc | 48 | 缺失 |
| facebody | 2019-12-30 | rpc | 43 | 缺失 |
| fnf | 2019-03-15 | rpc | 29 | 缺失 |
| foasconsole | 2021-10-28 | rpc | 26 | 缺失 |
| goodstech | 2019-12-30 | rpc | 1 | 缺失 |
| governance | 2021-01-20 | rpc | 0 | 缺失 |
| gpdb | 2016-05-03 | rpc | 248 | 缺失 |
| grace | 2022-06-06 | restful | 0 | 缺失 |
| gws | 2019-06-18 | rpc | 0 | 缺失 |
| hbr | 2017-09-08 | rpc | 94 | 缺失 |
| hcs-mgw | 2024-06-26 | restful | 0 | 缺失 |
| hdr | 2017-09-25 | rpc | 0 | 缺失 |
| hitsdb | 2020-06-15 | rpc | 25 | 缺失 |
| hologram | 2022-06-01 | restful | 39 | 缺失 |
| hsm | 2023-11-13 | rpc | 0 | 缺失 |
| idaas-doraemon | 2021-05-20 | rpc | 0 | 缺失 |
| idrsservice | 2020-06-30 | rpc | 0 | 缺失 |
| imageaudit | 2019-12-30 | rpc | 2 | 缺失 |
| imageenhan | 2019-09-30 | rpc | 20 | 缺失 |
| imageprocess | 2020-03-20 | rpc | 0 | 缺失 |
| imagerecog | 2019-09-30 | rpc | 10 | 缺失 |
| imageseg | 2019-12-30 | rpc | 16 | 缺失 |
| imgsearch | 2020-03-20 | rpc | 0 | 缺失 |
| imm | 2020-09-30 | rpc | 104 | 缺失 |
| imp | 2021-06-30 | rpc | 0 | 缺失 |
| iovcc | 2018-05-01 | rpc | 0 | 缺失 |
| ivpd | 2019-06-25 | rpc | 0 | 缺失 |
| linkedmall | 2022-05-31 | rpc | 0 | 缺失 |
| live | 2016-11-01 | rpc | 423 | 缺失 |
| ltl | 2019-05-10 | rpc | 0 | 缺失 |
| metaspace | 2022-03-07 | rpc | 0 | 缺失 |
| milvus | 2023-10-12 | restful | 0 | 缺失 |
| moguan-sdk | 2021-04-15 | rpc | 0 | 缺失 |
| mse | 2019-05-31 | rpc | 242 | 缺失 |
| mssp | 2016-12-28 | rpc | 29 | 缺失 |
| nis | 2021-12-16 | rpc | 26 | 缺失 |
| nlp-automl | 2019-11-11 | rpc | 0 | 缺失 |
| nls-cloud-meta | 2019-02-28 | rpc | 0 | 缺失 |
| nls-filetrans | 2018-08-17 | rpc | 0 | 缺失 |
| objectdet | 2019-12-30 | rpc | 10 | 缺失 |
| ocr | 2019-12-30 | rpc | 18 | 缺失 |
| ocr-api | 2021-07-07 | rpc | 0 | 缺失 |
| oos | 2019-06-01 | rpc | 103 | 缺失 |
| openanalytics-open | 2018-06-19 | rpc | 0 | 缺失 |
| opt | 2021-07-30 | rpc | 0 | 缺失 |
| pai-dlc | 2020-12-03 | restful | 25 | 缺失 |
| pai-dsw | 2022-01-01 | restful | 45 | 缺失 |
| paiAutoML | 2022-08-28 | restful | 18 | 缺失 |
| pds | 2022-03-01 | restful | 0 | 缺失 |
| polardb | 2017-08-01 | rpc | 306 | 缺失 |
| polardbx | 2020-02-02 | rpc | 137 | 缺失 |
| pvtz | 2018-01-01 | rpc | 50 | 缺失 |
| quickbi-public | 2022-01-01 | rpc | 0 | 缺失 |
| quotas | 2020-05-10 | rpc | 27 | 缺失 |
| rds-data | 2022-03-30 | rpc | 0 | 缺失 |
| retailadvqa | 2023-04-17 | rpc | 0 | 缺失 |
| rtc | 2018-01-11 | rpc | 0 | 缺失 |
| rtc-white-board | 2020-12-14 | rpc | 0 | 缺失 |
| sae | 2019-05-06 | restful | 150 | 缺失 |
| saf | 2019-05-21 | rpc | 4 | 缺失 |
| safconsole | 2021-01-12 | rpc | 0 | 缺失 |
| scdn | 2017-11-15 | rpc | 61 | 缺失 |
| schedulerx2 | 2019-04-30 | rpc | 61 | 缺失 |
| scsp | 2020-07-02 | rpc | 0 | 缺失 |
| searchengine | 2021-10-25 | restful | 114 | 缺失 |
| selectdb | 2023-05-22 | rpc | 0 | 缺失 |
| servicecatalog | 2021-09-01 | rpc | 0 | 缺失 |
| servicemesh | 2020-01-11 | rpc | 94 | 缺失 |
| sgw | 2018-05-11 | rpc | 68 | 缺失 |
| smc | 2019-06-01 | rpc | 24 | 缺失 |
| sophonsoar | 2022-07-28 | rpc | 58 | 缺失 |
| starrocks | 2022-10-19 | restful | 92 | 缺失 |
| support-plan | 2021-07-06 | rpc | 0 | 缺失 |
| tdsr | 2020-01-01 | rpc | 0 | 缺失 |
| tingwu | 2022-09-30 | restful | 0 | 缺失 |
| ververica | 2022-07-18 | restful | 86 | 缺失 |
| viapi | 2023-01-17 | rpc | 0 | 缺失 |
| viapi-regen | 2021-11-19 | rpc | 0 | 缺失 |
| videoenhan | 2020-03-20 | rpc | 0 | 缺失 |
| videorecog | 2020-03-20 | rpc | 0 | 缺失 |
| videoseg | 2020-03-20 | rpc | 0 | 缺失 |
| vod | 2017-03-21 | rpc | 186 | 缺失 |
| vs | 2018-12-12 | rpc | 0 | 缺失 |
| waf-openapi | 2021-10-01 | rpc | 240 | 缺失 |
| wss | 2021-12-21 | rpc | 0 | 缺失 |
| xtee | 2021-09-10 | rpc | 0 | 缺失 |
| xtrace | 2019-08-08 | rpc | 0 | 缺失 |
