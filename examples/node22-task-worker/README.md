# Node.js 22 Task Worker Example

这个示例演示如何在 `nodejs22` runtime 下，编写一个 FC 异步任务函数并通过 `licell` 部署与触发。

## Handler 契约

- 入口文件：`src/task.ts`
- 导出：`handler(event)`
- 输入：任意 JSON；建议传对象 payload
- 输出：任意可 JSON 序列化对象

## 支持的 payload

- `job`：任务名
- `mode`：`ok` 或 `sleep`
- `sleepMs`：当 `mode=sleep` 时模拟长任务
- `attempt`：业务侧重试/序号
- `metadata`：附加对象

示例 payload：

```json
{
  "job": "thumbnail:demo.png",
  "mode": "ok",
  "attempt": 1,
  "metadata": {
    "source": "examples/node22-task-worker"
  }
}
```

## 本地参考

```bash
cd examples/node22-task-worker
bun x tsx -e "import('./src/task.ts').then(m => m.handler({ job: 'demo', mode: 'ok' }).then(console.log))"
```

## 部署（Licell）

```bash
cd examples/node22-task-worker
licell login
licell init --runtime nodejs22 --kind task --app node22-task-worker --yes
licell deploy --type task --runtime nodejs22 --entry src/task.ts --target preview
```

如果你已经在 `.licell/project.json` 固定了 runtime / deployType，也可以简化为：

```bash
licell deploy --type task --entry src/task.ts --target preview
```

## 触发任务

```bash
licell task invoke node22-task-worker --target preview --payload '{"job":"demo","mode":"ok"}'
licell task invoke node22-task-worker --target preview --payload '{"job":"slow-demo","mode":"sleep","sleepMs":5000}'
```

## 跟踪任务

```bash
licell task list node22-task-worker --target preview --output json
licell task info <taskId> node22-task-worker --target preview --output json
licell task stop <taskId> node22-task-worker --target preview --output json
```
