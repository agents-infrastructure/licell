# Licell Examples

这里提供 3 个“同一套 API 能力、不同 runtime/框架实现”的完整示例，便于对比与部署验证：

1. `node22-express-api`：`nodejs22` + Express
2. `python313-flask-api`：`python3.13` + Flask
3. `docker-bun-hono-api`：`docker` + Bun + Hono

每个示例都包含：

- `GET /healthz`
- `GET /meta`
- `GET /echo?message=...`
- `GET /todos`
- `POST /todos`
- `PATCH /todos/:id/toggle`（Python 路径为 `/todos/<id>/toggle`）
- `POST /math/sum`

快速开始（任选其一）：

```bash
cd examples/node22-express-api
# 或
cd examples/python313-flask-api
# 或
cd examples/docker-bun-hono-api

licell login
licell deploy --type api --target preview
```

提示：

- Node 示例建议显式指定：`--runtime nodejs22 --entry src/index.ts`
- Python 示例建议显式指定：`--runtime python3.13 --entry src/main.py`
- Docker 示例建议显式指定：`--runtime docker`
