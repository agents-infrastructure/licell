# Aero CLI (`ali`)

TypeScript + Bun 实现的阿里云部署 CLI，目标是把阿里云上的部署体验做成接近 Vercel CLI 的一键化流程，并可用于生产环境。

## 目标与边界

- 一条主线命令：`deploy`（API/静态站点）。
- 资源编排闭环：FC、RDS、Tair/Redis、OSS、域名、DNS、SSL。
- 运维闭环：版本发布/回滚、环境变量同步、函数调用、日志追踪。
- 默认面向中国区生产：默认 `region=cn-hangzhou`。

## 当前已实现能力

- 认证与地域：`login` `logout` `whoami` `switch`
- 部署：`deploy --type api|static --runtime nodejs20|nodejs22|python3.12|python3.13 --target --domain-suffix --ssl --ssl-force-renew`
- 函数：`fn list|info|invoke|rm`
- 发布：`release list|promote|rollback|prune`
- 环境变量：`env list|set|rm|pull`
- 数据库：`db add|list|info|connect`（默认 RDS Serverless）
- 缓存：`cache add|list|info|connect|rotate-password`（默认 Tair Serverless KV）
- 域名/DNS：`domain add|rm`、`dns records list|add|rm`
- OSS：`oss list|info|ls`
- 日志：`logs`

## 前置要求

- Bun `>= 1.3`
- Node.js `>= 20`（用于开发/脚本）
- 阿里云 AK/SK，权限至少覆盖 FC、RDS、Tair(KVStore)、OSS、AliDNS、SLS、VPC
- 如果要自动签发 HTTPS，域名必须托管在阿里云 DNS（AliDNS）

## 安装与运行

```bash
cd aero-cli
bun install
```

开发态直接运行 CLI：

```bash
./scripts/ali-tsx.sh --help
```

构建二进制：

```bash
bun run build:bin
./ali --help
```

## 在哪个目录执行命令

`ali` 会把项目绑定信息写到“当前目录”的 `.ali/project.json`。
因此必须在你的业务项目目录执行（例如 `examples/hello-world-api`），不是在 CLI 仓库根目录执行。

全局登录凭证写在：

- `~/.ali-cli/auth.json`

项目配置写在：

- `<your-app>/.ali/project.json`

## 快速开始（Hello World）

进入示例项目：

```bash
cd aero-cli/examples/hello-world-api
```

登录（默认地域杭州）：

```bash
../../scripts/ali-tsx.sh login --region cn-hangzhou
```

首次部署（Node 22 + preview + 固定域名 + HTTPS）：

```bash
../../scripts/ali-tsx.sh deploy \
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
ali deploy --type api --entry src/index.ts --runtime nodejs20
```

Python API（函数计算）：

```bash
ali deploy --type api --entry src/main.py --runtime python3.12
ali deploy --type api --entry src/main.py --runtime python3.13
```

静态站点（OSS）：

```bash
ali deploy --type static --dist dist
```

`--target` 仅用于 API 部署：

```bash
ali deploy --type api --target prod
```

## Node 22 自定义运行时

- `--runtime nodejs22` 映射到 FC `custom.debian12`
- 会在代码包内附带 Node 22 Linux x64 运行时，并生成 bootstrap 启动 handler
- 缓存目录：`~/.ali-cli/runtimes/node22`
- 可通过 `ALI_NODE22_SHASUMS_URL` 覆盖 SHASUMS 下载地址
- 可通过 `ALI_RUNTIME_CACHE_DIR` 覆盖本地运行时缓存根目录

如果地域不支持 `custom.debian12`，CLI 会明确报错并提示回退 `nodejs20`。

## Python 运行时

- `--runtime python3.12` 走 FC 内置 Python Runtime
- `--runtime python3.13` 走 `custom.debian12` 自定义运行时模式
- 入口文件必须是 `.py`，并包含 `handler` 函数（例如 `src/main.py` -> `src.main.handler`）
- 打包策略：上传项目中的 `*.py`，并自动安装 `requirements*.txt` 到部署产物
- 默认优先下载 manylinux x86_64 wheel（跨平台更稳），再离线安装进代码包
- 若某些依赖没有 wheel，可在 Linux CI 执行部署；或显式设置 `ALI_PYTHON_ALLOW_SOURCE=1` 允许本机源码安装（可能有平台差异风险）
- `python3.13` 首次部署会自动下载并缓存 Linux x64 可执行运行时到 `~/.ali-cli/runtimes/python313`
- 默认从 `python-build-standalone` 最新 release 解析并校验 SHA256，随后随函数代码一同上传
- 可通过 `ALI_RUNTIME_CACHE_DIR` 覆盖本地运行时缓存根目录

## 固定域名与 HTTPS

固定域名规则：

```bash
ali deploy --type api --target preview --domain-suffix your-domain.xyz
```

会自动绑定到：`<appName>.your-domain.xyz`

开启 HTTPS：

```bash
ali deploy --type api --target preview --domain-suffix your-domain.xyz --ssl
```

或单独绑定已有域名：

```bash
ali domain add hello.preview.your-domain.xyz --target preview --ssl
```

续签策略：

- 非强制模式：证书剩余天数大于阈值时跳过续签（默认阈值 30 天）
- 强制续签：`--ssl-force-renew`
- 续签触发时机：执行 `deploy --ssl` 或 `domain add --ssl`
- DNS TXT TTL 固定为 `600`

## Serverless 数据库（RDS）

创建（默认 Serverless）：

```bash
ali db add --type postgres
```

PostgreSQL 18 示例（杭州）：

```bash
ali db add \
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
ali db list
ali db info <instanceId>
ali db connect [instanceId]
```

创建成功后会自动写入项目环境变量 `DATABASE_URL`。

## Serverless 缓存（Tair/Redis）

默认创建 Tair Serverless KV（Redis 兼容）：

```bash
ali cache add --type redis
```

指定规格：

```bash
ali cache add --type redis --class kvcache.cu.g4b.2 --compute-unit 1
```

绑定已有实例（跳过创建）：

```bash
ali cache add --type redis --instance tt-xxxxxxxx --password 'your-password'
```

查看与连接：

```bash
ali cache list
ali cache info <instanceId>
ali cache connect [instanceId]
ali cache rotate-password --instance <instanceId>
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
ali release list --limit 20
ali release promote --target prod
ali release promote <versionId> --target prod
ali release rollback <versionId> --target prod
ali release prune --keep 10
ali release prune --keep 10 --apply
```

环境变量：

```bash
ali env list --target preview
ali env set KEY VALUE
ali env rm KEY
ali env pull --target preview
```

函数调试：

```bash
ali fn info [name] --target preview
ali fn invoke [name] --target preview --payload '{"ping":"pong"}'
ali fn rm [name]
```

日志：

```bash
ali logs
```

## OSS 与 DNS 命令

```bash
ali oss list
ali oss info <bucket>
ali oss ls <bucket> [prefix]
```

```bash
ali dns records list your-domain.xyz
ali dns records add your-domain.xyz --rr preview --type CNAME --value target.example.com
ali dns records rm <recordId>
```

## CI 非交互示例

```bash
export ALI_ACCOUNT_ID=xxxxxxxxxxxx
export ALI_ACCESS_KEY_ID=xxxxxxxxxxxx
export ALI_ACCESS_KEY_SECRET=xxxxxxxxxxxx
export ALI_REGION=cn-hangzhou
export ALI_BIN=./scripts/ali-tsx.sh

cd /path/to/your-app

"$ALI_BIN" login \
  --account-id "$ALI_ACCOUNT_ID" \
  --ak "$ALI_ACCESS_KEY_ID" \
  --sk "$ALI_ACCESS_KEY_SECRET" \
  --region "$ALI_REGION"

"$ALI_BIN" deploy \
  --type api \
  --entry src/index.ts \
  --runtime nodejs22 \
  --target preview \
  --domain-suffix your-domain.xyz \
  --ssl
```

## 测试与验证

本地质量检查：

```bash
bun run typecheck
bun run test
bun run build
```

E2E 冒烟（脚本）：

```bash
cd aero-cli
ALI_BIN=./scripts/ali-tsx.sh ./scripts/smoke.sh \
  --target preview \
  --expect-key TEST_FLAG \
  --expect-value from-cloud \
  --domain hello.preview.your-domain.xyz \
  --with-ssl
```

## 常用环境变量

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `ALI_ACCOUNT_ID` | 非交互登录 Account ID | - |
| `ALI_ACCESS_KEY_ID` | 非交互登录 AK | - |
| `ALI_ACCESS_KEY_SECRET` | 非交互登录 SK | - |
| `ALI_REGION` | 默认地域 | `cn-hangzhou` |
| `ALI_DOMAIN_SUFFIX` | 默认固定域名后缀 | - |
| `ALI_FC_RUNTIME` | 默认运行时 | `nodejs20` |
| `ALI_FC_CONNECT_TIMEOUT_MS` | FC OpenAPI 连接超时（毫秒） | `60000` |
| `ALI_FC_READ_TIMEOUT_MS` | FC OpenAPI 读超时（毫秒） | `600000` |
| `ALI_SSL_RENEW_BEFORE_DAYS` | 证书自动续签阈值（天） | `30` |
| `ALI_SSL_DNS_READY_TIMEOUT_MS` | DNS TXT 生效等待超时 | `180000` |
| `ALI_SSL_SKIP_CHALLENGE_VERIFY` | 设为 `0` 时启用本地 challenge verify | `1`（默认跳过） |
| `ALI_RUNTIME_CACHE_DIR` | 覆盖 Node22/Python3.13 自定义运行时缓存根目录 | `~/.ali-cli/runtimes` |
| `ALI_PYTHON_REQUIREMENTS` | 指定 Python 依赖文件路径（默认自动探测 requirements*.txt） | - |
| `ALI_PYTHON_PIP` | 指定执行 pip 的 Python 解释器（实际调用 `<this> -m pip`） | `python3` |
| `ALI_PYTHON_ALLOW_SOURCE` | 设为 `1` 允许 wheel 下载失败后本机源码安装依赖 | `0` |
| `ALI_PYTHON_SKIP_VENDOR` | 设为 `1` 跳过 Python 依赖自动打包 | `0` |
| `ALI_NODE22_SHASUMS_URL` | Node22 SHASUMS 覆盖地址 | Node 官方 + 备用镜像 |
| `ALI_PYTHON313_RELEASE_API_URL` | 覆盖 python3.13 运行时 release API 地址 | `https://api.github.com/repos/indygreg/python-build-standalone/releases/latest` |
| `ALI_PYTHON313_TARBALL_URL` | 直接指定 python3.13 运行时包下载地址 | - |
| `ALI_PYTHON313_SHA256` | 与 `ALI_PYTHON313_TARBALL_URL` 配套的 SHA256 校验值 | - |

## 常见问题

`zsh: command not found: ali`

- 你当前没装全局命令。直接用 `./scripts/ali-tsx.sh` 或 `./ali` 执行。

`ali login` 应该在哪执行？

- 任何目录都能登录（写入 `~/.ali-cli/auth.json`），但建议在业务项目目录执行后立即 `deploy`，这样会同步生成该项目的 `.ali/project.json`。

每次部署会自动签发/续签证书吗？

- 只有在传 `--ssl` 的部署/域名命令中才会检查证书并按阈值续签。不会后台定时自动续签。

Node 运行时只支持 20 吗？

- 当前 CLI 支持 `nodejs20`、`nodejs22`、`python3.12`、`python3.13`。其中 `nodejs22` 与 `python3.13` 使用 `custom.debian12` 自定义运行时模式。

`--help` 看不到 `fn list`/`db list` 等命令？

- 通常是 `./ali` 二进制过期（未重新编译）。
- 重新编译后再看帮助：

```bash
cd aero-cli
bun run build:bin
./ali --help
```
