# Docker + Bun + Hono API Example

这个示例演示如何在 `docker` runtime 下，使用 Bun + Hono 构建容器化 API 并通过 `licell` 部署。

## 功能

- `GET /healthz` 健康检查
- `GET /meta` 运行时信息
- `GET /echo?message=...` 回显请求
- `GET /todos` 列表（支持 `?done=true|false`）
- `POST /todos` 新增 Todo
- `PATCH /todos/:id/toggle` 切换状态
- `POST /math/sum` 计算数组求和/平均值

## 本地运行

```bash
cd examples/docker-bun-hono-api
bun install
bun run dev
```

## 部署（Licell）

```bash
cd examples/docker-bun-hono-api
licell login
licell deploy --type api --runtime docker --target preview
```

如果你已经在 `.licell/project.json` 固定 runtime，也可以简化为：

```bash
licell deploy --type api --target preview
```
