# Node.js 22 + Express API Example

这个示例演示如何在 `nodejs22` runtime 下，用 Express 实现一套完整 API 并通过 `licell` 部署。

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
cd examples/node22-express-api
bun install
bun run dev
```

## 部署（Licell）

```bash
cd examples/node22-express-api
licell login
licell deploy --type api --runtime nodejs22 --entry src/index.ts --target preview
```

如果你已在 `.licell/project.json` 固定 runtime，也可以简化为：

```bash
licell deploy --type api --entry src/index.ts --target preview
```
