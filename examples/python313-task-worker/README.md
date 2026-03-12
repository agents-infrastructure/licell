# Python 3.13 Task Worker Example

这个示例演示如何在 `python3.13` runtime 下，编写一个 FC 异步任务函数并通过 `licell` 部署与触发。

## Handler 契约

- 入口文件：`src/task.py`
- 导出：`handler(event, context)`
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
    "source": "examples/python313-task-worker"
  }
}
```

## 本地参考

```bash
cd examples/python313-task-worker
python3 - <<'PY'
from src.task import handler
print(handler({"job": "demo", "mode": "ok"}, None))
PY
```

## 部署（Licell）

```bash
cd examples/python313-task-worker
licell login
licell init --runtime python3.13 --kind task --app python313-task-worker --yes
licell deploy --type task --runtime python3.13 --entry src/task.py --target preview
```

如果你已经在 `.licell/project.json` 固定了 runtime / deployType，也可以简化为：

```bash
licell deploy --type task --entry src/task.py --target preview
```

## 触发任务

```bash
licell task invoke python313-task-worker --target preview --payload '{"job":"demo","mode":"ok"}'
licell task invoke python313-task-worker --target preview --payload '{"job":"slow-demo","mode":"sleep","sleepMs":5000}'
```

## 跟踪任务

```bash
licell task list python313-task-worker --target preview --output json
licell task info <taskId> python313-task-worker --target preview --output json
licell task stop <taskId> python313-task-worker --target preview --output json
```
