# Licell Examples

这 3 个示例共享同一套 API 能力，但使用不同 runtime / 框架实现，方便你横向比较和验证部署：

1. `node22-express-api`：`nodejs22` + Express
2. `python313-flask-api`：`python3.13` + Flask
3. `docker-bun-hono-api`：`docker` + Bun + Hono

## 统一 API 能力

三个示例都包含：

- `GET /healthz`
- `GET /meta`
- `GET /echo?message=...`
- `GET /todos`
- `POST /todos`
- `PATCH /todos/:id/toggle`（Python 为 `/todos/<id>/toggle`）
- `POST /math/sum`

## 快速开始

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

## 进阶验证（可选）

绑定固定域名并探测接口：

```bash
licell deploy --type api --target preview --domain-suffix your-domain.xyz
curl "http://<appName>.your-domain.xyz/healthz"
curl -X POST "http://<appName>.your-domain.xyz/math/sum" \
  -H 'content-type: application/json' \
  -d '{"numbers":[1,2,3]}'
```
