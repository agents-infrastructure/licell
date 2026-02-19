# Licell Examples

这 4 个示例分为 3 个 API 示例 + 1 个静态站示例，方便你横向比较和验证部署：

1. `node22-express-api`：`nodejs22` + Express
2. `python313-flask-api`：`python3.13` + Flask
3. `docker-bun-hono-api`：`docker` + Bun + Hono
4. `static-oss-site`：`static`（直推 OSS 托管）

## 统一 API 能力（仅 API 示例）

三个示例都包含：

- `GET /healthz`
- `GET /meta`
- `GET /echo?message=...`
- `GET /todos`
- `POST /todos`
- `PATCH /todos/:id/toggle`（Python 为 `/todos/<id>/toggle`）
- `POST /math/sum`

## 快速开始（API 示例）

任选一个目录：

```bash
cd examples/node22-express-api
# 或
cd examples/python313-flask-api
# 或
cd examples/docker-bun-hono-api
```

登录并部署：

```bash
licell login
licell deploy --type api --target preview
```

建议按示例显式声明 runtime 与入口：

- Node22：`licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview`
- Python3.13：`licell deploy --type api --runtime python3.13 --entry src/main.py --target preview`
- Docker：`licell deploy --type api --runtime docker --target preview`

## 快速开始（静态站）

```bash
cd examples/static-oss-site
licell login
licell deploy --type static

# 绑定固定域名（自动 CDN + 默认 HTTPS）
licell deploy --type static --domain-suffix your-domain.xyz

# 或完整域名
licell deploy --type static --domain static.your-domain.xyz
```

## 进阶验证（API 可选）

绑定固定域名并探测接口：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz
curl "http://<appName>.your-domain.xyz/healthz"
curl -X POST "http://<appName>.your-domain.xyz/math/sum" \
  -H 'content-type: application/json' \
  -d '{"numbers":[1,2,3]}'
```

如需接入 CDN 加速，可追加：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz --enable-cdn
```

说明：使用 `--enable-cdn` 时，`deploy` 会默认自动开启 HTTPS（CDN 边缘证书需在 CDN 控制台配置）。

如果你希望直接指定完整域名，也可以：

```bash
licell deploy --type api --target preview --domain api.your-domain.xyz
curl "https://api.your-domain.xyz/healthz"
```

说明：使用 `--domain` 时，`deploy` 会默认自动开启 HTTPS。
