# Licell CLI (`licell`)

面向阿里云的一体化部署 CLI，目标是把部署体验做成接近 Vercel CLI 的单主线工作流：

- 一个入口命令：`deploy`
- 一套项目配置：`.licell/project.json`
- 一条从开发到发布的路径：`init -> deploy -> release -> rollback`

默认面向中国区生产环境，默认地域 `cn-hangzhou`。

当前项目你是指挥官，全部代码由 Codex（贡献度 60%）、Claude Code（共享度 35%）和 Manus（贡献度 5%）协同完成。

## 你可以先看这 3 行

```bash
curl -fsSL https://github.com/dafang/licell/releases/latest/download/install.sh | bash
licell login --region cn-hangzhou
licell init --runtime nodejs22 && licell deploy --type api --target preview
```

## MCP（让 Agent 驱动 licell）

Licell 内置 MCP（Model Context Protocol）stdio server，方便 Claude Code 等 Agent 直接调用 `licell` 执行部署/发布/查询/清理（默认仍以 `deploy` 为主线）。

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

注意事项：

- MCP 是非交互模式：会触发交互选择/确认的命令，需要显式补齐参数（例如 `deploy --type/--entry/--runtime`）以及删除确认 `--yes`
- `licell_cli`：通用执行任意 `licell` 子命令（返回 stdout/stderr）
- 结构化 tool：`licell_deploy` / `licell_init` / `licell_release_*` / `licell_fn_*` / `licell_domain_*` / `licell_dns_records_*`（减少 Agent 拼 argv 的成本）

## 目录

- [MCP（让 Agent 驱动 licell）](#mcp让-agent-驱动-licell)
- [1. 安装与升级（最快路径）](#1-安装与升级最快路径)
- [2. 第一次部署（5 分钟）](#2-第一次部署5-分钟)
- [3. `init` 模板（与 `examples` 同级）](#3-init-模板与-examples-同级)
- [4. 示例工程（推荐先跑通）](#4-示例工程推荐先跑通)
- [5. 部署模型（API / Static）](#5-部署模型api--static)
- [6. 日常命令速查](#6-日常命令速查)
- [7. 进阶：运行时细节](#7-进阶运行时细节)
- [8. 进阶：固定域名与 HTTPS](#8-进阶固定域名与-https)
- [9. 进阶：数据库与缓存](#9-进阶数据库与缓存)
- [10. 进阶：发布、回滚、清理](#10-进阶发布回滚清理)
- [11. CI/CD（非交互）](#11-cicd非交互)
- [12. 常用环境变量](#12-常用环境变量)
- [13. 开发者与维护者](#13-开发者与维护者)
- [14. 常见问题](#14-常见问题)

## 1. 安装与升级（最快路径）

一键安装（默认安装到 `~/.local/bin/licell`）：

```bash
curl -fsSL https://github.com/dafang/licell/releases/latest/download/install.sh | bash
```

如果 shell 还没包含 `~/.local/bin`：

```bash
export PATH="$HOME/.local/bin:$PATH"
licell --version
```

升级：

```bash
licell upgrade
# 或指定版本
licell upgrade --version v0.9.21
```

安装逻辑说明：

- 安装脚本和二进制都来自同一个 `releases/latest`
- 优先下载预构建单文件可执行（无需本机 Node/npm/pnpm）
- 若当前平台暂无预构建资产，自动回退源码安装

开发调试可用（不建议生产）：

```bash
curl -fsSL https://raw.githubusercontent.com/dafang/licell/main/install.sh | bash
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

- `--bootstrap-ram` 会用你提供的高权限 AK/SK 自动创建 licell 专用 RAM 用户、策略和 AccessKey
- 本地只保存新创建的 licell 专用 key，不保存输入的高权限 key
- bootstrap 成功后即完成登录，不需要再执行一次 `licell login`
- 高权限（超级）AK/SK 可在 `https://ram.console.aliyun.com/profile/access-keys` 获取
- Docker 部署遇到 ACR 个人版未注册场景时，licell 会自动为当前 RAM 用户初始化 ACR 用户信息再继续部署
- 如需自定义命名：`--bootstrap-user <name>` `--bootstrap-policy <name>`

### 2.3 部署 API（FC）

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

| runtime | 模板 | 主要内容 |
| --- | --- | --- |
| `nodejs20` / `nodejs22` | Express | `/healthz` `/meta` `/todos` `/math/sum` + FC handler 适配 |
| `python3.12` / `python3.13` | Flask | 同等 API + FC handler 适配 |
| `docker` | Bun + Hono | 同等 API + Dockerfile |

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

- API 部署默认启用 VPC（会自动创建/复用 `licell-vpc` 与 `licell-vsw` 并写入 `.licell/project.json`）
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

说明：`static` 模式下只要提供 `--domain` 或 `--domain-suffix`，会自动接入 CDN，并回源到 OSS 地址，同时默认启用 HTTPS 证书签发与 CDN 证书配置。

`--dist` 省略时自动探测：

- 当前目录有 `index.html` -> 用当前目录 `.`
- 否则按常见目录探测：`dist` `build` `out` `public` `www` `site` `.output/public`
- 未命中时回退 `dist`

### 5.3 在哪个目录执行命令

`licell` 的项目状态基于当前目录：

- 项目配置：`<project>/.licell/project.json`
- 全局认证：`~/.licell-cli/auth.json`

## 6. 日常命令速查

认证与环境：

```bash
licell login
licell whoami
licell switch --region cn-shanghai
licell logout
```

固定 E2E 套件（发布前建议）：

```bash
# 执行 smoke 套件（默认）
licell e2e run

# 执行 full 套件（包含 static + oss upload）
licell e2e run --suite full

# e2e 默认使用公网模式（便于完全清理）；需要验证 VPC 时显式开启
licell e2e run --enable-vpc

# 指定 runtime + 域名后缀 + CDN，执行后自动清理
licell e2e run --runtime nodejs22 --domain-suffix your-domain.xyz --enable-cdn --cleanup

# full 套件复用已有数据资源做 connect/info 校验（不新建 DB/Cache）
licell e2e run --suite full --db-instance rm-xxx --cache-instance r-xxx

# 查看历史 run
licell e2e list

# 按 runId 清理
licell e2e cleanup <runId>
```

Shell 补全（bash / zsh）：

```bash
mkdir -p ~/.local/share/licell/completions

# 生成 bash 补全脚本
licell completion bash > ~/.local/share/licell/completions/licell.bash
echo '[[ -f "$HOME/.local/share/licell/completions/licell.bash" ]] && source "$HOME/.local/share/licell/completions/licell.bash"' >> ~/.bashrc

# 生成 zsh 补全脚本
licell completion zsh > ~/.local/share/licell/completions/_licell
echo '[[ -f "$HOME/.local/share/licell/completions/_licell" ]] && source "$HOME/.local/share/licell/completions/_licell"' >> ~/.zshrc
```

函数与调试：

```bash
licell fn list
licell fn info [name] --target preview
licell fn invoke [name] --target preview --payload '{"ping":"pong"}'
licell fn rm [name]
licell fn rm [name] --force
```

环境变量：

```bash
licell env list --target preview
licell env set KEY VALUE
licell env rm KEY
licell env pull --target preview
```

域名与 DNS：

```bash
licell domain add api.your-domain.xyz --target preview --ssl
licell domain rm api.your-domain.xyz
licell dns records list your-domain.xyz
licell dns records add your-domain.xyz --rr preview --type CNAME --value target.example.com
licell dns records rm <recordId>
```

发布：

```bash
licell release list --limit 20
licell release promote --target prod
licell release rollback <versionId> --target prod
licell release prune --keep 10
licell release prune --keep 10 --apply
```

日志与对象存储：

```bash
licell logs
licell oss list
licell oss info <bucket>
licell oss ls <bucket> [prefix]
licell oss upload <bucket> --source-dir dist --target-dir mysite
licell oss bucket --bucket <bucket> --source-dir dist --target-dir mysite
```

说明：`oss upload` 与 `oss bucket` 等价；`--target-dir` 不传时上传到 Bucket 根目录。

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
- 自动下载并缓存 Python3.13 Linux x64 运行时到：`~/.licell-cli/runtimes/python313`
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
- API 部署：使用 `--domain` 或 `--enable-cdn` 时默认自动开启 HTTPS（`--domain-suffix` 需配合 `--ssl` 或 `--enable-cdn`）
- Static 部署：提供 `--domain` 或 `--domain-suffix` 时，默认自动开启 HTTPS，并自动接入 CDN 回源 OSS
- `--enable-cdn` 在 API 场景下表示显式开启；Static 提供域名时默认开启
- 默认续签阈值 30 天
- 域名需托管在阿里云 DNS

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

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `LICELL_ACCOUNT_ID` | 非交互登录 Account ID | - |
| `LICELL_ACCESS_KEY_ID` | 非交互登录 AK | - |
| `LICELL_ACCESS_KEY_SECRET` | 非交互登录 SK | - |
| `LICELL_REGION` | 默认地域 | `cn-hangzhou` |
| `LICELL_DOMAIN_SUFFIX` | 默认固定域名后缀 | - |
| `LICELL_FC_RUNTIME` | 默认 FC runtime | `nodejs20` |
| `LICELL_BINARY_URL` | 安装脚本指定二进制地址 | latest release 资产 |
| `LICELL_ARCHIVE_URL` | 安装脚本源码回退地址 | repo main tarball |
| `LICELL_GITHUB_TOKEN` | 安装脚本访问私有源 token | - |
| `LICELL_FC_CONNECT_TIMEOUT_MS` | FC API 连接超时 | `60000` |
| `LICELL_FC_READ_TIMEOUT_MS` | FC API 读超时 | `600000` |
| `LICELL_SSL_RENEW_BEFORE_DAYS` | SSL 续签阈值天数 | `30` |
| `LICELL_SSL_DNS_READY_TIMEOUT_MS` | DNS TXT 生效等待超时 | `180000` |
| `LICELL_SSL_SKIP_CHALLENGE_VERIFY` | 设为 `0` 启用本地 challenge verify | `1` |
| `LICELL_RUNTIME_CACHE_DIR` | 自定义运行时缓存目录 | `~/.licell-cli/runtimes` |
| `LICELL_PYTHON_REQUIREMENTS` | 指定 Python 依赖文件 | 自动探测 |
| `LICELL_PYTHON_PIP` | 指定 pip 对应解释器 | `python3` |
| `LICELL_PYTHON_ALLOW_SOURCE` | wheel 失败后允许源码安装 | `0` |
| `LICELL_PYTHON_SKIP_VENDOR` | 跳过 Python 依赖自动打包 | `0` |
| `LICELL_NODE22_SHASUMS_URL` | Node22 SHASUMS 覆盖地址 | 官方+镜像 |
| `LICELL_PYTHON313_RELEASE_API_URL` | Python3.13 runtime release API 覆盖地址 | 官方地址 |
| `LICELL_PYTHON313_TARBALL_URL` | Python3.13 runtime 包地址 | - |
| `LICELL_PYTHON313_SHA256` | Python3.13 runtime 包校验 | - |

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
- 兼容新链路：优先 `node --build-sea`，低版本 Node 自动回退 `--experimental-sea-config + postject`
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
- 确认 `~/.local/bin` 在 `PATH`

`licell login` 在哪执行？

- 任意目录都可以（写入 `~/.licell-cli/auth.json`）
- 但建议在业务目录执行后直接 `deploy`

不熟悉 RAM 权限怎么配？

- 可以直接使用 `licell login --bootstrap-ram`
- licell 会自动创建专用 RAM 用户和策略，并切换到新 key
- 需要你提供一次可创建 RAM 资源的高权限 AK/SK（获取地址：`https://ram.console.aliyun.com/profile/access-keys`）
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
