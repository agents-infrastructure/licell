# Licell CLI (`licell`)

TypeScript + Bun 实现的阿里云部署 CLI，目标是把阿里云上的部署体验做成接近 Vercel CLI 的一键化流程，并可用于生产环境。

## 目标与边界

- 一条主线命令：`deploy`（API/静态站点）。
- 资源编排闭环：FC、RDS、Tair/Redis、OSS、域名、DNS、SSL。
- 运维闭环：版本发布/回滚、环境变量同步、函数调用、日志追踪。
- 默认面向中国区生产：默认 `region=cn-hangzhou`。

## 当前已实现能力

- 认证与地域：`login` `logout` `whoami` `switch`
- 项目初始化：`init --runtime --app --force`
- 部署：`deploy --type api|static --runtime nodejs20|nodejs22|python3.12|python3.13 --target --domain-suffix --ssl --ssl-force-renew`
- 函数：`fn list|info|invoke|rm`
- 发布：`release list|promote|rollback|prune`
- 自升级：`upgrade [--version <tag>]`
- 环境变量：`env list|set|rm|pull`
- 数据库：`db add|list|info|connect`（默认 RDS Serverless）
- 缓存：`cache add|list|info|connect|rotate-password`（默认 Tair Serverless KV）
- 域名/DNS：`domain add|rm`、`dns records list|add|rm`
- OSS：`oss list|info|ls`
- 日志：`logs`

## 前置要求

- 推荐：使用 GitHub Release 预构建安装包（无需 npm/pnpm/yarn）
- 若回退源码安装：Node.js `>= 20` + Bun `>= 1.3` + npm/pnpm/yarn（默认 npm）
- 阿里云 AK/SK，权限至少覆盖 FC、RDS、Tair(KVStore)、OSS、AliDNS、SLS、VPC
- 如果要自动签发 HTTPS，域名必须托管在阿里云 DNS（AliDNS）

## 安装与升级

一键安装（默认安装到 `~/.local/bin/licell`）：

```bash
curl -fsSL https://github.com/dafang/licell/releases/latest/download/install.sh | bash
```

安装逻辑：

- `releases/latest/download/install.sh` 与 `releases/latest` 资产由同一个最新 release 发布
- 优先下载 `releases/latest` 的 `licell-<os>-<arch>.tar.gz` 预构建资产
- 资产默认是单文件可执行（内置 Node 运行时，无需本机安装 Node/npm）
- macOS 下安装时会自动尝试做一次 ad-hoc `codesign`，避免未签名二进制被系统拦截
- 兼容历史资产：若资产是旧版 Node 运行包，安装器仍可识别并安装
- 如果当前平台暂无预构建资产，则自动回退到源码安装

如果你的 shell 里还没有 `~/.local/bin`，先加 PATH：

```bash
export PATH="$HOME/.local/bin:$PATH"
licell --help
```

升级到最新 release：

```bash
licell upgrade
```

指定版本升级（例如回滚到某个稳定版本）：

```bash
licell upgrade --version v0.9.6
```

直接从 main 安装开发版（仅开发调试）：

```bash
curl -fsSL https://raw.githubusercontent.com/dafang/licell/main/install.sh | bash
```

指定 release 资产地址安装：

```bash
curl -fsSL https://github.com/dafang/licell/releases/latest/download/install.sh | LICELL_BINARY_URL=https://example.com/licell-darwin-arm64.tar.gz bash
```

## 从源码开发（可选）

```bash
cd <licell-repo-dir>
bun install
bun run build:bin
./licell --help
```

## 发布资产构建（维护者）

构建当前平台发布资产（单文件可执行）：

```bash
bun run build:standalone
```

产物：

- `dist/licell-<os>-<arch>`（单文件可执行）
- `dist/licell-<os>-<arch>.tar.gz`（发布到 GitHub Release 的资产名）

说明：

- 构建链路使用 `esbuild + pkg`，不依赖 Bun 的 `--compile`
- 默认内置 Node 18 运行时（可通过 `LICELL_STANDALONE_NODE_TARGET` 覆盖）

## 自动 Release 流程（GitHub Actions）

仓库内置 `release` workflow（`.github/workflows/release.yml`）：

- `push v*` tag：自动跑 `typecheck + test`，构建 4 平台资产并发布 Release
- `workflow_dispatch`：手动输入 `tag` 与 `ref` 发布

自动发布的资产名与安装脚本匹配：

- `licell-darwin-arm64.tar.gz`
- `licell-darwin-x64.tar.gz`
- `licell-linux-arm64.tar.gz`
- `licell-linux-x64.tar.gz`
- `install.sh`
- `SHA256SUMS.txt`

发布一个新版本（推荐）：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 在哪个目录执行命令

`licell` 会把项目绑定信息写到“当前目录”的 `.licell/project.json`。
因此必须在你的业务项目目录执行（例如 `examples/hello-world-api`），不是在 CLI 仓库根目录执行。

全局登录凭证写在：

- `~/.licell-cli/auth.json`

项目配置写在：

- `<your-app>/.licell/project.json`

## 快速开始（Hello World）

进入示例项目：

```bash
cd examples/hello-world-api
```

初始化脚手架（可选，按 runtime 选择）：

```bash
# 默认 Node TypeScript (nodejs20)
licell init

# Python
licell init --runtime python3.12

# Docker (Bun + TypeScript + Hono)
licell init --runtime docker
```

`init` 的行为：

- 空目录：默认生成脚手架 + 写入 `.licell/project.json`（默认 runtime 为 `nodejs20`）
- 已有项目目录：默认只写入 `.licell/project.json`（不覆盖现有代码）
- 若要在已有目录生成并覆盖脚手架：显式传 `--runtime <runtime> --force`

登录（默认地域杭州）：

```bash
licell login --region cn-hangzhou
```

首次部署（Node 22 + preview + 固定域名 + HTTPS）：

```bash
licell deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain-suffix your-domain.xyz \
  --ssl
```

部署成功后会输出：

- FC 公网地址（`*.fcapp.run`）
- 固定域名地址（如 `https://<app>.your-domain.xyz`）
- alias 切流信息（`preview -> version`）

## 部署模型

API（函数计算）：

```bash
licell deploy --type api --entry src/index.ts --runtime nodejs20
```

Python API（函数计算）：

```bash
licell deploy --type api --entry src/main.py --runtime python3.12
licell deploy --type api --entry src/main.py --runtime python3.13
```

静态站点（OSS）：

```bash
licell deploy --type static --dist dist
```

`--target` 仅用于 API 部署：

```bash
licell deploy --type api --target prod
```

## Node 22 自定义运行时

- `--runtime nodejs22` 映射到 FC `custom.debian12`
- 会在代码包内附带 Node 22 Linux x64 运行时，并生成 bootstrap 启动 handler
- 缓存目录：`~/.licell-cli/runtimes/node22`
- 可通过 `LICELL_NODE22_SHASUMS_URL` 覆盖 SHASUMS 下载地址
- 可通过 `LICELL_RUNTIME_CACHE_DIR` 覆盖本地运行时缓存根目录

如果地域不支持 `custom.debian12`，CLI 会明确报错并提示回退 `nodejs20`。

## Python 运行时

- `--runtime python3.12` 走 FC 内置 Python Runtime
- `--runtime python3.13` 走 `custom.debian12` 自定义运行时模式
- 入口文件必须是 `.py`，并包含 `handler` 函数（例如 `src/main.py` -> `src.main.handler`）
- 打包策略：上传项目中的 `*.py`，并自动安装 `requirements*.txt` 到部署产物
- 默认优先下载 manylinux x86_64 wheel（跨平台更稳），再离线安装进代码包
- 若某些依赖没有 wheel，可在 Linux CI 执行部署；或显式设置 `LICELL_PYTHON_ALLOW_SOURCE=1` 允许本机源码安装（可能有平台差异风险）
- `python3.13` 首次部署会自动下载并缓存 Linux x64 可执行运行时到 `~/.licell-cli/runtimes/python313`
- 默认从 `python-build-standalone` 最新 release 解析并校验 SHA256，随后随函数代码一同上传
- 可通过 `LICELL_RUNTIME_CACHE_DIR` 覆盖本地运行时缓存根目录

## 固定域名与 HTTPS

固定域名规则：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz
```

会自动绑定到：`<appName>.your-domain.xyz`

开启 HTTPS：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz --ssl
```

或单独绑定已有域名：

```bash
licell domain add hello.preview.your-domain.xyz --target preview --ssl
```

续签策略：

- 非强制模式：证书剩余天数大于阈值时跳过续签（默认阈值 30 天）
- 强制续签：`--ssl-force-renew`
- 续签触发时机：执行 `deploy --ssl` 或 `domain add --ssl`
- DNS TXT TTL 固定为 `600`

## Serverless 数据库（RDS）

创建（默认 Serverless）：

```bash
licell db add --type postgres
```

PostgreSQL 18 示例（杭州）：

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

查看与连接：

```bash
licell db list
licell db info <instanceId>
licell db connect [instanceId]
```

创建成功后会自动写入项目环境变量 `DATABASE_URL`。

## Serverless 缓存（Tair/Redis）

默认创建 Tair Serverless KV（Redis 兼容）：

```bash
licell cache add --type redis
```

指定规格：

```bash
licell cache add --type redis --class kvcache.cu.g4b.2 --compute-unit 1
```

绑定已有实例（跳过创建）：

```bash
licell cache add --type redis --instance tt-xxxxxxxx --password 'your-password'
```

查看与连接：

```bash
licell cache list
licell cache info <instanceId>
licell cache connect [instanceId]
licell cache rotate-password --instance <instanceId>
```

创建/绑定成功后会自动写入：

- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_USERNAME`

## 发布、回滚、环境变量、函数调试

发布与回滚：

```bash
licell release list --limit 20
licell release promote --target prod
licell release promote <versionId> --target prod
licell release rollback <versionId> --target prod
licell release prune --keep 10
licell release prune --keep 10 --apply
```

环境变量：

```bash
licell env list --target preview
licell env set KEY VALUE
licell env rm KEY
licell env pull --target preview
```

函数调试：

```bash
licell fn info [name] --target preview
licell fn invoke [name] --target preview --payload '{"ping":"pong"}'
licell fn rm [name]
licell fn rm [name] --force
```

日志：

```bash
licell logs
```

## OSS 与 DNS 命令

```bash
licell oss list
licell oss info <bucket>
licell oss ls <bucket> [prefix]
```

```bash
licell dns records list your-domain.xyz
licell dns records add your-domain.xyz --rr preview --type CNAME --value target.example.com
licell dns records rm <recordId>
```

## CI 非交互示例

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
  --domain-suffix your-domain.xyz \
  --ssl
```

## 开发测试与验证

本地质量检查：

```bash
bun run typecheck
bun run test
bun run build
```

E2E 冒烟（脚本）：

```bash
cd <licell-repo-dir>
LICELL_BIN=./licell ./scripts/smoke.sh \
  --target preview \
  --expect-key TEST_FLAG \
  --expect-value from-cloud \
  --domain hello.preview.your-domain.xyz \
  --with-ssl
```

## 常用环境变量

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `LICELL_ACCOUNT_ID` | 非交互登录 Account ID | - |
| `LICELL_ACCESS_KEY_ID` | 非交互登录 AK | - |
| `LICELL_ACCESS_KEY_SECRET` | 非交互登录 SK | - |
| `LICELL_REGION` | 默认地域 | `cn-hangzhou` |
| `LICELL_BINARY_URL` | 安装脚本指定预编译二进制地址 | `releases/latest/download/licell-<os>-<arch>.tar.gz` |
| `LICELL_ARCHIVE_URL` | 安装脚本源码回退下载地址 | `https://api.github.com/repos/dafang/licell/tarball/main` |
| `LICELL_GITHUB_TOKEN` | 安装脚本访问私有下载源时的 GitHub Token | - |
| `LICELL_DOMAIN_SUFFIX` | 默认固定域名后缀 | - |
| `LICELL_FC_RUNTIME` | 默认运行时 | `nodejs20` |
| `LICELL_FC_CONNECT_TIMEOUT_MS` | FC OpenAPI 连接超时（毫秒） | `60000` |
| `LICELL_FC_READ_TIMEOUT_MS` | FC OpenAPI 读超时（毫秒） | `600000` |
| `LICELL_SSL_RENEW_BEFORE_DAYS` | 证书自动续签阈值（天） | `30` |
| `LICELL_SSL_DNS_READY_TIMEOUT_MS` | DNS TXT 生效等待超时 | `180000` |
| `LICELL_SSL_SKIP_CHALLENGE_VERIFY` | 设为 `0` 时启用本地 challenge verify | `1`（默认跳过） |
| `LICELL_RUNTIME_CACHE_DIR` | 覆盖 Node22/Python3.13 自定义运行时缓存根目录 | `~/.licell-cli/runtimes` |
| `LICELL_PYTHON_REQUIREMENTS` | 指定 Python 依赖文件路径（默认自动探测 requirements*.txt） | - |
| `LICELL_PYTHON_PIP` | 指定执行 pip 的 Python 解释器（实际调用 `<this> -m pip`） | `python3` |
| `LICELL_PYTHON_ALLOW_SOURCE` | 设为 `1` 允许 wheel 下载失败后本机源码安装依赖 | `0` |
| `LICELL_PYTHON_SKIP_VENDOR` | 设为 `1` 跳过 Python 依赖自动打包 | `0` |
| `LICELL_NODE22_SHASUMS_URL` | Node22 SHASUMS 覆盖地址 | Node 官方 + 备用镜像 |
| `LICELL_PYTHON313_RELEASE_API_URL` | 覆盖 python3.13 运行时 release API 地址 | `https://api.github.com/repos/indygreg/python-build-standalone/releases/latest` |
| `LICELL_PYTHON313_TARBALL_URL` | 直接指定 python3.13 运行时包下载地址 | - |
| `LICELL_PYTHON313_SHA256` | 与 `LICELL_PYTHON313_TARBALL_URL` 配套的 SHA256 校验值 | - |

兼容性说明：当前版本仍兼容读取旧前缀 `ALI_*` 环境变量，建议尽快迁移到 `LICELL_*`。

## 常见问题

`zsh: command not found: licell`

- 先执行安装脚本：
  `curl -fsSL https://github.com/dafang/licell/releases/latest/download/install.sh | bash`
- 然后确认 `~/.local/bin` 已加入 PATH。

`licell login` 应该在哪执行？

- 任何目录都能登录（写入 `~/.licell-cli/auth.json`），但建议在业务项目目录执行后立即 `deploy`，这样会同步生成该项目的 `.licell/project.json`。

每次部署会自动签发/续签证书吗？

- 只有在传 `--ssl` 的部署/域名命令中才会检查证书并按阈值续签。不会后台定时自动续签。

Node 运行时只支持 20 吗？

- 当前 CLI 支持 `nodejs20`、`nodejs22`、`python3.12`、`python3.13`。其中 `nodejs22` 与 `python3.13` 使用 `custom.debian12` 自定义运行时模式。

`--help` 看不到 `fn list`/`db list` 等命令？

- 通常是本地安装版本过旧。
- 重新安装最新版本后再看帮助：

```bash
licell upgrade
licell --help
```
